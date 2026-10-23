import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works under chrome-extension://
  base: "./",
  server: {
    // The API sends no CORS headers; in dev, proxy it through Vite.
    // The built extension calls it directly via host_permissions.
    proxy: {
      "/api": {
        target: "https://spacetelescopelive.org",
        changeOrigin: true,
      },
    },
  },
});
