-- ============================================================
-- NOVA FLORERÍA — FASE DE CORRECCIONES
-- Corrección RLS: profiles no tenía ninguna política
-- ============================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());