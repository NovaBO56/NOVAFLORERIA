# Certificación local final: retirada de create_payment(uuid)

Resultado: CERTIFICADO LOCALMENTE para el alcance y las versiones probadas. Reorganización técnicamente lista para aprobación; NO ACTIVADA. No se tocó producción, ningún vínculo remoto ni las 39 migraciones originales.

## Destinos y trazabilidad

Laboratorio: C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION. API 127.0.0.1:55421; PostgreSQL 127.0.0.1:55422/postgres. No existe supabase/.temp/project-ref. Delta: nova_delta_037 en el mismo contenedor local supabase_db_NOVA-LOCAL-VALIDATION. Se restauró nova-validation.dump, exclusivamente sintético, previo a 037 y con firma antigua presente. Ningún dato real.

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
| http | 51 | 0 |
| jwt | 17 | 0 |
| concurrency | 17 | 0 |
| promotions | 11 | 0 |

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
