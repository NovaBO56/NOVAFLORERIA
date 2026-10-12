import { mkdir, mkdtemp, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveName, encryptDump, encryptionKey, sha256, validateSource } from './backup-core.mjs';
import { runPg } from './pg-tools.mjs';

export async function localBackup(env = process.env) {
  if (env.BACKUP_MODE !== 'local') throw new Error('Este comando admite únicamente LOCAL.');
  validateSource(env);
  if (!env.BACKUP_OUTPUT_DIR) throw new Error('Directorio privado fuera de Git requerido.');
  await mkdir(env.BACKUP_OUTPUT_DIR, { recursive: true });
  const outputDir = await realpath(env.BACKUP_OUTPUT_DIR);
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  const distance = relative(resolve(repo), outputDir);
  if (!distance.startsWith('..')) throw new Error('No guardar backups dentro del repositorio.');
  const dir = await mkdtemp(join(tmpdir(), 'nova-local-backup-'));
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  try {
    const dump = join(dir, 'database.dump');
    await runPg('pg_dump', ['--no-password', '--format=custom', '--schema=public', '--schema=auth', '--schema=storage', '--schema=supabase_migrations', '--lock-wait-timeout=60s'], { output: dump, env: { ...env, PGOPTIONS: '-c default_transaction_read_only=on' } });
    const toc = await runPg('pg_restore', ['--list', dump], { env });
    if (!toc.includes('TABLE DATA public')) throw new Error('Dump sin tablas de negocio.');
    const name = archiveName(); const encrypted = join(outputDir, name);
    await encryptDump(dump, encrypted, key);
    const manifest = { format: 1, name, created_at: new Date().toISOString(), sha256: await sha256(encrypted), bytes: (await stat(encrypted)).size, plaintext_sha256: await sha256(dump), schemas: ['public', 'auth', 'storage', 'supabase_migrations'], storage_files: false, restore_verified: false };
    await writeFile(encrypted + '.verified.json', JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx' });
    return manifest;
  } finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) localBackup().then(result => console.log(JSON.stringify(result))).catch(() => { console.error('Backup LOCAL fallido; no se considera recuperable hasta probar restore.'); process.exitCode = 1; });
