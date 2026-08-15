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
        {seVe ? "🙈" : "👁"}
      </button>
    </div>
  );
}
