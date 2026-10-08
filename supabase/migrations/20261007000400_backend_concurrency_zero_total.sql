-- CANDIDATA LOCAL; no historial, no datos productivos, no 035.
BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_contract jsonb;
ALTER TABLE public.inventory_movements ALTER COLUMN created_by DROP NOT NULL;
COMMENT ON COLUMN public.orders.request_contract IS 'Contrato normalizado original e inmutable; NULL identifica pedidos legacy no verificables. No se publica por RPC de seguimiento.';
CREATE OR REPLACE FUNCTION public.validate_inventory_movement_actor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.created_by IS NULL AND NOT (NEW.movement_type='salida' AND NEW.reference_type='order' AND
  EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.reference_id AND order_type='online' AND status='pendiente_pago'
   AND subtotal>0 AND total=0 AND discount_total=subtotal)) THEN
  RAISE EXCEPTION 'Actor obligatorio salvo consumo automático de pedido gratuito válido.';
 END IF;
 RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_order_request_contract() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.request_contract IS DISTINCT FROM OLD.request_contract THEN
  RAISE EXCEPTION 'El contrato original del pedido es inmutable.';
 END IF;
 RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_order_reservations(p_order_id uuid,p_actor_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE o public.orders%rowtype; r record; l record; remaining numeric; take numeric; checked_at timestamptz;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.status <> 'pendiente_pago' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación.'; END IF;
 IF p_actor_id IS NULL AND NOT (o.order_type='online' AND o.subtotal>0 AND o.total=0 AND o.discount_total=o.subtotal) THEN RAISE EXCEPTION 'Consumo automático solo para pedido gratuito válido.'; END IF;
 PERFORM id FROM public.payments WHERE order_id=p_order_id ORDER BY id FOR UPDATE;
 PERFORM id FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id FOR UPDATE;
 PERFORM i.id FROM public.inventory_items i WHERE i.id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id) ORDER BY i.id FOR UPDATE;
 PERFORM locked_lot.id FROM public.inventory_lots locked_lot WHERE locked_lot.inventory_item_id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id)
  ORDER BY locked_lot.inventory_item_id,locked_lot.received_at,locked_lot.created_at,locked_lot.id FOR UPDATE;
 checked_at:=clock_timestamp();
 IF o.reserved_until IS NOT NULL AND o.reserved_until<=checked_at THEN RAISE EXCEPTION 'La reserva del pedido venció. No se puede confirmar.'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=p_order_id AND (status<>'reserved' OR expires_at<=checked_at)) THEN
  RAISE EXCEPTION 'La reserva de inventario venció o fue liberada.';
 END IF;
 FOR r IN SELECT * FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id LOOP
  IF (SELECT current_stock FROM public.inventory_items WHERE id=r.inventory_item_id)<r.quantity THEN RAISE EXCEPTION 'Inconsistencia de inventario: stock insuficiente.'; END IF;
  remaining:=r.quantity;
  FOR l IN SELECT * FROM public.inventory_lots WHERE inventory_item_id=r.inventory_item_id AND remaining_quantity>0 ORDER BY received_at,created_at,id LOOP
   EXIT WHEN remaining<=0;
   take:=least(l.remaining_quantity,remaining);
   UPDATE public.inventory_lots SET remaining_quantity=remaining_quantity-take WHERE id=l.id;
   INSERT INTO public.inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,created_by)
    VALUES(r.inventory_item_id,l.id,'salida',take,'order',p_order_id,p_actor_id);
   remaining:=remaining-take;
  END LOOP;
  IF remaining>0 THEN RAISE EXCEPTION 'Inconsistencia de inventario: no quedan lotes suficientes.'; END IF;
  UPDATE public.inventory_items SET current_stock=current_stock-r.quantity,updated_at=checked_at WHERE id=r.inventory_item_id;
  UPDATE public.inventory_reservations SET status='consumed',released_at=checked_at WHERE id=r.id;
 END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_expired_reservations(p_inventory_item_id uuid DEFAULT NULL::uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE oid uuid; affected integer:=0; n integer; checked_at timestamptz;
BEGIN
 FOR oid IN SELECT DISTINCT order_id FROM public.inventory_reservations WHERE status='reserved' AND expires_at<=clock_timestamp()
  AND (p_inventory_item_id IS NULL OR inventory_item_id=p_inventory_item_id) ORDER BY order_id LOOP
  PERFORM id FROM public.orders WHERE id=oid FOR UPDATE;
  PERFORM id FROM public.payments WHERE order_id=oid ORDER BY id FOR UPDATE;
  PERFORM id FROM public.inventory_reservations WHERE order_id=oid ORDER BY inventory_item_id,id FOR UPDATE;
  checked_at:=clock_timestamp();
  IF EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND status='pendiente_pago') AND
   (EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND reserved_until<=checked_at) OR
    EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=oid AND status='reserved' AND expires_at<=checked_at)) THEN
   UPDATE public.inventory_reservations SET status='released',released_at=checked_at WHERE order_id=oid AND status='reserved';
   GET DIAGNOSTICS n=ROW_COUNT; affected:=affected+n;
   UPDATE public.orders SET status='cancelado',cancelled_at=checked_at,cancellation_reason='Reserva de inventario vencida.',updated_at=checked_at WHERE id=oid AND status='pendiente_pago';
  END IF;
 END LOOP;
 RETURN affected;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_payment(p_payment_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE actor uuid:=auth.uid(); o public.orders%rowtype; p public.payments%rowtype;
BEGIN
 IF actor IS NULL OR NOT public.is_employee_or_admin() THEN RAISE EXCEPTION 'No tienes permisos para confirmar pagos.'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=(SELECT order_id FROM public.payments WHERE id=p_payment_id) FOR UPDATE;
 PERFORM id FROM public.payments WHERE order_id=o.id ORDER BY id FOR UPDATE;
 SELECT * INTO p FROM public.payments WHERE id=p_payment_id;
 IF p.id IS NULL THEN RAISE EXCEPTION 'El pago no existe.'; END IF;
 IF p.status<>'pendiente' THEN RAISE EXCEPTION 'Este pago ya fue procesado (estado actual: %).',p.status; END IF;
 IF o.deleted_at IS NOT NULL OR o.status<>'pendiente_pago' OR o.order_type<>'online' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación de pago.'; END IF;
 IF o.total<=0 OR o.total::text='NaN' OR p.amount IS DISTINCT FROM o.total THEN RAISE EXCEPTION 'El monto del pago no coincide con el pedido.'; END IF;
 PERFORM public.consume_order_reservations(o.id,actor);
 UPDATE public.payments SET status='confirmado',confirmed_by=actor,confirmed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=p.id;
 UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=o.id;
END;
$function$;

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
    where phone = p_customer_phone
    limit 1;

  end if;


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
  limit 1;

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

  insert into public.payments (order_id, method, amount, status, confirmed_by, confirmed_at)
  values (v_order_id, p_payment_method, v_final_total, 'confirmado', v_seller_id, now());

  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, order_id, created_by
  ) values (
    v_cash_session_id, 'venta', p_payment_method, v_final_total, v_order_id, v_seller_id
  );

  return query
  select o.id, o.order_number, o.subtotal, o.discount_total, o.total
  from public.orders o
  where o.id = v_order_id;
