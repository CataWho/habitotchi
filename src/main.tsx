import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "./estilos/base.css";
import "./estilos/aparato.css";

const raiz = document.getElementById("raiz");

if (!raiz) throw new Error("No se encontró el elemento #raiz en index.html");

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* Nota: si algo del deslizado entre pestañas se comporta raro,
   probá sacando StrictMode. En desarrollo monta cada efecto dos
   veces a propósito, para destapar efectos mal limpiados. */
