# Floristería Anabelle — matriz comercial de 30 casos

Ronda LOCAL del 20 de octubre de 2026. Base evaluada: `42b75b8166e60cf9c44709c1891905da70a42e22`. Rama: `codex/inventory-refunds-dashboard-2`.

Laboratorio: `NOVA-LOCAL-INTEGRITY`, API `http://127.0.0.1:62621`, web `http://127.0.0.1:3116`, sin vinculación remota. El runner valida esos destinos y la rama antes de operar. Los pedidos se crean mediante la API de la aplicación; SQL se usa para verificación de solo lectura.

Esta matriz registra investigación y evidencia para futuros manuales; no es un manual definitivo ni una certificación anticipada. No autoriza operaciones productivas. Los importes en Bs y las identidades del laboratorio son sintéticos. Los fixtures anteriores se conservan.

## Cómo interpretar los resultados

- **PASS**: se comprobó el resultado esperado, incluso cuando consiste en un rechazo controlado. La evidencia indica expresamente si se observó por navegador o por HTTP/Auth/SQL real.
- **FAIL**: se reprodujo una diferencia respecto al resultado esperado; debe enlazar un hallazgo.
- **BLOQUEADO**: una dependencia impidió ejecutar o concluir el caso. No equivale a defecto confirmado de la aplicación.
- **NO EJECUTADO**: aún no hay evidencia suficiente de esta ronda.

El resultado técnico y la revisión visual se registran por separado. Un PASS de API, SQL o test unitario no certifica botones, comprensión del usuario, responsive ni accesibilidad visual. Cuando aplique un flujo completo, también se debe verificar preparación y finalización; crear el pedido por sí solo no completa el caso. No se fabrican ventas mediante INSERT sobre las tablas finales.

«Estado completo» sigue pendiente mientras falte incorporar la evidencia suficiente del recorrido solicitado y sus límites; no debe leerse la columna técnica como certificación visual. Las pruebas de bloqueo transaccional usan conexiones HTTP reales y SQL LOCAL para comprobar estados, no requieren que una misma captura demuestre concurrencia.

## Casos solicitados

