/* ==========================================================
   LA CUENTA EN LA NUBE
   ==========================================================
   Un login opcional para ver los mismos datos desde varios
   dispositivos. Usa Supabase: base de datos + autenticación
   en un solo servicio gratuito.

   ---------- OPCIONAL, A PROPÓSITO ----------
   Sin cuenta, Habitotchi sigue funcionando exactamente igual
   que siempre: todo en el dispositivo, nada se manda a
   ningún lado. Esto es un agregado, no un reemplazo.

   ---------- LA ANON KEY NO ES SECRETA ----------
   Viaja adentro del JavaScript que se le manda a cada
   persona, igual que el Client ID de Google (ver el
   comentario largo en google-calendar.ts). Lo que protege
   los datos de cada quien es la Row Level Security de la
   base — cada fila solo la puede tocar su dueña, sin
   importar quién tenga la anon key — no esconder esta clave.

   ---------- NO HAY SINCRONIZACIÓN EN VIVO ----------
   Si tenés la app abierta en dos aparatos a la vez, uno no se
   entera de lo que cambia el otro hasta que se recarga. Eso
   es sincronización en tiempo real (con websockets), un
   problema bastante más grande, y queda afuera de esta
   primera versión a propósito.
   ========================================================== */

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CLAVES, leer, escribir, borrar, alCambiar, type Clave } from "./almacenamiento";

const TABLA = "datos_usuario";

/* ----------------------------------------------------------
   QUÉ SE SINCRONIZA
   ----------------------------------------------------------
   No es "todo lo que hay en CLAVES": se dejan afuera a
   propósito.

   · sonido y notificaciones son ajustes de ESTE aparato, no
     datos de la persona: que el volumen elegido en la compu te
     pise el del celular sería un bug, no una función.

   · apiKey y googleClientId son credenciales de acceso a
     servicios, no datos personales. La primera la leen ia.ts y
     Chef.tsx, que hoy están desconectados del resto de la app
     (ver el comentario de Ajustes.tsx); la segunda no la usa
     nadie desde que el Client ID pasó a ser una variable de
     entorno. En cualquier caso, una clave de acceso no tiene
     por qué viajar a la nube ni seguirte entre dispositivos.
   ---------------------------------------------------------- */
export const CLAVES_QUE_SINCRONIZAN: readonly Clave[] = [
  CLAVES.registro, CLAVES.metas, CLAVES.vida, CLAVES.cementerio,
  CLAVES.compras, CLAVES.equipado,
  CLAVES.perfil, CLAVES.historialPeso, CLAVES.historialCiclo,
  CLAVES.animoDiario, CLAVES.medicaciones, CLAVES.tomas,
  CLAVES.sesionesEjercicio, CLAVES.fuerzaPropios, CLAVES.pasos,
  CLAVES.comidas,
  CLAVES.hobbies, CLAVES.libroActual, CLAVES.librosLeidos,
  CLAVES.discoActual, CLAVES.discosEscuchados,
  CLAVES.calendario, CLAVES.sesionesTrabajo, CLAVES.todos,
  CLAVES.records,
];

/* ----------------------------------------------------------
   EL CLIENTE, ARMADO UNA SOLA VEZ
   ----------------------------------------------------------
   null si no hay proyecto de Supabase configurado: la app
   entera tiene que poder correr sin esto, así que en vez de
   fallar en cada llamada, cada función de acá revisa esto
   primero y no hace nada si no hay cliente.
   ---------------------------------------------------------- */
const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* ----------------------------------------------------------
   "RECORDARME", DE VERDAD
   ----------------------------------------------------------
   Supabase guarda la sesión en localStorage y listo. Para que
   se pueda destildar hace falta darle un storage propio que
   decida a dónde escribir:

     tildado    → localStorage,   sobrevive cerrar el navegador
     destildado → sessionStorage, muere al cerrar la pestaña

   Lo segundo es lo que espera alguien que entra desde una
   compu prestada. La preferencia en sí va aparte, en su
   propia clave de localStorage, porque hay que saberla ANTES
   de leer la sesión.
   ---------------------------------------------------------- */
