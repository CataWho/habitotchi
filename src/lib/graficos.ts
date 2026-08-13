/* ==========================================================
   HABITOTCHI · graficos.js
   GRÁFICOS SIMPLES CON CANVAS
   ==========================================================
   La app no usa ninguna librería externa de gráficos: son
   pocas figuras (barras, líneas y puntos), así que alcanza
   con dibujar directamente sobre un <canvas> usando su
   contexto 2D, el mismo mecanismo que ya usan los juegos de
   juegos.js. Esto evita depender de una librería de terceros
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
   buckets: [{etiqueta, ...}]  (ver fechas.js: bucketsGrafico)
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

  const maximo = Math.max(1, ...valoresA, ...valoresB);
  const anchoGrupo = ancho / buckets.length;
  const anchoBarra = Math.max(3, Math.min(14, anchoGrupo / 3));

  ctx.font = "8px 'Quicksand', sans-serif";
  ctx.textAlign = "center";

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
