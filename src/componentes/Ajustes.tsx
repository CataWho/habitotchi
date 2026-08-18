import { useState } from "react";
import { PRONOMBRES, cargarPerfil, guardarPerfil } from "@/lib/perfil";
import { fechaDeHoy } from "@/lib/fechas";
import {
  borrarTodoDeLaNube, cambiarContraseña, cerrarSesion, hayNubeConfigurada, usarSesion,
} from "@/lib/nube";
import { CLAVES } from "@/lib/almacenamiento";
import { useGuardado } from "@/estado/useGuardado";
import { tr, usarIdioma } from "@/lib/idioma";
import { CampoDeContraseña } from "@/componentes/comunes/CampoDeContraseña";
import { Ayuda, Panel, Select } from "@/componentes/comunes/Panel";

/* ==========================================================
   AJUSTES
   ==========================================================
   Se abre con la ruedita de la esquina. Junta todo lo que no
   es de uso diario: quién sos, tus datos y los avisos.

   ---------- SIN "EL CHEF" A PROPÓSITO ----------
   El chef con foto necesita que cada persona consiga su
   propia clave de Gemini en aistudio.google.com: un paso
   técnico que la inmensa mayoría de quien se baja la app de
   una tienda no va a hacer. Para una v1 publicada no es
   accesible, así que queda afuera hasta que haya un servidor
   propio que esconda una sola clave y reparta el uso.

   El código de la IA (src/lib/ia.ts, src/componentes/Chef.tsx)
   sigue en el repo, sin usarse, listo para ese momento. Lo
   que sí queda activo es el diccionario local de calorías
   (estimarCaloriasDeTexto), que no pide clave ni internet.
   ========================================================== */

