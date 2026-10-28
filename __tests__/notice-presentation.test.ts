import { describe, expect, it } from "vitest";
import { notificationMessage, notificationPresentation } from "../src/lib/notification-presentation";
import { friendlyErrorMessage } from "../src/lib/notice-presentation";

describe("mensajes de Anabelle", () => {
  it("distingue un pago reportado de uno confirmado", () => {
    const pending = notificationPresentation("Pago pendiente de verificar - pedido #31");
    expect(pending.tone).toBe("warning");
    expect(pending.message).toContain("#31");
    expect(pending.message).toContain("antes de confirmarlo");
    expect(notificationPresentation("Pago confirmado del pedido #31").tone).toBe("success");
  });
  it("conserva la cantidad y nombre de una alerta de stock", () => {
    const notice = notificationPresentation("Stock bajo: Oso de peluche (2.5 unidades)");
    expect(notice.tone).toBe("warning");
    expect(notice.message).toContain("Oso de peluche");
    expect(notice.message).toContain("2,5 unidades");
    expect(notificationMessage("Stock bajo: Oso (1 unidades)")).toContain("(1 unidad)");
  });
  it("no muestra detalles de base de datos o red al usuario", () => {
    for (const message of ["RPC failed: consume_inventory", 'column "secret" does not exist', "TypeError: Failed to fetch", "PGRST200 relation error"]) {
      expect(friendlyErrorMessage(message, "Intenta nuevamente.")).toBe("Intenta nuevamente.");
      expect(notificationMessage(message)).not.toContain("secret");
    }
  });
  it("preserva validaciones comerciales útiles y el número del pedido", () => {
    expect(friendlyErrorMessage("El precio debe ser mayor a cero.")).toBe("El precio debe ser mayor a cero.");
    expect(notificationPresentation("Pedido #16 está listo")).toEqual({ title: "Pedido listo", tone: "success", message: "Pedido #16 está listo" });
  });
});
