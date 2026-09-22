-- ============================================================
-- NOVA FLORERÍA — FASE 13: NOTIFICACIONES Y HORARIOS
-- Migración 1/2: tablas, RLS, y cierre de un hueco de seguridad
-- ============================================================

-- ------------------------------------------------------------
-- FIX DE SEGURIDAD: system_settings nunca tuvo RLS activado
-- desde que se creó (antes de Fase 1). La ruta admin ya usaba
-- service role para leerla, así que la app nunca dependió de
-- RLS aquí — pero sin RLS, la clave anon podía leerla/escribirla
-- directo contra Supabase, sin pasar por la API.
-- ------------------------------------------------------------
alter table public.system_settings enable row level security;

drop policy if exists "system_settings_staff_select" on public.system_settings;
create policy "system_settings_staff_select" on public.system_settings
for select to authenticated using (public.is_employee_or_admin());

-- Sin policy de insert/update: la ruta admin ya usa service role
-- (createAdminClient), así que sigue funcionando exactamente igual.

-- ------------------------------------------------------------
-- NOTIFICATIONS — solo dentro del panel, nada de push/email/SMS.
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('nuevo_pedido', 'pago_pendiente', 'stock_bajo', 'stock_agotado', 'pedido_listo', 'cumpleanos', 'alerta')),
  message text not null,
  reference_type text,
  reference_id uuid,
  is_read boolean not null default false,
  read_by uuid references public.profiles(id) on delete restrict,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_unread on public.notifications(is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_staff_select" on public.notifications;
create policy "notifications_staff_select" on public.notifications
for select to authenticated using (public.is_employee_or_admin());

drop policy if exists "notifications_staff_update" on public.notifications;
create policy "notifications_staff_update" on public.notifications
for update to authenticated
using (public.is_employee_or_admin())
with check (public.is_employee_or_admin());

-- ------------------------------------------------------------
-- BUSINESS_HOURS — horario semanal, público de lectura (la web
-- necesita saber si está "abierto"/"cerrado" sin sesión).
-- day_of_week: 0=domingo ... 6=sábado (igual que extract(dow) de Postgres).
-- ------------------------------------------------------------
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint business_hours_day_unique unique (day_of_week),
  constraint business_hours_hours_valid
    check (is_closed = true or (opens_at is not null and closes_at is not null and opens_at < closes_at))
);

-- Semilla: todos los días 08:00–20:00 por defecto (ejemplo del
-- Maestro); el admin ajusta cada día desde el panel después.
insert into public.business_hours (day_of_week, opens_at, closes_at, is_closed)
select d, '08:00', '20:00', false
from generate_series(0, 6) as d
where not exists (select 1 from public.business_hours where day_of_week = d);

alter table public.business_hours enable row level security;

drop policy if exists "business_hours_public_select" on public.business_hours;
create policy "business_hours_public_select" on public.business_hours
for select to anon, authenticated using (true);

drop policy if exists "business_hours_admin_update" on public.business_hours;
create policy "business_hours_admin_update" on public.business_hours
for update to authenticated
using (public.is_admin())
with check (public.is_admin());