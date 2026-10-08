import fs from 'node:fs';
import crypto from 'node:crypto';
const [oldFile, newFile, output] = process.argv.slice(2);
const old = fs.readFileSync(oldFile, 'utf8');
const next = fs.readFileSync(newFile, 'utf8');
const legacy = /-- create_payment: catálogo auditado\r?\nCREATE OR REPLACE FUNCTION public\.create_payment\(p_order_id uuid\)[\s\S]*?\$function\$;\r?\n\r?\n/;
if (!legacy.test(old)) throw Error('No se encontró exactamente la definición histórica esperada');
const expected = old.replace(legacy, '')
  .replace(/ALTER FUNCTION public\."create_payment"\(uuid\) OWNER TO postgres;\r?\nREVOKE ALL ON FUNCTION public\."create_payment"\(uuid\) FROM PUBLIC, anon, authenticated, service_role;\r?\n\r?\n/, '')
  .replace("OR to_regprocedure('public.track_order_details(text,bigint,uuid)') IS NOT NULL THEN", "OR to_regprocedure('public.track_order_details(text,bigint,uuid)') IS NOT NULL\n     OR to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN");
const normalize = s => s.replace(/\r\n/g, '\n');
const report = { equivalentExceptApprovedRetirement: normalize(expected) === normalize(next), oldSha256: crypto.createHash('sha256').update(old).digest('hex'), newSha256: crypto.createHash('sha256').update(next).digest('hex'), changes: ['Eliminar definición UUID única', 'Eliminar OWNER/REVOKE de firma ausente', 'Añadir comprobación defensiva de ausencia'], normalization: 'Solo CRLF/LF' };
if(output) fs.writeFileSync(output, JSON.stringify(report,null,2));
console.log(report);
if (!report.equivalentExceptApprovedRetirement) process.exitCode = 1;
