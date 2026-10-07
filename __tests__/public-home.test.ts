import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_ITEMS,
  MAX_QUANTITY,
  addItem,
  buildOrderMessage,
  cartCount,
  cartTotal,
  changeItemQuantity,
  hasUnavailable,
  removeItem,
  sanitizeCart,
  type CartItem,
} from "@/lib/public/cart-logic";
import {
  acceptingOrders,
  dayHoursLabel,
  formatMoney,
  formatTime,
  initials,
  isPurchasable,
  orderedWeek,
  pickImage,
  promotionBenefit,
  promotionValidity,
  todayHoursLabel,
  whatsappLink,
} from "@/lib/public/format";
import { createLocalStore } from "@/lib/public/local-store";
import type {
  BusinessStatus,
  PublicPromotion,
  WeekDay,
} from "@/lib/public/types";

const rosas = { id: "p1", name: "Ramo de rosas", price: 150, image: null };
const oso = { id: "p2", name: "Oso", price: "80.00", image: "/oso.png" };

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "p1",
    name: "Ramo de rosas",
    price: 150,
    image: null,
    quantity: 1,
    available: true,
    ...overrides,
  };
}

const basePromotion: PublicPromotion = {
  id: "x",
  name: "Promo",
  description: null,
  promotion_type: "producto",
  discount_type: "porcentaje",
  discount_value: 20,
  combo_price: null,
  starts_at: null,
  ends_at: null,
  minimum_purchase: null,
};

