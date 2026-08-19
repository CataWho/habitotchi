import { useState } from "react";
import { tr } from "@/lib/idioma";
import { Aparato, Pantalla, usarEstiloDelFondo } from "@/componentes/aparato/Aparato";
import { Botonera } from "@/componentes/aparato/Chasis";
import { Paginas, Puntitos, usePaginas } from "@/componentes/aparato/Paginas";
import { Hogar } from "@/pantallas/Hogar";
import { Alimentacion } from "@/pantallas/Alimentacion";
import { Ejercicio } from "@/pantallas/Ejercicio";
import { Hobbies } from "@/pantallas/Hobbies";
import { Trabajo } from "@/pantallas/Trabajo";
import { Calendario } from "@/pantallas/Calendario";
import { Salud } from "@/pantallas/Salud";
import { Juegos } from "@/pantallas/Juegos";
import { Tienda } from "@/pantallas/Tienda";
import { Ajustes } from "@/componentes/Ajustes";
import { PortonDeIngreso } from "@/componentes/PortonDeIngreso";
import { hayNubeConfigurada, usarSesion } from "@/lib/nube";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { MASCOTAS } from "@/datos/mascotas";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";
import { obtenerMeta, obtenerValor } from "@/lib/registro";
import { fechaDeHoy, ultimosSieteDias } from "@/lib/fechas";
import { diaEsBueno } from "@/lib/crecimiento";
import { mejorRacha, rachaActual, totalDiasBuenos } from "@/lib/tienda";

/* Las 9 pestañas, en el orden en que se deslizan */
const PANTALLAS = [
  { clave: "pantallaHogar", Componente: Hogar },
  { clave: "pantallaAlimentacion", Componente: Alimentacion },
  { clave: "pantallaEjercicio", Componente: Ejercicio },
  { clave: "pantallaHobbies", Componente: Hobbies },
  { clave: "pantallaTrabajo", Componente: Trabajo },
  { clave: "pantallaCalendario", Componente: Calendario },
  { clave: "pantallaSalud", Componente: Salud },
  { clave: "pantallaJuegos", Componente: Juegos },
  { clave: "pantallaTienda", Componente: Tienda },
];

/* ==========================================================
   QUIÉN ENTRA
   ==========================================================
   Sin sesión no hay app: todo lo que anotás vive en tu cuenta,
   así que cambiar de celular o que el navegador limpie los
   datos del sitio ya no se lleva puesto nada.

   ---------- SE PUEDE ABRIR SIN INTERNET ----------
   La sesión guardada se lee del propio dispositivo, sin pedirle
   nada a la red. O sea que si ya entraste alguna vez, la app
   abre igual sin conexión. Internet hace falta para
   registrarse, para entrar por primera vez en un aparato, o
   cuando vence el permiso guardado.
   ========================================================== */
export function App() {
  const { cargando, sesion, recuperandoContraseña } = usarSesion();

  /* Si no hay Supabase configurado (por ejemplo, desarrollo
     local sin las variables de entorno) no se puede pedir
     cuenta a nadie: la app abre igual, como antes. */
  const sinNube = !hayNubeConfigurada();

  if (cargando && !sinNube) {
    return (
      <>
        <Cielo />
        <p className="cargando-sesion">{tr("unSegundo")}</p>
      </>
    );
  }

  if (!sesion && !sinNube) {
    return (
      <>
        <Cielo />
        <PortonDeIngreso recuperandoContraseña={recuperandoContraseña} />
      </>
    );
  }

  return <Habitotchi />;
}

function Habitotchi() {
  const [cementerioAbierto, setCementerioAbierto] = useState(false);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [hoyAbierto, setHoyAbierto] = useState(false);
  const [statsAbiertas, setStatsAbiertas] = useState(false);

  const navegacion = usePaginas(PANTALLAS.length);

  return (
    <>
      <Cielo />

      <button
        type="button"
        className="ajustes-boton"
        onClick={() => setAjustesAbiertos(true)}
        aria-label={tr("aparatoAbrirAjustes")}
      >
        ⚙
      </button>

      <Aparato>
        <h1 className="brand">HABITOTCHI</h1>

        <Pantalla>
          <Paginas navegacion={navegacion}>
            {PANTALLAS.map(({ clave, Componente }) => (
              <Componente key={clave} />
            ))}
          </Paginas>
        </Pantalla>

        <Botonera
          onCementerio={() => setCementerioAbierto(true)}
          onHoy={() => setHoyAbierto(true)}
          onEstadisticas={() => setStatsAbiertas(true)}
          onAnterior={navegacion.anterior}
          onSiguiente={navegacion.siguiente}
        />
        <Puntitos navegacion={navegacion} nombres={PANTALLAS.map((p) => tr(p.clave))} />
      </Aparato>

      {cementerioAbierto && <Cementerio onCerrar={() => setCementerioAbierto(false)} />}
      {hoyAbierto && <PanelDeHoy onCerrar={() => setHoyAbierto(false)} />}
      {statsAbiertas && <PanelDeEstadisticas onCerrar={() => setStatsAbiertas(false)} />}
      {ajustesAbiertos && <Ajustes onCerrar={() => setAjustesAbiertos(false)} />}
    </>
  );
}

