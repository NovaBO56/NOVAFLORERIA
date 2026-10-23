# QA30 — manual del empleado (borrador)

Fecha: 20 de octubre de 2026. Base inspeccionada: `42b75b8166e60cf9c44709c1891905da70a42e22`, rama `codex/inventory-refunds-dashboard-2`.

**Borrador preliminar LOCAL; no es manual definitivo.** Los estados y límites de evidencia se conservan en el [índice de procedimientos QA30](COMMERCE30_PROCEDURES_DRAFTS.md) y la [matriz comercial](COMMERCE30_TEST_MATRIX.md). No ejecutar estas simulaciones en producción. Sin credenciales ni capturas incorporadas al repositorio.

Estado: **fuente inspeccionada y visual pendiente**. Auth/API reales comprobaron lectura exacta de dedicatorias por empleado, confirmación/rechazo, avance y finalización, cancelación pendiente y denegación de configuración/usuarios/creación de promociones/reintegros. Los detalles técnicos conservados y sus límites están en la matriz. No se obtuvo una sesión de empleado en el navegador: el usuario informó que solo podía acceder como administrador. Eso limita la documentación visual; no demuestra fallo de autorización. La contraseña sintética se obtiene del mecanismo privado del laboratorio; nunca se incorpora a este archivo.

La revisión posterior en sesión del propietario administrador LOCAL permitió leer pedidos, inventario, lotes, caja, productos y reportes, además de configuración/promociones administrativas. **No equivale a iniciar sesión como empleado ni a probar sus botones o permisos gráficos.** La lista de pantallas observadas está en el índice; las restricciones del puesto aquí descritas continúan basadas en Auth/API real y fuente inspeccionada. COM30-002 advierte la etiqueta QR/Efectivo incorrecta en el modal compartido; no inferir el método bancario a partir de esa etiqueta.

## EMP-01. Ingresar y encontrar el pedido

1. Abrir `/login` LOCAL e iniciar sesión con cuenta de empleado activa.
2. Ir a `/admin/pedidos` y usar «Con pago por verificar» para avisos de pago; «Pendiente de pago» también incluye pedidos sin aviso.
3. Buscar por «Buscar por número, cliente o teléfono». Los filtros incluyen «Activos», «Todos», «Confirmados por preparar», «En preparación», «Listos para entrega / recojo», «Finalizado», «Cancelado», «Expirados» y «Pago rechazado»; tipo «Online» / «Física» y paginación «Anterior» / «Siguiente».
4. Abrir fila/tarjeta de pedido. Revisar número, cliente, importe, descuento, método de entrega y mensaje del cliente. Leer las tarjetas individuales y sus firmas en las líneas.

Resultado esperado: pedido y dedicatorias exactos, sin confundirlo con otro. Un pago sin reportar no presenta acciones de verificación. Captura `EMP-01` pendiente; casos 01–10, 19–21.

## EMP-02. Verificar el aviso de pago

1. Abrir pedido online pendiente con «Pago por verificar».
2. Revisar «QR indicado: [etiqueta] ([slot])» e importe. El QR indicado y el aviso no son evidencia bancaria.
3. En operación comercial real, verificar el banco por el procedimiento del propietario. En QA LOCAL, usar exclusivamente la simulación autorizada; no pagar ni enviar mensajes reales.
4. Si procede, «Confirmar pago» → leer «¿Verificaste el pago en el banco?» → «Sí, confirmar pago verificado».
5. Si no corresponde, «Rechazar pago» → «Motivo del rechazo» → «Confirmar».

Resultado esperado: confirmación manual cambia pedido y consume la reserva una sola vez; rechazo libera reserva. Un pedido antiguo con receta incompleta muestra aviso y bloquea confirmar: derivar al administrador, no reconstruir su histórico cambiando ahora la receta.

Errores: no se puede verificar, estado cambiado, reserva inválida, inventario con revisión requerida. Actualizar pedido y consultar al administrador; no repetir confirmaciones a ciegas. Captura `EMP-02` pendiente; casos 03–04, 19–21.

## EMP-03. Preparar, dejar listo y entregar

1. Abrir pedido online confirmado. Comprobar productos, cantidades, personalizaciones, cada dedicatoria, dirección/referencia o recojo.
2. «Marcar en preparación»; después «Marcar listo»; al completar la entrega/recojo real simulado, «Finalizar pedido».
3. Consultar seguimiento del cliente con sus datos sintéticos y comprobar que refleja cada estado.

Resultado esperado: secuencia de estados sin saltos; textos y snapshots intactos. No hay botón separado «En camino» ni estados de reparto inventados en el contrato inspeccionado. Las ventas físicas ya finalizadas no muestran esta secuencia. Captura `EMP-03` pendiente; casos 01–10, 20 y 30.

## EMP-04. Cancelación, recibo y escalamiento

- Pedido pendiente: «Cancelar pedido» → «Motivo de la cancelación» → «Confirmar»; comprobar reserva liberada, sin consumo ni cobro artificial.
- Pedido pagado: la cancelación es exclusiva de administrador. No cambiar de cuenta ni usar otra API para eludirlo.
- «Ver / descargar recibo» aparece cuando existe autorización/token de recibo; «Enviar recibo por WhatsApp» prepara una acción externa, no envía por sí solo.
- Reintegros: leer historial, avisar al administrador. No hay permiso de empleado para crear reintegro/devolución/retorno físico.
- «Solicitar eliminación» en pedido cancelado es una solicitud de revisión, no la cancelación ni una eliminación inmediata. No usarla en QA para borrar evidencia.

Captura `EMP-04` pendiente; casos 21–22 y 28–29. Cancelación hecha por empleado no debe contabilizarse como autocancelación por cliente.

## EMP-05. Caja y alcance del puesto

Referencia compartida: [borrador del administrador](COMMERCE30_ADMIN_DRAFT.md), procedimientos ADM-01–04 y ADM-08.

La navegación y APIs permiten operar caja, ventas físicas, productos e inventario según los controles actuales; usar ADM-01–04 y ADM-08 como referencia compartida. Promociones se consultan sin facultad de edición. Usuarios, configuración y auditoría quedan fuera del puesto. Confirmar estos límites con Auth real y registrar capturas de acceso denegado, no solo ausencia del menú. Evidencia `EMP-05` pendiente.

## Contexto de evidencia y revisión pendiente

El índice común conserva el corte final de 27 pedidos atribuibles, 22 pagos, conciliaciones y 146 aserciones registradas (137 nombres únicos, cero FAIL), así como la pérdida parcial del manifiesto inicial. El pedido manual LOCAL #197 queda fuera del alcance e intacto; no se atribuye autoría. Un PASS técnico no aprueba pantallas ni responsive. Consultar allí las capturas utilizables, las capturas vacías, los hallazgos COM30-001/COM30-002 y las limitaciones de cada rol. Falta revisión del propietario antes de elaborar un manual ilustrado definitivo.
