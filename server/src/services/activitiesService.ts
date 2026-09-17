import { db } from "../db/index.js";
import {
  createActivity,
  deleteActivity as deleteActivityRow,
  getActivityById,
  type Activity,
} from "../repositories/activitiesRepository.js";
import {
  getCategoryById,
  updateCategoryXp,
} from "../repositories/categoriesRepository.js";
import {
  getFocusById,
  updateFocusXp,
} from "../repositories/focusesRepository.js";
import { XP_BY_INTENSITY, type Intensity } from "../lib/intensity.js";
import {
  CATEGORY_CURVE,
  FOCUS_CURVE,
  calculateLevelForXp,
  getLevelProgress,
  type XpCurve,
} from "../lib/xpCurve.js";

/**
 * A business rule broken by the incoming data. The route turns it into a 400:
 * it is the client's fault, not a server failure.
 */
export class ActivityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityValidationError";
  }
}

export type RegisterActivityData = {
  categoryId: number;
  focusId?: number;
  description: string;
  intensity: Intensity;
  date: Date;
};

/** How an entity ended up after taking the XP. */
export type XpOutcome = {
  id: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  totalXp: number;
  /**
   * In-level progress BEFORE and AFTER, 0..1. Both are sent because the
   * interface animates the bar from one to the other: without the starting
   * point it could only paint the final state, which is exactly the part you
   * do not feel.
   */
  progressBefore: number;
  progressAfter: number;
  xpToNextLevel: number;
  atMaxLevel: boolean;
  /**
   * Only truly meaningful on a Focus: on reaching `FOCUS_CURVE.maxLevel` it
   * freezes and stops taking XP until a child is spawned from it. On a
   * category it always comes back `false`, because that state does not exist.
   */
  frozen: boolean;
};

