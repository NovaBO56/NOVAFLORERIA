# QA30: índice y contexto de los borradores de procedimientos

Fecha: 20 de octubre de 2026. Base inspeccionada: `42b75b8166e60cf9c44709c1891905da70a42e22`, rama `codex/inventory-refunds-dashboard-2`.

Este índice reúne el contexto y la evidencia de tres borradores físicos para una investigación LOCAL. **No es el manual definitivo ni una certificación de los 30 casos.** Los nombres de controles, rutas y contratos se comprobaron por lectura del código. Se incorporó evidencia técnica real, recorridos cliente y revisión administrativa parcial de lectura; la operación gráfica del empleado y las acciones administrativas de creación/guardado/mutación siguen **pendientes de documentación visual**. Una API que funcione no certifica por sí sola que una persona pueda completar el procedimiento en la pantalla.

No contiene credenciales, IDs de clientes, snapshots productivos ni datos comerciales privados. Los procedimientos de operación simulada corresponden únicamente al laboratorio LOCAL confirmado por el responsable de QA; no deben ejecutarse en la web productiva.

## Estados de evidencia

| Marca | Significado |
|---|---|
| Fuente inspeccionada | El control o contrato está en el código; no demuestra ejecución. |
| API/SQL real | Operación ejecutada en el laboratorio mediante Auth/HTTP y comprobación SQL, con los límites de evidencia de la matriz. No es una aprobación visual. |
| PASS observado; evidencia parcial | Resultado visto por el ejecutor, pero parte del manifiesto inicial se truncó; no reemplazar estados previos perdidos por una consulta del estado final. |
| API/SQL pendiente | No hay resultado suficiente incorporado para esa operación concreta. |
| Visual pendiente | Falta interacción y captura de navegador de esta batería. |
| Faltante de contrato | El código actual no ofrece esa operación como se plantea; no inventar un botón ni sustituirla por otra acción. |

Las pruebas anteriores de dedicatorias y disponibilidad quedan en sus informes históricos; no se reutilizan como PASS de esta ejecución. [COMMERCE30_TEST_MATRIX.md](COMMERCE30_TEST_MATRIX.md) registra resultados comerciales y limitaciones de esta ronda, separando PASS, FAIL, BLOQUEADO y NO EJECUTADO.

## Permisos observados y límites del contrato

El rol real se llama `administrador` o `empleado`, con `is_active=true`. Un usuario inactivo no satisface los controles de personal. La existencia de un enlace en el menú no sustituye la autorización de API y RPC.

| Operación | Administrador activo | Empleado activo | Fuente inspeccionada |
|---|---|---|---|
| Ver dashboard, pedidos, ventas, inventario, caja, productos, categorías, temporadas, clientes y reportes | Sí | Sí | `admin-navigation.ts`, páginas y `requireEmployeeOrAdmin` |
| Crear/editar productos, recetas e insumos; registrar entradas, ajustes y mermas | Sí | Sí según contratos actuales | APIs de productos e inventario con `requireEmployeeOrAdmin`; comprobar RLS/RPC mediante QA30 |
| Consultar promociones | Sí | Sí | GET `/api/admin/promotions` |
| Crear/modificar/activar/desactivar promociones y participantes | Sí | No | Mutaciones de promociones con `requireAdmin` |
| Confirmar/rechazar pago online reportado | Sí | Sí | APIs de confirmación/rechazo; RPC con validación de personal |
| Preparar, marcar listo y finalizar pedido online | Sí | Sí | API `/api/admin/orders/[id]/status` |
| Cancelar pedido pendiente | Sí | Sí | `cancel_order` y botón del detalle |
| Cancelar venta ya pagada | Sí, dentro de los estados permitidos | No | Validación interna `is_admin()`; botón deshabilitado para empleado |
| Ver historial de devoluciones/reintegros | Sí | Sí | GET `/api/admin/orders/[id]/returns` |
| Registrar reintegro, devolución o retorno físico | Sí | No | POST con `requireAdmin`, RPC `is_admin()`, UI `canCreate` |
| Abrir/cerrar caja y registrar movimientos | Sí | Sí | APIs de caja con `requireEmployeeOrAdmin`; reglas internas de sesión siguen vigentes |
| Configuración, usuarios y auditoría | Sí | No | Páginas y APIs administrativas |

