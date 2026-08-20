import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      "next/image": resolve(__dirname, "NextImage.tsx"),
    },
  },
  build: {
    outDir: resolve(__dirname, "../vercel-dist"),
    emptyOutDir: true,
  },
  publicDir: resolve(__dirname, "../public"),
});
