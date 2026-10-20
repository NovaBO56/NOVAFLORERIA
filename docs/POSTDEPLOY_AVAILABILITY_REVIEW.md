# Disponibilidad de inventario y textos públicos

Base publicada y master al iniciar: `ba5654f1939ca71bbb0753cf42cd23269e8613bb`.
Trabajo en `codex/inventory-refunds-dashboard-2`. Sin push, merge, deploy ni SQL productivo de escritura.

El catálogo y el detalle devolvían indicadores almacenados, sin consultar capacidad de fabricación ni reservas. El RPC de pedidos ya bloquea insumos y comprueba demanda acumulada antes de reservarlos. El diagnóstico productivo detallado queda privado fuera de Git; no se copian catálogos, clientes, claves ni snapshots remotos a este informe.

## Contrato de la corrección

- Migración nueva `20261020000100_product_inventory_availability.sql`. Añade una consulta `STABLE`, sin escrituras, ejecutable únicamente por `service_role`. Amplía únicamente la lista de rutas permitidas del limitador existente; conserva sus cuotas, bloqueo y permisos.
- Una única sentencia calcula receta base y opciones elegidas, mínimo entre stock contable y lotes, reservas vigentes y, para el carrito/combos, demanda conjunta por insumo. No divulga recetas, IDs de insumos, lotes ni reservas.
- Capacidad individual no significa capacidad simultánea de todos los productos: pueden compartir materiales. El modo combinado comprueba esa diferencia.
- Se conservan las restricciones comerciales manuales `is_active`, `is_available` y `is_sold_out`. El agotamiento automático se proyecta al responder, sin escribir esos indicadores. Reponer stock recupera automáticamente el agotamiento calculado, pero no quita una desactivación o bloqueo manual deliberado.
- Catálogo, destacados y promociones se actualizan cada 30 segundos cuando la página está visible, y al volver a ella. Carrito y checkout incluyen cantidades y opciones. El detalle también comprueba disponibilidad al agregar.
- La creación del pedido sigue siendo la validación transaccional definitiva. Una lectura previa nunca garantiza existencias indefinidamente. Los reintentos inciertos conservan su clave y no confunden su propia reserva con stock ajeno.
- Ante error de lectura no se inventa capacidad. La nueva API devuelve error público sin diagnóstico interno; no crea pedidos.
- Mensajes de revisión, resumen, promociones y seguimiento usan lenguaje para clientes. El reporte de pago sigue pendiente hasta revisión manual; QR, precios, horarios y lógica de inventario no cambian.

## Evidencia LOCAL

- 28 comprobaciones SQL/RPC/Auth reales y 18 HTTP distintas, con fixtures `TEST AVAIL` y teléfonos sintéticos. Un error inicial de tipo de personalización pertenecía al fixture y se corrigió sin borrar datos. La primera prueba HTTP detectó la lista de rutas del limitador incompleta; se corrigió en la nueva incremental y el mismo caso pasó después. Se conserva la evidencia de ambos intentos privadamente.
- Casos: stock suficiente/insuficiente, inactivo, receta incompleta, última reserva, consumo tras confirmación, cancelación, merma, reposición, desactivado tras reposición, dos pedidos simultáneos por una unidad, opciones, combo compartido, promoción agotada, APIs coherentes y reintento idempotente.
- Dos solicitudes simultáneas contra la última unidad: una reserva ganadora y un rechazo; sin stock/lotes negativos, consumo doble ni reservas duplicadas. El pedido pendiente no materializa cliente ni consume definitivamente inventario.
- Comparación exacta de los productos, pedidos e inventario preexistentes durante la suite RPC: sin cambios. Los fixtures nuevos permanecen identificados en informes privados; no se borraron automáticamente.
- Navegador real: carrito a checkout, revisión, agotamiento mientras el checkout estaba abierto y recuperación tras cancelar la reserva sintética. Confirmación deshabilitada y aviso accesible durante el agotamiento. No se envió el formulario de compra desde el navegador.
- Vista móvil 390 y escritorio 1280: inspección visual y capturas; a 768 se comprobó ancho DOM/layout. La captura de 768 presentó recorte del navegador integrado, por lo que no se certifica visualmente toda esa vista. Sin overflow horizontal medido en esas anchuras.
- Replay final: instancia Supabase LOCAL nueva `NOVA-LOCAL-AVAILABILITY-REPLAY`, primeras 13 migraciones oficiales más seed sin cambios. `ISOLATED_SECURITY_TESTS.sql` y `TWO_PAYMENT_QR_TESTS.sql` pasan y revierten sus fixtures.
- Antes del replay final, un intento de harness en una base secundaria falló por prerrequisitos de plataforma incompletos y por la restricción de `pg_cron` a la base `postgres`. No se modificó ninguna migración histórica para ocultarlo; el replay final usa aprovisionamiento oficial Supabase en una instancia separada.
- Definiciones y ACL de la consulta nueva y el limitador: idénticas entre delta LOCAL y replay limpio. Las definiciones productivas existentes de pedido, consumo de reservas, entradas y mermas coinciden con las probadas, comprobado solo por lectura, sin invocar operaciones comerciales en producción.

## Checks finales y archivos

`npm test`: 660/660, 54 archivos. `npm run lint`: 0 errores y 0 warnings. `npx tsc --noEmit`: correcto. `npm run build`: correcto, 70 páginas generadas. La advertencia heredada de Vite sobre su API CJS aparece en Vitest, no es un warning de ESLint. Un error de tipado en la nueva tabla de casos de test se corrigió y se repitieron los checks.

Secret scan estático de patrones sobre archivos versionables: sin hallazgos; no sustituye un servicio externo de detección. `git diff --check`: correcto. Los 39 legacy conservan los SHA-256 publicados; las doce migraciones anteriores y seed no cambian.

Archivos de implementación:

- `supabase/migrations/20261020000100_product_inventory_availability.sql`
- `src/lib/public/product-availability.server.ts`, `src/lib/public/types.ts`, `src/lib/rate-limit.ts`
- `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`, `src/app/api/products/availability/route.ts`, `src/app/api/promotions/route.ts`
- `src/components/public/home/cart.tsx`, `home/home-page.tsx`, `home/product-detail.tsx`, `home/promotion-section.tsx`
- `src/components/public/checkout-form.tsx`, `checkout-page.tsx`, `order-summary.tsx`, `promotion-chooser.tsx`

Tests, herramientas y documentación:

- `__tests__/product-availability-api.test.ts`, `certification-round-two-api.test.ts`, `public-promotions-api.test.ts`, `rate-limit.test.ts`
- `scripts/qa-product-availability-local.mjs`, `qa-product-availability-http-local.mjs`, `qa-availability-replay-local.mjs`
- `supabase/README.md`, `supabase/MIGRATION_STATE.md` y este informe.

## Publicación pendiente

Requiere revisión y autorización nuevas. Aplicar primero únicamente la incremental 13 y verificar ACL/consulta; publicar después el código que depende de ella. Desplegar el código sin esa función hará fallar las lecturas que requieren disponibilidad, en vez de mostrar datos inventados. No ejecutar baseline ni seed sobre producción. No se ha medido carga productiva ni se crearon pedidos productivos para este diagnóstico.

Los artefactos privados de QA permanecen bajo el laboratorio existente de Windows, fuera del repositorio. Las capturas se entregan aparte. La evidencia automatizada no sustituye la revisión visual del propietario.
