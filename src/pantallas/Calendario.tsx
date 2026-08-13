import { useCallback, useEffect, useState } from "react";
import {
  INICIALES_DE_SEMANA, diasDelMes, fechaDeHoy, nombreDelMes,
} from "@/lib/fechas";
import {
  agregarEvento, cargarCalendario, eliminarEvento, eventosDelDia,
} from "@/lib/trabajo";
import {
  conectar, desconectar, sePuedeConectar, traerEventos, yaEstaConectado,
  type EventoDeGoogle,
} from "@/lib/google-calendar";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel } from "@/componentes/comunes/Panel";

/* ==========================================================
   CALENDARIO
   ==========================================================
   El mes completo, con tus propias notas por día, y —si lo
   conectás— también tus eventos reales de Google.

   La grilla siempre tiene 6 filas, aunque el mes entre en 5.
   Si cambiara de alto al pasar de mes, el calendario "saltaría"
   y marea.

   ---------- LOS DE GOOGLE NO SE PUEDEN BORRAR ----------
   Tus notas se borran con la crucecita; los de Google no
   tienen. Borrar acá algo que en realidad vive en tu Google
   Calendar sería una sorpresa fea, y encima el permiso que
   pedimos es de solo lectura: ni podríamos.
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

  const google = useGoogleCalendar(anio, mes);
  const deGoogleEseDia = google.eventos.filter((e) => e.fecha === seleccionado);

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
            const tieneDeGoogle = google.eventos.some((e) => e.fecha === dia.texto);
            const clases = [
              "mes-dia",
              dia.esDeEsteMes ? "" : "mes-dia--otro",
              dia.esHoy ? "mes-dia--hoy" : "",
              dia.texto === seleccionado ? "mes-dia--elegido" : "",
              tieneNotas ? "mes-dia--con-notas" : "",
              tieneDeGoogle ? "mes-dia--con-google" : "",
            ].filter(Boolean).join(" ");

            return (
              <button
                key={dia.texto}
                type="button"
                className={clases}
                onClick={() => setSeleccionado(dia.texto)}
              >
                {/* El número va en su propio span: es lo que el
                    CSS agarra para dibujar el círculo de hoy. */}
                <span className="mes-dia-numero">{dia.numero}</span>

                {(tieneNotas || tieneDeGoogle) && (
                  <span className="mes-dia-puntos">
                    {tieneNotas && <span className="mes-punto" />}
                    {tieneDeGoogle && <span className="mes-punto mes-punto--google" />}
                  </span>
                )}
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

        {delDia.length === 0 && deGoogleEseDia.length === 0 ? (
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

            {deGoogleEseDia.map((evento, i) => (
              <li key={`g${i}`} className="fila-simple fila-simple--google">
                <span>
                  {evento.hora && <b>{evento.hora} · </b>}
                  {evento.titulo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PanelDeGoogle google={google} />
    </Pagina>
  );
}

/* ----------------------------------------------------------
   LOS EVENTOS DE GOOGLE DEL MES QUE ESTÁS MIRANDO
   ----------------------------------------------------------
   Se piden de nuevo cada vez que cambiás de mes, y no todos
   juntos de una: traer un año entero para mostrar 30 días
   sería pedirle a Google (y a tus datos móviles) mucho más de
   lo que se ve.
   ---------------------------------------------------------- */
function useGoogleCalendar(anio: number, mes: number) {
  const [eventos, setEventos] = useState<EventoDeGoogle[]>([]);
  const [conectado, setConectado] = useState(() => yaEstaConectado());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const traer = useCallback(async () => {
    if (!yaEstaConectado()) return;

    setCargando(true);
    setError("");

    try {
      /* Del 1 del mes al 1 del siguiente. El día 0 del mes que
         viene es el último de éste, pero con el 1 alcanza y se
         lee más fácil. */
      const eventosDelMes = await traerEventos(
        new Date(anio, mes, 1),
        new Date(anio, mes + 1, 1)
      );
      setEventos(eventosDelMes);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron traer los eventos.");
      /* Si el permiso venció, la librería ya soltó el token:
         hay que reflejarlo para volver a ofrecer Conectar. */
      setConectado(yaEstaConectado());
      setEventos([]);
    } finally {
      setCargando(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    void traer();
  }, [traer]);

  const pedirPermiso = async () => {
    setError("");
    try {
      await conectar();
      setConectado(true);
      await traer();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo conectar.");
    }
  };

  const salir = () => {
    desconectar();
    setConectado(false);
    setEventos([]);
    setError("");
  };

  return { eventos, conectado, cargando, error, pedirPermiso, salir };
}

function PanelDeGoogle({ google }: { google: ReturnType<typeof useGoogleCalendar> }) {
  /* Sin Client ID configurado no hay nada que ofrecer, así que
     el panel entero no existe: mejor eso que un botón que al
     tocarlo falla. */
  if (!sePuedeConectar()) return null;

  return (
    <Panel titulo="Google Calendar">
      {google.conectado ? (
        <>
          <div className="campo-fila">
            <button type="button" className="habit-btn habit-btn--restar" onClick={google.salir}>
              Desconectar
            </button>
          </div>
          <Ayuda>
            {google.cargando
              ? "Trayendo tus eventos…"
              : "Tus eventos aparecen junto a tus notas. Desde acá no se pueden editar ni borrar."}
          </Ayuda>
        </>
      ) : (
        <>
          <div className="campo-fila">
            <button type="button" className="habit-btn" onClick={google.pedirPermiso}>
              Conectar
            </button>
          </div>
          <Ayuda>
            Para ver también tus eventos de Google acá. Solo los lee: no puede cambiar nada
            en tu calendario.
          </Ayuda>
        </>
      )}

      {google.error && <Ayuda>{google.error}</Ayuda>}
    </Panel>
  );
}
