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
      // PWA step 1 of 4: only the manifest. The plugin also builds a service
      // worker, but nothing registers it yet — that is step 2. Until then it
      // is a file in dist/ that no browser loads.
      injectRegister: false,

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
