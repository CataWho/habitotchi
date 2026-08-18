/* ==========================================================
   HABITOTCHI · los textos en español
   ==========================================================
   Este archivo es la FUENTE DE VERDAD. en.ts se tipa contra
   él, así que si acá se agrega una clave y allá no, TypeScript
   avisa antes de publicar en vez de que aparezca español
   suelto en la app de alguien.

   ---------- CÓMO SE ESCRIBEN LOS HUECOS ----------
   Con nombre y entre llaves: {n}, {que}, {etapa}. Nunca por
   posición, porque en inglés el orden de las palabras cambia
   y cada diccionario tiene que poder ponerlos donde le
   corresponda.

   ---------- LOS PLURALES ----------
   { uno: "...", otros: "..." } y el traductor elige según el
   dato {n}. Antes esto estaba a mano en cuatro lugares.

   ---------- ESTE ARCHIVO ES EL ÚNICO EN VOSEO ----------
   "Anotá", "cargá", "podés". Es la voz de la app y vive acá:
   el resto del código no tiene texto para la usuaria.
   ========================================================== */

export const ES = {
  /* ---------- las pestañas ---------- */
  pantallaHogar: "Hogar",
  pantallaAlimentacion: "Alimentación",
  pantallaEjercicio: "Ejercicio",
  pantallaHobbies: "Hobbies",
  pantallaTrabajo: "Trabajo",
  pantallaCalendario: "Calendario",
  pantallaSalud: "Salud",
  pantallaJuegos: "Juegos",
  pantallaTienda: "Tienda",

  /* ---------- el aparato ---------- */
  aparatoPantalla: "Pantalla del aparato",
  aparatoBotones: "Botones del aparato",
  aparatoNavegacion: "Navegación entre pestañas",
  aparatoIrA: "Ir a {nombre}",
  aparatoAnterior: "Pestaña anterior",
  aparatoSiguiente: "Pestaña siguiente",
  aparatoAbrirAjustes: "Abrir ajustes",
  cerrar: "Cerrar",

  marcadorPuntos: "puntos",
  marcadorRacha: "racha",
  marcadorMonedas: "monedas",
  pieCementerio: "cementerio",
  pieHoy: "hoy",
  pieEstadisticas: "estadísticas",

  faltanDiasBuenos: { uno: "Falta {n} día bueno para {etapa}", otros: "Faltan {n} días buenos para {etapa}" },
  yaEsAdulta: "¡Tu mascota ya es adulta!",

  /* ---------- las etapas (el id se guarda, esto se muestra) ---------- */
  etapaBebe: "bebé",
  etapaJoven: "joven",
  etapaAdulto: "adulto",

  /* ---------- Hogar ---------- */
  elegiTuMascota: "Elegí tu mascota",
  ponleNombre: "ponele un nombre",
  listo: "Listo",
  ultimosSieteDias: "Últimos 7 días registrados",
  noDesbloqueada: "Todavía no desbloqueaste a {mascota}. Está en la tienda.",

  /* ---------- Alimentación ---------- */
  tusMetasDeHoy: "Tus metas de hoy",
  queComiste: "Qué comiste",
  hoyKcal: "Hoy · {n} kcal",
  ejemploComida: "milanesa con puré",
  kcal: "kcal",
  agregar: "Agregar",
  sinComidasHoy: "Todavía no anotaste ninguna comida hoy.",
  sugerenciaKcal: "{comida}: unas {n} kcal",
  notaCalorias: "Las calorías son aproximadas y salen de un diccionario propio, con comida argentina y platos comunes. Podés escribir en español o en inglés.",

  /* ---------- Ejercicio ---------- */
  tuMetaDeHoy: "Tu meta de hoy",
  comoVenis: "Cómo venís",
  loDeHoy: "Lo de hoy",
  cardio: "Cardio",
  pesas: "Pesas",
  pasos: "Pasos",
  minutos: "minutos",
  km: "km",
  series: "series",
  repeticiones: "repes",
  peso: "peso",
  nombreDelEjercicio: "nombre del ejercicio",
  agregarEjercicioPropio: "Agregar un ejercicio que no está en la lista",
  pasosDeHoy: "pasos de hoy",
  sinEjercicioHoy: "Todavía no anotaste nada hoy.",
  notaPasos: "Los pasos se anotan a mano.",

  /* ---------- Hobbies ---------- */
  queEstasLeyendo: "Qué estás leyendo",
  librosTerminados: "Libros terminados",
  queEstasEscuchando: "Qué estás escuchando",
  discosEscuchados: "Discos que escuchaste",
  otrasActividades: "Otras actividades",
  titulo: "título",
  autor: "autor",
  album: "álbum",
  artista: "artista",
  guardar: "Guardar",
  queTeParecio: "¿Qué te pareció?",
  termine: 'Terminé "{titulo}"',
  escuche: 'Escuché "{titulo}"',
  sinLibroActual: "Todavía no cargaste ningún libro.",
  sinLibrosLeidos: "Todavía no terminaste ningún libro. Cada uno suma 30 monedas.",
  sinDiscoActual: "Todavía no cargaste ningún disco.",
  sinDiscosEscuchados: "Todavía no anotaste ningún disco.",
  noSePudoBuscarLibro: "No se pudo buscar el libro.",
  noSePudoBuscarDisco: "No se pudo buscar el disco.",

  /* ---------- Trabajo ---------- */
  horasDeHoy: "Horas de hoy",
  pendientes: "Pendientes",
  anotarPendiente: "anotar algo pendiente",
  sinPendientes: "¡No te queda nada pendiente!",
  teQuedan: { uno: "Te queda {n}.", otros: "Te quedan {n}." },
  horas: "horas",
  sinTrabajoHoy: "Todavía no anotaste horas hoy.",

  /* ---------- Calendario ---------- */
  anotarAlgo: "anotar algo",
  nadaEseDia: "No hay nada anotado ese día.",
  googleCalendar: "Google Calendar",
  conectar: "Conectar",
  desconectar: "Desconectar",
  trayendoEventos: "Trayendo tus eventos…",
  eventosDeGoogle: "Tus eventos aparecen junto a tus notas. Desde acá no se pueden editar ni borrar.",
  ofrecerGoogle: "Para ver también tus eventos de Google acá. Solo los lee: no puede cambiar nada en tu calendario.",
  sinTitulo: "(sin título)",
  permisoVencido: "Se venció el permiso. Tocá Conectar de nuevo.",
  googleNoContesto: "Google no contestó bien.",
  noSeCargoGoogle: "No se pudo cargar el script de Google.",
  googleNoDisponible: "Google no está disponible.",
  conexionCancelada: "Se canceló la conexión.",
  sinConectarCalendario: "Todavía no conectaste tu calendario.",

  /* ---------- Salud ---------- */
  comoTeSentis: "¿Cómo te sentís?",
  medicaciones: "Medicaciones",
  registroDePeso: "Registro de peso",
  cicloMenstrual: "Ciclo menstrual",
  notaOpcional: "Nota (opcional)",
  nombre: "nombre",
  dosis: "dosis",
  ejemploHorarios: "09:00, 21:00",
  kgDeHoy: "kg de hoy",
  dias: "días",
  cuandoEmpezo: "Cuándo empezó",
  sinAnimoHoy: "Todavía no anotaste cómo te sentís hoy.",
  sinMedicaciones: "No cargaste ninguna medicación.",
  sinPeso: "Todavía no hay ningún registro.",
  sinCiclo: "Todavía no cargaste ningún registro.",
  ultimoRegistro: "Último registro: {fecha}",
  estaSemana: "Esta semana: {resumen}",
  pesoVacio: "Anotá tu peso al menos dos veces para ver cómo se mueve.",
  disclaimerSalud: "Nada de lo que anotás acá suma ni resta puntos. Es tu registro, no una meta que cumplir.",

  /* ---------- Juegos ---------- */
  viborita: "Viborita",
  pong: "Pong",
  saltador: "Saltador",
  ayudaViborita: "Deslizá el dedo sobre la pantalla para girar (o usá las flechas).",
  ayudaPong: "Movés la paleta con el dedo o el mouse. Las primeras 5 jugadas van lentas.",
  ayudaSaltador: "Tocá la pantalla para saltar los obstáculos.",
  puntos: "Puntos: {n}",
  record: "Récord: {n}",
  jugar: "Jugar",
  elegiUnJuego: "Elegí un juego para empezar.",
  tocaJugar: "Tocá Jugar para empezar.",
  dale: "¡Dale!",
  recordNuevo: { uno: "¡Récord nuevo! {n} punto.", otros: "¡Récord nuevo! {n} puntos." },
  perdiste: "Perdiste con {n}. Tu récord es {record}.",
  arriba: "Arriba",
  abajo: "Abajo",
  izquierda: "Izquierda",
  derecha: "Derecha",

  /* ---------- Tienda ---------- */
  monedasTotal: "{n} monedas",
  mascotas: "Mascotas",
  accesorios: "Accesorios",
  fondosDePantalla: "Fondos de pantalla",
  logros: "Logros",
  poner: "Poner",
  sacar: "Sacar",
  puesto: "Puesto",
  yaDesbloqueada: "{nombre}, ya desbloqueada",
  desbloqueado: "¡{nombre} desbloqueado!",
  teFaltanMonedas: { uno: "Te falta {n} moneda.", otros: "Te faltan {n} monedas." },
  yaLoTenes: "Eso ya lo tenés.",
  comoGanarMonedas: "Ganás monedas cumpliendo tus metas del día. Cada día bueno suma, y cada 7 seguidos hay un bonus.",
  notaTienda: "Lo que compres queda desbloqueado para siempre.",

  /* ---------- Ajustes ---------- */
  ajustes: "Ajustes",
  sobreVos: "Sobre vos",
  queMostrar: "Qué mostrar",
  tuCuenta: "Tu cuenta",
  privacidad: "Privacidad",
  tusDatos: "Tus datos",
  idioma: "Idioma",
  comoTeLlamas: "¿Cómo te llamás?",
  anios: "años",
  pronombre: "Pronombre",
  pesoKg: "peso (kg)",
  alturaCm: "altura (cm)",
  notaPeso: "El peso se usa para estimar las calorías del ejercicio, y se guarda en tu cuenta junto con el resto de tus datos.",
  mostrarCiclo: "Registro de ciclo menstrual, en Salud",
  notaCiclo: "Si lo apagás, el panel desaparece de la pestaña de Salud. Lo que ya hayas anotado no se borra: vuelve a aparecer si lo prendés otra vez.",
  conectadaComo: "Conectada como {email}",
  cambiarContrasena: "Cambiar contraseña",
  contrasenaNueva: "contraseña nueva",
  cerrarSesion: "Cerrar sesión",
  contrasenaCambiada: "Listo, contraseña cambiada.",
  noSePudoCambiarContrasena: "No se pudo cambiar la contraseña.",
  descargarMisDatos: "Descargar mis datos",
  restaurarCopia: "Restaurar una copia",
  borrarTodo: "Borrar todo",
  copiaDescargada: "Listo, se descargó tu copia.",
  datosRestaurados: "Datos restaurados. Recargá la página para verlos.",
  archivoInvalido: "Ese archivo no parece una copia de Habitotchi.",
  borrando: "Borrando…",
  confirmarBorrar1: "¿Seguro? Se borra todo lo que anotaste y no se puede recuperar.",
  confirmarBorrar2: "De verdad, no hay vuelta atrás. ¿Borro todo?",
  noSePudoBorrarNube: "No se pudo borrar de tu cuenta. No se borró nada.",
  verPolitica: "Ver la política de privacidad",
  notaPolitica: "La política está en español, aunque uses la app en inglés: es un documento legal y traducirlo mal sería peor que no traducirlo.",
  notaDatos: "Todo se guarda en tu cuenta, así lo encontrás igual desde otro dispositivo. La copia descargada sirve para tenerlo también fuera de la app.",

  /* ---------- el portón de ingreso ---------- */
  entraATuCuenta: "Entrá a tu cuenta",
  crearUnaCuenta: "Crear una cuenta",
  recuperarContrasena: "Recuperar tu contraseña",
  tuMail: "tu mail",
  contrasena: "contraseña",
  mantenerSesion: "Mantener la sesión iniciada",
  aceptoPolitica: "Acepto la",
  laPoliticaDePrivacidad: "política de privacidad",
  debeAceptarPolitica: "Tenés que aceptar la política de privacidad para crear la cuenta.",
  entrar: "Entrar",
  crearCuenta: "Crear cuenta",
  enviarmeElLink: "Enviarme el link",
  olvideMiContrasena: "Olvidé mi contraseña",
  volverAEntrar: "Volver a entrar",
  elegiContrasenaNueva: "Elegí una contraseña nueva",
  minimoSeisCaracteres: "Tiene que tener al menos 6 caracteres.",
  revisaTuMail: "Te mandamos un mail a {email}. Tocá el link que trae y ya podés entrar.",
  linkDeRecuperacion: "Si hay una cuenta con ese mail, te va a llegar un link para poner una contraseña nueva.",
  migrarDatos: "¿Querés que lo que ya tenías anotado en este dispositivo pase a tu cuenta nueva?",
  unSegundo: "Un segundo…",
  algoSalioMal: "Algo salió mal.",
  llegasteATodas: "¡Llegaste a todas tus metas!",
  faltaAlgunaMeta: "Todavía te falta alguna meta.",
  estaSemanaBuenos: "Esta semana · {n} de 7 días buenos",
  totalDiasBuenos: "Total de días buenos",
  mostrarContrasena: "Mostrar la contraseña",
  ocultarContrasena: "Ocultar la contraseña",

  /* mensajes de la nube */
  credencialesInvalidas: "Mail o contraseña incorrectos.",
  mailYaRegistrado: "Ya existe una cuenta con ese mail.",
  contrasenaCorta: "La contraseña necesita al menos 6 caracteres.",
  mailInvalido: "Ese mail no parece válido.",
  nubeNoDisponible: "La cuenta en la nube no está disponible.",
  noSePudoSubir: "No se pudieron subir los datos: {detalle}",
  noSePudoTraer: "No se pudieron traer los datos: {detalle}",

  /* ---------- los modales A / B / C ---------- */
  cementerio: "Cementerio",
  sinCementerio: "Todavía no se te fue ninguna mascota.",
  llegoA: "llegó a {etapa}",
  detalleDeHoy: "Hoy",
  estadisticas: "Estadísticas",
  rachaActual: "Racha actual",
  mejorRacha: "Mejor racha",
  diasBuenos: "Días buenos",
  totalMonedas: "Monedas ganadas",
  dia: { uno: "{n} día", otros: "{n} días" },

  /* ---------- la despedida ---------- */
  descansa: "{nombre} descansa. Podés elegir una mascota nueva.",
  chau: "Chau, {nombre}.",
  unFantasmita: "Un fantasmita que sube",
  unaTumba: "Una tumba que dice R.I.P.",

  /* ---------- piezas comunes ---------- */
  borrar: "Borrar",
  cancelar: "Cancelar",
  sumarA: "Sumar {paso} a {nombre}",
  restarDe: "Restar {paso} de {nombre}",
  editarMeta: "Editar la meta de {nombre}",
  calificacion: "Calificación",
  deCinco: "{n} de 5",
  semana: "Semana",
  mes: "Mes",
  anio: "Año",
  graficoVacio: "Todavía no hay suficientes registros para el gráfico.",
  sinRegistros: "Sin registros",
  caloriasQuemadas: "Calorías quemadas hoy (aproximado): {kcal} kcal en {min} minutos.",
  sinSesionesHoy: "Todavía no cargaste ninguna sesión hoy.",
  sinActividades: "Todavía no anotaste ninguna actividad.",
  sinHorasHoy: "Todavía no cargaste horas hoy.",
  sinPendientesCargados: "No tenés pendientes cargados.",
  quePendiente: "qué tenés que hacer",
  comoGanarDetalle: "Ganás 10 monedas por cada día bueno, y 50 extra cada 7 días seguidos. Los juegos no dan monedas: la idea es que jugar no compita con cuidarte.",

  /* ---------- fechas ---------- */
  meses: "enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre",
  /* Iniciales de lunes a domingo. En español miércoles es X
     para no repetir la M de martes. */
  inicialesSemana: "L,M,X,J,V,S,D",
  abreviaturaSemana: "sem {n}",

  /* ---------- catálogos: hábitos ---------- */
  habitoAgua: "Agua",
  habitoComida: "Comidas registradas",
  habitoEjercicio: "Ejercicio",
  habitoLectura: "Lectura",
  habitoTrabajo: "Trabajo / estudio",
  habitoDulces: "Dulces",
  unidadVasos: "vasos",
  unidadComidas: "comidas",
  unidadMin: "min",
  unidadHoras: "horas",
  unidadVeces: "veces",

  /* ---------- catálogos: mascotas ---------- */
  mascotaDragoncito: "Dragoncito",
  mascotaGatito: "Gatito",
  mascotaConejito: "Conejito",
  mascotaPollito: "Pollito",
  mascotaOsito: "Osito",
  mascotaDinosaurio: "Dinosaurio",

  /* ---------- catálogos: accesorios y fondos ---------- */
  accesorioMonio: "Moño",
  accesorioSombrero: "Sombrerito",
  accesorioLentes: "Lentes",
  accesorioCorona: "Corona",
  fondoClasico: "Clásico",
  fondoAtardecer: "Atardecer",
  fondoNoche: "Noche",
  fondoAlgodon: "Algodón",

  /* ---------- catálogos: comidas, ánimos, hobbies, trabajo ---------- */
  comidaDesayuno: "Desayuno",
  comidaAlmuerzo: "Almuerzo",
  comidaMerienda: "Merienda",
  comidaCena: "Cena",
  comidaSnack: "Snack",

  animoMuybien: "Muy bien",
  animoBien: "Bien",
  animoNormal: "Normal",
  animoBajon: "Triste",
  animoMal: "Muy triste",

  hobbyAmigos: "Amigos",
  hobbyFamilia: "Familia",
  hobbyPintura: "Pintura",
  hobbyVideojuegos: "Videojuegos",
  hobbySeries: "Series",
  hobbyPaseos: "Paseos",
  hobbyFotografia: "Fotografía",
  hobbyOtro: "Otro",

  trabajoTrabajo: "Trabajo",
  trabajoEstudio: "Estudio",

  pronombreElla: "ella",
  pronombreEl: "él",
  pronombreElle: "elle",
  pronombreOtro: "prefiero no decir",

  /* ---------- catálogos: cardio ---------- */
  cardioCinta: "Cinta / caminadora",
  cardioRunning: "Running",
  cardioSoga: "Soga",
  cardioBici: "Bicicleta",
  cardioNatacion: "Natación",
  cardioEliptica: "Elíptica",
  cardioBaile: "Baile",
  cardioOtro: "Otro cardio",

  /* ---------- catálogos: fuerza ---------- */
  grupoPiernas: "Piernas",
  grupoEspalda: "Espalda",
  grupoPecho: "Pecho y hombros",
  grupoBrazos: "Brazos",
  grupoCore: "Core",
  grupoOtros: "Otros",
  grupoMisEjercicios: "Mis ejercicios",

  fuerzaSentadilla: "Sentadilla",
  fuerzaPrensa: "Prensa",
  fuerzaEstocadas: "Estocadas",
  fuerzaPesoMuerto: "Peso muerto",
  fuerzaCurlFemoral: "Curl femoral",
  fuerzaExtensionCuad: "Extensión de cuádriceps",
  fuerzaGemelos: "Gemelos",
  fuerzaHipThrust: "Hip thrust",
  fuerzaDominadas: "Dominadas",
  fuerzaRemo: "Remo",
  fuerzaJalonPecho: "Jalón al pecho",
  fuerzaRemoMancuerna: "Remo con mancuerna",
  fuerzaPressBanca: "Press de banca",
  fuerzaPressInclinado: "Press inclinado",
  fuerzaAperturas: "Aperturas",
  fuerzaFlexiones: "Flexiones",
  fuerzaPressMilitar: "Press militar",
  fuerzaElevacionesLat: "Elevaciones laterales",
  fuerzaCurlBiceps: "Curl de bíceps",
  fuerzaTricepsPolea: "Tríceps en polea",
  fuerzaFondos: "Fondos",
  fuerzaPlancha: "Plancha",
  fuerzaAbdominales: "Abdominales",
  fuerzaElevacionPierna: "Elevación de piernas",
  fuerzaOtro: "Otro ejercicio",

  intensidadLeve: "Leve (podés hablar sin esfuerzo)",
  intensidadModerada: "Moderada (te cuesta mantener charla)",
  intensidadIntensa: "Intensa (no podés hablar mientras lo hacés)",

  /* ---------- catálogos: logros ---------- */
  logroPrimerDia: "El primer paso",
  logroPrimerDiaDesc: "Tu primer día bueno",
  logroSemana: "Una semana",
  logroSemanaDesc: "7 días buenos en total",
  logroMes: "Un mes entero",
  logroMesDesc: "30 días buenos en total",
  logroRacha7: "Imparable",
  logroRacha7Desc: "7 días buenos seguidos",
  logroRacha30: "Costumbre",
  logroRacha30Desc: "30 días buenos seguidos",
  logroJoven: "Creciendo",
  logroJovenDesc: "Tu mascota llegó a joven",
  logroAdulto: "Ya es grande",
  logroAdultoDesc: "Tu mascota llegó a adulta",
  logroAgua100: "Bien hidratada",
  logroAgua100Desc: "100 vasos de agua en total",
  logroEjercicio500: "En movimiento",
  logroEjercicio500Desc: "500 minutos de ejercicio",
  logroColeccion: "Coleccionista",
  logroColeccionDesc: "Desbloqueaste todas las mascotas",
  logroPrimerLibro: "Primera lectura",
  logroPrimerLibroDesc: "Terminaste tu primer libro",
  logroCincoLibros: "Ratona de biblioteca",
  logroCincoLibrosDesc: "Terminaste 5 libros",
} as const;

/* La forma del diccionario. en.ts se tipa con esto, así que
   olvidarse una clave es un error de compilación y no una
   sorpresa en producción. */
export type Textos = {
  [K in keyof typeof ES]: (typeof ES)[K] extends string
    ? string
    : { uno: string; otros: string };
};
