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
  getLevelProgress,
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
  /**
   * Progreso dentro del nivel ANTES y DESPUÉS, 0..1. Van los dos porque la
   * interfaz anima la barra de uno al otro: sin el de partida solo podría
   * pintar el estado final, que es justo lo que no se siente.
   */
  progressBefore: number;
  progressAfter: number;
  xpToNextLevel: number;
  atMaxLevel: boolean;
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

/** Construye el resumen de XP de una entidad, con el antes y el después. */
function resumirXp(
  id: number,
  antes: { level: number; currentXp: number },
  despues: { level: number; currentXp: number },
  curve: XpCurve,
): XpOutcome {
  const progresoAntes = getLevelProgress(antes.currentXp, antes.level, curve);
  const progresoDespues = getLevelProgress(
    despues.currentXp,
    despues.level,
    curve,
  );

  return {
    id,
    levelBefore: antes.level,
    levelAfter: despues.level,
    leveledUp: despues.level > antes.level,
    totalXp: despues.currentXp,
    progressBefore: progresoAntes.progress,
    progressAfter: progresoDespues.progress,
    xpToNextLevel: progresoDespues.xpToNextLevel,
    atMaxLevel: progresoDespues.atMaxLevel,
  };
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

      focusOutcome = resumirXp(focus.id, focus, siguiente, FOCUS_CURVE);
    }

    const siguienteCategoria = applyXp(category, xpGained, CATEGORY_CURVE);
    await updateCategoryXp(category.id, siguienteCategoria, tx);

    return {
      activity,
      xpGained,
      focus: focusOutcome,
      category: resumirXp(
        category.id,
        category,
        siguienteCategoria,
        CATEGORY_CURVE,
      ),
    };
  });
}
