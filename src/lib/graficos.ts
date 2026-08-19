/* ==========================================================
   HABITOTCHI · graficos
   GRÁFICOS SIMPLES CON CANVAS
   ==========================================================
   La app no usa ninguna librería externa de gráficos: son
   pocas figuras (barras, líneas y puntos), así que alcanza
   con dibujar directamente sobre un <canvas> usando su
   contexto 2D, el mismo mecanismo que ya usan los juegos de
   juegos/motor.ts. Esto evita depender de una librería
   solo para dos tipos de gráfico chicos.

   Los colores por defecto son los de la pantalla LCD, porque
   los gráficos se dibujan sobre el verde. Las dos series se
   distinguen por tono (tinta llena vs. tinta clara) y no por
   matiz, que es lo que funciona sobre un fondo monocromo.

   Hay dos funciones para dibujar:
     · dibujarGraficoBarras: para comparar dos series por
       período (ej: minutos de cardio vs. de fuerza, o de
       trabajo vs. estudio).
     · dibujarGraficoLineas: para ver la evolución de un solo
       valor en el tiempo (ej: el peso corporal).
   ========================================================== */


/* La paleta de los gráficos, sobre el verde del LCD.
   Serie A: tinta llena. Serie B: tinta al 45%, que sobre el
   verde se lee como un tono intermedio bien distinguible. */
export const GRAFICO_SERIE_A = "#16240a";
export const GRAFICO_SERIE_B = "rgba(22, 36, 10, 0.42)";
export const GRAFICO_TEXTO   = "rgba(22, 36, 10, 0.75)";


/* ----------------------------------------------------------
   GRÁFICO DE BARRAS DOBLES
   ----------------------------------------------------------
   buckets: [{etiqueta, ...}]  (ver lib/fechas.ts: bucketsGrafico)
   valoresA / valoresB: un número por bucket, mismo orden
   opciones: {colorA, colorB, colorTexto}
   ---------------------------------------------------------- */
export function dibujarGraficoBarras(canvas: any, buckets: any, valoresA: any, valoresB: any, opciones: any) {
  const ctx = canvas.getContext("2d");
  const ancho = canvas.width;
  const alto = canvas.height;
  const op = opciones || {};

  ctx.clearRect(0, 0, ancho, alto);

  const margenInferior = 16;
  const margenSuperior = 8;
  const alturaUtil = alto - margenInferior - margenSuperior;

  /* ---------- LA ESCALA SE ANCLA A TU META ----------
     Antes el tope era simplemente la barra más alta que se
     viera. Con un solo día cargado esa barra ES el máximo, así
     que 4 horas llenaban el gráfico… y 8 horas lo llenaban
     igual. La altura no significaba nada y no había ningún
     número de referencia para darse cuenta.

     Ahora el tope es el doble de tu meta: llegar a la meta te
     deja justo en la mitad, y el doble llega arriba de todo.
     Dos días distintos se ven distintos.

     Si algún día te pasás del doble, el tope se estira para que
     entre: la barra nunca se sale del gráfico. */
  const meta = Number(op.meta) > 0 ? Number(op.meta) : 0;
  const maximo = Math.max(1, meta * 2, ...valoresA, ...valoresB);

  const anchoGrupo = ancho / buckets.length;
  const anchoBarra = Math.max(3, Math.min(14, anchoGrupo / 3));

  ctx.font = "8px 'Quicksand', sans-serif";
  ctx.textAlign = "center";

  /* La línea de la meta, punteada, para saber de un vistazo si
     llegaste sin tener que leer ningún número. */
  if (meta > 0) {
    const y = alto - margenInferior - (meta / maximo) * alturaUtil;

    ctx.save();
    ctx.strokeStyle = op.colorTexto || GRAFICO_TEXTO;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
    ctx.stroke();
    ctx.restore();
  }

  buckets.forEach((balde: any, i: number) => {
    const xCentro = anchoGrupo * i + anchoGrupo / 2;

    const alturaA = (valoresA[i] / maximo) * alturaUtil;
    const alturaB = (valoresB[i] / maximo) * alturaUtil;

    ctx.fillStyle = op.colorA || GRAFICO_SERIE_A;
    ctx.fillRect(xCentro - anchoBarra - 1, alto - margenInferior - alturaA, anchoBarra, alturaA);

    ctx.fillStyle = op.colorB || GRAFICO_SERIE_B;
    ctx.fillRect(xCentro + 1, alto - margenInferior - alturaB, anchoBarra, alturaB);

    ctx.fillStyle = op.colorTexto || GRAFICO_TEXTO;
    ctx.fillText(balde.etiqueta, xCentro, alto - 4);
  });
}


/* ----------------------------------------------------------
   GRÁFICO DE LÍNEA
   ----------------------------------------------------------
   puntos: [{etiqueta, valor}], del más viejo al más nuevo
   opciones: {color, colorTexto}
   ---------------------------------------------------------- */
