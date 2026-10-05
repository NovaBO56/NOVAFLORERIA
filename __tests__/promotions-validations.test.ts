import { describe, expect, it } from "vitest";
import {
  createPromotionSchema,
  updatePromotionSchema,
  addPromotionProductSchema,
  updatePromotionProductSchema,
  updateCustomerSchema,
} from "@/validations/promotions";

const validId = "e71f5830-6516-45cd-968a-fe61ca62a524";

/** Mensaje del primer error, o null si el esquema aceptó los datos. */
function firstError(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success ? null : (result.error?.issues[0]?.message ?? "");
}

describe("Validaciones de promociones y clientes", () => {
  describe("createPromotionSchema", () => {
    it("acepta una promoción válida por producto con porcentaje", () => {
      const result = createPromotionSchema.safeParse({
        name: "Descuento de temporada",
        promotion_type: "producto",
        discount_type: "porcentaje",
        discount_value: 15,
      });

      expect(result.success).toBe(true);
    });

    it("acepta una promoción válida por producto con monto fijo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Oferta especial",
        promotion_type: "producto",
        discount_type: "monto_fijo",
        discount_value: 20,
      });

      expect(result.success).toBe(true);
    });

    it("acepta una promoción combo con precio fijo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Combo San Valentín",
        promotion_type: "combo",
        combo_price: 250,
      });

      expect(result.success).toBe(true);
    });

    it("rechaza un promotion_type no válido", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "temporada",
        discount_type: "porcentaje",
        discount_value: 10,
      });

      expect(result.success).toBe(false);
    });

    it("rechaza discount_value negativo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "producto",
        discount_type: "monto_fijo",
        discount_value: -5,
      });

      expect(result.success).toBe(false);
    });

    it("rechaza combo sin combo_price", () => {
      const result = createPromotionSchema.safeParse({
        name: "Combo sin precio",
        promotion_type: "combo",
      });

      expect(result.success).toBe(false);
    });

    it("rechaza nombre vacío", () => {
      const result = createPromotionSchema.safeParse({
        name: "",
        promotion_type: "producto",
        discount_type: "porcentaje",
        discount_value: 10,
      });

      expect(result.success).toBe(false);
    });

    describe("reglas del servidor (antes solo existían en la pantalla)", () => {
      const producto = {
        name: "Promo",
        promotion_type: "producto" as const,
      };

      it("rechaza un porcentaje mayor a 100", () => {
        const result = createPromotionSchema.safeParse({
          ...producto,
          discount_type: "porcentaje",
          discount_value: 150,
        });

        expect(firstError(result)).toBe(
          "El porcentaje de descuento no puede superar el 100%.",
        );
      });

      it("acepta exactamente 100% y un monto fijo mayor a 100", () => {
        expect(
          createPromotionSchema.safeParse({
            ...producto,
            discount_type: "porcentaje",
            discount_value: 100,
          }).success,
        ).toBe(true);

        expect(
          createPromotionSchema.safeParse({
            ...producto,
            discount_type: "monto_fijo",
            discount_value: 500,
          }).success,
        ).toBe(true);
      });

      it("ya no convierte vacío, null ni ausente en 0", () => {
        for (const discount_value of ["", null, undefined]) {
          const result = createPromotionSchema.safeParse({
            ...producto,
            discount_type: "monto_fijo",
            discount_value,
          });

          expect(firstError(result)).toBe(
            "El valor del descuento es obligatorio.",
          );
        }

        for (const combo_price of ["", null, undefined]) {
          const result = createPromotionSchema.safeParse({
            name: "Combo",
            promotion_type: "combo",
            combo_price,
          });

          expect(firstError(result)).toBe("El precio del combo es obligatorio.");
        }
      });

      it("rechaza descuento o precio de combo igual a cero", () => {
        expect(
          createPromotionSchema.safeParse({
            ...producto,
            discount_type: "monto_fijo",
            discount_value: 0,
          }).success,
        ).toBe(false);

        expect(
          createPromotionSchema.safeParse({
            name: "Combo",
            promotion_type: "combo",
            combo_price: 0,
          }).success,
        ).toBe(false);
      });

      it("acepta números enviados como texto y rechaza texto no numérico", () => {
        const ok = createPromotionSchema.safeParse({
          ...producto,
          discount_type: "porcentaje",
          discount_value: "12.5",
        });

        expect(ok.success).toBe(true);
        expect(ok.success && ok.data.promotion_type === "producto"
          ? ok.data.discount_value
          : null).toBe(12.5);

        expect(
          createPromotionSchema.safeParse({
            ...producto,
            discount_type: "monto_fijo",
            discount_value: "abc",
          }).success,
        ).toBe(false);
      });

      it("rechaza más de 2 decimales (numeric(12,2))", () => {
        const result = createPromotionSchema.safeParse({
          ...producto,
          discount_type: "monto_fijo",
          discount_value: 10.123,
        });

        expect(firstError(result)).toBe("Usa como máximo 2 decimales.");
      });

      it("rechaza fechas que no son fechas", () => {
        const result = createPromotionSchema.safeParse({
          name: "Combo",
          promotion_type: "combo",
          combo_price: 10,
          starts_at: "hola",
        });

        expect(firstError(result)).toBe("La fecha no es válida.");
      });

      it("rechaza fin anterior o igual al inicio", () => {
        const result = createPromotionSchema.safeParse({
          name: "Combo",
          promotion_type: "combo",
          combo_price: 10,
          starts_at: "2026-12-01T00:00:00Z",
          ends_at: "2026-01-01T00:00:00Z",
        });

        expect(firstError(result)).toBe(
          "La fecha de finalización debe ser posterior a la de inicio.",
        );
      });

      it("normaliza las fechas a ISO y trata '' como sin límite", () => {
        const result = createPromotionSchema.safeParse({
          name: "Combo",
          promotion_type: "combo",
          combo_price: 10,
          starts_at: "2026-01-01T00:00:00Z",
          ends_at: "",
        });

        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.starts_at).toBe("2026-01-01T00:00:00.000Z");
          expect(result.data.ends_at).toBeNull();
        }
      });

      it("compra mínima: acepta 0 y vacío, rechaza negativos", () => {
        const base = {
          name: "Combo",
          promotion_type: "combo" as const,
          combo_price: 10,
        };

        expect(
          createPromotionSchema.safeParse({ ...base, minimum_purchase: 0 })
            .success,
        ).toBe(true);
        expect(
          createPromotionSchema.safeParse({ ...base, minimum_purchase: "" })
            .success,
        ).toBe(true);
        expect(
          createPromotionSchema.safeParse({ ...base, minimum_purchase: -1 })
            .success,
        ).toBe(false);
      });
    });
  });

  describe("updatePromotionSchema", () => {
    it("acepta desactivar una promoción", () => {
      expect(
        updatePromotionSchema.safeParse({
          is_active: false,
        }).success,
      ).toBe(true);
    });

    it("acepta actualizar el precio de un combo", () => {
      expect(
        updatePromotionSchema.safeParse({
          combo_price: 250,
        }).success,
      ).toBe(true);
    });

    it("acepta actualizar un descuento de producto", () => {
      expect(
        updatePromotionSchema.safeParse({
          discount_type: "porcentaje",
          discount_value: 15,
        }).success,
      ).toBe(true);
    });

    it("rechaza un objeto vacío", () => {
      expect(
        updatePromotionSchema.safeParse({}).success,
      ).toBe(false);
    });

    it("rechaza un porcentaje mayor a 100", () => {
      const result = updatePromotionSchema.safeParse({
        discount_type: "porcentaje",
        discount_value: 500,
      });

      expect(firstError(result)).toBe(
        "El porcentaje de descuento no puede superar el 100%.",
      );
    });

    it("conserva null (la ruta decide si es válido para el tipo)", () => {
      const result = updatePromotionSchema.safeParse({ combo_price: null });

      expect(result.success).toBe(true);
      expect(result.success && result.data.combo_price).toBeNull();
    });

    it("rechaza fechas inválidas y acepta '' como quitar la fecha", () => {
      expect(
        updatePromotionSchema.safeParse({ ends_at: "basura" }).success,
      ).toBe(false);

      const cleared = updatePromotionSchema.safeParse({ ends_at: "" });

      expect(cleared.success).toBe(true);
      expect(cleared.success && cleared.data.ends_at).toBeNull();
    });

    it("rechaza fin anterior al inicio cuando llegan las dos fechas", () => {
      expect(
        updatePromotionSchema.safeParse({
          starts_at: "2026-12-01T00:00:00Z",
          ends_at: "2026-01-01T00:00:00Z",
        }).success,
      ).toBe(false);
    });

    it("recorta el nombre y rechaza uno vacío", () => {
      const ok = updatePromotionSchema.safeParse({ name: "  Hola  " });

      expect(ok.success && ok.data.name).toBe("Hola");
      expect(updatePromotionSchema.safeParse({ name: "   " }).success).toBe(
        false,
      );
    });
  });

  describe("addPromotionProductSchema", () => {
    it("acepta un product_id válido", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
        }).success,
      ).toBe(true);
    });

    it("usa cantidad 1 cuando no se envía", () => {
      const result = addPromotionProductSchema.safeParse({
        product_id: validId,
      });

      expect(result.success && result.data.quantity).toBe(1);
    });

    it("acepta una cantidad válida", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 12,
        }).success,
      ).toBe(true);
    });

    it("rechaza un product_id inválido", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: "no-es-uuid",
        }).success,
      ).toBe(false);
    });

    it("rechaza una cantidad cero", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 0,
        }).success,
      ).toBe(false);
    });

    it("rechaza cantidades fuera de numeric(12,3)", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 0.0001,
        }).success,
      ).toBe(false);

      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 1e12,
        }).success,
      ).toBe(false);
    });
  });

  describe("updatePromotionProductSchema", () => {
    it("acepta actualizar una cantidad válida", () => {
      expect(
        updatePromotionProductSchema.safeParse({
          quantity: 12,
        }).success,
      ).toBe(true);
    });

    it("rechaza una cantidad cero", () => {
      expect(
        updatePromotionProductSchema.safeParse({
          quantity: 0,
        }).success,
      ).toBe(false);
    });

    it("rechaza más de 3 decimales", () => {
      expect(
        updatePromotionProductSchema.safeParse({ quantity: 1.0001 }).success,
      ).toBe(false);
    });
  });

  describe("updateCustomerSchema", () => {
    it("acepta actualizar solo el nombre", () => {
      expect(
        updateCustomerSchema.safeParse({
          name: "María González Pérez",
        }).success,
      ).toBe(true);
    });

    it("rechaza un correo inválido", () => {
      expect(
        updateCustomerSchema.safeParse({
          email: "no-es-correo",
        }).success,
      ).toBe(false);
    });

    it("rechaza un objeto vacío", () => {
      expect(
        updateCustomerSchema.safeParse({}).success,
      ).toBe(false);
    });
  });
});