# Comparación estática del estado local final con remoto

No se ejecutaron migraciones ni existe una base local reproducida. Esto compara una proyección estática, que presupone el bootstrap externo; no sustituye un replay PostgreSQL. Los cuerpos se comparan sin comentarios/espacios y con normalización de tipos int/integer; los literales se conservan.

| Función | Última fuente local | Historia de firma | Cuerpo remoto | Versión que coincide | SECURITY DEFINER/config |
| --- | --- | --- | --- | --- | --- |
| notify_order_ready() | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Coincide | 028_fase13_funciones_y_triggers.sql | Sí / search_path=public |
| rls_auto_enable() | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=pg_catalog |
| is_active_user() | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=public |
| is_admin() | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=public |
| is_employee_or_admin() | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=public |
| handle_new_user() | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=public |
| handle_inventory_entry() | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Coincide | 006_fase3_inventario_triggers.sql | Sí / search_path=public |
| handle_inventory_waste() | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Coincide | 006_fase3_inventario_triggers.sql | Sí / search_path=public |
| handle_inventory_adjustment() | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Coincide | 006_fase3_inventario_triggers.sql | Sí / search_path=public |
| consume_product_inventory(uuid,numeric,text,uuid,uuid) | 008_fase4_consumo_fifo.sql | 008_fase4_consumo_fifo.sql | Coincide | 008_fase4_consumo_fifo.sql | Sí / search_path=public |
| release_expired_reservations(uuid) | 010_fase5_funciones_pedidos.sql | 010_fase5_funciones_pedidos.sql | Diferente |  | Sí / search_path=public |
| advance_order_status(uuid,text) | Fuera de migrations |  | Sin fuente final |  | Sí / search_path=public |
| close_cash_session(uuid,numeric,text) | 023_fase10_funciones_caja.sql | 023_fase10_funciones_caja.sql | Coincide | 023_fase10_funciones_caja.sql | Sí / search_path=public |
| reject_payment(uuid,text) | 013_fase6_funciones_pagos.sql | 013_fase6_funciones_pagos.sql | Coincide | 013_fase6_funciones_pagos.sql | Sí / search_path=public |
| create_payment(uuid) | 016_fase7_fix_create_payment_order_number.sql | 013_fase6_funciones_pagos.sql → 014_fase6_fix_create_payment_return.sql → 016_fase7_fix_create_payment_order_number.sql | Coincide | 016_fase7_fix_create_payment_order_number.sql | Sí / search_path=public |
| cancel_order(uuid,text) | 019_fase9_funciones.sql | 019_fase9_funciones.sql | Coincide | 019_fase9_funciones.sql | Sí / search_path=public |
| create_sale_return(uuid,text,numeric,text) | 019_fase9_funciones.sql | 019_fase9_funciones.sql | Coincide | 019_fase9_funciones.sql | Sí / search_path=public |
| record_cash_movement(uuid,text,numeric,text,text,uuid) | 023_fase10_funciones_caja.sql | 023_fase10_funciones_caja.sql | Coincide | 023_fase10_funciones_caja.sql | Sí / search_path=public |
| request_order_deletion(uuid,text) | 019_fase9_funciones.sql | 019_fase9_funciones.sql | Coincide | 019_fase9_funciones.sql | Sí / search_path=public |
| review_order_deletion_request(uuid,bool,text) | 019_fase9_funciones.sql | 019_fase9_funciones.sql | Coincide | 019_fase9_funciones.sql | Sí / search_path=public |
| can_delete_cancelled_order(uuid) | 021_fase9_fix_can_delete_function.sql | 021_fase9_fix_can_delete_function.sql | Coincide | 021_fase9_fix_can_delete_function.sql | Sí / search_path=public |
| open_cash_session(uuid,numeric) | 023_fase10_funciones_caja.sql | 023_fase10_funciones_caja.sql | Coincide | 023_fase10_funciones_caja.sql | Sí / search_path=public |
| get_business_status() | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Coincide | 028_fase13_funciones_y_triggers.sql | Sí / search_path=public |
| notify_stock_alert() | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Coincide | 028_fase13_funciones_y_triggers.sql | Sí / search_path=public |
| create_order(text,text,text,jsonb,text,text,uuid) | 031_arma_tu_ramo_opciones_inventario.sql | 025_fase11_funciones_promociones.sql → 028_fase13_funciones_y_triggers.sql → 031_arma_tu_ramo_opciones_inventario.sql | Coincide | 031_arma_tu_ramo_opciones_inventario.sql | Sí / search_path=public |
| apply_order_discount(uuid,numeric,uuid,uuid,numeric,text,uuid) | 034_proteccion_monto_fijo.sql | 025_fase11_funciones_promociones.sql → 032_rediseno_promociones.sql → 034_proteccion_monto_fijo.sql | Coincide | 034_proteccion_monto_fijo.sql | Sí / search_path=public |
| notify_pending_payment() | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Coincide | 028_fase13_funciones_y_triggers.sql | Sí / search_path=public |
| confirm_payment(uuid) | 013_fase6_funciones_pagos.sql | 013_fase6_funciones_pagos.sql | Diferente |  | Sí / search_path=public |
| notify_new_order() | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Coincide | 028_fase13_funciones_y_triggers.sql | Sí / search_path=public |
| check_rate_limit(text,text,int4,int4) | 029_fase14_rate_limiting.sql | 029_fase14_rate_limiting.sql | Coincide | 029_fase14_rate_limiting.sql | Sí / search_path=public |
| audit_products_change() | 030_fase14_auditoria.sql | 030_fase14_auditoria.sql | Coincide | 030_fase14_auditoria.sql | Sí / search_path=public |
| get_audit_trail(int4,int4) | 030_fase14_auditoria.sql | 030_fase14_auditoria.sql | Coincide | 030_fase14_auditoria.sql | Sí / search_path=public |
| track_order(int8,text) | 019_seguimiento_pedido_publico.sql | 019_seguimiento_pedido_publico.sql | Coincide | 019_seguimiento_pedido_publico.sql | Sí / search_path=public |
| create_order(text,text,text,jsonb,text,text) | Fuera de migrations | 011_fase5_pedido_publico.sql → 020_fase5_fix_extra_price_personalizacion.sql | Sin fuente final | 020_fase5_fix_extra_price_personalizacion.sql | Sí / search_path=public |
| create_physical_sale(jsonb,uuid,uuid,numeric,text,text) | 026_fase12_venta_fisica_cliente_opcional.sql | 026_fase12_venta_fisica_cliente_opcional.sql | Diferente |  | Sí / search_path=public |
| track_order_details(text,int8,uuid) | 035_checkout_public_summary.sql | 035_checkout_public_summary.sql | Ausente | — | No / — |

