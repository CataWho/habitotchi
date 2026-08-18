import { describe, it, expect, beforeEach } from "vitest";
import { CLAVES, leer, escribir } from "@/lib/almacenamiento";
import { CLAVES_QUE_SINCRONIZAN, hayDatosLocales } from "@/lib/nube";

/* ==========================================================
   DE QUIÉN SON LOS DATOS DE ESTE DISPOSITIVO
   ==========================================================
   La auditoría encontró que cerrar sesión dejaba todo en el
   navegador y que al entrar nunca se bajaba nada de la nube.
   Combinado, eso hacía que la siguiente persona en usar el
   mismo navegador viera los datos de salud de la anterior, y
   que lo que anotara pisara los datos buenos de su cuenta.

   Estos tests cubren las reglas que sostienen el arreglo. No
   pueden probar la conversación con Supabase (haría falta una
   cuenta de verdad), así que prueban lo que sí es
   verificable: qué claves están declaradas para sincronizar y
   qué cuenta como "este dispositivo tiene datos".
   ========================================================== */

describe("qué se sincroniza y qué no", () => {
  it("incluye los datos de la persona, que son los que tienen que viajar", () => {
    /* Si alguien saca una de estas de la lista sin querer, deja
       de sincronizarse en silencio: no falla nada, simplemente
       ese pedazo no aparece en el otro dispositivo. */
    for (const clave of [
      CLAVES.registro, CLAVES.metas, CLAVES.vida, CLAVES.cementerio,
      CLAVES.perfil, CLAVES.historialPeso, CLAVES.historialCiclo,
      CLAVES.animoDiario, CLAVES.medicaciones, CLAVES.tomas,
      CLAVES.comidas, CLAVES.hobbies, CLAVES.calendario,
      CLAVES.compras, CLAVES.equipado,
    ]) {
      expect(CLAVES_QUE_SINCRONIZAN, `${clave} tendría que sincronizar`).toContain(clave);
    }
  });

  it("deja afuera los ajustes de ESTE aparato", () => {
    /* Que el volumen que elegiste en la compu te pise el del
       celular sería un bug, no una función. */
    expect(CLAVES_QUE_SINCRONIZAN).not.toContain(CLAVES.sonido);
    expect(CLAVES_QUE_SINCRONIZAN).not.toContain(CLAVES.notificaciones);
  });

  it("deja afuera las claves de acceso a servicios", () => {
    expect(CLAVES_QUE_SINCRONIZAN).not.toContain(CLAVES.apiKey);
    expect(CLAVES_QUE_SINCRONIZAN).not.toContain(CLAVES.googleClientId);
  });
});

describe("hayDatosLocales", () => {
  beforeEach(() => localStorage.clear());

  it("un dispositivo recién estrenado no tiene datos", () => {
    expect(hayDatosLocales()).toBe(false);
  });

  it("las estructuras vacías no cuentan como datos", () => {
    /* Es lo que devuelven las funciones cargarX cuando nunca se
       guardó nada. Si contaran, al crear una cuenta se le
       preguntaría a todo el mundo si quiere migrar la nada. */
    escribir(CLAVES.registro, {});
    escribir(CLAVES.medicaciones, []);
    expect(hayDatosLocales()).toBe(false);
  });

  it("una sola cosa anotada ya cuenta", () => {
    escribir(CLAVES.historialPeso, [{ fecha: "2026-08-13", pesoKg: 60 }]);
    expect(hayDatosLocales()).toBe(true);
  });
});

describe("borrar deja el dispositivo sin rastro", () => {
  beforeEach(() => localStorage.clear());

  it("después de borrar todas las claves que sincronizan, no queda nada", () => {
    /* La misma secuencia que corre al cerrar sesión. Si alguna
       clave quedara, la próxima persona en usar este navegador
       vería ese pedazo. */
    escribir(CLAVES.historialCiclo, [{ fecha: "2026-08-01" }]);
    escribir(CLAVES.medicaciones, [{ id: 1, nombre: "algo" }]);
    escribir(CLAVES.animoDiario, { "2026-08-13": [{ animo: "triste" }] });
    expect(hayDatosLocales()).toBe(true);

    for (const clave of CLAVES_QUE_SINCRONIZAN) localStorage.removeItem(clave);

    expect(hayDatosLocales()).toBe(false);
    expect(leer(CLAVES.historialCiclo, null)).toBe(null);
    expect(leer(CLAVES.medicaciones, null)).toBe(null);
    expect(leer(CLAVES.animoDiario, null)).toBe(null);
  });
});
