-- Solo lectura. No consulta datos personales ni modifica el esquema.
begin read only;
select
  to_regprocedure('public.track_order_details(text,bigint,uuid)') is not null as summary_exists,
  to_regprocedure('public.track_order(bigint,text)') is not null as tracking_exists,
  to_regprocedure('public.create_order(text,text,text,jsonb,text,text,uuid)') is not null as create_order_exists,
  to_regprocedure('public.create_payment(uuid)') is not null as create_payment_exists,
  to_regclass('public.orders') is not null as orders_exists,
  to_regclass('public.customers') is not null as customers_exists,
  to_regclass('public.payments') is not null as payments_exists,
  to_regclass('public.customization_option_inventory_requirements') is not null as option_inventory_exists;
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('id', 'order_number', 'customer_id', 'deleted_at', 'reserved_until');
select
  position('customization_option_ids' in pg_get_functiondef(p.oid)) > 0 as validates_option_ids,
  position('customization_option_inventory_requirements' in pg_get_functiondef(p.oid)) > 0 as reserves_option_inventory,
  position('get_business_status' in pg_get_functiondef(p.oid)) > 0 as validates_business_hours,
  position('apply_order_discount' in pg_get_functiondef(p.oid)) > 0 as applies_discounts,
  position('idempotency_key' in pg_get_functiondef(p.oid)) > 0 as uses_idempotency,
  md5(pg_get_functiondef(p.oid)) as definition_hash
from pg_proc p where p.oid = to_regprocedure('public.create_order(text,text,text,jsonb,text,text,uuid)');
select p.oid::regprocedure::text as function_name, md5(pg_get_functiondef(p.oid)) as definition_hash
from pg_proc p where p.oid in (to_regprocedure('public.create_payment(uuid)'), to_regprocedure('public.track_order(bigint,text)'));
commit;
