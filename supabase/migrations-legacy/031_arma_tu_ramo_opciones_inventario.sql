-- ============================================================
-- NOVA FLORERÍA
-- FASE 15 — CORRECCIÓN + "ARMA TU RAMO"
--
-- Correcciones:
-- 1. Restaura extra_price de customization_options.
-- 2. Valida que las opciones pertenezcan al producto.
-- 3. Rechaza opciones duplicadas.
-- 4. Las opciones pueden consumir inventario real.
-- 5. El producto + sus opciones comparten una única reserva.
-- 6. Mantiene idempotencia.
-- 7. Mantiene la reserva de inventario existente.
-- 8. No modifica confirm_payment(): esta seguirá consumiendo
--    las reservas existentes.
-- ============================================================


-- ============================================================
-- 1. INVENTARIO REQUERIDO POR OPCIÓN DE PERSONALIZACIÓN
-- ============================================================

create table if not exists public.customization_option_inventory_requirements (
  id uuid primary key default gen_random_uuid(),

  customization_option_id uuid not null
    references public.customization_options(id)
    on delete cascade,

  inventory_item_id uuid not null
    references public.inventory_items(id)
    on delete restrict,

  quantity numeric(12,3) not null
    check (quantity > 0),

  created_at timestamptz not null default now(),

  constraint coir_unique
    unique (customization_option_id, inventory_item_id)
);


create index if not exists idx_coir_option
  on public.customization_option_inventory_requirements(customization_option_id);

create index if not exists idx_coir_item
  on public.customization_option_inventory_requirements(inventory_item_id);


-- ============================================================
-- 2. RLS
-- ============================================================

alter table public.customization_option_inventory_requirements
enable row level security;


drop policy if exists "coir_staff_select"
on public.customization_option_inventory_requirements;

create policy "coir_staff_select"
on public.customization_option_inventory_requirements
for select
to authenticated
using (public.is_employee_or_admin());


drop policy if exists "coir_staff_insert"
on public.customization_option_inventory_requirements;

create policy "coir_staff_insert"
on public.customization_option_inventory_requirements
for insert
to authenticated
with check (public.is_employee_or_admin());


drop policy if exists "coir_staff_update"
on public.customization_option_inventory_requirements;

create policy "coir_staff_update"
on public.customization_option_inventory_requirements
for update
to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());


drop policy if exists "coir_staff_delete"
on public.customization_option_inventory_requirements;

create policy "coir_staff_delete"
on public.customization_option_inventory_requirements
for delete
to authenticated
using (public.is_employee_or_admin());


-- ============================================================
-- 3. CREATE ORDER
--
-- Misma firma existente de 7 parámetros.
--
-- El cliente solamente envía:
--   product_id
--   quantity
--   customization_option_ids
--   message
--   note
--
-- El servidor obtiene:
--   precio real
--   extra_price real
--   opciones válidas
--   necesidades de inventario
--
-- Nunca se confía en precios enviados por el navegador.
-- ============================================================

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

  -- Inventario acumulado de TODO el pedido.
  -- La clave es inventory_item_id.
  v_item_needs jsonb := '{}'::jsonb;

  v_inv_item_id text;

  v_reserved_until timestamptz :=
    now() + interval '30 minutes';

  v_business_is_open boolean;
  v_business_accept_outside boolean;

  v_option_id text;

  v_options_extra numeric(12,2);
  v_personalization_snapshot jsonb;

  v_option_count integer;
  v_distinct_option_count integer;

