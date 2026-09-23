import { describe, expect, it } from "vitest";
import { RATE_LIMITS, getClientIp } from "@/lib/rate-limit";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("http://localhost/test", { headers });
}

describe("Configuración de límites (código real de producción)", () => {
  it("las 5 rutas públicas sensibles tienen un límite configurado", () => {
    expect(Object.keys(RATE_LIMITS)).toEqual([
      "createOrder",
      "reportPayment",
      "getPaymentQr",
      "getBusinessHours",
      "getWhatsappConfig",
    ]);
  });

  it("crear pedido permite 10 intentos cada 5 minutos", () => {
    expect(RATE_LIMITS.createOrder).toEqual({
      maxAttempts: 10,
      windowSeconds: 300,
    });
  });

  it("reportar pago permite 5 intentos cada 5 minutos (la ruta más sensible)", () => {
    expect(RATE_LIMITS.reportPayment).toEqual({
      maxAttempts: 5,
      windowSeconds: 300,
    });
  });

  it("las rutas de solo lectura permiten 30 intentos por minuto", () => {
    expect(RATE_LIMITS.getPaymentQr).toEqual({
      maxAttempts: 30,
      windowSeconds: 60,
    });
    expect(RATE_LIMITS.getBusinessHours).toEqual({
      maxAttempts: 30,
      windowSeconds: 60,
    });
    expect(RATE_LIMITS.getWhatsappConfig).toEqual({
      maxAttempts: 30,
      windowSeconds: 60,
    });
  });

  it("reportar pago es más estricto que crear pedido (ruta más sensible)", () => {
    expect(RATE_LIMITS.reportPayment.maxAttempts).toBeLessThan(
      RATE_LIMITS.createOrder.maxAttempts,
    );
  });
});

describe("getClientIp (código real de producción)", () => {
  it("toma la primera IP de x-forwarded-for cuando hay varias (cliente, proxies)", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2",
    });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("recorta espacios alrededor de la IP en x-forwarded-for", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "  203.0.113.7 , 10.0.0.1",
    });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("usa x-real-ip si no hay x-forwarded-for", () => {
    const request = requestWithHeaders({ "x-real-ip": "198.51.100.23" });
    expect(getClientIp(request)).toBe("198.51.100.23");
  });

  it("prioriza x-forwarded-for sobre x-real-ip si ambos están presentes", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "203.0.113.7",
      "x-real-ip": "198.51.100.23",
    });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it('devuelve "unknown" si no hay ningún header de IP', () => {
    const request = requestWithHeaders({});
    expect(getClientIp(request)).toBe("unknown");
  });

  it('devuelve "unknown" si x-forwarded-for está vacío', () => {
    const request = requestWithHeaders({ "x-forwarded-for": "" });
    expect(getClientIp(request)).toBe("unknown");
  });
});
