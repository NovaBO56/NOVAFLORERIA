# Backup semanal privado — propuesta pendiente de activación

Esta implementación no ejecuta backups al importarse. El workflow permanece desactivado mientras `BACKUP_ENABLED` no sea exactamente `true`. No se han solicitado claves ni conectado un proveedor S3. No activar ni ejecutar contra producción antes de revisar permisos y realizar la prueba local de restauración.

## Arquitectura

GitHub Actions, fuera de Vercel, ejecutará una vez por semana: domingo 03:00 UTC (sábado 23:00 Bolivia). Usa los clientes oficiales `pg_dump`/`pg_restore` y AWS CLI, sin SDK añadido a la aplicación. Un único dump custom de PostgreSQL toma una instantánea consistente de `public`, `auth`, `storage` y `supabase_migrations`. No incluye `.env`, código fuente ni archivos arbitrarios del repositorio. [Documentación PostgreSQL](https://www.postgresql.org/docs/17/app-pgdump.html).

El dump se cifra por streaming con AES-256-GCM y nonce aleatorio; solo sale el archivo cifrado. Su nombre contiene fecha/hora UTC y sufijo aleatorio. El bucket debe ser privado: bloquear acceso público, no publicar políticas/ACL, no servirlo como sitio web. La confirmación protegida `BACKUP_BUCKET_PRIVATE_CONFIRMED=true` exige revisión previa del proveedor; no sustituye esa revisión. Mantener también cifrado del proveedor cuando lo admita, usando `AES256` o `aws:kms`. `client-only` permite proveedores sin esa API: el contenido sigue cifrado antes de almacenarse.

El script rechaza ACL públicas y exige comprobar `IsPublic=false` mediante la API de políticas, salvo excepción explícita para un proveedor que no soporte esa API y cuya política se revise manualmente. Comprueba versionado (habilitado por defecto), sube, consulta tamaño/metadatos/cifrado y descarga el archivo cifrado para comparar SHA-256. Solo después escribe un marcador de verificación y considera la copia válida. Un fallo no inicia la retención. La comprobación de integridad no sustituye una prueba de restauración.

Retención: ocho copias verificadas por defecto, configurable entre cuatro y 52. En ejecución exclusivamente semanal equivalen a ocho semanas. Una ejecución manual también cuenta como copia. Solo se eliminan nombres reconocidos con marcador previo, siempre anteriores a la copia nueva verificada. Archivos ajenos o incompletos no se eliminan. Con versionado, `DeleteObject` crea un marcador: las versiones anteriores permanecen hasta la política del proveedor. Configurar allí expiración de versiones no actuales con un plazo adicional; no aplicar reglas que borren la última copia válida. La retención de versiones e interrupciones multipart debe configurarse después de elegir proveedor.

## Variables y secretos protegidos

Crear posteriormente un environment GitHub `production-backup`, preferiblemente con revisores obligatorios durante el alta. Nunca pegar secretos en issues, documentación, comandos visibles ni Git. No usar secretos de Vercel ni la service role de la API para PostgreSQL.

Secretos:

- `BACKUP_PG_HOST`, `BACKUP_PG_PORT`, `BACKUP_PG_USER`, `BACKUP_PG_PASSWORD`.
- `BACKUP_ENCRYPTION_KEY`: 32 bytes aleatorios codificados en base64, generados localmente y guardados en un gestor de secretos. Conservar copia independiente segura de esta clave: perderla impide recuperar todos los dumps.
- `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`.
- `BACKUP_S3_KMS_KEY_ID`, solo si se usa KMS.

Variables (no secretos):

- `BACKUP_ENABLED`: dejar ausente/false hasta aprobación.
- `BACKUP_S3_ENDPOINT`: HTTPS del proveedor, sin usuario, contraseña ni query.
- `BACKUP_S3_ADDRESSING_STYLE`: `path` por defecto; `virtual` o `auto` si el proveedor lo necesita. Se configura en un archivo temporal sin credenciales, eliminado al terminar.
- `BACKUP_S3_BUCKET`: nombre privado.
- `BACKUP_S3_PREFIX`: prefijo exclusivo, por ejemplo `nova/database/`.
- `BACKUP_S3_REGION`: región que requiera el proveedor.
- `BACKUP_BUCKET_PRIVATE_CONFIRMED`: true solo después de verificar bloqueo público/políticas.
- `BACKUP_S3_VERSIONING`: `required` por defecto; `unsupported` exclusivamente si el proveedor no implementa versionado. Documentar esa limitación.
- `BACKUP_S3_POLICY_STATUS`: `required` por defecto; `unsupported` solo si el proveedor no soporta la API de estado de políticas y se verifica privadamente su equivalente.
- `BACKUP_RETENTION_WEEKS`: 8 por defecto (cantidad de copias).
- `BACKUP_S3_SSE`: `AES256` por defecto, `aws:kms` o `client-only`.

El guard de origen solo permite el proyecto actual `groyjvbtcuhjbltmmdfl`, mediante host directo oficial o pooler oficial de sesión cuyo usuario corresponda al ref. Requiere TLS `verify-full`; no acepta pooler transaccional 6543. Nunca usar la Supabase antigua. El certificado de Supabase debe ser verificable por el almacén CA del runner; comprobarlo al alta sin desactivar TLS.

## Permisos mínimos

S3: credencial dedicada al prefijo, con `ListBucket` condicionado al prefijo, `GetObject`, `PutObject`, `DeleteObject` para retención y `GetBucketAcl`, `GetBucketPolicyStatus` y `GetBucketVersioning` para las verificaciones habilitadas. Subida multipart puede requerir `AbortMultipartUpload` y `ListMultipartUploadParts` en ese prefijo. No conceder administración del bucket, ACL públicas, eliminación del bucket ni `DeleteObjectVersion`. Con KMS añadir únicamente los permisos de cifrado/descifrado necesarios sobre esa clave. Adaptar el equivalente de estas acciones al proveedor; no conceder `s3:*`.

PostgreSQL: rol dedicado de lectura con CONNECT, USAGE en los cuatro esquemas, SELECT sobre tablas/secuencias presentes y futuras. Debe poder leer íntegramente las tablas protegidas por RLS; `pg_dump` falla si RLS impide una copia completa. Revisar con Supabase cómo dar ese acceso de lectura sin otorgar escritura/administración ni EXECUTE a RPC comerciales. No incorporar el rol a `anon`, `authenticated`, `service_role` o roles propietarios. El script solicita transacciones de solo lectura, pero esto no sustituye los permisos del rol. Estos grants requieren una revisión separada; aquí no se crea el rol ni se ejecuta SQL remoto.

## Qué se conserva y qué queda fuera

- Negocio: tablas, datos, secuencias, funciones, triggers, constraints, índices, RLS, políticas y grants de `public`.
- Auth: datos de usuarios/identidades/sesiones del esquema `auth`, que contienen información sensible y por eso siempre se cifran. La restauración utiliza la estructura Auth de una instalación Supabase compatible, no recrea los objetos internos de plataforma.
- Storage: buckets y metadatos de objetos/políticas, **no los bytes de las imágenes**. Es necesario un respaldo independiente de los archivos de `payment-qr` y cualquier bucket de productos antes de considerar la recuperación completa. [Limitación oficial de backups Supabase](https://supabase.com/docs/guides/platform/backups).
- Historial aplicado: datos de `supabase_migrations`.
- No incluye contraseñas de roles PostgreSQL, configuración del proyecto, SMTP, OAuth, JWT/secret keys, certificados, dominios, variables Vercel ni otros esquemas externos a estos cuatro. Mantener un inventario privado de configuración y roles personalizados. La recuperación presupone roles estándar, extensiones y versiones de Supabase compatibles. No ejecutar migraciones durante la captura.
- Los jobs de `pg_cron` quedan fuera de los cuatro esquemas. En la recuperación local no se activan tareas automáticamente. Después de verificar el negocio, recrear de forma supervisada el job `anabelle-expire-unreported-orders` definido en `20261008180000_production_round_one.sql`; no volver a ejecutar completa esa migración sobre una restauración. Mantener documentada privadamente cualquier tarea adicional futura.

## Ejecución y comprobación

Después de aprobar proveedor/credenciales/restauración, activar `BACKUP_ENABLED=true`. El calendario solo opera en la rama por defecto; esta propuesta en una rama de revisión no lo activa. `workflow_dispatch` permite una ejecución supervisada, con la misma protección y retención. Un run verde requiere dump legible, cifrado, subida y descarga íntegra y marcador confirmado. El job no publica dumps como artifacts GitHub ni imprime diagnósticos de herramientas que puedan contener conexiones. Un run rojo requiere investigación privada; nunca tratarlo como backup válido. Verificar fecha y marcador del objeto privado y mantener alertas del proveedor/GitHub para fallos.

## Restauración exclusivamente LOCAL

1. Descargar el `.dump.enc` y su marcador desde el bucket mediante un proceso privado autorizado; comparar SHA-256 con el marcador antes de restaurar.
2. Crear un segundo laboratorio Supabase **vacío y desechable**, de la misma versión de PostgreSQL/Supabase. Iniciar solamente la plataforma, sin migraciones de negocio ni seed. Deben estar vacíos `public`, `auth.users`, buckets/objetos y el historial de migraciones.
3. Instalar clientes oficiales PostgreSQL de versión compatible. Establecer únicamente en la sesión local `BACKUP_MODE=local`, `PGHOST=127.0.0.1`, el puerto DB del nuevo laboratorio, `PGDATABASE=postgres`, `PGUSER=postgres`, su contraseña local, `RESTORE_DISPOSABLE_LOCAL=YES` y la clave de descifrado desde el gestor privado. No usar `.env` versionado ni pegar estos valores aquí.
4. Ejecutar `node supabase/backup/restore-local.mjs <ruta-absoluta-del-archivo.dump.enc>`. La herramienta rechaza hosts remotos y destinos con datos antes de escribir. Descifra autenticando GCM, filtra el catálogo del dump, restaura pre-data, datos y post-data con ACL; conserva usuarios sin volver a disparar bootstrap de perfiles. No sobreescribe una base con datos. Si falla, conservar evidencia privada y descartar el laboratorio parcial; no parchearlo como prueba exitosa.
5. Comparar conteos y muestras sintéticas, secuencias, funciones/firma/ACL, políticas RLS, triggers, buckets y relaciones Auth/perfiles. Ejecutar las pruebas funcionales solo con datos sintéticos; restaurar los archivos Storage por separado y comprobar sus URLs. No iniciar correos ni mensajes con datos restaurados de producción.

No ejecutar este procedimiento contra producción. La prueba real de subida a un proveedor S3 y la restauración local integral están pendientes hasta completar la revisión y disponer del entorno apropiado. Los tests unitarios de cifrado/retención no se presentan como una restauración de PostgreSQL ni como evidencia de seguridad del bucket.
