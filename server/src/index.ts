import "dotenv/config";
import express from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { categoriesRouter } from "./routes/categories.js";
import { focusesRouter } from "./routes/focuses.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(healthRouter);
app.use(categoriesRouter);
app.use(focusesRouter);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
