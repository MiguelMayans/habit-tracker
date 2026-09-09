import "dotenv/config";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";

/**
 * Arranque para desarrollo. En producción no se ejecuta este fichero: la app
 * la sirve la función de Netlify, que importa `app` directamente.
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
