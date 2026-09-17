import "dotenv/config";
// The `web` variant talks to Turso over HTTP and does not drag in the native
// libsql binary, which cannot be bundled in a serverless environment.
// Interactive transactions still work — verified against the real database —
// and that is what the XP cascades depend on.
import { drizzle } from "drizzle-orm/libsql/web";

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});

/**
 * Either `db` or the transaction handed out by `db.transaction()`. The
 * repositories take it as their last parameter, so they can join a caller's
 * transaction without duplicating every query.
 */
export type DbOrTx =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
