import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema.js";

export type Category = typeof categories.$inferSelect;

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const [category] = await db
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
