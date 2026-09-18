-- ============================================================
-- NOVA FLORERÍA — FASE 6: PAGO QR
-- Migración 2/2: funciones de creación, confirmación y rechazo
-- ============================================================

create or replace function public.create_payment(
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing_payment_id uuid;
  v_payment_id uuid;
begin
  select id, status, total into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order.status <> 'pendiente_pago' then
    raise exception 'Este pedido ya no admite un pago nuevo (estado actual: %).', v_order.status;
  end if;

  select id into v_existing_payment_id
  from public.payments
  where order_id = p_order_id and status = 'pendiente';

  if v_existing_payment_id is not null then
    return v_existing_payment_id;
  end if;

  insert into public.payments (order_id, method, amount, status)
  values (p_order_id, 'qr', v_order.total, 'pendiente')
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

-- ------------------------------------------------------------
-- Confirma un pago. Corregido tras revisión:
--  1. Verifica rol internamente (no depende solo del GRANT).
--  2. confirmed_by sale de auth.uid(), nunca de un parámetro.
--  3. Si la reserva del pedido venció/se liberó, rechaza ANTES
--     de marcar nada como confirmado.
--  4. Toda la validación ocurre antes de cualquier UPDATE, para
--     no depender únicamente del rollback automático ante error.
-- ------------------------------------------------------------
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

  select id, order_id, status into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'El pago no existe.';
  end if;

  if v_payment.status <> 'pendiente' then
    raise exception 'Este pago ya fue procesado (estado actual: %). No se puede confirmar dos veces.', v_payment.status;
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
    and expires_at < now();

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

-- ------------------------------------------------------------
-- Rechaza un pago. Mismas correcciones: rol verificado
-- internamente, rejected_by desde auth.uid().
-- ------------------------------------------------------------
create or replace function public.reject_payment(
  p_payment_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- ------------------------------------------------------------
-- Permisos: crear pago pendiente es público (checkout); confirmar
-- y rechazar exigen sesión Y ahora también verifican el rol
-- dentro de la función misma (no dependen solo de este GRANT).
-- ------------------------------------------------------------
grant execute on function public.create_payment(uuid) to anon, authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;