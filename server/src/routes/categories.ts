import { Router } from "express";
import {
  getCategoriesWithProgress,
  getCategoryWithProgress,
} from "../services/categoriesService.js";
import { logger } from "../lib/logger.js";

export const categoriesRouter = Router();

categoriesRouter.get("/categories", async (req, res) => {
  try {
    const categories = await getCategoriesWithProgress();
    res.json(categories);
  } catch (error) {
    logger.error({ err: error }, "Failed to list categories");
    res.status(500).json({ message: "Error al listar categorías" });
  }
});

categoriesRouter.get("/categories/:id", async (req, res) => {
  // Unvalidated, a non-numeric ":id" would reach the query as NaN.
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "El id debe ser un número entero" });
    return;
  }

  try {
    const category = await getCategoryWithProgress(id);
    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }
    res.json(category);
  } catch (error) {
    logger.error({ err: error, id }, "Failed to fetch the category");
    res.status(500).json({ message: "Error al obtener la categoría" });
  }
});
