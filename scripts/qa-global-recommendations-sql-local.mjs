// Real PostgreSQL concurrency, only this task's disposable LOCAL replay.
// Leaves one explicitly synthetic admin/product in that replay; never deletes data.
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
const container = 'supabase_db_ANABELLE-PRODUCTS-REPLAY-V3';
const actor = 'fb240001-0000-4000-8000-000000000001';
const product = 'fb240001-0000-4000-8000-000000000002';
const args = ['exec', '-i', container, 'psql', '-XqAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'];
const sql = text => execFileSync('docker', [...args, '-c', text], { encoding: 'utf8' }).trim();
if (sql(`SELECT count(*) FROM auth.users WHERE id='${actor}'`) !== '0') throw Error('Existing concurrency fixture: preserve it, do not rerun automatically.');
sql(`BEGIN; INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES('${actor}','concurrency-global-qa@example.invalid','{"full_name":"TEST GLOBAL CONCURRENCY"}'); INSERT INTO profiles(id,full_name,role,is_active) VALUES('${actor}','TEST GLOBAL CONCURRENCY','administrador',true) ON CONFLICT(id) DO UPDATE SET role='administrador',is_active=true; INSERT INTO products(id,name,price,is_active,is_available) VALUES('${product}','TEST GLOBAL CONCURRENCY DRAFT',1,false,false); COMMIT;`);
async function race(name, statements) {
  const results = await Promise.all(statements.map(async (statement, index) => {
    const started = Date.now();
    try { await execute('docker', [...args, '-c', `BEGIN; ${statement}; SELECT pg_sleep(0.5); COMMIT;`], { encoding: 'utf8' }); return { session: index + 1, committed: true, ms: Date.now() - started }; }
    catch (error) {
      if (!String(error.stderr).includes('Configuration changed')) throw error;
      return { session: index + 1, committed: false, conflict: true, ms: Date.now() - started };
    }
  }));
  if (results.filter(result => result.committed).length !== 1 || results.filter(result => result.conflict).length !== 1) throw Error('Unexpected race result '+name);
  console.log(JSON.stringify({ name, results }));
}
const globalRevision = Number(sql("SELECT revision FROM product_recommendation_settings WHERE key='global'"));
await race('global optimistic revision / serialized lock', [false, false].map(enabled => `SELECT save_global_product_recommendations(${enabled},'all','{}','{}','{}','{}',${globalRevision},'${actor}')`));
if (Number(sql("SELECT revision FROM product_recommendation_settings WHERE key='global'")) !== globalRevision + 1) throw Error('Global lost update');
await race('individual mode optimistic revision / serialized lock', ['off','global'].map(mode => `SELECT save_product_recommendation_preferences('${product}','${mode}',NULL,0,'${actor}')`));
if (sql(`SELECT revision FROM product_recommendation_preferences WHERE product_id='${product}'`) !== '1') throw Error('Individual lost update');
console.log(JSON.stringify({ pass: true, container, syntheticRecordsRetained: { authUserAndProfile: actor, inactiveProduct: product }, globalEnabled: false, recommendationIds: [] }));
