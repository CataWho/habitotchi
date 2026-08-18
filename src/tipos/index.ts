/* ==========================================================
   HABITOTCHI · tipos compartidos
   ==========================================================
   Las formas de los datos que viajan por toda la app, en un
   solo lugar. Antes esto vivía solo en los comentarios de
   cada archivo, así que nada impedía escribir mal una fecha o
   pedirle a un hábito una propiedad que no tenía.
   ========================================================== */


/* ----------------------------------------------------------
   FECHAS
   ----------------------------------------------------------
   Siempre "AAAA-MM-DD", en hora local. Es un texto y no un
   Date a propósito: un Date arrastra la hora y la zona, y ahí
   es donde aparecía el bug de que a las 22:00 se guardaba en
   el día siguiente (ver lib/fechas.ts).
   ---------------------------------------------------------- */
export type Fecha = string;


/* ==========================================================
   HÁBITOS
   ========================================================== */

/* Dos tipos, a propósito:
     meta     · querés llegar a un número, tiene barra
     registro · solo anotás cuántas veces pasó, sin barra */
export type TipoDeHabito = "meta" | "registro";

export interface Habito {
  /* Clave del diccionario, no el texto: ver lib/idioma.ts */
  clave: string;
  tipo: TipoDeHabito;
  meta: number;
  unidad: string;
  paso: number;
  color: string;
  /* En qué página aparece. Si no dice nada, va en Hogar. */
  pagina?: string;
}

export type IdHabito = string;
export type Habitos = Record<IdHabito, Habito>;

/* Las metas que vos cambiaste, aparte de las de fábrica */
export type Metas = Record<IdHabito, number>;

/* Lo que hiciste cada día:
     { "2026-08-11": { agua: 5, comida: 2 } }
   Si un hábito no aparece, es que vale 0. */
export type DiaRegistrado = Record<IdHabito, number>;
export type Registro = Record<Fecha, DiaRegistrado>;


/* ==========================================================
   LA MASCOTA
   ========================================================== */

export type Etapa = "bebe" | "joven" | "adulto";
export type Animo = "feliz" | "normal" | "triste" | "muerta";

export interface DibujoDeEtapa {
  /* Dónde se estampa la carita, en coordenadas del dibujo */
  cara: { x: number; y: number };
  /* Una fila por string, una letra por pixel. "." es vacío. */
  pixeles: string[];
}

export interface Mascota {
  /* Clave del diccionario */
  clave: string;
  /* Si no tiene precio, viene desbloqueada de entrada */
  precio?: number;
  /* De qué color es cada letra del dibujo */
  colores: Record<string, string>;
  etapas: Record<Etapa, DibujoDeEtapa>;
}

export type IdMascota = string;

export interface Accesorio {
  /* Clave del diccionario */
  clave: string;
  precio: number;
  colores: Record<string, string>;
  /* Posición RELATIVA a la cara, para que sirva en cualquier
     mascota y cualquier etapa sin recalcular nada. */
  desdeCara: { x: number; y: number };
  pixeles: string[];
}

export interface Fondo {
  /* Clave del diccionario */
  clave: string;
  precio: number;
  degradado: string;
  /* Los tres canales sueltos ("r, g, b"): el CSS los usa para
     armar todas las transparencias a partir del mismo color. */
  tinta: string;
  /* Para escribir ENCIMA de la tinta (los botones son una
     pastilla de tinta llena). */
  contratinta: string;
  brillo: string;
}


/* ==========================================================
   VIDA Y MUERTE
   ========================================================== */

export interface Vida {
  mascota: IdMascota;
  nombre?: string;
  desde: Fecha;
  muerteRegistrada: boolean;
}

export interface EnElCementerio {
  mascota: IdMascota;
  nombre: string;
  etapaAlcanzada: Etapa;
  desde: Fecha;
  hasta: Fecha;
}

export interface EstadoDeVida {
  etapa: Etapa;
  puntos: number;
  muerta: boolean;
  fechaMuerte?: Fecha;
  diasAbandonada: number;
}

/* Un día puede ser bueno, malo, o ninguno de los dos.
   El tercer estado importa: a las 7 de la mañana el registro
   de hoy está vacío, y eso NO es un mal día. */
export type ComoFueElDia = true | false | null;


/* ==========================================================
   TIENDA
   ========================================================== */

export interface Compras {
  mascotas: IdMascota[];
  accesorios: string[];
  fondos: string[];
}

export interface Equipado {
  accesorio: string | null;
  fondo: string;
}

export type TipoDeArticulo = "mascota" | "accesorio" | "fondo";

export interface Logro {
  id: string;
  /* Claves del diccionario */
  clave: string;
  claveDescripcion: string;
}

export interface LogroConseguido extends Logro {
  conseguido: boolean;
}

export interface ResultadoDeCompra {
  ok: boolean;
  mensaje: string;
}
