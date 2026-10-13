-- Solo laboratorio LOCAL desechable con las diez migraciones anteriores + seed.
-- Este fixture conserva datos sintéticos para probar el delta de la candidata 11.
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
 OR to_regprocedure('public.assert_product_recipe(uuid)') IS NOT NULL
 OR EXISTS(SELECT 1 FROM public.profiles) OR EXISTS(SELECT 1 FROM public.orders) THEN
  RAISE EXCEPTION 'Requiere laboratorio vacío anterior a candidata11';
 END IF;
END; $$;
INSERT INTO auth.users(id,raw_user_meta_data) VALUES('20000000-0000-4000-8000-000000000001','{"full_name":"TEST LEGACY DELTA ADMIN"}');
UPDATE public.profiles SET role='administrador',is_active=true WHERE id='20000000-0000-4000-8000-000000000001';
INSERT INTO public.inventory_items(id,name,item_type) VALUES('20000000-0000-4000-8000-000000000020','TEST LEGACY DELTA STOCK','flor');
INSERT INTO public.inventory_entries(inventory_item_id,quantity,created_by) VALUES('20000000-0000-4000-8000-000000000020',20,'20000000-0000-4000-8000-000000000001');
INSERT INTO public.products(id,name,price) VALUES('20000000-0000-4000-8000-000000000030','TEST LEGACY WITH RECIPE',45),('20000000-0000-4000-8000-000000000031','TEST LEGACY WITHOUT RECIPE',45);
INSERT INTO public.product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES('20000000-0000-4000-8000-000000000030','20000000-0000-4000-8000-000000000020',1);
UPDATE public.system_settings SET value='{"enabled":true}' WHERE key='accept_orders_outside_hours';
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE bad uuid; good uuid;
BEGIN
 bad:=public.create_order('TEST LEGACY MIXED','00013301',NULL,'[{"product_id":"20000000-0000-4000-8000-000000000030","quantity":1},{"product_id":"20000000-0000-4000-8000-000000000031","quantity":1}]',NULL,'TEST-LEGACY-MIXED',NULL);
 good:=public.create_order('TEST LEGACY VALID','00013302',NULL,'[{"product_id":"20000000-0000-4000-8000-000000000030","quantity":1}]',NULL,'TEST-LEGACY-VALID',NULL);
 PERFORM * FROM public.create_payment(bad,'00013301');
 PERFORM * FROM public.create_payment(good,'00013302');
 IF (SELECT count(*) FROM public.inventory_reservations WHERE order_id=bad)<>1 THEN RAISE EXCEPTION 'No se reprodujo la reserva incompleta original'; END IF;
 RAISE NOTICE 'PASS: esquema anterior permite dos productos con reserva solo para uno';
END; $$;
COMMIT;
