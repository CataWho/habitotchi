import { useMemo, useState } from "react";
import { fechaDeHoy, ultimosSieteDias } from "@/lib/fechas";
import {
  ANIMOS,
  ANIMO_PIXELES,
  agregarMedicacion,
  alternarToma,
  animosDelDia,
  anotarAnimo,
  borrarAnimo,
  cargarAnimoDiario,
  cargarMedicaciones,
  cargarTomas,
  eliminarMedicacion,
  horaDeAhora,
  resumenDeAnimo,
  yaLaTomaste,
} from "@/lib/salud";
import {
  agregarCiclo, agregarPeso, cargarHistorialCiclo, cargarHistorialPeso,
  cargarPerfil, eliminarCiclo, eliminarPeso, ultimoCiclo,
} from "@/lib/perfil";
import { CLAVES } from "@/lib/almacenamiento";
import { useGuardado } from "@/estado/useGuardado";
import { GraficoDeLineas } from "@/componentes/comunes/Grafico";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel } from "@/componentes/comunes/Panel";

/* ==========================================================
   SALUD PERSONAL
   ==========================================================
   Ánimo diario, medicaciones, peso y ciclo.

   ---------- UNA REGLA IMPORTANTE ----------
   Nada de esto suma ni resta puntos, ni cambia el ánimo de tu
   mascota. Anotar que hoy estuviste triste no puede ponerte en
   falta: sería convertir un mal día en un castigo. Lo mismo
   con el peso y el ciclo. Son registros para vos.
   ========================================================== */

export function Salud() {
  /* Con useGuardado y no con useState: el interruptor que
     decide si se ve el panel del ciclo está en Ajustes, así
     que hay que enterarse cuando lo tocan desde allá. */
  const perfil = useGuardado(CLAVES.perfil, cargarPerfil);

  return (
    <Pagina nombre="Salud">
      <AnimoDelDia />
      <Medicaciones />
      <RegistroDePeso />
      {perfil.cicloActivado !== false && <Ciclo />}

      <Ayuda>
        Nada de lo que anotás acá suma ni resta puntos. Es tu registro, no una meta que
        cumplir.
      </Ayuda>
    </Pagina>
  );
}

function CaritaDeAnimo({ animoId, color }: { animoId: string; color: string }) {
  const pixeles = (ANIMO_PIXELES as Record<string, string[]>)[animoId] ?? [];

  return (
    <div
      className="animo-cara"
      style={{ gridTemplateColumns: `repeat(8, 3px)`, display: "grid" }}
      aria-hidden="true"
    >
      {pixeles.flatMap((fila, y) =>
        [...fila].map((ch, x) => (
          <div
            key={`${y}-${x}`}
            style={{ width: 3, height: 3, backgroundColor: ch === "O" ? color : "transparent" }}
          />
        ))
      )}
    </div>
  );
}

function AnimoDelDia() {
  const [datos, setDatos] = useState(() => cargarAnimoDiario());
  const [nota, setNota] = useState("");

  const hoy = fechaDeHoy();
  const delDia = animosDelDia(datos, hoy);
  const resumen = resumenDeAnimo(datos, ultimosSieteDias());

  const anotar = (animoId: string) => {
    const nuevos = anotarAnimo(datos, hoy, horaDeAhora(), animoId, nota);
    setDatos({ ...nuevos });
    setNota("");
  };

  return (
    <Panel titulo="¿Cómo te sentís?">
      <div className="animo-botones">
        {ANIMOS.map((animo) => (
          <button
            key={animo.id}
            type="button"
            className="animo-btn"
            style={{ borderColor: animo.color }}
            onClick={() => anotar(animo.id)}
          >
            <CaritaDeAnimo animoId={animo.id} color={animo.color} />
            <span>{animo.nombre}</span>
          </button>
        ))}
      </div>

      <div className="campo-fila">
        <input
          className="input-rosa"
          value={nota}
          placeholder="Nota (opcional)"
          onChange={(e) => setNota(e.target.value)}
        />
      </div>

      {delDia.length === 0 ? (
        <Ayuda>Todavía no anotaste cómo te sentís hoy.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {delDia.map((registro: any, i: number) => {
            const datosAnimo = ANIMOS.find((a) => a.id === registro.animo);
            return (
              <Fila
                key={i}
                alBorrar={() => setDatos({ ...borrarAnimo(datos, hoy, i) })}
              >
                {registro.hora} · <b>{datosAnimo?.nombre ?? registro.animo}</b>
                {registro.nota && ` · ${registro.nota}`}
              </Fila>
            );
          })}
        </ul>
      )}

      <Ayuda>
        Esta semana:{" "}
        {ANIMOS.map((a) => `${a.nombre.toLowerCase()} ${resumen[a.id] ?? 0}`).join(" · ")}
      </Ayuda>
    </Panel>
  );
}

