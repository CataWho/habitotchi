/// <reference types="vite/client" />

/* ==========================================================
   LAS VARIABLES DE ENTORNO
   ==========================================================
   Declararlas acá hace que TypeScript avise si se escribe mal
   el nombre de una, en vez de darte undefined en silencio.

   Todas empiezan con VITE_ porque Vite solo mete en el build
   las que llevan ese prefijo. Es una red de seguridad: lo que
   se pone acá termina dentro del JavaScript que se le manda a
   cada persona, así que NUNCA va un secreto de verdad.
   ========================================================== */

interface ImportMetaEnv {
  /* El identificador público de la app ante Google, para
     conectar el calendario. No es una contraseña: ver el
     comentario largo en lib/google-calendar.ts. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
