
/* ==========================================================
   HABITOTCHI · el fantasmita
   ==========================================================
   Sube flotando cuando la mascota se despide. No pertenece
   a ninguna especie: es siempre el mismo.
   ========================================================== */

export const FANTASMA: { colores: Record<string, string>; pixeles: string[] } = {
  colores: { F: "#ffffff", O: "#16240a" },
  pixeles: [
    "..FFFF..",
    ".FFFFFF.",
    "FFFFFFFF",
    "FFOFFOFF",
    "FFOFFOFF",
    "FFFFFFFF",
    "FFFFFFFF",
    "F.FF.FF.",
  ],
};
