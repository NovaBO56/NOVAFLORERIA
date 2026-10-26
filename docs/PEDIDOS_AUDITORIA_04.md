# Auditoría 04 — Gestión de pedidos

## Inspección previa a la implementación (24/10/2026)

Rama abierta desarrollo-auditoria, HEAD 699988bccb104aef01684c05ea90b3432b2d6c4b. Se conservan los cambios sin commit de Productos, complementos, ubicación y catálogo DEMO. Solo LOCAL, sin reset ni borrado de pedidos/usuarios.

Referencia leída: pedido_redesign.html. Se reutiliza su jerarquía de modal, etapas, cliente, horario, artículos, pago y pie; no el fondo oscuro, teléfono, composición fija, plazo de 45 minutos, simulación de WhatsApp enviado ni acción combinada pago/preparación.

| Mejora | Estado encontrado antes de editar |
|---|---|
| Progreso visual | Estados y acciones reales en OrdersPanel; helper público orderJourney disponible. Sin timeline administrativo en el detalle. |
| Horario persistente | No hay columnas, API ni editor de programación en orders. El mensaje del cliente distingue modalidad, no prueba aceptación de un horario. |
| Composición histórica | Hay snapshot de nombre/precio/personalización/dedicatoria y reservas agregadas por pedido; no hay snapshot fiable de receta por artículo. No debe reconstruirse del catálogo actual. |
| Contacto | Cliente/guest unificado por orderContact; compartir recibo abre WhatsApp. Faltan copiar número y plantillas generales con aviso de mensaje preparado. |
| Acciones dinámicas | Confirmar/rechazar, cancelar con motivo/roles, avanzar estados, solicitud de eliminación y recibos ya existen. Confirmar pago NO inicia preparación. |
| Historial | Existe audit_logs y el mecanismo audit_sensitive_change. Revisar eventos disponibles y proyectar solo campos permitidos, sin exponer snapshots completos. |
| Otras funciones | OrderReturns conserva reintegro, devolución, retorno físico e idempotencia; pedidos con inventory_review_required bloquean confirmación. Listado con búsqueda, filtros y paginación de servidor; tabla y tarjetas móviles. |

No se modifica el motor de reservas/FIFO, la confirmación manual, checkout, promociones, recibos o devoluciones. Las adiciones SQL serán incrementales y sin backfill de datos históricos.
