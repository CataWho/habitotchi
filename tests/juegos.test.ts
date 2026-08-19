import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  crearPong, crearSaltador, crearViborita, guardarRecord, recordDe,
  inventarObstaculo, velocidadPara, esColorOscuro, VELOCIDAD_AL_EMPEZAR, VELOCIDAD_TOPE,
} from "@/juegos/motor";
import { FONDOS } from "@/datos/fondos";

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
  /* Además de no explotar, el contexto anota qué le pidieron
     dibujar. Así se puede comprobar lo que la jugadora VE
     (por ejemplo, que el puntaje esté arriba a la derecha) sin
     abrirle una puerta al juego solo para los tests. */
  const llamadas: { metodo: string; args: any[]; fillStyle: string }[] = [];

  const ctx = new Proxy(
    { canvas: null as any, fillStyle: "", strokeStyle: "", lineWidth: 0, font: "", textAlign: "", textBaseline: "", llamadas },
    {
      get: (obj: any, prop) =>
        prop in obj
          ? obj[prop]
          : (...args: any[]) => {
              /* Se anota también CON QUÉ color se dibujó. En un
                 canvas el color es un estado que queda puesto, y
                 olvidarse de fijarlo hace que algo salga del
                 color de lo anterior — que es justo un bug que
                 ya pasó con el puntaje del Saltador. */
              llamadas.push({ metodo: String(prop), args, fillStyle: obj.fillStyle });
            },
      set: (obj: any, prop, v) => ((obj[prop] = v), true),
    }
  );

  return {
    width: ancho,
    height: alto,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: ancho, height: alto }),
  } as unknown as HTMLCanvasElement;
}

/* Qué le pidieron dibujar al canvas, filtrado por método. */
function loDibujado(canvas: HTMLCanvasElement, metodo: string) {
  const ctx: any = canvas.getContext("2d");
  return ctx.llamadas.filter((l: any) => l.metodo === metodo);
}

/* Sigue a la mascota cuadro por cuadro.

   El juego le pasa a `dibujoMascota` la posición de arriba de
   la mascota en cada cuadro, así que se puede medir el salto
   desde afuera, sin tocar nada de adentro. */
function seguirALaMascota() {
  const alturas: number[] = [];

  return {
    alturas,
    dibujo: (_ctx: any, _x: number, y: number) => { alturas.push(y); },

    /* La última posición dibujada. Si no hay ninguna, el juego
       no dibujó nada: conviene fallar acá y decirlo, y no tres
       líneas más abajo comparando contra un NaN. */
    ultima() {
      const y = alturas[alturas.length - 1];
      if (y === undefined) throw new Error("el juego no dibujó a la mascota ni una vez");
      return y;
    },
  };
}

/* Dónde está la pelota de Pong ahora mismo.

   Se la reconoce por el tamaño: es el único cuadradito de 8x8
   que dibuja el juego (las paletas son 46x7 y la línea del
   medio 5x1). Así el test ve lo mismo que ve la jugadora, sin
   que el motor tenga que exponer nada. */
function pelotaDePong(canvas: HTMLCanvasElement) {
  const cuadrados = loDibujado(canvas, "fillRect");

  for (let i = cuadrados.length - 1; i >= 0; i--) {
    const [x, y, ancho, alto] = cuadrados[i]!.args;
    if (ancho === 8 && alto === 8) return { x: x + 4, y: y + 4 };
  }

  return null;
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

  it("solo la PRIMERA jugada va lenta", () => {
    /* La pelota arranca al 42% para darte tiempo a apoyar el
       dedo. Antes eso duraba cinco jugadas y el juego se sentía
       dormido al principio; ahora se acelera apenas le pegás. */
    const canvas = canvasDeMentira(300, 230);
    let puntaje = 0;
    const juego = crearPong(canvas, (n) => { puntaje = n; }, () => {});

    juego.arrancar();

    avanzar(16); const a = pelotaDePong(canvas)!;
    avanzar(16); const b = pelotaDePong(canvas)!;
    const lenta = Math.abs(b.y - a.y);

    /* Se la devuelve una vez, siguiéndola con la paleta. */
    for (let i = 0; i < 600 && puntaje === 0; i++) {
      avanzar(16);
      const pelota = pelotaDePong(canvas);
      if (pelota) juego.moverA(pelota.x);
    }

    expect(puntaje, "no llegó a devolverla ni una vez").toBe(1);

    avanzar(16); const c = pelotaDePong(canvas)!;
    avanzar(16); const d = pelotaDePong(canvas)!;
    const rapida = Math.abs(d.y - c.y);

    expect(rapida, "después del primer golpe tiene que ir a velocidad normal")
      .toBeGreaterThan(lenta * 1.8);

    juego.detener();
  });

  it("meterle un gol a la compu suma puntos", () => {
    /* Este es el que faltaba: la pelota se le escapaba a la
       compu, volvía al medio y no sumabas nada. Convenía
       pelotear tranquila para siempre en vez de intentar
       ganarle.

       Para provocar el gol se juega apuntando al costado: se le
       pega con el borde de la paleta, que es lo que abre el
       ángulo y termina dejando a la compu sin llegar. */
    const canvas = canvasDeMentira(300, 230);
    const ctx: any = canvas.getContext("2d");
    const puntajes: number[] = [];
    const juego = crearPong(canvas, (n) => puntajes.push(n), () => {});

    juego.arrancar();

    /* Devolver suma de a 1, así que un salto más grande solo
       puede ser un gol. Se corta apenas aparece. */
    const huboGol = () => {
      const n = puntajes.length;
      return n >= 2 && puntajes[n - 1]! - puntajes[n - 2]! > 1;
    };

    let cuadros = 0;

    while (cuadros < 8000 && !huboGol()) {
      /* La lista de dibujos crece con cada cuadro y buscar ahí
         adentro 8000 veces hace que el test tarde una eternidad.
         Solo interesa el cuadro actual. */
      ctx.llamadas.length = 0;

      avanzar(16);
      cuadros++;

      const pelota = pelotaDePong(canvas);
      if (pelota) juego.moverA(pelota.x + 18);
    }
    juego.detener();

    expect(huboGol(), `nunca se cobró un gol en ${cuadros} cuadros`).toBe(true);
  }, 20_000);
});

