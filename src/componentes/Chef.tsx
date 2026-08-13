import { useState } from "react";
import { CLAVES, leerTexto } from "@/lib/almacenamiento";
import { archivoABase64, estimarCaloriasDeTexto, reconocerComidaConIA } from "@/lib/ia";
import { TIPOS_COMIDA, agregarComida, cargarComidas } from "@/lib/alimentacion";
import { fechaDeHoy } from "@/lib/fechas";
import { Ayuda, Panel, Select } from "@/componentes/comunes/Panel";
import { Pixeles } from "@/componentes/comunes/Pixeles";
import { CHEF_COLORES, CHEF_PIXELES } from "@/datos/chef";

/* ==========================================================
   EL CHEF
   ==========================================================
   Sacás una foto de la comida y estima las calorías con
   Gemini. Sin clave configurada anda igual: escribís qué
   comiste y lo busca en el diccionario local.

   La clave la pone la usuaria en Ajustes y viaja directo del
   navegador a Google. No hay servidor de por medio.
   ========================================================== */

interface ItemDeComida {
  nombre: string;
  calorias: number;
}

export function Chef({ onCerrar }: { onCerrar: () => void }) {
  const [tipo, setTipo] = useState(TIPOS_COMIDA[0]?.id ?? "desayuno");
  const [vistaPrevia, setVistaPrevia] = useState("");
  const [estado, setEstado] = useState("");
  const [items, setItems] = useState<ItemDeComida[]>([]);
  const [manual, setManual] = useState("");

  const clave = leerTexto(CLAVES.apiKey);
  const total = items.reduce((suma, i) => suma + i.calorias, 0);

  const mirarLaFoto = async (archivo: File) => {
    setVistaPrevia(URL.createObjectURL(archivo));

    if (!clave) {
      setEstado("Para leer fotos hace falta configurar la clave en Ajustes. Mientras tanto, anotá a mano abajo.");
      return;
    }

    setEstado("Mirando la foto...");

    try {
      const base64 = await archivoABase64(archivo);
      const respuesta: any = await reconocerComidaConIA(String(base64), archivo.type, clave);
      const encontrados: ItemDeComida[] = respuesta?.alimentos ?? [];

      if (encontrados.length === 0) {
        setEstado("No reconocí nada comestible. Probá con otra foto o anotalo a mano.");
        return;
      }

      setItems(encontrados);
      setEstado("");
    } catch (error) {
      /* Puede fallar por la clave, por la cuota diaria o por
         estar sin internet. No sabemos cuál, así que decimos
         algo útil en vez de un mensaje técnico. */
      setEstado("No pude consultar al chef. Puede ser la clave, la cuota del día o que no haya internet.");
    }
  };

  const agregarAMano = () => {
    if (!manual.trim()) return;

    const estimado = estimarCaloriasDeTexto(manual);
    setItems([
      ...items,
      { nombre: estimado?.nombre ?? manual.trim(), calorias: estimado?.calorias ?? 0 },
    ]);
    setManual("");
  };

  const guardar = () => {
    if (items.length === 0) return;

    const comidas = cargarComidas();
    const descripcion = items.map((i) => i.nombre).join(", ");
    agregarComida(comidas, fechaDeHoy(), tipo, descripcion, total);

    onCerrar();
  };

  return (
    <div className="chef-overlay" onClick={onCerrar}>
      <div className="chef-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chef-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>

        <Pixeles pixeles={CHEF_PIXELES} colores={CHEF_COLORES} tam={5} className="chef-dibujo" etiqueta="El chef" />

        <h2 className="panel-title">El chef</h2>

        <Panel>
          <div className="campo-fila">
            <Select
              valor={tipo}
              alCambiar={setTipo}
              etiqueta="Tipo de comida"
              opciones={TIPOS_COMIDA.map((t: any) => ({ id: t.id, nombre: t.nombre }))}
            />
          </div>

          <div className="campo-fila">
            <label className="habit-btn" style={{ cursor: "pointer" }}>
              Sacar o elegir una foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  if (archivo) mirarLaFoto(archivo);
                }}
              />
            </label>
          </div>

          {vistaPrevia && <img className="chef-vista-previa" src={vistaPrevia} alt="La foto que sacaste" />}
          {estado && <p className="chef-estado">{estado}</p>}
        </Panel>

        <Panel titulo="Lo que va a quedar anotado">
          {items.length === 0 ? (
            <Ayuda>Todavía no hay nada. Sacá una foto o anotalo a mano.</Ayuda>
          ) : (
            <ul className="lista-simple">
              {items.map((item, i) => (
                <li key={i} className="fila-simple">
                  <span>{item.nombre} · {item.calorias} kcal</span>
                  <button
                    type="button"
                    className="fila-borrar"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    aria-label="Sacar"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="campo-fila">
            <input
              className="input-rosa"
              value={manual}
              placeholder="alimento (ej: dos empanadas)"
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarAMano()}
            />
            <button type="button" className="habit-btn" onClick={agregarAMano}>
              Sumar
            </button>
          </div>

          {items.length > 0 && (
            <>
              <p className="chef-total">Total: {total} kcal</p>
              <button type="button" className="habit-btn" onClick={guardar}>
                Guardar en mi día
              </button>
            </>
          )}
        </Panel>

        <Ayuda>
          Las calorías son siempre aproximadas. Si no configuraste la clave, el chef usa un
          diccionario local con comida argentina.
        </Ayuda>
      </div>
    </div>
  );
}
