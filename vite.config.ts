import vue from "@vitejs/plugin-vue";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "src", "renderer"),
  base: "./",
  plugins: [vue()],
  build: {
    outDir: path.resolve(__dirname, "dist", "assets"),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src", "renderer"),
      "@shared": path.resolve(__dirname, "src", "shared")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
