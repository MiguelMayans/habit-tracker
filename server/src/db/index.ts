import "dotenv/config";
// La variante `web` habla con Turso por HTTP y no arrastra el binario nativo
// de libsql, que en un entorno serverless no se puede empaquetar. Las
// transacciones interactivas siguen funcionando —comprobado contra la base
// real—, que es de lo que dependen las cascadas de XP.
import { drizzle } from "drizzle-orm/libsql/web";

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