begin

  -- ==========================================================
  -- 4. VALIDACIONES GENERALES
  -- ==========================================================

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then

    raise exception
      'El pedido debe tener al menos un producto.';
  end if;


  select
    gbs.is_open,
    gbs.accept_orders_outside_hours
  into
    v_business_is_open,
    v_business_accept_outside
  from public.get_business_status() gbs;


  if not v_business_is_open
     and not v_business_accept_outside then

    raise exception
      'La florería está cerrada en este momento y no se aceptan pedidos fuera de horario.';
  end if;


  if p_customer_name is null
     or trim(p_customer_name) = '' then

    raise exception
      'El nombre del cliente es obligatorio.';
  end if;


  -- ==========================================================
  -- 5. IDEMPOTENCIA
  -- ==========================================================

  if p_idempotency_key is not null then

    select id
    into v_existing_order_id
    from public.orders
    where idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_order_id is not null then
      return v_existing_order_id;
    end if;

  end if;


  -- ==========================================================
  -- 6. OBTENER / CREAR CLIENTE
  -- ==========================================================

  if p_customer_phone is not null
     and trim(p_customer_phone) <> '' then

    select id
    into v_customer_id
    from public.customers
    where phone = p_customer_phone
    limit 1;

  end if;


  if v_customer_id is null then

    insert into public.customers (
      name,
      phone,
      whatsapp
    )
    values (
      p_customer_name,
      nullif(trim(p_customer_phone), ''),
      nullif(trim(p_customer_whatsapp), '')
    )
    returning id into v_customer_id;

  end if;


  -- ==========================================================
  -- 7. PRIMERA PASADA
  --
  -- Aquí:
  --   - validamos productos
  --   - validamos cantidades
  --   - validamos opciones
  --   - rechazamos duplicados
  --   - acumulamos inventario del producto
  --   - acumulamos inventario de las opciones
  --
  -- Todavía NO creamos el pedido.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    -- --------------------------------------------------------
    -- Producto
    -- --------------------------------------------------------

    begin

      select
        id,
        name,
        price,
        is_active,
        is_available,
        is_sold_out
      into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid;

    exception
      when invalid_text_representation then

        raise exception
          'El identificador de producto no es válido.';

    end;


    if v_product.id is null then

      raise exception
        'Uno de los productos del pedido ya no existe.';

    end if;


    if not v_product.is_active
       or not v_product.is_available
       or v_product.is_sold_out then

      raise exception
        'El producto "%" ya no está disponible.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Cantidad
    -- --------------------------------------------------------

    begin

      v_quantity :=
        (v_item->>'quantity')::numeric;

    exception
      when invalid_text_representation then

        raise exception
          'La cantidad del producto "%" no es válida.',
          v_product.name;

    end;


    if v_quantity is null
       or v_quantity <= 0 then

      raise exception
        'La cantidad de "%" debe ser mayor que cero.',
        v_product.name;

    end if;


    -- ========================================================
    -- OPCIONES DE PERSONALIZACIÓN
    -- ========================================================

    if v_item ? 'customization_option_ids'
       and jsonb_typeof(v_item->'customization_option_ids') <> 'array' then

      raise exception
        'Las opciones de personalización de "%" no son válidas.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Rechazar opciones duplicadas
    -- --------------------------------------------------------

    select
      count(*),
      count(distinct option_id)
    into
      v_option_count,
      v_distinct_option_count
    from jsonb_array_elements_text(
      coalesce(
        v_item->'customization_option_ids',
        '[]'::jsonb
      )
    ) as option_id;


    if v_option_count <> v_distinct_option_count then

      raise exception
        'No se puede seleccionar dos veces la misma opción de "%".',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Validar cada opción
    -- --------------------------------------------------------

    for v_option_id in
      select jsonb_array_elements_text(
        coalesce(
          v_item->'customization_option_ids',
          '[]'::jsonb
        )
      )
    loop

      begin

        if not exists (
          select 1
          from public.customization_options co
          where co.id = v_option_id::uuid
            and co.product_id = v_product.id
            and co.is_active = true
        ) then

          raise exception
            'Una opción de personalización de "%" ya no está disponible.',
            v_product.name;

        end if;

      exception
        when invalid_text_representation then

          raise exception
            'Una opción de personalización de "%" no es válida.',
            v_product.name;

      end;


      -- ------------------------------------------------------
      -- Inventario requerido por la opción
      -- ------------------------------------------------------

      for v_req in
        select
          inventory_item_id,
          quantity
        from public.customization_option_inventory_requirements
        where customization_option_id = v_option_id::uuid
      loop

        v_needed :=
          v_req.quantity * v_quantity;

        v_inv_item_id :=
          v_req.inventory_item_id::text;

        v_item_needs :=
          jsonb_set(
            v_item_needs,
            array[v_inv_item_id],
            to_jsonb(
              coalesce(
                (v_item_needs->>v_inv_item_id)::numeric,
                0
              ) + v_needed
            )
          );

      end loop;

    end loop;


    -- ========================================================
    -- INVENTARIO BASE DEL PRODUCTO
    -- ========================================================

    for v_req in
      select
        inventory_item_id,
        quantity
      from public.product_inventory_requirements
      where product_id = v_product.id
    loop

      v_needed :=
        v_req.quantity * v_quantity;

      v_inv_item_id :=
        v_req.inventory_item_id::text;

      v_item_needs :=
        jsonb_set(
          v_item_needs,
          array[v_inv_item_id],
          to_jsonb(
            coalesce(
              (v_item_needs->>v_inv_item_id)::numeric,
              0
            ) + v_needed
          )
        );

    end loop;

  end loop;


  -- ==========================================================
  -- 8. VERIFICAR STOCK
  --
  -- Producto + opciones ya están acumulados.
  -- Aquí se comprueba el total real necesario.
  -- ==========================================================

  for v_inv_item_id in
    select jsonb_object_keys(v_item_needs)
  loop

    -- Liberar reservas vencidas antes de comprobar
    -- disponibilidad.
    perform public.release_expired_reservations(
      v_inv_item_id::uuid
    );


    -- Bloqueamos el ítem de inventario para que dos pedidos
    -- concurrentes no puedan comprobar el mismo stock
    -- simultáneamente.
    select current_stock
    into v_available
    from public.inventory_items
    where id = v_inv_item_id::uuid
    for update;


    if v_available is null then

      raise exception
        'Un ítem de inventario del pedido ya no existe.';

    end if;


    select coalesce(sum(quantity), 0)
    into v_already_reserved
    from public.inventory_reservations
    where inventory_item_id = v_inv_item_id::uuid
      and status = 'reserved';


    v_available :=
      v_available - v_already_reserved;


    v_needed :=
      (v_item_needs->>v_inv_item_id)::numeric;


    if v_available < v_needed then

      raise exception
        'Stock insuficiente: solo hay % disponible y se necesitan %.',
        v_available,
        v_needed;

    end if;

  end loop;


  -- ==========================================================
  -- 9. CREAR PEDIDO
  -- ==========================================================

  insert into public.orders (
    customer_id,
    status,
    customer_message,
    idempotency_key,
    reserved_until
  )
  values (
    v_customer_id,
    'pendiente_pago',
    p_customer_message,
    p_idempotency_key,
    v_reserved_until
  )
  returning id into v_order_id;


  -- ==========================================================
  -- 10. SEGUNDA PASADA
  --
  -- Aquí calculamos el precio REAL desde PostgreSQL.
  -- Nunca usamos extra_price enviado por el navegador.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    select
      id,
      name,
      price
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;


    v_quantity :=
      (v_item->>'quantity')::numeric;


    -- --------------------------------------------------------
    -- Precio real de las opciones
    -- --------------------------------------------------------

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
          order by co.option_type, co.name, co.id
        )
        filter (where co.id is not null),
        '[]'::jsonb
      )

    into
      v_options_extra,
      v_personalization_snapshot

    from public.customization_options co

    where co.id in (
      select
        jsonb_array_elements_text(
          coalesce(
            v_item->'customization_option_ids',
            '[]'::jsonb
          )
        )::uuid
    )

    and co.product_id = v_product.id

    and co.is_active = true;


    -- --------------------------------------------------------
    -- Precio final de la línea
    -- --------------------------------------------------------

    v_line_total :=
      (v_product.price + v_options_extra)
      * v_quantity;


    v_subtotal :=
      v_subtotal + v_line_total;


    -- --------------------------------------------------------
    -- Snapshot de la personalización
    -- --------------------------------------------------------

    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total,
      personalization,
      message,
      note
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price + v_options_extra,
      v_quantity,
      v_line_total,
      v_personalization_snapshot,
      v_item->>'message',
      v_item->>'note'
    );

  end loop;


  -- ==========================================================
  -- 11. ACTUALIZAR TOTALES
  -- ==========================================================

  update public.orders
  set
    subtotal = v_subtotal,
    total = v_subtotal
  where id = v_order_id;


  -- ==========================================================
  -- 12. PROMOCIÓN
  -- ==========================================================

  if p_promotion_id is not null then

    perform public.apply_order_discount(
      v_order_id,
      v_subtotal,
      v_customer_id,
      p_promotion_id,
      null,
      null,
      null
    );

  end if;


  -- ==========================================================
  -- 13. RESERVAR INVENTARIO
  --
  -- Aquí se reserva:
  --
  --   inventario del producto
  --       +
  --   inventario de las opciones
  --
  -- en una sola reserva por ítem de inventario.
  -- ==========================================================

  for v_inv_item_id in
    select jsonb_object_keys(v_item_needs)
  loop

    insert into public.inventory_reservations (
      order_id,
      inventory_item_id,
      quantity,
      status,
      expires_at
    )
    values (
      v_order_id,
      v_inv_item_id::uuid,
      (v_item_needs->>v_inv_item_id)::numeric,
      'reserved',
      v_reserved_until
    );

  end loop;


  -- ==========================================================
  -- 14. RESULTADO
  -- ==========================================================

  return v_order_id;

end;
$$;


-- ============================================================
-- 15. PERMISOS
-- ============================================================

grant execute
on function public.create_order(
  text,
  text,
  text,
  jsonb,
  text,
  text,
  uuid
)
to anon, authenticated;


-- ============================================================
-- FIN FASE 15
-- ============================================================