-- NO EJECUTADO. Solo instancia Supabase NUEVA, LOCAL y desechable.
-- Prerrequisitos: baseline + seeds + 036. Ejecutar como postgres.
-- Debe establecerse explícitamente: SET nova.security_test = 'isolated';
-- El fixture entero revierte al final; secuencias pueden avanzar en la instancia desechable.
BEGIN;
SET LOCAL search_path = public, extensions, pg_catalog;
DO $guard$
BEGIN
  IF current_user <> 'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
     OR EXISTS (SELECT 1 FROM public.profiles) OR EXISTS (SELECT 1 FROM public.orders) THEN
    RAISE EXCEPTION 'Fixture requiere instancia aislada vacía, postgres y opt-in explícito.';
  END IF;
END;
$guard$;

-- Todos los datos son sintéticos: prefijo TEST SECURITY, teléfonos reservados al fixture.
INSERT INTO auth.users (id, raw_user_meta_data)
VALUES ('00000000-0000-4000-8000-000000000001', '{"full_name":"TEST SECURITY ADMIN"}');
DO $test$
BEGIN
  IF (SELECT is_active FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Un usuario nuevo obtuvo acceso de personal automáticamente';
  END IF;
END;
$test$;
UPDATE public.profiles SET role='administrador', is_active=true
WHERE id='00000000-0000-4000-8000-000000000001';
INSERT INTO public.customers (id,name,phone)
VALUES ('00000000-0000-4000-8000-000000000010','TEST SECURITY A','70000001'),
       ('00000000-0000-4000-8000-000000000011','TEST SECURITY B','70000002');
INSERT INTO public.inventory_items (id,name,item_type)
VALUES ('00000000-0000-4000-8000-000000000020','TEST SECURITY STOCK','flor');
INSERT INTO public.inventory_entries (inventory_item_id,quantity,created_by)
VALUES ('00000000-0000-4000-8000-000000000020',10,'00000000-0000-4000-8000-000000000001');
INSERT INTO public.products (id,name,price)
VALUES ('00000000-0000-4000-8000-000000000030','TEST SECURITY PRODUCT',100);
INSERT INTO public.product_inventory_requirements (product_id,inventory_item_id,quantity)
VALUES ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000020',1);
INSERT INTO public.orders (id,customer_id,subtotal,total,reserved_until)
VALUES ('00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000010',100,100,now()+interval '30 minutes'),
       ('00000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000011',100,100,now()+interval '30 minutes'),
       ('00000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000010',100,100,now()-interval '1 minute'),
       ('00000000-0000-4000-8000-000000000043','00000000-0000-4000-8000-000000000010',100,100,now()+interval '30 minutes');
INSERT INTO public.inventory_reservations (order_id,inventory_item_id,quantity,expires_at)
SELECT id,'00000000-0000-4000-8000-000000000020',1,reserved_until
FROM public.orders;

-- Permisos reales PostgreSQL: la llamada debe fallar ANTES del cuerpo.
SET LOCAL ROLE anon;
DO $deny$
BEGIN
  BEGIN
    PERFORM public.consume_product_inventory('00000000-0000-4000-8000-000000000030',1,'test',NULL,NULL);
    RAISE EXCEPTION 'anon ejecutó consume_product_inventory';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.apply_order_discount('00000000-0000-4000-8000-000000000040',100,NULL,NULL,1,'TEST',NULL);
    RAISE EXCEPTION 'anon ejecutó apply_order_discount';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.release_expired_reservations(NULL);
    RAISE EXCEPTION 'anon ejecutó release_expired_reservations';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Todavía existe el contrato antiguo de pago';
  END IF;
  BEGIN
    PERFORM public.create_payment('00000000-0000-4000-8000-000000000040','70000001');
    RAISE EXCEPTION 'anon ejecutó contrato servidor de pago';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$deny$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $deny$
BEGIN
  BEGIN
    PERFORM public.apply_order_discount('00000000-0000-4000-8000-000000000040',100,NULL,NULL,1,'TEST',NULL);
    RAISE EXCEPTION 'authenticated ejecutó helper de descuento';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.consume_product_inventory('00000000-0000-4000-8000-000000000030',1,'test',NULL,NULL);
    RAISE EXCEPTION 'authenticated ejecutó helper de inventario';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.create_payment('00000000-0000-4000-8000-000000000040','70000001');
    RAISE EXCEPTION 'authenticated ejecutó pago directo';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$deny$;
RESET ROLE;

SET LOCAL ROLE service_role;
DO $payment$
DECLARE a uuid; b uuid;
BEGIN
  BEGIN
    PERFORM public.create_payment('00000000-0000-4000-8000-000000000041','70000001');
    RAISE EXCEPTION 'El teléfono A reportó pago para pedido B';
  EXCEPTION WHEN no_data_found THEN NULL; END;
  IF EXISTS (SELECT 1 FROM public.payments WHERE order_id='00000000-0000-4000-8000-000000000041') THEN
    RAISE EXCEPTION 'Se creó pago ajeno';
  END IF;
  SELECT id INTO a FROM public.create_payment('00000000-0000-4000-8000-000000000040','70000001');
  SELECT id INTO b FROM public.create_payment('00000000-0000-4000-8000-000000000040','70000001');
  IF a IS DISTINCT FROM b OR (SELECT count(*) FROM public.payments WHERE order_id='00000000-0000-4000-8000-000000000040')<>1 THEN
    RAISE EXCEPTION 'Doble reporte creó pagos duplicados';
  END IF;
  IF (SELECT amount FROM public.payments WHERE id=a)<>100 OR (SELECT status FROM public.payments WHERE id=a)<>'pendiente' THEN
    RAISE EXCEPTION 'Monto/estado del pago inválido';
  END IF;
END;
$payment$;
RESET ROLE;

-- Fixtures negativos para confirmación, sin usar clientes reales.
INSERT INTO public.payments (id,order_id,amount)
VALUES ('00000000-0000-4000-8000-000000000052','00000000-0000-4000-8000-000000000042',100),
       ('00000000-0000-4000-8000-000000000053','00000000-0000-4000-8000-000000000043',100);
UPDATE public.orders SET status='cancelado', cancellation_reason='TEST SECURITY CANCEL'
WHERE id='00000000-0000-4000-8000-000000000043';
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $confirm$
DECLARE a uuid;
BEGIN
  BEGIN
    PERFORM public.confirm_payment('00000000-0000-4000-8000-000000000052');
    RAISE EXCEPTION 'Se confirmó reserva vencida';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'La reserva del pedido venció%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.confirm_payment('00000000-0000-4000-8000-000000000053');
    RAISE EXCEPTION 'Se confirmó pedido cancelado';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'El pedido ya no admite confirmación de pago.' THEN RAISE; END IF;
  END;
  SELECT id INTO a FROM public.payments WHERE order_id='00000000-0000-4000-8000-000000000040';
  PERFORM public.confirm_payment(a);
  IF (SELECT status FROM public.orders WHERE id='00000000-0000-4000-8000-000000000040')<>'confirmado' THEN
    RAISE EXCEPTION 'Confirmación válida no confirmó pedido';
  END IF;
  IF (SELECT current_stock FROM public.inventory_items WHERE id='00000000-0000-4000-8000-000000000020')<>9 THEN
    RAISE EXCEPTION 'Stock después de confirmación inválido';
  END IF;
END;
$confirm$;
RESET ROLE;
DO $rollback_assert$
BEGIN
  IF (SELECT status FROM public.orders WHERE id='00000000-0000-4000-8000-000000000042')<>'pendiente_pago'
     OR (SELECT status FROM public.payments WHERE id='00000000-0000-4000-8000-000000000052')<>'pendiente' THEN
    RAISE EXCEPTION 'Rechazo de confirmación persistió cambios inesperados';
  END IF;
END;
$rollback_assert$;
SET LOCAL ROLE service_role;
SELECT public.release_expired_reservations(NULL);
RESET ROLE;
DO $expiry$
BEGIN
  IF (SELECT status FROM public.orders WHERE id='00000000-0000-4000-8000-000000000042')<>'cancelado'
     OR EXISTS (SELECT 1 FROM public.inventory_reservations WHERE order_id='00000000-0000-4000-8000-000000000042' AND status<>'released') THEN
    RAISE EXCEPTION 'Expiración no liberó y canceló';
  END IF;
END;
$expiry$;

SET LOCAL ROLE authenticated;
DO $sale$
DECLARE sale record; reg uuid;
BEGIN
  SELECT id INTO reg FROM public.cash_registers LIMIT 1;
  PERFORM public.open_cash_session(reg,0);
  SELECT * INTO sale FROM public.create_physical_sale(
    '[{"product_id":"00000000-0000-4000-8000-000000000030","quantity":1}]',NULL,NULL,1,'TEST SECURITY DISCOUNT','efectivo');
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id=sale.id AND status='finalizado') THEN
    RAISE EXCEPTION 'Venta física no quedó finalizada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payments WHERE order_id=sale.id AND status='confirmado' AND amount=99) THEN
    RAISE EXCEPTION 'Pago/descuento de venta física inválido';
  END IF;
  -- create_physical_sale SECURITY DEFINER sí puede ejecutar apply_order_discount;
  -- permisos externos del helper se probaron denegados arriba.
END;
$sale$;
RESET ROLE;
ROLLBACK;
