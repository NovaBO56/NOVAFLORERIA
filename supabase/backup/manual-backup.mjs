// Manual DB-only backup. No scheduler, remote destination, Storage bytes or deletion.
import { constants } from 'node:fs';
import { access, copyFile, mkdir, mkdtemp, open, realpath, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveName, decryptDump, encryptDump, encryptionKey, productionRef, sha256, validateSource } from './backup-core.mjs';
import { runPg } from './pg-tools.mjs';

function inside(parent, child) {
  const distance = relative(parent, child);
  return distance === '' || !isAbsolute(distance) && distance !== '..' && !distance.startsWith('..' + sep);
}
// Resolve existing ancestors first, including junctions, before creating anything.
export async function backupDirectory(requested) {
  if (!requested || !isAbsolute(requested)) throw new Error('Carpeta absoluta fuera de Git requerida.');
  const repo = await realpath(fileURLToPath(new URL('../../', import.meta.url)));
  let ancestor = resolve(requested), tail = [];
  for (;;) {
    try { ancestor = await realpath(ancestor); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; const parent = dirname(ancestor); if (parent === ancestor) throw new Error('Directorio inválido.'); tail.unshift(ancestor.slice(parent.length).replace(/^[/\\]/, '')); ancestor = parent; }
  }
  const canonical = resolve(ancestor, ...tail);
  if (inside(repo, canonical)) throw new Error('No guardar backups dentro del repositorio.');
  for (let folder = ancestor; ; folder = dirname(folder)) {
    try { await access(join(folder, '.git')); throw new Error('No guardar backups dentro de Git.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (dirname(folder) === folder) break;
  }
  await mkdir(canonical, { recursive: true, mode: 0o700 });
  const actual = await realpath(canonical);
  if (inside(repo, actual) || !(await stat(actual)).isDirectory()) throw new Error('Destino de backup inválido.');
  return actual;
}
export async function manualBackup(env = process.env, pg = runPg) {
  validateSource(env);
  if (env.BACKUP_MODE === 'production') {
    for (const name of ['PGUSER', 'PGPASSWORD', 'PGSSLROOTCERT']) if (!env[name]) throw new Error(`${name} requerido en sesión privada.`);
    if (env.PGDATABASE !== 'postgres' || env.BACKUP_LOCAL_CONTAINER) throw new Error('Conexión productiva explícita requerida.');
  }
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  let dir, output, manifestPath, created = false, manifestCreated = false;
  try {
    const destination = await backupDirectory(env.BACKUP_OUTPUT_DIR);
    dir = await mkdtemp(join(await backupDirectory(tmpdir()), 'anabelle-manual-db-'));
    const dump = join(dir, 'database.dump'), cipher = dump + '.enc', recovered = join(dir, 'roundtrip.dump');
    await pg('pg_dump', ['--no-password', '--format=custom', '--schema=public', '--schema=auth', '--schema=storage', '--schema=supabase_migrations', '--lock-wait-timeout=60s'], { output: dump, env: { ...env, PGOPTIONS: '-c default_transaction_read_only=on', PGCONNECT_TIMEOUT: '20' } });
    if ((await stat(dump)).size < 100) throw new Error('Dump vacío o incompleto.');
    const toc = await pg('pg_restore', ['--list', dump], { env });
    for (const schema of ['public', 'auth', 'storage', 'supabase_migrations']) if (!toc.includes(`TABLE DATA ${schema} `)) throw new Error('Dump no incluye los cuatro esquemas requeridos.');
    await encryptDump(dump, cipher, key);
    const digest = await sha256(cipher), name = archiveName();
    output = join(destination, name); manifestPath = output + '.verified.json';
    await copyFile(cipher, output, constants.COPYFILE_EXCL); created = true;
    if (await sha256(output) !== digest || (await stat(output)).size !== (await stat(cipher)).size) throw new Error('Copia cifrada no coincide.');
    await decryptDump(output, recovered, key);
    const plainDigest = await sha256(dump);
    if (await sha256(recovered) !== plainDigest) throw new Error('Verificación del cifrado fallida.');
    const manifest = { format: 1, name, created_at: new Date().toISOString(), source_mode: env.BACKUP_MODE, ...(env.BACKUP_MODE === 'production' ? { source_project_ref: productionRef } : {}), sha256: digest, bytes: (await stat(output)).size, plaintext_sha256: plainDigest, schemas: ['public', 'auth', 'storage', 'supabase_migrations'], encryption: 'AES-256-GCM', dump_toc_verified: true, storage_files: false, restore_verified: false };
    const handle = await open(manifestPath, 'wx', 0o600); manifestCreated = true;
    try { await handle.writeFile(JSON.stringify(manifest, null, 2)); } finally { await handle.close(); }
    return manifest;
  } catch (error) {
    // Only this invocation's new files, never a previous valid backup.
    if (manifestCreated) await rm(manifestPath, { force: true });
    if (created) await rm(output, { force: true });
    throw error;
  } finally { key.fill(0); if (dir) await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const env = { ...process.env, ...(process.argv[2] ? { BACKUP_OUTPUT_DIR: process.argv[2] } : {}) };
  manualBackup(env).then(() => console.log('Backup manual cifrado creado y verificado correctamente.')).catch(() => { console.error('Backup manual fallido. No se generó una copia verificada; revisar variables privadas, destino, herramientas y permisos.'); process.exitCode = 1; });
}
