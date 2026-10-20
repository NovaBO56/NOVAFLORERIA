# Floristería Anabelle — dedicatorias, catálogo y carrito completo

Fecha: 20 de octubre de 2026 (America/La_Paz).

Rama: `codex/inventory-refunds-dashboard-2`. Base de esta fase: `13076c696276237e0fb34eb9075e53864030da62`. El SHA de entrega se indica en el informe de cierre; este documento forma parte de ese commit.

## Alcance y límites

Implementación y operaciones exclusivamente LOCALES. No se accedió a ninguna Supabase remota, no se ejecutaron migraciones productivas y no se hizo push, merge ni deploy. Se conserva la corrección de disponibilidad y la migración `20261020000100_product_inventory_availability.sql` sin cambios. No se rehizo el motor de inventario.

Laboratorio poblado: `NOVA-LOCAL-INTEGRITY`, API `http://127.0.0.1:62621`, web `http://127.0.0.1:3116`. Está desvinculado de proyectos remotos. LAB100 y los fixtures anteriores se conservan. El replay final usa otra base vacía, `NOVA-LOCAL-DEDICATIONS-CERTIFIED`, puerto PostgreSQL LOCAL 57622; no resetea el laboratorio poblado.

## Integración entregada

- `inventory_items.is_dedication_card` clasifica expresamente un **insumo** como tarjeta. No se buscan palabras en nombres ni se codifican UUID de pruebas. En `/admin/inventario`, crear/editar insumo permite marcar «Tarjeta de dedicatoria».
- Se reutilizan `product_inventory_requirements` y `customization_option_inventory_requirements`. El servidor obtiene la cantidad de tarjetas de la receta base y de las opciones seleccionadas. La API pública solo revela esa cantidad, sin IDs de insumos, lotes ni recetas privadas.
- Detalle y armado guiado de combos muestran «Una dedicatoria especial» únicamente cuando corresponde. Incluye mensaje de hasta 250 caracteres, firma opcional de hasta 60, contadores, saltos de línea y vista previa lavanda. El texto se representa como texto escapado, nunca HTML.
- Cada tarjeta de cada línea tiene un mensaje independiente. Dos unidades o dos tarjetas por receta generan campos distintos; no se copia silenciosamente el mensaje. Las adicionales empiezan en blanco. Se advierte cuando un cambio de selección excluye textos ya escritos.
- Hay un límite explícito de 198 tarjetas personalizadas por línea. Por encima se explica que debe reducirse la cantidad para escribir mensajes o continuar con tarjetas en blanco; no se inventan mensajes ni se cobra un extra por la tarjeta incluida.
- El carrito conserva y permite editar las dedicatorias en su almacén existente `nova-cart-v1`. El checkout envía esos mismos datos. El snapshot definitivo es `order_items.dedications`, un array ordenado `{message, signature}`. La columna histórica `message` se conserva para lectura de pedidos anteriores; no se crea otra fuente editable del pedido.
- La API administrativa y `/admin/pedidos` muestran el snapshot mediante el mismo componente de lectura, también para el empleado que prepara el pedido. Seguimiento y resumen público conservan los textos bajo las verificaciones de pedido/teléfono existentes.
- Una validación dentro de la transacción de `create_order` rechaza dedicatorias sin tarjeta, cantidades incompatibles, tipos manipulados y límites excedidos. Si se retira la tarjeta de la receta antes del pedido, falla sin crear un pedido parcial. La idempotencia incluye las dedicatorias; cambiar el texto con la misma clave falla.
- Las tarjetas se reservan y consumen con el motor existente. No hay consumo adicional por escribir texto, ni clientes materializados ni consumo definitivo por reportar un pago. El pago sigue requiriendo confirmación manual; los pedidos gratuitos conservan su excepción ya aprobada.
- Los nuevos IDs del cliente usan `crypto.getRandomValues`, evitando depender de `randomUUID` en HTTP LOCAL por Wi-Fi. Siguen siendo UUID v4 y no cambia el contrato de idempotencia.

