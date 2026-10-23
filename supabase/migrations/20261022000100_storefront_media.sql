-- Optional public presentation assets only. Existing images and all commercial
-- data stay unchanged. Apply to LOCAL first; production requires owner approval.
BEGIN;
INSERT INTO public.system_settings (key, value, is_critical)
VALUES ('storefront_media', '{"logo":null,"about":null,"categories":{}}'::jsonb, false)
ON CONFLICT (key) DO NOTHING;

-- Called only by the authenticated admin HTTP handler through service_role.
-- Row locking prevents uploads to different categories from losing each other.
CREATE OR REPLACE FUNCTION public.set_storefront_media(p_kind text, p_category_id uuid, p_path text, p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE current_value jsonb; next_value jsonb;
BEGIN
  IF p_kind NOT IN ('logo','about','category') OR p_kind IS NULL
    OR p_path IS NULL OR p_path !~ ('^storefront/' || p_kind || '/[0-9a-f-]{36}\.webp$')
    OR p_actor IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_actor AND role = 'administrador' AND is_active)
  THEN RAISE EXCEPTION 'Invalid storefront media request'; END IF;
  IF p_kind = 'category' AND (p_category_id IS NULL OR NOT EXISTS (SELECT 1 FROM categories WHERE id = p_category_id))
  THEN RAISE EXCEPTION 'Category not found'; END IF;
  SELECT value INTO current_value FROM system_settings WHERE key = 'storefront_media' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Storefront media configuration missing'; END IF;
  next_value := CASE WHEN p_kind = 'category'
    THEN jsonb_set(current_value, '{categories}', coalesce(current_value->'categories','{}'::jsonb) || jsonb_build_object(p_category_id::text,p_path))
    ELSE jsonb_set(current_value, ARRAY[p_kind], to_jsonb(p_path)) END;
  UPDATE system_settings SET value=next_value, updated_by=p_actor, updated_at=now() WHERE key='storefront_media';
  RETURN next_value;
END; $$;
REVOKE ALL ON FUNCTION public.set_storefront_media(text,uuid,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_storefront_media(text,uuid,text,uuid) TO service_role;
COMMIT;
