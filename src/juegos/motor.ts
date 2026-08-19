import { CLAVES, escribir, leerTexto } from "@/lib/almacenamiento";

/* ==========================================================
   HABITOTCHI · juegos
   LOS JUEGUITOS
   ==========================================================
   Tres juegos, dibujados en un <canvas> con la misma estética
   de pantallita LCD del resto de la app.

   ---------- NO DAN MONEDAS, A PROPÓSITO ----------
   Solo guardan tu récord. Si jugar diera monedas, te
   convendría jugar en vez de tomar agua, y la app terminaría
   compitiendo contra su propio objetivo. Acá el puntaje es
   para superarte a vos misma, nada más.

   ---------- CÓMO FUNCIONA UN JUEGO ----------
   Todos siguen la misma forma:
     1. arrancar()  prepara todo y prende el reloj
     2. un "tick" que se repite: mover cosas y dibujar
     3. terminar()  apaga el reloj y guarda el récord

   Es importante apagar el reloj al salir: si no, el juego
   sigue corriendo invisible, gastando batería.
   ========================================================== */



export function cargarRecords() {
  const guardado = leerTexto(CLAVES.records, "");
  return guardado ? JSON.parse(guardado) : {};
}

export function guardarRecord(juegoId: string, puntaje: number) {
  const records = cargarRecords();

  /* Solo guardamos si superaste el anterior */
  if (!records[juegoId] || puntaje > records[juegoId]) {
    records[juegoId] = puntaje;
    escribir(CLAVES.records, records);
    return true;   // ¡récord nuevo!
  }

  return false;
}

export function recordDe(juegoId: string) {
  return cargarRecords()[juegoId] || 0;
}


/* Colores compartidos, para que los tres se vean como la
   pantallita LCD del tamagotchi.

   No son fijos: se leen de la propia pantalla en el momento de
   dibujar. Así los juegos acompañan al fondo que tengas puesto
   en la tienda, en vez de quedar siempre verdes (con el fondo
   "Noche" el tablero era un rectángulo verde lima en medio de
   una pantalla azul oscura).

   Las dos variables las escribe el componente Pantalla
   (componentes/aparato/Aparato.tsx) cuando ponés un fondo. */
export function colorDePantalla(variable: string, siNoHay: string) {
  const pantalla = document.querySelector(".screen");
  if (!pantalla) return siNoHay;

  const valor = getComputedStyle(pantalla).getPropertyValue(variable).trim();
  return valor || siNoHay;
}

/* Con qué se dibuja: la tinta de la pantalla */
export function tintaLCD() {
  return colorDePantalla("--lcd-tinta", "#16240a");
}

/* Sobre qué se dibuja: el color de la pantalla encendida */
export function fondoLCD() {
  return colorDePantalla("--lcd-contratinta", "#b9ea3d");
}

/* ¿Este color es oscuro?

   Se usa para decidir si el Saltador dibuja un sol o una luna.
   Se pregunta por el COLOR y no por el nombre del fondo a
   propósito: así el motor no tiene que conocer el catálogo, y
   si algún día se agrega otro fondo oscuro, la luna aparece
   sola sin tocar nada acá. */
export function esColorOscuro(color: string) {
  const encontrado = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!encontrado) return false;   // ante la duda, de día

  const n = parseInt(encontrado[1]!, 16);
  const r = (n >> 16) & 255, v = (n >> 8) & 255, a = n & 255;

  /* Luminancia percibida, no un promedio: el ojo ve muchísimo
     más el verde que el azul, así que promediar los tres daría
     "claro" para un azul brillante que en realidad se ve
     oscuro. */
  return 0.299 * r + 0.587 * v + 0.114 * a < 128;
}

export function pantallaOscura() {
  return esColorOscuro(fondoLCD());
}


/* ==========================================================
   EL MOTOR COMPARTIDO
   ==========================================================
   Guarda qué juego está corriendo para poder apagarlo cuando
   cambiás de juego o cerrás la pantalla.
   ========================================================== */
export let juegoActivo: any = null;

