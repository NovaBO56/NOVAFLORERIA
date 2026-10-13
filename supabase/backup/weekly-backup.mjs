// Disabled operational entrypoint; import has no side effects.
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveName, decryptDump, encryptDump, encryptionKey, sha256, validateBucket, validateSource } from './backup-core.mjs';
import { runPg } from './pg-tools.mjs';
import { prefixes, s3Transport } from './s3-transport.mjs';
import { backupStorage, captureInventory, lines, openManifest, postgresInventory, storageHTTP, uploadVerified, verifyRemote, verifyStorage } from './storage-production.mjs';

const generationPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{12}$/;
export async function readWeekly(transport, objectKey, roots, key, dir) {
  const id = objectKey.slice(roots.weekly.length).replace(/\.complete\.enc$/, '');
  if (!generationPattern.test(id) || objectKey !== `${roots.weekly}${id}.complete.enc`) throw new Error('Marcador semanal inválido.');
  const file = join(dir, 'weekly-read.enc'), plain = join(dir, 'weekly-read.json');
  try {
    const head = await transport.head(objectKey); await transport.get(objectKey, file);
    if ((await stat(file)).size !== head.ContentLength || await sha256(file) !== head.Metadata?.sha256) throw new Error('Marcador semanal alterado.');
    await decryptDump(file, plain, key);
    const marker = JSON.parse(await readFile(plain, 'utf8'));
    if (marker.format !== 3 || marker.id !== id || marker.database?.key !== `${roots.database}${id}/database.dump.enc` || marker.storage?.key !== `${roots.storage}${id}/manifest.enc` || !Number.isSafeInteger(marker.storage.objects) || marker.storage.objects < 0) throw new Error('Contrato semanal inválido.');
    for (const descriptor of [marker.database, marker.storage]) if (!Number.isSafeInteger(descriptor.bytes) || descriptor.bytes < 42 || !/^[a-f0-9]{64}$/.test(descriptor.sha256)) throw new Error('Descriptor inválido.');
    return marker;
  } finally { await rm(file, { force: true }); await rm(plain, { force: true }); }
}
export async function retainWeekly({ transport, roots, newest, keep, key, dir }) {
  if (!Number.isInteger(keep) || keep < 4 || keep > 52) throw new Error('Retención inválida.');
  const names = await transport.list(roots.weekly), valid = [];
  // Recheck both parts. Incomplete generations never count as recoverable copies.
  for (const name of [...new Set(names)].sort().reverse()) {
    if (!name.endsWith('.complete.enc') || !generationPattern.test(name.slice(roots.weekly.length, -13))) continue;
    const marker = await readWeekly(transport, name, roots, key, dir);
    await verifyRemote(transport, marker.database, dir);
    await verifyStorage({ descriptor: marker.storage, transport, key, dir, prefix: `${roots.storage}${marker.id}/` });
    valid.push(marker);
  }
  if (!valid.some(marker => marker.id === newest)) throw new Error('No hay nueva semana recuperable.');
  for (const marker of valid.slice(keep).filter(marker => marker.id < newest)) {
    const manifest = await openManifest({ descriptor: marker.storage, transport, key, dir, prefix: `${roots.storage}${marker.id}/` });
    await transport.remove(`${roots.weekly}${marker.id}.complete.enc`);
    for await (const entry of lines(manifest)) if (entry.type === 'object') await transport.remove(entry.remote.key);
    await transport.remove(marker.storage.key); await transport.remove(marker.database.key);
    await rm(manifest, { force: true }); await rm(join(dir, 'manifest-download.enc'), { force: true });
  }
}
export async function runWeekly({ transport, roots, inventory, source, dumpDatabase, dir, key, keep = 8, id = archiveName().replace('.dump.enc', ''), retain = true }) {
  if (!generationPattern.test(id)) throw new Error('Generación inválida.');
  const first = join(dir, 'inventory-before.ndjson'), afterDB = join(dir, 'inventory-after-db.ndjson'), afterFiles = join(dir, 'inventory-after-files.ndjson');
  const initialHash = await captureInventory(inventory, first);
  // DB -> Storage -> verify DB -> verify Storage -> joint marker -> retention.
  const dump = join(dir, 'database.dump'), cipher = dump + '.enc';
  await dumpDatabase(dump);
  if ((await stat(dump)).size < 100) throw new Error('Dump vacío.');
  if (await captureInventory(inventory, afterDB) !== initialHash) throw new Error('Storage cambió durante el dump; repetir con escrituras suspendidas.');
  await encryptDump(dump, cipher, key);
  const database = await uploadVerified(transport, cipher, `${roots.database}${id}/database.dump.enc`, dir);
  const storage = await backupStorage({ inventoryFile: first, source, transport, prefix: `${roots.storage}${id}/`, dir, key });
  await verifyRemote(transport, database, dir);
  await verifyStorage({ descriptor: storage, transport, key, dir, prefix: `${roots.storage}${id}/` });
  if (await captureInventory(inventory, afterFiles) !== initialHash) throw new Error('Storage cambió durante la copia; no generar marcador ni retener.');
  const marker = { format: 3, id, verified_at: new Date().toISOString(), inventory_sha256: initialHash, database, storage, schemas: ['public', 'auth', 'storage', 'supabase_migrations'] };
  const markerPlain = join(dir, 'weekly.json'), markerCipher = markerPlain + '.enc';
  await writeFile(markerPlain, JSON.stringify(marker), { mode: 0o600, flag: 'wx' });
  await encryptDump(markerPlain, markerCipher, key);
  await uploadVerified(transport, markerCipher, `${roots.weekly}${id}.complete.enc`, dir);
  await readWeekly(transport, `${roots.weekly}${id}.complete.enc`, roots, key, dir);
  if (retain) await retainWeekly({ transport, roots, newest: id, keep, key, dir });
  return marker;
}
export async function runBackup(env = process.env) {
  if (env.BACKUP_ENABLED !== 'true') throw new Error('Backup desactivado.');
  validateSource(env); const bucket = validateBucket(env), roots = prefixes(env);
  for (const name of ['PGPASSWORD', 'PGUSER', 'PGDATABASE']) if (!env[name]) throw new Error(`${name} requerido mediante entorno protegido.`);
  const source = storageHTTP({ url: env.BACKUP_STORAGE_URL, apiKey: env.BACKUP_STORAGE_API_KEY, token: env.BACKUP_STORAGE_READ_TOKEN, mode: env.BACKUP_MODE });
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY), dir = await mkdtemp(join(tmpdir(), 'nova-weekly-'));
  try {
    const transport = await s3Transport(env, dir);
    await runWeekly({ transport, roots, source, inventory: postgresInventory(env), dir, key, keep: bucket.retention,
      dumpDatabase: async output => {
        await runPg('pg_dump', ['--no-password', '--format=custom', '--schema=public', '--schema=auth', '--schema=storage', '--schema=supabase_migrations', '--lock-wait-timeout=60s'], { env: { ...env, PGOPTIONS: '-c default_transaction_read_only=on', PGCONNECT_TIMEOUT: '20' }, output });
        await runPg('pg_restore', ['--list', output], { env });
      },
    });
    console.log('DB + Storage verificados; semana recuperable y retención coordinada completadas.');
  } finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) runBackup().catch(() => { console.error('Backup semanal fallido; no considerarlo válido. Revisar diagnóstico privado.'); process.exitCode = 1; });
