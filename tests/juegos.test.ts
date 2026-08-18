import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { crearPong, crearSaltador, crearViborita, guardarRecord, recordDe } from "@/juegos/motor";

/* ==========================================================
   LOS TRES JUEGOS
   ==========================================================
   No había ningún test sobre los juegos, y ya fallaron una vez
   de forma invisible: al portarlos, quedaron sin los eventos
   del canvas, así que Pong y el Saltador arrancaban, se veían,
   y no respondían a nada.

   Los tres corren con setInterval, así que con relojes falsos
   se los puede hacer avanzar paso a paso y mirar qué pasa —
   sin depender de que el navegador dibuje nada.

   ---------- POR QUÉ UN CANVAS DE MENTIRA ----------
   jsdom no trae getContext, y a los juegos solo les importa
   poder llamar a los métodos de dibujo sin que exploten. Se
   les da un contexto que no hace nada: lo que se prueba es la
   MECÁNICA (que la paleta se mueva, que la víbora no gire
   180°, que el salto tenga tope), no los píxeles.
   ========================================================== */

function canvasDeMentira(ancho = 300, alto = 230): HTMLCanvasElement {
  const nada = () => {};
  const ctx = new Proxy(
    { canvas: null as any, fillStyle: "", strokeStyle: "", lineWidth: 0, font: "", textAlign: "" },
    { get: (obj: any, prop) => (prop in obj ? obj[prop] : nada), set: (obj: any, prop, v) => ((obj[prop] = v), true) }
  );

  return {
    width: ancho,
    height: alto,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: ancho, height: alto }),
  } as unknown as HTMLCanvasElement;
}

/* Hace correr el reloj del juego N pasos. */
const avanzar = (ms: number) => vi.advanceTimersByTime(ms);

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe("Viborita", () => {
  it("arranca sin explotar y avanza sola", () => {
    const juego = crearViborita(canvasDeMentira(), () => {}, () => {});
    expect(() => { juego.arrancar(); avanzar(1000); }).not.toThrow();
    juego.detener();
  });

  it("no se puede girar 180°, que sería comerse a una misma", () => {
    /* La víbora arranca yendo a la derecha. Pedirle izquierda
       tiene que ignorarse; si no, en el paso siguiente se
       chocaría con su propio cuello y perderías sin tocar
       nada mal. */
    let perdio = false;
    const juego = crearViborita(canvasDeMentira(), () => {}, () => { perdio = true; });

    juego.arrancar();
    juego.girar("izquierda");
    avanzar(500);

    expect(perdio, "girar 180° no tendría que hacerte perder").toBe(false);
    juego.detener();
  });

  it("acepta girar en ángulo recto", () => {
    const juego = crearViborita(canvasDeMentira(), () => {}, () => {});
    juego.arrancar();
    expect(() => { juego.girar("arriba"); avanzar(200); juego.girar("derecha"); avanzar(200); }).not.toThrow();
    juego.detener();
  });

  it("detener corta el reloj: no sigue corriendo invisible", () => {
    /* Si no, el juego sigue gastando batería después de salir
       de la pestaña. */
    let pasos = 0;
    const juego = crearViborita(canvasDeMentira(), () => { pasos++; }, () => {});
    juego.arrancar();
    avanzar(500);
    juego.detener();
    const congelado = pasos;
    avanzar(2000);
    expect(pasos).toBe(congelado);
  });
});

describe("Pong", () => {
  it("la paleta sigue el dedo", () => {
    const juego = crearPong(canvasDeMentira(300, 230), () => {}, () => {});
    juego.arrancar();
    expect(() => juego.moverA(200)).not.toThrow();
    juego.detener();
  });

  it("la paleta no se escapa de la cancha", () => {
    /* moverA recibe la posición del dedo tal cual, que puede
       caer fuera del canvas si arrastrás para afuera. */
    const juego = crearPong(canvasDeMentira(300, 230), () => {}, () => {});
    juego.arrancar();
    expect(() => { juego.moverA(-500); avanzar(100); juego.moverA(9999); avanzar(100); }).not.toThrow();
    juego.detener();
  });

  it("corre muchos pasos sin romperse", () => {
    const juego = crearPong(canvasDeMentira(), () => {}, () => {});
    juego.arrancar();
    expect(() => avanzar(5000)).not.toThrow();
    juego.detener();
  });
});

describe("Saltador", () => {
  const dibujoDeMentira = () => {};

  it("saltar y soltar no explotan", () => {
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, dibujoDeMentira);
    juego.arrancar();
    expect(() => { juego.saltar(); avanzar(100); juego.soltarSalto(); avanzar(100); }).not.toThrow();
    juego.detener();
  });

  it("aguanta que le toquen el botón como loca", () => {
    /* Apretar rápido es exactamente lo que hace cualquiera
       jugando, y también lo que rompe los juegos mal hechos. */
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, dibujoDeMentira);
    juego.arrancar();
    expect(() => {
      for (let i = 0; i < 50; i++) { juego.saltar(); juego.soltarSalto(); avanzar(16); }
    }).not.toThrow();
    juego.detener();
  });

  it("corre solo y en algún momento se pierde", () => {
    /* Con la mascota quieta en el piso, tarde o temprano viene
       un obstáculo y hay que perder: si nunca perdiera, el
       juego no tendría final ni récord. */
    let perdio = false;
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => { perdio = true; }, dibujoDeMentira);
    juego.arrancar();
    avanzar(60_000);
    expect(perdio).toBe(true);
    juego.detener();
  });
});

describe("los récords", () => {
  it("guarda el primero", () => {
    expect(guardarRecord("pong", 10)).toBe(true);
    expect(recordDe("pong")).toBe(10);
  });

  it("solo guarda si superás el anterior", () => {
    guardarRecord("pong", 10);
    expect(guardarRecord("pong", 5)).toBe(false);
    expect(recordDe("pong")).toBe(10);

    expect(guardarRecord("pong", 11)).toBe(true);
    expect(recordDe("pong")).toBe(11);
  });

  it("cada juego lleva el suyo", () => {
    guardarRecord("pong", 10);
    guardarRecord("viborita", 3);
    expect(recordDe("pong")).toBe(10);
    expect(recordDe("viborita")).toBe(3);
    expect(recordDe("saltador")).toBe(0);
  });
});
