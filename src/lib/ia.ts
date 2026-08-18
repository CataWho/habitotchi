import { CLAVES, escribirTexto, leerTexto } from "./almacenamiento";

/* Los modulos portados leian con localStorage.getItem y
   parseaban a mano. Esto mantiene esa forma pero centraliza
   el acceso, para que el dia que sincronicemos con la nube
   haya un solo lugar que tocar. */
function __leerCrudo(clave: Parameters<typeof leerTexto>[0]): string | null {
  const valor = leerTexto(clave, "");
  return valor === "" ? null : valor;
}

/* ==========================================================
   HABITOTCHI · ia
   EL CHEF (reconocimiento de comida por foto)
   ==========================================================
   Le sacás una foto a tu comida, y el "chef" trata de
   adivinar qué es y cuántas calorías tiene. Es una
   ESTIMACIÓN, no una báscula de precisión.

   ---------- CÓMO FUNCIONA (importante) ----------
   Esta app no tiene servidor propio: todo corre en tu
   navegador. Para que el chef "vea" la foto, mandamos la
   imagen directamente desde tu navegador a Google AI Studio
   (Gemini), usando la clave gratuita de quien usa la app.

   ¿Por qué Gemini y no otra? Porque su nivel gratuito es
   gratis de verdad: no pide tarjeta de crédito, no vence, y
   alcanza para alrededor de mil fotos por día. Si la app
   necesitara una clave paga, nadie la usaría.

   La clave se guarda solo en tu localStorage, en tu propia
   compu, y nunca se manda a ningún lado que no sea Google.
   Si no cargás ninguna, el chef igual sirve: anotás la
   comida a mano y te sugiere las calorías del diccionario
   de acá abajo.
   ========================================================== */


/* Las calorías de comida del día ya no se guardan acá: viven
   como entradas del registro de lib/alimentacion.ts, y el total
   se calcula sumándolas (ver totalCaloriasDelDia). */


/* ==========================================================
   EL DIBUJO DEL CHEF, EN PIXEL ART
   ==========================================================
   Misma técnica que las mascotas de datos/mascotas.ts: una grilla
   donde cada letra es un pixel de un color, y el punto "."
   queda transparente. Lo dibuja el componente Chef.tsx.

     G = blanco del gorro
     P = piel
     O = tinta (ojos, contorno)
     B = blanco del bigote y la chaqueta
     R = boca
   ========================================================== */
export const CHEF_PIXELES = [
  "....GGGGGG....",
  "..GGGGGGGGGG..",
  ".GGGGGGGGGGGG.",
  ".GGGGGGGGGGGG.",
  "..GGGGGGGGGG..",
  "...GGGGGGGG...",
  "...OOOOOOOO...",
  "...PPPPPPPP...",
  "..PPPPPPPPPP..",
  "..PPOPPPPOPP..",
  "..PPPPPPPPPP..",
  "..PPPPPPPPPP..",
  "..PBBBBBBBBP..",
  "..PBBBRRBBBP..",
  "...PPPPPPPP...",
  "....PPPPPP....",
  "..BBBBBBBBBB..",
  ".BBBBBBBBBBBB.",
  ".BBOBBBBBBOBB.",
  ".BBBBBBBBBBBB.",
  ".BBBBBBBBBBBB.",
];

export const CHEF_COLORES = {
  G: "#fdf9ff",
  P: "#f6c9a0",
  O: "#3a2a1c",
  B: "#ffffff",
  R: "#c47070",
};

export function cargarApiKey() {
  return __leerCrudo(CLAVES.apiKey) || "";
}

export function guardarApiKey(clave: string) {
  escribirTexto(CLAVES.apiKey, clave);
}


/* ----------------------------------------------------------
   UN DICCIONARIO CHIQUITO, PARA CUANDO CARGÁS A MANO
   ----------------------------------------------------------
   Sirve de ayuda en el chat: si escribís "banana", el chef
   te tira una caloría aproximada sin necesitar la IA.
   ---------------------------------------------------------- */
