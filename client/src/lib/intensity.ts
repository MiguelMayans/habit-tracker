import type { Intensity } from "../api/client";

/**
 * Mirror of XP_BY_INTENSITY (server/src/lib/intensity.ts). The client cannot
 * ask the server for this on every activity it already has — these are three
 * fixed numbers, so a one-off duplication beats a network round trip for
 * something that never changes.
 */
export const XP_BY_INTENSITY: Record<Intensity, number> = {
  chispa: 10,
  impulso: 20,
  all_out: 35,
};

/** What each one means, in a word: the names alone do not say. */
export const INTENSITY_HINT: Record<Intensity, string> = {
  chispa: "un rato",
  impulso: "en serio",
  all_out: "a tope",
};

/** How each intensity is named on screen. */
export const INTENSITY_LABEL: Record<Intensity, string> = {
  chispa: "Chispa",
  impulso: "Impulso",
  all_out: "All-Out",
};