function Medicaciones() {
  const [lista, setLista] = useState(() => cargarMedicaciones());
  const [tomas, setTomas] = useState(() => cargarTomas());
  const [nombre, setNombre] = useState("");
  const [dosis, setDosis] = useState("");
  const [horarios, setHorarios] = useState("");

  const hoy = fechaDeHoy();

  const agregar = () => {
    if (!nombre.trim()) return;

    const horas = horarios.split(",").map((h) => h.trim()).filter(Boolean);
    setLista([...agregarMedicacion(lista, nombre.trim(), dosis.trim(), horas)]);
    setNombre("");
    setDosis("");
    setHorarios("");
  };

  return (
    <Panel titulo="Medicaciones">
      {lista.length === 0 ? (
        <Ayuda>No cargaste ninguna medicación.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {lista.map((medicacion: any) => (
            <li key={medicacion.id} className="fila-simple">
              <span>
                <b>{medicacion.nombre}</b>
                {medicacion.dosis && ` · ${medicacion.dosis}`}
                <br />
                {medicacion.horarios.map((horario: string) => {
                  const tomada = yaLaTomaste(tomas, hoy, medicacion.id, horario);
                  return (
                    <button
                      key={horario}
                      type="button"
                      className={tomada ? "habit-btn" : "habit-btn habit-btn--restar"}
                      onClick={() =>
                        setTomas({ ...alternarToma(tomas, hoy, medicacion.id, horario) })
                      }
                    >
                      {horario} {tomada ? "✓" : ""}
                    </button>
                  );
                })}
              </span>
              <button
                type="button"
                className="fila-borrar"
                onClick={() => setLista([...eliminarMedicacion(lista, medicacion.id)])}
                aria-label="Borrar"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="campo-fila">
        <input className="input-rosa" value={nombre} placeholder="nombre"
          onChange={(e) => setNombre(e.target.value)} />
        <input className="input-rosa" value={dosis} placeholder="dosis"
          onChange={(e) => setDosis(e.target.value)} />
      </div>
      <div className="campo-fila">
        <input className="input-rosa" value={horarios} placeholder="09:00, 21:00"
          onChange={(e) => setHorarios(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>Agregar</button>
      </div>
    </Panel>
  );
}

function RegistroDePeso() {
  const [historial, setHistorial] = useState(() => cargarHistorialPeso());
  const [kg, setKg] = useState("");

  const agregar = () => {
    const numero = Number(kg);
    if (!Number.isFinite(numero) || numero <= 0) return;

    setHistorial([...agregarPeso(historial, fechaDeHoy(), numero)]);
    setKg("");
  };

  /* El gráfico quiere {fecha, valor}; el historial guarda
     {fecha, pesoKg}. Se traduce acá y no en lib/perfil para no
     tocar el formato con el que ya están guardados los datos
     de todo el mundo. */
  const mediciones = useMemo(
    () => historial.map((e: any) => ({ fecha: e.fecha, valor: e.pesoKg })),
    [historial]
  );

  return (
    <Panel titulo="Registro de peso">
      <div className="campo-fila">
        <input className="input-rosa" type="number" value={kg} placeholder="kg de hoy"
          onChange={(e) => setKg(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>Guardar</button>
      </div>

      {historial.length === 0 ? (
        <Ayuda>Todavía no hay ningún registro.</Ayuda>
      ) : (
        <>
          <GraficoDeLineas
            mediciones={mediciones}
            etiqueta="kg"
            vacio="Anotá tu peso al menos dos veces para ver cómo se mueve."
          />

          <ul className="lista-simple">
            {historial.slice(0, 8).map((entrada: any, i: number) => (
              <Fila key={i} alBorrar={() => setHistorial([...eliminarPeso(historial, i)])}>
                {entrada.fecha} · <b>{entrada.pesoKg} kg</b>
              </Fila>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function Ciclo() {
  const [historial, setHistorial] = useState(() => cargarHistorialCiclo());
  const [fecha, setFecha] = useState(fechaDeHoy());
  const [duracion, setDuracion] = useState("");

  const ultimo = ultimoCiclo(historial);

  const agregar = () => {
    setHistorial([...agregarCiclo(historial, fecha, Number(duracion) || 0)]);
    setDuracion("");
  };

  return (
    <Panel titulo="Ciclo menstrual">
      <div className="campo-fila">
        {/* Un campo de fecha no admite placeholder, así que sin
            aria-label un lector de pantalla solo dice "fecha"
            sin decir de qué. */}
        <input className="input-rosa" type="date" value={fecha}
          aria-label="Cuándo empezó"
          onChange={(e) => setFecha(e.target.value)} />
        <input className="input-rosa" type="number" value={duracion} placeholder="días"
          onChange={(e) => setDuracion(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>Guardar</button>
      </div>

      {ultimo && <Ayuda>Último registro: {ultimo.fecha}</Ayuda>}

      {historial.length === 0 ? (
        <Ayuda>Todavía no cargaste ningún registro.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {historial.slice(0, 6).map((entrada: any, i: number) => (
            <Fila key={i} alBorrar={() => setHistorial([...eliminarCiclo(historial, i)])}>
              {entrada.fecha}
              {entrada.duracion > 0 && ` · ${entrada.duracion} días`}
            </Fila>
          ))}
        </ul>
      )}
    </Panel>
  );
}
