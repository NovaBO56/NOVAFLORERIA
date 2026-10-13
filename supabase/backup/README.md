# Recuperación semanal privada — desactivada

El workflow mantiene guardia explícita `&& false` y `BACKUP_ENABLED=false`. Ni el calendario ni una ejecución manual pueden activarlo mediante variables del repositorio. No hay proveedor conectado ni claves solicitadas. No quitar las dos guardias antes de una revisión posterior. Importar los módulos no ejecuta backups.

## Captura conjunta

GitHub Actions, fuera de Vercel, tiene frecuencia domingo 03:00 UTC (sábado 23:00 Bolivia). Usa PostgreSQL y AWS CLI oficiales; no añade dependencias a la aplicación ni sube GitHub Artifacts. El espacio temporal del sistema contiene los archivos privados; se elimina al terminar, incluso al fallar. Nunca se guarda un dump o imagen dentro del repositorio. Cada objeto se procesa por streaming; disco temporal necesario: dump + archivos cifrados/verificación y el objeto mayor. La RAM no contiene todos los bytes de Storage. Manifest NDJSON por streaming; los conjuntos de identidad usados para validar duplicados crecen con el número de objetos.

Orden de `weekly-backup.mjs`:

1. Capturar inventario Storage mediante SELECT paginado, por clave `(bucket_id,name)` con collation C y páginas de 1.000. Leer **todos** los buckets y objetos, sin filtros que omitan futuros buckets de negocio. Carpetas son rutas completas, sin límite artificial de profundidad.
2. Un único `pg_dump --format=custom` toma una instantánea consistente de `public`, `auth`, `storage` metadata y `supabase_migrations`; verificar TOC con `pg_restore --list`, cifrar y subir DB.
3. Comparar nuevamente inventario con el anterior. Respaldar todos los bytes mediante API Storage autenticada, sin modificar originales. Cifrar/subir/verificar cada objeto. No existen los límites LOCAL de 5 MB/64 MB/5.000 objetos.
4. Verificar nuevamente el dump externo y todos los objetos/manifest Storage.
5. Comparar inventario una tercera vez; publicar y descargar/verificar el marcador conjunto cifrado de semana recuperable.
6. Únicamente ahora realizar retención coordinada.

El manifest cifrado conserva bucket, ruta exacta, tamaño, content-type disponible y SHA-256 del contenido, además de key/tamaño/hash de cada archivo cifrado. Mantiene buckets vacíos. Los nombres externos son opacos por objeto; no exponen rutas ni nombres de clientes.

Cada subida requiere HEAD (existencia/tamaño/metadatos), GET completo y SHA-256 coincidente. La verificación Storage adicional descifra autenticando AES-256-GCM y compara tamaño/hash original. Manifest corrupto, archivo ausente, diferencia SHA-256 o fallo de upload/download hace fallar la ejecución. No se publica marcador conjunto ni se inicia retención si falta una parte. Un fallo al transferir/verificar el propio marcador tampoco permite retención; un objeto huérfano no es una ejecución exitosa.

**Consistencia:** PostgreSQL tiene snapshot transaccional; Storage no ofrece aquí una transacción atómica conjunta con DB. Comparar ID/version/updated_at/metadata y conjunto de buckets/objetos antes/después detecta cambios concurrentes y aborta. Para una recuperación estrictamente coordinada, planificar una ventana sin escrituras de Storage ni migraciones durante la captura. No afirmar PITR atómico entre DB y archivos. No se silencian diferencias de inventario. Las operaciones comerciales de DB posteriores al snapshot no pertenecen a esa copia.

## Cifrado, privacidad y proveedor

AES-256-GCM con nonce aleatorio cifra dump, cada objeto, manifest y marcador **antes** de salir del runner. Solo archivos cifrados llegan a S3. Se exige bucket privado; nunca se fija ACL pública. Se rechazan grants públicos y políticas `IsPublic=true`. La confirmación protegida de privacidad exige revisión humana de bloqueo público y políticas, no la sustituye. SSE `AES256` o `aws:kms` agrega cifrado del proveedor; `client-only` es una excepción explícita para proveedores sin esa API y sigue conservando cifrado del cliente. Versionado habilitado por defecto; excepción `unsupported` requiere documentar la limitación del proveedor.

Tres prefijos configurables, obligatorios y no solapados:

| Variable | Ejemplo ilustrativo |
| --- | --- |
| `BACKUP_S3_PREFIX` | `nova/database/` |
| `BACKUP_S3_STORAGE_PREFIX` | `nova/storage/` |
| `BACKUP_S3_WEEKLY_PREFIX` | `nova/weekly/` |