export function detenerJuego() {
  if (juegoActivo && juegoActivo.detener) juegoActivo.detener();
  juegoActivo = null;
}


/* ==========================================================
   1) LA VIBORITA
   ========================================================== */
export function crearViborita(canvas: HTMLCanvasElement, alCambiarPuntaje: (n: number) => void, alPerder: (n: number) => void) {

  const ctx = canvas.getContext("2d")!;

  /* Celdas más grandes: en el celular las de 10px eran
     diminutas y costaba seguir a la víbora */
  const CELDA = 13;
  const ANCHO = Math.floor(canvas.width  / CELDA);
  const ALTO  = Math.floor(canvas.height / CELDA);

  /* Estado interno del juego. Van sin tipo estricto a
     proposito: son variables de un bucle de canvas, no datos
     que salgan de este archivo. */
  let vibora: any, direccion: any, siguienteDireccion: any, comida: any, puntaje: any, reloj: any, viva: any;

  function comidaNueva() {
    /* Buscamos un lugar libre, para que la comida no aparezca
       adentro de la propia víbora */
    let lugar: any;
    do {
      lugar = {
        x: Math.floor(Math.random() * ANCHO),
        y: Math.floor(Math.random() * ALTO),
      };
    } while (vibora.some((p: any) => p.x === lugar.x && p.y === lugar.y));

    return lugar;
  }

  function arrancar() {
    vibora = [{ x: Math.floor(ANCHO / 2), y: Math.floor(ALTO / 2) }];
    direccion = { x: 1, y: 0 };
    siguienteDireccion = { x: 1, y: 0 };
    comida = comidaNueva();
    puntaje = 0;
    viva = true;

    alCambiarPuntaje(0);

    clearInterval(reloj);
    reloj = setInterval(paso, 155);   // un poco más lenta, se maneja mejor
    dibujar();
  }

  function paso() {
    if (!viva) return;

    direccion = siguienteDireccion;

    const cabeza = {
      x: vibora[0].x + direccion.x,
      y: vibora[0].y + direccion.y,
    };

    /* Chocar contra la pared */
    if (cabeza.x < 0 || cabeza.y < 0 || cabeza.x >= ANCHO || cabeza.y >= ALTO) {
      return perder();
    }

    /* Chocar contra sí misma */
    if (vibora.some((p: any) => p.x === cabeza.x && p.y === cabeza.y)) {
      return perder();
    }

    vibora.unshift(cabeza);

    if (cabeza.x === comida.x && cabeza.y === comida.y) {
      puntaje++;
      alCambiarPuntaje(puntaje);
      comida = comidaNueva();
    } else {
      vibora.pop();   // si no comió, la cola avanza
    }

    dibujar();
  }

  function perder() {
    viva = false;
    clearInterval(reloj);
    alPerder(puntaje);
  }

  function dibujar() {
    ctx.fillStyle = fondoLCD();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = tintaLCD();

    for (const parte of vibora) {
      ctx.fillRect(parte.x * CELDA, parte.y * CELDA, CELDA - 1, CELDA - 1);
    }

    /* La comida, un cuadradito más chico */
    ctx.fillRect(comida.x * CELDA + 2, comida.y * CELDA + 2, CELDA - 5, CELDA - 5);
  }

  function girar(hacia: any) {
    const opciones: Record<string, { x: number; y: number }> = {
      arriba:   { x: 0,  y: -1 },
      abajo:    { x: 0,  y: 1 },
      izquierda:{ x: -1, y: 0 },
      derecha:  { x: 1,  y: 0 },
    };

    const nueva = opciones[hacia];
    if (!nueva) return;

    /* No se puede girar 180°: te comerías a vos misma */
    if (nueva.x === -direccion.x && nueva.y === -direccion.y) return;

    siguienteDireccion = nueva;
  }

  return {
    arrancar,
    girar,
    detener: () => clearInterval(reloj),
  };
}


