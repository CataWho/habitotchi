import { describe, it, expect } from "vitest";
import { CALORIAS_COMUNES, buscarCaloriaComun, estimarCaloriasDeTexto } from "@/lib/ia";

/* ==========================================================
   EL DICCIONARIO DE CALORÍAS
   ==========================================================
   Un solo diccionario con español e inglés mezclados, sin
   mirar en qué idioma está la app: la comida no respeta los
   idiomas. Alguien con la app en inglés viviendo acá escribe
   "milanesa" igual, y alguien en español escribe "muffin".

   El riesgo de mezclarlos son las palabras cortas que
   significan cosas distintas en cada idioma — el caso testigo
   es "pan", que en inglés es una sartén. Eso lo cuida el
   criterio de quedarse con la coincidencia MÁS LARGA, y hay
   un test abajo que lo fija.
   ========================================================== */

describe("busca en los dos idiomas", () => {
  it("encuentra comida en español", () => {
    for (const palabra of ["milanesa", "empanada", "asado", "choripan", "mate"]) {
      expect(buscarCaloriaComun(palabra), palabra).not.toBeNull();
    }
  });

  it("encuentra comida en inglés", () => {
    for (const palabra of ["chicken", "salmon", "oatmeal", "burger", "smoothie"]) {
      expect(buscarCaloriaComun(palabra), palabra).not.toBeNull();
    }
  });

  it("no le importa el idioma de la app: encuentra las dos aunque escribas mezclado", () => {
    /* Lo que de verdad pasa cuando alguien vive acá y tiene el
       teléfono en inglés. */
    expect(buscarCaloriaComun("chicken con ensalada")).not.toBeNull();
    expect(buscarCaloriaComun("milanesa with fries")).not.toBeNull();
  });

  it("lo mismo en los dos idiomas cuesta lo mismo", () => {
    /* Si "pollo" y "chicken" dieran números distintos, tus
       calorías dependerían de en qué idioma lo escribiste. */
    const pares: [string, string][] = [
      ["pollo", "chicken"], ["arroz", "rice"], ["queso", "cheese"],
      ["huevo", "egg"], ["sopa", "soup"], ["helado", "ice cream"],
      ["manzana", "apple"], ["tomate", "tomato"],
    ];

    for (const [es, en] of pares) {
      expect(CALORIAS_COMUNES[en], `${es} vs ${en}`).toBe(CALORIAS_COMUNES[es]);
    }
  });
});

describe("la coincidencia más larga gana", () => {
  it('"dulce de leche" no se confunde con "leche"', () => {
    expect(buscarCaloriaComun("dulce de leche")?.nombre).toBe("dulce de leche");
  });

  it('"ice cream" no se queda en "cream" ni en otra parcial', () => {
    expect(buscarCaloriaComun("ice cream")?.nombre).toBe("ice cream");
  });

  it('"sweet potato" gana sobre "potato"', () => {
    expect(buscarCaloriaComun("sweet potato")?.nombre).toBe("sweet potato");
  });

  it('"french fries" gana sobre "fries"', () => {
    expect(buscarCaloriaComun("french fries")?.nombre).toBe("french fries");
  });

  it("REGRESIÓN: una frase larga en inglés no cae en la palabra corta", () => {
    /* "chicken in a pan" contiene "pan", que en español es
       comida. Como "chicken" es más largo, gana — y por eso
       no se suman más palabras cortas ambiguas al
       diccionario. */
    expect(buscarCaloriaComun("chicken in a pan")?.nombre).toBe("chicken");
  });
});

describe("no encuentra lo que no está", () => {
  it("devuelve null con algo que no es comida", () => {
    expect(buscarCaloriaComun("xyzabc")).toBeNull();
    expect(estimarCaloriasDeTexto("xyzabc")).toBeNull();
  });
});

describe("las cantidades multiplican", () => {
  it("dos empanadas valen el doble que una", () => {
    const una = estimarCaloriasDeTexto("empanada");
    const dos = estimarCaloriasDeTexto("2 empanadas");

    expect(una).not.toBeNull();
    expect(dos!.calorias).toBe(una!.calorias * 2);
  });

  it("funciona igual escribiendo en inglés", () => {
    const uno = estimarCaloriasDeTexto("burger");
    const tres = estimarCaloriasDeTexto("3 burgers");

    expect(uno).not.toBeNull();
    expect(tres!.calorias).toBe(uno!.calorias * 3);
  });
});

describe("el diccionario está sano", () => {
  it("ninguna entrada tiene calorías negativas", () => {
    for (const [nombre, kcal] of Object.entries(CALORIAS_COMUNES)) {
      expect(kcal, nombre).toBeGreaterThanOrEqual(0);
    }
  });

  it("todas las claves están en minúscula", () => {
    /* El buscador compara contra texto ya pasado a minúscula:
       una clave con mayúscula no se encontraría nunca. */
    for (const nombre of Object.keys(CALORIAS_COMUNES)) {
      expect(nombre, nombre).toBe(nombre.toLowerCase());
    }
  });

  it("no hay claves de menos de 3 letras", () => {
    /* Las palabras muy cortas hacen falsos positivos adentro
       de otras palabras. */
    for (const nombre of Object.keys(CALORIAS_COMUNES)) {
      expect(nombre.length, nombre).toBeGreaterThanOrEqual(3);
    }
  });
});
