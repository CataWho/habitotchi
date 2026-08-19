import { useEffect, useState } from "react";
import { CLAVES, alCambiar, leer, escribir } from "./almacenamiento";

/* ==========================================================
   HABITOTCHI · sonido
   ==========================================================
   No hay ni un solo archivo de audio en el proyecto. Todo —los
   efectos de los juegos y el ambiente de fondo— se genera con
   la Web Audio API, osciladores puros armando cada nota en el
   momento. Es la misma idea que ya usa el resto de la app: los
   gráficos son un <canvas> dibujado a mano, las mascotas son
   pixel art hecho de letras, y el sonido es "pixel art" hecho
   de ondas.

   Ventajas concretas: no hay ningún archivo que descargar (la
   app pesa lo mismo con sonido que sin él), no hay licencias
   de las que preocuparse, y cambiar un sonido es cambiar tres
   números en vez de grabar de nuevo.

   ---------- ES UN AJUSTE DEL DISPOSITIVO ----------
   Igual que el idioma: se guarda localmente y NO viaja a la
   cuenta. Que actives el sonido en la compu no tiene por qué
   silenciar o prender el celular.
   ========================================================== */

export function sonidoActivado(): boolean {
  return leer(CLAVES.sonido, true);
}

export function activarSonido(valor: boolean): void {
  escribir(CLAVES.sonido, valor);
  if (!valor) detenerAmbiente();
}

/* Para el interruptor de Ajustes: lee el valor guardado y se
   entera si algo más lo cambia (por ahora nada más lo toca,
   pero sigue el mismo patrón que usarIdioma). */
export function usarSonido() {
  const [activado, setActivado] = useState(() => sonidoActivado());

  useEffect(() => alCambiar(CLAVES.sonido, () => setActivado(sonidoActivado())), []);

  const cambiar = (valor: boolean) => {
    activarSonido(valor);
    setActivado(valor);
  };

  return { activado, cambiar };
}

/* ==========================================================
   EL MOTOR
   ==========================================================
   Un solo AudioContext para toda la app, creado recién cuando
   hace falta y no antes: los navegadores bloquean el audio
   hasta que la persona toca algo, así que crearlo al abrir la
   app no serviría de nada y solo gastaría batería.
   ========================================================== */
let contexto: AudioContext | null = null;

function hayAudio(): boolean {
  return typeof window !== "undefined" && typeof (window as any).AudioContext !== "undefined";
}

function obtenerContexto(): AudioContext | null {
  if (!hayAudio()) return null;

  if (!contexto) {
    contexto = new (window as any).AudioContext();

    /* El contexto nace "suspendido" hasta el primer toque o
       tecla. Sin este empujón, la primera vez que alguien abre
       la app y el ambiente intenta arrancar solo, se quedaría
       mudo para siempre —el navegador nunca le avisa que
       falló, simplemente no suena. */
    const reanudar = () => {
      contexto?.resume().catch(() => {});
    };

    window.addEventListener("pointerdown", reanudar);
    window.addEventListener("keydown", reanudar);
  }

  return contexto;
}

/* Una nota: sube de golpe y se apaga de a poco, como un piano.
   Con degradeExponencial en vez de lineal el final suena más
   natural —el oído nota más los cambios bruscos al principio
   de un sonido que al final. */
function nota(
  ctx: AudioContext,
  frecuencia: number,
  cuando: number,
  duracion: number,
  volumen = 0.16,
  tipo: OscillatorType = "sine"
): void {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();

  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, cuando);

  ganancia.gain.setValueAtTime(0, cuando);
  ganancia.gain.linearRampToValueAtTime(volumen, cuando + 0.012);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);

  osc.connect(ganancia);
  ganancia.connect(ctx.destination);

  osc.start(cuando);
  osc.stop(cuando + duracion + 0.05);
}

/* Toca una serie de notas, cada una un ratito después de la
   anterior. Es lo que arma los "tin-tin-tin" ascendentes y
   descendentes de abajo. */
function melodia(
  frecuencias: number[],
  separacion: number,
  duracion: number,
  volumen = 0.16,
  tipo: OscillatorType = "sine"
): void {
  if (!sonidoActivado()) return;

  const ctx = obtenerContexto();
  if (!ctx) return;

  frecuencias.forEach((frecuencia, i) => {
    nota(ctx, frecuencia, ctx.currentTime + i * separacion, duracion, volumen, tipo);
  });
}

/* ==========================================================
   LOS EFECTOS
   ==========================================================
   Notas musicales, no números pelados: así el que lea esto
   entiende qué forma tiene el sonido sin tener que tararearlo.
   ========================================================== */