/* ==========================================================
   2) PONG
   ==========================================================
   Vos manejás la paleta de abajo; la de arriba la maneja la
   compu.

   ---------- CÓMO SE PUNTÚA ----------
   Devolver la pelota suma 1. Meterle un gol a la compu suma 5.

   Antes el gol no sumaba NADA: la pelota se le escapaba a la
   compu, volvía al medio y seguías como si nada. Eso dejaba el
   juego al revés de lo que parece — convenía pelotear tranquila
   para siempre, y ganarle no servía. Encima el control del
   ángulo (pegarle con el borde de la paleta) no tenía para qué
   usarse, porque apuntar no daba nada.
   ========================================================== */
export function crearPong(canvas: HTMLCanvasElement, alCambiarPuntaje: (n: number) => void, alPerder: (n: number) => void) {

  const ctx = canvas.getContext("2d")!;

  const ANCHO_PALETA = 46;
  const ALTO_PALETA  = 7;
  const RADIO = 4;

  /* El gol vale más que una devolución porque es MUCHO más
     difícil: hay que ganarle a una paleta que persigue la
     pelota, apuntando al costado que no llega. */
  const PUNTOS_POR_GOL = 5;

  /* La primera jugada va lenta a propósito: antes la pelota
     salía disparada apenas empezabas y perdías sin llegar a
     apoyar el dedo. Solo la primera — en cuanto le pegás una
     vez, va a velocidad normal. */
  const VELOCIDAD_DEL_PRIMER_GOLPE = 0.42;   // 42% de la normal

  let jugadorX: any, compuX: any, pelota: any, puntaje: any, reloj: any, viva: any, devoluciones: any;

  /* Mira las DEVOLUCIONES y no el puntaje: desde que el gol
     suma 5, el puntaje ya no cuenta cuántas veces le pegaste. */
  function factorDeVelocidad() {
    return devoluciones === 0 ? VELOCIDAD_DEL_PRIMER_GOLPE : 1;
  }

  function arrancar() {
    jugadorX = canvas.width / 2;
    compuX   = canvas.width / 2;

    pelota = {
      x: canvas.width / 2,
      y: canvas.height / 2 - 30,   // un poco más arriba: te da tiempo a acomodarte
      vx: 1.6,
      vy: 2.2,
    };

    puntaje = 0;
    devoluciones = 0;
    viva = true;
    alCambiarPuntaje(0);

    clearInterval(reloj);
    reloj = setInterval(paso, 16);   // ~60 cuadros por segundo
  }

  function paso() {
    if (!viva) return;

    const factor = factorDeVelocidad();

    pelota.x += pelota.vx * factor;
    pelota.y += pelota.vy * factor;

    /* Rebote en las paredes laterales */
    if (pelota.x - RADIO < 0 || pelota.x + RADIO > canvas.width) {
      pelota.vx *= -1;
      pelota.x = Math.max(RADIO, Math.min(canvas.width - RADIO, pelota.x));
    }

    /* La compu sigue la pelota, pero despacio: si fuera
       perfecta, sería imposible ganarle */
    const objetivo = pelota.x - compuX;
    compuX += Math.max(-2.4, Math.min(2.4, objetivo * 0.09)) * factor;

    /* Rebote contra la paleta de la compu (arriba) */
    if (pelota.y - RADIO < ALTO_PALETA + 4 &&
        Math.abs(pelota.x - compuX) < ANCHO_PALETA / 2) {
      pelota.vy = Math.abs(pelota.vy);
      pelota.y = ALTO_PALETA + 4 + RADIO;
    }

    /* Rebote contra tu paleta (abajo) */
    const yTuya = canvas.height - ALTO_PALETA - 4;

    if (pelota.y + RADIO > yTuya &&
        pelota.y + RADIO < yTuya + ALTO_PALETA + 6 &&
        Math.abs(pelota.x - jugadorX) < ANCHO_PALETA / 2) {

      pelota.vy = -Math.abs(pelota.vy);
      pelota.y = yTuya - RADIO;

      /* El ángulo depende de dónde le pegaste: en el borde
         sale más abierta. Eso le da control al jugador. */
      pelota.vx += (pelota.x - jugadorX) * 0.045;
      pelota.vx = Math.max(-4.5, Math.min(4.5, pelota.vx));

      /* Cada rebote acelera un poquito */
      pelota.vy *= 1.025;

      devoluciones++;
      puntaje++;
      alCambiarPuntaje(puntaje);
    }

    /* Si la pelota pasó de largo, perdiste */
    if (pelota.y - RADIO > canvas.height) return perder();

    /* Si se le escapa a la compu, es tu gol: suma y la pelota
       vuelve al medio para el siguiente punto.

       Antes acá solo se reponía la pelota, sin sumar. */
    if (pelota.y + RADIO < 0) {
      puntaje += PUNTOS_POR_GOL;
      alCambiarPuntaje(puntaje);

      pelota.x = canvas.width / 2;
      pelota.y = canvas.height / 2;
      pelota.vy = Math.abs(pelota.vy);   // sale hacia vos
    }

    dibujar();
  }

  function perder() {
    viva = false;
    clearInterval(reloj);
    alPerder(puntaje);
  }

  function dibujar() {
    ctx.fillStyle = fondoLCD();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = tintaLCD();

    /* Paleta de la compu */
    ctx.fillRect(compuX - ANCHO_PALETA / 2, 4, ANCHO_PALETA, ALTO_PALETA);

    /* Tu paleta */
    ctx.fillRect(jugadorX - ANCHO_PALETA / 2, canvas.height - ALTO_PALETA - 4, ANCHO_PALETA, ALTO_PALETA);

    /* La pelota, cuadrada para que combine con el pixel art */
    ctx.fillRect(pelota.x - RADIO, pelota.y - RADIO, RADIO * 2, RADIO * 2);

    /* La línea del medio, punteada */
    for (let x = 0; x < canvas.width; x += 10) {
      ctx.fillRect(x, canvas.height / 2, 5, 1);
    }
  }

  function moverA(x: number) {
    jugadorX = Math.max(ANCHO_PALETA / 2, Math.min(canvas.width - ANCHO_PALETA / 2, x));
  }

  return {
    arrancar,
    moverA,
    detener: () => clearInterval(reloj),
  };
}


