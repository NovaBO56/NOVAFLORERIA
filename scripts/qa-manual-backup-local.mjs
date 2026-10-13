// DB-only drill, real LOCAL PostgreSQL/Auth. No Storage-byte reads or writes.
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { sha256 } from '../supabase/backup/backup-core.mjs';
import { restoreLocal } from '../supabase/backup/restore-local.mjs';
import { runPg } from '../supabase/backup/pg-tools.mjs';

const [privateDir, operation] = process.argv.slice(2);
if (!privateDir || !relative(resolve(process.cwd()), resolve(privateDir)).startsWith('..')) throw new Error('Directorio privado fuera de Git requerido.');
const cfg = JSON.parse(await readFile(join(privateDir, 'status.private.json'), 'utf8'));
if (cfg.API_URL !== 'http://127.0.0.1:59621') throw new Error('Solo origen LOCAL TWO-QR.');
const encryption = JSON.parse(await readFile(join(privateDir, 'backup-key.private.json'), 'utf8')).key;
const env = { ...process.env, BACKUP_MODE: 'local', PGHOST: '127.0.0.1', PGDATABASE: 'postgres', BACKUP_LOCAL_CONTAINER: 'supabase_db_NOVA-LOCAL-TWO-QR', BACKUP_ENCRYPTION_KEY: encryption, BACKUP_OUTPUT_DIR: join(privateDir, 'manual-database-backups') };
const sql = async (context, input) => (await runPg('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1'], { env: context, input })).trim();
if (operation === 'capture') {
  const previous = new Set(await readdir(env.BACKUP_OUTPUT_DIR).catch(error => { if (error.code === 'ENOENT') return []; throw error; }));
  // Run the same CLI used by npm run backup:manual, with private env only.
  const message = execFileSync(process.execPath, ['supabase/backup/manual-backup.mjs'], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 180000 });
  const manifests = (await readdir(env.BACKUP_OUTPUT_DIR)).filter(name => !previous.has(name) && name.endsWith('.verified.json'));
  if (manifests.length !== 1) throw new Error('No hay exactamente un manifest nuevo.');
  const manifest = JSON.parse(await readFile(join(env.BACKUP_OUTPUT_DIR, manifests[0]), 'utf8'));
  if (await sha256(join(env.BACKUP_OUTPUT_DIR, manifest.name)) !== manifest.sha256 || manifest.storage_files !== false) throw new Error('Hash/alcance incorrecto.');
  await writeFile(join(privateDir, 'manual-backup-results.private.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  console.log(message.trim()); console.log(JSON.stringify({ captured: true, sha256Verified: true, storageFiles: false }));
} else if (operation === 'restore') {
  const targetDir = resolve(privateDir, '..', 'two-qr-restore'), target = JSON.parse(await readFile(join(targetDir, 'status.private.json'), 'utf8'));
  if (target.API_URL !== 'http://127.0.0.1:61621') throw new Error('Solo destino LOCAL restore.');
  const targetEnv = { ...env, BACKUP_LOCAL_CONTAINER: 'supabase_db_NOVA-LOCAL-TWO-QR-RESTORE', RESTORE_DISPOSABLE_LOCAL: 'YES', BACKUP_DIAGNOSTIC_FILE: join(privateDir, 'manual-restore-diagnostic.private.log') };
  const manifest = JSON.parse(await readFile(join(privateDir, 'manual-backup-results.private.json'), 'utf8')), archive = join(env.BACKUP_OUTPUT_DIR, manifest.name);
  if (await sha256(archive) !== manifest.sha256) throw new Error('Hash previo a restore no coincide.');
  await restoreLocal(archive, targetEnv);
  const tables = (await sql(env, "SELECT json_build_object('schema',schemaname,'table',tablename) FROM pg_tables WHERE schemaname IN ('public','auth','storage','supabase_migrations') AND NOT (schemaname='auth' AND tablename='schema_migrations') AND NOT (schemaname='storage' AND tablename='migrations') ORDER BY schemaname,tablename;")).split('\n').map(JSON.parse);
  const identifier = value => '"' + value.replaceAll('"', '""') + '"';
  const query = tables.map(table => `SELECT json_build_object('table','${table.schema}.${table.table}','count',count(*),'hash',md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),''))) FROM ${identifier(table.schema)}.${identifier(table.table)} t`).join(' UNION ALL ') + ';';
  const parse = text => text.split('\n').map(JSON.parse).sort((a, b) => a.table.localeCompare(b.table));
  const before = parse(await sql(env, query)), after = parse(await sql(targetEnv, query));
  const differences = before.filter((row, index) => JSON.stringify(row) !== JSON.stringify(after[index])).map(row => row.table);
  if (differences.length) throw new Error(`Datos DB difieren: ${differences.join(',')}`);
  const configuration = JSON.parse(await sql(targetEnv, "SELECT json_build_object('slots',array_agg(qr_slot ORDER BY qr_slot),'snapshots',(SELECT count(*) FROM public.payments WHERE qr_slot IS NOT NULL),'payment_anon',has_function_privilege('anon','public.report_payment_qr(uuid,text,text)','EXECUTE'),'payment_authenticated',has_function_privilege('authenticated','public.report_payment_qr(uuid,text,text)','EXECUTE'),'payment_service',has_function_privilege('service_role','public.report_payment_qr(uuid,text,text)','EXECUTE')) FROM public.payment_qr_config;"));
  if (configuration.payment_anon || configuration.payment_authenticated || !configuration.payment_service || JSON.stringify(configuration.slots) !== JSON.stringify(['qr_1', 'qr_2'])) throw new Error('ACL/slots QR restaurados incorrectos.');
  const credentials = JSON.parse(await readFile(join(privateDir, 'admin.credentials.private.json'), 'utf8'));
  const client = createClient(target.API_URL, target.ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await client.auth.signInWithPassword(credentials); if (login.error) throw new Error('Login Auth LOCAL falló.'); await client.auth.signOut();
  const result = { tablesMatched: tables.length, differences, authLogin: true, privatePaymentRPC: true, qrSlots: configuration.slots, snapshotsRestored: configuration.snapshots, storageFiles: false };
  await writeFile(join(privateDir, 'manual-restore-results.private.json'), JSON.stringify(result, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(result));
} else throw new Error('Usar capture o restore.');
