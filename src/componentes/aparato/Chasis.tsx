import { useHabitotchi } from "@/estado/useHabitotchi";
import { calcularEstadoVida, faltaParaLaProximaEtapa, UMBRAL_ADULTO, UMBRAL_JOVEN } from "@/lib/crecimiento";
import { monedasDisponibles, rachaActual } from "@/lib/tienda";

/* ==========================================================
   EL CHASIS
   ==========================================================
   Lo que queda FUERA de la pantalla: los marcadores, la barra
   de crecimiento y los tres botones.

   En modo inmersivo se repliega para que la pantalla ocupe su
   lugar. Eso lo hace el CSS a partir de la clase del body;
   acá no hay que calcular nada.
   ========================================================== */

export function Marcadores() {
  const { registro, metas, vida, compras } = useHabitotchi();

  const estadoVida = calcularEstadoVida(registro, metas, vida?.desde);
  const racha = rachaActual(registro, metas);

  /* Las monedas nunca se muestran en negativo. Puede pasar si
     los datos guardados quedaron inconsistentes, y un número
     rojo gigante no le dice nada útil a nadie. */
  const monedas = Math.max(0, monedasDisponibles(registro, metas, compras));

  return (
    <div className="marcadores">
      <Marcador valor={estadoVida.puntos} etiqueta="puntos" />
      <Marcador valor={racha} etiqueta="racha" />
      <Marcador valor={monedas} etiqueta="monedas" monedas />
    </div>
  );
}

function Marcador({
  valor,
  etiqueta,
  monedas = false,
}: {
  valor: number;
  etiqueta: string;
  monedas?: boolean;
}) {
  return (
    <div className={monedas ? "marcador marcador--monedas" : "marcador"}>
      <span className="marcador-numero">{valor}</span>
      <span className="marcador-etiqueta">{etiqueta}</span>
    </div>
  );
}

/* La barra de abajo: cuánto falta para la próxima etapa */
export function BarraDeEtapa() {
  const { registro, metas, vida } = useHabitotchi();
  const { puntos } = calcularEstadoVida(registro, metas, vida?.desde);
  const falta = faltaParaLaProximaEtapa(puntos);

  const texto = falta
    ? `Faltan ${falta.faltan} ${falta.faltan === 1 ? "día bueno" : "días buenos"} para ${falta.proxima}`
    : "¡Tu mascota ya es adulta!";

  /* Cuánto de la etapa actual llevás recorrido */
  const desde = puntos >= UMBRAL_JOVEN ? UMBRAL_JOVEN : 0;
  const hasta = puntos >= UMBRAL_JOVEN ? UMBRAL_ADULTO : UMBRAL_JOVEN;
  const porcentaje = falta ? ((puntos - desde) / (hasta - desde)) * 100 : 100;

  return (
    <div className="progreso-etapa">
      <p className="progreso-etapa-texto">{texto}</p>
      <div
        className="habit-bar-track"
        role="progressbar"
        aria-valuenow={Math.round(porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={texto}
      >
        <div className="habit-bar-fill" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

/* ==========================================================
   LOS BOTONES A · B · C
   ==========================================================
   Los tres abren un panel modal, como el cementerio siempre
   hizo: A el cementerio, B el detalle de hoy, C las
   estadísticas. Antes B y C solo hacían que la mascota dijera
   una frase suelta que desaparecía enseguida — esto reusa esos
   mismos datos, pero en un panel que se puede releer con
   calma.
   ========================================================== */

interface PropsBotonera {
  onCementerio: () => void;
  onHoy: () => void;
  onEstadisticas: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export function Botonera({
  onCementerio, onHoy, onEstadisticas, onAnterior, onSiguiente,
}: PropsBotonera) {
  /* Las flechas se ven siempre (son la navegación entre
     pestañas); A/B/C solo tienen sentido en Hogar y el CSS
     los desvanece al entrar a las otras. */
  return (
    <nav className="botonera" aria-label="Botones del aparato">
      <button type="button" className="page-arrow" onClick={onAnterior} aria-label="Pestaña anterior">
        ‹
      </button>

      <div className="buttons">
        <Boton letra="A" pie="cementerio" onClick={onCementerio} />
        <Boton letra="B" pie="hoy" onClick={onHoy} />
        <Boton letra="C" pie="estadísticas" onClick={onEstadisticas} />
      </div>

      <button type="button" className="page-arrow" onClick={onSiguiente} aria-label="Pestaña siguiente">
        ›
      </button>
    </nav>
  );
}

/* La etiqueta va DENTRO del botón, no en una fila aparte.
   Estaban en dos filas distintas con separaciones distintas,
   así que "cementerio" y "semana" quedaban corridos respecto
   de su botón. Anidados no se pueden desalinear. */
function Boton({ letra, pie, onClick }: { letra: string; pie: string; onClick: () => void }) {
  return (
    <span className="btn-columna">
      <button type="button" className="btn" onClick={onClick} aria-label={pie}>
        <span className="btn-face">{letra}</span>
      </button>
      <span className="btn-pie">{pie}</span>
    </span>
  );
}
