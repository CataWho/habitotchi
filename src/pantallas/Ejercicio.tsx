import { useState } from "react";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { fechaDeHoy } from "@/lib/fechas";
import { cargarPerfil, pesoParaCalculos } from "@/lib/perfil";
import {
  INTENSIDAD_PESAS,
  TIPOS_CARDIO,
  TIPOS_CARDIO_CON_DISTANCIA,
  agregarEjercicioPropio,
  agregarSesionCardio,
  agregarSesionFuerza,
  cargarEjerciciosPropios,
  cargarPasos,
  cargarSesionesEjercicio,
  catalogoFuerza,
  eliminarSesion,
  registrarPasos,
  sesionesDelDia,
  totalCaloriasDelDia,
  resumenEjercicioPorBuckets,
  totalMinutosDelDia,
} from "@/lib/ejercicio";
import { ListaDeHabitos } from "@/componentes/comunes/BarraHabito";
import { GraficoDeBarras } from "@/componentes/comunes/Grafico";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel, Select } from "@/componentes/comunes/Panel";

/* ==========================================================
   EJERCICIO
   ==========================================================
   Cardio (con tipo y, para los que corresponde, distancia) y
   fuerza (con ejercicio, intensidad, series y repeticiones).

   Las calorías salen de la fórmula MET, que usa tu peso. Son
   aproximadas a propósito: no es una báscula.
   ========================================================== */

export function Ejercicio() {
  const { fijarHabito } = useHabitotchi();
  const [sesiones, setSesiones] = useState(() => cargarSesionesEjercicio());
  const [propios, setPropios] = useState(() => cargarEjerciciosPropios());
  const [perfil] = useState(() => cargarPerfil());

  const hoy = fechaDeHoy();
  const pesoKg = pesoParaCalculos(perfil);
  const delDia = sesionesDelDia(sesiones, hoy);
  const minutos = totalMinutosDelDia(sesiones, hoy);
  const calorias = totalCaloriasDelDia(sesiones, hoy);

  const sincronizar = (nuevas: any) => {
    setSesiones({ ...nuevas });
    fijarHabito("ejercicio", totalMinutosDelDia(nuevas, hoy));
  };

  return (
    <Pagina nombre="Ejercicio">
      <Panel titulo="Tu meta de hoy">
        <ListaDeHabitos ids={["ejercicio"]} />
        <Ayuda>
          Calorías quemadas hoy (aproximado): <b>{calorias} kcal</b> en {minutos} minutos.
        </Ayuda>
      </Panel>

      <FormularioCardio pesoKg={pesoKg} sesiones={sesiones} hoy={hoy} alGuardar={sincronizar} />
      <FormularioFuerza
        pesoKg={pesoKg}
        sesiones={sesiones}
        hoy={hoy}
        catalogo={catalogoFuerza(propios)}
        alGuardar={sincronizar}
        alAgregarPropio={(nombre) => setPropios({ ...agregarEjercicioPropio(propios, nombre).propios })}
      />
      <Panel titulo="Cómo venís">
        <GraficoDeBarras
          calcular={(baldes) => {
            const resumen = resumenEjercicioPorBuckets(sesiones, baldes);
            return {
              serieA: resumen.map((b: any) => b.cardio),
              serieB: resumen.map((b: any) => b.fuerza),
            };
          }}
          etiquetaA="cardio"
          etiquetaB="pesas"
        />
      </Panel>

      <Pasos />

      <Panel titulo="Lo de hoy">
        {delDia.length === 0 ? (
          <Ayuda>Todavía no cargaste ninguna sesión hoy.</Ayuda>
        ) : (
          <ul className="lista-simple">
            {delDia.map((sesion: any, i: number) => (
              <Fila key={i} alBorrar={() => sincronizar(eliminarSesion(sesiones, hoy, i))}>
                {sesion.tipo === "cardio" ? (
                  <>
                    <b>{TIPOS_CARDIO[sesion.subtipo]?.nombre ?? sesion.subtipo}</b> ·{" "}
                    {sesion.minutos} min
                    {sesion.distanciaKm ? ` · ${sesion.distanciaKm} km` : ""} ·{" "}
                    {sesion.calorias} kcal
                  </>
                ) : (
                  <>
                    <b>{catalogoFuerza(propios)[sesion.ejercicio]?.nombre ?? sesion.ejercicio}</b>{" "}
                    · {sesion.series}x{sesion.repeticiones} · {sesion.minutos} min ·{" "}
                    {sesion.calorias} kcal
                  </>
                )}
              </Fila>
            ))}
          </ul>
        )}
      </Panel>
    </Pagina>
  );
}

function FormularioCardio({
  pesoKg,
  sesiones,
  hoy,
  alGuardar,
}: {
  pesoKg: number;
  sesiones: any;
  hoy: string;
  alGuardar: (s: any) => void;
}) {
  const [subtipo, setSubtipo] = useState("cinta");
  const [minutos, setMinutos] = useState("");
  const [km, setKm] = useState("");

  const pideDistancia = TIPOS_CARDIO_CON_DISTANCIA.includes(subtipo);

  const agregar = () => {
    const mins = Number(minutos);
    if (!Number.isFinite(mins) || mins <= 0) return;

    const { sesiones: nuevas } = agregarSesionCardio(
      sesiones, hoy, subtipo, mins, pesoKg, Number(km) || 0
    );
    alGuardar(nuevas);
    setMinutos("");
    setKm("");
  };

  return (
    <Panel titulo="Cardio">
      <div className="campo-fila">
        <Select
          valor={subtipo}
          alCambiar={setSubtipo}
          opciones={Object.entries(TIPOS_CARDIO).map(([id, t]) => ({ id, nombre: t.nombre }))}
        />
      </div>

      <div className="campo-fila">
        <input
          className="input-rosa"
          type="number"
          value={minutos}
          placeholder="minutos"
          onChange={(e) => setMinutos(e.target.value)}
        />
        {pideDistancia && (
          <input
            className="input-rosa"
            type="number"
            value={km}
            placeholder="km"
            onChange={(e) => setKm(e.target.value)}
          />
        )}
        <button type="button" className="habit-btn" onClick={agregar}>
          Agregar
        </button>
      </div>
    </Panel>
  );
}

