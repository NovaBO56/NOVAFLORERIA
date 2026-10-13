import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptionKey } from './backup-core.mjs';
import { lines, openManifest, postgresInventory, storageHTTP, verifyStorage } from './storage-production.mjs';
import { prefixes, s3Transport } from './s3-transport.mjs';
import { readWeekly } from './weekly-backup.mjs';

export async function restoreStorageLocal({ url, apiKey, token, acknowledge, inventory, transport, descriptor, prefix, dir, key }) {
  if (acknowledge !== 'DISPOSABLE_LOCAL') throw new Error('Confirmación LOCAL requerida.');
  const target = storageHTTP({ url, apiKey, token, mode: 'local' });
  // Preflight every encrypted file/hash before writing anything to the target.
  await verifyStorage({ descriptor, transport, key, dir, prefix });
  const manifest = await openManifest({ descriptor, transport, key, dir, prefix });
  const expected = new Set(), expectedBuckets = new Set();
  for await (const entry of lines(manifest)) {
    if (entry.type === 'buckets') for (const bucket of entry.buckets) expectedBuckets.add(bucket.id);
    if (entry.type === 'object') expected.add(JSON.stringify([entry.bucket, entry.path]));
  }
  await rm(manifest, { force: true }); await rm(join(dir, 'manifest-download.enc'), { force: true });
  async function checkInventory() {
    const actual = new Set(), buckets = new Set();
    for await (const entry of inventory()) {
      if (entry.type === 'buckets') for (const bucket of entry.buckets) buckets.add(bucket.id);
      if (entry.type === 'object') actual.add(JSON.stringify([entry.bucket, entry.path]));
    }
    if (expected.size !== actual.size || expectedBuckets.size !== buckets.size || [...expected].some(item => !actual.has(item)) || [...expectedBuckets].some(item => !buckets.has(item))) throw new Error('DB restaurada y manifest Storage difieren.');
  }
  await checkInventory();
  const result = await verifyStorage({ descriptor, transport, key, dir, prefix, target });
  await checkInventory();
  return result;
}
async function main(env = process.env) {
  if (env.BACKUP_MODE !== 'local' || !['127.0.0.1', 'localhost'].includes(env.PGHOST)) throw new Error('Restore solo LOCAL.');
  const roots = prefixes(env), key = encryptionKey(env.BACKUP_ENCRYPTION_KEY), dir = await mkdtemp(join(tmpdir(), 'nova-storage-restore-'));
  try {
    const transport = await s3Transport(env, dir);
    const marker = await readWeekly(transport, process.argv[2], roots, key, dir);
    await restoreStorageLocal({ url: env.BACKUP_STORAGE_URL, apiKey: env.BACKUP_STORAGE_API_KEY, token: env.BACKUP_STORAGE_READ_TOKEN, acknowledge: env.RESTORE_STORAGE_LOCAL, inventory: postgresInventory(env), transport, descriptor: marker.storage, prefix: `${roots.storage}${marker.id}/`, dir, key });
    console.log('Storage LOCAL restaurado: todos los objetos y SHA-256 verificados.');
  } finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(() => { console.error('Restore Storage LOCAL fallido; descartar destino parcial y revisar evidencia privada.'); process.exitCode = 1; });