describe("Carrito (lógica pura)", () => {
  describe("sanitizeCart", () => {
    it("devuelve [] si lo guardado no es una lista", () => {
      expect(sanitizeCart(null)).toEqual([]);
      expect(sanitizeCart("hola")).toEqual([]);
      expect(sanitizeCart({ id: "p1" })).toEqual([]);
    });

    it("conserva un producto válido", () => {
      expect(sanitizeCart([item({ quantity: 2 })])).toEqual([
        item({ quantity: 2 }),
      ]);
    });

    it("descarta entradas dañadas, sin id, con precio o cantidad inválidos", () => {
      const result = sanitizeCart([
        null,
        "texto",
        { id: "", name: "x", price: 1, quantity: 1 },
        { id: "a", name: "x", price: -5, quantity: 1 },
        { id: "b", name: "x", price: "abc", quantity: 1 },
        { id: "c", name: "x", price: 1, quantity: 0 },
        { id: "d", name: 5, price: 1, quantity: 1 },
        { id: "ok", name: "Bueno", price: 10, quantity: 3 },
      ]);

      expect(result.map((entry) => entry.id)).toEqual(["ok"]);
    });

    it("elimina duplicados y limita la cantidad a 99", () => {
      const result = sanitizeCart([
        item({ quantity: 500 }),
        item({ quantity: 2 }),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(MAX_QUANTITY);
    });

    it("limita la cantidad de productos distintos", () => {
      const many = Array.from({ length: MAX_ITEMS + 10 }, (_, index) =>
        item({ id: `p${index}` }),
      );

      expect(sanitizeCart(many)).toHaveLength(MAX_ITEMS);
    });

    it("trata available distinto de false como disponible", () => {
      const raw = [
        { id: "a", name: "A", price: 1, quantity: 1 },
        { id: "b", name: "B", price: 1, quantity: 1, available: false },
      ];

      expect(sanitizeCart(raw).map((entry) => entry.available)).toEqual([
        true,
        false,
      ]);
    });
  });

  describe("addItem", () => {
    it("agrega un producto nuevo con cantidad 1", () => {
      const result = addItem([], rosas);

      expect(result).toEqual([item()]);
    });

    it("convierte el precio a número", () => {
      expect(addItem([], oso)[0].price).toBe(80);
    });

    it("suma la cantidad si ya existe", () => {
      const result = addItem([item({ quantity: 2 })], rosas, 3);

      expect(result[0].quantity).toBe(5);
    });

    it("no pasa de 99 unidades", () => {
      const result = addItem([item({ quantity: 98 })], rosas, 10);

      expect(result[0].quantity).toBe(MAX_QUANTITY);
    });

    it("ignora cantidades menores a 1", () => {
      expect(addItem([], rosas, 0)).toEqual([]);
      expect(addItem([], rosas, -3)).toEqual([]);
    });

    it("no agrega más productos distintos que el máximo", () => {
      const full = Array.from({ length: MAX_ITEMS }, (_, index) =>
        item({ id: `p${index}` }),
      );

      expect(addItem(full, { ...rosas, id: "nuevo" })).toHaveLength(MAX_ITEMS);
    });

    it("no modifica la lista original", () => {
      const original = [item()];

      addItem(original, rosas, 5);

      expect(original[0].quantity).toBe(1);
    });
  });

  describe("changeItemQuantity y removeItem", () => {
    it("suma y resta", () => {
      expect(changeItemQuantity([item()], "p1", 1)[0].quantity).toBe(2);
      expect(changeItemQuantity([item({ quantity: 3 })], "p1", -1)[0].quantity).toBe(2);
    });

    it("al llegar a 0 el producto sale del carrito", () => {
      expect(changeItemQuantity([item()], "p1", -1)).toEqual([]);
    });

    it("no pasa de 99", () => {
      expect(changeItemQuantity([item({ quantity: 99 })], "p1", 1)[0].quantity).toBe(99);
    });

    it("quita un producto por id", () => {
      expect(removeItem([item(), item({ id: "p2" })], "p1").map((i) => i.id)).toEqual(["p2"]);
    });
  });

  describe("totales", () => {
    const items = [item({ quantity: 2 }), item({ id: "p2", price: 80, quantity: 1 })];

    it("cuenta unidades y suma el total", () => {
      expect(cartCount(items)).toBe(3);
      expect(cartTotal(items)).toBe(380);
    });

    it("detecta productos no disponibles", () => {
      expect(hasUnavailable(items)).toBe(false);
      expect(hasUnavailable([...items, item({ id: "p3", available: false })])).toBe(true);
    });
  });

  it("buildOrderMessage arma el resumen para WhatsApp", () => {
    const message = buildOrderMessage([
      item({ quantity: 2 }),
      item({ id: "p2", name: "Oso", price: 80, quantity: 1 }),
    ]);

    expect(message).toBe(
      [
        "Hola NOVA Florería, quiero hacer este pedido:",
        "",
        "• 2 × Ramo de rosas (Bs 150.00 c/u)",
        "• 1 × Oso (Bs 80.00 c/u)",
        "",
        "Total: Bs 380.00",
      ].join("\n"),
    );
  });
});

describe("Formato y reglas de la tienda pública", () => {
  it("formatMoney siempre con 2 decimales", () => {
    expect(formatMoney(150)).toBe("Bs 150.00");
    expect(formatMoney("80")).toBe("Bs 80.00");
  });

  it("formatTime recorta los segundos", () => {
    expect(formatTime("08:00:00")).toBe("08:00");
    expect(formatTime(null)).toBe("");
  });

  it("pickImage prefiere sort_order 0 y tolera listas vacías", () => {
    const a = { id: "a", public_url: "/a", alt_text: null, sort_order: 2 };
    const b = { id: "b", public_url: "/b", alt_text: null, sort_order: 0 };

    expect(pickImage({ images: [a, b] })).toBe(b);
    expect(pickImage({ images: [a] })).toBe(a);
    expect(pickImage({ images: [] })).toBeNull();
    expect(pickImage({})).toBeNull();
  });

  it("isPurchasable exige disponible y no agotado", () => {
    expect(isPurchasable({ is_available: true, is_sold_out: false })).toBe(true);
    expect(isPurchasable({ is_available: true, is_sold_out: true })).toBe(false);
    expect(isPurchasable({ is_available: false, is_sold_out: false })).toBe(false);
  });

  it("initials", () => {
    expect(initials("Ramo de rosas rojas")).toBe("RD");
    expect(initials("oso")).toBe("O");
    expect(initials("")).toBe("N");
  });

  describe("promociones", () => {
    it("describe el beneficio de cada tipo", () => {
      expect(promotionBenefit(basePromotion)).toBe("20% de descuento");
      expect(
        promotionBenefit({ ...basePromotion, discount_type: "porcentaje", discount_value: 12.5 }),
      ).toBe("12.5% de descuento");
      expect(
        promotionBenefit({ ...basePromotion, discount_type: "monto_fijo", discount_value: 10 }),
      ).toBe("Bs 10.00 de descuento");
      expect(
        promotionBenefit({
          ...basePromotion,
          promotion_type: "combo",
          discount_type: null,
          discount_value: null,
          combo_price: 250,
        }),
      ).toBe("Combo a Bs 250.00");
    });

    it("describe la vigencia", () => {
      expect(promotionValidity(basePromotion)).toBeNull();
      expect(
        promotionValidity({ ...basePromotion, ends_at: "2026-02-15T16:00:00Z" }),
      ).toBe("Hasta el 15/02/2026");
      expect(
        promotionValidity({ ...basePromotion, starts_at: "2026-02-01T16:00:00Z" }),
      ).toBe("Desde el 01/02/2026");
      expect(
        promotionValidity({
          ...basePromotion,
          starts_at: "2026-02-01T16:00:00Z",
          ends_at: "2026-02-15T16:00:00Z",
        }),
      ).toBe("Del 01/02/2026 al 15/02/2026");
    });

    it("usa la hora de La Paz (no la del servidor) para el día", () => {
      // 02:00 UTC del día 16 = 22:00 del día 15 en La Paz (UTC-4)
      expect(
        promotionValidity({ ...basePromotion, ends_at: "2026-02-16T02:00:00Z" }),
      ).toBe("Hasta el 15/02/2026");
    });
  });

  describe("horario", () => {
    const open: BusinessStatus = {
      is_open: true,
      opens_at: "08:00:00",
      closes_at: "20:00:00",
      is_closed_today: false,
      accept_orders_outside_hours: false,
    };

    it("acepta pedidos si está abierto, si se permite fuera de horario o si no se sabe", () => {
      expect(acceptingOrders(null)).toBe(true);
      expect(acceptingOrders(open)).toBe(true);
      expect(acceptingOrders({ ...open, is_open: false })).toBe(false);
      expect(
        acceptingOrders({ ...open, is_open: false, accept_orders_outside_hours: true }),
      ).toBe(true);
    });

    it("todayHoursLabel", () => {
      expect(todayHoursLabel(null)).toBeNull();
      expect(todayHoursLabel(open)).toBe("08:00 – 20:00");
      expect(todayHoursLabel({ ...open, is_closed_today: true })).toBe("Cerrado");
    });

    it("orderedWeek va de lunes a domingo", () => {
      const week: WeekDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day_of_week: day,
        opens_at: "08:00:00",
        closes_at: "20:00:00",
        is_closed: false,
      }));

      expect(orderedWeek(week).map((day) => day.day_of_week)).toEqual([1, 2, 3, 4, 5, 6, 0]);
      expect(orderedWeek([])).toEqual([]);
    });

    it("dayHoursLabel", () => {
      const day: WeekDay = { day_of_week: 1, opens_at: "08:00:00", closes_at: "20:00:00", is_closed: false };

      expect(dayHoursLabel(day)).toBe("08:00 – 20:00");
      expect(dayHoursLabel({ ...day, is_closed: true })).toBe("Cerrado");
      expect(dayHoursLabel({ ...day, opens_at: null })).toBe("Cerrado");
    });
  });

  it("whatsappLink", () => {
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("59170011223")).toBe("https://wa.me/59170011223");
    expect(whatsappLink("59170011223", "Hola & chau")).toBe(
      "https://wa.me/59170011223?text=Hola%20%26%20chau",
    );
  });
});