| Caso | Escenario comercial | Rol principal | Resultado que debe verificarse | API/Auth/SQL real | Navegador real | Estado completo |
|---|---|---|---|---|---|---|
| 01 | Un ramo de seis rosas, recojo | Cliente / empleado | Compra y preparación normales; termina en recojo finalizado con importes y stock coherentes. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 02 | Doce rosas, entrega a domicilio | Cliente / empleado | Datos de entrega, cargo configurado y transiciones de entrega correctos. | PASS observado; entrega por coordinar; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 03 | Ramo de girasoles, QR1 | Cliente / empleado | Snapshot de QR1, pago reportado y verificación manual, sin confirmación automática. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 04 | Caja floral, QR2 | Cliente / empleado | Snapshot de QR2 y pago reportado que permanece pendiente hasta revisión. | PASS observado; evidencia parcial | QR2 observado con otro producto; no caja floral | NO EJECUTADO |
| 05 | Peluche sin tarjeta | Cliente | No aparecen campos de dedicatoria y no se guarda un mensaje ajeno a la receta. | PASS observado; evidencia parcial | PASS del editor ausente en componente sin tarjeta del combo; compra aislada no observada | NO EJECUTADO |
| 06 | Peluche con tarjeta | Cliente / empleado | Dedicatoria exacta guardada y visible al empleado que prepara el pedido. | PASS observado; histórico parcial; detalle empleado API verificado | Cliente y admin leen dedicatorias de 08; empleado UI pendiente | NO EJECUTADO |
| 07 | Dos regalos con tarjetas | Cliente / empleado | Mensajes diferentes por artículo, sin mezcla ni pérdida durante el flujo. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 08 | Dos unidades del mismo regalo | Cliente / empleado | Dedicatorias independientes por tarjeta y cantidad correcta de insumos reservados/consumidos. | PASS actual #196; histórico parcial | Cliente: PASS hasta Retirado; admin ve dos mensajes exactos; empleado UI pendiente | NO EJECUTADO |
| 09 | Combo flores + peluche | Cliente / empleado | Componentes, cantidades, elegibilidad y precio final correctos. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 10 | Combo con tarjeta | Cliente / empleado | Mensaje asociado únicamente al componente cuya receta contiene tarjeta. | PASS observado; evidencia parcial | PASS cliente: armado guiado y mensaje solo en componente con tarjeta; empleado UI pendiente | NO EJECUTADO |
| 11 | Combo incompleto | Cliente | No se concede un descuento de combo sin todos los componentes requeridos. | PASS observado; evidencia parcial | PASS: eliminación confirmada retira descuento y explica cómo completar el combo | PASS funcional; no pedido nuevo en el suplemento |
| 12 | Promoción del 10% | Cliente | Descuento de 10% únicamente sobre artículos elegibles; pedido y pago concilian. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 13 | Promoción de monto fijo | Cliente | Monto fijo aplicado una sola vez y sin descuento por encima del subtotal permitido. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 14 | Promoción por compra mínima | Cliente | Se rechaza o no aplica por debajo del mínimo y aplica al alcanzarlo. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 15 | Promoción vencida | Cliente | No permite usarla ni genera un pedido con descuento indebido. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 16 | Promoción desactivada | Cliente / administrador | No permite usarla, incluso enviando su código a la API. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 17 | Carrito mixto | Cliente | Los productos ajenos a la promoción no reciben descuentos. | PASS observado; evidencia parcial | NO EJECUTADO | NO EJECUTADO |
| 18 | Pedido gratis, Bs 0 | Cliente / empleado | No muestra QR ni crea pago reportado; confirma conforme al contrato gratuito aprobado. | PASS actual #198; histórico parcial | PASS cliente: Bs 0 y sin QR; finalización por API empleado | NO EJECUTADO |
| 19 | Cliente reporta pago | Cliente / empleado | Permanece pendiente de verificación; sin recibo, cliente materializado o consumo definitivo anticipados. | PASS actual #196 con snapshots antes/después del reporte | PASS: aviso y espera de revisión; hallazgo P3 de texto | NO EJECUTADO |
| 20 | Empleado confirma pago | Empleado | Confirma una sola vez, consume/resuelve reservas una sola vez y habilita recibo según contrato. | PASS actual #196; reintento 400 sin doble consumo | Cliente ve confirmación; empleado UI NO EJECUTADO | NO EJECUTADO |
| 21 | Empleado rechaza pago | Empleado | Rechazo y liberación de reservas conforme al estado decidido, sin consumo definitivo. | PASS | NO EJECUTADO | NO EJECUTADO |
| 22 | Cliente cancela pedido pendiente | Cliente | Cancelación sin consumos ni cobros indebidos; distinguir control propio del cliente y solicitud atendida por personal. | PASS por empleado; sin control público | NO EJECUTADO | BLOQUEADO |
| 23 | Última unidad vendible | Cliente | Un pedido reserva la última capacidad; otro no puede reservarla ni crear venta sin insumos. | PASS | NO EJECUTADO | NO EJECUTADO |
| 24 | Dos ventas simultáneas | Cliente / empleado | Sin doble reserva, doble consumo ni stock negativo; se documentan ganadores y rechazos. | PASS | NO EJECUTADO | NO EJECUTADO |
| 25 | Merma de rosas | Administrador / cliente | La merma disminuye el stock disponible y agota los productos afectados según receta/reservas. | PASS | Inventario/lotes consultados; registrar merma UI NO EJECUTADO | NO EJECUTADO |
| 26 | Reposición de rosas | Administrador / cliente | Entrada/lote recupera capacidad de productos activos elegibles; no reactiva productos desactivados. | PASS | Inventario/lotes consultados; registrar entrada UI NO EJECUTADO | NO EJECUTADO |
| 27 | Merma de tarjetas | Administrador / cliente | Afecta regalos con tarjeta; los que no consumen ese insumo conservan su disponibilidad. | PASS | Inventario consultado; registrar merma UI NO EJECUTADO | NO EJECUTADO |
| 28 | Reintegro parcial | Administrador | Caja, reintegro, venta neta y reportes concilian sin duplicar importes. | PASS | Caja/reportes consultados; registrar reintegro UI NO EJECUTADO | NO EJECUTADO |
| 29 | Reintegro total y devolución física | Administrador | Límite de reintegro y retorno físico correctos, sin duplicar stock ni devolución monetaria. | PASS | Detalle/caja consultados; registrar retorno UI NO EJECUTADO | NO EJECUTADO |
| 30 | Segunda compra del mismo cliente | Cliente | Carrito nuevo sin arrastre accidental; seguimiento anterior conservado y cliente sin duplicación indebida. | PASS actual #198: misma identidad, pedido #196 intacto | PASS: nueva compra y reapertura real de seguimiento #196; última captura falló | PASS funcional; límite de captura documentado |

## Evidencia requerida por caso

Las evidencias privadas y las capturas se conservan fuera de Git. La documentación pública solo puede incluir resultados agregados y referencias que no revelen credenciales ni datos personales. Cada resultado debe poder relacionarse con su ID de caso.

| Evidencia | Qué debe registrar |
|---|---|
| Preparación | Productos/recetas reutilizados, stock físico/reservado/libre inicial, promoción y rol sintético. |
| Cliente | Controles reales utilizados, cantidad, dedicatorias, descuento, entrega/recojo, total y QR cuando aplica. |
| HTTP/Auth | Ruta, rol, código de respuesta y resultado comercial saneado; sin tokens, claves ni contraseñas. |
| Empleado | Acciones permitidas y prohibidas, verificación simulada, dedicatorias y estados observados. |
| SQL LOCAL | Pedido, líneas, descuentos, reservas, movimientos FIFO, pagos, caja/reintegros y estado final. |
| Seguimiento | Estado coherente con el pedido y recibo disponible únicamente cuando corresponde. |
| Visual | Captura, viewport y etapa; distinguir comprobación visual de simple geometría/DOM. |
| Preservación | Ningún fixture previo eliminado; ninguna operación remota; ausencia de secretos en diff. |

Los fallos controlados deben probar ausencia de mutación parcial. Las comprobaciones concurrentes deben conservar el orden y resultado de cada solicitud; no se presume ganador por el orden de lanzamiento.

### Límites del contrato observados por lectura, no por ejecución

