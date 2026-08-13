import { useState } from "react";
import type { IdHabito } from "@/tipos";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { obtenerMeta, obtenerValor } from "@/lib/registro";
import { fechaDeHoy } from "@/lib/fechas";

/* ==========================================================
   LA FILA DE UN HÁBITO
   ==========================================================
   Nombre, barra de progreso, el número de hoy sobre la meta,
   y los botones para sumar o restar.

   Los de tipo "registro" (los dulces) no llevan barra ni meta
   a propósito: la app te muestra el dato para que veas tu
   patrón, sin retarte.
   ========================================================== */

export function BarraHabito({ id }: { id: IdHabito }) {
  const { registro, metas, sumarHabito, cambiarMeta } = useHabitotchi();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  const habito = HABITOS_POR_DEFECTO[id];
  if (!habito) return null;

  const hoy = fechaDeHoy();
  const valor = obtenerValor(registro, hoy, id);
  const meta = obtenerMeta(metas, id);
  const esDeMeta = habito.tipo === "meta";

  const porcentaje = esDeMeta && meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;

  const guardarMeta = () => {
    const numero = Number(borrador);
    if (Number.isFinite(numero) && numero > 0) cambiarMeta(id, numero);
    setEditando(false);
  };

  return (
    <div className="habit-row" data-habit={id}>
      <div className="habit-info">
        <span className="habit-name">{habito.nombre}</span>

        <span className="habit-value">
          {esDeMeta ? `${valor} / ${meta} ${habito.unidad}` : `${valor} ${habito.unidad}`}
        </span>
      </div>

      {esDeMeta && (
        <div className="habit-bar-track">
          <div
            className="habit-bar-fill"
            style={{ width: `${porcentaje}%`, background: habito.color }}
          />
        </div>
      )}

      <div className="habit-actions">
          <button
            type="button"
            className="habit-btn habit-btn--restar"
            onClick={() => sumarHabito(id, -habito.paso)}
            aria-label={`Restar ${habito.paso} de ${habito.nombre}`}
          >
            −{habito.paso}
          </button>

          <button
            type="button"
            className="habit-btn"
            onClick={() => sumarHabito(id, habito.paso)}
            aria-label={`Sumar ${habito.paso} a ${habito.nombre}`}
          >
            +{habito.paso}
          </button>

          {esDeMeta && !editando && (
            <button
              type="button"
              className="habit-edit"
              onClick={() => {
                setBorrador(String(meta));
                setEditando(true);
              }}
              aria-label={`Cambiar la meta de ${habito.nombre}`}
            >
              ✎
            </button>
          )}
      </div>

      {editando && (
        <div className="campo-fila">
          <input
            className="input-rosa"
            type="number"
            min={1}
            value={borrador}
            autoFocus
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guardarMeta()}
            style={{ width: "80px" }}
          />
          <button type="button" className="habit-btn" onClick={guardarMeta}>
            Guardar
          </button>
          <button
            type="button"
            className="habit-btn habit-btn--restar"
            onClick={() => setEditando(false)}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

/* Todos los hábitos de una página. Si no se le pasa una lista,
   muestra los cinco de siempre. */
export function ListaDeHabitos({ ids }: { ids: IdHabito[] }) {
  return (
    <div className="habit-list">
      {ids.map((id) => (
        <BarraHabito key={id} id={id} />
      ))}
    </div>
  );
}
