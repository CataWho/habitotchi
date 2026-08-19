import { useEffect, useRef, useState } from "react";
import { tr } from "@/lib/idioma";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { MASCOTAS } from "@/datos/mascotas";
import {
  crearPong, crearSaltador, crearViborita, fondoLCD, guardarRecord, recordDe,
} from "@/juegos/motor";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Panel } from "@/componentes/comunes/Panel";

/* ==========================================================
   JUEGOS
   ==========================================================
   Tres juegos en un canvas, con la misma estética de la
   pantallita.

   ---------- NO DAN MONEDAS, A PROPÓSITO ----------
   Solo guardan tu récord. Si jugar diera monedas, te
   convendría jugar en vez de tomar agua, y la app terminaría
   compitiendo contra su propio objetivo.
   ========================================================== */

const JUEGOS = [
  { id: "viborita", clave: "viborita", claveAyuda: "ayudaViborita" },
  { id: "pong", clave: "pong", claveAyuda: "ayudaPong" },
  { id: "saltador", clave: "saltador", claveAyuda: "ayudaSaltador" },
];

export function Juegos() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const activo = useRef<any>(null);
  const { vida } = useHabitotchi();

  /* Qué fondo de pantalla tenés puesto. Se mira solo para
     repintar la pantallita cuando lo cambiás (ver abajo). */
  const fondoEquipado = useHabitotchi((e) => e.equipado.fondo);

  const [elegido, setElegido] = useState("viborita");
  const [puntos, setPuntos] = useState(0);
  const [mensaje, setMensaje] = useState(tr("elegiUnJuego"));
  const [record, setRecord] = useState(() => recordDe("viborita"));

  /* ---------- MIENTRAS JUGÁS, SOLO EL JUEGO ----------
     La pantallita del aparato mide lo que mide, y con el D-pad
     grande no entraban a la vez el tablero, el mensaje, el
     botón Jugar, la ayuda Y las flechas: la de abajo quedaba
     cortada contra el borde.

     En vez de achicar los botones (que era justo el problema a
     resolver), se esconde lo que no se usa jugando. El mensaje
     cuenta cómo te fue, el botón sirve para empezar y la ayuda
     explica los controles: las tres cosas son de ANTES o de
     DESPUÉS de la partida, nunca durante. */
  const [jugando, setJugando] = useState(false);

  /* Dónde va la paleta de Pong.

     Vive acá y no adentro de un control porque la mueven DOS
     cosas: las flechas del teclado y los botones de la
     pantalla. Con una posición para cada una, usar las dos se
     sentiría como pelearse con el juego. */
  const paletaX = useRef<number | null>(null);

  const moverPaleta = (rumbo: number) => {
    const nodo = canvas.current;
    if (!nodo || !activo.current?.moverA || !rumbo) return;

    const desde = paletaX.current ?? nodo.width / 2;
    paletaX.current = Math.max(0, Math.min(nodo.width, desde + rumbo * 7));
    activo.current.moverA(paletaX.current);
  };

  /* Apagar el juego al salir es importante: si no, sigue
     corriendo invisible y gastando batería. */
  const detener = () => {
    activo.current?.detener?.();
    activo.current = null;
  };

  /* ----------------------------------------------------------
     LA PANTALLITA SE LIMPIA SOLA
     ----------------------------------------------------------
     Cada juego dibuja encima del canvas, y nadie lo borraba al
     terminar: el último cuadro quedaba congelado ahí. Se veía
     de dos formas, las dos feas — perdías y quedaba la escena
     de tu derrota clavada, y si después cambiabas de juego
     seguías viendo el dibujo del juego anterior hasta tocar
     Jugar.

     Usa fondoLCD(), la MISMA función con la que los tres
     juegos pintan su fondo. Al principio leía --lcd-claro y
     eso estaba mal: los fondos de pantalla no pisan esa
     variable, así que la pantallita quedaba verde aunque
     tuvieras puesto Algodón o Noche. La que sí acompaña al
     fondo es --lcd-contratinta, que es la que lee fondoLCD().
     ---------------------------------------------------------- */
  const limpiarPantalla = () => {
    const nodo = canvas.current;
    const ctx = nodo?.getContext("2d");
    if (!nodo || !ctx) return;

    ctx.fillStyle = fondoLCD();
    ctx.fillRect(0, 0, nodo.width, nodo.height);
  };

  useEffect(() => {
    return () => detener();
  }, []);

  useEffect(() => {
    detener();
    limpiarPantalla();
    setJugando(false);
    setPuntos(0);
    setRecord(recordDe(elegido));
    setMensaje(tr("tocaJugar"));
  }, [elegido]);

  /* ----------------------------------------------------------
     LA PANTALLITA ACOMPAÑA AL FONDO QUE ELEGÍS
     ----------------------------------------------------------
     El canvas no es HTML: se pinta una vez y se queda pintado.
     Todo lo demás de la app cambia de color solo, porque son
     variables de CSS, pero acá los píxeles ya están puestos y
     nadie los vuelve a tocar.

     Por eso, al cambiar el fondo en la tienda, la pantallita
     del juego se quedaba con el color VIEJO hasta que tocabas
     Jugar — recién ahí el juego repintaba su fondo.

     Se repinta aunque estés jugando: si hay partida, el juego
     va a dibujar su cuadro 16ms después y no se nota.
     ---------------------------------------------------------- */
  useEffect(() => {
    limpiarPantalla();
  }, [fondoEquipado]);

  /* ----------------------------------------------------------
     EL CANVAS TAMBIÉN ES UN CONTROL
     ----------------------------------------------------------
     La viborita se maneja con el D-pad, pero los otros dos no
     tienen botones: Pong sigue el dedo (o el mouse) de lado a
     lado, y el Saltador salta al tocar. Sin esto, los dos
     juegos arrancan y se ven, pero no responden a nada — que
     es exactamente lo que pasaba.

     Los eventos van acá y no dentro del motor porque el motor
     no sabe nada del DOM: recibe el canvas y dibuja. Quién le
     manda las órdenes es cosa de la pantalla.
     ---------------------------------------------------------- */
  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    /* De coordenada de pantalla a coordenada del canvas: el
       canvas se dibuja a 300px de ancho pero se muestra más
       chico (y encima todo el aparato está escalado), así que
       hay que convertir o la paleta queda corrida. */
    const aCoordenadaDelCanvas = (clienteX: number) => {
      const caja = nodo.getBoundingClientRect();
      return (clienteX - caja.left) * (nodo.width / caja.width);
    };

    const mover = (clienteX: number) => {
      activo.current?.moverA?.(aCoordenadaDelCanvas(clienteX));
    };

    const alMoverMouse = (e: MouseEvent) => mover(e.clientX);

    const alMoverDedo = (e: TouchEvent) => {
      const dedo = e.touches[0];
      if (!dedo) return;

      /* Sin esto, arrastrar sobre el canvas también desliza la
         página por debajo. */
      if (activo.current?.moverA) e.preventDefault();
      mover(dedo.clientX);
    };

    const alApretar = () => activo.current?.saltar?.();
    const alSoltar = () => activo.current?.soltarSalto?.();

    nodo.addEventListener("mousemove", alMoverMouse);
    nodo.addEventListener("touchmove", alMoverDedo, { passive: false });
    nodo.addEventListener("mousedown", alApretar);
    nodo.addEventListener("mouseup", alSoltar);
    nodo.addEventListener("touchstart", alApretar, { passive: true });
    nodo.addEventListener("touchend", alSoltar, { passive: true });

    return () => {
      nodo.removeEventListener("mousemove", alMoverMouse);
      nodo.removeEventListener("touchmove", alMoverDedo);
      nodo.removeEventListener("mousedown", alApretar);
      nodo.removeEventListener("mouseup", alSoltar);
      nodo.removeEventListener("touchstart", alApretar);
      nodo.removeEventListener("touchend", alSoltar);
    };
  }, []);

  /* ----------------------------------------------------------
     EN LA COMPUTADORA SE JUEGA CON EL TECLADO
     ----------------------------------------------------------
     Se suma a los botones de la pantalla, no los reemplaza. En
     una compu, ir con el mouse hasta una flechita y hacer clic
     para cada giro es incomodísimo.

     Qué juego está andando se sabe preguntando qué sabe hacer
     el motor, igual que los eventos del canvas de acá arriba:
       · girar   -> la viborita, con las cuatro flechas
       · saltar  -> el saltador, con espacio o flecha arriba
       · moverA  -> pong, con izquierda y derecha

     ---------- POR QUÉ MIRA SI LA PANTALLA SE VE ----------
     Las nueve pantallas están montadas todas juntas en el
     carril, así que esta función escucha el teclado aunque
     estés en Alimentación. Sin ese control, empezar una
     partida y cambiar de pestaña dejaba las flechas robadas:
     no podías bajar la página porque las tomaba el juego.
     ---------------------------------------------------------- */
  useEffect(() => {
    const apretadas = new Set<string>();
    let reloj: number | undefined;

    const escribiendo = (destino: EventTarget | null) => {
      const nodo = destino as HTMLElement | null;
      if (!nodo || !nodo.tagName) return false;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(nodo.tagName) || nodo.isContentEditable;
    };

    /* ¿La pestaña de Juegos es la que está a la vista? */
    const seVe = () => {
      const nodo = canvas.current;
      const marco = nodo?.closest(".app-pages");
      if (!nodo || !marco) return true;   // ante la duda, que responda

      const caja = nodo.getBoundingClientRect();
      const borde = marco.getBoundingClientRect();
      return caja.right > borde.left + 1 && caja.left < borde.right - 1;
    };

    const soltarTodo = () => {
      apretadas.clear();
      if (reloj !== undefined) { clearInterval(reloj); reloj = undefined; }
    };

    /* La paleta se mueve con su propio reloj mientras tengas la
       tecla apretada. Si avanzara un paso por cada golpe de
       tecla, el sistema operativo mete casi medio segundo antes
       de empezar a repetir y la paleta arrancaría tarde. */
    const pasoDeLaPaleta = () => {
      moverPaleta((apretadas.has("ArrowRight") ? 1 : 0) - (apretadas.has("ArrowLeft") ? 1 : 0));
    };

    const RUMBOS: Record<string, string> = {
      ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izquierda", ArrowRight: "derecha",
    };

    const alApretarTecla = (e: KeyboardEvent) => {
      if (!activo.current || !seVe() || escribiendo(e.target)) return;

      const hacia = RUMBOS[e.key];
      const esSalto = e.key === " " || e.key === "ArrowUp";

      /* Sin esto la página se va scrolleando mientras jugás. */
      if (hacia || e.key === " ") e.preventDefault();

      if (activo.current.girar && hacia) return activo.current.girar(hacia);
      if (activo.current.saltar && esSalto) return activo.current.saltar();

      if (activo.current.moverA && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        apretadas.add(e.key);
        if (reloj === undefined) reloj = window.setInterval(pasoDeLaPaleta, 16);
      }
    };

    const alSoltarTecla = (e: KeyboardEvent) => {
      apretadas.delete(e.key);
      if (apretadas.size === 0 && reloj !== undefined) { clearInterval(reloj); reloj = undefined; }

      if (activo.current?.soltarSalto && (e.key === " " || e.key === "ArrowUp")) {
        activo.current.soltarSalto();
      }
    };

    window.addEventListener("keydown", alApretarTecla);
    window.addEventListener("keyup", alSoltarTecla);

    /* Si cambiás de ventana con la tecla apretada nunca llega el
       "la solté", y la paleta seguiría sola para siempre. */
    window.addEventListener("blur", soltarTodo);

    return () => {
      window.removeEventListener("keydown", alApretarTecla);
      window.removeEventListener("keyup", alSoltarTecla);
      window.removeEventListener("blur", soltarTodo);
      soltarTodo();
    };
  }, []);

  const dibujarMascotaEnCanvas = (
    ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number
  ) => {
    const mascota = MASCOTAS[vida?.mascota ?? "dragoncito"];
    if (!mascota) return;

    const datos = mascota.etapas.bebe;
    const filas = datos.pixeles.length;
    const columnas = datos.pixeles[0]?.length ?? 0;
    const tam = Math.min(ancho / columnas, alto / filas);

    for (let fila = 0; fila < filas; fila++) {
      for (let col = 0; col < columnas; col++) {
        const letra = datos.pixeles[fila]?.[col];
        if (!letra || letra === ".") continue;

        ctx.fillStyle = mascota.colores[letra] ?? "#3a4a1c";
        ctx.fillRect(x + col * tam, y + fila * tam, Math.ceil(tam), Math.ceil(tam));
      }
    }
  };

  const jugar = () => {
    const nodo = canvas.current;
    if (!nodo) return;

    detener();

    const alPerder = (puntaje: number) => {
      const esRecord = guardarRecord(elegido, puntaje);
      setRecord(recordDe(elegido));

      /* Un récord de 0 no es un récord. Pasa la primera vez que
         jugás y perdés enseguida, y festejarlo queda ridículo. */
      setMensaje(
        esRecord && puntaje > 0
          ? tr("recordNuevo", { n: puntaje })
          : tr("perdiste", { n: puntaje, record: recordDe(elegido) })
      );

      /* El motor ya paró su reloj, pero el último cuadro sigue
         dibujado. Se deja un instante para que se vea dónde
         perdiste, y después se limpia. */
      setJugando(false);
      window.setTimeout(limpiarPantalla, 900);
    };

    paletaX.current = null;   // cada partida arranca con la paleta al medio

    if (elegido === "viborita") activo.current = crearViborita(nodo, setPuntos, alPerder);
    else if (elegido === "pong") activo.current = crearPong(nodo, setPuntos, alPerder);
    else activo.current = crearSaltador(nodo, setPuntos, alPerder, dibujarMascotaEnCanvas);

    setJugando(true);
    activo.current.arrancar();
  };

  const ayuda = tr(JUEGOS.find((j) => j.id === elegido)?.claveAyuda ?? "");

  return (
    <Pagina clave="pantallaJuegos">
      <Panel>
        <div className="juego-elegir">
          {JUEGOS.map((juego) => (
            <button
              key={juego.id}
              type="button"
              className={elegido === juego.id ? "juego-opcion is-on" : "juego-opcion"}
              onClick={() => setElegido(juego.id)}
            >
              {tr(juego.clave)}
            </button>
          ))}
        </div>

        <div className="juego-marcador">
          <span>{tr("puntos", { n: puntos })}</span>
          <span>{tr("record", { n: record })}</span>
        </div>

        <canvas id="juegoCanvas" ref={canvas} width={300} height={230} />

        {!jugando && <p className="juego-mensaje">{mensaje}</p>}

        {!jugando && (
          <button type="button" className="habit-btn" onClick={jugar}>{tr("jugar")}</button>
        )}

        {/* Las flechas aparecen recién al empezar: son para
            manejar algo que todavía no se está moviendo, y si
            están siempre no entra todo junto en la pantallita
            y quedan cortadas contra el borde de abajo. */}
        {jugando && <Controles juego={elegido} activo={activo} moverPaleta={moverPaleta} />}

        {!jugando && <Ayuda>{ayuda}</Ayuda>}
      </Panel>
    </Pagina>
  );
}