describe("Saltador", () => {
  const dibujoDeMentira = () => {};

  it("al perder se dibuja como fantasma en el último cuadro, sea cual sea la causa", () => {
    /* Sin tocar nada, la mascota camina derecho al primer
       obstáculo y pierde —el mismo escenario que ya prueba
       "corre solo y en algún momento se pierde", más abajo.
       No hace falta forzar un pozo: cualquier muerte (acá,
       chocar con un pincho) tiene que dejarla como fantasma. */
    const canvas = canvasDeMentira();
    let dibujosDelSpriteNormal = 0;
    let perdio = false;

    const juego = crearSaltador(
      canvas, () => {}, () => { perdio = true; },
      () => { dibujosDelSpriteNormal++; }
    );

    juego.arrancar();
    avanzar(60_000);
    juego.detener();

    expect(perdio, "tenía que perder para poder revisar el cuadro final").toBe(true);

    /* dibujar() empieza SIEMPRE pintando el fondo entero, tanto
       si ese cuadro terminó siendo el sprite como el fantasma:
       contar esos rellenos es contar cuántos cuadros se
       dibujaron en total. */
    const totalDeCuadros = loDibujado(canvas, "fillRect")
      .filter((l: any) => l.args[2] === 300 && l.args[3] === 230).length;

    /* Si el último cuadro se pintó como fantasma, el sprite
       normal tiene que haberse dibujado exactamente una vez
       MENOS que el total de cuadros: todos menos el de la
       muerte. Si el fantasma nunca se dibujara, los dos números
       serían iguales. */
    expect(
      dibujosDelSpriteNormal,
      "el último cuadro no se pintó como fantasma"
    ).toBe(totalDeCuadros - 1);
  });

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

  /* ---------- EL SALTO, CALCADO DEL DINO DE CHROME ----------
     Los dos números de abajo no son un gusto: salen de medir
     cuadro por cuadro un video del dino original. Si alguien
     toca la gravedad o la fuerza del salto, estos tests avisan
     que el juego dejó de sentirse como el que copiamos.

     El primer obstáculo tarda unos 2 segundos en llegar, así
     que en estas ventanas cortas la mascota salta tranquila
     sin que nada la choque. */

  it("el salto sube 2.6 veces la altura de la mascota", () => {
    /* La mascota mide 20px, así que 2.6 veces son ~52px. */
    const ojo = seguirALaMascota();
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, ojo.dibujo);

    juego.arrancar();
    avanzar(16);
    const enElPiso = ojo.ultima();

    juego.saltar();
    avanzar(600);

    const subio = enElPiso - Math.min(...ojo.alturas);

    expect(subio).toBeGreaterThan(45);
    expect(subio).toBeLessThan(60);
    juego.detener();
  });

  it("pasa cerca de medio segundo en el aire", () => {
    /* Medido en el video: ~580ms. El nuestro da ~560ms, que es
       lo más cerca que se llega con pasos de 16ms. */
    const ojo = seguirALaMascota();
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, ojo.dibujo);

    juego.arrancar();
    avanzar(16);
    const enElPiso = ojo.ultima();
    const desdeAca = ojo.alturas.length;

    juego.saltar();
    avanzar(1000);

    const cuadrosEnElAire = ojo.alturas.slice(desdeAca).filter((y) => y < enElPiso - 0.5).length;

    expect(cuadrosEnElAire * 16).toBeGreaterThan(470);
    expect(cuadrosEnElAire * 16).toBeLessThan(660);
    juego.detener();
  });

  it("no hay doble salto: apretar en el aire no sube más", () => {
    const ojo = seguirALaMascota();
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, ojo.dibujo);

    juego.arrancar();
    avanzar(16);
    const enElPiso = ojo.ultima();

    juego.saltar();
    avanzar(160);     // a mitad de la subida
    juego.saltar();   // esto no tendría que hacer nada
    avanzar(840);

    const subio = enElPiso - Math.min(...ojo.alturas);

    expect(subio, "el segundo toque no tiene que empujarla más arriba").toBeLessThan(60);
    juego.detener();
  });

  it("el puntaje se dibuja siempre arriba a la derecha", () => {
    const canvas = canvasDeMentira(300, 230);
    const juego = crearSaltador(canvas, () => {}, () => {}, () => {});

    juego.arrancar();
    avanzar(100);

    const textos = loDibujado(canvas, "fillText");
    expect(textos.length, "el puntaje va en cada cuadro, no solo al final").toBeGreaterThan(0);

    const [texto, x, y] = textos[textos.length - 1].args;

    expect(texto, "solo dígitos: no hay palabra que traducir").toMatch(/^\d+$/);
    expect(texto.length, "con ceros adelante, así el número no se corre al pasar de 9 a 10")
      .toBeGreaterThanOrEqual(4);
    expect(x, "pegado al borde derecho").toBeGreaterThan(250);
    expect(y, "arriba de todo").toBeLessThan(20);

    juego.detener();
  });

  it("el puntaje se escribe con la tinta de la pantalla, no con el color de la mascota", () => {
    /* El sprite de la mascota pinta con SUS colores y deja el
       último puesto en el pincel. Como en un canvas el color es
       un estado que queda, el puntaje salía del color del
       bichito: sobre el fondo Noche era un rojo oscuro que casi
       no se leía. */
    const canvas = canvasDeMentira();
    const ctx: any = canvas.getContext("2d");

    const mascotaColorida = (c: any) => { c.fillStyle = "#ff0000"; c.fillRect(0, 0, 1, 1); };
    const juego = crearSaltador(canvas, () => {}, () => {}, mascotaColorida);

    juego.arrancar();
    avanzar(100);

    const textos = loDibujado(canvas, "fillText");
    const ultimo = textos[textos.length - 1]!;

    expect(ultimo.fillStyle, "quedó pintado con el color de la mascota").not.toBe("#ff0000");
    expect(ultimo.fillStyle, "tiene que ser la tinta de la pantalla").toBe(ctx.fillStyle);

    juego.detener();
  });
});

