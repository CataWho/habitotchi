import { describe, it, expect, beforeEach } from "vitest";
import {
  cargarRegistro, fijarHabito, obtenerValor, sumarHabito,
} from "@/lib/registro";

/* ==========================================================
   EL REGISTRO DE HÁBITOS
   ==========================================================
   No había ningún test sobre esto, y ahí se escondió el peor
   bug del proyecto: Alimentación, Ejercicio y Trabajo hacían
   fijarHabito(...) y después sumarHabito(x, 0) "para forzar el
   redibujado". Como fijarHabito no actualizaba el store, ese
   sumar recalculaba desde el registro viejo y volvía a escribir
   el valor anterior, pisando lo recién guardado. Cargar una
   comida no movía la barra ni contaba para el crecimiento.

   El primer test de acá abajo es exactamente esa secuencia.
   ========================================================== */

const HOY = "2026-08-13";

describe("fijarHabito", () => {
  beforeEach(() => localStorage.clear());

  it("deja el hábito en el valor exacto", () => {
    const r = fijarHabito(cargarRegistro(), HOY, "comida", 3);
    expect(obtenerValor(r, HOY, "comida")).toBe(3);
  });

  it("baja el número si el total bajó", () => {
    /* Es la razón de existir de fijarHabito: si borrás una
       comida, el hábito tiene que bajar, no quedarse. */
    let r = fijarHabito(cargarRegistro(), HOY, "comida", 3);
    r = fijarHabito(r, HOY, "comida", 1);
    expect(obtenerValor(r, HOY, "comida")).toBe(1);
  });

  it("nunca baja de cero", () => {
    const r = fijarHabito(cargarRegistro(), HOY, "comida", -5);
    expect(obtenerValor(r, HOY, "comida")).toBe(0);
  });

  it("no pisa los otros hábitos del mismo día", () => {
    let r = sumarHabito(cargarRegistro(), HOY, "agua", 4);
    r = fijarHabito(r, HOY, "comida", 2);

    expect(obtenerValor(r, HOY, "agua")).toBe(4);
    expect(obtenerValor(r, HOY, "comida")).toBe(2);
  });

  it("no pisa los otros días", () => {
    let r = fijarHabito(cargarRegistro(), "2026-08-12", "comida", 3);
    r = fijarHabito(r, HOY, "comida", 1);

    expect(obtenerValor(r, "2026-08-12", "comida")).toBe(3);
    expect(obtenerValor(r, HOY, "comida")).toBe(1);
  });

  it("REGRESIÓN: encadenar desde el registro devuelto no pierde el valor", () => {
    /* La secuencia que rompía. La clave es usar el registro que
       devuelve fijarHabito para lo siguiente, y no uno viejo:
       eso es justo lo que ahora garantiza el store al hacer
       set({ registro: ... }). */
    const r1 = fijarHabito(cargarRegistro(), HOY, "comida", 3);
    const r2 = sumarHabito(r1, HOY, "comida", 0);

    expect(obtenerValor(r2, HOY, "comida")).toBe(3);
    expect(obtenerValor(cargarRegistro(), HOY, "comida")).toBe(3);
  });

  it("lo guardado sobrevive a releer del disco", () => {
    fijarHabito(cargarRegistro(), HOY, "ejercicio", 45);
    expect(obtenerValor(cargarRegistro(), HOY, "ejercicio")).toBe(45);
  });
});

describe("sumarHabito", () => {
  beforeEach(() => localStorage.clear());

  it("suma sobre lo que ya había", () => {
    let r = sumarHabito(cargarRegistro(), HOY, "agua", 3);
    r = sumarHabito(r, HOY, "agua", 2);
    expect(obtenerValor(r, HOY, "agua")).toBe(5);
  });

  it("resta con cantidad negativa, sin bajar de cero", () => {
    let r = sumarHabito(cargarRegistro(), HOY, "agua", 2);
    r = sumarHabito(r, HOY, "agua", -5);
    expect(obtenerValor(r, HOY, "agua")).toBe(0);
  });

  it("devuelve un objeto nuevo, no muta el que recibe", () => {
    /* registro.ts documenta que no muta: con React, mutar y
       devolver lo mismo hace que la pantalla no se redibuje. */
    const antes = cargarRegistro();
    const despues = sumarHabito(antes, HOY, "agua", 1);

    expect(despues).not.toBe(antes);
    expect(obtenerValor(antes, HOY, "agua")).toBe(0);
    expect(obtenerValor(despues, HOY, "agua")).toBe(1);
  });
});