export const CALORIAS_COMUNES: Record<string, number> = {
  // Frutas y verduras
  "manzana": 95, "banana": 105, "naranja": 62, "pera": 100,
  "frutilla": 50, "uva": 90, "mandarina": 47, "verdura": 60,
  "ensalada": 150, "palta": 240, "tomate": 22, "zanahoria": 25,

  // Carbohidratos
  "arroz": 200, "fideos": 220, "pan": 80, "tostada": 75,
  "papa": 160, "batata": 180, "polenta": 145, "avena": 150,

  // Proteínas
  "pollo": 165, "carne": 250, "pescado": 180, "huevo": 78,
  "atun": 130, "lentejas": 230, "milanesa": 300, "bife": 280,

  // Comida argentina y platos
  "empanada": 230, "asado": 400, "choripan": 480, "pizza": 285,
  "hamburguesa": 350, "sandwich": 250, "tarta": 300, "guiso": 350,
  "ravioles": 380, "ñoquis": 350, "locro": 420, "provoleta": 320,

  // Lácteos
  "yogur": 100, "queso": 110, "leche": 120, "dulce de leche": 130,

  // Dulces y snacks
  "helado": 210, "chocolate": 150, "galletitas": 140, "torta": 350,
  "alfajor": 220, "factura": 250, "medialuna": 180, "flan": 150,

  // Otros
  "sopa": 120, "mate": 0, "cafe": 5, "gaseosa": 140,
};

/* Busca por coincidencia parcial (así "banana con miel"
   igual encuentra "banana"). Devuelve null si no hay nada
   parecido.

   Ojo con un detalle: si escribís "dulce de leche", el texto
   también contiene "leche". Por eso nos quedamos siempre con
   la coincidencia MÁS LARGA, que es la más específica. */
export function buscarCaloriaComun(textoLibre: string) {
  const texto = textoLibre.toLowerCase();

  let mejor = null;

  for (const nombre in CALORIAS_COMUNES) {
    if (texto.includes(nombre)) {
      if (!mejor || nombre.length > mejor.nombre.length) {
        mejor = { nombre, calorias: CALORIAS_COMUNES[nombre] };
      }
    }
  }

  return mejor;
}


/* ==========================================================
   LAS PORCIONES
   ==========================================================
   El diccionario guarda las calorías de UNA porción normal.
   Pero si escribís "media porción de puré" o "2 empanadas",
   la cantidad cambia — y antes lo ignorábamos por completo,
   así que media porción daba lo mismo que una entera.

   Esta función lee el texto y saca un multiplicador.
   Es una aproximación con sentido común, no una ciencia:
   "grande" no tiene una definición exacta en ningún lado.
   ========================================================== */

export function interpretarCantidad(textoLibre: string) {

  const texto = " " + textoLibre.toLowerCase() + " ";
  let multiplicador = 1;

  /* --- Fracciones primero ---
     Tiene que ser antes que los números sueltos, porque
     "1/2" contiene un "1" que si no lo leeríamos como uno. */
  if (/\bmedi[oa]s?\b|\b1\s*\/\s*2\b|\bmitad\b/.test(texto)) {
    multiplicador *= 0.5;

  } else if (/\bun cuarto\b|\b1\s*\/\s*4\b/.test(texto)) {
    multiplicador *= 0.25;

  } else if (/\btres cuartos\b|\b3\s*\/\s*4\b/.test(texto)) {
    multiplicador *= 0.75;

  } else {
    /* --- Un número suelto: "2 empanadas", "1.5 tazas" --- */
    const numero = texto.match(/\b(\d+(?:[.,]\d+)?)\b/);

    if (numero) {
      const valor = parseFloat((numero[1] ?? "0").replace(",", "."));
      /* Filtramos números absurdos: si escribís "milanesa 2026"
         no queremos multiplicar por dos mil. */
      if (valor > 0 && valor <= 20) multiplicador *= valor;
    }
  }

  /* --- Tamaños --- */
  if (/\bgrande[s]?\b/.test(texto))            multiplicador *= 1.5;
  if (/\bchic[oa]s?\b|\bpequeñ[oa]s?\b/.test(texto)) multiplicador *= 0.7;
  if (/\bdoble[s]?\b/.test(texto))             multiplicador *= 2;

  return multiplicador;
}


/* Junta las dos cosas: encuentra el alimento y le aplica la
   cantidad. Es lo que usa el chef cuando anotás a mano. */
export function estimarCaloriasDeTexto(textoLibre: string) {

  const encontrado = buscarCaloriaComun(textoLibre);
  if (!encontrado || encontrado.calorias === undefined) return null;

  const multiplicador = interpretarCantidad(textoLibre);
  const porPorcion = encontrado.calorias;

  return {
    nombre: encontrado.nombre,
    caloriasPorPorcion: porPorcion,
    multiplicador,
    calorias: Math.round(porPorcion * multiplicador),
  };
}


/* ----------------------------------------------------------
   LA CONSULTA A LA IA (Google AI Studio · Gemini)
   ----------------------------------------------------------
   Le mandamos la foto (en base64) y le pedimos que conteste
   SOLO con JSON, para poder leerlo fácil en el código.

   Usamos el modelo "flash-lite" a propósito: es el más
   rápido y el que más consultas gratis permite por día.
   ---------------------------------------------------------- */
