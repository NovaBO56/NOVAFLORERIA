import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export const productionRef = 'groyjvbtcuhjbltmmdfl';
const magic = Buffer.from('NOVA-BACKUP-V1\n');
export function encryptionKey(value) {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value || '')) throw new Error('BACKUP_ENCRYPTION_KEY debe ser base64 de 32 bytes.');
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error('Clave de cifrado inválida.');
  return key;
}
export function validateSource(env) {
  if (env.BACKUP_MODE === 'local') {
    if (!['127.0.0.1', 'localhost', '::1'].includes(env.PGHOST)) throw new Error('El modo local requiere localhost.');
    return;
  }
  if (env.BACKUP_MODE !== 'production' || env.BACKUP_PROJECT_REF !== productionRef) throw new Error('Destino productivo no autorizado.');
  const direct = env.PGHOST === `db.${productionRef}.supabase.co`;
  const pooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(env.PGHOST || '') && env.PGUSER?.endsWith(`.${productionRef}`);
  if (!(direct || pooler) || env.PGSSLMODE !== 'verify-full') throw new Error('Host/SSL de producción inválido.');
  if (env.PGPORT === '6543') throw new Error('Usa conexión directa o pooler de sesión, no transaccional.');
}
export function validateBucket(env) {
  const endpoint = new URL(env.BACKUP_S3_ENDPOINT);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('Endpoint S3 requiere HTTPS sin credenciales.');
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(env.BACKUP_S3_BUCKET || '')) throw new Error('Bucket inválido.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,150}\/$/.test(env.BACKUP_S3_PREFIX || '')) throw new Error('Prefijo acotado terminado en / requerido.');
  if (env.BACKUP_BUCKET_PRIVATE_CONFIRMED !== 'true') throw new Error('Debe verificarse que el bucket es privado antes de activarlo.');
  const retention = Number(env.BACKUP_RETENTION_WEEKS || 8);
  if (!Number.isInteger(retention) || retention < 4 || retention > 52) throw new Error('Retención debe estar entre 4 y 52 semanas.');
  if (!['required', 'unsupported'].includes(env.BACKUP_S3_VERSIONING || 'required')) throw new Error('Versionado inválido.');
  return { endpoint: endpoint.href.replace(/\/$/, ''), bucket: env.BACKUP_S3_BUCKET, prefix: env.BACKUP_S3_PREFIX, retention };
}
export function archiveName(date = new Date(), suffix = randomBytes(6).toString('hex')) {
  return `${date.toISOString().replace(/[:.]/g, '-')}-${suffix}.dump.enc`;
}
export async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
export async function encryptDump(input, output, key) {
  const nonce = randomBytes(12);
  const handle = await open(output, 'wx', 0o600);
  await handle.write(Buffer.concat([magic, nonce])); await handle.close();
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  await pipeline(createReadStream(input), cipher, createWriteStream(output, { flags: 'a', mode: 0o600 }));
  const tail = await open(output, 'a'); await tail.write(cipher.getAuthTag()); await tail.close();
}
export async function decryptDump(input, output, key) {
  const file = await open(input, 'r');
  try {
    const size = (await file.stat()).size;
    if (size < magic.length + 28) throw new Error('Archivo cifrado incompleto.');
    const header = Buffer.alloc(magic.length + 12); await file.read(header, 0, header.length, 0);
    if (!header.subarray(0, magic.length).equals(magic)) throw new Error('Formato no reconocido.');
    const tag = Buffer.alloc(16); await file.read(tag, 0, 16, size - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(magic.length)); decipher.setAuthTag(tag);
    const source = size === header.length + 16 ? (await import('node:stream')).Readable.from([]) : createReadStream(input, { start: header.length, end: size - 17 });
    await pipeline(source, decipher, createWriteStream(output, { flags: 'wx', mode: 0o600 }));
  } finally { await file.close(); }
}
export async function verifyDownloaded(source, downloaded, head) {
  const digest = await sha256(source);
  if (head.ContentLength !== (await stat(source)).size || head.Metadata?.sha256 !== digest || await sha256(downloaded) !== digest) throw new Error('La copia S3 no coincide; no ejecutar retención.');
  return digest;
}
// Only previously verified copies are eligible. Unrelated/unverified objects survive.
export function retentionCandidates(verified, newest, keep) {
  if (!Number.isInteger(keep) || keep < 4 || !verified.includes(newest)) throw new Error('No existe una copia nueva verificada.');
  const valid = verified.filter(name => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{12}\.dump\.enc$/.test(name));
  if (!valid.includes(newest)) throw new Error('Nombre de backup inválido.');
  return [...new Set(valid)].sort().reverse().slice(keep).filter(name => name < newest);
}
