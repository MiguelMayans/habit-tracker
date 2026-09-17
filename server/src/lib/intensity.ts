import type { activities } from "../db/schema.js";

/**
 * Derived from the schema enum: if the intensities change there, this stops
 * compiling instead of silently drifting out of sync.
 */
export type Intensity = (typeof activities.$inferSelect)["intensity"];

/** The single source of truth for the intensity → XP conversion. */
export const XP_BY_INTENSITY: Record<Intensity, number> = {
  chispa: 10,
  impulso: 20,
  all_out: 35,
};

export const INTENSITIES = Object.keys(XP_BY_INTENSITY) as Intensity[];

export function isIntensity(value: unknown): value is Intensity {
  return typeof value === "string" && value in XP_BY_INTENSITY;
}
