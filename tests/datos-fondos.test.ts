import { describe, expect, it } from "vitest";
import { FONDOS } from "@/datos/fondos";
import {
  coloresDelDegradado,
  contraste,
  desdeHex,
  desdeTrio,
  mezclar,
  MINIMO_TEXTO_NORMAL,
} from "@/lib/contraste";

/* ==========================================================
   LOS FONDOS DE PANTALLA TIENEN QUE SER LEGIBLES
   ==========================================================
   Un fondo no es solo un color lindo: si la tinta no
   acompaña, la app queda inusable con ese fondo puesto.

   Esto lo verificamos a mano en la consola y encontró que
   "Noche" dejaba el texto normal en 3.3 de contraste arriba
   de la pantalla — abajo se leía bien, y por eso a ojo no se
   notaba. Ahora es un test: si alguien agrega un fondo nuevo
   con colores que no se leen, falla acá y no en producción.

   La opacidad de los textos secundarios está copiada de
   --lcd-tinta-suave en estilos/pantalla.css. Si cambia allá,
   cambiala acá.
   ========================================================== */

const OPACIDAD_TEXTO_SUAVE = 0.8;

const cada = Object.entries(FONDOS);

describe.each(cada)("fondo %s", (_id, fondo) => {
  const tinta = desdeTrio(fondo.tinta);
  const contratinta = desdeHex(fondo.contratinta);
  const puntas = coloresDelDegradado(fondo.degradado);

  it("el degradado declara dos colores", () => {
    expect(puntas.length).toBeGreaterThanOrEqual(2);
  });

  it("el texto normal se lee en las dos puntas del degradado", () => {
    for (const punta of puntas) {
      expect(contraste(tinta, punta)).toBeGreaterThanOrEqual(MINIMO_TEXTO_NORMAL);
    }
  });

  it("los textos secundarios también se leen", () => {
    /* Se dibujan con la tinta al 80%, así que hay que medir
       el color ya mezclado con el fondo. */
    for (const punta of puntas) {
      const mezclado = mezclar(tinta, punta, OPACIDAD_TEXTO_SUAVE);
      expect(contraste(mezclado, punta)).toBeGreaterThanOrEqual(MINIMO_TEXTO_NORMAL);
    }
  });

  it("la letra de los botones se lee sobre la pastilla de tinta", () => {
    /* Los botones son una pastilla de tinta llena con la
       letra en contratinta. Este era el bug que se veía como
       "el botón Poner no se lee". */
    expect(contraste(contratinta, tinta)).toBeGreaterThanOrEqual(MINIMO_TEXTO_NORMAL);
  });

  it("lo que escribís en un campo se lee", () => {
    /* Los campos de texto, las tarjetas y los puntitos van
       sobre un parche (--blanco, el color `campo` al 42%) y la
       letra encima es la tinta.

       Ese parche estaba fijo en blanco para los cuatro fondos.
       En los claros aclara y todo bien, pero en Noche dejaba un
       recuadro claro con la tinta clara encima: escribías y no
       veías lo que escribías. */
    for (const punta of puntas) {
      const parche = mezclar(desdeTrio(fondo.campo), punta, 0.42);
      expect(contraste(tinta, parche)).toBeGreaterThanOrEqual(MINIMO_TEXTO_NORMAL);
    }
  });
});

describe("el catálogo de fondos", () => {
  it("el clásico viene gratis", () => {
    expect(FONDOS.clasico?.precio).toBe(0);
  });

  it("todos declaran tinta, contratinta y brillo", () => {
    for (const [id, fondo] of cada) {
      expect(fondo.tinta, `${id} sin tinta`).toBeTruthy();
      expect(fondo.contratinta, `${id} sin contratinta`).toBeTruthy();
      expect(fondo.brillo, `${id} sin brillo`).toBeTruthy();
      expect(fondo.campo, `${id} sin color de campo`).toBeTruthy();
    }
  });
});
