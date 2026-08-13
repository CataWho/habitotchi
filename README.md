# Habitotchi 💜

Una app de hábitos con forma de tamagotchi retro. Cuidás tus hábitos, y tu mascota
crece con vos: si te va bien, crece feliz; si la abandonás mucho tiempo, se muere y
elegís una nueva.

## Cómo levantarla

```bash
npm install
npm run dev
```

Abre en <http://localhost:5173>.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo, con recarga al guardar |
| `npm test` | Corre los tests una vez |
| `npm run test:mirar` | Los tests, quedándose a mirar los cambios |
| `npm run tipos` | Solo revisa los tipos, sin compilar |
| `npm run build` | Compila a `dist/` |
| `npm run cap:android` | Compila y abre el proyecto de Android |
| `npm run cap:ios` | Compila y abre el de iOS (necesita una Mac) |

## Cómo está organizado

```
src/
├── datos/          configuración y dibujos, sin lógica
├── lib/            el dominio: puro, sin DOM, y es lo que se testea
├── estado/         el store (Zustand)
├── componentes/    el aparato y la mascota
├── pantallas/      una por pestaña
├── estilos/        el CSS
└── tipos/          las formas de los datos
tests/              los tests
legacy/             la versión anterior, mientras se termina de portar
```

La regla que ordena todo: **`lib/` no toca el DOM**. Por eso se puede testear sin
navegador, y por eso el día que sumemos sincronización con la nube hay un solo
archivo que cambiar (`lib/almacenamiento.ts`).

## El stack

- **Vite** para el build y la recarga instantánea
- **React + TypeScript** en modo estricto
- **Zustand** para el estado
- **Vitest** para los tests
- **Capacitor** para empaquetarla como app de iOS y Android
- **vite-plugin-pwa** para el service worker

El código está todo en español: nombres, carpetas y comentarios.

## Los tests

231 tests. Los que más valen la pena no son los obvios:

- `tests/datos-mascotas.test.ts` revisa los 18 dibujos (6 mascotas x 3 etapas):
  que las filas midan lo mismo, que la carita caiga sobre el cuerpo, que el dibujo
  esté centrado, que no haya pixeles sueltos y que los accesorios entren en la
  cabeza. Estos chequeos encontraron tres bugs que a ojo no se veían.
- `tests/datos-fondos.test.ts` mide el contraste de cada fondo de pantalla contra
  las dos puntas de su degradado. Si alguien agrega un fondo con colores que no se
  leen, falla acá y no cuando ya está publicado.

## Estado de la migración

La app funcionaba como HTML, CSS y JavaScript sueltos. Ya está toda pasada a esta
estructura: el aparato, las 9 pantallas, el dominio, los datos y los juegos.

`legacy/` guarda la versión anterior como referencia. Se puede borrar cuando ya no
haga falta comparar.

Tus datos no se pierden: las claves del navegador son las mismas de siempre.

### Lo que quedó más flojo

Los módulos de dominio que se portaron en bloque (`ejercicio`, `salud`, `hobbies`,
`trabajo`, `alimentacion`, `ia`, `portadas`, `graficos`) tienen varios parámetros
tipados como `any`. Funcionan igual, pero no aprovechan TypeScript del todo. La idea
es irlos apretando de a uno, empezando por los que más se tocan.

Los tres juegos son un puerto directo del canvas original: su estado interno también
usa `any`. Es un bucle de dibujo, no datos que salgan del archivo, así que ahí molesta
bastante menos.

## Pendientes para publicar

### Las calorías de la comida

Hoy las estima un **diccionario local** de ~50 alimentos con comida argentina
(`CALORIAS_COMUNES` en `src/lib/ia.ts`). Busca por coincidencia parcial, se queda
con la más específica —"dulce de leche" le gana a "leche"— y después lee el texto
para ajustar la cantidad: "2 empanadas grandes" multiplica por 2 y por 1.5.

No pide clave ni internet, así que anda para todo el mundo.

**El chef con foto está desconectado a propósito.** Necesita que cada persona
consiga su propia clave de Gemini en aistudio.google.com: un paso técnico que la
mayoría de quien baja una app de una tienda no va a hacer. El código sigue en
`src/lib/ia.ts` y `src/componentes/Chef.tsx`, sin usarse. Para reactivarlo hace
falta un servidor propio que guarde una sola clave y limite cuántas fotos manda
cada usuaria.

### Los pasos

Se cargan a mano. Se pueden leer del teléfono cuando la app corra empaquetada: la
API ya está verificada y el bloqueante anotado (el plugin pide Capacitor 8, el
proyecto está en 7) en notas aparte que no viven en este repo.

### Google Calendar

Podés ver tus eventos reales en el calendario. Requiere publicar la app y crear un
ID de cliente OAuth. Sin conectar, el calendario funciona con tus propias notas.

## Privacidad

Todo se guarda en el navegador, en tu propia computadora. No hay servidor, no hay
cuentas — salvo las fotos que le pases al chef, que van directo a Google, y solo si
configuraste tu clave.

## Licencia

MIT — ver [LICENSE](LICENSE).
