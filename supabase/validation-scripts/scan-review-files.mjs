// Revisión local: reporta solo nombres/tipos, nunca el valor de credenciales.
import fs from 'node:fs';
import cp from 'node:child_process';
const staged=process.argv.includes('--staged');
const args=staged?['ls-files','-z']:['ls-files','--cached','--others','--exclude-standard','-z'];
const files=cp.execFileSync('git',args).toString().split('\0').filter(Boolean);
const patterns=[['JWT',/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['token',/(?:sb_secret_[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|sk-(?:proj-)?[A-Za-z0-9_-]{25,})/g],['connection-password',/postgres(?:ql)?:\/\/[^\s"']+:[^\s"'@]+@/g]];
const findings=[];let count=0;
for(const f of files){
 if(!staged&&(!fs.existsSync(f)||!fs.statSync(f).isFile()))continue;
 const text=staged?cp.execFileSync('git',['show',':'+f],{maxBuffer:5e7}).toString():fs.readFileSync(f,'utf8');count++;
 if(/(?:^|\/)(?:\.env[^/]*|node_modules|\.temp|backups|private)(?:\/|$)|\.(?:dump|bak|sql\.gz)$/.test(f))findings.push({file:f,type:'private-or-temporary-path'});
 for(const[n,p]of patterns){const matches=[...text.matchAll(p)];if(matches.length)findings.push({file:f,type:n,count:matches.length});}
}
console.log(JSON.stringify({filesScanned:count,findings},null,2));if(findings.length)process.exitCode=1;