const DO5 = 523.25, RE5 = 587.33, MI5 = 659.25, SOL5 = 783.99, LA5 = 880;
const DO4 = 261.63, RE4 = 293.66, MI4 = 329.63, SOL4 = 392, LA4 = 440;
const SOL3 = 196, MI3 = 164.81, DO3 = 130.81;

/** El saltador y la viborita al girar, algo mínimo. */
export function sonidoSalto(): void {
  melodia([MI5, LA5], 0.045, 0.09, 0.11, "triangle");
}

/** Sumar un punto: pasar un obstáculo, comer, devolver la pelota. */
export function sonidoPunto(): void {
  melodia([DO5], 0.08, 0.09, 0.11, "square");
}

/** El gol de Pong: más largo, más fiesta que un punto común. */
export function sonidoGol(): void {
  melodia([DO5, MI5, SOL5, DO5 * 2], 0.07, 0.14, 0.12, "triangle");
}

/** Perder en cualquiera de los tres juegos. */
export function sonidoPerder(): void {
  melodia([SOL4, MI4, DO4], 0.11, 0.22, 0.13, "sawtooth");
}

/** Desbloquear algo en la tienda. */
export function sonidoDesbloqueo(): void {
  melodia([DO5, MI5, SOL5], 0.09, 0.2, 0.14, "triangle");
}

/** Intentar comprar algo que no se puede: sin monedas o repetido. */
export function sonidoRechazo(): void {
  melodia([RE4, DO4], 0.07, 0.12, 0.1, "square");
}

/* ==========================================================
   EL AMBIENTE
   ==========================================================
   La idea es la de Minecraft: no una canción en loop, sino
   notas sueltas que van apareciendo cada tanto, al azar, sobre
   silencio. Eso es lo que la hace "ambiente" y no "música": no
   pide atención, y dos personas escuchando nunca escuchan lo
   mismo dos veces.

   ---------- POR QUÉ PENTATÓNICA ----------
   Una escala pentatónica no tiene semitonos que choquen entre
   sí: CUALQUIER combinación de estas notas, en cualquier
   orden, suena bien. Es la misma escala de casi toda la música
   folclórica del mundo, y la razón por la que un piano
   "sonido de campanitas" con teclas negras nunca suena mal
   aunque lo toque un bebé.
   ========================================================== */
const ESCALA_AMBIENTE = [DO3, MI3, SOL3, DO4, RE4, MI4, SOL4, LA4, DO5, RE5, MI5];

let ambienteEncendido = false;
let proximaNota: number | undefined;

function programarProximaNota(): void {
  if (!ambienteEncendido) return;

  /* Entre 5 y 14 segundos de silencio antes de la próxima nota.
     Lo suficientemente separadas como para que cada una se
     escuche sola, nunca como una melodía. */
  const espera = 5000 + Math.random() * 9000;

  proximaNota = window.setTimeout(() => {
    tocarNotaDeAmbiente();
    programarProximaNota();
  }, espera);
}

function tocarNotaDeAmbiente(): void {
  if (!ambienteEncendido || !sonidoActivado() || document.hidden) return;

  const ctx = obtenerContexto();
  if (!ctx) return;

  const frecuencia = ESCALA_AMBIENTE[Math.floor(Math.random() * ESCALA_AMBIENTE.length)]!;

  /* Muy suave y muy larga: 1.2s para crecer, 3 a 5s para
     apagarse. Nada de esto tiene que competir con lo que la
     persona esté mirando o escuchando en la pantalla. */
  const duracion = 3 + Math.random() * 2;
  nota(ctx, frecuencia, ctx.currentTime, duracion, 0.05, "sine");

  /* Un segundo oscilador una octava arriba, más flojito: le da
     un cuerpo de "campana" en vez de sonar como un pitido de
     microondas. */
  nota(ctx, frecuencia * 2, ctx.currentTime + 0.02, duracion * 0.8, 0.018, "sine");
}

export function iniciarAmbiente(): void {
  if (ambienteEncendido || !sonidoActivado()) return;

  ambienteEncendido = true;
  programarProximaNota();
}

export function detenerAmbiente(): void {
  ambienteEncendido = false;
  window.clearTimeout(proximaNota);
}

/* Cuando la pestaña pasa a segundo plano, no tiene sentido
   seguir programando notas que nadie va a escuchar —y en el
   celular, seguir despertando el procesador gasta batería
   sin necesidad. Al volver, el ambiente sigue solo. */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ambienteEncendido) return;

    if (document.hidden) {
      window.clearTimeout(proximaNota);
    } else {
      programarProximaNota();
    }
  });
}
