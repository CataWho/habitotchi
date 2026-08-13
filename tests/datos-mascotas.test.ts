import { describe, expect, it } from "vitest";
import type { Etapa } from "@/tipos";
import { MASCOTAS } from "@/datos/mascotas";
import { CARAS } from "@/datos/caras";
import { ACCESORIOS } from "@/datos/accesorios";

/* ==========================================================
   LOS DIBUJOS DE LAS MASCOTAS
   ==========================================================
   Estos chequeos nacieron a mano, en la consola del
   navegador, y encontraron tres bugs que a ojo no se veían:

     · dinosaurio/joven tenía una fila de 15 caracteres en vez
       de 14, lo que deforma todo el dibujo
     · al conejito le quedaba la colita como un cuadradito
       suelto, despegado del cuerpo
     · las orejas del conejito y las púas del dino estaban
       corridas un pixel a la izquierda del cuerpo

   Acá quedan como tests para que no vuelvan a pasar.
   ========================================================== */

const ETAPAS: Etapa[] = ["bebe", "joven", "adulto"];
const ANCHO_CARA = 8;
const ALTO_CARA = 4;

/* Recorre las 18 combinaciones (6 mascotas x 3 etapas) */
function cadaDibujo(): [string, Etapa, (typeof MASCOTAS)[string]][] {
  const todos: [string, Etapa, (typeof MASCOTAS)[string]][] = [];

  for (const [id, mascota] of Object.entries(MASCOTAS)) {
    for (const etapa of ETAPAS) todos.push([id, etapa, mascota]);
  }

  return todos;
}

describe.each(cadaDibujo())("%s / %s", (_id, etapa, mascota) => {
  const dibujo = mascota.etapas[etapa];
  const alto = dibujo.pixeles.length;
  const ancho = dibujo.pixeles[0]?.length ?? 0;

  it("todas las filas miden lo mismo", () => {
    const largos = [...new Set(dibujo.pixeles.map((f) => f.length))];
    expect(largos).toEqual([ancho]);
  });

  it("la carita entra en el lienzo", () => {
    expect(dibujo.cara.x + ANCHO_CARA).toBeLessThanOrEqual(ancho);
    expect(dibujo.cara.y + ALTO_CARA).toBeLessThanOrEqual(alto);
  });

  it("la carita cae sobre el cuerpo, no sobre el vacío", () => {
    const enElVacio: string[] = [];

    for (let f = 0; f < ALTO_CARA; f++) {
      for (let c = 0; c < ANCHO_CARA; c++) {
        const fila = dibujo.pixeles[dibujo.cara.y + f];
        if (fila?.[dibujo.cara.x + c] === ".") {
          enElVacio.push(`${dibujo.cara.x + c},${dibujo.cara.y + f}`);
        }
      }
    }

    expect(enElVacio).toEqual([]);
  });

  it("todas las letras están en la paleta", () => {
    const sinColor = new Set<string>();

    for (const fila of dibujo.pixeles) {
      for (const letra of fila) {
        if (letra !== "." && !(letra in mascota.colores)) sinColor.add(letra);
      }
    }

    expect([...sinColor]).toEqual([]);
  });

  it("no hay pixeles sueltos", () => {
    /* Un pixel sin ningún vecino pegado es casi siempre un
       error de dedo: se ve como una manchita flotando al lado
       del bicho. Así cazamos la colita despegada del conejo. */
    const lleno = (y: number, x: number) =>
      y >= 0 && y < alto && x >= 0 && x < ancho && dibujo.pixeles[y]?.[x] !== "." &&
      dibujo.pixeles[y]?.[x] !== undefined;

    const sueltos: string[] = [];

    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        if (!lleno(y, x)) continue;

        const vecinos =
          Number(lleno(y - 1, x)) + Number(lleno(y + 1, x)) +
          Number(lleno(y, x - 1)) + Number(lleno(y, x + 1));

        if (vecinos === 0) sueltos.push(`${x},${y}`);
      }
    }

    expect(sueltos).toEqual([]);
  });

  it("el dibujo está centrado en el lienzo", () => {
    /* El centro de masa horizontal tiene que dar cerca del
       medio. Si da corrido, es que las orejas (o las púas, o
       las alas) quedaron desalineadas del cuerpo. */
    let suma = 0;
    let cantidad = 0;

    for (const fila of dibujo.pixeles) {
      [...fila].forEach((ch, x) => {
        if (ch !== ".") {
          suma += x;
          cantidad++;
        }
      });
    }

    const centro = suma / cantidad;
    const medio = (ancho - 1) / 2;

    expect(Math.abs(centro - medio)).toBeLessThanOrEqual(0.35);
  });
});

