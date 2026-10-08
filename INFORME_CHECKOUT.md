# Checkout público NOVA Florería — 7 de octubre de 2026

## 1. Resumen

Implementado el checkout público sobre la arquitectura existente: personalización y tarjeta, carrito persistente, datos de cliente, revisión final, creación mediante el backend real, total definitivo, QR, reporte de transferencia y seguimiento. Se conservó la alternativa de WhatsApp, sin introducir pasarelas ni mocks en producción.

El código compila y sus tests pasan. **No está habilitado de extremo a extremo en el Supabase actual:** falta aplicar la migración 035 y configurar QR y WhatsApp. No se crearon pedidos ni pagos reales durante la verificación.

La interfaz contempla carga, carrito vacío, errores, productos no disponibles, horarios, doble envío y reintentos. El carrito se limpia después de recibir la confirmación de creación; un fallo posterior al recuperar el resumen no vuelve a convertir el pedido creado en un carrito. La recuperación del pedido se guarda en sessionStorage de la pestaña; los reintentos conservan su clave de idempotencia para el mismo contenido.

## 2. Archivos modificados

Modificados:

- `__tests__/rate-limit.test.ts`
- `src/app/api/orders/[id]/payment/route.ts`
- `src/app/api/orders/track/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/login/page.tsx`
- `src/components/public/home/cart.tsx`
- `src/components/public/home/home-page.tsx`
- `src/components/public/home/product-detail.tsx`
- `src/lib/public/cart-logic.ts`
- `src/lib/public/types.ts`
- `src/lib/rate-limit.ts`
- `src/lib/supabase/proxy.ts`
- `src/validations/public-catalog.ts`

Creados:

- `__tests__/checkout-api.test.ts`
- `__tests__/checkout.test.ts`
- `src/app/checkout/page.tsx`
- `src/app/seguimiento/page.tsx`
- `src/components/public/checkout-page.tsx`
- `src/components/public/order-summary.tsx`
- `src/components/public/tracking-page.tsx`
- `src/lib/public/checkout.ts`
- `supabase/migrations/035_checkout_public_summary.sql`
- `INFORME_CHECKOUT.md`
- `AGENTS.md` — generado automáticamente por Next.js al iniciar desarrollo.
- `CLAUDE.md` — generado automáticamente por Next.js al iniciar desarrollo.

Eliminados: ninguno. No se modificaron dependencias, secretos, migraciones históricas ni el diseño global.

## 3. Flujo final

1. El cliente selecciona un producto; en su detalle puede elegir opciones activas y escribir una tarjeta.
2. Agrega una cantidad al carrito. Configuraciones distintas del mismo producto conservan líneas separadas.
3. Al abrir el carrito se refrescan precios y disponibilidad con el catálogo real.
4. Continúa a `/checkout`, accesible sin cuenta.
5. Ingresa nombre y teléfono, elige retiro o entrega por coordinar, agrega dirección/referencia si solicita entrega, notas y una promoción vigente opcional.
6. Revisa los datos y productos. El subtotal del navegador es estimado; descuentos, precios y stock se validan en PostgreSQL.
7. Confirma la creación. La API llama a `create_order` con una clave estable para los reintentos del mismo contenido. El servidor reserva inventario y aplica la promoción.
8. Tras el éxito se limpia el carrito y se consulta el resumen real, incluido el número y el total definitivo del pedido.
9. El cliente paga por el QR configurado y pulsa «Ya transferí: reportar pago». `create_payment` registra un pago pendiente; esta acción no confirma la transferencia.
10. El personal confirma o rechaza el pago desde el panel existente. El cliente actualiza el resumen o consulta `/seguimiento` con número y teléfono para ver el estado.

Si falta QR, se muestra un mensaje para coordinar con la tienda; WhatsApp se ofrece cuando existe un número activo. Si también falta WhatsApp, se indica consultar los datos de contacto de la tienda. La entrega no incluye una tarifa inventada: dirección y método se guardan en `customer_message`, y disponibilidad, horario y costo se coordinan con el negocio.

## 4. Backend reutilizado y auditoría