/* ==========================================================
   3) EL SALTADOR
   ==========================================================
   Como el dinosaurio de Chrome, pero con TU mascota. Corre
   sola y vos solo tocás para saltar pinches y pozos.

   ---------- LOS NÚMEROS SALEN DE MEDIR, NO DE TANTEAR ----------
   El salto está calcado del dino de Chrome, midiéndolo cuadro
   por cuadro sobre un video en vez de probar valores a ojo:

     · sube 2.6 veces su propia altura
     · pasa ~580 ms en el aire
     · el salto es SIEMPRE igual, aunque el juego acelere

   Eso último es lo que mantiene el juego justo cuando se
   pone rápido: lo que cambia es cuánto mundo pasa por debajo,
   nunca el salto.

   Lo que teníamos subía 3.2 veces y duraba 450 ms: más alto y
   más corto, un saltito nervioso en vez de un arco. Los
   valores de abajo dan 2.66 veces y 560 ms, que es lo más
   cerca que se llega con pasos de 16 ms.
   ========================================================== */

/* ---------- CUÁNTO MUNDO PASA DURANTE UN SALTO ----------
   Con la gravedad y la fuerza de más abajo, la mascota pasa
   unos 35 cuadros en el aire. Es la vara para saber si algo se
   puede cruzar: por la velocidad, da cuántos píxeles de mundo
   pasan por debajo mientras está arriba.

   Si alguien toca la física, el test "pasa cerca de medio
   segundo en el aire" avisa que este número quedó viejo. */
export const CUADROS_EN_EL_AIRE = 35;

/* ---------- SE ACELERA CON EL PUNTAJE, NO CON EL RELOJ ----------
   Antes subía cada 420 cuadros. Eso tenía dos problemas: te
   aceleraba el juego aunque no estuvieras pasando obstáculos,
   y dos partidas con el mismo puntaje podían ir a velocidades
   distintas, así que los récords no eran comparables.

   Ahora la velocidad SALE del puntaje: el mismo puntaje es
   siempre la misma velocidad. */