const CLAVE_RECORDARME = "habitotchi_recordarme";

export function quiereQueLoRecuerden(): boolean {
  try {
    /* Tildado por default: es lo que espera la mayoría, y lo
       que la app ya venía haciendo. */
    return localStorage.getItem(CLAVE_RECORDARME) !== "no";
  } catch {
    return true;
  }
}

export function guardarSiQuiereQueLoRecuerden(recordar: boolean): void {
  try {
    localStorage.setItem(CLAVE_RECORDARME, recordar ? "si" : "no");
  } catch {
    /* Almacenamiento bloqueado: se queda con el default. */
  }
}

function dondeGuardarLaSesion(): Storage {
  return quiereQueLoRecuerden() ? localStorage : sessionStorage;
}

const almacenDeSesion = {
  getItem: (clave: string) => {
    try {
      /* Se busca en los dos: si alguien cambia la preferencia
         entre visitas, la sesión que ya existía tiene que
         seguir encontrándose igual. */
      return localStorage.getItem(clave) ?? sessionStorage.getItem(clave);
    } catch {
      return null;
    }
  },
  setItem: (clave: string, valor: string) => {
    try {
      dondeGuardarLaSesion().setItem(clave, valor);
    } catch {
      /* ídem */
    }
  },
  removeItem: (clave: string) => {
    try {
      /* De los dos lados, para que cerrar sesión no deje un
         resto olvidado en el otro. */
      localStorage.removeItem(clave);
      sessionStorage.removeItem(clave);
    } catch {
      /* ídem */
    }
  },
};

const cliente: SupabaseClient | null =
  URL && ANON_KEY
    ? createClient(URL, ANON_KEY, {
        auth: {
          storage: almacenDeSesion,
          persistSession: true,
          autoRefreshToken: true,
          /* Para agarrar el token del link de "recuperar
             contraseña" cuando la persona vuelve del mail. */
          detectSessionInUrl: true,
        },
      })
    : null;

export function hayNubeConfigurada(): boolean {
  return cliente !== null;
}

/* ----------------------------------------------------------
   CREAR CUENTA, INICIAR Y CERRAR SESIÓN
   ---------------------------------------------------------- */
export async function crearCuenta(email: string, contraseña: string) {
  if (!cliente) throw new Error("La cuenta en la nube no está disponible.");

  const { data, error } = await cliente.auth.signUp({
    email,
    password: contraseña,
    options: {
      /* Cuándo aceptó los términos, guardado junto a la cuenta.
         Va en los metadatos del usuario y no en una tabla
         aparte: es un dato por cuenta, que se escribe una sola
         vez y casi nunca se lee. */
      data: { terminos_aceptados_en: new Date().toISOString() },
    },
  });

  if (error) throw new Error(traducirError(error.message));

  /* Si el proyecto tiene activada la confirmación de mail,
     signUp crea la cuenta pero NO devuelve sesión: la persona
     queda afuera hasta que toque el link que le llega. Hay que
     avisarle, porque si no la pantalla no hace nada y parece
     que el botón está roto. */
  return { usuario: data.user, necesitaConfirmarMail: data.session === null };
}

/* ----------------------------------------------------------
   RECUPERAR LA CONTRASEÑA
   ----------------------------------------------------------
   Funciona aunque la confirmación de mail esté desactivada:
   son dos mecanismos separados, con tokens distintos
   (verificado en la documentación de Supabase).

   A propósito no distingue si el mail existe o no — Supabase
   contesta igual en los dos casos, para que nadie pueda usar
   esto para averiguar quién tiene cuenta.
   ---------------------------------------------------------- */
export async function pedirRecuperarContraseña(email: string): Promise<void> {
  if (!cliente) throw new Error("La cuenta en la nube no está disponible.");

  const { error } = await cliente.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

  if (error) throw new Error(traducirError(error.message));
}

export async function cambiarContraseña(nueva: string): Promise<void> {
  if (!cliente) throw new Error("La cuenta en la nube no está disponible.");

  const { error } = await cliente.auth.updateUser({ password: nueva });
  if (error) throw new Error(traducirError(error.message));
}

