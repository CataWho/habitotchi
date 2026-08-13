import type { Animo } from "@/tipos";

/* ==========================================================
   HABITOTCHI · las caritas y el fantasmita
   ==========================================================
   La carita se estampa ENCIMA del dibujo de la mascota, en
   la posicion que cada etapa indica en su "cara". Por eso es
   una sola de 8x4 y sirve para las seis mascotas.

     O la tinta del ojo y la boca
     B el brillito del ojo

   El animo "muerta" solo aparece en la animacion de
   despedida.
   ========================================================== */

export const CARAS: Record<Animo, string[]> = {
  feliz: [
    "OO....OO",
    ".O....O.",
    ".O....O.",
    "..OOOO..",
  ],
  normal: [
    ".OO..OO.",
    ".OB..OB.",
    "........",
    "...OO...",
  ],
  triste: [
    ".OO..OO.",
    ".O...O..",
    "..OOOO..",
    ".O....O.",
  ],
  muerta: [
    "O.O..O.O",
    ".O....O.",
    "........",
    "..OOOO..",
  ],
};
