import fs from 'node:fs';
import path from 'node:path';
const out = 'audit-supabase';
const remote = JSON.parse(fs.readFileSync(`${out}/remote-catalog.json`, 'utf8').replace(/^\uFEFF/, ''));
// Split SQL statements without executing them; dollar bodies, strings and comments stay opaque.
export function splitSql(sql, separator = ';') {
  const parts = []; let start = 0, quote = '', dollar = '', block = 0, line = false, depth = 0;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i], next = sql[i + 1];
    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '/' && next === '*') { block++; i++; } else if (c === '*' && next === '/') { block--; i++; } continue; }
    if (dollar) { if (sql.startsWith(dollar, i)) { i += dollar.length - 1; dollar = ''; } continue; }
    if (quote) { if (c === quote) { if (next === quote) i++; else quote = ''; } continue; }
    if (c === '-' && next === '-') { line = true; i++; continue; }
    if (c === '/' && next === '*') { block = 1; i++; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === '$') { const m = sql.slice(i).match(/^\$[a-zA-Z_0-9]*\$/); if (m) { dollar = m[0]; i += dollar.length - 1; continue; } }
    if (c === '(') depth++; if (c === ')') depth--;
    if (c === separator && depth === 0) { parts.push(sql.slice(start, i).trim()); start = i + 1; }
  }
  if (sql.slice(start).trim()) parts.push(sql.slice(start).trim());
  return parts;
}
export function tokens(sql) {
  return (sql.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|[a-zA-Z_][a-zA-Z_0-9$]*|\d+(?:\.\d+)?|[^\s]/g) ?? []).filter(t => !t.startsWith('--') && !t.startsWith('/*')).map(t => /^[a-zA-Z_]/.test(t) ? t.toLowerCase() : t);
}
export function head(statement) { return statement.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '').trim(); }
function body(statement) { const m = statement.match(/\bas\s+(\$\w*\$)([\s\S]*?)\1/i); return m?.[2] ?? null; }
const cleanName = name => name.replaceAll('"', '').replace(/^public\./, '');
const typeName = str => str.toLowerCase().replace(/\bpublic\./g, '').replace(/\bcharacter varying\b/g, 'varchar').replace(/\bboolean\b/g, 'bool').replace(/\b(?:integer|int)\b/g, 'int4').replace(/\bbigint\b/g, 'int8').replace(/\bsmallint\b/g, 'int2').replace(/\btimestamp with time zone\b/g, 'timestamptz').replace(/\s+/g, ' ').trim();
export function functionParts(s) {
  const m = s.match(/^create\s+(?:or\s+replace\s+)?function\s+([\w."]+)\s*\(([\s\S]*?)\)\s*returns\b/i);
  if (!m) return null;
  const args = splitSql(m[2], ',');
  const types = args.map(arg => { const noDefault = arg.split(/\s+default\s+|\s*=\s*/i)[0].trim(); return typeName(noDefault.replace(/^(?:in\s+|inout\s+)?\w+\s+/, '')); });
  const name = cleanName(m[1]); return { name, types, key: `${name}(${types.join(',')})`, body: body(s), statement: s };
}
function remoteKey(f) {
  return `${f.name}(${splitSql(f.identity, ',').map(arg => typeName(arg.replace(/^(?:IN\s+|INOUT\s+)?\w+\s+/i, ''))).join(',')})`;
}
const files = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
const versions = new Map(); for (const f of files) { const v = f.match(/^\d+/)[0]; versions.set(v, [...(versions.get(v) ?? []), f]); }
const maps = { function: new Map(), policy: new Map(), table: new Map(), index: new Map(), trigger: new Map(), sequence: new Map(), view: new Map() };
const operations = []; const inventory = [];
function remember(kind, key, statement, file, extra = {}) { const existing = maps[kind].get(key); maps[kind].set(key, { key, statement, file, history: [...(existing?.history ?? []), file], ...extra }); operations.push({ kind, key, file, action: 'create' }); }
for (const file of files) {
  const sql = fs.readFileSync(path.join('supabase/migrations', file), 'utf8');
  const statements = splitSql(sql).map(head).filter(s => s && tokens(s).length);
  const funcs = [], ddl = [], topDml = [], objects = new Set();
  for (const s of statements) {
    const fn = functionParts(s);
    if (fn) { remember('function', fn.key, s, file, fn); funcs.push(fn.key); objects.add(fn.name); }
    let m;
    if ((m = s.match(/^drop\s+function\s+(?:if\s+exists\s+)?([\w."]+)\s*\(([^)]*)\)/i))) { const key = `${cleanName(m[1])}(${splitSql(m[2], ',').map(typeName).join(',')})`; maps.function.delete(key); operations.push({ kind: 'function', key, file, action: 'remove-in-source' }); objects.add(cleanName(m[1])); }
    if ((m = s.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)\s*\(([\s\S]*)\)\s*$/i))) { remember('table', cleanName(m[1]), s, file, { clauses: splitSql(m[2], ',') }); objects.add(cleanName(m[1])); }
    if ((m = s.match(/^drop\s+table\s+(?:if\s+exists\s+)?([\w."]+)/i))) { const name=cleanName(m[1]); maps.table.delete(name); for (const [key,p] of maps.policy) if(p.table===name) maps.policy.delete(key); for (const [key,idx] of maps.index) if(idx.table===name) maps.index.delete(key); operations.push({kind:'table', key:name, file, action:'remove-in-source'}); objects.add(name); }
    if ((m = s.match(/^create\s+(?:or\s+replace\s+)?view\s+([\w."]+)\s+as\s+([\s\S]*)$/i))) { remember('view',cleanName(m[1]),s,file,{body:m[2]}); objects.add(cleanName(m[1])); }
    if ((m = s.match(/^create\s+policy\s+("[^"]+"|\w+)\s+on\s+([\w."]+)/i))) { const table = cleanName(m[2]); const name = cleanName(m[1]); remember('policy', `${table}:${name}`, s, file, { table, name }); objects.add(table); }
    if ((m = s.match(/^drop\s+policy\s+(?:if\s+exists\s+)?("[^"]+"|\w+)\s+on\s+([\w."]+)/i))) { const key = `${cleanName(m[2])}:${cleanName(m[1])}`; maps.policy.delete(key); operations.push({ kind:'policy', key, file, action:'remove-in-source' }); objects.add(cleanName(m[2])); }
    if ((m = s.match(/^create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([\w."]+)\s+on\s+([\w."]+)/i))) { remember('index', cleanName(m[1]), s, file, { table: cleanName(m[2]) }); objects.add(cleanName(m[2])); }
    if ((m = s.match(/^create\s+trigger\s+([\w"]+)[\s\S]*?\bon\s+([\w."]+)/i))) { const table = cleanName(m[2]), name = cleanName(m[1]); remember('trigger', `${table}:${name}`, s, file, { table, name }); objects.add(table); }
    if ((m = s.match(/^create\s+sequence\s+(?:if\s+not\s+exists\s+)?([\w."]+)/i))) { remember('sequence', cleanName(m[1]), s, file); objects.add(cleanName(m[1])); }
    if ((m = s.match(/^alter\s+table\s+([\w."]+)/i))) { objects.add(cleanName(m[1])); operations.push({ kind:'alter-table', key:cleanName(m[1]), file, statement:s }); }
    if (/^(?:create|alter|drop|grant|revoke)\b/i.test(s)) ddl.push(s.split(/\s+/).slice(0, 8).join(' '));
    if (/^(?:insert|update|delete)\b/i.test(s)) topDml.push(s);
  }
  inventory.push({ file, version: file.match(/^\d+/)[0], valid_name:/^\d+_.+\.sql$/.test(file), bytes:Buffer.byteLength(sql), empty: statements.length===0, duplicate:versions.get(file.match(/^\d+/)[0]).length>1, recorded: remote.migration_history.some(h=>h.version===file.match(/^\d+/)[0]), purpose: file.replace(/^\d+[_ ]*/, '').replace(/\.sql$/, '').replaceAll('_',' '), statement_count: statements.length, objects:[...objects], functions:funcs, ddl:ddl.length>0, top_level_dml: topDml, contains_dml: /\b(?:insert\s+into|update\s+public\.|delete\s+from)\b/i.test(tokens(sql).join(' ')), rls:/\bpolicy\b|row\s+level\s+security/i.test(tokens(sql).join(' ')), storage:/\bstorage\./i.test(sql), security_definer: /security\s+definer/i.test(tokens(sql).join(' ')), statements });
}
const publicRemote = remote.functions.filter(f=>f.schema==='public');
const functionComparison = [];
for (const f of publicRemote) {
  const key = remoteKey(f), expected = maps.function.get(key);
  const normalized = tokens(body(f.definition) ?? '').join(' ');
  const candidates = inventory.flatMap(row=> row.statements.map(functionParts).filter(Boolean).filter(local=> local.key===key && tokens(local.body??'').join(' ')===normalized).map(local=>({ file:row.file, signature:local.key })));
  functionComparison.push({ key, remote_name:f.name, final_source:expected?.file??null, exact_body_match: expected ? tokens(expected.body??'').join(' ')===normalized : null, matching_versions:candidates.map(c=>c.file), security_definer:f.security_definer, config:f.config, acl:f.acl, local_history: inventory.filter(row=>row.functions.includes(key)).map(row=>row.file), expected_statement:expected?.statement??null, remote_definition:f.definition });
}
for (const [key, f] of maps.function) if (!publicRemote.some(remoteFn=>remoteKey(remoteFn)===key)) functionComparison.push({ key, final_source:f.file, missing_remote:true, local_history:f.history });
const policyComparison = [];
for (const [key, p] of maps.policy) {
  const schema = p.table.includes('.') ? p.table.split('.')[0] : 'public'; const table=p.table.split('.').at(-1);
  const actual=remote.policies.find(r=>r.schemaname===schema && r.tablename===table && r.policyname===p.name);
  policyComparison.push({key,final_source:p.file,present_remote:Boolean(actual),expected_statement:p.statement,actual});
}
const remoteOnlyPolicies=remote.policies.filter(r=>['public','storage'].includes(r.schemaname) && !maps.policy.has(`${r.schemaname==='public'?'':r.schemaname+'.'}${r.tablename}:${r.policyname}`));
const tableComparison=[...maps.table].map(([name,t])=>({ name,final_source:t.file,present_remote:remote.tables.some(r=>r.schema==='public'&&r.name===name), clauses:t.clauses,alterations:operations.filter(op=>op.kind==='alter-table'&&op.key===name)}));
const remoteOnlyTables=remote.tables.filter(r=>r.schema==='public'&&['r','p'].includes(r.kind)&&!maps.table.has(r.name));
const localProjection=Object.fromEntries(Object.entries(maps).map(([kind,map])=>[kind,[...map.values()]]));
const analysis={inventory,functionComparison,policyComparison,remoteOnlyPolicies,tableComparison,remoteOnlyTables,operations,localProjection,duplicate_versions:Object.fromEntries([...versions].filter(([,v])=>v.length>1)),summary:{local_files:files.length,public_tables:remote.tables.filter(r=>r.schema==='public').length,public_functions:publicRemote.length,exact_functions:functionComparison.filter(f=>f.exact_body_match===true).length,different_functions:functionComparison.filter(f=>f.exact_body_match===false).length,missing_remote_functions:functionComparison.filter(f=>f.missing_remote).map(f=>f.key),remote_only_functions:functionComparison.filter(f=>f.final_source===null).map(f=>f.key)}};
fs.writeFileSync(`${out}/migration-analysis.json`,JSON.stringify(analysis,null,2));
console.log(JSON.stringify(analysis.summary,null,2));
console.log('DIVERGENT FUNCTIONS',JSON.stringify(functionComparison.filter(f=>f.exact_body_match===false).map(f=>({key:f.key,source:f.final_source,matching:f.matching_versions})),null,2));
console.log('REMOTE ONLY TABLES',JSON.stringify(remoteOnlyTables.map(t=>t.name)));
console.log('TOP LEVEL DML',JSON.stringify(inventory.filter(r=>r.top_level_dml.length).map(r=>({file:r.file,statements:r.top_level_dml})),null,2));
