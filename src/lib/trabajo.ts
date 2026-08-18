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
   HABITOTCHI · trabajo
   TRABAJO / ESTUDIO
   ==========================================================
   Dos herramientas:
     · un calendario semanal simple (notitas por día)
     · una lista de pendientes (to-do), que SÍ da puntos:
       cada tarea que marcás como hecha suma 1 hora al
       hábito "trabajo" del día de hoy (y lo resta si la
       destildás por error).
   ========================================================== */


/* Los dos tipos que se pueden registrar. El hábito "trabajo"
   de datos/habitos.ts sigue siendo uno solo (mide horas totales,
   sin importar el tipo), pero acá se guarda el detalle de
   cada sesión para poder graficar trabajo vs. estudio por
   separado — el mismo patrón que cardio/fuerza en
   lib/ejercicio.ts. */
export const TIPOS_TRABAJO: Record<string, { nombre: string; color?: string }> = {
  trabajo: { nombre: "Trabajo" },
  estudio: { nombre: "Estudio" },
};


/* ----------------------------------------------------------
   CALENDARIO SEMANAL
   ----------------------------------------------------------
   { "2026-08-10": ["Entregar informe", "Reunión 15hs"] }
   ---------------------------------------------------------- */
export function cargarCalendario() {
  const guardado = __leerCrudo(CLAVES.calendario);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarCalendario(calendario: any) {
  escribir(CLAVES.calendario, calendario);
}

export function eventosDelDia(calendario: any, fecha: string) {
  return calendario[fecha] || [];
}

export function agregarEvento(calendario: any, fecha: string, texto: string) {
  if (!calendario[fecha]) calendario[fecha] = [];
  calendario[fecha].push(texto);
  guardarCalendario(calendario);
  return calendario;
}

export function eliminarEvento(calendario: any, fecha: string, indice: number) {
  if (!calendario[fecha]) return calendario;
  calendario[fecha].splice(indice, 1);
  guardarCalendario(calendario);
  return calendario;
}


/* ----------------------------------------------------------
   LISTA DE PENDIENTES
   ----------------------------------------------------------
   [{id, texto, hecho}]
   ---------------------------------------------------------- */
export function cargarTodos() {
  const guardado = __leerCrudo(CLAVES.todos);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarTodos(lista: any) {
  escribir(CLAVES.todos, lista);
}

export function agregarTodo(lista: any, texto: string) {
  lista.push({ id: Date.now(), texto, hecho: false });
  guardarTodos(lista);
  return lista;
}

/* Devuelve la lista actualizada y +1/-1 según si pasó a
   hecho o volvió a pendiente — ese número es lo que hay que
   sumarle al hábito "trabajo" de hoy. */
export function alternarTodo(lista: any, id: string) {
  const tarea = lista.find((t: any) => t.id === id);
  if (!tarea) return { lista, delta: 0 };

  tarea.hecho = !tarea.hecho;
  guardarTodos(lista);

  return { lista, delta: tarea.hecho ? 1 : -1 };
}

export function eliminarTodo(lista: any, id: string) {
  const indice = lista.findIndex((t: any) => t.id === id);
  let delta = 0;

  if (indice !== -1) {
    if (lista[indice].hecho) delta = -1; // si estaba hecha, se le resta la hora al borrarla
    lista.splice(indice, 1);
    guardarTodos(lista);
  }

  return { lista, delta };
}


/* ----------------------------------------------------------
   SESIONES DE TRABAJO / ESTUDIO
   ----------------------------------------------------------
   { "2026-08-09": [ {tipo:"trabajo", horas:3}, {tipo:"estudio", horas:1.5} ] }
   ---------------------------------------------------------- */
export function cargarSesionesTrabajo() {
  const guardado = __leerCrudo(CLAVES.sesionesTrabajo);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarSesionesTrabajo(sesiones: any) {
  escribir(CLAVES.sesionesTrabajo, sesiones);
}

export function sesionesTrabajoDelDia(sesiones: any, fecha: string) {
  return sesiones[fecha] || [];
}

export function agregarSesionTrabajo(sesiones: any, fecha: string, tipoId: string, horas: number) {
  if (!sesiones[fecha]) sesiones[fecha] = [];
  sesiones[fecha].push({ tipo: tipoId, horas });
  guardarSesionesTrabajo(sesiones);
  return sesiones;
}

export function eliminarSesionTrabajo(sesiones: any, fecha: string, indice: number) {
  if (!sesiones[fecha]) return sesiones;
  sesiones[fecha].splice(indice, 1);
  guardarSesionesTrabajo(sesiones);
  return sesiones;
}

/* Igual que resumenEjercicioPorBuckets, pero separando
   trabajo de estudio en vez de cardio de fuerza. */
export function resumenTrabajoPorBuckets(sesiones: any, buckets: any) {
  return buckets.map((balde: any) => {
    let trabajo = 0;
    let estudio = 0;

    for (const fecha in sesiones) {
      if (fecha < balde.desde || fecha > balde.hasta) continue;

      for (const sesion of sesiones[fecha]) {
        if (sesion.tipo === "estudio") estudio += sesion.horas;
        else trabajo += sesion.horas;
      }
    }

    return { etiqueta: balde.etiqueta, trabajo, estudio };
  });
}
