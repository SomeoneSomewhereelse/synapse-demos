// Builds the review demos from a synapse-techability-2026 checkout.
// Copy this folder into the checkout as artifact-demo/, then run
//   OUT_DIR=<out> npx vite build --config artifact-demo/vite.config.mjs
// and delete the folder again. See ../README.md.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react()],
  define: { __APP_COMMIT__: JSON.stringify("demo") },
  build: {
    outDir: process.env.OUT_DIR,
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        "sheet-calc": resolve(__dirname, "sheet-calc.html"),
        presentation: resolve(__dirname, "presentation.html"),
      },
    },
  },
});
