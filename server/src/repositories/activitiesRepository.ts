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
 * The date of each category's last activity, as a single grouped query. This
 * feeds the inactivity indicator on the home (docs/DESIGN.md).
 *
 * `date` is stored as unixepoch in seconds, hence the ×1000.
 */
export async function getLastActivityDateByCategory(): Promise<
  Map<number, Date>
> {
  const rows = await db
    .select({
      categoryId: activities.categoryId,
      last: sql<number>`max(${activities.date})`,
    })
    .from(activities)
    .groupBy(activities.categoryId);

  return new Map(
    rows
      .filter((f) => f.last !== null)
      .map((f) => [f.categoryId, new Date(f.last * 1000)]),
  );
}

/**
 * Detaches a focus's activities without deleting them: the activity happened
 * and its XP already counts toward the category. Returns how many were
 * detached.
 */
export async function detachActivitiesFromFocus(
  focusId: number,
  executor: DbOrTx = db,
): Promise<number> {
  const rows = await executor
    .update(activities)
    .set({ focusId: null })
    .where(eq(activities.focusId, focusId))
    .returning({ id: activities.id });

  return rows.length;
}

/**
 * An activity with the context the client cannot resolve on its own when the
 * list is GLOBAL (not scoped to one category or focus): which category it
 * belongs to and, if it has a focus, that focus's name and whether it is
 * frozen NOW — not how it stood when the activity was logged.
 */
export type ActivityWithContext = Activity & {
  categorySlug: string;
  focusName: string | null;
  focusFrozen: boolean | null;
};

/**
 * Activities across all categories, as a single joined query — not one per
 * category — to feed the streak, today's summary and the rhythm strip on the
 * home screen.
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
