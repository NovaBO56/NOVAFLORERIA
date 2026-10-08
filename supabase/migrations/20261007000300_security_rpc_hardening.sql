-- Hardening RPC de la cadena activa local certificada.
-- Independiente de checkout/tracking; no modifica el historial remoto.
-- Aplicar después de la baseline en instalaciones nuevas/vacías; no borra datos.
-- Compatibilidad histórica: revoca acceso a create_order(6) si existe; no lo crea.
BEGIN;
SET LOCAL search_path = public, extensions, pg_catalog;

CREATE OR REPLACE FUNCTION public.release_expired_reservations(p_inventory_item_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  affected integer;
  v_order_ids uuid[];
begin
  with released as (
    update public.inventory_reservations
    set status = 'released', released_at = now()
    where status = 'reserved'
      and expires_at < now()
      and (p_inventory_item_id is null or inventory_item_id = p_inventory_item_id)
    returning order_id
  )
  select array_agg(distinct order_id), count(*)
  into v_order_ids, affected
  from released;

  if v_order_ids is not null then
    update public.orders o
    set status = 'cancelado',
        cancelled_at = now(),
        cancellation_reason = 'Reserva de inventario vencida: no se confirmó el pago dentro de los 30 minutos.',
        updated_at = now()
    where o.id = any(v_order_ids)
      and o.status = 'pendiente_pago';
  end if;

  return coalesce(affected, 0);
end;
$function$;

create or replace function public.confirm_payment(
  p_payment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmed_by uuid;
  v_payment record;
  v_order public.orders%rowtype;
  v_reservation record;
  v_invalid_reservations integer;
  v_lot record;
  v_remaining_to_consume numeric(12,3);
  v_take_from_lot numeric(12,3);
begin
  v_confirmed_by := auth.uid();

  if v_confirmed_by is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para confirmar pagos.';
  end if;

  -- Orden de bloqueos: pedido antes de pago, igual que create_payment.
  select o.* into v_order from public.orders o
  where o.id = (select p.order_id from public.payments p where p.id = p_payment_id)
  for update;

  select id, order_id, status, amount into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'El pago no existe.';
  end if;

  if v_payment.status <> 'pendiente' then
    raise exception 'Este pago ya fue procesado (estado actual: %). No se puede confirmar dos veces.', v_payment.status;
  end if;

  if v_order.id is null or v_order.deleted_at is not null
     or v_order.status <> 'pendiente_pago' or v_order.order_type <> 'online' then
    raise exception 'El pedido ya no admite confirmación de pago.';
  end if;
  if v_order.total <= 0 or v_order.total::text = 'NaN' or v_payment.amount is distinct from v_order.total then
    raise exception 'El monto del pago no coincide con el pedido.';
  end if;
  if v_order.reserved_until is not null and v_order.reserved_until <= now() then
    raise exception 'La reserva del pedido venció. No se puede confirmar el pago.';
  end if;

  -- Bloquea TODAS las reservas de este pedido antes de decidir nada,
  -- para que nadie las libere a mitad de la confirmación.
  perform 1 from public.inventory_reservations
  where order_id = v_payment.order_id
  for update;

  -- Libera cualquier reserva vencida que aún no se haya marcado.
  update public.inventory_reservations
  set status = 'released', released_at = now()
  where order_id = v_payment.order_id
    and status = 'reserved'
    and expires_at <= now();

  -- Si CUALQUIER reserva de este pedido ya no está "reserved" (venció
  -- o se liberó), el inventario detrás de este pedido ya no está
  -- garantizado. Se rechaza ANTES de tocar payments/orders.
  select count(*) into v_invalid_reservations
  from public.inventory_reservations
  where order_id = v_payment.order_id
    and status <> 'reserved';

  if v_invalid_reservations > 0 then
    raise exception 'La reserva de inventario de este pedido venció o fue liberada. No se puede confirmar el pago; cancela este pedido y crea uno nuevo para volver a reservar stock.';
  end if;

  -- Recién ahora, con el inventario garantizado, se confirma.
  update public.payments
  set status = 'confirmado', confirmed_by = v_confirmed_by, confirmed_at = now(), updated_at = now()
  where id = p_payment_id;

  update public.orders
  set status = 'confirmado', updated_at = now()
  where id = v_payment.order_id;

  for v_reservation in
    select id, inventory_item_id, quantity
    from public.inventory_reservations
    where order_id = v_payment.order_id and status = 'reserved'
  loop
    v_remaining_to_consume := v_reservation.quantity;

    for v_lot in
      select id, remaining_quantity
      from public.inventory_lots
      where inventory_item_id = v_reservation.inventory_item_id
        and remaining_quantity > 0
      order by received_at asc, created_at asc
      for update
    loop
      exit when v_remaining_to_consume <= 0;

      v_take_from_lot := least(v_lot.remaining_quantity, v_remaining_to_consume);

      update public.inventory_lots
      set remaining_quantity = remaining_quantity - v_take_from_lot
      where id = v_lot.id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, created_by
      ) values (
        v_reservation.inventory_item_id, v_lot.id, 'salida', v_take_from_lot,
        'order', v_payment.order_id, v_confirmed_by
      );

      v_remaining_to_consume := v_remaining_to_consume - v_take_from_lot;
    end loop;

    if v_remaining_to_consume > 0 then
      raise exception 'Inconsistencia de inventario al confirmar el pago: no quedan lotes suficientes para el ítem %.', v_reservation.inventory_item_id;
    end if;

    update public.inventory_items
    set current_stock = current_stock - v_reservation.quantity, updated_at = now()
    where id = v_reservation.inventory_item_id;

    update public.inventory_reservations
    set status = 'consumed', released_at = now()
    where id = v_reservation.id;
  end loop;
end;
$$;

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

  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    perform public.release_expired_reservations(v_inv_item_id::uuid);

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

  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    v_remaining_to_consume := (v_item_needs->>v_inv_item_id)::numeric;

    for v_lot_id, v_lot_remaining in
      select il.id, il.remaining_quantity
      from public.inventory_lots il
      where il.inventory_item_id = v_inv_item_id::uuid and il.remaining_quantity > 0
      order by il.received_at asc, il.created_at asc
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

CREATE OR REPLACE FUNCTION public.advance_order_status(p_order_id uuid, p_new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_current_status text;
  v_valid_next text;
begin
  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para cambiar el estado de un pedido.';
  end if;

  select status into v_current_status from public.orders where id = p_order_id for update;

  if v_current_status is null then
    raise exception 'El pedido no existe.';
  end if;

  v_valid_next := case v_current_status
    when 'confirmado' then 'en_preparacion'
    when 'en_preparacion' then 'listo'
    when 'listo' then 'finalizado'
    else null
  end;

  if v_valid_next is null or p_new_status <> v_valid_next then
    raise exception 'No se puede pasar el pedido de "%" a "%". El siguiente paso válido es "%".',
      v_current_status, p_new_status, coalesce(v_valid_next, 'ninguno (estado final)');
  end if;

  update public.orders set status = p_new_status, updated_at = now() where id = p_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_existing_order_id uuid;
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

  if p_idempotency_key is not null then

    select id
    into v_existing_order_id
    from public.orders
    where idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_order_id is not null then
      return v_existing_order_id;
    end if;

  end if;


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

  for v_inv_item_id in
    select jsonb_object_keys(v_item_needs)
  loop

    -- Liberar reservas vencidas antes de comprobar
    -- disponibilidad.
    perform public.release_expired_reservations(
      v_inv_item_id::uuid
    );


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
    reserved_until
  )
  values (
    v_customer_id,
    'pendiente_pago',
    p_customer_message,
    p_idempotency_key,
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
    select jsonb_object_keys(v_item_needs)
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

  return v_order_id;

end;
$function$;

-- Contrato certificado: SOLO servidor, teléfono validado atómicamente.
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
  FOR UPDATE OF o, c;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'No encontramos un pedido con esos datos.';
  END IF;
  IF v_order.status <> 'pendiente_pago' OR v_order.order_type <> 'online' THEN
    RAISE EXCEPTION 'Este pedido ya no admite un pago nuevo.';
  END IF;
  IF v_order.total IS NULL OR v_order.total <= 0 OR v_order.total::text = 'NaN' THEN
    RAISE EXCEPTION 'El pedido no tiene un monto válido para reportar pago.';
  END IF;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until <= now() THEN
    RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id = p_order_id
             AND (ir.status <> 'reserved' OR ir.expires_at <= now())) THEN
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


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $new_user$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'empleado', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$new_user$;

REVOKE ALL ON FUNCTION public."notify_order_ready"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_order_ready"() TO service_role;

REVOKE ALL ON FUNCTION public."is_active_user"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_active_user"() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."is_admin"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_admin"() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."is_employee_or_admin"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_employee_or_admin"() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."handle_new_user"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO service_role;

REVOKE ALL ON FUNCTION public."handle_inventory_entry"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_entry"() TO service_role;

REVOKE ALL ON FUNCTION public."handle_inventory_waste"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_waste"() TO service_role;

REVOKE ALL ON FUNCTION public."handle_inventory_adjustment"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_adjustment"() TO service_role;

REVOKE ALL ON FUNCTION public."consume_product_inventory"(uuid, numeric, text, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."consume_product_inventory"(uuid, numeric, text, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public."release_expired_reservations"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."release_expired_reservations"(uuid) TO service_role;

REVOKE ALL ON FUNCTION public."advance_order_status"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."advance_order_status"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."close_cash_session"(uuid, numeric, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."close_cash_session"(uuid, numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."reject_payment"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."reject_payment"(uuid, text) TO authenticated, service_role;

-- Instalación limpia: firma ausente. Delta histórico: retirada explícita RESTRICT.
-- Sin CASCADE: cualquier dependencia aborta la transacción y debe investigarse.
DO $retire_payment_uuid$
BEGIN
  IF to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.create_payment(uuid) FROM PUBLIC, anon, authenticated, service_role';
    EXECUTE 'DROP FUNCTION public.create_payment(uuid) RESTRICT';
  END IF;
END;
$retire_payment_uuid$;

REVOKE ALL ON FUNCTION public."cancel_order"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."cancel_order"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."create_sale_return"(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_sale_return"(uuid, text, numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."record_cash_movement"(uuid, text, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."record_cash_movement"(uuid, text, numeric, text, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."request_order_deletion"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."request_order_deletion"(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."review_order_deletion_request"(uuid, boolean, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."review_order_deletion_request"(uuid, boolean, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."can_delete_cancelled_order"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."can_delete_cancelled_order"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."open_cash_session"(uuid, numeric) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."open_cash_session"(uuid, numeric) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."get_business_status"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."get_business_status"() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."notify_stock_alert"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_stock_alert"() TO service_role;

REVOKE ALL ON FUNCTION public."create_order"(text, text, text, jsonb, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_order"(text, text, text, jsonb, text, text, uuid) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."apply_order_discount"(uuid, numeric, uuid, uuid, numeric, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."apply_order_discount"(uuid, numeric, uuid, uuid, numeric, text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public."notify_pending_payment"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_pending_payment"() TO service_role;

REVOKE ALL ON FUNCTION public."confirm_payment"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."confirm_payment"(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."notify_new_order"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_new_order"() TO service_role;

REVOKE ALL ON FUNCTION public."check_rate_limit"(text, text, integer, integer) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."check_rate_limit"(text, text, integer, integer) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."audit_products_change"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."audit_products_change"() TO service_role;

REVOKE ALL ON FUNCTION public."get_audit_trail"(integer, integer) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."get_audit_trail"(integer, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public."track_order"(bigint, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."track_order"(bigint, text) TO anon, authenticated, service_role;

DO $obsolete$ BEGIN IF to_regprocedure('public.create_order(text,text,text,jsonb,text,text)') IS NOT NULL THEN EXECUTE 'REVOKE ALL ON FUNCTION public."create_order"(text, text, text, jsonb, text, text) FROM PUBLIC, anon, authenticated, service_role;'; END IF; END; $obsolete$;

REVOKE ALL ON FUNCTION public."create_physical_sale"(jsonb, uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_physical_sale"(jsonb, uuid, uuid, numeric, text, text) TO authenticated, service_role;

ALTER FUNCTION public.create_payment(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_payment(uuid,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid,text) TO service_role;
-- create_payment(uuid) ya no existe; solo queda el contrato privado de dos argumentos.
-- La firma create_order(6) no existe en instalaciones limpias; aquí no se elimina.
COMMIT;
