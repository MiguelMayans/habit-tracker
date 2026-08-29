import { desc, eq } from "drizzle-orm";
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

export async function getActivitiesByFocus(
  focusId: number,
): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.focusId, focusId))
    .orderBy(desc(activities.date));
}
