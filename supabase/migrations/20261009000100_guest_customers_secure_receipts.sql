-- Incremental LOCAL/TEST validation candidate. Never replay baseline on existing data.
-- Preserves historical customer links; new online orders keep immutable guest snapshots.
-- No historical rows are deleted. Receipt tokens are bearer secrets, disclosed after payment confirmation.
BEGIN;
ALTER TABLE public.orders ADD COLUMN guest_name text, ADD COLUMN guest_phone text,
 ADD COLUMN guest_whatsapp text, ADD COLUMN receipt_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX orders_receipt_token_unique ON public.orders(receipt_token);
-- Existing links remain the legacy fallback; do not manufacture snapshots from today's customer data.
CREATE OR REPLACE FUNCTION public.protect_order_guest_snapshot() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF (NEW.guest_name,NEW.guest_phone,NEW.guest_whatsapp,NEW.receipt_token) IS DISTINCT FROM
    (OLD.guest_name,OLD.guest_phone,OLD.guest_whatsapp,OLD.receipt_token) THEN
  RAISE EXCEPTION 'La identidad original y el token del pedido no pueden modificarse.';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_order_guest_immutable BEFORE UPDATE ON public.orders
 FOR EACH ROW EXECUTE FUNCTION public.protect_order_guest_snapshot();
REVOKE ALL ON FUNCTION public.protect_order_guest_snapshot() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.materialize_order_customer(p_order_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders%rowtype; cid uuid;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL THEN RAISE EXCEPTION 'El pedido no existe.'; END IF;
 -- Historical customer relationship is retained without rewriting its identity.
 IF o.customer_id IS NOT NULL THEN RETURN o.customer_id; END IF;
 IF o.guest_name IS NULL OR o.guest_phone IS NULL THEN RAISE EXCEPTION 'Faltan datos originales del cliente.'; END IF;
 IF o.total<>0 AND NOT EXISTS(SELECT 1 FROM public.payments WHERE order_id=o.id AND status='confirmado' AND confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'El cliente se registra únicamente después de confirmar.';
 END IF;
 -- Different paid orders for the same phone serialize customer creation/update.
 PERFORM pg_advisory_xact_lock(hashtextextended('customer-phone:'||o.guest_phone,0));
 SELECT id INTO cid FROM public.customers WHERE phone=o.guest_phone ORDER BY id LIMIT 1 FOR UPDATE;
 IF cid IS NULL THEN
  INSERT INTO public.customers(name,phone,whatsapp) VALUES(o.guest_name,o.guest_phone,o.guest_whatsapp) RETURNING id INTO cid;
 ELSE
  UPDATE public.customers SET name=o.guest_name,whatsapp=coalesce(o.guest_whatsapp,whatsapp) WHERE id=cid;
 END IF;
 UPDATE public.orders SET customer_id=cid WHERE id=o.id;
 RETURN cid;
END; $$;
REVOKE ALL ON FUNCTION public.materialize_order_customer(uuid) FROM PUBLIC,anon,authenticated,service_role;


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
  -- Guest snapshot: no customer record until effective confirmation.
  v_customer_id := NULL;

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
    customer_id, guest_name, guest_phone, guest_whatsapp,
    status,
    customer_message,
    idempotency_key,
    request_contract,
    reserved_until
  )
  values (
    v_customer_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_whatsapp), ''),
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
   PERFORM public.materialize_order_customer(v_order_id);
   UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=v_order_id;
  END IF;
  return v_order_id;

end;
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
 PERFORM public.materialize_order_customer(o.id);
 UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=o.id;
END;
$function$;

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
  FROM public.orders o LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id AND o.deleted_at IS NULL
    AND nullif(trim(p_customer_phone), '') IS NOT NULL
    AND (coalesce(o.guest_phone,c.phone) = trim(p_customer_phone) OR coalesce(o.guest_whatsapp,c.whatsapp) = trim(p_customer_phone))
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
  PERFORM p.id FROM public.payments p WHERE p.order_id=p_order_id ORDER BY p.id FOR UPDATE;
  PERFORM ir.id FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id ORDER BY ir.inventory_item_id,ir.id FOR UPDATE;
  SELECT count(*) INTO v_pending_count FROM public.payments p WHERE p.order_id=p_order_id AND p.status='pendiente';
  IF v_pending_count>1 THEN RAISE EXCEPTION 'Hay pagos pendientes duplicados. Requiere revisión administrativa.'; END IF;
  SELECT p.* INTO v_payment FROM public.payments p WHERE p.order_id=p_order_id AND p.status='pendiente';
  IF v_payment.id IS NOT NULL THEN
    IF v_payment.amount IS DISTINCT FROM v_order.total OR v_payment.method<>'qr' THEN RAISE EXCEPTION 'El pago pendiente no coincide con el pedido.'; END IF;
  ELSE
    IF v_order.reserved_until IS NULL OR v_order.reserved_until<=clock_timestamp() OR EXISTS
      (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id AND (ir.status<>'reserved' OR ir.expires_at<=clock_timestamp())) THEN
      RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
    END IF;
    IF EXISTS(SELECT 1 FROM public.payments p WHERE p.order_id=p_order_id AND p.status='confirmado') THEN RAISE EXCEPTION 'Este pedido ya tiene un pago confirmado.'; END IF;
    INSERT INTO public.payments(order_id,method,amount,status) VALUES(p_order_id,'qr',v_order.total,'pendiente') RETURNING * INTO v_payment;
  END IF;
  -- Mantener la reserva hasta revisión. No consume stock ni registra caja.
  UPDATE public.orders SET reserved_until=NULL,updated_at=clock_timestamp() WHERE orders.id=p_order_id;
  UPDATE public.inventory_reservations SET expires_at='infinity'::timestamptz WHERE order_id=p_order_id AND inventory_reservations.status='reserved';
  -- Reintentos serializados por el bloqueo del pedido reutilizan el mismo id.
  RETURN QUERY SELECT v_payment.id, v_payment.amount, v_payment.method, v_payment.status, v_order.order_number;
