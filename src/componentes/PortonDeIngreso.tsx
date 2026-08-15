import { useState } from "react";
import {
  cambiarContraseña, crearCuenta, guardarSiQuiereQueLoRecuerden, hayDatosLocales,
  iniciarSesion, pedirRecuperarContraseña, quiereQueLoRecuerden,
  subirDatosLocales, terminarRecuperacion,
} from "@/lib/nube";
import { Aparato, Pantalla } from "@/componentes/aparato/Aparato";
import { CampoDeContraseña } from "@/componentes/comunes/CampoDeContraseña";

/* ==========================================================
   EL PORTÓN DE INGRESO
   ==========================================================
   Lo primero que ve alguien que abre Habitotchi sin sesión.
   Hasta que no entre, no hay app.

   ---------- POR QUÉ ADENTRO DEL APARATO ----------
   Usa la misma carcasa y la misma pantallita verde que el
   resto: entrar tiene que sentirse parte de Habitotchi, no un
   formulario pegado adelante. Además así hereda gratis el
   escalado a la pantalla del celular y todas las clases de
   estilo que ya existen.

   ---------- CUATRO ESTADOS, UN SOLO COMPONENTE ----------
   entrar · registrarse · pedir recuperación · contraseña nueva
   Son variaciones del mismo formulario (mail + contraseña),
   así que partirlos en cuatro archivos sería repetir el mismo
   armazón cuatro veces.
   ========================================================== */

type Modo = "entrar" | "crear" | "recuperar";

export function PortonDeIngreso({ recuperandoContraseña }: { recuperandoContraseña: boolean }) {
  return (
    <>
      <Aparato>
        <h1 className="brand">HABITOTCHI</h1>

        <Pantalla>
          <div className="page porton">
            {recuperandoContraseña ? <ContraseñaNueva /> : <Formulario />}
          </div>
        </Pantalla>

        {/* El hueco donde en la app van los botones A/B/C y los
            puntitos. Sin esto la pantalla verde crece para
            llenar ese lugar y sus esquinas de abajo se meten
            en la curva de la carcasa. */}
        <div className="porton-pie" aria-hidden="true" />
      </Aparato>
    </>
  );
}

/* ----------------------------------------------------------
   PONER UNA CONTRASEÑA NUEVA
   ----------------------------------------------------------
   Se muestra cuando la persona vuelve del link que le llegó
   por mail. En ese momento Supabase ya la dejó entrar con un
   permiso temporal, así que solo falta que elija la clave.
   ---------------------------------------------------------- */
function ContraseñaNueva() {
  const [contraseña, setContraseña] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setTrabajando(true);
    setError("");

    try {
      await cambiarContraseña(contraseña);
      terminarRecuperacion();
      location.reload();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cambiar la contraseña.");
      setTrabajando(false);
    }
  };

  return (
    <div className="porton-caja">
      <h2 className="porton-titulo">Elegí una contraseña nueva</h2>

      <CampoDeContraseña
        valor={contraseña}
        alCambiar={setContraseña}
        marcador="contraseña nueva"
        autoComplete="new-password"
        alApretarEnter={() => contraseña.length >= 6 && guardar()}
      />

      <button
        type="button"
        className="habit-btn"
        disabled={trabajando || contraseña.length < 6}
        onClick={guardar}
      >
        Guardar
      </button>

      {contraseña.length > 0 && contraseña.length < 6 && (
        <p className="ayuda-chica">Tiene que tener al menos 6 caracteres.</p>
      )}

      {error && <p className="porton-error">{error}</p>}
    </div>
  );
}

function Formulario() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [recordarme, setRecordarme] = useState(() => quiereQueLoRecuerden());
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const entrar = async () => {
    guardarSiQuiereQueLoRecuerden(recordarme);
    await iniciarSesion(email, contraseña);
    /* No hace falta hacer nada más: usarSesion() en App.tsx
       escucha el cambio de sesión y cambia la pantalla sola. */
  };

  const crear = async () => {
    guardarSiQuiereQueLoRecuerden(recordarme);
    const { necesitaConfirmarMail } = await crearCuenta(email, contraseña);

    if (necesitaConfirmarMail) {
      setAviso(
        `Te mandamos un mail a ${email}. Tocá el link que trae y ya podés entrar.`
      );
      return;
    }

    /* Si este aparato ya tenía datos de antes (de cuando la
       app se usaba sin cuenta), se ofrecen como punto de
       partida en vez de perderlos. */
    if (hayDatosLocales()) {
      const subir = window.confirm(
        "¿Querés que lo que ya tenías anotado en este dispositivo pase a tu cuenta nueva?"
      );
      if (subir) await subirDatosLocales();
    }
  };

  const recuperar = async () => {
    await pedirRecuperarContraseña(email);
    setAviso(
      "Si hay una cuenta con ese mail, te va a llegar un link para poner una contraseña nueva."
    );
  };

  const enviar = async () => {
    setTrabajando(true);
    setError("");
    setAviso("");

    try {
      if (modo === "entrar") await entrar();
      else if (modo === "crear") await crear();
      else await recuperar();
    } catch (e: any) {
      setError(e?.message ?? "Algo salió mal.");
    } finally {
      setTrabajando(false);
    }
  };

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setError("");
    setAviso("");
  };

  /* Sin mail no se puede hacer nada; la contraseña no hace
     falta para recuperar, y los términos solo para registrarse. */
  const listoParaEnviar =
    email.length > 0 &&
    (modo === "recuperar" || contraseña.length > 0) &&
    (modo !== "crear" || aceptaTerminos);

  return (
    <div className="porton-caja">
      <h2 className="porton-titulo">
        {modo === "entrar" && "Entrá a tu cuenta"}
        {modo === "crear" && "Creá tu cuenta"}
        {modo === "recuperar" && "Recuperar contraseña"}
      </h2>

      <input
        className="input-rosa"
        type="email"
        value={email}
        placeholder="tu mail"
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      {modo !== "recuperar" && (
        <CampoDeContraseña
          valor={contraseña}
          alCambiar={setContraseña}
          autoComplete={modo === "crear" ? "new-password" : "current-password"}
          alApretarEnter={() => listoParaEnviar && enviar()}
        />
      )}

      {modo !== "recuperar" && (
        <label className="porton-check">
          <input
            type="checkbox"
            checked={recordarme}
            onChange={(e) => setRecordarme(e.target.checked)}
          />
          <span>Mantener la sesión iniciada</span>
        </label>
      )}

      {modo === "crear" && (
        <label className="porton-check">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
          />
          <span>
            Acepto la{" "}
            <a href="/privacidad.html" target="_blank" rel="noopener">
              política de privacidad
            </a>
          </span>
        </label>
      )}

      <button type="button" className="habit-btn" disabled={trabajando || !listoParaEnviar} onClick={enviar}>
        {modo === "entrar" && "Entrar"}
        {modo === "crear" && "Crear cuenta"}
        {modo === "recuperar" && "Enviarme el link"}
      </button>

      {error && <p className="porton-error">{error}</p>}
      {aviso && <p className="ayuda-chica">{aviso}</p>}

      <div className="porton-links">
        {modo === "entrar" && (
          <>
            <button type="button" className="porton-link" onClick={() => cambiarModo("crear")}>
              Crear una cuenta
            </button>
            <button type="button" className="porton-link" onClick={() => cambiarModo("recuperar")}>
              Olvidé mi contraseña
            </button>
          </>
        )}

        {modo !== "entrar" && (
          <button type="button" className="porton-link" onClick={() => cambiarModo("entrar")}>
            Ya tengo cuenta
          </button>
        )}
      </div>
    </div>
  );
}
