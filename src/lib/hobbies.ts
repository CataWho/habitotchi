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
   HABITOTCHI · hobbies
   HOBBIES
   ==========================================================
   Nada de esto suma puntos ni tiene meta: los hobbies son
   para disfrutar, no para cumplir. Dos cosas viven acá:
     · el libro que estás leyendo ahora (una notita flotante)
     · un registro libre de otras actividades
   ========================================================== */


/* Categorías sugeridas para "otros". "otro" siempre queda
   como opción libre por si falta alguna. La música tiene su
   propio registro (ver más abajo, "discos escuchados"), así
   que no está en esta lista. */
export const CATEGORIAS_HOBBIES = [
  { id: "amigos", clave: "hobbyAmigos" },
  { id: "familia", clave: "hobbyFamilia" },
  { id: "pintura", clave: "hobbyPintura" },
  { id: "videojuegos", clave: "hobbyVideojuegos" },
  { id: "series", clave: "hobbySeries" },
  { id: "paseos", clave: "hobbyPaseos" },
  { id: "fotografia", clave: "hobbyFotografia" },
  { id: "otro", clave: "hobbyOtro" },
];


/* ----------------------------------------------------------
   LIBRO ACTUAL
   ---------------------------------------------------------- */
/* Guardamos también la tapa (lib/portadas.ts la busca sola) para
   no tener que pedirla de nuevo cada vez que abrís la app. */
export function cargarLibroActual() {
  const guardado = __leerCrudo(CLAVES.libroActual);
  return guardado ? JSON.parse(guardado) : { titulo: "", autor: "", imagen: "" };
}

export function guardarLibroActual(libro: any) {
  escribir(CLAVES.libroActual, libro);
}


/* ----------------------------------------------------------
   LOS LIBROS QUE TERMINASTE
   ----------------------------------------------------------
   Cada uno que terminás suma monedas. Elegimos monedas y no
   puntos de crecimiento a propósito: los puntos salen solo de
   tus días buenos, y mezclarlos rompería esa cuenta. Las
   monedas son el premio, y terminar un libro claramente lo es.

   Cuánto vale cada libro se define en lib/tienda.ts, que es donde
   vive todo lo de monedas.
   ---------------------------------------------------------- */

export function cargarLibrosLeidos() {
  const guardado = __leerCrudo(CLAVES.librosLeidos);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarLibrosLeidos(lista: any) {
  escribir(CLAVES.librosLeidos, lista);
}

export function marcarLibroComoLeido(lista: any, libro: any, fecha: string, calificacion: number) {

  if (!libro || !libro.titulo) return { lista, ok: false };

  lista.push({
    titulo: libro.titulo,
    autor: libro.autor || "",
    imagen: libro.imagen || "",
    calificacion: calificacion || 0,   // de 0 (sin calificar) a 5 estrellas
    fecha,
  });

  guardarLibrosLeidos(lista);
  return { lista, ok: true };
}

export function eliminarLibroLeido(lista: any, indice: number) {
  lista.splice(indice, 1);
  guardarLibrosLeidos(lista);
  return lista;
}


/* ----------------------------------------------------------
   LOS DISCOS QUE ESCUCHASTE
   ----------------------------------------------------------
   Mismo patrón que los libros: cuando marcás un disco como
   escuchado, queda en este registro con su calificación. La
   app ya no tiene un reproductor propio (los adelantos de 30
   segundos de iTunes no reemplazan a un reproductor de
   música real): esto es un diario de lo que fuiste
   escuchando, no una forma de escucharlo desde acá.
   ---------------------------------------------------------- */

export function cargarDiscosEscuchados() {
  const guardado = __leerCrudo(CLAVES.discosEscuchados);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarDiscosEscuchados(lista: any) {
  escribir(CLAVES.discosEscuchados, lista);
}

export function marcarDiscoComoEscuchado(lista: any, disco: any, fecha: string, calificacion: number) {

  if (!disco || !disco.titulo) return { lista, ok: false };

  lista.push({
    titulo: disco.titulo,
    artista: disco.artista || "",
    imagen: disco.imagen || "",
    calificacion: calificacion || 0,
    fecha,
  });

  guardarDiscosEscuchados(lista);
  return { lista, ok: true };
}

export function eliminarDiscoEscuchado(lista: any, indice: number) {
  lista.splice(indice, 1);
  guardarDiscosEscuchados(lista);
  return lista;
}


/* ----------------------------------------------------------
   REGISTRO LIBRE DE ACTIVIDADES
   ----------------------------------------------------------
   [{fecha, categoria, nota}], del más nuevo al más viejo
   cuando lo mostramos en pantalla.
   ---------------------------------------------------------- */
export function cargarRegistroHobbies() {
  const guardado = __leerCrudo(CLAVES.hobbies);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarRegistroHobbies(lista: any) {
  escribir(CLAVES.hobbies, lista);
}

export function agregarActividadHobby(lista: any, fecha: string, categoriaId: string, nota: string) {
  lista.push({ fecha, categoria: categoriaId, nota: nota || "" });
  guardarRegistroHobbies(lista);
  return lista;
}

export function eliminarActividadHobby(lista: any, indice: number) {
  lista.splice(indice, 1);
  guardarRegistroHobbies(lista);
  return lista;
}

export function nombreCategoriaHobby(categoriaId: string) {
  const encontrada = CATEGORIAS_HOBBIES.find(c => c.id === categoriaId);
  return encontrada ? tr(encontrada.clave) : categoriaId;
}