- Caso 02: el checkout describe la entrega como costo por coordinar, no incluido. El contrato inspeccionado no calcula una tarifa de envío. La prueba debe comprobar dirección/referencia y el total real, sin inventar un cargo automático ni certificarlo como existente.
- Caso 22: las rutas públicas inspeccionadas ofrecen crear pedido, reportar pago, seguimiento y recibo; no ofrecen cancelación pública. Existe `/api/admin/orders/[id]/cancel`, autorizado para personal activo. Comprobar esa ruta no equivale a demostrar un botón de cancelación directa del cliente.
- El personal activo puede gestionar productos, recetas, inventario, entradas, mermas, caja y pagos según las reglas actuales. Configuración, usuarios, mutaciones de promociones y registro de reintegros son exclusivos del administrador. No se cambia esa política durante la documentación.

Estas observaciones de código orientan la ejecución. No cuentan como resultados PASS ni como defectos reproducidos.

### Evidencia técnica incorporada

El runner `scripts/qa-commerce30-local.mjs` conserva resultados de HTTP con Auth real y verificaciones SQL de solo lectura en `commerce30.private.json`, fuera del repositorio, dentro del laboratorio. Los casos 01 y 02 recorrieron creación → reporte → confirmación por empleado → preparación → listo → finalizado → seguimiento final. El caso 02 utiliza el contrato real de entrega por coordinar: total de producto Bs 150, sin tarifa automática. La disponibilidad de entrega se habilitó temporalmente mediante la API administrativa y se restituyó a su valor anterior. Falta la evidencia visual de esos casos.

Los casos 01–22 y 28–29 terminaron con PASS técnico observado por el ejecutor, con las siguientes limitaciones de conservación de evidencia. El caso 22 se ejecutó como cancelación por empleado a solicitud del cliente: no demuestra autocancelación pública y no se certifica completo.

**Incidencia del harness, no defecto de la aplicación:** una interrupción durante la escritura no atómica truncó el manifiesto privado inicial de los casos 01–20. Los datos de negocio quedaron intactos y los PASS ya se habían observado en terminal. Se reconstruyeron 17 pedidos y sus pagos durables mediante SELECT; el snapshot llamado `before` tras esa recuperación corresponde a 138 pedidos, no al estado inicial de 121. Se conservan los conteos iniciales registrados, pero no se puede afirmar que se preservaron los snapshots originales de filas ni todas las respuestas/preestados iniciales. El runner se corrigió para escribir de forma atómica y conservar la versión anterior. No se recrearon ventas por INSERT ni se modificó código comercial para solventar la incidencia.

La tabla indica «PASS observado; evidencia parcial» en los casos afectados. Una fila final confirmada no acredita por sí sola que antes del pago no hubo cliente materializado, consumo o recibo; esas invariantes requieren una evidencia anterior conservada o una reejecución específica. Las verificaciones posteriores conservadas incluyen:

- Caso 08: GET autenticado de detalle por empleado devuelve los dos mensajes exactos e independientes por unidad.
- Casos 03 y 04: snapshots durables de pago mantienen respectivamente `qr_1` y `qr_2`.
- Caso 21: rechazo por empleado, reservas liberadas y stock físico sin consumo.
- Caso 22: cancelación por empleado sin pago ni consumo, con reservas liberadas.
- Casos 28 y 29: reintegros de Bs 15 y Bs 50 por API administrativa. El retorno físico del caso 29 repone exactamente un peluche; un reintento no duplica ni dinero ni inventario.
- Permisos Auth reales: empleado obtiene 403 en configuración, usuarios, creación de promociones y registro de reintegro. El RPC privado de seguimiento rechaza anon/empleado y funciona con service_role. Teléfono incorrecto devuelve 404 sin pedido ni token.

Casos 23–27, con evidencia actual conservada:

| Caso | Condición y resultado técnico real |
|---|---|
| 23 | Insumo rosa aislado: físico 1, reservado 0 → 1 por el ganador; un segundo pedido responde 400 sin pedido parcial. Cancelar el primero libera la reserva. |
| 24 | Dos solicitudes HTTP simultáneas por la misma rosa con físico 1: una responde 201 y otra 400. El ganador real fue el competidor 1, producto sin tarjeta de Bs 65. Reserva total 1, no 2. La confirmación por empleado consume una rosa y deja físico 0; el pedido ganador finaliza. No se atribuye el ganador al orden de lanzamiento ni se supone consumo de tarjeta. |
| 25 | Con físico 10 y reserva 1, merma 10 responde 400 y preserva ambos. Merma 9 responde 201: físico 1, reserva 1, libre 0. Los dos productos afectados presentan capacidad 0 y no disponibles. |
| 26 | Reposición de 9: físico 10, reserva 1 y capacidad 9. El producto activo recupera disponibilidad; el desactivado manualmente sigue fuera de la API pública, 404. Se reactiva después explícitamente mediante API para conservar el fixture utilizable y se cancela la reserva técnica de 25. |
| 27 | Tarjetas: la consulta SQL autoritativa demuestra una merma de 20 tarjetas, que deja 0: producto con tarjeta agotado, producto sin tarjeta todavía disponible. Reposición posterior de 20 tarjetas conserva el laboratorio utilizable. El caso 24 no consumió tarjeta; el resumen preliminar de 19 tarjetas era una deducción incorrecta del harness, rectificada con los datos reales. |

Los productos auxiliares y las existencias aisladas se prepararon por APIs administrativas, sin fabricar ventas por SQL. La concurrencia comprobada corresponde a dos solicitudes del caso 24; no se presenta como nueva prueba masiva de carga.

Suplementos fuera de los 30 casos principales:

