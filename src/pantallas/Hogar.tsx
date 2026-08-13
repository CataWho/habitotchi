import { useCallback, useEffect, useState } from "react";
import type { IdMascota } from "@/tipos";
import { MASCOTAS } from "@/datos/mascotas";
import { useHabitotchi, nombreDeLaMascota } from "@/estado/useHabitotchi";
import { calcularAnimo, calcularEstadoVida, diaEsBueno } from "@/lib/crecimiento";
import { fechaDeHoy, ultimosSieteDias } from "@/lib/fechas";
import { yaLoTenes } from "@/lib/tienda";
import { Mascota, TAM_PIXEL_MINI } from "@/componentes/mascota/Mascota";
import { Despedida, Tumba } from "@/componentes/mascota/Despedida";
import { Pagina } from "@/componentes/comunes/Pagina";
import { BarraDeEtapa, Marcadores } from "@/componentes/aparato/Chasis";

/* ==========================================================
   HOGAR
   ==========================================================
   La pantalla principal: tu mascota, el selector, la tira de
   los últimos 7 días y lo que la mascota tiene para decirte.
   ========================================================== */

export function Hogar() {
  const {
    registro, metas, vida, compras, equipado,
    mensaje, despidiendose,
    elegirMascota, decir, setDespidiendose, revisarMuerte,
  } = useHabitotchi();

  const [comoSeLlamaba, setComoSeLlamaba] = useState("");

  /* Al abrir la app, una sola vez: ¿se murió mientras no
     estabas? Si sí, arranca la despedida. */
  useEffect(() => {
    const { murio, comoSeLlamaba: nombre } = revisarMuerte();
    if (murio) setComoSeLlamaba(nombre);
  }, [revisarMuerte]);

  const terminarDespedida = useCallback(() => setDespidiendose(false), [setDespidiendose]);

  const hoy = fechaDeHoy();
  const animo = calcularAnimo(registro, metas, hoy);
  const estadoVida = calcularEstadoVida(registro, metas, vida?.desde);

  return (
    <Pagina nombre="Hogar" sinTitulo>
      <BarraSuperior />

      <div className="pet-stage">
        {despidiendose && vida ? (
          <Despedida
            mascota={vida.mascota}
            etapa={estadoVida.etapa}
            accesorio={equipado.accesorio}
            comoSeLlamaba={comoSeLlamaba}
            onTerminar={terminarDespedida}
            onDecir={decir}
          />
        ) : !vida ? (
          <p className="screen-msg">Elegí una mascota para empezar.</p>
        ) : vida.muerteRegistrada ? (
          <Tumba />
        ) : (
          <>
            <Mascota
              mascota={vida.mascota}
              etapa={estadoVida.etapa}
              animo={animo}
              accesorio={equipado.accesorio}
            />
            <div className="pet-shadow" />
          </>
        )}
      </div>

      {mensaje && <p className="screen-msg">{mensaje}</p>}

      <SelectorDeMascota
        elegida={vida?.mascota}
        bloqueada={!!vida && !vida.muerteRegistrada}
        onElegir={(id) => {
          if (!yaLoTenes(compras, "mascota", id)) {
            decir(`Todavía no desbloqueaste al ${MASCOTAS[id]?.nombre.toLowerCase()}. Está en la tienda.`);
            return;
          }
          elegirMascota(id);
        }}
        tieneDesbloqueada={(id) => yaLoTenes(compras, "mascota", id)}
      />

      <HistorialDeLaSemana />

      {/* Los marcadores van al final y solo acá: antes vivían
          en el chasis, fuera de la pantalla, y eso obligaba a
          que Hogar tuviera la pantalla más chica que el resto. */}
      <Marcadores />
      <BarraDeEtapa />
    </Pagina>
  );
}

/* La línea de arriba de la pantalla: nombre, etapa y ánimo */
function BarraSuperior() {
  const { registro, metas, vida } = useHabitotchi();

  if (!vida || vida.muerteRegistrada) return <div className="screen-top" />;

  const { etapa } = calcularEstadoVida(registro, metas, vida.desde);
  const animo = calcularAnimo(registro, metas, fechaDeHoy());

  const CARITA: Record<string, string> = { feliz: ":)", normal: ":|", triste: ":(", muerta: "x_x" };

  return (
    <div className="screen-top">
      <span className="screen-top-nombre">{nombreDeLaMascota(vida)}</span>
      <span>{etapa}</span>
      <span>{CARITA[animo]}</span>
    </div>
  );
}

