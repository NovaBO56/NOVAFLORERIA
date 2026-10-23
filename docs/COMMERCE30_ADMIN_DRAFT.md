# QA30 — manual del administrador (borrador)

Fecha: 20 de octubre de 2026. Base inspeccionada: `42b75b8166e60cf9c44709c1891905da70a42e22`, rama `codex/inventory-refunds-dashboard-2`.

**Borrador preliminar LOCAL; no es manual definitivo.** Los estados y límites de evidencia se conservan en el [índice de procedimientos QA30](COMMERCE30_PROCEDURES_DRAFTS.md) y la [matriz comercial](COMMERCE30_TEST_MATRIX.md). No ejecutar estas simulaciones en producción. Sin credenciales ni capturas incorporadas al repositorio.

Todos estos procedimientos tienen **fuente inspeccionada y mutaciones visuales pendientes**, con revisión parcial de lectura real del administrador. Hay evidencia técnica de inventario/recetas/productos, entradas/mermas, promociones, caja, reintegros y reportes; el alcance concreto y la incidencia de manifiesto se indican en el cierre de evidencia del índice común y en la matriz. El propietario inició sesión LOCAL y consultó #196: fila QR verificado/finalizado/Bs 110; detalle con las dos tarjetas exactas, total, recibo y acción de devolución disponible. No operó devoluciones desde la UI. **COM30-002/P2:** el modal rotuló Efectivo por ausencia de `payment.method` en el API de detalle, contradiciendo la fila QR. No usar esa etiqueta como referencia bancaria; no hay evidencia de mutación contable.

## Lecturas administrativas observadas

- Dashboard: métricas y gráfico cargaron; 149 pedidos globales del laboratorio, no 149 ventas de esta ronda.
- Inventario: 41 ítems y tres insumos aislados correctos; «Lotes FIFO» mostró antiguo de 18 de octubre con 1/2 unidades y nuevo de 19 de octubre con 2/2.
- Caja: movimientos Bs 65 + Bs 50 − Bs 10 visibles; neto Bs 105; caja sin cerrar.
- Reportes: «Ventas» y «Productos vendidos» cargaron.
- Productos: filtrar el conjunto sintético → «Acciones» → «Editar» → «Información» e «Inventario»; receta de tres insumos con cantidad uno de cada uno, sin guardar.
- Configuración: dos QR DEMO activos, siete días cerrados, fuera de horario habilitado, entrega deshabilitada y WhatsApp deshabilitado; sin guardar.
- Promociones: estados inactiva/vencida/vigente y búsqueda de participantes, sin crear/editar.

Hay siete PNG administrativos nuevos fuera de Git, inventariados por separado. Estas observaciones acreditan lectura y localización de controles, **no crear/guardar/registrar/cerrar ni otra mutación de UI**. La evidencia API/Auth/SQL se mantiene separada. El resto del procedimiento operativo de cada apartado continúa pendiente de documentación visual.

## ADM-01. Registrar un insumo y clasificar una tarjeta

- Rol y previos: administrador LOCAL activo; material sintético identificable; no reutilizar nombres como mecanismo de clasificación.
- Ruta: `/admin/inventario` → «Nuevo ítem».
- Campos reales: «Nombre», «SKU», «Unidad», «Tipo», «Stock mínimo». Para tipo `insumo` aparece «Tarjeta de dedicatoria».
- Pasos: escribir los datos; elegir el tipo y unidad correctos; marcar tarjeta solo cuando corresponda; guardar mediante «Crear ítem» o, al editar, «Guardar cambios».
- Resultado esperado: material registrado sin inventar existencias; la marca habilita dedicatorias solamente si una receta lo incluye. Registrar las existencias por entrada, no por el formulario del ítem.
- Errores: SKU repetido; tarjeta con tipo distinto de insumo; cantidades fraccionarias en una receta de tarjeta. Corregir los datos y reintentar; no cambiar el tipo para eludir una validación.
- Evidencia: captura `ADM-01` pendiente; casos 05–08, 10 y 27.

## ADM-02. Entrada, reposición y lotes

- Ruta: `/admin/inventario` → «Registrar entrada».
- Campos: «Ítem», «Cantidad», «Costo unitario», «Proveedor», «Notas».
- Pasos: seleccionar el material sintético; indicar cantidad/unidad y costo demostrativos; identificar la simulación en proveedor/notas; «Registrar entrada»; consultar «Lotes FIFO» y movimientos.
- Resultado esperado: entrada, lote y movimiento coherentes; stock físico aumenta. La capacidad de productos activos se recupera según su receta; no se reactiva un producto desactivado manualmente.
- Error: entrada rechazada o respuesta incierta. Consultar movimientos antes de repetir; no duplicar una compra de insumos por desconocer el resultado anterior.
- Evidencia: `ADM-02` pendiente; casos 23, 25–27 y conciliación FIFO. El lote deriva de la entrada; no inventar un botón independiente «Crear lote».

