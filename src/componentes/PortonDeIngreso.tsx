import { useState } from "react";
import { tr } from "@/lib/idioma";
import {
  cambiarContraseña, crearCuenta, guardarSiQuiereQueLoRecuerden, hayDatosLocales,
  iniciarSesion, pedirRecuperarContraseña, quiereQueLoRecuerden,
  reservarDatosLocalesParaLaCuentaNueva, soltarReserva,
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
      setError(e?.message ?? tr("noSePudoCambiarContrasena"));
      setTrabajando(false);
    }
  };

  return (
    <div className="porton-caja">
      <h2 className="porton-titulo">{tr("elegiContrasenaNueva")}</h2>

      <CampoDeContraseña
        valor={contraseña}
        alCambiar={setContraseña}
        marcador={tr("contrasenaNueva")}
        autoComplete="new-password"
        alApretarEnter={() => contraseña.length >= 6 && guardar()}
      />

      <button
        type="button"
        className="habit-btn"
        disabled={trabajando || contraseña.length < 6}
        onClick={guardar}
      >
        {tr("guardar")}
      </button>

      {contraseña.length > 0 && contraseña.length < 6 && (
        <p className="ayuda-chica">{tr("minimoSeisCaracteres")}</p>
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
    /* La pregunta va ANTES de crear la cuenta, no después: en
       cuanto la sesión existe, la preparación automática se
       dispara sola y borraría el disco para bajar una cuenta
       todavía vacía. Ver el comentario de la reserva en
       lib/nube.ts. */
    const subir =
      hayDatosLocales() &&
      window.confirm(
        tr("migrarDatos")
      );

    if (subir) reservarDatosLocalesParaLaCuentaNueva();

    guardarSiQuiereQueLoRecuerden(recordarme);

    try {
      const { necesitaConfirmarMail } = await crearCuenta(email, contraseña);

      if (necesitaConfirmarMail) {
        /* Sin sesión todavía, así que la reserva no la va a usar
           nadie: se suelta para que no quede pegada esperando a
           un login futuro que quizás sea de otra persona. */
        soltarReserva();
        setAviso(tr("revisaTuMail", { email }));
        return;
      }

      if (subir) await subirDatosLocales();
    } catch (e) {
      soltarReserva();
      throw e;
    }
  };

  const recuperar = async () => {
    await pedirRecuperarContraseña(email);
    setAviso(
      tr("linkDeRecuperacion")
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
      setError(e?.message ?? tr("algoSalioMal"));
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
        {modo === "entrar" && tr("entraATuCuenta")}
        {modo === "crear" && tr("crearUnaCuenta")}
        {modo === "recuperar" && tr("recuperarContrasena")}
      </h2>

      <input
        className="input-rosa"
        type="email"
        value={email}
        placeholder={tr("tuMail")}
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
          <span>{tr("mantenerSesion")}</span>
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
            {tr("aceptoPolitica")}{" "}
            <a href="/privacidad.html" target="_blank" rel="noopener">
              {tr("laPoliticaDePrivacidad")}
            </a>
          </span>
        </label>
      )}

      {/* Solo una vez que ya completó mail y contraseña: no
         tiene sentido recordarle los términos antes de que
         empiece a llenar el formulario. Mismo criterio que ya
         usa el aviso de "al menos 6 caracteres" más abajo. */}
      {modo === "crear" && !aceptaTerminos && email.length > 0 && contraseña.length > 0 && (
        <p className="ayuda-chica">{tr("debeAceptarPolitica")}</p>
      )}

      <button type="button" className="habit-btn" disabled={trabajando || !listoParaEnviar} onClick={enviar}>
        {modo === "entrar" && tr("entrar")}
        {modo === "crear" && tr("crearCuenta")}
        {modo === "recuperar" && tr("enviarmeElLink")}
      </button>

      {error && <p className="porton-error">{error}</p>}
      {aviso && <p className="ayuda-chica">{aviso}</p>}

      <div className="porton-links">
        {modo === "entrar" && (
          <>
            <button type="button" className="porton-link" onClick={() => cambiarModo("crear")}>
              {tr("crearUnaCuenta")}
            </button>
            <button type="button" className="porton-link" onClick={() => cambiarModo("recuperar")}>
              {tr("olvideMiContrasena")}
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
