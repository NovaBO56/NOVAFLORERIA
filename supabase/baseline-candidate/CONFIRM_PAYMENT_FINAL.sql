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