end;
$function$;

-- Definición oficial propuesta: SOLO servidor, teléfono validado atómicamente.
CREATE OR REPLACE FUNCTION public.create_payment(p_order_id uuid, p_customer_phone text)
RETURNS TABLE(id uuid, amount numeric, method text, status text, order_number bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $payment$
DECLARE
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_pending_count integer;
BEGIN
  -- La ACL es la frontera servidor/cliente; la comprobación siguiente evita
  -- que un bug del servidor transforme un UUID ajeno en autorización de pago.
  SELECT o.* INTO v_order
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id AND o.deleted_at IS NULL
    AND nullif(trim(p_customer_phone), '') IS NOT NULL
    AND (c.phone = trim(p_customer_phone) OR c.whatsapp = trim(p_customer_phone))
  FOR UPDATE OF o;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'No encontramos un pedido con esos datos.';
  END IF;
  IF v_order.status <> 'pendiente_pago' OR v_order.order_type <> 'online' THEN
    RAISE EXCEPTION 'Este pedido ya no admite un pago nuevo.';
  END IF;
  IF v_order.total IS NULL OR v_order.total <= 0 OR v_order.total::text = 'NaN' THEN
    RAISE EXCEPTION 'El pedido no tiene un monto válido para reportar pago.';
  END IF;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until <= clock_timestamp() THEN
    RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
  END IF;
  PERFORM p.id FROM public.payments p WHERE p.order_id=p_order_id ORDER BY p.id FOR UPDATE;
  PERFORM ir.id FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id ORDER BY ir.inventory_item_id,ir.id FOR UPDATE;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until<=clock_timestamp() THEN RAISE EXCEPTION 'La reserva del pedido venció.'; END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id = p_order_id
             AND (ir.status <> 'reserved' OR ir.expires_at <= clock_timestamp())) THEN
    RAISE EXCEPTION 'La reserva del pedido ya no está vigente.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments p WHERE p.order_id = p_order_id AND p.status = 'confirmado') THEN
    RAISE EXCEPTION 'Este pedido ya tiene un pago confirmado.';
  END IF;
  SELECT count(*) INTO v_pending_count FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente';
  IF v_pending_count > 1 THEN
    RAISE EXCEPTION 'Hay pagos pendientes duplicados. Requiere revisión administrativa.';
  END IF;
  SELECT p.* INTO v_payment FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente' FOR UPDATE;
  IF v_payment.id IS NULL THEN
    INSERT INTO public.payments (order_id, method, amount, status)
    VALUES (p_order_id, 'qr', v_order.total, 'pendiente') RETURNING * INTO v_payment;
  ELSIF v_payment.amount IS DISTINCT FROM v_order.total OR v_payment.method <> 'qr' THEN
    RAISE EXCEPTION 'El pago pendiente no coincide con el pedido. Requiere revisión administrativa.';
  END IF;
  -- Reintentos serializados por el bloqueo del pedido reutilizan el mismo id.
  RETURN QUERY SELECT v_payment.id, v_payment.amount, v_payment.method, v_payment.status, v_order.order_number;
