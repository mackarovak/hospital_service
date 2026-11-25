/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost" },
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  server: {
    allowedHosts: ["medcat-team1.213-165-209-28.nip.io", "144.124.240.63", "frontend"],
    proxy: {
      "/api/v1": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
});
