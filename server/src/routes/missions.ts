import { Router, type Response } from "express";
import {
  completeMission,
  createMission,
  deleteMission,
  getMissions,
  MissionValidationError,
  reopenMission,
  updateMission,
} from "../services/missionsService.js";
import { logger } from "../lib/logger.js";

export const missionsRouter = Router();

const TITLE_MAX = 200;

/** A local calendar day, "YYYY-MM-DD", that actually exists. */
function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Validates the editable fields. Each one may be absent (left as it is);
 * `dueDate` and `categoryId` may also be `null`, which clears them. Returns the
 * clean values, or an error message for a 400.
 */
function parseFields(
  body: Record<string, unknown>,
): { title?: string; dueDate?: string | null; categoryId?: number | null } | string {
  const out: { title?: string; dueDate?: string | null; categoryId?: number | null } =
    {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") return "title debe ser un texto";
    const title = body.title.trim();
    if (title === "") return "La misión necesita un título";
    if (title.length > TITLE_MAX) {
      return `El título no puede pasar de ${TITLE_MAX} caracteres`;
    }
    out.title = title;
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate !== null && !isDay(body.dueDate)) {
      return "dueDate debe ser un día con formato AAAA-MM-DD, o null";
    }
    out.dueDate = body.dueDate;
  }

  if (body.categoryId !== undefined) {
    if (body.categoryId !== null && !Number.isInteger(body.categoryId)) {
      return "categoryId debe ser un número entero, o null";
    }
    out.categoryId = body.categoryId as number | null;
  }

  return out;
}

function parseId(raw: string, res: Response): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return null;
  }
  return id;
}

/** A broken business rule is a 400; anything else, a logged 500. */
function fail(res: Response, error: unknown, what: string, message: string) {
  if (error instanceof MissionValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }
  logger.error({ err: error }, what);
  res.status(500).json({ message });
}

missionsRouter.get("/missions", async (_req, res) => {
  try {
    res.json(await getMissions());
  } catch (error) {
    fail(res, error, "Failed to list missions", "Error al listar las misiones");
  }
});

missionsRouter.post("/missions", async (req, res) => {
  const body = req.body ?? {};
  if (body.title === undefined) {
    res.status(400).json({ message: "La misión necesita un título" });
    return;
  }

  const fields = parseFields(body);
  if (typeof fields === "string") {
    res.status(400).json({ message: fields });
    return;
  }

  try {
    const mission = await createMission({
      title: fields.title!,
      dueDate: fields.dueDate ?? null,
      categoryId: fields.categoryId ?? null,
    });
    res.status(201).json(mission);
  } catch (error) {
    fail(res, error, "Failed to create the mission", "Error al crear la misión");
  }
});

missionsRouter.patch("/missions/:id", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  const fields = parseFields(req.body ?? {});
  if (typeof fields === "string") {
    res.status(400).json({ message: fields });
    return;
  }

  try {
    res.json(await updateMission(id, fields));
  } catch (error) {
    fail(res, error, "Failed to update the mission", "Error al editar la misión");
  }
});

missionsRouter.post("/missions/:id/complete", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    res.json(await completeMission(id));
  } catch (error) {
    fail(res, error, "Failed to complete the mission", "Error al cumplir la misión");
  }
});

missionsRouter.post("/missions/:id/reopen", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    res.json(await reopenMission(id));
  } catch (error) {
    fail(res, error, "Failed to reopen the mission", "Error al desmarcar la misión");
  }
});

missionsRouter.delete("/missions/:id", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    await deleteMission(id);
    // A body rather than a 204: the client reads every response as JSON.
    res.json({ id });
  } catch (error) {
    fail(res, error, "Failed to delete the mission", "Error al borrar la misión");
  }
});
