// Candidate: no credentials here. Nothing runs merely by importing this module.
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { archiveName, encryptDump, encryptionKey, retentionCandidates, sha256, validateBucket, validateSource, verifyDownloaded } from './backup-core.mjs';

// Suppress subprocess diagnostics: PostgreSQL/S3 errors may contain connection data.
async function command(binary, args, { output, env = process.env } = {}) {
  const child = spawn(binary, args, { env, shell: false, stdio: ['ignore', 'pipe', 'ignore'] });
  const done = new Promise((resolve, reject) => { child.once('error', () => reject(new Error(`${binary}: no disponible.`))); child.once('close', code => code === 0 ? resolve() : reject(new Error(`${binary}: operación fallida.`))); });
  if (output) { const piping = pipeline(child.stdout, createWriteStream(output, { flags: 'wx', mode: 0o600 })); await Promise.all([done, piping]); return; }
  const chunks = []; for await (const chunk of child.stdout) chunks.push(chunk);
  await done; return Buffer.concat(chunks).toString('utf8');
}
export async function runBackup(env = process.env) {
  validateSource(env); const bucket = validateBucket(env); const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  for (const name of ['PGPASSWORD', 'PGUSER', 'PGDATABASE', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) if (!env[name]) throw new Error(`${name} requerido mediante entorno protegido.`);
  const dir = await mkdtemp(join(tmpdir(), 'nova-backup-'));
  const addressing = env.BACKUP_S3_ADDRESSING_STYLE || 'path';
  if (!['path', 'virtual', 'auto'].includes(addressing)) { await rm(dir, { recursive: true, force: true }); throw new Error('Estilo de direccionamiento S3 inválido.'); }
  const configPath = join(dir, 'aws-config');
  await writeFile(configPath, `[default]\ns3 =\n    addressing_style = ${addressing}\n`, { mode: 0o600 });
  env = { ...env, AWS_CONFIG_FILE: configPath, AWS_PAGER: '' };
  const dump = join(dir, 'database.dump'); const name = archiveName(); const encrypted = join(dir, name);
  const pgEnv = { ...env, PGOPTIONS: '-c default_transaction_read_only=on', PGCONNECT_TIMEOUT: '20' };
  const s3 = async (args, output) => {
    const result = await command('aws', ['--endpoint-url', bucket.endpoint, '--region', env.AWS_DEFAULT_REGION || 'us-east-1', '--no-cli-pager', 's3api', ...args], { env: { ...env, AWS_PAGER: '' }, output });
    return output ? null : JSON.parse(result || '{}');
  };
  const objectKey = bucket.prefix + name;
  try {
    // Fail closed on public ACLs. Policy status is configurable for compatible
    // providers lacking that AWS-specific API, after a manual policy review.
    const acl = await s3(['get-bucket-acl', '--bucket', bucket.bucket]);
    if (!Array.isArray(acl.Grants) || acl.Grants.some(grant => /\/(AllUsers|AuthenticatedUsers)$/.test(grant.Grantee?.URI || ''))) throw new Error('Bucket público o ACL no verificable.');
    const policyStatus = env.BACKUP_S3_POLICY_STATUS || 'required';
    if (!['required', 'unsupported'].includes(policyStatus)) throw new Error('Validación de política inválida.');
    if (policyStatus === 'required') {
      const policy = await s3(['get-bucket-policy-status', '--bucket', bucket.bucket]);
      if (policy.PolicyStatus?.IsPublic !== false) throw new Error('Política pública o no verificable.');
    }
    // ONE transactionally consistent archive includes business, Auth and Storage metadata.
    await command('pg_dump', ['--no-password', '--format=custom', '--schema=public', '--schema=auth', '--schema=storage', '--schema=supabase_migrations', '--lock-wait-timeout=60s'], { output: dump, env: pgEnv });
    if ((await stat(dump)).size < 100) throw new Error('Dump vacío.');
    await command('pg_restore', ['--list', dump], { env });
    if ((env.BACKUP_S3_VERSIONING || 'required') === 'required') {
      const versioning = await s3(['get-bucket-versioning', '--bucket', bucket.bucket]);
      if (versioning.Status !== 'Enabled') throw new Error('El bucket debe tener versionado habilitado.');
    }
    await encryptDump(dump, encrypted, key);
    const hash = await sha256(encrypted);
    const serverEncryption = env.BACKUP_S3_SSE || 'AES256';
    if (!['AES256', 'aws:kms', 'client-only'].includes(serverEncryption)) throw new Error('Cifrado S3 inválido.');
    const sse = serverEncryption === 'client-only' ? [] : ['--server-side-encryption', serverEncryption];
    if (serverEncryption === 'aws:kms') { if (!env.BACKUP_S3_KMS_KEY_ID) throw new Error('Falta identificador KMS protegido.'); sse.push('--ssekms-key-id', env.BACKUP_S3_KMS_KEY_ID); }
    // s3 cp uses multipart for large files. Never set a public ACL.
    await command('aws', ['--endpoint-url', bucket.endpoint, '--region', env.AWS_DEFAULT_REGION || 'us-east-1', 's3', 'cp', encrypted, `s3://${bucket.bucket}/${objectKey}`, '--only-show-errors', '--metadata', `sha256=${hash}`, ...sse.map(arg => arg === '--server-side-encryption' ? '--sse' : arg === '--ssekms-key-id' ? '--sse-kms-key-id' : arg)], { env });
    const head = await s3(['head-object', '--bucket', bucket.bucket, '--key', objectKey]);
    if (serverEncryption !== 'client-only' && head.ServerSideEncryption !== serverEncryption) throw new Error('S3 no confirmó el cifrado solicitado.');
    const downloaded = join(dir, 'verification.enc');
    await s3(['get-object', '--bucket', bucket.bucket, '--key', objectKey, downloaded]);
    await verifyDownloaded(encrypted, downloaded, head);
    const marker = join(dir, 'verified.json');
    await writeFile(marker, JSON.stringify({ format: 1, name, sha256: hash, bytes: head.ContentLength, verified_at: new Date().toISOString(), schemas: ['public', 'auth', 'storage', 'supabase_migrations'], storage_files: false }), { mode: 0o600 });
    await s3(['put-object', '--bucket', bucket.bucket, '--key', objectKey + '.verified.json', '--body', marker, ...sse]);
    const confirmed = await s3(['head-object', '--bucket', bucket.bucket, '--key', objectKey + '.verified.json']);
    if (confirmed.ContentLength !== (await stat(marker)).size) throw new Error('Marcador de verificación no confirmado.');
    const names = []; let token;
    do {
      const page = await s3(['list-objects-v2', '--bucket', bucket.bucket, '--prefix', bucket.prefix, ...(token ? ['--continuation-token', token] : [])]);
      names.push(...(page.Contents || []).map(object => object.Key)); token = page.IsTruncated ? page.NextContinuationToken : null;
      if (page.IsTruncated && !token) throw new Error('Listado S3 incompleto.');
    } while (token);
    const set = new Set(names);
    const verified = names.filter(key => key.endsWith('.dump.enc') && set.has(key + '.verified.json')).map(key => key.slice(bucket.prefix.length));
    for (const old of retentionCandidates(verified, name, bucket.retention)) {
      await s3(['delete-object', '--bucket', bucket.bucket, '--key', bucket.prefix + old]);
      await s3(['delete-object', '--bucket', bucket.bucket, '--key', bucket.prefix + old + '.verified.json']);
    }
    console.log('Backup cifrado y copia S3 verificados. Retención completada.');
  } finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) runBackup().catch(() => { console.error('Backup fallido. Revisar configuración protegida y permisos; no se considera exitoso.'); process.exitCode = 1; });
