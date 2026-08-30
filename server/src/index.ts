import "dotenv/config";
import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { categoriesRouter } from "./routes/categories.js";
import { focusesRouter } from "./routes/focuses.js";
import { activitiesRouter } from "./routes/activities.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(pinoHttp({ logger }));
// El cliente vive en otro origen (Vite en :5173 en dev, Netlify en producción),
// así que sin CORS el navegador bloquea cualquier fetch. CORS_ORIGIN acota los
// orígenes permitidos; sin definirla se permite cualquiera, cómodo en local.
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
app.use(express.json());
app.use(healthRouter);
app.use(categoriesRouter);
app.use(focusesRouter);
app.use(activitiesRouter);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
