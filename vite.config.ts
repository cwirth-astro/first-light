import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works under chrome-extension://
  base: "./",
  server: {
    // These APIs send no CORS headers; in dev, proxy them through Vite.
    // The built extension calls them directly via host_permissions.
    proxy: {
      "/api": {
        target: "https://spacetelescopelive.org",
        changeOrigin: true,
      },
      "/obsloctap": {
        target: "https://usdf-rsp.slac.stanford.edu",
        changeOrigin: true,
      },
      "/gcal": {
        target: "https://calendar.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gcal/, ""),
      },
    },
  },
});
