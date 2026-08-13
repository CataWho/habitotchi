import type { ReactNode } from "react";

/* ==========================================================
   UNA PÁGINA DEL DESLIZABLE
   ==========================================================
   El envoltorio de cada pestaña, con su título arriba.

   Está acá y no repetido en cada pantalla para que el título
   no se pueda olvidar: si una pantalla no lo pone, se nota al
   toque porque el nombre no aparece.
   ========================================================== */

interface Props {
  nombre: string;
  /* Hogar no lleva título: ahí manda la mascota, y un
     encabezado le robaría espacio a la pantallita. */
  sinTitulo?: boolean;
  children: ReactNode;
}

export function Pagina({ nombre, sinTitulo = false, children }: Props) {
  return (
    <section className="page" data-page-name={nombre}>
      {!sinTitulo && <h1 className="page-heading">{nombre}</h1>}
      {children}
    </section>
  );
}
