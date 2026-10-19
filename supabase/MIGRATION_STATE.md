# Estado vigente de Supabase

La fuente oficial es supabase/migrations/ y supabase/seed.sql. En esta rama hay diez versiones de la base productiva de referencia y dos candidatas incrementales, `20261013000100` y `20261017000100`, probadas solo localmente y pendientes de aprobación productiva. Baseline exclusiva para instancias nuevas/vacías con Auth/Storage; nunca ejecutarla sobre producción existente. Los 39 legacy permanecen byte-idénticos y no se ejecutan.

## Certificación LAB100 local (2026-10-19)

Replay desde cero de 12 migraciones + seed correcto en `NOVA-LOCAL-INTEGRITY` (API 62621, DB 62622), sin `project-ref`. El catálogo público quedó con exactamente 100 productos sintéticos activos y vendibles, recetas completas, imágenes de demostración locales, 12 insumos y 24 lotes conciliados. El fixture conserva registros sintéticos anteriores y desactiva, sin borrar, productos `TEST %` heredados para mantener el total público solicitado.

La preparación registró 50 operaciones LAB50 por flujos comerciales reales: 24 ventas pagadas confirmadas, cuatro pedidos gratuitos, cuatro reintegros monetarios y dos devoluciones físicas entre cinco registros de devolución. Una suite dirigida adicional aprobó 31 comprobaciones HTTP/Auth/concurrencia, incluidas idempotencia de pedido/pago, confirmación concurrente, última unidad, roles, rate limit, Bs 90/90 y Bs 200/50. `DELIVERY_AVAILABILITY_TESTS.sql` aprobó con `ROLLBACK`; el interruptor también se probó mediante HTTP real y no creó un pedido cuando estaba desactivado.

Calidad: 602/602 tests en 48 archivos, lint 0 errores/0 warnings, TypeScript correcto y build Next 69/69 páginas. Secret scan: 419 archivos, 0 hallazgos. Legacy: 39/39 SHA-256. La política del navegador integrado impidió adquirir la pestaña `localhost`; por ello 375/390/430/768/1280/1440 y los flujos visuales no se declaran aprobados en esta ronda. No se consultó ni modificó Supabase remoto durante la certificación local.

## Revisión actual: inventario, reintegros y Dashboard (2026-10-13)

Base Git 05f5338ab117da5b770b462fd120ab06b2006e92; rama codex/inventory-refunds-dashboard-2. Replay local de once migraciones + seed correcto en NOVA-LOCAL-INTEGRITY (62621/62622). Suite: 521 tests en 38 archivos; lint 0 errores/0 warnings; TypeScript y build correctos. Regresiones dirigidas reales: 70 comprobaciones HTTP/Auth/SQL. Tres fixtures SQL con rollback correctos, incluidos seguridad y dos QR. Legacy 39/39; diez migraciones anteriores y seed sin cambios. Detalle y límites en [el informe de revisión](../docs/INVENTORY_REFUNDS_DASHBOARD_REVIEW.md).

Los apartados siguientes son evidencia histórica; sus cifras y referencias a migraciones pendientes describen aquellas rondas, no el estado productivo actual. Esta tarea no consultó ni modificó producción.

## Cadena local

1. 20261007000100_baseline_initial.sql
2. 20261007000200_checkout_public_summary.sql
3. 20261007000300_security_rpc_hardening.sql
4. 20261007000400_backend_concurrency_zero_total.sql
5. 20261008120236_inventory_cash_configuration.sql
6. 20261008180000_production_round_one.sql
7. 20261009000100_guest_customers_secure_receipts.sql
8. 20261009000200_receipt_rate_limit.sql
9. 20261009000300_tracking_rpc_server_only.sql
10. 20261012000100_two_payment_qr.sql
11. 20261013000100_inventory_refunds_sales_ledger.sql (candidata pendiente de autorización productiva)
12. 20261017000100_home_delivery_availability.sql (candidata pendiente de autorización productiva)

seed.sql permanece separado (la CLI local ejecuta los seeds después de todas las migraciones).

Destino validado: NOVA-LOCAL-VALIDATION, API http://127.0.0.1:55421, PostgreSQL localhost:55422, sin project-ref. migrations es una junction al repositorio y seed un hardlink. No se ejecutó SQL remoto, link, db push ni repair.

La migración nueva corrige FIFO de ajustes/mermas y protección de reservas; lotes de ajuste positivo con origen explícito; valores numéricos finitos; apertura de caja serializada y una sesión por caja; bloqueo venta/cierre; devolución monetaria física atómica conservando efectivo/QR; venta gratuita sin pago ni movimiento ficticios; clientes sin duplicados de teléfono y bloqueo únicamente para su alta; QR/WhatsApp atómicos y únicos activos; horarios/configuración válidos; rate limiting serializado privado; trazabilidad sensible y gestión privada de perfiles con protección del último administrador.

create_order(6) y create_payment(uuid) siguen ausentes. create_order(7), create_payment(uuid,text), check_rate_limit, set_checkout_configuration y update_staff_profile son server-only: sin EXECUTE para PUBLIC/anon/authenticated. El checkout público mantiene /api/orders; así no se puede saltar su rate limiting invocando create_order directamente. Helpers internos y triggers no tienen EXECUTE público.

Inventario histórico previo a las últimas migraciones: 35 tablas, 43 funciones públicas, 199 constraints, 77 índices, 2 secuencias, 1 vista, 35 triggers de aplicación/Auth, 86 políticas public y 3 Storage. Las cuatro migraciones anteriores y seed permanecen byte-idénticos a 2ad2be7. Hashes históricos: MIGRATION_REORGANIZATION_AUDIT.md.

## Evidencia histórica anterior a la primera ronda