export function Ajustes({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="chef-overlay" onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label={tr("cerrar")}>
          ✕
        </button>

        <h2 className="panel-title">{tr("ajustes")}</h2>

        <SobreVos />
        <QueMostrar />
        <CuentaEnLaNube />
        <Idioma />
        <TusDatos />
        <Privacidad />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   EL PERFIL, UNA SOLA VERDAD PARA TODO EL MODAL
   ----------------------------------------------------------
   "Sobre vos" y "Qué mostrar" editan campos distintos del
   MISMO objeto guardado, y están a diez píxeles uno del otro.

   Antes cada uno hacía useState(() => cargarPerfil()): dos
   fotos independientes del mismo objeto, sacadas en el mismo
   momento. Escribías tu nombre arriba (que guardaba la foto de
   arriba, ya con el nombre) y después tocabas el interruptor
   del ciclo abajo — que guardaba SU foto, la de antes, sin el
   nombre. El nombre recién escrito desaparecía sin ningún
   aviso.

   useGuardado resuelve exactamente esto: los dos leen la misma
   clave y se enteran cuando el otro la escribe. Salud ya lo
   usaba así para este mismo perfil; la inconsistencia estaba
   adentro del propio proyecto.
   ---------------------------------------------------------- */
function usePerfil() {
  return useGuardado(CLAVES.perfil, cargarPerfil);
}

/* ----------------------------------------------------------
   QUÉ MOSTRAR
   ----------------------------------------------------------
   Lo que cada persona elige ver o no. Vive acá y no en la
   pestaña de Salud porque es una preferencia que se toca una
   vez y no se mira más — mezclarla con los registros del día
   a día solo ocupaba lugar ahí.
   ---------------------------------------------------------- */
function QueMostrar() {
  const perfil = usePerfil();

  const cambiar = (campo: string, valor: boolean) => {
    guardarPerfil({ ...perfil, [campo]: valor });
  };

  return (
    <Panel titulo={tr("queMostrar")}>
      <label className="campo-fila">
        <input
          type="checkbox"
          checked={perfil.cicloActivado !== false}
          onChange={(e) => cambiar("cicloActivado", e.target.checked)}
        />
        <span>{tr("mostrarCiclo")}</span>
      </label>

      <Ayuda>
        Si lo apagás, el panel desaparece de la pestaña de Salud. Lo que ya hayas anotado no
        se borra: vuelve a aparecer si lo prendés otra vez.
      </Ayuda>
    </Panel>
  );
}

function SobreVos() {
  const perfil = usePerfil();

  const cambiar = (campo: string, valor: string | number) => {
    guardarPerfil({ ...perfil, [campo]: valor });
  };

  return (
    <Panel titulo={tr("sobreVos")}>
      <div className="campo-fila">
        <input
          className="input-rosa"
          value={perfil.nombre ?? ""}
          placeholder={tr("comoTeLlamas")}
          maxLength={30}
          onChange={(e) => cambiar("nombre", e.target.value)}
        />
      </div>

      <div className="campo-fila">
        <input
          className="input-rosa"
          type="number"
          min={1}
          max={120}
          value={perfil.edad ?? ""}
          placeholder={tr("anios")}
          onChange={(e) => cambiar("edad", Number(e.target.value))}
        />

        {/* La opción vacía va primero y a propósito: nadie
            está obligada a elegir pronombre. */}
        <Select
          valor={perfil.pronombre ?? ""}
          alCambiar={(v) => cambiar("pronombre", v)}
          etiqueta={tr("pronombre")}
          opciones={[
            { id: "", nombre: "—" },
            ...PRONOMBRES.map((p: any) => ({ id: p.id, nombre: tr(p.clave) })),
          ]}
        />
      </div>

      <div className="campo-fila">
        <input
          className="input-rosa"
          type="number"
          min={1}
          step={0.1}
          value={perfil.pesoKg ?? ""}
          placeholder={tr("pesoKg")}
          onChange={(e) => cambiar("pesoKg", Number(e.target.value))}
        />
        <input
          className="input-rosa"
          type="number"
          min={1}
          value={perfil.alturaCm ?? ""}
          placeholder={tr("alturaCm")}
          onChange={(e) => cambiar("alturaCm", Number(e.target.value))}
        />
      </div>

      <Ayuda>
        El peso se usa para estimar las calorías del ejercicio, y se guarda en tu cuenta
        junto con el resto de tus datos.
      </Ayuda>
    </Panel>
  );
}

/* ----------------------------------------------------------
   TU CUENTA
   ----------------------------------------------------------
   Los formularios de entrar y registrarse ya no viven acá:
   están en el portón de ingreso, porque ahora hacen falta
   antes de poder usar la app. Lo que queda es lo de después:
   con qué mail estás, cambiar la contraseña y salir.
   ---------------------------------------------------------- */
function CuentaEnLaNube() {
  const { sesion } = usarSesion();

  const [contraseña, setContraseña] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState("");

  if (!hayNubeConfigurada() || !sesion) return null;

  const guardarContraseña = async () => {
    setTrabajando(true);
    setAviso("");

    try {
      await cambiarContraseña(contraseña);
      setAviso(tr("contrasenaCambiada"));
      setContraseña("");
      setCambiando(false);
    } catch (e: any) {
      setAviso(e?.message ?? tr("noSePudoCambiarContrasena"));
    } finally {
      setTrabajando(false);
    }
  };

  const salir = async () => {
    /* Al cerrar sesión se recarga: sin sesión, App.tsx muestra
       el portón, y recargar es la forma más limpia de volver
       ahí desde adentro de un modal abierto. */
    await cerrarSesion();
    location.reload();
  };

  return (
    <Panel titulo={tr("tuCuenta")}>
      <Ayuda>{tr("conectadaComo", { email: sesion.email })}</Ayuda>

      {cambiando ? (
        <>
          <div className="campo-fila">
            <CampoDeContraseña
              valor={contraseña}
              alCambiar={setContraseña}
              marcador={tr("contrasenaNueva")}
              autoComplete="new-password"
              alApretarEnter={() => contraseña.length >= 6 && guardarContraseña()}
            />
            <button
              type="button"
              className="habit-btn"
              disabled={trabajando || contraseña.length < 6}
              onClick={guardarContraseña}
            >
              Guardar
            </button>
          </div>
          {contraseña.length > 0 && contraseña.length < 6 && (
            <Ayuda>{tr("minimoSeisCaracteres")}</Ayuda>
          )}
        </>
      ) : (
        <div className="campo-fila">
          <button type="button" className="habit-btn" onClick={() => setCambiando(true)}>
            {tr("cambiarContrasena")}
          </button>
        </div>
      )}

      <div className="campo-fila">
        <button type="button" className="habit-btn habit-btn--restar" onClick={salir}>
          {tr("cerrarSesion")}
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}

      <Ayuda>
        Todo lo que anotás se guarda en tu cuenta, así que lo vas a encontrar igual si
        entrás desde otro dispositivo.
      </Ayuda>
    </Panel>
  );
}

/* ----------------------------------------------------------
   PRIVACIDAD
   ----------------------------------------------------------
   Qué se hace con los datos de cada quien. La misma política
   que hay que aceptar al crear la cuenta, accesible después
   también: aceptar algo una vez y no poder volver a leerlo
   sería bastante inútil.
   ---------------------------------------------------------- */
function Privacidad() {
  const { t } = usarIdioma();

  return (
    <Panel titulo={t("privacidad")}>
      <div className="campo-fila">
        <a className="habit-btn" href="/privacidad.html" target="_blank" rel="noopener">
          {t("verPolitica")}
        </a>
      </div>

      {/* La política queda en español aunque la app esté en
          inglés, y conviene avisarlo para que no parezca un
          olvido: es un documento legal que cita la ley
          argentina, y traducirlo mal sería peor. */}
      <Ayuda>{t("notaPolitica")}</Ayuda>
    </Panel>
  );
}

/* ----------------------------------------------------------
   EL IDIOMA
   ----------------------------------------------------------
   Arranca según el idioma del dispositivo; acá se puede
   cambiar a mano. La preferencia NO se sincroniza con la
   cuenta a propósito: es de este aparato, como el sonido.
   Que el idioma elegido en la compu te cambie el del celular
   sería un bug, no una función.
   ---------------------------------------------------------- */
function Idioma() {
  const { idioma, cambiarIdioma, t } = usarIdioma();

  return (
    <Panel titulo={t("idioma")}>
      <div className="campo-fila">
        <Select
          valor={idioma}
          alCambiar={(v) => cambiarIdioma(v as "es" | "en")}
          etiqueta={t("idioma")}
          opciones={[
            { id: "es", nombre: "Español" },
            { id: "en", nombre: "English" },
          ]}
        />
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------
   TUS DATOS
   ----------------------------------------------------------
   Descargar una copia y borrar todo. Importante tenerlo: como
   la app guarda en el navegador, limpiar el historial se lleva
   puesto todo lo que anotaste.
   ---------------------------------------------------------- */
function TusDatos() {
  const [aviso, setAviso] = useState("");

  const exportar = () => {
    const todo: Record<string, string> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.startsWith("habitotchi_")) {
        todo[clave] = localStorage.getItem(clave) ?? "";
      }
    }

    const blob = new Blob([JSON.stringify(todo, null, 2)], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `habitotchi-${fechaDeHoy()}.json`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);

    setAviso(tr("copiaDescargada"));
  };

  const importar = (archivo: File) => {
    const lector = new FileReader();

    lector.onload = () => {
      try {
        const datos = JSON.parse(String(lector.result));
        for (const [clave, valor] of Object.entries(datos)) {
          if (clave.startsWith("habitotchi_")) localStorage.setItem(clave, String(valor));
        }
        setAviso(tr("datosRestaurados"));
      } catch {
        setAviso(tr("archivoInvalido"));
      }
    };

    lector.readAsText(archivo);
  };

  const borrarTodo = async () => {
    /* Doble confirmación: esto no se puede deshacer y se lleva
       puesto todo el historial. */
    if (!window.confirm(tr("confirmarBorrar1"))) return;
    if (!window.confirm(tr("confirmarBorrar2"))) return;

    setAviso(tr("borrando"));

    /* La nube PRIMERO. Si se borrara el disco antes y después
       fallara la conexión, quedaría lo peor de los dos mundos:
       la persona ve todo vacío y cree que se borró, pero los
       datos siguen en la cuenta y vuelven al entrar de nuevo.
       Al revés, si falla, no se borra nada y se avisa. */
    try {
      await borrarTodoDeLaNube();
    } catch (e: any) {
      setAviso(e?.message ?? tr("noSePudoBorrarNube"));
      return;
    }

    const claves: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.startsWith("habitotchi_")) claves.push(clave);
    }
    claves.forEach((c) => localStorage.removeItem(c));

    location.reload();
  };

  return (
    <Panel titulo={tr("tusDatos")}>
      <div className="campo-fila">
        <button type="button" className="habit-btn" onClick={exportar}>
          {tr("descargarMisDatos")}
        </button>
      </div>

      <div className="campo-fila">
        <label className="habit-btn" style={{ cursor: "pointer" }}>
          {tr("restaurarCopia")}
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) importar(archivo);
            }}
          />
        </label>
      </div>

      <div className="campo-fila">
        <button type="button" className="habit-btn habit-btn--restar" onClick={borrarTodo}>
          {tr("borrarTodo")}
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}

      <Ayuda>
        Todo se guarda <b>en tu cuenta</b>, así lo encontrás igual desde otro dispositivo.
        La copia descargada sirve para tenerlo también fuera de la app.
      </Ayuda>
    </Panel>
  );
}
