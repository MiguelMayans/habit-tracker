import serverless from "serverless-http";
import { app } from "../../server/dist/src/app.js";

// This imports the JavaScript already compiled by tsc rather than the
// TypeScript source: the server's imports carry NodeNext-style .js extensions,
// and the function bundler does not resolve them back to .ts. That is why
// Netlify's build command builds the server before the client.

const wrapped = serverless(app);

/**
 * Express has to see the same routes it sees locally — /categories, /focuses,
 * /activities — so the prefix it arrived under has to be stripped.
 *
 * Both possible prefixes are handled on purpose: depending on how Netlify
 * resolves the rewrite, the request can arrive with the original path
 * (/api/categories) or with the function path already expanded
 * (/.netlify/functions/api/categories). Depending on which one it is happens
 * to be exactly the kind of assumption you only find broken in production.
 */
export const handler = async (event, context) => {
  const path = (event.path ?? "/")
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api(?=\/|$)/, "");

  return wrapped({ ...event, path: path === "" ? "/" : path }, context);
};
