-- LOCAL candidate: administrative scheduling and immutable future-item recipe snapshots.
-- No backfill of historical compositions, no stock/financial/state-machine changes.
BEGIN;
ALTER TABLE public.orders
 ADD COLUMN scheduled_for timestamptz,
 ADD COLUMN schedule_status text NOT NULL DEFAULT 'pending' CHECK(schedule_status IN('pending','proposed','confirmed')),
 ADD COLUMN schedule_client_confirmed boolean NOT NULL DEFAULT false,
 ADD COLUMN schedule_revision integer NOT NULL DEFAULT 0 CHECK(schedule_revision>=0),
 ADD COLUMN schedule_updated_by uuid REFERENCES public.profiles(id),
 ADD COLUMN schedule_updated_at timestamptz,
 ADD CONSTRAINT order_schedule_consistent CHECK (
   (scheduled_for IS NULL AND schedule_status='pending' AND NOT schedule_client_confirmed)
   OR (scheduled_for IS NOT NULL AND schedule_status IN('proposed','confirmed') AND schedule_client_confirmed=(schedule_status='confirmed'))
 );
ALTER TABLE public.order_items ADD COLUMN recipe_snapshot jsonb;

CREATE FUNCTION public.guard_order_schedule() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE local_time timestamp; hours public.business_hours%rowtype; actor uuid:=auth.uid();
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.scheduled_for IS NOT NULL OR NEW.schedule_status<>'pending' OR NEW.schedule_client_confirmed OR NEW.schedule_revision<>0
   OR NEW.schedule_updated_by IS NOT NULL OR NEW.schedule_updated_at IS NOT NULL THEN RAISE EXCEPTION 'Programa el horario después de registrar el pedido.'; END IF;
  RETURN NEW;
 END IF;
 IF actor IS NULL OR NOT public.is_employee_or_admin() THEN RAISE EXCEPTION 'Personal activo requerido.' USING ERRCODE='42501'; END IF;
 IF OLD.deleted_at IS NOT NULL OR OLD.order_type<>'online' OR OLD.status NOT IN('pendiente_pago','confirmado','en_preparacion','listo')
 OR (OLD.status='pendiente_pago' AND OLD.reserved_until IS NOT NULL AND OLD.reserved_until<=clock_timestamp())
 THEN RAISE EXCEPTION 'Este pedido ya no admite programación.'; END IF;
 IF NEW.schedule_revision<>OLD.schedule_revision+1 THEN RAISE EXCEPTION 'El horario cambió. Actualiza el pedido.' USING ERRCODE='40001'; END IF;
 IF NEW.scheduled_for IS NOT NULL THEN
  IF NOT isfinite(NEW.scheduled_for) OR NEW.scheduled_for<clock_timestamp()-interval '5 minutes' OR NEW.scheduled_for>clock_timestamp()+interval '180 days'
  THEN RAISE EXCEPTION 'Elige un horario futuro dentro de los próximos 180 días.'; END IF;
  local_time:=NEW.scheduled_for AT TIME ZONE 'America/La_Paz';
  SELECT * INTO hours FROM business_hours WHERE day_of_week=extract(dow FROM local_time)::integer;
  IF NOT FOUND OR hours.is_closed OR hours.opens_at IS NULL OR hours.closes_at IS NULL
    OR local_time::time<hours.opens_at OR local_time::time>hours.closes_at
  THEN RAISE EXCEPTION 'El horario debe estar dentro de la atención configurada para ese día.'; END IF;
 END IF;
 NEW.schedule_updated_by:=actor; NEW.schedule_updated_at:=clock_timestamp();
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_order_schedule BEFORE UPDATE OF scheduled_for,schedule_status,schedule_client_confirmed,schedule_revision,schedule_updated_by,schedule_updated_at
 ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_schedule();
CREATE TRIGGER guard_initial_order_schedule BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_schedule();

CREATE FUNCTION public.set_order_schedule(p_order uuid,p_when timestamptz,p_status text,p_revision integer,p_client_confirmed boolean)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE item public.orders%rowtype;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_employee_or_admin() THEN RAISE EXCEPTION 'Personal activo requerido.' USING ERRCODE='42501'; END IF;
 SELECT * INTO item FROM orders WHERE id=p_order AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'El pedido no existe.' USING ERRCODE='P0002'; END IF;
 IF p_revision IS DISTINCT FROM item.schedule_revision THEN RAISE EXCEPTION 'El horario cambió. Actualiza el pedido.' USING ERRCODE='40001'; END IF;
 IF p_status IS NULL OR p_status NOT IN('pending','proposed','confirmed') OR p_client_confirmed IS NULL
 OR (p_status='confirmed' AND NOT p_client_confirmed) OR (p_status<>'confirmed' AND p_client_confirmed)
 OR (p_status='pending') IS DISTINCT FROM (p_when IS NULL)
 THEN RAISE EXCEPTION 'Indica una propuesta o una confirmación explícita con el cliente.'; END IF;
 UPDATE orders SET scheduled_for=p_when,schedule_status=p_status,schedule_client_confirmed=p_client_confirmed,
  schedule_revision=item.schedule_revision+1 WHERE id=p_order;
 RETURN item.schedule_revision+1;
END; $$;

CREATE FUNCTION public.capture_order_item_recipe() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.product_id IS NULL THEN NEW.recipe_snapshot:=NULL; RETURN NEW; END IF;
 -- The sale RPC already serializes recipe edits. Capture what exists NOW;
 -- never infer this JSON for old rows, or use it to change inventory.
 NEW.recipe_snapshot:=jsonb_build_object('version',1,'captured_at',clock_timestamp(),'basis','recipe_at_order_item_creation',
 'materials',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',i.name,'unit',i.unit,'item_type',i.item_type,'quantity_per_unit',r.quantity) ORDER BY i.name,i.id),'[]'::jsonb)
 FROM (SELECT inventory_item_id,sum(quantity) quantity FROM (
  SELECT inventory_item_id,quantity FROM product_inventory_requirements WHERE product_id=NEW.product_id
  UNION ALL
  SELECT r.inventory_item_id,r.quantity FROM customization_option_inventory_requirements r
  JOIN customization_options o ON o.id=r.customization_option_id AND o.product_id=NEW.product_id
  WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.personalization,'[]'::jsonb)) x WHERE x->>'id'=o.id::text)
 ) needs GROUP BY inventory_item_id) r JOIN inventory_items i ON i.id=r.inventory_item_id),
 'included_products',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',p.name,'quantity_per_unit',c.quantity) ORDER BY p.name,p.id),'[]'::jsonb)
 FROM product_components c JOIN products p ON p.id=c.component_product_id WHERE c.parent_product_id=NEW.product_id));
 RETURN NEW;
END; $$;
CREATE TRIGGER capture_order_item_recipe BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.capture_order_item_recipe();
CREATE FUNCTION public.protect_order_item_recipe_snapshot() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.recipe_snapshot IS DISTINCT FROM OLD.recipe_snapshot THEN RAISE EXCEPTION 'La composición histórica no se puede modificar.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_order_item_recipe_snapshot BEFORE UPDATE OF recipe_snapshot ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.protect_order_item_recipe_snapshot();

REVOKE ALL ON FUNCTION public.guard_order_schedule(),public.capture_order_item_recipe(),public.protect_order_item_recipe_snapshot() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_order_schedule(uuid,timestamptz,text,integer,boolean) TO authenticated,service_role;
-- Existing orders/payments audit_sensitive_change triggers record scheduling and
-- state changes transactionally. No duplicate audit table or synthetic events.
COMMIT;
