-- ============================================================
-- NOVA FLORERÍA — FASE 5: CORRECCIÓN
-- create_order() no sumaba el extra_price de las opciones de
-- personalización elegidas (customization_options) al total del
-- pedido. Se corrige:
--
-- 1. El campo libre "personalization" (cualquier objeto JSON) se
--    reemplaza por "customization_option_ids": un array de ids
--    reales de customization_options.
-- 2. Cada id se valida: debe existir, pertenecer al producto y
--    estar activo. Si no, se rechaza el pedido (mismo criterio
--    que ya se usa para validar el producto en sí).
-- 3. line_total y unit_price_snapshot ahora incluyen el
--    extra_price real de las opciones (nunca un precio mandado
--    por el cliente).
-- 4. order_items.personalization pasa a ser una FOTO (snapshot)
--    estructurada de las opciones elegidas (id, option_type,
--    name, value, extra_price) — mismo criterio que ya se usa
--    para product_name_snapshot/unit_price_snapshot: el precio
--    del producto puede cambiar después y el pedido conserva lo
--    que se cobró en el momento.
--
-- No cambia la firma de la función, el orden de los pasos, los
-- estados del pedido ni las reglas de stock/reserva ya existentes.
-- ============================================================

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_whatsapp text,
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
  v_option_id text;
  v_options_extra numeric(12,2);
  v_personalization_snapshot jsonb;
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

  -- Buscar cliente por teléfono, o crear uno nuevo.
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

    -- Cada opción de personalización elegida debe existir, estar activa
    -- y pertenecer a ESTE producto (no a otro producto cualquiera).
    for v_option_id in
      select jsonb_array_elements_text(coalesce(v_item->'customization_option_ids', '[]'::jsonb))
    loop
      if not exists (
        select 1 from public.customization_options co
        where co.id = v_option_id::uuid
          and co.product_id = v_product.id
          and co.is_active = true
      ) then
        raise exception 'Una opción de personalización de "%" ya no está disponible.', v_product.name;
      end if;
    end loop;

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

    -- extra_price real de cada opción elegida (desde la tabla, nunca
    -- desde lo que mandó el cliente), + foto de las opciones para
    -- guardar en order_items.personalization.
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
        ),
        '[]'::jsonb
      )
    into v_options_extra, v_personalization_snapshot
    from public.customization_options co
    where co.id in (
      select jsonb_array_elements_text(coalesce(v_item->'customization_option_ids', '[]'::jsonb))::uuid
    );

    v_line_total := (v_product.price + v_options_extra) * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_snapshot,
      quantity, line_total, personalization, message, note
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price + v_options_extra,
      v_quantity, v_line_total, v_personalization_snapshot, v_item->>'message', v_item->>'note'
    );
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  for v_inv_item_id in select jsonb_object_keys(v_item_needs)
  loop
    insert into public.inventory_reservations (order_id, inventory_item_id, quantity, status, expires_at)
    values (v_order_id, v_inv_item_id::uuid, (v_item_needs->>v_inv_item_id)::numeric, 'reserved', v_reserved_until);
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, jsonb, text, text) to anon, authenticated;