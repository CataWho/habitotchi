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

  const [elegido, setElegido] = useState("viborita");
  const [puntos, setPuntos] = useState(0);
  const [mensaje, setMensaje] = useState(tr("elegiUnJuego"));
  const [record, setRecord] = useState(() => recordDe("viborita"));

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
    setPuntos(0);
    setRecord(recordDe(elegido));
    setMensaje(tr("tocaJugar"));
  }, [elegido]);

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
      window.setTimeout(limpiarPantalla, 900);
    };

    if (elegido === "viborita") activo.current = crearViborita(nodo, setPuntos, alPerder);
    else if (elegido === "pong") activo.current = crearPong(nodo, setPuntos, alPerder);
    else activo.current = crearSaltador(nodo, setPuntos, alPerder, dibujarMascotaEnCanvas);

    setMensaje(tr("dale"));
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

        <p className="juego-mensaje">{mensaje}</p>

        <button type="button" className="habit-btn" onClick={jugar}>{tr("jugar")}</button>

        {elegido === "viborita" && <Dpad activo={activo} />}

        <Ayuda>{ayuda}</Ayuda>
      </Panel>
    </Pagina>
  );
}

/* Los botones táctiles de la viborita: en el celular no hay
   teclado, y deslizar sobre un canvas chico es incómodo. */
function Dpad({ activo }: { activo: React.RefObject<any> }) {
  const girar = (hacia: string) => activo.current?.girar?.(hacia);

  /* Los cuatro botones son hijos directos de la grilla: cada
     uno se ubica con su clase (dpad-arriba, dpad-izquierda...).
     Agruparlos en filas rompe la crucecita, porque el div del
     medio pasa a ocupar una sola celda. */
  return (
    <div className="juego-dpad">
      <button type="button" className="dpad-btn dpad-arriba" onClick={() => girar("arriba")} aria-label={tr("arriba")}>▲</button>
      <button type="button" className="dpad-btn dpad-izquierda" onClick={() => girar("izquierda")} aria-label={tr("izquierda")}>◀</button>
      <button type="button" className="dpad-btn dpad-abajo" onClick={() => girar("abajo")} aria-label={tr("abajo")}>▼</button>
      <button type="button" className="dpad-btn dpad-derecha" onClick={() => girar("derecha")} aria-label={tr("derecha")}>▶</button>
    </div>
  );
}
