/* ==========================================================
   HABITOTCHI · guardar y leer del navegador
   ==========================================================
   Todo el localStorage de la app, en un solo lugar. Antes
   estaba repartido en 8 archivos, cada uno con su propia
   constante y su propio par cargar/guardar copiado y pegado.

   ---------- POR QUÉ JUNTARLO ----------
   1. Los nombres de las claves son un contrato con el
      navegador de la usuaria: si se escribe mal uno, se
      pierden datos en silencio. Acá están todos juntos y a
      la vista.
   2. Cuando llegue la sincronización con Supabase, este es
      el único archivo que hay que tocar: el resto de la app
      no sabe de dónde salen los datos.
   3. El JSON.parse suelto tira una excepción si el dato está
      corrupto y rompe toda la app en el arranque. Acá se
      atrapa una sola vez, en leer().

   ---------- LAS CLAVES NO CAMBIAN ----------
   Son exactamente las mismas que usaba la versión vieja, así
   que al pasar a esta versión no se pierde nada de lo que ya
   tenías anotado.
   ========================================================== */

export const CLAVES = {
  registro: "habitotchi_registro",
  metas: "habitotchi_metas",
  mascota: "habitotchi_mascota",
  vida: "habitotchi_vida",
  cementerio: "habitotchi_cementerio",

  perfil: "habitotchi_perfil",
  historialPeso: "habitotchi_historial_peso",
  historialCiclo: "habitotchi_historial_ciclo",
  animoDiario: "habitotchi_animo_diario",
  medicaciones: "habitotchi_medicaciones",
  tomas: "habitotchi_tomas",

  sesionesEjercicio: "habitotchi_ejercicio_sesiones",
  fuerzaPropios: "habitotchi_fuerza_propios",
  pasos: "habitotchi_pasos",

  comidas: "habitotchi_comidas",
  apiKey: "habitotchi_api_key",

  hobbies: "habitotchi_hobbies",
  libroActual: "habitotchi_libro_actual",
  librosLeidos: "habitotchi_libros_leidos",
  discoActual: "habitotchi_disco_actual",
  discosEscuchados: "habitotchi_discos_escuchados",

  calendario: "habitotchi_calendario",
  sesionesTrabajo: "habitotchi_trabajo_sesiones",
  todos: "habitotchi_todos",
  googleClientId: "habitotchi_google_client_id",

  compras: "habitotchi_compras",
  equipado: "habitotchi_equipado",
  records: "habitotchi_records",

  sonido: "habitotchi_sonido",
  notificaciones: "habitotchi_notificaciones",
} as const;

export type Clave = (typeof CLAVES)[keyof typeof CLAVES];

/* ----------------------------------------------------------
   LEER Y ESCRIBIR
   ----------------------------------------------------------
   leer() nunca tira: si el dato no está, o está corrupto, o
   el navegador tiene el almacenamiento bloqueado (pasa en
   modo incógnito de Safari), devuelve el valor por defecto.

   Eso importa más de lo que parece: un solo JSON roto en una
   clave cualquiera dejaba la app en pantalla en blanco,
   porque el objeto de estado se arma entero en el arranque.
   ---------------------------------------------------------- */
export function leer<T>(clave: Clave, porDefecto: T): T {
  try {
    const guardado = localStorage.getItem(clave);
    if (guardado === null) return porDefecto;
    return JSON.parse(guardado) as T;
  } catch {
    return porDefecto;
  }
}

export function escribir<T>(clave: Clave, valor: T): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* Sin espacio o almacenamiento bloqueado. No hay nada
       sensato que hacer acá: preferimos que la app siga
       andando a que se caiga por no poder guardar. */
  }
  avisar(clave);
}

export function borrar(clave: Clave): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* ídem */
  }
  avisar(clave);
}

/* Los textos sueltos (la clave de Gemini, el id de Google) se
   guardan tal cual, sin JSON: son strings y ya. */
export function leerTexto(clave: Clave, porDefecto = ""): string {
  try {
    return localStorage.getItem(clave) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

export function escribirTexto(clave: Clave, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* ídem */
  }
  avisar(clave);
}

/* ==========================================================
   AVISAR CUANDO UNA CLAVE CAMBIA
   ==========================================================
   Dos pantallas distintas pueden estar mirando el mismo dato
   guardado. El caso que lo destapó: el interruptor del ciclo
   menstrual vive en Ajustes y decide si aparece un panel en
   Salud. Salud leía el perfil una sola vez al montarse, así
   que apagabas el interruptor y el panel seguía ahí hasta que
   recargabas la app.

   El evento "storage" del navegador no sirve: solo avisa a
   las OTRAS pestañas, nunca a la que escribió. Así que el
   aviso lo damos nosotros, desde el único lugar por donde
   pasa todo lo que se guarda.
   ========================================================== */

type Oyente = () => void;

const oyentes = new Map<Clave, Set<Oyente>>();

/* Devuelve la función para desuscribirse, así se puede
   devolver tal cual desde un useEffect. */
export function alCambiar(clave: Clave, oyente: Oyente): () => void {
  const grupo = oyentes.get(clave) ?? new Set<Oyente>();
  grupo.add(oyente);
  oyentes.set(clave, grupo);

  return () => {
    grupo.delete(oyente);
  };
}

function avisar(clave: Clave): void {
  oyentes.get(clave)?.forEach((oyente) => oyente());
}
