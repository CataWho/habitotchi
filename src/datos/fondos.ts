import type { Fondo } from "@/tipos";

/* ==========================================================
   HABITOTCHI · los fondos de pantalla
   ==========================================================
   Cambian el color de la pantallita LCD.

   ---------- CADA FONDO TRAE SU TINTA ----------
   No alcanza con cambiar el degradado: si la tinta no
   acompana, el fondo "Noche" queda con texto oscuro sobre
   azul oscuro y no se lee nada.

     tinta       · color de las letras y los bordes, en tres
                   canales sueltos para armar transparencias
     contratinta · para escribir ENCIMA de la tinta (los
                   botones son una pastilla de tinta llena)
     brillo      · el resplandor del LCD encendido

   tests/datos-fondos.test.ts verifica que los cuatro pasen
   el minimo de contraste legible.
   ========================================================== */

export const FONDOS: Record<string, Fondo> = {
  clasico: {
    nombre: "Clásico",
    precio: 0,
    degradado: "linear-gradient(180deg, #d5e878 0%, #c3d94f 100%)",
    tinta: "22, 36, 10",
    contratinta: "#cbf265",
    brillo: "rgba(185, 234, 61, 0.28)",
  },
  atardecer: {
    nombre: "Atardecer",
    precio: 70,
    degradado: "linear-gradient(180deg, #ffd6a5 0%, #f5a3a3 100%)",
    /* Bordó bien oscuro. Estaba en "88, 30, 34" y los textos
       secundarios daban 4.38 sobre el rosa del final del
       degradado: por debajo del mínimo legible. Solo se notaba
       abajo de la pantalla, que es donde el fondo se oscurece. */
    tinta: "70, 24, 27",
    contratinta: "#ffe4c4",
    brillo: "rgba(245, 163, 163, 0.32)",
  },
  noche: {
    nombre: "Noche",
    precio: 90,
    degradado: "linear-gradient(180deg, #4a5488 0%, #232a4a 100%)",
    tinta: "232, 238, 255",
    contratinta: "#2b3358",
    brillo: "rgba(90, 104, 168, 0.34)",
  },
  algodon: {
    nombre: "Algodón",
    precio: 70,
    degradado: "linear-gradient(180deg, #ffd9f0 0%, #d5b8ee 100%)",
    tinta: "74, 30, 78",
    contratinta: "#ffe0f4",
    brillo: "rgba(213, 184, 238, 0.34)",
  },
};