describe("la velocidad sube con el puntaje", () => {
  /* Antes subía cada tantos segundos: quedarte quieta te
     aceleraba el juego igual, y dos partidas con el mismo
     puntaje podían ir a velocidades distintas. */

  it("cambia cada 20 puntos y no antes", () => {
    expect(velocidadPara(0)).toBe(VELOCIDAD_AL_EMPEZAR);
    expect(velocidadPara(19)).toBe(VELOCIDAD_AL_EMPEZAR);
    expect(velocidadPara(20)).toBeGreaterThan(VELOCIDAD_AL_EMPEZAR);
    expect(velocidadPara(39)).toBe(velocidadPara(20));
    expect(velocidadPara(40)).toBeGreaterThan(velocidadPara(20));
  });

  it("el mismo puntaje da siempre la misma velocidad", () => {
    /* Es lo que hace que dos récords se puedan comparar. */
    expect(velocidadPara(57)).toBe(velocidadPara(57));
    expect(velocidadPara(120)).toBe(velocidadPara(120));
  });

  it("tiene un techo: no se vuelve imposible", () => {
    expect(velocidadPara(10_000)).toBe(VELOCIDAD_TOPE);
  });

  it("nunca va para atrás", () => {
    let anterior = 0;
    for (let puntaje = 0; puntaje < 400; puntaje++) {
      const v = velocidadPara(puntaje);
      expect(v, `en ${puntaje} puntos`).toBeGreaterThanOrEqual(anterior);
      anterior = v;
    }
  });
});

