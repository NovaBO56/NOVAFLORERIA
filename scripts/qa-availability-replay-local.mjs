// Fresh Supabase LOCAL SQL replay; never resets the populated working lab.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const final=process.argv[2]==='--dedications-final';
const dedications=final||process.argv[2]==='--dedications';
if(process.argv[2]&&!dedications)throw Error('Unknown LOCAL replay mode');
const project=final?'NOVA-LOCAL-DEDICATIONS-CERTIFIED':dedications?'NOVA-LOCAL-DEDICATIONS-REPLAY':'NOVA-LOCAL-AVAILABILITY-REPLAY';
const container='supabase_db_'+project;
const lab=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria',final?'dedications-certified-replay':dedications?'dedications-clean-replay':'availability-clean-replay');
if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='desarrollo-auditoria')throw Error('Branch mismatch');
if(execFileSync('docker',['info','--format','{{.Name}}'],{encoding:'utf8'}).trim()!=='docker-desktop')throw Error('Requires LOCAL Docker');
if(fs.existsSync(lab))throw Error('Preserve existing replay; choose no reset');
fs.mkdirSync(lab,{recursive:true});
const output=path.join(lab,'availability-replay.private.json');
const report={project,local:true,migrations:[],tests:[]};
const save=()=>fs.writeFileSync(output,JSON.stringify(report,null,2));
const cli=args=>execFileSync('supabase',[...args,'--workdir',lab],{encoding:'utf8',maxBuffer:20*1024*1024});
cli(['init']);
const config=path.join(lab,'supabase/config.toml');
fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace(/^project_id = .*$/m,`project_id = "${project}"`).replaceAll('5432',final?'5762':dedications?'6462':'6362'));
fs.mkdirSync(path.join(lab,'supabase/migrations'),{recursive:true});
for(const name of fs.readdirSync('supabase/migrations').filter(name=>/^\d{14}_[a-z0-9_]+\.sql$/.test(name)).sort()){
 const bytes=fs.readFileSync(path.join('supabase/migrations',name));fs.writeFileSync(path.join(lab,'supabase/migrations',name),bytes);report.migrations.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
}
fs.copyFileSync('supabase/seed.sql',path.join(lab,'supabase/seed.sql'));save();
try{
 const log=cli(['start','--exclude','gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor']);
 fs.writeFileSync(path.join(lab,'start.private.log'),log);report.replay=true;report.seed=true;save();console.log('PASS fresh Supabase LOCAL replay: '+report.migrations.length+' migrations + seed');
 const sql=text=>execFileSync('docker',['exec','-i',container,'psql','-XAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:text,encoding:'utf8',maxBuffer:20*1024*1024});
 for(const name of ['ISOLATED_SECURITY_TESTS.sql','TWO_PAYMENT_QR_TESTS.sql',...(dedications?['DEDICATIONS_TESTS.sql']:[])]){
  const log=sql("SET nova.security_test='isolated';\n"+fs.readFileSync(path.join('supabase/tests',name),'utf8'));
  fs.writeFileSync(path.join(lab,name+'.private.log'),log);report.tests.push({name,pass:true});save();console.log('PASS '+name);
 }
 report.noBusinessData=sql('SELECT (SELECT count(*) FROM products)+(SELECT count(*) FROM orders)+(SELECT count(*) FROM auth.users);').trim()==='0';
 if(!report.noBusinessData)throw Error('Unexpected fixture persistence');
 save();console.log('PASS SQL fixtures rolled back; populated original lab preserved');
}catch(error){report.error=error.message;report.stdout=String(error.stdout??'');report.stderr=String(error.stderr??'');save();throw Error('LOCAL replay failed; inspect private report');}
