import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  bucketsGrafico, diasDeEstaSemana, diasDelMes, fechaComoTexto, fechaDeHoy,
  nombreCortoDelDia, nombreDelMes, rangoVisibleDelMes, ultimosSieteDias,
} from "@/lib/fechas";

/* ==========================================================
   EL MANEJO DE LOS DÍAS
   ==========================================================
   fechas.ts se abre diciendo que acá vive "uno de los errores
   más comunes y más difíciles de encontrar de toda la
   programación", y cierra prometiendo: "Hay un test que lo
   cuida: tests/fechas.test.ts".

   Ese archivo no existía. Este es.

   El error que cuida: sacar la fecha con toISOString() da la
   hora de Londres. Un vaso de agua registrado a las 22:00 de
   un lunes en Argentina se guardaría en el martes, porque allá
   ya es la 01:00 del día siguiente. Solo falla de noche, así
   que a ojo es casi imposible de ver.
   ========================================================== */

/* Los nombres de mes salen del diccionario, así que el idioma
   se fija a mano: si no, el test depende del idioma de la
   máquina donde corre (jsdom dice "en-US") y falla en una
   compu y pasa en otra. */
beforeEach(() => localStorage.setItem("habitotchi_idioma", "es"));

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("fechaComoTexto", () => {
  it("usa la fecha LOCAL, no la de Londres", () => {
    /* 22:00 del 13 de agosto en Buenos Aires (UTC-3). En UTC
       eso ya es la 01:00 del 14. La fecha correcta es el 13. */
    const nocheEnBuenosAires = new Date(2026, 7, 13, 22, 0, 0);

    expect(fechaComoTexto(nocheEnBuenosAires)).toBe("2026-08-13");
    /* Y para que quede claro cuál es la trampa que se evita: */
    expect(fechaComoTexto(nocheEnBuenosAires)).not.toBe(
      nocheEnBuenosAires.toISOString().split("T")[0]
    );
  });

  it("rellena con cero el mes y el día de un dígito", () => {
    expect(fechaComoTexto(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("enero es el mes 1, no el 0", () => {
    /* getMonth() devuelve 0 para enero: el +1 es fácil de
       olvidar y el error corre todo un mes. */
    expect(fechaComoTexto(new Date(2026, 0, 15))).toBe("2026-01-15");
    expect(fechaComoTexto(new Date(2026, 11, 15))).toBe("2026-12-15");
  });

  it("el último día del año no se pasa al siguiente", () => {
    expect(fechaComoTexto(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("el 29 de febrero de un año bisiesto existe", () => {
    expect(fechaComoTexto(new Date(2028, 1, 29))).toBe("2028-02-29");
  });
});

describe("fechaDeHoy", () => {
  it("da la fecha local aunque sea de noche", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 13, 23, 30, 0));

    expect(fechaDeHoy()).toBe("2026-08-13");
  });

  it("tiene el formato AAAA-MM-DD", () => {
    expect(fechaDeHoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("ultimosSieteDias", () => {
  it("son siete, en orden, y el último es hoy", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 13, 12, 0, 0));

    const dias = ultimosSieteDias();

    expect(dias).toHaveLength(7);
    expect(dias[6]?.texto).toBe("2026-08-13");
    expect(dias[0]?.texto).toBe("2026-08-07");
    expect(dias[6]?.esHoy).toBe(true);
    expect(dias.filter((d) => d.esHoy)).toHaveLength(1);
  });

  it("cruza el cambio de mes sin saltearse días", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 2, 12, 0, 0)); // 2 de septiembre

    const dias = ultimosSieteDias();

    expect(dias[0]?.texto).toBe("2026-08-27");
    expect(dias[6]?.texto).toBe("2026-09-02");
  });
});

describe("diasDelMes", () => {
  it("siempre devuelve 6 semanas de 7 días", () => {
    /* La grilla no puede cambiar de alto al pasar de mes: si lo
       hiciera, el calendario "saltaría" y marea. */
    for (const mes of [0, 1, 5, 11]) {
      const semanas = diasDelMes(2026, mes);
      expect(semanas, `mes ${mes}`).toHaveLength(6);
      for (const semana of semanas) expect(semana).toHaveLength(7);
    }
  });

  it("marca cuáles son del mes y cuáles del anterior o siguiente", () => {
    const dias = diasDelMes(2026, 7).flat();
    const delMes = dias.filter((d) => d.esDeEsteMes);

    expect(delMes).toHaveLength(31); // agosto
    expect(delMes[0]?.texto).toBe("2026-08-01");
    expect(delMes[30]?.texto).toBe("2026-08-31");
  });

  it("febrero bisiesto tiene 29 días", () => {
    const delMes = diasDelMes(2028, 1).flat().filter((d) => d.esDeEsteMes);
    expect(delMes).toHaveLength(29);
  });

  it("las fechas de la grilla van siempre para adelante", () => {
    const textos = diasDelMes(2026, 7).flat().map((d) => d.texto);
    const ordenadas = [...textos].sort();
    expect(textos).toEqual(ordenadas);
  });
});

describe("rangoVisibleDelMes", () => {
  it("cubre exactamente lo que la grilla dibuja", () => {
    const dias = diasDelMes(2026, 7).flat();
    const { desde, hasta } = rangoVisibleDelMes(2026, 7);

    expect(desde).toBe(dias[0]?.texto);
    expect(hasta).toBe(dias[dias.length - 1]?.texto);
  });
});

describe("diasDeEstaSemana", () => {
  it("son siete y arrancan en lunes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 13, 12, 0, 0)); // jueves

    const semana = diasDeEstaSemana();

    expect(semana).toHaveLength(7);
    expect(semana[0]?.inicial).toBe("L");
    expect(semana[6]?.inicial).toBe("D");
  });

  it("un domingo sigue perteneciendo a la semana que arrancó el lunes", () => {
    /* El caso que rompe si se usa getDay() sin corregir: para
       JavaScript el domingo es 0, o sea el "primer" día. */
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 16, 12, 0, 0)); // domingo

    const semana = diasDeEstaSemana();

    expect(semana[0]?.texto).toBe("2026-08-10"); // lunes
    expect(semana[6]?.texto).toBe("2026-08-16"); // el domingo mismo
    expect(semana[6]?.esHoy).toBe(true);
  });
});

describe("nombreCortoDelDia y nombreDelMes", () => {
  it("las iniciales no repiten martes y miércoles", () => {
    /* Por eso miércoles es X: si fuera M, habría dos columnas
       iguales en el calendario. */
    expect(nombreCortoDelDia(new Date(2026, 7, 11))).toBe("M"); // martes
    expect(nombreCortoDelDia(new Date(2026, 7, 12))).toBe("X"); // miércoles
  });

  it("nombreDelMes devuelve el mes correcto", () => {
    expect(nombreDelMes(0)).toBe("enero");
    expect(nombreDelMes(7)).toBe("agosto");
    expect(nombreDelMes(11)).toBe("diciembre");
  });

  it("nombreDelMes no explota con un número fuera de rango", () => {
    /* noUncheckedIndexedAccess obliga al ?? "" del código; esto
       lo deja fijado por si alguien lo saca. */
    expect(nombreDelMes(12)).toBe("");
    expect(nombreDelMes(-1)).toBe("");
  });
});

describe("bucketsGrafico", () => {
  it("semana da 7 baldes de un día cada uno", () => {
    const baldes = bucketsGrafico("semana");
    expect(baldes).toHaveLength(7);
    for (const b of baldes) expect(b.desde).toBe(b.hasta);
  });

  it("mes da 4 baldes de una semana", () => {
    expect(bucketsGrafico("mes")).toHaveLength(4);
  });

  it("año da 12 baldes de un mes", () => {
    expect(bucketsGrafico("anio")).toHaveLength(12);
  });

  it("los baldes van en orden y no se pisan entre sí", () => {
    for (const rango of ["semana", "mes", "anio"] as const) {
      const baldes = bucketsGrafico(rango);
      for (let i = 1; i < baldes.length; i++) {
        expect(baldes[i]!.desde > baldes[i - 1]!.hasta, `${rango}, balde ${i}`).toBe(true);
      }
    }
  });
});
