-- ============================================================
-- NOVA FLORERÍA — FASE 3: INVENTARIO
-- Migración 2/2: generación automática de lotes + movimientos
-- ============================================================

-- ------------------------------------------------------------
-- 1. Al insertar una ENTRADA: crear el lote automáticamente,
--    sumar al stock del ítem, y dejar registro en el historial.
-- ------------------------------------------------------------
create or replace function public.handle_inventory_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
$$;

drop trigger if exists trg_inventory_entry_created on public.inventory_entries;
create trigger trg_inventory_entry_created
after insert on public.inventory_entries
for each row execute function public.handle_inventory_entry();

-- ------------------------------------------------------------
-- 2. Al insertar una MERMA: descontar del lote (si se indicó)
--    y del stock total. Nunca permite negativos.
-- ------------------------------------------------------------
create or replace function public.handle_inventory_waste()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lot_remaining numeric(12,3);
  item_stock numeric(12,3);
begin
  select current_stock into item_stock
  from public.inventory_items
  where id = new.inventory_item_id
  for update;

  if item_stock is null then
    raise exception 'El ítem de inventario no existe.';
  end if;

  if item_stock < new.quantity then
    raise exception 'Stock insuficiente: hay % y se quiere registrar una merma de %.', item_stock, new.quantity;
  end if;

  if new.lot_id is not null then
    select remaining_quantity into lot_remaining
    from public.inventory_lots
    where id = new.lot_id
    for update;

    if lot_remaining is null then
      raise exception 'El lote indicado no existe.';
    end if;

    if lot_remaining < new.quantity then
      raise exception 'El lote solo tiene % disponible, no se pueden dar de baja %.', lot_remaining, new.quantity;
    end if;

    update public.inventory_lots
    set remaining_quantity = remaining_quantity - new.quantity
    where id = new.lot_id;
  end if;

  update public.inventory_items
  set current_stock = current_stock - new.quantity,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, lot_id, movement_type, quantity,
    reference_type, reference_id, reason, created_by
  ) values (
    new.inventory_item_id, new.lot_id, 'merma', new.quantity,
    'inventory_waste', new.id, new.reason, new.created_by
  );

  return new;
end;
$$;

drop trigger if exists trg_inventory_waste_created on public.inventory_waste;
create trigger trg_inventory_waste_created
after insert on public.inventory_waste
for each row execute function public.handle_inventory_waste();

-- ------------------------------------------------------------
-- 3. Al insertar un AJUSTE: sumar/restar quantity_delta al
--    stock total. Nunca permite que quede negativo.
-- ------------------------------------------------------------
create or replace function public.handle_inventory_adjustment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_stock numeric(12,3);
begin
  select current_stock into item_stock
  from public.inventory_items
  where id = new.inventory_item_id
  for update;

  if item_stock is null then
    raise exception 'El ítem de inventario no existe.';
  end if;

  if item_stock + new.quantity_delta < 0 then
    raise exception 'El ajuste dejaría el stock en negativo (actual: %, ajuste: %).', item_stock, new.quantity_delta;
  end if;

  update public.inventory_items
  set current_stock = current_stock + new.quantity_delta,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, movement_type, quantity,
    reference_type, reference_id, reason, created_by
  ) values (
    new.inventory_item_id, 'ajuste', abs(new.quantity_delta),
    'inventory_adjustment', new.id, new.reason, new.created_by
  );

  return new;
end;
$$;

drop trigger if exists trg_inventory_adjustment_created on public.inventory_adjustments;
create trigger trg_inventory_adjustment_created
after insert on public.inventory_adjustments
for each row execute function public.handle_inventory_adjustment();