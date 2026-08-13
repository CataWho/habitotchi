import { useState } from "react";
import {
  CATEGORIAS_HOBBIES,
  agregarActividadHobby,
  cargarDiscosEscuchados,
  cargarLibroActual,
  cargarLibrosLeidos,
  cargarRegistroHobbies,
  eliminarActividadHobby,
  eliminarDiscoEscuchado,
  eliminarLibroLeido,
  guardarLibroActual,
  marcarDiscoComoEscuchado,
  marcarLibroComoLeido,
  nombreCategoriaHobby,
} from "@/lib/hobbies";
import {
  buscarPortadaDisco,
  buscarPortadaLibro,
  cargarDiscoActual,
  guardarDiscoActual,
} from "@/lib/portadas";
import { fechaDeHoy } from "@/lib/fechas";
import { CLAVES } from "@/lib/almacenamiento";
import { useGuardado } from "@/estado/useGuardado";
import { ListaDeHabitos } from "@/componentes/comunes/BarraHabito";
import { Estrellas } from "@/componentes/comunes/Estrellas";
import { Pagina } from "@/componentes/comunes/Pagina";
import { Ayuda, Fila, Panel, Select } from "@/componentes/comunes/Panel";

/* ==========================================================
   HOBBIES
   ==========================================================
   El libro que estás leyendo (con su tapa, que se busca sola
   en Open Library) y un registro libre de actividades.
   ========================================================== */

export function Hobbies() {
  return (
    <Pagina nombre="Hobbies">
      <Panel titulo="Tu meta de hoy">
        <ListaDeHabitos ids={["lectura"]} />
      </Panel>

      <LibroActual />
      <LibrosTerminados />
      <DiscoActual />
      <DiscosEscuchados />
      <Actividades />
    </Pagina>
  );
}

