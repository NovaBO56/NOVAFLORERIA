-- ============================================================
-- NOVA FLORERÍA — FASE 9: CANCELACIONES, DEVOLUCIONES Y ELIMINACIÓN
-- Migración 1/2: columna deleted_at + tablas nuevas + RLS
-- ============================================================

-- can_delete_cancelled_order() (ya existente desde el SQL maestro)
-- depende de esta columna, que nunca se había agregado.
alter table public.orders
  add column if not exists deleted_at timestamptz;

create table if not exists public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  type text not null
    check (type in ('devolucion', 'reintegro')),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.order_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobada', 'rechazada')),
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  constraint deletion_request_review_data_valid
    check (
      (status = 'pendiente' and reviewed_by is null and reviewed_at is null)
      or
      (status <> 'pendiente' and reviewed_by is not null and reviewed_at is not null)
    )
);

create index if not exists idx_sale_returns_order on public.sale_returns(order_id);
create index if not exists idx_deletion_requests_order on public.order_deletion_requests(order_id);
create index if not exists idx_deletion_requests_status on public.order_deletion_requests(status);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.sale_returns enable row level security;
alter table public.order_deletion_requests enable row level security;

-- sale_returns: solo lectura para personal; la creación pasa
-- siempre por create_sale_return() (SECURITY DEFINER).
drop policy if exists "sale_returns_staff_select" on public.sale_returns;
create policy "sale_returns_staff_select" on public.sale_returns
for select to authenticated using (public.is_employee_or_admin());

-- order_deletion_requests: personal ve todas (para que el
-- administrador pueda revisarlas); la creación/revisión pasa
-- siempre por las funciones correspondientes.
drop policy if exists "deletion_requests_staff_select" on public.order_deletion_requests;
create policy "deletion_requests_staff_select" on public.order_deletion_requests
for select to authenticated using (public.is_employee_or_admin());