/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true
  },
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
      },
      manifest: {
        name: "Orfanatos NIB",
        short_name: "Orfanatos NIB",
        description: "Orfanatos NIB",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  envDir: "env",
  resolve: {
    alias: {
      "@": "/src",
      components: "/src/components",
      pages: "/src/pages",
      store: "/src/store",
      config: "/src/config",
      utils: "/src/utils",
      common: "/src/common"
    }
  },
  define: { "process.env": {} },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "e2e/live/support/**/*.test.ts"],
    css: false,
    // Piso de cobertura da lógica pura compartilhada (plano 03): 100% nos 5 utils.
    coverage: {
      provider: "v8",
      include: [
        "src/utils/dateUtils.ts",
        "src/utils/masks.ts",
        "src/utils/textUtils.ts",
        "src/utils/validators.ts",
        "src/utils/whatsapp.ts",
      ],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  }
}));
