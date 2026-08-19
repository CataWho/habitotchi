import { CLAVES, escribir, leerTexto } from "./almacenamiento";
import { fechaComoTexto } from "./fechas";

/* Los modulos portados leian con localStorage.getItem y
   parseaban a mano. Esto mantiene esa forma pero centraliza
   el acceso, para que el dia que sincronicemos con la nube
   haya un solo lugar que tocar. */
function __leerCrudo(clave: Parameters<typeof leerTexto>[0]): string | null {
  const valor = leerTexto(clave, "");
  return valor === "" ? null : valor;
}

/* ==========================================================
   HABITOTCHI · salud
   ÁNIMO Y MEDICACIONES
   ==========================================================
   Dos cosas que van juntas en la pestaña de Salud personal,
   con el peso y el ciclo (que viven en lib/perfil.ts).

   ---------- UNA REGLA IMPORTANTE ----------
   Nada de lo que hay acá suma ni resta puntos, ni cambia el
   ánimo de tu mascota. Es a propósito.

   Anotar que hoy estuviste triste no puede ponerte en falta:
   sería convertir un mal día en un castigo. Lo mismo con el
   peso y con el ciclo. Son registros para vos, para que
   puedas mirar tus patrones con el tiempo — no metas que
   cumplir.

   Las medicaciones tampoco dan puntos: tomar tu remedio no
   es un logro que haya que premiar, es algo que necesitás.
   ========================================================== */


/* ==========================================================
   1) EL ÁNIMO DIARIO
   ==========================================================
   Se puede anotar más de una vez por día: cómo te levantaste
   y cómo terminaste el día suelen ser cosas distintas.

   Forma de los datos:
     { "2026-08-09": [ {hora:"09:30", animo:"bien", nota:""} ] }
   ========================================================== */

/* Los identificadores no cambian aunque cambien los nombres:
   son la clave con la que quedaron guardados los registros
   anteriores. Renombrarlos dejaría esas entradas huérfanas. */
export const ANIMOS = [
  { id: "muybien", clave: "animoMuybien", color: "#7ac07a" },
  { id: "bien", clave: "animoBien", color: "#a9d06a" },
  { id: "normal", clave: "animoNormal", color: "#e8c34a" },
  { id: "bajon", clave: "animoBajon", color: "#e8945a" },
  { id: "mal", clave: "animoMal", color: "#d67a9e" },
];

/* Una carita pixel art por cada ánimo, para los botones de
   selección: mismo estilo de grilla que usan las mascotas de
   datos/mascotas.ts (una letra por pixel; "O" pinta, "." queda
   transparente), en vez de usar emojis del sistema operativo,
   que se ven distinto en cada dispositivo. */
export const ANIMO_PIXELES = {
  muybien: [
    "OO....OO",
    ".O....O.",
    "........",
    ".O....O.",
    "..OOOO..",
  ],
  bien: [
    ".OO..OO.",
    ".O....O.",
    "........",
    "........",
    "..OOOO..",
  ],
  normal: [
    ".OO..OO.",
    ".O....O.",
    "........",
    "........",
    "...OO...",
  ],
  bajon: [
    ".OO..OO.",
    ".O....O.",
    "........",
    "........",
    "..OO.OO.",
  ],
  mal: [
    ".OO..OO.",
    ".O....O.",
    "..OOOO..",
    ".O....O.",
    "........",
  ],
};

