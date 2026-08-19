# Habitotchi 💜

Una app de hábitos con forma de tamagotchi retro. Cuidás tus hábitos, y tu mascota
crece con vos: si te va bien, crece feliz; si la abandonás mucho tiempo, se muere y
elegís una nueva.

## Usar la app

**<https://habitotchi.netlify.app>**

Se abre en el navegador, sin instalar nada. Desde el celular se puede agregar a la
pantalla de inicio y queda como una app más: es una PWA, así que funciona también sin
conexión.

---

Lo que sigue es para trabajar en el código. Si solo querés usar la app, con el link
de arriba alcanza.

## Levantar el proyecto

```bash
npm install
npm run dev
```

Eso deja el proyecto corriendo en <http://localhost:5173>, que es una dirección de tu
propia computadora: existe mientras el comando esté abierto y no es accesible desde
afuera. Sirve para ver los cambios al instante mientras se edita el código.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo, con recarga al guardar |
| `npm test` | Corre los tests una vez |
| `npm run test:mirar` | Los tests, quedándose a mirar los cambios |
| `npm run tipos` | Solo revisa los tipos, sin compilar |
| `npm run build` | Revisa los tipos y compila a `dist/` |
| `npm run cap:android` | Compila y abre el proyecto de Android |
| `npm run cap:ios` | Compila y abre el de iOS (necesita una Mac) |

## Cómo se publica

Netlify está conectado al repositorio: cada vez que llegan cambios a la rama `main`
compila el proyecto y publica el resultado. No hay que subir archivos a mano.

La configuración del build está en `netlify.toml` (compila con `npm run build` y
publica la carpeta `dist`).

Las variables de entorno de producción se cargan en el panel de Netlify, no en el
repositorio.

### Variables de entorno

Se leen de un archivo `.env.local` en la raíz, que no se versiona.

| Variable | Para qué sirve |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de ese proyecto |
| `VITE_GOOGLE_CLIENT_ID` | ID de cliente OAuth, para leer Google Calendar |

Ninguna es obligatoria para desarrollar. Sin las de Supabase la app corre en modo
local, sin cuentas ni sincronización; sin la de Google, el calendario funciona con
notas propias y no ofrece conectar la cuenta.

## El stack

- **Vite** para el build y la recarga instantánea
- **React + TypeScript** en modo estricto
- **Zustand** para el estado
- **Supabase** para cuentas y sincronización
- **Vitest** para los tests
- **Capacitor** para empaquetarla como app de iOS y Android
- **vite-plugin-pwa** para el service worker

El código está escrito en español: nombres, carpetas y comentarios.

## Cómo está organizado

```
src/
├── datos/          catálogos y dibujos, sin lógica
├── lib/            el dominio: puro, sin DOM, y es lo que se testea
├── estado/         el store (Zustand)
├── idiomas/        los diccionarios de texto
├── componentes/    el aparato, la mascota y las piezas compartidas
├── pantallas/      una por pestaña
├── juegos/         el motor de los tres jueguitos, sobre canvas
├── estilos/        el CSS
└── tipos/          las formas de los datos
tests/              los tests
supabase/           el esquema SQL de la base
```

La regla que ordena todo: **`lib/` no toca el DOM**. Por eso se puede testear sin
navegador, y por eso hay un solo archivo que sabe de almacenamiento
(`lib/almacenamiento.ts`).

## Los datos

Todo se guarda primero en el navegador, con claves propias bajo el prefijo
`habitotchi_`. La app funciona completa sin conexión.

Si hay credenciales de Supabase configuradas, la app pide iniciar sesión y
sincroniza esas claves con la cuenta: al entrar baja lo que haya en la nube y al
cambiar algo lo sube. La lista de qué se sincroniza está en `CLAVES_QUE_SINCRONIZAN`
(`src/lib/nube.ts`). Las preferencias del dispositivo —el idioma y el sonido— no se
sincronizan a propósito.

En la base, cada fila pertenece a su dueña y hay políticas de acceso por fila que lo
imponen; el esquema está en `supabase/esquema.sql`.

## Idiomas

La app está en español y en inglés. No usa ninguna librería de internacionalización:
el traductor vive en `src/lib/idioma.ts` y los textos en `src/idiomas/`.

`es.ts` es la fuente de verdad y `en.ts` se tipa contra él, así que olvidarse una
traducción es un error de compilación y no una sorpresa en producción. Los huecos de
los textos van con nombre (`{n}`, `{etapa}`) y no por posición, porque el orden de
las palabras cambia entre los dos idiomas.

Arranca según el idioma del dispositivo y se puede cambiar desde Ajustes.

`public/privacidad.html` queda en español: es un documento legal que cita la ley
argentina.

## Los tests

351 tests. Los que más valen la pena no son los obvios:

- `tests/datos-mascotas.test.ts` revisa los 18 dibujos (6 mascotas × 3 etapas): que
  las filas midan lo mismo, que la carita caiga sobre el cuerpo, que el dibujo esté
  centrado, que no haya píxeles sueltos y que los accesorios entren en la cabeza.
- `tests/datos-fondos.test.ts` mide el contraste de cada fondo de pantalla contra las
  dos puntas de su degradado, y también el de los campos de texto. Si alguien agrega
  un fondo con colores que no se leen, falla acá y no cuando ya está publicado.
- `tests/idiomas.test.ts` verifica que los dos diccionarios tengan las mismas claves,
  los mismos huecos y los mismos plurales, y que no haya quedado texto sin traducir.
- `tests/juegos.test.ts` hace correr los tres juegos con relojes falsos y un canvas
  de mentira que anota qué se dibujó. Con eso se comprueba la mecánica —la altura del
  salto, que la paleta frene en el borde, que un gol sume— sin depender de píxeles.

## Las calorías de la comida

Las estima un diccionario local de unos 140 alimentos (`CALORIAS_COMUNES` en
`src/lib/ia.ts`), con español e inglés en la misma tabla. Busca por coincidencia
parcial y se queda con la más específica —"dulce de leche" le gana a "leche"—, y
después lee el texto para ajustar la cantidad: "2 empanadas" multiplica por dos. No
pide clave ni internet.

Hay además un modo con foto que usa la API de Gemini. Está desconectado: necesita que
cada persona consiga su propia clave, que es un paso que no se le puede pedir a
alguien que baja la app de una tienda. El código sigue en `src/lib/ia.ts` y
`src/componentes/Chef.tsx`, sin usarse.

## Google Calendar

Con un ID de cliente OAuth configurado, el calendario puede mostrar los eventos de
Google junto a las notas propias. El permiso es de solo lectura: la app no crea, no
edita ni borra nada en el calendario.

## Privacidad

Los datos se guardan en el dispositivo y, si hay cuenta, en el proyecto de Supabase
de la instalación. La política completa está en `public/privacidad.html`.

## Licencia

Todos los derechos reservados. El código está publicado para poder leerlo, pero no
se permite copiarlo, modificarlo ni publicar versiones derivadas sin autorización
escrita. La app publicada se puede usar libremente.

Ver [LICENSE](LICENSE).
