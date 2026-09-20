-- ============================================================
-- NOVA FLORERÍA — FASE 11: CLIENTES Y PROMOCIONES
-- Migración 1/2: tablas y RLS
-- ============================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  promotion_type text not null
    check (promotion_type in ('cumpleanos', 'recurrente', 'temporada', 'combo', 'descuento')),
  discount_type text not null
    check (discount_type in ('porcentaje', 'monto_fijo')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  minimum_purchase numeric(12,2) check (minimum_purchase >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

create table if not exists public.promotion_customers (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  primary key (promotion_id, customer_id)
);

create table if not exists public.order_discounts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  promotion_id uuid references public.promotions(id) on delete set null,
  discount_type text not null
    check (discount_type in ('porcentaje', 'monto_fijo', 'manual')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  amount_applied numeric(12,2) not null check (amount_applied >= 0),
  reason text,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  -- Un descuento manual siempre debe tener motivo. Uno por
  -- promoción no lo necesita (la razón es la promoción misma).
  constraint order_discounts_manual_reason_required
    check (discount_type <> 'manual' or (reason is not null and trim(reason) <> ''))
);

create index if not exists idx_promotion_products_product on public.promotion_products(product_id);
create index if not exists idx_promotion_customers_customer on public.promotion_customers(customer_id);
create index if not exists idx_order_discounts_order on public.order_discounts(order_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.promotion_customers enable row level security;
alter table public.order_discounts enable row level security;

-- promotions: el personal las VE (para poder aplicarlas), pero
-- solo el administrador las crea/edita/desactiva.
drop policy if exists "promotions_staff_select" on public.promotions;
create policy "promotions_staff_select" on public.promotions
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "promotions_admin_insert" on public.promotions;
create policy "promotions_admin_insert" on public.promotions
for insert to authenticated with check (public.is_admin());

drop policy if exists "promotions_admin_update" on public.promotions;
create policy "promotions_admin_update" on public.promotions
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Un pedido online público necesita poder LEER una promoción
-- para validarla (create_order corre como SECURITY DEFINER, así
-- que esto no es estrictamente necesario para esa función, pero
-- se deja consistente por si algo público la consulta directo).
drop policy if exists "promotions_public_select_active" on public.promotions;
create policy "promotions_public_select_active" on public.promotions
for select to anon using (is_active = true);

-- promotion_products / promotion_customers: mismo patrón,
-- gestión solo admin, lectura para todo el personal.
drop policy if exists "promotion_products_staff_select" on public.promotion_products;
create policy "promotion_products_staff_select" on public.promotion_products
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "promotion_products_admin_insert" on public.promotion_products;
create policy "promotion_products_admin_insert" on public.promotion_products
for insert to authenticated with check (public.is_admin());

drop policy if exists "promotion_products_admin_delete" on public.promotion_products;
create policy "promotion_products_admin_delete" on public.promotion_products
for delete to authenticated using (public.is_admin());

drop policy if exists "promotion_customers_staff_select" on public.promotion_customers;
create policy "promotion_customers_staff_select" on public.promotion_customers
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "promotion_customers_admin_insert" on public.promotion_customers;
create policy "promotion_customers_admin_insert" on public.promotion_customers
for insert to authenticated with check (public.is_admin());

drop policy if exists "promotion_customers_admin_delete" on public.promotion_customers;
create policy "promotion_customers_admin_delete" on public.promotion_customers
for delete to authenticated using (public.is_admin());

-- order_discounts: bitácora, solo lectura para el personal; el
-- insert pasa siempre por apply_order_discount() (SECURITY DEFINER).
drop policy if exists "order_discounts_staff_select" on public.order_discounts;
create policy "order_discounts_staff_select" on public.order_discounts
for select to authenticated using (public.is_employee_or_admin());

-- ------------------------------------------------------------
-- customers: ya existía desde Fase 5 con RLS de solo staff.
-- Fase 11 no cambia sus políticas; solo se construye la API
-- de gestión (listar/editar) sobre lo que ya existe.
-- ------------------------------------------------------------