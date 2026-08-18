import { useEffect, useState } from "react";
import type { Textos } from "@/idiomas/es";
import { ES } from "@/idiomas/es";
import { EN } from "@/idiomas/en";

/* ==========================================================
   HABITOTCHI · los idiomas
   ==========================================================
   Todo el texto que la persona LEE sale de acá. El código
   sigue en español —variables, funciones, comentarios— y eso
   no cambia: lo único que se traduce es lo que se ve.

   ---------- POR QUÉ SIN LIBRERÍA ----------
   react-i18next pesa unos 40KB comprimidos sobre un bundle de
   92KB: un 43% más para una app de dos idiomas que corre en
   una pantalla de 300px. Esto son setenta líneas y hace las
   tres cosas que el código necesita de verdad.

   ---------- EL IDIOMA NO SE SINCRONIZA ----------
   Se guarda con localStorage directo y queda afuera de
   CLAVES_QUE_SINCRONIZAN (lib/nube.ts) a propósito: es una
   preferencia de ESTE aparato, como el sonido. Que el idioma
   que elegiste en la compu te cambie el del celular sería un
   bug, no una función.
   ========================================================== */

export type Idioma = "es" | "en";

const CLAVE = "habitotchi_idioma";

const DICCIONARIOS: Record<Idioma, Textos> = { es: ES, en: EN };

/* ----------------------------------------------------------
   QUÉ IDIOMA MOSTRAR
   ----------------------------------------------------------
   Si la persona eligió uno, ese. Si no, el del dispositivo:
   español si el teléfono está en español, inglés para todo lo
   demás. navigator.language da cosas como "es-AR" o "en-US",
   así que alcanza con mirar las dos primeras letras.
   ---------------------------------------------------------- */
export function idiomaGuardado(): Idioma | null {
  try {
    const valor = localStorage.getItem(CLAVE);
    return valor === "es" || valor === "en" ? valor : null;
  } catch {
    return null;
  }
}

export function idiomaDelDispositivo(): Idioma {
  const suyo = typeof navigator !== "undefined" ? navigator.language : "";
  return suyo.toLowerCase().startsWith("es") ? "es" : "en";
}

export function idiomaActual(): Idioma {
  return idiomaGuardado() ?? idiomaDelDispositivo();
}

export function guardarIdioma(idioma: Idioma): void {
  try {
    localStorage.setItem(CLAVE, idioma);
  } catch {
    /* Sin espacio o almacenamiento bloqueado: la próxima vez
       vuelve al idioma del dispositivo. Molesto, no grave. */
  }
}

/* ==========================================================
   TRADUCIR
   ==========================================================
   Tres formas, que son las que el código usa hoy:

     t("guardar")                         texto simple
     t("faltanDias", { n: 3 })            con un número
     t("desbloqueado", { que: "Corona" }) con un dato adentro

   ---------- LOS HUECOS VAN CON NOMBRE ----------
   Se escriben {n}, {que}, {etapa}... y no por posición,
   porque en inglés el orden de las palabras cambia:

     es: "Faltan {n} días buenos para {etapa}"
     en: "{n} more good days until {etapa}"

   Con huecos numerados habría que acordarse de cuál era cuál
   en cada idioma; con nombre, cada diccionario los pone donde
   le corresponda.

   ---------- EL PLURAL ----------
   Cuando un texto cambia según la cantidad, en el diccionario
   va como { uno, otros } y acá se elige. Antes esto estaba
   escrito a mano en cuatro lugares distintos.
   ========================================================== */

export interface Plural {
  uno: string;
  otros: string;
}

type Valor = string | Plural;
type Datos = Record<string, string | number>;

function elegirForma(valor: Valor, datos?: Datos): string {
  if (typeof valor === "string") return valor;

  /* Un plural sin número es un error de quien llama, pero no
     vale romper la pantalla por eso: se muestra la forma de
     muchos, que es la que más veces acierta. */
  const n = Number(datos?.n);
  return n === 1 ? valor.uno : valor.otros;
}

function rellenar(texto: string, datos?: Datos): string {
  if (!datos) return texto;

  return texto.replace(/\{(\w+)\}/g, (original, nombre) => {
    const valor = datos[nombre];
    return valor === undefined ? original : String(valor);
  });
}

export function traducir(idioma: Idioma, clave: string, datos?: Datos): string {
  const diccionario = DICCIONARIOS[idioma] as unknown as Record<string, Valor>;
  const valor = diccionario[clave];

  /* Si falta la clave se devuelve la clave misma. Un texto
     raro en pantalla se ve y se arregla; un texto vacío pasa
     desapercibido hasta que alguien se queja. */
  if (valor === undefined) return clave;

  return rellenar(elegirForma(valor, datos), datos);
}

/* ==========================================================
   EL HOOK
   ==========================================================
   Devuelve la función de traducir ya atada al idioma actual,
   más el idioma y cómo cambiarlo.

   Cambiar de idioma recarga la página. Es lo mismo que ya
   hacen "Restaurar una copia" y el inicio de sesión, y por la
   misma razón: hay textos que se leen una sola vez al montar
   la pantalla, y volver a arrancar es mucho más difícil de
   romper que perseguir cada uno.
   ========================================================== */

export function usarIdioma() {
  const [idioma, setIdioma] = useState<Idioma>(() => idiomaActual());

  /* El <html lang> importa: es lo que usan los lectores de
     pantalla para elegir la pronunciación, y el navegador
     para ofrecer traducir. */
  useEffect(() => {
    document.documentElement.lang = idioma === "es" ? "es-AR" : "en";
  }, [idioma]);

  const cambiarIdioma = (nuevo: Idioma) => {
    if (nuevo === idioma) return;
    guardarIdioma(nuevo);
    setIdioma(nuevo);
    location.reload();
  };

  const t = (clave: string, datos?: Datos) => traducir(idioma, clave, datos);

  return { idioma, cambiarIdioma, t };
}

/* Para el código que no es un componente de React (los
   catálogos de datos, los mensajes de error de lib/). Lee el
   idioma en el momento, sin suscribirse a nada. */
export function tr(clave: string, datos?: Datos): string {
  return traducir(idiomaActual(), clave, datos);
}
