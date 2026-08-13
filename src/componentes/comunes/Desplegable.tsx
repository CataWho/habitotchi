import { Fragment, useEffect, useId, useRef, useState } from "react";

/* ==========================================================
   EL DESPLEGABLE
   ==========================================================
   Un <select> se puede pintar por fuera, pero la lista que se
   abre la dibuja el sistema operativo: fondo blanco, resaltado
   azul de Windows, tipografía del sistema. En una pantallita
   de tamagotchi eso canta muchísimo, y encima no hay ninguna
   propiedad de CSS que lo arregle — es la única parte del
   HTML que no se puede estilar.

   Así que la lista la dibujamos nosotras.

   ---------- CÓMO SE PINTA ----------
   El papel de la lista es --lcd-contratinta, el color sólido
   que cada fondo de pantalla trae para lo que tiene que tapar
   lo de atrás. La opción resaltada va al revés: fondo de
   tinta, letra de contratinta. Es el invertido de un LCD de
   verdad, y de paso el contraste ya está garantizado — los
   tests de datos-fondos.test.ts verifican ese par de colores
   en los cuatro fondos.

   ---------- LO QUE HAY QUE REPONER A MANO ----------
   Dejar de usar <select> significa perder todo lo que el
   navegador daba gratis, así que va acá:

   · rol de combobox con su listbox, para que un lector de
     pantalla lo anuncie como lo que es
   · flechas, Inicio/Fin, Enter para elegir, Escape para
     cerrar, Tab para irse
   · aria-activedescendant: el foco no se mueve de la caja,
     pero la ayuda técnica sabe qué opción está marcada
   · cerrar al tocar en cualquier otro lado
   · abrirse para arriba si abajo no entra (la pantalla mide
     menos de 400px de alto)
   ========================================================== */

/* Cuánto puede medir la lista abierta. Más que esto no entra
   en la pantallita ni con la lista más corta. */
const ALTO_MAXIMO = 138;

export interface OpcionDesplegable {
  id: string;
  nombre: string;
  grupo?: string;
}

/* Las opciones sueltas primero y después las agrupadas. Se
   arma una sola lista plana porque las flechas del teclado
   recorren opciones, no grupos: el índice tiene que poder
   moverse de la última de un grupo a la primera del
   siguiente sin saltarse nada. */
function ordenarPorGrupo(opciones: OpcionDesplegable[]) {
  const grupos = [...new Set(opciones.map((o) => o.grupo).filter(Boolean))] as string[];
  if (grupos.length === 0) return { grupos, ordenadas: opciones };

  const sueltas = opciones.filter((o) => !o.grupo);
  const agrupadas = grupos.flatMap((g) => opciones.filter((o) => o.grupo === g));

  return { grupos, ordenadas: [...sueltas, ...agrupadas] };
}

