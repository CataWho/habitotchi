import type { CapacitorConfig } from "@capacitor/cli";

/* ==========================================================
   HABITOTCHI · empaquetado como app nativa
   ==========================================================
   Capacitor mete la app web adentro de un proyecto de iOS y
   otro de Android, sin reescribir nada. Es lo que permite
   subirla a la App Store y a Google Play.

   ---------- EL appId NO SE CAMBIA DESPUÉS ----------
   Es el identificador con el que las tiendas la conocen. Una
   vez publicada, cambiarlo significa publicar otra app
   distinta y perder las descargas. Conviene decidirlo ahora.

   ---------- CÓMO SE ARRANCA ----------
     npx cap add android      (una sola vez)
     npx cap add ios          (una sola vez, necesita Mac)
     npm run cap:android      compila y abre Android Studio

   Los proyectos nativos que crea cap add SÍ se versionan:
   ahí adentro van los iconos, los permisos y las firmas.
   ========================================================== */

const config: CapacitorConfig = {
  appId: "ar.com.habitotchi.app",
  appName: "Habitotchi",

  /* Lo que Capacitor empaqueta es el resultado del build */
  webDir: "dist",

  plugins: {
    /* ----------------------------------------------------------
       PARA PODER LLAMAR A OPEN FOOD FACTS
       ----------------------------------------------------------
       Open Food Facts no manda el header Access-Control-Allow-
       Origin, así que un fetch() normal de navegador lo rechaza
       por CORS (verificado: da "blocked by CORS policy", no un
       error de red). Pasa con cualquier página web, no es un
       problema de esta app en particular.

       Con esto activado, Capacitor reemplaza window.fetch por
       una versión que hace el pedido desde el código nativo
       (Swift/Kotlin) en vez del WebView. Ahí no hay CORS: es una
       app pidiendo datos, no una página. Por eso en
       lib/alimentos-off.ts la consulta solo se intenta cuando
       Capacitor.isNativePlatform() da true — en la versión web
       (que sigue siendo el modo principal) directamente no se
       llama, así no aparece el error en la consola. */
    CapacitorHttp: {
      enabled: true,
    },
  },

  android: {
    /* El fondo que se ve un instante antes de que cargue la
       app: el mismo violeta oscuro del cielo, para que no
       pegue un flash blanco. */
    backgroundColor: "#161233",
  },

  ios: {
    backgroundColor: "#161233",
    /* Sin rebote al llegar al final del scroll: adentro de la
       pantallita del tamagotchi queda raro. */
    scrollEnabled: false,
  },
};

export default config;
