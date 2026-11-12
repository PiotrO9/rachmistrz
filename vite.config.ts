import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Preserve Vite 7's browser baseline when upgrading the build tooling.
  build: { target: ["chrome107", "edge107", "firefox104", "safari16"] },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Rachmistrz — trening liczenia",
        short_name: "Rachmistrz",
        description: "Ćwicz liczenie w pamięci, we własnym tempie.",
        lang: "pl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#f6f5ef",
        background_color: "#f6f5ef",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"] },
});
