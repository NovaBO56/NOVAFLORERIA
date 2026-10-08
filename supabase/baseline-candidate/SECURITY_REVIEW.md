> Auditoría original y propuesta inicial. La decisión técnica vigente, incluyendo create_payment(uuid,text) solo servidor y alta de usuarios inactivos, está en SECURITY_DECISIONS_FINAL.md y RPC_FINAL_MATRIX.md. Los párrafos de riesgos del contrato anterior describen el snapshot, no los permisos de la candidata actualizada.

# Revisión de SECURITY DEFINER

Solo análisis local. No se probaron mutaciones ni se cambiaron permisos remotos. El snapshot otorga EXECUTE efectivo a anon, authenticated y service_role para las 35 funciones public, además de PUBLIC en sus ACL. El cliente Next.js usa clave anon con sesión por cookies: en admin ejecuta con JWT authenticated, no service_role. Revocar PUBLIC es necesario para que revocar anon sea efectivo.

Los grants de BASELINE_CANDIDATE.sql son propuestas solo para la instalación nueva. No hay script de endurecimiento remoto. Tablas/políticas se conservan del snapshot; los grants amplios protegidos por RLS aún requieren pruebas por rol.

## notify_order_ready()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## rls_auto_enable()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=pg_catalog"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: event trigger de plataforma; no RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.
- Plataforma: excluida de candidata; Supabase gestiona su event trigger.

## is_active_user()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Consulta perfil de auth.uid(); no acepta una identidad ajena.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## is_admin()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: cancel_order, create_sale_return, review_order_deletion_request, can_delete_cancelled_order, get_audit_trail.

## is_employee_or_admin()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: advance_order_status, close_cash_session, reject_payment, cancel_order, record_cash_movement, request_order_deletion, open_cash_session, confirm_payment, create_physical_sale.

## handle_new_user()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## handle_inventory_entry()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## handle_inventory_waste()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## handle_inventory_adjustment()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## consume_product_inventory(p_product_id uuid, p_quantity_sold numeric, p_reference_type text, p_reference_id uuid, p_created_by uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## release_expired_reservations(p_inventory_item_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: create_order, create_physical_sale.

## advance_order_status(p_order_id uuid, p_new_status text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/orders/[id]/status/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## close_cash_session(p_session_id uuid, p_counted_amount numeric, p_closing_note text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/cash-sessions/[id]/close/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## reject_payment(p_payment_id uuid, p_reason text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/payments/[id]/reject/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## create_payment(p_order_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: src/app/api/orders/[id]/payment/route.ts.
- Llamadores SQL: create_payment.

## cancel_order(p_order_id uuid, p_reason text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/orders/[id]/cancel/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## create_sale_return(p_order_id uuid, p_type text, p_amount numeric, p_reason text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/orders/[id]/returns/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## record_cash_movement(p_cash_session_id uuid, p_movement_type text, p_amount numeric, p_direction text, p_reason text, p_order_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/cash-sessions/[id]/movements/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## request_order_deletion(p_order_id uuid, p_reason text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/orders/[id]/deletion-request/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## review_order_deletion_request(p_request_id uuid, p_approve boolean, p_review_reason text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/deletion-requests/[id]/review/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## can_delete_cancelled_order(p_order_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: review_order_deletion_request.

## open_cash_session(p_cash_register_id uuid, p_opening_amount numeric)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/cash-sessions/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## get_business_status()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/business-hours/route.ts.
- Llamadores SQL: create_order.

## notify_stock_alert()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/orders/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## apply_order_discount(p_order_id uuid, p_subtotal numeric, p_customer_id uuid, p_promotion_id uuid, p_manual_amount numeric, p_manual_reason text, p_actor_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: create_order, create_physical_sale.

