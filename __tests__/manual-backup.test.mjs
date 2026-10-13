import { afterEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { archiveName, decryptDump, encryptionKey, productionRef, sha256, validateSource } from '../supabase/backup/backup-core.mjs';
import { backupDirectory, manualBackup } from '../supabase/backup/manual-backup.mjs';
import { validateRestore } from '../supabase/backup/restore-local.mjs';

// Actual filesystem/crypto; pg commands are synthetic adapters, not a DB proof.
const dirs = [], plain = Buffer.alloc(512, 11), encryption = Buffer.alloc(32, 7).toString('base64');
afterEach(async () => { for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }); });
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'anabelle-manual-test-')); dirs.push(dir);
  return { dir, env: { BACKUP_MODE: 'local', PGHOST: '127.0.0.1', BACKUP_OUTPUT_DIR: join(dir, 'copies'), BACKUP_ENCRYPTION_KEY: encryption } };
}
async function pg(binary, args, options) {
  if (binary === 'pg_dump') { await writeFile(options.output, plain); return; }
  return ['public', 'auth', 'storage', 'supabase_migrations'].map(schema => `1; 1 1 TABLE DATA ${schema} table postgres`).join('\n');
}
describe('Backup manual de datos', () => {
  it('genera archivo cifrado + manifest, verifica SHA y roundtrip, sin imágenes', async () => {
    const { env } = await setup(), result = await manualBackup(env, pg);
    expect(result.storage_files).toBe(false); expect(result.restore_verified).toBe(false); expect(result.dump_toc_verified).toBe(true);
    const archive = join(env.BACKUP_OUTPUT_DIR, result.name);
    expect(await sha256(archive)).toBe(result.sha256);
    expect(JSON.parse(await readFile(archive + '.verified.json', 'utf8'))).toEqual(result);
    expect((await readdir(env.BACKUP_OUTPUT_DIR)).sort()).toEqual([result.name, result.name + '.verified.json']);
    const recovered = join(env.BACKUP_OUTPUT_DIR, '..', 'recovered');
    await decryptDump(archive, recovered, encryptionKey(encryption)); expect(await readFile(recovered)).toEqual(plain);
    expect(result.name).toMatch(/^floristeria-anabelle-\d{4}-.*\.dump\.enc$/);
  });
  it('conserva todas las copias anteriores sin retención/borrado automático', async () => {
    const { env } = await setup(); const first = await manualBackup(env, pg), second = await manualBackup(env, pg);
    expect(first.name).not.toBe(second.name); expect(await readdir(env.BACKUP_OUTPUT_DIR)).toHaveLength(4);
    expect(await sha256(join(env.BACKUP_OUTPUT_DIR, first.name))).toBe(first.sha256);
  });
  it('falla antes de pg_dump para origen no autorizado o TLS inseguro', async () => {
    const { env } = await setup(); let called = false;
    await expect(manualBackup({ ...env, BACKUP_MODE: 'production', BACKUP_PROJECT_REF: 'uyhawlpanhbrkkhqfhbv' }, async () => { called = true; })).rejects.toThrow(); expect(called).toBe(false);
    expect(() => validateSource({ BACKUP_MODE: 'production', BACKUP_PROJECT_REF: productionRef, PGHOST: `db.${productionRef}.supabase.co`, PGSSLMODE: 'disable' })).toThrow();
  });
  it('admite solo host autorizado/TLS y pooler de sesión del ref autorizado', () => {
    const env = { BACKUP_MODE: 'production', BACKUP_PROJECT_REF: productionRef, PGHOST: `db.${productionRef}.supabase.co`, PGSSLMODE: 'verify-full' };
    expect(() => validateSource(env)).not.toThrow();
    expect(() => validateSource({ ...env, PGHOST: 'aws-0-region.pooler.supabase.com', PGUSER: `reader.${productionRef}`, PGPORT: '5432' })).not.toThrow();
    expect(() => validateSource({ ...env, PGHOST: 'aws-0-region.pooler.supabase.com', PGUSER: 'reader.other', PGPORT: '5432' })).toThrow();
    expect(() => validateSource({ ...env, PGPORT: '6543' })).toThrow();
  });
  it.each(['PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE'])('rechaza override %s en backup y restore antes de conexiones', async name => {
    const { env } = await setup();
    await expect(manualBackup({ ...env, [name]: 'unexpected' }, pg)).rejects.toThrow('overrides');
    expect(() => validateRestore({ ...env, [name]: 'unexpected', RESTORE_DISPOSABLE_LOCAL: 'YES' })).toThrow('overrides');
  });
  it('rechaza carpeta dentro del repo antes de crearla o ejecutar PostgreSQL', async () => {
    const target = resolve('must-not-create-backups'); let called = false;
    const { env } = await setup();
    await expect(manualBackup({ ...env, BACKUP_OUTPUT_DIR: target }, async () => { called = true; })).rejects.toThrow('repositorio');
    expect(existsSync(target)).toBe(false); expect(called).toBe(false);
  });
  it('rechaza destinos dentro de otro repo Git y junction al repo actual', async () => {
    const { dir } = await setup(), other = join(dir, 'other'); await mkdir(join(other, '.git'), { recursive: true });
    await expect(backupDirectory(join(other, 'backups'))).rejects.toThrow('Git');
    const link = join(dir, 'link'); await symlink(resolve('.'), link, 'junction');
    await expect(backupDirectory(join(link, 'must-not-create-backups'))).rejects.toThrow('repositorio');
  });
  it.each(['dump', 'toc'])('no escribe copia final cuando falla %s', async stage => {
    const { env } = await setup();
    await expect(manualBackup(env, async (binary, args, options) => { if (stage === 'dump') throw new Error('PG failed'); if (binary === 'pg_dump') await writeFile(options.output, plain); else return 'TABLE DATA public only'; })).rejects.toThrow();
    expect(await readdir(env.BACKUP_OUTPUT_DIR)).toEqual([]);
  });
  it('manifest no contiene credenciales ni cadenas de conexión', async () => {
    const { env } = await setup(), secret = 'synthetic-do-not-persist';
    const result = await manualBackup({ ...env, PGPASSWORD: secret }, pg);
    const manifest = await readFile(join(env.BACKUP_OUTPUT_DIR, result.name + '.verified.json'), 'utf8');
    expect(manifest).not.toContain(secret); expect(manifest).not.toContain(encryption); expect(manifest).not.toContain('PGPASSWORD');
  });
  it('incluye fecha UTC y sufijo en nombres distintos', () => {
    expect(archiveName(new Date('2026-10-12T23:00:00Z'), 'aaaaaaaaaaaa')).toBe('floristeria-anabelle-2026-10-12T23-00-00-000Z-aaaaaaaaaaaa.dump.enc');
  });
});