/* ==========================================================
   LOS BOTONES DE CADA JUEGO
   ==========================================================
   Los tres se manejan con el dedo sobre el canvas, pero eso en
   una pantallita chica es incómodo: tapás con la mano justo lo
   que tenés que mirar. Cada juego tiene además sus botones, y
   son los que necesita — ni más ni menos:

     viborita · la cruz entera
     pong     · izquierda y derecha
     saltador · una sola flecha para saltar
   ========================================================== */
function Controles({ juego, activo, moverPaleta }: {
  juego: string;
  activo: React.RefObject<any>;
  moverPaleta: (rumbo: number) => void;
}) {
  if (juego === "viborita") return <Dpad activo={activo} />;
  if (juego === "pong") return <BotonesDePong moverPaleta={moverPaleta} />;
  return <BotonDeSalto activo={activo} />;
}

/* Pong: mantener apretado corre la paleta sin parar.

   Con un toque = un paso no alcanzaba: para cruzar la cancha
   había que dar veinte golpecitos. */
function BotonesDePong({ moverPaleta }: { moverPaleta: (rumbo: number) => void }) {
  const reloj = useRef<number | undefined>(undefined);

  const parar = () => {
    clearInterval(reloj.current);
    reloj.current = undefined;
  };

  const empezar = (rumbo: number) => {
    moverPaleta(rumbo);            // el primer paso, ya
    parar();
    reloj.current = window.setInterval(() => moverPaleta(rumbo), 16);
  };

  /* Si te vas de la pantalla con el dedo apoyado, nunca llega
     el "lo solté" y la paleta seguiría sola para siempre. */
  useEffect(() => parar, []);

  const gatillo = (rumbo: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); empezar(rumbo); },
    onPointerUp: parar,
    onPointerLeave: parar,
    onPointerCancel: parar,
  });

  return (
    <div className="juego-dpad juego-dpad--fila">
      <button type="button" className="dpad-btn" aria-label={tr("izquierda")} {...gatillo(-1)}>◀</button>
      <button type="button" className="dpad-btn" aria-label={tr("derecha")} {...gatillo(1)}>▶</button>
    </div>
  );
}

