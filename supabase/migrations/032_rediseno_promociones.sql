-- ============================================================
-- NOVA FLORERÍA — REDISEÑO DE PROMOCIONES
-- ============================================================
--
-- Decisiones confirmadas:
-- 1. Se limpian las promociones de prueba existentes.
-- 2. promotion_type queda únicamente en:
--      - producto
--      - combo
-- 3. Se elimina promotion_customers.
-- 4. promotion_products incorpora quantity.
-- 5. promotions incorpora combo_price.
-- 6. Producto:
--      usa discount_type + discount_value.
-- 7. Combo:
--      usa combo_price como precio fijo total del combo.
-- 8. Una promoción no puede combinarse con un descuento manual.
--
-- COMPORTAMIENTO DE COMBOS:
-- Si un combo requiere:
--      12 rosas + 1 oso + 2 chocolates
--
-- Y el pedido tiene:
--      24 rosas + 2 osos + 5 chocolates
--
-- Se pueden formar 2 combos.
-- Las unidades adicionales que no formen otro combo permanecen
-- fuera del descuento.
-- ============================================================


-- ------------------------------------------------------------
-- LIMPIEZA DE DATOS DE PRUEBA
-- ------------------------------------------------------------

delete from public.promotion_customers;
delete from public.promotion_products;
delete from public.promotions;

drop table if exists public.promotion_customers;


-- ------------------------------------------------------------
-- promotion_products
-- Agregar cantidad para poder definir los componentes de combos.
-- ------------------------------------------------------------

alter table public.promotion_products
  add column if not exists quantity numeric(12,3)
  not null
  default 1
  check (quantity > 0);


-- ------------------------------------------------------------
-- promotions
-- Rediseño de tipos y campos.
-- ------------------------------------------------------------

alter table public.promotions
  drop constraint if exists promotions_promotion_type_check;

alter table public.promotions
  add constraint promotions_promotion_type_check
  check (promotion_type in ('producto', 'combo'));


-- ------------------------------------------------------------
-- Los campos de descuento dejan de ser obligatorios porque
-- solamente corresponden a promociones de tipo producto.
-- ------------------------------------------------------------

alter table public.promotions
  alter column discount_type drop not null,
  alter column discount_value drop not null;


-- ------------------------------------------------------------
-- Precio fijo del combo.
-- ------------------------------------------------------------

alter table public.promotions
  add column if not exists combo_price numeric(12,2)
  check (combo_price is null or combo_price >= 0);


-- ------------------------------------------------------------
-- Validar que cada tipo utilice solamente sus campos.
--
-- PRODUCTO:
--   discount_type   obligatorio
--   discount_value  obligatorio
--   combo_price     NULL
--
-- COMBO:
--   combo_price     obligatorio
--   discount_type   NULL
--   discount_value  NULL
-- ------------------------------------------------------------

alter table public.promotions
  drop constraint if exists promotions_type_fields_check;

alter table public.promotions
  add constraint promotions_type_fields_check
  check (
    (
      promotion_type = 'producto'
      and discount_type is not null
      and discount_value is not null
      and combo_price is null
    )
    or
    (
      promotion_type = 'combo'
      and combo_price is not null
      and discount_type is null
      and discount_value is null
    )
  );


-- ============================================================
-- apply_order_discount()
-- ============================================================
--
-- Misma firma utilizada actualmente por:
--   - create_order()
--   - create_physical_sale()
--   - confirm_payment()
--
-- Producto:
--   El descuento se calcula únicamente sobre los productos
--   asociados a la promoción.
--
-- Combo:
--   Se calcula cuántas veces puede formarse el combo completo
--   con las cantidades presentes en el pedido.
--
-- Ejemplo:
--
-- Combo:
--   12 rosas  = 1 unidad del combo
--   1 oso     = 1 unidad del combo
--   2 chocolates = 1 unidad del combo
--
-- Pedido:
--   24 rosas
--   2 osos
--   5 chocolates
--
-- Se forman 2 combos.
-- ============================================================

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
  v_promo_type text;
  v_promo_discount_type text;
  v_promo_discount_value numeric(12,2);
  v_promo_combo_price numeric(12,2);
  v_promo_starts_at timestamptz;
  v_promo_ends_at timestamptz;
  v_promo_minimum_purchase numeric(12,2);
  v_promo_is_active boolean;

  v_amount numeric(12,2) := 0;

  -- Promoción por producto
  v_component_count integer;
  v_eligible_subtotal numeric(12,2);

  -- Promoción combo
  v_component record;
  v_ordered_qty numeric(12,3);
  v_times_possible numeric;
  v_normal_cost_per_set numeric(12,2);