interface PropsSelector {
  elegida: IdMascota | undefined;
  bloqueada: boolean;
  onElegir: (id: IdMascota) => void;
  tieneDesbloqueada: (id: IdMascota) => boolean;
}

/* ----------------------------------------------------------
   ELEGIR MASCOTA · Y PONERLE NOMBRE
   ----------------------------------------------------------
   Mientras no elegiste, se ven las seis. Apenas elegís una,
   la lista desaparece y queda solo ella, pidiéndote el
   nombre: no tiene sentido seguir mostrando las otras cuando
   ya no se puede cambiar.
   ---------------------------------------------------------- */
function SelectorDeMascota({ elegida, bloqueada, onElegir, tieneDesbloqueada }: PropsSelector) {
  const { vida, ponerleNombre } = useHabitotchi();
  const [borrador, setBorrador] = useState("");

  /* Ya elegiste y todavía no le pusiste nombre */
  if (bloqueada && vida && !vida.nombre) {
    return (
      <section className="panel">
        <h2 className="panel-title">¿Cómo se va a llamar?</h2>

        <div className="pet-picker">
          <div className="pet-option is-selected">
            <Mascota
              mascota={vida.mascota}
              etapa="bebe"
              animo="feliz"
              tamPixel={TAM_PIXEL_MINI}
              className="pet-mini"
            />
            <span className="pet-name">{MASCOTAS[vida.mascota]?.nombre}</span>
          </div>
        </div>

        <div className="campo-fila">
          <input
            className="input-rosa"
            value={borrador}
            placeholder="ponele un nombre"
            maxLength={20}
            autoFocus
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && borrador.trim() && ponerleNombre(borrador.trim())}
          />
          <button
            type="button"
            className="habit-btn"
            onClick={() => borrador.trim() && ponerleNombre(borrador.trim())}
          >
            Listo
          </button>
        </div>

        <p className="ayuda-chica">
          Si preferís, dejalo así y se llama como su especie.
        </p>
      </section>
    );
  }

  /* Ya elegiste y ya tiene nombre: no mostramos nada. La
     mascota se ve arriba, con su nombre en la barra superior;
     repetirla acá solo ocupa lugar. */
  if (bloqueada && vida) return null;

  return (
    <section className="panel">
      <h2 className="panel-title">Elegí tu mascota</h2>

      <div className="pet-picker">
        {Object.entries(MASCOTAS).map(([id, mascota]) => {
          const desbloqueada = tieneDesbloqueada(id);
          const clases = [
            "pet-option",
            elegida === id ? "is-selected" : "",
            desbloqueada ? "" : "is-locked",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={id}
              type="button"
              className={clases}
              onClick={() => onElegir(id)}
              aria-pressed={elegida === id}
            >
              <Mascota
                mascota={id}
                etapa="bebe"
                animo="feliz"
                tamPixel={TAM_PIXEL_MINI}
                className="pet-mini"
              />
              <span className="pet-name">{mascota.nombre}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------
   LA TIRA DE LOS ÚLTIMOS 7 DÍAS
   ----------------------------------------------------------
   Relleno si fue un buen día, suave si fue malo, punteado si
   todavía no lo abriste. Los tres estados importan: un día
   que no abriste no es un día malo.
   ---------------------------------------------------------- */
function HistorialDeLaSemana() {
  const { registro, metas } = useHabitotchi();
  const dias = ultimosSieteDias();

  return (
    <section className="panel">
      <h2 className="panel-title">Últimos 7 días registrados</h2>

      <div className="history-strip">
        {dias.map((dia) => {
          const resultado = diaEsBueno(registro, metas, dia.texto);
          const tipo = resultado === true ? "bueno" : resultado === false ? "malo" : "vacio";

          return (
            <div
              key={dia.texto}
              className={`day-dot day-dot--${tipo}${dia.esHoy ? " day-dot--hoy" : ""}`}
              title={dia.texto}
            >
              <span>{dia.inicial}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