## Funciones base del Master

| Firma | Declarada en Master | Cuerpo coincide |
| --- | --- | --- |
| rls_auto_enable() | No | No |
| is_active_user() | Sí | Sí |
| is_admin() | Sí | Sí |
| is_employee_or_admin() | Sí | Sí |
| handle_new_user() | Sí | Sí |
| advance_order_status(uuid,text) | No | No |
| create_order(text,text,text,jsonb,text,text) | No | No |

## Columnas proyectadas

| Tabla.columna | Fuente | Tipo esperado | Tipo remoto | Tipo igual | NULL esperado/remoto | Default esperado | Default remoto | Default equivalente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inventory_items.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_items.name | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| inventory_items.sku | 005_fase3_inventario_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| inventory_items.item_type | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| inventory_items.unit | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | 'unidad' | 'unidad'::text | Sí |
| inventory_items.current_stock | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | 0 | 0 | Sí |
| inventory_items.minimum_stock | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | 0 | 0 | Sí |
| inventory_items.is_active | 005_fase3_inventario_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| inventory_items.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_items.updated_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_entries.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_entries.inventory_item_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_entries.quantity | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_entries.unit_cost | 005_fase3_inventario_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| inventory_entries.supplier_name | 005_fase3_inventario_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| inventory_entries.notes | 005_fase3_inventario_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| inventory_entries.received_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_entries.created_by | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_entries.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_lots.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_lots.inventory_entry_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_lots.inventory_item_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_lots.initial_quantity | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_lots.remaining_quantity | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_lots.received_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | — | — | Sí |
| inventory_lots.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_movements.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_movements.inventory_item_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_movements.lot_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| inventory_movements.movement_type | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| inventory_movements.quantity | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_movements.reference_type | 005_fase3_inventario_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| inventory_movements.reference_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| inventory_movements.reason | 005_fase3_inventario_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| inventory_movements.created_by | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_movements.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_waste.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_waste.inventory_item_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_waste.lot_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| inventory_waste.quantity | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_waste.reason | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| inventory_waste.created_by | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_waste.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_adjustments.id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_adjustments.inventory_item_id | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_adjustments.quantity_delta | 005_fase3_inventario_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_adjustments.reason | 005_fase3_inventario_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| inventory_adjustments.created_by | 005_fase3_inventario_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_adjustments.created_at | 005_fase3_inventario_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| product_inventory_requirements.id | 007_fase4_arreglos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| product_inventory_requirements.product_id | 007_fase4_arreglos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| product_inventory_requirements.inventory_item_id | 007_fase4_arreglos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| product_inventory_requirements.quantity | 007_fase4_arreglos_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| product_inventory_requirements.created_at | 007_fase4_arreglos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| customization_options.id | 007_fase4_arreglos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| customization_options.product_id | 007_fase4_arreglos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| customization_options.option_type | 007_fase4_arreglos_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| customization_options.name | 007_fase4_arreglos_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| customization_options.value | 007_fase4_arreglos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| customization_options.extra_price | 007_fase4_arreglos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | 0 | 0 | Sí |
| customization_options.is_active | 007_fase4_arreglos_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| customization_options.created_at | 007_fase4_arreglos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| customers.id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| customers.name | 009_fase5_pedidos_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| customers.phone | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| customers.whatsapp | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| customers.email | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| customers.birthday | 009_fase5_pedidos_tablas.sql | date | date | Sí | false/false | — | — | Sí |
| customers.is_active | 009_fase5_pedidos_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| customers.created_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| customers.updated_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| orders.id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| orders.order_number | 009_fase5_pedidos_tablas.sql | bigint | bigint | Sí | true/true | nextval('public.order_number_seq') | nextval('order_number_seq'::regclass) | Sí |
| orders.customer_id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| orders.order_type | 009_fase5_pedidos_tablas.sql | text | text | Sí | true/true | 'online' | 'online'::text | Sí |
| orders.status | 009_fase5_pedidos_tablas.sql | text | text | Sí | true/true | 'pendiente_pago' | 'pendiente_pago'::text | Sí |
| orders.subtotal | 009_fase5_pedidos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | 0 | 0 | Sí |
| orders.discount_total | 009_fase5_pedidos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | 0 | 0 | Sí |
| orders.total | 009_fase5_pedidos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | 0 | 0 | Sí |
| orders.customer_message | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| orders.internal_note | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| orders.idempotency_key | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| orders.reserved_until | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| orders.cancelled_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| orders.cancelled_by | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| orders.cancellation_reason | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| orders.created_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| orders.updated_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| orders.deleted_at | 018_fase9_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| order_items.id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| order_items.order_id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| order_items.product_id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| order_items.product_name_snapshot | 009_fase5_pedidos_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| order_items.unit_price_snapshot | 009_fase5_pedidos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| order_items.quantity | 009_fase5_pedidos_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| order_items.line_total | 009_fase5_pedidos_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| order_items.personalization | 009_fase5_pedidos_tablas.sql | jsonb | jsonb | Sí | false/false | — | — | Sí |
| order_items.message | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| order_items.note | 009_fase5_pedidos_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| order_items.created_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_reservations.id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| inventory_reservations.order_id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_reservations.inventory_item_id | 009_fase5_pedidos_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| inventory_reservations.quantity | 009_fase5_pedidos_tablas.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| inventory_reservations.status | 009_fase5_pedidos_tablas.sql | text | text | Sí | true/true | 'reserved' | 'reserved'::text | Sí |
| inventory_reservations.expires_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | — | — | Sí |
| inventory_reservations.created_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| inventory_reservations.released_at | 009_fase5_pedidos_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| payment_qr_config.id | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| payment_qr_config.qr_storage_path | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| payment_qr_config.qr_public_url | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| payment_qr_config.account_label | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| payment_qr_config.is_active | 012_fase6_pagos_qr_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| payment_qr_config.updated_by | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| payment_qr_config.created_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| payment_qr_config.updated_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| payments.id | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| payments.order_id | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| payments.method | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | true/true | 'qr' | 'qr'::text | Sí |
| payments.amount | 012_fase6_pagos_qr_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| payments.status | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | true/true | 'pendiente' | 'pendiente'::text | Sí |
| payments.reference | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| payments.rejection_reason | 012_fase6_pagos_qr_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| payments.confirmed_by | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| payments.confirmed_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| payments.rejected_by | 012_fase6_pagos_qr_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| payments.rejected_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| payments.created_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| payments.updated_at | 012_fase6_pagos_qr_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| whatsapp_config.id | 015_fase7_whatsapp_config.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| whatsapp_config.phone_number | 015_fase7_whatsapp_config.sql | text | text | Sí | true/true | — | — | Sí |
| whatsapp_config.is_active | 015_fase7_whatsapp_config.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| whatsapp_config.updated_by | 015_fase7_whatsapp_config.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| whatsapp_config.created_at | 015_fase7_whatsapp_config.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| whatsapp_config.updated_at | 015_fase7_whatsapp_config.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| sale_returns.id | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| sale_returns.order_id | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| sale_returns.type | 018_fase9_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| sale_returns.amount | 018_fase9_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| sale_returns.reason | 018_fase9_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| sale_returns.created_by | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| sale_returns.created_at | 018_fase9_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| order_deletion_requests.id | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| order_deletion_requests.order_id | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| order_deletion_requests.requested_by | 018_fase9_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| order_deletion_requests.reason | 018_fase9_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| order_deletion_requests.status | 018_fase9_tablas.sql | text | text | Sí | true/true | 'pendiente' | 'pendiente'::text | Sí |
| order_deletion_requests.reviewed_by | 018_fase9_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| order_deletion_requests.reviewed_at | 018_fase9_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| order_deletion_requests.review_reason | 018_fase9_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| order_deletion_requests.created_at | 018_fase9_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| cash_registers.id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| cash_registers.name | 022_fase10_caja_tablas.sql | text | text | Sí | true/true | 'Caja principal' | 'Caja principal'::text | Sí |
| cash_registers.is_active | 022_fase10_caja_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| cash_registers.created_at | 022_fase10_caja_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| cash_sessions.id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| cash_sessions.cash_register_id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| cash_sessions.opened_by | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| cash_sessions.opened_at | 022_fase10_caja_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| cash_sessions.opening_amount | 022_fase10_caja_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | 0 | 0 | Sí |
| cash_sessions.closed_by | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| cash_sessions.closed_at | 022_fase10_caja_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| cash_sessions.expected_amount | 022_fase10_caja_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| cash_sessions.counted_amount | 022_fase10_caja_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| cash_sessions.difference_amount | 022_fase10_caja_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| cash_sessions.status | 022_fase10_caja_tablas.sql | text | text | Sí | true/true | 'abierta' | 'abierta'::text | Sí |
| cash_sessions.closing_note | 022_fase10_caja_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| cash_sessions.created_at | 022_fase10_caja_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| cash_movements.id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| cash_movements.cash_session_id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| cash_movements.movement_type | 022_fase10_caja_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| cash_movements.payment_method | 022_fase10_caja_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| cash_movements.amount | 022_fase10_caja_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| cash_movements.direction | 022_fase10_caja_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| cash_movements.order_id | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| cash_movements.reason | 022_fase10_caja_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| cash_movements.created_by | 022_fase10_caja_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| cash_movements.created_at | 022_fase10_caja_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| promotions.id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| promotions.name | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| promotions.description | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| promotions.promotion_type | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| promotions.discount_type | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| promotions.discount_value | 024_fase11_clientes_promociones_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| promotions.starts_at | 024_fase11_clientes_promociones_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| promotions.ends_at | 024_fase11_clientes_promociones_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| promotions.minimum_purchase | 024_fase11_clientes_promociones_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| promotions.is_active | 024_fase11_clientes_promociones_tablas.sql | boolean | boolean | Sí | true/true | true | true | Sí |
| promotions.created_at | 024_fase11_clientes_promociones_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| promotions.updated_at | 024_fase11_clientes_promociones_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| promotions.combo_price | 032_rediseno_promociones.sql | numeric(12,2) | numeric(12,2) | Sí | false/false | — | — | Sí |
| promotion_products.promotion_id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| promotion_products.product_id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| promotion_products.quantity | 032_rediseno_promociones.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | 1 | 1 | Sí |
| order_discounts.id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| order_discounts.order_id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| order_discounts.promotion_id | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| order_discounts.discount_type | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| order_discounts.discount_value | 024_fase11_clientes_promociones_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| order_discounts.amount_applied | 024_fase11_clientes_promociones_tablas.sql | numeric(12,2) | numeric(12,2) | Sí | true/true | — | — | Sí |
| order_discounts.reason | 024_fase11_clientes_promociones_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| order_discounts.created_by | 024_fase11_clientes_promociones_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| order_discounts.created_at | 024_fase11_clientes_promociones_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| notifications.id | 027_fase13_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| notifications.type | 027_fase13_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| notifications.message | 027_fase13_tablas.sql | text | text | Sí | true/true | — | — | Sí |
| notifications.reference_type | 027_fase13_tablas.sql | text | text | Sí | false/false | — | — | Sí |
| notifications.reference_id | 027_fase13_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| notifications.is_read | 027_fase13_tablas.sql | boolean | boolean | Sí | true/true | false | false | Sí |
| notifications.read_by | 027_fase13_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| notifications.read_at | 027_fase13_tablas.sql | timestamptz | timestamp with time zone | Sí | false/false | — | — | Sí |
| notifications.created_at | 027_fase13_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| business_hours.id | 027_fase13_tablas.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| business_hours.day_of_week | 027_fase13_tablas.sql | smallint | smallint | Sí | true/true | — | — | Sí |
| business_hours.opens_at | 027_fase13_tablas.sql | time | time without time zone | Sí | false/false | — | — | Sí |
| business_hours.closes_at | 027_fase13_tablas.sql | time | time without time zone | Sí | false/false | — | — | Sí |
| business_hours.is_closed | 027_fase13_tablas.sql | boolean | boolean | Sí | true/true | false | false | Sí |
| business_hours.updated_by | 027_fase13_tablas.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| business_hours.updated_at | 027_fase13_tablas.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| rate_limit_attempts.id | 029_fase14_rate_limiting.sql | bigint | bigint | Sí | true/true | — | — | Sí |
| rate_limit_attempts.ip | 029_fase14_rate_limiting.sql | text | text | Sí | true/true | — | — | Sí |
| rate_limit_attempts.route | 029_fase14_rate_limiting.sql | text | text | Sí | true/true | — | — | Sí |
| rate_limit_attempts.created_at | 029_fase14_rate_limiting.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| audit_logs.id | 030_fase14_auditoria.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| audit_logs.user_id | 030_fase14_auditoria.sql | uuid | uuid | Sí | false/false | — | — | Sí |
| audit_logs.action | 030_fase14_auditoria.sql | text | text | Sí | true/true | — | — | Sí |
| audit_logs.table_name | 030_fase14_auditoria.sql | text | text | Sí | true/true | — | — | Sí |
| audit_logs.record_id | 030_fase14_auditoria.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| audit_logs.before | 030_fase14_auditoria.sql | jsonb | jsonb | Sí | false/false | — | — | Sí |
| audit_logs.after | 030_fase14_auditoria.sql | jsonb | jsonb | Sí | false/false | — | — | Sí |
| audit_logs.reason | 030_fase14_auditoria.sql | text | text | Sí | false/false | — | — | Sí |
| audit_logs.created_at | 030_fase14_auditoria.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |
| customization_option_inventory_requirements.id | 031_arma_tu_ramo_opciones_inventario.sql | uuid | uuid | Sí | true/true | gen_random_uuid() | gen_random_uuid() | Sí |
| customization_option_inventory_requirements.customization_option_id | 031_arma_tu_ramo_opciones_inventario.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| customization_option_inventory_requirements.inventory_item_id | 031_arma_tu_ramo_opciones_inventario.sql | uuid | uuid | Sí | true/true | — | — | Sí |
| customization_option_inventory_requirements.quantity | 031_arma_tu_ramo_opciones_inventario.sql | numeric(12,3) | numeric(12,3) | Sí | true/true | — | — | Sí |
| customization_option_inventory_requirements.created_at | 031_arma_tu_ramo_opciones_inventario.sql | timestamptz | timestamp with time zone | Sí | true/true | now() | now() | Sí |

