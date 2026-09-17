import pino from "pino";

/**
 * The colourised transport is OPT-IN, and deliberately does not look at
 * `NODE_ENV`.
 *
 * It used to switch on whenever `NODE_ENV !== "production"`. Inside the
 * Netlify function that was true, so pino tried to load `pino-pretty` — a
 * devDependency that does not travel in the deployed bundle — and the module
 * blew up ON IMPORT: every route returned a 502, not just one.
 *
 * With a dedicated variable, set only by the `dev` script, that failure stops
 * being possible: any environment other than local development logs plain JSON
 * and references nothing that could be missing.
 */
const pretty = process.env.LOG_PRETTY === "1";

export const logger = pino({
  level: pretty ? "debug" : "info",
  transport: pretty ? { target: "pino-pretty" } : undefined,
});
