-- Tarjetas clasificadas explícitamente en el inventario existente.
-- No modifica existencias, recetas ni pedidos anteriores. Pendiente de publicación.
BEGIN;
ALTER TABLE public.inventory_items ADD COLUMN is_dedication_card boolean NOT NULL DEFAULT false;
ALTER TABLE public.inventory_items ADD CONSTRAINT dedication_card_is_supply CHECK (NOT is_dedication_card OR item_type='insumo');
ALTER TABLE public.order_items ADD COLUMN dedications jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.order_items ADD CONSTRAINT dedications_array CHECK (jsonb_typeof(dedications)='array' AND jsonb_array_length(dedications)<=198);

CREATE FUNCTION public.product_dedication_card_count(p_product_id uuid, p_option_ids uuid[] DEFAULT '{}')
RETURNS numeric LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT coalesce(sum(r.quantity),0) FROM (
  SELECT inventory_item_id,quantity FROM product_inventory_requirements WHERE product_id=p_product_id
  UNION ALL
  SELECT r.inventory_item_id,r.quantity FROM customization_option_inventory_requirements r
   JOIN customization_options o ON o.id=r.customization_option_id
   WHERE o.product_id=p_product_id AND o.is_active AND o.id=ANY(p_option_ids)
 ) r JOIN inventory_items i ON i.id=r.inventory_item_id WHERE i.is_dedication_card;
