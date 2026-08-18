import { CLAVES, escribir, leerTexto } from "./almacenamiento";
import { tr } from "@/lib/idioma";

/* Los modulos portados leian con localStorage.getItem y
   parseaban a mano. Esto mantiene esa forma pero centraliza
   el acceso, para que el dia que sincronicemos con la nube
   haya un solo lugar que tocar. */
function __leerCrudo(clave: Parameters<typeof leerTexto>[0]): string | null {
  const valor = leerTexto(clave, "");
  return valor === "" ? null : valor;
}

/* ==========================================================
   HABITOTCHI · alimentacion
   REGISTRO DE COMIDAS
   ==========================================================
   Reemplaza el conteo genérico de "comida sana" por un
   registro de comidas concreto: cada entrada tiene un
   momento del día (desayuno, almuerzo, merienda, cena o
   snack), una descripción y, si se conoce, las calorías.

   Las calorías totales del día NO se guardan como un número
   aparte: se calculan sumando las entradas de este registro
   cada vez que hacen falta (ver totalCaloriasDelDia). Esto
   sigue el mismo principio que el resto de la app: un valor
   que se puede derivar de los datos no se guarda por
   separado, para que nunca pueda quedar desincronizado.

   El chef (lib/ia.ts + el modal de fotos) también guarda sus
   resultados acá, como una entrada más: así hay una sola
   fuente de verdad para "qué comiste hoy".
   ========================================================== */


/* Los momentos del día para clasificar cada entrada. */
export const TIPOS_COMIDA = [
  { id: "desayuno", clave: "comidaDesayuno" },
  { id: "almuerzo", clave: "comidaAlmuerzo" },
  { id: "merienda", clave: "comidaMerienda" },
  { id: "cena", clave: "comidaCena" },
  { id: "snack", clave: "comidaSnack" },
];

/* ----------------------------------------------------------
   GUARDADO
   ----------------------------------------------------------
   { "2026-08-09": [ {tipo:"desayuno", descripcion:"avena con banana", calorias:320} ] }
   ---------------------------------------------------------- */
export function cargarComidas() {
  const guardado = __leerCrudo(CLAVES.comidas);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarComidas(comidas: any) {
  escribir(CLAVES.comidas, comidas);
}

export function comidasDelDia(comidas: any, fecha: string) {
  return comidas[fecha] || [];
}

/* Agrega una comida al día indicado. El hábito "comida" de
   la pantalla se actualiza junto con esta lista (lo hace
   sincronizarHabito en pantallas/Alimentacion.tsx),
   para que la cantidad de comidas registradas siga contando
   igual que antes para el ánimo y el crecimiento de la
   mascota. */
export function agregarComida(comidas: any, fecha: string, tipoId: string, descripcion: string, calorias: number) {
  if (!comidas[fecha]) comidas[fecha] = [];

  comidas[fecha].push({
    tipo: tipoId,
    descripcion: (descripcion || "").trim(),
    calorias: Number.isFinite(calorias) && calorias > 0 ? Math.round(calorias) : 0,
  });

  guardarComidas(comidas);
  return comidas;
}

export function eliminarComida(comidas: any, fecha: string, indice: number) {
  if (!comidas[fecha]) return comidas;
  comidas[fecha].splice(indice, 1);
  guardarComidas(comidas);
  return comidas;
}

/* Total de calorías del día: siempre calculado a partir de
   las entradas, nunca guardado aparte. */
export function totalCaloriasDelDia(comidas: any, fecha: string) {
  return comidasDelDia(comidas, fecha).reduce((suma: number, c: any) => suma + c.calorias, 0);
}

export function nombreTipoComida(tipoId: string) {
  const encontrado = TIPOS_COMIDA.find((t: any) => t.id === tipoId);
  return encontrado ? tr(encontrado.clave) : tipoId;
}
