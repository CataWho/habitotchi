import { CLAVES, escribir, leerTexto } from "./almacenamiento";

/* Los modulos portados leian con localStorage.getItem y
   parseaban a mano. Esto mantiene esa forma pero centraliza
   el acceso, para que el dia que sincronicemos con la nube
   haya un solo lugar que tocar. */
function __leerCrudo(clave: Parameters<typeof leerTexto>[0]): string | null {
  const valor = leerTexto(clave, "");
  return valor === "" ? null : valor;
}

/* ==========================================================
   HABITOTCHI · ejercicio
   EJERCICIO DETALLADO
   ==========================================================
   Acá vive el detalle de tus sesiones: cardio (con tipo y,
   para caminar/correr/andar en bici, distancia) y ejercicio
   de fuerza (con tipo de ejercicio, series y repeticiones),
   más el cálculo aproximado de calorías usando la fórmula
   estándar de MET:

       kcal = MET × 3.5 × peso(kg) / 200 × minutos

   El MET es una medida estandarizada de "cuán intensa" es
   una actividad (viene del Compendium of Physical
   Activities, la misma referencia que usan relojes deportivos
   como los de Garmin para este tipo de estimación). No es una
   báscula de precisión: por eso siempre la mostramos como
   "aproximada", y solo cambia según tu peso y el tiempo que
   dure la actividad.

   Cada sesión que cargás acá también suma minutos al hábito
   "ejercicio" de datos/habitos.ts, así tu barra general
   y tu día bueno/malo lo tienen en cuenta.
   ========================================================== */


/* Tipos de cardio, con su MET aproximado (fuente: tablas de
   Compendium of Physical Activities, simplificadas). Los que
   están en TIPOS_CARDIO_CON_DISTANCIA además permiten cargar
   los kilómetros recorridos. */
export const TIPOS_CARDIO: Record<string, { nombre: string; met: number }> = {
  cinta:     { nombre: "Cinta / caminadora", met: 6.0 },
  running:   { nombre: "Running",            met: 9.8 },
  soga:      { nombre: "Soga",               met: 12.0 },
  bici:      { nombre: "Bicicleta",          met: 7.5 },
  natacion:  { nombre: "Natación",           met: 8.0 },
  eliptica:  { nombre: "Elíptica",           met: 5.0 },
  baile:     { nombre: "Baile",              met: 6.5 },
  otro:      { nombre: "Otro cardio",        met: 6.0 },
};

export const TIPOS_CARDIO_CON_DISTANCIA = ["cinta", "running", "bici"];

/* Tipos de ejercicio de fuerza, agrupados por zona del cuerpo
   para que la lista se pueda recorrer sin perderse. Igual que
   en un reloj deportivo: elegís el ejercicio y cargás series y
   repeticiones.

   Si falta alguno, se puede agregar desde la app y queda
   guardado para las próximas veces (ver más abajo, ejercicios
   personalizados). */
export const TIPOS_FUERZA: Record<string, { nombre: string; grupo: string; met?: number }> = {
  /* --- Piernas --- */
  sentadilla:      { nombre: "Sentadilla",          grupo: "Piernas" },
  prensa:          { nombre: "Prensa",              grupo: "Piernas" },
  estocadas:       { nombre: "Estocadas",           grupo: "Piernas" },
  peso_muerto:     { nombre: "Peso muerto",         grupo: "Piernas" },
  curl_femoral:    { nombre: "Curl femoral",        grupo: "Piernas" },
  extension_cuad:  { nombre: "Extensión de cuádriceps", grupo: "Piernas" },
  gemelos:         { nombre: "Gemelos",             grupo: "Piernas" },
  hip_thrust:      { nombre: "Hip thrust",          grupo: "Piernas" },

  /* --- Espalda --- */
  dominadas:       { nombre: "Dominadas",           grupo: "Espalda" },
  remo:            { nombre: "Remo",                grupo: "Espalda" },
  jalon_pecho:     { nombre: "Jalón al pecho",      grupo: "Espalda" },
  remo_mancuerna:  { nombre: "Remo con mancuerna",  grupo: "Espalda" },

  /* --- Pecho y hombros --- */
  press_banca:     { nombre: "Press de banca",      grupo: "Pecho y hombros" },
  press_inclinado: { nombre: "Press inclinado",     grupo: "Pecho y hombros" },
  aperturas:       { nombre: "Aperturas",           grupo: "Pecho y hombros" },
  flexiones:       { nombre: "Flexiones",           grupo: "Pecho y hombros" },
  press_militar:   { nombre: "Press militar",       grupo: "Pecho y hombros" },
  elevaciones_lat: { nombre: "Elevaciones laterales", grupo: "Pecho y hombros" },

  /* --- Brazos --- */
  curl_biceps:     { nombre: "Curl de bíceps",      grupo: "Brazos" },
  triceps_polea:   { nombre: "Tríceps en polea",    grupo: "Brazos" },
  fondos:          { nombre: "Fondos",              grupo: "Brazos" },

  /* --- Core --- */
  plancha:         { nombre: "Plancha",             grupo: "Core" },
  abdominales:     { nombre: "Abdominales",         grupo: "Core" },
  elevacion_pierna:{ nombre: "Elevación de piernas", grupo: "Core" },

  otro:            { nombre: "Otro ejercicio",      grupo: "Otros" },
};


