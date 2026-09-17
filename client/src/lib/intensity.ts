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
