import serverless from "serverless-http";
import { app } from "../../server/dist/src/app.js";

// Se importa el JavaScript ya compilado por tsc y no el TypeScript de origen:
// los imports del servidor llevan extensión .js al estilo NodeNext, y el
// empaquetador de funciones no los resuelve de vuelta a .ts. Por eso el
// comando de build de Netlify construye el servidor antes que el cliente.

const envuelta = serverless(app);

/**
 * Express tiene que ver las mismas rutas que en local —/categories, /focuses,
 * /activities—, así que hay que quitarle el prefijo por el que ha llegado.
 *
 * Se contemplan los dos prefijos posibles a propósito: según cómo resuelva
 * Netlify la reescritura, la petición puede llegar con la ruta original
 * (/api/categories) o con la de la función ya expandida
 * (/.netlify/functions/api/categories). Depender de que sea una u otra es
 * justo el tipo de suposición que solo se descubre rota en producción.
 */
export const handler = async (event, context) => {
  const ruta = (event.path ?? "/")
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api(?=\/|$)/, "");

  return envuelta({ ...event, path: ruta === "" ? "/" : ruta }, context);
};
