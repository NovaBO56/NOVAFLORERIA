-- ============================================================
-- NOVA FLORERÍA — FASE 3: INVENTARIO
-- Migración 1/2: tablas, índices y RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. INVENTORY_ITEMS — el catálogo de inventario en sí
--    (flores, insumos, componentes, productos)
-- ------------------------------------------------------------
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  item_type text not null
    check (item_type in ('flor', 'insumo', 'componente', 'producto')),
  unit text not null default 'unidad',
  current_stock numeric(12,3) not null default 0
    check (current_stock >= 0),
  minimum_stock numeric(12,3) not null default 0
    check (minimum_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_sku_unique unique (sku)
);

-- ------------------------------------------------------------
-- 2. INVENTORY_ENTRIES — registro de mercancía que llegó
--    (el lote NACE de aquí, nunca se crea a mano)
-- ------------------------------------------------------------
create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2) check (unit_cost >= 0),
  supplier_name text,
  notes text,
  received_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. INVENTORY_LOTS — se crea SOLO por trigger, nunca a mano
-- ------------------------------------------------------------
create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  inventory_entry_id uuid not null references public.inventory_entries(id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  initial_quantity numeric(12,3) not null check (initial_quantity > 0),
  remaining_quantity numeric(12,3) not null check (remaining_quantity >= 0),
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint inventory_lots_quantity_valid
    check (remaining_quantity <= initial_quantity)
);

-- ------------------------------------------------------------
-- 4. INVENTORY_MOVEMENTS — bitácora. Solo INSERT, jamás UPDATE/DELETE.
-- ------------------------------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete restrict,
  movement_type text not null
    check (movement_type in ('entrada', 'salida', 'merma', 'ajuste', 'devolucion', 'reversion')),
  quantity numeric(12,3) not null check (quantity > 0),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. INVENTORY_WASTE — mermas
-- ------------------------------------------------------------
create table if not exists public.inventory_waste (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. INVENTORY_ADJUSTMENTS — ajustes manuales (motivo obligatorio)
-- ------------------------------------------------------------
create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_delta numeric(12,3) not null check (quantity_delta <> 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_inventory_items_type on public.inventory_items(item_type);
create index if not exists idx_inventory_lots_fifo on public.inventory_lots(inventory_item_id, received_at, created_at);
create index if not exists idx_inventory_movements_item on public.inventory_movements(inventory_item_id, created_at);
create index if not exists idx_inventory_entries_item on public.inventory_entries(inventory_item_id, received_at);
create index if not exists idx_inventory_waste_item on public.inventory_waste(inventory_item_id, created_at);
create index if not exists idx_inventory_adjustments_item on public.inventory_adjustments(inventory_item_id, created_at);

-- ------------------------------------------------------------
-- RLS — igual regla que el catálogo: empleado y administrador
-- gestionan, nadie más. La bitácora (movements) es de solo
-- lectura para todos los que tengan acceso: nadie puede editar
-- ni borrar historial (no hay policy de update/delete para esa
-- tabla, lo cual la deja bloqueada por defecto).
-- ------------------------------------------------------------
alter table public.inventory_items enable row level security;
alter table public.inventory_entries enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_waste enable row level security;
alter table public.inventory_adjustments enable row level security;

-- inventory_items: select/insert/update (nunca delete, se desactiva con is_active)
drop policy if exists "inventory_items_staff_select" on public.inventory_items;
create policy "inventory_items_staff_select" on public.inventory_items
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "inventory_items_staff_insert" on public.inventory_items;
create policy "inventory_items_staff_insert" on public.inventory_items
for insert to authenticated with check (public.is_employee_or_admin());

drop policy if exists "inventory_items_staff_update" on public.inventory_items;
create policy "inventory_items_staff_update" on public.inventory_items
for update to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());

-- inventory_entries: select/insert únicamente (nunca se edita una entrada ya registrada)
drop policy if exists "inventory_entries_staff_select" on public.inventory_entries;
create policy "inventory_entries_staff_select" on public.inventory_entries
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "inventory_entries_staff_insert" on public.inventory_entries;
create policy "inventory_entries_staff_insert" on public.inventory_entries
for insert to authenticated with check (public.is_employee_or_admin());

-- inventory_lots: solo lectura desde la API (los crea el trigger, con privilegios de servidor)
drop policy if exists "inventory_lots_staff_select" on public.inventory_lots;
create policy "inventory_lots_staff_select" on public.inventory_lots
for select to authenticated using (public.is_employee_or_admin());

-- inventory_movements: solo lectura desde la API (los crea el trigger)
drop policy if exists "inventory_movements_staff_select" on public.inventory_movements;
create policy "inventory_movements_staff_select" on public.inventory_movements
for select to authenticated using (public.is_employee_or_admin());

-- inventory_waste: select/insert (nunca se edita/borra una merma ya registrada)
drop policy if exists "inventory_waste_staff_select" on public.inventory_waste;
create policy "inventory_waste_staff_select" on public.inventory_waste
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "inventory_waste_staff_insert" on public.inventory_waste;
create policy "inventory_waste_staff_insert" on public.inventory_waste
for insert to authenticated with check (public.is_employee_or_admin());

-- inventory_adjustments: select/insert (nunca se edita/borra un ajuste ya registrado)
drop policy if exists "inventory_adjustments_staff_select" on public.inventory_adjustments;
create policy "inventory_adjustments_staff_select" on public.inventory_adjustments
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "inventory_adjustments_staff_insert" on public.inventory_adjustments;
create policy "inventory_adjustments_staff_insert" on public.inventory_adjustments
for insert to authenticated with check (public.is_employee_or_admin());