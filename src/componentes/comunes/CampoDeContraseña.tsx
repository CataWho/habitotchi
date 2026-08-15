import { useState } from "react";

/* ==========================================================
   EL CAMPO DE CONTRASEÑA, CON OJITO
   ==========================================================
   Un campo de contraseña con un botón para verla. Escribir a
   ciegas en el teclado de un celular es justo donde más se
   equivoca una, y si no podés mirar lo que escribiste el
   único camino es borrar todo y probar de nuevo.

   Vive en comunes/ y no adentro del portón porque el mismo
   campo se usa en tres lugares: entrar, registrarse y
   cambiar la contraseña desde Ajustes.

   ---------- ARRANCA OCULTA, SIEMPRE ----------
   Mostrarla es algo que se pide a propósito, no el estado por
   defecto: puede haber alguien mirando la pantalla al lado.
   Y como el estado vive acá adentro, cada campo se acuerda
   solo de si está mostrando o no, sin que quien lo usa tenga
   que llevar esa cuenta.
   ========================================================== */

/* ----------------------------------------------------------
   EL OJITO
   ----------------------------------------------------------
   Dibujado a mano y no con un emoji: los emoji vienen con su
   color propio y en la pantallita verde quedan como una
   calcomanía pegada. Este usa currentColor, así que toma la
   tinta del fondo de pantalla que tengas puesto, igual que
   todo lo demás.

   Abierto = la contraseña se está viendo.
   Tachado = está oculta.
   ---------------------------------------------------------- */
function Ojo({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 8s2.6-4.6 7-4.6S15 8 15 8s-2.6 4.6-7 4.6S1 8 1 8z" />
      <circle cx="8" cy="8" r="2" />

      {!abierto && <path d="M3 13 L13 3" />}
    </svg>
  );
}

export function CampoDeContraseña({
  valor,
  alCambiar,
  marcador = "contraseña",
  autoComplete,
  alApretarEnter,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  marcador?: string;
  autoComplete?: string;
  alApretarEnter?: () => void;
}) {
  const [seVe, setSeVe] = useState(false);

  return (
    <div className="campo-contraseña">
      <input
        className="input-rosa"
        type={seVe ? "text" : "password"}
        value={valor}
        placeholder={marcador}
        autoComplete={autoComplete}
        onChange={(e) => alCambiar(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && alApretarEnter?.()}
      />

      <button
        type="button"
        className="campo-contraseña-ojo"
        onClick={() => setSeVe(!seVe)}
        /* El texto cambia con el estado: un lector de pantalla
           tiene que poder saber si ahora mismo se está viendo
           o no, no solo que existe un botón. */
        aria-label={seVe ? "Ocultar la contraseña" : "Mostrar la contraseña"}
        aria-pressed={seVe}
      >
        <Ojo abierto={seVe} />
      </button>
    </div>
  );
}
