-- ============================================================
-- NOVA FLORERÍA — FASE 10: CAJA
-- Migración 2/2: apertura, cierre, movimientos manuales, y
-- conexión con la venta física (Fase 8)
-- ============================================================

create or replace function public.open_cash_session(
  p_cash_register_id uuid,
  p_opening_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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

  if p_opening_amount is null or p_opening_amount < 0 then
    raise exception 'El monto de apertura no puede ser negativo.';
  end if;

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
$$;

grant execute on function public.open_cash_session(uuid, numeric) to authenticated;

-- ------------------------------------------------------------
-- Movimientos manuales (ingreso, gasto, ajuste, devolución).
-- 'venta' NUNCA se registra a mano aquí: nace automáticamente
-- desde create_physical_sale(), para que no se pueda "inventar"
-- una venta en la caja sin que exista el pedido real detrás.
-- ------------------------------------------------------------
create or replace function public.record_cash_movement(
  p_cash_session_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_direction text,
  p_reason text,
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_session_status text;
  v_movement_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para registrar movimientos de caja.';
  end if;

  if p_movement_type not in ('ingreso', 'gasto', 'ajuste', 'devolucion') then
    raise exception 'Tipo de movimiento no válido para registro manual.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor que cero.';
  end if;

  if p_movement_type in ('gasto', 'ajuste', 'devolucion') and (p_reason is null or trim(p_reason) = '') then
    raise exception 'El motivo es obligatorio para este tipo de movimiento.';
  end if;

  if p_movement_type = 'ajuste' then
    if p_direction not in ('entrada', 'salida') then
      raise exception 'Un ajuste debe indicar dirección: entrada o salida.';
    end if;
  elsif p_direction is not null then
    raise exception 'La dirección solo aplica a movimientos de tipo "ajuste".';
  end if;

  select status into v_session_status
  from public.cash_sessions
  where id = p_cash_session_id
  for update;

  if v_session_status is null then
    raise exception 'La sesión de caja no existe.';
  end if;

  if v_session_status = 'cerrada' then
    raise exception 'Esta caja ya está cerrada. Una caja cerrada no se modifica; corrige en la siguiente sesión.';
  end if;

  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, direction, order_id, reason, created_by
  ) values (
    p_cash_session_id, p_movement_type, 'efectivo', p_amount, p_direction, p_order_id, p_reason, v_actor_id
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

grant execute on function public.record_cash_movement(uuid, text, numeric, text, text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Cierre de caja. Calcula el esperado SOLO con movimientos en
-- efectivo (el QR no cuenta para el conteo físico, por decisión
-- de negocio). Una vez cerrada, no admite más movimientos.
-- ------------------------------------------------------------
create or replace function public.close_cash_session(
  p_session_id uuid,
  p_counted_amount numeric,
  p_closing_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_session record;
  v_net_movements numeric(12,2);
  v_expected numeric(12,2);
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para cerrar la caja.';
  end if;

  if p_counted_amount is null or p_counted_amount < 0 then
    raise exception 'El monto contado no puede ser negativo.';
  end if;

  select id, status, opening_amount into v_session
  from public.cash_sessions
  where id = p_session_id
  for update;

  if v_session.id is null then
    raise exception 'La sesión de caja no existe.';
  end if;

  if v_session.status = 'cerrada' then
    raise exception 'Esta sesión ya está cerrada.';
  end if;

  select coalesce(sum(
    case
      when movement_type in ('venta', 'ingreso') then amount
      when movement_type in ('gasto', 'devolucion') then -amount
      when movement_type = 'ajuste' and direction = 'entrada' then amount
      when movement_type = 'ajuste' and direction = 'salida' then -amount
      else 0
    end
  ), 0) into v_net_movements
  from public.cash_movements
  where cash_session_id = p_session_id
    and payment_method = 'efectivo';

  v_expected := v_session.opening_amount + v_net_movements;

  update public.cash_sessions
  set status = 'cerrada',
      closed_by = v_actor_id,
      closed_at = now(),
      expected_amount = v_expected,
      counted_amount = p_counted_amount,
      difference_amount = p_counted_amount - v_expected,
      closing_note = p_closing_note
  where id = p_session_id;
end;
$$;

grant execute on function public.close_cash_session(uuid, numeric, text) to authenticated;

-- ------------------------------------------------------------
-- create_physical_sale() — se reemplaza para EXIGIR una caja
-- abierta y registrar automáticamente el movimiento 'venta'
-- (efectivo o QR, ambos quedan en el historial de caja).
-- Misma firma que antes: el create or replace no genera una
-- sobrecarga nueva (aprendimos esa lección en Fase 9).
-- ------------------------------------------------------------
create or replace function public.create_physical_sale(
  p_items jsonb,
  p_discount_total numeric,
  p_payment_method text
)
returns table (
  id uuid,
  order_number bigint,
  subtotal numeric,
  discount_total numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_cash_session_id uuid;
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
  v_total numeric(12,2);
  v_discount numeric(12,2);
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

  -- NUEVO en Fase 10: exigir caja abierta.
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

  v_discount := coalesce(p_discount_total, 0);
  if v_discount < 0 then
    raise exception 'El descuento no puede ser negativo.';
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

  if v_discount > v_subtotal then
    raise exception 'El descuento (%) no puede ser mayor al subtotal (%).', v_discount, v_subtotal;
  end if;

  v_total := v_subtotal - v_discount;

  insert into public.orders (order_type, status, subtotal, discount_total, total)
  values ('fisica', 'confirmado', v_subtotal, v_discount, v_total)
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
  values (v_order_id, p_payment_method, v_total, 'confirmado', v_seller_id, now());

  -- NUEVO en Fase 10: registrar el movimiento de venta en la caja
  -- abierta (efectivo Y qr quedan en el historial, según decidiste).
  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, order_id, created_by
  ) values (
    v_cash_session_id, 'venta', p_payment_method, v_total, v_order_id, v_seller_id
  );

  return query
  select o.id, o.order_number, o.subtotal, o.discount_total, o.total
  from public.orders o
  where o.id = v_order_id;
end;
$$;

grant execute on function public.create_physical_sale(jsonb, numeric, text) to authenticated;