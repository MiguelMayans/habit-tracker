import { desc, eq, sql } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { activities } from "../db/schema.js";
import type { Intensity } from "../lib/intensity.js";

export type Activity = typeof activities.$inferSelect;

export type CreateActivityData = {
  categoryId: number;
  focusId?: number;
  description: string;
  intensity: Intensity;
  date: Date;
};

export async function createActivity(
  data: CreateActivityData,
  executor: DbOrTx = db,
): Promise<Activity> {
  const [activity] = await executor.insert(activities).values(data).returning();
  return activity;
}

export async function getActivitiesByCategory(
  categoryId: number,
): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.categoryId, categoryId))
    .orderBy(desc(activities.date));
}

/**
 * Fecha de la última actividad de cada categoría, en una sola consulta
 * agrupada. Alimenta el indicador de inactividad de la home (docs/DESIGN.md).
 *
 * `date` se guarda como unixepoch en segundos, de ahí el ×1000.
 */
export async function getLastActivityDateByCategory(): Promise<
  Map<number, Date>
> {
  const filas = await db
    .select({
      categoryId: activities.categoryId,
      ultima: sql<number>`max(${activities.date})`,
    })
    .from(activities)
    .groupBy(activities.categoryId);

  return new Map(
    filas
      .filter((f) => f.ultima !== null)
      .map((f) => [f.categoryId, new Date(f.ultima * 1000)]),
  );
}

export async function getActivitiesByFocus(
  focusId: number,
): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.focusId, focusId))
    .orderBy(desc(activities.date));
}
