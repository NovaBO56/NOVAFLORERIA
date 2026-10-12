// Independent Storage object backup/restore. LOCAL only; no S3/cloud calls.
import { createClient } from '@supabase/supabase-js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { encryptDump, decryptDump, encryptionKey, sha256 } from './backup-core.mjs';

function client(url, key) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.username || parsed.password || parsed.search) throw new Error('Storage permite solo LOCAL.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function safePath(value) {
  if (!value || value.startsWith('/') || value.includes('\\') || value.split('/').some(part => ['..', '.', ''].includes(part))) throw new Error('Ruta de objeto inválida.');
  return value;
}
export async function storageBackup({ url, key, encryption, output }) {
  if (!relative(resolve(process.cwd()), resolve(output)).startsWith('..')) throw new Error('Archivo privado fuera de Git requerido.');
  const source = client(url, key); const files = []; let totalBytes = 0;
  const buckets = await source.storage.listBuckets(); if (buckets.error) throw new Error('No se pudo listar Storage local.');
  async function folder(bucket, prefix = '') {
    for (let offset = 0; ; offset += 100) {
      const result = await source.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
      if (result.error) throw new Error('No se pudo leer Storage local.');
      for (const item of result.data) {
        const path = safePath(prefix ? `${prefix}/${item.name}` : item.name);
        if (!item.id) { await folder(bucket, path); continue; }
        const downloaded = await source.storage.from(bucket).download(path); if (downloaded.error) throw new Error('Archivo Storage faltante.');
        const bytes = Buffer.from(await downloaded.data.arrayBuffer());
        totalBytes += bytes.length;
        if (bytes.length > 5 * 1024 * 1024 || totalBytes > 64 * 1024 * 1024 || files.length >= 5000) throw new Error('Límite local de prueba excedido.');
        files.push({ bucket, path, contentType: downloaded.data.type, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.toString('base64') });
      }
      if (result.data.length < 100) return;
    }
  }
  for (const bucket of buckets.data) await folder(bucket.id);
  const dir = await mkdtemp(join(tmpdir(), 'nova-storage-')); const cipherKey = encryptionKey(encryption);
  try {
    const plain = join(dir, 'storage.json'); await writeFile(plain, JSON.stringify({ format: 1, files }), { mode: 0o600 });
    await encryptDump(plain, output, cipherKey);
    return { files: files.length, sha256: await sha256(output), objects: files.map(({ bucket, path, sha256 }) => ({ bucket, path, sha256 })) };
  } finally { cipherKey.fill(0); await rm(dir, { recursive: true, force: true }); }
}
export async function storageRestore({ url, key, encryption, input, acknowledge }) {
  if (acknowledge !== 'DISPOSABLE_LOCAL') throw new Error('Confirmación de entorno desechable requerida.');
  const target = client(url, key); const cipherKey = encryptionKey(encryption); const dir = await mkdtemp(join(tmpdir(), 'nova-storage-restore-'));
  try {
    const plain = join(dir, randomUUID() + '.json'); await decryptDump(input, plain, cipherKey);
    const bundle = JSON.parse(await readFile(plain, 'utf8')); if (bundle.format !== 1 || !Array.isArray(bundle.files)) throw new Error('Formato inválido.');
    for (const file of bundle.files) {
      safePath(file.path); const bytes = Buffer.from(file.bytes, 'base64');
      if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Archivo corrupto.');
      const uploaded = await target.storage.from(file.bucket).upload(file.path, bytes, { contentType: file.contentType, upsert: true });
      if (uploaded.error) throw new Error('No se pudo restaurar el archivo local.');
      const downloaded = await target.storage.from(file.bucket).download(file.path);
      if (downloaded.error || createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex') !== file.sha256) throw new Error('Restauración Storage no coincide.');
    }
    return { restored: bundle.files.length, verified: true };
  } finally { cipherKey.fill(0); await rm(dir, { recursive: true, force: true }); }
}
