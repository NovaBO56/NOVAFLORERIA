// Streaming, paginated Storage backup. No object/count/aggregate test limits.
import { createReadStream, createWriteStream } from 'node:fs';
import { appendFile, rm, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { decryptDump, encryptDump, productionRef, sha256 } from './backup-core.mjs';
import { runPg } from './pg-tools.mjs';

export function storageURL(url, mode) {
  const parsed = new URL(url);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('URL Storage inválida.');
  if (mode === 'local' ? parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname) : mode !== 'production' || parsed.origin !== `https://${productionRef}.supabase.co`) throw new Error('Origen Storage no autorizado.');
  return parsed.origin;
}
export function safeObject(bucket, path) {
  for (const value of [bucket, path]) if (typeof value !== 'string' || !value || /[\\\x00-\x1f\x7f]/.test(value) || value.startsWith('/') || value.split('/').some(p => ['', '.', '..'].includes(p))) throw new Error('Ruta Storage inválida.');
  if (bucket.includes('/')) throw new Error('Bucket inválido.');
}
export async function* lines(file) {
  const reader = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  try { for await (const line of reader) if (line) yield JSON.parse(line); } finally { reader.close(); }
}
const literal = value => "'" + value.replaceAll("'", "''") + "'";
export function postgresInventory(env, pageSize = 1000) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 10000) throw new Error('Página inválida.');
  const query = async sql => (await runPg('psql', ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], { env: { ...env, PGOPTIONS: '-c default_transaction_read_only=on' }, input: sql })).trim().split('\n').filter(Boolean).map(JSON.parse);
  return async function* inventory() {
    yield { type: 'buckets', buckets: await query('SELECT row_to_json(b) FROM (SELECT id FROM storage.buckets ORDER BY id COLLATE "C") b;') };
    let last;
    for (;;) {
      const where = last ? `WHERE (bucket_id COLLATE "C", name COLLATE "C") > (${literal(last.bucket)}, ${literal(last.path)})` : '';
      const rows = await query(`SELECT row_to_json(o) FROM (SELECT bucket_id AS bucket, name AS path, id, version, updated_at, metadata FROM storage.objects ${where} ORDER BY bucket_id COLLATE "C", name COLLATE "C" LIMIT ${pageSize}) o;`);
      for (const row of rows) { safeObject(row.bucket, row.path); yield { type: 'object', ...row }; }
      if (rows.length < pageSize) break;
      last = rows.at(-1);
    }
  };
}
export async function captureInventory(inventory, file) {
  await writeFile(file, '', { mode: 0o600, flag: 'wx' });
  for await (const item of inventory()) await appendFile(file, JSON.stringify(item) + '\n');
  return sha256(file);
}
export function storageHTTP({ url, apiKey, token, mode, fetcher = fetch }) {
  const origin = storageURL(url, mode);
  if (!apiKey || !token) throw new Error('Credenciales Storage protegidas requeridas.');
  const headers = { apikey: apiKey, Authorization: `Bearer ${token}` };
  const objectURL = (bucket, path, authenticated = false) => {
    safeObject(bucket, path);
    return `${origin}/storage/v1/object/${authenticated ? 'authenticated/' : ''}${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
  };
  return {
    async download(bucket, path, output) {
      const response = await fetcher(objectURL(bucket, path, true), { headers, redirect: 'error', signal: AbortSignal.timeout(300000) });
      if (!response.ok || !response.body) throw new Error('Descarga Storage fallida.');
      await pipeline(Readable.fromWeb(response.body), createWriteStream(output, { flags: 'wx', mode: 0o600 }));
      return { contentType: response.headers.get('content-type') };
    },
    async upload(bucket, path, input, contentType) {
      if (mode !== 'local') throw new Error('Restore solo LOCAL.');
      const response = await fetcher(objectURL(bucket, path), { method: 'POST', headers: { ...headers, 'x-upsert': 'true', 'content-type': contentType || 'application/octet-stream' }, body: createReadStream(input), duplex: 'half', redirect: 'error', signal: AbortSignal.timeout(300000) });
      if (!response.ok) throw new Error('Subida Storage local fallida.');
      await response.body?.cancel();
    },
  };
}
export async function uploadVerified(transport, file, objectKey, dir) {
  const descriptor = { key: objectKey, bytes: (await stat(file)).size, sha256: await sha256(file) };
  await transport.put(objectKey, file, descriptor.sha256);
  await verifyRemote(transport, descriptor, dir);
  return descriptor;
}
export async function verifyRemote(transport, descriptor, dir) {
  const head = await transport.head(descriptor.key);
  if (head.ContentLength !== descriptor.bytes || head.Metadata?.sha256 !== descriptor.sha256) throw new Error('Tamaño/metadatos externos no coinciden.');
  const copy = join(dir, 'verify-' + createHash('sha256').update(descriptor.key).digest('hex'));
  try {
    await transport.get(descriptor.key, copy);
    if ((await stat(copy)).size !== descriptor.bytes || await sha256(copy) !== descriptor.sha256) throw new Error('SHA-256 externo no coincide.');
  } finally { await rm(copy, { force: true }); }
}
export async function backupStorage({ inventoryFile, source, transport, prefix, dir, key }) {
  const manifest = join(dir, 'storage-manifest.ndjson');
  await writeFile(manifest, JSON.stringify({ type: 'header', format: 2 }) + '\n', { mode: 0o600, flag: 'wx' });
  let count = 0;
  for await (const entry of lines(inventoryFile)) {
    if (entry.type === 'buckets') { await appendFile(manifest, JSON.stringify(entry) + '\n'); continue; }
    if (entry.type !== 'object') throw new Error('Inventario inválido.');
    safeObject(entry.bucket, entry.path);
    const plain = join(dir, 'storage-object'), encrypted = plain + '.enc';
    try {
      const info = await source.download(entry.bucket, entry.path, plain);
      const size = (await stat(plain)).size;
      if (entry.metadata?.size != null && Number(entry.metadata.size) !== size) throw new Error('Tamaño de origen cambió.');
      const digest = await sha256(plain);
      await encryptDump(plain, encrypted, key);
      const remote = await uploadVerified(transport, encrypted, `${prefix}objects/${count}.enc`, dir);
      await appendFile(manifest, JSON.stringify({ type: 'object', bucket: entry.bucket, path: entry.path, size, contentType: info?.contentType || entry.metadata?.mimetype || null, sha256: digest, remote }) + '\n');
      count++;
    } finally { await rm(plain, { force: true }); await rm(encrypted, { force: true }); }
  }
  await appendFile(manifest, JSON.stringify({ type: 'footer', objects: count }) + '\n');
  const encrypted = manifest + '.enc'; await encryptDump(manifest, encrypted, key);
  const remote = await uploadVerified(transport, encrypted, `${prefix}manifest.enc`, dir);
  return { ...remote, objects: count };
}
// Authenticate and validate the complete manifest before any restore writes.
export async function openManifest({ descriptor, transport, key, dir, prefix }) {
  const cipher = join(dir, 'manifest-download.enc'), plain = join(dir, 'manifest-decoded.ndjson');
  await verifyRemote(transport, descriptor, dir);
  await transport.get(descriptor.key, cipher);
  if (await sha256(cipher) !== descriptor.sha256) throw new Error('Manifest alterado.');
  await decryptDump(cipher, plain, key);
  let header = false, buckets = false, footer = false, count = 0;
  const seen = new Set(), bucketNames = new Set();
  for await (const entry of lines(plain)) {
    if (!header) { if (entry.type !== 'header' || entry.format !== 2) throw new Error('Manifest inválido.'); header = true; continue; }
    if (footer) throw new Error('Manifest con datos extra.');
    if (entry.type === 'buckets' && !buckets && count === 0) {
      if (!Array.isArray(entry.buckets)) throw new Error('Buckets inválidos.');
      for (const bucket of entry.buckets) { safeObject(bucket.id, 'check'); if (bucketNames.has(bucket.id)) throw new Error('Bucket duplicado.'); bucketNames.add(bucket.id); }
      buckets = true; continue;
    }
    if (entry.type === 'footer' && buckets) { if (entry.objects !== count || descriptor.objects !== count) throw new Error('Manifest incompleto.'); footer = true; continue; }
    if (entry.type !== 'object' || !buckets) throw new Error('Manifest inválido.');
    safeObject(entry.bucket, entry.path);
    const identity = JSON.stringify([entry.bucket, entry.path]);
    if (!bucketNames.has(entry.bucket) || seen.has(identity) || !Number.isSafeInteger(entry.size) || entry.size < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.remote?.key !== `${prefix}objects/${count}.enc` || !/^[a-f0-9]{64}$/.test(entry.remote.sha256) || !Number.isSafeInteger(entry.remote.bytes) || entry.remote.bytes < 42) throw new Error('Objeto de manifest inválido.');
    seen.add(identity); count++;
  }
  if (!footer) throw new Error('Manifest sin cierre.');
  return plain;
}
export async function verifyStorage({ descriptor, transport, key, dir, prefix, target }) {
  const manifest = await openManifest({ descriptor, transport, key, dir, prefix });
  let count = 0;
  for await (const entry of lines(manifest)) {
    if (entry.type !== 'object') continue;
    const cipher = join(dir, 'object-download.enc'), plain = join(dir, 'object-decoded'), restored = join(dir, 'object-restored');
    try {
      await verifyRemote(transport, entry.remote, dir);
      await transport.get(entry.remote.key, cipher);
      if (await sha256(cipher) !== entry.remote.sha256) throw new Error('Objeto cambió durante verificación.');
      await decryptDump(cipher, plain, key);
      if ((await stat(plain)).size !== entry.size || await sha256(plain) !== entry.sha256) throw new Error('SHA-256 Storage no coincide.');
      if (target) {
        await target.upload(entry.bucket, entry.path, plain, entry.contentType);
        await target.download(entry.bucket, entry.path, restored);
        if ((await stat(restored)).size !== entry.size || await sha256(restored) !== entry.sha256) throw new Error('SHA-256 restaurado no coincide.');
      }
      count++;
    } finally { for (const file of [cipher, plain, restored]) await rm(file, { force: true }); }
  }
  await rm(manifest, { force: true }); await rm(join(dir, 'manifest-download.enc'), { force: true });
  return { objects: count, verified: true };
}
