import { count, eq } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { focuses } from "../db/schema.js";

export type Focus = typeof focuses.$inferSelect;

export type CreateFocusData = {
  categoryId: number;
  name: string;
  parentFocusId?: number;
};

export async function getFocusesByCategory(
  categoryId: number,
): Promise<Focus[]> {
  return db.select().from(focuses).where(eq(focuses.categoryId, categoryId));
}

/**
 * Focus count per category, as a single grouped query. Categories with no
 * focuses do not appear in the result.
 */
export async function countFocusesByCategory(): Promise<Map<number, number>> {
  const rows = await db
    .select({ categoryId: focuses.categoryId, total: count() })
    .from(focuses)
    .groupBy(focuses.categoryId);

  return new Map(rows.map((f) => [f.categoryId, f.total]));
}

export async function getFocusById(
  id: number,
  executor: DbOrTx = db,
): Promise<Focus | null> {
  const [focus] = await executor
    .select()
    .from(focuses)
    .where(eq(focuses.id, id))
    .limit(1);

  return focus ?? null;
}

/**
 * level, currentXp and frozen come from the schema defaults (1, 0, false).
 */
export async function createFocus(data: CreateFocusData): Promise<Focus> {
  const [focus] = await db.insert(focuses).values(data).returning();
  return focus;
}

/** How many child focuses hang off this one, so none are left orphaned. */
export async function countChildFocuses(
  parentFocusId: number,
  executor: DbOrTx = db,
): Promise<number> {
  const [row] = await executor
    .select({ total: count() })
    .from(focuses)
    .where(eq(focuses.parentFocusId, parentFocusId));

  return row?.total ?? 0;
}

export async function deleteFocus(
  id: number,
  executor: DbOrTx = db,
): Promise<void> {
  await executor.delete(focuses).where(eq(focuses.id, id));
}

/** The fields the user edits by hand. XP is never touched through here. */
export async function updateFocus(
  id: number,
  values: { name?: string; frozen?: boolean },
  executor: DbOrTx = db,
): Promise<Focus> {
  const [focus] = await executor
    .update(focuses)
    .set(values)
    .where(eq(focuses.id, id))
    .returning();

  return focus;
}

export async function updateFocusXp(
  id: number,
  values: { level: number; currentXp: number; frozen?: boolean },
  executor: DbOrTx = db,
): Promise<Focus> {
  const [focus] = await executor
    .update(focuses)
    .set(values)
    .where(eq(focuses.id, id))
    .returning();

  return focus;
}
