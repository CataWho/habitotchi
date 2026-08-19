import { useEffect, useRef, useState } from "react";
import { tr } from "@/lib/idioma";
import type { Balde, RangoDeGrafico } from "@/lib/fechas";
import { bucketsGrafico } from "@/lib/fechas";
import { dibujarGraficoBarras, dibujarGraficoLineas, dibujarGraficoPuntos } from "@/lib/graficos";
import { useHabitotchi } from "@/estado/useHabitotchi";

/* El fondo de pantalla que tenés puesto.

   Los gráficos se dibujan en un canvas, y un canvas no es HTML:
   los píxeles quedan como se pintaron. Todo lo demás de la app
   cambia de color solo, porque son variables de CSS, pero las
   barras se quedaban del color anterior hasta que tocabas
   Semana/Mes/Año. Mirando el fondo, se redibujan solas. */
function usarFondo() {
  return useHabitotchi((e) => e.equipado.fondo);
}

/* ==========================================================
   EL GRÁFICO DE BARRAS
   ==========================================================
   Lo usan Ejercicio y Trabajo. Se puede mirar por semana, por
   mes o por año: el eje se arma con los "baldes" de fechas de
   lib/fechas.

   El dibujo lo hace lib/graficos sobre un canvas. Acá va solo
   el envoltorio de React: los botones del rango y volver a
   dibujar cuando cambian los datos.
   ========================================================== */

/* Los dos colores de las series. Salen de la tinta de la
   pantalla para que acompañen al fondo que tengas puesto. */
function coloresDeLaPantalla() {
  const pantalla = document.querySelector(".screen");
  if (!pantalla) return { colorA: "#16240a", colorB: "rgba(22, 36, 10, 0.45)" };

  const estilo = getComputedStyle(pantalla);
  const tinta = estilo.getPropertyValue("--lcd-tinta-rgb").trim() || "22, 36, 10";

  return { colorA: `rgb(${tinta})`, colorB: `rgba(${tinta}, 0.42)` };
}

const RANGOS: { id: RangoDeGrafico; clave: string }[] = [
  { id: "semana", clave: "semana" },
  { id: "mes", clave: "mes" },
  { id: "anio", clave: "anio" },
];

interface Props {
  /* Dados los baldes, devuelve un valor por balde para cada
     una de las dos series. La segunda puede ir vacía. */
  calcular: (baldes: Balde[]) => { serieA: number[]; serieB?: number[] };
  etiquetaA: string;
  etiquetaB?: string;
  /* La meta diaria del hábito, para dibujar la línea de
     referencia y anclar la escala. Sin esto el gráfico se
     escala solo contra su propia barra más alta. */
  metaDiaria?: number;
}

/* Cuántos días abarca un balde: 1 en la vista semanal (cada
   barra es un día), 7 en la mensual, ~30 en la anual. */
function diasDelBalde(balde: Balde): number {
  const desde = new Date(balde.desde).getTime();
  const hasta = new Date(balde.hasta).getTime();

  return Math.max(1, Math.round((hasta - desde) / 86_400_000) + 1);
}