- Fotografía DEMO: carga multipart mediante la API al producto auxiliar, GET del detalle y descarga HTTP 200 con tamaño/SHA-256 comprobados. La gestión de la fotografía en la UI administrativa todavía no está certificada visualmente.
- FIFO secuencial real: dos lotes nuevos de dos rosas cada uno, con fechas distintas; una venta física por empleado de Bs 65 consume una rosa del lote más antiguo. El `lot_id` se comprueba por SQL y los otros lotes permanecen intactos. Esta evidencia complementa la conciliación de cantidades; no se infiere FIFO únicamente de los totales.

## Conciliaciones de la ronda

Alcance final controlado: **27 pedidos distintos**, formado por los 25 del runner y sus suplementos, más los pedidos de navegador #196 y #198. Los casos 19/20 comparten un pedido y varios casos son rechazos controlados; no se presentan como 30 ventas confirmadas. Las dos ventas físicas suplementarias de Bs 50 y Bs 65 se identifican separadamente de los 30 escenarios.

| Métrica / invariante | Resultado de esta ronda |
|---|---|
| Pedidos controlados | 27: **23 finalizados, 1 rechazado y 3 cancelados**. Los tres cancelados son 22 (solicitud operativa), 23 (reserva técnica) y 25 (reserva para merma). |
| Pagos del alcance | **22: 21 confirmados y 1 rechazado**. Los pedidos gratuitos no crean pagos. |
| Stock físico = suma de lotes; reservado/libre/capacidad coherentes | PASS en los 41 insumos actuales: stock físico = lotes, stock físico ≥ reservado ≥ 0. |
| Consumo y reservas del alcance | 60 reservas y 57 movimientos con referencia a sus pedidos. La conciliación técnica previa de 52 grupos de receta se complementó con consumo exacto de dos peluches/dos tarjetas en #196 y uno/una en #198. Sin consumo doble ni stock negativo observado. |
| Orden FIFO entre lotes | PASS suplementario actual: dos lotes nuevos de dos rosas, venta física por empleado y consumo de una rosa del lote más antiguo, con `lot_id` exacto y demás lotes intactos. No constituye una auditoría retrospectiva de todos los consumos históricos. |
| Ventas, reintegros y neto del alcance | **Bruto Bs 1.719 − reintegros Bs 75 = neto Bs 1.644**. Incluye Bs 110 de #196 y Bs 0 de #198. Los reintegros son Bs 10 de la venta física de Bs 50, Bs 15 de 28 y Bs 50 de 29. |
| Caja del alcance | **3 movimientos, neto Bs 105**: ventas físicas Bs 50 y Bs 65 menos reintegro Bs 10. No se confunden los movimientos de caja con el total de ventas online. |
| Reintegros y retorno físico | 4 registros: tres importes monetarios que suman Bs 75 y un retorno físico sin importe adicional. Sin duplicación al reintentar. |
| Clientes y duplicados | Cero teléfonos sintéticos duplicados del conjunto `000330%`. #196 conserva `customer_id=null` antes de confirmar; se materializa al confirmar y #198 reutiliza esa identidad. Los snapshots actuales no se atribuyen retroactivamente al caso histórico 19 perdido. |
| Archivos/capturas sintéticos conservados solo en LOCAL | Manifiesto, copia anterior atómica y datos de prueba fuera de Git; las capturas del responsable se incorporan por separado. |

Estado agregado del laboratorio: **149 pedidos, 85 pagos, 64 clientes, 188 productos, 30 promociones, 41 insumos, 67 lotes, 426 reservas y 335 movimientos de inventario**. Son totales con fixtures previos y una operación manual fuera del alcance; no cantidades creadas íntegramente por esta batería. Los 186 productos previos se conservan; dos productos auxiliares de capacidad y cuatro promociones de prueba pertenecen a esta ronda.

**Operación excluida:** existe un pedido LOCAL manual #197, pendiente de Bs 70, con pago pendiente y tres reservas. No está entre los 27 IDs del alcance, no se atribuye su autoría al runner y no se borró. Explica que el incremento global sea de 28 pedidos/23 pagos respecto a los conteos iniciales, mientras la batería controla 27/22. Sus Bs 70 no se contabilizan como venta confirmada en el bruto anterior.

El conjunto de 27 IDs del alcance tiene SHA-256 `7ecc2e6af1caec23e192b0018bddd9902d393a498a91bedaa6dea5aeebdccbf8`, conservado para relacionar los agregados con el manifiesto privado sin publicar pedidos completos.

El manifiesto registra **146 aserciones, 137 nombres únicos, 0 FAIL**; hay relecturas intencionales. No son 146 escenarios comerciales distintos y no reemplazan las respuestas ni snapshots originales perdidos de 01–20. Auth, HTTP, RPC y SQL corresponden a servicios reales LOCALES, sin mocks.

## Hallazgos y prioridades

### COM30-001 — Instrucción de WhatsApp sin acción disponible

