import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, appendFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

async function exec(binary, args, { env, input, output } = {}) {
  const child = spawn(binary, args, { env, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.on('data', bytes => { if (env?.BACKUP_MODE === 'local' && env?.BACKUP_DIAGNOSTIC_FILE && relative(resolve(process.cwd()), resolve(env.BACKUP_DIAGNOSTIC_FILE)).startsWith('..')) appendFileSync(env.BACKUP_DIAGNOSTIC_FILE, bytes, { mode: 0o600 }); });
  const done = new Promise((resolve, reject) => { child.once('error', () => reject(new Error('Herramienta no disponible.'))); child.once('close', code => code === 0 ? resolve() : reject(new Error('Operación PostgreSQL fallida; revisar herramientas y permisos.'))); });
  child.stdin.end(input);
  if (output) { await Promise.all([done, pipeline(child.stdout, createWriteStream(output, { flags: 'wx', mode: 0o600 }))]); return; }
  const chunks = []; for await (const chunk of child.stdout) chunks.push(chunk); await done;
  return Buffer.concat(chunks).toString('utf8');
}
export async function runPg(binary, args, { env = process.env, input, output } = {}) {
  if (!['pg_dump', 'pg_restore', 'psql'].includes(binary)) throw new Error('Herramienta PostgreSQL inválida.');
  if (!env.BACKUP_LOCAL_CONTAINER) return exec(binary, args, { env, input, output });
  if (env.BACKUP_MODE !== 'local' || !['127.0.0.1', 'localhost', '::1'].includes(env.PGHOST)
    || !/^supabase_db_NOVA-LOCAL-[A-Z0-9-]+$/.test(env.BACKUP_LOCAL_CONTAINER)
    || (env.DOCKER_HOST && !/^(npipe:|unix:)/.test(env.DOCKER_HOST))
    || (env.DOCKER_CONTEXT && !['default', 'desktop-linux'].includes(env.DOCKER_CONTEXT))) throw new Error('Docker PostgreSQL permitido solo en laboratorio local.');
  if ((await exec('docker', ['info', '--format', '{{.Name}}'], { env })).trim() !== 'docker-desktop') throw new Error('Daemon Docker no local.');
  const user = env.BACKUP_LOCAL_PGUSER || 'postgres';
  if (!['postgres', 'supabase_admin'].includes(user)) throw new Error('Rol local de herramientas inválido.');
  const container = env.BACKUP_LOCAL_CONTAINER, dir = `/tmp/nova-pg-${randomUUID()}`;
  await exec('docker', ['exec', container, 'mkdir', '-m', '700', dir], { env });
  try {
    const mapped = [];
    for (const arg of args) {
      if (isAbsolute(arg) && existsSync(arg)) {
        const remote = dir + '/' + basename(arg);
        await exec('docker', ['cp', arg, `${container}:${remote}`], { env }); mapped.push(remote);
      } else mapped.push(arg);
    }
    return await exec('docker', ['exec', '-i', ...(env.PGOPTIONS ? ['-e', `PGOPTIONS=${env.PGOPTIONS}`] : []), container, binary, '-U', user, ...(binary === 'psql' || binary === 'pg_dump' ? ['-d', env.PGDATABASE || 'postgres'] : []), ...mapped], { env, input, output });
  } finally { await exec('docker', ['exec', container, 'rm', '-rf', dir], { env }); }
}