Cada generación tiene fecha/hora UTC + sufijo aleatorio. Layout: DB `<prefijo><generación>/database.dump.enc`; Storage `<prefijo><generación>/objects/N.enc` y `manifest.enc`; marcador `<prefijo><generación>.complete.enc`. No se hardcodea proveedor, bucket ni prefijos.

## Variables protegidas

Crear posteriormente environment GitHub `production-backup`, con revisión durante el alta. Nunca pegar secretos en Git, issues, logs o comandos visibles.

Secretos:

- `BACKUP_PG_HOST`, `BACKUP_PG_PORT`, `BACKUP_PG_USER`, `BACKUP_PG_PASSWORD`.
- `BACKUP_ENCRYPTION_KEY`: 32 bytes aleatorios en base64. Guardar copia independiente segura; perderla impide recuperar los backups.
- `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`; `BACKUP_S3_KMS_KEY_ID` si corresponde.
- `BACKUP_STORAGE_API_KEY` y `BACKUP_STORAGE_READ_TOKEN`: principal dedicado a lectura Storage. Token vigente durante la captura, nunca un token de cliente comercial. No otorgar upload/update/delete ni RPC comerciales.

Variables: `BACKUP_ENABLED=false`, `BACKUP_STORAGE_URL`, `BACKUP_S3_ENDPOINT` (HTTPS sin credenciales/query), `BACKUP_S3_BUCKET`, los tres prefijos, `BACKUP_S3_REGION`, `BACKUP_S3_ADDRESSING_STYLE` (`path`/`virtual`/`auto`), `BACKUP_BUCKET_PRIVATE_CONFIRMED`, `BACKUP_S3_VERSIONING` (`required`/`unsupported`), `BACKUP_S3_POLICY_STATUS` (`required`/`unsupported`), `BACKUP_RETENTION_WEEKS` (8 por defecto, 4–52), `BACKUP_S3_SSE` (`AES256`/`aws:kms`/`client-only`). `unsupported` solo después de revisión privada del equivalente del proveedor.

El origen productivo exige exclusivamente `groyjvbtcuhjbltmmdfl`, su URL Storage exacta, host DB directo oficial o pooler de sesión cuyo usuario corresponda al ref, TLS `verify-full` y CA válida. Rechaza la Supabase antigua y pooler transaccional 6543. No desactivar TLS para conseguir una conexión.

## Permisos mínimos

PostgreSQL: principal dedicado de lectura, CONNECT/USAGE y SELECT completo sobre tablas/secuencias presentes y futuras en los cuatro esquemas. Debe leer filas protegidas por RLS; `pg_dump` debe fallar antes que producir una copia filtrada. Revisar con Supabase el acceso íntegro sin escritura, administración ni EXECUTE comercial. `default_transaction_read_only=on` complementa, pero no sustituye, los permisos.

Storage: token dedicado con SELECT sobre los objetos de todos los buckets de negocio; la enumeración utiliza la conexión DB de lectura. Revisar RLS y renovación del token. Las claves service-role locales del harness son exclusivamente sintéticas: no constituyen recomendación de privilegios para producción. No crear roles/policies remotos en esta rama.

S3: principal dedicado a **los tres prefijos**, ListBucket condicionado a ellos, GetObject/PutObject/DeleteObject, GetBucketAcl/GetBucketPolicyStatus/GetBucketVersioning; AbortMultipartUpload y ListMultipartUploadParts si los exige el proveedor. No `s3:*`, administración del bucket, ACL públicas, eliminación de bucket ni DeleteObjectVersion. Con KMS, solo cifrado/descifrado de esa clave. Eliminar permisos de APIs declaradas unsupported solo tras revisión.

## Retención coordinada

Ocho generaciones completas verificadas por defecto, configurable 4–52. Una ejecución manual también cuenta como copia. Solo se cuentan marcadores conjuntos autenticados, con DB, manifest y **todos** los objetos descargados/verificados de nuevo. Si una copia falla, se detiene antes de cualquier eliminación. Un DB nuevo sin Storage válido nunca cuenta.

Se eliminan únicamente generaciones anteriores a la nueva, fuera de las copias retenidas. Primero se retira su marcador, luego sus objetos exactos, manifest y dump. Archivos ajenos, generaciones incompletas y antiguos dumps DB-only quedan intactos. No borrar huérfanos automáticamente para ocultar errores.

Con versionado, DeleteObject crea delete markers; versiones anteriores requieren política adicional supervisada. No activar lifecycle que elimine la última copia válida. Revisar costes de GET/transferencia y duración: se verifican varias generaciones enteras. Un timeout no convierte una generación incompleta en recuperable. El límite del job es seis horas; dimensionar runner/almacenamiento y ventana después de conocer el volumen real. Un run verde certifica integridad de copia, no conectividad/privacidad de un proveedor todavía no probado.

