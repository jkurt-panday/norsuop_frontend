import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const frontendHost = env.CLOUDFLARE_FRONTEND_HOST;
  const allowedHosts = frontendHost ? [frontendHost] : [];
  const backendTarget = env.VITE_DEV_BACKEND_URL || "http://127.0.0.1:8000";

  return {
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      // Set CLOUDFLARE_FRONTEND_HOST to the current Quick Tunnel hostname.
      allowedHosts,
      // Keep browser requests same-origin so Sanctum cookies and CSRF tokens
      // belong to the frontend tunnel origin. Vite forwards them to Laravel.
      proxy: {
        "/api": { target: backendTarget, changeOrigin: true, secure: false },
        "/sanctum": { target: backendTarget, changeOrigin: true, secure: false },
        "/login": { target: backendTarget, changeOrigin: true, secure: false },
        "/logout": { target: backendTarget, changeOrigin: true, secure: false },
        "/forgot-password": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        "/reset-password": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      pool: "threads",
      exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    },
  };
});
