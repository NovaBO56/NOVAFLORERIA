import { describe, expect, it } from "vitest";
import { requiresPayment } from "@/lib/public/checkout";

describe("Decisión de pago con total definitivo del servidor", () => {
  it("un pedido gratuito no habilita reporte ni QR incluso si su estado está desactualizado", () => {
    expect(requiresPayment({ total: 0, status: "confirmado" })).toBe(false);
    expect(requiresPayment({ total: 0, status: "pendiente_pago" })).toBe(false);
  });
  it("solo el pedido pendiente con saldo positivo permite reporte", () => {
    expect(requiresPayment({ total: 100, status: "pendiente_pago" })).toBe(true);
    expect(requiresPayment({ total: 100, status: "confirmado" })).toBe(false);
    expect(requiresPayment({ total: 100, status: "cancelado" })).toBe(false);
  });
});