## Alcance de recuperación

- Public: tablas/datos/secuencias/funciones/triggers/constraints/índices/RLS/policies/grants.
- Auth: usuarios, identidades y demás datos del esquema. Restaurar sobre versión compatible de la plataforma, con sus roles y extensiones; no recrear estructura interna Auth arbitrariamente.
- Storage: buckets, metadata/policies en DB **y bytes en el manifest separado**. [Esquema oficial Storage](https://supabase.com/docs/guides/storage/schema/design).
- Historial: `supabase_migrations`.
- Fuera: secretos/contraseñas de roles, configuración de proyecto/SMTP/OAuth/JWT, certificados, Vercel, otros esquemas y jobs pg_cron. Mantener inventario privado separado. Recrear supervisadamente `anabelle-expire-unreported-orders` después de recuperación; no reejecutar su migración completa ni activar tareas/correos automáticamente.

## Restauración exclusivamente LOCAL/desechable

1. Obtener en un directorio privado fuera de Git el marcador semanal, dump, manifest y objetos cifrados; confirmar SHA-256 y autenticación GCM. Usar un principal S3 separado de lectura para recuperación. Nunca descargar `.env`.
2. Crear Supabase LOCAL vacío, de versiones compatibles, sin migraciones de negocio ni seed. Confirmar localhost, `public`, `auth.users`, buckets/objetos e historial vacíos. No activar emails externos/jobs.
3. Establecer variables solo en sesión privada: `BACKUP_MODE=local`, `PGHOST=127.0.0.1`, puerto DB local, `PGDATABASE=postgres`, credenciales locales, `RESTORE_DISPOSABLE_LOCAL=YES` y clave de descifrado. Ejecutar `node supabase/backup/restore-local.mjs <dump.enc>`. Guardias rechazan remoto y datos existentes. Se importan pre-data/datos/post-data sobre estructura de plataforma compatible; defaults se neutralizan **antes** de crear objetos para preservar ACL privados.
4. Restaurar Storage con `restore-storage-local.mjs`: URL/API key/token del **destino LOCAL**, `RESTORE_STORAGE_LOCAL=DISPOSABLE_LOCAL`, los tres prefijos y acceso protegido de lectura S3. Ejecutar `node supabase/backup/restore-storage-local.mjs <key-del-marcador.complete.enc>`. La URL destino debe ser localhost; nunca productiva. Preflight valida manifest y todos los archivos antes de subir, compara buckets/rutas con la DB restaurada, sube por streaming y vuelve a descargar cada objeto para SHA-256/tamaño. Compara inventario final; rechaza objetos extras/faltantes. Las herramientas no modifican archivos origen.
5. Recuperación sin proveedor: `local-archive-transport.mjs` permite verificar/restaurar el mismo formato desde un directorio privado descargado; `qa-weekly-storage-local.mjs` muestra el procedimiento sintético. No es prueba de S3 real.
6. Comparar datos/tablas/secuencias/funciones/RLS/policies/grants con snapshot; comprobar login Auth real y permisos privados RPC. Verificar cada referencia de imágenes/QR contra bucket/ruta del manifest y descargar los objetos. URLs persistidas conservan el host original: adaptar solo después de comparar, antes de habilitar clientes, sin reemplazos silenciosos para aparentar equivalencia. Upload puede renovar versión/timestamps Storage; identidad bucket/ruta y bytes deben coincidir.
7. Si falla, conservar evidencia privada y descartar el laboratorio parcial. No parchearlo para declarar restore exitoso. Nunca restaurar contra producción.

Herramientas aceptadas de DB: `local-backup.mjs`, `restore-local.mjs`, `pg-tools.mjs` usan clientes oficiales nativos o contenedores `supabase_db_NOVA-LOCAL-*`, solo Docker Desktop local. Restore carga Auth/ACL con supabase_admin LOCAL y conserva propietarios; con cliente nativo requiere password local protegido. `storage-local.mjs` sigue siendo helper limitado (5 MB/64 MB/5.000 objetos); **no** se usa por el backup semanal productivo.

Prueba real de proveedor, IAM/políticas/SSE/versionado y ejecución semanal siguen pendientes: el calendario permanece desactivado. No se afirma que producción ya esté respaldada. [pg_dump oficial](https://www.postgresql.org/docs/17/app-pgdump.html), [descarga Storage oficial](https://supabase.com/docs/guides/storage/management/download-objects).
