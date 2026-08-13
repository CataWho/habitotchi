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
   HABITOTCHI · portadas.js
   LAS TAPAS DE LIBROS Y DISCOS
   ==========================================================
   Escribís título y autor, y aparece la tapa del libro.
   Lo mismo con los discos.

   ---------- POR QUÉ ESTAS DOS FUENTES ----------
   Las dos son gratis, no piden ninguna clave, y se pueden
   consultar directo desde el navegador:

     · Libros  -> Open Library, del Internet Archive
     · Discos  -> la API de búsqueda de iTunes

   No hace falta registrarse en ningún lado ni configurar
   nada: andan solas apenas abrís la app.

   Guardamos la dirección de la tapa junto con el título, así
   no volvemos a preguntar cada vez que abrís la app. Además
   de ser más rápido, es más amable con dos servicios que son
   gratuitos y que conviene no saturar.
   ========================================================== */


/* ==========================================================
   1) TAPAS DE LIBROS · Open Library
   ==========================================================
   Buscamos el libro y nos quedamos con su "cover_i", que es
   el número de la tapa. Con ese número se arma la dirección
   de la imagen.
   ========================================================== */

export async function buscarPortadaLibro(titulo: string, autor: string) {

  if (!titulo || !titulo.trim()) return null;

  let url = "https://openlibrary.org/search.json?limit=3&fields=cover_i,title,author_name" +
            "&title=" + encodeURIComponent(titulo.trim());

  if (autor && autor.trim()) {
    url += "&author=" + encodeURIComponent(autor.trim());
  }

  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("No se pudo buscar el libro.");

  const datos = await respuesta.json();
  const encontrados = datos.docs || [];

  /* Nos quedamos con el primero que TENGA tapa: a veces el
     primer resultado es una edición sin imagen cargada, y el
     segundo sí la tiene. */
  const conTapa = encontrados.find((libro: any) => libro.cover_i);
  if (!conTapa) return null;

  return {
    imagen: "https://covers.openlibrary.org/b/id/" + conTapa.cover_i + "-M.jpg",
    titulo: conTapa.title || titulo,
    autor:  (conTapa.author_name && conTapa.author_name[0]) || autor || "",
  };
}


/* ==========================================================
   2) PORTADAS DE DISCOS · iTunes
   ==========================================================
   La API de iTunes devuelve la portada en 100x100, pero se
   puede pedir más grande cambiando ese número en la propia
   dirección de la imagen. Es un truco conocido y estable.
   ========================================================== */

export async function buscarPortadaDisco(album: string, artista: string) {

  if (!album || !album.trim()) return null;

  const busqueda = [artista, album].filter((t: any) => t && t.trim()).join(" ");

  const url = "https://itunes.apple.com/search?entity=album&limit=3&term=" +
              encodeURIComponent(busqueda);

  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("No se pudo buscar el disco.");

  const datos = await respuesta.json();
  const encontrados = datos.results || [];

  const primero = encontrados.find((disco: any) => disco.artworkUrl100);
  if (!primero) return null;

  return {
    imagen:  primero.artworkUrl100.replace("100x100", "600x600"),
    titulo:  primero.collectionName || album,
    artista: primero.artistName || artista || "",
    /* El número del disco: lo guardamos para después poder
       pedir su lista de temas (ver sonido.js) */
    idDisco: primero.collectionId || null,
  };
}


/* ==========================================================
   3) EL DISCO QUE ESTÁS ESCUCHANDO
   ==========================================================
   Igual que el libro actual: se guarda uno solo, el de ahora.
   ========================================================== */


export function cargarDiscoActual() {
  const guardado = __leerCrudo(CLAVES.discoActual);
  return guardado ? JSON.parse(guardado) : { titulo: "", artista: "", imagen: "", idDisco: null };
}

export function guardarDiscoActual(disco: any) {
  escribir(CLAVES.discoActual, disco);
}
