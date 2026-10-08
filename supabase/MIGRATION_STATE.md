# Estado final de migraciones — ACTIVADO LOCALMENTE

Fecha UTC de cierre: 2026-10-08T02:38:05.702Z. La autorización del adjunto da4f9755-902e-4123-b09e-53fe5c4e152e se ejecutó exclusivamente en archivos del repositorio y laboratorio local. Producción, historial remoto y configuración productiva intactos. No link/db push/repair/reset remoto.

## Estructura vigente

```text
supabase/
  migrations-legacy/                 # 39 originales, solo referencia
  migrations/
    20261007000100_baseline_initial.sql
    20261007000200_checkout_public_summary.sql
    20261007000300_security_rpc_hardening.sql
    20261007000400_backend_concurrency_zero_total.sql
  seed.sql                          # configuración mínima, fuera de migrations
  baseline-candidate/               # fuentes y certificación histórica
  MIGRATION_REORGANIZATION_AUDIT.md
  MIGRATION_REORGANIZATION_MANIFEST.json
  MIGRATION_REORGANIZATION_RESULTS.json
  README.md
```

## Conservación y limpieza

39/39 SHA-256 antes/después idénticos; nombres conservados. Incluye 034 fix modulo pedidos.sql vacío, solo en legacy. Snapshot íntegro previo de supabase en C:\Users\carli\OneDrive\Desktop\FLORERIA WEB\NOVA-LOCAL-VALIDATION\backups\reorganization-2026-10-08T02-30-19-250Z/supabase, con inventario de archivos y hashes, incluidos informes. Backup privado local fuera de Git; no publicar su configuración interna. El manifiesto y auditoría registran lista completa, hashes nuevos y motivo.

La cadena activa contiene exactamente cuatro archivos no vacíos, versiones válidas/únicas, sin duplicados 018/019/020, sin nombre 034 inválido, sin DELETE globales históricos de 032 ni definición de promotion_customers. No crea firmas antiguas create_order(6) ni create_payment(uuid). 036 conserva una referencia defensiva a esta última exclusivamente para retirarla en un futuro delta autorizado, con guardia y DROP RESTRICT; eso no crea ni habilita la función.

## Replay del repositorio, no de copias

NOVA-LOCAL-VALIDATION mantiene project_id y API http://127.0.0.1:55421 / DB localhost:55422, sin project-ref. Su supabase/migrations es una junction a la carpeta activa del repositorio; su seed.sql es un hardlink al seed activo. Config del laboratorio independiente; el config y vínculo del checkout original no se usaron para operaciones de base.

supabase db reset --local --workdir NOVA-LOCAL-VALIDATION --yes terminó exit 0. Orden registrado: baseline_initial → checkout_public_summary → security_rpc_hardening → backend_concurrency_zero_total → seed. No SQL manual copiado al laboratorio para este replay. Las copias previas del laboratorio se conservaron en el backup de reorganización, fuera de la cadena activa.

## Esquema y ACL reales

35 tablas públicas, 37 funciones, 161 constraints, 73 índices, 2 secuencias, 1 vista y 11 triggers de aplicación/Auth. 86 políticas public + 3 Storage = 89. RLS, grants/default grants, constraints, firmas/cuerpos, índices, triggers, vistas y extensiones necesarias coinciden con el snapshot certificado restaurado en nova_reorganization_reference del mismo contenedor local. También coinciden trigger Auth, políticas/buckets Storage. Sin diferencias de esquema; filas sintéticas y contadores last_value se excluyen deliberadamente. No se certifica el esquema interno administrado por Supabase como parte de la baseline.

create_payment(uuid): ausente. create_order(6): ausente. create_payment(uuid,text): presente; PUBLIC/anon/authenticated sin EXECUTE, service_role con EXECUTE. Rutas server-only siguen funcionando.

## Seeds y regresión

Seed byte-idéntico al certificado. Segunda ejecución desde el archivo activo mediante stdin de psql conservó exactamente buckets, Caja principal, business_hours y system_settings: idempotente, sin duplicados ni sobrescrituras. Configuración inicial segura: buckets vacíos, caja cerrada, siete días cerrados y accept_orders_outside_hours=false. El arnés sintético activa temporalmente recepción de pedidos local; el seed repetido respeta ese ajuste existente.

Pruebas reales: 51 controles HTTP/RPC agrupados, 17 JWT/roles, 17 concurrencia/invariantes y 11 promociones; cero fallos/errores. 14 pares de sesiones/transacciones reales. Cubren catálogo y páginas checkout/seguimiento, pedido normal/gratuito, pagos, confirmación/rechazo, idempotencia concurrente, expiración vs confirmación, venta física, caja, inventario y promociones. Consultas GET posteriores al build: catálogo/checkout/seguimiento 200.

npm test: 288/288 en 26 archivos. Lint: 0 errores, 5 advertencias preexistentes. npx tsc --noEmit y npm run build: exit 0. Quality ejecutado en copia Next local con claves privadas locales; 237 archivos de src, tests y manifiestos npm comprobados byte-idénticos al repositorio. Config Next local tiene los overrides de resolución/puertos ya certificados. Unitarios/mocks separados de las pruebas HTTP/Auth/PostgreSQL reales.

## Datos y errores

No diferencias SQL ni correcciones de negocio nuevas durante esta activación. Los únicos cambios de apoyo fueron documentación y adaptar el verificador de hashes a migrations-legacy. El reset autorizado recreó únicamente el laboratorio después de conservar sus snapshots/fixtures anteriores. Al terminar se dejaron fixtures sintéticos nuevos, identificados en C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION/certification/REORGANIZATION_SYNTHETIC_RECORDS.json y en MIGRATION_REORGANIZATION_RESULTS.json; no se ejecutó limpieza automática final. La base auxiliar de referencia contiene exclusivamente el snapshot sintético local.

Evidencias: C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION/certification/REORGANIZATION_REPLAY.log, REORGANIZATION_VERIFICATION.json, REORGANIZATION_FINAL_SUMMARY.json y logs REORGANIZATION_* de test/lint/typecheck/build/smoke. Auditoría/hash en archivos de este directorio. Informes de certificación previa permanecen históricos: sus frases NO ACTIVADO describen el momento anterior; este archivo define el estado actual.

## Desarrollo y producción

Repositorio listo para continuar desarrollo normal con futuras migraciones timestamp únicas mayores a 20261007000400. No editar baseline certificada ni ejecutar legacy. Consultar README.md de Supabase.

Antes de reconciliar producción falta: auditar nuevamente esquema/dependencias/ACL e historial remoto vigente; generar y comprobar restore de backups reales de esquema/datos/Auth/Storage (metadata y archivos)/secuencias/configuración; decidir explícitamente la estrategia de adopción de baseline vs delta y correspondencia del historial; ensayar ese procedimiento con una copia aislada; revisar impacto/rollback y obtener autorización separada. Nada de ello se ejecutó ni se infiere aprobado por esta reorganización local. La baseline nunca se ejecuta sobre producción existente.
