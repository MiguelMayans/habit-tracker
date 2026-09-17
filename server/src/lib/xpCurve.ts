/**
 * The XP curve. Everything in this file is pure: same input, same output, with
 * no database involved.
 *
 * `currentXp` is always stored as total accumulated XP over time; it is never
 * reset on level-up. The level is derived from that figure.
 */

export type XpCurve = {
  base: number;
  exponent: number;
  maxLevel: number;
};

/** See docs/DESIGN.md: focuses cap at 20, categories at 99 on a slower curve. */
export const FOCUS_CURVE: XpCurve = { base: 8, exponent: 1.35, maxLevel: 20 };
export const CATEGORY_CURVE: XpCurve = { base: 35, exponent: 0.7, maxLevel: 99 };

/**
 * The XP cost of reaching `level` from the one below. The running total starts
 * at n=2: level 1 is the starting point and costs nothing, so the first real
 * jump (1 → 2) is worth `xpCostForLevel(2)`.
 */
function xpCostForLevel(
  level: number,
  base: number,
  exponent: number,
): number {
  return Math.floor(base * Math.pow(level, exponent));
}

/**
 * The level that corresponds to a total accumulated XP: it subtracts the cost
 * of reaching each level, starting at 2, until the remaining XP no longer
 * covers the next one. It caps at `maxLevel` — XP keeps accumulating beyond
 * that, but the level does not.
 */
export function calculateLevelForXp(
  totalXp: number,
  base: number,
  exponent: number,
  maxLevel: number,
): number {
  if (!Number.isFinite(totalXp) || totalXp <= 0) return 1;

  let level = 1;
  let remaining = totalXp;

  while (level < maxLevel) {
    const cost = xpCostForLevel(level + 1, base, exponent);
    if (remaining < cost) break;
    remaining -= cost;
    level += 1;
  }

  return level;
}

/**
 * Total accumulated XP needed to sit at `level`. The inverse of
 * `calculateLevelForXp`, useful for drawing progress bars.
 */
function totalXpForLevel(
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

export type LevelProgress = {
  /** XP accumulated within the current level, not the historical total. */
  xpIntoLevel: number;
  /** The full cost of this level. 0 at the maximum level. */
  xpForNextLevel: number;
  /** What is left to reach the next one. 0 at the maximum level. */
  xpToNextLevel: number;
  /** 0..1, for drawing the bar. */
  progress: number;
  atMaxLevel: boolean;
};

/**
 * Progress WITHIN the current level, which is the only thing that means
 * anything on a bar: `currentXp` is a historical total and would grow forever.
 *
 * It takes the already-stored level rather than recomputing it, so the bar
 * always agrees with the level the interface is showing.
 */
export function getLevelProgress(
  totalXp: number,
  level: number,
  curve: XpCurve,
): LevelProgress {
  const atMaxLevel = level >= curve.maxLevel;

  if (atMaxLevel) {
    return {
      xpIntoLevel: 0,
      xpForNextLevel: 0,
      xpToNextLevel: 0,
      progress: 1,
      atMaxLevel: true,
    };
  }

  const base = totalXpForLevel(level, curve.base, curve.exponent);
  const xpForNextLevel = xpCostForLevel(level + 1, curve.base, curve.exponent);
  const xpIntoLevel = Math.max(0, totalXp - base);

  return {
    xpIntoLevel,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, xpForNextLevel - xpIntoLevel),
    progress: Math.min(1, xpIntoLevel / xpForNextLevel),
    atMaxLevel: false,
  };
}
