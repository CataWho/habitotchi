import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Ajustes } from "@/componentes/Ajustes";
import { cargarPerfil } from "@/lib/perfil";

/* ==========================================================
   LOS DOS PANELES DEL PERFIL NO SE PISAN
   ==========================================================
   "Sobre vos" y "Qué mostrar" editan campos distintos del
   mismo objeto guardado. Cuando cada uno tenía su propia copia
   en memoria, tocar el segundo revertía lo que acababas de
   escribir en el primero: pérdida de datos silenciosa, con los
   dos controles a diez píxeles de distancia.

   Este test hace exactamente esa secuencia.
   ========================================================== */

describe("Ajustes · el perfil compartido entre paneles", () => {
  beforeEach(() => localStorage.clear());

  it("REGRESIÓN: tocar el interruptor del ciclo no borra el nombre recién escrito", () => {
    render(<Ajustes onCerrar={() => {}} />);

    const nombre = screen.getByPlaceholderText("¿Cómo te llamás?");
    fireEvent.change(nombre, { target: { value: "Cata" } });
    expect(cargarPerfil().nombre).toBe("Cata");

    /* El otro panel, con su propia lectura del mismo perfil. */
    const ciclo = screen.getByRole("checkbox", { name: /ciclo menstrual/i });
    fireEvent.click(ciclo);

    const perfil = cargarPerfil();
    expect(perfil.cicloActivado).toBe(false);
    expect(perfil.nombre, "el nombre no tendría que haberse perdido").toBe("Cata");
  });

  it("y al revés: escribir el nombre no vuelve a prender el ciclo apagado", () => {
    render(<Ajustes onCerrar={() => {}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /ciclo menstrual/i }));
    expect(cargarPerfil().cicloActivado).toBe(false);

    fireEvent.change(screen.getByPlaceholderText("¿Cómo te llamás?"), {
      target: { value: "Cata" },
    });

    const perfil = cargarPerfil();
    expect(perfil.nombre).toBe("Cata");
    expect(perfil.cicloActivado, "el ciclo tendría que seguir apagado").toBe(false);
  });

  it("los dos paneles ven el mismo perfil apenas cambia", () => {
    render(<Ajustes onCerrar={() => {}} />);

    const ciclo = screen.getByRole("checkbox", { name: /ciclo menstrual/i }) as HTMLInputElement;
    expect(ciclo.checked).toBe(true);

    fireEvent.click(ciclo);
    expect(ciclo.checked, "el control tiene que reflejar lo guardado").toBe(false);
  });
});