## Carrito y textos

El panel usa una sola zona de desplazamiento con `min-height: 0`; las promociones quedan al final de ella y el resumen/botón permanecen en un pie que no se encoge. El encabezado tampoco se encoge. No se duplicaron controles.

La lista de productos del resumen del checkout tiene desplazamiento propio, foco de teclado y altura máxima de 42dvh. Los totales quedan fuera de esa lista. Se conserva el espacio de la navegación inferior móvil.

Se revisaron los textos públicos: los rechazos de dedicatoria tienen un mensaje comercial sin SQL/RPC internos. «Nosotros» aclara que la dedicatoria corresponde cuando el detalle incluye tarjeta. No se añadieron historias, fotografías auténticas inventadas, bancos ni datos comerciales ficticios a la configuración real.

## Datos sintéticos preservados en LOCAL

Conjunto nuevo identificado con el prefijo `TEST BO 1792498760065`; definiciones reutilizadas de `scripts/lab50-catalog.mjs`, sin sobrescribir LAB100. Los nombres, descripciones, proveedores y notas identifican el uso sintético.

| Registro | Cantidad de esta fase |
|---|---:|
| Productos con receta válida | 60 |
| Insumos/materiales compartidos | 14 |
| Categoría para filtrar el conjunto | 1 |
| Promociones de prueba | 4 |
| Entradas / lotes | 16 / 16 |
| Mermas | 2 |
| Movimientos de inventario | 26 |
| Reservas, incluyendo sus estados finales | 72 |
| Pedidos, incluyendo venta física y navegador | 22 |
| Pagos registrados por los flujos existentes | 4 |
| Operaciones de devolución/reintegro | 4 |
| Clientes materializados | 1 |

Precios demostrativos entre Bs 35 y Bs 650. Hay ramos de rosas y girasoles, arreglos mixtos, cajas, canastas, cumpleaños, regalos con peluche y combinaciones. Se comparten flores, follaje, envoltura, cinta, cajas, canastas, peluches y tarjetas. Se añadió gypsophila con 3 ramas y mínimo de 10, visible como stock bajo y vinculada a una receta nueva. Las existencias amplias del resto sirven a las pruebas de volumen; no representan existencias ni cotizaciones comerciales reales.

Los 126 productos previos y los registros originales de 14 tablas se verificaron por IDs y SHA-256 de sus filas: conservados. No se ejecutó limpieza automática de productos, pedidos o clientes. En el escenario de cambio de receta se retiró y repuso una relación creada por este mismo fixture; no se alteraron relaciones previas. Los manifiestos con IDs, estados y evidencias detalladas quedan privados fuera de Git, en el laboratorio.

El pedido de navegador **#166** contiene 30 líneas, importe Bs 7.804,50 y aviso por QR2. Permanece pendiente de revisión, sin cliente materializado ni recibo anticipado. Se conserva para inspección; no se hizo pago bancario. Otro carrito de navegador conserva un combo de dos productos por Bs 90 con dedicatoria únicamente en su componente con tarjeta.

## Pruebas reales: 45 escenarios

Los siguientes escenarios usan Auth, HTTP, RPC y PostgreSQL reales LOCALES, sin mocks. Resultado final: PASS en 119 comprobaciones distintas del runner y 35 suplementarias, **154 comprobaciones**. Las suites SQL se contabilizan aparte.

