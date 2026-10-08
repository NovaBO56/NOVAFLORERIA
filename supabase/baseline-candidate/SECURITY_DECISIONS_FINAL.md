# Decisiones técnicas finales: drift y RPC

Fecha: 7 de octubre de 2026. **Cerradas técnicamente para revisión; ejecución remota no aprobada.** No se consultó Supabase en esta etapa ni se ejecutaron mutaciones. «Remoto» se refiere al snapshot de auditoría anterior. Ningún ataque fue ejecutado contra pedidos reales. Los 39 originales y el historial se conservan.

## Entrega y autoridad de las decisiones

Este documento sustituye las propuestas iniciales de SECURITY_REVIEW y los párrafos iniciales de DRIFT_DECISIONS. Las definiciones remotas/locales completas de las seis firmas siguen en [DRIFT_DECISIONS.md](DRIFT_DECISIONS.md). El SQL oficial de confirmación está en [CONFIRM_PAYMENT_FINAL.sql](CONFIRM_PAYMENT_FINAL.sql), el contrato de pago en [CREATE_PAYMENT_FINAL.sql](CREATE_PAYMENT_FINAL.sql). Las demás definiciones elegidas están completas en [036_security_rpc_hardening.sql](036_security_rpc_hardening.sql).

La baseline candidata se actualizó para reflejar estas decisiones. Para instalación nueva se usa la baseline actualizada más seeds; para ensayar el delta sobre una copia del esquema auditado se usa 036. No ejecutar las dos alternativas indistintamente sobre producción. La 036 no contiene 035, DML de limpieza, DROP ni cambios de historial.

## 1. Drift: antes/después y riesgo

| Firma | Remoto auditado | Último local | Decisión oficial | Consumidores | Riesgo al cambiar |
| --- | --- | --- | --- | --- | --- |
| release_expired_reservations(uuid) | CTE libera reservas reserved vencidas, opcionalmente de un ítem; cancela sus pedidos pendiente_pago, guarda motivo/fecha; devuelve cantidad de reservas liberadas | 010 solo libera reservas y devuelve cantidad; no cancela pedido | Conservar remoto y restringir acceso externo a servidor | Sin RPC Next directo; llamadas SQL desde create_order y create_physical_sale | Sin cambio de cuerpo. La cancelación solo persiste si la transacción del llamador confirma; un llamador que falla revierte todo. Reservas de otros ítems pueden seguir marcadas reserved temporalmente; revisar consistencia |
| confirm_payment(uuid) | Autentica personal activo, bloquea pago/reservas; libera vencidas, intenta cancelar pedido, luego RAISE si hay reservas inválidas; confirma pago/pedido y consume FIFO si válidas | 013 rechaza reservas vencidas/liberadas con mensaje correcto; no promete cancelación persistida; consume FIFO si válidas | Derivar de 013 y agregar guardias de pedido pendiente online/no eliminado, monto positivo finito coincidente y plazo. Bloquear pedido antes de pago. Rechazo aborta sin cambios persistidos | POST /api/admin/payments/[id]/confirm | Nuevos rechazos de datos inconsistentes antes aceptados. Cambia mensaje; no afirmar cancelación automática desde un RPC abortado. Cambio de orden de bloqueos exige prueba concurrente con rechazo/cancelación |
| create_physical_sale(jsonb,uuid,uuid,numeric,text,text) | Valida vendedor activo/caja/productos/stock/pago; crea pedido fisica FINALIZADO, descuento, consumo FIFO, pago confirmado y movimiento de caja | 026 mismo flujo, pedido CONFIRMADO | Conservar remoto finalizado: venta entregada no entra en preparación; devoluciones exigen finalizado | POST /api/admin/sales | Sin cambio funcional remoto; probar caja/reportes/devoluciones y opciones de personalización como limitación existente |
| advance_order_status(uuid,text) | Personal activo; bloquea pedido; exige transición confirmado→en_preparacion→listo→finalizado; rechaza saltos | Ausente en migrations y MASTER auditados | Versionar exactamente remoto | POST /api/admin/orders/[id]/status | Sin cambio de cuerpo; ahora queda reproducible. Verificar disparo notify_order_ready |
| create_order(text,text,text,jsonb,text,text) | Cuerpo antiguo 020: cliente/productos/opciones, reserva 30 minutos, idempotencia; no tiene controles finales de horario/promoción/inventario de opciones de 031 | No existe firma final: 025 la retiró | Sin acceso externo en 036; ausente de baseline nueva. DROP físico pendiente de aprobación y verificación de consumidores externos | Ninguna llamada de seis argumentos en src; /api/orders llama siete | Un consumidor externo antiguo recibirá permission denied. No se borra función ni datos en 036 |
| create_order(text,text,text,jsonb,text,text,uuid) | Coincide con 031: horario, productos/cantidades/opciones válidas, stock de receta y opciones, reserva 30 minutos, descuentos y promoción, idempotencia | 031 mismo cuerpo | Conservar 031/remoto coincidente; A (público) | POST /api/orders | Sin cambio de cuerpo remoto. Idempotencia antes de comprobar propiedad permite recuperar UUID si se conoce clave ajena; no es una credencial de autorización |

