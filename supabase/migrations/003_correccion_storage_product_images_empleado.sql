-- ============================================================
-- NOVA FLORERÍA
-- FASE DE CORRECCIONES
-- Corrección Storage: imágenes de catálogo
-- Empleado + administrador pueden administrar imágenes
-- ============================================================

drop policy if exists "product_images_admin_insert"
on storage.objects;

drop policy if exists "product_images_admin_update"
on storage.objects;

drop policy if exists "product_images_admin_delete"
on storage.objects;

create policy "product_images_employee_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_employee_or_admin()
);

create policy "product_images_employee_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_employee_or_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_employee_or_admin()
);

create policy "product_images_employee_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_employee_or_admin()
);