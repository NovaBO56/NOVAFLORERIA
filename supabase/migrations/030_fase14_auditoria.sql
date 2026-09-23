-- ============================================================
-- NOVA FLORERÍA — FASE 14: AUDITORÍA
-- Estrategia confirmada con el usuario: aprovechar lo que ya
-- queda registrado en sus propias tablas (cancelaciones, pagos
-- confirmados/rechazados, movimientos de inventario, devoluciones,
-- descuentos) + agregar solo lo que faltaba (cambios de precio y
-- de producto, que hoy no se registran en ningún lado) + una
-- función que unifica todo en un solo historial de auditoría.
-- ============================================================

-- ------------------------------------------------------------
-- 1. audit_logs — tabla nueva, solo para lo que no tenía dónde
--    quedar registrado (por ahora: cambios de producto/precio).
--    Solo INSERT, nunca UPDATE/DELETE. Nadie escribe acá
--    directamente: solo el trigger de productos (más los que se
--    agreguen a futuro si aparecen más "huecos" sin auditar).
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid not null,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_table_record
  on public.audit_logs (table_name, record_id, created_at desc);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at desc);

-- RLS habilitado sin policies: nadie (ni anon ni authenticated) puede
-- leer o escribir esta tabla directamente. El trigger de abajo es
-- security definer (dueño de la tabla), así que inserta sin problema
-- aunque RLS esté activo — mismo patrón ya usado en check_rate_limit().
-- La lectura queda detrás de get_audit_trail(), que exige is_admin().
alter table public.audit_logs enable row level security;

-- ------------------------------------------------------------
-- 2. Trigger de productos: captura cambios de precio y de
--    producto en general. Es la única pieza que realmente
--    faltaba — el resto de las acciones auditables ya quedan
--    registradas en sus propias tablas (orders, payments,
--    inventory_movements, sale_returns, order_discounts).
-- ------------------------------------------------------------
create or replace function public.audit_products_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, before, after)
  values (
    auth.uid(),
    case
      when OLD.price is distinct from NEW.price then 'precio_modificado'
      else 'producto_modificado'
    end,
    'products',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );

  return NEW;
end;
$$;

drop trigger if exists trg_audit_products on public.products;

-- El WHEN excluye updated_at a propósito: si solo cambió esa
-- columna (un "touch" sin cambios reales), no queremos ruido en
-- el historial de auditoría.
create trigger trg_audit_products
after update on public.products
for each row
when (
  OLD.name is distinct from NEW.name
  or OLD.description is distinct from NEW.description
  or OLD.price is distinct from NEW.price
  or OLD.category_id is distinct from NEW.category_id
  or OLD.occasion is distinct from NEW.occasion
  or OLD.season_id is distinct from NEW.season_id
  or OLD.is_featured is distinct from NEW.is_featured
  or OLD.is_available is distinct from NEW.is_available
  or OLD.is_sold_out is distinct from NEW.is_sold_out
  or OLD.catalog_order is distinct from NEW.catalog_order
  or OLD.is_active is distinct from NEW.is_active
)
execute function public.audit_products_change();

-- ------------------------------------------------------------
-- 3. Vista unificada: junta audit_logs con lo que ya se auditaba
--    en cada tabla propia, en una sola forma consistente
--    (usuario, acción, tabla, registro, antes, después, motivo,
--    fecha/hora).
-- ------------------------------------------------------------
create or replace view public.audit_trail as
select user_id, action, table_name, record_id, before, after, reason, created_at
from public.audit_logs

union all

select
  cancelled_by, 'pedido_cancelado', 'orders', id,
  null::jsonb, null::jsonb, cancellation_reason, cancelled_at
from public.orders
where status = 'cancelado' and cancelled_by is not null

union all

select
  confirmed_by, 'pago_confirmado', 'payments', id,
  null::jsonb, null::jsonb, null::text, confirmed_at
from public.payments
where status = 'confirmado' and confirmed_by is not null

union all

select
  rejected_by, 'pago_rechazado', 'payments', id,
  null::jsonb, null::jsonb, rejection_reason, rejected_at
from public.payments
where status = 'rechazado' and rejected_by is not null

union all

select
  created_by, 'inventario_' || movement_type, 'inventory_movements', id,
  null::jsonb, null::jsonb, reason, created_at
from public.inventory_movements
where movement_type in ('merma', 'ajuste', 'reversion')

union all

select
  created_by, 'devolucion_registrada', 'sale_returns', id,
  null::jsonb, null::jsonb, reason, created_at
from public.sale_returns

union all

select
  created_by, 'descuento_aplicado', 'order_discounts', id,
  null::jsonb, null::jsonb, reason, created_at
from public.order_discounts;

-- La vista NO se expone directamente: cualquiera con acceso de
-- lectura a orders/payments/etc. podría consultarla y ver acciones
-- de auditoría de otras personas fuera de su propio contexto de
-- trabajo normal. Se revoca el acceso directo y se obliga a pasar
-- por get_audit_trail(), que exige rol administrador — igual que
-- el Maestro exige que auditoría sea exclusiva de administrador.
revoke all on public.audit_trail from public, anon, authenticated;

-- ------------------------------------------------------------
-- 4. get_audit_trail: único punto de lectura del historial de
--    auditoría. Solo administrador.
-- ------------------------------------------------------------
create or replace function public.get_audit_trail(
  p_limit int default 100,
  p_offset int default 0
)
returns setof public.audit_trail
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ver el historial de auditoría.';
  end if;

  if p_limit is null or p_limit <= 0 or p_limit > 200 then
    p_limit := 100;
  end if;

  if p_offset is null or p_offset < 0 then
    p_offset := 0;
  end if;

  return query
    select *
    from public.audit_trail
    order by created_at desc
    limit p_limit offset p_offset;
end;
$$;

grant execute on function public.get_audit_trail(int, int) to authenticated;