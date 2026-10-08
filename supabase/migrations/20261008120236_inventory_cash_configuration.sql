-- Pendientes funcionales: FIFO de ajustes/mermas, caja y configuración atómica.
-- Validación local; no implica autorización de ejecución en producción.
BEGIN;

-- PostgreSQL numeric permite NaN/Infinity; tampoco son montos/cantidades válidos por RPC.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND data_type='numeric' AND table_name IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%I::text NOT IN (''NaN'',''Infinity'',''-Infinity''))',c.table_name,'finite_'||c.column_name,c.column_name);
 END LOOP;
END; $$;

ALTER TABLE public.inventory_lots ALTER COLUMN inventory_entry_id DROP NOT NULL;
ALTER TABLE public.inventory_lots ADD COLUMN inventory_adjustment_id uuid REFERENCES public.inventory_adjustments(id) ON DELETE RESTRICT;
ALTER TABLE public.inventory_lots ADD CONSTRAINT inventory_lots_source CHECK (num_nonnulls(inventory_entry_id, inventory_adjustment_id) = 1);
CREATE UNIQUE INDEX cash_sessions_one_open_per_register ON public.cash_sessions(cash_register_id) WHERE status='abierta';
CREATE UNIQUE INDEX payment_qr_one_active ON public.payment_qr_config(is_active) WHERE is_active;
CREATE UNIQUE INDEX whatsapp_one_active ON public.whatsapp_config(is_active) WHERE is_active;
ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_open_interval CHECK (is_closed OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at));
ALTER TABLE public.system_settings ADD CONSTRAINT outside_hours_boolean CHECK (key <> 'accept_orders_outside_hours' OR (jsonb_typeof(value->'enabled')='boolean' AND value ? 'enabled'));

CREATE OR REPLACE FUNCTION public.consume_inventory_adjustment(p_item uuid, p_quantity numeric, p_lot uuid, p_type text, p_reference uuid, p_reason text, p_actor uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE stock numeric; reserved numeric; remaining numeric:=p_quantity; take numeric; lot record;
BEGIN
 SELECT current_stock INTO stock FROM public.inventory_items WHERE id=p_item FOR UPDATE;
 IF stock IS NULL OR p_quantity IS NULL OR p_quantity<=0 OR p_quantity::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Ítem o cantidad inválidos.'; END IF;
 SELECT coalesce(sum(quantity),0) INTO reserved FROM public.inventory_reservations WHERE inventory_item_id=p_item AND status='reserved' AND expires_at>clock_timestamp();
 IF stock-reserved<p_quantity THEN RAISE EXCEPTION 'Stock disponible insuficiente; no se puede consumir stock reservado.'; END IF;
 IF p_lot IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.inventory_lots WHERE id=p_lot AND inventory_item_id=p_item) THEN RAISE EXCEPTION 'El lote no pertenece al ítem.'; END IF;
 FOR lot IN SELECT * FROM public.inventory_lots WHERE inventory_item_id=p_item AND remaining_quantity>0 AND (p_lot IS NULL OR id=p_lot) ORDER BY received_at,created_at,id FOR UPDATE LOOP
  take:=least(remaining,lot.remaining_quantity);
  UPDATE public.inventory_lots SET remaining_quantity=remaining_quantity-take WHERE id=lot.id;
  INSERT INTO public.inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,reason,created_by)
  VALUES(p_item,lot.id,p_type,take,CASE WHEN p_type='merma' THEN 'inventory_waste' ELSE 'inventory_adjustment' END,p_reference,p_reason,p_actor);
  remaining:=remaining-take; EXIT WHEN remaining=0;
 END LOOP;
 IF remaining>0 THEN RAISE EXCEPTION 'Lotes insuficientes para la operación.'; END IF;
 UPDATE public.inventory_items SET current_stock=current_stock-p_quantity,updated_at=now() WHERE id=p_item;
