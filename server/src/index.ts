import "dotenv/config";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";

/**
 * Development startup. This file never runs in production: there the app is
 * served by the Netlify function, which imports `app` directly.
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