export async function iniciarSesion(email: string, contraseña: string) {
  if (!cliente) throw new Error("La cuenta en la nube no está disponible.");

  const { data, error } = await cliente.auth.signInWithPassword({ email, password: contraseña });
  if (error) throw new Error(traducirError(error.message));
  return data.user;
}

export async function cerrarSesion(): Promise<void> {
  /* Cerrar sesión SÍ borra los datos de este dispositivo, y es
     a propósito.

     Antes no lo hacía, con el argumento de que "siguen acá como
     si nunca hubiera habido cuenta". Eso era razonable cuando la
     cuenta era opcional y los datos vivían solo en el aparato.
     Con login obligatorio y sincronización, dejarlos es un
     agujero: la próxima persona que entre en este navegador ve
     el peso, el ánimo, las medicaciones y el ciclo de la
     anterior, y encima lo que anote se sube a SU cuenta pisando
     sus datos reales.

     No se pierde nada: todo está en la nube y vuelve solo al
     iniciar sesión de nuevo. */
  limpiarDatosLocales();
  await cliente?.auth.signOut();
}

export async function sesionActual(): Promise<{ id: string; email: string } | null> {
  if (!cliente) return null;

  const { data } = await cliente.auth.getSession();
  const usuario = data.session?.user;
  if (!usuario?.email) return null;

  return { id: usuario.id, email: usuario.email };
}

/* Para que el panel de Ajustes se entere sola cuando cambia
   el estado de sesión (por ejemplo, si el token vence). */
export function alCambiarSesion(oyente: (evento: string) => void): () => void {
  if (!cliente) return () => {};

  const { data } = cliente.auth.onAuthStateChange((evento) => oyente(evento));
  return () => data.subscription.unsubscribe();
}

/* ==========================================================
   EL ESTADO DE SESIÓN, PARA REACT
   ==========================================================
   Un hook para que App.tsx (que decide si mostrar el portón o
   la app) y Ajustes (que muestra con qué mail estás) miren
   exactamente el mismo estado, sin duplicar la lógica ni
   poder desincronizarse entre sí.

   `cargando` importa: mientras se lee la sesión guardada no se
   sabe todavía si hay que mostrar el portón. Sin este estado,
   la app parpadearía el portón por un instante en cada
   arranque, aunque estuvieras logueada.
   ========================================================== */

export interface EstadoDeSesion {
  cargando: boolean;
  sesion: { id: string; email: string } | null;
  /* Cuando la persona vuelve del link del mail para poner una
     contraseña nueva. Supabase avisa con este evento. */
  recuperandoContraseña: boolean;
}

export function usarSesion(): EstadoDeSesion {
  const [estado, setEstado] = useState<EstadoDeSesion>({
    cargando: true,
    sesion: null,
    recuperandoContraseña: false,
  });

  useEffect(() => {
    let vivo = true;

    /* Sin sesión no hay nada que preparar; con sesión, hay que
       dejar los datos en orden ANTES de decir "cargando: false",
       porque en cuanto eso pase la app se dibuja y las pantallas
       leen del disco. */
    const revisar = async () => {
      /* getSession lee de storage y NO pide red: por eso alguien
         que ya entró antes puede abrir la app sin internet. */
      const sesion = await sesionActual();
      if (!vivo) return;

      if (sesion) {
        try {
          await prepararDatosDeLaSesion(sesion.id);
        } catch {
          /* Sin internet o Supabase caído. Se sigue adelante con
             lo que haya en el disco en vez de dejar a la persona
             mirando una pantalla de carga para siempre: si los
             datos son suyos (el caso de todos los días) están
             completos, y si no lo son, quedaron borrados y va a
             ver la app vacía hasta que vuelva la conexión. Lo
             que NO pasa es que se suba nada, porque la
             sincronización solo se enciende en el camino feliz. */
        }
        if (!vivo) return;
      }

      setEstado((previo) => ({ ...previo, cargando: false, sesion }));
    };

    void revisar();

    return alCambiarSesion((evento) => {
      if (evento === "PASSWORD_RECOVERY") {
        setEstado((previo) => ({ ...previo, recuperandoContraseña: true }));
        return;
      }

      void revisar();
    });
  }, []);

  return estado;
}