export const PUNTOS_POR_ESCALON = 20;
export const VELOCIDAD_AL_EMPEZAR = 2.2;
export const VELOCIDAD_TOPE = 5.6;
const SALTO_DE_VELOCIDAD = 0.5;

export function velocidadPara(puntaje: number) {
  const escalones = Math.floor(puntaje / PUNTOS_POR_ESCALON);
  return Math.min(VELOCIDAD_TOPE, VELOCIDAD_AL_EMPEZAR + escalones * SALTO_DE_VELOCIDAD);
}

/* ==========================================================
   QUÉ OBSTÁCULO VIENE AHORA
   ==========================================================
   Vive afuera del juego a propósito: es la única regla que
   decide la dificultad, así que conviene poder probarla sola,
   sin hacer correr el juego entero.

   Son tres cosas distintas, y cada una pide algo distinto:
     · pincho bajo  -> un toque alcanza
     · pincho alto  -> hay que MANTENER apretado
     · pozo         -> hay que cruzarlo entero en el aire
   ========================================================== */
export function inventarObstaculo(
  velocidad: number,
  puntaje: number,
  anchoPantalla: number,
  azar: () => number = Math.random
) {
  const x = anchoPantalla + 10;
  const distanciaDeSalto = CUADROS_EN_EL_AIRE * velocidad;

  /* Los pozos recién aparecen después de los dos primeros
     obstáculos: así lo primero que ves siempre enseña lo simple
     ("tocá para saltar") antes de pedirte cruzar un agujero. */
  if (puntaje >= 2 && azar() < 0.4) {
    /* El ancho se mide contra el salto, no en píxeles fijos.

       Con un ancho fijo pasaba algo al revés de lo que uno
       espera: al acelerar, el pozo pasa más rápido por debajo,
       así que se vuelve más FÁCIL. El juego se aceleraba y los
       pozos se aflojaban. Como fracción del salto, la exigencia
       queda igual a cualquier velocidad. */
    const parte = 0.35 + azar() * 0.2;   // entre el 35% y el 55% del salto

    return { tipo: "pozo", x, ancho: Math.min(90, distanciaDeSalto * parte), alto: 0, puas: 0 };
  }

  /* Pinches altos: los únicos que obligan a mantener apretado.
     Un toque corto sube apenas 9 px y estos miden 26 o más.

     Aparecen más tarde para que el salto corto no sea una
     trampa apenas empezás a jugar. */
  if (puntaje >= 5 && azar() < 0.25) {
    return { tipo: "pincho", x, alto: 26 + azar() * 8, ancho: 6, puas: 1 };
  }

  /* Los de siempre: bajitos, entre una y tres puntas juntas.
     Una sola se ve pobre y más de tres no entra en un salto
     cómodo. */
  const puas = 1 + Math.floor(azar() * 3);

  return { tipo: "pincho", x, alto: 10 + azar() * 6, ancho: puas * 6, puas };
}

