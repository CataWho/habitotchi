import { useState } from "react";
import {
  INICIALES_DE_SEMANA, diasDelMes, fechaDeHoy, nombreDelMes,
} from "@/lib/fechas";
import {
  agregarEvento, cargarCalendario, eliminarEvento, eventosDelDia,
} from "@/lib/trabajo";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel } from "@/componentes/comunes/Panel";

/* ==========================================================
   CALENDARIO
   ==========================================================
   El mes completo, con tus propias notas por día.

   La grilla siempre tiene 6 filas, aunque el mes entre en 5.
   Si cambiara de alto al pasar de mes, el calendario "saltaría"
   y marea.
   ========================================================== */

export function Calendario() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [seleccionado, setSeleccionado] = useState(fechaDeHoy());
  const [calendario, setCalendario] = useState(() => cargarCalendario());
  const [texto, setTexto] = useState("");

  const semanas = diasDelMes(anio, mes);
  const delDia = eventosDelDia(calendario, seleccionado);

  const mover = (paso: number) => {
    const nuevo = new Date(anio, mes + paso, 1);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
  };

  const agregar = () => {
    if (!texto.trim()) return;
    setCalendario({ ...agregarEvento(calendario, seleccionado, texto.trim()) });
    setTexto("");
  };

  return (
    <Pagina nombre="Calendario">
      <Panel>
        <div className="mes-nav">
          <button type="button" className="habit-btn" onClick={() => mover(-1)}>‹</button>
          <span className="mes-titulo">{nombreDelMes(mes)} {anio}</span>
          <button type="button" className="habit-btn" onClick={() => mover(1)}>›</button>
        </div>

        <div className="mes-grilla">
          {INICIALES_DE_SEMANA.map((inicial) => (
            <div key={inicial} className="mes-encabezado">{inicial}</div>
          ))}

          {semanas.flat().map((dia) => {
            const tieneNotas = eventosDelDia(calendario, dia.texto).length > 0;
            const clases = [
              "mes-dia",
              dia.esDeEsteMes ? "" : "mes-dia--otro",
              dia.esHoy ? "mes-dia--hoy" : "",
              dia.texto === seleccionado ? "mes-dia--elegido" : "",
              tieneNotas ? "mes-dia--con-notas" : "",
            ].filter(Boolean).join(" ");

            return (
              <button
                key={dia.texto}
                type="button"
                className={clases}
                onClick={() => setSeleccionado(dia.texto)}
              >
                {dia.numero}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel titulo={seleccionado}>
        <div className="campo-fila">
          <input className="input-rosa" value={texto} placeholder="anotar algo"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()} />
          <button type="button" className="habit-btn" onClick={agregar}>Agregar</button>
        </div>

        {delDia.length === 0 ? (
          <Ayuda>No hay nada anotado ese día.</Ayuda>
        ) : (
          <ul className="lista-simple">
            {delDia.map((evento: any, i: number) => (
              <Fila
                key={i}
                alBorrar={() => setCalendario({ ...eliminarEvento(calendario, seleccionado, i) })}
              >
                {typeof evento === "string" ? evento : evento.texto}
              </Fila>
            ))}
          </ul>
        )}
      </Panel>

      <Ayuda>
        Se puede conectar con Google Calendar para ver tus eventos reales. Requiere publicar
        la app y crear un ID de cliente: está explicado en CALENDARIO.md.
      </Ayuda>
    </Pagina>
  );
}
