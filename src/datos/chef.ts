/* ==========================================================
   HABITOTCHI · el dibujo del chef
   ==========================================================
   El cocinero que mira tus fotos de comida. Mismo sistema de
   pixeles que las mascotas: una fila por string, una letra
   por pixel, "." transparente.

     G  el gorro
     P  la piel
     O  los ojos y el contorno del gorro
     B  el blanco del bigote y la chaqueta
     R  la boca
   ========================================================== */

export const CHEF_COLORES: Record<string, string> = {
  G: "#fdf9ff",
  P: "#f6c9a0",
  O: "#3a2a1c",
  B: "#ffffff",
  R: "#c47070",
};

export const CHEF_PIXELES = [
  "....GGGGGG....",
  "..GGGGGGGGGG..",
  ".GGGGGGGGGGGG.",
  ".GGGGGGGGGGGG.",
  "..GGGGGGGGGG..",
  "...GGGGGGGG...",
  "...OOOOOOOO...",
  "...PPPPPPPP...",
  "..PPPPPPPPPP..",
  "..PPOPPPPOPP..",
  "..PPPPPPPPPP..",
  "..PPPPPPPPPP..",
  "..PBBBBBBBBP..",
  "..PBBBRRBBBP..",
  "...PPPPPPPP...",
  "....PPPPPP....",
  "..BBBBBBBBBB..",
  ".BBBBBBBBBBBB.",
  ".BBOBBBBBBOBB.",
  ".BBBBBBBBBBBB.",
  ".BBBBBBBBBBBB.",
];
