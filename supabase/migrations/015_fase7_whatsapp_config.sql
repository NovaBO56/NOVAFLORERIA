-- ============================================================
-- NOVA FLORERÍA — FASE 7: WHATSAPP
-- Migración 1/2: configuración del número de WhatsApp
-- ============================================================

create table if not exists public.whatsapp_config (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_config enable row level security;

-- Lectura pública SOLO de la fila activa (el cliente necesita el
-- número sin sesión para armar el mensaje). Sin policies de
-- insert/update/delete: siempre se administra vía API con
-- service role, igual que payment_qr_config.
drop policy if exists "whatsapp_config_public_select" on public.whatsapp_config;
create policy "whatsapp_config_public_select" on public.whatsapp_config
for select to anon, authenticated using (is_active = true);