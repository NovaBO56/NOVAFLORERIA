-- Optional commercial recommendations. No stock, orders or prices are changed.
BEGIN;
CREATE TABLE public.product_recommendations (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 3),
  updated_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, recommended_product_id),
  UNIQUE (product_id, sort_order),
  CHECK (product_id <> recommended_product_id)
);
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendations_public_read ON public.product_recommendations FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.is_active)
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=recommended_product_id AND p.is_active AND p.is_available AND NOT p.is_sold_out));
REVOKE ALL ON public.product_recommendations FROM PUBLIC, anon, authenticated;
GRANT SELECT (product_id,recommended_product_id,sort_order) ON public.product_recommendations TO anon, authenticated;
GRANT ALL ON public.product_recommendations TO service_role;

CREATE OR REPLACE FUNCTION public.set_product_recommendations(p_product uuid, p_recommendations uuid[], p_actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id=p_actor AND is_active AND role='administrador')
  THEN RAISE EXCEPTION 'Administrator required'; END IF;
  IF p_recommendations IS NULL OR cardinality(p_recommendations)>4
    OR cardinality(p_recommendations)<>(SELECT count(DISTINCT id) FROM unnest(p_recommendations) id)
    OR p_product=ANY(p_recommendations)
    OR NOT EXISTS (SELECT 1 FROM products WHERE id=p_product)
    OR EXISTS (SELECT 1 FROM unnest(p_recommendations) AS choices(id) WHERE NOT EXISTS
      (SELECT 1 FROM products p WHERE p.id=choices.id AND p.is_active AND p.is_available AND NOT p.is_sold_out))
  THEN RAISE EXCEPTION 'Invalid recommendations'; END IF;
  -- Serialize graph edits so concurrent A->B / B->A cannot introduce a cycle.
  PERFORM pg_advisory_xact_lock(20261022, 2);
  IF EXISTS (WITH RECURSIVE reachable(id) AS (
    SELECT unnest(p_recommendations)
    UNION
    SELECT r.recommended_product_id FROM product_recommendations r JOIN reachable x ON r.product_id=x.id
    WHERE r.product_id<>p_product
  ) SELECT 1 FROM reachable WHERE id=p_product)
  THEN RAISE EXCEPTION 'Recommendations would create a cycle'; END IF;
  DELETE FROM product_recommendations WHERE product_id=p_product;
  INSERT INTO product_recommendations(product_id,recommended_product_id,sort_order,updated_by)
    SELECT p_product,id,(ordinality-1)::integer,p_actor FROM unnest(p_recommendations) WITH ORDINALITY AS choices(id,ordinality);
END; $$;
REVOKE ALL ON FUNCTION public.set_product_recommendations(uuid,uuid[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_recommendations(uuid,uuid[],uuid) TO service_role;
COMMIT;