- **Prioridad / rol / casos:** BAJO / P3; cliente; 08 y 19, pantalla de pago reportado.
- **Condición:** WhatsApp está deshabilitado en la configuración LOCAL. Desde la tienda, crear un pedido sintético de recojo, seleccionar QR2 y pulsar «Ya pagué».
- **Esperado:** explicar que el pago está reportado y espera revisión; mostrar instrucciones para enviar WhatsApp únicamente si ese canal y su acción están disponibles.
- **Obtenido:** aparece «WhatsApp requiere que tú pulses Enviar» aunque no hay botón de WhatsApp por estar deshabilitado el canal.
- **Reproducibilidad / evidencia:** una observación real del texto en navegador en esta ronda, más comprobación de su condición en el código, pedido LOCAL #196. `commerce30-19-pago-reportado.png` muestra el contexto superior; el encuadre no alcanza el párrafo de WhatsApp. La captura específica del texto queda pendiente. No se simula como defecto monetario ni se infiere que ocurrió en producción.
- **Impacto:** puede hacer creer al cliente que falta una acción que no puede ejecutar. No confirmó el pago automáticamente ni impidió su reporte.
- **Mutación parcial:** no observada por este defecto de texto. El reporte de pago fue la acción intencional del caso; quedó pendiente de revisión.
- **Causa confirmada por lectura:** `src/components/public/checkout-page.tsx:175` representa ese párrafo sin condición de WhatsApp; solo el enlace siguiente depende de `meta.whatsapp`. No se modificó código.
- **Módulo / propuesta:** presentación pública del estado de pago reportado en `checkout-page.tsx`; condicionar el texto a la acción de WhatsApp efectiva. Queda documentado para revisión, sin corrección comercial en esta ronda.

### COM30-002 — Detalle administrativo presenta un pago QR como efectivo

- **Prioridad / rol / casos:** MEDIO / P2; administrador y personal que consulta el detalle; 04, 19 y 20.
- **Condición:** abrir `/admin/pedidos`, localizar el pedido LOCAL #196 pagado por QR y abrir su detalle.
- **Esperado:** mantener el mismo método real del pago en listado y detalle: QR verificado, con la información persistida de su reporte.
- **Obtenido:** el listado presenta QR verificado correctamente, pero el modal de detalle muestra «Efectivo · verificado» para ese mismo pago.
- **Reproducibilidad / evidencia:** observación real del navegador administrativo por el responsable de la ronda, contrastada con el contrato de ambas APIs y el componente. Captura específica pendiente de incorporación; no se presume a partir de un nombre de archivo.
- **Causa confirmada:** el SELECT de `src/app/api/admin/orders/[id]/route.ts:11` obtiene `payments(status, confirmed_at)` y omite `method`. El listado de `src/app/api/admin/orders/route.ts:13` sí lo obtiene. En `src/components/admin/orders/orders-panel.tsx:350`, todo valor diferente de `qr`, incluido `undefined`, se presenta como efectivo; el modal utiliza ese helper en la línea 469.
- **Impacto:** información de pago inconsistente que puede confundir al personal al revisar un pedido. El método persistido continúa siendo QR; no se observó cobro, descuento ni asiento incorrecto por este problema de presentación.
- **Mutación parcial:** ninguna; consultar listado/detalle es de solo lectura y la comparación no modificó el pago.
- **Propuesta:** completar el contrato del detalle con el método real y evitar interpretar un método ausente como efectivo. Agregar regresión de presentación del mismo pedido en listado/detalle cuando se autorice la corrección. No se modificó API ni componente en esta ronda.

### COM30-003 — Descripción de Inventario comprimida por las acciones

- **Prioridad / rol:** BAJO / P3; administrador; revisión de Inventario.
- **Condición / evidencia:** abrir Inventario en el escritorio disponible con las cuatro acciones superiores. `commerce30-admin-inventario.png`, de **1069 × 820 píxeles**, muestra la descripción prácticamente a una palabra por línea, en una columna estrecha, mientras las acciones permanecen al lado. Son dimensiones del archivo capturado, no una medición del viewport CSS.
- **Esperado / obtenido:** descripción legible en un bloque proporcionado; se obtiene una cabecera excesivamente alta y fragmentada. Los botones siguen visibles: no se demostró bloqueo ni overflow horizontal.
- **Causa probable, no aislada experimentalmente:** interacción entre distribución horizontal y botonera que comprime el texto. El código usa `lg:flex-row`, `min-w-0` en el texto y `shrink-0` en acciones; Inventario suministra cuatro botones. Fuentes para investigar: `src/components/ui/page-header.tsx` y `src/components/admin/inventory/inventory-management.tsx:731`. No se midió CSS computado ni se modificó el layout para confirmar causalidad.
- **Impacto / mutación:** inconsistencia visual y lectura incómoda; ninguna mutación por esta observación.
- **Propuesta:** conservar un ancho legible del texto y dejar que las acciones se distribuyan debajo en el ancho intermedio. No se cambió CSS ni componente; el ancho exacto del viewport no se deduce de la imagen.

### COM30-004 — Importes grandes de reportes se dividen dentro de un grupo

- **Prioridad / rol:** BAJO / P3; administrador; lectura de Reportes de ventas.
- **Condición / evidencia:** abrir el reporte con el volumen monetario sintético acumulado del laboratorio en el escritorio disponible. En `commerce30-admin-reportes.png`, de **1069 × 820 píxeles**, el importe neto **Bs 10.000.007.911,49** separa «10.000.00» de «7.911,49» entre líneas; ocurre también en el bruto. Son dimensiones del archivo, no del viewport CSS. El importe extremo procede de fixtures previos conservados; no se creó una venta de ese monto en esta ronda.
- **Esperado / obtenido:** todos los dígitos completos y agrupados de manera fácil de leer; los dígitos están completos, pero el salto dentro de un grupo dificulta recomponer el número de un vistazo. **No se observó importe calculado incorrecto ni truncamiento**.
- **Causa probable, no aislada experimentalmente:** ancho de la tarjeta, tipografía y ajuste de línea al presentar un importe extenso. El código usa cuatro columnas desde `lg` y permite `[overflow-wrap:anywhere]` en `StatCard`; no se midió CSS computado ni se modificó para demostrar cuál regla determina este resultado. Fuentes para investigar: `src/components/admin/reports/reports-panel.tsx:306` y `src/components/ui/stat-card.tsx`.
- **Impacto / mutación:** detalle de legibilidad de métricas grandes; ninguna operación comercial ni alteración financiera por consultar el reporte.
- **Propuesta:** ajustar distribución/ancho o escala tipográfica para valores extensos, preservando siempre todos los dígitos. No eliminar el soporte de ajuste de línea si eso vuelve a recortar importes. No se cambió código.

