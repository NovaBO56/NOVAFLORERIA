# Dos QR y backup semanal — revisión del 12 de octubre de 2026

Rama: `codex/weekly-backup-two-qr`, desde master `b50cbf2139e1d125b6b67fd9be5cda84ba7a6dc4`. La rama está excluida de deployments automáticos en `vercel.json`. No merge, deploy, SQL remoto, cambio de credenciales ni conexión a bucket real. La propuesta **no está certificada integralmente**: falta cerrar las pruebas enumeradas abajo.

## Cambios propuestos

- Nueva incremental `20261012000100_two_payment_qr.sql`. No modifica los nueve archivos anteriores ni seed/legacy. Convierte filas QR existentes en `qr_1` por columna default, conservando ID, ruta e imagen; permite un QR activo por slot.
- Admin configura imagen, etiqueta y activación de cada QR; conserva historial de imágenes. Cliente elige entre activos. Elección en sessionStorage acotada al pedido; se limpia al comenzar otra compra.
- RPC privado `report_payment_qr` envuelve el contrato privado existente de pago, usando sus validaciones/bloqueos. Almacena slot, etiqueta del servidor e ID de configuración en el pago pendiente. Un error posterior revierte íntegramente la transacción. Reintentos conservan el mismo pago y snapshot; cambiar el QR ya reportado requiere intervención de tienda. No confirma pagos, crea clientes ni consume stock por la elección.
- WhatsApp incorpora etiqueta devuelta por servidor. El cliente sigue enviando manualmente; admin confirma/rechaza manualmente. El snapshot aparece en seguimiento, panel de pedidos y presentación de auditoría. Pagos anteriores permanecen sin QR conocido; no se inventa retrospectivamente.
- Backup candidato en `supabase/backup/`, calendario GitHub desactivado por defecto. S3 privado configurable, cifrado AES-GCM antes de subir, verificación por descarga/SHA-256 y retención posterior. Detalles y exclusiones de Auth/Storage/cron en su README. No se necesita elegir proveedor ahora.

## Evidencia confirmada

- Replay completo diez migraciones + seed: PASS en laboratorio nuevo `NOVA-LOCAL-TWO-QR`, API localhost:59621, DB localhost:59622, sin project-ref remoto.
- `ISOLATED_SECURITY_TESTS.sql`: PASS PostgreSQL real, rollback.
- `TWO_PAYMENT_QR_TESTS.sql`: PASS PostgreSQL real, rollback. Incluye ACL anon/authenticated, cero/uno/dos QR, selección QR2, etiqueta confiable, teléfono incorrecto, rollback sin QR, reintento sin duplicar, snapshot después de renombrar/desactivar, confirmación/rechazo y pedido gratuito. Se corrigieron errores del fixture (nombre de columna y orden de argumentos), sin parches a la base ni cambios históricos.
- `npm test`: 481/481, 35 archivos. Los cinco tests de backup son locales (cifrado/autenticación GCM, integridad, guards, retención y selección de catálogo); **no prueban S3 ni PostgreSQL restore**. Los mocks HTTP no sustituyen pruebas reales.
- Lint: 0 errores / 0 warnings. TypeScript y build: PASS con variables locales. Secret scan: sin hallazgos. Legacy: 39/39 hashes intactos.
- HTTP/Auth real: cuatro comprobaciones completadas (login admin, login empleado, sin QR público 404, empleado configuración 403). La siguiente comprobación encontró redirección a login para anon; el harness ahora admite la redirección sin confundirla con JSON. Todavía no se ha completado la repetición.

## Incidencia del laboratorio y pruebas pendientes

Al arrancar un segundo laboratorio vacío en localhost:60621/60622, Docker dejó de responder: error 500 de su API y timeouts de Auth/API localhost. `docker desktop restart --timeout 60` también falló al detener sus procesos. Esto impidió continuar y no demuestra un bug comercial.

Pendiente: delta sobre QR antiguo (imagen/ID conservados), batería completa HTTP/Auth, navegador 390/768/1280 con selección tras recarga y WhatsApp, confirmación/rechazo vía HTTP y backup/restore integral en otra plataforma local vacía. Reparar Docker antes de repetir. No usar mocks para declarar esas pruebas aprobadas. No aprobar merge/deploy por este informe.

Los datos creados son exclusivamente sintéticos del nuevo laboratorio: dos usuarios TEST TWO QR, producto TEST TWO QR HTTP PRODUCT e insumo/entrada TEST TWO QR HTTP STOCK. Sus IDs/resultados/credenciales permanecen en AppData privado del laboratorio; no se borraron ni se incluyeron en Git. Las pruebas SQL se revirtieron. La plataforma delta puede estar parcialmente arrancada; no contiene datos de negocio reales ni vínculo remoto.

S3: no hay proveedor ni variables protegidas configuradas, no hubo dump productivo ni subida. El calendario está desactivado. La comprobación real de privacidad, versionado, cifrado del proveedor, permisos mínimos, upload/download y alertas requiere elegir proveedor y aprobación posterior. No solicitar claves por chat. Los archivos de Storage necesitan una copia separada antes de considerar completa la recuperación de imágenes.
