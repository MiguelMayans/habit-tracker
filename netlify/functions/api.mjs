import serverless from "serverless-http";
import { app } from "../../server/dist/src/app.js";

// Se importa el JavaScript ya compilado por tsc y no el TypeScript de origen:
// los imports del servidor llevan extensión .js al estilo NodeNext, y el
// empaquetador de funciones no los resuelve de vuelta a .ts. Por eso el
// comando de build de Netlify construye el servidor antes que el cliente.

// `basePath` quita el /api con el que llegan las peticiones desde el redirect,
// para que Express siga viendo las mismas rutas que en local: /categories,
// /focuses, /activities.
export const handler = serverless(app, { basePath: "/api" });
