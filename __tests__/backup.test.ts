import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decryptDump, encryptDump, encryptionKey, validateSource } from "../supabase/backup/backup-core.mjs";
import { validateRestore, restoreList } from "../supabase/backup/restore-local.mjs";

describe("Backup DB privado — pruebas locales sin conexiones", () => {
  it("cifra, recupera y detecta corrupción", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anabelle-backup-test-"));
    try {
      const source = join(dir, "source"), encrypted = join(dir, "encrypted"), output = join(dir, "output");
      await writeFile(source, "datos sintéticos de prueba");
      const key = encryptionKey(Buffer.alloc(32, 7).toString("base64"));
      await encryptDump(source, encrypted, key);
      expect((await readFile(encrypted)).includes(Buffer.from("datos sintéticos"))).toBe(false);
      await decryptDump(encrypted, output, key);
      expect(await readFile(output, "utf8")).toBe("datos sintéticos de prueba");
      const bytes = await readFile(encrypted); bytes[bytes.length - 1] ^= 1; await writeFile(encrypted, bytes);
      await expect(decryptDump(encrypted, join(dir, "corrupt"), key)).rejects.toThrow();
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("rechaza origen antiguo y restauración remota", () => {
    expect(() => validateSource({ BACKUP_MODE: "production", BACKUP_PROJECT_REF: "uyhawlpanhbrkkhqfhbv" })).toThrow();
    expect(() => validateSource({ BACKUP_MODE: "local", PGHOST: "db.example.com" })).toThrow();
    expect(() => validateRestore({ BACKUP_MODE: "local", PGHOST: "127.0.0.1", RESTORE_DISPOSABLE_LOCAL: "YES" })).not.toThrow();
    expect(() => validateRestore({ BACKUP_MODE: "production", PGHOST: "db.example.com" })).toThrow();
  });
  it("restaura negocio/Auth/Storage metadata sin recrear estructura interna de plataforma", () => {
    const selected = restoreList("1; 1 1 SCHEMA - public postgres\n2; 1 1 TABLE public orders postgres\n3; 1 1 TABLE auth users supabase_auth_admin\n4; 1 1 TABLE DATA auth users supabase_auth_admin\n5; 1 1 TABLE DATA auth schema_migrations supabase_auth_admin\n6; 1 1 TRIGGER auth users on_auth_user_created postgres\n7; 1 1 POLICY storage objects payment_qr_public_read postgres");
    expect(selected).toContain("TABLE public orders"); expect(selected).toContain("TABLE DATA auth users"); expect(selected).toContain("TRIGGER auth users"); expect(selected).toContain("POLICY storage");
    expect(selected).not.toContain("SCHEMA - public"); expect(selected).not.toContain("TABLE auth users"); expect(selected).not.toContain("DATA auth schema_migrations");
  });
  it("incluye el esquema/historial si la plataforma vacía aún no tiene supabase_migrations", () => {
    const toc = "1; 1 1 SCHEMA - supabase_migrations postgres\n2; 1 1 TABLE supabase_migrations schema_migrations postgres\n3; 1 1 TABLE DATA supabase_migrations schema_migrations postgres";
    expect(restoreList(toc)).toContain("SCHEMA - supabase_migrations");
    expect(restoreList(toc, true)).not.toContain("TABLE supabase_migrations");
    expect(restoreList(toc, true)).toContain("TABLE DATA supabase_migrations");
  });
});
