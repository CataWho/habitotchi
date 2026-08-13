import { useEffect, useState } from "react";
import type { Etapa, IdMascota } from "@/tipos";
import { FANTASMA } from "@/datos/fantasma";
import { Mascota, TAM_PIXEL_MASCOTA } from "./Mascota";

/* ==========================================================
   LA DESPEDIDA
   ==========================================================
   Pasa una sola vez: justo cuando registramos la muerte. Si
   volvés a abrir la app más tarde ya no se repite, queda
   directamente la tumba.

   Cuatro momentos: la mascota con los ojitos en equis, se
   cae, sube un fantasmita, y recién ahí aparece la tumba.

   Los tiempos viven acá y no en el CSS porque son los que
   deciden qué se muestra; el CSS solo hace el movimiento.
   ========================================================== */

const CAE_A_LOS = 900;
const FANTASMA_A_LOS = 2000;
const TUMBA_A_LOS = 4200;

type Momento = "equis" | "cayendo" | "fantasma" | "tumba";

interface Props {
  mascota: IdMascota;
  etapa: Etapa;
  accesorio: string | null;
  comoSeLlamaba: string;
  onTerminar: () => void;
  onDecir: (mensaje: string) => void;
}

export function Despedida({
  mascota,
  etapa,
  accesorio,
  comoSeLlamaba,
  onTerminar,
  onDecir,
}: Props) {
  const [momento, setMomento] = useState<Momento>("equis");

  useEffect(() => {
    /* Quien pidió menos movimiento no ve la animación: va
       derecho a la tumba y al mensaje. */
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (sinMovimiento) {
      setMomento("tumba");
      onDecir(`${comoSeLlamaba} descansa. Podés elegir una mascota nueva.`);
      onTerminar();
      return;
    }

    onDecir("...");

    const relojes = [
      window.setTimeout(() => setMomento("cayendo"), CAE_A_LOS),
      window.setTimeout(() => {
        setMomento("fantasma");
        onDecir(`Chau, ${comoSeLlamaba}.`);
      }, FANTASMA_A_LOS),
      window.setTimeout(() => {
        setMomento("tumba");
        onDecir(`${comoSeLlamaba} descansa. Podés elegir una mascota nueva.`);
        onTerminar();
      }, TUMBA_A_LOS),
    ];

    /* Si te vas de la pantalla a mitad de la animación, hay
       que apagar los relojes: si no, disparan sobre un
       componente que ya no existe. */
    return () => relojes.forEach(window.clearTimeout);
  }, [comoSeLlamaba, onDecir, onTerminar]);

  if (momento === "equis" || momento === "cayendo") {
    return (
      <Mascota
        mascota={mascota}
        etapa={etapa}
        animo="muerta"
        accesorio={accesorio}
        className={momento === "cayendo" ? "pet pet--cayendo" : "pet"}
      />
    );
  }

  if (momento === "fantasma") return <Fantasma />;

  return <Tumba brotando />;
}

/* El fantasmita, con el mismo sistema de pixeles que las
   mascotas pero sin ánimo ni accesorios. */
export function Fantasma({ tamPixel = TAM_PIXEL_MASCOTA }: { tamPixel?: number }) {
  const columnas = FANTASMA.pixeles[0]?.length ?? 0;

  return (
    <div
      className="pet-fantasma"
      style={{ gridTemplateColumns: `repeat(${columnas}, ${tamPixel}px)` }}
      role="img"
      aria-label="Un fantasmita que sube"
    >
      {FANTASMA.pixeles.flatMap((fila, y) =>
        [...fila].map((letra, x) => (
          <div
            key={`${y}-${x}`}
            className="px"
            style={{
              width: tamPixel,
              height: tamPixel,
              backgroundColor: FANTASMA.colores[letra] ?? "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}

export function Tumba({ brotando = false }: { brotando?: boolean }) {
  return (
    <div
      className={brotando ? "pet-tumba pet-tumba--brotando" : "pet-tumba"}
      role="img"
      aria-label="Una tumba que dice R.I.P."
    />
  );
}