$$;
REVOKE ALL ON FUNCTION public.product_dedication_card_count(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.product_dedication_card_count(uuid,uuid[]) TO service_role;

CREATE FUNCTION public.validate_order_dedications() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cards numeric; entry jsonb; options uuid[];
BEGIN
 IF NEW.dedications='[]'::jsonb AND nullif(btrim(NEW.message),'') IS NULL THEN RETURN NEW; END IF;
 SELECT coalesce(array_agg((x->>'id')::uuid),'{}'::uuid[]) INTO options
  FROM jsonb_array_elements(coalesce(NEW.personalization,'[]'::jsonb)) x;
 cards:=product_dedication_card_count(NEW.product_id,options)*NEW.quantity;
 IF cards<=0 OR cards<>trunc(cards) THEN
  RAISE EXCEPTION 'Este producto no incluye tarjeta de dedicatoria. Revisa tu personalización.';
 END IF;
 -- Compatibilidad con carritos anteriores de una sola tarjeta; nunca duplicar mensajes.
 IF nullif(btrim(NEW.message),'') IS NOT NULL THEN
  IF NEW.dedications<>'[]'::jsonb OR cards<>1 OR length(NEW.message)>250 THEN
   RAISE EXCEPTION 'Revisa la dedicatoria de cada tarjeta antes de continuar.';
  END IF;
  NEW.dedications:=jsonb_build_array(jsonb_build_object('message',NEW.message,'signature',''));
  NEW.message:=NULL;
 END IF;
 IF jsonb_typeof(NEW.dedications)<>'array' OR jsonb_array_length(NEW.dedications)<>cards OR cards>198 THEN
  RAISE EXCEPTION 'Revisa la dedicatoria de cada tarjeta antes de continuar.';
 END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(NEW.dedications) LOOP
  IF jsonb_typeof(entry)<>'object' OR jsonb_typeof(entry->'message') IS DISTINCT FROM 'string'
   OR jsonb_typeof(entry->'signature') IS DISTINCT FROM 'string'
   OR length(entry->>'message')>250 OR length(entry->>'signature')>60
   OR (entry-'message'-'signature')<>'{}'::jsonb THEN
   RAISE EXCEPTION 'La dedicatoria admite 250 caracteres y la firma 60.';
  END IF;
 END LOOP;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_order_dedications_before_insert BEFORE INSERT ON public.order_items
 FOR EACH ROW EXECUTE FUNCTION public.validate_order_dedications();
REVOKE ALL ON FUNCTION public.validate_order_dedications() FROM PUBLIC,anon,authenticated,service_role;

-- Las tarjetas son unidades completas, aunque otros materiales usen fracciones.
CREATE FUNCTION public.validate_dedication_recipe_units() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_TABLE_NAME='inventory_items' THEN
  IF NEW.is_dedication_card AND EXISTS(
   SELECT 1 FROM (
    SELECT quantity FROM product_inventory_requirements WHERE inventory_item_id=NEW.id
    UNION ALL
    SELECT quantity FROM customization_option_inventory_requirements WHERE inventory_item_id=NEW.id
   ) r WHERE quantity<>trunc(quantity)
  ) THEN RAISE EXCEPTION 'Las tarjetas de la receta deben usar cantidades enteras.'; END IF;
 ELSE
  IF NEW.quantity<>trunc(NEW.quantity) AND EXISTS(SELECT 1 FROM inventory_items WHERE id=NEW.inventory_item_id AND is_dedication_card)
  THEN RAISE EXCEPTION 'Las tarjetas de la receta deben usar cantidades enteras.'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER dedication_recipe_units BEFORE INSERT OR UPDATE ON public.product_inventory_requirements
 FOR EACH ROW EXECUTE FUNCTION public.validate_dedication_recipe_units();
CREATE TRIGGER dedication_option_units BEFORE INSERT OR UPDATE ON public.customization_option_inventory_requirements
 FOR EACH ROW EXECUTE FUNCTION public.validate_dedication_recipe_units();
CREATE TRIGGER dedication_classification_units BEFORE INSERT OR UPDATE OF is_dedication_card ON public.inventory_items
 FOR EACH ROW EXECUTE FUNCTION public.validate_dedication_recipe_units();
REVOKE ALL ON FUNCTION public.validate_dedication_recipe_units() FROM PUBLIC,anon,authenticated,service_role;

-- Cambios acotados al contrato y al snapshot; conservar locks, FIFO, reservas y pagos.
-- Abortamos si la definición instalada no coincide con los fragmentos auditados.
DO $$ DECLARE original text; modified text; needle text; replacement text;
BEGIN
 original:=pg_get_functiondef('public.create_order(text,text,text,jsonb,text,text,uuid)'::regprocedure);
 needle:=$part$)) line
   FROM jsonb_array_elements(p_items) x) lines;$part$;
 replacement:=$part$)) || CASE WHEN coalesce(x->'dedications','[]'::jsonb)<>'[]'::jsonb
    THEN jsonb_build_object('dedications',x->'dedications') ELSE '{}'::jsonb END line
   FROM jsonb_array_elements(p_items) x) lines;$part$;
 IF strpos(original,needle)=0 THEN RAISE EXCEPTION 'Contrato de idempotencia inesperado; no se modificó create_order.'; END IF;
 modified:=replace(original,needle,replacement);
 needle:=E'      message,\n      note';
 IF strpos(modified,needle)=0 THEN RAISE EXCEPTION 'Columnas de snapshot inesperadas.'; END IF;
 modified:=replace(modified,needle,E'      message,\n      dedications,\n      note');
 needle:=$part$v_item->>'message',
      v_item->>'note'$part$;
 IF strpos(modified,needle)=0 THEN RAISE EXCEPTION 'Valores de snapshot inesperados.'; END IF;
 modified:=replace(modified,needle,$part$v_item->>'message',
      coalesce(v_item->'dedications','[]'::jsonb),
      v_item->>'note'$part$);
 EXECUTE modified;
 original:=pg_get_functiondef('public.track_order(bigint,text)'::regprocedure);
 needle:=$part$'message', oi.message,$part$;
 IF strpos(original,needle)=0 THEN RAISE EXCEPTION 'Resumen de seguimiento inesperado.'; END IF;
 EXECUTE replace(original,needle,$part$'message', oi.message, 'dedications', oi.dedications,$part$);
END; $$;
COMMENT ON COLUMN public.inventory_items.is_dedication_card IS 'Clasificación explícita: habilita dedicatorias únicamente si este insumo forma parte de la receta elegida.';
COMMENT ON COLUMN public.order_items.dedications IS 'Snapshot ordenado por tarjeta de esta línea. No es prueba de pago y no añade consumo ni precio a la receta.';
COMMIT;