/* Saltador: una sola flecha, pero avisando también cuándo se
   suelta — mantenerla apretada salta más alto, igual que tocar
   la pantalla. Si solo escucháramos el apretón, desde el botón
   todos los saltos saldrían cortos. */
function BotonDeSalto({ activo }: { activo: React.RefObject<any> }) {
  const soltar = () => activo.current?.soltarSalto?.();

  return (
    <div className="juego-dpad juego-dpad--fila">
      <button
        type="button"
        className="dpad-btn"
        aria-label={tr("arriba")}
        onPointerDown={(e) => { e.preventDefault(); activo.current?.saltar?.(); }}
        onPointerUp={soltar}
        onPointerLeave={soltar}
        onPointerCancel={soltar}
      >
        ▲
      </button>
    </div>
  );
}

/* Los botones táctiles de la viborita: en el celular no hay
   teclado, y deslizar sobre un canvas chico es incómodo. */
function Dpad({ activo }: { activo: React.RefObject<any> }) {
  const girar = (hacia: string) => activo.current?.girar?.(hacia);

  /* Los botones son hijos directos de la grilla: cada uno se
     ubica con su clase (dpad-arriba, dpad-izquierda...).
     Agruparlos en filas rompe la crucecita, porque el div del
     medio pasa a ocupar una sola celda.

     El del medio es puro adorno: va con aria-hidden para que
     el lector de pantalla no anuncie un botón que no hace
     nada. */
  return (
    <div className="juego-dpad">
      <button type="button" className="dpad-btn dpad-arriba" onClick={() => girar("arriba")} aria-label={tr("arriba")}>▲</button>
      <button type="button" className="dpad-btn dpad-izquierda" onClick={() => girar("izquierda")} aria-label={tr("izquierda")}>◀</button>
      <span className="dpad-centro" aria-hidden="true" />
      <button type="button" className="dpad-btn dpad-derecha" onClick={() => girar("derecha")} aria-label={tr("derecha")}>▶</button>
      <button type="button" className="dpad-btn dpad-abajo" onClick={() => girar("abajo")} aria-label={tr("abajo")}>▼</button>
    </div>
  );
}
