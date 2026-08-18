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
   compu. El puntaje es cuántas veces devolviste la pelota.
   ========================================================== */
export function crearPong(canvas: HTMLCanvasElement, alCambiarPuntaje: (n: number) => void, alPerder: (n: number) => void) {

  const ctx = canvas.getContext("2d")!;

  const ANCHO_PALETA = 46;
  const ALTO_PALETA  = 7;
  const RADIO = 4;

  /* Las primeras jugadas van lentas a propósito: antes la
     pelota salía disparada y perdías sin llegar a apoyar el
     dedo. Durante las primeras 5 devoluciones va despacio, y
     después toma la velocidad normal. */
  const JUGADAS_FACILES = 5;
  const VELOCIDAD_INICIAL = 0.42;   // 42% de la velocidad normal

  let jugadorX: any, compuX: any, pelota: any, puntaje: any, reloj: any, viva: any;

  function factorDeVelocidad() {
    if (puntaje >= JUGADAS_FACILES) return 1;

    /* Va subiendo de a poco en vez de dar un salto seco */
    return VELOCIDAD_INICIAL + (1 - VELOCIDAD_INICIAL) * (puntaje / JUGADAS_FACILES);
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

      puntaje++;
      alCambiarPuntaje(puntaje);
    }

    /* Si la pelota pasó de largo, perdiste */
    if (pelota.y - RADIO > canvas.height) return perder();

    /* Si se le escapa a la compu, la devolvemos al medio */
    if (pelota.y + RADIO < 0) {
      pelota.x = canvas.width / 2;
      pelota.y = canvas.height / 2;
      pelota.vy = Math.abs(pelota.vy);
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
   sola y vos solo tocás para saltar los cactus.
   ========================================================== */
export function crearSaltador(canvas: HTMLCanvasElement, alCambiarPuntaje: (n: number) => void, alPerder: (n: number) => void, dibujoMascota: any) {

  const ctx = canvas.getContext("2d")!;

  const PISO = canvas.height - 16;
  const GRAVEDAD = 0.62;

  /* ---------- EL SALTO ES VARIABLE ----------
     Antes todos los saltos eran iguales de altos, así que no
     tenías control: o llegabas justo, o te comías el cactus.

     Ahora el salto depende de cuánto mantengas apretado:
       · toque corto  -> saltito bajo, caés rápido
       · mantener     -> salto completo

     El truco es simple: al soltar, si todavía venías
     subiendo, le cortamos el envión. Es como funcionan casi
     todos los juegos de plataformas. */
  const FUERZA_SALTO      = -9.2;   // el envión inicial, si mantenés
  const FUERZA_SALTO_CORTO = -3.6;  // a lo que se corta si soltás enseguida
  const CAIDA_EXTRA = 1.25;         // multiplica la gravedad mientras baja

  let mascota: any, obstaculos: any, velocidad: any, puntaje: any, reloj: any, viva: any, cuadros: any;

  function arrancar() {
    mascota = { x: 26, y: PISO, vy: 0, alto: 20, ancho: 20 };
    obstaculos = [];
    velocidad = 2.2;   // arranca lento, a propósito
    puntaje = 0;
    cuadros = 0;
    viva = true;

    alCambiarPuntaje(0);

    clearInterval(reloj);
    reloj = setInterval(paso, 16);
  }

  function paso() {
    if (!viva) return;

    cuadros++;

    /* --- La mascota cae siempre; saltar es empujarla arriba ---
       Mientras baja aplicamos más gravedad. Es un truco muy
       usado: hace que el salto se sienta ágil en vez de
       flotante, sin bajarle altura. */
    mascota.vy += mascota.vy > 0 ? GRAVEDAD * CAIDA_EXTRA : GRAVEDAD;
    mascota.y  += mascota.vy;

    if (mascota.y > PISO) {
      mascota.y = PISO;
      mascota.vy = 0;
    }

    /* --- Aparecen cactus cada tanto ---
       El "cada tanto" es al azar dentro de un rango, para que
       no sea un ritmo predecible y aburrido.

       La distancia mínima crece con la velocidad: si no, al
       acelerar los cactus quedaban tan juntos que no llegabas
       a caer de un salto antes del siguiente. */
    const ultimo = obstaculos[obstaculos.length - 1];
    const separacionMinima = 110 + velocidad * 22;

    if (!ultimo || ultimo.x < canvas.width - separacionMinima - Math.random() * 110) {
      obstaculos.push({
        x: canvas.width + 10,
        alto: 10 + Math.random() * 6,   // cactus bajitos: más fáciles de saltar
        ancho: 8,
      });
    }

    /* --- Mover y limpiar los que ya pasaron --- */
    for (const obstaculo of obstaculos) obstaculo.x -= velocidad;

    while (obstaculos.length && obstaculos[0].x + obstaculos[0].ancho < 0) {
      obstaculos.shift();
      puntaje++;
      alCambiarPuntaje(puntaje);
    }

    /* Se va poniendo más rápido, pero más despacio que antes
       y con un techo más bajo */
    if (cuadros % 420 === 0 && velocidad < 5.6) velocidad += 0.28;

    /* --- ¿Chocaste? ---
       La caja de choque de la mascota es bastante más chica
       que su dibujo (los -9 y +6). Si la colisión fuera
       exacta al pixel, se sentiría injusta: parecería que
       pasaste y sin embargo perdiste. Los juegos buenos
       siempre hacen trampa a favor del jugador. */
    for (const obstaculo of obstaculos) {
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

    ctx.fillStyle = tintaLCD();

    /* El piso */
    ctx.fillRect(0, PISO + 2, canvas.width, 2);

    /* Los cactus */
    for (const obstaculo of obstaculos) {
      ctx.fillRect(obstaculo.x, PISO - obstaculo.alto + 2, obstaculo.ancho, obstaculo.alto);
    }

    /* La mascota: si nos pasaron su dibujo lo usamos, si no,
       un cuadradito. Así el juego funciona igual aunque algo
       falle con los sprites. */
    if (dibujoMascota) {
      dibujoMascota(ctx, mascota.x, mascota.y - mascota.alto + 2, mascota.ancho, mascota.alto);
    } else {
      ctx.fillRect(mascota.x, mascota.y - mascota.alto, mascota.ancho, mascota.alto);
    }
  }

  function saltar() {
    /* Solo se puede saltar desde el piso: nada de doble salto */
    if (viva && mascota.y >= PISO) mascota.vy = FUERZA_SALTO;
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
