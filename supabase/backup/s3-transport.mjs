import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateBucket } from './backup-core.mjs';

async function command(args, env) {
  const child = spawn('aws', args, { env, shell: false, stdio: ['ignore', 'pipe', 'ignore'] });
  const done = new Promise((resolve, reject) => { child.once('error', () => reject(new Error('AWS CLI no disponible.'))); child.once('close', code => code === 0 ? resolve() : reject(new Error('Operación S3 fallida.'))); });
  const chunks = []; for await (const chunk of child.stdout) chunks.push(chunk); await done;
  return Buffer.concat(chunks).toString('utf8');
}
export function prefixes(env) {
  const values = [env.BACKUP_S3_PREFIX, env.BACKUP_S3_STORAGE_PREFIX, env.BACKUP_S3_WEEKLY_PREFIX];
  if (values.some(value => !/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,150}\/$/.test(value || '') || value.split('/').includes('..')) || values.some((v, i) => values.some((other, j) => i !== j && v.startsWith(other)))) throw new Error('Tres prefijos separados y no solapados requeridos.');
  return { database: values[0], storage: values[1], weekly: values[2] };
}
export async function s3Transport(env, dir) {
  const bucket = validateBucket(env); prefixes(env);
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) throw new Error('Credenciales S3 protegidas requeridas.');
  const addressing = env.BACKUP_S3_ADDRESSING_STYLE || 'path';
  if (!['path', 'virtual', 'auto'].includes(addressing)) throw new Error('Direccionamiento inválido.');
  const config = join(dir, 'aws-config');
  await writeFile(config, `[default]\ns3 =\n    addressing_style = ${addressing}\n`, { mode: 0o600 });
  env = { ...env, AWS_CONFIG_FILE: config, AWS_PAGER: '' };
  const common = ['--endpoint-url', bucket.endpoint, '--region', env.AWS_DEFAULT_REGION || 'us-east-1', '--no-cli-pager'];
  const api = async args => JSON.parse(await command([...common, 's3api', ...args], env) || '{}');
  const acl = await api(['get-bucket-acl', '--bucket', bucket.bucket]);
  if (!Array.isArray(acl.Grants) || acl.Grants.some(g => /\/(AllUsers|AuthenticatedUsers)$/.test(g.Grantee?.URI || ''))) throw new Error('ACL pública o no verificable.');
  const policy = env.BACKUP_S3_POLICY_STATUS || 'required';
  if (!['required', 'unsupported'].includes(policy)) throw new Error('Validación de política inválida.');
  if (policy === 'required' && (await api(['get-bucket-policy-status', '--bucket', bucket.bucket])).PolicyStatus?.IsPublic !== false) throw new Error('Política pública o no verificable.');
  if ((env.BACKUP_S3_VERSIONING || 'required') === 'required' && (await api(['get-bucket-versioning', '--bucket', bucket.bucket])).Status !== 'Enabled') throw new Error('Versionado requerido.');
  const encryption = env.BACKUP_S3_SSE || 'AES256';
  if (!['AES256', 'aws:kms', 'client-only'].includes(encryption)) throw new Error('Cifrado S3 inválido.');
  if (encryption === 'aws:kms' && !env.BACKUP_S3_KMS_KEY_ID) throw new Error('KMS protegido requerido.');
  const flags = encryption === 'client-only' ? [] : ['--sse', encryption, ...(encryption === 'aws:kms' ? ['--sse-kms-key-id', env.BACKUP_S3_KMS_KEY_ID] : [])];
  const roots = Object.values(prefixes(env));
  const scoped = key => { if (!roots.some(root => key.startsWith(root))) throw new Error('Objeto fuera de prefijos autorizados.'); };
  return {
    async put(key, file, digest) { scoped(key); await command([...common, 's3', 'cp', file, `s3://${bucket.bucket}/${key}`, '--only-show-errors', '--metadata', `sha256=${digest}`, ...flags], env); },
    async get(key, output) { scoped(key); await api(['get-object', '--bucket', bucket.bucket, '--key', key, output]); },
    async head(key) { scoped(key); const head = await api(['head-object', '--bucket', bucket.bucket, '--key', key]); if (encryption !== 'client-only' && head.ServerSideEncryption !== encryption) throw new Error('Cifrado externo no confirmado.'); return head; },
    async list(prefix) {
      scoped(prefix); const keys = []; let token;
      do {
        const page = await api(['list-objects-v2', '--bucket', bucket.bucket, '--prefix', prefix, ...(token ? ['--continuation-token', token] : [])]);
        keys.push(...(page.Contents || []).map(item => item.Key));
        const next = page.IsTruncated ? page.NextContinuationToken : null;
        if (page.IsTruncated && (!next || next === token)) throw new Error('Paginación incompleta.'); token = next;
      } while (token);
      return keys;
    },
    async remove(key) { scoped(key); await api(['delete-object', '--bucket', bucket.bucket, '--key', key]); },
  };
}
