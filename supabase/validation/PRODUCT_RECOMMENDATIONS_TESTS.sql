-- LOCAL/disposable only. Requires an existing active synthetic administrator.
BEGIN;
DO $$
DECLARE actor uuid; a uuid; b uuid; c uuid; material uuid; denied boolean; who text;
BEGIN
  SELECT id INTO actor FROM profiles WHERE role='administrador' AND is_active LIMIT 1;
  IF actor IS NULL THEN
    actor:=gen_random_uuid();
    INSERT INTO auth.users(id,raw_user_meta_data) VALUES(actor,'{"full_name":"TEST RECOMMENDATIONS ADMIN"}');
    UPDATE profiles SET role='administrador',is_active=true WHERE id=actor;
  END IF;
  SELECT id INTO a FROM products WHERE is_active AND is_available AND NOT is_sold_out AND name LIKE 'TEST BO%' ORDER BY id LIMIT 1;
  SELECT id INTO b FROM products WHERE is_active AND is_available AND NOT is_sold_out AND name LIKE 'TEST BO%' AND id<>a ORDER BY id LIMIT 1;
  SELECT id INTO c FROM products WHERE is_active AND is_available AND NOT is_sold_out AND name LIKE 'TEST BO%' AND id NOT IN(a,b) ORDER BY id LIMIT 1;
  IF a IS NULL OR b IS NULL OR c IS NULL THEN
    INSERT INTO inventory_items(name,item_type) VALUES('TEST RECOMMENDATIONS material','flor') RETURNING id INTO material;
    INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES(material,10,actor);
    INSERT INTO products(name,price) VALUES('TEST RECOMMENDATIONS A',10) RETURNING id INTO a;
    INSERT INTO products(name,price) VALUES('TEST RECOMMENDATIONS B',15) RETURNING id INTO b;
    INSERT INTO products(name,price) VALUES('TEST RECOMMENDATIONS C',20) RETURNING id INTO c;
    INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) SELECT id,material,1 FROM unnest(ARRAY[a,b,c]) AS p(id);
    UPDATE products SET is_active=true,is_available=true WHERE id IN(a,b,c);
  END IF;
  UPDATE products SET is_active=false WHERE id=c;
  FOREACH who IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_column_privilege(who,'product_recommendations','updated_by','SELECT') THEN RAISE EXCEPTION 'FAIL private actor exposed'; END IF;
    denied:=false;
    BEGIN
      EXECUTE format('SET LOCAL ROLE %I',who);
      PERFORM set_product_recommendations(a,ARRAY[b],actor);
    EXCEPTION WHEN insufficient_privilege THEN denied:=true;
    END;
    RESET ROLE;
    IF NOT denied THEN RAISE EXCEPTION 'FAIL private RPC %',who; END IF;
  END LOOP;
  PERFORM set_product_recommendations(a,ARRAY[b],actor);
  IF (SELECT updated_by FROM product_recommendations WHERE product_id=a) IS DISTINCT FROM actor THEN RAISE EXCEPTION 'FAIL actor'; END IF;
  denied:=false;
  BEGIN PERFORM set_product_recommendations(b,ARRAY[a],actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL cycle'; END IF;
  denied:=false;
  BEGIN PERFORM set_product_recommendations(a,ARRAY[b,b],actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL duplicate'; END IF;
  denied:=false;
  BEGIN PERFORM set_product_recommendations(a,ARRAY[a],actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL self'; END IF;
  denied:=false;
  BEGIN PERFORM set_product_recommendations(a,ARRAY[c],actor); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL inactive'; END IF;
  UPDATE products SET is_active=false WHERE id=b;
  SET LOCAL ROLE anon;
  IF EXISTS (SELECT 1 FROM product_recommendations WHERE product_id=a) THEN RAISE EXCEPTION 'FAIL inactive public projection'; END IF;
  RESET ROLE;
  PERFORM set_product_recommendations(a,ARRAY[]::uuid[],actor);
  IF EXISTS (SELECT 1 FROM product_recommendations WHERE product_id=a) THEN RAISE EXCEPTION 'FAIL remove'; END IF;
  IF has_function_privilege('anon','set_product_recommendations(uuid,uuid[],uuid)','EXECUTE')
    OR has_function_privilege('authenticated','set_product_recommendations(uuid,uuid[],uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','set_product_recommendations(uuid,uuid[],uuid)','EXECUTE') THEN RAISE EXCEPTION 'FAIL ACL'; END IF;
  RAISE NOTICE 'PASS recommendations: private RPC, actor, cycle, duplicate, self, inactive, public RLS, removal, ACL';
END $$;
ROLLBACK;
