import { Router } from "express";
import {
  getActivitiesByCategory,
  getActivitiesByFocus,
} from "../repositories/activitiesRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import { getFocusById } from "../repositories/focusesRepository.js";
import {
  registerActivity,
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

  if (typeof description !== "string" || description.trim() === "") {
    res
      .status(400)
      .json({ message: "description es obligatoria y debe ser un texto no vacío" });
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

  // Sin date se asume "ahora": el registro es retroactivo, pero lo normal es
  // apuntar algo recién hecho.
  const fecha = date === undefined ? new Date() : new Date(date);
  if (Number.isNaN(fecha.getTime())) {
    res
      .status(400)
      .json({ message: "date, si se envía, debe ser una fecha válida" });
    return;
  }

  try {
    const resultado = await registerActivity({
      categoryId,
      focusId,
      description: description.trim(),
      intensity,
      date: fecha,
    });
    res.status(201).json(resultado);
  } catch (error) {
    // Regla de negocio incumplida → 400, no 500.
    if (error instanceof ActivityValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error }, "Error al registrar la actividad");
    res.status(500).json({ message: "Error al registrar la actividad" });
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
    logger.error({ err: error, categoryId }, "Error al listar actividades");
    res.status(500).json({ message: "Error al listar actividades" });
  }
});

activitiesRouter.get("/focuses/:focusId/activities", async (req, res) => {
  const focusId = Number(req.params.focusId);
  if (!Number.isInteger(focusId)) {
    res.status(400).json({ message: "El focusId debe ser un número entero" });
    return;
  }

  try {
    const focus = await getFocusById(focusId);
    if (!focus) {
      res.status(404).json({ message: "Foco no encontrado" });
      return;
    }

    res.json(await getActivitiesByFocus(focusId));
  } catch (error) {
    logger.error({ err: error, focusId }, "Error al listar actividades");
    res.status(500).json({ message: "Error al listar actividades" });
  }
});
