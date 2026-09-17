import { Router } from "express";
import { getFocusById } from "../repositories/focusesRepository.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import {
  createFocus,
  deleteFocus,
  getFocusesByCategoryWithProgress,
  updateFocus,
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
    // 404 when the category does not exist: an empty list would not tell
    // "category with no focuses" apart from "category that is not there".
    const category = await getCategoryById(categoryId);
    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    res.json(await getFocusesByCategoryWithProgress(categoryId));
  } catch (error) {
    logger.error({ err: error, categoryId }, "Failed to list focuses");
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
    logger.error({ err: error, id }, "Failed to fetch the focus");
    res.status(500).json({ message: "Error al obtener el foco" });
  }
});

focusesRouter.delete("/focuses/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return;
  }

  try {
    res.json(await deleteFocus(id));
  } catch (error) {
    if (error instanceof FocusValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error, id }, "Failed to delete the focus");
    res.status(500).json({ message: "Error al borrar el foco" });
  }
});

focusesRouter.patch("/focuses/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return;
  }

  const { name, frozen } = req.body ?? {};

  if (name === undefined && frozen === undefined) {
    res
      .status(400)
      .json({ message: "Hay que enviar al menos name o frozen" });
    return;
  }

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    res.status(400).json({ message: "name debe ser un texto no vacío" });
    return;
  }

  if (frozen !== undefined && typeof frozen !== "boolean") {
    res.status(400).json({ message: "frozen debe ser true o false" });
    return;
  }

  try {
    res.json(
      await updateFocus(id, {
        ...(name === undefined ? {} : { name: name.trim() }),
        ...(frozen === undefined ? {} : { frozen }),
      }),
    );
  } catch (error) {
    if (error instanceof FocusValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error, id }, "Failed to update the focus");
    res.status(500).json({ message: "Error al actualizar el foco" });
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
    // A broken business rule → 400, not 500.
    if (error instanceof FocusValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    logger.error({ err: error }, "Failed to create the focus");
    res.status(500).json({ message: "Error al crear el foco" });
  }
});