**No describir inventario, productos o caja como exclusivos del administrador:** el sistema actual permite operaciones de personal activo. La batería debe comprobar el alcance efectivo con Auth real. Si el propietario desea restringirlas, sería una decisión de permisos posterior, no un supuesto del manual.

### Dos diferencias importantes respecto de los casos solicitados

1. **Caso 02, cargo de entrega:** la interfaz indica «Costo por coordinar; no incluido» y «El total mostrado corresponde a los productos». No existe en el checkout inspeccionado un importe de envío calculado, un campo de tarifa ni un cargo incorporado al total del pedido. Se puede comprobar método, dirección y referencia; no certificar un cargo automático inexistente. Registrar la diferencia como requisito comercial pendiente de decisión.
2. **Caso 22, cancelación por cliente:** no existe ruta pública de cancelación ni botón de autocancelación en checkout/seguimiento. El cliente puede contactar con la tienda; el personal puede usar «Cancelar pedido». Cancelar desde una cuenta de empleado sirve para comprobar liberación de reservas, pero **no demuestra cancelación directa por cliente**. Mantener esa parte del caso como faltante/bloqueada, según la matriz final.

## Tres borradores físicos separados

- [Administrador: inventario, productos, promociones, configuración, caja y reintegros](COMMERCE30_ADMIN_DRAFT.md).
- [Empleado: atención de pedidos, pagos, preparación y límites del puesto](COMMERCE30_EMPLOYEE_DRAFT.md).
- [Cliente: catálogo, tarjetas, carrito, checkout, QR, seguimiento y otra compra](COMMERCE30_CLIENT_DRAFT.md).

Este índice conserva permisos, condiciones de los 30 casos, corte de evidencia y notas responsive. Los procedimientos se mantienen en esos tres archivos; no son una aprobación visual ni manuales definitivos.

## Contratos de los 30 casos: preparación de evidencia

La tabla siguiente vincula procedimientos y condiciones esperadas; **no sustituye los estados de ejecución de la matriz**. Los resultados técnicos actuales, el recorrido cliente y las limitaciones se consolidan a continuación.

| Caso | Procedimiento y condición que debe documentarse |
|---|---|
| 01 | CLI-01/03/04/05/06 + EMP-01/02/03: ramo, recojo, pago y preparación. |
| 02 | CLI-04 + EMP-01/03: entrega, dirección/referencia; cargo automático no implementado, separar el faltante. |
| 03 | CLI-05 + EMP-02: slot QR1 reportado, verificado manualmente. |
| 04 | CLI-05 + EMP-02: slot QR2; reporte permanece pendiente antes de confirmación. |
| 05 | ADM-01/03 + CLI-01: peluche cuya receta no incluye tarjeta; sin editor. |
| 06 | ADM-01/03 + CLI-01 + EMP-01: tarjeta explícita en receta y snapshot exacto. |
| 07 | CLI-01/03 + EMP-01: dos líneas, mensajes diferentes. |
| 08 | CLI-01/03 + EMP-01: dos unidades, dos textos independientes. |
| 09 | ADM-05 + CLI-02: componentes/cantidades/precio del combo; extras aparte. |
| 10 | CLI-02 + EMP-01: tarjeta solo en el componente cuya receta la incluye. |
| 11 | CLI-02/03: quitar componente requerido; descuento retirado/control de servidor. |
| 12 | ADM-05 + CLI-02/04: 10% sobre participantes, cálculo en centavos. |
| 13 | ADM-05 + CLI-02/04: monto fijo aplicado una vez y limitado correctamente. |
| 14 | ADM-05 + CLI-02/04: mínimo de subtotal y beneficio solo elegible. |
| 15 | ADM-05 + CLI-02/04: vencida no aplica; no crear pago/consumo por rechazo. |
| 16 | ADM-05 + CLI-02/04: inactiva no aplica. |
| 17 | CLI-02/03/04: línea ajena conserva importe completo. |
| 18 | CLI-04/05/06: Bs 0 confirmado por contrato, sin QR/pago. |
| 19 | CLI-05 + EMP-01: reporte crea/reutiliza pendiente, no consume ni materializa cliente anticipadamente. |
| 20 | EMP-02/03 + ADM-10: confirmación, consumo único y recibo autorizado. |
| 21 | EMP-02 + ADM-10: rechazo, liberación, sin reposición de stock no consumido. |
| 22 | CLI-06 + EMP-04: autocancelación cliente ausente; no sustituir resultado por cancelación empleado. |
| 23 | CLI-01/04 + ADM-10: última unidad reserva excluyente; segundo intento rechazado. |
| 24 | Dos sesiones/solicitudes reales LOCAL: un ganador según stock, sin doble reserva/negativos; evidencia técnica separada del navegador. |
| 25 | ADM-04 + CLI-01: merma de rosas repercute en todos los productos compartidos. |
| 26 | ADM-02 + CLI-01: reposición recupera productos elegibles, sin reactivar bajas manuales. |
| 27 | ADM-04 + CLI-01: merma de tarjetas afecta solo recetas dependientes. |
| 28 | ADM-09/10: reintegro parcial monetario, inventario intacto y neto conciliado. |
| 29 | ADM-09/10: reintegro total + retorno físico separado, sin devolver dinero ni material dos veces. |
| 30 | CLI-06/01/03/04: nueva compra, seguimiento anterior recuperable; conservación de las dedicatorias correctas en cada pedido. |

