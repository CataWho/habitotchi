import { useMemo } from "react";
import { tr } from "@/lib/idioma";
import type { Animo, Etapa, IdMascota } from "@/tipos";
import { MASCOTAS } from "@/datos/mascotas";
import { CARAS } from "@/datos/caras";
import { ACCESORIOS } from "@/datos/accesorios";

/* De qué tamaño se dibuja cada pixelito de la mascota grande,
   la de la pantalla principal. Los dibujos son de 12x11
   (bebé), 14x15 (joven) y 16x19 (adulta), así que con 8px la
   adulta ocupa 128x152: se ve bien en la pantallita sin
   comerse el espacio del mensaje de abajo.

   Los dibujitos chicos (el selector, la tienda) pasan su
   propio tamaño: ahí lo que importa es que entren en la
   tarjeta. */
export const TAM_PIXEL_MASCOTA = 8;
export const TAM_PIXEL_MINI = 3;

interface Props {
  mascota: IdMascota;
  etapa: Etapa;
  animo: Animo;
  tamPixel?: number;
  accesorio?: string | null;
  className?: string;
}

/* ----------------------------------------------------------
   ARMAR LA GRILLA
   ----------------------------------------------------------
   Tres capas, en este orden:
     1. el dibujo de la mascota, según su etapa
     2. la carita del ánimo, estampada donde diga "cara"
     3. el accesorio, posicionado RELATIVO a la cara

   Que el accesorio se ubique respecto de la cara y no del
   dibujo es lo que hace que el mismo moño quede bien en una
   bebé y en una adulta sin calcular nada aparte.
   ---------------------------------------------------------- */
function armarGrilla(
  idMascota: IdMascota,
  etapa: Etapa,
  animo: Animo,
  idAccesorio?: string | null
): { grilla: string[][]; paleta: Record<string, string> } {
  const mascota = MASCOTAS[idMascota];

  if (!mascota) return { grilla: [], paleta: {} };

  const datos = mascota.etapas[etapa];
  const grilla = datos.pixeles.map((fila) => fila.split(""));
  let paleta = mascota.colores;

  /* 2 · la carita */
  const cara = CARAS[animo];

  for (let f = 0; f < cara.length; f++) {
    const filaCara = cara[f] ?? "";

    for (let c = 0; c < filaCara.length; c++) {
      const letra = filaCara[c];
      if (letra === "." || letra === undefined) continue;

      const fila = grilla[datos.cara.y + f];
      if (fila) fila[datos.cara.x + c] = letra;
    }
  }

  /* 3 · el accesorio */
  const accesorio = idAccesorio ? ACCESORIOS[idAccesorio] : undefined;

  if (accesorio) {
    paleta = { ...mascota.colores, ...accesorio.colores };

    const desdeX = datos.cara.x + accesorio.desdeCara.x;
    const desdeY = datos.cara.y + accesorio.desdeCara.y;

    for (let f = 0; f < accesorio.pixeles.length; f++) {
      const filaAcc = accesorio.pixeles[f] ?? "";

      for (let c = 0; c < filaAcc.length; c++) {
        const letra = filaAcc[c];
        if (letra === "." || letra === undefined) continue;

        /* Si se sale del dibujo, lo recortamos en vez de
           romper todo. */
        const fila = grilla[desdeY + f];
        if (!fila || desdeX + c < 0 || desdeX + c >= fila.length) continue;

        fila[desdeX + c] = letra;
      }
    }
  }

  return { grilla, paleta };
}

export function Mascota({
  mascota,
  etapa,
  animo,
  tamPixel = TAM_PIXEL_MASCOTA,
  accesorio = null,
  className = "pet",
}: Props) {
  const { grilla, paleta } = useMemo(
    () => armarGrilla(mascota, etapa, animo, accesorio),
    [mascota, etapa, animo, accesorio]
  );

  const columnas = grilla[0]?.length ?? 0;

  return (
    <div
      className={className}
      style={{ gridTemplateColumns: `repeat(${columnas}, ${tamPixel}px)` }}
      role="img"
      aria-label={`${tr(MASCOTAS[mascota]?.clave ?? "") || "mascota"}, ${etapa}, ${animo}`}
    >
      {grilla.flatMap((fila, y) =>
        fila.map((letra, x) => (
          <div
            key={`${y}-${x}`}
            className="px"
            style={{
              width: tamPixel,
              height: tamPixel,
              backgroundColor: paleta[letra] ?? "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}
