import type { Fecha } from "@/tipos";
import { tr } from "./idioma";

/* ==========================================================
   HABITOTCHI · el manejo de los días
   ==========================================================
   Parece un archivo aburrido, pero acá vive uno de los
   errores más comunes (y más difíciles de encontrar) de toda
   la programación. Vale la pena entenderlo.

   ---------- ¡CUIDADO CON LA FECHA DE HOY! ----------
   La forma "obvia" de sacar la fecha es esta:

       new Date().toISOString().split("T")[0]    <- ¡MAL!

   toISOString() da la hora de LONDRES (UTC), no la tuya. En
   Argentina estamos 3 horas atrás.

   Entonces, si registrás un vaso de agua a las 22:00 del
   lunes, en Londres ya son las 01:00 del martes... y tu vaso
   se guarda en el día equivocado. El error aparece SOLO de
   noche, así que es dificilísimo de detectar.

   La forma correcta es armar la fecha a mano, con la hora
   local. Es un poco más larga, pero es la que anda bien.
   Hay un test que lo cuida: tests/fechas.test.ts.
   ========================================================== */

export interface DiaCorto {
  texto: Fecha;
  inicial: string;
  esHoy: boolean;
}

export interface DiaDeGrilla {
  texto: Fecha;
  numero: number;
  esDeEsteMes: boolean;
  esHoy: boolean;
}

export interface DiaDeSemana extends DiaCorto {
  numero: number;
}

export interface Balde {
  etiqueta: string;
  desde: Fecha;
  hasta: Fecha;
}

export type RangoDeGrafico = "semana" | "mes" | "anio";

/* Convierte una fecha a texto tipo "2026-08-07".
   padStart(2, "0") agrega un cero adelante cuando hace falta,
   para que agosto sea "08" y no "8". */