Proyecto Next.js App Router, React, TypeScript, Zod, Supabase SSR y Vitest. El panel administrativo ya contiene pedidos, pagos, clientes, inventario, promociones, usuarios, caja y reportes; no se reestructuró.

APIs reutilizadas:

- `GET /api/products` y `GET /api/products/[id]`: catálogo, precios y personalizaciones.
- `GET /api/business-hours`: horario y permiso para pedidos fuera de horario.
- `GET /api/promotions`: promociones públicas vigentes.
- `POST /api/orders`: creación real mediante `create_order`.
- `GET /api/payment-qr`: QR y titular configurados.
- `POST /api/orders/[id]/payment`: pago pendiente mediante `create_payment`; ahora verifica teléfono contra el pedido antes del registro HTTP.
- `POST /api/orders/track`: seguimiento, ahora con `track_order_details`.
- `GET /api/whatsapp-config`: alternativa de contacto.
- El panel y las APIs administrativas de confirmación/rechazo de pagos permanecen existentes.

Validaciones compartidas: `createOrderSchema`, `trackOrderSchema` y reglas públicas de horarios/formato. El cliente envía identificadores de opciones, cantidades y texto; no envía precios para que el servidor los acepte.

Hallazgos y correcciones:

- El carrito anterior terminaba en un aviso temporal de WhatsApp: ahora continúa al checkout.
- El detalle ya recibía opciones desde la API pero no las mostraba ni guardaba: ahora se integran en el carrito y pedido.
- La función de creación de la migración 028 perdía personalizaciones, pero la 031 ya corrige precios, duplicados, pertenencia de opciones e inventario de opciones. Se reutiliza la 031, sin reemplazarla.
- `track_order` no devolvía estado de pago ni UUID para recuperar el resumen tras recargar: se añade un envoltorio autorizado por teléfono.
- Las páginas nuevas necesitaban inclusión en la lista pública del proxy para evitar redirección a login.
- El build tenía un bloqueo en `/login` por `useSearchParams` sin `Suspense`: se envolvió el formulario con `Suspense` sin reescribirlo.
- Se agregó límite de consultas de seguimiento y se corrigió la sanitización de cantidades no numéricas del carrito.

## 5. Base de datos

Tablas existentes involucradas: `products`, `product_images`, `product_components`, `customization_options`, `customers`, `orders`, `order_items`, `inventory_items`, `product_inventory_requirements`, `customization_option_inventory_requirements`, `inventory_reservations`, `promotions`, `promotion_products`, `order_discounts`, `payments`, `payment_qr_config`, `whatsapp_config`, `business_hours`, `system_settings` y `rate_limit_attempts`.

Campos del contrato: cliente (nombre/teléfono), líneas (producto/cantidad/opciones/tarjeta), `customer_message`, `idempotency_key`, `promotion_id`; resumen con `order_number`, `status`, `subtotal`, `discount_total`, `total` y `reserved_until`; pago con `amount`, `method` y `status`.

La migración nueva `035_checkout_public_summary.sql` crea únicamente `track_order_details(text, bigint, uuid)`. Valida teléfono contra el cliente del pedido y descarta pedidos eliminados; llama a `track_order` para reutilizar sus campos públicos y añade UUID, vencimiento de reserva y último estado de pago. No devuelve teléfono, nombre del cliente, notas administrativas ni datos de revisión del pago. No abre políticas públicas de lectura sobre pedidos o pagos.

No cambia tablas, columnas, nombres, estados ni firmas existentes de `create_order` o `create_payment`. **La migración está guardada en el proyecto y no se aplicó a la base remota.** Aplicarla después de las migraciones existentes, incluida la 031 y sus dependencias. Desplegar las APIs nuevas junto con esta migración.

## 6. Tests y calidad

