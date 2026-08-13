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
   HABITOTCHI · perfil.js
   PERFIL Y SALUD
   ==========================================================
   Datos personales que sirven para calcular calorías (peso,
   altura) y dos registros de salud que NO afectan el ánimo
   ni el crecimiento de la mascota: el historial de peso y el
   ciclo menstrual. Son solo para vos, sin juicio ni puntos.
   ========================================================== */


/* ----------------------------------------------------------
   PERFIL BÁSICO
   ----------------------------------------------------------
   Los pronombres son un campo abierto además de las opciones
   sugeridas: nadie tiene que encajar en una lista.
   ---------------------------------------------------------- */

export const PRONOMBRES = [
  { id: "ella", nombre: "ella" },
  { id: "el",   nombre: "él" },
  { id: "elle", nombre: "elle" },
  { id: "otro", nombre: "prefiero no decir" },
];

export function cargarPerfil() {
  const guardado = __leerCrudo(CLAVES.perfil);
  const base = { nombre: "", edad: null, pronombre: "", pesoKg: null, alturaCm: null, cicloActivado: true };

  return guardado ? Object.assign(base, JSON.parse(guardado)) : base;
}

export function guardarPerfil(perfil: any) {
  escribir(CLAVES.perfil, perfil);
}

/* Peso a usar en los cálculos de calorías: el tuyo si lo
   cargaste, o un promedio genérico si todavía no. */
export function pesoParaCalculos(perfil: any) {
  return perfil && perfil.pesoKg ? perfil.pesoKg : 65;
}


/* ----------------------------------------------------------
   HISTORIAL DE PESO SEMANAL
   ----------------------------------------------------------
   Una lista de {fecha, pesoKg}. Ojo: esto NO suma ni resta
   puntos de crecimiento. Es un registro de salud, no un
   hábito a cumplir.
   ---------------------------------------------------------- */
export function cargarHistorialPeso() {
  const guardado = __leerCrudo(CLAVES.historialPeso);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarHistorialPeso(lista: any) {
  escribir(CLAVES.historialPeso, lista);
}

export function agregarPeso(historial: any, fecha: string, pesoKg: number) {
  historial.push({ fecha, pesoKg });
  historial.sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
  guardarHistorialPeso(historial);
  return historial;
}

export function eliminarPeso(historial: any, indice: number) {
  historial.splice(indice, 1);
  guardarHistorialPeso(historial);
  return historial;
}


/* ----------------------------------------------------------
   CICLO MENSTRUAL
   ----------------------------------------------------------
   Una lista de {fecha, duracion} — fecha de inicio y cuántos
   días duró. Tampoco suma ni resta puntos: es información de
   salud para vos, nada más.
   ---------------------------------------------------------- */
export function cargarHistorialCiclo() {
  const guardado = __leerCrudo(CLAVES.historialCiclo);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarHistorialCiclo(lista: any) {
  escribir(CLAVES.historialCiclo, lista);
}

export function agregarCiclo(historial: any, fecha: string, duracion: number) {
  historial.push({ fecha, duracion });
  historial.sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
  guardarHistorialCiclo(historial);
  return historial;
}

export function eliminarCiclo(historial: any, indice: number) {
  historial.splice(indice, 1);
  guardarHistorialCiclo(historial);
  return historial;
}

/* El registro más reciente, para mostrar "día X del ciclo". */
export function ultimoCiclo(historial: any) {
  if (historial.length === 0) return null;
  return historial[historial.length - 1];
}
