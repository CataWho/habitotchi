import { Capacitor } from "@capacitor/core";
import { estimarCaloriasDeTexto, interpretarCantidad } from "./ia";

/* ==========================================================
   HABITOTCHI · Open Food Facts, como respaldo del diccionario
   ==========================================================
   El diccionario local (ia.ts) tiene ~50 alimentos escritos a
   mano. Cuando no encuentra nada, esto busca en Open Food
   Facts: una base de datos colaborativa y gratuita, sin clave,
   con cientos de miles de productos.

   ---------- SOLO CORRE EN LA APP NATIVA ----------
   El servidor de Open Food Facts no manda el header
   Access-Control-Allow-Origin, así que un fetch() de navegador
   lo rechaza por CORS antes de que la respuesta llegue a
   JavaScript — verificado probándolo desde esta misma app: el
   pedido nunca falla en el servidor, lo corta el navegador.

   Capacitor puede evitar esto (ver capacitor.config.ts,
   CapacitorHttp), pero solo cuando la app corre empaquetada:
   ahí el pedido lo hace código nativo, no el WebView, y CORS no
   aplica. Por eso esta función se corta sola en la versión web
   — que sigue siendo el modo principal de usar la app — en vez
   de intentar un fetch que el navegador va a rechazar seguro.

   NO VERIFICADO EN UN CELULAR DE VERDAD todavía: la ruta nativa
   se armó siguiendo la documentación de Capacitor, pero no hay
   forma de ejecutarla sin una build nativa. Cuando se pruebe,
   revisar esta nota.
   ========================================================== */

const ENDPOINT = "https://world.openfoodfacts.org/cgi/search.pl";

/* Los mismos campos que devuelve el servidor de verdad
   (verificado con una búsqueda real de "milanesa" y "banana").
   Solo tipamos lo que usamos. */
interface ProductoOFF {
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
  };
}

interface RespuestaOFF {
  count: number;
  products: ProductoOFF[];
}

export interface AlimentoEncontrado {
  nombre: string;
  caloriasPorPorcion: number;
  multiplicador: number;
  calorias: number;
}

/* Cuánto tarda sin responder antes de darnos por vencidas. Una
   red de celular puede ser lenta, pero tampoco tiene sentido
   dejar a alguien esperando el teclado colgado. */
const TIEMPO_LIMITE_MS = 4000;

export async function buscarEnOpenFoodFacts(textoLibre: string): Promise<AlimentoEncontrado | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!textoLibre.trim()) return null;

  const url =
    `${ENDPOINT}?search_terms=${encodeURIComponent(textoLibre.trim())}` +
    "&search_simple=1&action=process&json=1&page_size=5" +
    "&fields=product_name,nutriments";

  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(url, { signal: controlador.signal });
    if (!respuesta.ok) return null;

    const datos: RespuestaOFF = await respuesta.json();

    /* Nos quedamos con el primer resultado que tenga nombre Y
       calorías cargadas: la base es colaborativa, y bastantes
       productos tienen uno de los dos datos vacío. */
    const encontrado = datos.products?.find(
      (p) => p.product_name && p.nutriments?.["energy-kcal_100g"] !== undefined
    );
    if (!encontrado) return null;

    const porPorcion = encontrado.nutriments!["energy-kcal_100g"]!;
    const multiplicador = interpretarCantidad(textoLibre);

    return {
      nombre: encontrado.product_name!,
      caloriasPorPorcion: porPorcion,
      multiplicador,
      calorias: Math.round(porPorcion * multiplicador),
    };
  } catch {
    /* Sin internet, tiempo agotado, o el servidor caído: no es
       un error que haya que mostrarle a nadie. Simplemente no
       hay sugerencia, y el campo de calorías se completa a
       mano como siempre. */
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

/* ----------------------------------------------------------
   EL DICCIONARIO, CON RESPALDO
   ----------------------------------------------------------
   Primero prueba local (instantáneo, ~50 alimentos con comida
   argentina). Si no encuentra nada, recién ahí prueba Open
   Food Facts (solo en la app nativa, y solo si esto tarda le
   da tiempo: es una llamada de red).

   El orden importa: el diccionario local entiende "milanesa"
   mejor que una base pensada para productos envasados, así que
   no tiene sentido consultar la red cuando ya sabemos la
   respuesta más específica.
   ---------------------------------------------------------- */
export async function estimarCaloriasConRespaldo(textoLibre: string): Promise<AlimentoEncontrado | null> {
  const local = estimarCaloriasDeTexto(textoLibre);
  if (local) return local;

  return buscarEnOpenFoodFacts(textoLibre);
}
