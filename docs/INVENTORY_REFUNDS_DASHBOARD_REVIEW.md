# Inventario, reintegros, Dashboard y checkout: informe final de revisión

Fecha: 2026-10-13, America/La_Paz. Rama: `codex/inventory-refunds-dashboard-2`.
Implementación evaluada: `05cd24bc535c11997478a662b68a2a67ca184a0f`.
Base/master: `05f5338ab117da5b770b462fd120ab06b2006e92`.

La continuación solicitada conserva íntegra la implementación de 05cd24b y añade solamente este informe. No hubo merge, push, deploy, SQL remoto ni acceso a ninguna Supabase productiva. Las pruebas utilizaron datos sintéticos locales. El resultado está listo para revisión del alcance probado; no equivale a autorización para producción.

## 1–4. Causas raíz y protección producto → receta → venta → consumo

Se confirmó localmente que la cadena anterior permitía un producto activo sin filas en `product_inventory_requirements`. Los bucles de reserva/consumo podían no iterar y la operación continuaba sin consumir insumos. El fixture incremental reprodujo además un pedido mixto: dos productos, pero reserva solo para el que tenía receta. No se examinó ni se atribuyó una causa específica a registros productivos.

La candidata 11 establece productos nuevos inactivos/no disponibles. Para activarlos se exige una receta base con cantidades positivas finitas. Los triggers protegen activación, inserción de líneas de pedido y cambios de receta; no se puede borrar la última receta de un producto activo. El administrador configura los insumos reales desde Productos → Receta antes de activarlo. No se inventan cantidades ni se interpreta la ausencia de receta como exención de inventario.

Los pedidos y ventas toman bloqueos de receta por producto, en orden estable, antes de reservar/consumir. Se preservan las funciones existentes de FIFO, reservas y confirmación. Confirmar consume las reservas originales una vez; repetir la confirmación falla sin otro consumo. Los helpers nuevos no tienen EXECUTE externo. La baja administrativa de un insumo conserva su significado previo: no elimina lotes ni su relación de consumo.

La migración desactiva productos actualmente activos/disponibles con receta incompleta, conservando precio, imagen e historia. Marca pedidos antiguos pendientes cuya receta actual está incompleta con `inventory_review_required`; impide confirmarlos aun si después se añade una receta, porque esta no demuestra la reserva original. También bloquea confirmar pedidos sin reservas. La marca no puede omitirse con un UPDATE, ni siquiera privilegiado. Estos casos necesitan reconciliación revisada por separado; no existe un botón de desbloqueo automático.

## 5–6. Devolución física y reintegro monetario

| Operación | Inventario | Dinero / neto |
|---|---|---|
| `retorno_fisico`, importe 0 | Restituye todo el consumo original del pedido una vez | No registra reintegro ni reduce neto |
| `reintegro`, importe positivo | No cambia stock/lotes | Registra dinero devuelto y reduce neto |
| `devolucion`, importe positivo | Restituye todo el consumo original una vez | Registra el importe efectivamente reintegrado |

Se conserva la venta y su pago original. Cada operación guarda pedido, tipo, monto, motivo, administrador y fecha. La nueva firma de cinco argumentos exige una clave de idempotencia: misma clave y contrato devuelve el mismo registro; una intención diferente con esa clave se rechaza. Bloqueo del pedido y límites acumulados impiden reintegros superiores al importe original. No se admiten cantidades monetarias no finitas ni más de dos decimales.

El retorno físico es del pedido completo; el importe monetario puede ser parcial. No se implementó devolución física parcial por línea. La firma anterior de cuatro argumentos queda como adaptador de transición, con clave determinista por intención/actor, delegando en la lógica nueva. Solo authenticated puede invocar el RPC, y dentro se exige administrador activo; empleado/anon no pueden registrar devoluciones.

Cancelar un pedido online pagado ya restituía inventario, pero no devolvía dinero. La fuente financiera ahora conserva ese cobro confirmado aunque el pedido esté cancelado. Para un cancelado con pago confirmado se admite únicamente reintegro monetario; se rechaza otra restitución física. La UI explica la diferencia. No se modificó la función histórica de cancelación.

En pedidos online, el registro es administrativo: la transferencia bancaria real se realiza y verifica externamente. No hay integración bancaria ni devolución automática.

## 7–10. Definiciones financieras y caso de Bs 90

La vista `sales_ledger`, con `security_invoker=true` y sin lectura anon, constituye la fuente común. Reportes JSON/PDF y Dashboard utilizan `readSalesLedger` / `salesTotals` del servidor. No se corrige el neto mediante una resta aislada en React.

