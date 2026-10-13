-- Revisión LOCAL: no aplicar en producción sin aprobación.
-- Sin receta no hay exención implícita. No se inventan ingredientes/cantidades.
BEGIN;

ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE public.products ALTER COLUMN is_available SET DEFAULT false;

CREATE FUNCTION public.assert_product_recipe(p_product uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM product_inventory_requirements WHERE product_id=p_product)
 OR EXISTS (SELECT 1 FROM product_inventory_requirements r
   WHERE r.product_id=p_product AND (r.quantity<=0 OR r.quantity::text IN ('NaN','Infinity','-Infinity'))) THEN
  RAISE EXCEPTION 'Este producto no puede ponerse a la venta porque todavía no tiene configurado un consumo de inventario válido. Revisa su receta e insumos.';
 END IF;
END; $$;

-- Bloqueos transaccionales ordenados: la receta no puede cambiar entre cálculo y consumo/reserva.
CREATE FUNCTION public.lock_sale_recipes(p_items jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE product uuid;
BEGIN
 IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN RETURN; END IF;
 FOR product IN SELECT DISTINCT (item->>'product_id')::uuid FROM jsonb_array_elements(p_items) item ORDER BY 1 LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended('product_recipe:'||product::text,0));
 END LOOP;
END; $$;

CREATE FUNCTION public.guard_product_recipe() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE product uuid;
BEGIN
 IF TG_TABLE_NAME='products' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('product_recipe:'||NEW.id::text,0));
  IF NEW.is_active THEN PERFORM assert_product_recipe(NEW.id); END IF;
  RETURN NEW;
 ELSIF TG_TABLE_NAME='order_items' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('product_recipe:'||NEW.product_id::text,0));
  PERFORM assert_product_recipe(NEW.product_id);
  RETURN NEW;
 ELSE
  -- Recetas pueden editarse con el producto inactivo; nunca dejar uno activo sin receta válida.
  FOR product IN SELECT DISTINCT value FROM unnest(ARRAY[
   CASE WHEN TG_OP<>'INSERT' THEN OLD.product_id END,
   CASE WHEN TG_OP<>'DELETE' THEN NEW.product_id END]) value WHERE value IS NOT NULL ORDER BY 1 LOOP
   PERFORM pg_advisory_xact_lock(hashtextextended('product_recipe:'||product::text,0));
   IF EXISTS(SELECT 1 FROM products WHERE id=product AND is_active) THEN PERFORM assert_product_recipe(product); END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
END; $$;

-- Cuarentena de configuración incompleta: conservar imagen, precio, historia y receta existente.
UPDATE public.products p SET is_active=false,is_available=false
WHERE (p.is_active OR p.is_available) AND (
 NOT EXISTS(SELECT 1 FROM public.product_inventory_requirements r WHERE r.product_id=p.id)
 OR EXISTS(SELECT 1 FROM public.product_inventory_requirements r
 WHERE r.product_id=p.id AND (r.quantity<=0 OR r.quantity::text IN ('NaN','Infinity','-Infinity'))));
CREATE TRIGGER guard_product_recipe BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_recipe();
CREATE TRIGGER guard_order_item_recipe BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.guard_product_recipe();
CREATE TRIGGER guard_recipe_change AFTER INSERT OR UPDATE OR DELETE ON public.product_inventory_requirements FOR EACH ROW EXECUTE FUNCTION public.guard_product_recipe();
-- La baja de un insumo conserva el significado administrativo existente: el FK
-- mantiene el insumo y sus lotes; no equivale a borrar ni eximir su consumo.

ALTER TABLE public.orders ADD COLUMN inventory_review_required boolean NOT NULL DEFAULT false;
-- Señalar casos anteriores incompletos, incluidos pedidos con reservas parciales.
-- Una receta añadida después no prueba cuál debía ser su reserva original.
UPDATE public.orders o SET inventory_review_required=true
WHERE o.status='pendiente_pago' AND EXISTS(
 SELECT 1 FROM public.order_items item WHERE item.order_id=o.id AND (
 NOT EXISTS(SELECT 1 FROM public.product_inventory_requirements r WHERE r.product_id=item.product_id)
 OR EXISTS(SELECT 1 FROM public.product_inventory_requirements r WHERE r.product_id=item.product_id AND
 (r.quantity<=0 OR r.quantity::text IN ('NaN','Infinity','-Infinity')))));
