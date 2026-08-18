import { afterEach, describe, expect, it, vi } from "vitest";

/* ==========================================================
   OPEN FOOD FACTS COMO RESPALDO DEL DICCIONARIO
   ==========================================================
   Lo único que se puede probar sin un celular de verdad es la
   lógica de acá: que en la web no se llega a llamar a la red
   (porque isNativePlatform() da false), y que el parseo de una
   respuesta real del servidor calcula bien las calorías.

   La respuesta de ejemplo es la que devolvió de verdad
   world.openfoodfacts.org/cgi/search.pl al buscar "milanesa",
   capturada a mano antes de escribir el código — no inventada.
   ========================================================== */

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

const { Capacitor } = await import("@capacitor/core");
const { buscarEnOpenFoodFacts, estimarCaloriasConRespaldo } = await import("@/lib/alimentos-off");

const isNativePlatform = vi.mocked(Capacitor.isNativePlatform);

const RESPUESTA_REAL_MILANESA = {
  count: 251,
  page: 1,
  page_count: 3,
  page_size: 3,
  products: [
    {
      brands: "Granja Del Sol",
      nutriments: {
        "energy-kcal_100g": 232.727272727273,
        "energy-kcal_serving": 192,
      },
      product_name: "Milanesas de soja",
    },
    {
      brands: "Dia",
      nutriments: {
        "energy-kcal_100g": 227,
        "energy-kcal_serving": 227,
      },
      product_name: "Milanesas de pollo",
    },
  ],
};

const RESPUESTA_VACIA = { count: 0, page: 1, page_count: 0, page_size: 5, products: [] };

afterEach(() => {
  vi.unstubAllGlobals();
  isNativePlatform.mockReset().mockReturnValue(false);
});

describe("en la web (no nativo)", () => {
  it("no llama a la red: isNativePlatform corta antes del fetch", async () => {
    const fetchEspiado = vi.fn();
    vi.stubGlobal("fetch", fetchEspiado);

    const resultado = await buscarEnOpenFoodFacts("milanesa");

    expect(resultado).toBeNull();
    expect(fetchEspiado).not.toHaveBeenCalled();
  });

  it("con texto vacío tampoco llama a la red, ni siquiera si fuera nativo", async () => {
    isNativePlatform.mockReturnValue(true);
    const fetchEspiado = vi.fn();
    vi.stubGlobal("fetch", fetchEspiado);

    const resultado = await buscarEnOpenFoodFacts("   ");

    expect(resultado).toBeNull();
    expect(fetchEspiado).not.toHaveBeenCalled();
  });
});

describe("en la app nativa, con la respuesta real que devuelve el servidor", () => {
  it("calcula las calorías de la primera coincidencia con datos completos", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => RESPUESTA_REAL_MILANESA }))
    );

    const resultado = await buscarEnOpenFoodFacts("milanesa");

    expect(resultado).not.toBeNull();
    expect(resultado?.nombre).toBe("Milanesas de soja");
    expect(resultado?.calorias).toBe(233); // 232.73 redondeado
  });

  it("aplica el multiplicador de cantidad, igual que el diccionario local", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => RESPUESTA_REAL_MILANESA }))
    );

    const resultado = await buscarEnOpenFoodFacts("2 milanesas");

    // 232.727... x 2 = 465.45..., redondeado 465
    expect(resultado?.calorias).toBe(465);
  });

  it("si no hay resultados, devuelve null en vez de romper", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => RESPUESTA_VACIA }))
    );

    const resultado = await buscarEnOpenFoodFacts("xyzxyzxyz");

    expect(resultado).toBeNull();
  });

  it("si el servidor responde mal (no ok), devuelve null sin tirar", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));

    const resultado = await buscarEnOpenFoodFacts("milanesa");

    expect(resultado).toBeNull();
  });

  it("si el fetch tira (sin internet), devuelve null sin tirar", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    const resultado = await buscarEnOpenFoodFacts("milanesa");

    expect(resultado).toBeNull();
  });

  it("salta productos sin calorías cargadas y usa el siguiente que sí tenga", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          count: 2,
          products: [
            { product_name: "Sin datos de nutrientes" },
            RESPUESTA_REAL_MILANESA.products[1],
          ],
        }),
      }))
    );

    const resultado = await buscarEnOpenFoodFacts("milanesa");

    expect(resultado?.nombre).toBe("Milanesas de pollo");
  });
});

describe("el diccionario con respaldo (estimarCaloriasConRespaldo)", () => {
  it("si el diccionario local encuentra algo, ni siquiera intenta la red", async () => {
    isNativePlatform.mockReturnValue(true);
    const fetchEspiado = vi.fn();
    vi.stubGlobal("fetch", fetchEspiado);

    // "milanesa" está en el diccionario local (CALORIAS_COMUNES)
    const resultado = await estimarCaloriasConRespaldo("milanesa");

    expect(resultado?.calorias).toBe(300); // el valor del diccionario local, no el de OFF
    expect(fetchEspiado).not.toHaveBeenCalled();
  });

  it("si el diccionario local no encuentra nada, prueba el respaldo", async () => {
    isNativePlatform.mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          count: 1,
          products: [{ product_name: "Kimchi", nutriments: { "energy-kcal_100g": 15 } }],
        }),
      }))
    );

    /* "kimchi" no está en el diccionario local. Antes acá
       decía "quinoa", pero al sumar los nombres en inglés
       quinoa pasó a estar y el test dejó de probar lo que
       decía probar: encontraba local y nunca llegaba al
       respaldo. */
    const resultado = await estimarCaloriasConRespaldo("kimchi");

    expect(resultado?.nombre).toBe("Kimchi");
    expect(resultado?.calorias).toBe(15);
  });
});
