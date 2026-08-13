import { useState } from "react";
import type { TipoDeArticulo } from "@/tipos";
import { MASCOTAS } from "@/datos/mascotas";
import { ACCESORIOS } from "@/datos/accesorios";
import { FONDOS } from "@/datos/fondos";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { calcularEstadoVida } from "@/lib/crecimiento";
import { comprar, logrosConseguidos, monedasDisponibles, yaLoTenes } from "@/lib/tienda";
import { Mascota, TAM_PIXEL_MINI } from "@/componentes/mascota/Mascota";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Panel } from "@/componentes/comunes/Panel";

/* ==========================================================
   TIENDA
   ==========================================================
   Mascotas, accesorios y fondos de pantalla, más los logros.
   Las monedas salen de tus días buenos: los juegos no dan,
   a propósito.
   ========================================================== */

export function Tienda() {
  const { registro, metas, compras, equipado, vida, refrescarCompras } = useHabitotchi();
  const [mensaje, setMensaje] = useState("");

  const monedas = Math.max(0, monedasDisponibles(registro, metas, compras));
  const { etapa } = calcularEstadoVida(registro, metas, vida?.desde);
  const logros = logrosConseguidos(registro, metas, compras, etapa);

  const alComprar = (tipo: TipoDeArticulo, id: string) => {
    const resultado = comprar(registro, metas, compras, tipo, id);
    setMensaje(resultado.mensaje);
    refrescarCompras();
  };

  return (
    <Pagina nombre="Tienda">
      <Panel>
        <div className="monedas-grandes">{monedas} monedas</div>
        <Ayuda>
          Ganás 10 monedas por cada día bueno, y 50 extra cada 7 días seguidos. Los juegos no
          dan monedas: solo los hábitos.
        </Ayuda>
        {mensaje && <p className="tienda-mensaje">{mensaje}</p>}
      </Panel>

      <Seccion titulo="Mascotas" tipo="mascota" onComprar={alComprar} />
      <Seccion titulo="Accesorios" tipo="accesorio" onComprar={alComprar} />
      <Seccion titulo="Fondos de pantalla" tipo="fondo" onComprar={alComprar} />

      <Panel titulo="Logros">
        <ul className="lista-simple">
          {logros.map((logro) => (
            <li
              key={logro.id}
              className={logro.conseguido ? "logro logro--conseguido" : "logro"}
            >
              <span className="logro-estrella">{logro.conseguido ? "★" : "☆"}</span>
              <span>
                <b>{logro.nombre}</b>
                <br />
                <span className="ayuda-chica">{logro.descripcion}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Ayuda>
        Los accesorios y los fondos se pueden cambiar cuando quieras. La mascota no: es esa
        hasta que termine su ciclo.
      </Ayuda>

      {equipado.accesorio && <Ayuda>Tu mascota tiene puesto un accesorio.</Ayuda>}
    </Pagina>
  );
}

interface PropsSeccion {
  titulo: string;
  tipo: TipoDeArticulo;
  onComprar: (tipo: TipoDeArticulo, id: string) => void;
}

function Seccion({ titulo, tipo, onComprar }: PropsSeccion) {
  const { compras, equipado, vida, equipar } = useHabitotchi();

  const catalogo =
    tipo === "mascota" ? MASCOTAS : tipo === "accesorio" ? ACCESORIOS : FONDOS;

  return (
    <Panel titulo={titulo}>
      <div className="tienda-grilla">
        {Object.entries(catalogo).map(([id, articulo]) => {
          const tenes = yaLoTenes(compras, tipo, id);
          const precio = "precio" in articulo ? (articulo.precio ?? 0) : 0;

          return (
            <div key={id} className={tenes ? "tienda-item tienda-item--tenes" : "tienda-item"}>
              <div className="tienda-vista">
                <Vista tipo={tipo} id={id} sobreQuien={vida?.mascota ?? "dragoncito"} />
              </div>

              <span className="tienda-nombre">{articulo.nombre}</span>

              <BotonDelArticulo
                tipo={tipo}
                id={id}
                tenes={tenes}
                precio={precio}
                equipado={equipado}
                onComprar={onComprar}
                onEquipar={equipar}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Vista({ tipo, id, sobreQuien }: { tipo: TipoDeArticulo; id: string; sobreQuien: string }) {
  if (tipo === "mascota") {
    return <Mascota mascota={id} etapa="bebe" animo="feliz" tamPixel={TAM_PIXEL_MINI} className="pet-mini" />;
  }

  if (tipo === "accesorio") {
    /* Lo mostramos puesto sobre tu mascota, para que veas cómo
       queda antes de comprarlo. */
    return (
      <Mascota
        mascota={sobreQuien}
        etapa="bebe"
        animo="feliz"
        tamPixel={TAM_PIXEL_MINI}
        accesorio={id}
        className="pet-mini"
      />
    );
  }

  return <div className="tienda-fondo-muestra" style={{ background: FONDOS[id]?.degradado }} />;
}

function BotonDelArticulo({
  tipo,
  id,
  tenes,
  precio,
  equipado,
  onComprar,
  onEquipar,
}: {
  tipo: TipoDeArticulo;
  id: string;
  tenes: boolean;
  precio: number;
  equipado: { accesorio: string | null; fondo: string };
  onComprar: (tipo: TipoDeArticulo, id: string) => void;
  onEquipar: (cambios: { accesorio?: string | null; fondo?: string }) => void;
}) {
  if (!tenes) {
    return (
      <button type="button" className="habit-btn tienda-btn" onClick={() => onComprar(tipo, id)}>
        {precio} ●
      </button>
    );
  }

  if (tipo === "accesorio") {
    const puesto = equipado.accesorio === id;
    return (
      <button
        type="button"
        className={puesto ? "habit-btn tienda-btn habit-btn--restar" : "habit-btn tienda-btn"}
        onClick={() => onEquipar({ accesorio: puesto ? null : id })}
      >
        {puesto ? "Sacar" : "Poner"}
      </button>
    );
  }

  if (tipo === "fondo") {
    const puesto = equipado.fondo === id;
    return (
      <button
        type="button"
        className="habit-btn tienda-btn"
        disabled={puesto}
        onClick={() => onEquipar({ fondo: id })}
      >
        {puesto ? "Puesto" : "Poner"}
      </button>
    );
  }

  /* Las mascotas desbloqueadas se marcan con un tilde: la
     palabra entera no entra en la tarjeta. */
  return (
    <button
      type="button"
      className="habit-btn tienda-btn tienda-btn--tenes"
      disabled
      aria-label={`${MASCOTAS[id]?.nombre}, ya desbloqueada`}
    >
      ✓
    </button>
  );
}
