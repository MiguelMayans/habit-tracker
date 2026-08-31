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
 * Un Foco con su progreso dentro del nivel, para poder pintar la barra sin que
 * el cliente tenga que duplicar la curva. Mismo criterio que las categorías.
 */
export type FocusWithProgress = Focus & {
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progress: number;
  atMaxLevel: boolean;
};

function conProgreso(focus: Focus): FocusWithProgress {
  return {
    ...focus,
    ...getLevelProgress(focus.currentXp, focus.level, FOCUS_CURVE),
  };
}

export type DeleteFocusResult = {
  /** Actividades que quedaron sin foco, pero siguen contando en la categoría. */
  activitiesDetached: number;
};

/**
 * Borra un foco. Las actividades NO se borran: ocurrieron, y su XP ya está
 * sumada en la categoría — quitarlas sería restar XP, que va contra la regla
 * central de docs/DESIGN.md. Se quedan en la categoría, sin foco.
 *
 * Un foco con hijos sí se rechaza: el hijo es una especialización del padre y
 * borrarlo lo dejaría colgando de nada.
 */
export async function deleteFocus(id: number): Promise<DeleteFocusResult> {
  return db.transaction(async (tx) => {
    const focus = await focusesRepository.getFocusById(id, tx);
    if (!focus) {
      throw new FocusValidationError(`El foco ${id} no existe`);
    }

    const hijos = await focusesRepository.countChildFocuses(id, tx);
    if (hijos > 0) {
      throw new FocusValidationError(
        `El foco "${focus.name}" tiene ${hijos} foco(s) hijo. Borra primero los hijos.`,
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
  return focuses.map(conProgreso);
}

/**
 * Regla de negocio incumplida por los datos de entrada. La ruta la traduce a un
 * 400: es culpa del cliente, no un fallo del servidor.
 */
export class FocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusValidationError";
  }
}

/**
 * Crea un Foco. Si viene con padre, aplica la regla de "gemado" de
 * docs/DESIGN.md: solo un Foco ya congelado (nivel 20, trofeo de maestría)
 * puede generar un hijo más especializado.
 */
export async function createFocus(data: CreateFocusData): Promise<Focus> {
  // Sin esto la FK de la BBDD salta como error de constraint y acabaría en un
  // 500, cuando en realidad es un dato mal enviado por el cliente.
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

    // Un hijo es una especialización del padre, así que vive en su misma
    // categoría. Sin esto la rama quedaría partida entre dos categorías.
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