## Políticas finales locales

La comparación normaliza casts y calificación public. Las políticas de promotion_customers se excluyen de la proyección final porque 032 retira esa tabla.

| Objeto/política | Fuente | Presente | USING equivalente | WITH CHECK equivalente | Roles | Comando |
| --- | --- | --- | --- | --- | --- | --- |
| categories:categories_employee_admin_all | 002_correccion_rls_catalogo_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| seasons:seasons_employee_admin_all | 002_correccion_rls_catalogo_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| products:products_employee_admin_all | 002_correccion_rls_catalogo_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| product_images:product_images_employee_admin_all | 002_correccion_rls_catalogo_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| product_components:product_components_employee_admin_all | 002_correccion_rls_catalogo_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| storage.objects:product_images_employee_admin_insert | 003_correccion_storage_product_images_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| storage.objects:product_images_employee_admin_update | 003_correccion_storage_product_images_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| storage.objects:product_images_employee_admin_delete | 003_correccion_storage_product_images_empleado.sql | Sí | Sí | Sí | Sí | Sí |
| profiles:profiles_select_own | 004_correccion_rls_profiles.sql | Sí | Sí | Sí | Sí | Sí |
| profiles:profiles_select_admin_all | 004_correccion_rls_profiles.sql | Sí | Sí | Sí | Sí | Sí |
| profiles:profiles_update_admin | 004_correccion_rls_profiles.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_items:inventory_items_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_items:inventory_items_staff_insert | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_items:inventory_items_staff_update | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_entries:inventory_entries_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_entries:inventory_entries_staff_insert | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_lots:inventory_lots_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_movements:inventory_movements_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_waste:inventory_waste_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_waste:inventory_waste_staff_insert | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_adjustments:inventory_adjustments_staff_select | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_adjustments:inventory_adjustments_staff_insert | 005_fase3_inventario_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| product_inventory_requirements:pir_staff_select | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| product_inventory_requirements:pir_staff_insert | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| product_inventory_requirements:pir_staff_update | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| product_inventory_requirements:pir_staff_delete | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customization_options:customization_staff_select | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customization_options:customization_staff_insert | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customization_options:customization_staff_update | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customization_options:customization_staff_delete | 007_fase4_arreglos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customers:customers_staff_select | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customers:customers_staff_insert | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customers:customers_staff_update | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| orders:orders_staff_select | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| order_items:order_items_staff_select | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| inventory_reservations:reservations_staff_select | 009_fase5_pedidos_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| payment_qr_config:qr_config_public_select | 012_fase6_pagos_qr_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| payments:payments_staff_select | 012_fase6_pagos_qr_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| whatsapp_config:whatsapp_config_public_select | 015_fase7_whatsapp_config.sql | Sí | Sí | Sí | Sí | Sí |
| products:products_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| categories:categories_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| seasons:seasons_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| product_images:product_images_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| product_components:product_components_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| customization_options:customization_options_public_select | 018_catalogo_publico_rls.sql | Sí | Sí | Sí | Sí | Sí |
| sale_returns:sale_returns_staff_select | 018_fase9_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| order_deletion_requests:deletion_requests_staff_select | 018_fase9_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| cash_registers:cash_registers_staff_select | 022_fase10_caja_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| cash_sessions:cash_sessions_staff_select | 022_fase10_caja_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| cash_movements:cash_movements_staff_select | 022_fase10_caja_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotions:promotions_staff_select | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotions:promotions_admin_insert | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotions:promotions_admin_update | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotions:promotions_public_select_active | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotion_products:promotion_products_staff_select | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotion_products:promotion_products_admin_insert | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| promotion_products:promotion_products_admin_delete | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| order_discounts:order_discounts_staff_select | 024_fase11_clientes_promociones_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| system_settings:system_settings_staff_select | 027_fase13_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| notifications:notifications_staff_select | 027_fase13_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| notifications:notifications_staff_update | 027_fase13_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| business_hours:business_hours_public_select | 027_fase13_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| business_hours:business_hours_admin_update | 027_fase13_tablas.sql | Sí | Sí | Sí | Sí | Sí |
| customization_option_inventory_requirements:coir_staff_select | 031_arma_tu_ramo_opciones_inventario.sql | Sí | Sí | Sí | Sí | Sí |
| customization_option_inventory_requirements:coir_staff_insert | 031_arma_tu_ramo_opciones_inventario.sql | Sí | Sí | Sí | Sí | Sí |
| customization_option_inventory_requirements:coir_staff_update | 031_arma_tu_ramo_opciones_inventario.sql | Sí | Sí | Sí | Sí | Sí |
| customization_option_inventory_requirements:coir_staff_delete | 031_arma_tu_ramo_opciones_inventario.sql | Sí | Sí | Sí | Sí | Sí |
| promotion_products:promotion_products_admin_update | 033_reparacion_promociones.sql | Sí | Sí | Sí | Sí | Sí |

