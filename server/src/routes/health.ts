import { Router } from "express";
import { db } from "../db/index.js";
import { categories } from "../db/schema.js";

export const healthRouter = Router();

healthRouter.get("/health", async (req, res) => {
  try {
    const result = await db.select().from(categories);
    res.json({
      status: "ok",
      database: "connected",
      categoriesCount: result.length,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