export function crearSaltador(canvas: HTMLCanvasElement, alCambiarPuntaje: (n: number) => void, alPerder: (n: number) => void, dibujoMascota: any) {

  const ctx = canvas.getContext("2d")!;

  const PISO = canvas.height - 16;
  const GRAVEDAD = 0.32;

  /* ---------- EL SALTO ES VARIABLE ----------
     Antes todos los saltos eran iguales de altos, así que no
     tenías control: o llegabas justo, o te comías el obstáculo.

     Ahora el salto depende de cuánto mantengas apretado:
       · toque corto  -> saltito bajo, caés rápido
       · mantener     -> salto completo

     El truco es simple: al soltar, si todavía venías
     subiendo, le cortamos el envión. Es como funcionan casi
     todos los juegos de plataformas.

     Esto NO está en el dino de Chrome, donde todos los saltos
     son iguales: es nuestro y se queda. Los dos valores se
     bajaron en la misma proporción que el salto completo. */
  const FUERZA_SALTO      = -6.0;   // el envión inicial, si mantenés
  const FUERZA_SALTO_CORTO = -2.4;  // a lo que se corta si soltás enseguida
  const CAIDA_EXTRA = 1.25;         // multiplica la gravedad mientras baja

  /* Qué obstáculo viene y cuándo se acelera están arriba, como
     funciones sueltas: son las reglas de la dificultad. */

  /* ---------- EL CIELO ----------
     Adorno puro: no choca con nada y no da puntos. Se dibuja
     antes que el piso, así todo lo demás le queda encima.

     Las nubes van MÁS LENTAS que el suelo a propósito: es el
     truco de siempre para que algo parezca lejos. Yendo a la
     misma velocidad parecerían pegadas al piso.

     Se quedan arriba (y 48..100) por dos vecinos: abajo pasa la
     mascota, que saltando llega hasta y=143, y arriba a la
     derecha está el puntaje. */
  const NUBE_LENTA = 0.22;   // fracción de la velocidad del suelo

  let mascota: any, obstaculos: any, velocidad: any, puntaje: any, reloj: any, viva: any, nubes: any;

  function arrancar() {
    mascota = { x: 26, y: PISO, vy: 0, alto: 20, ancho: 20, apoyada: true };
    obstaculos = [];
    nubes = [
      { x: 96,  y: 54, escala: 1 },
      { x: 190, y: 82, escala: 0.7 },
      { x: 268, y: 48, escala: 0.85 },
    ];
    velocidad = VELOCIDAD_AL_EMPEZAR;   // arranca lento, a propósito
    puntaje = 0;
    viva = true;

    alCambiarPuntaje(0);

    clearInterval(reloj);
    reloj = setInterval(paso, 16);
  }

  /* ¿Hay un pozo justo abajo de la mascota?
     Se mira el CENTRO y no el cuerpo entero: si rozar el borde
     con la punta de la pata te hiciera caer, se sentiría
     injusto. Es la misma trampa a favor de quien juega que ya
     hace la caja de choque de los pinches. */
  function pozoDebajoDeLaMascota() {
    const centro = mascota.x + mascota.ancho / 2;

    for (const obstaculo of obstaculos) {
      if (obstaculo.tipo !== "pozo") continue;
      if (centro > obstaculo.x + 3 && centro < obstaculo.x + obstaculo.ancho - 3) return true;
    }

    return false;
  }

  /* El sol o la luna y las nubes. Todo con los mismos dos
     colores de la pantallita: no hay grises ni medios tonos. */
  function dibujarCielo() {
    const tinta = tintaLCD();
    const fondo = fondoLCD();

    /* Arriba a la IZQUIERDA, porque a la derecha va el puntaje. */
    const cx = 40, cy = 36, radio = 10;

    ctx.fillStyle = tinta;
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.fill();

    if (pantallaOscura()) {
      /* La luna es el mismo círculo con otro encima del color
         de la pantalla: lo que sobra es la medialuna. Más
         simple que dibujar el recorte a mano, y queda parejo
         con cualquier fondo. */
      ctx.fillStyle = fondo;
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 4.5, radio - 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      /* Los rayitos del sol, cortitos y separados del disco. */
      ctx.strokeStyle = tinta;
      ctx.lineWidth = 2;

      for (let i = 0; i < 8; i++) {
        const angulo = (i / 8) * Math.PI * 2;
        const cos = Math.cos(angulo), sen = Math.sin(angulo);

        ctx.beginPath();
        ctx.moveTo(cx + cos * (radio + 3), cy + sen * (radio + 3));
        ctx.lineTo(cx + cos * (radio + 6), cy + sen * (radio + 6));
        ctx.stroke();
      }
    }

    /* Las nubes van HUECAS: rellenas quedaban manchones del
       mismo color que los pinches, y de reojo parecían algo que
       había que saltar. Vacías se leen como decorado. */
    for (const nube of nubes) {
      const bollos = (encoge: number) => {
        ctx.beginPath();
        ctx.arc(nube.x,                     nube.y,                       6 * nube.escala - encoge, 0, Math.PI * 2);
        ctx.arc(nube.x + 7 * nube.escala,   nube.y - 3.5 * nube.escala,   5 * nube.escala - encoge, 0, Math.PI * 2);
        ctx.arc(nube.x + 13 * nube.escala,  nube.y,                     4.5 * nube.escala - encoge, 0, Math.PI * 2);
        ctx.fill();
      };

      ctx.fillStyle = tinta;
      bollos(0);
      ctx.fillStyle = fondo;
      bollos(1.6);
    }
  }

  function paso() {
    if (!viva) return;

    /* --- La mascota cae siempre; saltar es empujarla arriba ---
       Mientras baja aplicamos más gravedad. Es un truco muy
       usado: hace que el salto se sienta ágil en vez de
       flotante, sin bajarle altura. */
    mascota.vy += mascota.vy > 0 ? GRAVEDAD * CAIDA_EXTRA : GRAVEDAD;
    mascota.y  += mascota.vy;

    /* El piso frena la caída, salvo que justo abajo haya un
       pozo: ahí no hay nada que la sostenga y sigue bajando. */
    const hayPiso = !pozoDebajoDeLaMascota();

    if (hayPiso && mascota.y > PISO) {
      mascota.y = PISO;
      mascota.vy = 0;
    }

    /* Solo se salta desde piso firme. Sin esto, adentro del
       pozo la mascota seguiría contando como apoyada y podrías
       saltar para salir, que es justo lo que un pozo no tiene
       que permitir. */
    mascota.apoyada = hayPiso && mascota.y >= PISO;

    /* Si se hundió del todo, se perdió. Se deja que baje un
       poco antes de cortar para que la caída SE VEA: perder
       justo en el borde parecería un error del juego. */
    if (mascota.y > PISO + 16) return perder();

    /* --- Aparecen obstáculos cada tanto ---
       El "cada tanto" es al azar dentro de un rango, para que
       no sea un ritmo predecible y aburrido.

       La distancia mínima crece con la velocidad: si no, al
       acelerar quedaban tan juntos que no llegabas a caer de un
       salto antes del siguiente. Se mide desde el FINAL del
       último y no desde su principio, porque ahora los anchos
       son distintos: un pozo ocupa bastante más que un pincho. */
    const ultimo = obstaculos[obstaculos.length - 1];
    const finDelUltimo = ultimo ? ultimo.x + ultimo.ancho : -Infinity;
    const separacionMinima = 110 + velocidad * 22;

    if (!ultimo || finDelUltimo < canvas.width - separacionMinima - Math.random() * 110) {
      obstaculos.push(inventarObstaculo(velocidad, puntaje, canvas.width));
    }

    /* --- Las nubes van pasando, más lentas --- */
    for (const nube of nubes) {
      nube.x -= velocidad * NUBE_LENTA;

      /* Cuando una sale por la izquierda vuelve por la derecha,
         a otra altura: así son siempre tres y nunca se acaban. */
      if (nube.x < -30) {
        nube.x = canvas.width + 20;
        nube.y = 48 + Math.random() * 52;
        nube.escala = 0.7 + Math.random() * 0.35;
      }
    }

    /* --- Mover y limpiar los que ya pasaron --- */
    for (const obstaculo of obstaculos) obstaculo.x -= velocidad;

    while (obstaculos.length && obstaculos[0].x + obstaculos[0].ancho < 0) {
      obstaculos.shift();
      puntaje++;
      alCambiarPuntaje(puntaje);
    }

    /* Cada 20 puntos, un escalón más rápido. Sale del puntaje,
       así que no hace falta acordarse de nada entre cuadros. */
    velocidad = velocidadPara(puntaje);

    /* --- ¿Chocaste? ---
       La caja de choque de la mascota es bastante más chica
       que su dibujo (los -9 y +6). Si la colisión fuera
       exacta al pixel, se sentiría injusta: parecería que
       pasaste y sin embargo perdiste. Los juegos buenos
       siempre hacen trampa a favor del jugador. */
    for (const obstaculo of obstaculos) {
      /* Los pozos no se chocan: se caen. Eso ya lo resolvió la
         gravedad más arriba. */
      if (obstaculo.tipo !== "pincho") continue;

      const chocaHorizontal = mascota.x + mascota.ancho - 9 > obstaculo.x &&
                              mascota.x + 6 < obstaculo.x + obstaculo.ancho;

      const chocaVertical = mascota.y > PISO - obstaculo.alto + 6;

      if (chocaHorizontal && chocaVertical) return perder();
    }

    dibujar();
  }

  function perder() {
    viva = false;
    clearInterval(reloj);
    alPerder(puntaje);
  }

  function dibujar() {
    ctx.fillStyle = fondoLCD();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    dibujarCielo();

    ctx.fillStyle = tintaLCD();

    /* --- El piso, con los pozos como huecos ---
       Se dibuja por tramos: desde donde íbamos hasta donde
       empieza el próximo pozo, se saltea el pozo, y se sigue. */
    const pozos = obstaculos
      .filter((o: any) => o.tipo === "pozo")
      .sort((a: any, b: any) => a.x - b.x);

    let desde = 0;

    for (const pozo of pozos) {
      if (pozo.x > desde) ctx.fillRect(desde, PISO + 2, pozo.x - desde, 2);
      desde = Math.max(desde, pozo.x + pozo.ancho);

      /* Dos marquitas en los bordes: sin ellas el pozo se lee
         como "piso que falta" en vez de como un agujero. */
      ctx.fillRect(pozo.x - 1, PISO + 2, 1, 5);
      ctx.fillRect(pozo.x + pozo.ancho, PISO + 2, 1, 5);
    }

    if (desde < canvas.width) ctx.fillRect(desde, PISO + 2, canvas.width - desde, 2);

    /* --- Los pinches: triangulitos apoyados en el piso --- */
    for (const obstaculo of obstaculos) {
      if (obstaculo.tipo !== "pincho") continue;

      const anchoPua = obstaculo.ancho / obstaculo.puas;

      for (let i = 0; i < obstaculo.puas; i++) {
        const x = obstaculo.x + i * anchoPua;

        ctx.beginPath();
        ctx.moveTo(x, PISO + 2);
        ctx.lineTo(x + anchoPua / 2, PISO + 2 - obstaculo.alto);
        ctx.lineTo(x + anchoPua, PISO + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    /* La mascota: si nos pasaron su dibujo lo usamos, si no,
       un cuadradito. Así el juego funciona igual aunque algo
       falle con los sprites. */
    if (dibujoMascota) {
      dibujoMascota(ctx, mascota.x, mascota.y - mascota.alto + 2, mascota.ancho, mascota.alto);
    } else {
      ctx.fillRect(mascota.x, mascota.y - mascota.alto, mascota.ancho, mascota.alto);
    }

    /* --- El puntaje, siempre a la vista arriba a la derecha ---
       Van solo los dígitos, con ceros adelante como en los
       fichines: no hay ninguna palabra que traducir y ocupa
       siempre el mismo ancho, así que el número no se corre
       al pasar de 9 a 10. */
    /* Se vuelve a fijar la tinta ANTES de escribir. El sprite
       de la mascota pinta con sus propios colores y deja el
       último puesto en el pincel: sin esta línea, el puntaje
       salía del color del bichito (un rojo que sobre el fondo
       Noche casi no se leía) en vez del color de la pantalla. */
    ctx.fillStyle = tintaLCD();
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(String(puntaje).padStart(4, "0"), canvas.width - 5, 5);

    /* Se deja el contexto como estaba: lo comparten los otros
       juegos y el cuadro siguiente. */
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function saltar() {
    /* Solo desde piso firme: nada de doble salto, y tampoco
       saltar para salir de un pozo una vez que caíste. */
    if (viva && mascota.apoyada) mascota.vy = FUERZA_SALTO;
  }

  /* Al soltar el dedo: si todavía venía subiendo fuerte, le
     cortamos el envión. Eso convierte el toque corto en un
     saltito, y mantener apretado en un salto completo. */
  function soltarSalto() {
    if (viva && mascota.vy < FUERZA_SALTO_CORTO) mascota.vy = FUERZA_SALTO_CORTO;
  }

  return {
    arrancar,
    saltar,
    soltarSalto,
    detener: () => clearInterval(reloj),
  };
}
