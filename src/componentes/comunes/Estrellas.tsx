/* ==========================================================
   CALIFICAR CON ESTRELLAS
   ==========================================================
   Cinco estrellas para puntuar un libro o un disco que
   terminaste. Tocar la que ya está puesta la saca, para poder
   volver a "sin calificar" sin tener que borrar la entrada.
   ========================================================== */

interface Props {
  valor: number;
  alElegir?: (valor: number) => void;
  /* Solo para mostrar, sin poder tocarlas */
  soloLectura?: boolean;
}

export function Estrellas({ valor, alElegir, soloLectura = false }: Props) {
  const estrellas = [1, 2, 3, 4, 5];

  if (soloLectura) {
    return (
      <span className="estrellas" aria-label={`${valor} de 5`}>
        {estrellas.map((n) => (
          <span key={n} className={n <= valor ? "estrella is-on" : "estrella"}>
            {n <= valor ? "★" : "☆"}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className="estrellas" role="group" aria-label="Calificación">
      {estrellas.map((n) => (
        <button
          key={n}
          type="button"
          className={n <= valor ? "estrella is-on" : "estrella"}
          onClick={() => alElegir?.(n === valor ? 0 : n)}
          aria-label={`${n} de 5`}
          aria-pressed={n <= valor}
        >
          {n <= valor ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}
