import { useState } from "react";
import { Aparato, Pantalla } from "@/componentes/aparato/Aparato";
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
import { useHabitotchi } from "@/estado/useHabitotchi";
import { MASCOTAS } from "@/datos/mascotas";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";
import { obtenerMeta, obtenerValor } from "@/lib/registro";
import { fechaDeHoy, ultimosSieteDias } from "@/lib/fechas";
import { diaEsBueno } from "@/lib/crecimiento";
import { mejorRacha, rachaActual, totalDiasBuenos } from "@/lib/tienda";

/* Las 9 pestañas, en el orden en que se deslizan */
const PANTALLAS = [
  { nombre: "Hogar", Componente: Hogar },
  { nombre: "Alimentación", Componente: Alimentacion },
  { nombre: "Ejercicio", Componente: Ejercicio },
  { nombre: "Hobbies", Componente: Hobbies },
  { nombre: "Trabajo", Componente: Trabajo },
  { nombre: "Calendario", Componente: Calendario },
  { nombre: "Salud", Componente: Salud },
  { nombre: "Juegos", Componente: Juegos },
  { nombre: "Tienda", Componente: Tienda },
];

export function App() {
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
        aria-label="Abrir ajustes"
      >
        ⚙
      </button>

      <Aparato>
        <h1 className="brand">HABITOTCHI</h1>

        <Pantalla>
          <Paginas navegacion={navegacion}>
            {PANTALLAS.map(({ nombre, Componente }) => (
              <Componente key={nombre} />
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
        <Puntitos navegacion={navegacion} nombres={PANTALLAS.map((p) => p.nombre)} />
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
    <div className="chef-overlay" onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">Cementerio</h2>

        {cementerio.length === 0 ? (
          <p className="ayuda-chica">Todavía no perdiste ninguna mascota.</p>
        ) : (
          <ul className="lista-simple">
            {cementerio.map((entrada, i) => (
              <li key={`${entrada.nombre}-${i}`} className="fila-simple">
                <b>{entrada.nombre}</b> · {MASCOTAS[entrada.mascota]?.nombre ?? entrada.mascota} ·
                llegó a {entrada.etapaAlcanzada}
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
    <div className="chef-overlay" onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">Hoy</h2>

        {buenDia === null ? (
          <p className="ayuda-chica">Todavía no anotaste nada hoy.</p>
        ) : (
          <p className="ayuda-chica">
            {buenDia ? "¡Llegaste a todas tus metas!" : "Todavía te falta alguna meta."}
          </p>
        )}

        <ul className="lista-simple">
          {habitos.map(([id, habito]) => {
            const valor = obtenerValor(registro, hoy, id);

            if (habito.tipo !== "meta") {
              return (
                <li key={id} className="fila-simple">
                  <span>{habito.nombre} · {valor} {habito.unidad}</span>
                </li>
              );
            }

            const meta = obtenerMeta(metas, id);
            const porcentaje = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;

            return (
              <li key={id} className="fila-simple" style={{ flexDirection: "column", alignItems: "stretch", gap: "4px" }}>
                <span>{habito.nombre} · {valor} / {meta} {habito.unidad}</span>
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
    <div className="chef-overlay" onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <h2 className="panel-title">Estadísticas</h2>

        <ul className="lista-simple">
          <li className="fila-simple"><span>Racha actual · <b>{actual}</b> {actual === 1 ? "día" : "días"}</span></li>
          <li className="fila-simple"><span>Mejor racha · <b>{mejor}</b> {mejor === 1 ? "día" : "días"}</span></li>
          <li className="fila-simple"><span>Esta semana · <b>{semana}</b> de 7 días buenos</span></li>
          <li className="fila-simple"><span>Total de días buenos · <b>{totalBuenos}</b></span></li>
        </ul>
      </div>
    </div>
  );
}
