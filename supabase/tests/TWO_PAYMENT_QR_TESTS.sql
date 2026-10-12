-- Real PostgreSQL regression; disposable LOCAL only, all fixtures roll back.
BEGIN;
SET LOCAL search_path=public,extensions,pg_catalog;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
 OR EXISTS(SELECT 1 FROM public.profiles) OR EXISTS(SELECT 1 FROM public.orders)
 THEN RAISE EXCEPTION 'Requires opted-in empty isolated lab'; END IF;
END $$;
INSERT INTO auth.users(id,raw_user_meta_data) VALUES('00000000-0000-4000-8000-000000000001','{"full_name":"TEST TWO QR ADMIN"}');
UPDATE profiles SET role='administrador',is_active=true WHERE id='00000000-0000-4000-8000-000000000001';
INSERT INTO inventory_items(id,name,item_type) VALUES('00000000-0000-4000-8000-000000000020','TEST TWO QR STOCK','flor');
INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES('00000000-0000-4000-8000-000000000020',20,'00000000-0000-4000-8000-000000000001');
INSERT INTO products(id,name,price) VALUES('00000000-0000-4000-8000-000000000030','TEST TWO QR PRODUCT',100);
INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000020',1);
UPDATE system_settings SET value='{"enabled":true}' WHERE key='accept_orders_outside_hours';

SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM report_payment_qr(gen_random_uuid(),'00012001','qr_1'); RAISE EXCEPTION 'anon executed payment helper'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM set_payment_qr_slot(NULL,'qr_1',false); RAISE EXCEPTION 'anon configured QR'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM report_payment_qr(gen_random_uuid(),'00012001','qr_1'); RAISE EXCEPTION 'authenticated executed payment helper'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM set_payment_qr_slot(NULL,'qr_2',false); RAISE EXCEPTION 'authenticated configured QR'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