export function dibujarGraficoLineas(canvas: any, puntos: any, opciones: any) {
  const ctx = canvas.getContext("2d");
  const ancho = canvas.width;
  const alto = canvas.height;
  const op = opciones || {};

  ctx.clearRect(0, 0, ancho, alto);

  if (puntos.length === 0) {
    ctx.fillStyle = op.colorTexto || GRAFICO_TEXTO;
    ctx.font = "9px 'Quicksand', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Todavía no hay registros", ancho / 2, alto / 2);
    return;
  }

  const valores = puntos.map((p: any) => p.valor);
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const rango = maximo - minimo || 1;

  const margenLateral = 12;
  const margenSuperior = 10;
  const margenInferior = 16;
  const anchoUtil = ancho - margenLateral * 2;
  const alturaUtil = alto - margenSuperior - margenInferior;
  const paso = puntos.length > 1 ? anchoUtil / (puntos.length - 1) : 0;

  const coordenadaX = (i: number) => margenLateral + paso * i;
  const coordenadaY = (valor: number) => margenSuperior + alturaUtil - ((valor - minimo) / rango) * alturaUtil;

  ctx.beginPath();
  ctx.strokeStyle = op.color || GRAFICO_SERIE_A;
  ctx.lineWidth = 2;

  puntos.forEach((punto: any, i: number) => {
    const x = coordenadaX(i);
    const y = coordenadaY(punto.valor);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = op.color || GRAFICO_SERIE_A;
  puntos.forEach((punto: any, i: number) => {
    ctx.beginPath();
    ctx.arc(coordenadaX(i), coordenadaY(punto.valor), 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  /* Etiquetas del eje X: si hay muchos puntos, mostramos una
     de cada tanto para que no se pisen entre sí. */
  ctx.fillStyle = op.colorTexto || GRAFICO_TEXTO;
  ctx.font = "7px 'Quicksand', sans-serif";
  ctx.textAlign = "center";

  const saltoEtiquetas = Math.max(1, Math.ceil(puntos.length / 6));
  puntos.forEach((punto: any, i: number) => {
    const esUltimo = i === puntos.length - 1;
    if (i % saltoEtiquetas !== 0 && !esUltimo) return;
    ctx.fillText(punto.etiqueta, coordenadaX(i), alto - 4);
  });
}


/* ----------------------------------------------------------
   GRÁFICO DE PUNTOS (el balance de ánimo)
   ----------------------------------------------------------
   Un punto por registro, a la altura del ánimo que anotaste.
   Un día con dos registros muestra dos puntos: la idea es ver
   el patrón, no un promedio que aplane los días raros.

   baldes: los tramos de fecha (ver lib/fechas)
   porBalde: para cada balde, [{ nivel, color }]
     nivel va de 0 (el mejor) a niveles-1 (el peor)
   ---------------------------------------------------------- */
export function dibujarGraficoPuntos(canvas: any, baldes: any, porBalde: any, opciones: any) {
  const ctx = canvas.getContext("2d");
  const ancho = canvas.width;
  const alto = canvas.height;
  const op = opciones || {};
  const niveles = op.niveles || 5;

  ctx.clearRect(0, 0, ancho, alto);

  const margenInferior = 16;
  const margenSuperior = 10;
  const alturaUtil = alto - margenInferior - margenSuperior;
  const anchoBalde = ancho / baldes.length;
  const radio = 4;

  /* La línea del medio: separa los días buenos de los malos de
     un vistazo, sin tener que leer ninguna etiqueta. */
  const yMedio = margenSuperior + alturaUtil / 2;

  ctx.save();
  ctx.strokeStyle = op.colorTexto || GRAFICO_TEXTO;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, yMedio);
  ctx.lineTo(ancho, yMedio);
  ctx.stroke();
  ctx.restore();

  ctx.font = "8px 'Quicksand', sans-serif";
  ctx.textAlign = "center";

  baldes.forEach((balde: any, i: number) => {
    const puntos = porBalde[i] || [];

    /* Los registros de un mismo tramo se reparten a lo ancho en
       vez de apilarse: con dos anotaciones el mismo día, uno
       encima del otro se vería como un solo punto. */
    puntos.forEach((punto: any, k: number) => {
      const x = anchoBalde * i + (anchoBalde * (k + 1)) / (puntos.length + 1);
      const y = margenSuperior + (punto.nivel / (niveles - 1)) * alturaUtil;

      ctx.beginPath();
      ctx.arc(x, y, radio, 0, Math.PI * 2);
      ctx.fillStyle = punto.color;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = op.colorTexto || GRAFICO_TEXTO;
      ctx.stroke();
    });

    ctx.fillStyle = op.colorTexto || GRAFICO_TEXTO;
    ctx.fillText(balde.etiqueta, anchoBalde * i + anchoBalde / 2, alto - 4);
  });
}