export function fechaComoTexto(fecha: Date): Fecha {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // +1 porque enero es 0
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

export function fechaDeHoy(): Fecha {
  return fechaComoTexto(new Date());
}

/* La primera letra del día: L, M, X, J, V, S, D */
const LETRAS_DE_DIA = ["D", "L", "M", "X", "J", "V", "S"] as const;

export function nombreCortoDelDia(fecha: Date): string {
  return LETRAS_DE_DIA[fecha.getDay()] ?? "";
}

/* ----------------------------------------------------------
   LOS ÚLTIMOS 7 DÍAS
   ----------------------------------------------------------
   Hoy y los 6 anteriores, del más viejo al más nuevo. Es lo
   que dibuja la tira del historial en Hogar.
   ---------------------------------------------------------- */
export function ultimosSieteDias(): DiaCorto[] {
  const dias: DiaCorto[] = [];

  for (let atras = 6; atras >= 0; atras--) {
    const fecha = new Date();
    /* Restar días es seguro: JavaScript ajusta solo el mes
       y el año cuando hace falta. */
    fecha.setDate(fecha.getDate() - atras);

    dias.push({
      texto: fechaComoTexto(fecha),
      inicial: nombreCortoDelDia(fecha),
      esHoy: atras === 0,
    });
  }

  return dias;
}

/* ----------------------------------------------------------
   LA GRILLA DEL MES
   ----------------------------------------------------------
   El mes como lo dibuja un calendario de pared: 6 filas de 7
   días, empezando en lunes. Las primeras y últimas casillas
   suelen ser del mes anterior o del siguiente — van marcadas
   con esDeEsteMes en false para pintarlas más apagadas.

   ¿Por qué SIEMPRE 6 filas, si muchos meses entran en 5?
   Para que la grilla no cambie de alto al pasar de un mes a
   otro. Si no, el calendario "salta" y marea.
   ---------------------------------------------------------- */
/* Los meses y las iniciales salen del diccionario: cambian
   con el idioma. Se guardan como una lista separada por comas
   en vez de doce claves sueltas, porque siempre se usan
   juntos y de a doce.

   Ojo con las iniciales: en español la X de miércoles evita
   repetir la M de martes; en inglés el choque es otro
   (Tuesday/Thursday, Saturday/Sunday) y se resuelve distinto.
   Por eso cada idioma trae las suyas y no se derivan. */
export function nombresDeMes(): string[] {
  return tr("meses").split(",");
}

export function inicialesDeSemana(): string[] {
  return tr("inicialesSemana").split(",");
}

export function nombreDelMes(mes: number): string {
  return nombresDeMes()[mes] ?? "";
}

export function diasDelMes(anio: number, mes: number): DiaDeGrilla[][] {
  /* Cuántos días de relleno van ANTES del día 1. getDay() da
     0 para domingo, y acá empezamos en lunes, así que el
     domingo necesita 6 casillas antes. */
  const primero = new Date(anio, mes, 1);
  const diaSemana = primero.getDay();
  const relleno = diaSemana === 0 ? 6 : diaSemana - 1;

  /* Arrancamos en el lunes de la primera semana. Restarle
     días a un 1 de mes es seguro: JavaScript retrocede solo
     al mes (y al año) anterior. */
  const cursor = new Date(anio, mes, 1 - relleno);
  const hoy = fechaDeHoy();

  const semanas: DiaDeGrilla[][] = [];

  for (let semana = 0; semana < 6; semana++) {
    const dias: DiaDeGrilla[] = [];

    for (let dia = 0; dia < 7; dia++) {
      const texto = fechaComoTexto(cursor);

      dias.push({
        texto,
        numero: cursor.getDate(),
        esDeEsteMes: cursor.getMonth() === mes,
        esHoy: texto === hoy,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    semanas.push(dias);
  }

  return semanas;
}

/* El primer y el último día que se ven en la grilla. Sirve
   para pedirle a Google exactamente ese rango de eventos. */
export function rangoVisibleDelMes(anio: number, mes: number): { desde: Fecha; hasta: Fecha } {
  const semanas = diasDelMes(anio, mes);
  const primeraSemana = semanas[0]!;
  const ultimaSemana = semanas[5]!;

  return {
    desde: primeraSemana[0]!.texto,
    hasta: ultimaSemana[6]!.texto,
  };
}

/* ----------------------------------------------------------
   LA SEMANA DE HOY
   ----------------------------------------------------------
   A diferencia de ultimosSieteDias() (que da "hoy y los 6
   anteriores"), esta devuelve la semana calendario completa,
   de lunes a domingo, para el planificador semanal.
   ---------------------------------------------------------- */
export function diasDeEstaSemana(): DiaDeSemana[] {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 = domingo ... 6 = sábado
  const offsetHastaElLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const textoDeHoy = fechaComoTexto(hoy);

  const dias: DiaDeSemana[] = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + offsetHastaElLunes + i);

    const texto = fechaComoTexto(fecha);

    dias.push({
      texto,
      inicial: nombreCortoDelDia(fecha),
      numero: fecha.getDate(),
      esHoy: texto === textoDeHoy,
    });
  }

  return dias;
}

/* ----------------------------------------------------------
   "BALDES" DE FECHAS PARA LOS GRÁFICOS
   ----------------------------------------------------------
   Ejercicio y Trabajo muestran un gráfico de barras que se
   puede ver por semana, por mes o por año. En los tres casos
   hace falta lo mismo: dividir el tiempo en tramos, cada uno
   con una etiqueta para el eje y un rango [desde, hasta] para
   sumar lo que cae adentro.

     · "semana" -> 7 baldes, uno por día
     · "mes"    -> 4 baldes, uno por semana
     · "anio"   -> 12 baldes, uno por mes
   ---------------------------------------------------------- */
export function bucketsGrafico(rango: RangoDeGrafico): Balde[] {
  if (rango === "mes") return bucketsPorSemana(4);
  if (rango === "anio") return bucketsPorMes(12);
  return bucketsPorDia();
}

function bucketsPorDia(): Balde[] {
  return ultimosSieteDias().map((dia: any) => ({
    etiqueta: dia.inicial,
    desde: dia.texto,
    hasta: dia.texto,
  }));
}

function bucketsPorSemana(cantidad: number): Balde[] {
  const baldes: Balde[] = [];

  for (let atras = cantidad - 1; atras >= 0; atras--) {
    const fin = new Date();
    fin.setDate(fin.getDate() - atras * 7);

    const inicio = new Date(fin);
    inicio.setDate(inicio.getDate() - 6);

    baldes.push({
      etiqueta: tr("abreviaturaSemana", { n: cantidad - atras }),
      desde: fechaComoTexto(inicio),
      hasta: fechaComoTexto(fin),
    });
  }

  return baldes;
}

function bucketsPorMes(cantidad: number): Balde[] {
  const baldes: Balde[] = [];
  const hoy = new Date();

  for (let atras = cantidad - 1; atras >= 0; atras--) {
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() - atras + 1, 0);

    baldes.push({
      etiqueta: (nombresDeMes()[primerDia.getMonth()] ?? "").slice(0, 3),
      desde: fechaComoTexto(primerDia),
      hasta: fechaComoTexto(ultimoDia),
    });
  }

  return baldes;
}
