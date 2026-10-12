// Catalog equivalence of the dedicated LOCAL source/restore; no business writes.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [privateDir] = process.argv.slice(2);
if (!privateDir || path.resolve(privateDir).startsWith(path.resolve(process.cwd()))) throw Error('Private output outside Git required.');
const sql = (container, text) => JSON.parse(execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', text], { encoding: 'utf8', timeout: 30000, maxBuffer: 10e6 }).trim());
const source = 'supabase_db_NOVA-LOCAL-TWO-QR', target = 'supabase_db_NOVA-LOCAL-TWO-QR-RESTORE';
const queries = {
  columns: "SELECT jsonb_agg(to_jsonb(c) ORDER BY table_name,ordinal_position) FROM information_schema.columns c WHERE table_schema='public'",
  constraints: "SELECT jsonb_agg(jsonb_build_object('table',r.relname,'name',c.conname,'definition',pg_get_constraintdef(c.oid,true)) ORDER BY r.relname,c.conname) FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public'",
  indexes: "SELECT jsonb_agg(jsonb_build_object('table',tablename,'name',indexname,'definition',indexdef) ORDER BY tablename,indexname) FROM pg_indexes WHERE schemaname='public'",
  functions: "SELECT jsonb_agg(jsonb_build_object('name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',(SELECT jsonb_agg(a::text ORDER BY a::text) FROM unnest(coalesce(p.proacl,acldefault('f',p.proowner))) a)) ORDER BY p.proname,pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'",
  policies: "SELECT jsonb_agg(to_jsonb(p) ORDER BY schemaname,tablename,policyname) FROM pg_policies p WHERE schemaname IN ('public','storage')",
  triggers: "SELECT jsonb_agg(jsonb_build_object('table',n.nspname||'.'||r.relname,'name',t.tgname,'definition',pg_get_triggerdef(t.oid,true),'enabled',t.tgenabled) ORDER BY n.nspname,r.relname,t.tgname) FROM pg_trigger t JOIN pg_class r ON r.oid=t.tgrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE NOT t.tgisinternal AND (n.nspname='public' OR t.tgname='on_auth_user_created')",
  rls_grants: "SELECT jsonb_agg(jsonb_build_object('table',r.relname,'rls',r.relrowsecurity,'force',r.relforcerowsecurity,'owner',pg_get_userbyid(r.relowner),'acl',(SELECT jsonb_agg(a::text ORDER BY a::text) FROM unnest(coalesce(r.relacl,CASE WHEN r.relkind='S' THEN acldefault('S',r.relowner) ELSE acldefault('r',r.relowner) END)) a)) ORDER BY r.relname) FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public' AND r.relkind IN ('r','v','S')",
  views: "SELECT jsonb_agg(to_jsonb(v) ORDER BY viewname) FROM pg_views v WHERE schemaname='public'",
  sequences: "SELECT jsonb_agg(to_jsonb(s) ORDER BY sequencename) FROM pg_sequences s WHERE schemaname='public'",
  storage_references: "SELECT jsonb_agg(jsonb_build_object('id',id,'bucket',bucket_id,'name',name) ORDER BY bucket_id,name) FROM storage.objects",
  payment_acl: "SELECT jsonb_build_object('anon',has_function_privilege('anon','public.report_payment_qr(uuid,text,text)','EXECUTE'),'authenticated',has_function_privilege('authenticated','public.report_payment_qr(uuid,text,text)','EXECUTE'),'service',has_function_privilege('service_role','public.report_payment_qr(uuid,text,text)','EXECUTE'))",
};
const report = [];
for (const [name, query] of Object.entries(queries)) {
  const before = sql(source, query), after = sql(target, query);
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  report.push({ name, sourceSha256: hash(before), restoreSha256: hash(after), pass: hash(before) === hash(after) });
}
fs.writeFileSync(path.join(privateDir, 'schema-restore.private.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checks: report.length, passed: report.filter(row => row.pass).length, differences: report.filter(row => !row.pass).map(row => row.name) }));
if (report.some(row => !row.pass)) process.exitCode = 1;
