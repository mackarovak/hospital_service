import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["medcat-team1.213-165-209-28.nip.io", "144.124.240.63"],
  },
});
