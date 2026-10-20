-- Empty isolated Supabase only; synthetic fixtures roll back. Real SQL, no mocks.
BEGIN;
SET LOCAL search_path=public,extensions,pg_catalog;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('nova.security_test',true) IS DISTINCT FROM 'isolated'
 OR EXISTS(SELECT 1 FROM profiles) OR EXISTS(SELECT 1 FROM orders)
 THEN RAISE EXCEPTION 'Requires opted-in empty isolated lab'; END IF;
END; $$;
INSERT INTO auth.users(id,raw_user_meta_data) VALUES('00000000-0000-4000-8000-000000000001','{"full_name":"TEST DEDICATION ADMIN"}');
UPDATE profiles SET role='administrador',is_active=true WHERE id='00000000-0000-4000-8000-000000000001';
INSERT INTO inventory_items(id,name,item_type,is_dedication_card) VALUES
 ('00000000-0000-4000-8000-000000000020','TEST card arbitrary name','insumo',true),
 ('00000000-0000-4000-8000-000000000021','TEST not a card even if named Tarjeta','insumo',false);
INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) SELECT id,100,'00000000-0000-4000-8000-000000000001' FROM inventory_items;
INSERT INTO products(id,name,price) VALUES('00000000-0000-4000-8000-000000000030','TEST card product',100),('00000000-0000-4000-8000-000000000031','TEST no card',100);
INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES
 ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000020',1),
 ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000021',1);
UPDATE products SET is_active=true,is_available=true;
UPDATE system_settings SET value='{"enabled":true}' WHERE key='accept_orders_outside_hours';
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM product_dedication_card_count(gen_random_uuid()); RAISE EXCEPTION 'anon can read private recipe classification'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM product_dedication_card_count(gen_random_uuid()); RAISE EXCEPTION 'authenticated can read private helper'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
DO $test$
DECLARE p uuid:='00000000-0000-4000-8000-000000000030'; o uuid; again uuid; payload jsonb; stored jsonb; k text:=gen_random_uuid()::text; before_count bigint;
BEGIN
 BEGIN UPDATE product_inventory_requirements SET quantity=0.5 WHERE product_id=p;
  RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='Fractional card accepted'; EXCEPTION WHEN raise_exception THEN NULL; END;
 IF product_dedication_card_count(p)<>1 OR product_dedication_card_count('00000000-0000-4000-8000-000000000031')<>0 THEN RAISE EXCEPTION 'Classification is not explicit'; END IF;
 payload:=jsonb_build_array(jsonb_build_object('product_id',p,'quantity',2,'dedications',jsonb_build_array(jsonb_build_object('message',E'Mensaje uno\nCon cariño','signature','TEST Ana'),jsonb_build_object('message','Mensaje dos','signature','TEST Luis'))));
 o:=create_order('TEST DEDICATION','00012001',NULL,payload,NULL,k,NULL);
 again:=create_order('TEST DEDICATION','00012001',NULL,payload,NULL,k,NULL);
 SELECT dedications INTO stored FROM order_items WHERE order_id=o;
 IF o<>again OR stored IS DISTINCT FROM payload->0->'dedications' OR (SELECT sum(quantity) FROM inventory_reservations WHERE order_id=o)<>2 THEN RAISE EXCEPTION 'Snapshot/idempotency/reservation failed'; END IF;
 IF (SELECT current_stock FROM inventory_items WHERE id='00000000-0000-4000-8000-000000000020')<>100 THEN RAISE EXCEPTION 'Premature consumption'; END IF;
 IF track_order_details('00012001',NULL,o)->'items'->0->'dedications' IS DISTINCT FROM stored THEN RAISE EXCEPTION 'Tracking lost dedication'; END IF;
 payload:=jsonb_set(payload,'{0,dedications,0,message}','"Changed"');
 BEGIN PERFORM create_order('TEST DEDICATION','00012001',NULL,payload,NULL,k,NULL); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='Changed contract accepted'; EXCEPTION WHEN raise_exception THEN NULL; END;
 SELECT count(*) INTO before_count FROM orders;
 payload:=jsonb_build_array(jsonb_build_object('product_id','00000000-0000-4000-8000-000000000031','quantity',1,'dedications',jsonb_build_array(jsonb_build_object('message','Manipulated','signature',''))));
 BEGIN PERFORM create_order('TEST DEDICATION','00012001',NULL,payload,NULL,gen_random_uuid()::text,NULL); RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='No card accepted'; EXCEPTION WHEN raise_exception THEN NULL; END;
 IF (SELECT count(*) FROM orders)<>before_count THEN RAISE EXCEPTION 'Partial failed order'; END IF;
 IF NOT has_function_privilege('service_role','product_dedication_card_count(uuid,uuid[])','EXECUTE') THEN RAISE EXCEPTION 'Server missing private helper'; END IF;
 RAISE NOTICE 'PASS explicit classification, ACL anon/auth/server, separate snapshots, changed payload, exact reservation, no premature consumption, tracking, atomic rejection';
END; $test$;
ROLLBACK;
