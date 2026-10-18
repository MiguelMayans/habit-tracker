import { db } from "../db/index.js";
import * as worksRepository from "../repositories/worksRepository.js";
import type {
  Work,
  WorkKind,
  WorkStatus,
  WorkValues,
} from "../repositories/worksRepository.js";
import { getCategoryBySlug } from "../repositories/categoriesRepository.js";
import {
  registerActivityIn,
  type RegisterActivityResult,
} from "./activitiesService.js";
import type { Intensity } from "../lib/intensity.js";

/**
 * Where a session's XP goes. Mente is conscious leisure (docs/DESIGN.md);
 * the slug is a database value and stays in Spanish.
 */
const SESSION_CATEGORY_SLUG = "mente";

/**
 * A business rule broken by the incoming data. The route turns it into a 400:
 * it is the client's fault, not a server failure.
 */
export class WorkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkValidationError";
  }
}

export type EditableWork = {
  kind?: WorkKind;
  title?: string;
  status?: WorkStatus;
  progress?: string | null;
  rating?: number | null;
};

/**
 * The dates follow the status, so the client only ever says what state a work
 * is in: starting it stamps `startedAt` the first time, finishing it stamps
 * `finishedAt`, and taking it back out of the finished shelf clears it.
 */
function datesFor(
  status: WorkStatus | undefined,
  current: Work | null,
): WorkValues {
  if (status === undefined || status === current?.status) return {};

  const now = new Date();
  const values: WorkValues = {};
  if (status === "active" && !current?.startedAt) values.startedAt = now;
  if (status === "done") {
    values.finishedAt = now;
    if (!current?.startedAt) values.startedAt = now;
  } else if (current?.status === "done") {
    values.finishedAt = null;
  }
  return values;
}

export async function getWorks(): Promise<Work[]> {
  return worksRepository.getWorks();
}

export async function createWork(
  data: EditableWork & { kind: WorkKind; title: string; status: WorkStatus },
): Promise<Work> {
  return worksRepository.createWork({ ...data, ...datesFor(data.status, null) });
}

export async function updateWork(
  id: number,
  changes: EditableWork,
): Promise<Work> {
  const work = await worksRepository.getWorkById(id);
  if (!work) throw new WorkValidationError(`La obra ${id} no existe`);

  return worksRepository.updateWork(id, {
    ...changes,
    ...datesFor(changes.status, work),
  });
}

export async function deleteWork(id: number): Promise<void> {
  const work = await worksRepository.getWorkById(id);
  if (!work) throw new WorkValidationError(`La obra ${id} no existe`);
  // Its sessions stay logged in Mente: they happened, and their XP counts.
  await worksRepository.deleteWork(id);
}

export type SessionResult = {
  work: Work;
  activity: RegisterActivityResult;
};

/**
 * "Today I played / read / watched": logs an activity in Mente with the
 * work's title as its description, and stamps the session on the work — in
 * one transaction, so neither lands without the other.
 *
 * Only for a work in play: a queued one has not started, and a finished one
 * is finished. Starting or reopening it is one tap away.
 */
export async function logSession(
  id: number,
  intensity: Intensity,
): Promise<SessionResult> {
  return db.transaction(async (tx) => {
    const work = await worksRepository.getWorkById(id, tx);
    if (!work) throw new WorkValidationError(`La obra ${id} no existe`);
    if (work.status !== "active") {
      throw new WorkValidationError(
        "Solo se registran sesiones de algo que tengas en curso",
      );
    }

    const mente = await getCategoryBySlug(SESSION_CATEGORY_SLUG, tx);
    if (!mente) {
      throw new WorkValidationError("No existe la categoría Mente");
    }

    const now = new Date();
    const activity = await registerActivityIn(tx, {
      categoryId: mente.id,
      description: work.title,
      intensity,
      date: now,
    });
    const updated = await worksRepository.updateWork(
      id,
      { lastSessionAt: now },
      tx,
    );

    return { work: updated, activity };
  });
}