CREATE FUNCTION public.protect_inventory_review_marker() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.inventory_review_required IS DISTINCT FROM OLD.inventory_review_required THEN
  RAISE EXCEPTION 'La revisión de inventario de un pedido antiguo no puede omitirse modificando su indicador.';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_inventory_review_marker BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.protect_inventory_review_marker();
REVOKE ALL ON FUNCTION public.protect_inventory_review_marker() FROM PUBLIC,anon,authenticated,service_role;

-- Conservar íntegros los contratos probados de pedido/venta, añadiendo solo el bloqueo inicial.
-- Fallar explícitamente si la definición instalada no coincide con la cadena oficial esperada.
DO $$ DECLARE signature regprocedure; definition text; changed text;
BEGIN
 FOREACH signature IN ARRAY ARRAY[
 'public.create_order(text,text,text,jsonb,text,text,uuid)'::regprocedure,
 'public.create_physical_sale(jsonb,uuid,uuid,numeric,text,text)'::regprocedure] LOOP
  definition:=pg_get_functiondef(signature);
  IF signature='public.create_physical_sale(jsonb,uuid,uuid,numeric,text,text)'::regprocedure THEN
   -- La venta física comprueba identidad/rol y formato antes de tomar bloqueos de recetas.
   changed:=regexp_replace(definition,E'\n  for v_item in select \\* from jsonb_array_elements\\(p_items\\)\n  loop',E'\n  perform public.lock_sale_recipes(p_items);\n  for v_item in select * from jsonb_array_elements(p_items)\n  loop','i');
  ELSE
   changed:=regexp_replace(definition,E'\nbegin\n',E'\nbegin\n  perform public.lock_sale_recipes(p_items);\n','i');
  END IF;
  IF changed=definition THEN RAISE EXCEPTION 'No se encontró el punto de inserción en %',signature; END IF;
  EXECUTE changed;
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.assert_product_recipe(uuid), public.lock_sale_recipes(jsonb), public.guard_product_recipe() FROM PUBLIC,anon,authenticated,service_role;

-- No confirmar un pedido anterior sin reserva de consumo: exige revisión administrativa,
-- no inventa receta retrospectiva ni stock. Los retries confirmados siguen rechazándose antes del helper.
DO $$ DECLARE definition text; changed text;
BEGIN
 definition:=pg_get_functiondef('public.consume_order_reservations(uuid,uuid)'::regprocedure);
 changed:=regexp_replace(definition,E'\nBEGIN\n',E'\nBEGIN\n IF EXISTS(SELECT 1 FROM public.orders WHERE id=p_order_id AND inventory_review_required) THEN RAISE EXCEPTION ''Este pedido antiguo requiere revisión de inventario: su receta estaba incompleta. No se puede confirmar sin revisar su reserva original.''; END IF;\n IF NOT EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=p_order_id) THEN RAISE EXCEPTION ''El pedido no tiene una reserva de consumo de inventario. Revisa la configuración antes de confirmar.''; END IF;\n','i');
 IF changed=definition THEN RAISE EXCEPTION 'No se encontró guardia de consumo'; END IF;
 EXECUTE changed;
END; $$;

ALTER TABLE public.sale_returns DROP CONSTRAINT sale_returns_type_check;
ALTER TABLE public.sale_returns DROP CONSTRAINT sale_returns_amount_check;
ALTER TABLE public.sale_returns ADD CONSTRAINT sale_returns_type_check CHECK(type IN ('devolucion','reintegro','retorno_fisico'));
ALTER TABLE public.sale_returns ADD CONSTRAINT sale_returns_amount_check CHECK(
 amount::text NOT IN ('NaN','Infinity','-Infinity') AND ((type='retorno_fisico' AND amount=0) OR (type<>'retorno_fisico' AND amount>0)));
