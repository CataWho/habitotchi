import { useEffect, useRef, useState } from "react";
import { useHabitotchi } from "@/estado/useHabitotchi";
import { fechaDeHoy } from "@/lib/fechas";
import { fijarHabito } from "@/lib/registro";
import {
  TIPOS_COMIDA,
  agregarComida,
  cargarComidas,
  comidasDelDia,
  eliminarComida,
  nombreTipoComida,
  totalCaloriasDelDia,
} from "@/lib/alimentacion";
import { estimarCaloriasDeTexto } from "@/lib/ia";
import { estimarCaloriasConRespaldo } from "@/lib/alimentos-off";
import { ListaDeHabitos } from "@/componentes/comunes/BarraHabito";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel, Select } from "@/componentes/comunes/Panel";

/* ==========================================================
   ALIMENTACIÓN
   ==========================================================
   Lo que comés en el día, con las calorías estimadas. Cada
   comida que anotás cuenta para el hábito "comida", así tu
   día bueno lo tiene en cuenta.

   ---------- DE DÓNDE SALE LA ESTIMACIÓN ----------
   Primero el diccionario local (~50 alimentos con comida
   argentina): responde al instante, sin clave ni internet.

   Si no encuentra nada Y la app corre empaquetada (no en el
   navegador), se prueba con Open Food Facts como respaldo —
   ver lib/alimentos-off.ts para el porqué de esa condición
   (CORS: el servidor no deja llamarlo desde una página web).

   ---------- SIN EL CHEF CON FOTO, A PROPÓSITO ----------
   La estimación por foto (Gemini) necesita que cada persona
   consiga su propia clave, así que no es viable para una v1
   publicada en una tienda. El componente Chef.tsx sigue en el
   repo, sin usarse, para cuando haya un servidor propio que
   reparta el acceso a la IA.
   ========================================================== */

/* Cuánto esperamos después de la última tecla antes de
   consultar la red. Sin esto, cada letra tipeada dispara un
   pedido — nada grave para la usuaria, pero es maltratar un
   servicio gratuito y colaborativo por nada. */
const ESPERA_ANTES_DE_BUSCAR_MS = 500;

export function Alimentacion() {
  const { registro, sumarHabito } = useHabitotchi();
  const [comidas, setComidas] = useState(() => cargarComidas());
  const [tipo, setTipo] = useState(TIPOS_COMIDA[0]?.id ?? "desayuno");
  const [descripcion, setDescripcion] = useState("");
  const [calorias, setCalorias] = useState("");
  const [sugerencia, setSugerencia] = useState("");

  const hoy = fechaDeHoy();
  const delDia = comidasDelDia(comidas, hoy);
  const total = totalCaloriasDelDia(comidas, hoy);

  /* Cada vez que cambia la lista, el hábito "comida" queda con
     la cantidad exacta de comidas cargadas. Se fija en vez de
     sumar: si borrás una, el número tiene que bajar. */
  const sincronizarHabito = (lista: unknown[]) => {
    fijarHabito(registro, hoy, "comida", lista.length);
    sumarHabito("comida", 0); // fuerza el redibujado con el valor nuevo
  };

  /* El reloj del debounce, y de qué texto es la búsqueda que
     está en vuelo — para no pisar la sugerencia con la
     respuesta de algo que ya borraste o corregiste. */
  const reloj = useRef<number | undefined>(undefined);
  const textoEnVuelo = useRef("");

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const alEscribir = (texto: string) => {
    setDescripcion(texto);
    window.clearTimeout(reloj.current);

    if (!texto.trim()) {
      setSugerencia("");
      return;
    }

    /* Local primero, sin esperar nada: es instantáneo. */
    const local = estimarCaloriasDeTexto(texto);
    if (local) {
      setSugerencia(`${local.nombre}: unas ${local.calorias} kcal`);
      if (!calorias) setCalorias(String(local.calorias));
      return; // encontró algo específico, no hace falta la red
    }

    setSugerencia("");

    /* No local: recién acá vale la pena esperar y consultar el
       respaldo (que en la web no hace nada, ver arriba). */
    reloj.current = window.setTimeout(async () => {
      textoEnVuelo.current = texto;
      const resultado = await estimarCaloriasConRespaldo(texto);

      /* Si mientras esperábamos la usuaria ya escribió otra
         cosa, esta respuesta quedó vieja: la descartamos. */
      if (textoEnVuelo.current !== texto) return;

      if (resultado) {
        setSugerencia(`${resultado.nombre}: unas ${resultado.calorias} kcal`);
        if (!calorias) setCalorias(String(resultado.calorias));
      }
    }, ESPERA_ANTES_DE_BUSCAR_MS);
  };

  const agregar = () => {
    if (!descripcion.trim()) return;

    const nuevas = agregarComida(comidas, hoy, tipo, descripcion.trim(), Number(calorias) || 0);
    setComidas({ ...nuevas });
    sincronizarHabito(comidasDelDia(nuevas, hoy));

    setDescripcion("");
    setCalorias("");
    setSugerencia("");
  };

  const borrar = (indice: number) => {
    const nuevas = eliminarComida(comidas, hoy, indice);
    setComidas({ ...nuevas });
    sincronizarHabito(comidasDelDia(nuevas, hoy));
  };

  return (
    <Pagina nombre="Alimentación">
      <Panel titulo="Tus metas de hoy">
        <ListaDeHabitos ids={["agua", "comida", "dulces"]} />
      </Panel>

      <Panel titulo="Qué comiste">
        <div className="campo-fila">
          <Select
            valor={tipo}
            alCambiar={setTipo}
            opciones={TIPOS_COMIDA.map((t) => ({ id: t.id, nombre: t.nombre }))}
          />
        </div>

        <div className="campo-fila">
          <input
            className="input-rosa"
            value={descripcion}
            placeholder="milanesa con puré"
            onChange={(e) => alEscribir(e.target.value)}
          />
        </div>

        <div className="campo-fila">
          <input
            className="input-rosa"
            type="number"
            value={calorias}
            placeholder="kcal"
            style={{ width: "90px" }}
            onChange={(e) => setCalorias(e.target.value)}
          />
          <button type="button" className="habit-btn" onClick={agregar}>
            Agregar
          </button>
        </div>

        {sugerencia && <Ayuda>{sugerencia}</Ayuda>}
      </Panel>

      <Panel titulo={`Hoy · ${total} kcal`}>
        {delDia.length === 0 ? (
          <Ayuda>Todavía no anotaste ninguna comida hoy.</Ayuda>
        ) : (
          <ul className="lista-simple">
            {delDia.map((comida: any, i: number) => (
              <Fila key={i} alBorrar={() => borrar(i)}>
                <b>{nombreTipoComida(comida.tipo)}</b> · {comida.descripcion}
                {comida.calorias > 0 && ` · ${comida.calorias} kcal`}
              </Fila>
            ))}
          </ul>
        )}
      </Panel>

      <Ayuda>
        Las calorías son aproximadas y salen de un diccionario con comida argentina.
      </Ayuda>
    </Pagina>
  );
}
