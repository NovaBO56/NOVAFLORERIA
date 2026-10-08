import fs from 'node:fs';
const root=process.cwd(),a=JSON.parse(fs.readFileSync(root+'/certification/RESTORE_NOVA-LOCAL-VALIDATION.json')),b=JSON.parse(fs.readFileSync(root+'/certification/RESTORE_NOVA-LOCAL-RESTORE.json'));
const diff=[];for(const k of ['columns','functions','rlsgrants']){for(let i=0;i<a.catalog[k].length;i++){if(JSON.stringify(a.catalog[k][i])!==JSON.stringify(b.catalog[k][i]))diff.push({section:k,source:a.catalog[k][i],restored:b.catalog[k][i]});}}
fs.writeFileSync(root+'/certification/RESTORE_DIFFERENCES.json',JSON.stringify(diff,null,2));console.log(JSON.stringify(diff.slice(0,5),null,2));
