import type { Accesorio } from "@/tipos";

/* ==========================================================
   HABITOTCHI · los accesorios de la tienda
   ==========================================================
   Se estampan encima de la mascota, igual que las caritas.
   La diferencia es donde: cada uno dice su posicion RELATIVA
   a la cara, asi funciona con cualquier mascota y cualquier
   etapa sin calcular nada a mano.

   Usan letras propias (R, S) para no pisar los colores de la
   mascota.

   Ojo con la altura: una bebe tiene pocas filas arriba de la
   cara, asi que son bajitos a proposito.
   ========================================================== */

export const ACCESORIOS: Record<string, Accesorio> = {
  monio: {
    nombre: "Moño",
    precio: 40,
    colores: { R: "#e0559b", S: "#a83570" },
    desdeCara: { x: 0, y: -2 },
    pixeles: [
      "RR.SS.RR",
      "RRRSSRRR",
    ],
  },
  sombrero: {
    nombre: "Sombrerito",
    precio: 60,
    colores: { R: "#4a4a7a", S: "#2c2c52" },
    desdeCara: { x: 0, y: -2 },
    pixeles: [
      "..RRRR..",
      "SSSSSSSS",
    ],
  },
  lentes: {
    nombre: "Lentes",
    precio: 50,
    colores: { R: "#1c2b12", S: "#8fc0d6" },
    desdeCara: { x: 0, y: 0 },
    pixeles: [
      "RRR..RRR",
      "RSR..RSR",
    ],
  },
  corona: {
    nombre: "Corona",
    precio: 120,
    colores: { R: "#e8c34a", S: "#b8912a" },
    desdeCara: { x: 0, y: -2 },
    pixeles: [
      "R.R.R.R.",
      "RRRRRRRR",
    ],
  },
};
