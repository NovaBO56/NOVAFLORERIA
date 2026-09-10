-- ============================================================
-- NOVA FLORERÍA
-- FASE DE CORRECCIONES
-- Corrección RLS - FASE 2
-- ============================================================

-- Activar Row Level Security en las tablas de catálogo.
alter table public.categories enable row level security;
alter table public.seasons enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_components enable row level security;


-- ============================================================
-- CATEGORIES
-- ============================================================

drop policy if exists "categories_admin_all" on public.categories;

create policy "categories_admin_all"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SEASONS
-- ============================================================

drop policy if exists "seasons_admin_all" on public.seasons;

create policy "seasons_admin_all"
on public.seasons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- PRODUCTS
-- ============================================================

drop policy if exists "products_admin_all" on public.products;

create policy "products_admin_all"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

drop policy if exists "product_images_admin_all" on public.product_images;

create policy "product_images_admin_all"
on public.product_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- PRODUCT COMPONENTS
-- ============================================================

drop policy if exists "product_components_admin_all"
on public.product_components;

create policy "product_components_admin_all"
on public.product_components
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());