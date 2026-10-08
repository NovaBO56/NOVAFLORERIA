import fs from 'node:fs';
import {splitSql,tokens,head,functionParts} from './analyze.mjs';
const root='audit-supabase';
const remote=JSON.parse(fs.readFileSync(`${root}/remote-catalog.json`,'utf8').replace(/^\uFEFF/,''));
const audit=JSON.parse(fs.readFileSync(`${root}/migration-analysis.json`,'utf8'));
const master=splitSql(fs.readFileSync('MASTER_DATABASE_FLORERIA.sql','utf8')).map(head);
const name=s=>s.replaceAll('"','').replace(/^public\./,'');
const type=s=>s.toLowerCase().replace(/\b(integer|int)\b/g,'int4').replace(/\bboolean\b/g,'bool').replace(/\bbigint\b/g,'int8').replace(/\bsmallint\b/g,'int2').replace(/\btimestamp with time zone\b/g,'timestamptz').replace(/\btime without time zone\b/g,'time').replace(/\bcharacter varying\b/g,'varchar').replace(/\s+/g,'').trim();
function field(clause,file){
  const c=head(clause), m=c.match(/^("[^"]+"|\w+)\s+([\s\S]+)$/); if(!m||/^(constraint|primary|foreign|unique|check|exclude)$/i.test(m[1]))return null;
  const typeText=m[2].split(/\s+(?:not\s+null|null|default|primary\s+key|references|check|unique|constraint|generated|collate)\b/i)[0];
  return {name:name(m[1]),type:typeText,not_null:/\bnot\s+null\b|\bprimary\s+key\b/i.test(m[2]),source:file,clause:c};
}
function expr(expression) {return tokens(expression??'').join(' ').replace(/\s*:\s*:\s*(?:regclass|text|numeric|integer|bigint|uuid|boolean|time\s+without\s+time\s+zone|timestamp\s+with\s+time\s+zone)(?:\s*\[\s*\])?/gi,'').replace(/\bpublic\s*\.\s*/g,'').replace(/'public\.order_number_seq'/g,"'order_number_seq'").replace(/[();]/g,'').replace(/\s+/g,' ').trim();}
function defaultValue(clause){const match=clause.match(/\bdefault\s+([\s\S]*)/i);return match?match[1].split(/\s+(?:not\s+null|references|check|unique|primary\s+key|constraint|generated)\b/i)[0].trim():null;}
const cols=new Map();
for(const row of audit.inventory){
  for(const s of row.statements){let m;
    if((m=s.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)\s*\(([\s\S]*)\)\s*$/i))){const table=name(m[1]); if(!cols.has(table)) cols.set(table,new Map(splitSql(m[2],',').map(c=>field(c,row.file)).filter(Boolean).map(c=>[c.name,c])));}
    if((m=s.match(/^drop\s+table\s+(?:if\s+exists\s+)?([\w."]+)/i)))cols.delete(name(m[1]));
    if((m=s.match(/^alter\s+table\s+([\w."]+)\s+([\s\S]+)$/i))){const table=name(m[1]); if(!cols.has(table))continue; const map=cols.get(table);
      for(const clause of splitSql(m[2],',')){let c;
        if((c=head(clause).match(/^add\s+column\s+(?:if\s+not\s+exists\s+)?([\s\S]+)/i))){const f=field(c[1],row.file);if(f&&!map.has(f.name))map.set(f.name,f);}
        if((c=head(clause).match(/^drop\s+column\s+(?:if\s+exists\s+)?([\w"]+)/i)))map.delete(name(c[1]));
        if((c=head(clause).match(/^alter\s+column\s+([\w"]+)\s+(set|drop)\s+not\s+null/i))){const f=map.get(name(c[1])); if(f)f.not_null=c[2].toLowerCase()==='set';}
      }
    }
  }
}
const columnComparisons=[];
for(const [table,map]of cols){const actual=remote.columns.filter(c=>c.schema==='public'&&c.table===table);
  for(const [column,expected]of map){const found=actual.find(c=>c.name===column);const def=defaultValue(expected.clause);columnComparisons.push({table,column,source:expected.source,expected_type:expected.type,actual_type:found?.type??null,type_matches:found?type(expected.type)===type(found.type):false,expected_not_null:expected.not_null,actual_not_null:found?.not_null??null,present:Boolean(found),expected_clause:expected.clause,expected_default:def,actual_default:found?.default??null,default_matches:expr(def)===expr(found?.default)});}
  for(const c of actual)if(!map.has(c.name))columnComparisons.push({table,column:c.name,remote_only:true,actual_type:c.type});
}
const masterFunctionMatches=[];
for(const f of audit.functionComparison.filter(f=>!f.final_source)){const matches=master.map(functionParts).filter(Boolean).filter(local=>local.key===f.key);masterFunctionMatches.push({key:f.key,master_declares:matches.length>0,body_matches:matches.some(local=>tokens(local.body??'').join(' ')===tokens(f.remote_definition?.match(/\bas\s+(\$\w*\$)([\s\S]*?)\1/i)?.[2]??'').join(' '))});}
const triggerComparisons=audit.localProjection.trigger.map(t=>({key:t.key,source:t.file,history:t.history,present:remote.triggers.some(r=>r.schema==='public'&&r.table===t.table&&r.name===t.name),expected_statement:t.statement,actual:remote.triggers.find(r=>r.schema==='public'&&r.table===t.table&&r.name===t.name)}));
const indexComparisons=audit.localProjection.index.map(i=>({key:i.key,table:i.table,source:i.file,present:remote.indexes.some(r=>r.schemaname==='public'&&r.indexname===i.key),expected_statement:i.statement,actual:remote.indexes.find(r=>r.schemaname==='public'&&r.indexname===i.key)}));
const remoteOnlyTriggers=remote.triggers.filter(r=>r.schema==='public'&&!triggerComparisons.some(t=>t.key===`${r.table}:${r.name}`));
function policyExpr(s,keyword){const m=s.match(new RegExp(`\\b${keyword}\\s*\\(`,'i'));if(!m)return null;let depth=1,start=m.index+m[0].length;for(let i=start;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')'&&--depth===0)return s.slice(start,i);}return null;}
const policySemantics=audit.policyComparison.map(p=>{const using=policyExpr(p.expected_statement,'using'),check=policyExpr(p.expected_statement,'with\\s+check');const rolesMatch=p.expected_statement.match(/\bto\s+([\s\S]+?)(?=\busing\b|\bwith\s+check\b|$)/i);const roles=rolesMatch?rolesMatch[1].trim().split(/\s*,\s*/).map(name).sort():['public'];const cmd=(p.expected_statement.match(/\bfor\s+(all|select|insert|update|delete)/i)?.[1]??'all').toUpperCase();return {key:p.key,source:p.final_source,present_remote:p.present_remote,using_matches:expr(using)===expr(p.actual?.qual),check_matches:expr(check)===expr(p.actual?.with_check),roles_match:JSON.stringify(roles)===JSON.stringify(p.actual?.roles?.toSorted()),command_match:cmd===p.actual?.cmd,using_expected:using,check_expected:check,actual:p.actual};});
const results={columnComparisons,masterFunctionMatches,triggerComparisons,indexComparisons,remoteOnlyTriggers,policySemantics,views:audit.localProjection.view.map(v=>({key:v.key,source:v.file,expected_statement:v.statement,actual:remote.views.find(r=>r.schema==='public'&&r.name===v.key)}))};
fs.writeFileSync(`${root}/object-comparison.json`,JSON.stringify(results,null,2));
console.log('COLUMN DIFFERENCES',JSON.stringify(columnComparisons.filter(c=>c.remote_only||!c.type_matches||c.expected_not_null!==c.actual_not_null),null,2));
console.log('MASTER HELPERS',JSON.stringify(masterFunctionMatches,null,2));
console.log('MISSING INDEXES',JSON.stringify(indexComparisons.filter(i=>!i.present).map(i=>i.key)));
console.log('MISSING TRIGGERS',JSON.stringify(triggerComparisons.filter(t=>!t.present).map(t=>t.key)));
console.log('EXTRA TRIGGERS',JSON.stringify(remoteOnlyTriggers,null,2));
console.log('DEFAULT DIFFERENCES',JSON.stringify(columnComparisons.filter(c=>!c.remote_only&&!c.default_matches).map(c=>({table:c.table,column:c.column,local:c.expected_default,remote:c.actual_default})),null,2));
console.log('POLICY DIFFERENCES',JSON.stringify(policySemantics.filter(p=>!p.using_matches||!p.check_matches||!p.roles_match||!p.command_match),null,2));
