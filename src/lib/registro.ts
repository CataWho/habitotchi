import type {
  Compras,
  DiaRegistrado,
  Equipado,
  EnElCementerio,
  Fecha,
  IdHabito,
  IdMascota,
  Metas,
  Registro,
  Vida,
} from "@/tipos";
import { HABITOS_POR_DEFECTO } from "@/datos/habitos";
import { CLAVES, escribir, escribirTexto, leer, leerTexto } from "./almacenamiento";
import type { DiaCorto } from "./fechas";

/* ==========================================================
   HABITOTCHI · el registro de hábitos
   ==========================================================
   El "cajón" donde vive todo lo que anotás cada día.

   Forma de los datos:

     {
       "2026-08-11": { agua: 5, comida: 2, dulces: 1 },
       "2026-08-10": { agua: 8, comida: 3 }
     }

   Si un hábito no aparece ese día es porque todavía no lo
   tocaste: vale 0. No hace falta guardar ceros.

   ---------- LAS FUNCIONES NO MUTAN ----------
   Diferencia con la versión vieja: antes `sumarHabito`
   modificaba el objeto que le pasabas y devolvía el mismo.
   Con React eso no sirve: si el objeto es el mismo, la
   pantalla no se entera de que cambió y no se vuelve a
   dibujar. Acá se devuelve uno nuevo.
   ========================================================== */

export function cargarRegistro(): Registro {
  return leer<Registro>(CLAVES.registro, {});
}

export function guardarRegistro(registro: Registro): void {
  escribir(CLAVES.registro, registro);
}

/* Los valores de un día puntual (objeto vacío si no se tocó
   nada todavía ese día). */
export function obtenerDia(registro: Registro, fecha: Fecha): DiaRegistrado {
  return registro[fecha] ?? {};
}

/* Cuánto llevás de UN hábito en UN día puntual. */
export function obtenerValor(registro: Registro, fecha: Fecha, habitoId: IdHabito): number {
  return obtenerDia(registro, fecha)[habitoId] ?? 0;
}

/* Suma "cantidad" a un hábito de un día (nunca baja de 0).
   Guarda solo y devuelve un registro NUEVO. */
export function sumarHabito(
  registro: Registro,
  fecha: Fecha,
  habitoId: IdHabito,
  cantidad: number
): Registro {
  const actual = obtenerValor(registro, fecha, habitoId);

  const nuevo: Registro = {
    ...registro,
    [fecha]: {
      ...obtenerDia(registro, fecha),
      [habitoId]: Math.max(0, actual + cantidad),
    },
  };

  guardarRegistro(nuevo);
  return nuevo;
}

/* Deja un hábito en un valor exacto, en vez de sumarle.
   Lo usan las secciones que calculan el total por su cuenta
   (ejercicio suma los minutos de sus sesiones, alimentación
   cuenta las comidas cargadas). */
export function fijarHabito(
  registro: Registro,
  fecha: Fecha,
  habitoId: IdHabito,
  valor: number
): Registro {
  const nuevo: Registro = {
    ...registro,
    [fecha]: {
      ...obtenerDia(registro, fecha),
      [habitoId]: Math.max(0, valor),
    },
  };

  guardarRegistro(nuevo);
  return nuevo;
}

/* ==========================================================
   LAS METAS
   ==========================================================
   Por defecto usamos los números de datos/habitos.ts, pero
   acá guardamos SOLO los que cambiaste a mano. Así, el día
   que ajustemos un valor de fábrica, no te pisamos lo que ya
   personalizaste.
   ========================================================== */

export function cargarMetas(): Metas {
  return leer<Metas>(CLAVES.metas, {});
}

export function guardarMetas(metas: Metas): void {
  escribir(CLAVES.metas, metas);
}

/* La meta "de verdad" a usar: la personalizada si existe, si
   no, la de fábrica. */
export function obtenerMeta(metas: Metas, habitoId: IdHabito): number {
  const personalizada = metas[habitoId];
  if (personalizada !== undefined) return personalizada;

  return HABITOS_POR_DEFECTO[habitoId]?.meta ?? 0;
}

export function cambiarMeta(metas: Metas, habitoId: IdHabito, valorNuevo: number): Metas {
  const nuevas: Metas = { ...metas, [habitoId]: valorNuevo };
  guardarMetas(nuevas);
  return nuevas;
}

/* ==========================================================
   LA VIDA ACTUAL Y EL CEMENTERIO
   ==========================================================
   "Vida" es la mascota que tenés AHORA y desde qué fecha,
   que es desde dónde se cuentan los puntos de crecimiento.
   El cementerio guarda un recuerdo de cada una que falleció.

   Ninguno de los dos borra tu registro de hábitos: eso queda
   intacto siempre.
   ========================================================== */

export function cargarVida(): Vida | null {
  return leer<Vida | null>(CLAVES.vida, null); // null = nunca elegiste mascota
}

export function guardarVida(vida: Vida): void {
  escribir(CLAVES.vida, vida);
}

export function cargarCementerio(): EnElCementerio[] {
  return leer<EnElCementerio[]>(CLAVES.cementerio, []);
}

export function guardarCementerio(cementerio: EnElCementerio[]): void {
  escribir(CLAVES.cementerio, cementerio);
}

export function agregarACementerio(
  cementerio: EnElCementerio[],
  entrada: EnElCementerio
): EnElCementerio[] {
  const nuevo = [...cementerio, entrada];
  guardarCementerio(nuevo);
  return nuevo;
}

/* La mascota elegida, para que no se resetee al recargar */
export function cargarMascotaGuardada(): IdMascota | null {
  const guardada = leerTexto(CLAVES.mascota);
  return guardada === "" ? null : guardada;
}

export function guardarMascota(id: IdMascota): void {
  escribirTexto(CLAVES.mascota, id);
}

/* ==========================================================
   LA TIENDA: qué compraste y qué tenés puesto
   ========================================================== */

export function cargarCompras(): Compras {
  return leer<Compras>(CLAVES.compras, { mascotas: [], accesorios: [], fondos: [] });
}

export function guardarCompras(compras: Compras): void {
  escribir(CLAVES.compras, compras);
}

export function cargarEquipado(): Equipado {
  return leer<Equipado>(CLAVES.equipado, { accesorio: null, fondo: "clasico" });
}

export function guardarEquipado(equipado: Equipado): void {
  escribir(CLAVES.equipado, equipado);
}

/* ==========================================================
   LOS DULCES DE LA SEMANA
   ==========================================================
   Suma los últimos 7 días, sin juzgar. Es solo un dato.
   ========================================================== */

export function totalUltimaSemana(
  registro: Registro,
  habitoId: IdHabito,
  dias: DiaCorto[]
): number {
  return dias.reduce((total: number, dia: any) => total + obtenerValor(registro, dia.texto, habitoId), 0);
}