- **Ventas brutas:** suma del total original cobrado, después de promociones y antes de reintegros. Fecha de reconocimiento: confirmación del pago; para pedidos gratuitos confirmados, creación. No significa subtotal previo a descuentos ni utilidad.
- **Reintegros:** suma de importes positivos de `sale_returns`, en su fecha efectiva de registro. El retorno físico de importe cero no genera evento financiero.
- **Ventas netas:** brutas menos reintegros del mismo período. La suma se efectúa en centavos en la lógica compartida. Un reintegro de una venta de otro período puede generar neto negativo en el período actual.
- **Zona horaria:** límites diarios y presentación de transacciones en `America/La_Paz`.

| Caso probado | Brutas | Reintegros | Netas |
|---|---:|---:|---:|
| Venta original | 90 | 0 | 90 |
| Reintegro completo posterior | 90 | 90 | 0 |
| Venta y reintegro parcial | 200 | 50 | 150 |
| Dos ventas 100 + 200; reintegro 50 (unitario) | 300 | 50 | 250 |
| Solo retorno físico de la venta 90 | 90 | 0 | 90 |

La venta original permanece en la vista/historial incluso tras reintegro completo. El caso de cancelación pagada y posterior reintegro también conserva bruto 90, reintegro 90, neto 0.

## 11–13. Caja, Reportes y Dashboard

Un reintegro de venta física exige una sesión abierta de la misma caja de origen y conserva el método efectivo/QR original. Genera un solo movimiento de devolución. QR no altera el efectivo esperado. Un retorno solo físico no crea movimiento monetario. Un reintegro online no genera artificialmente un movimiento de caja física.

El fixture SQL confirmó cierre con efectivo esperado 110 y diferencia 0; conciliación de lotes/stock 47 en ese escenario. Los retries no duplicaron dinero ni inventario.

Reportes muestra brutas, reintegros y netas, y detalla pedido, importe original, importe reintegrado, tipo, responsable, fecha, motivo e impacto financiero. El PDF usa la misma fuente. Dashboard y Reportes fueron comparados por HTTP real para el mismo rango, incluido un importe muy grande. Lecturas paginadas evitan volver al límite de 1.000 filas; la regresión unitaria existente de 1.160 filas permanece activa.

## 14–16. Dashboard 2.0 y checkout

Dashboard: tarjetas claras, neto principal destacado, brutas/reintegros, pedidos de hoy, pagos por verificar y stock crítico. Gráfico SVG ligero con tabla accesible de importes diarios; filtros Hoy/7/30 días y rango personalizado de hasta 366 días. Estados de pedidos enlazados, inventario que requiere atención, productos por unidades vendidas y actividad reciente. No se añadió una dependencia gráfica. Los estados operacionales son actuales e independientes del rango financiero; las cantidades vendidas no se presentan como ingresos ni unidades netas devueltas.

Checkout: resumen «Tu pedido», total protagonista, selección QR mediante radios/etiquetas configuradas, instrucciones de cuatro pasos, botón «Ya pagué» y confirmación del aviso pendiente de verificación. Se conserva selección/snapshot, persistencia y apertura manual de WhatsApp. Si falta WhatsApp, el texto no promete abrirlo. Sin QR activo, el reporte queda deshabilitado con explicación. Total cero conserva confirmación automática, consumo y alta de cliente, sin QR ni pago ficticio. El diseño gratuito ocupa el ancho disponible sin una columna de pago vacía.

Mensaje público de stock: «No contamos con suficiente stock para completar esta cantidad. Reduce la cantidad o elige otro producto para continuar». Para producto no disponible se indica elegir otro. Errores desconocidos usan respuesta genérica; no se devuelven cantidades internas, UUID, tablas, SQL ni trazas. Los logs internos conservan diagnóstico.

## 17–19. Archivos, migración y pruebas agregadas

Única migración nueva: `supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql`. Las diez anteriores, seed y 39 legacy no cambiaron. La candidata se ensayó únicamente en local; no está autorizada para producción.

Grupos de archivos de implementación (lista exacta disponible con `git diff --name-only 05f5338..05cd24b`):

