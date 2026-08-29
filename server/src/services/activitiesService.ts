import { db } from "../db/index.js";
import {
  createActivity,
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
  type XpCurve,
} from "../lib/xpCurve.js";

/**
 * Regla de negocio incumplida por los datos de entrada. La ruta la traduce a un
 * 400: es culpa del cliente, no un fallo del servidor.
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

/** Cómo quedó una entidad tras recibir la XP. */
export type XpOutcome = {
  id: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  totalXp: number;
};

export type RegisterActivityResult = {
  activity: Activity;
  xpGained: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

/**
 * Aplica la XP sobre un nivel/XP previos. El nivel nunca baja: si el cálculo
 * diera menos que el nivel actual (curva retocada, datos migrados), se conserva
 * el mayor. Encaja con la regla de "nunca restar XP ni bajar niveles" de
 * AGENTS.md.
 */
function applyXp(
  current: { level: number; currentXp: number },
  xp: number,
  curve: XpCurve,
): { level: number; currentXp: number } {
  const totalXp = current.currentXp + xp;
  const calculado = calculateLevelForXp(
    totalXp,
    curve.base,
    curve.exponent,
    curve.maxLevel,
  );

  return { level: Math.max(current.level, calculado), currentXp: totalXp };
}

/**
 * Registra una actividad y propaga la XP en cascada: al Foco (si lo hay) y
 * SIEMPRE a la categoría. Todo dentro de una transacción, así que o se escribe
 * la actividad y ambas subidas de XP, o no se escribe nada.
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
        throw new ActivityValidationError(
          `El foco "${focus.name}" está congelado en el nivel máximo y ya no ` +
            `admite más XP. Crea un foco hijo especializado con ` +
            `POST /focuses { "categoryId": ${focus.categoryId}, "name": "...", ` +
            `"parentFocusId": ${focus.id} } y registra la actividad ahí.`,
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
      const siguiente = applyXp(focus, xpGained, FOCUS_CURVE);
      await updateFocusXp(focus.id, siguiente, tx);

      focusOutcome = {
        id: focus.id,
        levelBefore: focus.level,
        levelAfter: siguiente.level,
        leveledUp: siguiente.level > focus.level,
        totalXp: siguiente.currentXp,
      };
    }

    const siguienteCategoria = applyXp(category, xpGained, CATEGORY_CURVE);
    await updateCategoryXp(category.id, siguienteCategoria, tx);

    return {
      activity,
      xpGained,
      focus: focusOutcome,
      category: {
        id: category.id,
        levelBefore: category.level,
        levelAfter: siguienteCategoria.level,
        leveledUp: siguienteCategoria.level > category.level,
        totalXp: siguienteCategoria.currentXp,
      },
    };
  });
}
