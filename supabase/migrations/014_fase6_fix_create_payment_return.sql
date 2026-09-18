-- ============================================================
-- NOVA FLORERÍA — FASE 6: fix de create_payment()
-- create_payment() ahora devuelve directamente los campos
-- seguros del pago (id, amount, method, status), en vez de
-- solo el uuid. Así el checkout público nunca necesita hacer
-- un SELECT aparte sobre "payments" (que sigue bloqueada por
-- RLS solo para personal, sin ningún cambio ahí).
-- ============================================================

drop function if exists public.create_payment(uuid);

create or replace function public.create_payment(
  p_order_id uuid
)
returns table (
  id uuid,
  amount numeric,
  method text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_payment_id uuid;
begin
  select o.id, o.status, o.total into v_order
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
  select p.id, p.amount, p.method, p.status
  from public.payments p
  where p.id = v_payment_id;
end;
$$;

grant execute on function public.create_payment(uuid) to anon, authenticated;