describe("las medidas crecen con la etapa", () => {
  it.each(Object.keys(MASCOTAS))("%s crece de bebé a adulta", (id) => {
    const mascota = MASCOTAS[id]!;
    const medidas = ETAPAS.map((e) => ({
      ancho: mascota.etapas[e].pixeles[0]?.length ?? 0,
      alto: mascota.etapas[e].pixeles.length,
    }));

    const [bebe, joven, adulto] = medidas as [
      (typeof medidas)[0], (typeof medidas)[0], (typeof medidas)[0]
    ];

    expect(joven.ancho).toBeGreaterThan(bebe.ancho);
    expect(joven.alto).toBeGreaterThan(bebe.alto);
    expect(adulto.ancho).toBeGreaterThan(joven.ancho);
    expect(adulto.alto).toBeGreaterThan(joven.alto);
  });

  it("las seis mascotas usan las mismas medidas", () => {
    /* Si una se sale de la grilla, en la tienda queda una
       tarjeta más grande que las otras y se nota. */
    for (const etapa of ETAPAS) {
      const medidas = new Set(
        Object.values(MASCOTAS).map(
          (m) => `${m.etapas[etapa].pixeles[0]?.length}x${m.etapas[etapa].pixeles.length}`
        )
      );
      expect([...medidas]).toHaveLength(1);
    }
  });
});

describe("las caritas", () => {
  it.each(Object.keys(CARAS))("%s mide 8x4", (animo) => {
    const cara = CARAS[animo as keyof typeof CARAS];

    expect(cara).toHaveLength(ALTO_CARA);
    for (const fila of cara) expect(fila).toHaveLength(ANCHO_CARA);
  });
});

describe("los accesorios", () => {
  it.each(cadaDibujo().flatMap(([id, etapa]) =>
    Object.keys(ACCESORIOS).map((acc) => [id, etapa, acc] as const)
  ))("%s / %s con %s entra y toca la cabeza", (id, etapa, idAccesorio) => {
    const dibujo = MASCOTAS[id]!.etapas[etapa];
    const accesorio = ACCESORIOS[idAccesorio]!;

    const alto = dibujo.pixeles.length;
    const ancho = dibujo.pixeles[0]?.length ?? 0;
    const x0 = dibujo.cara.x + accesorio.desdeCara.x;
    const y0 = dibujo.cara.y + accesorio.desdeCara.y;

    let fuera = 0;
    let sobreCuerpo = 0;

    for (let f = 0; f < accesorio.pixeles.length; f++) {
      const filaAcc = accesorio.pixeles[f] ?? "";

      for (let c = 0; c < filaAcc.length; c++) {
        if (filaAcc[c] === ".") continue;

        const y = y0 + f;
        const x = x0 + c;

        if (y < 0 || y >= alto || x < 0 || x >= ancho) {
          fuera++;
          continue;
        }
        if (dibujo.pixeles[y]?.[x] !== ".") sobreCuerpo++;
      }
    }

    expect(fuera, "se sale del lienzo").toBe(0);
    expect(sobreCuerpo, "queda flotando sin tocar la cabeza").toBeGreaterThan(0);
  });
});
