import { desc, eq, gte, sql } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { activities, categories, focuses } from "../db/schema.js";
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

export async function getActivityById(
  id: number,
  executor: DbOrTx = db,
): Promise<Activity | null> {
  const [activity] = await executor
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  return activity ?? null;
}

export async function deleteActivity(
  id: number,
  executor: DbOrTx = db,
): Promise<void> {
  await executor.delete(activities).where(eq(activities.id, id));
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

/**
 * Desvincula las actividades de un foco sin borrarlas: la actividad ocurrió y
 * su XP ya cuenta en la categoría. Devuelve cuántas se desvincularon.
 */
export async function detachActivitiesFromFocus(
  focusId: number,
  executor: DbOrTx = db,
): Promise<number> {
  const filas = await executor
    .update(activities)
    .set({ focusId: null })
    .where(eq(activities.focusId, focusId))
    .returning({ id: activities.id });

  return filas.length;
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

/**
 * Una actividad con el contexto que el cliente no puede resolver por su
 * cuenta cuando la lista es GLOBAL (no de una categoría o foco concretos):
 * de qué categoría es y, si tiene foco, su nombre y si está congelado AHORA
 * — no como estaba cuando se registró la actividad.
 */
export type ActivityWithContext = Activity & {
  categorySlug: string;
  focusName: string | null;
  focusFrozen: boolean | null;
};

/**
 * Actividades de todas las categorías, en una sola consulta con join —no una
 * por categoría—, para alimentar la racha, el resumen de hoy y los focos
 * recientes de la home.
 */
export async function getRecentActivities({
  since,
  limit = 200,
}: {
  since?: Date;
  limit?: number;
} = {}): Promise<ActivityWithContext[]> {
  return db
    .select({
      id: activities.id,
      categoryId: activities.categoryId,
      focusId: activities.focusId,
      description: activities.description,
      intensity: activities.intensity,
      date: activities.date,
      createdAt: activities.createdAt,
      categorySlug: categories.slug,
      focusName: focuses.name,
      focusFrozen: focuses.frozen,
    })
    .from(activities)
    .innerJoin(categories, eq(activities.categoryId, categories.id))
    .leftJoin(focuses, eq(activities.focusId, focuses.id))
    .where(since ? gte(activities.date, since) : undefined)
    .orderBy(desc(activities.date))
    .limit(limit);
}
