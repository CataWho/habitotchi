import { describe, expect, it } from "vitest";
import {
  calcularAnimo,
  calcularEstadoVida,
  diaEsBueno,
  diaEstaAbierto,
  etapaSegunPuntos,
  faltaParaLaProximaEtapa,
  UMBRAL_ADULTO,
  UMBRAL_JOVEN,
} from "@/lib/crecimiento";
import { diaBueno, diasSeguidos, registroDe, SIN_METAS_PROPIAS as METAS } from "./ayudas";

describe("cómo fue un día", () => {
  it("un día sin abrir no es ni bueno ni malo", () => {
    const registro = registroDe(["2026-01-01", "vacio"]);

    expect(diaEstaAbierto(registro, "2026-01-01")).toBe(false);
    expect(diaEsBueno(registro, METAS, "2026-01-01")).toBeNull();
  });

  it("llegar a todas las metas hace un día bueno", () => {
    const registro = registroDe(["2026-01-01", "bueno"]);
    expect(diaEsBueno(registro, METAS, "2026-01-01")).toBe(true);
  });

  it("con que falle una sola meta, el día es malo", () => {
    const registro = registroDe(["2026-01-01", "malo"]);
    expect(diaEsBueno(registro, METAS, "2026-01-01")).toBe(false);
  });

  it("los hábitos de tipo registro no arruinan el día", () => {
    /* Los dulces son "registro": anotarlos no debería impedir
       que el día sea bueno. Es la promesa de la app: te
       muestra el patrón sin retarte. */
    const registro = { "2026-01-01": { ...diaBueno(), dulces: 5 } };
    expect(diaEsBueno(registro, METAS, "2026-01-01")).toBe(true);
  });

  it("respeta la meta que vos cambiaste, no la de fábrica", () => {
    const registro = { "2026-01-01": { ...diaBueno(), agua: 4 } };

    expect(diaEsBueno(registro, METAS, "2026-01-01")).toBe(false);
    expect(diaEsBueno(registro, { agua: 4 }, "2026-01-01")).toBe(true);
  });
});

describe("el ánimo de hoy", () => {
  it("un día que todavía no abriste da normal, no triste", () => {
    /* El bug de la mascota que amanecía triste todos los
       días: a las 7 de la mañana el registro está vacío. */
    const registro = registroDe(["2026-01-01", "vacio"]);
    expect(calcularAnimo(registro, METAS, "2026-01-01")).toBe("normal");
  });

  it("cumplir todas las metas da feliz", () => {
    const registro = registroDe(["2026-01-01", "bueno"]);
    expect(calcularAnimo(registro, METAS, "2026-01-01")).toBe("feliz");
  });

  it("la mitad de cada meta da normal", () => {
    const registro = registroDe(["2026-01-01", "medias"]);
    expect(calcularAnimo(registro, METAS, "2026-01-01")).toBe("normal");
  });

  it("apenas arrancar el día da triste", () => {
    const registro = { "2026-01-01": { agua: 1 } };
    expect(calcularAnimo(registro, METAS, "2026-01-01")).toBe("triste");
  });

  it("pasarse de una meta no compensa las otras", () => {
    /* Tomar 80 vasos de agua no debería tapar que no hiciste
       nada más. El techo de cada meta es el 100%. */
    const registro = { "2026-01-01": { agua: 80 } };
    expect(calcularAnimo(registro, METAS, "2026-01-01")).toBe("triste");
  });
});

describe("las etapas", () => {
  it("los umbrales son bebé / joven / adulta", () => {
    expect(etapaSegunPuntos(0)).toBe("bebe");
    expect(etapaSegunPuntos(UMBRAL_JOVEN - 1)).toBe("bebe");
    expect(etapaSegunPuntos(UMBRAL_JOVEN)).toBe("joven");
    expect(etapaSegunPuntos(UMBRAL_ADULTO - 1)).toBe("joven");
    expect(etapaSegunPuntos(UMBRAL_ADULTO)).toBe("adulto");
  });

  it("dice cuántos días buenos faltan para crecer", () => {
    expect(faltaParaLaProximaEtapa(0)).toEqual({ faltan: UMBRAL_JOVEN, proxima: "joven" });
    expect(faltaParaLaProximaEtapa(UMBRAL_JOVEN)).toEqual({
      faltan: UMBRAL_ADULTO - UMBRAL_JOVEN,
      proxima: "adulto",
    });
    expect(faltaParaLaProximaEtapa(UMBRAL_ADULTO)).toBeNull();
  });
});

