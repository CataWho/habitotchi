import { create } from "zustand";
import type { Compras, Equipado, Fecha, IdHabito, IdMascota, Metas, Registro, Vida } from "@/tipos";
import {
  agregarACementerio,
  cambiarMeta as cambiarMetaEnDisco,
  cargarCementerio,
  cargarCompras,
  cargarEquipado,
  cargarMetas,
  cargarRegistro,
  cargarVida,
  guardarEquipado,
  guardarVida,
  sumarHabito as sumarHabitoEnDisco,
} from "@/lib/registro";
import { calcularEstadoVida } from "@/lib/crecimiento";
import { fechaDeHoy } from "@/lib/fechas";
import { MASCOTAS } from "@/datos/mascotas";
import type { EnElCementerio } from "@/tipos";

/* ==========================================================
   HABITOTCHI · el estado de la app
   ==========================================================
   La versión vieja tenía un objeto `estado` global y una
   función `actualizarPantalla()` que redibujaba TODO de cero
   cada vez que cambiaba cualquier cosa.

   Acá es lo mismo conceptualmente — un solo lugar donde vive
   todo — pero React se encarga de redibujar únicamente lo que
   depende del dato que cambió.

   ---------- LO QUE NO SE GUARDA ACÁ ----------
   El ánimo y la etapa NO están en el estado, igual que antes:
   se calculan a partir del registro cada vez que hacen falta.
   Si los guardáramos, podrían quedar desincronizados de la
   realidad.
   ========================================================== */

interface EstadoHabitotchi {
  registro: Registro;
  metas: Metas;
  vida: Vida | null;
  cementerio: EnElCementerio[];
  compras: Compras;
  equipado: Equipado;

  /* Lo que dice la mascota. No se guarda en disco: es de esta
     sesión nomás. */
  mensaje: string;

  /* Mientras dura la animación de despedida, la pantalla no
     dibuja la mascota normal: la maneja la animación. */
  despidiendose: boolean;

  sumarHabito: (habitoId: IdHabito, cantidad: number, fecha?: Fecha) => void;
  cambiarMeta: (habitoId: IdHabito, valor: number) => void;
  elegirMascota: (id: IdMascota) => void;
  ponerleNombre: (nombre: string) => void;
  equipar: (cambios: Partial<Equipado>) => void;
  decir: (mensaje: string) => void;
  setDespidiendose: (valor: boolean) => void;
  revisarMuerte: () => { murio: boolean; comoSeLlamaba: string };
  refrescarCompras: () => void;
}

export const useHabitotchi = create<EstadoHabitotchi>((set, get) => ({
  registro: cargarRegistro(),
  metas: cargarMetas(),
  vida: cargarVida(),
  cementerio: cargarCementerio(),
  compras: cargarCompras(),
  equipado: cargarEquipado(),

  mensaje: "",
  despidiendose: false,

  sumarHabito: (habitoId, cantidad, fecha = fechaDeHoy()) => {
    set({ registro: sumarHabitoEnDisco(get().registro, fecha, habitoId, cantidad) });
  },

  cambiarMeta: (habitoId, valor) => {
    set({ metas: cambiarMetaEnDisco(get().metas, habitoId, valor) });
  },

  elegirMascota: (id) => {
    /* Una mascota nueva arranca de cero: los puntos se cuentan
       desde hoy, así no carga con los malos días de la
       anterior. */
    const vida: Vida = { mascota: id, desde: fechaDeHoy(), muerteRegistrada: false };
    guardarVida(vida);
    set({ vida, despidiendose: false, mensaje: "" });
  },

  ponerleNombre: (nombre) => {
    const vida = get().vida;
    if (!vida) return;

    const nueva: Vida = { ...vida, nombre };
    guardarVida(nueva);
    set({ vida: nueva });
  },

  equipar: (cambios) => {
    const equipado: Equipado = { ...get().equipado, ...cambios };
    guardarEquipado(equipado);
    set({ equipado });
  },

  decir: (mensaje) => set({ mensaje }),

  setDespidiendose: (valor) => set({ despidiendose: valor }),

  refrescarCompras: () => set({ compras: cargarCompras() }),

  /* ----------------------------------------------------------
     ¿SE MURIÓ?
     ----------------------------------------------------------
     Se llama una sola vez, al arrancar. Si la mascota falleció
     y todavía no lo registramos, la mandamos al cementerio y
     avisamos para que se dispare la animación de despedida.
     ---------------------------------------------------------- */
  revisarMuerte: () => {
    const { vida, registro, metas, cementerio } = get();

    if (!vida || vida.muerteRegistrada) return { murio: false, comoSeLlamaba: "" };

    const estadoVida = calcularEstadoVida(registro, metas, vida.desde);
    if (!estadoVida.muerta) return { murio: false, comoSeLlamaba: "" };

    const nombreDeEspecie = MASCOTAS[vida.mascota]?.nombre ?? "tu mascota";
    const comoSeLlamaba = vida.nombre ?? nombreDeEspecie.toLowerCase();

    const nuevoCementerio = agregarACementerio(cementerio, {
      mascota: vida.mascota,
      nombre: vida.nombre ?? nombreDeEspecie,
      etapaAlcanzada: estadoVida.etapa,
      desde: vida.desde,
      hasta: estadoVida.fechaMuerte ?? fechaDeHoy(),
    });

    const vidaMuerta: Vida = { ...vida, muerteRegistrada: true };
    guardarVida(vidaMuerta);

    set({ vida: vidaMuerta, cementerio: nuevoCementerio, despidiendose: true });

    return { murio: true, comoSeLlamaba };
  },
}));

/* Cómo se llama la mascota: el nombre que le pusiste, o el de
   la especie si nunca le pusiste ninguno. */
export function nombreDeLaMascota(vida: Vida | null): string {
  if (!vida) return "tu mascota";
  return vida.nombre ?? (MASCOTAS[vida.mascota]?.nombre ?? "tu mascota").toLowerCase();
}
