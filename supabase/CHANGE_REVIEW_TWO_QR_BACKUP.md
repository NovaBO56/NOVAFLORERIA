# Dos QR y backup — cierre LOCAL del 12 de octubre de 2026

Rama `codex/weekly-backup-two-qr`, base `b50cbf2139e1d125b6b67fd9be5cda84ba7a6dc4`. Sin merge, deploy, SQL remoto, bucket real ni cambios de credenciales productivas. La rama sigue excluida de deploys automáticos y el calendario de backup DESACTIVADO.

## Infraestructura

Docker 29.8.2 respondió tras cerrar exclusivamente procesos Docker Desktop y su distro WSL docker-desktop; el reinicio limpio había fallado. Se observaron seis laboratorios/72 contenedores simultáneos y unos 210 MB de RAM libre. Se detuvieron los contenedores sin eliminar ninguno ni sus volúmenes; luego se levantaron servicios mínimos. El log tenía menciones OOM: presión de memoria es la causa probable, no una atribución definitiva. No se cambió código para resolver Docker.

Laboratorios sin project-ref: origen API/DB localhost 59621/59622; replay/delta 60621/60622; restore 61621/61622. App QA localhost:3114 detenida después de probarla. Laboratorios anteriores conservados con servicios detenidos.

## Resultados reales

| Prueba | Resultado |
|---|---|
| Replay diez migraciones + seed, 60622 | PASS, exit 0 |
| Delta nueve migraciones + QR antiguo sintético + décima | PASS: mismo ID, ruta, URL de imagen, etiqueta, estado y created_at; un registro; qr_1 |
| ISOLATED_SECURITY_TESTS.sql / TWO_PAYMENT_QR_TESTS.sql | PASS PostgreSQL real; ambos con rollback |
| HTTP/Auth | 49 comprobaciones PASS; admin, empleado, normal/inactivo y anon; sin mocks |
| Navegador | 390/768/1280 reales: QR1 solo, QR2 solo, ambos y total cero; sin overflow; QR2 persiste tras recarga; otra compra limpia selección |
| Pago manual | QR1 confirmado HTTP; QR2 rechazado; cliente/consumo solo tras confirmación, sin duplicados; snapshot en auditoría/seguimiento y recibo posterior |
| Pedido gratuito | HTTP y navegador: confirmado, total cero, sin QR ni pago |
| Backup DB | PostgreSQL custom cifrado AES-GCM; manifest/tamaño/SHA-256 privados |
| Restore DB | Exit 0; 72 tablas con conteo y SHA-256 iguales al snapshot; once grupos de esquema/ACL/secuencias iguales |
| Storage | Bundle cifrado separado; dos imágenes restauradas y descargadas con SHA-256 idéntico; ID/bucket/rutas preservados |
| Auth restaurado | Login real del admin sintético PASS; usuarios, identidades, hashes/sesiones presentes incluidos |
| Calidad | 483 tests/35 archivos; lint 0 errores/0 warnings; tsc/build PASS; secret scan sin hallazgos; legacy 39/39 intactas |

HTTP cubrió ausencia de QR, QR1/QR2 únicos, ambos, inactivos no expuestos, etiquetas/bytes, selección, teléfono incorrecto, UUID inexistente, reintento, cambio posterior de QR bloqueado y rechazo liberando reservas. No se alteró el rate limit: el harness alcanzó 429 (5 intentos/5 minutos), se esperó el vencimiento natural y se reanudó. Fue una incidencia del harness.

En navegador “Ya pagué” dejó pago pendiente y enlace WhatsApp con `Pago reportado mediante: TEST HTTP qr_2`, target `_blank` y envío manual. La integración no expuso la ventana emergente automática: apertura externa efectiva pendiente en navegador convencional. No se envió WhatsApp real. Sin errores de consola observados. Una captura falló por la herramienta; otras se guardaron fuera de Git.

## Defectos corregidos exclusivamente en herramientas candidatas

1. Guardia de restore exigía historial ausente en plataforma vacía: ahora detecta su existencia e importa estructura cuando falta.
2. Postgres local no es superusuario: triggers Auth y DEFAULT ACL de otros roles fallaban. Datos/post-data usan supabase_admin LOCAL; negocio conserva propietarios postgres.
3. psql elegía base supabase_admin al cambiar de rol: ahora explicita postgres.
4. Defaults de plataforma ampliaban ACL, incluso EXECUTE del RPC privado para anon. Ahora se neutralizan defaults antes de crear objetos y se aplican ACL del archive. Se reconstruyó destino tras cada fallo. Resultado efectivo: report_payment_qr anon=false, authenticated=false, service_role=true.

No se parcheó una restauración parcial para presentarla como exitosa. No cambió código comercial ni ninguna de las diez migraciones, seed o legacy en este cierre. Cambios limitados a herramientas QA/backup, tests y documentación.

## Datos y límites

Snapshot final: productos 2, clientes 3, pedidos/items 6/6, pagos 3, insumos/lotes 2/2, movimientos inventario 5, reservas 6, promociones 1, configuraciones QR 2 y perfiles 4. Caja sesiones/movimientos y devoluciones tienen cero filas: se compararon estructura y contenido vacío, sin afirmar prueba positiva de registros en esos módulos. Datos sintéticos TEST/000...; resultados, claves, dumps, credenciales y capturas privados fuera de Git. No se borraron automáticamente esos registros. Evidencia delta capturada antes de reconstruir ese laboratorio desechable para replay.

Auth/Storage usan estructura compatible provisionada por Supabase. SMTP/OAuth/JWT/secret keys, roles/passwords PostgreSQL, otros esquemas y jobs pg_cron requieren recuperación separada. URLs públicas conservan host de origen: revisar cambio al recuperar en otro proyecto. Datos se compararon antes de login/upload, que actualizan timestamps/sesiones/versión Storage.

S3 preparado por variables: endpoint, región, bucket, prefijo y access/secret key protegidas; privacidad, cifrado previo, verificación por descarga y retención posterior. Privacidad/versionado/IAM/upload/retención reales del proveedor NO probados. Pendiente elegir proveedor, aprobar variables/permisos y automatizar copia independiente productiva de archivos. No declarar recuperación productiva completa ni activar calendario. Detenerse para revisión sin merge/deploy.

Una repetición final de Vitest dentro del sandbox no llegó a ejecutar tests: 35 errores EPERM de realpath sobre node_modules. Se repitió con acceso local autorizado y pasaron 483/483; no se cambió código para resolverlo. Permanece el aviso preexistente de deprecación CJS de Vite; lint sigue en 0 warnings.