/* ----------------------------------------------------------
   EJERCICIOS PROPIOS
   ----------------------------------------------------------
   Los que agrega quien usa la app. Se guardan aparte de
   TIPOS_FUERZA para que una actualización de la app nunca
   pise lo que la persona cargó a mano.

   El identificador se arma a partir del nombre, en minúsculas
   y sin espacios, para que sea estable entre sesiones.
   ---------------------------------------------------------- */

export function cargarEjerciciosPropios() {
  const guardado = __leerCrudo(CLAVES.fuerzaPropios);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarEjerciciosPropios(propios: any) {
  escribir(CLAVES.fuerzaPropios, propios);
}

export function agregarEjercicioPropio(propios: any, nombre: string) {
  const limpio = (nombre || "").trim();
  if (!limpio) return { propios, id: null };

  const id = "propio_" + limpio.toLowerCase().replace(/\s+/g, "_");

  propios[id] = { nombre: limpio, grupo: "Mis ejercicios" };
  guardarEjerciciosPropios(propios);

  return { propios, id };
}

export function eliminarEjercicioPropio(propios: any, id: string) {
  delete propios[id];
  guardarEjerciciosPropios(propios);
  return propios;
}

/* El catálogo completo: los de fábrica más los tuyos. Es lo
   que hay que usar para mostrar el nombre de una sesión ya
   guardada, porque puede referirse a cualquiera de los dos. */
export function catalogoFuerza(propios: any) {
  return Object.assign({}, TIPOS_FUERZA, propios || {});
}

/* La intensidad define el MET que se usa para estimar
   calorías. En vez de dejar "leve/moderada/intensa" como
   etiquetas sueltas, usamos el criterio del "test del habla"
   que usan los profesionales de educación física: es un
   criterio concreto, no una sensación difícil de calibrar. */
export const INTENSIDAD_PESAS: Record<string, { nombre: string; met: number }> = {
  leve:     { nombre: "Leve (podés hablar sin esfuerzo)",        met: 3.5 },
  moderada: { nombre: "Moderada (te cuesta mantener charla)",    met: 5.0 },
  intensa:  { nombre: "Intensa (no podés hablar mientras lo hacés)", met: 6.0 },
};


export function calcularCaloriasPorMet(met: number, minutos: number, pesoKg: number) {
  const peso = pesoKg || 65; // promedio genérico si no hay perfil cargado
  return Math.round(((met * 3.5 * peso) / 200) * minutos);
}


/* ----------------------------------------------------------
   GUARDADO DE SESIONES
   ----------------------------------------------------------
   { "2026-08-08": [ {tipo:"cardio", subtipo:"running", minutos:30, distanciaKm:5, calorias:310},
                      {tipo:"fuerza", ejercicio:"sentadilla", intensidad:"moderada", series:4, repeticiones:10, minutos:25, calorias:150} ] }
   ---------------------------------------------------------- */
export function cargarSesionesEjercicio() {
  const guardado = __leerCrudo(CLAVES.sesionesEjercicio);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarSesionesEjercicio(sesiones: any) {
  escribir(CLAVES.sesionesEjercicio, sesiones);
}

export function sesionesDelDia(sesiones: any, fecha: string) {
  return sesiones[fecha] || [];
}

export function agregarSesionCardio(sesiones: any, fecha: string, subtipoId: string, minutos: number, pesoKg: number, distanciaKm: number) {
  const tipo = TIPOS_CARDIO[subtipoId] ?? TIPOS_CARDIO.otro!;
  const calorias = calcularCaloriasPorMet(tipo.met, minutos, pesoKg);

  if (!sesiones[fecha]) sesiones[fecha] = [];

  const sesion: {
    tipo: string;
    subtipo: string;
    minutos: number;
    calorias: number;
    distanciaKm?: number;
  } = { tipo: "cardio", subtipo: subtipoId, minutos, calorias };

  if (Number.isFinite(distanciaKm) && distanciaKm > 0) sesion.distanciaKm = distanciaKm;
  sesiones[fecha].push(sesion);

  guardarSesionesEjercicio(sesiones);
  return { sesiones, calorias };
}

export function agregarSesionFuerza(sesiones: any, fecha: string, ejercicioId: string, intensidadId: string, series: number, repeticiones: number, minutos: number, pesoKg: number) {
  const intensidad = INTENSIDAD_PESAS[intensidadId] ?? INTENSIDAD_PESAS.moderada!;
  const calorias = calcularCaloriasPorMet(intensidad.met, minutos, pesoKg);

  if (!sesiones[fecha]) sesiones[fecha] = [];
  sesiones[fecha].push({ tipo: "fuerza", ejercicio: ejercicioId, intensidad: intensidadId, series, repeticiones, minutos, calorias });

  guardarSesionesEjercicio(sesiones);
  return { sesiones, calorias };
}

export function eliminarSesion(sesiones: any, fecha: string, indice: number) {
  if (!sesiones[fecha]) return sesiones;
  sesiones[fecha].splice(indice, 1);
  guardarSesionesEjercicio(sesiones);
  return sesiones;
}

export function totalMinutosDelDia(sesiones: any, fecha: string) {
  return sesionesDelDia(sesiones, fecha).reduce((suma: number, s: any) => suma + s.minutos, 0);
}

export function totalCaloriasDelDia(sesiones: any, fecha: string) {
  return sesionesDelDia(sesiones, fecha).reduce((suma: number, s: any) => suma + s.calorias, 0);
}


/* ----------------------------------------------------------
   RESUMEN POR PERÍODO (para el gráfico de la sección)
   ----------------------------------------------------------
   Recibe los "baldes" de fechas que arma lib/fechas.ts
   (bucketsGrafico) y devuelve, para cada uno, cuántos
   minutos de cardio y de fuerza hubo, y el total de calorías.
   Como las fechas están en formato "AAAA-MM-DD", compararlas
   como texto da el mismo orden que compararlas como fechas.
   ---------------------------------------------------------- */
export function resumenEjercicioPorBuckets(sesiones: any, buckets: any) {
  return buckets.map((balde: any) => {
    let cardio = 0;
    let fuerza = 0;
    let calorias = 0;

    for (const fecha in sesiones) {
      if (fecha < balde.desde || fecha > balde.hasta) continue;

      for (const sesion of sesiones[fecha]) {
        if (sesion.tipo === "cardio") cardio += sesion.minutos;
        else fuerza += sesion.minutos;
        calorias += sesion.calorias;
      }
    }

    return { etiqueta: balde.etiqueta, cardio, fuerza, calorias };
  });
}

export function totalCaloriasEnBuckets(sesiones: any, buckets: any) {
  return resumenEjercicioPorBuckets(sesiones, buckets).reduce((suma: number, b: any) => suma + b.calorias, 0);
}


/* ----------------------------------------------------------
   PASOS DIARIOS
   ----------------------------------------------------------
   Una app web no tiene forma de leer los pasos que cuenta
   Salud (iPhone) o Google Fit: ese dato vive en el sistema
   operativo, y solo una app nativa con el permiso adecuado
   puede acceder a él. Por eso acá se cargan a mano, un número
   por día.
   ---------------------------------------------------------- */
export function cargarPasos() {
  const guardado = __leerCrudo(CLAVES.pasos);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarPasos(datos: any) {
  escribir(CLAVES.pasos, datos);
}

export function registrarPasos(datos: any, fecha: string, cantidad: number) {
  datos[fecha] = Math.max(0, Math.round(cantidad));
  guardarPasos(datos);
  return datos;
}