El código Next usa el Supabase configurado mediante cliente de cookies: actualmente ejecuta las definiciones remotas, no el SQL de los archivos. Las rutas de admin validan permisos HTTP y los RPC deben seguir validándolos en su cuerpo. Las definiciones técnicas propuestas no se consideran desplegadas.

**Expiración elegida:** release expira y cancela en una transacción que puede confirmarse; confirm_payment rechaza y revierte cuando la reserva es inválida. No se inventa una transacción autónoma ni se persiste una cancelación antes de lanzar error. La cancelación automática eventual requiere una llamada del servidor a release que confirme por separado; no existe cron instalado ni se agregó uno. Una petición fallida de compra/venta no garantiza persistencia de su release interno.

## 2. Todas las SECURITY DEFINER

La [matriz completa](RPC_FINAL_MATRIX.md) cubre las 37 funciones auditadas (35 public y dos Vault) más una fila para el contrato nuevo propuesto. Incluye firma, permisos efectivos, validación interna, archivo Next, permisos finales y riesgo individual. [RPC_FINAL_MATRIX.json](RPC_FINAL_MATRIX.json) permite revisión automatizada.

- **A:** get_business_status, track_order, create_order(7) y check_rate_limit. anon/authenticated mantienen contrato público. La firma de seis es excepción retirada del acceso externo.
- **B:** is_active_user, is_admin, is_employee_or_admin. Lectura de identidad del llamador, también ejecutables por anon para no romper políticas RLS que los referencian; no conceden rol por ejecutarse.
- **C:** advance_order_status, confirm/reject_payment, cancel_order, create_sale_return, record/open/close_cash, request/review_order_deletion, can_delete_cancelled_order y get_audit_trail. authenticated puede invocarlos, pero solo personal con rol activo supera el cuerpo; administrador cuando corresponde. service_role no supera automáticamente una comprobación auth.uid/is_admin sin identidad de personal.
- **D:** create_payment nuevo, consume_product_inventory, apply_order_discount, release_expired_reservations, handlers/notifications/audit triggers. Solo servidor como ejecutor externo; los triggers no son RPC ordinarios. rls_auto_enable y Vault son plataforma, fuera del delta aplicativo.

Todas las public tienen EXECUTE efectivo para anon/authenticated/service_role en el snapshot. Las dos Vault tienen ACL postgres/supabase_admin/service_role, no anon/authenticated. No se capturó su cuerpo: no se atribuyen validaciones internas que no se vieron.

La 036 revoca PUBLIC y los grants explícitos antes de conceder por firma. No modifica políticas/ACL de tablas ni default privileges; la baseline contiene su propuesta independiente de privilegios de tablas. Mantener rol correcto dentro de C protege frente a invocación RPC que evita requireAdmin de Next.