| Nº | Escenario comprobado | Resultado |
|---:|---|---|
| 01 | Admin registra tarjeta clasificada y entradas con lotes FIFO | PASS |
| 02 | Receta con tarjeta habilita; sin tarjeta no habilita | PASS |
| 03 | Dos tarjetas por unidad | PASS |
| 04 | Tarjeta opcional vinculada a su personalización | PASS |
| 05 | Pedido HTTP con dedicatoria multilinea | PASS |
| 06 | Reserva exacta sin consumo físico anticipado | PASS |
| 07 | Sin cliente antes de confirmar | PASS |
| 08 | Empleado lee mensaje y firma exactos por HTTP/Auth | PASS |
| 09 | Seguimiento conserva texto y oculta recibo antes de confirmar | PASS |
| 10 | Producto sin tarjeta comprado sin mensaje | PASS |
| 11 | RPC rechaza mensaje manipulado sin tarjeta, sin pedido parcial | PASS |
| 12 | HTTP rechaza 251 caracteres | PASS |
| 13 | SQL rechaza 251 caracteres | PASS |
| 14 | SQL rechaza firma de 61 caracteres | PASS |
| 15 | Límites exactos 250/60 y Unicode | PASS |
| 16 | Campos vacíos entregan tarjeta en blanco | PASS |
| 17 | Dos tarjetas con mensajes distintos | PASS |
| 18 | Dos unidades exigen entradas independientes | PASS |
| 19 | Combo: texto solo en el componente correspondiente | PASS |
| 20 | Tarjeta opcional reservada sin cargo adicional | PASS |
| 21 | Cambio de receta bloquea texto obsoleto y conserva snapshots anteriores | PASS |
| 22 | Dos submits concurrentes con misma clave devuelven un pedido | PASS |
| 23 | Misma clave con otro texto se rechaza | PASS |
| 24 | QR1 reporta sin confirmar | PASS |
| 25 | QR2 reporta sin confirmar | PASS |
| 26 | Doble reporte reutiliza un pago | PASS |
| 27 | Confirmación manual consume una vez; segunda confirmación falla | PASS |
| 28 | Rechazo libera reservas sin reposición ficticia | PASS |
| 29 | Recibo aparece después de confirmar | PASS |
| 30 | Porcentaje: Bs 55 pasa a Bs 49,50 | PASS |
| 31 | Compra mínima impide promoción no elegible | PASS |
| 32 | Total cero confirmado, sin pago ni QR requerido | PASS |
| 33 | Entrega habilitada y recojo | PASS |
| 34 | Entrega pausada rechaza HTTP/RPC; recojo continúa | PASS |
| 35 | Merma agota tarjetas; peluche sin tarjeta sigue disponible | PASS |
| 36 | Reposición recupera disponibilidad | PASS |
| 37 | Reserva de última unidad excluye otro pedido | PASS |
| 38 | Expiración libera reserva sin consumir tarjeta | PASS |
| 39 | Preparación/listo/finalizado conservan los mensajes | PASS |
| 40 | Reintegros Bs 15 + Bs 40 sobre pago Bs 55 | PASS |
| 41 | Retorno físico separado, sin otro reintegro monetario | PASS |
| 42 | Venta física y devolución con caja | PASS |
| 43 | Reportes ventas/caja/productos/inventario/mermas; ventas concilian en centavos | PASS |
| 44 | Pedidos reales de 1/5/10/20/30 líneas con sus reservas y cancelación de prueba | PASS |
| 45 | Stock/lotes/reservas concilian para todos los nuevos insumos | PASS |

Las comprobaciones suplementarias incluyen ACL real anon/authenticated/service_role, rechazo HTTP 400 de fracciones de tarjeta y clasificación inválida, lectura del pedido #166 por empleado, equivalencia de cinco funciones entre delta y replay, caja física con venta Bs 50 y devolución Bs 50 (neto cero), stock bajo y conciliación final de los 14 materiales. Se comprobó que los bundles del navegador no contienen la service key LOCAL ni referencias a las dos Supabase remotas.

La pausa de entrega se cambió temporalmente solo en LOCAL durante su escenario y se restauró al valor anterior. No se cambiaron horarios, QR ni WhatsApp existentes.

## Navegador real y responsive

