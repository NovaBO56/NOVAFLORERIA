// Real LOCAL PostgreSQL/Auth/Storage + encrypted offline destination, never S3.
import { createClient } from '@supabase/supabase-js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { encryptionKey } from '../supabase/backup/backup-core.mjs';
import { localArchiveTransport } from '../supabase/backup/local-archive-transport.mjs';
import { postgresInventory, storageHTTP, verifyRemote } from '../supabase/backup/storage-production.mjs';
import { runWeekly } from '../supabase/backup/weekly-backup.mjs';
import { restoreLocal } from '../supabase/backup/restore-local.mjs';
import { restoreStorageLocal } from '../supabase/backup/restore-storage-local.mjs';
import { runPg } from '../supabase/backup/pg-tools.mjs';

const [privateDir, operation] = process.argv.slice(2);
if (!privateDir || !relative(resolve(process.cwd()), resolve(privateDir)).startsWith('..')) throw new Error('Salida privada fuera de Git requerida.');
const roots = { database: 'local/database/', storage: 'local/storage/', weekly: 'local/weekly/' };
const cfg = JSON.parse(await readFile(join(privateDir, 'status.private.json'), 'utf8'));
if (cfg.API_URL !== 'http://127.0.0.1:59621') throw new Error('Solo laboratorio TWO-QR local.');
const env = { ...process.env, BACKUP_MODE: 'local', PGHOST: '127.0.0.1', PGDATABASE: 'postgres', BACKUP_LOCAL_CONTAINER: 'supabase_db_NOVA-LOCAL-TWO-QR' };
const encryption = JSON.parse(await readFile(join(privateDir, 'backup-key.private.json'), 'utf8')).key;
const key = encryptionKey(encryption), dir = await mkdtemp(join(tmpdir(), 'nova-storage-qa-'));
const transport = await localArchiveTransport(join(privateDir, 'weekly-complete-archives'));
async function compareDatabase(targetEnv) {
  const tables = (await runPg('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1'], { env, input: "SELECT json_build_object('schema',schemaname,'table',tablename) FROM pg_tables WHERE schemaname IN ('public','auth','storage','supabase_migrations') ORDER BY schemaname,tablename;" })).trim().split('\n').filter(Boolean).map(JSON.parse);
  const identifier = value => '"' + value.replaceAll('"', '""') + '"';
  const query = tables.map(table => `SELECT json_build_object('table','${table.schema}.${table.table}','count',count(*),'hash',md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),''))) FROM ${identifier(table.schema)}.${identifier(table.table)} t`).join(' UNION ALL ') + ';';
  const parse = text => text.trim().split('\n').filter(Boolean).map(JSON.parse).sort((a, b) => a.table.localeCompare(b.table));
  const before = parse(await runPg('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1'], { env, input: query }));
  const after = parse(await runPg('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1'], { env: targetEnv, input: query }));
  const allDifferences = before.filter((row, index) => JSON.stringify(row) !== JSON.stringify(after[index])).map(row => row.table);
  // Platform migration ledgers are deliberately provisioned by the empty stack,
  // not imported by restoreList; storage.migrations includes installation times.
  const platform = ['auth.schema_migrations', 'storage.migrations'];
  const differences = allDifferences.filter(table => !platform.includes(table));
  const report = { tables: tables.length - platform.length, matched: tables.length - platform.length - differences.length, differences, platformDifferences: allDifferences.filter(table => platform.includes(table)) };
  await writeFile(join(privateDir, 'weekly-data-comparison.private.json'), JSON.stringify({ before, after, ...report }), { mode: 0o600 });
  return report;
}
try {
  if (operation === 'capture') {
    const client = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const bucket of ['qa-backup-empty', 'qa-backup-one', 'qa-backup-two', 'product-images']) {
      const listed = await client.storage.listBuckets(); if (listed.error) throw new Error('No se pueden listar buckets LOCAL.');
      if (!listed.data.some(item => item.id === bucket)) { const result = await client.storage.createBucket(bucket, { public: false }); if (result.error) throw new Error('Crear bucket sintético falló.'); }
    }
    const fixtures = [
      ['qa-backup-one', 'carpeta/flor.png', Buffer.from('TEST flor Unicode en contenido')],
      ['qa-backup-two', 'carpeta/flor.png', Buffer.from('TEST otra flor')],
      ['qa-backup-one', 'empty.bin', Buffer.alloc(0)],
      ['qa-backup-one', 'large.bin', Buffer.alloc(6 * 1024 * 1024, 11)],
      ['product-images', 'qa-backup/product.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6YAAAAABJRU5ErkJggg==', 'base64')],
      ...Array.from({ length: 5 }, (_, i) => ['qa-backup-one', `sub/otra/pagina-${i}.txt`, Buffer.from(`TEST página ${i}`)]),
    ];
    for (const [bucket, path, bytes] of fixtures) { const result = await client.storage.from(bucket).upload(path, bytes, { upsert: true, contentType: path.endsWith('.png') ? 'image/png' : 'application/octet-stream' }); if (result.error) { await writeFile(join(privateDir, 'storage-fixture-error.private.json'), JSON.stringify({ bucket, path, message: result.error.message, statusCode: result.error.statusCode }), { mode: 0o600 }); throw new Error('Subida sintética LOCAL falló; diagnóstico privado disponible.'); } }
    await runPg('psql', ['-X', '-v', 'ON_ERROR_STOP=1'], { env, input: "INSERT INTO public.product_images(product_id,storage_path,public_url,alt_text) SELECT id,'qa-backup/product.png','http://127.0.0.1:59621/storage/v1/object/public/product-images/qa-backup/product.png','TEST BACKUP IMAGE' FROM public.products WHERE name LIKE 'TEST%' AND NOT EXISTS(SELECT 1 FROM public.product_images WHERE storage_path='qa-backup/product.png') ORDER BY id LIMIT 1;" });
    const marker = await runWeekly({ transport, roots, inventory: postgresInventory(env, 2), source: storageHTTP({ url: cfg.API_URL, apiKey: cfg.SERVICE_ROLE_KEY, token: cfg.SERVICE_ROLE_KEY, mode: 'local' }), dir, key,
      dumpDatabase: async output => { await runPg('pg_dump', ['--format=custom', '--schema=public', '--schema=auth', '--schema=storage', '--schema=supabase_migrations'], { env, output }); await runPg('pg_restore', ['--list', output], { env }); },
    });
    await writeFile(join(privateDir, 'weekly-storage-results.private.json'), JSON.stringify(marker, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ operation, verifiedObjects: marker.storage.objects, realSQLPageSize: 2, syntheticFixtureObjects: fixtures.length, externalProvider: false }));
  } else if (operation === 'restore') {
    const marker = JSON.parse(await readFile(join(privateDir, 'weekly-storage-results.private.json'), 'utf8'));
    const targetDir = resolve(privateDir, '..', 'two-qr-restore');
    const target = JSON.parse(await readFile(join(targetDir, 'status.private.json'), 'utf8'));
    if (target.API_URL !== 'http://127.0.0.1:61621') throw new Error('Solo destino restore LOCAL.');
    const targetEnv = { ...env, BACKUP_LOCAL_CONTAINER: 'supabase_db_NOVA-LOCAL-TWO-QR-RESTORE', RESTORE_DISPOSABLE_LOCAL: 'YES', BACKUP_ENCRYPTION_KEY: encryption, BACKUP_DIAGNOSTIC_FILE: join(privateDir, 'weekly-restore-diagnostic.private.log') };
    await verifyRemote(transport, marker.database, dir);
    const database = join(dir, 'restore.dump.enc'); await transport.get(marker.database.key, database); await restoreLocal(database, targetEnv);
    const comparison = await compareDatabase(targetEnv);
    if (comparison.differences.length) throw new Error(`Datos DB restaurados difieren antes de Storage/Auth: ${comparison.differences.join(',')}`);
    const result = await restoreStorageLocal({ transport, descriptor: marker.storage, prefix: `${roots.storage}${marker.id}/`, dir, key, inventory: postgresInventory(targetEnv, 2), acknowledge: 'DISPOSABLE_LOCAL', url: target.API_URL, apiKey: target.SERVICE_ROLE_KEY, token: target.SERVICE_ROLE_KEY });
    const references = (await runPg('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1'], { env: targetEnv, input: "SELECT json_build_object('bucket','product-images','path',storage_path) FROM public.product_images UNION ALL SELECT json_build_object('bucket','payment-qr','path',qr_storage_path) FROM public.payment_qr_config WHERE qr_storage_path IS NOT NULL;" })).trim().split('\n').filter(Boolean).map(JSON.parse);
    const storageClient = storageHTTP({ url: target.API_URL, apiKey: target.SERVICE_ROLE_KEY, token: target.SERVICE_ROLE_KEY, mode: 'local' });
    for (let index = 0; index < references.length; index++) await storageClient.download(references[index].bucket, references[index].path, join(dir, `reference-${index}`));
    const credentials = JSON.parse(await readFile(join(privateDir, 'admin.credentials.private.json'), 'utf8'));
    const client = createClient(target.API_URL, target.ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const login = await client.auth.signInWithPassword(credentials); if (login.error) throw new Error('Login Auth restaurado falló.'); await client.auth.signOut();
    await writeFile(join(privateDir, 'weekly-storage-restore.private.json'), JSON.stringify({ ...result, databaseTablesMatched: comparison.matched, authLogin: true, restoredProductQRReferences: references.length, externalProvider: false }), { mode: 0o600 });
    console.log(JSON.stringify({ operation, ...result, databaseTablesMatched: comparison.matched, authLogin: true, restoredProductQRReferences: references.length, externalProvider: false }));
  } else if (operation === 'compare-data') console.log(JSON.stringify(await compareDatabase({ ...env, BACKUP_LOCAL_CONTAINER: 'supabase_db_NOVA-LOCAL-TWO-QR-RESTORE' })));
  else throw new Error('Usar capture, restore o compare-data.');
} finally { key.fill(0); await rm(dir, { recursive: true, force: true }); }
