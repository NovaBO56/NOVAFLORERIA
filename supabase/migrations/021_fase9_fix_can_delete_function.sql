-- ============================================================
-- NOVA FLORERÍA — FASE 9: fix — can_delete_cancelled_order()
-- nunca se había creado en la base real (solo existía como
-- referencia en MASTER_DATABASE_FLORERIA.sql, que es un archivo
-- de diseño, no un script para ejecutar).
-- ============================================================

create or replace function public.can_delete_cancelled_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    and exists (
      select 1
      from public.orders
      where id = p_order_id
        and status = 'cancelado'
        and deleted_at is null
    );
$$;

grant execute on function public.can_delete_cancelled_order(uuid) to authenticated;