import { useEffect, useRef, useState } from "react";
import type { Balde, RangoDeGrafico } from "@/lib/fechas";
import { bucketsGrafico } from "@/lib/fechas";
import { dibujarGraficoBarras, dibujarGraficoLineas } from "@/lib/graficos";

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

const RANGOS: { id: RangoDeGrafico; nombre: string }[] = [
  { id: "semana", nombre: "Semana" },
  { id: "mes", nombre: "Mes" },
  { id: "anio", nombre: "Año" },
];

interface Props {
  /* Dados los baldes, devuelve un valor por balde para cada
     una de las dos series. La segunda puede ir vacía. */
  calcular: (baldes: Balde[]) => { serieA: number[]; serieB?: number[] };
  etiquetaA: string;
  etiquetaB?: string;
}

export function GraficoDeBarras({ calcular, etiquetaA, etiquetaB }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rango, setRango] = useState<RangoDeGrafico>("semana");

  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    const baldes = bucketsGrafico(rango);
    const { serieA, serieB } = calcular(baldes);
    const { colorA, colorB } = coloresDeLaPantalla();

    dibujarGraficoBarras(nodo, baldes, serieA, serieB ?? [], { colorA, colorB });
  }, [rango, calcular]);

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
            {r.nombre}
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
  const [rango, setRango] = useState<RangoDeGrafico>("semana");
  const [hayDatos, setHayDatos] = useState(true);

  useEffect(() => {
    const nodo = canvas.current;
    if (!nodo) return;

    const puntos = promediarPorBalde(mediciones, bucketsGrafico(rango));

    /* Con un solo punto no hay línea que dibujar: se ve un
       gráfico vacío y confunde más de lo que ayuda. */
    setHayDatos(puntos.length >= 2);
    if (puntos.length < 2) return;

    dibujarGraficoLineas(nodo, puntos, { color: coloresDeLaPantalla().colorA });
  }, [rango, mediciones]);

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
            {r.nombre}
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