describe("qué obstáculo viene", () => {
  it("los dos primeros nunca son pozos: primero se aprende a saltar", () => {
    for (let i = 0; i < 300; i++) {
      expect(inventarObstaculo(VELOCIDAD_AL_EMPEZAR, 0, 300).tipo).toBe("pincho");
      expect(inventarObstaculo(VELOCIDAD_AL_EMPEZAR, 1, 300).tipo).toBe("pincho");
    }
  });

  it("los pinches altos recién aparecen más adelante", () => {
    /* Obligan a mantener apretado; de arranque serían una
       trampa para quien todavía no descubrió que se puede. */
    for (let i = 0; i < 300; i++) {
      const o = inventarObstaculo(VELOCIDAD_AL_EMPEZAR, 4, 300);
      if (o.tipo === "pincho") expect(o.alto).toBeLessThan(20);
    }
  });

  it("con puntaje alto salen los tres tipos", () => {
    const vistos = new Set<string>();

    for (let i = 0; i < 800; i++) {
      const o = inventarObstaculo(3, 50, 300);
      vistos.add(o.tipo === "pozo" ? "pozo" : o.alto >= 20 ? "pinchoAlto" : "pinchoBajo");
    }

    expect([...vistos].sort()).toEqual(["pinchoAlto", "pinchoBajo", "pozo"]);
  });

  it("todo pozo se puede cruzar de un salto, a cualquier velocidad", () => {
    /* El más importante de estos tests, y por eso la medida no
       sale de una constante del código: se hace saltar a la
       mascota de verdad y se cuenta cuánto estuvo en el aire.

       Si alguien afloja la gravedad, agranda los pozos o sube
       la velocidad tope, acá salta que el juego quedó con
       saltos imposibles. */
    const ojo = seguirALaMascota();
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, ojo.dibujo);

    juego.arrancar();
    avanzar(16);
    const enElPiso = ojo.ultima();
    const desdeAca = ojo.alturas.length;

    juego.saltar();
    avanzar(1000);
    juego.detener();

    const cuadrosEnElAire = ojo.alturas.slice(desdeAca).filter((y) => y < enElPiso - 0.5).length;
    expect(cuadrosEnElAire, "sin salto no hay nada que medir").toBeGreaterThan(20);

    for (let v = VELOCIDAD_AL_EMPEZAR; v <= VELOCIDAD_TOPE; v += 0.1) {
      for (let i = 0; i < 60; i++) {
        const o = inventarObstaculo(v, 50, 300);
        if (o.tipo !== "pozo") continue;

        /* Cuántos cuadros tarda el pozo en pasar por debajo:
           tiene que ser menos de lo que dura el salto. */
        const cuadrosQueTarda = o.ancho / v;

        expect(cuadrosQueTarda, `pozo de ${Math.round(o.ancho)}px a velocidad ${v.toFixed(1)}`)
          .toBeLessThan(cuadrosEnElAire);
      }
    }
  });

  it("el toque corto sube mucho menos que mantener apretado", () => {
    /* De esto dependen los pinches altos: si un toque corto
       alcanzara para todo, mantener apretado no serviría de
       nada y el pincho alto no tendría razón de existir. */
    const medir = (soltarEnseguida: boolean) => {
      const ojo = seguirALaMascota();
      const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, ojo.dibujo);

      juego.arrancar();
      avanzar(16);
      const piso = ojo.ultima();

      juego.saltar();
      if (soltarEnseguida) juego.soltarSalto();
      avanzar(600);
      juego.detener();

      return piso - Math.min(...ojo.alturas);
    };

    const corto = medir(true);
    const largo = medir(false);

    expect(corto).toBeLessThan(largo / 3);
    expect(corto, "un pincho alto mide 26: el toque corto no tiene que llegar").toBeLessThan(26);
  });
});

describe("el cielo del Saltador", () => {
  /* El sol y la luna no preguntan por el NOMBRE del fondo sino
     por su color, así que si mañana se agrega otro fondo oscuro
     la luna sale sola. Este test lo comprueba contra el
     catálogo de verdad, no contra colores inventados. */

  it("la luna sale en Noche y el sol en los demás", () => {
    expect(esColorOscuro(FONDOS.noche!.contratinta), "noche").toBe(true);

    for (const id of ["clasico", "atardecer", "algodon"]) {
      expect(esColorOscuro(FONDOS[id]!.contratinta), id).toBe(false);
    }
  });

  it("un color raro no rompe nada: queda de día", () => {
    /* Si algo devolviera basura, es mejor un sol de más que un
       juego que explota al dibujar. */
    for (const raro of ["", "rgb(1,2,3)", "no-es-un-color", "#xyz"]) {
      expect(esColorOscuro(raro), raro).toBe(false);
    }
  });

  it("no le importan las mayúsculas ni los espacios", () => {
    expect(esColorOscuro("  #2B3358  ")).toBe(true);
  });

  it("dibujar el cielo no explota", () => {
    const juego = crearSaltador(canvasDeMentira(), () => {}, () => {}, () => {});
    expect(() => { juego.arrancar(); avanzar(2000); }).not.toThrow();
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