/* Para salir del modo "poné una contraseña nueva" una vez que
   se guardó. */
export function terminarRecuperacion(): void {
  /* Se limpia el token del link del mail de la barra de
     direcciones: si quedara ahí, recargar la página volvería
     a meterte en el flujo de recuperación. */
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

/* Los mensajes de Supabase vienen en inglés y con jerga
   técnica ("Invalid login credentials"). Se traducen los que
   más van a aparecer; el resto pasa tal cual, mejor eso que
   inventar una traducción que no corresponde. */
function traducirError(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return "Mail o contraseña incorrectos.";
  if (/user already registered/i.test(mensaje)) return "Ya existe una cuenta con ese mail.";
  if (/password should be at least/i.test(mensaje)) return "La contraseña necesita al menos 6 caracteres.";
  if (/unable to validate email/i.test(mensaje)) return "Ese mail no parece válido.";
  return mensaje;
}

/* ----------------------------------------------------------
   ¿HAY ALGO GUARDADO EN ESTE DISPOSITIVO?
   ----------------------------------------------------------
   Para decidir, al iniciar sesión, si hace falta preguntar
   antes de reemplazar lo que ya hay acá. Un objeto vacío
   ({}) o un array vacío ([]) cuentan como "sin datos": es lo
   que devuelven las funciones cargarX cuando nunca se guardó
   nada, no una respuesta real de la persona.
   ---------------------------------------------------------- */
export function hayDatosLocales(): boolean {
  return CLAVES_QUE_SINCRONIZAN.some((clave) => {
    const valor = leer<unknown>(clave, null);
    if (valor === null) return false;
    if (Array.isArray(valor)) return valor.length > 0;
    if (typeof valor === "object") return Object.keys(valor).length > 0;
    return true;
  });
}

/* ==========================================================
   DE QUIÉN SON LOS DATOS QUE HAY EN ESTE DISPOSITIVO
   ==========================================================
   El dato más importante de todo este archivo.

   localStorage no sabe de cuentas: es un cajón por navegador.
   Sin esta marca, la app no tiene forma de distinguir "estos
   datos son tuyos" de "estos datos quedaron de la sesión
   anterior de otra persona", y las dos situaciones terminan
   igual de mal: alguien ve el historial de salud de otra, o
   —peor— empieza a anotar encima y esos cambios se suben y
   pisan los datos buenos de la cuenta.

   Se guarda con localStorage directo y no con escribir() a
   propósito: escribir() avisa a los oyentes de sincronización,
   y esta marca es contabilidad interna, no un dato de la
   persona que haya que subir a ningún lado.
   ========================================================== */

const CLAVE_DUEÑO = "habitotchi_dueño_de_los_datos";

function dueñoDeLosDatosLocales(): string | null {
  try {
    return localStorage.getItem(CLAVE_DUEÑO);
  } catch {
    return null;
  }
}

function marcarDueño(usuarioId: string): void {
  try {
    localStorage.setItem(CLAVE_DUEÑO, usuarioId);
  } catch {
    /* Si no se puede escribir la marca, la próxima vez se va a
       volver a bajar todo de la nube. Es lento, pero seguro. */
  }
}

/* ----------------------------------------------------------
   LA RESERVA, PARA GANARLE A UNA CARRERA
   ----------------------------------------------------------
   Al crear una cuenta desde un aparato que ya tenía datos, hay
   dos cosas que salen corriendo a la vez: la migración de esos
   datos a la cuenta nueva, y la preparación automática que se
   dispara sola apenas nace la sesión. Si gana la segunda,
   borra el disco para bajar una cuenta que todavía está vacía
   — y los datos que la persona acababa de pedir conservar se
   pierden.

   No alcanza con marcar el dueño después de crear la cuenta:
   Supabase avisa del cambio de sesión desde adentro de signUp,
   así que el aviso puede llegar antes de que volvamos a tener
   el control. Por eso esto se pide ANTES de crear la cuenta,
   cuando todavía no hay ninguna sesión que pueda dispararla.
   ---------------------------------------------------------- */
let reservaPedida = false;

export function reservarDatosLocalesParaLaCuentaNueva(): void {
  reservaPedida = true;
}

export function soltarReserva(): void {
  reservaPedida = false;
}

function hayReservaDeDatosLocales(): boolean {
  return reservaPedida;
}

/* Deja el dispositivo como recién estrenado, sin tocar nada
   que no sea de Habitotchi. */
function limpiarDatosLocales(): void {
  for (const clave of CLAVES_QUE_SINCRONIZAN) borrar(clave);
  try {
    localStorage.removeItem(CLAVE_DUEÑO);
  } catch {
    /* ídem */
  }
}

/* ----------------------------------------------------------
   SUBIR: de este dispositivo hacia la cuenta
   ----------------------------------------------------------
   Se usa una sola vez, al crear una cuenta nueva que parte de
   datos que ya existían acá.
   ---------------------------------------------------------- */
export async function subirDatosLocales(): Promise<void> {
  if (!cliente) return;

  const { data } = await cliente.auth.getUser();
  const usuarioId = data.user?.id;
  if (!usuarioId) return;

  const filas = CLAVES_QUE_SINCRONIZAN.map((clave) => ({
    usuario_id: usuarioId,
    clave,
    valor: leer<unknown>(clave, null),
    actualizado_en: new Date().toISOString(),
  })).filter((fila) => fila.valor !== null);

  if (filas.length > 0) {
    const { error } = await cliente.from(TABLA).upsert(filas, { onConflict: "usuario_id,clave" });
    if (error) throw new Error("No se pudieron subir los datos: " + error.message);
  }

  /* Recién ahora los datos de este dispositivo son de esta
     cuenta: hasta que la subida no terminó bien, no lo son. */
  marcarDueño(usuarioId);
}

/* ----------------------------------------------------------
   BORRAR TODO, DE VERDAD
   ----------------------------------------------------------
   "Borrar todo" en Ajustes limpiaba solo el navegador mientras
   le decía a la persona que no se podía recuperar. Los datos
   seguían enteros en la nube y volvían solos al entrar desde
   otro lado — y no había forma de sacarlos, porque no existía
   ninguna operación de borrado contra la base.

   Deja la cuenta viva (podés seguir usándola, vacía). Para
   borrar también la cuenta hace falta una función del lado del
   servidor con permisos de administración, que este proyecto
   todavía no tiene: por eso la política remite a pedirlo por
   mail.
   ---------------------------------------------------------- */
export async function borrarTodoDeLaNube(): Promise<void> {
  if (!cliente) return;

  const { data } = await cliente.auth.getSession();
  const usuarioId = data.session?.user.id;
  if (!usuarioId) return;

  const { error } = await cliente.from(TABLA).delete().eq("usuario_id", usuarioId);
  if (error) throw new Error("No se pudieron borrar los datos de la cuenta: " + error.message);
}

/* ----------------------------------------------------------
   BAJAR: de la cuenta hacia este dispositivo
   ---------------------------------------------------------- */
async function bajarDatosDeLaNube(usuarioId: string): Promise<void> {
  if (!cliente) return;

  const { data, error } = await cliente
    .from(TABLA)
    .select("clave, valor")
    .eq("usuario_id", usuarioId);

  if (error) throw new Error("No se pudieron traer los datos: " + error.message);

  for (const fila of data ?? []) {
    escribir(fila.clave as Clave, fila.valor);
  }
}

/* ==========================================================
   DEJAR EL DISPOSITIVO LISTO PARA UNA SESIÓN
   ==========================================================
   Esto corre ANTES de que la app se dibuje y ANTES de que se
   active el empuje de cambios. El orden importa muchísimo:
   si la subida arrancara primero, cualquier cosa que la
   pantalla escribiera al montarse viajaría a la nube y
   pisaría los datos buenos de la cuenta.

   Dos caminos:

   · Los datos de acá ya son de esta cuenta → no hay nada que
     traer, se enciende la sincronización y listo. Es el caso
     de todos los días, y no pide red: por eso la app sigue
     abriendo sin internet.

   · Los datos son de otra cuenta, o no tienen dueño → se
     borran, se bajan los de la cuenta y se recarga la página.
     Se recarga en vez de parchear las 9 pantallas en caliente
     porque cada una lee su estado al montarse; volver a
     arrancar con los datos correctos ya en el disco es mucho
     más difícil de romper. Es el mismo criterio que usa
     "Restaurar una copia" en Ajustes.
   ========================================================== */
export async function prepararDatosDeLaSesion(usuarioId: string): Promise<void> {
  if (!cliente) return;

  /* La reserva gana sobre todo lo demás: son datos que ya
     existían acá y que la persona pidió conservar al crear su
     cuenta. Todavía no tienen dueño marcado porque la subida
     recién va a arrancar. */
  if (hayReservaDeDatosLocales()) {
    soltarReserva();
    marcarDueño(usuarioId);
    iniciarSincronizacionEnSegundoPlano();
    return;
  }

  if (dueñoDeLosDatosLocales() === usuarioId) {
    iniciarSincronizacionEnSegundoPlano();
    return;
  }

  limpiarDatosLocales();
  await bajarDatosDeLaNube(usuarioId);
  marcarDueño(usuarioId);

  location.reload();

  /* La recarga no es inmediata: el navegador la agenda y sigue
     ejecutando. Esta promesa no se resuelve nunca a propósito,
     para que quien esté esperando no siga adelante y dibuje la
     app con datos a medio cambiar. */
  await new Promise(() => {});
}

/* ----------------------------------------------------------
   EMPUJAR UNA CLAVE SUELTA
   ----------------------------------------------------------
   La llama almacenamiento.ts cada vez que se guarda algo
   localmente, para una persona con sesión iniciada. Nunca
   tira: si falla (sin internet, sesión vencida), el guardado
   local ya pasó y no hay nada más sensato que reintentar la
   próxima vez que se toque esa misma clave.
   ---------------------------------------------------------- */
async function empujarClave(clave: Clave, valor: unknown): Promise<void> {
  if (!cliente) return;

  try {
    const { data } = await cliente.auth.getSession();
    const usuarioId = data.session?.user.id;
    if (!usuarioId) return;

    await cliente.from(TABLA).upsert(
      { usuario_id: usuarioId, clave, valor, actualizado_en: new Date().toISOString() },
      { onConflict: "usuario_id,clave" }
    );
  } catch {
    /* Sin conexión o lo que sea: el dato ya está a salvo en
       localStorage, que es lo que importa para que la app
       siga andando. */
  }
}

/* ----------------------------------------------------------
   EMPEZAR A EMPUJAR CADA CAMBIO, EN SEGUNDO PLANO
   ----------------------------------------------------------
   Se engancha al sistema de avisos que ya tiene
   almacenamiento.ts (alCambiar/avisar) en vez de que escribir()
   llame directo a esta función: si lo hiciera, almacenamiento.ts
   y nube.ts se importarían mutuamente en círculo. Así la
   dependencia va en un solo sentido — nube.ts sabe de
   almacenamiento.ts, pero no al revés — y el archivo central de
   guardado no necesita saber que existe la nube.

   Se llama una sola vez, apenas hay sesión iniciada (al
   arrancar la app si ya había una, o justo después de loguearse
   o crear la cuenta). Cada suscripción queda viva mientras dure
   la sesión de la pestaña: no hace falta desengancharla, porque
   vive tanto como la propia app. */
let sincronizacionIniciada = false;

export function iniciarSincronizacionEnSegundoPlano(): void {
  if (!cliente || sincronizacionIniciada) return;
  sincronizacionIniciada = true;

  for (const clave of CLAVES_QUE_SINCRONIZAN) {
    alCambiar(clave, () => {
      void empujarClave(clave, leer<unknown>(clave, null));
    });
  }
}
