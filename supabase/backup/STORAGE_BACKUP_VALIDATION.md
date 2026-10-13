# DB + Storage — validación LOCAL 2026-10-12

Rama `codex/weekly-backup-two-qr`; base de esta ampliación `096f888e2c5053acccc63cfbbe39d8eecf0bf90b`. No se cambió código comercial, API, las diez migraciones existentes ni seed. Master, Supabase productiva/antigua y Vercel no se utilizaron. Calendario bloqueado con `&& false` y `BACKUP_ENABLED=false`.

## Evidencia real

Origen sin vínculo remoto: Supabase LOCAL `http://127.0.0.1:59621`, DB `NOVA-LOCAL-TWO-QR`. Destino restauración vacío independiente: `http://127.0.0.1:61621`, DB `NOVA-LOCAL-TWO-QR-RESTORE`. Replay/fixtures: laboratorio desechable `60621`, `NOVA-LOCAL-TWO-QR-DELTA`.

- Captura usando clientes oficiales PostgreSQL en Docker Desktop local y HTTP real de Storage.
- Dump custom de los cuatro esquemas, cifrado AES-256-GCM y verificado por descarga/hash desde archivo privado externo al repositorio.
- **12 objetos** de todos los buckets existentes, incluidos los dos QR sintéticos y una imagen de producto. Inventario con páginas de **dos** objetos para forzar múltiples páginas; buckets vacíos conservados.
- Manifest NDJSON cifrado: bucket/ruta/tamaño/content-type/SHA-256 original y descriptor cifrado por objeto.
- Restore completo desde cero: **72/72 tablas recuperables** con conteo/fingerprint iguales antes de uploads/login; **12/12 objetos** con tamaño/SHA-256 coincidentes después de restaurar y volver a descargar.
- **3 referencias** (imagen de producto + QR 1 + QR 2) resolvieron a objetos restaurados mediante HTTP LOCAL autenticado.
- Login Auth real con administrador sintético restaurado: PASS. Ninguna contraseña se versionó/imprimió.
- **11/11 grupos de catálogo** equivalentes: columnas, constraints, índices, funciones/propietarios/ACL, RLS/grants, policies, triggers, vistas, secuencias, referencias Storage y permisos RPC de pago privado.
- Replay de **10 migraciones + seed**: exit 0. `ISOLATED_SECURITY_TESTS.sql` y `TWO_PAYMENT_QR_TESTS.sql`: exit 0 y ROLLBACK, en laboratorio vacío, sin mocks.

Destino externo del ensayo: `local-archive-transport.mjs`, directorio privado fuera de Git que almacena exactamente el formato cifrado de producción. **No es S3 real**: no certifica IAM, privacidad, SSE, versionado, multipart, conectividad ni retención en un proveedor. No se ejecutó backup de producción.

La comparación completa inspeccionó también los dos historiales internos de plataforma excluidos deliberadamente por el restore aceptado: `auth.schema_migrations` y `storage.migrations`. El segundo difiere por timestamps de instalación del laboratorio nuevo; no se importó ni parcheó. Las 72 tablas recuperables sí coincidieron. Uploads renuevan metadata Storage y login/sign-out cambia sesiones/audit Auth después de comparar, como comportamiento normal de plataforma.

## Casos probados