No hay un defecto CRÍTICO/ALTO confirmado en la evidencia incorporada hasta este corte. Esto no equivale a certificar las pruebas aún pendientes.

Los hallazgos usarán `COM30-XXX`, rol/caso, pasos reproducibles, esperado/obtenido, evidencia, mutación parcial, causa confirmada o hipótesis, módulos y propuesta. Se separará el estado anterior a una corrección del resultado de su reejecución.

- **CRÍTICO / P0**: dinero incorrecto, doble consumo, venta sin inventario, fuga de datos, permiso indebido o pedido perdido.
- **ALTO / P1**: compra/preparación bloqueada, dedicatoria perdida, promoción incorrecta o botón principal inaccesible.
- **MEDIO / P2**: flujo confuso, información difícil de encontrar, mensaje técnico o navegación excesiva.
- **BAJO / P3**: espaciado o inconsistencia visual menor.

Una incidencia de configuración, una credencial sintética no disponible o una restricción del navegador se documentará como limitación de entorno; no se convertirá en FAIL de aplicación sin reproducción que lo demuestre.

## Revisión visual y material para manuales

### Recorrido de cliente observado

Origen LOCAL independiente `http://127.0.0.6:3116`, pedido sintético #196, dos unidades de peluche con tarjeta, total Bs 110. Se utilizaron los controles reales: búsqueda → detalle y cantidad 2 → dos mensajes diferentes y sus vistas previas → carrito → recarga que conserva los textos → checkout con datos de recojo → revisión → creación de pedido → QR2 → recarga que conserva QR2 → «Ya pagué» → espera de revisión. La entrega estaba deshabilitada de verdad en LOCAL; no se forzó para simular una opción de UI inexistente en ese momento. El pago no se confirmó automáticamente.

La confirmación y las transiciones se realizaron después con Auth real de empleado por API, como simulaciones LOCALES autorizadas. El navegador del cliente observó sucesivamente **Confirmado → En preparación → Listo → Retirado** y conservó las dos dedicatorias. Eso no demuestra la operación de los botones en una sesión visual de empleado; esa sesión no estuvo disponible.

El manifiesto privado incorpora snapshots actuales atomizados de #196:

- Antes del reporte y después de reportar: `customer_id=null`, sin recibo, sin consumo físico, reservas vigentes en estado `reserved`; después del reporte se conserva el pago pendiente y el snapshot de QR2/etiqueta.
- Después de confirmar: cliente materializado, consumo FIFO exacto de dos peluches y dos tarjetas, dos reservas `consumed`. La segunda confirmación responde 400 y no duplica consumo.
- El enlace de recibo aparece tras confirmar. La petición HTTP del PDF obtuvo 200. El intento de descarga mediante navegador se abortó tras 155 s: **enlace y HTTP verificados; descarga de navegador INCOMPLETA / no verificada**. No se atribuye el aborto de la herramienta a un defecto de la aplicación sin otra evidencia.

Nueva compra #198: se utilizó la acción real de nueva compra, se comprobó carrito/campos anteriores limpios y se ingresó nuevamente la misma identidad sintética. La oferta deja total **Bs 0, sin QR ni pago**; el pedido se confirma automáticamente y consume un peluche/una tarjeta una sola vez. La dedicatoria nueva queda en #198, las anteriores permanecen intactas en #196 y la API confirma que ambos usan el mismo cliente. #198 se finalizó después por API de empleado.

Después de #198 se reabrió realmente el formulario de seguimiento, se ingresaron los datos sintéticos del pedido anterior #196 y se observó **Retirado / Pago confirmado**, total Bs 110, sus dos dedicatorias exactas y el enlace de recibo posterior a la confirmación. La lectura real del navegador/árbol accesible conserva esa evidencia. El intento adicional de captura respondió `Unable to capture`: **caso 30 funcional PASS, fotografía de ese último paso pendiente**. No se sustituye por una captura de otro momento ni se atribuye el fallo de captura a la aplicación.

Estos recorridos prueban la parte cliente de 08, 18, 19 y gran parte de 30 y reutilizan el contrato QR2 de 04, pero **no convierten en PASS visual el caso específico de caja floral ni el panel del empleado/administrador**. Los snapshots actuales suplen invariantes funcionales mediante nuevas observaciones; no se presentan como recuperación de los snapshots originales perdidos de 01–20.

### Suplemento visual de combo, sin crear otro pedido

