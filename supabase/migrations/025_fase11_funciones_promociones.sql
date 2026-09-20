-- ============================================================
-- NOVA FLORERÍA — FASE 11: CLIENTES Y PROMOCIONES
-- Migración 2/2: función de descuento compartida, y actualización
-- de create_order() / create_physical_sale() para usarla.
--
-- IMPORTANTE: ambas funciones cambian de firma (nuevos
-- parámetros), así que hay que eliminar explícitamente las
-- versiones viejas — si no, quedan como sobrecargas separadas
-- y el código viejo las sigue llamando sin darse cuenta (la
-- misma lección de la Fase 9).
-- ============================================================

drop function if exists public.create_order(text, text, text, jsonb, text, text);
drop function if exists public.create_physical_sale(jsonb, numeric, text);

-- ------------------------------------------------------------
-- apply_order_discount() — valida y aplica UNA promoción O UN
-- descuento manual (nunca ambos) a un pedido que YA tiene sus
-- order_items insertados. Actualiza discount_total/total del
-- pedido y deja registro en order_discounts. Devuelve el monto
-- aplicado (0 si no se aplicó nada).
-- ------------------------------------------------------------
create or replace function public.apply_order_discount(
  p_order_id uuid,
  p_subtotal numeric,
  p_customer_id uuid,
  p_promotion_id uuid,
  p_manual_amount numeric,
  p_manual_reason text,
  p_actor_id uuid
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo_id uuid;
  v_promo_name text;
  v_promo_discount_type text;
  v_promo_discount_value numeric(12,2);
  v_promo_starts_at timestamptz;
  v_promo_ends_at timestamptz;
  v_promo_minimum_purchase numeric(12,2);
  v_promo_is_active boolean;
  v_has_product_scope integer;
  v_order_has_scoped_product integer;
  v_has_customer_scope integer;
  v_customer_in_scope integer;
  v_amount numeric(12,2) := 0;
begin
  if p_promotion_id is not null and p_manual_amount is not null then
    raise exception 'No se puede aplicar una promoción y un descuento manual al mismo tiempo.';
  end if;

  if p_promotion_id is not null then
    select pm.id, pm.name, pm.discount_type, pm.discount_value,
           pm.starts_at, pm.ends_at, pm.minimum_purchase, pm.is_active
    into v_promo_id, v_promo_name, v_promo_discount_type, v_promo_discount_value,
         v_promo_starts_at, v_promo_ends_at, v_promo_minimum_purchase, v_promo_is_active
    from public.promotions pm
    where pm.id = p_promotion_id;

    if v_promo_id is null then
      raise exception 'La promoción no existe.';
    end if;

    if not v_promo_is_active then
      raise exception 'La promoción "%" no está activa.', v_promo_name;
    end if;

    if v_promo_starts_at is not null and now() < v_promo_starts_at then
      raise exception 'La promoción "%" todavía no empieza.', v_promo_name;
    end if;

    if v_promo_ends_at is not null and now() > v_promo_ends_at then
      raise exception 'La promoción "%" ya venció.', v_promo_name;
    end if;

    if v_promo_minimum_purchase is not null and p_subtotal < v_promo_minimum_purchase then
      raise exception 'El pedido no alcanza la compra mínima de % para la promoción "%".',
        v_promo_minimum_purchase, v_promo_name;
    end if;

    select count(*) into v_has_product_scope
    from public.promotion_products pp where pp.promotion_id = p_promotion_id;

    if v_has_product_scope > 0 then
      select count(*) into v_order_has_scoped_product
      from public.order_items oi
      join public.promotion_products pp
        on pp.product_id = oi.product_id and pp.promotion_id = p_promotion_id
      where oi.order_id = p_order_id;

      if v_order_has_scoped_product = 0 then
        raise exception 'Ninguno de los productos del pedido califica para la promoción "%".', v_promo_name;
      end if;
    end if;

    select count(*) into v_has_customer_scope
    from public.promotion_customers pc where pc.promotion_id = p_promotion_id;

    if v_has_customer_scope > 0 then
      if p_customer_id is null then
        raise exception 'La promoción "%" es exclusiva para ciertos clientes.', v_promo_name;
      end if;

      select count(*) into v_customer_in_scope
      from public.promotion_customers pc
      where pc.promotion_id = p_promotion_id and pc.customer_id = p_customer_id;

      if v_customer_in_scope = 0 then
        raise exception 'Este cliente no califica para la promoción "%".', v_promo_name;
      end if;
    end if;

    if v_promo_discount_type = 'porcentaje' then
      v_amount := round(p_subtotal * v_promo_discount_value / 100, 2);
    else
      v_amount := v_promo_discount_value;
    end if;

    if v_amount > p_subtotal then
      v_amount := p_subtotal;
    end if;

    insert into public.order_discounts (
      order_id, promotion_id, discount_type, discount_value, amount_applied, created_by
    ) values (
      p_order_id, p_promotion_id, v_promo_discount_type, v_promo_discount_value, v_amount, p_actor_id
    );

  elsif p_manual_amount is not null then
    if p_actor_id is null then
      raise exception 'Un descuento manual requiere un empleado autenticado.';
    end if;

    if p_manual_reason is null or trim(p_manual_reason) = '' then
      raise exception 'El motivo del descuento manual es obligatorio.';
    end if;

    if p_manual_amount <= 0 then
      raise exception 'El descuento debe ser mayor que cero.';
    end if;

    if p_manual_amount > p_subtotal then
      raise exception 'El descuento (%) no puede ser mayor al subtotal (%).', p_manual_amount, p_subtotal;
    end if;

    v_amount := p_manual_amount;

    insert into public.order_discounts (
      order_id, promotion_id, discount_type, discount_value, amount_applied, reason, created_by
    ) values (
      p_order_id, null, 'manual', p_manual_amount, v_amount, p_manual_reason, p_actor_id
    );
  end if;

  if v_amount > 0 then
    update public.orders
    set discount_total = discount_total + v_amount, total = total - v_amount, updated_at = now()
    where id = p_order_id;
  end if;

  return v_amount;
end;
$$;

-- ------------------------------------------------------------
-- create_order() — agrega p_promotion_id (opcional). SOLO
-- promociones automáticas: no hay descuento manual aquí, porque
-- es un checkout público sin ningún empleado presente.
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
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto.';
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

  -- NUEVO en Fase 11: promoción automática opcional (sin descuento manual aquí).
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

-- ------------------------------------------------------------
-- create_physical_sale() — reemplaza el p_discount_total libre
-- por p_promotion_id (opcional) y p_manual_discount_amount +
-- p_manual_discount_reason (opcional, motivo obligatorio si se
-- usa). Empleado o admin pueden usar cualquiera de los dos.
-- ------------------------------------------------------------
create or replace function public.create_physical_sale(
  p_items jsonb,
  p_promotion_id uuid,
  p_manual_discount_amount numeric,
  p_manual_discount_reason text,
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

  if p_payment_method not in ('qr', 'efectivo')