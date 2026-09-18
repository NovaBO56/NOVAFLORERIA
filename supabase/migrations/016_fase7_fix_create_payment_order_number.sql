-- ============================================================
-- NOVA FLORERÍA — FASE 7: WHATSAPP
-- Migración 2/2: create_payment() ahora también devuelve
-- order_number, necesario para armar el mensaje de WhatsApp
-- ("pedido #125") sin que el cliente tenga que autenticarse.
-- ============================================================

drop function if exists public.create_payment(uuid);

create or replace function public.create_payment(
  p_order_id uuid
)
returns table (
  id uuid,
  amount numeric,
  method text,
  status text,
  order_number bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_payment_id uuid;
begin
  select o.id, o.status, o.total, o.order_number into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order.status <> 'pendiente_pago' then
    raise exception 'Este pedido ya no admite un pago nuevo (estado actual: %).', v_order.status;
  end if;

  select p.id into v_payment_id
  from public.payments p
  where p.order_id = p_order_id and p.status = 'pendiente';

  if v_payment_id is null then
    insert into public.payments (order_id, method, amount, status)
    values (p_order_id, 'qr', v_order.total, 'pendiente')
    returning payments.id into v_payment_id;
  end if;

  return query
  select p.id, p.amount, p.method, p.status, v_order.order_number
  from public.payments p
  where p.id = v_payment_id;
end;
$$;

grant execute on function public.create_payment(uuid) to anon, authenticated;