import fs from 'node:fs';
import crypto from 'node:crypto';
const repo='C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria';
const lab='C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION';
const source=repo+'/supabase/baseline-candidate/', out=lab+'/certification/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['RESULTS_037.json','EXTENDED_037.json','FREE_HTTP_SECURITY_037.json','FINAL_EDGE_037.json'];
const reports=files.map(n=>({file:n,...read(out+n)}));
const sections={};const failures=[];
for(const name of ['http','jwt','concurrency','promotions']){
 const cases=reports.flatMap(r=>(r[name]||[]).map(t=>({...t,source:r.file})));
 sections[name]={cases:cases.length,failed:cases.filter(t=>!t.passed).length};failures.push(...cases.filter(t=>!t.passed));
}
const errors=reports.flatMap(r=>(r.errors||[]).map(e=>({source:r.file,...e})));
const original=read(repo+'/audit-supabase/migration-hashes.json');
const changed=original.filter(f=>sha(repo+'/supabase/migrations/'+f.file)!==f.sha256);
const final=read(out+'PAYMENT_RETIREMENT_FINAL_TESTS.json');const delta=read(out+'FINAL_DELTA_VERIFIED.json');
const comparison=read(out+'PAYMENT_GENERATION_COMPARISON.json');
const tests=fs.readFileSync(out+'PAYMENT_RETIREMENT_TEST.log','utf8');
if(!tests.includes('288 passed')||failures.length||errors.length||changed.length||!final.passed||!delta.schemaEquivalent||!comparison.equivalentExceptApprovedRetirement)throw Error('No emitir certificación: controles incompletos');
const layout=[
 ['20261007000100_baseline_initial.sql','BASELINE_CANDIDATE.sql',source+'BASELINE_CANDIDATE.sql'],
 ['20261007000200_checkout_public_summary.sql','035_checkout_public_summary.sql',repo+'/supabase/migrations/035_checkout_public_summary.sql'],
 ['20261007000300_security_rpc_hardening.sql','036_security_rpc_hardening.sql',source+'036_security_rpc_hardening.sql'],
 ['20261007000400_backend_concurrency_zero_total.sql','037_backend_concurrency_zero_total.sql',source+'037_backend_concurrency_zero_total.sql']
].map(([destination,origin,path])=>({destination,origin,sha256:sha(path)}));
const summary={date:new Date().toISOString(),target:{lab,API:'http://127.0.0.1:55421',database:'127.0.0.1:55422/postgres',deltaDatabase:'nova_delta_037',remoteLinked:false},retirement:{oldAbsent:true,newPresent:true,dependencies:read(out+'PAYMENT_DELTA_BEFORE.json'),acl:final.acl},replay:{baseline:0,seeds:0,migration035:0,migration036:0,migration037:0,isolatedSQL:0},regression:sections,failures,errors,quality:{test:{exit:0,files:26,cases:288},lint:{exit:0,warnings:5,errors:0},typecheck:{exit:0},build:{exit:0}},schemaEquivalence:{...delta,additional:final.equivalence},generator:comparison,hardeningGenerator:read(out+'PAYMENT_HARDENING_GENERATION_COMPARISON.json'),originalMigrations:{count:original.length,changed:changed.map(f=>f.file)},layout,certifiedLocally:true,reorganizationReadyForApproval:true,activated:false,productionTouched:false};
fs.writeFileSync(out+'PAYMENT_RETIREMENT_SUMMARY.json',JSON.stringify(summary,null,2));
const matrix=Object.entries(sections).map(([n,r])=>`| ${n} | ${r.cases} | ${r.failed} |`).join('\n');
const report=`# Certificación local final: retirada de create_payment(uuid)

Resultado: CERTIFICADO LOCALMENTE para el alcance y las versiones probadas. Reorganización técnicamente lista para aprobación; NO ACTIVADA. No se tocó producción, ningún vínculo remoto ni las 39 migraciones originales.

## Destinos y trazabilidad

Laboratorio: ${lab}. API 127.0.0.1:55421; PostgreSQL 127.0.0.1:55422/postgres. No existe supabase/.temp/project-ref. Delta: nova_delta_037 en el mismo contenedor local supabase_db_NOVA-LOCAL-VALIDATION. Se restauró nova-validation.dump, exclusivamente sintético, previo a 037 y con firma antigua presente. Ningún dato real.

La definición antigua entraba desde remote-catalog.json mediante generate-candidate.mjs (selección de funciones públicas); estaba en la baseline anterior, línea 1011, con OWNER/REVOKE en 5210–5211. Se excluye ahora por nombre/arity=1; los metadatos de la firma nueva siguen viniendo del catálogo original, no de la lista filtrada. La regeneración temporal fue comparada antes de reemplazar el artefacto: solo retirada de definición, retirada de ACL antigua y guardia de ausencia. Ver PAYMENT_GENERATION_COMPARISON.json. build-hardening.mjs también fue actualizado; su salida temporal 036 coincide byte por byte con la candidata certificada (PAYMENT_HARDENING_GENERATION_COMPARISON.json). Baseline: 35 tablas, 36 funciones; con 035 quedan 37 funciones públicas.

## Dependencias y retirada

src/app/api/orders/[id]/payment/route.ts y checkout-api.test.ts usan p_order_id y p_customer_phone. No consumidor de un argumento en src; se actualizaron las comprobaciones estáticas y SQL para exigir ausencia, sin depender de que exista el RPC viejo. pg_depend, pg_trigger y cuerpos de otras funciones en el snapshot delta no registraron dependencias/llamadas. Ver PAYMENT_DELTA_BEFORE.json. Las funciones finales no llaman al contrato antiguo.

036 usa IF to_regprocedure('public.create_payment(uuid)') IS NOT NULL, REVOKE dinámico y DROP FUNCTION public.create_payment(uuid) RESTRICT. No CASCADE ni captura de errores de dependencia. Su BEGIN/COMMIT aborta ante un fallo; no hubo dependencia que bloqueara DROP. 037 no recrea la firma antigua. create_order(6) sigue ausente en el camino limpio; su política histórica de 036 no fue ampliada en esta tarea.

## Replay y delta reales

Reset --local --version 20261007000100 --no-seed, luego seed.sql → 035 → 036 → 037 con psql -U postgres -v ON_ERROR_STOP=1. Todos exit 0, incluido ISOLATED_SECURITY_TESTS.sql con opt-in aislado y ROLLBACK de sus fixtures. Los logs PAYMENT_REPLAY_* registran cada sentencia. No parches manuales a las tablas.

Delta: CREATE DATABASE nova_delta_037 OWNER postgres TEMPLATE template0; pg_restore del snapshot pre-037; verificar firma/dependencias; aplicar 036 y 037 con ON_ERROR_STOP. Ambos exit 0. Se comprobaron pedido gratuito atómico/idempotente, pedido normal, reporte repetido reutilizando un único pago pendiente, confirmación administrativa y consumo único de stock.

Equivalencia: sin diferencias en tablas, columnas, constraints, índices, funciones/firmas/definiciones/ACL, triggers, RLS, políticas, secuencias estructurales y default grants del esquema público. Se verificaron adicionalmente definición audit_trail, trigger Auth, políticas Storage y metadata de buckets. No se comparan IDs de filas sintéticas ni contadores last_value (distintos datos de prueba). Auth/Storage internos de plataforma no son objetos administrados por la baseline. Evidencias: FINAL_DELTA_VERIFIED.json y PAYMENT_RETIREMENT_FINAL_TESTS.json.

## ACL y HTTP directo

| Contrato | PUBLIC | anon | authenticated | service_role |
|---|---|---|---|---|
| create_payment(uuid) | firma ausente | firma ausente | firma ausente | firma ausente |
| create_payment(uuid,text) | sin EXECUTE | sin EXECUTE | sin EXECUTE | EXECUTE |

La comprobación PUBLIC usa aclexplode incluyendo ACL por defecto; roles usan has_function_privilege. Igual resultado en ambos caminos. RPC antiguo por HTTP local: 404/PGRST202 esperado por retirada; nuevo RPC con anon: 401/42501. La API controlada Next.js de pago y seguimiento funcionan; no confundir el PGRST202 esperado del RPC retirado con tracking.

## Regresión real y calidad

| Suite | Casos/grupos | Fallos |
|---|---|---|
${matrix}

Son verificaciones reales HTTP/Auth/RPC y PostgreSQL de los cuatro arneses, sin mocks. Los grupos concurrency incluyen 14 pares de sesiones/transacciones reales y controles adicionales de invariantes. Incluyen última unidad, misma idempotency_key/payload distinto, doble reporte, doble confirmación, dos ganadores de expiración/confirmación, espera de lock pasada la fecha, ventas físicas y normalización. Los casos HTTP agrupados incluyen algunos controles RPC indicados en sus detalles.

npm test: 288/288, 26 archivos (unitarios y mocks, separados de las pruebas reales). npm run lint: 0 errores, 5 advertencias preexistentes. npx tsc --noEmit: exit 0. npm run build: exit 0. Ejecutados en lab/app, copia con claves locales privadas ignoradas por Git; no se usaron claves productivas.

## Errores de preparación/arnés encontrados y corregidos

El primer intento delta creó la base como supabase_admin: public pertenece a pg_database_owner y postgres no tenía CREATE; 036 abortó en línea 42 con permission denied for schema public, antes de retirar nada. Se reconstruyó desde el dump con OWNER postgres, sin cambiar SQL candidato. Logs de ambos intentos conservados.

El arnés adicional esperaba caja=1 al confirmar online. La definición vigente no inserta caja para confirmación online; venta física sí. Se corrigió la expectativa a caja=0 y se repitió el delta desde el snapshot. No se modificó comportamiento de negocio. Hubo consultas diagnósticas con sintaxis/columnas incorrectas, sin efectos de escritura. Una revisión automática de permisos venció por tiempo; el reintento autorizado local se completó.

## Datos y reversibilidad

Se conservan únicamente fixtures TEST NOVA/TEST-NOVA y usuarios sintéticos locales. IDs/estado en PAYMENT_RETIREMENT_SYNTHETIC_RECORDS.json; delta en FINAL_DELTA_VERIFIED.json y PAYMENT_RETIREMENT_FINAL_TESTS.json. No se borraron esos registros al terminar. Backup antes: backups/nova-pre-payment-retirement.dump; después: backups/nova-payment-retirement-final.dump. El primero preserva la firma antigua por trazabilidad histórica, no forma parte de la cadena limpia final. No es backup de producción.

Para limpiar posteriormente: aprobar reset exclusivamente de este laboratorio, o restaurar un snapshot local conocido. No se incluye DELETE automático. Retirada es DDL: revertir una futura aplicación requeriría la definición/ACL del snapshot; no reincorporarla en la nueva cadena aprobada.

## Dictamen

El cierre técnico local está resuelto. Puede aprobarse activar la estructura documental propuesta en el checkout, después de aprobación explícita para mover los 39 originales conservando hashes. No autoriza reconciliar ni ejecutar la baseline sobre una producción existente. Adopción remota requiere auditoría de dependencias/ACL vigente, backups reales verificables y estrategia de historial remota aprobada por separado.
`;
fs.writeFileSync(out+'PAYMENT_RETIREMENT_CERTIFICATION.md',report);fs.writeFileSync(source+'PAYMENT_RETIREMENT_CERTIFICATION.md',report);
let manifest='| Archivo original | SHA-256 |\n|---|---|\n'+original.map(f=>`| ${f.file} | ${f.sha256} |`).join('\n');
const plan=`# Reorganización definitiva propuesta — lista para aprobación, NO ACTIVADA

La certificación final PAYMENT_RETIREMENT_CERTIFICATION.md cierra idempotencia, deadlock, total cero y retirada de create_payment(uuid). Replay completo, delta y regresión pasaron. Las 39 migraciones originales siguen donde estaban y sus hashes coinciden con el manifiesto auditado.

## Activación futura, únicamente después de aprobación

1. Respaldar checkout completo y guardar manifiesto SHA-256 de los 39 archivos; preservar auditorías, generador, candidatas y backups locales.
2. Crear supabase/migrations-legacy y mover allí los 39 originales conservando nombre/bytes. No renombrarlos para corregir sus versiones históricas: el archivo legacy es evidencia, no cadena ejecutable.
3. Crear únicamente las cuatro versiones válidas y únicas de FINAL_MIGRATION_LAYOUT.md en supabase/migrations, copiando exactamente los artefactos certificados. Semillas fuera de migrations.
4. Comparar hashes antes/después; comprobar que no queda duplicado 018/019/020, nombre 034 con espacios, DELETE histórico de 032, promotion_customers ni firma obsoleta en la cadena ACTIVA. Los archivos históricos originales permanecen íntegros en legacy.
5. Repetir reset local completo de CLI (migraciones y seed configurado), tests y comparación final antes de considerar activado el layout del checkout. El replay diagnóstico certificado ejecutó baseline → seed → 035 → 036 → 037; las cuatro migraciones no requieren datos seed para compilar, y el seed normal de CLI corre al final.
6. No modificar producción ni historial remoto. No link/db push/repair/squash. La nueva baseline es para bases vacías, no una reconciliación automática de una producción existente.

## Condiciones cerradas y límites

create_order(6) y create_payment(uuid) ausentes en la baseline; 036 guarda existencia y retira solo payment UUID con DROP RESTRICT. 035 independiente; 037 conserva concurrencia y gratuidad. Grants privados y tests reales verificados. Diferencias solo las documentadas en la generación. Reorganización local técnicamente aprobable, pendiente del permiso para mover archivos; certificación no equivale a autorización de despliegue remoto.

Antes de cualquier reconciliación remota deben respaldarse esquema/funciones/ACL/RLS, datos de negocio, Auth, secuencias, Storage metadata y archivos, además del historial de migraciones y configuración privada. Comprobar restore en aislado y volver a auditar dependencias reales. Estos pasos NO se ejecutaron sobre producción.

## Manifiesto de conservación (39 originales)

${manifest}
`;
const rows=layout.map(f=>`| ${f.destination} | ${f.origin} | ${f.sha256} |`).join('\n');
const finalLayout=`# Layout final certificado propuesto — NO ACTIVADO

Listo técnicamente para aprobación local. No se movió ningún original. Ver PAYMENT_RETIREMENT_CERTIFICATION.md.

\`\`\`text
supabase/
  migrations-legacy/
    [39 migraciones originales; mismos nombres y bytes]
  migrations/
    20261007000100_baseline_initial.sql
    20261007000200_checkout_public_summary.sql
    20261007000300_security_rpc_hardening.sql
    20261007000400_backend_concurrency_zero_total.sql
  seed.sql
  baseline-candidate/
    [generadores, candidatas e informes]
  config.toml
\`\`\`

| Destino propuesto | Fuente exacta | SHA-256 certificado |
|---|---|---|
${rows}

seed.sql = SEED_CANDIDATE.sql, SHA-256 ${sha(source+'SEED_CANDIDATE.sql')}. Configurar [db.seed] enabled=true, sql_paths=["./seed.sql"]. Semillas: buckets necesarios sin QR/datos privados, Caja principal, horarios iniciales seguros y pedidos fuera de horario desactivados. Sin usuarios/clientes/productos reales.

Baseline completa: tablas/secuencias/constraints/índices/RLS/políticas, audit_trail antes de sus funciones, triggers/ACL/integración Auth/Storage; incluye definiciones finales validadas por 037. Aplicar 036 transitoriamente restablece sus definiciones previas y 037 establece el contrato final; orden exacto ya probado. 035 agrega tracking sin entrar en la baseline. 036 retira la firma UUID solo si existe y conserva el pago de dos argumentos server-only. 037 concurrencia/gratuidad.

Sin firmas obsoletas, SQL histórico destructivo ni versiones duplicadas en la cadena activa propuesta. El original 035 se conserva en legacy y su copia timestamp en la nueva cadena es byte-idéntica. Futuras migraciones usarán timestamp de 14 dígitos único, mayor que 20261007000400, y nombres snake_case; no reutilizar versiones.

El laboratorio usa 20261007000100_baseline_candidate.sql: el destino propuesto baseline_initial cambia solo el nombre del archivo, no sus bytes/version. Generador validado mediante regeneración temporal. Activación futura debe repetir CLI local, nunca ejecutar baseline sobre producción.
`;
for(const [name,content]of [['MIGRATION_REORGANIZATION_PLAN.md',plan],['FINAL_MIGRATION_LAYOUT.md',finalLayout]]){fs.writeFileSync(out+name,content);fs.writeFileSync(source+name,content);}
console.log(JSON.stringify({sections,quality:summary.quality,originalMigrations:summary.originalMigrations,certified:summary.certifiedLocally},null,2));