## Registro de evidencias por completar

Para cada procedimiento, adjuntar posteriormente: identificador de caso, rol, URL LOCAL, fecha/hora, nombre de captura fuera de Git, viewport y altura reales, pasos ejecutados, resultado esperado/obtenido, estado PASS/FAIL/BLOQUEADO/NO EJECUTADO y referencia a verificación Auth/API/SQL. No incorporar claves, tokens, teléfonos reales ni snapshots personales.

Pendientes expresos: capturas de operaciones administrativas de creación/guardado y del recorrido de empleado; resto de recorridos/productos/promociones; errores y reintentos no observados; navegación móvil/teclado en toda la matriz; lectura visual por empleado; descarga efectiva de recibo autorizado; cierre de caja visual; uso físico por Wi-Fi. Las siete capturas administrativas de lectura y los recorridos cliente expresamente comprobados abajo no sustituyen esos pendientes. El análisis estático no resuelve los pendientes visuales.

## Evidencia QA30 incorporada a estos borradores

### Ejecución técnica real, separada de la UI

En el **corte final** informado por el responsable se registran **146 aserciones, 137 nombres únicos y cero FAIL** en la evidencia actual conservada. No son 146 escenarios comerciales distintos ni sustituyen las respuestas iniciales perdidas. La ronda comprende **27 pedidos atribuibles: 23 finalizados, uno rechazado y tres cancelados**; 25 proceden del runner y dos del recorrido de navegador. Hay **22 pagos: 21 confirmados y uno rechazado**. Los pedidos gratuitos no generan pago. No se presentan como 30 ventas confirmadas: hay excepciones y casos que comparten pedido.

Conciliación final: **ventas brutas Bs 1.719 − reintegros Bs 75 = ventas netas Bs 1.644**; **tres movimientos de caja, neto Bs 105**; **41 insumos conciliados**. El pedido manual LOCAL **#197** quedó fuera del alcance, intacto; no se atribuye su creación ni sus operaciones al runner o al responsable de esta batería y no se suma al corte anterior.

Los casos 01–20 tuvieron PASS observado en terminal, pero una escritura interrumpida truncó su manifiesto original. Se reconstruyeron 17 pedidos durables mediante SELECT, **sin recuperar los snapshots iniciales completos**. Por ello los procedimientos que dependen de esos preestados no se certifican solo a partir de su estado final. La incidencia pertenece al harness; no fue una venta perdida ni una mutación SQL de tablas finales. El runner se corrigió para escritura atómica y conservación de versión anterior.

Evidencia actual útil para los borradores:

- **ADM-01/02/03/04:** productos auxiliares, insumos, recetas, entradas y mermas por APIs administrativas. Casos 23–27 conservan mediciones de físico/reservado/libre, rechazo sin pedido parcial, concurrencia de dos solicitudes, merma protegida por reserva, reposición y diferencia de producto activo/inactivo. La merma de tarjetas afectó al producto con tarjeta y no al que carece de ella.
- **ADM-02 y EMP-05, FIFO:** dos lotes nuevos de dos rosas; venta física de Bs 65 por empleado; consumo exacto de una rosa del lote más antiguo, identificado por `lot_id`; demás lotes intactos. Es prueba secuencial suplementaria real, no una inferencia a partir de totales.
- **ADM-03, fotografía:** multipart de imagen DEMO por API, detalle GET y descarga HTTP 200 con tamaño/SHA-256 iguales. «Subir imagen» en el panel no se observó gráficamente.
- **ADM-08/09/10:** venta física de Bs 50, reintegro de Bs 10; casos 28/29 con Bs 15 y Bs 50, retorno físico e idempotencia sin duplicación. El corte final, incluyendo el pedido confirmado del navegador, concilia ventas brutas Bs 1.719, reintegros Bs 75 y neto Bs 1.644; tres movimientos de caja, neto Bs 105. Los 41 insumos concilian; no convertir esta comprobación en auditoría retrospectiva de cada consumo histórico.
- **EMP-01:** detalle autenticado de pedido con dos mensajes independientes devuelve texto/firma exactos. Falta lectura por empleado mediante navegador.
- **EMP-02/03/04:** confirmación/rechazo, estados hasta finalización y cancelación pendiente se ejecutaron con Auth real. En los casos iniciales se conservan las limitaciones de preestados descritas; los casos 21–29 y verificaciones posteriores tienen evidencia actual.
- **EMP-05:** empleado recibió 403 al intentar configuración, usuarios, crear promoción y registrar reintegro. RPC de seguimiento directo rechazó anon/empleado y permitió servicio; teléfono incorrecto respondió 404 sin pedido/token. No atribuir esos rechazos a capturas de menú.
- **CLI-05:** snapshots durables de QR1/QR2; comprobar un snapshot final no reconstruye por sí solo todas las pantallas previas. La nueva observación de navegador sí conserva el reporte pendiente antes de confirmar por API.

### Recorrido cliente observado por el responsable en navegador real

Se usaron controles reales, sin inyectar carrito por almacenamiento:

1. Búsqueda → detalle del peluche cuya receta tiene tarjeta → cantidad dos → dos dedicatorias distintas y vistas previas.
2. Carrito → recarga → conservación de textos → checkout de recojo; entrega estaba desactivada y la UI mostró esa condición.
3. Creación de pedido #196, total Bs 110 → elección QR2 → recarga que conserva la selección → «Ya pagué» → pago pendiente de revisión.
4. El empleado confirmó **por API/Auth**, no por su UI. El navegador del cliente mostró seguimiento confirmado, en preparación, listo y finalmente «Retirado» al ejecutar las transiciones reales por API.
5. «Hacer otra compra» → carrito vacío → compra de oferta gratuita → formulario de datos vacío, utilizando después el mismo cliente sintético → pedido #198 de total Bs 0, confirmado sin QR ni «Ya pagué».
6. Después del pedido #198 se volvió a consultar #196: seguimiento «Retirado», pago confirmado, dos mensajes exactos y enlace de recibo. La última captura falló; se conserva la observación de interacción real, no una ilustración válida de ese paso. La descarga efectiva del PDF sigue pendiente.

Esto acredita el tramo cliente de CLI-01, CLI-03, CLI-04 para recojo, CLI-05 para QR2 y total cero y CLI-06 para seguimiento/nueva compra, incluyendo recuperar la compra anterior. No acredita la consulta en otro dispositivo. La compra gratuita acredita esa oferta, no todos los descuentos, entrega habilitada ni QR1 visualmente. El caso específico 04 pide caja floral: QR2 con peluche no lo convierte en PASS visual de esa combinación de producto.

Suplemento de **combo mediante navegador, sin crear pedido**: dos peluches sintéticos, uno con tarjeta a Bs 55 y otro sin tarjeta a Bs 50; oferta total Bs 90. «Paso 1 de 2» permitió mensaje y «Continuar al siguiente producto»; «Paso 2 de 2» no mostró editor y «Agregar combo al carrito» produjo dos líneas, mensaje solo en el componente correcto, subtotal Bs 105 y descuento Bs 15. «Eliminar» el segundo componente → «Sí, eliminar producto» produjo aviso de eliminación/descuento retirado, subtotal/total Bs 55 y condición de componente faltante. Es evidencia visual del guiado, asociación y pérdida de elegibilidad, pero **no equivale al caso 09 específico de flores + peluche**, ni demuestra crear o cobrar ese combo. No cambia los conteos de pedidos/pagos.