export const MODELO_GEMINI = "gemini-2.5-flash-lite";

export const INSTRUCCION_CHEF =
  'Mirá esta foto de comida. Identificá los alimentos (puede ser comida argentina: milanesa, empanada, ' +
  'mate, facturas, asado, etc.) y estimá las calorías aproximadas de la porción que se ve en la foto. ' +
  'Respondé ÚNICAMENTE con este JSON, sin texto extra y sin markdown: ' +
  '{"alimentos":[{"nombre":"...","calorias":123}],"caloriasTotal":123}. ' +
  'Si no reconocés nada comestible, respondé {"alimentos":[],"caloriasTotal":0}.';

export async function reconocerComidaConIA(imagenBase64: string, mediaType: string, apiKey: string) {
  return consultarAlChef(
    [
      { inline_data: { mime_type: mediaType, data: imagenBase64 } },
      { text: INSTRUCCION_CHEF },
    ],
    apiKey
  );
}


/* ----------------------------------------------------------
   LO MISMO, PERO CON TEXTO EN VEZ DE FOTO
   ----------------------------------------------------------
   Acá está la gracia para el problema de las porciones: la
   IA entiende "media porción de puré de papas" o "dos
   empanadas grandes" mucho mejor que nuestro diccionario,
   porque entiende la frase entera, no solo la palabra suelta.
   ---------------------------------------------------------- */
export const INSTRUCCION_CHEF_TEXTO =
  'Alguien anotó que comió esto: "{COMIDA}". ' +
  'Puede ser comida argentina (milanesa, empanada, facturas, asado, mate...). ' +
  'Prestá MUCHA atención a la cantidad y al tamaño: "media porción" es la mitad, ' +
  '"dos empanadas" es el doble de una, "grande" es más que una porción normal. ' +
  'Estimá las calorías de esa cantidad exacta. ' +
  'Respondé ÚNICAMENTE con este JSON, sin texto extra y sin markdown: ' +
  '{"alimentos":[{"nombre":"...","calorias":123}],"caloriasTotal":123}. ' +
  'Si no es comida, respondé {"alimentos":[],"caloriasTotal":0}.';

export async function estimarComidaPorTextoConIA(textoLibre: string, apiKey: string) {
  return consultarAlChef(
    [{ text: INSTRUCCION_CHEF_TEXTO.replace("{COMIDA}", textoLibre) }],
    apiKey
  );
}


/* La parte común de las dos consultas: mandar, revisar el
   error y leer el JSON de la respuesta. */
export async function consultarAlChef(partes: any, apiKey: string) {

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
              MODELO_GEMINI + ":generateContent?key=" + encodeURIComponent(apiKey);

  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: partes }],
      generationConfig: {
        temperature: 0.2,           // poca creatividad: queremos datos, no cuentos
        responseMimeType: "application/json",
      },
    }),
  });

  if (!respuesta.ok) {
    if (respuesta.status === 400 || respuesta.status === 403) {
      throw new Error("Tu clave de Gemini no es válida. Revisala en Ajustes.");
    }
    if (respuesta.status === 429) {
      throw new Error("Llegaste al límite gratis de hoy. Probá de nuevo mañana, o anotá la comida a mano.");
    }
    throw new Error("No se pudo consultar al chef (código " + respuesta.status + ").");
  }

  const datos = await respuesta.json();

  /* La respuesta de Gemini viene anidada bastante hondo:
     candidates -> content -> parts -> text */
  const texto =
    (datos.candidates && datos.candidates[0] &&
     datos.candidates[0].content && datos.candidates[0].content.parts &&
     datos.candidates[0].content.parts[0] && datos.candidates[0].content.parts[0].text) || "{}";

  /* Por las dudas de que igual venga envuelto en ```json */
  const limpio = texto.trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(limpio);
  } catch (error) {
    throw new Error("El chef contestó algo raro, probá anotar la comida a mano.");
  }
}


/* ----------------------------------------------------------
   CONVERTIR UN ARCHIVO DE IMAGEN A BASE64
   ---------------------------------------------------------- */
export function archivoABase64(archivo: any) {
  return new Promise((resolve: any, reject: any) => {
    const lector = new FileReader();
    lector.onload = () => {
      /* Sacamos el prefijo "data:...;base64," y nos quedamos
         con los datos crudos. */
      const texto = typeof lector.result === "string" ? lector.result : "";
      resolve(texto.split(",")[1] ?? "");
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}
