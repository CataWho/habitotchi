/* ==========================================================
   DIBUJAR UNA GRILLA DE PIXELES
   ==========================================================
   El mismo sistema que usan las mascotas, para todo lo demás
   que también está dibujado a mano: el chef, las caritas de
   ánimo, el fantasmita.

   Estaba repetido en tres lugares con pequeñas diferencias.
   Acá queda uno solo.
   ========================================================== */

interface Props {
  pixeles: string[];
  colores: Record<string, string>;
  tam?: number;
  className?: string;
  etiqueta?: string;
}

export function Pixeles({ pixeles, colores, tam = 4, className, etiqueta }: Props) {
  const columnas = pixeles[0]?.length ?? 0;

  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columnas}, ${tam}px)`, lineHeight: 0 }}
      role={etiqueta ? "img" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      {pixeles.flatMap((fila, y) =>
        [...fila].map((letra, x) => (
          <div
            key={`${y}-${x}`}
            style={{ width: tam, height: tam, backgroundColor: colores[letra] ?? "transparent" }}
          />
        ))
      )}
    </div>
  );
}
