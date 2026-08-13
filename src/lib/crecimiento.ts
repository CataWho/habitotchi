import type { Animo, ComoFueElDia, Etapa, EstadoDeVida, Fecha, Metas, Registro } from "@/tipos";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";
import { obtenerDia, obtenerMeta } from "./registro";

/* ==========================================================
   HABITOTCHI · ánimo, crecimiento, vida y muerte
   ==========================================================
   ---------- LA REGLA DE ORO ----------
   Nada de esto se guarda. El ánimo y la etapa se calculan de
   nuevo cada vez que se dibuja la pantalla, a partir del
   registro real.

   Si los guardáramos como un dato aparte, podrían
   desincronizarse de la realidad — por ejemplo, que la
   mascota "quede" feliz de la noche a la mañana aunque
   todavía no hiciste nada hoy. Calculándolo siempre de cero,
   eso no puede pasar.
   ========================================================== */

/* ==========================================================
   1) ¿CÓMO FUE UN DÍA? BUENO, MALO, O NINGUNO DE LOS DOS
   ==========================================================
   El tercer estado es el importante. Un día que todavía no
   abriste NO es un mal día: es un día que no pasó. Por eso
   esto devuelve true, false o null.
   ========================================================== */

export function diaEstaAbierto(registro: Registro, fecha: Fecha): boolean {
  return Object.keys(obtenerDia(registro, fecha)).length > 0;
}

export function diaEsBueno(registro: Registro, metas: Metas, fecha: Fecha): ComoFueElDia {
  if (!diaEstaAbierto(registro, fecha)) return null; // ni bueno ni malo todavía

  const datosDelDia = obtenerDia(registro, fecha);

  for (const [id, habito] of Object.entries(HABITOS_POR_DEFECTO)) {
    if (habito.tipo !== "meta") continue; // los de tipo "registro" no cuentan

    const meta = obtenerMeta(metas, id);
    const valor = datosDelDia[id] ?? 0;

    if (valor < meta) return false; // con que falle uno solo, el día es malo
  }

  return true;
}

/* ==========================================================
   2) EL ÁNIMO DE HOY
   ==========================================================
   Mira SOLO el día de hoy y promedia qué porcentaje de cada
   meta cumpliste. Con ese promedio elige la carita.

   ---------- EL GUARDIA ANTI-BUG ----------
   Si todavía no tocaste nada hoy, el ánimo es "normal", NO
   "triste". Sin este guardia la mascota amanecía triste todos
   los días, porque a las 7 de la mañana el registro de hoy
   siempre está vacío. Un día que recién empieza no es un mal
   día: todavía no es ningún día.
   ========================================================== */

const ANIMO_FELIZ = 0.8;
const ANIMO_NORMAL = 0.4;

export function calcularAnimo(registro: Registro, metas: Metas, fecha: Fecha): Animo {
  if (!diaEstaAbierto(registro, fecha)) return "normal"; // el guardia

  const datosDelDia = obtenerDia(registro, fecha);

  let sumaPorcentajes = 0;
  let cantidadDeHabitos = 0;

  for (const [id, habito] of Object.entries(HABITOS_POR_DEFECTO)) {
    if (habito.tipo !== "meta") continue;

    const meta = obtenerMeta(metas, id);
    const valor = datosDelDia[id] ?? 0;

    /* El techo es 100%: pasarte de la meta no compensa otro
       hábito que no hiciste. Y si la meta fuera 0, dividir
       daría Infinity, así que ese caso cuenta como cumplido. */
    sumaPorcentajes += meta <= 0 ? 1 : Math.min(1, valor / meta);
    cantidadDeHabitos++;
  }

  if (cantidadDeHabitos === 0) return "normal";

  const promedio = sumaPorcentajes / cantidadDeHabitos;

  if (promedio >= ANIMO_FELIZ) return "feliz";
  if (promedio >= ANIMO_NORMAL) return "normal";
  return "triste";
}

/* ==========================================================
   3) LA VIDA DE TU MASCOTA
   ==========================================================
   Cada día bueno suma 1 punto. Con los puntos acumulados se
   decide la etapa.

   ---------- LA MECÁNICA INDULGENTE ----------
   Un solo mal día NO te hace retroceder. Hacen falta TRES
   días malos SEGUIDOS para perder 1 punto. Es a propósito: la
   idea es acompañarte, no castigarte por un traspié. Los días
   sin abrir no suman ni restan, se saltean derecho.

   ---------- CUÁNDO FALLECE ----------
   Misma mecánica, con un cambio: si ya estás en 0 puntos y
   volvés a juntar 3 días malos seguidos, en vez de quedarte
   clavada en 0, la mascota fallece. Elegís una nueva y
   arranca de 0 otra vez.

   Tu registro de hábitos, tu perfil de salud, tus hobbies y
   tu calendario NO se tocan. Lo único que reinicia es el
   crecimiento de la mascota. Por eso los puntos se cuentan
   solo desde la fecha en que empezó esta vida ("desde"), y
   no desde siempre: así una mascota nueva no arranca
   cargando con los malos días de la anterior.
   ========================================================== */

export const UMBRAL_JOVEN = 7; // puntos para pasar de bebé a joven
export const UMBRAL_ADULTO = 21; // puntos para pasar de joven a adulta
export const DIAS_MALOS_PARA_PERDER_PUNTO = 3;

export function etapaSegunPuntos(puntos: number): Etapa {
  if (puntos >= UMBRAL_ADULTO) return "adulto";
  if (puntos >= UMBRAL_JOVEN) return "joven";
  return "bebe";
}

export function calcularEstadoVida(
  registro: Registro,
  metas: Metas,
  desde: Fecha | undefined
): EstadoDeVida {
  const desdeFecha = desde ?? "0000-00-00";
  const fechasOrdenadas = Object.keys(registro)
    .sort()
    .filter((f: any) => f >= desdeFecha);

  let puntos = 0;
  let rachaMala = 0;
  let muerta = false;
  let fechaMuerte: Fecha | undefined;
  let diasAbandonada = 0;

  for (const fecha of fechasOrdenadas) {
    if (muerta) break; // una vez que falleció, no seguimos contando

    const resultado = diaEsBueno(registro, metas, fecha);

    if (resultado === true) {
      puntos++;
      rachaMala = 0; // un día bueno corta cualquier racha mala
    } else if (resultado === false) {
      rachaMala++;

      if (rachaMala === DIAS_MALOS_PARA_PERDER_PUNTO) {
        if (puntos === 0) {
          muerta = true;
          fechaMuerte = fecha;
        } else {
          puntos = Math.max(0, puntos - 1);
        }
        rachaMala = 0; // volvemos a contar de cero
      }
    }
    /* Si resultado es null (día sin abrir), no hacemos nada:
       se saltea sin sumar ni restar. */
  }

  diasAbandonada = rachaMala;

  return {
    puntos,
    etapa: etapaSegunPuntos(puntos),
    muerta,
    fechaMuerte,
    diasAbandonada,
  };
}

/* Cuántos días buenos faltan para la próxima etapa. Es lo que
   muestra la barra de abajo del aparato. */
export function faltaParaLaProximaEtapa(puntos: number): { faltan: number; proxima: Etapa } | null {
  if (puntos < UMBRAL_JOVEN) return { faltan: UMBRAL_JOVEN - puntos, proxima: "joven" };
  if (puntos < UMBRAL_ADULTO) return { faltan: UMBRAL_ADULTO - puntos, proxima: "adulto" };
  return null; // ya es adulta
}
