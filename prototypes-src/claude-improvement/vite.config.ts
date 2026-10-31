import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Default: a folder (prototype.html + assets/ + public files) that works under any
// sub-path, e.g. /prototypes/streamladder-editor-ref/ on the Hub.
// `--mode single`: one JS bundle without lazy chunks, input for scripts/build-single-html.mjs
// (a self-contained HTML file that opens from disk).
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  build: {
    outDir: mode === "single" ? "dist-single" : "dist",
    emptyOutDir: true,
    cssCodeSplit: mode !== "single",
    assetsInlineLimit: mode === "single" ? 100_000_000 : undefined,
    rollupOptions: {
      input: mode === "single" ? { prototype: resolve(__dirname, "prototype.html") }
        : { prototype: resolve(__dirname, "prototype.html"), "sticker-sheet": resolve(__dirname, "sticker-sheet.html") },
      output: mode === "single" ? { inlineDynamicImports: true } : undefined
    }
  },
  preview: { port: 4317, strictPort: true }
}));
