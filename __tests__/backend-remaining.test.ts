import { describe, expect, it, vi } from "vitest";
import { paymentQrExtension } from "@/lib/payment-qr-file";
import { businessDate, businessDayStart } from "@/lib/business-date";
import { loginDestination } from "@/lib/auth/login-destination";
import { updateBusinessHoursSchema } from "@/validations/notifications-and-hours";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
import { checkRateLimit } from "@/lib/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Archivos QR", () => {
  it("acepta firmas correspondientes sin confiar en extensión del nombre", () => {
    expect(paymentQrExtension("image/png", new Uint8Array([137,80,78,71,13,10,26,10]))).toBe("png");
    expect(paymentQrExtension("image/jpeg", new Uint8Array([255,216,255]))).toBe("jpg");
    expect(paymentQrExtension("image/webp", new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]))).toBe("webp");
  });
  it("rechaza tipo falso, vacío y más de 5 MB", () => {
    expect(paymentQrExtension("image/png", new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(paymentQrExtension("image/jpeg", new Uint8Array())).toBeNull();
    expect(paymentQrExtension("image/png", new Uint8Array(5*1024*1024+1))).toBeNull();
  });
});

describe("Fecha comercial y acceso", () => {
  it("usa día anterior en La Paz aunque UTC haya cambiado", () => {
    const time = new Date("2026-10-08T02:30:00Z");
    expect(businessDate(time)).toBe("2026-10-07");
    expect(businessDayStart(time).toISOString()).toBe("2026-10-07T04:00:00.000Z");
  });
  it.each(["//evil.example", "/\\evil.example", "https://evil.example", null, "/\n/evil.example"])("bloquea destino externo %s", value => {
    expect(loginDestination(value)).toBe("/admin");
  });
  it("conserva destino interno con consulta", () => expect(loginDestination("/admin/pedidos?page=2")).toBe("/admin/pedidos?page=2"));
  it.each(["99:00", "24:00", "12:60"])("rechaza hora inexistente %s", time => {
    expect(updateBusinessHoursSchema.safeParse({ opens_at: time }).success).toBe(false);
  });
});

describe("Rate limiting con RPC simulado (no demuestra permisos reales)", () => {
  it("falla cerrado para escrituras y seguimiento; conserva otras lecturas", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "TEST", message: "offline" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const client = {} as SupabaseClient;
      const request = new Request("http://localhost/api/orders");
      expect(await checkRateLimit(client, request, "createOrder")).toBe(false);
      expect(await checkRateLimit(client, request, "reportPayment")).toBe(false);
      expect(await checkRateLimit(client, request, "trackOrder")).toBe(false);
      expect(await checkRateLimit(client, request, "getBusinessHours")).toBe(true);
    } finally { log.mockRestore(); }
  });
});
