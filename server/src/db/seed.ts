import { db } from "./index.js";
import { categories } from "./schema.js";
import { logger } from "../lib/logger.js";

/**
 * Las 5 categorías del sistema. Son fijas: no se crean ni se borran desde la
 * app, solo se siembran aquí. Ver docs/DESIGN.md.
 */
const CATEGORIAS_FIJAS = [
  { name: "Cuerpo", slug: "cuerpo" },
  { name: "Mente", slug: "mente" },
  { name: "Corazón", slug: "corazon" },
  { name: "Disciplina", slug: "disciplina" },
  { name: "Ingenio", slug: "ingenio" },
];

/**
 * Idempotente: se apoya en el índice único de `slug`, así que las filas que ya
 * existan se ignoran en lugar de duplicarse. Importante que sea DO NOTHING y no
 * un upsert — una categoría ya sembrada tiene nivel y XP acumulados, y
 * sobrescribirla los borraría.
 */
async function seed() {
  const insertadas = await db
    .insert(categories)
    .values(CATEGORIAS_FIJAS)
    .onConflictDoNothing({ target: categories.slug })
    .returning({ slug: categories.slug });

  const total = await db.select().from(categories);

  logger.info(
    {
      insertadas: insertadas.map((c) => c.slug),
      yaExistian: CATEGORIAS_FIJAS.length - insertadas.length,
      totalEnBbdd: total.length,
    },
    "Seed de categorías completado",
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Seed de categorías fallido");
    process.exit(1);
  });