## notify_pending_payment()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## confirm_payment(p_payment_id uuid)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/payments/[id]/confirm/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## notify_new_order()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## check_rate_limit(p_ip text, p_route text, p_max_attempts integer, p_window_seconds integer)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: src/lib/rate-limit.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## audit_products_change()

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Usa auth.uid(); revisar el contexto completo: registrar actor no equivale a autorización.
- Tipo: trigger; no RPC ordinario invocable por PostgREST.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: no; excluir también authenticated.
- Exclusivo service_role: sí para grants externos; propietario mantiene ejecución interna.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## get_audit_trail(p_limit integer, p_offset integer)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/audit-log/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## track_order(p_order_number bigint, p_customer_phone text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: ninguna en src.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: No valida rol/identidad del llamador.
- Tipo: RPC ordinario.
- Revocar anon: no en esta candidata; contrato público actual.
- Limitar a authenticated: no; mantener acceso público documentado.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/orders/route.ts.
- Llamadores SQL: create_order.
- Firma antigua excluida; no se propone concederle permisos.

## create_physical_sale(p_items jsonb, p_customer_id uuid, p_promotion_id uuid, p_manual_discount_amount numeric, p_manual_discount_reason text, p_payment_method text)

- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario postgres; ["search_path=public"].
- Identidad/rol: Comprueba is_employee_or_admin (usuario activo).
- Tipo: RPC ordinario.
- Revocar anon: sí, incluyendo PUBLIC.
- Limitar a authenticated: sí para clientes, más service_role; el cuerpo sigue verificando roles.
- Exclusivo service_role: no.
- Rutas directas: src/app/api/admin/sales/route.ts.
- Llamadores SQL: ninguno en funciones seleccionadas; revisar triggers/políticas.

## Riesgos específicos y decisiones

consume_product_inventory y apply_order_discount modifican stock/descuentos con identificadores y actor proporcionados; no tienen guardia de rol. Se proponen como helpers sin acceso anon/authenticated. Las llamadas internas desde RPC SECURITY DEFINER siguen ejecutándose como postgres. release_expired_reservations también modifica pedidos/reservas sin guardia: mismo tratamiento. Ninguna ruta Next.js los llama directamente.

create_payment es público y acepta solo un UUID, sin comprobar teléfono/propiedad: conocer el UUID permite reportar un pago por RPC evitando la comprobación de track_order_details en Next.js. Mantener su contrato actual en la candidata NO resuelve esa exposición. Cambiarlo a service_role rompería la ruta actual; requiere un contrato protegido por credencial de seguimiento o servidor privilegiado con validación equivalente, separado y aprobado.

create_order de siete parámetros necesita acceso anon para compra pública; sus validaciones de stock/horario/opciones/promoción no sustituyen controles antiautomatización. check_rate_limit público acepta IP/ruta/límites del cliente RPC; no constituye un límite obligatorio del create_order directo. COUNT+INSERT sin serialización y política fail-open de Next.js exigen revisión separada. No afirmar protección completa.

track_order mantiene validación número/teléfono y acceso público; 035 no está incluida. APIs actuales de seguimiento/pago dependen de 035 y no funcionan íntegramente solo con esta baseline.

Los triggers no son RPC ordinarios. Revocar su EXECUTE externo no impide el disparo de triggers creados por postgres. Helpers de identidad usados por RLS mantienen EXECUTE para anon/authenticated para no romper evaluación de políticas. Revisar roles negativos, usuario inactivo y bypass directo RPC antes de aprobar.

No se propone publicar como producción hasta resolver el contrato de create_payment y la protección de RPC públicos. No agregar SERVICE_ROLE_KEY al navegador.

## Privilegios de tablas y creación de objetos

La candidata también excluye TRUNCATE, TRIGGER y REFERENCES para anon/authenticated/PUBLIC y revoca CREATE en public. Son propuestas pendientes: TRUNCATE no respeta filtrado RLS y no es necesario para Next.js. service_role conserva sus grants auditados. No se ejecutó ninguno de estos cambios. Los CRUD y las 89 políticas observadas se mantienen para revisión; su combinación permisiva exige pruebas por rol. Los cambios en default privileges se refieren a objetos futuros creados por postgres; otros propietarios necesitarían una revisión específica.