describe("la mecánica indulgente", () => {
  it("cada día bueno suma un punto", () => {
    const registro = diasSeguidos("2026-01-01", 5, "bueno");
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(5);
  });

  it("un solo mal día no te hace retroceder", () => {
    const registro = {
      ...diasSeguidos("2026-01-01", 5, "bueno"),
      ...registroDe(["2026-01-06", "malo"]),
    };
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(5);
  });

  it("dos días malos seguidos tampoco", () => {
    const registro = {
      ...diasSeguidos("2026-01-01", 5, "bueno"),
      ...diasSeguidos("2026-01-06", 2, "malo"),
    };
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(5);
  });

  it("hacen falta tres días malos seguidos para perder un punto", () => {
    const registro = {
      ...diasSeguidos("2026-01-01", 5, "bueno"),
      ...diasSeguidos("2026-01-06", 3, "malo"),
    };
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(4);
  });

  it("un día bueno corta la racha mala", () => {
    /* malo, malo, bueno, malo: nunca hay tres seguidos */
    const registro = {
      ...diasSeguidos("2026-01-01", 5, "bueno"),
      ...registroDe(
        ["2026-01-06", "malo"],
        ["2026-01-07", "malo"],
        ["2026-01-08", "bueno"],
        ["2026-01-09", "malo"]
      ),
    };
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(6);
  });

  it("los días sin abrir se saltean, no cortan ni suman", () => {
    /* Tres días malos con un día sin abrir en el medio siguen
       siendo tres días malos seguidos: irte de vacaciones no
       te salva, pero tampoco te castiga. */
    const registro = {
      ...diasSeguidos("2026-01-01", 5, "bueno"),
      ...registroDe(
        ["2026-01-06", "malo"],
        ["2026-01-07", "vacio"],
        ["2026-01-08", "malo"],
        ["2026-01-09", "malo"]
      ),
    };
    expect(calcularEstadoVida(registro, METAS, "2026-01-01").puntos).toBe(4);
  });
});

describe("la muerte", () => {
  it("con puntos, tres días malos restan en vez de matar", () => {
    const registro = {
      ...diasSeguidos("2026-01-01", 1, "bueno"),
      ...diasSeguidos("2026-01-02", 3, "malo"),
    };
    const estado = calcularEstadoVida(registro, METAS, "2026-01-01");

    expect(estado.muerta).toBe(false);
    expect(estado.puntos).toBe(0);
  });

  it("en cero puntos, tres días malos la matan", () => {
    const registro = diasSeguidos("2026-01-01", 3, "malo");
    const estado = calcularEstadoVida(registro, METAS, "2026-01-01");

    expect(estado.muerta).toBe(true);
    expect(estado.fechaMuerte).toBe("2026-01-03");
  });

  it("después de morir deja de contar", () => {
    /* Aunque después vengan días buenos, ya falleció: no
       revive sola. */
    const registro = {
      ...diasSeguidos("2026-01-01", 3, "malo"),
      ...diasSeguidos("2026-01-04", 10, "bueno"),
    };
    const estado = calcularEstadoVida(registro, METAS, "2026-01-01");

    expect(estado.muerta).toBe(true);
    expect(estado.puntos).toBe(0);
  });

  it("solo cuenta desde que empezó esta vida", () => {
    /* Una mascota nueva no arranca cargando los malos días de
       la anterior. */
    const registro = {
      ...diasSeguidos("2026-01-01", 3, "malo"),
      ...diasSeguidos("2026-01-04", 4, "bueno"),
    };
    const estado = calcularEstadoVida(registro, METAS, "2026-01-04");

    expect(estado.muerta).toBe(false);
    expect(estado.puntos).toBe(4);
  });
});