- APIs: Dashboard; reporte de ventas; pedidos públicos; detalle/devoluciones de pedido admin; creación/edición de producto y edición/borrado de requisitos de inventario.
- UI: Dashboard y su página; reportes; detalle/devoluciones de pedidos; formulario de producto; checkout, nuevo `checkout-payment` y resumen de pedido.
- Librerías/validación: `sales-ledger`, PDF de ventas, fechas Bolivia, `order-error`, productos y devoluciones.
- Nuevos unitarios: `inventory-refunds-dashboard.test.ts` (22 casos) y `checkout-payment-ui.test.ts` (6 casos). El segundo valida markup, no sustituye navegación/layout real.
- Unitarios adaptados: `certification-round-three.test.ts`, `checkout-api.test.ts`, `sale-returns-validations.test.ts`; se mantienen las aserciones funcionales y de volumen.
- QA real: `scripts/qa-inventory-refunds-local.mjs` (41 checks) y `qa-inventory-refunds-additional-local.mjs` (29 checks). `qa-two-qr-local.mjs` activa su producto después de configurar receta.
- SQL: `INVENTORY_REFUNDS_TESTS.sql`, `INVENTORY_LEGACY_DELTA_SETUP.sql`, `INVENTORY_LEGACY_DELTA_ASSERT.sql`; fixtures existentes de seguridad/dos QR adaptados para activar después de crear receta.
- Documentación: README/MIGRATION_STATE de Supabase y este informe. `vercel.json` desactiva deployments de esta rama.

## 20–25. Resultados y alcance exacto

| Comprobación | Resultado | Evidencia / ejecución |
|---|---|---|
| `npm test` | PASS 521/521; 38 archivos | Repetido sobre 05cd24b en este cierre |
| `npm run lint` | PASS 0 errores / 0 warnings | Repetido en este cierre |
| `npx tsc --noEmit` | PASS exit 0 | Repetido explícitamente en este cierre |
| `npm run build` | PASS; 69 páginas generadas | Repetido con variables exclusivamente locales |
| Secret scan | Sin hallazgos | Escáner genérico sobre archivos tracked/untracked; no garantía absoluta de ausencia de todo secreto posible |
| Legacy | PASS 39/39 SHA-256 | Recalculados contra manifiesto histórico |
| Cadena | 11 versiones únicas; 10 anteriores + seed intactos | Copias del laboratorio byte-idénticas al commit evaluado |
| Replay | PASS 11 migraciones + seed | Evidencia ya obtenida `final-replay.private.log`; no se reseteó otra vez en este cierre |
| `ISOLATED_SECURITY_TESTS.sql` | PASS, ROLLBACK | Ejecución previa real en la cadena final |
| `TWO_PAYMENT_QR_TESTS.sql` | PASS, ROLLBACK | Ejecución previa real en la cadena final |
| `INVENTORY_REFUNDS_TESTS.sql` | PASS 23 aserciones nominales + guardias negativas | Ejecución previa real con rol authenticated/admin, ROLLBACK |
| HTTP/Auth/SQL dirigido | PASS 41 + 29 = 70 | Informes privados previos conservados y revisados; no se repitió creación masiva de fixtures |
| Delta de receta/pedidos antiguos | PASS | Esquema anterior de 10 versiones → candidata; caso mixto bloqueado, caso válido confirmado, marca protegida |
| Lecturas finales del laboratorio | PASS | 11 versiones registradas, stock/lotes conciliados, 0 stock negativo, helper anon sin EXECUTE |

El delta de integridad se completó antes del último ajuste de reconocimiento de ventas canceladas. Este último fue validado en replay limpio y por nueve checks HTTP adicionales dentro de los 29, no mediante otro ensayo delta completo. No se afirma equivalencia integral de todos los objetos de producción: no se consultó producción.

Las 70 comprobaciones reales incluyen Auth admin/empleado, restricción de reintegros, producto sin receta, venta 90, reintegro y preservación de historia, igualdad Dashboard/Reportes, PDF, QR1/QR2/0 activos, reporte pendiente, recibo protegido, teléfono incorrecto, confirmación y cliente posterior, total cero, expiración, stock insuficiente, cancelación pagada y reintegro posterior.

Concurrencia ya ejecutada: confirmación doble (200/400); devolución con misma clave (mismo registro); claves distintas contra reintegro completo (201/400); dos ventas físicas contra última unidad (201/400); dos pedidos online contra última unidad (201/400); pedidos simultáneos con misma idempotencia (mismo UUID y una reserva). Son pruebas dirigidas locales, no una certificación general de carga ni una nueva batería ofensiva.

Lectura final: bruto 10.000.000.270,99; reintegros 206,00; neto 10.000.000.064,99 en el dataset sintético. Pedido gratuito de navegador #25: confirmado, total 0, cero pagos, cliente materializado. Stock/lotes coinciden y no hay stock negativo. La comprobación adicional de lectura no se suma artificialmente al contador de 70.

La suite unitaria emite el aviso existente de deprecación de Vite CJS y diagnósticos esperados de mocks negativos. No son warnings de ESLint ni tests fallidos.

## 26. Evidencia visual real

Navegador real en local, 1280 px de escritorio y 390 px móvil. En escritorio: clientWidth/scrollWidth 1265/1265. En móvil: 375/375, viewport 390. La diferencia corresponde a la barra de desplazamiento; no hay overflow horizontal global en las vistas inspeccionadas.

