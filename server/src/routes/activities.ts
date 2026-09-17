import { Router } from "express";
import {
  getActivitiesByCategory,
  getRecentActivities,
} from "../repositories/activitiesRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import {
  registerActivity,
  deleteActivity,
  ActivityValidationError,
} from "../services/activitiesService.js";
import { INTENSITIES, isIntensity } from "../lib/intensity.js";
import { logger } from "../lib/logger.js";

export const activitiesRouter = Router();

activitiesRouter.post("/activities", async (req, res) => {
  const { categoryId, focusId, description, intensity, date } = req.body ?? {};

  if (!Number.isInteger(categoryId)) {
    res
      .status(400)
      .json({ message: "categoryId es obligatorio y debe ser un número entero" });
    return;
  }

  // The description is optional: what counts is that the activity happened,
  // and at what intensity. Absent or empty, it is stored as an empty string.
  if (description !== undefined && typeof description !== "string") {
    res.status(400).json({ message: "description debe ser un texto" });
    return;
  }

  if (!isIntensity(intensity)) {
    res.status(400).json({
      message: `intensity es obligatoria y debe ser una de: ${INTENSITIES.join(", ")}`,
    });
    return;
  }

  if (focusId !== undefined && !Number.isInteger(focusId)) {
    res
      .status(400)
      .json({ message: "focusId, si se envía, debe ser un número entero" });
    return;
  }

  // With no date, "now" is assumed: logging is retroactive, but the normal
  // case is jotting down something you just did.
  const when = date === undefined ? new Date() : new Date(date);
  if (Number.isNaN(when.getTime())) {
    res
      .status(400)
      .json({ message: "date, si se envía, debe ser una fecha válida" });
    return;
  }

  try {
    const result = await registerActivity({
      categoryId,
      focusId,
      description: description?.trim() ?? "",
      intensity,
      date: when,
    });
    res.status(201).json(result);
  } catch (error) {
    // A broken business rule → 400, not 500.
    if (error instanceof ActivityValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error }, "Failed to log the activity");
    res.status(500).json({ message: "Error al registrar la actividad" });
  }
});

activitiesRouter.delete("/activities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return;
  }

  try {
    res.json(await deleteActivity(id));
  } catch (error) {
    if (error instanceof ActivityValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error, id }, "Failed to undo the activity");
    res.status(500).json({ message: "Error al deshacer la actividad" });
  }
});

/**
 * Activities across all categories, for the streak, today's summary and the
 * rhythm strip on the home (docs/DESIGN.md). `since` and `limit` are the only
 * two filters: a personal app does not need real pagination.
 */
activitiesRouter.get("/activities", async (req, res) => {
  let since: Date | undefined;
  if (typeof req.query.since === "string") {
    since = new Date(req.query.since);
    if (Number.isNaN(since.getTime())) {
      res
        .status(400)
        .json({ message: "since, si se envía, debe ser una fecha válida" });
      return;
    }
  }

  let limit: number | undefined;
  if (typeof req.query.limit === "string") {
    limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit <= 0) {
      res
        .status(400)
        .json({ message: "limit, si se envía, debe ser un entero positivo" });
      return;
    }
  }

  try {
    res.json(await getRecentActivities({ since, limit }));
  } catch (error) {
    logger.error({ err: error }, "Failed to list recent activities");
    res.status(500).json({ message: "Error al listar actividades recientes" });
  }
});

activitiesRouter.get("/categories/:categoryId/activities", async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  if (!Number.isInteger(categoryId)) {
    res.status(400).json({ message: "El categoryId debe ser un número entero" });
    return;
  }

  try {
    const category = await getCategoryById(categoryId);
    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    res.json(await getActivitiesByCategory(categoryId));
  } catch (error) {
    logger.error({ err: error, categoryId }, "Failed to list activities");
    res.status(500).json({ message: "Error al listar actividades" });
  }
});