function LibroActual() {
  const [libro, setLibro] = useState(() => cargarLibroActual());
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");

  const guardar = async () => {
    if (!titulo.trim()) return;

    setBuscando(true);
    setAviso("");

    let tapa = null;
    try {
      tapa = await buscarPortadaLibro(titulo, autor);
    } catch {
      /* Sin internet o el servicio caído: guardamos igual, sin
         tapa. No tiene sentido perder lo que escribiste. */
      setAviso("No se pudo buscar la tapa, pero el libro quedó guardado.");
    }

    const nuevo = {
      titulo: tapa?.titulo ?? titulo.trim(),
      autor: tapa?.autor ?? autor.trim(),
      imagen: tapa?.imagen ?? "",
    };

    guardarLibroActual(nuevo);
    setLibro(nuevo);
    setBuscando(false);
    setTitulo("");
    setAutor("");
  };

  return (
    <Panel titulo="Qué estás leyendo">
      {libro.titulo ? (
        <div className="tapa-fila">
          {libro.imagen && <img src={libro.imagen} alt="" className="tapa-chica" />}
          <div>
            <b>{libro.titulo}</b>
            {libro.autor && (
              <>
                <br />
                <span className="ayuda-chica">{libro.autor}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <Ayuda>Todavía no cargaste ningún libro.</Ayuda>
      )}

      <div className="campo-fila">
        <input className="input-rosa" value={titulo} placeholder="título"
          onChange={(e) => setTitulo(e.target.value)} />
        <input className="input-rosa" value={autor} placeholder="autor"
          onChange={(e) => setAutor(e.target.value)} />
        <button type="button" className="habit-btn" onClick={guardar} disabled={buscando}>
          {buscando ? "..." : "Guardar"}
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}
    </Panel>
  );
}

function LibrosTerminados() {
  const [leidos, setLeidos] = useState(() => cargarLibrosLeidos());

  /* El libro que estás leyendo se carga en el panel de arriba
     y se mira acá. Con useState quedaba congelado en lo que
     hubiera al abrir la pestaña: cargabas un libro y las
     estrellas para puntuarlo no aparecían hasta recargar toda
     la app, que es justo lo que parecía "faltan las
     estrellitas". */
  const libro = useGuardado(CLAVES.libroActual, cargarLibroActual);
  const [puntaje, setPuntaje] = useState(0);

  const terminar = () => {
    if (!libro.titulo) return;
    setLeidos([...marcarLibroComoLeido(leidos, libro, fechaDeHoy(), puntaje).lista]);
    setPuntaje(0);
  };

  return (
    <Panel titulo="Libros terminados">
      {libro.titulo && (
        <>
          <Ayuda>¿Qué te pareció?</Ayuda>
          <Estrellas valor={puntaje} alElegir={setPuntaje} />

          <div className="campo-fila">
            <button type="button" className="habit-btn" onClick={terminar}>
              Terminé "{libro.titulo}"
            </button>
          </div>
        </>
      )}

      {leidos.length === 0 ? (
        <Ayuda>Todavía no terminaste ningún libro. Cada uno suma 30 monedas.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {leidos.map((entrada: any, i: number) => (
            <Fila key={i} alBorrar={() => setLeidos([...eliminarLibroLeido(leidos, i)])}>
              <b>{entrada.titulo}</b>
              {entrada.autor && ` · ${entrada.autor}`}
              {entrada.calificacion > 0 && (
                <Estrellas valor={entrada.calificacion} soloLectura />
              )}
            </Fila>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ----------------------------------------------------------
   MÚSICA
   ----------------------------------------------------------
   El disco que estás escuchando, con su tapa. La busca sola
   en la API de iTunes, que no pide clave ni registro.
   ---------------------------------------------------------- */
function DiscoActual() {
  const [disco, setDisco] = useState(() => cargarDiscoActual());
  const [album, setAlbum] = useState("");
  const [artista, setArtista] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");

  const guardar = async () => {
    if (!album.trim()) return;

    setBuscando(true);
    setAviso("");

    let tapa = null;
    try {
      tapa = await buscarPortadaDisco(album, artista);
    } catch {
      setAviso("No se pudo buscar la tapa, pero el disco quedó guardado.");
    }

    const nuevo = {
      titulo: tapa?.titulo ?? album.trim(),
      artista: tapa?.artista ?? artista.trim(),
      imagen: tapa?.imagen ?? "",
      idDisco: tapa?.idDisco ?? null,
    };

    guardarDiscoActual(nuevo);
    setDisco(nuevo);
    setBuscando(false);
    setAlbum("");
    setArtista("");
  };

  return (
    <Panel titulo="Qué estás escuchando">
      {disco.titulo ? (
        <div className="tapa-fila">
          {disco.imagen && <img src={disco.imagen} alt="" className="tapa-chica" />}
          <div>
            <b>{disco.titulo}</b>
            {disco.artista && (
              <>
                <br />
                <span className="ayuda-chica">{disco.artista}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <Ayuda>Todavía no cargaste ningún disco.</Ayuda>
      )}

      <div className="campo-fila">
        <input className="input-rosa" value={album} placeholder="disco"
          onChange={(e) => setAlbum(e.target.value)} />
        <input className="input-rosa" value={artista} placeholder="artista"
          onChange={(e) => setArtista(e.target.value)} />
        <button type="button" className="habit-btn" onClick={guardar} disabled={buscando}>
          {buscando ? "..." : "Guardar"}
        </button>
      </div>

      {aviso && <Ayuda>{aviso}</Ayuda>}
    </Panel>
  );
}

function DiscosEscuchados() {
  const [escuchados, setEscuchados] = useState(() => cargarDiscosEscuchados());
  const disco = useGuardado(CLAVES.discoActual, cargarDiscoActual);   /* ídem libros */
  const [puntaje, setPuntaje] = useState(0);

  const terminar = () => {
    if (!disco.titulo) return;
    setEscuchados([...marcarDiscoComoEscuchado(escuchados, disco, fechaDeHoy(), puntaje).lista]);
    setPuntaje(0);
  };

  return (
    <Panel titulo="Discos que escuchaste">
      {disco.titulo && (
        <>
          <Ayuda>¿Qué te pareció?</Ayuda>
          <Estrellas valor={puntaje} alElegir={setPuntaje} />

          <div className="campo-fila">
            <button type="button" className="habit-btn" onClick={terminar}>
              Escuché "{disco.titulo}"
            </button>
          </div>
        </>
      )}

      {escuchados.length === 0 ? (
        <Ayuda>Todavía no anotaste ningún disco.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {escuchados.map((entrada: any, i: number) => (
            <Fila key={i} alBorrar={() => setEscuchados([...eliminarDiscoEscuchado(escuchados, i)])}>
              <b>{entrada.titulo}</b>
              {entrada.artista && ` · ${entrada.artista}`}
              {entrada.calificacion > 0 && (
                <Estrellas valor={entrada.calificacion} soloLectura />
              )}
            </Fila>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Actividades() {
  const [registro, setRegistro] = useState(() => cargarRegistroHobbies());
  const [categoria, setCategoria] = useState(CATEGORIAS_HOBBIES[0]?.id ?? "");
  const [nota, setNota] = useState("");

  const agregar = () => {
    if (!nota.trim()) return;
    setRegistro([...agregarActividadHobby(registro, fechaDeHoy(), categoria, nota.trim())]);
    setNota("");
  };

  return (
    <Panel titulo="Otras actividades">
      <div className="campo-fila">
        <Select
          valor={categoria}
          alCambiar={setCategoria}
          opciones={CATEGORIAS_HOBBIES.map((c: any) => ({ id: c.id, nombre: c.nombre }))}
        />
      </div>

      <div className="campo-fila">
        <input className="input-rosa" value={nota} placeholder="qué hiciste"
          onChange={(e) => setNota(e.target.value)} />
        <button type="button" className="habit-btn" onClick={agregar}>Agregar</button>
      </div>

      {registro.length === 0 ? (
        <Ayuda>Todavía no anotaste ninguna actividad.</Ayuda>
      ) : (
        <ul className="lista-simple">
          {registro.slice(0, 10).map((entrada: any, i: number) => (
            <Fila key={i} alBorrar={() => setRegistro([...eliminarActividadHobby(registro, i)])}>
              {entrada.fecha} · <b>{nombreCategoriaHobby(entrada.categoria)}</b> · {entrada.nota}
            </Fila>
          ))}
        </ul>
      )}
    </Panel>
  );
}
