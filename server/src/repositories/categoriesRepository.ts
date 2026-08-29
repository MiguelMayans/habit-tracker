import { eq } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { categories } from "../db/schema.js";

export type Category = typeof categories.$inferSelect;

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories);
}

export async function getCategoryById(
  id: number,
  executor: DbOrTx = db,
): Promise<Category | null> {
  const [category] = await executor
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return category ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return category ?? null;
}

export async function updateCategoryXp(
  id: number,
  values: { level: number; currentXp: number },
  executor: DbOrTx = db,
): Promise<Category> {
  const [category] = await executor
    .update(categories)
    .set(values)
    .where(eq(categories.id, id))
    .returning();

  return category;
}
