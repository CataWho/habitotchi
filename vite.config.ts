/* defineConfig sale de vitest/config y no de vite, porque es el
   que además entiende la sección "test" de acá abajo. */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),

    /* ----------------------------------------------------------
       EL SERVICE WORKER, GENERADO SOLO
       ----------------------------------------------------------
       Reemplaza al sw.js escrito a mano, que tenía un número de
       versión que había que subir a mano en cada cambio. Si te
       olvidabas (y pasaba), el navegador seguía sirviendo los
       archivos viejos y parecía que los arreglos no funcionaban.

       Acá el nombre de cada archivo lleva un hash de su
       contenido: si cambia el contenido, cambia el nombre, y el
       navegador no tiene forma de servir el viejo.
       ---------------------------------------------------------- */
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icono-192.png", "icono-512.png", "icono-512-recortable.png"],
      manifest: {
        name: "Habitotchi",
        short_name: "Habitotchi",
        description: "Tus hábitos, cuidando a tu mascota.",
        lang: "es-AR",
        start_url: ".",
        display: "standalone",
        background_color: "#161233",
        theme_color: "#b47fe8",
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png" },
          { src: "icono-512-recortable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        /* Lo nuestro se guarda para andar sin internet. Lo de
           afuera (tapas de libros, Gemini, Google Calendar) va
           siempre a la red: son datos que cambian. */
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tapas-de-libros",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/is[0-9]-ssl\.mzstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tapas-de-discos",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/preparar.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
