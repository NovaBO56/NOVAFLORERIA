import { describe, expect, it } from "vitest";
import {
  findCheapestProduct,
  findFixedDiscountViolation,
  fixedDiscountMessage,
} from "@/lib/promotions/fixed-discount";

const rosas = { name: "Ramo de rosas", price: 150 };
const oso = { name: "Oso de peluche", price: 80 };
const marco = { name: "Marco de foto", price: 20 };

describe("Descuento por monto fijo vs precio de los productos", () => {
  describe("findCheapestProduct", () => {
    it("devuelve el producto más barato", () => {
      expect(findCheapestProduct([rosas, oso, marco])).toEqual(marco);
    });

    it("devuelve null si no hay productos", () => {
      expect(findCheapestProduct([])).toBeNull();
    });
  });

  describe("findFixedDiscountViolation", () => {
    it("rechaza 100 Bs cuando un producto vale 80 Bs", () => {
      expect(findFixedDiscountViolation(100, [rosas, oso])).toEqual(oso);
    });

    it("señala el producto más barato cuando hay varios por debajo", () => {
      expect(findFixedDiscountViolation(100, [oso, marco, rosas])).toEqual(
        marco,
      );
    });

    it("acepta un monto menor al precio del producto más barato", () => {
      expect(findFixedDiscountViolation(50, [rosas, oso])).toBeNull();
    });

    it("acepta un monto igual al precio del producto más barato", () => {
      expect(findFixedDiscountViolation(80, [rosas, oso])).toBeNull();
    });

    it("rechaza un solo centavo por encima", () => {
      expect(findFixedDiscountViolation(80.01, [rosas, oso])).toEqual(oso);
    });

    it("no falla por coma flotante (0.1 + 0.2)", () => {
      expect(
        findFixedDiscountViolation(0.1 + 0.2, [{ name: "X", price: 0.3 }]),
      ).toBeNull();
    });

    it("acepta precios que llegan como texto desde la base de datos", () => {
      expect(
        findFixedDiscountViolation(100, [
          { name: "Oso", price: "80.00" as unknown as number },
        ]),
      ).toEqual({ name: "Oso", price: "80.00" });
    });

    it("sin productos no hay nada que comparar", () => {
      expect(findFixedDiscountViolation(100, [])).toBeNull();
    });
  });

  describe("fixedDiscountMessage", () => {
    it("explica el problema y cómo resolverlo", () => {
      expect(fixedDiscountMessage(100, oso)).toBe(
        "El descuento de Bs 100.00 supera el precio de «Oso de peluche» (Bs 80.00). Reduce el monto a Bs 80.00 o quita ese producto.",
      );
    });
  });
});