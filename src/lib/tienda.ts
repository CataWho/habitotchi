import { tr } from "@/lib/idioma";
import type {
  Compras,
  Etapa,
  IdHabito,
  Logro,
  LogroConseguido,
  Metas,
  Registro,
  ResultadoDeCompra,
  TipoDeArticulo,
} from "@/tipos";
import { MASCOTAS } from "@/datos/mascotas";
import { ACCESORIOS } from "@/datos/accesorios";
import { FONDOS } from "@/datos/fondos";
import { diaEsBueno, diaEstaAbierto } from "./crecimiento";
import { fechaComoTexto, fechaDeHoy } from "./fechas";
import { guardarCompras } from "./registro";

/* ==========================================================
   HABITOTCHI · monedas, logros y tienda
   ==========================================================
   ---------- DOS MONEDAS DISTINTAS, A PROPÓSITO ----------
   · PUNTOS de crecimiento → NO se gastan. Son la vida de tu
     mascota: deciden si es bebé, joven o adulta.
   · MONEDAS (este archivo) → SÍ se gastan, en la tienda.

   ¿Por qué separadas? Porque si compraras con los puntos de
   crecimiento, ponerle un moño a tu mascota la haría
   achicarse. Sería castigarte por usar el premio.

   ---------- LAS MONEDAS SON DERIVADAS ----------
   No guardamos "tenés 240 monedas" en ningún lado. Guardamos
   solo QUÉ COMPRASTE, y calculamos:

       monedas disponibles = ganadas - gastadas

   Misma idea que con el ánimo y el crecimiento: si
   guardáramos el saldo, podría desincronizarse de la
   realidad; calculándolo de cero, no puede pasar.

   ---------- LOS JUEGOS NO DAN MONEDAS ----------
   A propósito. Si jugar diera monedas, te convendría jugar en
   vez de tomar agua, y la app competiría contra su propio
   objetivo. Los juegos tienen su récord, para superarte a vos
   misma. Las monedas salen solo de los hábitos.
   ========================================================== */

export const MONEDAS_POR_DIA_BUENO = 10;
export const BONUS_POR_SEMANA = 50; // cada 7 días buenos seguidos
export const MONEDAS_POR_LIBRO = 30;

/* ==========================================================
   1) CUÁNTAS MONEDAS GANASTE
   ==========================================================
   Recorre todo tu historial: cada día bueno suma, y cada 7
   días buenos SEGUIDOS te damos un bonus. La racha se corta
   con un día malo; los días que no abriste la app no suman ni
   cortan, se saltean.
   ========================================================== */

export function monedasGanadas(
  registro: Registro,
  metas: Metas,
  librosLeidos: unknown[] = []
): number {
  const fechas = Object.keys(registro).sort();

  let total = 0;
  let racha = 0;

  for (const fecha of fechas) {
    const resultado = diaEsBueno(registro, metas, fecha);

    if (resultado === true) {
      total += MONEDAS_POR_DIA_BUENO;
      racha++;

      if (racha % 7 === 0) total += BONUS_POR_SEMANA;
    } else if (resultado === false) {
      racha = 0;
    }
  }

  /* Cada libro terminado también suma. Sigue siendo derivado:
     contamos los libros de la lista, no llevamos un saldo. */
  total += librosLeidos.length * MONEDAS_POR_LIBRO;

  return total;
}

function catalogoDe(tipo: TipoDeArticulo) {
  if (tipo === "mascota") return MASCOTAS;
  if (tipo === "accesorio") return ACCESORIOS;
  return FONDOS;
}

function listaDeCompras(compras: Compras, tipo: TipoDeArticulo): string[] {
  if (tipo === "mascota") return compras.mascotas;
  if (tipo === "accesorio") return compras.accesorios;
  return compras.fondos;
}

function precioDe(tipo: TipoDeArticulo, id: string): number {
  const articulo = catalogoDe(tipo)[id];
  if (!articulo) return 0;
  return "precio" in articulo ? (articulo.precio ?? 0) : 0;
}

/* Cuánto vale todo lo que compraste */
export function monedasGastadas(compras: Compras): number {
  let total = 0;

  for (const id of compras.mascotas) total += precioDe("mascota", id);
  for (const id of compras.accesorios) total += precioDe("accesorio", id);
  for (const id of compras.fondos) total += precioDe("fondo", id);

  return total;
}

export function monedasDisponibles(
  registro: Registro,
  metas: Metas,
  compras: Compras,
  librosLeidos: unknown[] = []
): number {
  return monedasGanadas(registro, metas, librosLeidos) - monedasGastadas(compras);
}

/* ==========================================================
   2) LA RACHA DE HOY
   ==========================================================
   Cuántos días buenos seguidos llevás AHORA.

   Detalle importante: si hoy todavía no anotaste nada, no
   cortamos la racha — el día recién empieza. Arrancamos a
   contar desde ayer.
   ========================================================== */

