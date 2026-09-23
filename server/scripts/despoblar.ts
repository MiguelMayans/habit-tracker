import "dotenv/config";
import { inArray } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { db } from "../src/db/index.js";
import { activities, categories, focuses } from "../src/db/schema.js";

/**
 * Ejecuta el plan de borrado que deja `despoblar.py`.
 *
 * Todo va acotado por id — nunca un DELETE o un UPDATE sin WHERE — y los
 * niveles y la XP se restauran a los valores exactos que tenían antes de
 * poblar, porque borrar filas de actividades por SQL no revierte la cascada
 * de XP que hizo la API al crearlas.
 */
type Plan = {
  activityIds: number[];
  focusIds: number[];
  categories: { id: number; level: number; currentXp: number }[];
  focusesToRestore: {
    id: number;
    level: number;
    currentXp: number;
    frozen: boolean;
  }[];
};

const plan: Plan = JSON.parse(
  readFileSync("scripts/plan-borrado.json", "utf8"),
);

async function main() {
  if (plan.activityIds.length > 0) {
    await db.delete(activities).where(inArray(activities.id, plan.activityIds));
    console.log(`Borradas ${plan.activityIds.length} actividades.`);
  }

  if (plan.focusIds.length > 0) {
    // Los hijos primero: un padre con hijos no se puede borrar.
    await db.delete(focuses).where(inArray(focuses.id, plan.focusIds));
    console.log(`Borrados ${plan.focusIds.length} focos.`);
  }

  for (const c of plan.categories) {
    await db
      .update(categories)
      .set({ level: c.level, currentXp: c.currentXp })
      .where(inArray(categories.id, [c.id]));
  }
  console.log(`Restauradas ${plan.categories.length} categorías.`);

  for (const f of plan.focusesToRestore) {
    await db
      .update(focuses)
      .set({ level: f.level, currentXp: f.currentXp, frozen: f.frozen })
      .where(inArray(focuses.id, [f.id]));
  }
  console.log(`Restaurados ${plan.focusesToRestore.length} focos previos.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
