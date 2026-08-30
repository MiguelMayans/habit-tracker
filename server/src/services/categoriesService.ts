import {
  getAllCategories,
  getCategoryById,
  type Category,
} from "../repositories/categoriesRepository.js";
import { countFocusesByCategory } from "../repositories/focusesRepository.js";
import { getLastActivityDateByCategory } from "../repositories/activitiesRepository.js";
import { CATEGORY_CURVE, getLevelProgress } from "../lib/xpCurve.js";

/**
 * Lo que la categoría necesita para pintarse en la home: además de la fila,
 * el progreso dentro del nivel (la barra no puede salir de `currentXp`, que es
 * acumulada histórica), cuántos focos tiene y cuándo recibió XP por última vez.
 *
 * Se calcula aquí y no en el cliente para que la curva de XP siga teniendo una
 * única fuente de verdad en `lib/xpCurve.ts`.
 */
export type CategoryWithProgress = Category & {
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progress: number;
  atMaxLevel: boolean;
  focusCount: number;
  lastActivityAt: string | null;
};

function enriquecer(
  category: Category,
  focusCount: number,
  lastActivity: Date | undefined,
): CategoryWithProgress {
  return {
    ...category,
    ...getLevelProgress(category.currentXp, category.level, CATEGORY_CURVE),
    focusCount,
    lastActivityAt: lastActivity ? lastActivity.toISOString() : null,
  };
}

export async function getCategoriesWithProgress(): Promise<
  CategoryWithProgress[]
> {
  // Tres consultas en paralelo, no una por categoría.
  const [categories, focusCounts, lastActivities] = await Promise.all([
    getAllCategories(),
    countFocusesByCategory(),
    getLastActivityDateByCategory(),
  ]);

  return categories.map((c) =>
    enriquecer(c, focusCounts.get(c.id) ?? 0, lastActivities.get(c.id)),
  );
}

export async function getCategoryWithProgress(
  id: number,
): Promise<CategoryWithProgress | null> {
  const category = await getCategoryById(id);
  if (!category) return null;

  const [focusCounts, lastActivities] = await Promise.all([
    countFocusesByCategory(),
    getLastActivityDateByCategory(),
  ]);

  return enriquecer(
    category,
    focusCounts.get(id) ?? 0,
    lastActivities.get(id),
  );
}