### Revisión administrativa parcial observada

El propietario inició sesión en el panel LOCAL. En `/admin/pedidos`, «Todos» y búsqueda `196` mostraron recojo en tienda, QR verificado, finalizado y total Bs 110. Abrir el detalle mostró las dos dedicatorias exactas, total Bs 110, recibo administrativo y acción de devoluciones disponible. **No se ejecutó devolución ni otro cambio comercial desde esa pantalla.** Se reprodujo COM30-002: la cabecera del modal mostró erróneamente Efectivo, mientras la fila y el pago real eran QR. Esta observación no acredita UI de empleado ni creación de productos/inventario/caja/configuración.

El responsable continuó con la misma **sesión del propietario administrador LOCAL**; se observaron controles de lectura y apertura de formularios, sin guardar cambios:

| Pantalla | Lectura/interacción comprobada en navegador | Lo que no se ejecutó gráficamente |
|---|---|---|
| `/admin` | Dashboard con métricas y gráfico, incluyendo 149 pedidos globales del laboratorio. Ese total incluye fixtures previos y no sustituye los 27 pedidos atribuibles de esta ronda. | No demuestra cada conciliación del dashboard por una captura ni crea operaciones. |
| `/admin/inventario` | 41 ítems y los tres insumos aislados de QA30 con valores correctos; pestaña «Lotes FIFO»: lote antiguo de 18 de octubre con 1 de 2 unidades y lote nuevo de 19 de octubre con 2 de 2. | Crear insumo, entrada, merma, ajuste o guardar clasificación de tarjeta. |
| `/admin/caja` | Tres movimientos visibles: Bs 65 + Bs 50 − Bs 10, neto Bs 105. | Abrir/cerrar caja o registrar nuevos movimientos. La sesión quedó abierta. |
| `/admin/reportes` | Cargaron «Ventas» y «Productos vendidos». | Descargar todos los PDF ni revisar visualmente cada una de las otras pestañas. |
| `/admin/productos` | Filtrar el conjunto sintético → «Acciones» → «Editar» → «Información» e «Inventario»; receta de tres insumos, cantidad uno de cada uno. | Crear producto, guardar edición, subir foto o agregar/editar receta mediante UI. |
| `/admin/configuracion` | Dos QR DEMO activos, siete días cerrados, pedidos fuera de horario habilitados, entrega deshabilitada y WhatsApp deshabilitado. Es configuración sintética LOCAL. | Guardar horarios, subir QR, activar/desactivar canal o cambiar entrega. |
| `/admin/promociones` | Listado con estados inactiva/vencida/vigente y búsqueda de participantes. | Crear, editar, activar/desactivar promoción o guardar participantes. |

Se generaron siete PNG administrativos nuevos fuera de Git; el inventario de evidencias identifica sus nombres/encuadres. No se atribuyen esas capturas a una cuenta de empleado ni a mutaciones de UI. La observación de una receta ya guardada no acredita el procedimiento gráfico que la creó; las operaciones técnicas correspondientes siguen clasificadas como API/Auth/SQL.

### Capturas disponibles y límites de ilustración

Los archivos `commerce30*.png` están en la carpeta privada de visualizaciones de esta sesión, fuera de Git. Entre las capturas iniciales: `commerce30-08-dedicatorias.png`, `commerce30-08-checkout-review.png`, `commerce30-04-qr2.png` y `commerce30-19-pago-reportado.png`.

La captura de QR2 no encuadra por completo las imágenes QR; no acredita su legibilidad. Varias capturas posteriores resultaron vacías por una incidencia del capturador. En particular, las capturas del carrito gratuito/carro nuevo vacío resultaron fondos en blanco idénticos; no se utilizan como prueba visual. Una imagen vacía no es evidencia visual ni un defecto de la aplicación. No elaborar un manual ilustrado con ellas ni atribuirles viewports por inferencia. Los pasos observados se describen como interacción real del responsable, distinguiéndolos de una captura utilizable.