END; $$;
REVOKE ALL ON FUNCTION public.consume_inventory_adjustment(uuid,numeric,uuid,text,uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.handle_inventory_waste() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.consume_inventory_adjustment(NEW.inventory_item_id,NEW.quantity,NEW.lot_id,'merma',NEW.id,NEW.reason,NEW.created_by);
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_inventory_adjustment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE lot_id uuid;
BEGIN
 IF NEW.quantity_delta::text IN ('NaN','Infinity','-Infinity') OR NEW.quantity_delta=0 THEN RAISE EXCEPTION 'Cantidad de ajuste inválida.'; END IF;
 IF NEW.quantity_delta<0 THEN
  PERFORM public.consume_inventory_adjustment(NEW.inventory_item_id,-NEW.quantity_delta,NULL,'ajuste',NEW.id,NEW.reason,NEW.created_by);
 ELSE
  PERFORM id FROM public.inventory_items WHERE id=NEW.inventory_item_id FOR UPDATE;
  INSERT INTO public.inventory_lots(inventory_adjustment_id,inventory_item_id,initial_quantity,remaining_quantity,received_at)
  VALUES(NEW.id,NEW.inventory_item_id,NEW.quantity_delta,NEW.quantity_delta,NEW.created_at) RETURNING id INTO lot_id;
  UPDATE public.inventory_items SET current_stock=current_stock+NEW.quantity_delta,updated_at=now() WHERE id=NEW.inventory_item_id;
  INSERT INTO public.inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,reason,created_by)
  VALUES(NEW.inventory_item_id,lot_id,'ajuste',NEW.quantity_delta,'inventory_adjustment',NEW.id,NEW.reason,NEW.created_by);
 END IF;
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_checkout_configuration(p_actor uuid,p_kind text,p_active boolean,p_value text DEFAULT NULL,p_storage_path text DEFAULT NULL,p_account_label text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role='administrador' AND is_active) THEN RAISE EXCEPTION 'Administrador activo requerido.'; END IF;
 IF p_kind NOT IN ('qr','whatsapp') OR p_active IS NULL THEN RAISE EXCEPTION 'Configuración inválida.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('checkout_config:'||p_kind,0));
 IF p_kind='qr' THEN
  IF p_active AND (nullif(trim(p_value),'') IS NULL OR nullif(trim(p_storage_path),'') IS NULL) THEN RAISE EXCEPTION 'QR y ruta obligatorios.'; END IF;
  UPDATE public.payment_qr_config SET is_active=false,updated_by=p_actor,updated_at=now() WHERE is_active;
  IF p_active THEN INSERT INTO public.payment_qr_config(qr_public_url,qr_storage_path,account_label,updated_by) VALUES(p_value,p_storage_path,p_account_label,p_actor) RETURNING to_jsonb(payment_qr_config.*) INTO result; END IF;
 ELSE
  IF p_active AND (p_value IS NULL OR p_value !~ '^[0-9]{7,15}$') THEN RAISE EXCEPTION 'Número internacional inválido.'; END IF;
  UPDATE public.whatsapp_config SET is_active=false,updated_by=p_actor,updated_at=now() WHERE is_active;
  IF p_active THEN INSERT INTO public.whatsapp_config(phone_number,updated_by) VALUES(p_value,p_actor) RETURNING to_jsonb(whatsapp_config.*) INTO result; END IF;
 END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.set_checkout_configuration(uuid,text,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_checkout_configuration(uuid,text,boolean,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text,p_route text,p_max_attempts integer,p_window_seconds integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE attempts integer;
BEGIN
 IF p_ip IS NULL OR length(p_ip) NOT BETWEEN 1 AND 200 OR p_max_attempts IS NULL OR p_window_seconds IS NULL OR p_max_attempts NOT BETWEEN 1 AND 100 OR p_window_seconds NOT BETWEEN 1 AND 3600 THEN RAISE EXCEPTION 'Límite inválido.'; END IF;
 IF p_route IS NULL OR p_route NOT IN ('trackOrder','createOrder','reportPayment','getPaymentQr','getBusinessHours','getWhatsappConfig') THEN RAISE EXCEPTION 'Ruta inválida.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('rate:'||p_ip||':'||p_route,0));
 SELECT count(*) INTO attempts FROM public.rate_limit_attempts WHERE ip=p_ip AND route=p_route AND created_at>=clock_timestamp()-make_interval(secs=>p_window_seconds);
 IF attempts>=p_max_attempts THEN RETURN false; END IF;
 INSERT INTO public.rate_limit_attempts(ip,route) VALUES(p_ip,p_route);
 IF random()<0.01 THEN DELETE FROM public.rate_limit_attempts WHERE id IN (SELECT id FROM public.rate_limit_attempts WHERE created_at<now()-interval '1 hour' LIMIT 1000); END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text,text,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.audit_sensitive_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before_row jsonb; after_row jsonb; row_data jsonb; actor uuid; record uuid;
BEGIN
 IF TG_OP<>'INSERT' THEN before_row:=to_jsonb(OLD); END IF;
 IF TG_OP<>'DELETE' THEN after_row:=to_jsonb(NEW); END IF;
 IF before_row IS NOT DISTINCT FROM after_row THEN RETURN NULL; END IF;
 row_data:=coalesce(after_row,before_row);
 actor:=coalesce(auth.uid(),nullif(current_setting('nova.audit_actor',true),'')::uuid,nullif(row_data->>'updated_by','')::uuid,nullif(row_data->>'created_by','')::uuid,nullif(row_data->>'confirmed_by','')::uuid,nullif(row_data->>'closed_by','')::uuid,nullif(row_data->>'opened_by','')::uuid);
 record:=coalesce((row_data->>'id')::uuid,md5(TG_TABLE_NAME||':'||jsonb_build_object('key',row_data->'key','product_id',row_data->'product_id','promotion_id',row_data->'promotion_id','inventory_item_id',row_data->'inventory_item_id','customization_option_id',row_data->'customization_option_id','component_id',row_data->'component_id')::text)::uuid);
 INSERT INTO public.audit_logs(user_id,action,table_name,record_id,before,after,reason) VALUES(actor,TG_OP,TG_TABLE_NAME,record,before_row,after_row,row_data->>'reason');
 RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.audit_sensitive_change() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','orders','payments','sale_returns','cash_sessions','cash_movements','inventory_entries','inventory_adjustments','inventory_waste','promotions','promotion_products','customization_options','customization_option_inventory_requirements','product_inventory_requirements','categories','seasons','customers','cash_registers','payment_qr_config','whatsapp_config','business_hours','system_settings'] LOOP
  EXECUTE format('CREATE TRIGGER audit_sensitive_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change()',t);
 END LOOP;
END; $$;
CREATE OR REPLACE FUNCTION public.open_cash_session(p_cash_register_id uuid, p_opening_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_existing_open integer;
  v_session_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para abrir la caja.';
  end if;

  if p_opening_amount is null or p_opening_amount < 0 or p_opening_amount::text in ('NaN','Infinity','-Infinity') then
    raise exception 'El monto de apertura no puede ser negativo.';
  end if;

  perform id from public.cash_registers where id=p_cash_register_id and is_active for update;
  if not found then raise exception 'Caja inexistente o inactiva.'; end if;

  select count(*) into v_existing_open
  from public.cash_sessions
  where cash_register_id = p_cash_register_id and status = 'abierta';

  if v_existing_open > 0 then
    raise exception 'Ya hay una sesión de caja abierta para esta caja. Ciérrala antes de abrir otra.';
  end if;

  insert into public.cash_sessions (cash_register_id, opened_by, opening_amount)
  values (p_cash_register_id, v_actor_id, p_opening_amount)
  returning id into v_session_id;

  return v_session_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_physical_sale(p_items jsonb, p_customer_id uuid, p_promotion_id uuid, p_manual_discount_amount numeric, p_manual_discount_reason text, p_payment_method text)
 RETURNS TABLE(id uuid, order_number bigint, subtotal numeric, discount_total numeric, total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_seller_id uuid;
  v_cash_session_id uuid;
  v_customer_exists integer;
  v_item jsonb;
  v_product_id uuid;
  v_product_name text;
  v_product_price numeric(12,2);
  v_product_active boolean;
  v_product_available boolean;
  v_product_sold_out boolean;
  v_quantity numeric(12,3);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_final_total numeric(12,2);
  v_req_item_id uuid;
  v_req_quantity numeric(12,3);
  v_needed numeric(12,3);
  v_already_reserved numeric(12,3);
  v_available numeric(12,3);
  v_item_needs jsonb := '{}'::jsonb;
  v_inv_item_id text;
  v_order_id uuid;
  v_lot_id uuid;
  v_lot_remaining numeric(12,3);
  v_remaining_to_consume numeric(12,3);
  v_take_from_lot numeric(12,3);
begin
  v_seller_id := auth.uid();

  if v_seller_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para registrar ventas.';
  end if;

  if p_customer_id is not null then
    select count(*) into v_customer_exists from public.customers c where c.id = p_customer_id;
    if v_customer_exists = 0 then
      raise exception 'El cliente seleccionado no existe.';
    end if;
  end if;

  select cs.id into v_cash_session_id
  from public.cash_sessions cs
  where cs.status = 'abierta'
  order by cs.opened_at desc
  limit 1 for update;

  if v_cash_session_id is null then
    raise exception 'No hay una caja abierta. Abre la caja antes de registrar una venta física.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener al menos un producto.';
  end if;

  if p_payment_method not in ('qr', 'efectivo') then
    raise exception 'Método de pago no válido para venta física.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.id, pr.name, pr.price, pr.is_active, pr.is_available, pr.is_sold_out
    into v_product_id, v_product_name, v_product_price, v_product_active, v_product_available, v_product_sold_out
    from public.products pr
    where pr.id = (v_item->>'product_id')::uuid;

    if v_product_id is null then
      raise exception 'Uno de los productos de la venta ya no existe.';
    end if;

    if not v_product_active or not v_product_available or v_product_sold_out then
      raise exception 'El producto "%" ya no está disponible.', v_product_name;
    end if;

    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'La cantidad de "%" debe ser mayor que cero.', v_product_name;
    end if;

    for v_req_item_id, v_req_quantity in
      select pir.inventory_item_id, pir.quantity
      from public.product_inventory_requirements pir
      where pir.product_id = v_product_id
    loop
      v_needed := v_req_quantity * v_quantity;
      v_inv_item_id := v_req_item_id::text;
      v_item_needs := jsonb_set(
        v_item_needs, array[v_inv_item_id],
        to_jsonb(coalesce((v_item_needs->>v_inv_item_id)::numeric, 0) + v_needed)
      );
    end loop;
  end loop;

  perform public.release_expired_reservations(NULL);
  for v_inv_item_id in select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop


    select ii.current_stock into v_available
    from public.inventory_items ii
    where ii.id = v_inv_item_id::uuid
    for update;

    if v_available is null then
      raise exception 'Un ítem de inventario de la venta ya no existe.';
    end if;

    select coalesce(sum(ir.quantity), 0) into v_already_reserved
    from public.inventory_reservations ir
    where ir.inventory_item_id = v_inv_item_id::uuid and ir.status = 'reserved';

    v_available := v_available - v_already_reserved;
    v_needed := (v_item_needs->>v_inv_item_id)::numeric;

    if v_available < v_needed then
      raise exception 'Stock insuficiente: solo hay % disponible (hay % reservado por pedidos online) y se necesitan %.',
        v_available, v_already_reserved, v_needed;
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.price into v_product_price from public.products pr where pr.id = (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_subtotal := v_subtotal + (v_product_price * v_quantity);
  end loop;

  -- Venta física: pagada y entregada en el momento → directo a
  -- FINALIZADO. Nunca pasa por pendiente_pago/confirmado/en_preparacion.
  insert into public.orders (customer_id, order_type, status, subtotal, discount_total, total)
  values (p_customer_id, 'fisica', 'finalizado', v_subtotal, 0, v_subtotal)
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.id, pr.name, pr.price
    into v_product_id, v_product_name, v_product_price
    from public.products pr where pr.id = (v_item->>'product_id')::uuid;

    v_quantity := (v_item->>'quantity')::numeric;
    v_line_total := v_product_price * v_quantity;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total
    ) values (
      v_order_id, v_product_id, v_product_name, v_product_price, v_quantity, v_line_total
    );
  end loop;

  if p_promotion_id is not null or p_manual_discount_amount is not null then
    perform public.apply_order_discount(
      v_order_id, v_subtotal, p_customer_id, p_promotion_id, p_manual_discount_amount, p_manual_discount_reason, v_seller_id
    );
  end if;

  select o.total into v_final_total from public.orders o where o.id = v_order_id;

  for v_inv_item_id in select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop
    v_remaining_to_consume := (v_item_needs->>v_inv_item_id)::numeric;

    for v_lot_id, v_lot_remaining in
      select il.id, il.remaining_quantity
      from public.inventory_lots il
      where il.inventory_item_id = v_inv_item_id::uuid and il.remaining_quantity > 0
      order by il.received_at asc, il.created_at asc, il.id asc
      for update
    loop
      exit when v_remaining_to_consume <= 0;

      v_take_from_lot := least(v_lot_remaining, v_remaining_to_consume);

      update public.inventory_lots set remaining_quantity = remaining_quantity - v_take_from_lot
      where inventory_lots.id = v_lot_id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity, reference_type, reference_id, created_by
      ) values (
        v_inv_item_id::uuid, v_lot_id, 'salida', v_take_from_lot, 'order', v_order_id, v_seller_id
      );

      v_remaining_to_consume := v_remaining_to_consume - v_take_from_lot;
    end loop;

    if v_remaining_to_consume > 0 then
      raise exception 'Inconsistencia de inventario al registrar la venta para el ítem %.', v_inv_item_id;
    end if;

    update public.inventory_items
    set current_stock = current_stock - (v_item_needs->>v_inv_item_id)::numeric, updated_at = now()
    where inventory_items.id = v_inv_item_id::uuid;
  end loop;

  -- Venta gratuita: finalizada y con consumo, sin pago/movimiento monetario ficticio.
  if v_final_total > 0 then
  insert into public.payments (order_id, method, amount, status, confirmed_by, confirmed_at)
  values (v_order_id, p_payment_method, v_final_total, 'confirmado', v_seller_id, now());

  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, order_id, created_by
  ) values (
    v_cash_session_id, 'venta', p_payment_method, v_final_total, v_order_id, v_seller_id
  );
  end if;

  return query
  select o.id, o.order_number, o.subtotal, o.discount_total, o.total
  from public.orders o
  where o.id = v_order_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_sale_return(p_order_id uuid, p_type text, p_amount numeric, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_order_status text;
  v_order_total numeric(12,2);
  v_already_returned numeric(12,2);
  v_return_id uuid;
  v_movement record;
  v_existing_devolucion integer;
  v_cash_session uuid;
  v_sale_session uuid;
  v_payment_method text;
  v_register uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar una devolución o reintegro.';
  end if;

  if p_type not in ('devolucion', 'reintegro') then
    raise exception 'Tipo de devolución no válido.';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN','Infinity','-Infinity') then
    raise exception 'El monto debe ser mayor que cero.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo es obligatorio.';
  end if;

  select status, total into v_order_status, v_order_total
  from public.orders where id = p_order_id for update;

  if v_order_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order_status <> 'finalizado' then
    raise exception 'Solo se puede registrar una devolución sobre un pedido ya finalizado (estado actual: %).', v_order_status;
  end if;

  select coalesce(sum(amount), 0) into v_already_returned
  from public.sale_returns where order_id = p_order_id;

  if v_already_returned + p_amount > v_order_total then
    raise exception 'El monto a devolver (%) sumado a lo ya devuelto (%) supera el total del pedido (%).',
      p_amount, v_already_returned, v_order_total;
  end if;

  -- Solo ventas físicas ingresaron a caja. Conservar método original (QR no es efectivo).
  select cash_session_id,payment_method into v_sale_session,v_payment_method from public.cash_movements
  where order_id=p_order_id and movement_type='venta' order by created_at,id limit 1;
  if v_sale_session is not null then
    select cash_register_id into v_register from public.cash_sessions where id=v_sale_session;
    select id into v_cash_session from public.cash_sessions where cash_register_id=v_register and status='abierta' for update;
    if v_cash_session is null then raise exception 'Abre la caja para registrar la devolución monetaria de una venta física.'; end if;
  end if;

  if p_type = 'devolucion' then
    select count(*) into v_existing_devolucion
    from public.sale_returns where order_id = p_order_id and type = 'devolucion';

    if v_existing_devolucion > 0 then
      raise exception 'Este pedido ya tuvo una devolución de producto físico; no se puede repetir.';
    end if;

    perform id from public.payments where order_id=p_order_id order by id for update;
    perform id from public.inventory_reservations where order_id=p_order_id order by inventory_item_id,id for update;
    perform i.id from public.inventory_items i where i.id in (select inventory_item_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by i.id for update;
    perform l.id from public.inventory_lots l where l.id in (select lot_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by l.inventory_item_id,l.received_at,l.created_at,l.id for update;
    for v_movement in
      select im.id, im.inventory_item_id, im.lot_id, im.quantity
      from public.inventory_movements im
      where im.reference_type = 'order'
        and im.reference_id = p_order_id
        and im.movement_type = 'salida'
    loop
      if v_movement.lot_id is not null then
        update public.inventory_lots
        set remaining_quantity = remaining_quantity + v_movement.quantity
        where id = v_movement.lot_id;
      end if;

      update public.inventory_items
      set current_stock = current_stock + v_movement.quantity, updated_at = now()
      where id = v_movement.inventory_item_id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, reason, created_by
      ) values (
        v_movement.inventory_item_id, v_movement.lot_id, 'devolucion', v_movement.quantity,
        'order', p_order_id, p_reason, v_actor_id
      );
    end loop;
  end if;

  insert into public.sale_returns (order_id, type, amount, reason, created_by)
  values (p_order_id, p_type, p_amount, p_reason, v_actor_id)
  returning id into v_return_id;

  if v_cash_session is not null then
    insert into public.cash_movements(cash_session_id,movement_type,payment_method,amount,order_id,reason,created_by)
    values(v_cash_session,'devolucion',v_payment_method,p_amount,p_order_id,p_reason,v_actor_id);
  end if;
  return v_return_id;
end;
$function$;



-- El checkout identifica/reutiliza al cliente por teléfono; duplicados requieren revisión,
-- nunca borrado/merge automático. Sin teléfono se permiten varios clientes.
CREATE UNIQUE INDEX customers_unique_phone ON public.customers(btrim(phone)) WHERE nullif(btrim(phone),'') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_customer_phone() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 NEW.phone:=nullif(trim(NEW.phone),''); NEW.whatsapp:=nullif(trim(NEW.whatsapp),'');
 IF NEW.phone IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('customer_phone:'||NEW.phone,0)); END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.normalize_customer_phone() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER normalize_customer_phone BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.normalize_customer_phone();

CREATE OR REPLACE FUNCTION public.create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_existing_order_id uuid;
  v_contract jsonb;
  v_existing_contract jsonb;
  v_customer_id uuid;
  v_order_id uuid;

  v_item jsonb;
  v_product record;

  v_quantity numeric(12,3);

  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;

  v_req record;

  v_needed numeric(12,3);
  v_already_reserved numeric(12,3);
  v_available numeric(12,3);

  -- Inventario acumulado de TODO el pedido.
  -- La clave es inventory_item_id.
  v_item_needs jsonb := '{}'::jsonb;

  v_inv_item_id text;

  v_reserved_until timestamptz :=
    now() + interval '30 minutes';

  v_business_is_open boolean;
  v_business_accept_outside boolean;

  v_option_id text;

  v_options_extra numeric(12,2);
  v_personalization_snapshot jsonb;

  v_option_count integer;
  v_distinct_option_count integer;

begin

  -- ==========================================================
  -- 4. VALIDACIONES GENERALES
  -- ==========================================================

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then

    raise exception
      'El pedido debe tener al menos un producto.';
  end if;


  IF nullif(trim(p_idempotency_key),'') IS NULL OR length(p_idempotency_key)>100 OR p_customer_name IS NULL OR nullif(trim(p_customer_name),'') IS NULL
     OR length(trim(coalesce(p_customer_phone,''))) NOT BETWEEN 6 AND 30 THEN RAISE EXCEPTION 'Contrato básico de pedido inválido.'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE jsonb_typeof(x)<>'object' OR x->>'product_id' IS NULL OR x->>'quantity' IS NULL
   OR (x ? 'customization_option_ids' AND jsonb_typeof(x->'customization_option_ids')<>'array')) THEN RAISE EXCEPTION 'Líneas de pedido inválidas.'; END IF;
  SELECT jsonb_build_object('name',trim(p_customer_name),'phone',trim(p_customer_phone),'whatsapp',nullif(trim(p_customer_whatsapp),''),
    'message',nullif(trim(p_customer_message),''),'promotion',p_promotion_id,'items',jsonb_agg(line ORDER BY line::text)) INTO v_contract
  FROM (SELECT jsonb_build_object('product_id',(x->>'product_id')::uuid,'quantity',(x->>'quantity')::numeric(12,3),
   'message',nullif(trim(x->>'message'),''),'note',nullif(trim(x->>'note'),''),
   'options',(SELECT coalesce(jsonb_agg(option_id::uuid ORDER BY option_id::uuid),'[]'::jsonb) FROM jsonb_array_elements_text(coalesce(x->'customization_option_ids','[]'::jsonb)) option_id)) line
   FROM jsonb_array_elements(p_items) x) lines;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,37007));
  SELECT id,request_contract INTO v_existing_order_id,v_existing_contract FROM public.orders WHERE idempotency_key=p_idempotency_key;
  IF v_existing_order_id IS NOT NULL THEN
   IF v_existing_contract IS NULL THEN RAISE EXCEPTION 'Clave antigua sin contrato verificable; requiere revisión.'; END IF;
   IF v_existing_contract IS DISTINCT FROM v_contract THEN RAISE EXCEPTION 'Reutilización inválida de clave de idempotencia: contrato diferente.'; END IF;
   RETURN v_existing_order_id;
  END IF;

  select
    gbs.is_open,
    gbs.accept_orders_outside_hours
  into
    v_business_is_open,
    v_business_accept_outside
  from public.get_business_status() gbs;


  if not v_business_is_open
     and not v_business_accept_outside then

    raise exception
      'La florería está cerrada en este momento y no se aceptan pedidos fuera de horario.';
  end if;


  if p_customer_name is null
     or trim(p_customer_name) = '' then

    raise exception
      'El nombre del cliente es obligatorio.';
  end if;


  -- ==========================================================
  -- 5. IDEMPOTENCIA
  -- ==========================================================




  -- ==========================================================
  -- 6. OBTENER / CREAR CLIENTE
  -- ==========================================================

  if p_customer_phone is not null
     and trim(p_customer_phone) <> '' then

    select id
    into v_customer_id
    from public.customers
    where phone = trim(p_customer_phone)
    limit 1;

  end if;


  if v_customer_id is null then

    -- Serializar únicamente el alta. Clientes existentes no bloquean pedidos
    -- independientes durante toda la transacción.
    perform pg_advisory_xact_lock(hashtextextended('customer_phone:'||trim(p_customer_phone),0));
    select id into v_customer_id from public.customers where phone=trim(p_customer_phone) limit 1;
    if v_customer_id is null then

    insert into public.customers (
      name,
      phone,
      whatsapp
    )
    values (
      p_customer_name,
      nullif(trim(p_customer_phone), ''),
      nullif(trim(p_customer_whatsapp), '')
    )
    returning id into v_customer_id;

    end if;

  end if;


  -- ==========================================================
  -- 7. PRIMERA PASADA
  --
  -- Aquí:
  --   - validamos productos
  --   - validamos cantidades
  --   - validamos opciones
  --   - rechazamos duplicados
  --   - acumulamos inventario del producto
  --   - acumulamos inventario de las opciones
  --
  -- Todavía NO creamos el pedido.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    -- --------------------------------------------------------
    -- Producto
    -- --------------------------------------------------------

    begin

      select
        id,
        name,
        price,
        is_active,
        is_available,
        is_sold_out
      into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid;

    exception
      when invalid_text_representation then

        raise exception
          'El identificador de producto no es válido.';

    end;


    if v_product.id is null then

      raise exception
        'Uno de los productos del pedido ya no existe.';

    end if;


    if not v_product.is_active
       or not v_product.is_available
       or v_product.is_sold_out then

      raise exception
        'El producto "%" ya no está disponible.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Cantidad
    -- --------------------------------------------------------

    begin

      v_quantity :=
        (v_item->>'quantity')::numeric;

    exception
      when invalid_text_representation then

        raise exception
          'La cantidad del producto "%" no es válida.',
          v_product.name;

    end;


    if v_quantity is null
       or v_quantity <= 0 then

      raise exception
        'La cantidad de "%" debe ser mayor que cero.',
        v_product.name;

    end if;


    -- ========================================================
    -- OPCIONES DE PERSONALIZACIÓN
    -- ========================================================

    if v_item ? 'customization_option_ids'
       and jsonb_typeof(v_item->'customization_option_ids') <> 'array' then

      raise exception
        'Las opciones de personalización de "%" no son válidas.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Rechazar opciones duplicadas
    -- --------------------------------------------------------

    select
      count(*),
      count(distinct option_id)
    into
      v_option_count,
      v_distinct_option_count
    from jsonb_array_elements_text(
      coalesce(
        v_item->'customization_option_ids',
        '[]'::jsonb
      )
    ) as option_id;


    if v_option_count <> v_distinct_option_count then

      raise exception
        'No se puede seleccionar dos veces la misma opción de "%".',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Validar cada opción
    -- --------------------------------------------------------

    for v_option_id in
      select jsonb_array_elements_text(
        coalesce(
          v_item->'customization_option_ids',
          '[]'::jsonb
        )
      )
    loop

      begin

        if not exists (
          select 1
          from public.customization_options co
          where co.id = v_option_id::uuid
            and co.product_id = v_product.id
            and co.is_active = true
        ) then

          raise exception
            'Una opción de personalización de "%" ya no está disponible.',
            v_product.name;

        end if;

      exception
        when invalid_text_representation then

          raise exception
            'Una opción de personalización de "%" no es válida.',
            v_product.name;

      end;


      -- ------------------------------------------------------
      -- Inventario requerido por la opción
      -- ------------------------------------------------------

      for v_req in
        select
          inventory_item_id,
          quantity
        from public.customization_option_inventory_requirements
        where customization_option_id = v_option_id::uuid
      loop

        v_needed :=
          v_req.quantity * v_quantity;

        v_inv_item_id :=
          v_req.inventory_item_id::text;

        v_item_needs :=
          jsonb_set(
            v_item_needs,
            array[v_inv_item_id],
            to_jsonb(
              coalesce(
                (v_item_needs->>v_inv_item_id)::numeric,
                0
              ) + v_needed
            )
          );

      end loop;

    end loop;


    -- ========================================================
    -- INVENTARIO BASE DEL PRODUCTO
    -- ========================================================

    for v_req in
      select
        inventory_item_id,
        quantity
      from public.product_inventory_requirements
      where product_id = v_product.id
    loop

      v_needed :=
        v_req.quantity * v_quantity;

      v_inv_item_id :=
        v_req.inventory_item_id::text;

      v_item_needs :=
        jsonb_set(
          v_item_needs,
          array[v_inv_item_id],
          to_jsonb(
            coalesce(
              (v_item_needs->>v_inv_item_id)::numeric,
              0
            ) + v_needed
          )
        );

    end loop;

  end loop;


  -- ==========================================================
  -- 8. VERIFICAR STOCK
  --
  -- Producto + opciones ya están acumulados.
  -- Aquí se comprueba el total real necesario.
  -- ==========================================================

  perform public.release_expired_reservations(NULL);
  v_reserved_until:=clock_timestamp()+interval '30 minutes';
  for v_inv_item_id in
    select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop

    -- Liberar reservas vencidas antes de comprobar
    -- disponibilidad.
    


    -- Bloqueamos el ítem de inventario para que dos pedidos
    -- concurrentes no puedan comprobar el mismo stock
    -- simultáneamente.
    select current_stock
    into v_available
    from public.inventory_items
    where id = v_inv_item_id::uuid
    for update;


    if v_available is null then

      raise exception
        'Un ítem de inventario del pedido ya no existe.';

    end if;


    select coalesce(sum(quantity), 0)
    into v_already_reserved
    from public.inventory_reservations
    where inventory_item_id = v_inv_item_id::uuid
      and status = 'reserved';


    v_available :=
      v_available - v_already_reserved;


    v_needed :=
      (v_item_needs->>v_inv_item_id)::numeric;


    if v_available < v_needed then

      raise exception
        'Stock insuficiente: solo hay % disponible y se necesitan %.',
        v_available,
        v_needed;

    end if;

  end loop;


  -- ==========================================================
  -- 9. CREAR PEDIDO
  -- ==========================================================

  insert into public.orders (
    customer_id,
    status,
    customer_message,
    idempotency_key,
    request_contract,
    reserved_until
  )
  values (
    v_customer_id,
    'pendiente_pago',
    p_customer_message,
    p_idempotency_key,
    v_contract,
    v_reserved_until
  )
  returning id into v_order_id;


  -- ==========================================================
  -- 10. SEGUNDA PASADA
  --
  -- Aquí calculamos el precio REAL desde PostgreSQL.
  -- Nunca usamos extra_price enviado por el navegador.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    select
      id,
      name,
      price
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;


    v_quantity :=
      (v_item->>'quantity')::numeric;


    -- --------------------------------------------------------
    -- Precio real de las opciones
    -- --------------------------------------------------------

    select
      coalesce(sum(co.extra_price), 0),

      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', co.id,
            'option_type', co.option_type,
            'name', co.name,
            'value', co.value,
            'extra_price', co.extra_price
          )
          order by co.option_type, co.name, co.id
        )
        filter (where co.id is not null),
        '[]'::jsonb
      )

    into
      v_options_extra,
      v_personalization_snapshot

    from public.customization_options co

    where co.id in (
      select
        jsonb_array_elements_text(
          coalesce(
            v_item->'customization_option_ids',
            '[]'::jsonb
          )
        )::uuid
    )

    and co.product_id = v_product.id

    and co.is_active = true;


    -- --------------------------------------------------------
    -- Precio final de la línea
    -- --------------------------------------------------------

    v_line_total :=
      (v_product.price + v_options_extra)
      * v_quantity;


    v_subtotal :=
      v_subtotal + v_line_total;


    -- --------------------------------------------------------
    -- Snapshot de la personalización
    -- --------------------------------------------------------

    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total,
      personalization,
      message,
      note
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price + v_options_extra,
      v_quantity,
      v_line_total,
      v_personalization_snapshot,
      v_item->>'message',
      v_item->>'note'
    );

  end loop;


  -- ==========================================================
  -- 11. ACTUALIZAR TOTALES
  -- ==========================================================

  update public.orders
  set
    subtotal = v_subtotal,
    total = v_subtotal
  where id = v_order_id;


  -- ==========================================================
  -- 12. PROMOCIÓN
  -- ==========================================================

  if p_promotion_id is not null then

    perform public.apply_order_discount(
      v_order_id,
      v_subtotal,
      v_customer_id,
      p_promotion_id,
      null,
      null,
      null
    );

  end if;


  -- ==========================================================
  -- 13. RESERVAR INVENTARIO
  --
  -- Aquí se reserva:
  --
  --   inventario del producto
  --       +
  --   inventario de las opciones
  --
  -- en una sola reserva por ítem de inventario.
  -- ==========================================================

  for v_inv_item_id in
    select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop

    insert into public.inventory_reservations (
      order_id,
      inventory_item_id,
      quantity,
      status,
      expires_at
    )
    values (
      v_order_id,
      v_inv_item_id::uuid,
      (v_item_needs->>v_inv_item_id)::numeric,
      'reserved',
      v_reserved_until
    );

  end loop;


  -- ==========================================================
  -- 14. RESULTADO
  -- ==========================================================

  IF (SELECT total FROM public.orders WHERE id=v_order_id)=0 THEN
   PERFORM public.consume_order_reservations(v_order_id,NULL);
   UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=v_order_id;
  END IF;
  return v_order_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.protect_last_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF OLD.role='administrador' AND OLD.is_active AND (TG_OP='DELETE' OR NEW.role<>'administrador' OR NOT NEW.is_active) THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('active_admins',0));
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id<>OLD.id AND role='administrador' AND is_active) THEN RAISE EXCEPTION 'No se puede retirar al último administrador activo.'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_last_admin() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER protect_last_admin BEFORE UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

CREATE OR REPLACE FUNCTION public.update_staff_profile(p_actor uuid,p_user uuid,p_role text DEFAULT NULL,p_active boolean DEFAULT NULL,p_name text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('active_admins',0));
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role='administrador' AND is_active) THEN RAISE EXCEPTION 'Administrador activo requerido.'; END IF;
 IF p_role IS NOT NULL AND p_role NOT IN ('administrador','empleado') THEN RAISE EXCEPTION 'Rol inválido.'; END IF;
 PERFORM set_config('nova.audit_actor',p_actor::text,true);
 UPDATE public.profiles SET role=coalesce(p_role,role),is_active=coalesce(p_active,is_active),full_name=coalesce(p_name,full_name),updated_at=now() WHERE id=p_user RETURNING to_jsonb(profiles.*) INTO result;
 IF result IS NULL THEN RAISE EXCEPTION 'Usuario inexistente.'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.update_staff_profile(uuid,uuid,text,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_staff_profile(uuid,uuid,text,boolean,text) TO service_role;
-- El contrato público es /api/orders: no permitir eludir su rate limiting por RPC.
REVOKE ALL ON FUNCTION public.create_order(text,text,text,jsonb,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,jsonb,text,text,uuid) TO service_role;
COMMIT;
