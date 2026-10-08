import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('audit-supabase/remote-catalog.json','utf8').replace(/^\uFEFF/,''));
const tables=r.tables.filter(t=>t.schema==='public'&&['r','p'].includes(t.kind)).sort((a,b)=>a.name.localeCompare(b.name));
const rows=tables.map(t=>`select '${t.name.replaceAll("'","''")}'::text as table_name, count(*) as rows from public."${t.name.replaceAll('"','""')}"`);
const sql=`-- Solo conteos agregados; no exporta filas ni datos personales.\nselect jsonb_build_object('public_table_counts',(select jsonb_agg(to_jsonb(c)) from (${rows.join('\nunion all\n')}) c),'auth_user_count',(select count(*) from auth.users)) as data_categories;\n`;
fs.writeFileSync('audit-supabase/data-counts-readonly.sql',sql);