Admin tiene la revisión parcial de lectura de las pantallas indicadas; los procedimientos de crear/guardar/operar y todo el recorrido de empleado siguen sin documentación visual aprobada. Tampoco hay PASS de celular físico. La revisión CSS siguiente no reemplaza una inspección real de cada ancho/altura.

### COM30-001: instrucción de WhatsApp sin canal disponible

Hallazgo **BAJO/P3** observado en el aviso de pago cuando WhatsApp está deshabilitado: el párrafo todavía dice que el cliente debe pulsar Enviar, mientras no hay enlace disponible. El reporte quedó correctamente pendiente; no se produjo un envío ni una confirmación automática por el texto. Causa de presentación confirmada en `checkout-page.tsx`: ese párrafo no depende de `meta.whatsapp`, a diferencia del enlace. El borrador debe explicar la función real y no convertir esa instrucción en un paso posible con el canal deshabilitado. No se modificó código en esta tarea.

### COM30-002: detalle administrativo etiqueta QR como Efectivo

- **Prioridad:** MEDIO/P2; presentación del método de pago en el detalle de pedidos, potencialmente visible a administrador y empleado.
- **Reproducción observada:** cuenta administrativa LOCAL, `/admin/pedidos` → «Todos» → buscar #196 → fila «QR · verificado» → abrir detalle → cabecera «Efectivo · verificado». Pedido finalizado de Bs 110, pago QR2 confirmado; dedicatorias y total correctos.
- **Esperado:** el método del modal coincide con el pago QR y el listado. **Obtenido:** se representa Efectivo por ausencia de dato, sin advertencia.
- **Causa confirmada por lectura:** `src/app/api/admin/orders/[id]/route.ts:11` selecciona `payments(status, confirmed_at)` y omite `method`; el listado en `src/app/api/admin/orders/route.ts:13` sí lo selecciona. `orders-panel.tsx:392–398` carga ese detalle y `:469` invoca `paymentLabel`; el helper `:350` interpreta cualquier valor distinto de `qr`, incluido `undefined`, como Efectivo. `orderContact` no reconstruye el método omitido.
- **Impacto:** confunde la verificación/consulta del personal y contradice la fila; debe aclararse antes del manual definitivo. No se ha demostrado importe erróneo, mutación de pago, caja o libro contable por esta representación. El recibo administrativo consulta `method` por separado (`receipt/route.tsx:41`, `:78`) y reportes usan `payment_method` del libro; no se los declara afectados sin prueba.
- **Mutación parcial:** ninguna por abrir/listar el pedido. La causa es contrato de lectura/presentación, no una operación comercial. La fila/operación QR se conservan.
- **Propuesta pendiente de revisión:** completar el dato necesario en el contrato de detalle y evitar que un método ausente se presente como efectivo. No se modificó código ni API en esta ronda documental.

## Notas de revisión responsive estática

**Revisión de CSS/componentes; no es validación visual PASS ni medición DOM de esta ejecución.** No se usó un navegador redimensionado desde este agente. El responsable debe completar los viewports y alturas reales antes de certificar responsive.

| Ancho objetivo | Comportamiento previsto por reglas inspeccionadas | Pendiente visual específico |
|---|---|---|
| 375 px | Checkout/seguimiento en una columna; navegación de compra de escritorio oculta; acciones ocupan toda fila; QR en una columna; carrito ocupa ancho disponible. | Teclado abierto, textos largos, botones finales y altura útil de carrito/modal. |
| 390 px | Mismas reglas móviles; margen lateral 18 px en contenido y tarjeta con padding 20 px; firmas/nombres pueden partir palabras. | Dedicatorias extensas, scroll de resumen, selección QR y focus sin ocultar CTA. |
| 430 px | Checkout sigue una columna; si hay dos QR, el fieldset cambia a dos columnas en `min-[430px]`; imágenes `max-w-full` y etiquetas `break-words`. | Legibilidad real de cada QR al entrar en dos columnas; no se deduce de `max-w-full`. |
| 768 px | Termina el media query de 767: checkout pasa a dos columnas `minmax(0,1.3fr) minmax(0,.85fr)` y resumen sticky; diálogos admin se centran en `md`; menú principal aún móvil hasta `lg`. | Frontera de breakpoint: formularios, dos QR y columna de resumen más estrechos; no afirmar ausencia de overflow sin medir. |
| 1280 px | Columnas de detalle/promoción y navegación escritorio; contenido de compra limitado a 1180 px; menú admin fijo desde `lg`; carrito máximo 460 px. | Nombres e importes largos, tarjetas con muchas dedicatorias, combos y modales con altura reducida. |
| 1440 px | Contenido acotado, no crece indefinidamente; disposición escritorio y límites anteriores. | Espaciado/lectura del resumen y botones con distintos zoom/alturas. |

