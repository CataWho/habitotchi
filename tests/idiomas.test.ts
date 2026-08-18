import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ES } from "@/idiomas/es";
import { EN } from "@/idiomas/en";
import { idiomaDelDispositivo, traducir } from "@/lib/idioma";

/* ==========================================================
   LOS DOS IDIOMAS
   ==========================================================
   TypeScript ya obliga a que en.ts tenga todas las claves de
   es.ts, pero no puede ver DENTRO de los textos: no sabe si
   una traducción quedó copiada del español, ni si los huecos
   {n} coinciden entre los dos. Eso lo cuidan estos tests.

   El de los huecos es el más importante: si el español dice
   "Faltan {n} días para {etapa}" y el inglés se olvida de
   {etapa}, no falla nada — simplemente desaparece la palabra
   de la pantalla y nadie se entera hasta que lo ve un usuario.
   ========================================================== */

const claves = Object.keys(ES) as (keyof typeof ES)[];

/* Los huecos {asi} que tiene un texto, sin importar el orden:
   el orden CAMBIA entre idiomas a propósito. */
function huecos(valor: unknown): string[] {
  const textos =
    typeof valor === "string"
      ? [valor]
      : [(valor as any).uno, (valor as any).otros];

  const encontrados = new Set<string>();
  for (const texto of textos) {
    for (const coincidencia of String(texto).matchAll(/\{(\w+)\}/g)) {
      if (coincidencia[1]) encontrados.add(coincidencia[1]);
    }
  }
  return [...encontrados].sort();
}

describe("los diccionarios están completos", () => {
  it("tienen exactamente las mismas claves", () => {
    expect(Object.keys(EN).sort()).toEqual(Object.keys(ES).sort());
  });

  it("ninguna traducción está vacía", () => {
    for (const clave of claves) {
      const valor: any = EN[clave];
      const textos = typeof valor === "string" ? [valor] : [valor.uno, valor.otros];
      for (const texto of textos) {
        expect(String(texto).trim(), `${clave} está vacía`).not.toBe("");
      }
    }
  });

  it("los plurales son plurales en los dos idiomas", () => {
    /* Si en español es { uno, otros } y en inglés quedó como
       un string suelto, el traductor elegiría mal la forma. */
    for (const clave of claves) {
      const esPluralEs = typeof ES[clave] === "object";
      const esPluralEn = typeof EN[clave] === "object";
      expect(esPluralEn, `${clave} no coincide en forma`).toBe(esPluralEs);
    }
  });
});

describe("los huecos coinciden", () => {
  it("cada texto usa los mismos {datos} en los dos idiomas", () => {
    const distintos: string[] = [];

    for (const clave of claves) {
      const enEs = huecos(ES[clave]);
      const enEn = huecos(EN[clave]);
      if (enEs.join() !== enEn.join()) {
        distintos.push(`${clave}: es=[${enEs}] en=[${enEn}]`);
      }
    }

    expect(distintos, "estos textos perderían un dato al traducirse").toEqual([]);
  });
});

describe("nada quedó sin traducir", () => {
  /* Claves que a propósito son iguales en los dos idiomas:
     nombres propios, unidades internacionales y ejemplos que
     no son palabras. */
  const IGUALES_A_PROPOSITO = new Set([
    "pong", "kcal", "km", "cardio", "series", "album", "artista",
    "unidadMin", "ejemploHorarios", "googleCalendar", "grupoCore",
    "fuerzaHipThrust", "animoNormal", "hobbySeries",
    /* Palabras que el español tomó prestadas del inglés y se
       escriben igual en los dos. */
    "pantallaHobbies", "cardioRunning",
  ]);

  it("ninguna traducción es idéntica al español sin motivo", () => {
    const copiadas: string[] = [];

    for (const clave of claves) {
      if (IGUALES_A_PROPOSITO.has(clave)) continue;

      const a = typeof ES[clave] === "string" ? ES[clave] : (ES[clave] as any).otros;
      const b = typeof EN[clave] === "string" ? EN[clave] : (EN[clave] as any).otros;

      if (String(a) === String(b)) copiadas.push(clave);
    }

    expect(copiadas, "estas quedaron en español").toEqual([]);
  });

  it("las listas de fechas tienen la cantidad justa", () => {
    for (const [idioma, textos] of [["es", ES], ["en", EN]] as const) {
      expect(textos.meses.split(","), `${idioma}: meses`).toHaveLength(12);
      expect(textos.inicialesSemana.split(","), `${idioma}: días`).toHaveLength(7);
    }
  });

  it("las iniciales de los días no se repiten dentro de un idioma", () => {
    /* Por esto en español miércoles es X y no M, y en inglés
       hacen falta dos letras para Tuesday/Thursday. */
    for (const [idioma, textos] of [["es", ES], ["en", EN]] as const) {
      const iniciales = textos.inicialesSemana.split(",");
      expect(new Set(iniciales).size, `${idioma}: hay iniciales repetidas`).toBe(7);
    }
  });
});

describe("traducir", () => {
  it("devuelve el texto del idioma pedido", () => {
    expect(traducir("es", "guardar")).toBe("Guardar");
    expect(traducir("en", "guardar")).toBe("Save");
  });

  it("rellena los huecos", () => {
    expect(traducir("es", "hoyKcal", { n: 500 })).toBe("Hoy · 500 kcal");
    expect(traducir("en", "hoyKcal", { n: 500 })).toBe("Today · 500 kcal");
  });

  it("elige singular o plural según n", () => {
    expect(traducir("es", "dia", { n: 1 })).toBe("1 día");
    expect(traducir("es", "dia", { n: 5 })).toBe("5 días");
    expect(traducir("en", "dia", { n: 1 })).toBe("1 day");
    expect(traducir("en", "dia", { n: 5 })).toBe("5 days");
  });

  it("respeta el orden de palabras de cada idioma", () => {
    /* El caso que motivó los huecos con nombre: en español el
       número va después del verbo, en inglés arranca la frase. */
    expect(traducir("es", "faltanDiasBuenos", { n: 3, etapa: "joven" }))
      .toBe("Faltan 3 días buenos para joven");
    expect(traducir("en", "faltanDiasBuenos", { n: 3, etapa: "young" }))
      .toBe("3 good days to go until young");
  });

  it("si falta una clave devuelve la clave, no vacío", () => {
    /* Un texto raro se ve y se arregla; uno vacío pasa
       desapercibido. */
    expect(traducir("es", "estaClaveNoExiste")).toBe("estaClaveNoExiste");
  });

  it("un hueco sin dato queda a la vista en vez de desaparecer", () => {
    expect(traducir("es", "hoyKcal")).toContain("{n}");
  });
});

describe("elegir el idioma del dispositivo", () => {
  const original = navigator.language;
  const fingir = (lang: string) =>
    Object.defineProperty(navigator, "language", { value: lang, configurable: true });

  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => fingir(original));

  it("español para cualquier variante de español", () => {
    for (const lang of ["es", "es-AR", "es-ES", "ES-mx"]) {
      fingir(lang);
      expect(idiomaDelDispositivo(), lang).toBe("es");
    }
  });

  it("inglés para todo lo demás", () => {
    for (const lang of ["en-US", "pt-BR", "fr", ""]) {
      fingir(lang);
      expect(idiomaDelDispositivo(), lang).toBe("en");
    }
  });
});