export function rachaActual(registro: Registro, metas: Metas): number {
  let racha = 0;
  const cursor = new Date();

  if (!diaEstaAbierto(registro, fechaDeHoy())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  /* El tope de 400 es un seguro para no quedarnos en un bucle
     infinito si algo sale mal. */
  for (let i = 0; i < 400; i++) {
    if (diaEsBueno(registro, metas, fechaComoTexto(cursor)) !== true) break;

    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

export function totalDiasBuenos(registro: Registro, metas: Metas): number {
  return Object.keys(registro).filter((f: any) => diaEsBueno(registro, metas, f) === true).length;
}

/* La racha más larga que lograste alguna vez */
export function mejorRacha(registro: Registro, metas: Metas): number {
  const fechas = Object.keys(registro).sort();

  let mejor = 0;
  let actual = 0;

  for (const fecha of fechas) {
    const resultado = diaEsBueno(registro, metas, fecha);

    if (resultado === true) {
      actual++;
      if (actual > mejor) mejor = actual;
    } else if (resultado === false) {
      actual = 0;
    }
  }

  return mejor;
}

/* ==========================================================
   3) COMPRAR
   ==========================================================
   Devuelve un objeto con "ok" y un mensaje, en vez de tirar
   un error: comprar sin monedas no es una falla del programa,
   es algo normal que hay que contarle a la usuaria.
   ========================================================== */

/* ¿Ya lo tenés? Lo que vale 0 viene desbloqueado de entrada */
export function yaLoTenes(compras: Compras, tipo: TipoDeArticulo, id: string): boolean {
  if (precioDe(tipo, id) === 0) return true;
  return listaDeCompras(compras, tipo).includes(id);
}

export function comprar(
  registro: Registro,
  metas: Metas,
  compras: Compras,
  tipo: TipoDeArticulo,
  id: string,
  librosLeidos: unknown[] = []
): ResultadoDeCompra & { compras: Compras } {
  const articulo = catalogoDe(tipo)[id];

  if (!articulo) {
    return { ok: false, mensaje: "Ese artículo no existe.", compras };
  }

  if (yaLoTenes(compras, tipo, id)) {
    return { ok: false, mensaje: "Ya lo tenés.", compras };
  }

  const precio = precioDe(tipo, id);
  const tenes = monedasDisponibles(registro, metas, compras, librosLeidos);

  if (tenes < precio) {
    return { ok: false, mensaje: "Te faltan " + (precio - tenes) + " monedas.", compras };
  }

  /* Devolvemos una copia, no el mismo objeto mutado: si no,
     React no se entera de que cambió. */
  const nuevas: Compras = {
    mascotas: [...compras.mascotas],
    accesorios: [...compras.accesorios],
    fondos: [...compras.fondos],
  };
  listaDeCompras(nuevas, tipo).push(id);
  guardarCompras(nuevas);

  return { ok: true, mensaje: "¡" + tr(articulo.clave) + " desbloqueado!", compras: nuevas };
}

/* ==========================================================
   4) LOS LOGROS
   ==========================================================
   Medallas por hitos. También derivados: se calculan de tu
   historial, no se guardan.
   ========================================================== */

export const LOGROS: Logro[] = [
  { id: "primerDia", clave: "logroPrimerDia", claveDescripcion: "logroPrimerDiaDesc" },
  { id: "semana", clave: "logroSemana", claveDescripcion: "logroSemanaDesc" },
  { id: "mes", clave: "logroMes", claveDescripcion: "logroMesDesc" },
  { id: "racha7", clave: "logroRacha7", claveDescripcion: "logroRacha7Desc" },
  { id: "racha30", clave: "logroRacha30", claveDescripcion: "logroRacha30Desc" },
  { id: "joven", clave: "logroJoven", claveDescripcion: "logroJovenDesc" },
  { id: "adulto", clave: "logroAdulto", claveDescripcion: "logroAdultoDesc" },
  { id: "agua100", clave: "logroAgua100", claveDescripcion: "logroAgua100Desc" },
  { id: "ejercicio500", clave: "logroEjercicio500", claveDescripcion: "logroEjercicio500Desc" },
  { id: "coleccion", clave: "logroColeccion", claveDescripcion: "logroColeccionDesc" },
  { id: "primerLibro", clave: "logroPrimerLibro", claveDescripcion: "logroPrimerLibroDesc" },
  { id: "cincoLibros", clave: "logroCincoLibros", claveDescripcion: "logroCincoLibrosDesc" },
];

/* Cuánto sumaste de un hábito en toda tu historia */
export function totalHistoricoDe(registro: Registro, habitoId: IdHabito): number {
  return Object.values(registro).reduce((total: number, dia: any) => total + (dia[habitoId] ?? 0), 0);
}

export function logrosConseguidos(
  registro: Registro,
  metas: Metas,
  compras: Compras,
  etapaActual: Etapa,
  librosLeidos: unknown[] = []
): LogroConseguido[] {
  const diasBuenos = totalDiasBuenos(registro, metas);
  const mejor = mejorRacha(registro, metas);
  const libros = librosLeidos.length;

  const todasLasMascotas = Object.keys(MASCOTAS).every((id: any) => yaLoTenes(compras, "mascota", id));

  const conseguidos: Record<string, boolean> = {
    primerDia: diasBuenos >= 1,
    semana: diasBuenos >= 7,
    mes: diasBuenos >= 30,
    racha7: mejor >= 7,
    racha30: mejor >= 30,
    joven: etapaActual === "joven" || etapaActual === "adulto",
    adulto: etapaActual === "adulto",
    agua100: totalHistoricoDe(registro, "agua") >= 100,
    ejercicio500: totalHistoricoDe(registro, "ejercicio") >= 500,
    coleccion: todasLasMascotas,
    primerLibro: libros >= 1,
    cincoLibros: libros >= 5,
  };

  return LOGROS.map((logro: any) => ({
    ...logro,
    conseguido: conseguidos[logro.id] === true,
  }));
}