begin

  -- ----------------------------------------------------------
  -- No se permite combinar promoción con descuento manual.
  -- ----------------------------------------------------------

  if p_promotion_id is not null
     and p_manual_amount is not null then

    raise exception
      'No se puede aplicar una promoción y un descuento manual al mismo tiempo.';

  end if;


  -- ==========================================================
  -- PROMOCIÓN
  -- ==========================================================

  if p_promotion_id is not null then

    -- --------------------------------------------------------
    -- Obtener promoción
    -- --------------------------------------------------------

    select
      pm.id,
      pm.name,
      pm.promotion_type,
      pm.discount_type,
      pm.discount_value,
      pm.combo_price,
      pm.starts_at,
      pm.ends_at,
      pm.minimum_purchase,
      pm.is_active

    into
      v_promo_id,
      v_promo_name,
      v_promo_type,
      v_promo_discount_type,
      v_promo_discount_value,
      v_promo_combo_price,
      v_promo_starts_at,
      v_promo_ends_at,
      v_promo_minimum_purchase,
      v_promo_is_active

    from public.promotions pm

    where pm.id = p_promotion_id;


    -- --------------------------------------------------------
    -- Existencia
    -- --------------------------------------------------------

    if v_promo_id is null then
      raise exception 'La promoción no existe.';
    end if;


    -- --------------------------------------------------------
    -- Estado
    -- --------------------------------------------------------

    if not v_promo_is_active then
      raise exception
        'La promoción "%" no está activa.',
        v_promo_name;
    end if;


    -- --------------------------------------------------------
    -- Inicio
    -- --------------------------------------------------------

    if v_promo_starts_at is not null
       and now() < v_promo_starts_at then

      raise exception
        'La promoción "%" todavía no empieza.',
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Finalización
    -- --------------------------------------------------------

    if v_promo_ends_at is not null
       and now() > v_promo_ends_at then

      raise exception
        'La promoción "%" ya venció.',
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Compra mínima
    -- --------------------------------------------------------

    if v_promo_minimum_purchase is not null
       and p_subtotal < v_promo_minimum_purchase then

      raise exception
        'El pedido no alcanza la compra mínima de % para la promoción "%".',
        v_promo_minimum_purchase,
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Verificar que tenga productos configurados.
    -- --------------------------------------------------------

    select count(*)
    into v_component_count

    from public.promotion_products pp

    where pp.promotion_id = p_promotion_id;


    if v_component_count = 0 then

      raise exception
        'La promoción "%" no tiene productos configurados.',
        v_promo_name;

    end if;


    -- ========================================================
    -- PROMOCIÓN POR PRODUCTO
    -- ========================================================

    if v_promo_type = 'producto' then

      -- ------------------------------------------------------
      -- Solamente cuenta el subtotal de productos asociados
      -- a esta promoción.
      -- ------------------------------------------------------

      select coalesce(sum(oi.line_total), 0)
      into v_eligible_subtotal

      from public.order_items oi

      join public.promotion_products pp
        on pp.product_id = oi.product_id
       and pp.promotion_id = p_promotion_id

      where oi.order_id = p_order_id;


      if v_eligible_subtotal = 0 then

        raise exception
          'Ninguno de los productos del pedido califica para la promoción "%".',
          v_promo_name;

      end if;


      -- ------------------------------------------------------
      -- Descuento porcentual
      -- ------------------------------------------------------

      if v_promo_discount_type = 'porcentaje' then

        v_amount :=
          round(
            v_eligible_subtotal
            * v_promo_discount_value
            / 100,
            2
          );


      -- ------------------------------------------------------
      -- Descuento por monto fijo
      -- ------------------------------------------------------

      else

        v_amount :=
          least(
            v_promo_discount_value,
            v_eligible_subtotal
          );

      end if;


      -- ------------------------------------------------------
      -- Registrar descuento
      -- ------------------------------------------------------

      insert into public.order_discounts (
        order_id,
        promotion_id,
        discount_type,
        discount_value,
        amount_applied,
        created_by
      )
      values (
        p_order_id,
        p_promotion_id,
        v_promo_discount_type,
        v_promo_discount_value,
        v_amount,
        p_actor_id
      );


    -- ========================================================
    -- PROMOCIÓN COMBO
    -- ========================================================

    else

      v_times_possible := null;
      v_normal_cost_per_set := 0;


      -- ------------------------------------------------------
      -- Revisar todos los componentes del combo.
      -- ------------------------------------------------------

      for v_component in

        select
          pp.product_id,
          pp.quantity,
          p.price

        from public.promotion_products pp

        join public.products p
          on p.id = pp.product_id

        where pp.promotion_id = p_promotion_id

      loop

        -- ----------------------------------------------------
        -- Cantidad del producto presente en el pedido.
        -- ----------------------------------------------------

        select coalesce(sum(oi.quantity), 0)
        into v_ordered_qty

        from public.order_items oi

        where oi.order_id = p_order_id
          and oi.product_id = v_component.product_id;


        -- ----------------------------------------------------
        -- Determinar cuántos combos completos se pueden formar.
        --
        -- El componente con menor disponibilidad determina
        -- la cantidad final de combos.
        -- ----------------------------------------------------

        if v_times_possible is null
           or floor(
                v_ordered_qty / v_component.quantity
              ) < v_times_possible then

          v_times_possible :=
            floor(
              v_ordered_qty / v_component.quantity
            );

        end if;


        -- ----------------------------------------------------
        -- Precio normal de una unidad completa del combo.
        -- ----------------------------------------------------

        v_normal_cost_per_set :=
          v_normal_cost_per_set
          + (
              v_component.price
              * v_component.quantity
            );

      end loop;


      -- --------------------------------------------------------
      -- El pedido debe permitir formar al menos un combo.
      -- --------------------------------------------------------

      if v_times_possible is null
         or v_times_possible < 1 then

        raise exception
          'El pedido no tiene los productos necesarios para el combo "%".',
          v_promo_name;

      end if;


      -- --------------------------------------------------------
      -- Descuento:
      --
      -- precio normal del combo
      -- menos
      -- precio fijo del combo
      --
      -- multiplicado por la cantidad de combos.
      -- --------------------------------------------------------

      v_amount :=
        (
          v_normal_cost_per_set
          - v_promo_combo_price
        )
        * v_times_possible;


      -- --------------------------------------------------------
      -- Nunca permitir descuento negativo.
      -- --------------------------------------------------------

      if v_amount < 0 then
        v_amount := 0;
      end if;


      -- --------------------------------------------------------
      -- Nunca permitir que el descuento supere el subtotal.
      -- --------------------------------------------------------

      if v_amount > p_subtotal then
        v_amount := p_subtotal;
      end if;


      -- --------------------------------------------------------
      -- Registrar descuento del combo.
      --
      -- discount_value contiene el precio fijo del combo.
      -- amount_applied contiene el ahorro real aplicado.
      -- --------------------------------------------------------

      insert into public.order_discounts (
        order_id,
        promotion_id,
        discount_type,
        discount_value,
        amount_applied,
        created_by
      )
      values (
        p_order_id,
        p_promotion_id,
        'combo',
        v_promo_combo_price,
        v_amount,
        p_actor_id
      );

    end if;


  -- ==========================================================
  -- DESCUENTO MANUAL DE CAJA
  -- ==========================================================

  elsif p_manual_amount is not null then

    if p_actor_id is null then

      raise exception
        'Un descuento manual requiere un empleado autenticado.';

    end if;


    if p_manual_reason is null
       or trim(p_manual_reason) = '' then

      raise exception
        'El motivo del descuento manual es obligatorio.';

    end if;


    if p_manual_amount <= 0 then

      raise exception
        'El descuento debe ser mayor que cero.';

    end if;


    if p_manual_amount > p_subtotal then

      raise exception
        'El descuento de % no puede ser mayor al subtotal de %.',
        p_manual_amount,
        p_subtotal;

    end if;


    v_amount := p_manual_amount;


    insert into public.order_discounts (
      order_id,
      promotion_id,
      discount_type,
      discount_value,
      amount_applied,
      reason,
      created_by
    )
    values (
      p_order_id,
      null,
      'manual',
      p_manual_amount,
      v_amount,
      p_manual_reason,
      p_actor_id
    );

  end if;


  -- ==========================================================
  -- ACTUALIZAR TOTAL DEL PEDIDO
  -- ==========================================================

  if v_amount > 0 then

    update public.orders

    set
      discount_total = discount_total + v_amount,
      total = total - v_amount,
      updated_at = now()

    where id = p_order_id;

  end if;


  return v_amount;

end;
$$;