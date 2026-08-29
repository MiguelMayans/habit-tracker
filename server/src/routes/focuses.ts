import { Router } from "express";
import {
  getFocusesByCategory,
  getFocusById,
} from "../repositories/focusesRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import {
  createFocus,
  FocusValidationError,
} from "../services/focusesService.js";
import { logger } from "../lib/logger.js";

export const focusesRouter = Router();

focusesRouter.get("/categories/:categoryId/focuses", async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  if (!Number.isInteger(categoryId)) {
    res.status(400).json({ message: "El categoryId debe ser un número entero" });
    return;
  }

  try {
    // 404 si la categoría no existe: una lista vacía no distinguiría entre
    // "categoría sin focos" y "categoría inexistente".
    const category = await getCategoryById(categoryId);
    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    const focuses = await getFocusesByCategory(categoryId);
    res.json(focuses);
  } catch (error) {
    logger.error({ err: error, categoryId }, "Error al listar focos");
    res.status(500).json({ message: "Error al listar focos" });
  }
});

focusesRouter.get("/focuses/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return;
  }

  try {
    const focus = await getFocusById(id);
    if (!focus) {
      res.status(404).json({ message: "Foco no encontrado" });
      return;
    }
    res.json(focus);
  } catch (error) {
    logger.error({ err: error, id }, "Error al obtener el foco");
    res.status(500).json({ message: "Error al obtener el foco" });
  }
});

focusesRouter.post("/focuses", async (req, res) => {
  const { categoryId, name, parentFocusId } = req.body ?? {};

  if (!Number.isInteger(categoryId)) {
    res
      .status(400)
      .json({ message: "categoryId es obligatorio y debe ser un número entero" });
    return;
  }

  if (typeof name !== "string" || name.trim() === "") {
    res
      .status(400)
      .json({ message: "name es obligatorio y debe ser un texto no vacío" });
    return;
  }

  if (parentFocusId !== undefined && !Number.isInteger(parentFocusId)) {
    res
      .status(400)
      .json({ message: "parentFocusId, si se envía, debe ser un número entero" });
    return;
  }

  try {
    const focus = await createFocus({
      categoryId,
      name: name.trim(),
      parentFocusId,
    });
    res.status(201).json(focus);
  } catch (error) {
    // Regla de negocio incumplida → 400, no 500.
    if (error instanceof FocusValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error }, "Error al crear el foco");
    res.status(500).json({ message: "Error al crear el foco" });
  }
});
