-- ============================================================
-- NOVA FLORERÍA — FASE 5: PEDIDOS ONLINE
-- Migración 1/2: tablas y RLS
-- ============================================================

create sequence if not exists public.order_number_seq;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  birthday date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null default nextval('public.order_number_seq'),
  customer_id uuid references public.customers(id) on delete set null,
  order_type text not null default 'online'
    check (order_type in ('online', 'fisica')),
  status text not null default 'pendiente_pago'
    check (status in (
      'pendiente_pago', 'confirmado', 'en_preparacion',
      'listo', 'finalizado', 'cancelado', 'rechazado'
    )),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  customer_message text,
  internal_note text,
  idempotency_key text,
  reserved_until timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete restrict,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_number_unique unique (order_number),
  constraint orders_idempotency_unique unique (idempotency_key),
  constraint orders_cancel_reason_required
    check (status <> 'cancelado' or cancellation_reason is not null)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  quantity numeric(12,3) not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  personalization jsonb,
  message text,
  note text,
  created_at timestamptz not null default now()
);

-- Reserva de inventario: NO toca inventory_items.current_stock.
-- El "stock disponible para vender" = current_stock - reservas activas.
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released', 'cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create index if not exists idx_orders_status on public.orders(status, created_at);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_reservations_item_status on public.inventory_reservations(inventory_item_id, status, expires_at);
create index if not exists idx_reservations_order on public.inventory_reservations(order_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_reservations enable row level security;

drop policy if exists "customers_staff_select" on public.customers;
create policy "customers_staff_select" on public.customers
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "customers_staff_insert" on public.customers;
create policy "customers_staff_insert" on public.customers
for insert to authenticated with check (public.is_employee_or_admin());

drop policy if exists "customers_staff_update" on public.customers;
create policy "customers_staff_update" on public.customers
for update to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());

drop policy if exists "orders_staff_select" on public.orders;
create policy "orders_staff_select" on public.orders
for select to authenticated using (public.is_employee_or_admin());

-- Insert/update de orders solo vía funciones SECURITY DEFINER (más abajo),
-- así que aquí no se agregan policies de insert/update directas: el
-- personal nunca inserta una fila de orders a mano, siempre pasa por
-- create_order()/cancel_order().

drop policy if exists "order_items_staff_select" on public.order_items;
create policy "order_items_staff_select" on public.order_items
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "reservations_staff_select" on public.inventory_reservations;
create policy "reservations_staff_select" on public.inventory_reservations
for select to authenticated using (public.is_employee_or_admin());