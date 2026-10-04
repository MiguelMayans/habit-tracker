import { db } from "../db/index.js";
import * as missionsRepository from "../repositories/missionsRepository.js";
import type { Mission } from "../repositories/missionsRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import { getActivityById } from "../repositories/activitiesRepository.js";
import {
  ActivityValidationError,
  deleteActivityIn,
  registerActivityIn,
  type RegisterActivityResult,
  type UndoActivityResult,
} from "./activitiesService.js";

/** How long a completed mission stays in the list. */
const DONE_VISIBLE_DAYS = 7;

/**
 * A business rule broken by the incoming data. The route turns it into a 400:
 * it is the client's fault, not a server failure.
 */
export class MissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionValidationError";
  }
}

export type CompleteMissionResult = {
  mission: Mission;
  /** The Chispa it logged, or null for a mission with no category. */
  activity: RegisterActivityResult | null;
};

export type ReopenMissionResult = {
  mission: Mission;
  /** The Chispa it undid, or null when there was none left to undo. */
  undo: UndoActivityResult | null;
};

export async function getMissions(): Promise<Mission[]> {
  const since = new Date(Date.now() - DONE_VISIBLE_DAYS * 86_400_000);
  return missionsRepository.getMissions(since);
}

async function assertCategory(categoryId: number | null): Promise<void> {
  // Checked here so a bad id is a 400 with a message, not a foreign key
  // failure surfacing as a 500.
  if (categoryId !== null && !(await getCategoryById(categoryId))) {
    throw new MissionValidationError(`La categoría ${categoryId} no existe`);
  }
}

export async function createMission(
  data: missionsRepository.CreateMissionData,
): Promise<Mission> {
  await assertCategory(data.categoryId);
  return missionsRepository.createMission(data);
}

export async function updateMission(
  id: number,
  changes: { title?: string; dueDate?: string | null; categoryId?: number | null },
): Promise<Mission> {
  const mission = await missionsRepository.getMissionById(id);
  if (!mission) throw new MissionValidationError(`La misión ${id} no existe`);

  // Its XP already went to the category it had: moving it now would leave the
  // XP in one place and the mission saying another.
  if (
    mission.completedAt !== null &&
    changes.categoryId !== undefined &&
    changes.categoryId !== mission.categoryId
  ) {
    throw new MissionValidationError(
      "Una misión cumplida no puede cambiar de categoría: su XP ya está contada. Desmárcala primero.",
    );
  }

  if (changes.categoryId !== undefined) await assertCategory(changes.categoryId);
  return missionsRepository.updateMission(id, changes);
}

/**
 * Marks a mission done. With a category, it logs a Chispa there — the To-Do
 * that becomes an activity, from docs/DESIGN.md — in the same transaction, so
 * the mission and its XP land together or not at all. Errands earn the
 * smallest tier on purpose: presence over productivity.
 */
export async function completeMission(
  id: number,
): Promise<CompleteMissionResult> {
  return db.transaction(async (tx) => {
    const mission = await missionsRepository.getMissionById(id, tx);
    if (!mission) throw new MissionValidationError(`La misión ${id} no existe`);
    if (mission.completedAt !== null) {
      throw new MissionValidationError("Esa misión ya está cumplida");
    }

    const now = new Date();
    let activity: RegisterActivityResult | null = null;
    if (mission.categoryId !== null) {
      activity = await registerActivityIn(tx, {
        categoryId: mission.categoryId,
        description: mission.title,
        intensity: "chispa",
        date: now,
      });
    }

    const updated = await missionsRepository.updateMission(
      id,
      { completedAt: now, activityId: activity?.activity.id ?? null },
      tx,
    );

    return { mission: updated, activity };
  });
}

/**
 * Unticks a mission. If completing it logged a Chispa, that activity is undone
 * with it — the "undo a log from today" exception in docs/DESIGN.md, and bound
 * by the same window: a mission completed on another day keeps its XP and
 * stays ticked.
 *
 * If the activity is already gone (undone from the category's history), there
 * is no XP left to give back and the mission simply reopens.
 */
export async function reopenMission(id: number): Promise<ReopenMissionResult> {
  return db.transaction(async (tx) => {
    const mission = await missionsRepository.getMissionById(id, tx);
    if (!mission) throw new MissionValidationError(`La misión ${id} no existe`);
    if (mission.completedAt === null) {
      throw new MissionValidationError("Esa misión no está cumplida");
    }

    let undo: UndoActivityResult | null = null;
    if (
      mission.activityId !== null &&
      (await getActivityById(mission.activityId, tx))
    ) {
      try {
        undo = await deleteActivityIn(tx, mission.activityId);
      } catch (error) {
        if (error instanceof ActivityValidationError) {
          throw new MissionValidationError(
            "Esta misión se cumplió otro día y su XP ya cuenta: ya no se puede desmarcar.",
          );
        }
        throw error;
      }
    }

    const updated = await missionsRepository.updateMission(
      id,
      { completedAt: null, activityId: null },
      tx,
    );

    return { mission: updated, undo };
  });
}

/**
 * Deletes a mission. If it was completed with a category, its activity stays:
 * it happened, and its XP already counts — the same reasoning as deleting a
 * focus (docs/DESIGN.md).
 */
export async function deleteMission(id: number): Promise<void> {
  const mission = await missionsRepository.getMissionById(id);
  if (!mission) throw new MissionValidationError(`La misión ${id} no existe`);
  await missionsRepository.deleteMission(id);
}
