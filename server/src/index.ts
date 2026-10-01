import "dotenv/config";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";

/**
 * Development startup. This file never runs in production: there the app is
 * served by the Netlify function, which imports `app` directly.
 */
const PORT = process.env.PORT || 3000;

// Locally the API may run without a key, so development needs no setup. Only
// this startup says so: the production function never sets the flag, so a
// missing key there locks the API instead of opening it.
if (!process.env.API_KEY) {
  app.locals.allowWithoutKey = true;
  logger.warn("API_KEY not set: the local API accepts requests without a key");
}

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
