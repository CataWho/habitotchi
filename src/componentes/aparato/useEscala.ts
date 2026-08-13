import { useEffect, useState } from "react";

/* ==========================================================
   QUE EL APARATO NO SE DEFORME
   ==========================================================
   Antes el aparato medía "lo que entre" a lo ancho y "lo que
   entre" a lo alto, por separado. En una ventana angosta y
   alta se estiraba; en una baja y ancha se achataba y quedaba
   redondito. Un tamagotchi de plástico no hace eso.

   Ahora mide siempre lo mismo (520x880) y lo que cambia es la
   escala: se achica entero, con sus proporciones intactas,
   como si lo alejaras. Todo lo de adentro (texto, pixeles,
   botones) se achica junto, sin recalcular nada.

   El tope de 1 es para que nunca se agrande más allá de su
   tamaño de diseño: estirarlo en una pantalla grande lo haría
   ver borroso y desproporcionado.
   ========================================================== */

/* Cuánto aire dejamos alrededor, para que no quede pegado a
   los bordes de la ventana. */
const AIRE = 16;

export function useEscala(ancho: number, alto: number): number {
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const medir = () => {
      /* Medimos el elemento raíz y no window.innerWidth: el
         innerWidth incluye la barra de scroll y, sobre todo,
         no siempre está al día en el momento en que corremos.
         El tamaño real del documento sí. */
      const raiz = document.documentElement;
      const disponibleAncho = raiz.clientWidth - AIRE * 2;
      const disponibleAlto = raiz.clientHeight - AIRE * 2;

      setEscala(Math.min(disponibleAncho / ancho, disponibleAlto / alto, 1));
    };

    medir();

    /* ----------------------------------------------------------
       POR QUÉ UN OBSERVADOR Y NO EL EVENTO "resize"
       ----------------------------------------------------------
       El evento resize no siempre llega: al arrancar, al rotar
       el teléfono, o cuando el que cambia de tamaño es el
       contenedor y no la ventana. Cuando no llegaba, la escala
       quedaba calculada con la medida anterior y el aparato
       terminaba más ancho que la ventana: se cortaba por los
       costados y parecía que la pantalla tocaba la carcasa.

       El observador mira el elemento en sí, así que se entera
       de cualquier cambio, venga de donde venga.
       ---------------------------------------------------------- */
    const observador = new ResizeObserver(medir);
    observador.observe(document.documentElement);

    return () => observador.disconnect();
  }, [ancho, alto]);

  return escala;
}
