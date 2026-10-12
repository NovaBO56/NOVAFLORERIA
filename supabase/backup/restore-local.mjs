import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { decryptDump, encryptionKey } from './backup-core.mjs';

export function validateRestore(env) {
  if (env.BACKUP_MODE !== 'local' || !['127.0.0.1', 'localhost', '::1'].includes(env.PGHOST) || env.RESTORE_DISPOSABLE_LOCAL !== 'YES') throw new Error('Restauración permitida solo en localhost desechable, con confirmación explícita.');
}
// Restore on an empty, matching-version Supabase stack, never on plain PostgreSQL.
export function restoreList(toc) {
  return toc.split('\n').filter(line => {
    if (line.startsWith(';')) return true;
    if (/\b(SCHEMA -|COMMENT - SCHEMA) (public|auth|storage|supabase_migrations)\b/.test(line)) return false;
    if (/\bpublic\b/.test(line) && !/\b(auth|storage)\b/.test(line)) return true;
    if (/TABLE DATA supabase_migrations /.test(line)) return true;
    if (/\b(TABLE DATA|SEQUENCE SET) (auth|storage) /.test(line)) return !/\b(schema_migrations|migrations)\b/.test(line);
    if (/TRIGGER auth users on_auth_user_created /.test(line)) return true;
    if (/POLICY storage /.test(line)) return true;
    return false;
  }).join('\n');
}
async function pg(binary, args, input) {
  const child = spawn(binary, args, { shell: false, stdio: ['pipe', 'pipe', 'ignore'] });
  const done = new Promise((resolve, reject) => { child.once('error', () => reject(new Error('Herramienta PostgreSQL no disponible.'))); child.once('close', code => code === 0 ? resolve() : reject(new Error('Restauración local fallida; detenerse y revisar el archivo en privado.'))); });
  child.stdin.end(input);
  const chunks = []; for await (const chunk of child.stdout) chunks.push(chunk); await done;
  return Buffer.concat(chunks).toString('utf8');
}
export async function restoreLocal(archive, env = process.env) {
  validateRestore(env);
  // Only catalog reads until the empty target has been confirmed.
  const count = await pg('psql', ['-XAt', '--no-password', '-c', "SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public')+(SELECT count(*) FROM auth.users)+(SELECT count(*) FROM storage.buckets)+(SELECT count(*) FROM storage.objects)+(SELECT count(*) FROM supabase_migrations.schema_migrations);"]);
  if (count.trim() !== '0') throw new Error('El destino no está vacío. No se restauró nada.');
  const dir = await mkdtemp(join(tmpdir(), 'nova-restore-')); const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  try {
    const dump = join(dir, 'database.dump'); await decryptDump(archive, dump, key);
    const toc = await pg('pg_restore', ['--list', dump]);
    const selected = join(dir, 'restore.list'); await writeFile(selected, restoreList(toc), { mode: 0o600 });
    if (!(await readFile(selected, 'utf8')).includes('TABLE DATA public')) throw new Error('El backup no contiene datos de negocio.');
    const base = ['--no-password', '--exit-on-error', '--no-owner', '--dbname', env.PGDATABASE || 'postgres', '--use-list', selected];
    await pg('pg_restore', [...base, '--section=pre-data', dump]);
    // Local postgres superuser: preserve FK data ordering and avoid recreating profiles
    // when importing auth.users. Triggers are restored after the complete data load.
    await pg('pg_restore', [...base, '--section=data', '--disable-triggers', dump]);
    await pg('pg_restore', [...base, '--section=post-data', dump]);
    console.log('Restauración local completada; verificar datos, ACL, RLS y archivos de Storage por separado.');
  } finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) restoreLocal(process.argv[2]).catch(() => { console.error('Restauración rechazada o fallida. No reutilizar el destino parcialmente restaurado.'); process.exitCode = 1; });
