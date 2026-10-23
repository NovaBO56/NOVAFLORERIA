-- LOCAL only. All fixture writes are rolled back; never run against production.
BEGIN;
DO $$
DECLARE actor uuid; category uuid; result jsonb; denied boolean; candidate text;
BEGIN
  IF has_function_privilege('anon','public.set_storefront_media(text,uuid,text,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.set_storefront_media(text,uuid,text,uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.set_storefront_media(text,uuid,text,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'FAIL: media RPC ACL'; END IF;
  SELECT id INTO actor FROM public.profiles WHERE role='administrador' AND is_active LIMIT 1;
  SELECT id INTO category FROM public.categories LIMIT 1;
  IF actor IS NULL OR category IS NULL THEN RAISE EXCEPTION 'Missing existing LOCAL admin/category fixture'; END IF;
  FOREACH candidate IN ARRAY ARRAY['anon','authenticated'] LOOP
    denied := false;
    BEGIN
      EXECUTE format('SET LOCAL ROLE %I',candidate);
      PERFORM public.set_storefront_media('logo',null,'storefront/logo/550e8400-e29b-41d4-a716-446655440000.webp',actor);
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    RESET ROLE;
    IF NOT denied THEN RAISE EXCEPTION 'FAIL: role % executed private RPC',candidate; END IF;
  END LOOP;
  result := public.set_storefront_media('logo',null,'storefront/logo/550e8400-e29b-41d4-a716-446655440000.webp',actor);
  result := public.set_storefront_media('category',category,'storefront/category/550e8400-e29b-41d4-a716-446655440000.webp',actor);
  IF result->>'logo' IS DISTINCT FROM 'storefront/logo/550e8400-e29b-41d4-a716-446655440000.webp'
    OR result->'categories'->>category::text IS DISTINCT FROM 'storefront/category/550e8400-e29b-41d4-a716-446655440000.webp'
  THEN RAISE EXCEPTION 'FAIL: logo/category update lost'; END IF;
  IF (SELECT updated_by FROM public.system_settings WHERE key='storefront_media') IS DISTINCT FROM actor THEN RAISE EXCEPTION 'FAIL: actor audit'; END IF;
  denied := false;
  BEGIN PERFORM public.set_storefront_media('logo',null,'../private/file.webp',actor); EXCEPTION WHEN raise_exception THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL: traversal accepted'; END IF;
  RAISE NOTICE 'PASS: private RPC ACL, actual anon/auth denial, merged media settings, actor, invalid path';
END $$;
ROLLBACK;
