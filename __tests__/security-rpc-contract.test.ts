import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve("supabase/baseline-candidate");
const read = (name: string) => fs.readFileSync(path.join(root, name), "utf8");
const migration = read("036_security_rpc_hardening.sql");
const payment = read("CREATE_PAYMENT_FINAL.sql");
const confirmation = read("CONFIRM_PAYMENT_FINAL.sql");

// Estos controles inspeccionan el contrato entregado, NO ejecutan PostgreSQL.
// Los casos conductuales por rol se ejecutan aparte en Supabase local real.
describe("Contrato SQL de hardening (verificación estática)", () => {
  it("revoca PUBLIC además de anon/authenticated de helpers mutadores", () => {
    for (const name of ["consume_product_inventory", "apply_order_discount", "release_expired_reservations"]) {
      expect(migration).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\."${name}"\\([^;]+FROM PUBLIC, anon, authenticated, service_role;`));
      const grants = migration.split("\n").filter(line => line.startsWith(`GRANT EXECUTE ON FUNCTION public."${name}"`));
      expect(grants).toHaveLength(1);
      expect(grants[0]).toMatch(/TO service_role;$/);
    }
  });
  it("retira condicionalmente el pago antiguo y deja contrato nuevo solo al servidor", () => {
    expect(migration).toContain("IF to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN");
    expect(migration).toContain("EXECUTE 'DROP FUNCTION public.create_payment(uuid) RESTRICT';");
    expect(migration).not.toMatch(/DROP FUNCTION[^;]*CASCADE/i);
    expect(read("BASELINE_CANDIDATE.sql")).not.toMatch(/CREATE (?:OR REPLACE )?FUNCTION public\.create_payment\(\s*\w+ uuid\s*\)/i);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public\."create_payment"\(uuid\)/);
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.create_payment(uuid,text) TO service_role;");
  });
  it("teléfono y pedido se verifican antes del INSERT bajo bloqueo", () => {
    const lock = payment.indexOf("FOR UPDATE OF o, c;");
    expect(payment.slice(0, lock)).toContain("c.phone = trim(p_customer_phone) OR c.whatsapp = trim(p_customer_phone)");
    expect(payment.indexOf("IF v_order.id IS NULL")).toBeLessThan(payment.indexOf("INSERT INTO public.payments"));
    expect(payment).toContain("ERRCODE = 'P0002'");
  });
  it("contrato de pago conserva reintento pendiente y calcula monto del pedido", () => {
    expect(payment).toContain("IF v_pending_count > 1 THEN");
    expect(payment).toContain("IF v_payment.id IS NULL THEN");
    expect(payment).toContain("VALUES (p_order_id, 'qr', v_order.total, 'pendiente')");
    expect(payment).toContain("v_payment.amount IS DISTINCT FROM v_order.total");
    expect(payment).not.toContain("p_amount");
  });
  it("confirmación verifica pedido/monto/expiración antes de confirmar", () => {
    const update = confirmation.indexOf("set status = 'confirmado'");
    const guards = confirmation.slice(0, update);
    expect(guards).toContain("v_order.status <> 'pendiente_pago'");
    expect(guards).toContain("v_order.reserved_until <= now()");
    expect(guards).toContain("v_invalid_reservations > 0");
    expect(guards).toContain("v_payment.amount is distinct from v_order.total");
    expect(confirmation).not.toContain("ya fue cancelado automáticamente");
  });
  it("preserva venta física finalizada y expiración con cancelación", () => {
    expect(migration).toContain("values (p_customer_id, 'fisica', 'finalizado', v_subtotal, 0, v_subtotal)");
    expect(migration).toContain("set status = 'cancelado'");
    expect(migration).toContain("and o.status = 'pendiente_pago'");
  });
  it("no habilita automáticamente personal nuevo ni mezcla 035/historial", () => {
    expect(read("HANDLE_NEW_USER_FINAL.sql")).toContain("'empleado', false");
    expect(migration).not.toMatch(/CREATE (OR REPLACE )?FUNCTION public\.track_order_details/);
    expect(migration).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+supabase_migrations/);
    expect(migration).not.toMatch(/^DROP\s+/m);
  });
});
