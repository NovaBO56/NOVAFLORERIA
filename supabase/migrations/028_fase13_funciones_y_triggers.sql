-- ============================================================
-- NOVA FLORERÍA — FASE 13: NOTIFICACIONES Y HORARIOS
-- Migración 2/2: funciones y triggers
--
-- NOTA: estas piezas ya fueron aplicadas manualmente en Supabase
-- durante el desarrollo de esta fase, en bloques separados por
-- el SQL Editor. Este archivo las consolida en el repositorio
-- para cumplir la regla del Maestro de que todo cambio de
-- esquema quede versionado — no reemplaza lo ya aplicado, es
-- seguro de re-ejecutar (create or replace / drop if exists).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Semilla del interruptor de "aceptar pedidos fuera de horario"
-- ------------------------------------------------------------
insert into public.system_settings (key, value, is_critical)
select 'accept_orders_outside_hours', '{"enabled": false}'::jsonb, true
where not exists (select 1 from public.system_settings where key = 'accept_orders_outside_hours');

-- ------------------------------------------------------------
-- 2. get_business_status() — estado del horario en tiempo real
-- ------------------------------------------------------------
create or replace function public.get_business_status()
returns table (
  is_open boolean,
  opens_at time,
  closes_at time,
  is_closed_today boolean,
  accept_orders_outside_hours boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_now timestamptz;
  v_day_of_week smallint;
  v_local_time time;
  v_hours record;
  v_accept_outside boolean;
begin
  v_local_now := now() at time zone 'America/La_Paz';
  v_day_of_week := extract(dow from v_local_now);
  v_local_time := v_local_now::time;

  select bh.opens_at, bh.closes_at, bh.is_closed
  into v_hours
  from public.business_hours bh
  where bh.day_of_week = v_day_of_week;

  select coalesce((ss.value->>'enabled')::boolean, false) into v_accept_outside
  from public.system_settings ss
  where ss.key = 'accept_orders_outside_hours';

  return query
  select
    case
      when v_hours.is_closed then false
      when v_hours.opens_at is null or v_hours.closes_at is null then false
      else v_local_time >= v_hours.opens_at and v_local_time < v_hours.closes_at
    end,
    v_hours.opens_at,
    v_hours.closes_at,
    coalesce(v_hours.is_closed, true),
    coalesce(v_accept_outside, false);
end;
$$;

grant execute on function public.get_business_status() to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Trigger: notificación de nuevo pedido (solo online)
-- ------------------------------------------------------------
create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_type = 'online' then
    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'nuevo_pedido',
      'Nuevo pedido online #' || new.order_number,
      'order',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_order on public.orders;
create trigger trg_notify_new_order
after insert on public.orders
for each row execute function public.notify_new_order();

-- ------------------------------------------------------------
-- 4. Trigger: notificación de pago pendiente
-- ------------------------------------------------------------
create or replace function public.notify_pending_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_number bigint;
begin
  if new.status = 'pendiente' then
    select o.order_number into v_order_number from public.orders o where o.id = new.order_id;

    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'pago_pendiente',
      'Pago pendiente de verificar — pedido #' || v_order_number,
      'payment',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_pending_payment on public.payments;
create trigger trg_notify_pending_payment
after insert on public.payments
for each row execute function public.notify_pending_payment();

-- ------------------------------------------------------------
-- 5. Trigger: notificación de pedido listo
-- ------------------------------------------------------------
create or replace function public.notify_order_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'listo' and old.status is distinct from 'listo' then
    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'pedido_listo',
      'Pedido #' || new.order_number || ' está listo',
      'order',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_ready on public.orders;
create trigger trg_notify_order_ready
after update on public.orders
for each row execute function public.notify_order_ready();

-- ------------------------------------------------------------
-- 6. Trigger: notificación de stock bajo / agotado (solo al
--    cruzar a un estado peor, para no repetir avisos)
-- ------------------------------------------------------------
create or replace function public.notify_stock_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status integer;
  v_new_status integer;
begin
  v_old_status := case
    when old.current_stock <= 0 then 2
    when old.current_stock <= old.minimum_stock then 1
    else 0
  end;

  v_new_status := case
    when new.current_stock <= 0 then 2
    when new.current_stock <= new.minimum_stock then 1
    else 0
  end;

  if v_new_status > v_old_status then
    if v_new_status = 2 then
      insert into public.notifications (type, message, reference_type, reference_id)
      values ('stock_agotado', 'Stock agotado: ' || new.name, 'inventory_item', new.id);
    elsif v_new_status = 1 then
      insert into public.notifications (type, message, reference_type, reference_id)
      values ('stock_bajo', 'Stock bajo: ' || new.name || ' (' || new.current_stock || ' ' || new.unit || ')', 'inventory_item', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_stock_alert on public.inventory_items;
create trigger trg_notify_stock_alert
after update on public.inventory_items
for each row execute function public.notify_stock_alert();

-- ------------------------------------------------------------
-- 7. create_order() — con verificación de horario agregada.
--    Misma firma que antes (7 parámetros): create or replace
--    reemplaza la versión de Fase 12 sin crear una sobrecarga.
-- ------------------------------------------------------------
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_whatsapp text,
  p_items jsonb,
  p_customer_message text,
  p_idempotency_key text,
  p_promotion_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
  v_item_needs jsonb := '{}'::jsonb;
  v_inv_item_id text;
  v_reserved_until timestamptz := now() + interval '30 minutes';
  v_business_is_open boolean;
  v_business_accept_outside boolean;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto.';
  end if;

  select gbs.is_open, gbs.accept_orders_outside_hours
  into v_business_is_open, v_business_accept_outside
  from public.get_business_status() gbs;

  if not v_business_is_open and not v_business_accept_outside then
    raise exception 'La florería está cerrada en este momento y no se aceptan pedidos fuera de horario.';
  end if;

  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'El nombre del cliente es obligatorio.';
  end if;

  if p_idempotency_key is not null then
    select id into v_existing_order_id from public.orders where idempotency_key = p_idempotency_key;
    if v_existing_order_id is not null then
      return v_existing_order_id;
    end if;
  end if;

  if p_customer_phone is not null and trim(p_customer_phone) <> '' then
    select id into v_customer_id from public.customers where phone = p_customer_phone;
  end if;

  if v_customer_id is null then
    insert into public.customers (name, phone, whatsapp)
    values (p_customer_name, nullif(p_customer_phone, ''), nullif(p_customer_whatsapp, ''))
    returning id into v_customer_id;
  end if;

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

  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    perform public.release_expired_reservations(v_inv_item_id::uuid);

    select current_stock into v_available
    from public.inventory_items where id = v_inv_item_id::uuid for update;

    if v_available is null then
      raise exception 'Un ítem de inventario del pedido ya no existe.';
    end if;

    select coalesce(sum(quantity), 0) into v_already_reserved
    from public.inventory_reservations
    where inventory_item_id = v_inv_item_id::uuid and status = 'reserved';

    v_available := v_available - v_already_reserved;
    v_needed := (v_item_needs->>v_inv_item_id)::numeric;

    if v_available < v_needed then
      raise exception 'Stock insuficiente: solo hay % disponible y se necesitan %.', v_available, v_needed;
    end if;
  end loop;

  insert into public.orders (customer_id, status, customer_message, idempotency_key, reserved_until)
  values (v_customer_id, 'pendiente_pago', p_customer_message, p_idempotency_key, v_reserved_until)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price into v_product from public.products where id = (v_item->>'product_id')::uuid;

    v_quantity := (v_item->>'quantity')::numeric;
    v_line_total := v_product.price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_snapshot,
      quantity, line_total, personalization, message, note
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price,
      v_quantity, v_line_total, v_item->'personalization', v_item->>'message', v_item->>'note'
    );
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  if p_promotion_id is not null then
    perform public.apply_order_discount(v_order_id, v_subtotal, v_customer_id, p_promotion_id, null, null, null);
  end if;

  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    insert into public.inventory_reservations (order_id, inventory_item_id, quantity, status, expires_at)
    values (v_order_id, v_inv_item_id::uuid, (v_item_needs->>v_inv_item_id)::numeric, 'reserved', v_reserved_until);
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, jsonb, text, text, uuid) to anon, authenticated;