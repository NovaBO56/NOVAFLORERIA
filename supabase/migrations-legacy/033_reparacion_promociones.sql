-- ============================================================
-- NOVA FLORERÍA — 033 · REPARACIÓN DE PROMOCIONES
-- ============================================================
--
-- Problemas que corrige (detectados al revisar la migración 032):
--
-- 1. order_discounts.discount_type solo permitía
--    'porcentaje', 'monto_fijo' y 'manual'. apply_order_discount()
--    (032) inserta 'combo', así que cualquier pedido con un combo
--    fallaba con una violación de restricción.
--
-- 2. promotion_products no tenía política de UPDATE. Cambiar la
--    cantidad de un producto dentro de un combo afectaba 0 filas
--    y el API respondía "Ese producto no está en la promoción".
--
-- 3. El servidor no impedía descuentos porcentuales mayores a 100
--    ni fechas con fin anterior al inicio (solo la pantalla lo hacía).
--
-- No modifica migraciones anteriores. Es seguro volver a ejecutarla.
-- ============================================================


-- ------------------------------------------------------------
-- 1. order_discounts acepta 'combo'
--
-- Se busca la restricción por su contenido (la que menciona
-- 'monto_fijo') para no depender del nombre autogenerado.
-- La restricción order_discounts_manual_reason_required NO se toca.
-- ------------------------------------------------------------

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.order_discounts'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%monto_fijo%'
  loop
    execute format(
      'alter table public.order_discounts drop constraint %I',
      v_constraint.conname
    );
  end loop;
end
$$;

alter table public.order_discounts
  add constraint order_discounts_discount_type_check
  check (discount_type in ('porcentaje', 'monto_fijo', 'manual', 'combo'));


-- ------------------------------------------------------------
-- 2. Política de UPDATE para promotion_products (solo admin)
-- ------------------------------------------------------------

drop policy if exists "promotion_products_admin_update" on public.promotion_products;

create policy "promotion_products_admin_update" on public.promotion_products
for update to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ------------------------------------------------------------
-- 3. Límites que antes solo existían en la pantalla
--
-- NOT VALID: se aplican a todo INSERT/UPDATE nuevo sin revisar
-- filas históricas (la 032 ya limpió las promociones de prueba).
-- ------------------------------------------------------------

alter table public.promotions
  drop constraint if exists promotions_percent_max_check;

alter table public.promotions
  add constraint promotions_percent_max_check
  check (
    discount_type is distinct from 'porcentaje'
    or discount_value <= 100
  ) not valid;

alter table public.promotions
  drop constraint if exists promotions_dates_check;

alter table public.promotions
  add constraint promotions_dates_check
  check (
    starts_at is null
    or ends_at is null
    or ends_at > starts_at
  ) not valid;