# Promociones comprables — revisión local, 19 de octubre de 2026

Evidencia de esta primera etapa de promociones. La preparación vigente, pruebas posteriores y compuerta productiva están en [RELEASE_READINESS_REVIEW.md](RELEASE_READINESS_REVIEW.md); las cifras y el estado Git de este informe son históricos.

Rama: `codex/inventory-refunds-dashboard-2`. SHA inicial y final: `0a734db6449186174bab39d0a81d12da9341d309`. Los cambios de esta ronda quedan sin commit, push, merge ni deploy. `master` permanece en `05f5338ab117da5b770b462fd120ab06b2006e92`.

## Diagnóstico previo y contrato conservado

El botón público «Ver productos» era un ancla genérica a `#catalogo`: no seleccionaba promoción, no identificaba participantes ni comunicaba su intención al carrito. El checkout ya estimaba descuentos con `cartPromotion` y enviaba únicamente `promotion_id` al servidor; faltaba conectarlo a la oferta pública.

El modelo vigente contiene `promotions` y `promotion_products`, con un descuento por pedido:

| Modalidad | Soporte real |
|---|---|
| Porcentaje | Solo sobre líneas de productos asociados; incluye sus extras de personalización, como hace el SQL vigente. |
| Monto fijo | Una vez por pedido sobre el subtotal elegible. No puede superar el precio base actual de un participante presente. |
| Combo | Productos y cantidades explícitos, precio base por conjunto completo, tantos conjuntos como permitan las cantidades. Los extras se cobran aparte. |
| Compra mínima | Subtotal completo del pedido antes del descuento; el descuento continúa afectando solo a participantes. |
| Categoría dinámica | No existe. Seleccionar productos de una categoría es una asociación explícita; futuros productos no se incorporan solos. |
| Global dinámica | No existe. Una promoción sin asociaciones es inválida, nunca global. Se pueden asociar productos explícitamente. |
| Vigencia/estado | El API público filtra activo y fechas; el servidor vuelve a validar al crear el pedido. |
| Acumulación | Una sola promoción por pedido; no se suman descuentos entre ofertas. |

`create_order` y `apply_order_discount` siguen siendo la autoridad financiera. `order_discounts` registra el ID de promoción, tipo, valor e importe aplicado; el comprobante existente conserva subtotal, descuento y total. No se añadió un snapshot nuevo ni se cambió el comprobante.

No se necesita SQL para los combos reales existentes. La compra guiada admite componentes enteros de 1 a 99; los combos con cantidades fraccionarias conservan «Elegir productos participantes», sin prometer una compra automática exacta. Añadir reglas dinámicas por categoría/global requeriría una propuesta comercial/SQL y autorización separada; esta ronda no las inventa.

## Implementación

- Carrusel de una oferta a la vez, sin autoplay, con swipe horizontal, flechas, teclado, indicadores accesibles, imágenes reales configuradas e ilustración floral alternativa.
- Producto único: precio base y con descuento cuando se pueden calcular, CTA hacia su detalle y personalización.
- Varios participantes: lista filtrada exactamente a los productos asociados; no se redirige al catálogo general.
- Combo: personalización guiada por componente y adición atómica del conjunto completo usando el carrito existente. Si se exceden límites, no se agrega parcialmente.
- Selección persistente entre tienda/carrito/checkout. Se guarda solo el UUID como intención; ningún precio, descuento, token o secreto.
- El carrito muestra beneficio, mínimo pendiente o componentes faltantes, retira la estimación cuando deja de cumplir y permite quitar la oferta o regresar a ella.
- El mensaje genérico «Comprar por WhatsApp» del carrito distingue subtotal, promoción, descuento y total estimados. El aviso de pago por WhatsApp no se modificó.
- Checkout conserva la selección, ofrece solo descuentos aplicables, muestra subtotal/descuento/entrega/total y vuelve a validar en servidor. Total cero usa el flujo gratuito ya existente.
- El administrador conserva sus APIs; recibe etiquetas más claras, explicación de asociaciones y vista previa informativa conectada al formulario actual.
- No se editaron lógica QR, confirmaciones, inventario, caja, reintegros, ventas, plantillas financieras, migraciones ni seed.

## Pruebas funcionales solicitadas

PASS unitario/markup significa ejecución automatizada, no navegación visual. PASS HTTP significa llamadas reales con Auth/API y lectura de sus efectos en el Supabase local existente `NOVA-LOCAL-INTEGRITY` (`127.0.0.1:62621`).

