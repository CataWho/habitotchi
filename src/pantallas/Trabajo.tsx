import { useState } from "react";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { fechaDeHoy } from "@/lib/fechas";
import {
  TIPOS_TRABAJO,
  agregarSesionTrabajo,
  agregarTodo,
  alternarTodo,
  cargarSesionesTrabajo,
  cargarTodos,
  eliminarSesionTrabajo,
  eliminarTodo,
  resumenTrabajoPorBuckets,
  sesionesTrabajoDelDia,
} from "@/lib/trabajo";
import { ListaDeHabitos } from "@/componentes/comunes/BarraHabito";
import { GraficoDeBarras } from "@/componentes/comunes/Grafico";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel, Select } from "@/componentes/comunes/Panel";

/* ==========================================================
   TRABAJO / ESTUDIO
   ==========================================================
   Las horas que le dedicaste y tus pendientes. Las horas
   suman al hábito "trabajo", así que cuentan para tu día.
   ========================================================== */

export function Trabajo() {
  return (
    <Pagina nombre="Trabajo">
      <Panel titulo="Tu meta de hoy">
        <ListaDeHabitos ids={["trabajo"]} />
      </Panel>

      <Horas />
      <GraficoDeHoras />
      <Pendientes />
    </Pagina>
  );
}

function Horas() {
  const { fijarHabito } = useHabitotchi();
  const [sesiones, setSesiones] = useState(() => cargarSesionesTrabajo());
  const [tipo, setTipo] = useState(Object.keys(TIPOS_TRABAJO)[0] ?? "trabajo");
  const [horas, setHoras] = useState("");

  const hoy = fechaDeHoy();
  const delDia = sesionesTrabajoDelDia(sesiones, hoy);

  const sincronizar = (nuevas: any) => {
    setSesiones({ ...nuevas });

    const total = sesionesTrabajoDelDia(nuevas, hoy).reduce(
      (suma: number, s: any) => suma + (s.horas || 0), 0
    );
    fijarHabito("trabajo", total);
  };

  const agregar = () => {
    const numero = Number(horas);
    if (!Number.isFinite(numero) || numero <= 0) return;

    sincronizar(agregarSesionTrabajo(sesiones, hoy, tipo, numero));
    setHoras("");
  };

  return (
    <Panel titulo="Horas de hoy">
      <div className="campo-fila">
        <Select
          valor={tipo}
          alCambiar={setTipo}
          opciones={Object.entries(TIPOS_TRABAJO).map(([id, t]) => ({ id, nombre: t.nombre }))}
        />
        <input className="input-rosa" type="number" value={horas} placeholder="horas"
          style={{ width: "80px" }} onChange={(e) => setHoras(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>Agregar</button>
      </div>

      {delDia.length === 0 ? (
        <Ayuda>Todavía no cargaste horas hoy.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {delDia.map((sesion: any, i: number) => (
            <Fila key={i} alBorrar={() => sincronizar(eliminarSesionTrabajo(sesiones, hoy, i))}>
              <b>{TIPOS_TRABAJO[sesion.tipo]?.nombre ?? sesion.tipo}</b> · {sesion.horas} h
            </Fila>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Pendientes() {
  const [lista, setLista] = useState(() => cargarTodos());
  const [texto, setTexto] = useState("");

  const agregar = () => {
    if (!texto.trim()) return;
    setLista([...agregarTodo(lista, texto.trim())]);
    setTexto("");
  };

  const sinHacer = lista.filter((t: any) => !t.hecho).length;

  return (
    <Panel titulo="Pendientes">
      <div className="campo-fila">
        <input className="input-rosa" value={texto} placeholder="qué tenés que hacer"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()} />
        <button type="button" className="habit-btn" onClick={agregar}>Agregar</button>
      </div>

      {lista.length === 0 ? (
        <Ayuda>No tenés pendientes cargados.</Ayuda>
      ) : (
        <>
          <ul className="lista-simple">
            {lista.map((todo: any) => (
              <li key={todo.id} className={todo.hecho ? "todo-fila todo-fila--hecho" : "todo-fila"}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(todo.hecho)}
                    onChange={() => setLista([...alternarTodo(lista, todo.id).lista])}
                  />
                  <span>{todo.texto}</span>
                </label>
                <button type="button" className="fila-borrar"
                  onClick={() => setLista([...eliminarTodo(lista, todo.id).lista])} aria-label="Borrar">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <Ayuda>{sinHacer === 0 ? "¡No te queda nada pendiente!" : `Te quedan ${sinHacer}.`}</Ayuda>
        </>
      )}
    </Panel>
  );
}

/* Cuántas horas le dedicaste, por semana, mes o año */
function GraficoDeHoras() {
  const [sesiones] = useState(() => cargarSesionesTrabajo());

  return (
    <Panel titulo="Cómo venís">
      <GraficoDeBarras
        calcular={(baldes) => {
          const resumen = resumenTrabajoPorBuckets(sesiones, baldes);
          return {
            serieA: resumen.map((b: any) => b.trabajo),
            serieB: resumen.map((b: any) => b.estudio),
          };
        }}
        etiquetaA="trabajo"
        etiquetaB="estudio"
      />
    </Panel>
  );
}