## 3. create_payment(uuid): evaluación de vulnerabilidad

| Comprobación | Resultado del snapshot/código |
| --- | --- |
| anon puede invocarla | Sí a nivel de EXECUTE efectivo; firma ordinaria en public expuesta a RPC. No se hizo POST real mutador para demostrar explotación HTTP; confirmar exposición PostgREST en aislado |
| Información necesaria | Solo UUID de un pedido existente y pendiente_pago; no necesita credenciales del cliente, teléfono ni monto |
| UUID disponible | /api/orders devuelve UUID al comprador; 035 devuelve id al consultar número+teléfono cuando se aplique; APIs admin lo muestran a personal; create_order devuelve id existente al conocer clave de idempotencia. track_order antiguo no devuelve UUID; catálogo público no lo expone |
| Inferir UUID | No se deriva del número secuencial ni debe afirmarse que UUID aleatorio sea enumerable. La UI genera claves crypto.randomUUID; una clave conocida/filtrada o un UUID filtrado basta para la ruta débil |
| Pago ajeno | Sí por diseño del cuerpo si se conoce UUID pendiente ajeno: no hay comprobación de propiedad. Defecto confirmado por ACL + cuerpo, no ataque ejecutado |
| Duplicados | Bloquea pedido FOR UPDATE y devuelve pago pendiente existente; llamadas de este RPC se serializan. No hay UNIQUE parcial en tabla; no probar ausencia de duplicados por otras escrituras, ni concurrencia real sin ejecutar |
| Estado | Exige pendiente_pago; no valida online, deleted_at ni plazo de reserva en la versión antigua |
| Monto | Usa total guardado, no acepta monto del cliente. CHECK amount>0 impide cero/negativo; no valida vigencia ni coincidencia de un pendiente existente. Numeric NaN requiere rechazo explícito |
| Cliente/teléfono | No valida ninguno |
| Next como única barrera | La ruta anterior comprobaba track_order_details con teléfono y luego llamaba RPC públicamente; llamada directa evitaba esa comprobación |

No confirma dinero: registra intención/reportado PENDIENTE. El abuso puede crear reportes falsos y devolver monto/número de pedido; nunca debe describirse como cobro real o confirmación contable automática.

## 4. Corrección mínima elegida de pagos

**Contrato público HTTP conservado:** POST /api/orders/[id]/payment con customer_phone. El cliente sigue usando nuestra API, sin secretos privilegiados en navegador. La API valida formato y rate limit antes de crear el cliente administrativo. Usa el helper administrativo existente y su variable privada SUPABASE_SECRET_KEY; no imprime ni incorpora su valor en bundles públicos.

**Contrato SQL nuevo:** create_payment(uuid,text) solo service_role; consulta pedido y cliente coincidentes, excluye eliminados y bloquea ambos en la misma transacción. Error uniforme P0002 para inexistente/teléfono distinto (HTTP 404). Valida online, pendiente_pago, total positivo/no NaN, reserva vigente y ausencia de pago ya confirmado. Reutiliza el pendiente existente si su monto/método coincide; no lo actualiza ni confirma. Rechaza duplicados previos para revisión, no los borra.

create_payment(uuid) queda sin EXECUTE de PUBLIC/anon/authenticated/service_role; conserva existencia solo para propietario y posible reversión, sin acceso RPC cliente/servidor. La nueva función no la llama. El bloqueo del pedido es la idempotencia existente, suficiente para reintentos del mismo contrato; no agregar un índice sobre datos desconocidos sin preflight. Probar dos sesiones concurrentes y cambios administrativos de monto/estado antes de certificar.

Preferimos combinación servidor + verificación telefónica atómica + serialización existente. Solo revocar anon dejando authenticated permitiría abuso desde cualquier cuenta. Solo validar en Next deja bypass público. Solo añadir teléfono a un RPC público mantiene superficie fuera de API. Un token nuevo/OTP sería una garantía de identidad más fuerte, pero cambia recuperación/seguimiento y no es la corrección mínima del contrato existente.