| # | Caso | Resultado y evidencia |
|---|---|---|
| 1 | Producto único | PASS HTTP y markup: participantes reales y compra hacia detalle. La interacción visual queda pendiente. |
| 2 | Categoría | Sin modalidad dinámica. PASS HTTP de dos participantes explícitos de la misma categoría; no se amplió el modelo. |
| 3 | Global | Sin modalidad global dinámica. No se creó ni se declaró aprobada una promoción global ficticia. |
| 4 | Porcentaje | PASS HTTP: carrito mixto Bs 105, descuento Bs 4,50 solo sobre Bs 45 elegibles, total Bs 100,50. |
| 5 | Monto fijo | PASS HTTP: dos unidades, subtotal Bs 90, descuento único Bs 20, total Bs 70. |
| 6 | Combo válido | PASS HTTP: subtotal Bs 140, descuento Bs 40, total Bs 100; PASS unitario de composición y adición atómica. |
| 7 | Combo incompleto | PASS HTTP: servidor rechaza; PASS unitario: el carrito retira beneficio y explica el faltante. |
| 8 | Compra mínima | PASS HTTP: rechazo por debajo; subtotal Bs 185, descuento Bs 9 y total Bs 176 al cumplir. PASS unitario del progreso. |
| 9 | Vencida | PASS HTTP: ausente del API público y rechazada al intentar usar su ID. |
| 10 | Desactivada | PASS HTTP: ausente y rechazada por el servidor. |
| 11 | Carrito mixto | PASS HTTP y unitario: productos ajenos no reciben descuento porcentual. |
| 12 | Cantidades | PASS HTTP y unitario: recálculo y monto fijo único. |
| 13 | Eliminación | PASS unitario: quitar componente obligatorio invalida combo. Interacción de navegador pendiente. |
| 14 | Personalización | PASS HTTP suplementario: extra Bs 5, subtotal Bs 50, descuento Bs 5, total Bs 45; snapshot y mensaje conservados. |
| 15 | Doble toque | Guardias síncronas implementadas y adición atómica probada. El doble toque real en navegador queda pendiente. |
| 16 | Incompatibles | PASS HTTP: rechazo de un ID de promoción ajena; PASS unitario de selección única/no acumulación. |
| 17 | Descuento en carrito | PASS unitario/markup. Verificación visual pendiente. |
| 18 | Descuento en checkout | PASS unitario/markup del resumen: Bs 150 menos Bs 10 = Bs 140. Verificación visual pendiente. |
| 19 | Registro en pedido | PASS HTTP: subtotal/discount_total/total y fila `order_discounts` con ID e importe exactos. |
| 20 | Comprobante | PASS HTTP/PDF: autorización existente, extracción de importes y revisión del render de la página con los totales. |
| 21 | Total cero | PASS HTTP: confirmado, total Bs 0, sin fila de pago. No se modificó el flujo QR. |
| 22 | Inventario | PASS HTTP/lectura real: sin consumo al reportar; consumo exacto de las recetas solo tras confirmación manual. |
| 23 | Dashboard/reportes | PASS HTTP: mismos importes del ledger compartido para el mismo rango. |
| 24 | Producto elegible | PASS del API público y markup del CTA; navegación visual pendiente. |
| 25 | Volver a la oferta | PASS unitario/markup: vuelve al ID seleccionado. Interacción visual pendiente. |

Se conservaron ocho promociones y siete pedidos sintéticos: #102, #103, #104, #107, #111, #117 y #118, además de una opción extra de demostración con su requisito de inventario. No se borraron productos, promociones ni pedidos anteriores. No se copiaron fixtures a seed o producción. El informe privado conserva también fallos iniciales del helper QA (nombre de tabla y nombre de campo de snapshot), corregidos sin alterar la aplicación ni el esquema.

## Evidencia y límites visuales

La pestaña local del navegador integrado mantiene el bloqueo de política registrado en la ronda anterior. No se intentó eludirlo. No se ejecutaron ni se declaran PASS las resoluciones 375, 390, 430, 768, 1280 y 1440. No hay capturas nuevas de carrusel, carrito ni checkout. Se revisó CSS estáticamente: columnas `minmax(0,…)`, texto con ruptura, imagen contenida, tamaños táctiles de 44/48 px, ausencia de autoplay y soporte de movimiento reducido heredado.

La imagen del comprobante es evidencia PDF, no una captura del sitio. El render conserva los tres importes comprobados. Poppler notificó dos avisos de fuentes auxiliares; los importes revisados se renderizan completos.

## Archivos de la ronda

- `src/app/api/promotions/route.ts`: resúmenes públicos de participantes, con lista explícita de campos y sin datos internos.
- `src/components/public/home/promotion-section.tsx`, `sections.tsx`: carrusel y ofertas comprables.
- `src/components/public/home/home-page.tsx`, `product-detail.tsx`, `cart.tsx`: selección, personalización guiada, carrito y regreso a oferta.
- `src/components/public/promotion-cart-summary.tsx`: beneficio y progreso contextual.
- `src/components/public/checkout-page.tsx`, `checkout-form.tsx`: continuidad y resumen contextual.
- `src/lib/public/promotion-selection.ts`, `promotion-shopping.ts`, `cart-logic.ts`, `types.ts`: intención persistente, condiciones y adición atómica.
- `src/components/admin/promotions/promotion-management.tsx`, `src/app/globals.css`: presentación y controles.
- `__tests__/public-promotions-api.test.ts`, `promotion-shopping.test.ts`, `promotion-selection.test.ts`: whitelist, reglas, markup y persistencia.
- `scripts/qa-promotion-shopping-local.mjs`: regresión local aditiva; credenciales/resultados solo en archivos privados externos.
- Este informe.

## Calidad y estado Git

| Control | Resultado final |
|---|---|
| `npm test` | 619/619 tests, 50/50 archivos. Incluye 17 tests añadidos respecto a la base de 602. |
| `npm run lint` | 0 errores, 0 warnings. |
| `npx tsc --noEmit` | PASS. |
| Build con variables privadas LOCAL | PASS, 69/69 páginas. |
| Secret scan | 428 archivos, 0 hallazgos. |
| Legacy | 39/39 SHA-256 coincidentes. |
| `git diff --check` | PASS. |

El helper de integración registra 33 comprobaciones distintas finalmente aprobadas; conserva una anotación inicial de personalización incompleta que quedó cubierta por la ejecución suplementaria real posterior. También conserva cronológicamente la expectativa equivocada sobre `unit_price`, corregida a `unit_price_snapshot`; no fue una falla del pedido, cuyos importes siempre fueron correctos. No se presenta ese historial como una ejecución perfecta a la primera.

Vitest imprime un aviso existente sobre la API CJS de Vite y salidas de errores simulados por pruebas; no son warnings de ESLint. No hay migraciones nuevas o modificadas; tampoco cambios de seed. Los cambios permanecen en el árbol de trabajo de la rama indicada y requieren revisión visual antes de publicarse. Ningún acceso o escritura a Supabase remoto ni Vercel.