## Políticas remotas adicionales

| Objeto | Política | Roles | Comando | USING | WITH CHECK |
| --- | --- | --- | --- | --- | --- |
| public.profiles | Usuarios pueden ver su propio perfil | authenticated | SELECT | (auth.uid() = id) | — |
| public.profiles | Administradores pueden ver todos los perfiles | authenticated | SELECT | is_admin() | — |
| public.system_settings | Administradores pueden ver configuración | authenticated | SELECT | is_admin() | — |
| public.system_settings | Administradores pueden modificar configuración | authenticated | UPDATE | is_admin() | is_admin() |
| public.categories | categories_admin_insert | authenticated | INSERT | — | is_admin() |
| public.categories | categories_admin_update | authenticated | UPDATE | is_admin() | is_admin() |
| public.categories | categories_admin_select | authenticated | SELECT | is_admin() | — |
| public.seasons | seasons_admin_insert | authenticated | INSERT | — | is_admin() |
| public.seasons | seasons_admin_update | authenticated | UPDATE | is_admin() | is_admin() |
| public.seasons | seasons_admin_select | authenticated | SELECT | is_admin() | — |
| public.products | products_admin_insert | authenticated | INSERT | — | is_admin() |
| public.products | products_admin_update | authenticated | UPDATE | is_admin() | is_admin() |
| public.products | products_admin_select | authenticated | SELECT | is_admin() | — |
| public.product_images | product_images_admin_insert | authenticated | INSERT | — | is_admin() |
| public.product_images | product_images_admin_select | authenticated | SELECT | is_admin() | — |
| public.product_images | product_images_admin_update | authenticated | UPDATE | is_admin() | is_admin() |
| public.product_images | product_images_admin_delete | authenticated | DELETE | is_admin() | — |
| public.product_components | product_components_admin_insert | authenticated | INSERT | — | is_admin() |
| public.product_components | product_components_admin_select | authenticated | SELECT | is_admin() | — |
| public.product_components | product_components_admin_update | authenticated | UPDATE | is_admin() | is_admin() |
| public.product_components | product_components_admin_delete | authenticated | DELETE | is_admin() | — |

