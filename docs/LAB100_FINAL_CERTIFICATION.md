# Certificación local LAB100 — 19 de octubre de 2026

## Alcance y destino

- Rama: `codex/inventory-refunds-dashboard-2`.
- Supabase usado: `NOVA-LOCAL-INTEGRITY`, API `http://127.0.0.1:62621`, PostgreSQL `127.0.0.1:62622`.
- Laboratorio sin `project-ref`; no se usó Supabase remoto, Vercel ni producción.
- Cadena reproducida desde cero: 12 migraciones activas y `seed.sql`.

## Datos sintéticos

- 100 productos LAB50 activos y vendibles, distribuidos en diez familias.
- Cada producto tiene categoría, descripción de demostración, precio en bolivianos, receta e imagen local.
- 12 insumos, 24 lotes y movimientos conciliados; stock negativo: 0.
- 50 operaciones LAB50: 24 ventas pagadas confirmadas, cuatro pedidos gratuitos, cuatro reintegros monetarios, dos devoluciones físicas y cinco registros de devolución en total.
- Los pedidos ancla 27, 28 y 29 y otros registros sintéticos previos se conservaron.
- Los dos QR locales muestran `NO PAGAR / DEMOSTRACIÓN`; WhatsApp local permanece desactivado.

## Resultados funcionales reales

El preparador repetible validó catálogo, recetas, imágenes, inventario, lotes, caja, reportes, Dashboard, seguimiento, recibo privado, QR, teléfono incorrecto y ausencia de mutaciones sobre pedidos previos. También desactivó y restauró la entrega a domicilio mediante la API administrativa y comprobó que `/api/orders` devuelve 409 sin crear pedido cuando la entrega está pausada.

La suite `scripts/qa-lab100-local.mjs` aprobó 31/31 comprobaciones:

- Auth real de administrador y empleado.
- Páginas públicas y nueve páginas administrativas por HTTP autenticado.
- Permisos de empleado y bloqueo de configuración exclusiva de administrador.
- Catálogo de 100 productos, búsqueda y paginación hasta página fuera de rango.
- Doble creación con la misma clave, doble reporte de pago y confirmación concurrente sin doble consumo.
- Carrera de estado y dos ventas físicas por la última unidad con un solo ganador.
- Venta Bs 90/reintegro Bs 90 = neto Bs 0.
- Venta Bs 200/reintegro Bs 50 = neto Bs 150.
- Reintegro monetario parcial sin restauración física de stock.
- Rate limit real de seguimiento.

`supabase/tests/DELIVERY_AVAILABILITY_TESTS.sql` terminó en `ROLLBACK` y comprobó persistencia, auditoría del actor, valor booleano, bloqueo de entrega, recojo disponible y reactivación. Los fixtures SQL que exigen una base completamente vacía no se volvieron a ejecutar después de poblar LAB100; no se reinició ni se eliminó el laboratorio para forzarlos.

## Calidad

- `npm test`: 602/602, 48/48 archivos.
- `npm run lint`: 0 errores, 0 warnings.
- `npx tsc --noEmit`: correcto.
- `npm run build`: correcto, 69/69 páginas.
- Secret scan: 419 archivos, 0 hallazgos.
- Migraciones legacy: 39/39 SHA-256 coincidentes.

## Limitaciones y control productivo

El navegador integrado rechazó el acceso a la pestaña local por su política de URL. La verificación visual real en 375, 390, 430, 768, 1280 y 1440 px queda pendiente y no se contabiliza como PASS. Las respuestas HTTP, Auth, RPC y SQL sí fueron reales contra el laboratorio.

No se encontró un dump productivo cifrado, verificado y restaurado. Los dumps localizados pertenecen a laboratorios locales de octubre y no prueban recuperación de `groyjvbtcuhjbltmmdfl`. Esta ausencia bloquea migraciones, merge y despliegue productivos hasta crear y verificar un respaldo o recibir una aceptación nueva y explícita del riesgo concreto.
