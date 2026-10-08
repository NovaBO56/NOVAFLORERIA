# NOVA Florería

Aplicación Next.js con catálogo público, checkout, seguimiento y panel administrativo conectado a Supabase.

## Estado local de Supabase

La cadena limpia está activa en `supabase/migrations/`; los 39 originales se conservan en `supabase/migrations-legacy/` solo como evidencia, sin ejecutar. Seeds separados. Ver [documentación Supabase](supabase/README.md) y [estado/verificación final](supabase/MIGRATION_STATE.md). La baseline no debe aplicarse sobre producción existente; reconciliación e historial remoto requieren un plan y autorización separados.

## Operación del backend

El administrador activo configura QR, WhatsApp, horarios por día y pedidos fuera de horario en `/admin/configuracion`. QR acepta PNG/JPG/WebP decodificables de hasta 5 MB, con preview, reemplazo y desactivación. No hay configuraciones bancarias ni números ficticios en los seeds. `/admin/auditoria` muestra trazabilidad administrativa; la cabecera del panel incluye la bandeja compartida de notificaciones.

Pedidos y reportes de pago públicos pasan por las APIs Next.js. Los RPC de creación de pedido y pago son privados del servidor; no se expone su clave al navegador. El servidor necesita `SUPABASE_SECRET_KEY`, además de la URL y clave pública de Supabase. Las escrituras fallan cerradas si falla el limitador; las lecturas pueden continuar. En el despliegue, el proxy confiable debe sobrescribir los headers de IP; no aceptar headers de IP arbitrarios desde Internet. Auth usa además los límites propios de Supabase.

Los ajustes positivos crean lotes con origen en el ajuste; ajustes negativos y mermas consumen lotes FIFO sin tocar stock reservado. Una devolución física restituye el producto completo una sola vez; un reintegro solo devuelve dinero. Ambos respetan el total ya devuelto. Las ventas físicas registran la salida monetaria en una sesión abierta de la misma caja, conservando efectivo/QR; QR no altera el efectivo esperado. Los pedidos online no registran ingresos en caja física: su devolución bancaria requiere operación externa y revisión humana, y este backend no transfiere dinero. Las ventas gratuitas consumen stock y no inventan pagos ni movimientos de caja.

Horarios y límites diarios de reportes/dashboard usan `America/La_Paz`. Los teléfonos identifican clientes según el contrato existente (trim, sin unificación automática de números históricos). No se permite retirar el último administrador activo. `/prueba-cliente` y `/admin/prueba-ui` se conservan como demostraciones para desarrollo y devuelven 404 en producción.

Validación real reutilizable y límites de certificación: [estado de Supabase](supabase/MIGRATION_STATE.md). Credenciales y resultados detallados del laboratorio deben permanecer privados e ignorados por Git.

## Validación y mejoras posteriores

La referencia vigente de las cinco migraciones y sus resultados es `supabase/MIGRATION_STATE.md`. La revisión local pasó 301 tests unitarios, 223 comprobaciones reales de HTTP/Auth/PostgreSQL, replay limpio y pruebas de seguridad SQL. Lint: 0 errores, 0 warnings; TypeScript y build correctos. Los flujos de navegador normal y gratuito llegaron a finalizado y seguimiento.

El inventario inicial de pendientes quedó preservado en el commit `3593596`; se retiró su documento temporal al resolver los P0/P1 identificados. No quedan bloqueos P0/P1 detectados dentro del alcance local probado. Mejoras posteriores: P2, acordar normalización internacional de teléfonos y una métrica neta de ventas/devoluciones adicional al reporte bruto actual; P3, retirar definitivamente las demostraciones de desarrollo o automatizar también los recorridos visuales. No se cambió el contrato existente para tomar esas decisiones.

Los datos de prueba permanecen exclusivamente en `NOVA-LOCAL-VALIDATION`, con manifiestos y rollback privados. Esta certificación local no sustituye revisar los datos, el despliegue/proxy, los respaldos ni el historial de producción antes de autorizar una reconciliación separada.