END;
$payment$;

CREATE OR REPLACE FUNCTION public.track_order(p_order_number bigint, p_customer_phone text)
 RETURNS TABLE(order_number bigint, status text, order_type text, subtotal numeric, discount_total numeric, total numeric, customer_message text, created_at timestamp with time zone, updated_at timestamp with time zone, items jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid;
begin
  if p_order_number is null or p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Número de pedido y teléfono son obligatorios.';
  end if;

  select o.id into v_order_id
  from public.orders o
  left join public.customers c on c.id = o.customer_id
  where o.order_number = p_order_number
    and o.deleted_at is null
    and (coalesce(o.guest_phone,c.phone) = trim(p_customer_phone) or coalesce(o.guest_whatsapp,c.whatsapp) = trim(p_customer_phone));

  if v_order_id is null then
    raise exception 'No encontramos un pedido con ese número y teléfono.';
  end if;

  return query
  select
    o.order_number,
    o.status,
    o.order_type,
    o.subtotal,
    o.discount_total,
    o.total,
    o.customer_message,
    o.created_at,
    o.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', oi.product_name_snapshot,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price_snapshot,
            'line_total', oi.line_total,
            'personalization', oi.personalization,
            'message', oi.message,
            'note', oi.note
          )
          order by oi.created_at asc
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.id = v_order_id;
end;
$function$;

-- Extiende la consulta pública existente sin abrir RLS ni exponer datos administrativos.
create or replace function public.track_order_details(
  p_customer_phone text, p_order_number bigint default null, p_order_id uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_order public.orders%rowtype; v_summary jsonb;
begin
  select o.* into v_order from public.orders o
  left join public.customers c on c.id = o.customer_id
  where (case when p_order_number is not null then o.order_number = p_order_number else o.id = p_order_id end)
    and o.deleted_at is null
    and (coalesce(o.guest_phone,c.phone) = trim(p_customer_phone) or coalesce(o.guest_whatsapp,c.whatsapp) = trim(p_customer_phone));
  if v_order.id is null then
    raise exception 'No encontramos un pedido con esos datos.';
  end if;
  select to_jsonb(t) into v_summary from public.track_order(v_order.order_number, trim(p_customer_phone)) t;
  return v_summary || jsonb_build_object(
    'id', v_order.id, 'reserved_until', v_order.reserved_until,
    'receipt_token', CASE WHEN EXISTS(SELECT 1 FROM public.payments p WHERE p.order_id=v_order.id AND p.status='confirmado' AND p.confirmed_at IS NOT NULL) THEN v_order.receipt_token ELSE NULL END,
    'payment_status', (select p.status from public.payments p where p.order_id = v_order.id order by p.created_at desc, p.id desc limit 1)
  );
end;
$$;
revoke all on function public.track_order_details(text, bigint, uuid) from public;
grant execute on function public.track_order_details(text, bigint, uuid) to anon, authenticated;



CREATE OR REPLACE FUNCTION public.get_public_order_receipt(p_token uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('order_number',o.order_number,'order_type',o.order_type,'status',o.status,
  'created_at',o.created_at,'paid_at',p.confirmed_at,'customer_name',coalesce(o.guest_name,c.name),
  'customer_phone',coalesce(o.guest_phone,c.phone),'customer_message',o.customer_message,
  'subtotal',o.subtotal,'discount_total',o.discount_total,'total',o.total,
  'payment_method',p.method,'payment_status',p.status,
  'items',(SELECT coalesce(jsonb_agg(jsonb_build_object('product_name',i.product_name_snapshot,
    'quantity',i.quantity,'unit_price',i.unit_price_snapshot,'line_total',i.line_total) ORDER BY i.created_at,i.id),'[]'::jsonb)
    FROM public.order_items i WHERE i.order_id=o.id))
 FROM public.orders o LEFT JOIN public.customers c ON c.id=o.customer_id
 JOIN LATERAL (SELECT * FROM public.payments WHERE order_id=o.id AND status='confirmado' AND confirmed_at IS NOT NULL
  ORDER BY confirmed_at DESC,id DESC LIMIT 1) p ON true
 WHERE o.receipt_token=p_token AND o.deleted_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.get_public_order_receipt(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_receipt(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.create_payment(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid,text) TO service_role;
COMMIT;
