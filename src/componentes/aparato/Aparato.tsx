import type { ReactNode } from "react";
import { tr } from "@/lib/idioma";
import { useEscala } from "./useEscala";
import { FONDOS } from "@/datos/fondos";
import { useHabitotchi } from "@/estado/useHabitotchi";

/* ==========================================================
   LA CARCASA
   ==========================================================
   Un tamagotchi de plástico transparente son tres cosas
   superpuestas, y así está armado:

     ::before  la placa de circuito impreso, bien al fondo
     .bruma    el violeta del interior
     ::after   el plástico violeta translúcido y sus brillos
     hijos     el contenido (marca, pantalla, botones)

   Todo eso vive en el CSS (estilos/aparato.css). Acá solo va
   la estructura.
   ========================================================== */

/* La carcasa es SIEMPRE igual, en todas las pestañas. Antes
   se replegaba en las que no eran Hogar, y eso hacía que la
   pantalla verde cambiara de tamaño al deslizar. Ahora los
   marcadores viven adentro de la pantalla, así que no hay
   nada que replegar. */
interface Props {
  children: ReactNode;
}

/* Tamaño de diseño del aparato. No cambia nunca: lo que
   cambia es la escala (ver useEscala). */
export const ANCHO_APARATO = 520;
export const ALTO_APARATO = 880;

export function Aparato({ children }: Props) {
  const escala = useEscala(ANCHO_APARATO, ALTO_APARATO);

  return (
    <div
      className="device"
      style={{
        width: ANCHO_APARATO,
        height: ALTO_APARATO,
        /* El translate va ANTES del scale: primero lo corremos
           media caja para centrarlo, y después se achica desde
           ese centro. Al revés, el corrimiento también se
           escalaría y quedaría descolocado. */
        transform: `translate(-50%, -50%) scale(${escala})`,
      }}
    >
      <div className="bruma-interior" />
      {children}
    </div>
  );
}

/* ==========================================================
   LA PANTALLA LCD
   ==========================================================
   El fondo de pantalla no solo cambia el degradado: también
   escribe la tinta como variable CSS. Toda la interfaz de
   adentro (títulos, bordes, campos, barras) está dibujada a
   partir de esa variable, así que con esto el fondo "Noche"
   pasa a escribirse en claro en vez de en verde oscuro.

   Sin esta parte, los botones quedaban con la letra del color
   equivocado y no se leían.
   ========================================================== */
export function Pantalla({ children }: { children: ReactNode }) {
  const idFondo = useHabitotchi((e) => e.equipado.fondo);
  const fondo = FONDOS[idFondo] ?? FONDOS.clasico!;

  return (
    <section
      className="screen"
      aria-label={tr("aparatoPantalla")}
      style={
        {
          background: fondo.degradado,
          "--lcd-tinta-rgb": fondo.tinta,
          "--lcd-contratinta": fondo.contratinta,
          "--lcd-brillo": fondo.brillo,
        } as React.CSSProperties
      }
    >
      <div className="screen-grid" />
      {children}
    </section>
  );
}
