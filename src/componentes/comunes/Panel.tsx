import type { ReactNode } from "react";
import { Desplegable } from "@/componentes/comunes/Desplegable";

/* ==========================================================
   PIEZAS COMPARTIDAS
   ==========================================================
   Los ladrillos que repiten todas las pantallas. Las clases
   son las mismas que ya usaba el CSS, así que el aspecto no
   cambia: lo único que cambia es que ahora hay un solo lugar
   donde arreglarlas.
   ========================================================== */

export function Panel({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="panel">
      {titulo && <h2 className="panel-title">{titulo}</h2>}
      {children}
    </section>
  );
}

export function Ayuda({ children }: { children: ReactNode }) {
  return <p className="ayuda-chica">{children}</p>;
}

/* El botón de la pantalla: pastilla de tinta llena con la
   letra del color del fondo. */
export function BotonLcd({
  children,
  onClick,
  variante,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "restar";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const clases = ["habit-btn", variante === "restar" ? "habit-btn--restar" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={clases} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function CampoTexto({
  valor,
  alCambiar,
  marcador,
  tipo = "text",
  ancho,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  marcador?: string;
  tipo?: string;
  ancho?: string;
}) {
  return (
    <input
      className="input-rosa"
      type={tipo}
      value={valor}
      placeholder={marcador}
      style={ancho ? { width: ancho } : undefined}
      onChange={(e) => alCambiar(e.target.value)}
    />
  );
}

/* El desplegable de siempre. Ya no es un <select>: la lista
   que abría la dibujaba el sistema operativo y desentonaba
   con la pantallita. Ver Desplegable.tsx.

   Si los ítems traen grupo, se muestran agrupados: la lista
   de ejercicios de fuerza es larga y sin separar por zona del
   cuerpo es imposible encontrar nada. */
export function Select({
  valor,
  alCambiar,
  opciones,
  etiqueta,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  opciones: { id: string; nombre: string; grupo?: string }[];
  etiqueta?: string;
}) {
  return <Desplegable valor={valor} alCambiar={alCambiar} opciones={opciones} etiqueta={etiqueta} />;
}

/* Una fila de lista con su botón de borrar */
export function Fila({
  children,
  alBorrar,
  className = "fila-simple",
}: {
  children: ReactNode;
  alBorrar?: () => void;
  className?: string;
}) {
  return (
    <li className={className}>
      <span>{children}</span>
      {alBorrar && (
        <button type="button" className="fila-borrar" onClick={alBorrar} aria-label="Borrar">
          ×
        </button>
      )}
    </li>
  );
}

export function Lista({ children, vacia }: { children: ReactNode; vacia?: string }) {
  const hayAlgo = Array.isArray(children) ? children.length > 0 : Boolean(children);
  if (!hayAlgo && vacia) return <Ayuda>{vacia}</Ayuda>;
  return <ul className="lista-simple">{children}</ul>;
}