export function Desplegable({
  valor,
  alCambiar,
  opciones,
  etiqueta,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  opciones: OpcionDesplegable[];
  /* Para cuando el desplegable no tiene un texto al lado que
     lo explique. */
  etiqueta?: string;
}) {
  const base = useId();
  const caja = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const [haciaArriba, setHaciaArriba] = useState(false);

  const { grupos, ordenadas } = ordenarPorGrupo(opciones);

  const indiceElegido = ordenadas.findIndex((o) => o.id === valor);
  const elegida = ordenadas[indiceElegido];

  /* Tocar en cualquier otro lado cierra. Va en pointerdown y
     no en click: si no, tocar otro desplegable primero cierra
     éste y el click se pierde, y hay que tocar dos veces. */
  useEffect(() => {
    if (!abierto) return;

    const afuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };

    document.addEventListener("pointerdown", afuera);
    return () => document.removeEventListener("pointerdown", afuera);
  }, [abierto]);

  /* La opción resaltada siempre a la vista. Se mueve el
     scrollTop a mano en vez de usar scrollIntoView porque ése
     además empuja a los ancestros, y acá arriba está el carril
     de las pestañas: terminaría cambiando de pantalla. */
  useEffect(() => {
    if (!abierto) return;

    const nodo = lista.current?.querySelector<HTMLElement>(`[data-indice="${resaltado}"]`);
    if (!nodo || !lista.current) return;

    const l = lista.current;
    if (nodo.offsetTop < l.scrollTop) {
      l.scrollTop = nodo.offsetTop;
    } else if (nodo.offsetTop + nodo.offsetHeight > l.scrollTop + l.clientHeight) {
      l.scrollTop = nodo.offsetTop + nodo.offsetHeight - l.clientHeight;
    }
  }, [abierto, resaltado]);

  const abrir = () => {
    /* ¿Entra para abajo? Se mide contra la ventanita de las
       páginas, que es lo que recorta de verdad. */
    const mia = caja.current?.getBoundingClientRect();
    /* .app-pages para los desplegables de las pantallas y
       .chef-modal para los de un panel modal: lo que recorta
       es el que esté más cerca. */
    const ventana = caja.current?.closest(".app-pages, .chef-modal")?.getBoundingClientRect();

    if (mia && ventana) {
      const abajo = ventana.bottom - mia.bottom;
      const arriba = mia.top - ventana.top;
      setHaciaArriba(abajo < ALTO_MAXIMO && arriba > abajo);
    }

    setResaltado(Math.max(0, indiceElegido));
    setAbierto(true);
  };

  const elegir = (indice: number) => {
    const opcion = ordenadas[indice];
    if (opcion) alCambiar(opcion.id);
    setAbierto(false);
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (!abierto) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrir();
      }
      return;
    }

    if (e.key === "Escape" || e.key === "Tab") {
      /* Escape se queda en la caja; Tab sigue de largo al
         siguiente campo, como haría un select de verdad. */
      if (e.key === "Escape") e.preventDefault();
      setAbierto(false);
      return;
    }

    /* El destino se calcula a partir del valor anterior y no
       de `resaltado`: si llegan dos flechas en el mismo tick
       (teclado repitiendo), las dos leerían el mismo valor
       viejo y el resaltado se movería un solo lugar. */
    const mover = (calcular: (actual: number) => number) => {
      e.preventDefault();
      setResaltado((actual) => Math.max(0, Math.min(ordenadas.length - 1, calcular(actual))));
    };

    if (e.key === "ArrowDown") return mover((i) => i + 1);
    if (e.key === "ArrowUp") return mover((i) => i - 1);
    if (e.key === "Home") return mover(() => 0);
    if (e.key === "End") return mover(() => ordenadas.length - 1);

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      elegir(resaltado);
    }
  };

  const idLista = `${base}-lista`;

  /* Una función que devuelve JSX, no un componente definido
     acá adentro: un componente declarado dentro del render es
     un tipo nuevo en cada pasada, así que React desmonta y
     vuelve a montar toda la lista cada vez que se mueve el
     resaltado. */
  const dibujarOpcion = (opcion: OpcionDesplegable, indice: number) => (
    <li
      key={opcion.id}
      id={`${base}-op-${indice}`}
      data-indice={indice}
      role="option"
      aria-selected={opcion.id === valor}
      className={
        "desplegable-opcion" +
        (indice === resaltado ? " is-resaltada" : "") +
        (opcion.id === valor ? " is-elegida" : "")
      }
      onPointerEnter={() => setResaltado(indice)}
      onClick={() => elegir(indice)}
    >
      {opcion.nombre}
    </li>
  );

  return (
    <div className="desplegable" ref={caja}>
      <button
        type="button"
        className="select-rosa desplegable-boton"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-haspopup="listbox"
        aria-label={etiqueta}
        aria-activedescendant={abierto ? `${base}-op-${resaltado}` : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alTeclear}
      >
        {elegida?.nombre ?? "—"}
      </button>

      {abierto && (
        <ul
          id={idLista}
          ref={lista}
          role="listbox"
          className={haciaArriba ? "desplegable-lista is-arriba" : "desplegable-lista"}
          style={{ maxHeight: ALTO_MAXIMO }}
        >
          {ordenadas.map((opcion, i) => {
            /* El título del grupo se dibuja junto a su primera
               opción, como un <li> más, en vez de anidar una
               lista adentro de otra: las flechas del teclado
               recorren una sola tira de opciones. */
            const abreGrupo =
              grupos.length > 0 && opcion.grupo && ordenadas[i - 1]?.grupo !== opcion.grupo;

            if (!abreGrupo) return dibujarOpcion(opcion, i);

            return (
              <Fragment key={opcion.id}>
                <li className="desplegable-grupo" role="presentation">
                  {opcion.grupo}
                </li>
                {dibujarOpcion(opcion, i)}
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
