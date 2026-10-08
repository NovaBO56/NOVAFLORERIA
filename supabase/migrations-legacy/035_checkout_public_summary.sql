-- Extiende la consulta pública existente sin abrir RLS ni exponer datos administrativos.
create or replace function public.track_order_details(
  p_customer_phone text, p_order_number bigint default null, p_order_id uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_order public.orders%rowtype; v_summary jsonb;
begin
  select o.* into v_order from public.orders o
  join public.customers c on c.id = o.customer_id
  where (case when p_order_number is not null then o.order_number = p_order_number else o.id = p_order_id end)
    and o.deleted_at is null
    and (c.phone = trim(p_customer_phone) or c.whatsapp = trim(p_customer_phone));
  if v_order.id is null then
    raise exception 'No encontramos un pedido con esos datos.';
  end if;
  select to_jsonb(t) into v_summary from public.track_order(v_order.order_number, trim(p_customer_phone)) t;
  return v_summary || jsonb_build_object(
    'id', v_order.id, 'reserved_until', v_order.reserved_until,
    'payment_status', (select p.status from public.payments p where p.order_id = v_order.id order by p.created_at desc, p.id desc limit 1)
  );
end;
$$;
revoke all on function public.track_order_details(text, bigint, uuid) from public;
grant execute on function public.track_order_details(text, bigint, uuid) to anon, authenticated;