export function cargarAnimoDiario() {
  const guardado = __leerCrudo(CLAVES.animoDiario);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarAnimoDiario(datos: any) {
  escribir(CLAVES.animoDiario, datos);
}

export function anotarAnimo(datos: any, fecha: string, hora: string, animoId: string, nota: string) {
  if (!datos[fecha]) datos[fecha] = [];

  datos[fecha].push({ hora, animo: animoId, nota: nota || "" });
  guardarAnimoDiario(datos);

  return datos;
}

export function borrarAnimo(datos: any, fecha: string, indice: number) {
  if (!datos[fecha]) return datos;

  datos[fecha].splice(indice, 1);
  if (datos[fecha].length === 0) delete datos[fecha];

  guardarAnimoDiario(datos);
  return datos;
}

export function animosDelDia(datos: any, fecha: string) {
  return datos[fecha] || [];
}

/* Los ánimos de los últimos días, del más nuevo al más viejo.

   El panel mostraba SOLO los de hoy, con la hora suelta: no
   había manera de mirar para atrás, y una hora sin fecha al
   lado no dice de cuándo es.

   Cada registro se devuelve con su fecha y con el índice que
   tiene DENTRO de su día, porque borrarAnimo() borra por
   (fecha, índice) y si mandáramos la posición en esta lista
   mezclada borraría el ánimo equivocado. */
export function animosRecientes(datos: any, dias = 7) {
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  const limite = fechaComoTexto(desde);

  return Object.keys(datos)
    .filter((fecha) => fecha >= limite)
    .sort()
    .reverse()
    .flatMap((fecha) =>
      (datos[fecha] || []).map((registro: any, indice: number) => ({ ...registro, fecha, indice }))
    );
}

export function datosDeAnimo(animoId: string) {
  return ANIMOS.find(a => a.id === animoId) || ANIMOS[2];
}

/* Cuántas veces anotaste cada ánimo en los últimos días.
   Sirve para ver el patrón sin sacar conclusiones raras. */
export function resumenDeAnimo(datos: any, dias: any) {
  const cuenta: Record<string, number> = {};
  for (const animo of ANIMOS) cuenta[animo.id] = 0;

  for (const dia of dias) {
    for (const registro of animosDelDia(datos, dia.texto)) {
      const actual = cuenta[registro.animo];
      if (actual !== undefined) cuenta[registro.animo] = actual + 1;
    }
  }

  return cuenta;
}


/* ==========================================================
   2) LAS MEDICACIONES
   ==========================================================
   Cada una tiene un nombre, una dosis y a qué horas se toma.
   Aparte guardamos qué tomas ya marcaste, por día.

     medicaciones: [{id, nombre, dosis, horarios:["09:00","21:00"]}]
     tomas: { "2026-08-09": ["3-09:00", "3-21:00"] }

   La marca es "idDeLaMedicacion-hora", así una misma pastilla
   de la mañana y de la noche se marcan por separado.
   ========================================================== */

export function cargarMedicaciones() {
  const guardado = __leerCrudo(CLAVES.medicaciones);
  return guardado ? JSON.parse(guardado) : [];
}

export function guardarMedicaciones(lista: any) {
  escribir(CLAVES.medicaciones, lista);
}

export function agregarMedicacion(lista: any, nombre: string, dosis: string, horarios: any) {
  lista.push({
    id: Date.now(),
    nombre,
    dosis: dosis || "",
    horarios: horarios || [],
  });

  guardarMedicaciones(lista);
  return lista;
}

export function eliminarMedicacion(lista: any, id: string) {
  const indice = lista.findIndex((m: any) => m.id === id);
  if (indice !== -1) {
    lista.splice(indice, 1);
    guardarMedicaciones(lista);
  }
  return lista;
}


/* --- Las tomas marcadas --- */

export function cargarTomas() {
  const guardado = __leerCrudo(CLAVES.tomas);
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarTomas(tomas: any) {
  escribir(CLAVES.tomas, tomas);
}

export function marcaDeToma(medicacionId: string, horario: string) {
  return medicacionId + "-" + horario;
}

export function yaLaTomaste(tomas: any, fecha: string, medicacionId: string, horario: string) {
  const delDia = tomas[fecha] || [];
  return delDia.includes(marcaDeToma(medicacionId, horario));
}

export function alternarToma(tomas: any, fecha: string, medicacionId: string, horario: string) {
  if (!tomas[fecha]) tomas[fecha] = [];

  const marca = marcaDeToma(medicacionId, horario);
  const posicion = tomas[fecha].indexOf(marca);

  if (posicion === -1) {
    tomas[fecha].push(marca);
  } else {
    tomas[fecha].splice(posicion, 1);
  }

  guardarTomas(tomas);
  return tomas;
}


/* ==========================================================
   3) QUÉ TOMAS QUEDAN PENDIENTES HOY
   ==========================================================
   Devuelve una lista ordenada por hora, marcando cuáles ya
   pasaron de hora y no tomaste. Sirve tanto para la pantalla
   como para los recordatorios.
   ========================================================== */

export function tomasDelDia(medicaciones: any, tomas: any, fecha: string, horaActual: string) {

  const pendientes = [];

  for (const medicacion of medicaciones) {
    for (const horario of medicacion.horarios) {

      pendientes.push({
        medicacionId: medicacion.id,
        nombre: medicacion.nombre,
        dosis: medicacion.dosis,
        horario,
        tomada: yaLaTomaste(tomas, fecha, medicacion.id, horario),
        /* "Se pasó la hora" solo si además no la tomaste */
        atrasada: !yaLaTomaste(tomas, fecha, medicacion.id, horario) &&
                  horaActual !== undefined && horario < horaActual,
      });
    }
  }

  pendientes.sort((a: any, b: any) => a.horario.localeCompare(b.horario));
  return pendientes;
}


/* La hora de ahora como texto "HH:MM", con la hora local
   (mismo cuidado que tenemos con las fechas en lib/fechas.ts) */
export function horaDeAhora() {
  const ahora = new Date();
  return String(ahora.getHours()).padStart(2, "0") + ":" +
         String(ahora.getMinutes()).padStart(2, "0");
}
