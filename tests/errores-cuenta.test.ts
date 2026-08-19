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