## Índices explícitos

| Índice | Tabla | Fuente | Presente | Local | Remoto |
| --- | --- | --- | --- | --- | --- |
| idx_inventory_items_type | inventory_items | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_items_type on public.inventory_items(item_type) | CREATE INDEX idx_inventory_items_type ON public.inventory_items USING btree (item_type) |
| idx_inventory_lots_fifo | inventory_lots | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_lots_fifo on public.inventory_lots(inventory_item_id, received_at, created_at) | CREATE INDEX idx_inventory_lots_fifo ON public.inventory_lots USING btree (inventory_item_id, received_at, created_at) |
| idx_inventory_movements_item | inventory_movements | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_movements_item on public.inventory_movements(inventory_item_id, created_at) | CREATE INDEX idx_inventory_movements_item ON public.inventory_movements USING btree (inventory_item_id, created_at) |
| idx_inventory_entries_item | inventory_entries | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_entries_item on public.inventory_entries(inventory_item_id, received_at) | CREATE INDEX idx_inventory_entries_item ON public.inventory_entries USING btree (inventory_item_id, received_at) |
| idx_inventory_waste_item | inventory_waste | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_waste_item on public.inventory_waste(inventory_item_id, created_at) | CREATE INDEX idx_inventory_waste_item ON public.inventory_waste USING btree (inventory_item_id, created_at) |
| idx_inventory_adjustments_item | inventory_adjustments | 005_fase3_inventario_tablas.sql | Sí | create index if not exists idx_inventory_adjustments_item on public.inventory_adjustments(inventory_item_id, created_at) | CREATE INDEX idx_inventory_adjustments_item ON public.inventory_adjustments USING btree (inventory_item_id, created_at) |
| idx_pir_product | product_inventory_requirements | 007_fase4_arreglos_tablas.sql | Sí | create index if not exists idx_pir_product on public.product_inventory_requirements(product_id) | CREATE INDEX idx_pir_product ON public.product_inventory_requirements USING btree (product_id) |
| idx_pir_item | product_inventory_requirements | 007_fase4_arreglos_tablas.sql | Sí | create index if not exists idx_pir_item on public.product_inventory_requirements(inventory_item_id) | CREATE INDEX idx_pir_item ON public.product_inventory_requirements USING btree (inventory_item_id) |
| idx_customization_product | customization_options | 007_fase4_arreglos_tablas.sql | Sí | create index if not exists idx_customization_product on public.customization_options(product_id) | CREATE INDEX idx_customization_product ON public.customization_options USING btree (product_id) |
| idx_orders_status | orders | 009_fase5_pedidos_tablas.sql | Sí | create index if not exists idx_orders_status on public.orders(status, created_at) | CREATE INDEX idx_orders_status ON public.orders USING btree (status, created_at) |
| idx_orders_customer | orders | 009_fase5_pedidos_tablas.sql | Sí | create index if not exists idx_orders_customer on public.orders(customer_id) | CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id) |
| idx_order_items_order | order_items | 009_fase5_pedidos_tablas.sql | Sí | create index if not exists idx_order_items_order on public.order_items(order_id) | CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id) |
| idx_reservations_item_status | inventory_reservations | 009_fase5_pedidos_tablas.sql | Sí | create index if not exists idx_reservations_item_status on public.inventory_reservations(inventory_item_id, status, expires_at) | CREATE INDEX idx_reservations_item_status ON public.inventory_reservations USING btree (inventory_item_id, status, expires_at) |
| idx_reservations_order | inventory_reservations | 009_fase5_pedidos_tablas.sql | Sí | create index if not exists idx_reservations_order on public.inventory_reservations(order_id) | CREATE INDEX idx_reservations_order ON public.inventory_reservations USING btree (order_id) |
| idx_payments_order | payments | 012_fase6_pagos_qr_tablas.sql | Sí | create index if not exists idx_payments_order on public.payments(order_id, created_at desc) | CREATE INDEX idx_payments_order ON public.payments USING btree (order_id, created_at DESC) |
| idx_payments_status | payments | 012_fase6_pagos_qr_tablas.sql | Sí | create index if not exists idx_payments_status on public.payments(status) | CREATE INDEX idx_payments_status ON public.payments USING btree (status) |
| idx_sale_returns_order | sale_returns | 018_fase9_tablas.sql | Sí | create index if not exists idx_sale_returns_order on public.sale_returns(order_id) | CREATE INDEX idx_sale_returns_order ON public.sale_returns USING btree (order_id) |
| idx_deletion_requests_order | order_deletion_requests | 018_fase9_tablas.sql | Sí | create index if not exists idx_deletion_requests_order on public.order_deletion_requests(order_id) | CREATE INDEX idx_deletion_requests_order ON public.order_deletion_requests USING btree (order_id) |
| idx_deletion_requests_status | order_deletion_requests | 018_fase9_tablas.sql | Sí | create index if not exists idx_deletion_requests_status on public.order_deletion_requests(status) | CREATE INDEX idx_deletion_requests_status ON public.order_deletion_requests USING btree (status) |
| idx_cash_movements_session | cash_movements | 022_fase10_caja_tablas.sql | Sí | create index if not exists idx_cash_movements_session on public.cash_movements(cash_session_id, created_at) | CREATE INDEX idx_cash_movements_session ON public.cash_movements USING btree (cash_session_id, created_at) |
| idx_cash_sessions_register_status | cash_sessions | 022_fase10_caja_tablas.sql | Sí | create index if not exists idx_cash_sessions_register_status on public.cash_sessions(cash_register_id, status) | CREATE INDEX idx_cash_sessions_register_status ON public.cash_sessions USING btree (cash_register_id, status) |
| idx_promotion_products_product | promotion_products | 024_fase11_clientes_promociones_tablas.sql | Sí | create index if not exists idx_promotion_products_product on public.promotion_products(product_id) | CREATE INDEX idx_promotion_products_product ON public.promotion_products USING btree (product_id) |
| idx_order_discounts_order | order_discounts | 024_fase11_clientes_promociones_tablas.sql | Sí | create index if not exists idx_order_discounts_order on public.order_discounts(order_id) | CREATE INDEX idx_order_discounts_order ON public.order_discounts USING btree (order_id) |
| idx_notifications_unread | notifications | 027_fase13_tablas.sql | Sí | create index if not exists idx_notifications_unread on public.notifications(is_read, created_at desc) | CREATE INDEX idx_notifications_unread ON public.notifications USING btree (is_read, created_at DESC) |
| idx_rate_limit_attempts_ip_route_time | rate_limit_attempts | 029_fase14_rate_limiting.sql | Sí | create index if not exists idx_rate_limit_attempts_ip_route_time   on public.rate_limit_attempts (ip, route, created_at desc) | CREATE INDEX idx_rate_limit_attempts_ip_route_time ON public.rate_limit_attempts USING btree (ip, route, created_at DESC) |
| idx_audit_logs_table_record | audit_logs | 030_fase14_auditoria.sql | Sí | create index if not exists idx_audit_logs_table_record   on public.audit_logs (table_name, record_id, created_at desc) | CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id, created_at DESC) |
| idx_audit_logs_created_at | audit_logs | 030_fase14_auditoria.sql | Sí | create index if not exists idx_audit_logs_created_at   on public.audit_logs (created_at desc) | CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC) |
| idx_coir_option | customization_option_inventory_requirements | 031_arma_tu_ramo_opciones_inventario.sql | Sí | create index if not exists idx_coir_option   on public.customization_option_inventory_requirements(customization_option_id) | CREATE INDEX idx_coir_option ON public.customization_option_inventory_requirements USING btree (customization_option_id) |
| idx_coir_item | customization_option_inventory_requirements | 031_arma_tu_ramo_opciones_inventario.sql | Sí | create index if not exists idx_coir_item   on public.customization_option_inventory_requirements(inventory_item_id) | CREATE INDEX idx_coir_item ON public.customization_option_inventory_requirements USING btree (inventory_item_id) |

