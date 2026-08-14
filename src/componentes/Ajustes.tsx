import { useEffect, useState } from "react";
import { PRONOMBRES, cargarPerfil, guardarPerfil } from "@/lib/perfil";
import { fechaDeHoy } from "@/lib/fechas";
import {
  alCambiarSesion, bajarDatosDeLaNubeYRecargar, cerrarSesion, crearCuenta,
  hayDatosLocales, hayNubeConfigurada, iniciarSesion,
  iniciarSincronizacionEnSegundoPlano, sesionActual, subirDatosLocales,
} from "@/lib/nube";
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
   CUENTA EN LA NUBE
   ----------------------------------------------------------
   Opcional: ver los mismos datos desde varios dispositivos.
   Sin esto, la app sigue andando exactamente igual que
   siempre, 100% local — ver el comentario largo en
   src/lib/nube.ts.

   Va antes de "Tus datos" porque conceptualmente es un
   escalón más: primero tus datos locales de siempre, después
   —si querés— que además vivan en una cuenta.
   ---------------------------------------------------------- */
function CuentaEnLaNube() {
  const [sesion, setSesion] = useState<{ id: string; email: string } | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    sesionActual().then((s) => {
      setSesion(s);
      setCargandoSesion(false);
      /* Si ya había sesión de una visita anterior, hay que
         volver a enganchar el empuje de cambios: la
         suscripción no sobrevive a un refresh de página. */
      if (s) iniciarSincronizacionEnSegundoPlano();
    });

    return alCambiarSesion(() => {
      sesionActual().then(setSesion);
    });
  }, []);

  if (!hayNubeConfigurada() || cargandoSesion) return null;

  const entrar = async () => {
    setTrabajando(true);
    setAviso("");

    try {
      await iniciarSesion(email, contraseña);

      if (!hayDatosLocales()) {
        await bajarDatosDeLaNubeYRecargar();
        return;
      }

      /* Caso de riesgo: este aparato ya tenía sus propios
         datos, de antes de tener cuenta. No se mezclan solos
         —mezclar dos historiales de hábitos y calendarios es
         un problema mucho más grande— así que se avisa y se
         pide confirmar antes de reemplazarlos. */
      const confirma = window.confirm(
        "Este dispositivo ya tiene datos guardados. Si continuás, se van a reemplazar por " +
          "los de tu cuenta. ¿Continuar?"
      );

      if (confirma) {
        await bajarDatosDeLaNubeYRecargar();
      } else {
        /* Si no confirma, mejor cerrar la sesión ya mismo: si
           quedara "adentro" sin bajar los datos de la cuenta,
           cada cosa que anote en este aparato se subiría
           igual y terminaría pisando, de a poco, los datos
           reales de la cuenta. */
        await cerrarSesion();
        setTrabajando(false);
      }
    } catch (e: any) {
      setAviso(e?.message ?? "No se pudo iniciar sesión.");
      setTrabajando(false);
    }
  };

  const crear = async () => {
    setTrabajando(true);
    setAviso("");

    try {
      await crearCuenta(email, contraseña);

      if (hayDatosLocales()) {
        const subir = window.confirm(
          "¿Subir a tu cuenta nueva los datos que ya tenés guardados en este dispositivo?"
        );
        if (subir) await subirDatosLocales();
      }

      iniciarSincronizacionEnSegundoPlano();
      setAviso("Cuenta creada. Ya podés usar Habitotchi desde otros dispositivos con este mail.");
      setContraseña("");
    } catch (e: any) {
      setAviso(e?.message ?? "No se pudo crear la cuenta.");
    } finally {
      setTrabajando(false);
    }
  };

  const salir = async () => {
    setTrabajando(true);
    await cerrarSesion();
    setSesion(null);
    setTrabajando(false);
    setAviso("Sesión cerrada. Tus datos siguen en este dispositivo.");
  };

  if (sesion) {
    return (
      <Panel titulo="Tu cuenta">
        <Ayuda>Conectada como {sesion.email}</Ayuda>

        <div className="campo-fila">
          <button type="button" className="habit-btn habit-btn--restar" onClick={salir} disabled={trabajando}>
            Cerrar sesión
          </button>
        </div>

        {aviso && <Ayuda>{aviso}</Ayuda>}
      </Panel>
    );
  }

  return (
    <Panel titulo="Tu cuenta">
      <div className="animo-botones">
        <button
          type="button"
          className={modo === "entrar" ? "juego-opcion is-on" : "juego-opcion"}
          onClick={() => setModo("entrar")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={modo === "crear" ? "juego-opcion is-on" : "juego-opcion"}
          onClick={() => setModo("crear")}
        >
          Crear cuenta
        </button>
      </div>

      <div className="campo-fila">
        <input
          className="input-rosa"
          type="email"
          value={email}
          placeholder="mail"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="campo-fila">
        <input
          className="input-rosa"
          type="password"
          value={contraseña}
          placeholder="contraseña"
          onChange={(e) => setContraseña(e.target.value)}
        />
        <button
          type="button"
          className="habit-btn"
          disabled={trabajando || !email || !contraseña}
          onClick={modo === "entrar" ? entrar : crear}
        >
          {modo === "entrar" ? "Entrar" : "Crear"}
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}

      <Ayuda>
        Opcional: con una cuenta, tus datos se sincronizan entre los dispositivos donde
        inicies sesión. Sin cuenta, Habitotchi sigue funcionando exactamente igual que
        siempre, solo en este dispositivo.
      </Ayuda>
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