Se observaron Dashboard, gráfico/tabla, filtros, importes grandes, producto de nombre largo, checkout QR seleccionado, recarga de selección, aviso pendiente y pedido gratuito. Las imágenes QR son fixtures sintéticos: se valida carga/selección/snapshot, no escaneo bancario ni envío real de WhatsApp. Solo se verificó el enlace preparado; no se envió un mensaje.

En el cierre se completaron error de rango mayor a 366 días, recuperación al rango válido, período sin ventas y captura final móvil del Dashboard. Consola de esa pestaña: sin errores registrados. No se extrapola esa lectura a todas las rutas de la aplicación.

Capturas privadas, fuera de Git, en `%USERPROFILE%/.codex/visualizations/2026/10/07/01a1180b-d477-7f72-b90e-d71ebc2e5249/`:

| Captura | Contenido |
|---|---|
| `anabelle-dashboard-desktop-final.png` | Dashboard final con dataset grande, escritorio |
| `anabelle-dashboard-mobile-final.png` | Dashboard final 390 px y montos completos |
| `anabelle-dashboard-error-final.png` | Validación del rango y reintento |
| `anabelle-dashboard-empty-final.png` | Período sin ventas y métricas cero |
| `anabelle-checkout-payment-desktop.png` | Total, dos QR e instrucciones, escritorio |
| `anabelle-checkout-payment-mobile.png` | Selección QR y nombre largo, 390 px |
| `anabelle-checkout-reported-mobile.png` | Aviso pendiente, no pago confirmado |
| `anabelle-checkout-empty-qr.png` | Sin QR activo, acción de pago bloqueada |
| `anabelle-free-checkout-final.png` | Pedido gratuito confirmado, sin QR/pago |
| `anabelle-refunds-report-mobile.png` | Importes y trazabilidad de reintegros en móvil |

No se declara prueba visual en teléfono físico ni en 768 px en esta ronda. La revisión requerida de escritorio/390 sí fue real.

## 27. Git y cierre

La implementación permanece exactamente en 05cd24bc535c11997478a662b68a2a67ca184a0f. Este documento se guarda en un commit documental posterior de la misma rama; su SHA final se entrega en la respuesta de cierre y se obtiene con `git rev-parse HEAD`. No se reescribió código ni se creó otra rama. Master permanece en 05f5338ab117da5b770b462fd120ab06b2006e92.

## 28. Decisiones pendientes de aprobación y límites

1. **Antes de producción:** aprobar explícitamente la nueva migración y la cuarentena de productos incompletos. Revisar qué productos/pedidos reales resultarían afectados, con backup y ensayo de datos aprobado por separado. Esta tarea no hizo ese inventario remoto.
2. **Pedidos antiguos marcados:** requieren un procedimiento de reconciliación revisado; no desbloquearlos cambiando la marca ni inventando recetas retrospectivas. Puede marcarse conservadoramente un pendiente cuya receta válida se eliminó después: no existe suficiente snapshot histórico para decidirlo automáticamente.
3. **Fecha financiera:** se reconoce al confirmar pago; reintegros al registrarse. Es una definición explícita que puede cambiar cifras por día respecto de informes antiguos basados en creación del pedido. No modifica importes históricos ni realiza transferencias.
4. **Retorno físico completo:** la UI devuelve el consumo completo del pedido, aunque el dinero sea parcial; no ofrece cantidades parciales de retorno. Revisar esta decisión comercial antes de autorizar despliegue.
5. **Adaptador de cuatro argumentos:** evita duplicar una misma intención anterior. Dos reintegros intencionalmente idénticos deben usar el nuevo flujo con claves distintas; no retirar el adaptador durante un despliegue mixto sin plan.
6. **Límites de certificación:** no nueva prueba de carga, no banco/WhatsApp real, no producción, no prueba física de dispositivo. La evidencia de replay/fixtures/concurrencia ya concluida se conserva; no se convirtió trabajo no ejecutado en PASS.

Incidencias de entorno separadas de defectos: Docker detenido al retomar (se inició conservando volúmenes); restricciones del sandbox Windows para SWC/socket; sesiones de localhost compartidas entre laboratorios de distintos puertos (se usó origen 127.0.0.1 para Auth del laboratorio final); el control automatizado de fecha requería entrada nativa para disparar el cambio. Durante desarrollo también se corrigieron comandos del harness (PATCH/POST de estado, nombre de columna de etiqueta) y una expectativa de UPDATE bloqueado por RLS. No se parcheó manualmente el esquema para ocultar errores de migración.

Conclusión: cambios y verificaciones del alcance solicitado completados localmente, con decisiones anteriores visibles para revisión. Detenerse aquí: no merge, no deploy y no aplicación productiva de la candidata.