## Triggers finales locales

| Trigger | Fuente | Historia | Presente | Local | Remoto |
| --- | --- | --- | --- | --- | --- |
| inventory_entries:trg_inventory_entry_created | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Sí | create trigger trg_inventory_entry_created after insert on public.inventory_entries for each row execute function public.handle_inventory_entry() | CREATE TRIGGER trg_inventory_entry_created AFTER INSERT ON inventory_entries FOR EACH ROW EXECUTE FUNCTION handle_inventory_entry() |
| inventory_waste:trg_inventory_waste_created | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Sí | create trigger trg_inventory_waste_created after insert on public.inventory_waste for each row execute function public.handle_inventory_waste() | CREATE TRIGGER trg_inventory_waste_created AFTER INSERT ON inventory_waste FOR EACH ROW EXECUTE FUNCTION handle_inventory_waste() |
| inventory_adjustments:trg_inventory_adjustment_created | 006_fase3_inventario_triggers.sql | 006_fase3_inventario_triggers.sql | Sí | create trigger trg_inventory_adjustment_created after insert on public.inventory_adjustments for each row execute function public.handle_inventory_adjustment() | CREATE TRIGGER trg_inventory_adjustment_created AFTER INSERT ON inventory_adjustments FOR EACH ROW EXECUTE FUNCTION handle_inventory_adjustment() |
| orders:trg_notify_new_order | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Sí | create trigger trg_notify_new_order after insert on public.orders for each row execute function public.notify_new_order() | CREATE TRIGGER trg_notify_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_new_order() |
| payments:trg_notify_pending_payment | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Sí | create trigger trg_notify_pending_payment after insert on public.payments for each row execute function public.notify_pending_payment() | CREATE TRIGGER trg_notify_pending_payment AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION notify_pending_payment() |
| orders:trg_notify_order_ready | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Sí | create trigger trg_notify_order_ready after update on public.orders for each row execute function public.notify_order_ready() | CREATE TRIGGER trg_notify_order_ready AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION notify_order_ready() |
| inventory_items:trg_notify_stock_alert | 028_fase13_funciones_y_triggers.sql | 028_fase13_funciones_y_triggers.sql | Sí | create trigger trg_notify_stock_alert after update on public.inventory_items for each row execute function public.notify_stock_alert() | CREATE TRIGGER trg_notify_stock_alert AFTER UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION notify_stock_alert() |
| products:trg_audit_products | 030_fase14_auditoria.sql | 030_fase14_auditoria.sql | Sí | create trigger trg_audit_products after update on public.products for each row when (   OLD.name is distinct from NEW.name   or OLD.description is distinct from NEW.description   or OLD.price is distinct from NEW.price   or OLD.category_id is distinct from NEW.category_id   or OLD.occasion is distinct from NEW.occasion   or OLD.season_id is distinct from NEW.season_id   or OLD.is_featured is distinct from NEW.is_featured   or OLD.is_available is distinct from NEW.is_available   or OLD.is_sold_out is distinct from NEW.is_sold_out   or OLD.catalog_order is distinct from NEW.catalog_order   or OLD.is_active is distinct from NEW.is_active ) execute function public.audit_products_change() | CREATE TRIGGER trg_audit_products AFTER UPDATE ON products FOR EACH ROW WHEN (old.name IS DISTINCT FROM new.name OR old.description IS DISTINCT FROM new.description OR old.price IS DISTINCT FROM new.price OR old.category_id IS DISTINCT FROM new.category_id OR old.occasion IS DISTINCT FROM new.occasion OR old.season_id IS DISTINCT FROM new.season_id OR old.is_featured IS DISTINCT FROM new.is_featured OR old.is_available IS DISTINCT FROM new.is_available OR old.is_sold_out IS DISTINCT FROM new.is_sold_out OR old.catalog_order IS DISTINCT FROM new.catalog_order OR old.is_active IS DISTINCT FROM new.is_active) EXECUTE FUNCTION audit_products_change() |

