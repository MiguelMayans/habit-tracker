import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

/**
 * Every route but /health requires the `X-Api-Key` header to match the
 * `API_KEY` environment variable.
 *
 * The API is public on the internet (mikeslife.netlify.app/api) and wrote
 * straight to the real database with no check at all. CORS was never a
 * protection: it only stops browsers, not a script or a bot. A single shared
 * key is the right size for a one-person app.
 *
 * It fails CLOSED. Without `API_KEY` it refuses everything — unless the local
 * development startup (index.ts) explicitly said it may run open, via
 * `app.locals.allowWithoutKey`. That flag is set in code, not read from
 * `NODE_ENV`, which Netlify's function runtime does not set reliably: a
 * forgotten variable in production must lock the API, never open it.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  // CORS preflights carry no custom headers by definition.
  if (req.method === "OPTIONS") return next();

  const expected = process.env.API_KEY;

  if (!expected) {
    if (req.app.locals.allowWithoutKey) return next();
    logger.error("API_KEY is not set: refusing every request");
    return res
      .status(503)
      .json({ message: "El servidor no tiene clave de acceso configurada." });
  }

  const given = Buffer.from(req.get("x-api-key") ?? "");
  const wanted = Buffer.from(expected);

  // timingSafeEqual so the comparison does not leak, through its timing, how
  // many leading characters of a guess were right. It needs equal lengths.
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return res.status(401).json({ message: "Clave de acceso incorrecta." });
  }

  next();
}