| Caso | Evidencia / resultado |
| --- | --- |
| Bucket vacío | Storage real LOCAL + tests: PASS |
| Un objeto | Tests de herramienta con archivos sintéticos: PASS |
| Varios buckets/subcarpetas | Storage real LOCAL: PASS |
| Más de una página | SQL real, páginas de 2, 12 objetos: PASS |
| Mismo nombre en dos buckets | Storage real LOCAL: PASS |
| Archivo vacío / archivo de 6 MB | Storage real LOCAL: PASS; sin límite productivo de 5 MB |
| Rutas Unicode en manifest/cifrado | Tests de herramienta: PASS; plataforma LOCAL rechazó `ñ-flor.png` antes del backup |
| Archivo cifrado corrupto | Test con alteración de bytes, SHA y autenticación GCM: rechazado |
| Manifest alterado | Test con hash exterior recalculado: GCM lo rechaza |
| Objeto faltante | Test: falla, no verificado |
| Fallo de descarga/subida | Inyección de fallo en adaptadores sintéticos: falla, no retención |
| Fallo de subida del manifest | Test: no marcador conjunto ni retención |
| DB nueva + Storage fallido | Test: copia anterior intacta, ningún delete |
| Retención conjunta | Test: 5 generaciones completas → 4 retenidas; huérfano DB intacto |
| Copia completa previa dañada | Test: retención se detiene antes de borrar |
| Inventario cambia | Test: aborta sin marcador/retención |
| Restore bytes diferentes / upload fallido | Test: no devuelve verified |
| Restore remoto / redirect HTTP / prefijos solapados | Guardias de herramienta: rechazados |

Hay **19 tests nuevos** de backup Storage. Sus adaptadores de transferencia son sintéticos; no se confunden con pruebas de proveedor. Los límites locales de la herramienta antigua siguen separados: no se demostró con un dataset >64 MB o >5.000 objetos, pero la herramienta productiva no contiene esos límites. No se hicieron pruebas de carga.

## Incidencias del ensayo

- Primer intento de Vitest en sandbox falló con EPERM realpath de OneDrive antes de ejecutar tests. La suite fuera de esa restricción pasó; no se cambió aplicación por ello.
- El primer fixture Unicode recibió Storage `400 Invalid key`; no se forzó escritura SQL para ocultarlo. Unicode se comprobó en el formato de la herramienta; validación real con esos nombres queda pendiente de una plataforma que los admita.
- El fixture de imagen recibió `415` al usar application/octet-stream en un bucket que exige imágenes. Se corrigió únicamente el fixture a image/png, sin cambiar la validación del bucket.
- El harness inicial comparaba posiciones de UNION ALL sin orden garantizado. Se corrigió a comparar por nombre de tabla y distinguir historiales internos. Se volvió a reconstruir y restaurar desde cero; ninguna DB se parcheó para aparentar equivalencia.

## Calidad y evidencias privadas

`npm test`: **502 tests / 36 archivos**, sin fallos. El aviso existente de deprecación Vite CJS y los stderr de tests de errores deliberados no son warnings de ESLint. `npm run lint`: **0 errores / 0 warnings**. `npx tsc --noEmit`: exit 0. `npm run build`: exit 0, 69 páginas generadas, variables Supabase LOCAL explícitas. Secret scan: sin hallazgos. Legacy: **39/39 SHA-256 idénticos**; SQL activo y seed sin diferencias.

Evidencias/backups/credenciales permanecen fuera de Git en el directorio privado del laboratorio: resultados de captura y restore, comparación de datos/catálogo, errores de fixture y logs privados de reset/replay. No se subieron dumps, imágenes, `.env`, claves ni artifacts GitHub.

Se añadieron únicamente datos sintéticos LOCAL: tres buckets `qa-backup-*` (uno vacío), diez archivos de fixture repartidos en esos buckets y `product-images`, y una referencia `product_images` con alt `TEST BACKUP IMAGE`. Los dos QR previos no se reemplazaron. No se borró el origen. Se recreó únicamente el destino desechable para las pruebas; las copias cifradas privadas quedan disponibles.

## Pendiente antes de activar

Elegir proveedor privado; revisar IAM/RLS de lectura, TLS, SSE, versionado, lifecycle y presupuesto/volumen; configurar variables protegidas sin compartir claves; efectuar un run supervisado y restore LOCAL desde S3 real. Dimensionar disco temporal/tiempo y acordar ventana sin escrituras Storage. La comprobación de inventario no equivale a una transacción atómica DB + Storage ni PITR. Revisar configuración fuera del dump (SMTP/OAuth/JWT/roles/jobs). Solo entonces autorizar activación del calendario.

Esta ronda permite revisar **implementación y recuperación LOCAL**, no afirmar que producción ya tiene backup semanal completo.
