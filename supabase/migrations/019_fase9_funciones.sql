-- ============================================================
-- NOVA FLORERÍA — FASE 9: CANCELACIONES, DEVOLUCIONES Y ELIMINACIÓN
-- Migración 2/2: funciones
-- ============================================================

-- ------------------------------------------------------------
-- cancel_order() — REEMPLAZA la versión de Fase 5. Ahora detecta
-- si el pedido ya fue pagado:
--   - pendiente_pago: comportamiento original (libera reservas,
--     lo puede hacer empleado o admin — todavía no hay dinero
--     de por medio).
--   - confirmado/en_preparacion/listo (YA PAGADO): exige
--     administrador, y REVIERTE el inventario ya consumido
--     (vuelve a los mismos lotes de donde salió). El pago NO se
--     marca como reembolsado automáticamente — eso es una acción
--     aparte, a propósito.
-- ------------------------------------------------------------
create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.cancel_order(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- create_sale_return() — devolución/reintegro de una venta YA
-- FINALIZADA. Tipo 'devolucion' (el cliente regresa el producto
-- físico): repone TODO el inventario de ese pedido, y solo se
-- permite una vez por pedido. Tipo 'reintegro': solo el registro
-- financiero, sin tocar inventario. En ambos casos, el monto
-- acumulado de devoluciones no puede superar el total del pedido.
-- ------------------------------------------------------------
create or replace function public.create_sale_return(
  p_order_id uuid,
  p_type text,
  p_amount numeric,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.create_sale_return(uuid, text, numeric, text) to authenticated;

-- ------------------------------------------------------------
-- request_order_deletion() — cualquier personal puede pedir
-- eliminar un pedido YA CANCELADO. No borra nada todavía.
-- ------------------------------------------------------------
create or replace function public.request_order_deletion(
  p_order_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_order_status text;
  v_deleted_at timestamptz;
  v_existing_pending integer;
  v_request_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para solicitar la eliminación de un pedido.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo es obligatorio.';
  end if;

  select status, deleted_at into v_order_status, v_deleted_at
  from public.orders where id = p_order_id;

  if v_order_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order_status <> 'cancelado' then
    raise exception 'Solo se puede solicitar eliminar un pedido cancelado (estado actual: %).', v_order_status;
  end if;

  if v_deleted_at is not null then
    raise exception 'Este pedido ya fue eliminado.';
  end if;

  select count(*) into v_existing_pending
  from public.order_deletion_requests
  where order_id = p_order_id and status = 'pendiente';

  if v_existing_pending > 0 then
    raise exception 'Ya existe una solicitud de eliminación pendiente para este pedido.';
  end if;

  insert into public.order_deletion_requests (order_id, requested_by, reason)
  values (p_order_id, v_actor_id, p_reason)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.request_order_deletion(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- review_order_deletion_request() — solo administrador aprueba
-- o rechaza. Si aprueba, marca deleted_at (eliminación lógica,
-- nunca un DELETE real).
-- ------------------------------------------------------------
create or replace function public.review_order_deletion_request(
  p_request_id uuid,
  p_approve boolean,
  p_review_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_request record;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede revisar solicitudes de eliminación.';
  end if;

  if p_review_reason is null or trim(p_review_reason) = '' then
    raise exception 'El motivo de la revisión es obligatorio.';
  end if;

  select id, order_id, status into v_request
  from public.order_deletion_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'La solicitud no existe.';
  end if;

  if v_request.status <> 'pendiente' then
    raise exception 'Esta solicitud ya fue revisada (estado actual: %).', v_request.status;
  end if;

  if p_approve and not public.can_delete_cancelled_order(v_request.order_id) then
    raise exception 'Este pedido ya no cumple las condiciones para ser eliminado.';
  end if;

  update public.order_deletion_requests
  set status = case when p_approve then 'aprobada' else 'rechazada' end,
      reviewed_by = v_actor_id, reviewed_at = now(), review_reason = p_review_reason
  where id = p_request_id;

  if p_approve then
    update public.orders set deleted_at = now() where id = v_request.order_id;
  end if;
end;
$$;

grant execute on function public.review_order_deletion_request(uuid, boolean, text) to authenticated;