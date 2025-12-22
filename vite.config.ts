import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Orfanato NIB",
        short_name: "Orfanato NIB",
        description: "Orfanato NIB",
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
  define: { "process.env": {} }
}));
