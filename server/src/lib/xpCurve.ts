/**
 * Curva de XP. Todo lo de este archivo es puro: mismo input, mismo output, sin
 * tocar la BBDD.
 *
 * `currentXp` se guarda siempre como XP acumulada total histórica, nunca se
 * resetea al subir de nivel. El nivel se deriva de esa cifra.
 */

export type XpCurve = {
  base: number;
  exponent: number;
  maxLevel: number;
};

/** Ver docs/DESIGN.md: Focos llegan a 20, categorías a 99 con curva más lenta. */
export const FOCUS_CURVE: XpCurve = { base: 8, exponent: 1.35, maxLevel: 20 };
export const CATEGORY_CURVE: XpCurve = { base: 35, exponent: 0.7, maxLevel: 99 };

/**
 * Coste en XP de alcanzar el nivel `level` desde el anterior. El acumulado
 * arranca en n=2: el nivel 1 es el punto de partida y no cuesta nada, así que
 * el primer salto real (1 → 2) vale `xpCostForLevel(2)`.
 */
export function xpCostForLevel(
  level: number,
  base: number,
  exponent: number,
): number {
  return Math.floor(base * Math.pow(level, exponent));
}

/**
 * Nivel que corresponde a una XP total acumulada: va restando el coste de
 * alcanzar cada nivel, desde el 2, hasta que la XP restante ya no alcanza para
 * el siguiente. Topa en `maxLevel` — la XP sigue acumulándose por encima, pero
 * el nivel no.
 */
export function calculateLevelForXp(
  totalXp: number,
  base: number,
  exponent: number,
  maxLevel: number,
): number {
  if (!Number.isFinite(totalXp) || totalXp <= 0) return 1;

  let level = 1;
  let restante = totalXp;

  while (level < maxLevel) {
    const coste = xpCostForLevel(level + 1, base, exponent);
    if (restante < coste) break;
    restante -= coste;
    level += 1;
  }

  return level;
}

/**
 * XP total acumulada necesaria para estar en `level`. Inversa de
 * `calculateLevelForXp`, útil para pintar barras de progreso.
 */
export function totalXpForLevel(
  level: number,
  base: number,
  exponent: number,
): number {
  let total = 0;
  for (let n = 2; n <= level; n += 1) {
    total += xpCostForLevel(n, base, exponent);
  }
  return total;
}