Se abrió una promoción sintética existente de dos peluches: componente con tarjeta Bs 55 y componente sin tarjeta Bs 50, precio de combo Bs 90. Mediante controles reales se recorrió «Comprar combo» → paso 1 de 2 con mensaje de tarjeta → «Continuar al siguiente producto» → paso 2 de 2 sin editor de dedicatoria → «Agregar combo». El carrito contiene dos líneas, mensaje únicamente en el componente con tarjeta, subtotal Bs 105 y total Bs 90 (descuento Bs 15).

Se eliminó después el componente sin tarjeta usando la confirmación «Sí, eliminar». La interfaz avisó que el producto se eliminó y el descuento se retiró; el subtotal y total quedaron en Bs 55, y la promoción explicó que debía completarse el componente faltante. Esto acredita UI de 10/11 y la ausencia de editor de 05 dentro del combo; **no acredita el caso específico 09 de flores + peluche**, pues este suplemento utiliza dos peluches. No se creó un pedido ni un pago adicional y los conteos del alcance permanecen en 27.

### Revisión administrativa real de lectura

Se completó el acceso LOCAL con la sesión del propietario. Las siguientes observaciones usan navegación real; **no** son afirmaciones de creación, guardado, reintegro o movimientos administrativos mediante botones:

| Ruta | Observado realmente | Límite |
|---|---|---|
| `/admin/pedidos` | Filtros Activos/Todos, búsqueda #196, fila finalizada por QR/Bs 110 y detalle con las dos dedicatorias exactas. | El detalle presenta COM30-002. Se vieron acciones de informe/devolución, sin registrar operaciones. No es una sesión de empleado. |
| `/admin` | Dashboard con métricas, gráfico y estados cargados. | Son agregados del laboratorio y de su período seleccionado; no equivalen al subconjunto de 27 pedidos. |
| `/admin/inventario` | Total 41 ítems; búsqueda de los tres insumos aislados `TEST COM30`; lectura de Lotes FIFO con dos lotes de 18/19 de octubre y remanentes 1/2. | No se registró entrada, ajuste o merma por UI. El PNG solo muestra el comienzo de la página; filas/lotes se observaron en navegador, fuera de su encuadre. COM30-003. |
| `/admin/caja` | Caja abierta y los tres movimientos del alcance: ventas Bs 65/Bs 50 y reintegro Bs 10. | No se abrió/cerró caja ni se registró movimiento por UI. El esperado global de la caja incluye movimientos anteriores; el neto nuevo del alcance es Bs 105. |
| `/admin/reportes` | Ventas y Productos vendidos cargan en navegador. | La captura adjunta corresponde a Ventas. COM30-004 afecta lectura de valores extremos; no certifica descarga PDF ni cada reporte adicional. |
| `/admin/productos` | Búsqueda de productos `TEST COM30`, Acciones → Editar, pestañas Información e Inventario y tres requisitos de receta de cantidad 1. | No se guardó, creó ni editó producto/receta por UI; no hay PNG específico informado de este paso. |
| `/admin/configuracion` | Dos QR DEMO activos, siete días cerrados, pedidos fuera de horario activados, entrega desactivada y WhatsApp desactivado. | Se consultó la configuración LOCAL existente, sin guardar ni extrapolar sus valores a producción; no hay PNG específico informado. |
| `/admin/promociones` | Listado con estados vigente/inactiva/vencida y búsqueda de participantes. | No se creó/editó/activó promoción por UI. El PNG muestra formulario y buscador, no la lista de estados completa. |

Capturas conservadas fuera de Git, en el directorio de visualizaciones privado de esta sesión:

| Captura | Evidencia y límite |
|---|---|
| `commerce30-08-dedicatorias.png` | Dos dedicatorias independientes del mismo regalo. |
| `commerce30-08-checkout-review.png` | Revisión de checkout con las dos unidades y sus textos. |
| `commerce30-04-qr2.png` | Parte superior del paso de pago #196 y total Bs 110. La selección QR2 y sus imágenes quedan fuera del encuadre; este PNG no las demuestra, aunque selección/persistencia sí se observaron en navegador y API. |
| `commerce30-19-pago-reportado.png` | Contexto superior de pago reportado, acciones de nueva compra/seguimiento y resumen. El párrafo de WhatsApp está fuera del encuadre. |
| `commerce30-20-seguimiento-confirmado.png` | Estado «Pedido confirmado», pago confirmado y etapa actual de la línea de tiempo. |
| `commerce30-preparacion.png` | Estado real «En preparación» y pago confirmado en seguimiento. |
| `commerce30-listo.png` | Estado real «Listo para recoger» y pago confirmado en seguimiento. |
| `commerce30-196-finalizado.png` | Referencia inferior del pedido y WhatsApp no disponible. El encuadre no muestra «Retirado»; no sirve por sí solo para probar ese estado. |
| `commerce30-18-carrito-gratis.png` | Descartada como prueba visual: la imagen contiene solo fondo vacío. Se conserva como evidencia de la incidencia de captura. |
| `commerce30-30-carrito-nuevo-vacio.png` | Descartada como prueba visual: es byte-idéntica a la imagen vacía anterior. No demuestra el estado del carrito. |
| `commerce30-admin196-listado.png` | Búsqueda #196, estado Finalizado, total Bs 110 y QR verificado en el listado. |
| `commerce30-admin196-detalle.png` | Modal #196 con dos dedicatorias exactas y etiqueta Efectivo incorrecta, evidencia directa de COM30-002. |
| `commerce30-admin-dashboard.png` | Métricas y comienzo del gráfico del período seleccionado; no muestra por sí sola todas las secciones inferiores. |
| `commerce30-admin-inventario.png` | Resumen de 41 ítems, controles superiores y búsqueda; muestra COM30-003, pero no alcanza filas/lotes. |
| `commerce30-admin-caja.png` | Caja abierta, formulario sin completar y comienzo de los movimientos; el resto se observó mediante navegación real fuera del encuadre. |
| `commerce30-admin-reportes.png` | Reporte Ventas y sus métricas; muestra COM30-004. No prueba visualmente Productos vendidos ni una descarga. |
| `commerce30-admin-promociones.png` | Formulario de promoción y búsqueda de participantes; no llega al listado de estados. |

