import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Pure local tests: no database, credentials, S3 or production requests.
import { archiveName, decryptDump, encryptDump, encryptionKey, retentionCandidates, sha256, validateBucket, validateSource, verifyDownloaded } from "../supabase/backup/backup-core.mjs";
import { validateRestore, restoreList } from "../supabase/backup/restore-local.mjs";

describe("Backup privado", () => {
  it("cifra, recupera y detecta corrupción sin S3 (archivos locales)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nova-backup-test-"));
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
  it("no verifica una descarga diferente aunque tamaño y metadatos parezcan correctos", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nova-verification-test-"));
    try {
      const source = join(dir, "source"), copy = join(dir, "copy"); await writeFile(source, "abc"); await writeFile(copy, "abd");
      await expect(verifyDownloaded(source, copy, { ContentLength: 3, Metadata: { sha256: await sha256(source) } })).rejects.toThrow();
      await writeFile(copy, "abc"); await expect(verifyDownloaded(source, copy, { ContentLength: 3, Metadata: { sha256: await sha256(source) } })).resolves.toHaveLength(64);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it("retiene cuatro copias y no elimina archivos desconocidos ni una copia más reciente", () => {
    const names = Array.from({ length: 6 }, (_, i) => archiveName(new Date(`2026-10-0${i + 1}T00:00:00Z`), "aaaaaaaaaaaa"));
    expect(retentionCandidates([...names, "otro.dump"], names[5], 4)).toEqual([names[1], names[0]]);
    expect(retentionCandidates(names, names[0], 4)).toEqual([]);
    expect(() => retentionCandidates(names, "no-verificado", 4)).toThrow();
    expect(() => retentionCandidates(names, names[5], 1)).toThrow();
  });
  it("rechaza origen antiguo, endpoints inseguros y restauración remota", () => {
    expect(() => validateSource({ BACKUP_MODE: "production", BACKUP_PROJECT_REF: "uyhawlpanhbrkkhqfhbv" })).toThrow();
    expect(() => validateSource({ BACKUP_MODE: "local", PGHOST: "db.example.com" })).toThrow();
    expect(() => validateBucket({ BACKUP_S3_ENDPOINT: "http://example.com" })).toThrow();
    expect(() => validateRestore({ BACKUP_MODE: "local", PGHOST: "127.0.0.1", RESTORE_DISPOSABLE_LOCAL: "YES" })).not.toThrow();
    expect(() => validateRestore({ BACKUP_MODE: "production", PGHOST: "db.example.com" })).toThrow();
  });
  it("restaura negocio/Auth/Storage metadata sin recrear estructura interna de plataforma", () => {
    const selected = restoreList("1; 1 1 SCHEMA - public postgres\n2; 1 1 TABLE public orders postgres\n3; 1 1 TABLE auth users supabase_auth_admin\n4; 1 1 TABLE DATA auth users supabase_auth_admin\n5; 1 1 TABLE DATA auth schema_migrations supabase_auth_admin\n6; 1 1 TRIGGER auth users on_auth_user_created postgres\n7; 1 1 POLICY storage objects payment_qr_public_read postgres");
    expect(selected).toContain("TABLE public orders"); expect(selected).toContain("TABLE DATA auth users"); expect(selected).toContain("TRIGGER auth users"); expect(selected).toContain("POLICY storage");
    expect(selected).not.toContain("SCHEMA - public"); expect(selected).not.toContain("TABLE auth users"); expect(selected).not.toContain("DATA auth schema_migrations");
  });
});