function FormularioFuerza({
  pesoKg,
  sesiones,
  hoy,
  catalogo,
  alGuardar,
  alAgregarPropio,
}: {
  pesoKg: number;
  sesiones: any;
  hoy: string;
  catalogo: Record<string, { nombre: string; grupo: string }>;
  alGuardar: (s: any) => void;
  alAgregarPropio: (nombre: string) => void;
}) {
  const [ejercicio, setEjercicio] = useState("sentadilla");
  const [intensidad, setIntensidad] = useState("moderada");
  const [series, setSeries] = useState("");
  const [repeticiones, setRepeticiones] = useState("");
  const [minutos, setMinutos] = useState("");
  const [agregandoPropio, setAgregandoPropio] = useState(false);
  const [nombrePropio, setNombrePropio] = useState("");

  const agregar = () => {
    const mins = Number(minutos);
    if (!Number.isFinite(mins) || mins <= 0) return;

    const { sesiones: nuevas } = agregarSesionFuerza(
      sesiones, hoy, ejercicio, intensidad,
      Number(series) || 0, Number(repeticiones) || 0, mins, pesoKg
    );
    alGuardar(nuevas);
    setSeries("");
    setRepeticiones("");
    setMinutos("");
  };

  return (
    <Panel titulo="Pesas">
      <div className="campo-fila">
        <Select
          valor={ejercicio}
          alCambiar={setEjercicio}
          opciones={Object.entries(catalogo).map(([id, e]) => ({
            id, nombre: e.nombre, grupo: e.grupo,
          }))}
        />
        {/* Si el ejercicio que hacés no está en la lista, lo
            agregás vos y queda guardado para las próximas. */}
        <button
          type="button"
          className="habit-btn"
          onClick={() => setAgregandoPropio((v) => !v)}
          aria-label="Agregar un ejercicio que no está en la lista"
        >
          +
        </button>
      </div>

      {agregandoPropio && (
        <div className="campo-fila">
          <input
            className="input-rosa"
            value={nombrePropio}
            placeholder="nombre del ejercicio"
            autoFocus
            onChange={(e) => setNombrePropio(e.target.value)}
          />
          <button
            type="button"
            className="habit-btn"
            onClick={() => {
              if (!nombrePropio.trim()) return;
              alAgregarPropio(nombrePropio.trim());
              setNombrePropio("");
              setAgregandoPropio(false);
            }}
          >
            Guardar
          </button>
        </div>
      )}

      <div className="campo-fila">
        <Select
          valor={intensidad}
          alCambiar={setIntensidad}
          opciones={Object.entries(INTENSIDAD_PESAS).map(([id, i]) => ({ id, nombre: i.nombre }))}
        />
      </div>

      <div className="campo-fila">
        <input className="input-rosa" type="number" value={series} placeholder="series"
          onChange={(e) => setSeries(e.target.value)} />
        <input className="input-rosa" type="number" value={repeticiones} placeholder="reps"
          onChange={(e) => setRepeticiones(e.target.value)} />
        <input className="input-rosa" type="number" value={minutos} placeholder="min"
          onChange={(e) => setMinutos(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>
          Agregar
        </button>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------
   PASOS
   ----------------------------------------------------------
   Se cargan a mano. Una app web no puede leer el contador de
   pasos del teléfono: eso lo maneja Salud en el iPhone y
   Health Connect en Android, y ninguno le da acceso al
   navegador.

   Empaquetada con Capacitor sí se puede pedir ese permiso. El
   cómo está en PASOS-NATIVOS.md, con la API ya verificada y
   el bloqueante anotado: el plugin pide Capacitor 8 y el
   proyecto está en 7.

   Cuando eso se resuelva, el reemplazo es acá nomás: el dato
   se guarda por fecha, en el mismo formato que devuelve el
   plugin. La carga a mano conviene dejarla igual de respaldo,
   para los teléfonos sin Health Connect o si se niega el
   permiso.
   ---------------------------------------------------------- */
function Pasos() {
  const [datos, setDatos] = useState(() => cargarPasos());
  const [cantidad, setCantidad] = useState("");

  const hoy = fechaDeHoy();
  const deHoy = datos[hoy] ?? 0;

  const guardar = () => {
    const numero = Number(cantidad);
    if (!Number.isFinite(numero) || numero < 0) return;

    setDatos({ ...registrarPasos(datos, hoy, numero) });
    setCantidad("");
  };

  return (
    <Panel titulo="Pasos">
      <div className="campo-fila">
        <input
          className="input-rosa"
          type="number"
          min={0}
          value={cantidad}
          placeholder="pasos de hoy"
          onChange={(e) => setCantidad(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
        />
        <button type="button" className="habit-btn" onClick={guardar}>
          Guardar
        </button>
      </div>

      <Ayuda>
        Pasos de hoy: <b>{deHoy}</b>
      </Ayuda>
    </Panel>
  );
}
