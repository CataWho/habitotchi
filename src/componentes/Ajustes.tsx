import { useState } from "react";
import { PRONOMBRES, cargarPerfil, guardarPerfil } from "@/lib/perfil";
import { fechaDeHoy } from "@/lib/fechas";
import { cambiarContraseña, cerrarSesion, hayNubeConfigurada, usarSesion } from "@/lib/nube";
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
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>

        <h2 className="panel-title">Ajustes</h2>

        <SobreVos />
        <QueMostrar />
        <CuentaEnLaNube />
        <TusDatos />
        <Privacidad />
      </div>
    </div>
  );
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
  const [perfil, setPerfil] = useState(() => cargarPerfil());

  const cambiar = (campo: string, valor: boolean) => {
    const nuevo = { ...perfil, [campo]: valor };
    guardarPerfil(nuevo);
    setPerfil(nuevo);
  };

  return (
    <Panel titulo="Qué mostrar">
      <label className="campo-fila">
        <input
          type="checkbox"
          checked={perfil.cicloActivado !== false}
          onChange={(e) => cambiar("cicloActivado", e.target.checked)}
        />
        <span>Registro de ciclo menstrual, en Salud</span>
      </label>

      <Ayuda>
        Si lo apagás, el panel desaparece de la pestaña de Salud. Lo que ya hayas anotado no
        se borra: vuelve a aparecer si lo prendés otra vez.
      </Ayuda>
    </Panel>
  );
}

function SobreVos() {
  const [perfil, setPerfil] = useState(() => cargarPerfil());

  const cambiar = (campo: string, valor: string | number) => {
    const nuevo = { ...perfil, [campo]: valor };
    guardarPerfil(nuevo);
    setPerfil(nuevo);
  };

  return (
    <Panel titulo="Sobre vos">
      <div className="campo-fila">
        <input
          className="input-rosa"
          value={perfil.nombre ?? ""}
          placeholder="¿Cómo te llamás?"
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
          placeholder="años"
          onChange={(e) => cambiar("edad", Number(e.target.value))}
        />

        {/* La opción vacía va primero y a propósito: nadie
            está obligada a elegir pronombre. */}
        <Select
          valor={perfil.pronombre ?? ""}
          alCambiar={(v) => cambiar("pronombre", v)}
          etiqueta="Pronombre"
          opciones={[
            { id: "", nombre: "—" },
            ...PRONOMBRES.map((p: any) => ({ id: p.id, nombre: p.nombre })),
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
          placeholder="peso (kg)"
          onChange={(e) => cambiar("pesoKg", Number(e.target.value))}
        />
        <input
          className="input-rosa"
          type="number"
          min={1}
          value={perfil.alturaCm ?? ""}
          placeholder="altura (cm)"
          onChange={(e) => cambiar("alturaCm", Number(e.target.value))}
        />
      </div>

      <Ayuda>
        El peso se usa para estimar las calorías del ejercicio. No se manda a ningún lado.
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
      setAviso("Listo, contraseña cambiada.");
      setContraseña("");
      setCambiando(false);
    } catch (e: any) {
      setAviso(e?.message ?? "No se pudo cambiar la contraseña.");
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
    <Panel titulo="Tu cuenta">
      <Ayuda>Tu cuenta: {sesion.email}</Ayuda>

      {cambiando ? (
        <>
          <div className="campo-fila">
            <CampoDeContraseña
              valor={contraseña}
              alCambiar={setContraseña}
              marcador="contraseña nueva"
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
            <Ayuda>Tiene que tener al menos 6 caracteres.</Ayuda>
          )}
        </>
      ) : (
        <div className="campo-fila">
          <button type="button" className="habit-btn" onClick={() => setCambiando(true)}>
            Cambiar contraseña
          </button>
        </div>
      )}

      <div className="campo-fila">
        <button type="button" className="habit-btn habit-btn--restar" onClick={salir}>
          Cerrar sesión
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
  return (
    <Panel titulo="Privacidad">
      <div className="campo-fila">
        <a className="habit-btn" href="/privacidad.html" target="_blank" rel="noopener">
          Ver la política de privacidad
        </a>
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

    setAviso("Listo, se descargó tu copia.");
  };

  const importar = (archivo: File) => {
    const lector = new FileReader();

    lector.onload = () => {
      try {
        const datos = JSON.parse(String(lector.result));
        for (const [clave, valor] of Object.entries(datos)) {
          if (clave.startsWith("habitotchi_")) localStorage.setItem(clave, String(valor));
        }
        setAviso("Datos restaurados. Recargá la página para verlos.");
      } catch {
        setAviso("Ese archivo no parece una copia de Habitotchi.");
      }
    };

    lector.readAsText(archivo);
  };

  const borrarTodo = () => {
    /* Doble confirmación: esto no se puede deshacer y se lleva
       puesto todo el historial. */
    if (!window.confirm("¿Seguro? Se borra todo lo que anotaste y no se puede recuperar.")) return;
    if (!window.confirm("De verdad, no hay vuelta atrás. ¿Borro todo?")) return;

    const claves: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave?.startsWith("habitotchi_")) claves.push(clave);
    }
    claves.forEach((c) => localStorage.removeItem(c));

    setAviso("Borrado. Recargá la página.");
  };

  return (
    <Panel titulo="Tus datos">
      <div className="campo-fila">
        <button type="button" className="habit-btn" onClick={exportar}>
          Descargar mis datos
        </button>
      </div>

      <div className="campo-fila">
        <label className="habit-btn" style={{ cursor: "pointer" }}>
          Restaurar una copia
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
          Borrar todo
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}

      <Ayuda>
        Todo se guarda <b>solo en este dispositivo</b>. Si limpiás el historial del navegador,
        se pierde: por eso conviene bajar una copia cada tanto.
      </Ayuda>
    </Panel>
  );
}
