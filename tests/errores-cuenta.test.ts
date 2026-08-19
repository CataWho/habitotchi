import { describe, it, expect, beforeEach } from "vitest";
import { mensajeDeError } from "@/lib/nube";

beforeEach(() => localStorage.setItem("habitotchi_idioma", "es"));

describe("los errores de la cuenta se explican", () => {
  const casos: [string, string][] = [
    ["email rate limit exceeded", "muchos mails"],
    ["User already registered", "ya tiene una cuenta"],
    ["Invalid login credentials", "no coinciden"],
    ["Email not confirmed", "confirmar tu mail"],
    ["Unable to validate email address: invalid format", "no parece válido"],
    ["Failed to fetch", "No hay conexión"],
  ];

  it.each(casos)("%s", (crudo, esperado) => {
    expect(mensajeDeError(new Error(crudo))).toContain(esperado);
  });

  it("uno desconocido se muestra tal cual, sin inventar", () => {
    expect(mensajeDeError(new Error("algo rarisimo del servidor"))).toBe("algo rarisimo del servidor");
  });

  it("sin mensaje no explota", () => {
    expect(mensajeDeError(undefined)).toBeTruthy();
    expect(mensajeDeError({})).toBeTruthy();
  });
});

describe("y también salen en inglés", () => {
  /* Antes había una traducción aparte con el castellano escrito
     a mano dentro de lib/nube.ts, que se aplicaba al lanzar el
     error. Ganaba siempre: con la app en inglés te contestaba
     igual en castellano. */
  it("no quedan textos en castellano cuando la app está en inglés", () => {
    localStorage.setItem("habitotchi_idioma", "en");

    const casos = [
      "email rate limit exceeded",
      "User already registered",
      "Invalid login credentials",
      "Email not confirmed",
    ];

    for (const crudo of casos) {
      const dicho = mensajeDeError(new Error(crudo));
      expect(dicho, crudo).not.toMatch(/contraseña|mail ya|conexión|Esperá/);
    }
  });

  it("el de los mails explica que hay que esperar", () => {
    localStorage.setItem("habitotchi_idioma", "en");
    expect(mensajeDeError(new Error("email rate limit exceeded"))).toContain("Wait a few minutes");
  });
});