- Detalle → mensaje/firma → carrito → edición → recarga → checkout → pedido #166 → selección QR2 → aviso de pago → seguimiento: ejecutado en navegador real LOCAL.
- Combo guiado 1 de 2 / 2 de 2: mensaje en el primer producto; el segundo, sin tarjeta, no muestra campos. Carrito Bs 105 menos Bs 15 = Bs 90.
- Carritos creados mediante controles reales con 1, 5, 10, 20 y 30 productos distintos, con cambios de cantidad y dedicatoria extensa. No se inyectó un carrito ficticio mediante localStorage.
- Trece mediciones DOM/layout de carritos: 1/5/10/20 a 390 y 1280; 30 a 390/430/768/1280/1440. Sin overflow horizontal. El enlace final quedó dentro del viewport y pasó hit-testing sin superposición en todos esos casos. El selector de promociones se alcanzó también por teclado.
- Capturas revisadas: dedicatoria 390, carrito 5 a 390, carrito 30 con promoción a 390 y 1280, checkout 30 a 390 y 1280, aviso de pago y combo. Los anchos son viewports de navegador; no equivalen a una prueba en dispositivo físico.
- Se abrió la confirmación «Eliminar» y se eligió «Conservar producto». La eliminación efectiva/recalculo se conserva cubierta por los tests del carrito/promociones; no se presenta como una eliminación gráfica ejecutada en esta sesión.
- Pendiente: captura visual del panel de preparación con la sesión sintética del usuario. Su API y permisos del empleado sí se comprobaron realmente. No se declara esa captura aprobada sin ejecutarla.
- Pendiente: prueba visual desde celular físico por Wi-Fi. La URL LAN intentada no respondió en esta sesión. El caso sin `randomUUID` se reprodujo y corrigió mediante un test unitario; no se declara la conectividad LAN aprobada.

Las capturas y métricas quedan en la carpeta local de visualizaciones de esta sesión, fuera de Git. No contienen contraseñas ni claves.

## Calidad y SQL

| Comprobación | Resultado |
|---|---|
| `npm test` | 684/684; 56 archivos; incluye 20 tests nuevos |
| `npm run lint` | 0 errores / 0 warnings |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS; 70 páginas/rutas generadas por el build |
| Secret scan del código versionable | Sin hallazgos |
| Service key y refs remotas en bundles públicos | Ausentes |
| Replay vacío de 14 migraciones + seed | PASS |
| `ISOLATED_SECURITY_TESTS.sql` | PASS real, rollback de fixtures |
| `TWO_PAYMENT_QR_TESTS.sql` | PASS real, rollback de fixtures |
| `DEDICATIONS_TESTS.sql` | PASS real, rollback de fixtures |
| Delta LOCAL frente a replay limpio | Cinco funciones relevantes idénticas |
| Legacy SHA-256 | 39/39 intactos |

Vitest emite el aviso de deprecación de la API CJS de Vite instalada; no es un warning de ESLint. Los mensajes de error de los casos negativos con mocks no se contabilizan como errores productivos observados.

### Incidencias de la ejecución, conservadas como evidencia

1. Primer arranque de la web: ruta Windows con espacios sin comillas; corregida. No creó productos.
2. El runner esperaba 201 en reporte de pago; el contrato existente devuelve 200. Se corrigió la expectativa sin cambiar la API de pagos. El historial privado conserva ese FAIL inicial y su comprobación final PASS.
3. El runner llamó al liberador de expiraciones con nombre de parámetro/rol equivocados. Se usó el contrato existente `p_inventory_item_id` mediante servidor y se continuó desde el pedido preparado, sin repetir los escenarios anteriores.
4. El segundo replay encontró primero un puerto fuera de rango y luego un puerto ocupado, antes de iniciar SQL. El replay final arrancó limpio en 57622 y ejecutó toda la cadena. No se parcheó una base para esconder fallos SQL.
5. El laboratorio tenía los objetos de la migración 13 ya instalados pero sin asiento LOCAL. Se compararon sus definiciones con el replay y se registró el recibo LOCAL; no se reejecutaron sus objetos ni se modificó historial remoto.
6. La primera versión de la nueva migración 14 se probó por delta; luego se añadió la validación de unidades enteras en esa misma candidata y se verificó la versión completa final mediante otro replay limpio. No se modificó ninguna migración histórica.
7. El sandbox impidió un arranque de Vitest; se repitió con acceso al árbol de dependencias y pasó.
8. La revisión automática rechazó copiar una credencial privada sintética a la carpeta de capturas. No se efectuó esa copia. Se pidió al usuario iniciar sesión LOCAL para la captura; Auth/API se verificaron sin imprimir credenciales.
9. El test de navegador sin `randomUUID` reprodujo un fallo de la nueva identidad de líneas; se corrigió con un UUID basado en `getRandomValues` y la suite completa volvió a pasar.

