import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // SPA fallback so any route serves index.html from cache when offline.
        navigateFallback: "/index.html",
        // Don't try to precache huge maps; keeps the SW light.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cross-origin album art from RF and its CDNs.
            urlPattern: /^https?:\/\/(?!localhost).*\.(?:png|jpe?g|webp|gif|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "album-art",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "Hillard Lights",
        short_name: "Hillard Lights",
        description: "Outdoor kiosk for the Hillard Lights Halloween show.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["entertainment"],
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