Replay limpio de las cinco migraciones y seed: correcto. ISOLATED_SECURITY_TESTS.sql: correcto con opt-in y ROLLBACK. Regresión real anterior adaptada al RPC privado: 51 HTTP/RPC, 17 JWT, 17 grupos de concurrencia y 11 promociones, todos correctos. La suite reutilizable remaining-backend-local.mjs pasó sus 127 comprobaciones adicionales de configuración, catálogo/imágenes, FIFO, reservas, devoluciones, efectivo/QR, usuarios, auditoría, notificaciones, reportes y permisos: 223 comprobaciones reales en conjunto, sin fallos. No usa mocks. Credenciales, JWT, informes detallados y manifiestos sintéticos permanecen fuera de Git, en el laboratorio privado.

Calidad final: npm test, 301 tests en 27 archivos; npm run lint, 0 errores y 0 warnings; npx tsc --noEmit y npm run build, correctos. Los tests unitarios usan mocks donde corresponde y se distinguen de las pruebas reales anteriores. El build generó 67 páginas estáticas.

Navegador real contra Next local: personalización, carrito, checkout, pedido normal #43, reporte sintético de pago, confirmación administrativa, preparación/listo/finalizado y seguimiento correctos. Pedido gratuito #50 con promoción 100%, total cero, sin QR, pagos ni movimientos de caja ficticios; preparación/listo/finalizado y seguimiento correctos. Las operaciones administrativas de ambos flujos se ejecutaron mediante HTTP real. En el build de producción conectado exclusivamente al laboratorio, /prueba-cliente y /admin/prueba-ui devuelven 404; /login devuelve 200.

Ejecución de la suite ampliada (Next local debe estar levantado):

~~~powershell
$env:NOVA_LOCAL_LAB = 'C:\ruta\NOVA-LOCAL-VALIDATION'
$env:NOVA_LOCAL_HTTP = 'http://127.0.0.1:3100'
node supabase/tests/remaining-backend-local.mjs
~~~

La suite crea usuarios/filas/archivos sintéticos y guarda sus resultados y rollback en certification/REMAINING_BACKEND.private.json del laboratorio. Se conservaron los fixtures para revisión; los pedidos del navegador y sus IDs están en certification/UI_FLOW.private.json. Restaurar el laboratorio desechable desde cero con supabase db reset --local --workdir <NOVA-LOCAL-VALIDATION> --yes. Esta instrucción no debe usarse contra una instancia con datos reales. El fixture SQL separado revierte sus filas al terminar.

Durante el desarrollo se detectaron y corrigieron un delimitador SQL mal compuesto y una serialización innecesaria por teléfono. Se reconstruyó desde cero después de cada corrección SQL; no se parcheó la base. Un error EPERM del sandbox se resolvió repitiendo la prueba con acceso normal a node_modules. Los mocks de alta/pedido se actualizaron al contrato privado sin retirar aserciones funcionales.

## Validación vigente de la ronda de corrección

Cierre posterior de seguimiento/draft: 358/358 tests (30 archivos), lint 0 errores / 0 warnings, TypeScript y build correctos (69 páginas), suite real guest-receipts 73/73. Replay de nueve migraciones y seed correcto; esquema public idéntico al delta local. Ambos RPC de seguimiento sin EXECUTE para PUBLIC/anon/authenticated, con EXECUTE para service_role; el helper interno conserva ejecución bajo el propietario de SECURITY DEFINER. La API valida y limita antes de consultar privadamente, y falla cerrada ante error del limitador. Entrega sola persiste en el borrador. Las ocho migraciones anteriores y 39 legacy no cambiaron. Nueva cuarta migración pendiente de aprobación productiva: 20261009000300_tracking_rpc_server_only.sql. Los párrafos siguientes conservan la evidencia de la ronda previa.

Ocho migraciones y seed reprodujeron correctamente el esquema desde cero en NOVA-LOCAL-ROUND2-REPLAY (localhost:57621, sin vínculo remoto). El esquema public, incluidos ACL, funciones y políticas, es idéntico al laboratorio actualizado mediante delta tras normalizar exclusivamente las cabeceras aleatorias de pg_dump. No se compararon datos Auth ni archivos físicos de Storage.

Calidad vigente: 355 tests en 30 archivos; lint 0 errores / 0 warnings; TypeScript y build correctos (69 páginas generadas). Regresiones reales HTTP/Auth/RPC/SQL: 34 + 127 + 62 + 16 = 239 comprobaciones, todas correctas. Las pruebas de imágenes fuerzan un fallo de registro para comprobar compensación real de Storage; QR conserva bytes originales. Legacy: 39/39 SHA-256 correctos.

Las migraciones 20261008180000, 20261009000100 y 20261009000200 permanecen pendientes de autorización para producción. Esta ronda añade identidad de invitado inmutable, alta de cliente exclusivamente al confirmar, recibos privados por token y su rate limiting. Los registros históricos no se borran ni se inventa un backfill de identidad.

Detalles, límites, navegación y pendientes: PRODUCTION_ROUND_ONE_REVIEW.md en la raíz. Los informes privados y datos sintéticos están fuera de Git. La auditoría npm de runtime devuelve 0 vulnerabilidades; incluyendo tooling de desarrollo devuelve 14 (3 moderadas, 9 altas, 2 críticas), pendientes de una ronda separada de dependencias.

## Límites

Certificación funcional exclusivamente local y del alcance probado; no autoriza producción. La nueva migración falla ante duplicados/inconsistencias existentes, sin eliminarlos ni repararlos automáticamente. Antes de una reconciliación remota se necesitan inventario actual, backup/restore, plan de datos/historial, ensayo aislado y autorización separada. No se infiere compatibilidad con datos productivos a partir del replay vacío. Capturas antiguas quedan en historial/backup privado, no como segunda fuente SQL.
