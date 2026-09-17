import * as focusesRepository from "../repositories/focusesRepository.js";
import type {
  CreateFocusData,
  Focus,
} from "../repositories/focusesRepository.js";
import { db } from "../db/index.js";
import { getCategoryById } from "../repositories/categoriesRepository.js";
import { detachActivitiesFromFocus } from "../repositories/activitiesRepository.js";
import { FOCUS_CURVE, getLevelProgress } from "../lib/xpCurve.js";

/**
 * A Focus with its progress within the level, so the bar can be drawn without
 * the client duplicating the curve. Same reasoning as for categories.
 */
export type FocusWithProgress = Focus & {
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progress: number;
  atMaxLevel: boolean;
};

function withProgress(focus: Focus): FocusWithProgress {
  return {
    ...focus,
    ...getLevelProgress(focus.currentXp, focus.level, FOCUS_CURVE),
  };
}

export type DeleteFocusResult = {
  /** Activities left without a focus that still count toward the category. */
  activitiesDetached: number;
};

/**
 * Deletes a focus. The activities are NOT deleted: they happened, and their XP
 * is already counted in the category — removing them would subtract XP, which
 * goes against the central rule in docs/DESIGN.md. They stay on the category,
 * with no focus.
 *
 * A focus with children is refused: a child is a specialisation of its parent,
 * and deleting the parent would leave it hanging off nothing.
 */
export async function deleteFocus(id: number): Promise<DeleteFocusResult> {
  return db.transaction(async (tx) => {
    const focus = await focusesRepository.getFocusById(id, tx);
    if (!focus) {
      throw new FocusValidationError(`El foco ${id} no existe`);
    }

    const children = await focusesRepository.countChildFocuses(id, tx);
    if (children > 0) {
      throw new FocusValidationError(
        `El foco "${focus.name}" tiene ${children} foco(s) hijo. Borra primero los hijos.`,
      );
    }

    const activitiesDetached = await detachActivitiesFromFocus(id, tx);
    await focusesRepository.deleteFocus(id, tx);

    return { activitiesDetached };
  });
}

export async function getFocusesByCategoryWithProgress(
  categoryId: number,
): Promise<FocusWithProgress[]> {
  const focuses = await focusesRepository.getFocusesByCategory(categoryId);
  return focuses.map(withProgress);
}

/**
 * A business rule broken by the incoming data. The route turns it into a 400:
 * it is the client's fault, not a server failure.
 */
export class FocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusValidationError";
  }
}

/**
 * Creates a Focus. When a parent is supplied, it applies the "spawning" rule
 * from docs/DESIGN.md: only an already frozen Focus (level 20, the mastery
 * trophy) can produce a more specialised child.
 */
export async function createFocus(data: CreateFocusData): Promise<Focus> {
  // Without this, the database FK fires as a constraint error and would end up
  // a 500, when in fact it is bad data sent by the client.
  const category = await getCategoryById(data.categoryId);
  if (!category) {
    throw new FocusValidationError(
      `La categoría ${data.categoryId} no existe`,
    );
  }

  if (data.parentFocusId !== undefined) {
    const parent = await focusesRepository.getFocusById(data.parentFocusId);

    if (!parent) {
      throw new FocusValidationError(
        `El foco padre ${data.parentFocusId} no existe`,
      );
    }

    if (!parent.frozen) {
      throw new FocusValidationError(
        "El foco padre debe estar congelado (nivel 20) para poder generar un hijo",
      );
    }

    // A child is a specialisation of its parent, so it lives in the same
    // category. Without this, the branch would be split across two.
    if (parent.categoryId !== data.categoryId) {
      throw new FocusValidationError(
        `Un foco hijo debe pertenecer a la misma categoría que su padre: ` +
          `el padre ${parent.id} está en la categoría ${parent.categoryId}, ` +
          `pero se ha enviado la categoría ${data.categoryId}`,
      );
    }
  }

  return focusesRepository.createFocus(data);
}

/**
 * What the user can change on a focus by hand: its name and whether it is
 * closed. XP and level are never touched through here.
 *
 * On closing: `frozen` already existed for the level-20 mastery trophy, and it
 * means "takes no more activity, but can spawn a child". That is exactly what
 * is needed to call a focus done ahead of time — you finished the book, you
 * lost the four kilos — so it is reused rather than adding a second flag that
 * would say almost the same thing.
 *
 * The two cases are told apart without storing anything else: frozen at the
 * maximum level is mastery, frozen below it is a manual close. That is why
 * mastery cannot be reopened and a close can: the first was earned, the second
 * is a decision, and people change their minds about decisions.
 */
export async function updateFocus(
  id: number,
  changes: { name?: string; frozen?: boolean },
): Promise<Focus> {
  const focus = await focusesRepository.getFocusById(id);
  if (!focus) {
    throw new FocusValidationError(`El foco ${id} no existe`);
  }

  if (changes.frozen === true && focus.frozen) {
    throw new FocusValidationError(`El foco "${focus.name}" ya está cerrado`);
  }

  if (changes.frozen === false) {
    if (!focus.frozen) {
      throw new FocusValidationError(`El foco "${focus.name}" no está cerrado`);
    }
    if (focus.level >= FOCUS_CURVE.maxLevel) {
      throw new FocusValidationError(
        `"${focus.name}" alcanzó la maestría en el nivel ${FOCUS_CURVE.maxLevel}. Eso no se reabre.`,
      );
    }
  }

  return focusesRepository.updateFocus(id, changes);
}
