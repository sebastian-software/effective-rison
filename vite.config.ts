import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "docs"),
  build: {
    outDir: path.resolve(__dirname, "site"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "docs/index.html")
    }
  },
  plugins: [viteSingleFile()],
  resolve: {
    alias: {
      "@effective/rison": path.resolve(__dirname, "src/rison.ts")
    }
  }
});
