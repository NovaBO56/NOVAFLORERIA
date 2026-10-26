-- Synthetic fixture, exclusively a disposable LOCAL database. Everything rolls back.
\set ON_ERROR_STOP on
BEGIN;
-- Make this fixture repeatable after the separate concurrency fixture. This
-- temporary starting configuration, including its audit rows, is rolled back.
UPDATE public.product_recommendation_settings SET enabled=false,scope='all',
 product_ids='{}',category_ids='{}',excluded_category_ids='{}',excluded_product_ids='{}',revision=0;
DO $$
DECLARE actor uuid:='fa240001-0000-4000-8000-000000000001'; employee uuid:='fa240001-0000-4000-8000-000000000002';
 material uuid:=gen_random_uuid(); scarce uuid:=gen_random_uuid(); category uuid:=gen_random_uuid(); other_category uuid:=gen_random_uuid();
 ids uuid[]:='{}'; extra uuid; p uuid; rev integer; before_stock numeric; result uuid[]; denied boolean; i integer; diagnostics jsonb;
BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(actor,'admin-global-qa@example.invalid','{"full_name":"TEST GLOBAL ADMIN"}'),(employee,'employee-global-qa@example.invalid','{"full_name":"TEST GLOBAL EMPLOYEE"}');
 INSERT INTO profiles(id,full_name,role,is_active) VALUES(actor,'TEST GLOBAL ADMIN','administrador',true),(employee,'TEST GLOBAL EMPLOYEE','empleado',true)
 ON CONFLICT(id) DO UPDATE SET role=excluded.role,is_active=true;
 PERFORM set_config('nova.audit_actor',actor::text,true);
 INSERT INTO categories(id,name,is_active) VALUES(category,'TEST GLOBAL RAMOS',true),(other_category,'TEST GLOBAL OTROS',true);
 INSERT INTO inventory_items(id,name,item_type) VALUES(material,'TEST GLOBAL MATERIAL','flor'),(scarce,'TEST GLOBAL LAST UNIT','insumo');
 INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES(material,1000,actor),(scarce,1,actor);
 FOR i IN 1..120 LOOP
   p:=gen_random_uuid(); ids:=array_append(ids,p);
   INSERT INTO products(id,name,price,category_id,is_active,is_available) VALUES(p,'TEST GLOBAL PRODUCT '||i,10+i,CASE WHEN i%2=0 THEN category ELSE other_category END,false,false);
   INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES(p,CASE WHEN i IN(119,120) THEN scarce ELSE material END,1);
   UPDATE products SET is_active=true,is_available=true WHERE id=p;
 END LOOP;
 SELECT current_stock INTO before_stock FROM inventory_items WHERE id=material;
 -- Existing legacy recommendation retains its custom semantics, no preference row needed.
 PERFORM set_product_recommendations(ids[1],ARRAY[ids[6]],actor);
 IF resolve_product_recommendation_ids(ids[1])<>ARRAY[ids[6]] THEN RAISE EXCEPTION 'FAIL legacy compatibility'; END IF;
 IF resolve_product_recommendation_ids(ids[2])<>'{}'::uuid[] THEN RAISE EXCEPTION 'FAIL disabled installation'; END IF;
 rev:=save_global_product_recommendations(true,'all',ids[3:7],'{}','{}','{}',0,actor);
 IF rev<>1 THEN RAISE EXCEPTION 'FAIL revision'; END IF;
 FOR i IN 2..120 LOOP
   result:=resolve_product_recommendation_ids(ids[i]);
   IF NOT(result @> ARRAY[ids[6]]) AND i<>6 THEN RAISE EXCEPTION 'FAIL multi-product inheritance %',i; END IF;
   IF ids[i]=ANY(result) THEN RAISE EXCEPTION 'FAIL self recommendation'; END IF;
 END LOOP;
 IF resolve_product_recommendation_ids(ids[1])<>ARRAY[ids[6]] THEN RAISE EXCEPTION 'FAIL legacy overwritten'; END IF;
 PERFORM save_global_product_recommendations(true,'categories',ids[3:7],ARRAY[category],'{}',ARRAY[ids[2]],1,actor);
 IF resolve_product_recommendation_ids(ids[2])<>'{}'::uuid[] OR resolve_product_recommendation_ids(ids[3])<>'{}'::uuid[] OR cardinality(resolve_product_recommendation_ids(ids[4]))=0 THEN RAISE EXCEPTION 'FAIL scope/exclusions'; END IF;
 PERFORM save_global_product_recommendations(true,'all',ids[3:7],'{}',ARRAY[category],'{}',2,actor);
 IF resolve_product_recommendation_ids(ids[4])<>'{}'::uuid[] THEN RAISE EXCEPTION 'FAIL excluded category'; END IF;
 -- Global/off switches preserve the old rows. Explicit empty custom does not inherit.
 PERFORM save_product_recommendation_preferences(ids[1],'off',NULL,0,actor);
 IF resolve_product_recommendation_ids(ids[1])<>'{}'::uuid[] OR NOT EXISTS(SELECT 1 FROM product_recommendations WHERE product_id=ids[1]) THEN RAISE EXCEPTION 'FAIL off preservation'; END IF;
 PERFORM save_product_recommendation_preferences(ids[1],'global',NULL,1,actor);
 IF cardinality(resolve_product_recommendation_ids(ids[1]))=0 THEN RAISE EXCEPTION 'FAIL explicit global'; END IF;
 PERFORM save_product_recommendation_preferences(ids[1],'custom',ARRAY[ids[6]],2,actor);
 IF resolve_product_recommendation_ids(ids[1])<>ARRAY[ids[6]] THEN RAISE EXCEPTION 'FAIL restore custom'; END IF;
 PERFORM save_product_recommendation_preferences(ids[1],'custom','{}',3,actor);
 IF resolve_product_recommendation_ids(ids[1])<>'{}'::uuid[] THEN RAISE EXCEPTION 'FAIL explicit empty custom'; END IF;
 denied:=false; BEGIN PERFORM save_product_recommendation_preferences(ids[1],'off',NULL,0,actor); EXCEPTION WHEN serialization_failure THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL stale individual revision'; END IF;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ids[3:7],'{}','{}','{}',0,actor); EXCEPTION WHEN serialization_failure THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL stale global revision'; END IF;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ids[3:7],'{}','{}','{}',3,employee); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL employee actor'; END IF;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ARRAY[ids[3],ids[3]],'{}','{}','{}',3,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL duplicate'; END IF;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ids[1:21],'{}','{}','{}',3,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL max20'; END IF;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ARRAY[gen_random_uuid()],'{}','{}','{}',3,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL invalid reference'; END IF;
 -- Candidate flags change visibility, not configuration. Existing stock RPC is reused.
 UPDATE products SET is_active=false WHERE id=ids[3];
 UPDATE products SET is_sold_out=true WHERE id=ids[4];
 IF NOT EXISTS(SELECT 1 FROM product_recommendation_settings WHERE ids[3]=ANY(product_ids) AND ids[4]=ANY(product_ids)) THEN RAISE EXCEPTION 'FAIL stored references removed'; END IF;
 IF EXISTS(SELECT 1 FROM get_product_availability(jsonb_build_array(jsonb_build_object('product_id',ids[3]),jsonb_build_object('product_id',ids[4])),false) WHERE is_available) THEN RAISE EXCEPTION 'FAIL unavailable flags'; END IF;
 UPDATE products SET is_active=true WHERE id=ids[3]; UPDATE products SET is_sold_out=false WHERE id=ids[4];
 PERFORM save_product_recommendation_preferences(ids[1],'custom',ARRAY[ids[6]],4,actor);
 UPDATE products SET is_active=false WHERE id=ids[6];
 PERFORM save_product_recommendation_preferences(ids[1],'custom',ARRAY[ids[6]],5,actor);
 IF resolve_product_recommendation_ids(ids[1])<>ARRAY[ids[6]] THEN RAISE EXCEPTION 'FAIL inactive saved reference preservation'; END IF;
 denied:=false; BEGIN PERFORM save_product_recommendation_preferences(ids[2],'custom',ARRAY[ids[6]],0,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL new inactive selection'; END IF;
 UPDATE products SET is_active=true WHERE id=ids[6];
 denied:=false; BEGIN PERFORM save_product_recommendation_preferences(ids[6],'custom',ARRAY[ids[1]],0,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL custom cycle'; END IF;
 denied:=false; BEGIN PERFORM save_product_recommendation_preferences(ids[2],'custom',ids[3:7],0,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL custom max4'; END IF;
 extra:=gen_random_uuid(); p:=gen_random_uuid();
 INSERT INTO inventory_items(id,name,item_type) VALUES(extra,'TEST GLOBAL ZERO STOCK','insumo');
 INSERT INTO products(id,name,price,is_active,is_available) VALUES(p,'TEST GLOBAL SOLD OUT',1,false,false);
 INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES(p,extra,1);
 UPDATE products SET is_active=true,is_available=true WHERE id=p;
 denied:=false; BEGIN PERFORM save_global_product_recommendations(true,'all',ARRAY[p],'{}','{}','{}',3,actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'FAIL new calculated zero-stock selection'; END IF;
 IF EXISTS(SELECT 1 FROM get_product_availability(jsonb_build_array(jsonb_build_object('product_id',ids[119]),jsonb_build_object('product_id',ids[120])),true) WHERE is_available) THEN RAISE EXCEPTION 'FAIL shared last stock'; END IF;
 IF (SELECT current_stock FROM inventory_items WHERE id=material)<>before_stock THEN RAISE EXCEPTION 'FAIL recommendation consumed inventory'; END IF;
 diagnostics:=get_product_publication_diagnostics(ids[2]);
 IF NOT (diagnostics->>'recipe_valid')::boolean OR (diagnostics->>'photos')::integer<>0 THEN RAISE EXCEPTION 'FAIL publication diagnostics'; END IF;
 p:=gen_random_uuid(); INSERT INTO products(id,name,price,is_active,is_available) VALUES(p,'TEST GLOBAL INCOMPLETE',1,false,false);
 IF (get_product_publication_diagnostics(p)->>'recipe_valid')::boolean THEN RAISE EXCEPTION 'FAIL incomplete recipe'; END IF;
 IF NOT EXISTS(SELECT 1 FROM audit_logs WHERE user_id=actor AND table_name='product_recommendation_settings') OR NOT EXISTS(SELECT 1 FROM audit_logs WHERE user_id=actor AND table_name='product_recommendation_preferences') THEN RAISE EXCEPTION 'FAIL audit'; END IF;
 RAISE NOTICE 'PASS: 120 products, legacy/custom/global/off, category/product exclusions, empty custom, revisions, actor, invalid/duplicate/max20/max4/cycle, inactive preservation, calculated stock, inventory shared, diagnostics, audit; all rolled back';
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF has_table_privilege(current_user,'public.product_recommendation_settings','SELECT') OR has_table_privilege(current_user,'public.product_recommendation_preferences','UPDATE') OR has_function_privilege(current_user,'public.resolve_product_recommendation_ids(uuid)','EXECUTE') THEN RAISE EXCEPTION 'FAIL anon ACL'; END IF;
 BEGIN PERFORM * FROM public.product_recommendation_settings; RAISE EXCEPTION 'FAIL anon read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RAISE NOTICE 'PASS anon real SQL ACL/RLS';
END; $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF has_table_privilege(current_user,'public.product_recommendation_settings','SELECT') OR has_function_privilege(current_user,'public.save_product_recommendation_preferences(uuid,text,uuid[],integer,uuid)','EXECUTE') THEN RAISE EXCEPTION 'FAIL authenticated ACL'; END IF;
 BEGIN PERFORM * FROM public.product_recommendation_preferences; RAISE EXCEPTION 'FAIL authenticated read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RAISE NOTICE 'PASS authenticated real SQL ACL/RLS';
END; $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ DECLARE revision integer; BEGIN
 revision:=public.save_global_product_recommendations(false,'all','{}','{}','{}','{}',3,'fa240001-0000-4000-8000-000000000001');
 IF revision<>4 THEN RAISE EXCEPTION 'FAIL service-role execution'; END IF;
 PERFORM public.get_product_publication_diagnostics((SELECT id FROM products WHERE name='TEST GLOBAL PRODUCT 1'));
 RAISE NOTICE 'PASS service_role RPC and verified active admin actor';
END; $$;
RESET ROLE;
ROLLBACK;
