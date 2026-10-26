-- Area 01: optional global recommendations. No catalog, price or inventory backfill.
-- Existing individual rows remain untouched and resolve as custom preferences.
BEGIN;
CREATE TABLE public.product_recommendation_settings (
  key text PRIMARY KEY DEFAULT 'global' CHECK (key='global'),
  enabled boolean NOT NULL DEFAULT false,
  scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('all','categories')),
  product_ids uuid[] NOT NULL DEFAULT '{}',
  category_ids uuid[] NOT NULL DEFAULT '{}',
  excluded_category_ids uuid[] NOT NULL DEFAULT '{}',
  excluded_product_ids uuid[] NOT NULL DEFAULT '{}',
  revision integer NOT NULL DEFAULT 0 CHECK (revision>=0),
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(product_ids)<=20),
  CHECK (cardinality(category_ids)<=100 AND cardinality(excluded_category_ids)<=100),
  CHECK (cardinality(excluded_product_ids)<=200)
);
INSERT INTO public.product_recommendation_settings(key) VALUES ('global');
CREATE TABLE public.product_recommendation_preferences (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('global','custom','off')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  updated_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_recommendation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendation_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_recommendation_settings,public.product_recommendation_preferences FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.product_recommendation_settings,public.product_recommendation_preferences TO service_role;
CREATE TRIGGER audit_recommendation_settings AFTER INSERT OR UPDATE OR DELETE ON public.product_recommendation_settings FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();
CREATE TRIGGER audit_recommendation_preferences AFTER INSERT OR UPDATE OR DELETE ON public.product_recommendation_preferences FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();
CREATE TRIGGER audit_product_recommendations AFTER INSERT OR UPDATE OR DELETE ON public.product_recommendations FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

-- Keep the existing custom contract. Preserve old inactive references, but never
-- allow a newly selected unavailable product. The stock calculation is reused.
CREATE OR REPLACE FUNCTION public.set_product_recommendations(p_product uuid,p_recommendations uuid[],p_actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND is_active AND role='administrador') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM pg_advisory_xact_lock(20261022,2);
 IF p_recommendations IS NULL OR cardinality(p_recommendations)>4 OR array_position(p_recommendations,NULL) IS NOT NULL
 OR cardinality(p_recommendations)<>(SELECT count(DISTINCT id) FROM unnest(p_recommendations) id)
 OR p_product=ANY(p_recommendations) OR NOT EXISTS(SELECT 1 FROM products WHERE id=p_product)
 OR EXISTS(SELECT 1 FROM unnest(p_recommendations) AS refs(id) WHERE NOT EXISTS(SELECT 1 FROM products p WHERE p.id=refs.id))
 OR EXISTS(SELECT 1 FROM public.get_product_availability(coalesce((SELECT jsonb_agg(jsonb_build_object('product_id',refs.id)) FROM unnest(p_recommendations) AS refs(id) WHERE NOT EXISTS(SELECT 1 FROM product_recommendations r WHERE r.product_id=p_product AND r.recommended_product_id=refs.id)),'[]'::jsonb),false) a WHERE NOT a.is_available)
 THEN RAISE EXCEPTION 'Invalid recommendations'; END IF;
 IF EXISTS(WITH RECURSIVE reachable(id) AS (SELECT unnest(p_recommendations) UNION SELECT r.recommended_product_id FROM product_recommendations r JOIN reachable x ON r.product_id=x.id WHERE r.product_id<>p_product) SELECT 1 FROM reachable WHERE id=p_product) THEN RAISE EXCEPTION 'Recommendations would create a cycle'; END IF;
 PERFORM set_config('nova.audit_actor',p_actor::text,true);
 DELETE FROM product_recommendations WHERE product_id=p_product;
 INSERT INTO product_recommendations(product_id,recommended_product_id,sort_order,updated_by) SELECT p_product,id,(ordinality-1)::integer,p_actor FROM unnest(p_recommendations) WITH ORDINALITY AS refs(id,ordinality);
END; $$;

CREATE FUNCTION public.save_global_product_recommendations(p_enabled boolean,p_scope text,p_products uuid[],p_categories uuid[],p_excluded_categories uuid[],p_excluded_products uuid[],p_revision integer,p_actor uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE current_revision integer; old_products uuid[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND is_active AND role='administrador') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM pg_advisory_xact_lock(20261022,2);
 SELECT revision,product_ids INTO current_revision,old_products FROM product_recommendation_settings WHERE key='global' FOR UPDATE;
 IF p_revision IS DISTINCT FROM current_revision THEN RAISE EXCEPTION 'Configuration changed' USING ERRCODE='40001'; END IF;
 IF p_enabled IS NULL OR p_scope IS NULL OR p_scope NOT IN ('all','categories') OR p_products IS NULL OR p_categories IS NULL OR p_excluded_categories IS NULL OR p_excluded_products IS NULL
 OR cardinality(p_products)>20 OR cardinality(p_categories)>100 OR cardinality(p_excluded_categories)>100 OR cardinality(p_excluded_products)>200
 OR (p_enabled AND p_scope='categories' AND cardinality(p_categories)=0) THEN RAISE EXCEPTION 'Invalid global configuration'; END IF;
 IF array_position(p_products,NULL) IS NOT NULL OR cardinality(p_products)<>(SELECT count(DISTINCT id) FROM unnest(p_products) id) THEN RAISE EXCEPTION 'Duplicate or null recommendations'; END IF;
 -- Validate each array separately: array lengths need not be equal.
 IF array_position(p_categories,NULL) IS NOT NULL OR array_position(p_excluded_categories,NULL) IS NOT NULL OR array_position(p_excluded_products,NULL) IS NOT NULL
 OR cardinality(p_categories)<>(SELECT count(DISTINCT id) FROM unnest(p_categories) id)
 OR cardinality(p_excluded_categories)<>(SELECT count(DISTINCT id) FROM unnest(p_excluded_categories) id)
 OR cardinality(p_excluded_products)<>(SELECT count(DISTINCT id) FROM unnest(p_excluded_products) id)
 OR EXISTS(SELECT 1 FROM unnest(p_products||p_excluded_products) AS refs(id) WHERE NOT EXISTS(SELECT 1 FROM products p WHERE p.id=refs.id))
 OR EXISTS(SELECT 1 FROM unnest(p_categories||p_excluded_categories) AS refs(id) WHERE NOT EXISTS(SELECT 1 FROM categories c WHERE c.id=refs.id))
 OR EXISTS(SELECT 1 FROM products p WHERE p.id=ANY(p_products) AND NOT(p.id=ANY(old_products)) AND (NOT p.is_active OR NOT p.is_available OR p.is_sold_out))
 THEN RAISE EXCEPTION 'Invalid global references'; END IF;
 IF EXISTS(SELECT 1 FROM public.get_product_availability(coalesce((SELECT jsonb_agg(jsonb_build_object('product_id',refs.id)) FROM unnest(p_products) AS refs(id) WHERE NOT(refs.id=ANY(old_products))),'[]'::jsonb),false) a WHERE NOT a.is_available) THEN RAISE EXCEPTION 'New recommendation unavailable'; END IF;
 PERFORM set_config('nova.audit_actor',p_actor::text,true);
 UPDATE product_recommendation_settings SET enabled=p_enabled,scope=p_scope,product_ids=p_products,category_ids=p_categories,excluded_category_ids=p_excluded_categories,excluded_product_ids=p_excluded_products,revision=revision+1,updated_by=p_actor,updated_at=now() WHERE key='global' RETURNING revision INTO current_revision;
 RETURN current_revision;
END; $$;

CREATE FUNCTION public.save_product_recommendation_preferences(p_product uuid,p_mode text,p_recommendations uuid[],p_revision integer,p_actor uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE current_revision integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND is_active AND role='administrador') THEN RAISE EXCEPTION 'Administrator required'; END IF;
 PERFORM pg_advisory_xact_lock(20261022,2);
 IF NOT EXISTS(SELECT 1 FROM products WHERE id=p_product) OR p_mode IS NULL OR p_mode NOT IN ('global','custom','off') THEN RAISE EXCEPTION 'Invalid preference'; END IF;
 SELECT revision INTO current_revision FROM product_recommendation_preferences WHERE product_id=p_product FOR UPDATE;
 IF p_revision IS DISTINCT FROM coalesce(current_revision,0) THEN RAISE EXCEPTION 'Configuration changed' USING ERRCODE='40001'; END IF;
 PERFORM set_config('nova.audit_actor',p_actor::text,true);
 IF p_mode='custom' THEN
   -- Reuse the established max-four, graph-cycle and product validation.
   PERFORM public.set_product_recommendations(p_product,p_recommendations,p_actor);
 ELSIF p_recommendations IS NOT NULL THEN RAISE EXCEPTION 'Unexpected custom list'; END IF;
 INSERT INTO product_recommendation_preferences(product_id,mode,revision,updated_by) VALUES(p_product,p_mode,coalesce(current_revision,0)+1,p_actor)
 ON CONFLICT(product_id) DO UPDATE SET mode=excluded.mode,revision=excluded.revision,updated_by=excluded.updated_by,updated_at=now();
 RETURN coalesce(current_revision,0)+1;
END; $$;

CREATE FUNCTION public.resolve_product_recommendation_ids(p_product uuid)
RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE selected_mode text; config product_recommendation_settings%ROWTYPE; category uuid; result uuid[];
BEGIN
 SELECT category_id INTO category FROM products WHERE id=p_product;
 IF NOT FOUND THEN RETURN '{}'; END IF;
 SELECT mode INTO selected_mode FROM product_recommendation_preferences WHERE product_id=p_product;
 IF selected_mode IS NULL THEN selected_mode:=CASE WHEN EXISTS(SELECT 1 FROM product_recommendations WHERE product_id=p_product) THEN 'custom' ELSE 'global' END; END IF;
 IF selected_mode='off' THEN RETURN '{}'; END IF;
 IF selected_mode='custom' THEN
   SELECT coalesce(array_agg(recommended_product_id ORDER BY sort_order),'{}') INTO result FROM product_recommendations WHERE product_id=p_product;
   RETURN result;
 END IF;
 SELECT * INTO config FROM product_recommendation_settings WHERE key='global';
 IF NOT config.enabled OR p_product=ANY(config.excluded_product_ids) OR coalesce(category=ANY(config.excluded_category_ids),false)
 OR (config.scope='categories' AND NOT coalesce(category=ANY(config.category_ids),false)) THEN RETURN '{}'; END IF;
 SELECT coalesce(array_agg(id ORDER BY ordinality),'{}') INTO result FROM unnest(config.product_ids) WITH ORDINALITY AS candidates(id,ordinality) WHERE id<>p_product;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.save_global_product_recommendations(boolean,text,uuid[],uuid[],uuid[],uuid[],integer,uuid),public.save_product_recommendation_preferences(uuid,text,uuid[],integer,uuid),public.resolve_product_recommendation_ids(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_global_product_recommendations(boolean,text,uuid[],uuid[],uuid[],uuid[],integer,uuid),public.save_product_recommendation_preferences(uuid,text,uuid[],integer,uuid),public.resolve_product_recommendation_ids(uuid) TO service_role;

-- Read-only wrapper around the authoritative recipe check and availability RPC.
CREATE FUNCTION public.get_product_publication_diagnostics(p_product uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item products%ROWTYPE; recipe_ok boolean:=true; availability record;
BEGIN
 SELECT * INTO item FROM products WHERE id=p_product;
 IF NOT FOUND THEN RETURN NULL; END IF;
 BEGIN PERFORM public.assert_product_recipe(p_product); EXCEPTION WHEN raise_exception THEN recipe_ok:=false; END;
 SELECT * INTO availability FROM public.get_product_availability(jsonb_build_array(jsonb_build_object('product_id',p_product,'quantity',1)),false);
 RETURN jsonb_build_object('recipe_valid',recipe_ok,'photos',(SELECT count(*) FROM product_images WHERE product_id=p_product),
 'materials',(SELECT count(*) FROM product_inventory_requirements WHERE product_id=p_product),'included_products',(SELECT count(*) FROM product_components WHERE parent_product_id=p_product),
 'is_active',item.is_active,'is_available',item.is_available,'is_sold_out',item.is_sold_out,'available_quantity',availability.available_quantity,'sellable',availability.is_available);
END; $$;
REVOKE ALL ON FUNCTION public.get_product_publication_diagnostics(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_publication_diagnostics(uuid) TO service_role;
COMMIT;
