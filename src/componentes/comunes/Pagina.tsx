import type { ReactNode } from "react";
import { tr } from "@/lib/idioma";

/* ==========================================================
   UNA PÁGINA DEL DESLIZABLE
   ==========================================================
   El envoltorio de cada pestaña, con su título arriba.

   Está acá y no repetido en cada pantalla para que el título
   no se pueda olvidar: si una pantalla no lo pone, se nota al
   toque porque el nombre no aparece.

   Recibe la CLAVE del diccionario, no el texto: así el título
   acompaña el idioma sin que cada pantalla tenga que
   acordarse de traducirlo.
   ========================================================== */

interface Props {
  clave: string;
  /* Hogar no lleva título: ahí manda la mascota, y un
     encabezado le robaría espacio a la pantallita. */
  sinTitulo?: boolean;
  children: ReactNode;
}

export function Pagina({ clave, sinTitulo = false, children }: Props) {
  const nombre = tr(clave);

  return (
    /* data-page-name guarda la CLAVE y no el texto traducido:
       es un gancho para las pruebas, y tiene que decir siempre
       lo mismo esté la app en el idioma que esté. */
    <section className="page" data-page-name={clave}>
      {!sinTitulo && <h1 className="page-heading">{nombre}</h1>}
      {children}
    </section>
  );
}