## ADM-03. Producto, foto y receta

- Ruta: `/admin/productos` → «Nuevo producto»; después abrir «Gestionar producto».
- Campos de «Información»: «Nombre», «Precio», «Categoría», «Temporada», «Ocasión», «Orden del catálogo», «Descripción» y controles de estado, entre ellos «Disponible», «Agotado» y «Activo».
- Pasos: crear con precio positivo en Bs; usar «Crear producto»; abrir el mismo producto; pestaña «Fotos» → «Subir imagen» con un archivo sintético autorizado; pestaña «Inventario» → elegir ítem/cantidad → «Agregar»; comprobar cada material de su receta.
- Resultado esperado: receta real vinculada a insumos compartidos. Una foto o bandera «Disponible» no sustituye stock libre ni receta completa. Los componentes informativos se gestionan en «Componentes» y no crean un inventario independiente.
- Cambiar estado: editar «Activo»/«Disponible»/«Agotado» y «Guardar cambios»; no confundir baja administrativa con agotamiento calculado.
- Errores: precio cero o inválido; material duplicado en receta; cantidad no válida; carga de imagen rechazada; receta incompleta. Resolver en el formulario correspondiente antes de habilitar venta.
- Evidencia: `ADM-03` pendiente; casos 01–10, 23, 25–27. La receta de tarjeta debe usar cantidades enteras.

## ADM-04. Merma o ajuste

- Ruta: `/admin/inventario` → «Registrar merma»; para corrección de conteo usar «Ajustar stock».
- Merma: «Ítem», «Lote», «Cantidad», «Motivo»; confirmar «Registrar merma». El lote puede dejarse al criterio FIFO ofrecido por el formulario.
- Ajuste: «Ítem», «Ajuste», «Motivo»; «Guardar ajuste». No usar ajuste como sustituto ambiguo de una entrada o devolución.
- Resultado esperado: registrar el hecho real simulado; no consumir material comprometido por reservas; mantener conciliación de lotes/stock/movimientos. La merma de tarjetas puede agotar un producto con tarjeta sin afectar un producto que no las requiere.
- Error de insuficiencia o reserva: revisar físico, reservado y lote; no cancelar pedidos ni alterar stock para forzar la prueba.
- Evidencia: `ADM-04` pendiente; casos 25–27 y control de merma con reservas.

## ADM-05. Crear y administrar una promoción

- Ruta: `/admin/promociones` → «Nueva promoción».
- Campos: «Nombre comercial», «Tipo de promoción», «Descripción»; para combo «Precio final del combo» y cantidades de cada participante; para descuentos «Tipo de beneficio» y valor; «Buscar productos»; «Inicio», «Finalización», «Subtotal mínimo del pedido».
- Pasos: elegir productos participantes; comprobar la vista previa; «Crear promoción»; reabrir y usar «Guardar cambios» para correcciones. Lista: «Activar» / «Desactivar».
- Resultado esperado: una promoción por pedido. El mínimo se compara con subtotal completo, pero el beneficio afecta solo a productos participantes. Combo exige todos sus componentes/cantidades; extras aparte. La sugerencia de descuento no debe aplicarse sin selección expresa del cliente.
- Error de participantes guardados parcialmente: el formulario avisa que la promoción se creó pero faltó guardar productos; revisar y reintentar «Guardar cambios», sin crear una promoción duplicada.
- Evidencia: `ADM-05` pendiente; casos 09–18. No prometer descuento sobre productos ajenos ni acumulación.

## ADM-06. Horarios y pausa de entrega

- Ruta: `/admin/configuracion`.
- Horarios: bloque «Horarios de atención»; editar apertura/cierre o «Cerrado» por día y pulsar «Guardar [día]». Zona horaria mostrada: America/La_Paz.
- Entrega: en configuración general, interruptor «Entrega a domicilio»; el guardado es por la propia acción del interruptor. Comprobar mensaje y recarga.
- Pedidos fuera de horario: control «Permitir pedidos fuera de horario» / «Desactivar pedidos fuera de horario» es independiente de entrega.
- Resultado esperado: al pausar entrega se impiden nuevas entregas, continúa recojo y se conservan pedidos existentes. No cambia el importe de los productos ni crea una tarifa de envío.
- Error: fallo de guardado; no interpretar el cambio local del control como persistencia hasta comprobar respuesta/recarga. No mezclar horario con disponibilidad de envío.
- Evidencia: `ADM-06` pendiente; caso 02 y controles transversales de entrega/recojo.

## ADM-07. QR y WhatsApp: mantenimiento de configuración