ALTER TABLE public.sale_returns ADD COLUMN idempotency_key uuid;
CREATE UNIQUE INDEX sale_returns_idempotency ON public.sale_returns(order_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
-- Registros históricos permanecen intactos (sin clave retrospectiva ficticia).

CREATE FUNCTION public.create_sale_return(p_order_id uuid,p_type text,p_amount numeric,p_reason text,p_idempotency_key uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); sale public.orders%rowtype; existing public.sale_returns%rowtype;
 returned numeric; return_id uuid; movement record; sale_session uuid; payment_method text;
 cash_session uuid; register_id uuid;
BEGIN
 IF actor IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Solo un administrador activo puede registrar una devolución o reintegro.'; END IF;
 IF p_idempotency_key IS NULL THEN RAISE EXCEPTION 'La clave de reintento es obligatoria.'; END IF;
 IF p_type IS NULL OR p_type NOT IN ('devolucion','reintegro','retorno_fisico') THEN RAISE EXCEPTION 'Tipo de devolución no válido.'; END IF;
 IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<>round(p_amount,2)
 OR p_amount>9999999999.99 OR (p_type='retorno_fisico' AND p_amount<>0) OR (p_type<>'retorno_fisico' AND p_amount<=0) THEN
  RAISE EXCEPTION 'El monto no es válido para esta operación.';
 END IF;
 IF nullif(btrim(p_reason),'') IS NULL OR length(p_reason)>500 THEN RAISE EXCEPTION 'El motivo es obligatorio y debe tener hasta 500 caracteres.'; END IF;
 SELECT * INTO sale FROM orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'El pedido no existe.'; END IF;
 SELECT * INTO existing FROM sale_returns WHERE order_id=p_order_id AND idempotency_key=p_idempotency_key;
 IF FOUND THEN
  IF existing.type IS DISTINCT FROM p_type OR existing.amount IS DISTINCT FROM p_amount OR existing.reason IS DISTINCT FROM btrim(p_reason) OR existing.created_by IS DISTINCT FROM actor THEN
   RAISE EXCEPTION 'La clave de reintento ya pertenece a otra operación.';
  END IF;
  RETURN existing.id;
 END IF;
 -- Cancelar un pedido pagado ya revierte su inventario, pero no devuelve dinero.
 -- En ese caso solo se admite el reintegro monetario explícito y auditable.
 IF sale.status='cancelado' THEN
  IF p_type<>'reintegro' OR NOT EXISTS(SELECT 1 FROM payments WHERE order_id=p_order_id AND status='confirmado') THEN
   RAISE EXCEPTION 'Un pedido cancelado solo admite reintegro monetario si tiene un pago confirmado; su inventario no se devuelve otra vez.';
  END IF;
 ELSIF sale.status<>'finalizado' THEN RAISE EXCEPTION 'Solo se puede registrar una devolución sobre un pedido finalizado o un reintegro sobre uno cancelado y pagado.'; END IF;
 SELECT coalesce(sum(amount),0) INTO returned FROM sale_returns WHERE order_id=p_order_id;
 IF returned+p_amount>sale.total THEN RAISE EXCEPTION 'El reintegro supera el importe pendiente de devolver.'; END IF;
 IF p_type IN ('devolucion','retorno_fisico') AND EXISTS(SELECT 1 FROM sale_returns WHERE order_id=p_order_id AND type IN ('devolucion','retorno_fisico')) THEN
  RAISE EXCEPTION 'El inventario de este pedido ya fue devuelto; no se puede repetir.';
 END IF;
 IF p_amount>0 THEN
  SELECT cash_session_id,cm.payment_method INTO sale_session,payment_method FROM cash_movements cm
  WHERE order_id=p_order_id AND movement_type='venta' ORDER BY created_at,id LIMIT 1;
  IF sale_session IS NOT NULL THEN
   SELECT cash_register_id INTO register_id FROM cash_sessions WHERE id=sale_session;
   SELECT id INTO cash_session FROM cash_sessions WHERE cash_register_id=register_id AND status='abierta' FOR UPDATE;
   IF cash_session IS NULL THEN RAISE EXCEPTION 'Abre la caja original para registrar el reintegro de esta venta física.'; END IF;
  END IF;
 END IF;
 IF p_type IN ('devolucion','retorno_fisico') THEN
  PERFORM id FROM payments WHERE order_id=p_order_id ORDER BY id FOR UPDATE;
  PERFORM id FROM inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id FOR UPDATE;
  PERFORM i.id FROM inventory_items i WHERE i.id IN (SELECT inventory_item_id FROM inventory_movements WHERE reference_type='order' AND reference_id=p_order_id) ORDER BY i.id FOR UPDATE;
  PERFORM l.id FROM inventory_lots l WHERE l.id IN (SELECT lot_id FROM inventory_movements WHERE reference_type='order' AND reference_id=p_order_id) ORDER BY l.inventory_item_id,l.received_at,l.created_at,l.id FOR UPDATE;
  FOR movement IN SELECT * FROM inventory_movements WHERE reference_type='order' AND reference_id=p_order_id AND movement_type='salida' LOOP
   UPDATE inventory_lots SET remaining_quantity=remaining_quantity+movement.quantity WHERE id=movement.lot_id;
   UPDATE inventory_items SET current_stock=current_stock+movement.quantity,updated_at=now() WHERE id=movement.inventory_item_id;
   INSERT INTO inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,reason,created_by)
   VALUES(movement.inventory_item_id,movement.lot_id,'devolucion',movement.quantity,'order',p_order_id,btrim(p_reason),actor);
  END LOOP;
 END IF;
 INSERT INTO sale_returns(order_id,type,amount,reason,created_by,idempotency_key)
 VALUES(p_order_id,p_type,p_amount,btrim(p_reason),actor,p_idempotency_key) RETURNING id INTO return_id;
 IF cash_session IS NOT NULL THEN
  INSERT INTO cash_movements(cash_session_id,movement_type,payment_method,amount,order_id,reason,created_by)
  VALUES(cash_session,'devolucion',payment_method,p_amount,p_order_id,btrim(p_reason),actor);
 END IF;
 RETURN return_id;