/* El cielo nocturno de atrás: estrellitas que titilan y
   alguna fugaz cada tanto. Todo con CSS, ni una imagen. */
function Cielo() {
  return (
    <div className="cielo" aria-hidden="true">
      <span className="fugaz" />
      <span className="fugaz" />
      <span className="fugaz" />
    </div>
  );
}

function Cementerio({ onCerrar }: { onCerrar: () => void }) {
  const cementerio = useHabitotchi((e) => e.cementerio);

  return (
    <div className="chef-overlay chef-overlay--pantalla" style={usarEstiloDelFondo()} onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">{tr("cementerio")}</h2>

        {cementerio.length === 0 ? (
          <p className="ayuda-chica">{tr("sinCementerio")}</p>
        ) : (
          <ul className="lista-simple">
            {cementerio.map((entrada, i) => (
              <li key={`${entrada.nombre}-${i}`} className="fila-simple">
                <b>{entrada.nombre}</b> · {tr(MASCOTAS[entrada.mascota]?.clave ?? "") || entrada.mascota} ·
                {tr("llegoA", { etapa: tr("etapa" + entrada.etapaAlcanzada.charAt(0).toUpperCase() + entrada.etapaAlcanzada.slice(1)) })}
                <br />
                <span className="ayuda-chica">
                  {entrada.desde} — {entrada.hasta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   B · EL DETALLE DE HOY
   ----------------------------------------------------------
   Cada hábito de tipo "meta", con la barra hasta la meta que
   VOS elegiste (el lápiz de cada hábito la guarda con
   cambiarMeta — esto solo la lee, no la fija). Los de tipo
   "registro" (los dulces) van sin barra, es solo un conteo.
   ---------------------------------------------------------- */
function PanelDeHoy({ onCerrar }: { onCerrar: () => void }) {
  const registro = useHabitotchi((e) => e.registro);
  const metas = useHabitotchi((e) => e.metas);
  const hoy = fechaDeHoy();

  const habitos = Object.entries(HABITOS_POR_DEFECTO);
  const buenDia = diaEsBueno(registro, metas, hoy);

  return (
    <div className="chef-overlay chef-overlay--pantalla" style={usarEstiloDelFondo()} onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">{tr("detalleDeHoy")}</h2>

        {buenDia === null ? (
          <p className="ayuda-chica">Todavía no anotaste nada hoy.</p>
        ) : (
          <p className="ayuda-chica">
            {buenDia ? tr("llegasteATodas") : tr("faltaAlgunaMeta")}
          </p>
        )}

        <ul className="lista-simple">
          {habitos.map(([id, habito]) => {
            const valor = obtenerValor(registro, hoy, id);

            if (habito.tipo !== "meta") {
              return (
                <li key={id} className="fila-simple">
                  <span>{tr(habito.clave)} · {valor} {tr(habito.unidad)}</span>
                </li>
              );
            }

            const meta = obtenerMeta(metas, id);
            const porcentaje = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;

            return (
              <li key={id} className="fila-simple" style={{ flexDirection: "column", alignItems: "stretch", gap: "4px" }}>
                <span>{tr(habito.clave)} · {valor} / {meta} {tr(habito.unidad)}</span>
                <div className="habit-bar-track">
                  <div className="habit-bar-fill" style={{ width: `${porcentaje}%`, background: habito.color }} />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="ayuda-chica">
          La meta de cada hábito la elegís vos con el lápiz (✎), en su propia pestaña.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   C · ESTADÍSTICAS
   ----------------------------------------------------------
   Racha actual, mejor racha histórica y total de días buenos.
   Los tres se calculaban ya en lib/tienda.ts (rachaActual se
   usaba para el marcador de "racha"), pero mejorRacha y
   totalDiasBuenos no se mostraban en ningún lado.
   ---------------------------------------------------------- */
function PanelDeEstadisticas({ onCerrar }: { onCerrar: () => void }) {
  const registro = useHabitotchi((e) => e.registro);
  const metas = useHabitotchi((e) => e.metas);

  const actual = rachaActual(registro, metas);
  const mejor = mejorRacha(registro, metas);
  const totalBuenos = totalDiasBuenos(registro, metas);
  const semana = ultimosSieteDias().filter((d) => diaEsBueno(registro, metas, d.texto) === true).length;

  return (
    <div className="chef-overlay chef-overlay--pantalla" style={usarEstiloDelFondo()} onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">{tr("estadisticas")}</h2>

        <ul className="lista-simple">
          <li className="fila-simple"><span>{tr("rachaActual")} · <b>{actual}</b> {tr("dia", { n: actual }).replace(String(actual) + " ", "")}</span></li>
          <li className="fila-simple"><span>{tr("mejorRacha")} · <b>{mejor}</b> {tr("dia", { n: mejor }).replace(String(mejor) + " ", "")}</span></li>
          <li className="fila-simple"><span>{tr("estaSemanaBuenos", { n: semana })}</span></li>
          <li className="fila-simple"><span>{tr("totalDiasBuenos")} · <b>{totalBuenos}</b></span></li>
        </ul>
      </div>
    </div>
  );
}
