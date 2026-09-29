-- ============================================================
-- NOVA FLORERÍA — SEGUIMIENTO PÚBLICO DE PEDIDO
-- Ajustá el número de archivo al correlativo real.
--
-- Decisión de diseño (a confirmar con el usuario antes de
-- construir la pantalla): el cliente anónimo consulta su pedido
-- por order_number + teléfono, NO por el UUID del pedido. No se
-- abre RLS pública sobre "orders": todo pasa por esta función,
-- que decide explícitamente qué se expone y valida el teléfono
-- antes de devolver nada.
-- ============================================================

create or replace function public.track_order(
  p_order_number bigint,
  p_customer_phone text
)
returns table (
  order_number bigint,
  status text,
  order_type text,
  subtotal numeric,
  discount_total numeric,
  total numeric,
  customer_message text,
  created_at timestamptz,
  updated_at timestamptz,
  items jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if p_order_number is null or p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Número de pedido y teléfono son obligatorios.';
  end if;

  select o.id into v_order_id
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.order_number = p_order_number
    and (c.phone = p_customer_phone or c.whatsapp = p_customer_phone);

  if v_order_id is null then
    raise exception 'No encontramos un pedido con ese número y teléfono.';
  end if;

  return query
  select
    o.order_number,
    o.status,
    o.order_type,
    o.subtotal,
    o.discount_total,
    o.total,
    o.customer_message,
    o.created_at,
    o.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', oi.product_name_snapshot,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price_snapshot,
            'line_total', oi.line_total,
            'personalization', oi.personalization,
            'message', oi.message,
            'note', oi.note
          )
          order by oi.created_at asc
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.id = v_order_id;
end;
$$;

grant execute on function public.track_order(bigint, text) to anon, authenticated;
