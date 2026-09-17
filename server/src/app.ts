import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { categoriesRouter } from "./routes/categories.js";
import { focusesRouter } from "./routes/focuses.js";
import { activitiesRouter } from "./routes/activities.js";

/**
 * The Express app, not listening on any port.
 *
 * It is kept apart from the startup because it has two lives: locally
 * `index.ts` brings it up with `listen`, and in production the Netlify
 * function wraps it, where there is no port to open — the platform listens.
 */
export const app = express();

app.use(pinoHttp({ logger }));

// In production the client and the API share a domain, so there is no CORS to
// resolve. This is for development, where Vite serves on :5173 and the server
// on :3000, and the browser treats them as different origins.
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));

app.use(express.json());
app.use(healthRouter);
app.use(categoriesRouter);
app.use(focusesRouter);
app.use(activitiesRouter);
