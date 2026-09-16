-- ============================================================
-- NOVA FLORERÍA — FASE 4: ARREGLOS Y CONSUMO DE INVENTARIO
-- Migración 2/2: función de consumo FIFO
--
-- Todavía no existe "vender" (eso es Fase 5/8), así que esta
-- función se prueba llamándola directamente. Cuando exista un
-- pedido o venta física, esa fase la llamará con su propio
-- reference_type/reference_id.
-- ============================================================

create or replace function public.consume_product_inventory(
  p_product_id uuid,
  p_quantity_sold numeric,
  p_reference_type text,
  p_reference_id uuid,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
  loop
    total_needed := req.quantity * p_quantity_sold;
    remaining_to_consume := total_needed;

    for lot in
      select id, remaining_quantity
      from public.inventory_lots
      where inventory_item_id = req.inventory_item_id
        and remaining_quantity > 0
      order by received_at asc, created_at asc
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
$$;