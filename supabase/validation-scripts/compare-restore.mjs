import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),root=process.cwd();
const query=`SELECT json_build_object(
 'tables',(SELECT json_agg(x ORDER BY x.table_schema,x.table_name) FROM (SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema IN ('public','auth','storage') AND table_type='BASE TABLE')x),
 'data',(SELECT json_agg(x ORDER BY x.schemaname,x.tablename) FROM (SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN ('public','auth','storage'))x),
 'columns',(SELECT json_agg(x ORDER BY x.table_schema,x.table_name,x.ordinal_position) FROM (SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema IN ('public','auth','storage'))x),
 'constraints',(SELECT json_agg(x ORDER BY x.rel,x.name) FROM (SELECT conrelid::regclass::text rel,conname name,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE connamespace IN ('public'::regnamespace,'auth'::regnamespace,'storage'::regnamespace))x),
 'functions',(SELECT json_agg(x ORDER BY x.schema,x.signature) FROM (SELECT n.nspname schema,p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proacl::text grants FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','auth','storage') AND p.prokind='f')x),
 'policies',(SELECT json_agg(x ORDER BY x.schemaname,x.tablename,x.policyname) FROM (SELECT * FROM pg_policies WHERE schemaname IN ('public','auth','storage'))x),
 'indexes',(SELECT json_agg(x ORDER BY x.schemaname,x.indexname) FROM (SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname IN ('public','auth','storage'))x),
 'triggers',(SELECT json_agg(x ORDER BY x.rel,x.name) FROM (SELECT tgrelid::regclass::text rel,tgname name,pg_get_triggerdef(oid) definition FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace IN ('public'::regnamespace,'auth'::regnamespace,'storage'::regnamespace)))x),
 'rlsgrants',(SELECT json_agg(x ORDER BY x.schema,x.name) FROM (SELECT n.nspname schema,c.relname name,c.relrowsecurity rls,c.relforcerowsecurity forced,c.relacl::text grants FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','auth','storage') AND c.relkind IN ('r','v','S'))x),
 'sequences',(SELECT json_agg(x ORDER BY x.schemaname,x.sequencename) FROM (SELECT schemaname,sequencename,sequenceowner,data_type,start_value,min_value,max_value,increment_by,cycle,last_value FROM pg_sequences WHERE schemaname IN ('public','auth','storage'))x),
 'defaultgrants',(SELECT json_agg(x ORDER BY x.owner,x.schema,x.kind) FROM (SELECT defaclrole::regrole::text owner,defaclnamespace::regnamespace::text schema,defaclobjtype kind,defaclacl::text grants FROM pg_default_acl)x)
)`;
async function sql(container,s){return (await run('docker',['exec',container,'psql','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',s],{maxBuffer:20e6})).stdout.trim();}
const states=[];
for(const name of ['NOVA-LOCAL-VALIDATION','NOVA-LOCAL-RESTORE']){
 const c='supabase_db_'+name;
 const catalog=JSON.parse(await sql(c,query));const tables=catalog.data;delete catalog.data;
 const data=[];for(const t of tables){const rel='"'+t.schemaname+'"."'+t.tablename+'"';data.push(JSON.parse(await sql(c,`SELECT json_build_object('schema','${t.schemaname}','table','${t.tablename}','count',count(*),'digest',md5(coalesce(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),''))) FROM ${rel} t`)));}
 const state={catalog,data};states.push(state);fs.writeFileSync(root+'/certification/RESTORE_'+name+'.json',JSON.stringify(state,null,2));
}
const equal=JSON.stringify(states[0])===JSON.stringify(states[1]);const differences=[];for(const k of Object.keys(states[0].catalog)){if(JSON.stringify(states[0].catalog[k])!==JSON.stringify(states[1].catalog[k]))differences.push(k);}for(let i=0;i<states[0].data.length;i++){if(JSON.stringify(states[0].data[i])!==JSON.stringify(states[1].data[i]))differences.push('data:'+states[0].data[i].schema+'.'+states[0].data[i].table);}
fs.writeFileSync(root+'/certification/BACKUP_RESTORE.json',JSON.stringify({equal,differences,tableCount:states[0].data.length,syntheticAuthUsers:states[0].data.find(x=>x.schema==='auth'&&x.table==='users')?.count,storage:states[0].data.filter(x=>x.schema==='storage'),catalogSections:Object.keys(states[0].catalog)},null,2));console.log({equal,differences,tableCount:states[0].data.length});
