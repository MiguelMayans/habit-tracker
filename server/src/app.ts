import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { categoriesRouter } from "./routes/categories.js";
import { focusesRouter } from "./routes/focuses.js";
import { activitiesRouter } from "./routes/activities.js";

/**
 * La app de Express, sin escuchar en ningún puerto.
 *
 * Está separada del arranque porque tiene dos vidas: en local la levanta
 * `index.ts` con `listen`, y en producción la envuelve la función de Netlify,
 * donde no hay puerto que abrir — quien escucha es la plataforma.
 */
export const app = express();

app.use(pinoHttp({ logger }));

// En producción el cliente y la API comparten dominio, así que no hay CORS que
// resolver. Esto es para desarrollo, donde Vite sirve en :5173 y el servidor
// en :3000 y el navegador los trata como orígenes distintos.
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));

app.use(express.json());
app.use(healthRouter);
app.use(categoriesRouter);
app.use(focusesRouter);
app.use(activitiesRouter);