Las dos imágenes vacías se comprobaron visualmente y por igualdad SHA-256. No se interpretan como un defecto reproducido de la aplicación ni sustituyen la observación real del navegador/árbol accesible. Tampoco se certifican pantallas o resoluciones solo por el nombre de un archivo.

Los siete PNG administrativos se inspeccionaron: contienen UI real, ninguno es una imagen vacía. Se preservan sus límites de encuadre; no se acredita una acción solo por el nombre del archivo.

Pendiente: recorrido visual del empleado con su propia sesión y ejecución visual de mutaciones administrativas, fotografía del último seguimiento anterior tras nueva compra y validación real en 375, 390, 430, 768 y 1440 px con alturas variadas. Las limitaciones de redimensionamiento de la herramienta no son un defecto demostrado de la aplicación. Se revisaron estáticamente los breakpoints/layout solicitados, pero eso **no constituye PASS visual móvil/tablet**. El escritorio se observó realmente; no se asigna un ancho exacto adicional por inferencia de una captura ni se reutilizan pruebas de rondas anteriores como PASS de esta ronda.

El carrito observado en el suplemento contiene dos líneas; no se repitió aquí una validación visual nueva de carrito con 5/10/20/30 productos ni de las imágenes QR completas en todos los tamaños. Las pruebas históricas de ese volumen se conservan en sus informes, sin contarlas como ejecutadas de nuevo.

Los borradores de cliente/empleado/administrador deben enlazar casos y capturas, identificar requisitos, ruta, botones y campos reales, pasos, resultado y errores. Una acción no observada visualmente queda como «pendiente de documentación visual». No se publica aún un manual definitivo ilustrado.

## Controles de conservación y calidad

- SHA base y rama confirmados al comenzar; sin push, merge ni deploy autorizados en esta ronda.
- 14 migraciones activas y `supabase/seed.sql`: sin cambios respecto al SHA base; verificado al comenzar y después de terminar el runner. No hay cambios en `src/`, `__tests__/` ni `supabase/`.
- 39/39 migraciones legacy coinciden con el manifiesto SHA-256 de `supabase/MIGRATION_REORGANIZATION_AUDIT.md`; verificado al comenzar y después del runner.
- SQL LOCAL de esta ronda: consultas de verificación, conciliación y snapshots; las operaciones comerciales se ejecutaron por HTTP/Auth/RPC reales. **No se repitió replay de 14 migraciones + seed**, ni se ejecutaron esta ronda `ISOLATED_SECURITY_TESTS.sql`, `TWO_PAYMENT_QR_TESTS.sql` o `DEDICATIONS_TESTS.sql`. Sus PASS anteriores no se contabilizan como pruebas nuevas.
- Suite completa: `npm test -- --maxWorkers=2 --minWorkers=1`, **56/56 archivos y 684/684 tests PASS**, duración 137,23 s. Son tests automatizados; no sustituyen los casos comerciales reales ni las capturas.
- El primer arranque de Vitest fue impedido por acceso del sandbox a esbuild/configuración; no llegó a ejecutar tests. El mismo comando fuera de ese bloqueo terminó correctamente. Se conserva la advertencia existente de deprecación CJS de Vite; no es un warning de ESLint.
- Secret scan del diff y los siete archivos nuevos, incluidos los tres borradores separados y el informe consolidado, repetido en el cierre: cero coincidencias de claves privadas, JWT, secretos Supabase, tokens GitHub/AWS o URI PostgreSQL con contraseña; cero archivos `.env`, dumps o manifiestos privados incluidos. Este escaneo por patrones no sustituye la revisión humana de los archivos.
- `git diff --check`: PASS, repetido después del runner.
- `npm run lint`: **PASS, 0 errores y 0 warnings**, exit 0, sin salida adicional de ESLint. Se repitió completo después de las correcciones del runner de 98 comprobaciones. Después de los suplementos de foto/FIFO y otra vez sobre el runner final de 146 aserciones se ejecutó `npm run lint -- scripts/qa-commerce30-local.mjs`: **PASS, 0 errores/0 warnings**. Los demás archivos ejecutables permanecen idénticos; la documentación Markdown no forma parte de ESLint.
- `npx tsc --noEmit`: **PASS, exit 0**, ejecutado por el responsable de la ronda. No se lanzó desde el agente de matriz para evitar concurrencia sobre `.next`.
- Build: **PASS, exit 0**. `scripts/start-lab50-local.ps1 -Build` ejecutó `npm run build` con variables exclusivamente LOCAL; compilación 19,0 s, TypeScript 12,6 s y generación 70/70 páginas. Se detuvo brevemente solo Next LOCAL del puerto 3116 antes de reconstruir `.next`, conservando Docker/Supabase y sus datos; después se reinició el mismo launcher local.
