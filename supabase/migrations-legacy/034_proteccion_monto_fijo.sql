-- ============================================================
-- NOVA FLORERÍA — 034 · PROTECCIÓN DE MONTO FIJO EN apply_order_discount
-- ============================================================
--
-- Regla de negocio (decidida con el administrador):
--
--   Monto fijo  > precio del producto  -> BLOQUEAR
--   Monto fijo  = precio del producto  -> permitir
--   Porcentaje                         -> permitir
--   Combo más caro que la suma         -> sin descuento (la
--                                         advertencia es de pantalla)
--   Combo más barato                   -> permitir
--   Descuento manual de caja           -> independiente (no cambia)
--
-- La 033/API/pantalla bloquean el monto fijo al CONFIGURAR la
-- promoción. Esta migración agrega la última barrera, dentro del
-- cálculo: si el precio de un producto bajó después de crear la
-- promoción y ahora es menor que el descuento, apply_order_discount()
-- rechaza aplicarla a un pedido que incluya ese producto.
--
-- Misma firma que en 032 (CREATE OR REPLACE): no crea sobrecargas,
-- así que create_order() y create_physical_sale() siguen llamando a
-- esta función sin cambios.
--
-- Único cambio respecto a 032: en la rama de promoción de producto
-- con 'monto_fijo' se agrega la comprobación marcada "PROTECCIÓN (034)"
-- y sus dos variables. Es seguro volver a ejecutarla.
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

  -- Protección de monto fijo (034)
  v_blocking_name text;
  v_blocking_price numeric(12,2);

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

        -- ----------------------------------------------------
        -- PROTECCIÓN (034): el monto fijo no puede superar el
        -- precio ACTUAL de ningún producto de esta promoción
        -- que esté en el pedido.
        --
        -- La pantalla y el API ya lo validan al configurar la
        -- promoción, pero el precio de un producto puede
        -- cambiar después. Esta es la última barrera: si el
        -- precio bajó por debajo del descuento, el producto
        -- saldría gratis (o con más descuento que su valor),
        -- así que se bloquea.
        --
        -- Igual a un producto de su precio sí se permite.
        -- Se compara contra products.price (precio vigente), la
        -- misma fuente que usa la validación de configuración.
        -- ----------------------------------------------------

        select
          p.name,
          p.price

        into
          v_blocking_name,
          v_blocking_price

        from public.order_items oi

        join public.promotion_products pp
          on pp.product_id = oi.product_id
         and pp.promotion_id = p_promotion_id

        join public.products p
          on p.id = oi.product_id

        where oi.order_id = p_order_id
          and p.price < v_promo_discount_value

        order by p.price asc

        limit 1;


        if v_blocking_name is not null then

          raise exception
            'La promoción "%" no se puede aplicar: su descuento de Bs % supera el precio actual de "%" (Bs %). Pide al administrador que revise la promoción.',
            v_promo_name,
            to_char(v_promo_discount_value, 'FM999999990.00'),
            v_blocking_name,
            to_char(v_blocking_price, 'FM999999990.00');

        end if;


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