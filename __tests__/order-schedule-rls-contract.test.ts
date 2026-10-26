import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationRoot = path.resolve("supabase/migrations");
const readSql = (name: string) => fs.readFileSync(path.join(migrationRoot, name), "utf8")
  .replace(/--[^\r\n]*/g, "");
const original = readSql("20261024000200_order_management_details.sql");
const correction = readSql("20261025000100_order_schedule_rls_fix.sql");
const signature = String.raw`public\.set_order_schedule\(\s*uuid\s*,\s*timestamptz\s*,\s*text\s*,\s*integer\s*,\s*boolean\s*\)`;
const definition = original.match(/CREATE\s+FUNCTION\s+public\.set_order_schedule\(([^)]*)\)([\s\S]*?)END;\s*\$\$;/i);
if (!definition) throw new Error("Missing original scheduling function contract.");

// Static migration checks only. Real RLS/role behavior is verified separately
// against local PostgreSQL, including transactional rollback of test schedules.
describe("Order scheduling RLS correction (static contract)", () => {
  it("allows the guarded RPC to lock an existing order without requiring an orders UPDATE policy", () => {
    expect(correction).toMatch(new RegExp(`ALTER\\s+FUNCTION\\s+${signature}\\s+SECURITY\\s+DEFINER\\s*;`, "i"));
    expect(correction).not.toMatch(/SECURITY\s+INVOKER/i);
    expect(original).toMatch(/SET\s+search_path\s*=\s*public\s*,\s*pg_temp/i);
    const body = definition![2];
    const authorization = body.indexOf("auth.uid() IS NULL OR NOT public.is_employee_or_admin()");
    const lock = body.search(/SELECT[^;]*FOR\s+UPDATE/i);
    expect(authorization).toBeGreaterThanOrEqual(0);
    expect(lock).toBeGreaterThan(authorization);
    expect(body.slice(authorization, lock)).toContain("ERRCODE='42501'");
  });

  it("keeps caller identity in the authenticated session and leaves table permissions restricted", () => {
    expect(definition![1]).not.toMatch(/\bp_(?:actor|user|employee)(?:_id)?\b/i);
    expect(original).toMatch(/actor\s+uuid\s*:=\s*auth\.uid\(\)/i);
    expect(original).toMatch(/NEW\.schedule_updated_by\s*:=\s*actor/i);
    expect(correction).not.toMatch(/(?:CREATE|ALTER)\s+POLICY\b/i);
    expect(correction).not.toMatch(/GRANT[^;]*ON\s+(?:TABLE\s+)?public\.orders\b/i);
    expect(correction).not.toMatch(/ALTER\s+TABLE\s+public\.orders[^;]*ROW\s+LEVEL\s+SECURITY/i);
  });

  it("does not expose the privileged scheduling RPC to anonymous callers", () => {
    const revoked = correction.match(new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+${signature}\\s+FROM\\s+([^;]+);`, "i"));
    expect(revoked).not.toBeNull();
    expect(revoked![1].split(",").map(role => role.trim().toLowerCase())).toEqual(expect.arrayContaining(["public", "anon"]));
    const grants = [...correction.matchAll(new RegExp(`GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+${signature}\\s+TO\\s+([^;]+);`, "gi"))];
    expect(grants).toHaveLength(1);
    expect(grants[0][1].split(",").map(role => role.trim().toLowerCase()).sort()).toEqual(["authenticated", "service_role"]);
  });
});