**Límite explícito:** teléfono es credencial de seguimiento, no prueba de identidad ni control de posesión. Quien conozca UUID y teléfono ajenos puede intentar reportar mediante API. Se elimina el ataque con solamente UUID y el bypass RPC directo; no se promete impedir toda suplantación por conocimiento de teléfono. Antes de exigir propiedad personal fuerte se necesita token opaco de reporte emitido al checkout/OTP, con recuperación definida. No se inventaron claves reales ni tokens para clientes existentes.

La ruta local nueva depende de 036 y de la clave administrativa configurada. No desplegar solo la ruta contra el proyecto actual: faltará la firma nueva. No existe fallback al contrato vulnerable. Seguimiento sigue dependiendo de 035 separadamente.

## 5. Helpers de inventario/descuento

consume_product_inventory acepta producto/cantidad/referencia/actor, consume lotes FIFO y stock, escribe movimientos; valida cantidad/stock, no rol ni identidad. apply_order_discount acepta pedido/subtotal/cliente/promoción/manual/actor, escribe descuentos y totales; sus reglas de promoción/manual no comprueban que el actor proporcionado sea auth.uid ni un rol autorizado. Un UUID de perfil puede satisfacer referencias; el actor no es autorización.

Defecto confirmado por definiciones y EXECUTE; producir cambios requiere identificadores válidos y satisfacer reglas/FK. No se probó explotabilidad con filas reales. Ambos quedan D y no tienen ruta Next directa. apply_order_discount se usa por create_order y create_physical_sale. La versión final de venta/confirmación realiza consumo FIFO directamente, no llama consume_product_inventory; este último queda como helper interno heredado sin llamadas superiores en las definiciones seleccionadas.

