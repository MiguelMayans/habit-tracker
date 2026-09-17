import {
  getAllCategories,
  getCategoryById,
  type Category,
} from "../repositories/categoriesRepository.js";
import { countFocusesByCategory } from "../repositories/focusesRepository.js";
import { getLastActivityDateByCategory } from "../repositories/activitiesRepository.js";
import { CATEGORY_CURVE, getLevelProgress } from "../lib/xpCurve.js";

/**
 * What a category needs in order to render on the home: on top of the row, the
 * progress within its level (the bar cannot come from `currentXp`, which is a
 * historical total), how many focuses it has, and when it last took XP.
 *
 * Computed here and not on the client so the XP curve keeps a single source of
 * truth in `lib/xpCurve.ts`.
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

function enrich(
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
  // Three queries in parallel, not one per category.
  const [categories, focusCounts, lastActivities] = await Promise.all([
    getAllCategories(),
    countFocusesByCategory(),
    getLastActivityDateByCategory(),
  ]);

  return categories.map((c) =>
    enrich(c, focusCounts.get(c.id) ?? 0, lastActivities.get(c.id)),
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

  return enrich(
    category,
    focusCounts.get(id) ?? 0,
    lastActivities.get(id),
  );
}
