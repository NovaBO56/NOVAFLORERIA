/** Real RLS scheduling regression, explicit LOCAL catalog demo only; all fixtures ROLLBACK. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const container = 'supabase_db_NOVA-LOCAL-CATALOGO-DEMO';
const localRoot = path.join(process.env.LOCALAPPDATA ?? '', 'NOVA-Floreria', 'catalogo-demo');
if (!process.env.LOCALAPPDATA) throw Error('LOCALAPPDATA is required; this runner targets the Windows local demo only.');
const status = JSON.parse(fs.readFileSync(path.join(localRoot, 'status.private.json'), 'utf8'));
if (status.API_URL !== 'http://127.0.0.1:50621') throw Error('Only the exact local catalog demo API is allowed.');
const supabaseRoot = path.join(localRoot, 'supabase');
const config = fs.readFileSync(path.join(supabaseRoot, 'config.toml'), 'utf8');
if (!/^project_id\s*=\s*"NOVA-LOCAL-CATALOGO-DEMO"\s*$/m.test(config) || fs.existsSync(path.join(supabaseRoot, '.temp', 'project-ref'))) {
  throw Error('Only the unlinked NOVA-LOCAL-CATALOGO-DEMO project is allowed.');
}
const dockerContext = execFileSync('docker', ['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}'], { encoding: 'utf8' }).trim();
const dockerHost = process.env.DOCKER_HOST || JSON.parse(dockerContext);
if (!/^(npipe:\/\/|unix:\/\/|tcp:\/\/(127\.0\.0\.1|localhost)(:|\/|$))/.test(dockerHost)) throw Error('A local Docker endpoint is required.');
const running = execFileSync('docker', ['inspect', '--format', '{{.State.Running}}', container], { encoding: 'utf8' }).trim();
if (running !== 'true') throw Error('The exact local catalog demo database container must be running.');

const runTag = 'qa-order-schedule-rls-' + randomUUID();
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const args = ['exec', '-i', container, 'psql', '-XqAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'];
function sql(source) {
  return execFileSync('docker', args, { input: source, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 }).trim();
}
const snapshotSql = `SELECT jsonb_build_object(
 'orders', (SELECT count(*) FROM public.orders),
 'order_digest', (SELECT md5(coalesce(string_agg(to_jsonb(o)::text,E'\\n' ORDER BY id),'')) FROM public.orders o),
 'order_sequence', (SELECT jsonb_build_object('last_value',last_value,'is_called',is_called) FROM public.order_number_seq),
 'fixture_users', (SELECT count(*) FROM auth.users WHERE email LIKE ${quote(runTag + '%')}),
 'fixture_profiles', (SELECT count(*) FROM public.profiles WHERE id IN(SELECT id FROM auth.users WHERE email LIKE ${quote(runTag + '%')})),
 'fixture_orders', (SELECT count(*) FROM public.orders WHERE idempotency_key LIKE ${quote(runTag + '%')})
);`;
const before = JSON.parse(sql(snapshotSql));
if (before.fixture_users || before.fixture_profiles || before.fixture_orders) throw Error('Unexpected existing fixture identity; preserve it.');
const testPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'tests', 'ORDER_SCHEDULE_RLS_TESTS.sql');
const fixture = fs.readFileSync(testPath, 'utf8');
let testResult;
try {
  const output = sql(`SET nova.security_test='local-order-schedule';\nSET nova.schedule_test_run=${quote(runTag)};\n${fixture}`);
  const resultLine = output.split(/\r?\n/).find(line => line.startsWith('{') && line.includes('"checks"'));
  if (!resultLine) throw Error('The SQL regression did not return a result.');
  testResult = JSON.parse(resultLine);
} catch (error) {
  const diagnostic = String(error.stderr ?? error.message);
  const concise = diagnostic.split(/\r?\n/).filter(line => /ERROR:|FAIL:|DETAIL:|CONTEXT:/.test(line)).slice(0, 6).join('\n');
  throw Error('LOCAL scheduling regression failed; connection closure rolls back all fixture changes.\n' + concise);
} finally {
  const after = JSON.parse(sql(snapshotSql));
  if (after.fixture_users || after.fixture_profiles || after.fixture_orders) throw Error('Fixture cleanup assertion failed. No automatic deletes are performed.');
  if (before.order_digest !== after.order_digest || before.orders !== after.orders) throw Error('Order snapshot changed during QA; inspect concurrent activity. No real orders are restored or modified by this runner.');
  if (JSON.stringify(before.order_sequence) !== JSON.stringify(after.order_sequence)) throw Error('Order number sequence changed during QA; inspect concurrent activity.');
}
console.log(JSON.stringify({ ...testResult, container, cleanup: { users: 0, profiles: 0, orders: 0 }, real_orders_before: before.orders, real_orders_after: before.orders, real_order_data_unchanged: true, order_number_sequence_unchanged: true }, null, 2));