DO $test$
DECLARE actor uuid:='00000000-0000-4000-8000-000000000001'; o uuid; result jsonb; again jsonb; snap jsonb; normal uuid; rejected uuid; free uuid; promo uuid; before_stock numeric;
BEGIN
 SELECT current_stock INTO before_stock FROM inventory_items WHERE id='00000000-0000-4000-8000-000000000020';
 SELECT create_order('TEST TWO QR CUSTOMER','00012001',NULL,'[{"product_id":"00000000-0000-4000-8000-000000000030","quantity":1}]',NULL,'TEST TWO QR '||gen_random_uuid(),NULL) INTO o;
 BEGIN PERFORM report_payment_qr(o,'00012001','qr_1'); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='missing QR accepted'; EXCEPTION WHEN raise_exception THEN NULL; END;
 IF EXISTS(SELECT 1 FROM payments WHERE order_id=o) OR EXISTS(SELECT 1 FROM inventory_reservations WHERE order_id=o AND expires_at='infinity') THEN RAISE EXCEPTION 'missing QR caused partial payment/hold'; END IF;
 PERFORM set_payment_qr_slot(actor,'qr_1',true,'http://127.0.0.1:59621/test-qr-a.png','test/qr-a.png','TEST QR A');
 result:=report_payment_qr(o,'00012001',NULL);
 IF result->>'qr_slot'<>'qr_1' OR result->>'qr_label'<>'TEST QR A' OR result->>'status'<>'pendiente' THEN RAISE EXCEPTION 'single QR default/snapshot'; END IF;
 IF EXISTS(SELECT 1 FROM customers WHERE phone='00012001') OR (SELECT current_stock FROM inventory_items WHERE id='00000000-0000-4000-8000-000000000020')<>before_stock THEN RAISE EXCEPTION 'report materialized customer/consumed stock'; END IF;
 snap:=track_order_details('00012001',NULL,o);
 IF snap->>'receipt_token' IS NOT NULL OR snap->'reported_qr'->>'account_label'<>'TEST QR A' THEN RAISE EXCEPTION 'pending receipt/snapshot'; END IF;
 PERFORM set_payment_qr_slot(actor,'qr_1',NULL,NULL,NULL,'TEST QR A RENAMED');
 PERFORM set_payment_qr_slot(actor,'qr_1',false);
 again:=report_payment_qr(o,'00012001','qr_1');
 IF again->>'id'<>result->>'id' OR again->>'qr_label'<>'TEST QR A' OR (SELECT count(*) FROM payments WHERE order_id=o)<>1 THEN RAISE EXCEPTION 'retry changed snapshot/duplicated'; END IF;
 BEGIN PERFORM report_payment_qr(o,'00012002','qr_1'); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='wrong phone accepted'; EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL; END;
 PERFORM set_payment_qr_slot(actor,'qr_2',true,'http://127.0.0.1:59621/test-qr-b.png','test/qr-b.png','TEST QR B');
 SELECT create_order('TEST TWO QR CUSTOMER B','00012002',NULL,'[{"product_id":"00000000-0000-4000-8000-000000000030","quantity":1}]',NULL,'TEST TWO QR '||gen_random_uuid(),NULL) INTO rejected;
 result:=report_payment_qr(rejected,'00012002',NULL);
 IF result->>'qr_slot'<>'qr_2' THEN RAISE EXCEPTION 'only QR2 not selected'; END IF;
 PERFORM set_payment_qr_slot(actor,'qr_1',true);
 SELECT create_order('TEST TWO QR CUSTOMER C','00012003',NULL,'[{"product_id":"00000000-0000-4000-8000-000000000030","quantity":1}]',NULL,'TEST TWO QR '||gen_random_uuid(),NULL) INTO normal;
 BEGIN PERFORM report_payment_qr(normal,'00012003',NULL); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='two QR auto selected'; EXCEPTION WHEN raise_exception THEN NULL; END;
 IF EXISTS(SELECT 1 FROM payments WHERE order_id=normal) THEN RAISE EXCEPTION 'invalid selection mutated payment'; END IF;
 result:=report_payment_qr(normal,'00012003','qr_2');
 IF result->>'qr_label'<>'TEST QR B' THEN RAISE EXCEPTION 'server snapshot incorrect'; END IF;
 BEGIN PERFORM report_payment_qr(normal,'00012003','qr_1'); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='changed reported QR'; EXCEPTION WHEN raise_exception THEN NULL; END;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',actor,'role','authenticated')::text,true);
 PERFORM confirm_payment((result->>'id')::uuid);
 snap:=track_order_details('00012003',NULL,normal);
 IF snap->>'status'<>'confirmado' OR snap->>'receipt_token' IS NULL OR NOT EXISTS(SELECT 1 FROM customers WHERE phone='00012003') THEN RAISE EXCEPTION 'manual confirmation broken'; END IF;
 PERFORM reject_payment((SELECT id FROM payments WHERE order_id=rejected),'TEST TWO QR REJECTION');
 IF (SELECT status FROM payments WHERE order_id=rejected)<>'rechazado' THEN RAISE EXCEPTION 'manual rejection broken'; END IF;
 INSERT INTO promotions(name,promotion_type,discount_type,discount_value,is_active) VALUES('TEST TWO QR FREE','producto','porcentaje',100,true) RETURNING id INTO promo;
 INSERT INTO promotion_products(promotion_id,product_id) VALUES(promo,'00000000-0000-4000-8000-000000000030');
 SELECT create_order('TEST TWO QR FREE CUSTOMER','00012004',NULL,'[{"product_id":"00000000-0000-4000-8000-000000000030","quantity":1}]',NULL,'TEST TWO QR '||gen_random_uuid(),promo) INTO free;
 IF (SELECT total FROM orders WHERE id=free)<>0 OR (SELECT status FROM orders WHERE id=free)<>'confirmado' OR EXISTS(SELECT 1 FROM payments WHERE order_id=free) THEN RAISE EXCEPTION 'free order changed'; END IF;
END $test$;
ROLLBACK;
