-- ============================================================
-- NOVA FLORERÍA — FASE 5: PEDIDOS ONLINE
-- Migración 2/2: funciones de creación y cancelación de pedidos
-- ============================================================

-- ------------------------------------------------------------
-- Libera reservas vencidas (>30 min) de un ítem específico.
-- Se llama "al vuelo" antes de calcular disponibilidad, y
-- también puede llamarse manualmente desde el panel admin.
-- ------------------------------------------------------------
create or replace function public.release_expired_reservations(
  p_inventory_item_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.inventory_reservations
  set status = 'released', released_at = now()
  where status = 'reserved'
    and expires_at < now()
    and (p_inventory_item_id is null or inventory_item_id = p_inventory_item_id);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ------------------------------------------------------------
-- Crea un pedido completo de forma atómica:
--  - precio y nombre se recalculan del servidor (nunca del cliente)
--  - idempotency_key evita pedidos duplicados por doble clic
--  - reserva inventario (no lo consume) por 30 minutos
--  - todo-o-nada: si algún producto no tiene stock, no se crea nada
--
-- p_items: jsonb array de objetos:
--   { "product_id": "...", "quantity": 2, "personalization": {...},
--     "message": "...", "note": "..." }
-- ------------------------------------------------------------
create or replace function public.create_order(
  p_customer_id uuid,
  p_items jsonb,
  p_customer_message text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_order_id uuid;
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
  -- acumulador de necesidades totales por ítem de inventario, para
  -- validar y reservar todo junto, no producto por producto.
  v_item_needs jsonb := '{}'::jsonb;
  v_inv_item_id text;
  v_reserved_until timestamptz := now() + interval '30 minutes';
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto.';
  end if;

  -- IDEMPOTENCIA: si ya existe un pedido con esta misma clave
  -- (mismo intento, ej. doble clic), devolvemos el pedido existente
  -- en vez de crear uno nuevo.
  if p_idempotency_key is not null then
    select id into v_existing_order_id
    from public.orders
    where idempotency_key = p_idempotency_key;

    if v_existing_order_id is not null then
      return v_existing_order_id;
    end if;
  end if;

  -- PASO 1: validar cada producto y calcular precios desde el
  -- servidor. Acumular cuánto inventario se necesita en total.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price, is_active, is_available, is_sold_out
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if v_product.id is null then
      raise exception 'Uno de los productos del pedido ya no existe.';
    end if;

    if not v_product.is_active or not v_product.is_available or v_product.is_sold_out then
      raise exception 'El producto "%" ya no está disponible.', v_product.name;
    end if;

    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'La cantidad de "%" debe ser mayor que cero.', v_product.name;
    end if;

    -- Acumular necesidades de inventario de este producto (receta × cantidad)
    for v_req in
      select inventory_item_id, quantity
      from public.product_inventory_requirements
      where product_id = v_product.id
    loop
      v_needed := v_req.quantity * v_quantity;
      v_inv_item_id := v_req.inventory_item_id::text;
      v_item_needs := jsonb_set(
        v_item_needs, array[v_inv_item_id],
        to_jsonb(coalesce((v_item_needs->>v_inv_item_id)::numeric, 0) + v_needed)
      );
    end loop;
  end loop;

  -- PASO 2: liberar reservas vencidas de los ítems involucrados,
  -- y verificar que alcance el stock disponible para TODOS antes
  -- de reservar nada (todo-o-nada).
  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    perform public.release_expired_reservations(v_inv_item_id::uuid);

    select current_stock into v_available
    from public.inventory_items
    where id = v_inv_item_id::uuid
    for update;

    if v_available is null then
      raise exception 'Un ítem de inventario del pedido ya no existe.';
    end if;

    select coalesce(sum(quantity), 0) into v_already_reserved
    from public.inventory_reservations
    where inventory_item_id = v_inv_item_id::uuid
      and status = 'reserved';

    v_available := v_available - v_already_reserved;
    v_needed := (v_item_needs->>v_inv_item_id)::numeric;

    if v_available < v_needed then
      raise exception 'Stock insuficiente: solo hay % disponible (ya hay % reservado por otros pedidos) y se necesitan %.',
        v_available + v_already_reserved, v_already_reserved, v_needed;
    end if;
  end loop;

  -- PASO 3: crear el pedido y sus items (ya sabemos que alcanza).
  insert into public.orders (customer_id, status, customer_message, idempotency_key, reserved_until)
  values (p_customer_id, 'pendiente_pago', p_customer_message, p_idempotency_key, v_reserved_until)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    v_quantity := (v_item->>'quantity')::numeric;
    v_line_total := v_product.price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_snapshot,
      quantity, line_total, personalization, message, note
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price,
      v_quantity, v_line_total,
      v_item->'personalization', v_item->>'message', v_item->>'note'
    );
  end loop;

  update public.orders
  set subtotal = v_subtotal, total = v_subtotal
  where id = v_order_id;

  -- PASO 4: reservar el inventario acumulado.
  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    insert into public.inventory_reservations (
      order_id, inventory_item_id, quantity, status, expires_at
    ) values (
      v_order_id, v_inv_item_id::uuid,
      (v_item_needs->>v_inv_item_id)::numeric,
      'reserved', v_reserved_until
    );
  end loop;

  return v_order_id;
end;
$$;

-- ------------------------------------------------------------
-- Cancela un pedido: motivo obligatorio, libera sus reservas
-- (nunca borra el pedido, tal como exige el Maestro).
-- ------------------------------------------------------------
create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text,
  p_cancelled_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
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

  update public.orders
  set status = 'cancelado',
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      cancellation_reason = p_reason,
      updated_at = now()
  where id = p_order_id;

  update public.inventory_reservations
  set status = 'released', released_at = now()
  where order_id = p_order_id and status = 'reserved';
end;
$$;