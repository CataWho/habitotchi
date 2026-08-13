import { useCallback, useRef, useState, type ReactNode, type RefObject } from "react";

/* ==========================================================
   LAS PÁGINAS
   ==========================================================
   Las nueve pantallas viven una al lado de la otra en un
   carril, y se pasa de una a otra corriendo el carril de
   costado con un transform.

   Las flechas y los puntitos NO están acá: viven en el
   chasis, fuera de la pantalla, porque así está armada la
   carcasa. Por eso esto es un hook y no un componente que
   dibuja todo junto: el que navega y el que muestra dónde
   estás quedan en lugares distintos del aparato.

   ---------- POR QUÉ NO ES SCROLL ----------
   Antes esto era un contenedor con scroll horizontal y
   scroll-snap: se deslizaba con el dedo y las flechas hacían
   scrollTo. Al sacar el deslizado táctil (la navegación es
   con los botones, como en un aparato de verdad) el
   contenedor pasó a overflow: hidden, y ahí Chrome dejó de
   animar el scroll-behavior: smooth. Las flechas pedían el
   scroll, el scroll no llegaba nunca a destino, y el índice
   quedaba desfasado de lo que se veía.

   Con un transform no hay nada que pueda quedar a mitad de
   camino: la pestaña en la que estás es una variable de
   React y el carril siempre dibuja lo que esa variable dice.

   ---------- LA PÁGINA QUE DEJÁS SE REBOBINA ----------
   Cada página tiene su propio scroll vertical y el navegador
   se lo acuerda. Si bajabas hasta el final de Ejercicio, te
   ibas a Hobbies y volvías, Ejercicio aparecía por la mitad.
   En un aparato de verdad, cambiar de pantalla y volver te
   deja al principio.

   Se rebobina cuando el carril ya terminó de correrse, así
   la página está fuera de vista y el salto no se ve.
   ========================================================== */

/* Lo mismo que dura la transición del carril en el CSS
   (.app-track), más un respiro. */
const DURACION_DEL_PASE = 320;
const RESPIRO = 60;

export interface Navegacion {
  carril: RefObject<HTMLDivElement | null>;
  actual: number;
  irA: (indice: number) => void;
  anterior: () => void;
  siguiente: () => void;
}

export function usePaginas(cantidad: number, onCambiar?: (indice: number) => void): Navegacion {
  const carril = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  const irA = useCallback(
    (indice: number) => {
      const destino = Math.max(0, Math.min(cantidad - 1, indice));
      if (destino === actual) return;

      /* Se agarra la página que estás dejando ANTES de cambiar
         de pestaña: después `actual` ya apunta a la nueva. */
      const queDejas = carril.current?.children[actual] as HTMLElement | undefined;

      setActual(destino);
      onCambiar?.(destino);

      if (queDejas) {
        window.setTimeout(() => {
          queDejas.scrollTop = 0;
        }, DURACION_DEL_PASE + RESPIRO);
      }
    },
    [cantidad, actual, onCambiar]
  );

  const anterior = useCallback(() => irA(actual - 1), [irA, actual]);
  const siguiente = useCallback(() => irA(actual + 1), [irA, actual]);

  return { carril, actual, irA, anterior, siguiente };
}

export function Paginas({
  navegacion,
  children,
}: {
  navegacion: Navegacion;
  children: ReactNode;
}) {
  /* El carril mide exactamente lo que la ventanita, aunque le
     cuelguen nueve páginas al costado. Así un -100% es
     justo una pestaña, sin tener que saber cuántas hay. */
  return (
    <div className="app-pages">
      <div
        className="app-track"
        ref={navegacion.carril}
        style={{ transform: `translateX(-${navegacion.actual * 100}%)` }}
      >
        {children}
      </div>
    </div>
  );
}

/* Los puntitos de abajo: en qué pestaña estás */
export function Puntitos({ navegacion, nombres }: { navegacion: Navegacion; nombres: string[] }) {
  return (
    <nav className="page-dots" aria-label="Navegación entre pestañas">
      {nombres.map((nombre, i) => (
        <button
          key={nombre}
          type="button"
          className={i === navegacion.actual ? "page-dot is-active" : "page-dot"}
          onClick={() => navegacion.irA(i)}
          aria-label={`Ir a ${nombre}`}
          aria-current={i === navegacion.actual}
        />
      ))}
    </nav>
  );
}