Controles estáticos revisados:

- **Contención y texto:** columnas públicas usan `minmax(0,...)`; tarjetas y partes flex incluyen `min-width:0`; resumen y dedicatorias usan `overflow-wrap:anywhere`, `break-words` o equivalente. Las imágenes QR limitan su ancho y usan `object-contain`. No se detectó por lectura un ancho fijo de formulario superior al viewport, pero no se convierte esa observación en prueba de ausencia de overflow.
- **Carrito:** panel `w-full max-w-[460px]`, columna flex de altura completa; encabezado y resumen `shrink-0`, cuerpo `min-h-0 flex-1 overflow-y-auto`; promociones dentro del cuerpo. Las dedicatorias pueden alargar el cuerpo desplazable sin empujar por diseño el pie. Comprobar aún alturas cortas y teclado real.
- **Checkout:** la lista del resumen tiene máximo `42dvh`, desplazamiento propio y foco de teclado; totales fuera de esa lista. Acciones flex con wrap; a menos de 768 ocupan fila completa. Inputs/textarea/select usan `width:100%`; los labels de campos y errores tienen asociaciones accesibles en el formulario principal.
- **Navegación móvil:** encabezado público usa menú bajo `lg`; sus paneles tienen ancho relativo y máximo. Navegación inferior de seguimiento/inicio tiene botones de mínimo 44 px y reserva `76px + safe-area`; carrito tiene z-index 110 y queda por encima de la barra. No existe barra inferior en checkout que este CSS deba ocultar para pagar.
- **Admin/tablas:** layout de escritorio tiene columna principal `minmax(0,1fr)` y `min-w-0`; tablas genéricas en contenedor `overflow-x-auto`, no se fuerza que todas las columnas quepan en móvil. Pedidos usa tarjetas bajo `md`; formularios de inventario combinan una y dos columnas según `sm`.
- **Diálogos:** hoja móvil de ancho completo y máximo `90dvh` con scroll vertical, márgenes seguros inferiores; a `md` se centra. Gestión de productos añade zona interior con `min-h-0` y overflow. El menú admin móvil limita a `85vw` y contiene foco mediante Radix. Falta observar errores largos y acciones de reintegro con teclado real.
- **Accesibilidad/movimiento:** existen focos visibles, labels, regiones de estado/error y `prefers-reduced-motion` que anula animaciones/transiciones. Revisar por navegación real tabulador/lector/contraste antes de aprobar accesibilidad; no se calcularon relaciones de contraste en esta tarea.

No se modificaron componentes, CSS, APIs, SQL, permisos ni reglas comerciales para elaborar estas notas.

### Referencias de implementación inspeccionadas

- Permisos y menú: `src/lib/auth/permissions.ts`, `src/config/admin-navigation.ts`.
- Panel y contratos del personal: `src/components/admin/orders/orders-panel.tsx`, `order-returns.tsx`, APIs `/admin/orders`, `/admin/payments`, `/admin/cash-sessions`.
- Inventario/productos: `inventory-management.tsx`, `product-management.tsx`, `product-form.tsx`, `product-inventory-management.tsx`, `product-image-management.tsx` y sus APIs.
- Configuración/promociones/reportes: `checkout-configuration.tsx`, `system-settings.tsx`, `promotion-management.tsx`, `reports-panel.tsx`.
- Cliente: `home/product-detail.tsx`, `home/home-page.tsx`, `home/cart.tsx`, `checkout-form.tsx`, `checkout-page.tsx`, `checkout-payment.tsx`, `tracking-page.tsx`, `order-summary.tsx`, `order-number-actions.tsx`.
- Reglas SQL finales: cadena activa de 14 migraciones, especialmente concurrency/zero total, inventory/refunds/ledger, disponibilidad y dedicatorias. No modificar migraciones para adaptar el manual.
