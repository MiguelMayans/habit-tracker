import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The service worker is registered by hand in main.tsx (through the
      // plugin's `virtual:pwa-register` module), not by a script the plugin
      // injects: step 3, deciding how updates arrive, needs that code.
      injectRegister: false,

      // What the service worker does with each request. Anything matching no
      // rule here goes to the network untouched — which is exactly what the
      // API needs (see the note on /api below).
      workbox: {
        // The precache: the whole app shell, saved on install so the app
        // opens instantly and offline. Images included (the wordmarks, the
        // logo, the icons): without them an offline start shows holes.
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        // The plugin already adds the manifest and the icons it lists; left
        // in the glob as well they went into the precache twice.
        globIgnores: ["manifest.webmanifest", "icons/icon-*.png"],

        // Any in-app address opened offline (/categories/3, /log-activity…)
        // gets index.html, and the router takes it from there. The API is
        // excluded so a failed API call never comes back as a web page.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],

        // /api has NO rule, on purpose: no cache at all. A cached
        // /api/categories would open the app showing yesterday's XP as if it
        // were today's. Offline, API calls fail, and the screens say so.
        runtimeCaching: [
          {
            // The Google Fonts stylesheets: served from cache at once, and
            // refreshed in the background for next time.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            // The font files themselves never change for a given URL, so
            // once saved they are used straight from the cache for a year.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // The web app manifest: what Android reads to offer "Install" and to
      // draw the app once installed. The plugin writes it to
      // manifest.webmanifest and links it from index.html.
      manifest: {
        name: "Mike's Life",
        short_name: "Mike's Life",
        description: "Tu vida, a niveles.",
        lang: "es",
        // Opens without the browser's address bar, like a native app.
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        // Status bar and task switcher colour, and the splash screen behind
        // the icon while the app boots: black, like the app.
        theme_color: "#000000",
        background_color: "#000000",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          // Android crops icons to its own shape (circle, squircle…). A
          // "maskable" icon keeps everything that matters inside the central
          // safe zone, so the crop never eats the letter.
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