END;
$payment$;


CREATE OR REPLACE FUNCTION public.reject_payment(p_payment_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_rejected_by uuid;
  v_payment record;
begin
  v_rejected_by := auth.uid();

  if v_rejected_by is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para rechazar pagos.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo de rechazo es obligatorio.';
  end if;

  perform o.id from public.orders o where o.id=(select order_id from public.payments where id=p_payment_id) for update;
  perform id from public.payments where order_id=(select order_id from public.payments where id=p_payment_id) order by id for update;
  perform id from public.inventory_reservations where order_id=(select order_id from public.payments where id=p_payment_id) order by inventory_item_id,id for update;
  select id, order_id, status into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'El pago no existe.';
  end if;

  if v_payment.status <> 'pendiente' then
    raise exception 'Este pago ya fue procesado (estado actual: %).', v_payment.status;
  end if;

  update public.payments
  set status = 'rechazado', rejection_reason = p_reason,
      rejected_by = v_rejected_by, rejected_at = now(), updated_at = now()
  where id = p_payment_id;

  update public.orders
  set status = 'rechazado', updated_at = now()
  where id = v_payment.order_id;

  update public.inventory_reservations
  set status = 'released', released_at = now()
  where order_id = v_payment.order_id and status = 'reserved';
end;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_status text;
  v_movement record;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo de cancelación es obligatorio.';
  end if;

  select status into v_status from public.orders where id = p_order_id for update;

  if v_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_status in ('cancelado', 'finalizado', 'rechazado') then
    raise exception 'Un pedido en estado "%" no se puede cancelar.', v_status;
  end if;

  if v_status = 'pendiente_pago' then
    -- Todavía no hay dinero ni inventario consumido: cualquier
    -- miembro del personal puede cancelar, solo se libera la reserva.
    if not public.is_employee_or_admin() then
      raise exception 'No tienes permisos para cancelar pedidos.';
    end if;

    update public.inventory_reservations
    set status = 'released', released_at = now()
    where order_id = p_order_id and status = 'reserved';
  else
    -- Ya está pagado (confirmado/en_preparacion/listo): solo
    -- administrador, y se revierte el inventario real consumido.
    if not public.is_admin() then
      raise exception 'Solo un administrador puede cancelar una venta ya pagada.';
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
        v_movement.inventory_item_id, v_movement.lot_id, 'reversion', v_movement.quantity,
        'order', p_order_id, p_reason, v_actor_id
      );
    end loop;
  end if;

  update public.orders
  set status = 'cancelado', cancelled_at = now(), cancelled_by = v_actor_id,
      cancellation_reason = p_reason, updated_at = now()
  where id = p_order_id;
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

  if p_amount is null or p_amount <= 0 then
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

  return v_return_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.consume_product_inventory(p_product_id uuid, p_quantity_sold numeric, p_reference_type text, p_reference_id uuid, p_created_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  req record;
  lot record;
  total_needed numeric(12,3);
  available_total numeric(12,3);
  remaining_to_consume numeric(12,3);
  take_from_lot numeric(12,3);
begin
  if p_quantity_sold <= 0 then
    raise exception 'La cantidad vendida debe ser mayor que cero.';
  end if;

  -- PASO 1: verificar que HAY suficiente de TODOS los ingredientes
  -- antes de tocar nada (para que sea todo-o-nada).
  for req in
    select inventory_item_id, quantity
    from public.product_inventory_requirements
    where product_id = p_product_id
    order by inventory_item_id
  loop
    total_needed := req.quantity * p_quantity_sold;

    select current_stock into available_total
    from public.inventory_items
    where id = req.inventory_item_id
    for update;

    if available_total is null then
      raise exception 'El ítem de inventario % ya no existe.', req.inventory_item_id;
    end if;

    if available_total < total_needed then
      raise exception 'Stock insuficiente para vender % unidad(es): el ítem % tiene % y se necesitan %.',
        p_quantity_sold, req.inventory_item_id, available_total, total_needed;
    end if;
  end loop;

  -- PASO 2: ya confirmado que alcanza para todo, ahora sí se
  -- descuenta cada ingrediente en orden FIFO (lote más viejo primero).
  for req in
    select inventory_item_id, quantity
    from public.product_inventory_requirements
    where product_id = p_product_id
    order by inventory_item_id
  loop
    total_needed := req.quantity * p_quantity_sold;
    remaining_to_consume := total_needed;

    for lot in
      select id, remaining_quantity
      from public.inventory_lots
      where inventory_item_id = req.inventory_item_id
        and remaining_quantity > 0
      order by received_at asc, created_at asc, id asc
      for update
    loop
      exit when remaining_to_consume <= 0;

      take_from_lot := least(lot.remaining_quantity, remaining_to_consume);

      update public.inventory_lots
      set remaining_quantity = remaining_quantity - take_from_lot
      where id = lot.id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, created_by
      ) values (
        req.inventory_item_id, lot.id, 'salida', take_from_lot,
        p_reference_type, p_reference_id, p_created_by
      );

      remaining_to_consume := remaining_to_consume - take_from_lot;
    end loop;

    if remaining_to_consume > 0 then
      -- No debería pasar nunca si los lotes están sincronizados con
      -- current_stock, pero se protege por si acaso quedaron
      -- desincronizados.
      raise exception 'Inconsistencia de inventario: no se encontraron lotes suficientes para el ítem %.', req.inventory_item_id;
    end if;

    update public.inventory_items
    set current_stock = current_stock - total_needed,
        updated_at = now()
    where id = req.inventory_item_id;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_inventory_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform id from public.inventory_items where id=new.inventory_item_id for update;
  insert into public.inventory_lots (
    inventory_entry_id, inventory_item_id,
    initial_quantity, remaining_quantity, received_at
  ) values (
    new.id, new.inventory_item_id,
    new.quantity, new.quantity, new.received_at
  );

  update public.inventory_items
  set current_stock = current_stock + new.quantity,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, lot_id, movement_type, quantity,
    reference_type, reference_id, created_by
  )
  select new.inventory_item_id, l.id, 'entrada', new.quantity,
         'inventory_entry', new.id, new.created_by
  from public.inventory_lots l
  where l.inventory_entry_id = new.id;

  return new;
end;
$function$;
CREATE OR REPLACE TRIGGER protect_order_request_contract BEFORE UPDATE OF request_contract ON public.orders FOR EACH ROW EXECUTE FUNCTION public.protect_order_request_contract();
CREATE OR REPLACE TRIGGER validate_inventory_movement_actor BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_movement_actor();
ALTER FUNCTION public.consume_order_reservations(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.consume_order_reservations(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.consume_order_reservations(uuid,uuid) TO service_role;
ALTER FUNCTION public.protect_order_request_contract() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.protect_order_request_contract() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.validate_inventory_movement_actor() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_inventory_movement_actor() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
