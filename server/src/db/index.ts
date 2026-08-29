import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});

/**
 * `db` o la transacción que entrega `db.transaction()`. Los repositories lo
 * aceptan como último parámetro para poder participar en una transacción del
 * llamante sin duplicar cada consulta.
 */
export type DbOrTx =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