describe("createLocalStore", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubWindow(storage: Record<string, string> | "broken") {
    const localStorage =
      storage === "broken"
        ? {
            getItem: () => {
              throw new Error("bloqueado");
            },
            setItem: () => {
              throw new Error("bloqueado");
            },
          }
        : {
            getItem: (key: string) => storage[key] ?? null,
            setItem: (key: string, value: string) => {
              storage[key] = value;
            },
          };

    vi.stubGlobal("window", {
      localStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  }

  const make = () =>
    createLocalStore<number[]>({
      key: "k",
      initial: [],
      sanitize: (raw) => (Array.isArray(raw) ? raw.filter((n) => typeof n === "number") : []),
    });

  it("devuelve el valor inicial en el servidor (sin window)", () => {
    expect(make().get()).toEqual([]);
  });

  it("lee lo guardado y lo sanea", () => {
    stubWindow({ k: JSON.stringify([1, "x", 2]) });

    expect(make().get()).toEqual([1, 2]);
  });

  it("ignora JSON dañado", () => {
    stubWindow({ k: "{no es json" });

    expect(make().get()).toEqual([]);
  });

  it("update guarda en localStorage y avisa a quien escucha", () => {
    const storage: Record<string, string> = {};

    stubWindow(storage);

    const store = make();

    store.update((current) => [...current, 5]);

    expect(store.get()).toEqual([5]);
    expect(JSON.parse(storage.k)).toEqual([5]);
  });

  it("sigue funcionando en memoria si localStorage no está disponible", () => {
    stubWindow("broken");

    const store = make();

    store.update(() => [7]);

    expect(store.get()).toEqual([7]);
  });
});