import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { iconsSpritesheet } from "vite-plugin-icons-spritesheet";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),

    iconsSpritesheet({
      inputDir: "./other/svg-icons",
      outputDir: "./src/components/ui/icons",
      fileName: "sprite.svg",
      withTypes: true,
      iconNameTransformer: (name) => name,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
