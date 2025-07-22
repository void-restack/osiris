import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { iconsSpritesheet } from "vite-plugin-icons-spritesheet";

export default defineConfig({
  build: {
    assetsInlineLimit: (source: string) => {
      if (
        source.endsWith("favicon.svg") ||
        source.endsWith("apple-touch-icon.png")
      ) {
        return false;
      }
    },
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "osiris",
        short_name: "osiris",
        description: "osiris - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: {
        disabled: false,
        config: true,
      },
      devOptions: {
        enabled: true,
      },
    }),
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
