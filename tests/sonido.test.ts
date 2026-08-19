import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  sonidoActivado, activarSonido, sonidoSalto, sonidoPunto, sonidoGol,
  sonidoPerder, sonidoDesbloqueo, sonidoRechazo, iniciarAmbiente, detenerAmbiente,
} from "@/lib/sonido";

/* ==========================================================
   EL SONIDO
   ==========================================================
   No hay ningún archivo de audio: los efectos y el ambiente se
   generan con osciladores de la Web Audio API, en el momento.

   ---------- POR QUÉ UN AudioContext DE MENTIRA ----------
   jsdom no trae Web Audio. Se le da a `window` un contexto que
   anota qué le pidieron sin sonar de verdad — la misma idea que
   ya usa canvasDeMentira() en tests/juegos.test.ts para el
   dibujo. Lo que se prueba es QUÉ se le pide al audio (cuántas
   notas, con qué volumen, si respeta el interruptor), no cómo
   suena.

   ---------- POR QUÉ SE ARMA UNA SOLA VEZ ----------
   sonido.ts guarda el AudioContext en una variable del módulo,
   y lo crea una sola vez para toda la vida de la pestaña —así
   tiene que ser en la app de verdad, un context nuevo por cada
   sonido sería un desastre. Consecuencia para el test: una vez
   creado, reemplazar `window.AudioContext` después no sirve de
   nada, porque nadie vuelve a leerlo.

   Por eso el de mentira se instala UNA sola vez para todo el
   archivo, y lo que se limpia entre tests es la lista de notas,
   no el contexto. */
const notas: { frecuencia: number; volumen: number; tipo: string }[] = [];

class OsciladorFalso {
  type = "sine";
  frequency = { setValueAtTime: (_hz: number, _cuando: number) => {} };
  __ultimaFrecuencia = 0;

  connect(ganancia: any) {
    notas.push({
      frecuencia: this.__ultimaFrecuencia,
      volumen: ganancia.gain.volumenPedido,
      tipo: this.type,
    });
  }

  start() {}
  stop() {}
}

class GananciaFalsa {
  gain = {
    volumenPedido: 0,
    setValueAtTime(_v: number, _t: number) {},
    linearRampToValueAtTime(v: number, _t: number) { this.volumenPedido = v; },
    exponentialRampToValueAtTime(_v: number, _t: number) {},
  };
  connect() {}
}

class ContextoFalso {
  currentTime = 0;
  destination = {};

  createOscillator() {
    const osc = new OsciladorFalso();
    const original = osc.frequency.setValueAtTime;
    osc.frequency.setValueAtTime = (hz: number, cuando: number) => {
      original(hz, cuando);
      osc.__ultimaFrecuencia = hz;
    };
    return osc;
  }

  createGain() {
    return new GananciaFalsa();
  }

  resume() {
    return Promise.resolve();
  }
}

(window as any).AudioContext = ContextoFalso;

beforeEach(() => {
  localStorage.clear();
  notas.length = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  detenerAmbiente();
  vi.useRealTimers();
});

describe("el interruptor", () => {
  it("por defecto está prendido", () => {
    expect(sonidoActivado()).toBe(true);
  });

  it("se apaga y se prende, y queda guardado", () => {
    activarSonido(false);
    expect(sonidoActivado()).toBe(false);

    activarSonido(true);
    expect(sonidoActivado()).toBe(true);
  });

  it("apagado, ningún efecto pide sonar", () => {
    activarSonido(false);

    sonidoSalto();
    sonidoPunto();
    sonidoGol();
    sonidoPerder();
    sonidoDesbloqueo();
    sonidoRechazo();

    expect(notas.length).toBe(0);
  });
});

describe("sin Web Audio en el navegador", () => {
  /* No se puede simular "el navegador no tiene AudioContext"
     borrándolo del todo: sonido.ts ya guardó el de mentira en
     su variable de módulo apenas se importó el archivo, así
     que solo se puede sacar de la vista de hayAudio(), no
     deshacer lo ya creado. Alcanza igual: es exactamente lo que
     hayAudio() mira. */
  beforeEach(() => { delete (window as any).AudioContext; });
  afterEach(() => { (window as any).AudioContext = ContextoFalso; });

  it("no explota ningún efecto", () => {
    expect(() => {
      sonidoSalto();
      sonidoPunto();
      sonidoGol();
      sonidoPerder();
      sonidoDesbloqueo();
      sonidoRechazo();
    }).not.toThrow();
  });

  it("el ambiente tampoco explota al arrancar y parar", () => {
    expect(() => { iniciarAmbiente(); detenerAmbiente(); }).not.toThrow();
  });
});

describe("cada efecto suena", () => {
  it("saltar pide al menos una nota", () => {
    sonidoSalto();
    expect(notas.length).toBeGreaterThan(0);
  });

  it("perder suena distinto de sumar un punto: menos agudo la trae abajo", () => {
    /* No comparamos el sonido exacto (para eso están los oídos),
       comparamos que la nota de perder sea más grave que la de
       sumar un punto — es la diferencia que efectivamente se
       programó a propósito. */
    sonidoPunto();
    const agudoDePunto = Math.max(...notas.map((n) => n.frecuencia));
    notas.length = 0;

    sonidoPerder();
    const agudoDePerder = Math.max(...notas.map((n) => n.frecuencia));

    expect(agudoDePerder).toBeLessThan(agudoDePunto);
  });

  it("el gol suena con más notas que un punto común: es la fiesta más grande", () => {
    sonidoPunto();
    const cantidadPunto = notas.length;
    notas.length = 0;

    sonidoGol();
    const cantidadGol = notas.length;

    expect(cantidadGol).toBeGreaterThan(cantidadPunto);
  });

  it("ningún efecto se pasa de un volumen que moleste", () => {
    /* Todo por debajo de 0.2: son sonidos de UI, no una alarma. */
    sonidoSalto(); sonidoPunto(); sonidoGol(); sonidoPerder(); sonidoDesbloqueo(); sonidoRechazo();

    for (const n of notas) expect(n.volumen).toBeLessThan(0.2);
  });
});

describe("el ambiente", () => {
  it("no suena nada hasta que pasa el primer silencio", () => {
    iniciarAmbiente();
    expect(notas.length).toBe(0);
  });

  it("suena una nota sola tras esperar, después de programar el silencio", () => {
    iniciarAmbiente();
    vi.advanceTimersByTime(15_000);   // más que el silencio máximo (14s)

    expect(notas.length).toBeGreaterThan(0);
  });

  it("detenerAmbiente corta las notas que faltaban sonar", () => {
    iniciarAmbiente();
    detenerAmbiente();

    vi.advanceTimersByTime(30_000);

    expect(notas.length).toBe(0);
  });

  it("respeta el interruptor: apagado no arranca", () => {
    activarSonido(false);
    iniciarAmbiente();

    vi.advanceTimersByTime(30_000);

    expect(notas.length).toBe(0);
  });

  it("las notas del ambiente son bien suaves: no compiten con nada", () => {
    iniciarAmbiente();
    vi.advanceTimersByTime(15_000);

    for (const n of notas) expect(n.volumen).toBeLessThanOrEqual(0.06);
  });
});
