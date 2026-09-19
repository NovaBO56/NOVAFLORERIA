-- ============================================================
-- NOVA FLORERÍA — FASE 10: CAJA
-- Migración 1/2: tablas, columna direction, RLS
-- ============================================================

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Caja principal',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  closed_by uuid references public.profiles(id) on delete restrict,
  closed_at timestamptz,
  expected_amount numeric(12,2),
  counted_amount numeric(12,2),
  difference_amount numeric(12,2),
  status text not null default 'abierta'
    check (status in ('abierta', 'cerrada')),
  closing_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete restrict,
  movement_type text not null
    check (movement_type in ('venta', 'ingreso', 'gasto', 'ajuste', 'devolucion')),
  payment_method text
    check (payment_method in ('qr', 'efectivo', 'otro')),
  amount numeric(12,2) not null check (amount > 0),
  direction text check (direction in ('entrada', 'salida')),
  order_id uuid references public.orders(id) on delete restrict,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  -- "direction" solo tiene sentido (y es obligatorio) para 'ajuste',
  -- que es el único tipo cuyo signo no se puede deducir del nombre.
  constraint cash_movements_direction_only_for_ajuste
    check (
      (movement_type = 'ajuste' and direction is not null)
      or (movement_type <> 'ajuste' and direction is null)
    )
);

create index if not exists idx_cash_movements_session on public.cash_movements(cash_session_id, created_at);
create index if not exists idx_cash_sessions_register_status on public.cash_sessions(cash_register_id, status);

-- Al menos una caja debe existir para poder abrir una sesión.
insert into public.cash_registers (name)
select 'Caja principal'
where not exists (select 1 from public.cash_registers);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.cash_registers enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists "cash_registers_staff_select" on public.cash_registers;
create policy "cash_registers_staff_select" on public.cash_registers
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "cash_sessions_staff_select" on public.cash_sessions;
create policy "cash_sessions_staff_select" on public.cash_sessions
for select to authenticated using (public.is_employee_or_admin());

-- insert/update de sesiones y movimientos SOLO vía funciones
-- (SECURITY DEFINER) — nunca de forma directa desde el cliente.
drop policy if exists "cash_movements_staff_select" on public.cash_movements;
create policy "cash_movements_staff_select" on public.cash_movements
for select to authenticated using (public.is_employee_or_admin());