## Migraciones pendientes de publicación

1. **Conservar y aplicar solo con autorización posterior** `20261020000100_product_inventory_availability.sql`. SHA-256 conservado: `4b51e28c28454910f2dffc23cc65b595ad9a12701e7775fc861bfe9d216f7b6d`.
2. **Nueva candidata LOCAL** `20261020000200_recipe_dedications.sql`.

La 14 añade dos columnas, constraints, el helper privado de conteo y triggers de validación. Extiende únicamente el contrato idempotente/snapshot de `create_order(7)` y el resumen de `track_order`; mantiene sus permisos. Los reemplazos de definición tienen guardias explícitas que abortan si no encuentran los fragmentos esperados. No cambia FIFO, reservas, confirmación manual, descuentos ni reglas de devolución. No contiene borrados de datos ni backfill por nombres.

Antes de una eventual publicación se requiere revisar/aprobar ambas migraciones, verificar el esquema de destino autorizado y clasificar expresamente los insumos **reales** de tarjeta que correspondan. La migración deja todos los existentes con flag false: no adivina cuáles son tarjetas. Los pedidos anteriores conservan `message`; un carrito viejo con texto incompatible debe revisarse. El código nuevo requiere la migración 14 antes de quedar activo. No se debe transferir el catálogo TEST BO ni ejecutar su preparación/seed en producción.

## Herramientas y archivos

- Dominio y renderizado: `src/lib/public/dedications.ts`, `dedications.server.ts`, `client-id.ts`, `src/components/public/dedication-card.tsx`.
- Flujo público: detalle del API de productos, `types.ts`, `cart-logic.ts`, `checkout.ts`, `order-error.ts`, `home/product-detail.tsx`, `home/cart.tsx`, `home/home-page.tsx`, `checkout-page.tsx`, `checkout-form.tsx`, `order-summary.tsx`, texto de `home/sections.tsx`, CSS de resumen.
- Administración: validaciones/API de insumos, respuestas de validación de recetas base/opciones, `inventory-management.tsx`, API de detalle de pedidos y `orders-panel.tsx`.
- Verificación: `__tests__/dedications.test.tsx`, `scripts/qa-florist-dedications-local.mjs`, ampliación de `scripts/qa-availability-replay-local.mjs`, `supabase/tests/DEDICATIONS_TESTS.sql` y la migración candidata nueva.

Los runners privados se niegan a sobrescribir un replay existente o repetir un conjunto ya completado. No deben usarse para resetear LAB100. Comandos de esta fase: `--prepare` y `--verify` del runner de florería, y `--dedications-final` del runner de replay. Las recuperaciones del runner tras incidencias se hicieron desde checkpoints, sin duplicar pedidos; quedan reflejadas en su informe privado.

## Conclusión acotada

La integración está validada LOCALMENTE para los escenarios y tamaños descritos. Se conservan las reglas de inventario auditadas. No hay autorización ni ejecución de publicación. Quedan para revisión la apariencia administrativa con sesión del usuario y la comprobación en celular físico; no son PASS visuales atribuidos a esta ejecución.