- Ruta: `/admin/configuracion`; bloques QR 1/QR 2 y «WhatsApp» existentes.
- QR: preservar etiqueta/imagen/activo de cada slot; usar solo imágenes sintéticas de laboratorio. Las etiquetas no prueban pago. Falta incorporar captura de controles exactos del editor QR antes de convertir este apartado en instrucciones ilustradas.
- WhatsApp: «Número internacional»; «Guardar y activar WhatsApp» o «Desactivar WhatsApp». No enviar mensajes reales durante QA.
- Resultado esperado: checkout ofrece únicamente QR activos; selección y etiqueta reportadas se conservan como información auxiliar; no confirman pago.
- Evidencia: `ADM-07` pendiente; casos 03, 04 y 19–21. Si no hay QR, no inventar cuenta bancaria; dejar la compra en su manejo seguro de configuración incompleta.

## ADM-08. Caja y venta física

- Ruta `/admin/caja`: si no hay sesión abierta, seleccionar caja, «Monto inicial» y «Abrir caja». Con sesión: consultar apertura, esperado en efectivo y movimientos.
- Movimiento manual: «Ingreso», «Gasto», «Ajuste» o «Devolución»; «Monto» y «Motivo» cuando se requiera; para ajuste «Entrada» / «Salida»; «Registrar». Este movimiento no sustituye el reintegro vinculado al pedido.
- Venta física: `/admin/ventas`, buscar producto, «Agregar», cantidades, cliente opcional; promoción o descuento manual con motivo, sin acumular ambos; elegir «Efectivo» o «QR»; «Cobrar».
- Resultado esperado: venta física se registra finalizada y pagada en la operación; no pasa por la preparación del pedido online. Requiere caja abierta según contrato. QR en venta física no equivale a reporte público pendiente: el personal registra un cobro ya comprobado.
- Cierre: «Cerrar caja», «Monto contado», «Nota de cierre»; si hay diferencia, revisar y marcar «Confirmo el cierre con esta diferencia.» antes de «Confirmar cierre».
- Errores: no hay cajas activas, caja no abierta, stock insuficiente, importe o diferencia inválidos. No usar movimientos ficticios para cuadrar el esperado.
- Evidencia: `ADM-08` pendiente; contexto financiero de casos 28–29 y controles diarios. También permitido a empleado activo por los contratos actuales.

## ADM-09. Reintegro, devolución o retorno físico

- Previos: pedido finalizado; o cancelado con pago confirmado para reintegro exclusivamente monetario. Identificar el monto realmente simulado y autorizado.
- Ruta: `/admin/pedidos` → abrir pedido → «Devoluciones y reintegros» → «Registrar devolución o reintegro».
- Elegir «Reintegro: solo dinero», «Devolución: dinero y pedido completo» o «Retorno físico: solo inventario, sin dinero»; completar «Monto a devolver (Bs)» si corresponde y «Motivo»; «Confirmar operación».
- Resultado esperado: reintegro no aumenta stock; retorno físico no devuelve dinero; devolución combina ambas partes. La restitución es de todo el inventario del pedido, una vez; no hay selección de unidades devueltas por línea en esta pantalla. El importe acumulado no supera lo cobrado.
- Venta física: caja original abierta, conservando método original. Pedido online: el registro no hace una transferencia bancaria; el dinero se entrega y verifica fuera del sistema. Pedido cancelado ya restituyó inventario: solo admite reintegro para no devolverlo dos veces.
- Errores: límite excedido, caja cerrada, estado no permitido, retorno repetido. Consultar historial antes de repetir; conservar la clave de reintento del formulario. El empleado puede ver historial, no registrar estas operaciones.
- Evidencia: `ADM-09` pendiente; casos 28–29. Riesgo estático a comprobar en acceso LAN HTTP: este formulario usa `crypto.randomUUID`; no se declara fallo real sin reproducirlo.

## ADM-10. Conciliación y reportes

- Rutas: `/admin` y `/admin/reportes`.
- Pestañas: «Ventas», «Caja», «Inventario», «Mermas», «Cancelaciones», «Clientes», «Productos vendidos». Aplicar «Desde» / «Hasta» cuando corresponda; opción «Descargar PDF».
- Comprobar ventas brutas, reintegros monetarios y ventas netas por fecha; físico, lotes, reservas y movimientos por material; no sumar pagos reportados como cobros confirmados.
- Resultado esperado: el informe coincide con operaciones y fechas verificadas. Un retorno físico sin dinero no reduce ventas netas por sí solo; una cancelación operativa no borra un cobro sin reintegro.
- Evidencia: `ADM-10` pendiente; casos 01–30, especialmente 20–29. El empleado también puede consultar estos reportes.

## Contexto de evidencia y revisión pendiente

El índice común conserva el corte final de 27 pedidos atribuibles, 22 pagos, conciliaciones y 146 aserciones registradas (137 nombres únicos, cero FAIL), así como la pérdida parcial del manifiesto inicial. El pedido manual LOCAL #197 queda fuera del alcance e intacto; no se atribuye autoría. Un PASS técnico no aprueba pantallas ni responsive. Consultar allí las capturas utilizables, las capturas vacías, los hallazgos COM30-001/COM30-002 y las limitaciones de cada rol. Falta revisión del propietario antes de elaborar un manual ilustrado definitivo.