export function GraficoDeBarras({ calcular, etiquetaA, etiquetaB, metaDiaria }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rango, setRango] = useState<RangoDeGrafico>("semana");
  const fondo = usarFondo();

  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    const baldes = bucketsGrafico(rango);
    const { serieA, serieB } = calcular(baldes);
    const { colorA, colorB } = coloresDeLaPantalla();

    /* La meta que se dibuja es la del BALDE, no la del día: en
       la vista mensual cada barra son siete días, así que la
       línea tiene que estar siete veces más arriba. Si no, en
       cuanto cambiabas de período la referencia mentía. */
    const meta = metaDiaria && baldes[0] ? metaDiaria * diasDelBalde(baldes[0]) : 0;

    dibujarGraficoBarras(nodo, baldes, serieA, serieB ?? [], { colorA, colorB, meta });
  }, [rango, calcular, fondo, metaDiaria]);

  return (
    <div className="grafico">
      <div className="juego-elegir">
        {RANGOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={rango === r.id ? "juego-opcion is-on" : "juego-opcion"}
            onClick={() => setRango(r.id)}
          >
            {tr(r.clave)}
          </button>
        ))}
      </div>

      <canvas ref={canvas} width={280} height={110} className="grafico-canvas" />

      <div className="grafico-leyenda">
        <span className="grafico-punto grafico-punto--a" /> {etiquetaA}
        {etiquetaB && (
          <>
            <span className="grafico-punto grafico-punto--b" /> {etiquetaB}
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================
   EL GRÁFICO DE LÍNEAS
   ==========================================================
   Para lo que es una medición y no una suma: el peso. Sumar
   pesos no significa nada — lo que importa es cómo se movió
   el número a lo largo del tiempo, y para eso una línea dice
   mucho más que barras.

   Usa los mismos baldes de fechas que el de barras, pero en
   vez de sumar lo que cae en cada tramo, promedia: si te
   pesaste tres veces en la semana, el punto de esa semana es
   el promedio de las tres.
   ========================================================== */

export interface MedicionConFecha {
  fecha: string;
  valor: number;
}

/* Promedia las mediciones que caen dentro de cada balde. Los
   baldes sin ninguna medición se saltean: no tiene sentido
   dibujar un cero (no es que pesaste 0, es que no te pesaste)
   ni inventar un valor que no existe. */
function promediarPorBalde(mediciones: MedicionConFecha[], baldes: Balde[]) {
  const puntos: { etiqueta: string; valor: number }[] = [];

  for (const balde of baldes) {
    const dentro = mediciones.filter((m) => m.fecha >= balde.desde && m.fecha <= balde.hasta);
    if (dentro.length === 0) continue;

    const suma = dentro.reduce((total, m) => total + m.valor, 0);
    puntos.push({ etiqueta: balde.etiqueta, valor: suma / dentro.length });
  }

  return puntos;
}

export function GraficoDeLineas({
  mediciones,
  etiqueta,
  vacio = "Todavía no hay suficientes registros para el gráfico.",
}: {
  mediciones: MedicionConFecha[];
  etiqueta: string;
  vacio?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  /* ---------- ARRANCA DONDE HAY ALGO QUE VER ----------
     Empezaba siempre en "semana", y con dos pesadas separadas
     por quince días esa vista tenía un solo punto: el gráfico
     se escondía entero y parecía que no existía. Ahora busca el
     primer período que tenga con qué dibujar.

     Los botones siguen estando: esto solo elige con cuál abre. */
  const [rango, setRango] = useState<RangoDeGrafico>(() => {
    const conDatos = RANGOS.find(
      (r) => promediarPorBalde(mediciones, bucketsGrafico(r.id)).length >= 2
    );

    return conDatos?.id ?? "semana";
  });

  const [hayDatos, setHayDatos] = useState(true);
  const fondo = usarFondo();

  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    const puntos = promediarPorBalde(mediciones, bucketsGrafico(rango));

    /* Con un solo punto no hay línea que dibujar: se ve un
       gráfico vacío y confunde más de lo que ayuda. */
    setHayDatos(puntos.length >= 2);
    if (puntos.length < 2) return;

    dibujarGraficoLineas(nodo, puntos, { color: coloresDeLaPantalla().colorA });
  }, [rango, mediciones, fondo]);

  return (
    <div className="grafico">
      <div className="juego-elegir">
        {RANGOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={rango === r.id ? "juego-opcion is-on" : "juego-opcion"}
            onClick={() => setRango(r.id)}
          >
            {tr(r.clave)}
          </button>
        ))}
      </div>

      <canvas
        ref={canvas}
        width={280}
        height={110}
        className="grafico-canvas"
        hidden={!hayDatos}
      />

      {!hayDatos && <p className="ayuda-chica">{vacio}</p>}

      {hayDatos && (
        <div className="grafico-leyenda">
          <span className="grafico-punto grafico-punto--a" /> {etiqueta}
        </div>
      )}
    </div>
  );
}


/* ==========================================================
   EL GRÁFICO DE PUNTOS
   ==========================================================
   Para el balance de ánimo: un punto por registro, a la altura
   del ánimo anotado. Dos registros en un día son dos puntos.

   No promedia a propósito. Un día en que te levantaste mal y
   terminaste bien no es "normal": son dos cosas que pasaron, y
   aplanarlas en un promedio borra justo lo que sirve mirar.
   ========================================================== */
export function GraficoDePuntos({
  calcular,
  niveles,
  vacio,
}: {
  calcular: (baldes: Balde[]) => { nivel: number; color: string }[][];
  niveles: number;
  vacio: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rango, setRango] = useState<RangoDeGrafico>("semana");
  const [hayDatos, setHayDatos] = useState(true);
  const fondo = usarFondo();

  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    const baldes = bucketsGrafico(rango);
    const porBalde = calcular(baldes);

    setHayDatos(porBalde.some((p) => p.length > 0));

    dibujarGraficoPuntos(nodo, baldes, porBalde, {
      niveles,
      colorTexto: coloresDeLaPantalla().colorA,
    });
  }, [rango, calcular, fondo, niveles]);

  return (
    <div className="grafico">
      <div className="juego-elegir">
        {RANGOS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={rango === r.id ? "juego-opcion is-on" : "juego-opcion"}
            onClick={() => setRango(r.id)}
          >
            {tr(r.clave)}
          </button>
        ))}
      </div>

      <canvas ref={canvas} width={280} height={110} className="grafico-canvas" hidden={!hayDatos} />

      {!hayDatos && <p className="ayuda-chica">{vacio}</p>}
    </div>
  );
}
