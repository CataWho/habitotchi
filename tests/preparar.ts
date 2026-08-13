import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

/* Cada test arranca con el navegador limpio. Sin esto, lo que
   guarda un test se le aparece al siguiente y los resultados
   dependen del orden en que corren. */
beforeEach(() => {
  localStorage.clear();
});
