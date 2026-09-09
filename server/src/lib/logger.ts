import pino from "pino";

/**
 * El transporte con colorines es OPT-IN, y a propósito no mira `NODE_ENV`.
 *
 * Antes se activaba siempre que `NODE_ENV !== "production"`. En la función de
 * Netlify eso era cierto, así que pino intentaba cargar `pino-pretty` — que es
 * una devDependency y no viaja en el paquete desplegado— y el módulo reventaba
 * AL IMPORTARSE: fallaban todas las rutas con un 502, no una.
 *
 * Con una variable propia, que solo pone el script `dev`, el fallo deja de ser
 * posible: cualquier entorno que no sea el de desarrollo local registra en
 * JSON plano y no referencia nada que pueda faltar.
 */
const bonito = process.env.LOG_PRETTY === "1";

export const logger = pino({
  level: bonito ? "debug" : "info",
  transport: bonito ? { target: "pino-pretty" } : undefined,
});