END; $$;
-- Adaptador para la API anterior durante el despliegue. La misma intención reutiliza
-- una clave determinista; no vuelve a ejecutar la lógica antigua sin idempotencia.
-- El frontend nuevo usa exclusivamente la firma de cinco argumentos.
CREATE OR REPLACE FUNCTION public.create_sale_return(p_order_id uuid,p_type text,p_amount numeric,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 RETURN public.create_sale_return(p_order_id,p_type,p_amount,p_reason,
  md5(p_order_id::text||'|'||p_type||'|'||round(p_amount,2)::text||'|'||coalesce(btrim(p_reason),'')||'|'||coalesce(auth.uid()::text,''))::uuid);
END; $$;
REVOKE ALL ON FUNCTION public.create_sale_return(uuid,text,numeric,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_sale_return(uuid,text,numeric,text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_sale_return(uuid,text,numeric,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_sale_return(uuid,text,numeric,text,uuid) TO authenticated;

-- Fuente contable común: ventas reconocidas al confirmar; reintegros en su fecha real.
-- Retorno físico sin dinero no es una partida financiera. Venta original nunca se reescribe.
CREATE VIEW public.sales_ledger WITH(security_invoker=true) AS
 SELECT 'sale'::text AS kind,o.id AS event_id,o.id AS order_id,o.order_number,o.order_type,o.status AS order_status,c.name AS customer_name,o.total AS original_total,
 o.total AS amount,coalesce(p.confirmed_at,o.created_at) AS occurred_at,p.method AS payment_method,
 p.confirmed_by AS actor_id,pr.full_name AS actor_name,NULL::text AS return_type,NULL::text AS reason
 FROM public.orders o LEFT JOIN LATERAL (SELECT confirmed_at,method,confirmed_by FROM public.payments
 WHERE order_id=o.id AND status='confirmado' ORDER BY confirmed_at,id LIMIT 1) p ON true
 LEFT JOIN public.customers c ON c.id=o.customer_id
 LEFT JOIN public.profiles pr ON pr.id=p.confirmed_by
 -- El estado operacional cancelado no borra un cobro confirmado sin reintegro.
 WHERE p.confirmed_at IS NOT NULL OR (o.total=0 AND o.status IN ('confirmado','en_preparacion','listo','finalizado'))
 UNION ALL
 SELECT 'refund',r.id,o.id,o.order_number,o.order_type,o.status,c.name,o.total,r.amount,r.created_at,p.method,r.created_by,pr.full_name,r.type,r.reason
 FROM public.sale_returns r JOIN public.orders o ON o.id=r.order_id
 LEFT JOIN LATERAL (SELECT method FROM public.payments WHERE order_id=o.id AND status='confirmado' ORDER BY confirmed_at,id LIMIT 1) p ON true
 LEFT JOIN public.customers c ON c.id=o.customer_id
 LEFT JOIN public.profiles pr ON pr.id=r.created_by WHERE r.amount>0;
REVOKE ALL ON public.sales_ledger FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.sales_ledger TO authenticated,service_role;
COMMIT;
