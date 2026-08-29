import type { activities } from "../db/schema.js";

/**
 * Derivado del enum del schema: si allí cambian las intensidades, esto deja de
 * compilar en lugar de desincronizarse en silencio.
 */
export type Intensity = (typeof activities.$inferSelect)["intensity"];

/** Única fuente de verdad de la conversión intensidad → XP. */
export const XP_BY_INTENSITY: Record<Intensity, number> = {
  chispa: 10,
  impulso: 20,
  all_out: 35,
};

export const INTENSITIES = Object.keys(XP_BY_INTENSITY) as Intensity[];

export function isIntensity(value: unknown): value is Intensity {
  return typeof value === "string" && value in XP_BY_INTENSITY;
}
