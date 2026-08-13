import type { Habitos } from "@/tipos";

/* ==========================================================
   HABITOTCHI · qué cosas seguimos
   ==========================================================
   Esto es CONFIGURACIÓN, no lógica. Para agregar un hábito
   nuevo (meditar, dormir), copiás un bloque y listo: aparece
   solo en la app.

   ---------- LOS DOS TIPOS ----------
   · "meta"     -> querés LLEGAR a un número. Tiene barra.
                   Ej: 8 vasos de agua.
   · "registro" -> solo querés ANOTAR cuántas veces pasó.
                   Sin barra, sin premio ni castigo.

   Los dulces son "registro" a propósito: te muestra el dato
   de la semana para que veas tu patrón, sin retarte.

   Nota sobre la meta de los de tipo "registro": en el código
   viejo era `null`, lo que obligaba a chequear el nulo en
   cada cuenta. Acá va 0 y el tipo del hábito es el que manda:
   si es "registro", la meta no se mira. Un dato menos que
   puede venir vacío por sorpresa.
   ========================================================== */

export const HABITOS_POR_DEFECTO: Habitos = {
  agua: {
    nombre: "Agua",
    tipo: "meta",
    meta: 8,
    unidad: "vasos",
    paso: 1, // cuánto suma cada toque
    color: "#5aa9d6",
  },

  comida: {
    nombre: "Comidas registradas",
    tipo: "meta",
    meta: 3, // desayuno, almuerzo y cena
    unidad: "comidas",
    paso: 1, // el registro de alimentacion es quien realmente lo mueve
    color: "#7ac07a",
  },

  ejercicio: {
    nombre: "Ejercicio",
    tipo: "meta",
    meta: 30,
    unidad: "min",
    paso: 10,
    color: "#e8945a",
  },

  lectura: {
    nombre: "Lectura",
    tipo: "meta",
    meta: 20,
    unidad: "min",
    paso: 10,
    color: "#a97ad6",
  },

  trabajo: {
    nombre: "Trabajo / estudio",
    tipo: "meta",
    meta: 4, // horas combinadas: da igual si son de trabajo o de estudio
    unidad: "horas",
    paso: 1,
    color: "#d67a9e",
  },

  dulces: {
    nombre: "Dulces",
    tipo: "registro", // sin meta, sin barra, sin juicio
    meta: 0,
    unidad: "veces",
    paso: 1,
    color: "#e0a3c8",
  },
};

/* Solo los que tienen barra. Son los que deciden si un día
   fue bueno: los de tipo "registro" no cuentan. */
export const HABITOS_CON_META = Object.entries(HABITOS_POR_DEFECTO)
  .filter(([, habito]) => habito.tipo === "meta")
  .map(([id]) => id);
