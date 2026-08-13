import type { Metas, Registro } from "@/tipos";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";

/* ==========================================================
   AYUDAS PARA LOS TESTS
   ==========================================================
   Armar un "día bueno" a mano significa acordarse de cumplir
   las cinco metas. Si mañana agregamos un hábito nuevo, todos
   los tests que lo hicieran a mano se romperían. Estas
   funciones lo arman leyendo la configuración, así que
   siguen andando solas.
   ========================================================== */

/* Un día en el que llegaste a TODAS las metas */
export function diaBueno(): Record<string, number> {
  const dia: Record<string, number> = {};

  for (const [id, habito] of Object.entries(HABITOS_POR_DEFECTO)) {
    if (habito.tipo === "meta") dia[id] = habito.meta;
  }

  return dia;
}

/* Un día que abriste pero en el que no llegaste a alguna
   meta. Le pega a la primera con barra y la deja en cero. */
export function diaMalo(): Record<string, number> {
  const dia = diaBueno();
  const primera = Object.keys(dia)[0];
  if (primera) dia[primera] = 0;
  return dia;
}

/* Un día a medias: la mitad de cada meta */
export function diaAMedias(): Record<string, number> {
  const dia: Record<string, number> = {};

  for (const [id, habito] of Object.entries(HABITOS_POR_DEFECTO)) {
    if (habito.tipo === "meta") dia[id] = Math.floor(habito.meta / 2);
  }

  return dia;
}

/* Arma un registro a partir de una descripción corta:

     registroDe(["2026-01-01", "bueno"], ["2026-01-02", "malo"])

   "vacio" deja el día sin abrir, que no es lo mismo que un
   día malo. */
export type ComoFue = "bueno" | "malo" | "medias" | "vacio";

export function registroDe(...dias: [string, ComoFue][]): Registro {
  const registro: Registro = {};

  for (const [fecha, como] of dias) {
    if (como === "bueno") registro[fecha] = diaBueno();
    else if (como === "malo") registro[fecha] = diaMalo();
    else if (como === "medias") registro[fecha] = diaAMedias();
    /* "vacio" no agrega la clave: así el día queda sin abrir */
  }

  return registro;
}

/* Una tira de días seguidos, todos iguales, arrancando en
   una fecha. Sirve para probar rachas largas sin escribir
   treinta fechas a mano. */
export function diasSeguidos(desde: string, cantidad: number, como: ComoFue): Registro {
  const registro: Registro = {};
  const cursor = new Date(desde + "T12:00:00");

  for (let i = 0; i < cantidad; i++) {
    const anio = cursor.getFullYear();
    const mes = String(cursor.getMonth() + 1).padStart(2, "0");
    const dia = String(cursor.getDate()).padStart(2, "0");
    const fecha = `${anio}-${mes}-${dia}`;

    if (como === "bueno") registro[fecha] = diaBueno();
    else if (como === "malo") registro[fecha] = diaMalo();
    else if (como === "medias") registro[fecha] = diaAMedias();

    cursor.setDate(cursor.getDate() + 1);
  }

  return registro;
}

export const SIN_METAS_PROPIAS: Metas = {};
