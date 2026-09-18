-- ============================================================
-- NOVA FLORERÍA — FASE 6: PAGO QR
-- Migración 1/2: tablas, bucket de Storage y RLS
-- ============================================================

create table if not exists public.payment_qr_config (
  id uuid primary key default gen_random_uuid(),
  qr_storage_path text,
  qr_public_url text,
  account_label text,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  method text not null default 'qr'
    check (method in ('qr', 'efectivo', 'otro')),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'rechazado', 'reembolsado')),
  reference text,
  rejection_reason text,
  confirmed_by uuid references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete restrict,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_confirmation_data_valid
    check (
      (status = 'confirmado' and confirmed_by is not null and confirmed_at is not null)
      or status <> 'confirmado'
    ),
  constraint payments_rejection_data_valid
    check (
      (status = 'rechazado' and rejection_reason is not null and rejected_by is not null and rejected_at is not null)
      or status <> 'rechazado'
    )
);

create index if not exists idx_payments_order on public.payments(order_id, created_at desc);
create index if not exists idx_payments_status on public.payments(status);

-- ------------------------------------------------------------
-- Bucket de Storage para la imagen del QR. Público de lectura
-- (el cliente necesita verlo sin sesión para pagar); toda
-- escritura pasa siempre por la API con service role, igual que
-- product-images, así que no hace falta política de storage
-- para insert/update/delete.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-qr', 'payment-qr', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.payment_qr_config enable row level security;
alter table public.payments enable row level security;

drop policy if exists "qr_config_public_select" on public.payment_qr_config;
create policy "qr_config_public_select" on public.payment_qr_config
for select to anon, authenticated using (is_active = true);

drop policy if exists "payments_staff_select" on public.payments;
create policy "payments_staff_select" on public.payments
for select to authenticated using (public.is_employee_or_admin());