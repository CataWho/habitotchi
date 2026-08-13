/* ==========================================================
   GOOGLE CALENDAR
   ==========================================================
   Trae los eventos reales de tu Google Calendar para verlos
   junto a tus notas propias. Es opcional: el calendario de
   Habitotchi funciona igual sin conectar nada.

   ---------- SOLO LECTURA, A PROPÓSITO ----------
   El permiso que se pide es calendar.readonly: la app puede
   ver tus eventos, pero no crear, editar ni borrar nada. Es
   el permiso más chico que sirve para lo que hace, y eso
   importa además porque Google revisa que no pidas de más.

   ---------- EL TOKEN NO SE GUARDA ----------
   El permiso vive en una variable de este módulo y se va
   cuando cerrás la pestaña. No va a localStorage.

   Una app sin servidor propio no puede guardar un secreto: el
   código entero se le manda al navegador de cada persona y
   cualquiera puede leerlo. Por eso Google solo le da tokens
   cortos (una hora) y sin renovación automática. Guardar ese
   token en el disco no lo haría durar más, solo lo dejaría
   expuesto a cualquier otro script de la página.

   ---------- EL CLIENT ID NO ES SECRETO ----------
   Sale de una variable de entorno para poder cambiarlo sin
   tocar el código (en Netlify se carga desde el panel), pero
   no es una contraseña: viaja igual en cada pedido y Google
   lo trata como público. Lo que protege la cuenta es la lista
   de dominios autorizados, no esconderlo.
   ========================================================== */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const PERMISO = "https://www.googleapis.com/auth/calendar.readonly";
const SCRIPT = "https://accounts.google.com/gsi/client";

/* Si no hay Client ID configurado, la pantalla directamente
   no muestra el botón: más vale que la función no exista a
   que exista y falle al tocarla. */
export function sePuedeConectar(): boolean {
  return CLIENT_ID.length > 0;
}

export interface EventoDeGoogle {
  /* La fecha en formato AAAA-MM-DD, para poder cruzarla con
     las notas propias, que se guardan con esa misma clave. */
  fecha: string;
  titulo: string;
  /* Vacío en los eventos de todo el día */
  hora: string;
}

/* ----------------------------------------------------------
   EL SCRIPT DE GOOGLE
   ----------------------------------------------------------
   No viene en el paquete: hay que bajarlo de Google cuando
   hace falta. Se carga una sola vez y recién cuando tocás
   "Conectar" — cargarlo siempre haría que la app le pida algo
   a Google aunque nunca uses el calendario.
   ---------------------------------------------------------- */
let cargando: Promise<void> | null = null;

function cargarScriptDeGoogle(): Promise<void> {
  if (cargando) return cargando;

  cargando = new Promise((listo, falló) => {
    if (document.querySelector(`script[src="${SCRIPT}"]`)) return listo();

    const etiqueta = document.createElement("script");
    etiqueta.src = SCRIPT;
    etiqueta.async = true;
    etiqueta.onload = () => listo();
    etiqueta.onerror = () => {
      /* Si falla, se limpia la promesa para que el próximo
         intento vuelva a probar en vez de quedar pegado al
         error para siempre. */
      cargando = null;
      falló(new Error("No se pudo cargar el script de Google."));
    };

    document.head.appendChild(etiqueta);
  });

  return cargando;
}

/* ----------------------------------------------------------
   PEDIR PERMISO
   ----------------------------------------------------------
   Abre la ventanita de Google donde la persona elige su
   cuenta y acepta. La contraseña la escribe en Google, nunca
   acá: esta app nunca la ve.
   ---------------------------------------------------------- */
let token: string | null = null;

export function yaEstaConectado(): boolean {
  return token !== null;
}

export function desconectar(): void {
  token = null;
}

export async function conectar(): Promise<void> {
  await cargarScriptDeGoogle();

  return new Promise((listo, falló) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return falló(new Error("Google no está disponible."));
    }

    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: PERMISO,
      callback: (respuesta: any) => {
        if (respuesta?.access_token) {
          token = respuesta.access_token;
          listo();
        } else {
          falló(new Error("No se pudo conectar."));
        }
      },
      error_callback: () => falló(new Error("Se canceló la conexión.")),
    });

    cliente.requestAccessToken();
  });
}

/* ----------------------------------------------------------
   TRAER LOS EVENTOS
   ----------------------------------------------------------
   singleEvents=true expande los eventos que se repiten en una
   ocurrencia por fecha. Sin eso, un evento semanal viene una
   sola vez con su regla de repetición y habría que calcular a
   mano en qué días cae.
   ---------------------------------------------------------- */
export async function traerEventos(desde: Date, hasta: Date): Promise<EventoDeGoogle[]> {
  if (!token) throw new Error("Todavía no conectaste tu calendario.");

  const parametros = new URLSearchParams({
    timeMin: desde.toISOString(),
    timeMax: hasta.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const respuesta = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${parametros}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  /* 401 es "el permiso venció": pasa sola cada hora. Se borra
     el token para que la pantalla vuelva a ofrecer conectar,
     en vez de mostrar un error que no dice nada. */
  if (respuesta.status === 401) {
    token = null;
    throw new Error("Se venció el permiso. Tocá Conectar de nuevo.");
  }

  if (!respuesta.ok) throw new Error("Google no contestó bien.");

  const datos = await respuesta.json();
  return (datos.items ?? []).map(interpretarEvento).filter(Boolean) as EventoDeGoogle[];
}

/* Google manda dos formas distintas de fecha: los eventos con
   horario traen dateTime ("2026-08-13T15:00:00-03:00") y los
   de todo el día traen date ("2026-08-13"). */
function interpretarEvento(evento: any): EventoDeGoogle | null {
  const inicio = evento?.start;
  if (!inicio) return null;

  const titulo = evento.summary?.trim() || "(sin título)";

  if (inicio.date) {
    return { fecha: inicio.date, titulo, hora: "" };
  }

  if (inicio.dateTime) {
    const cuando = new Date(inicio.dateTime);
    return {
      /* La fecha se arma con los métodos locales y no con
         toISOString(), que pasa a UTC: un evento a las 21hs en
         Buenos Aires caería al día siguiente. */
      fecha: [
        cuando.getFullYear(),
        String(cuando.getMonth() + 1).padStart(2, "0"),
        String(cuando.getDate()).padStart(2, "0"),
      ].join("-"),
      titulo,
      hora: `${String(cuando.getHours()).padStart(2, "0")}:${String(cuando.getMinutes()).padStart(2, "0")}`,
    };
  }

  return null;
}
