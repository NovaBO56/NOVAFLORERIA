import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='audit-supabase';
const read=name=>JSON.parse(fs.readFileSync(`${dir}/${name}`,'utf8').replace(/^\uFEFF/,''));
const r=read('remote-catalog.json'),e=read('remote-extra.json'),a=read('migration-analysis.json'),o=read('object-comparison.json'),data=read('data-counts.json'),seeds=read('seed-check.json');
const esc=value=>String(value??'—').replaceAll('|','\\|').replaceAll('\n',' ').replaceAll('\r','');
const table=(headers,rows)=>`| ${headers.join(' | ')} |\n| ${headers.map(()=>'---').join(' | ')} |\n${rows.map(row=>`| ${row.map(esc).join(' | ')} |`).join('\n')}\n`;
const yes=value=>value?'Sí':'No';
const notes={
 '001':['Corrección inicial RLS catálogo','Superada por 002','002 reemplaza las cinco políticas','Alto: figura en historial; no contiene la creación del catálogo'],
 '002':['Permitir administración de catálogo a empleado/admin','Vigente; existen además políticas anteriores','018 agrega lectura pública','Alto: aplicada y define acceso del catálogo'],
 '003':['Permisos de escritura en Storage product-images','Vigente; tres políticas equivalentes','No reemplazada','Alto: aplicada; perderla altera permisos Storage'],
 '004':['RLS de perfiles sin recursión','Vigente; remoto conserva dos políticas adicionales','Complementa políticas iniciales','Alto: perfiles y permisos'],
 '005':['Tablas, claves e índices de inventario','Vigente','006 añade comportamiento; 028 notifica stock','Alto: estructura base de stock y trazabilidad'],
 '006':['Triggers de entradas, mermas y ajustes','Vigente; cuerpos remotos coinciden','028 agrega alerta de stock','Alto: stock/lotes/movimientos dejarían de sincronizarse'],
 '007':['Recetas y personalizaciones','Vigente','031 agrega inventario de opciones','Alto: dependencias del checkout'],
 '008':['Consumo FIFO de receta','Vigente; coincide; revisar EXECUTE público','No reemplazada','Alto: lógica de consumo; preservar con permisos revisados'],
 '009':['Clientes, pedidos, líneas y reservas','Vigente','018 fase9 añade deleted_at','Alto: tablas principales de ventas'],
 '010':['Reserva, creación inicial y cancelación','Parcial: versiones de crear/cancelar superadas; liberar diverge','011/019/025/028/031; liberar remoto no versionado','Alto: conservar cadena de reserva y recuperar cambio remoto'],
 '011':['Pedido anónimo con creación de cliente','Función inicial superada; permisos tienen efectos','020/025; firma de seis args reaparece en remoto','Alto: retirada de firmas también forma parte del historial'],
 '012':['Pagos, QR, bucket y RLS','Esquema y bucket vigentes; QR sin filas','014/016 reemplazan función de pago, no estas tablas','Alto: DML de bucket no debe perderse'],
 '013':['Crear, confirmar y rechazar pagos','Parcial: crear pago superado; confirmar diverge; rechazar coincide','014/016; confirmación remota no versionada','Alto: cobros y consumo FIFO'],
 '014':['Corregir retorno de create_payment','Superada por 016','016 conserva corrección y añade número','Medio: guarda evolución de retorno; consolidable'],
 '015':['Configuración de WhatsApp y RLS','Esquema vigente; sin configuración','No reemplazada','Alto: conservar estructura; datos del negocio son aparte'],
 '016':['Pago devuelve número de pedido','Vigente; cuerpo coincide','Última definición local de create_payment','Alto: contrato usado por checkout'],
 '017':['Venta física inicial','Superada','023/025/026','Medio: puede consolidarse manteniendo definición final'],
 '018_catalogo':['Lectura pública del catálogo y opciones','Vigente; seis políticas coinciden','Complementa 002','Alto: acceso anónimo del catálogo'],
 '018_fase9':['Soft delete, devoluciones y solicitudes','Vigente','019 implementa operaciones','Alto: privacidad, historial y dependencias de 035'],
 '019_fase9':['Cancelaciones, devoluciones y eliminación lógica','Vigente; firmas finales coinciden','020 retira firma anterior; 021 ajusta helper','Alto: reversión de ventas e inventario'],
 '019_seguimiento':['Seguimiento por número y teléfono','Vigente; cuerpo coincide','035 propone un envoltorio aún ausente','Alto: contrato público seguro; preservar'],
 '020_fase5':['Extras y snapshots de personalizaciones','Superada en la ruta de siete args; cuerpo idéntico a firma remota antigua','025 retira seis args; 031 corrige siete args','Alto: no conservar automáticamente firma obsoleta como deseada'],
 '020_fase9':['Retirar sobrecarga antigua cancel_order','Efecto vigente: firma antigua no existe en remoto','Evita ambigüedad PostgREST','Medio: no perder la retirada lógica al consolidar'],
 '021':['Helper can_delete_cancelled_order','Vigente; cuerpo coincide','Reemplaza helper del master','Alto: autorización de eliminación lógica'],
 '022':['Caja: tablas y semilla de registro','Esquema vigente; hay una caja con otro nombre','023 añade funciones','Alto: estructura y semilla configuracional'],
 '023':['Abrir/mover/cerrar caja y venta física','Caja vigente; venta física superada','025/026 cambian venta','Alto: dinero y enlaces entre pedidos/caja'],
 '024':['Promociones, productos y descuentos','Parcial: promotion_customers fue retirada; tipos cambiaron','032/033; tablas actuales conservadas','Alto: no reinstalar modelo obsoleto'],
 '025':['Promociones en pedidos y ventas','Definiciones superadas; retiro de seis args no reflejado remoto','026/028/031/032/034','Alto: cambios de contrato y eliminación de sobrecargas'],
 '026':['Venta física con cliente opcional','Diverge: remoto usa finalizado, local confirmado','Corrección remota sin archivo local','Alto: preservar decisión funcional antes de baseline'],
 '027':['Notificaciones y horarios con semilla','Esquema vigente; horario actual distinto de semilla','028 añade funciones/triggers','Alto: no sobrescribir horario real'],
 '028':['Horarios, notificaciones y pedido con horario','Parcial: horarios/triggers vigentes; create_order superado; semilla ausente','031 restaura opciones y stock','Alto: declara aplicación manual; conservar efectos finales'],
 '029':['Rate limit por IP/ruta','Vigente; cuerpo coincide; incluye limpieza dentro de RPC','No reemplazada','Alto: datos de IP no son seed; revisar concurrencia y acceso'],
 '030':['Auditoría, vista y RPC protegida','Vigente; cuerpos coinciden; vista sin SELECT público','No reemplazada','Alto: logs, trigger y revocación de vista deben conservarse'],
 '031':['Opciones reales, extra_price y reserva compartida','Vigente; cuerpo de create_order de siete args coincide','Corrige regresión introducida en 025/028','Alto: definición final del checkout personalizado'],
 '032':['Nuevo modelo producto/combo','Esquema vigente; cálculo superado por 034','033 repara constraints/RLS; 034 protege monto fijo','Crítico: DML superior borra promociones; NO reaplicar'],
 '033':['Constraints de combos, UPDATE RLS y límites','Vigente; dos constraints siguen NOT VALID','Complementa 032','Alto: bloques DO dinámicos y restricciones deben conservarse'],
 '034_empty':['Archivo vacío con nombre inválido para CLI','Sin efectos; CLI lo ignora','No contiene SQL','Bajo respecto al esquema; preservar como evidencia por ahora'],
 '034':['Protección de descuento fijo en cálculo','Vigente; cuerpo remoto coincide','Última definición de apply_order_discount','Alto: barrera de descuentos y contrato vigente'],
 '035':['Resumen público ampliado del checkout','Pendiente; función no existe en remoto','No sustituye create_order/create_payment','Alto si se confunde con baseline actual; mantener como cambio futuro'],
};
function key(row){if(row.file.startsWith('018_')||row.file.startsWith('019_')||row.file.startsWith('020_'))return row.file.split('_').slice(0,2).join('_');if(row.empty)return '034_empty';return row.version;}
const inventoryRows=a.inventory.map(row=>{
 const n=notes[key(row)]??[row.purpose,'Revisar','—','Alto'];
 return [row.file,row.version,n[0],row.objects.join(', ')||'Ninguno',row.recorded?'Sí (historial)':row.empty?'No; ignorada':'No (objeto puede existir)',n[1],n[2],row.duplicate?(row.version==='034'?'Nominal; vacío inválido no compite en CLI':'Sí, versión CLI'):'No',yes(row.empty),yes(row.ddl),row.top_level_dml.length?'Sí, al aplicar':row.contains_dml?'Solo dentro de funciones':'No',yes(row.rls),yes(row.storage),yes(row.security_definer),'Sí, conservar original',row.empty?'Excluir de baseline tras aprobación':row.version==='035'?'Separada del baseline actual':'Sí, preservar efectos finales',n[3]];
});
let migrationDoc='# Inventario completo de las 39 migraciones\n\nAuditoría estática de todos los archivos, en orden de nombre. No se ejecutó su SQL. «Registrada» significa presencia en schema_migrations; no implica igualdad de definición. DDL incluye permisos. DML se distingue entre sentencias al aplicar y código contenido en funciones. Los SQL históricos con operaciones destructivas se leen como texto exclusivamente.\n\n';
migrationDoc+=table(['Archivo','Versión','Propósito','Objetos','Registrada remoto','Vigencia','Corrección posterior','Duplicada','Vacía','DDL/permisos','DML','RLS','Storage','SECURITY DEFINER','Conservar','Consolidación','Riesgo de eliminar'],inventoryRows);
migrationDoc+='\n## DML de aplicación que requiere tratamiento explícito\n\n';
for(const row of a.inventory.filter(x=>x.top_level_dml.length)){migrationDoc+=`### ${row.file}\n\n`;
 if(row.version==='032')migrationDoc+='Contiene tres eliminaciones globales sobre promotion_customers, promotion_products y promotions. Son hechos históricos, NO semillas para repetir y NO forman parte de una futura creación segura de la base. No se ejecutaron.\n\n';
 else migrationDoc+=`\`\`\`sql\n${row.top_level_dml.join(';\n')}\n\`\`\`\n\n`;
}
fs.writeFileSync(`${dir}/MIGRACIONES.md`,migrationDoc);
const mutations=Object.fromEntries(a.inventory.map(row=>[row.file,row.objects]));
const sourceFor=(schema,name)=> schema==='public'?a.inventory.filter(row=>row.objects.includes(name)).map(row=>row.file):schema==='storage'?a.inventory.filter(row=>row.storage).map(row=>row.file):[];
const physical=r.tables.filter(t=>['r','p'].includes(t.kind));
let inv=`# Inventario del esquema remoto\n\nCaptura: ${r.captured_at}. Solo metadatos; las cifras de filas están en data-counts.json, sin registros personales. Este inventario no es un dump restaurable.\n\n`;
inv+=table(['Schema','Propietario','ACL','Tablas/vistas'],r.schemas.map(s=>[s.name,s.owner,s.acl,r.tables.filter(t=>t.schema===s.name).length]));
inv+='\n## Extensiones\n\n'+table(['Extensión','Versión','Schema'],r.extensions.map(x=>[x.name,x.version,x.schema]));
inv+='\n## Tipos y enums\n\nNo hay enums de negocio en public; los estados/roles se modelan como text más CHECK.\n\n'+table(['Schema','Nombre','Tipo','Base','Default'],e.types.map(t=>[t.schema,t.name,t.kind,t.base_type,t.default]));
inv+='\n### Etiquetas de enums\n\n'+table(['Schema','Enum','Etiqueta','Orden'],r.enums.map(x=>[x.schema,x.name,x.label,x.position]));
inv+='\n## Tablas y vistas por schema\n\n'+table(['Objeto','Tipo','Propietario','RLS','FORCE RLS','ACL','Origen/alteraciones locales probables'],r.tables.map(t=>[`${t.schema}.${t.name}`,t.kind,t.owner,yes(t.rls),yes(t.force_rls),t.acl,sourceFor(t.schema,t.name).join(' → ')||(t.schema==='public'?'Fuera de migrations; consultar informe':'Plataforma Supabase; fuera del historial de aplicación')]));
for(const t of r.tables.toSorted((x,y)=>`${x.schema}.${x.name}`.localeCompare(`${y.schema}.${y.name}`))){
 inv+=`\n## ${t.schema}.${t.name}\n\n`;
 inv+=table(['Columna','Tipo','NOT NULL','Default','Identity','Generated'],r.columns.filter(c=>c.schema===t.schema&&c.table===t.name).toSorted((x,y)=>x.position-y.position).map(c=>[c.name,c.type,yes(c.not_null),c.default,c.identity,c.generated]));
 const cs=r.constraints.filter(c=>c.schema===t.schema&&c.table===t.name);if(cs.length)inv+='\n### PK, FK, UNIQUE, CHECK y exclusiones\n\n'+table(['Constraint','Tipo','Definición','Validada'],cs.map(c=>[c.name,c.type,c.definition,yes(c.validated)]));
 const indexes=r.indexes.filter(i=>i.schemaname===t.schema&&i.tablename===t.name);if(indexes.length)inv+='\n### Índices\n\n'+table(['Índice','Definición'],indexes.map(i=>[i.indexname,i.indexdef]));
 const policies=r.policies.filter(p=>p.schemaname===t.schema&&p.tablename===t.name);if(policies.length)inv+='\n### Políticas RLS\n\n'+table(['Política','Roles','Comando','Tipo','USING','WITH CHECK','Última migración local'],policies.map(p=>[p.policyname,p.roles.join(', '),p.cmd,p.permissive,p.qual,p.with_check,a.policyComparison.find(x=>x.actual?.policyname===p.policyname&&x.actual?.tablename===p.tablename&&x.actual?.schemaname===p.schemaname)?.final_source??'Fuera del estado local final']));
 const triggers=r.triggers.filter(g=>g.schema===t.schema&&g.table===t.name);if(triggers.length)inv+='\n### Triggers\n\n'+table(['Trigger','Enabled','Definición','Fuente local'],triggers.map(g=>[g.name,g.enabled,g.definition,a.localProjection.trigger.find(x=>x.table===g.table&&x.name===g.name)?.file??(g.schema==='auth'?'MASTER_DATABASE_FLORERIA.sql / bootstrap':'Fuera de migrations')]));
}
inv+='\n## Secuencias (parámetros, sin valores operativos)\n\n'+table(['Objeto','Tipo','Inicio','Mínimo','Máximo','Incremento','Ciclo'],r.sequences.map(s=>[`${s.schema}.${s.name}`,s.type,s.start,s.min,s.max,s.increment,yes(s.cycle)]));
inv+='\n## Propiedad de secuencias\n\n'+table(['Secuencia','Tabla','Columna','Dependencia'],e.sequence_ownership.map(s=>[s.sequence,s.table,s.column,s.dependency_type]));
inv+='\n## Funciones y RPC\n\nLas definiciones completas de public están conservadas como metadatos en remote-catalog.json. Las funciones de plataforma se inventarían por firma, sin extraer secretos ni datos. La equivalencia de cuerpos no demuestra equivalencia de permisos.\n\n';
inv+=table(['Schema.función','Argumentos','Resultado','Lenguaje','SECURITY DEFINER','Volatilidad','Configuración','ACL','Fuente final local'],r.functions.map(f=>[`${f.schema}.${f.name}`,f.arguments,f.result,f.language,yes(f.security_definer),f.volatility,f.config?.join('; '),f.acl,f.schema==='public'?a.functionComparison.find(x=>x.remote_name===f.name&&x.remote_definition===f.definition)?.final_source??'Fuera de migrations':'Plataforma']));
inv+='\n## Permisos efectivos de funciones públicas\n\n'+table(['Función','EXECUTE anon','EXECUTE authenticated','EXECUTE service_role'],e.function_permissions.map(f=>[f.function,yes(f.anon_execute),yes(f.authenticated_execute),yes(f.service_role_execute)]));
inv+='\n## Permisos efectivos de tablas/vistas públicas\n\nLos grants de tabla no desactivan RLS. audit_logs/rate_limit_attempts tienen RLS sin políticas, y audit_trail tiene revocación de SELECT público.\n\n'+table(['Objeto','SELECT anon','SELECT auth','INSERT anon','UPDATE anon','DELETE anon'],e.table_permissions.map(t=>[t.table,yes(t.anon_select),yes(t.authenticated_select),yes(t.anon_insert),yes(t.anon_update),yes(t.anon_delete)]));
inv+='\n## ACL por defecto\n\n'+table(['Rol propietario','Schema','Clase','ACL'],r.default_acl.map(d=>[d.role,d.schema,d.type,d.acl]));
inv+='\n## Event triggers\n\n'+table(['Nombre','Evento','Enabled','Función','Tags'],e.event_triggers.map(t=>[t.name,t.event,t.enabled,t.function,t.tags?.join(', ')]));
inv+='\n## Vistas/materializadas\n\n'+table(['Objeto','Tipo','Definición'],r.views.map(v=>[`${v.schema}.${v.name}`,v.kind,v.definition]));
inv+='\n## Storage\n\n'+table(['Bucket','Público','Límite bytes','MIME','Archivos (conteo)'],r.buckets.map(b=>[b.id,yes(b.public),b.file_size_limit,b.allowed_mime_types?.join(', '),e.storage_object_counts.find(x=>x.bucket_id===b.id)?.objects]));
inv+='\n## Realtime\n\n'+table(['Publicación','Todas las tablas','Insert','Update','Delete','Truncate'],e.publications.map(p=>[p.name,yes(p.all_tables),yes(p.insert),yes(p.update),yes(p.delete),yes(p.truncate)]));
inv+='\n'+table(['Publicación','Schema','Tabla','Columnas','Filtro'],e.replication_tables.map(t=>[t.pubname,t.schemaname,t.tablename,t.attnames?.join(', '),t.rowfilter]));
inv+='\n## Cron y Vault\n\nNo existe cron.job ni está instalada pg_cron. Vault está instalado; el conteo de secretos es 0. No se leyó contenido de secretos. Hay event triggers de plataforma que conceden acceso cuando se instalan extensiones; no equivalen a que pg_cron/pg_net estén instaladas.\n';
fs.writeFileSync(`${dir}/INVENTARIO_REMOTO.md`,inv);
let comparison='# Comparación estática del estado local final con remoto\n\nNo se ejecutaron migraciones ni existe una base local reproducida. Esto compara una proyección estática, que presupone el bootstrap externo; no sustituye un replay PostgreSQL. Los cuerpos se comparan sin comentarios/espacios y con normalización de tipos int/integer; los literales se conservan.\n\n';
comparison+=table(['Función','Última fuente local','Historia de firma','Cuerpo remoto','Versión que coincide','SECURITY DEFINER/config'],a.functionComparison.map(f=>[f.key,f.final_source??'Fuera de migrations',f.local_history?.join(' → '),f.missing_remote?'Ausente':f.exact_body_match===true?'Coincide':f.exact_body_match===false?'Diferente':'Sin fuente final',f.matching_versions?.join(', '),`${yes(f.security_definer)} / ${f.config?.join(', ')??'—'}`]));
comparison+='\n## Funciones base del Master\n\n'+table(['Firma','Declarada en Master','Cuerpo coincide'],o.masterFunctionMatches.map(f=>[f.key,yes(f.master_declares),yes(f.body_matches)]));
comparison+='\n## Columnas proyectadas\n\n'+table(['Tabla.columna','Fuente','Tipo esperado','Tipo remoto','Tipo igual','NULL esperado/remoto','Default esperado','Default remoto','Default equivalente'],o.columnComparisons.map(c=>[`${c.table}.${c.column}`,c.source,c.expected_type,c.actual_type,yes(c.type_matches),`${c.expected_not_null}/${c.actual_not_null}`,c.expected_default,c.actual_default,yes(c.default_matches)]));
comparison+='\n## Políticas finales locales\n\nLa comparación normaliza casts y calificación public. Las políticas de promotion_customers se excluyen de la proyección final porque 032 retira esa tabla.\n\n'+table(['Objeto/política','Fuente','Presente','USING equivalente','WITH CHECK equivalente','Roles','Comando'],o.policySemantics.map(p=>[p.key,p.source,yes(p.present_remote),yes(p.using_matches),yes(p.check_matches),yes(p.roles_match),yes(p.command_match)]));
comparison+='\n## Políticas remotas adicionales\n\n'+table(['Objeto','Política','Roles','Comando','USING','WITH CHECK'],a.remoteOnlyPolicies.map(p=>[`${p.schemaname}.${p.tablename}`,p.policyname,p.roles.join(', '),p.cmd,p.qual,p.with_check]));
comparison+='\n## Índices explícitos\n\n'+table(['Índice','Tabla','Fuente','Presente','Local','Remoto'],o.indexComparisons.map(i=>[i.key,i.table,i.source,yes(i.present),i.expected_statement,i.actual?.indexdef]));
comparison+='\n## Triggers finales locales\n\n'+table(['Trigger','Fuente','Historia','Presente','Local','Remoto'],o.triggerComparisons.map(t=>[t.key,t.source,t.history.join(' → '),yes(t.present),t.expected_statement,t.actual?.definition]));
comparison+='\n## Vista de auditoría\n\n'+table(['Vista','Fuente','Local','Remoto'],o.views.map(v=>[v.key,v.source,v.expected_statement,v.actual?.definition]));
comparison+='\n## Límites de la comparación\n\nLa existencia de índices/triggers no prueba por sí sola su equivalencia; sus definiciones completas se muestran para revisión. Las PK/FK/CHECK/UNIQUE reales se inventarían en INVENTARIO_REMOTO.md. Se contrastaron expresamente los cambios de promociones de 032/033, que están presentes y mantienen NOT VALID donde la migración lo declara. No se afirma un diff de esquema ejecutado con PostgreSQL local, ni que todas las constraints implícitas fueran probadas por replay.\n';
fs.writeFileSync(`${dir}/COMPARACION.md`,comparison);
const manifest=a.inventory.map(row=>({file:row.file,bytes:row.bytes,sha256:crypto.createHash('sha256').update(fs.readFileSync(`supabase/migrations/${row.file}`)).digest('hex')}));
fs.writeFileSync(`${dir}/migration-hashes.json`,JSON.stringify(manifest,null,2));
console.log(JSON.stringify({reports:['MIGRACIONES.md','INVENTARIO_REMOTO.md','COMPARACION.md'],files:a.inventory.length,public_physical_tables:physical.filter(t=>t.schema==='public').length,public_columns:r.columns.filter(c=>c.schema==='public').length,projected_columns:o.columnComparisons.length,final_policies:o.policySemantics.length,extra_policies:a.remoteOnlyPolicies.length,exact_function_bodies:a.summary.exact_functions,different_function_bodies:a.summary.different_functions,data_tables:data.public_table_counts.length,seed_checks:seeds},null,2));
