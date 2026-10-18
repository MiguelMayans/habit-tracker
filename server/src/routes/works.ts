import { Router, type Response } from "express";
import {
  createWork,
  deleteWork,
  getWorks,
  logSession,
  updateWork,
  WorkValidationError,
  type EditableWork,
} from "../services/worksService.js";
import { WORK_KINDS, WORK_STATUSES } from "../repositories/worksRepository.js";
import { INTENSITIES, isIntensity } from "../lib/intensity.js";
import { logger } from "../lib/logger.js";

export const worksRouter = Router();

const TITLE_MAX = 200;
const PROGRESS_MAX = 80;

/**
 * Validates the editable fields. Each one may be absent (left as it is);
 * `progress` and `rating` may also be `null`, which clears them. Returns the
 * clean values, or an error message for a 400.
 */
function parseFields(body: Record<string, unknown>): EditableWork | string {
  const out: EditableWork = {};

  if (body.kind !== undefined) {
    if (!WORK_KINDS.includes(body.kind as never)) {
      return `kind debe ser uno de: ${WORK_KINDS.join(", ")}`;
    }
    out.kind = body.kind as EditableWork["kind"];
  }

  if (body.status !== undefined) {
    if (!WORK_STATUSES.includes(body.status as never)) {
      return `status debe ser uno de: ${WORK_STATUSES.join(", ")}`;
    }
    out.status = body.status as EditableWork["status"];
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string") return "title debe ser un texto";
    const title = body.title.trim();
    if (title === "") return "La obra necesita un título";
    if (title.length > TITLE_MAX) {
      return `El título no puede pasar de ${TITLE_MAX} caracteres`;
    }
    out.title = title;
  }

  if (body.progress !== undefined) {
    if (body.progress !== null && typeof body.progress !== "string") {
      return "progress debe ser un texto, o null";
    }
    const progress = body.progress?.trim() ?? "";
    if (progress.length > PROGRESS_MAX) {
      return `El progreso no puede pasar de ${PROGRESS_MAX} caracteres`;
    }
    // Empty means "no progress noted", the same as null.
    out.progress = progress === "" ? null : progress;
  }

  if (body.rating !== undefined) {
    const r = body.rating;
    if (r !== null && !(Number.isInteger(r) && (r as number) >= 1 && (r as number) <= 5)) {
      return "rating debe ser un entero de 1 a 5, o null";
    }
    out.rating = r as number | null;
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
  if (error instanceof WorkValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }
  logger.error({ err: error }, what);
  res.status(500).json({ message });
}

worksRouter.get("/works", async (_req, res) => {
  try {
    res.json(await getWorks());
  } catch (error) {
    fail(res, error, "Failed to list works", "Error al listar la guarida");
  }
});

worksRouter.post("/works", async (req, res) => {
  const fields = parseFields(req.body ?? {});
  if (typeof fields === "string") {
    res.status(400).json({ message: fields });
    return;
  }
  if (!fields.title || !fields.kind) {
    res.status(400).json({ message: "La obra necesita título y tipo" });
    return;
  }

  try {
    const work = await createWork({
      ...fields,
      kind: fields.kind,
      title: fields.title,
      // Adding something is, most of the time, adding what you have going.
      status: fields.status ?? "active",
    });
    res.status(201).json(work);
  } catch (error) {
    fail(res, error, "Failed to create the work", "Error al añadir la obra");
  }
});

worksRouter.patch("/works/:id", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  const fields = parseFields(req.body ?? {});
  if (typeof fields === "string") {
    res.status(400).json({ message: fields });
    return;
  }

  try {
    res.json(await updateWork(id, fields));
  } catch (error) {
    fail(res, error, "Failed to update the work", "Error al editar la obra");
  }
});

worksRouter.post("/works/:id/session", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  const { intensity } = req.body ?? {};
  if (!isIntensity(intensity)) {
    res.status(400).json({
      message: `intensity es obligatoria y debe ser una de: ${INTENSITIES.join(", ")}`,
    });
    return;
  }

  try {
    res.status(201).json(await logSession(id, intensity));
  } catch (error) {
    fail(res, error, "Failed to log the session", "Error al registrar la sesión");
  }
});

worksRouter.delete("/works/:id", async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    await deleteWork(id);
    // A body rather than a 204: the client reads every response as JSON.
    res.json({ id });
  } catch (error) {
    fail(res, error, "Failed to delete the work", "Error al borrar la obra");
  }
});
