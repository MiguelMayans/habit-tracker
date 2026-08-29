import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
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

export async function getFocusById(id: number): Promise<Focus | null> {
  const [focus] = await db
    .select()
    .from(focuses)
    .where(eq(focuses.id, id))
    .limit(1);

  return focus ?? null;
}

/**
 * level, currentXp y frozen los pone el schema por defecto (1, 0, false).
 */
export async function createFocus(data: CreateFocusData): Promise<Focus> {
  const [focus] = await db.insert(focuses).values(data).returning();
  return focus;
}