export type RegisterActivityResult = {
  activity: Activity;
  xpGained: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

export type UndoActivityResult = {
  activityId: number;
  xpLost: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

/**
 * Applies XP on top of a previous level/XP. The level never drops: if the
 * computation came out below the current level (a tweaked curve, migrated
 * data), the higher one is kept. This matches the "never subtract XP or lower
 * levels" rule in AGENTS.md.
 */
function applyXp(
  current: { level: number; currentXp: number },
  xp: number,
  curve: XpCurve,
): { level: number; currentXp: number } {
  const totalXp = current.currentXp + xp;
  const computed = calculateLevelForXp(
    totalXp,
    curve.base,
    curve.exponent,
    curve.maxLevel,
  );

  return { level: Math.max(current.level, computed), currentXp: totalXp };
}

/**
 * Reverts what `applyXp` applied. It deliberately does NOT carry the
 * `Math.max` that `applyXp` has: here the level MUST be able to drop, or the
 * number lies. See the undo exception in docs/DESIGN.md — this is not a
 * punishment, it is correcting a figure that was entered wrong.
 */
function revertXp(
  current: { level: number; currentXp: number },
  xp: number,
  curve: XpCurve,
): { level: number; currentXp: number } {
  const totalXp = Math.max(0, current.currentXp - xp);
  const level = calculateLevelForXp(
    totalXp,
    curve.base,
    curve.exponent,
    curve.maxLevel,
  );

  return { level, currentXp: totalXp };
}

/**
 * Whether `date` falls on today's calendar day, by the server's clock. Its only
 * job is to bound the undo window to a recent slip: it does not need to be
 * exact to the second across time zones — telling "today" from "another day"
 * is enough for the purpose.
 */
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Builds an entity's XP summary, carrying the before and the after. */
function summariseXp(
  id: number,
  before: { level: number; currentXp: number },
  after: { level: number; currentXp: number },
  curve: XpCurve,
  frozen = false,
): XpOutcome {
  const progressBefore = getLevelProgress(before.currentXp, before.level, curve);
  const progressAfter = getLevelProgress(after.currentXp, after.level, curve);

  return {
    id,
    levelBefore: before.level,
    levelAfter: after.level,
    leveledUp: after.level > before.level,
    totalXp: after.currentXp,
    progressBefore: progressBefore.progress,
    progressAfter: progressAfter.progress,
    xpToNextLevel: progressAfter.xpToNextLevel,
    atMaxLevel: progressAfter.atMaxLevel,
    frozen,
  };
}

/**
 * Logs an activity and cascades the XP: to the Focus (when there is one) and
 * ALWAYS to the category. All inside one transaction, so either the activity
 * and both XP gains are written, or nothing is.
 */
export async function registerActivity(
  data: RegisterActivityData,
): Promise<RegisterActivityResult> {
  return db.transaction(async (tx) => {
    const category = await getCategoryById(data.categoryId, tx);
    if (!category) {
      throw new ActivityValidationError(
        `La categoría ${data.categoryId} no existe`,
      );
    }

    let focus = null;
    if (data.focusId !== undefined) {
      focus = await getFocusById(data.focusId, tx);

      if (!focus) {
        throw new ActivityValidationError(
          `El foco ${data.focusId} no existe`,
        );
      }

      if (focus.categoryId !== data.categoryId) {
        throw new ActivityValidationError(
          `El foco debe pertenecer a la categoría indicada: el foco ${focus.id} ` +
            `está en la categoría ${focus.categoryId}, pero se ha enviado la ` +
            `categoría ${data.categoryId}`,
        );
      }

      if (focus.frozen) {
        // Frozen at the maximum level is mastery; below it, the only way in
        // is a manual close. Telling a level-3 focus you called done that it
        // "reached mastery" would be a lie.
        const reason =
          focus.level >= FOCUS_CURVE.maxLevel
            ? "ha alcanzado la maestría y está congelado"
            : "está cerrado";

        throw new ActivityValidationError(
          `El foco "${focus.name}" ${reason}: ya no admite más XP. Tócalo ` +
            `para engendrar un foco hijo especializado y registra la ` +
            `actividad ahí, o reábrelo desde su categoría.`,
        );
      }
    }

    const xpGained = XP_BY_INTENSITY[data.intensity];

    const activity = await createActivity(
      {
        categoryId: data.categoryId,
        focusId: data.focusId,
        description: data.description,
        intensity: data.intensity,
        date: data.date,
      },
      tx,
    );

    let focusOutcome: XpOutcome | null = null;
    if (focus) {
      const next = applyXp(focus, xpGained, FOCUS_CURVE);
      // Reaching the maximum level freezes it: this fires here, in the same XP
      // hit that reaches it, not in a separate pass someone has to remember to
      // run.
      const frozen = next.level >= FOCUS_CURVE.maxLevel;
      await updateFocusXp(focus.id, { ...next, frozen }, tx);

      focusOutcome = summariseXp(focus.id, focus, next, FOCUS_CURVE, frozen);
    }

    const nextCategory = applyXp(category, xpGained, CATEGORY_CURVE);
    await updateCategoryXp(category.id, nextCategory, tx);

    return {
      activity,
      xpGained,
      focus: focusOutcome,
      category: summariseXp(
        category.id,
        category,
        nextCategory,
        CATEGORY_CURVE,
      ),
    };
  });
}

/**
 * Undoes a log: deletes the activity and cascades its XP back, to the Focus
 * (if it had one) and to the category. Bounded to today's activities — see the
 * exception in docs/DESIGN.md — so it stays a correction of a recent slip and
 * does not become a way to revisit a whole day in hindsight.
 */
export async function deleteActivity(id: number): Promise<UndoActivityResult> {
  return db.transaction(async (tx) => {
    const activity = await getActivityById(id, tx);
    if (!activity) {
      throw new ActivityValidationError(`La actividad ${id} no existe`);
    }

    if (!isToday(activity.date)) {
      throw new ActivityValidationError(
        "Solo se puede deshacer una actividad registrada hoy",
      );
    }

    const category = await getCategoryById(activity.categoryId, tx);
    if (!category) {
      throw new ActivityValidationError(
        `La categoría ${activity.categoryId} no existe`,
      );
    }

    const xpGained = XP_BY_INTENSITY[activity.intensity];

    let focusOutcome: XpOutcome | null = null;
    if (activity.focusId !== null) {
      const focus = await getFocusById(activity.focusId, tx);
      // The focus may have been deleted after the activity was logged (it is
      // detached, not deleted): then only the category needs reverting.
      if (focus) {
        const reverted = revertXp(focus, xpGained, FOCUS_CURVE);
        // If it was frozen and the level falls below the maximum, it thaws:
        // it is no longer true that it sits at level 20.
        const frozen = reverted.level >= FOCUS_CURVE.maxLevel;
        await updateFocusXp(focus.id, { ...reverted, frozen }, tx);

        focusOutcome = summariseXp(
          focus.id,
          focus,
          reverted,
          FOCUS_CURVE,
          frozen,
        );
      }
    }

    const revertedCategory = revertXp(category, xpGained, CATEGORY_CURVE);
    await updateCategoryXp(category.id, revertedCategory, tx);

    await deleteActivityRow(activity.id, tx);

    return {
      activityId: activity.id,
      xpLost: xpGained,
      focus: focusOutcome,
      category: summariseXp(
        category.id,
        category,
        revertedCategory,
        CATEGORY_CURVE,
      ),
    };
  });
}
