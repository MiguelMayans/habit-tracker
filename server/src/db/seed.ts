import { db } from "./index.js";
import { categories } from "./schema.js";
import { logger } from "../lib/logger.js";

/**
 * The 5 system categories. They are fixed: never created or deleted from the
 * app, only seeded here. See docs/DESIGN.md.
 *
 * Names and slugs stay in Spanish — they are the data itself, and the slugs
 * are already stored in production.
 */
const FIXED_CATEGORIES = [
  { name: "Cuerpo", slug: "cuerpo" },
  { name: "Mente", slug: "mente" },
  { name: "Corazón", slug: "corazon" },
  { name: "Disciplina", slug: "disciplina" },
  { name: "Ingenio", slug: "ingenio" },
];

/**
 * Idempotent: it leans on the unique index over `slug`, so rows that already
 * exist are ignored instead of duplicated. It matters that this is DO NOTHING
 * and not an upsert — a category that has already been seeded carries an
 * accumulated level and XP, and overwriting it would wipe them.
 */
async function seed() {
  const inserted = await db
    .insert(categories)
    .values(FIXED_CATEGORIES)
    .onConflictDoNothing({ target: categories.slug })
    .returning({ slug: categories.slug });

  const total = await db.select().from(categories);

  logger.info(
    {
      inserted: inserted.map((c) => c.slug),
      alreadyPresent: FIXED_CATEGORIES.length - inserted.length,
      totalInDb: total.length,
    },
    "Category seed completed",
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Category seed failed");
    process.exit(1);
  });
