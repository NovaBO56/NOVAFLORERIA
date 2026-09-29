-- ============================================================
-- NOVA FLORERÍA — CATÁLOGO PÚBLICO (lectura para "anon")
-- Ajustá el número de archivo al correlativo real de tu carpeta
-- supabase/migrations/ (este entorno no tiene tu listado actual).
--
-- Hasta ahora ninguna tabla del catálogo (products, categories,
-- seasons, product_images, product_components,
-- customization_options) tenía política de SELECT para "anon".
-- Sin esto, un visitante sin sesión no puede ver nada del
-- catálogo, aunque exista el endpoint público.
--
-- Regla: el público solo ve lo ACTIVO. "Disponible"/"Agotado"
-- son datos a mostrar (el Maestro los define como estados del
-- producto), no un motivo para ocultar el producto del catálogo.
-- No se toca ninguna política existente de empleado/admin: son
-- políticas permisivas adicionales, se combinan con OR.
-- ============================================================

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select" on public.products
for select to anon, authenticated
using (is_active = true);

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select" on public.categories
for select to anon, authenticated
using (is_active = true);

drop policy if exists "seasons_public_select" on public.seasons;
create policy "seasons_public_select" on public.seasons
for select to anon, authenticated
using (is_active = true);

-- Imágenes: visibles si el producto al que pertenecen es visible.
drop policy if exists "product_images_public_select" on public.product_images;
create policy "product_images_public_select" on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active = true
  )
);

-- Componentes de combos: visibles si el producto padre es visible.
-- (No se exige que el producto componente también esté activo:
-- si un combo lo incluye, se sigue mostrando como parte del combo.)
drop policy if exists "product_components_public_select" on public.product_components;
create policy "product_components_public_select" on public.product_components
for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_components.parent_product_id and p.is_active = true
  )
);

-- Opciones de personalización: visibles si están activas Y el
-- producto al que pertenecen también.
drop policy if exists "customization_options_public_select" on public.customization_options;
create policy "customization_options_public_select" on public.customization_options
for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.products p
    where p.id = customization_options.product_id and p.is_active = true
  )
);