Los RPC superiores SECURITY DEFINER pertenecen a postgres. Ejecutan internamente con privilegios del propietario y por ello pueden llamar helpers sin EXECUTE para anon/authenticated. auth.uid sigue representando JWT del llamador para validación del RPC superior. La denegación externa no rompe esa mecánica por sí sola; hay que demostrar flujo completo en aislado. Referencia: [CREATE FUNCTION PostgreSQL](https://www.postgresql.org/docs/current/sql-createfunction.html), [privilegios](https://www.postgresql.org/docs/17/ddl-priv.html).

## 6. Otros hallazgos

| Hallazgo | Evidencia / certeza | Decisión |
| --- | --- | --- |
| Autoempleado activo | handle_new_user inserta solo id/full_name; profiles default role empleado/is_active true. Combinación confirmada; capacidad de signup remoto no verificada | Nuevo trigger crea empleado INACTIVO. Ruta autorizada de alta admin activa explícitamente después de requireAdmin; no toca usuarios actuales |
| Rate limit no es barrera universal | check_rate_limit permite argumentos IP/límites y create_order no lo exige internamente; Next falla abierto. Código confirmado, abuso/concurrencia no ensayados | Riesgo potencial pendiente; 036 no introduce arquitectura de límites, cambio de contrato público ni red confiable inventada |
| Clave idempotente devuelve UUID sin propietario | Cuerpo 031 confirmado; ataque depende de conocer clave | Registrar riesgo; no usar clave como autenticación. UI genera UUID aleatorio |
| confirm_payment remoto afirma cancelación que revierte | RAISE posterior al UPDATE aborta la transacción; regla PostgreSQL | Corregir contrato/mensaje y probar rollback real; [manejo de excepciones](https://www.postgresql.org/docs/18/plpgsql-control-structures.html) |
| Privilegios de tablas amplios/21 políticas extra | Snapshot | Revisión independiente de RLS/privilegios; no mezclada en 036 |
| Cantidades numéricas inválidas/concurrencia stock | Validaciones y bloqueo requieren pruebas incluyendo NaN y solicitudes paralelas | Pruebas aisladas pendientes; no declarar ausencia de carreras por lectura del SQL |

La modificación del trigger no cambia defaults de tablas ni activa/desactiva perfiles existentes. El bootstrap del primer administrador en instancia nueva es una operación administrativa explícita; nunca confiar en metadata de signup para asignar administrador. Evaluar cuentas existentes y configuración Auth privadamente antes de un hardening remoto.

## 7. Contenido y reversión de 036

El [archivo SQL exacto](036_security_rpc_hardening.sql) contiene exclusivamente definiciones oficiales de release/confirm/venta/avance/create_order7, contrato nuevo de pago, trigger de alta inactiva y permisos por firma. No crea/elimina tablas, no limpia datos, no ejecuta DROP, no repara historial y no incorpora 035. La firma antigua create_order(6) tiene revocación condicionada a existencia para admitir ensayo sobre baseline nueva o copia auditada.

Cambios de aplicación coordinados: route.ts de pago usa cliente administrativo y dos argumentos; route.ts de alta de personal activa explícitamente tras requireAdmin. No se cambió confirmación/rechazo admin HTTP ni se agregó clave de servicio al cliente.

Antes de aplicar eventualmente: copiar definiciones/ACL previas y usuarios/configuraciones, probar restore y coordinar despliegue API/SQL. Reversión de definiciones/permisos debe usar esos originales exactos; volver al pago público restaura la vulnerabilidad y no es un rollback aceptable de seguridad. No adjuntar un script automático de rollback que reabra permisos. La retirada física de firma obsoleta necesita aprobación adicional; no se hace aquí.

## 8. Tests y niveles de evidencia

- checkout-api.test.ts: mocks HTTP de cliente privilegiado, teléfono erróneo→404, validación/rate limit antes de crear cliente privilegiado, payload no controla monto/UUID extra, reintentos y estado/reserva rechazados. No prueba ACL ni motor SQL.
- security-rpc-contract.test.ts: controles estáticos de artefactos: PUBLIC revocado, helpers solo servidor, contrato de pago, guardias de confirmación, venta finalizada y expiración. No prueba que PostgreSQL compile o que una condición se ejecute correctamente.
- admin-user-bootstrap.test.ts: mocks de requireAdmin y activación explícita; no prueba Auth real.
- ISOLATED_SECURITY_TESTS.sql: fixture transaccional pendiente, sin ejecutar. Usa SET ROLE reales para negar helpers/pago, teléfono ajeno, doble reporte, confirmación válida/vencida/cancelada, stock, rollback y expiración; venta finalizada con descuento demuestra llamada interna del helper sin permisos públicos. Datos TEST SECURITY, opt-in explícito y tablas vacías; ROLLBACK al final. No usar en proyecto vinculado. Puede avanzar secuencias en el entorno desechable.

Faltan pruebas paralelas de dos sesiones, llamadas PostgREST con JWT reales, usuarios activos/inactivos/cliente, monto alterado, expiración parcial, devolución/caja/reportes, integridad de seeds/bootstrap y recuperación tras errores. Una suite mock verde no certifica baseline.

## 9. Aprobación y límites

Puede aprobarse técnicamente la elección de venta finalizada/031/avance, la confirmación con rechazo sin falsa cancelación persistida, helpers privados y el flujo de pago solo servidor. También el alta inactiva por defecto, con activación administrativa explícita. Confirmar que teléfono es el nivel de credencial aceptado para reportar pago; si se requiere posesión/identidad fuerte, aprobar diseño de token/OTP antes de publicación. Confirmar consumidores externos antes de retirar físicamente firma antigua.

No aprobar certificación ni ejecución remota hasta replay, pruebas JWT/concurrencia y restore de respaldo en Supabase aislado. No aplicar baseline en producción, ni db push, repair, squash, 035/036 o cambios de datos durante esta revisión. Guardar esquema/datos privados, Auth, ACL, valores de secuencias, historial, configuraciones y archivos Storage antes de cualquier futura reconciliación.

Registros reales o de prueba creados en esta etapa: ninguno. SQL remoto ejecutado: ninguno.
