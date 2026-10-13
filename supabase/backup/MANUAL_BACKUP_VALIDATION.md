# Backup manual DB — validación LOCAL, 12 de octubre de 2026

Rama `codex/weekly-backup-two-qr`, base de esta simplificación `2bc6e8cf9c70e4e18d9ddc8db7484b47235b56f1`. Decisión del propietario: copia semanal manual de DB desde Windows, sin proveedor externo, automatización ni fotos/imágenes. Los dos QR y el flujo comercial permanecen intactos.

## Comando y salida

`npm run backup:manual` o `node supabase/backup/manual-backup.mjs`, con variables privadas de sesión y `BACKUP_OUTPUT_DIR` absoluto fuera de Git. También acepta carpeta como argumento. No lee `.env` ni imprime passwords/tokens/connection strings/clave de cifrado. Éxito: `Backup manual cifrado creado y verificado correctamente.`

Produce `floristeria-anabelle-<fecha-hora-UTC>-<sufijo>.dump.enc` y el archivo `.dump.enc.verified.json`. Captura los cuatro esquemas con PostgreSQL custom, comprueba TOC, cifra AES-256-GCM, comprueba SHA-256 de la copia persistida y roundtrip antes de crear manifest. Conserva todas las copias, sin retención automática. Clave separada en gestor privado. Datos/Auth/configuración/metadata Storage incluidos; **bytes de imágenes excluidos**. Instrucciones para el propietario y restore: [README.md](README.md).

## Pruebas reales LOCAL

Origen `http://127.0.0.1:59621`, contenedor `supabase_db_NOVA-LOCAL-TWO-QR`; destino vacío desechable `http://127.0.0.1:61621`, `supabase_db_NOVA-LOCAL-TWO-QR-RESTORE`. Ambos sin vínculo remoto.

| Prueba | Resultado |
| --- | --- |
| Nuevo CLI manual | PASS, copia DB real cifrada fuera de Git |
| SHA-256 | PASS, archivo coincide con manifest; roundtrip del cifrado comprobado por herramienta |
| Restore LOCAL vacío | PASS con PostgreSQL oficial; sin parchear destino |
| Datos recuperables | 72/72 tablas coincidentes por conteo/fingerprint, antes de login Auth |
| Auth | Login real del administrador sintético restaurado y sign-out: PASS |
| Catálogo | 11/11 grupos iguales: columnas, constraints, índices, funciones/propietarios/ACL, RLS/grants, policies, triggers, vistas, secuencias, referencias Storage y ACL pago |
| RPC pago privado | `report_payment_qr`: anon=false, authenticated=false, service_role=true |
| Configuración/snapshots QR | Slots qr_1/qr_2 y tres snapshots de pago conservados |
| Replay | Diez migraciones + seed: exit 0, laboratorio vacío 60621 |
| ISOLATED_SECURITY_TESTS.sql | PostgreSQL real, exit 0, ROLLBACK |
| TWO_PAYMENT_QR_TESTS.sql | PostgreSQL real, exit 0, ROLLBACK |

La comparación excluye historiales internos `auth.schema_migrations` y `storage.migrations`, provisionados por la instalación compatible y excluidos deliberadamente por el restore validado. Los demás datos/historial aplicado sí se comparan. Login/sign-out modifica sesiones/audit Auth después de la comparación. Tablas de caja/devoluciones en este snapshot no tienen registros: no afirmar recuperación de datos positivos inexistentes en ese fixture.

No se copiaron bytes Storage en este ensayo. Bucket/ruta/URL/metadata preservados no equivalen a recuperar sus imágenes. Tras perder Storage será necesario volver a subirlas. El flujo de los dos QR se revalidó mediante tests existentes y el fixture SQL real (selección, snapshots, reintentos, confirmación/rechazo manual, exclusión de pago/QR para total cero); no se cambió UI/API/SQL comercial.

## Tests unitarios y calidad

13 tests nuevos de herramienta manual: filesystem/cifrado reales y adaptadores PostgreSQL sintéticos, sin conexiones de DB. Cubren manifest/hash/roundtrip, conservación de copias, host/ref/TLS, pooler de sesión, rechazo de overrides de conexión, rutas dentro de Git/otro repo/junction, dump/TOC fallido sin copia final, credenciales ausentes del manifest y nombres con fecha. Cuatro tests del helper de cifrado/restore conservados; tests exclusivos de transporte/Storage retirados conforme al alcance decidido.

- `npm test`: **493/493 tests**, 36 archivos.
- `npm run lint`: **0 errores / 0 warnings**.
- `npx tsc --noEmit`: exit 0.
- `npm run build`: exit 0, 69 páginas; claves/URL exclusivamente LOCAL por variables explícitas.
- Secret scan: sin hallazgos.
- Legacy: **39/39 SHA-256 intactos**.
- Diez migraciones, seed y código comercial sin diferencias.

El aviso preexistente Vite CJS y los stderr de tests de errores deliberados no son warnings de lint. No se ejecutó backup productivo; la instalación/conexión nativa Windows contra producción queda para ejecución manual del propietario después de revisar acceso/TLS.

## Archivos retirados y conservados

Retirados:

- `.github/workflows/weekly-database-backup.yml`.
- `supabase/backup/weekly-backup.mjs`, `s3-transport.mjs`.
- `supabase/backup/storage-production.mjs`, `restore-storage-local.mjs`, `storage-local.mjs`.
- `supabase/backup/local-archive-transport.mjs`.
- `scripts/qa-weekly-storage-local.mjs`.
- `__tests__/storage-backup.test.mjs`.
- `supabase/backup/STORAGE_BACKUP_VALIDATION.md`, sustituido por alcance vigente y [HISTORY.md](HISTORY.md).

Conservados: `backup-core.mjs` (cifrado/hash/guardia de origen), `pg-tools.mjs`, `restore-local.mjs`, alias LOCAL `local-backup.mjs`, comparador `qa-backup-schema-local.mjs`, harness de dos QR y sus tests/fixture SQL. Agregados: `manual-backup.mjs`, `qa-manual-backup-local.mjs`, `manual-backup.test.mjs`, comando npm y documentación actual. El informe humano previo de dos QR permanece marcado histórico, sin instrucciones de activar la propuesta retirada.

No quedan variables/credenciales de proveedor ni código operativo de backup externo. Configuración estándar de la plataforma Supabase no se cambió: sus opciones Storage internas no son un workflow de backup. El historial Git y las evidencias/backups privados de ensayos anteriores se conservan; no se borraron datos originales ni archivos de imágenes.

## Límites y cierre

La laptop requiere clientes PostgreSQL compatibles, certificado CA válido, rol de lectura completa y espacio temporal privado. Probar periódicamente restore y guardar clave de cifrado separada; perder esa clave impide recuperar los archivos. Dumps cifrados y sus manifests pueden copiarse manualmente a OneDrive/disco externo. Configuración externa/roles/jobs/secretos requiere inventario privado independiente.

Master no cambió. Sin merge, deploy, SQL remoto, backup productivo ni cambios en la Supabase antigua. Se detiene para revisión.
