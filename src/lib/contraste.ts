/* ==========================================================
   HABITOTCHI · medir contraste
   ==========================================================
   Cuánto se distingue un color de otro, según la fórmula de
   las pautas de accesibilidad (WCAG). Da un número del 1 al
   21:

     1     los dos colores son idénticos, no se lee nada
     4.5   el mínimo para texto normal
     7     cómodo

   Está acá y no solo en los tests porque es la regla que
   decide si un fondo de pantalla nuevo es usable. Hoy la
   corrimos a mano en la consola y encontró que el fondo
   "Noche" dejaba el texto en 3.3: ilegible arriba de la
   pantalla, aunque abajo se leyera bien.
   ========================================================== */

export interface Color {
  r: number;
  g: number;
  b: number;
}

export const MINIMO_TEXTO_NORMAL = 4.5;
export const MINIMO_TEXTO_GRANDE = 3;

/* "#4a5488" -> {r, g, b} */
export function desdeHex(hex: string): Color {
  const limpio = hex.replace("#", "");
  const corto = limpio.length === 3;

  const parte = (i: number) =>
    corto
      ? parseInt(limpio[i]! + limpio[i]!, 16)
      : parseInt(limpio.slice(i * 2, i * 2 + 2), 16);

  return { r: parte(0), g: parte(1), b: parte(2) };
}

/* "232, 238, 255" -> {r, g, b}. Es el formato en el que los
   fondos guardan su tinta, para poder armar transparencias
   desde el CSS. */
export function desdeTrio(trio: string): Color {
  const [r = 0, g = 0, b = 0] = trio.split(",").map((n: any) => Number(n.trim()));
  return { r, g, b };
}

/* Un color semitransparente encima de otro: qué color se ve
   en pantalla al final. Hace falta porque los textos
   secundarios se dibujan con la tinta al 80%. */
export function mezclar(encima: Color, debajo: Color, opacidad: number): Color {
  return {
    r: encima.r * opacidad + debajo.r * (1 - opacidad),
    g: encima.g * opacidad + debajo.g * (1 - opacidad),
    b: encima.b * opacidad + debajo.b * (1 - opacidad),
  };
}

function luminancia({ r, g, b }: Color): number {
  const canal = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: Color, b: Color): number {
  const la = luminancia(a);
  const lb = luminancia(b);

  const claro = Math.max(la, lb);
  const oscuro = Math.min(la, lb);

  return (claro + 0.05) / (oscuro + 0.05);
}

/* Las dos puntas de un degradado lineal. Un fondo puede
   leerse bien abajo y pésimo arriba, así que hay que mirar
   las dos: es exactamente lo que pasaba con "Noche". */
export function coloresDelDegradado(degradado: string): Color[] {
  const encontrados = degradado.match(/#[0-9a-fA-F]{3,6}/g) ?? [];
  return encontrados.map(desdeHex);
}
