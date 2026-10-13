import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
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
  if (env.PGHOSTADDR || env.PGSERVICE || env.PGSERVICEFILE) throw new Error('No usar overrides de conexión PostgreSQL.');
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
export function archiveName(date = new Date(), suffix = randomBytes(6).toString('hex')) {
  return `floristeria-anabelle-${date.toISOString().replace(/[:.]/g, '-')}-${suffix}.dump.enc`;
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