## Vista de auditoría

| Vista | Fuente | Local | Remoto |
| --- | --- | --- | --- |
| audit_trail | 030_fase14_auditoria.sql | create or replace view public.audit_trail as select user_id, action, table_name, record_id, before, after, reason, created_at from public.audit_logs  union all  select   cancelled_by, 'pedido_cancelado', 'orders', id,   null::jsonb, null::jsonb, cancellation_reason, cancelled_at from public.orders where status = 'cancelado' and cancelled_by is not null  union all  select   confirmed_by, 'pago_confirmado', 'payments', id,   null::jsonb, null::jsonb, null::text, confirmed_at from public.payments where status = 'confirmado' and confirmed_by is not null  union all  select   rejected_by, 'pago_rechazado', 'payments', id,   null::jsonb, null::jsonb, rejection_reason, rejected_at from public.payments where status = 'rechazado' and rejected_by is not null  union all  select   created_by, 'inventario_' \|\| movement_type, 'inventory_movements', id,   null::jsonb, null::jsonb, reason, created_at from public.inventory_movements where movement_type in ('merma', 'ajuste', 'reversion')  union all  select   created_by, 'devolucion_registrada', 'sale_returns', id,   null::jsonb, null::jsonb, reason, created_at from public.sale_returns  union all  select   created_by, 'descuento_aplicado', 'order_discounts', id,   null::jsonb, null::jsonb, reason, created_at from public.order_discounts |  SELECT audit_logs.user_id,     audit_logs.action,     audit_logs.table_name,     audit_logs.record_id,     audit_logs.before,     audit_logs.after,     audit_logs.reason,     audit_logs.created_at    FROM audit_logs UNION ALL  SELECT orders.cancelled_by AS user_id,     'pedido_cancelado'::text AS action,     'orders'::text AS table_name,     orders.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     orders.cancellation_reason AS reason,     orders.cancelled_at AS created_at    FROM orders   WHERE orders.status = 'cancelado'::text AND orders.cancelled_by IS NOT NULL UNION ALL  SELECT payments.confirmed_by AS user_id,     'pago_confirmado'::text AS action,     'payments'::text AS table_name,     payments.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     NULL::text AS reason,     payments.confirmed_at AS created_at    FROM payments   WHERE payments.status = 'confirmado'::text AND payments.confirmed_by IS NOT NULL UNION ALL  SELECT payments.rejected_by AS user_id,     'pago_rechazado'::text AS action,     'payments'::text AS table_name,     payments.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     payments.rejection_reason AS reason,     payments.rejected_at AS created_at    FROM payments   WHERE payments.status = 'rechazado'::text AND payments.rejected_by IS NOT NULL UNION ALL  SELECT inventory_movements.created_by AS user_id,     'inventario_'::text \|\| inventory_movements.movement_type AS action,     'inventory_movements'::text AS table_name,     inventory_movements.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     inventory_movements.reason,     inventory_movements.created_at    FROM inventory_movements   WHERE inventory_movements.movement_type = ANY (ARRAY['merma'::text, 'ajuste'::text, 'reversion'::text]) UNION ALL  SELECT sale_returns.created_by AS user_id,     'devolucion_registrada'::text AS action,     'sale_returns'::text AS table_name,     sale_returns.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     sale_returns.reason,     sale_returns.created_at    FROM sale_returns UNION ALL  SELECT order_discounts.created_by AS user_id,     'descuento_aplicado'::text AS action,     'order_discounts'::text AS table_name,     order_discounts.id AS record_id,     NULL::jsonb AS before,     NULL::jsonb AS after,     order_discounts.reason,     order_discounts.created_at    FROM order_discounts; |

## Límites de la comparación

La existencia de índices/triggers no prueba por sí sola su equivalencia; sus definiciones completas se muestran para revisión. Las PK/FK/CHECK/UNIQUE reales se inventarían en INVENTARIO_REMOTO.md. Se contrastaron expresamente los cambios de promociones de 032/033, que están presentes y mantienen NOT VALID donde la migración lo declara. No se afirma un diff de esquema ejecutado con PostgreSQL local, ni que todas las constraints implícitas fueran probadas por replay.
