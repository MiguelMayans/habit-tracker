import type { Intensity } from "../api/client";

/**
 * Espejo de XP_BY_INTENSITY (server/src/lib/intensity.ts). El cliente no
 * puede pedirle esto al servidor por cada actividad ya registrada — solo son
 * tres números fijos, así que se acepta la duplicación puntual en vez de un
 * viaje de red para algo que no cambia.
 */
export const XP_POR_INTENSIDAD: Record<Intensity, number> = {
  chispa: 10,
  impulso: 20,
  all_out: 35,
};
