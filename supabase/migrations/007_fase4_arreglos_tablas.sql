-- ============================================================
-- NOVA FLORERÍA — FASE 4: ARREGLOS Y CONSUMO DE INVENTARIO
-- Migración 1/2: tablas y RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRODUCT_INVENTORY_REQUIREMENTS — la "receta" de cada
--    producto: qué ítems de inventario necesita y cuánto.
-- ------------------------------------------------------------
create table if not exists public.product_inventory_requirements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint product_inventory_requirements_unique
    unique (product_id, inventory_item_id)
);

-- ------------------------------------------------------------
-- 2. CUSTOMIZATION_OPTIONS — personalización por producto
-- ------------------------------------------------------------
create table if not exists public.customization_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_type text not null
    check (option_type in (
      'cantidad_rosas', 'color', 'tipo_flor', 'oso', 'decoracion', 'otro'
    )),
  name text not null,
  value text,
  extra_price numeric(12,2) not null default 0 check (extra_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_pir_product on public.product_inventory_requirements(product_id);
create index if not exists idx_pir_item on public.product_inventory_requirements(inventory_item_id);
create index if not exists idx_customization_product on public.customization_options(product_id);

-- ------------------------------------------------------------
-- RLS — mismo patrón que el resto del catálogo/inventario:
-- empleado y administrador gestionan, nadie más.
-- ------------------------------------------------------------
alter table public.product_inventory_requirements enable row level security;
alter table public.customization_options enable row level security;

drop policy if exists "pir_staff_select" on public.product_inventory_requirements;
create policy "pir_staff_select" on public.product_inventory_requirements
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "pir_staff_insert" on public.product_inventory_requirements;
create policy "pir_staff_insert" on public.product_inventory_requirements
for insert to authenticated with check (public.is_employee_or_admin());

drop policy if exists "pir_staff_update" on public.product_inventory_requirements;
create policy "pir_staff_update" on public.product_inventory_requirements
for update to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());

drop policy if exists "pir_staff_delete" on public.product_inventory_requirements;
create policy "pir_staff_delete" on public.product_inventory_requirements
for delete to authenticated using (public.is_employee_or_admin());

drop policy if exists "customization_staff_select" on public.customization_options;
create policy "customization_staff_select" on public.customization_options
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "customization_staff_insert" on public.customization_options;
create policy "customization_staff_insert" on public.customization_options
for insert to authenticated with check (public.is_employee_or_admin());

drop policy if exists "customization_staff_update" on public.customization_options;
create policy "customization_staff_update" on public.customization_options
for update to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());

drop policy if exists "customization_staff_delete" on public.customization_options;
create policy "customization_staff_delete" on public.customization_options
for delete to authenticated using (public.is_employee_or_admin());