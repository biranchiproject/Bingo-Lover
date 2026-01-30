import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      filename: "manifest.json",
      devOptions: {
        enabled: true
      },
      manifest: {
        name: "Bingo Lover",
        short_name: "BINGO",
        description: "Play Bingo online and offline with friends",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        orientation: "portrait",
        icons: [
          {
            src: "/bingo-icon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/bingo-icon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3}"],
        maximumFileSizeToCacheInBytes: 3000000 // 3MB to accommodate mp3s
      }
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        (await import("@replit/vite-plugin-cartographer")).cartographer(),
        (await import("@replit/vite-plugin-dev-banner")).devBanner(),
      ]
      : []),
  ],

  // FRONTEND ROOT
  root: path.resolve(import.meta.dirname, "client"),

  define: {
    "global": "window",
  },

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  // 🔥 IMPORTANT: build directly into /dist
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