- `npm test`: **código de salida 0; 23 archivos, 273 tests aprobados**. Se añadieron 17 tests sobre validación de datos/entrega, carrito vacío, productos no disponibles, personalización, payload sin precios, doble envío, reintento tras error, creación HTTP/RPC, error de stock, QR ausente, reporte de pago pendiente, comprobación de teléfono y seguimiento limitado.
- `npm run lint`: **código de salida 0; 0 errores, 5 advertencias previas**: imports `attachUserNames` sin uso en las rutas administrativas de ajustes, entradas y desperdicio; dos etiquetas `img` en `/prueba-cliente`.
- `npm run build`: **código de salida 0** tras corregir `Suspense` de login. Compilación, TypeScript y generación de las 64 páginas completadas.
- `npx tsc --noEmit`: código de salida 0 durante la implementación; el build final también verificó TypeScript.
- `git diff --check`: sin errores después de normalizar el final del archivo del carrito.

Las pruebas de integración HTTP sustituyen Supabase en el límite del test; no ejecutan compras contra la base remota. En producción se usan exclusivamente las APIs y RPC reales.

Vitest y Next.js inicialmente encontraron restricciones de acceso a archivos de Windows; se repitieron los comandos con autorización fuera del aislamiento. No se instalaron dependencias porque ya estaban disponibles.

Comprobaciones HTTP locales con Supabase real, sin sesión:

| Consulta | Resultado |
| --- | --- |
| `/checkout` | 200, sin redirección a login |
| `/seguimiento` | 200, sin redirección a login |
| `/api/products?limit=1` | 200 |
| `/api/business-hours` | 200 |
| `/api/payment-qr` | 404: sin configuración activa |
| `/api/whatsapp-config` | 404: sin configuración activa |
| Seguimiento con número inexistente | 500; Supabase `PGRST202`: falta `track_order_details` |

La herramienta de navegador no pudo iniciarse por un error de aislamiento de Windows (`CreateProcessWithLogonW`). No se afirma una verificación visual interactiva ni una compra completa en móvil.

## 7. Pendientes

Para habilitar y considerar verificado el checkout completo:

1. Aplicar la migración 035 en el Supabase de destino y comprobar que las migraciones previas necesarias, especialmente 031, están instaladas.
2. Configurar y activar un QR de pago y el número de WhatsApp mediante los módulos existentes.
3. Ejecutar una compra controlada real, revisar el pago desde admin y consultar el seguimiento en móvil.

No se implementa carga de comprobantes porque el contrato público actual registra un pago pendiente sin adjuntos. No se calcula una tarifa de envío porque el modelo existente no la define.

## 8. Riesgos y comprobaciones manuales

- Probar stock compartido de producto y opciones, reservas simultáneas, vencimiento de reserva y consumo de inventario tras confirmar el pago.
- Verificar promociones de producto/combo, mínimos y total definitivo con datos reales. Los precios del navegador son estimaciones; PostgreSQL decide el cobro.
- Validar rechazo y nuevo reporte de pago, y los estados confirmado/en preparación/listo/finalizado/cancelado/rechazado.
- El modelo permite total cero, pero `payments.amount` exige un monto mayor que cero. La interfaz omite la transferencia y pide coordinar la confirmación con la tienda; comprobar el tratamiento administrativo de promociones que produzcan total cero antes de habilitarlas para venta pública.
- La función `create_order` existente comprueba horario antes de recuperar su clave idempotente: probar el reintento de una respuesta perdida cuando la tienda acaba de cerrar. La UI bloquea doble clic y mantiene la clave del mismo contenido; no se afirma haber probado concurrencia contra PostgreSQL.
- El mecanismo público de seguimiento sigue siendo número más teléfono, según el diseño existente; no se añadió autenticación por SMS. La comprobación HTTP de pago no cambia los permisos históricos del RPC `create_payment(uuid)`.
- La recuperación usa sessionStorage de la pestaña y el carrito usa localStorage. Probar recarga, pérdida de conexión y almacenamiento deshabilitado; si falla el almacenamiento se conserva el estado en memoria, pero no su persistencia después de cerrar la pestaña.
- Probar visualmente teclado, lectores de pantalla, Safari/Chrome móvil, imagen QR y su guardado. El control visual automático no pudo ejecutarse en este entorno.

## 9. Siguiente paso recomendado

**Activar y validar el checkout en un Supabase de pruebas:** aplicar la migración 035, configurar QR y WhatsApp y ejecutar una compra controlada con confirmación/rechazo desde admin, stock y seguimiento. Esta es la siguiente tarea prioritaria antes de avanzar a otro módulo.
