-- Solo conteos agregados; no exporta filas ni datos personales.
select jsonb_build_object('public_table_counts',(select jsonb_agg(to_jsonb(c)) from (select 'audit_logs'::text as table_name, count(*) as rows from public."audit_logs"
union all
select 'business_hours'::text as table_name, count(*) as rows from public."business_hours"
union all
select 'cash_movements'::text as table_name, count(*) as rows from public."cash_movements"
union all
select 'cash_registers'::text as table_name, count(*) as rows from public."cash_registers"
union all
select 'cash_sessions'::text as table_name, count(*) as rows from public."cash_sessions"
union all
select 'categories'::text as table_name, count(*) as rows from public."categories"
union all
select 'customers'::text as table_name, count(*) as rows from public."customers"
union all
select 'customization_option_inventory_requirements'::text as table_name, count(*) as rows from public."customization_option_inventory_requirements"
union all
select 'customization_options'::text as table_name, count(*) as rows from public."customization_options"
union all
select 'inventory_adjustments'::text as table_name, count(*) as rows from public."inventory_adjustments"
union all
select 'inventory_entries'::text as table_name, count(*) as rows from public."inventory_entries"
union all
select 'inventory_items'::text as table_name, count(*) as rows from public."inventory_items"
union all
select 'inventory_lots'::text as table_name, count(*) as rows from public."inventory_lots"
union all
select 'inventory_movements'::text as table_name, count(*) as rows from public."inventory_movements"
union all
select 'inventory_reservations'::text as table_name, count(*) as rows from public."inventory_reservations"
union all
select 'inventory_waste'::text as table_name, count(*) as rows from public."inventory_waste"
union all
select 'notifications'::text as table_name, count(*) as rows from public."notifications"
union all
select 'order_deletion_requests'::text as table_name, count(*) as rows from public."order_deletion_requests"
union all
select 'order_discounts'::text as table_name, count(*) as rows from public."order_discounts"
union all
select 'order_items'::text as table_name, count(*) as rows from public."order_items"
union all
select 'orders'::text as table_name, count(*) as rows from public."orders"
union all
select 'payment_qr_config'::text as table_name, count(*) as rows from public."payment_qr_config"
union all
select 'payments'::text as table_name, count(*) as rows from public."payments"
union all
select 'product_components'::text as table_name, count(*) as rows from public."product_components"
union all
select 'product_images'::text as table_name, count(*) as rows from public."product_images"
union all
select 'product_inventory_requirements'::text as table_name, count(*) as rows from public."product_inventory_requirements"
union all
select 'products'::text as table_name, count(*) as rows from public."products"
union all
select 'profiles'::text as table_name, count(*) as rows from public."profiles"
union all
select 'promotion_products'::text as table_name, count(*) as rows from public."promotion_products"
union all
select 'promotions'::text as table_name, count(*) as rows from public."promotions"
union all
select 'rate_limit_attempts'::text as table_name, count(*) as rows from public."rate_limit_attempts"
union all
select 'sale_returns'::text as table_name, count(*) as rows from public."sale_returns"
union all
select 'seasons'::text as table_name, count(*) as rows from public."seasons"
union all
select 'system_settings'::text as table_name, count(*) as rows from public."system_settings"
union all
select 'whatsapp_config'::text as table_name, count(*) as rows from public."whatsapp_config") c),'auth_user_count',(select count(*) from auth.users)) as data_categories;
