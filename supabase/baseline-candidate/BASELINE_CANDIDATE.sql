-- NOVA FLORERÍA: CANDIDATA, NO APROBADA NI EJECUTADA.
-- Solo para una instancia Supabase NUEVA con auth/storage y roles provisionados.
-- No ejecutar en el proyecto vinculado. No es un dump ni una reconciliación.
-- Decisiones propuestas: DRIFT_DECISIONS.md y SECURITY_REVIEW.md.
-- Sin filas reales, historial, valores actuales de secuencias ni migración 035.
BEGIN;
SET LOCAL search_path = public, extensions, pg_catalog;
SET LOCAL check_function_bodies = off;
DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Ejecutar únicamente como postgres en instancia nueva aislada.';
  END IF;
  IF to_regclass('auth.users') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'Requiere plataforma Supabase provisionada (auth/storage).';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')) THEN
    RAISE EXCEPTION 'public debe estar vacío: esta candidata no se aplica sobre una base existente.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created' AND tgrelid='auth.users'::regclass) THEN
    RAISE EXCEPTION 'Integración Auth existente: revisar antes de continuar.';
  END IF;
END;
$guard$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- plpgsql, auth.uid(), roles y tablas de Storage/Auth son prerrequisitos de Supabase.
-- No recrear esquemas internos, event triggers de plataforma, pg_stat_statements o Vault.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;


CREATE SEQUENCE "public"."order_number_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 NO CYCLE;

CREATE TABLE "public"."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "table_name" text NOT NULL,
  "record_id" uuid NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."business_hours" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "day_of_week" smallint NOT NULL,
  "opens_at" time without time zone,
  "closes_at" time without time zone,
  "is_closed" boolean DEFAULT false NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."cash_movements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cash_session_id" uuid NOT NULL,
  "movement_type" text NOT NULL,
  "payment_method" text,
  "amount" numeric(12,2) NOT NULL,
  "direction" text,
  "order_id" uuid,
  "reason" text,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."cash_registers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text DEFAULT 'Caja principal'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."cash_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cash_register_id" uuid NOT NULL,
  "opened_by" uuid NOT NULL,
  "opened_at" timestamp with time zone DEFAULT now() NOT NULL,
  "opening_amount" numeric(12,2) DEFAULT 0 NOT NULL,
  "closed_by" uuid,
  "closed_at" timestamp with time zone,
  "expected_amount" numeric(12,2),
  "counted_amount" numeric(12,2),
  "difference_amount" numeric(12,2),
  "status" text DEFAULT 'abierta'::text NOT NULL,
  "closing_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."customers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "whatsapp" text,
  "email" text,
  "birthday" date,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."customization_option_inventory_requirements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customization_option_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."customization_options" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "option_type" text NOT NULL,
  "name" text NOT NULL,
  "value" text,
  "extra_price" numeric(12,2) DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_adjustments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity_delta" numeric(12,3) NOT NULL,
  "reason" text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_entries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "unit_cost" numeric(12,2),
  "supplier_name" text,
  "notes" text,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "sku" text,
  "item_type" text NOT NULL,
  "unit" text DEFAULT 'unidad'::text NOT NULL,
  "current_stock" numeric(12,3) DEFAULT 0 NOT NULL,
  "minimum_stock" numeric(12,3) DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_lots" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inventory_entry_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "initial_quantity" numeric(12,3) NOT NULL,
  "remaining_quantity" numeric(12,3) NOT NULL,
  "received_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_movements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "lot_id" uuid,
  "movement_type" text NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "reference_type" text,
  "reference_id" uuid,
  "reason" text,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."inventory_reservations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "status" text DEFAULT 'reserved'::text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "released_at" timestamp with time zone
);

CREATE TABLE "public"."inventory_waste" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "lot_id" uuid,
  "quantity" numeric(12,3) NOT NULL,
  "reason" text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "type" text NOT NULL,
  "message" text NOT NULL,
  "reference_type" text,
  "reference_id" uuid,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_by" uuid,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."order_deletion_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "requested_by" uuid NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pendiente'::text NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "review_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."order_discounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "promotion_id" uuid,
  "discount_type" text NOT NULL,
  "discount_value" numeric(12,2) NOT NULL,
  "amount_applied" numeric(12,2) NOT NULL,
  "reason" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."order_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name_snapshot" text NOT NULL,
  "unit_price_snapshot" numeric(12,2) NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "line_total" numeric(12,2) NOT NULL,
  "personalization" jsonb,
  "message" text,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."orders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_number" bigint DEFAULT nextval('order_number_seq'::regclass) NOT NULL,
  "customer_id" uuid,
  "order_type" text DEFAULT 'online'::text NOT NULL,
  "status" text DEFAULT 'pendiente_pago'::text NOT NULL,
  "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
  "discount_total" numeric(12,2) DEFAULT 0 NOT NULL,
  "total" numeric(12,2) DEFAULT 0 NOT NULL,
  "customer_message" text,
  "internal_note" text,
  "idempotency_key" text,
  "reserved_until" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "cancelled_by" uuid,
  "cancellation_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE "public"."payment_qr_config" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "qr_storage_path" text,
  "qr_public_url" text,
  "account_label" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "method" text DEFAULT 'qr'::text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "status" text DEFAULT 'pendiente'::text NOT NULL,
  "reference" text,
  "rejection_reason" text,
  "confirmed_by" uuid,
  "confirmed_at" timestamp with time zone,
  "rejected_by" uuid,
  "rejected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."product_components" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "parent_product_id" uuid NOT NULL,
  "component_product_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."product_images" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "public_url" text,
  "alt_text" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "mime_type" text,
  "width" integer,
  "height" integer,
  "file_size_bytes" bigint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."product_inventory_requirements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."products" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price" numeric(12,2) NOT NULL,
  "category_id" uuid,
  "occasion" text,
  "season_id" uuid,
  "is_featured" boolean DEFAULT false NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "is_sold_out" boolean DEFAULT false NOT NULL,
  "catalog_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."profiles" (
  "id" uuid NOT NULL,
  "full_name" text,
  "role" text DEFAULT 'empleado'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."promotion_products" (
  "promotion_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "quantity" numeric(12,3) DEFAULT 1 NOT NULL
);

CREATE TABLE "public"."promotions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "promotion_type" text NOT NULL,
  "discount_type" text,
  "discount_value" numeric(12,2),
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "minimum_purchase" numeric(12,2),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "combo_price" numeric(12,2)
);

CREATE TABLE "public"."rate_limit_attempts" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "ip" text NOT NULL,
  "route" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."sale_returns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "type" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "reason" text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."seasons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."system_settings" (
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "is_critical" boolean DEFAULT false NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."whatsapp_config" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "phone_number" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_contract jsonb;
ALTER TABLE public.inventory_movements ALTER COLUMN created_by DROP NOT NULL;
COMMENT ON COLUMN public.orders.request_contract IS 'Contrato normalizado original e inmutable; NULL identifica pedidos legacy no verificables. No se publica por RPC de seguimiento.';

-- La vista define un tipo de fila requerido por get_audit_trail; crear antes de funciones.
CREATE VIEW "public"."audit_trail" AS
SELECT audit_logs.user_id,
    audit_logs.action,
    audit_logs.table_name,
    audit_logs.record_id,
    audit_logs.before,
    audit_logs.after,
    audit_logs.reason,
    audit_logs.created_at
   FROM audit_logs
UNION ALL
 SELECT orders.cancelled_by AS user_id,
    'pedido_cancelado'::text AS action,
    'orders'::text AS table_name,
    orders.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    orders.cancellation_reason AS reason,
    orders.cancelled_at AS created_at
   FROM orders
  WHERE orders.status = 'cancelado'::text AND orders.cancelled_by IS NOT NULL
UNION ALL
 SELECT payments.confirmed_by AS user_id,
    'pago_confirmado'::text AS action,
    'payments'::text AS table_name,
    payments.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    NULL::text AS reason,
    payments.confirmed_at AS created_at
   FROM payments
  WHERE payments.status = 'confirmado'::text AND payments.confirmed_by IS NOT NULL
UNION ALL
 SELECT payments.rejected_by AS user_id,
    'pago_rechazado'::text AS action,
    'payments'::text AS table_name,
    payments.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    payments.rejection_reason AS reason,
    payments.rejected_at AS created_at
   FROM payments
  WHERE payments.status = 'rechazado'::text AND payments.rejected_by IS NOT NULL
UNION ALL
 SELECT inventory_movements.created_by AS user_id,
    'inventario_'::text || inventory_movements.movement_type AS action,
    'inventory_movements'::text AS table_name,
    inventory_movements.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    inventory_movements.reason,
    inventory_movements.created_at
   FROM inventory_movements
  WHERE inventory_movements.movement_type = ANY (ARRAY['merma'::text, 'ajuste'::text, 'reversion'::text])
UNION ALL
 SELECT sale_returns.created_by AS user_id,
    'devolucion_registrada'::text AS action,
    'sale_returns'::text AS table_name,
    sale_returns.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    sale_returns.reason,
    sale_returns.created_at
   FROM sale_returns
UNION ALL
 SELECT order_discounts.created_by AS user_id,
    'descuento_aplicado'::text AS action,
    'order_discounts'::text AS table_name,
    order_discounts.id AS record_id,
    NULL::jsonb AS before,
    NULL::jsonb AS after,
    order_discounts.reason,
    order_discounts.created_at
   FROM order_discounts;

-- notify_order_ready: catálogo auditado
CREATE OR REPLACE FUNCTION public.notify_order_ready()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'listo' and old.status is distinct from 'listo' then
    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'pedido_listo',
      'Pedido #' || new.order_number || ' está listo',
      'order',
      new.id
    );
  end if;
  return new;
end;
$function$;

-- is_active_user: catálogo auditado
CREATE OR REPLACE FUNCTION public.is_active_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$function$;

-- is_admin: catálogo auditado
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'administrador'
  );
$function$;

-- is_employee_or_admin: catálogo auditado
CREATE OR REPLACE FUNCTION public.is_employee_or_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('administrador', 'empleado')
  );
$function$;

-- handle_new_user: catálogo auditado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $new_user$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'empleado', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$new_user$;

-- handle_inventory_entry: catálogo auditado
CREATE OR REPLACE FUNCTION public.handle_inventory_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform id from public.inventory_items where id=new.inventory_item_id for update;
  insert into public.inventory_lots (
    inventory_entry_id, inventory_item_id,
    initial_quantity, remaining_quantity, received_at
  ) values (
    new.id, new.inventory_item_id,
    new.quantity, new.quantity, new.received_at
  );

  update public.inventory_items
  set current_stock = current_stock + new.quantity,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, lot_id, movement_type, quantity,
    reference_type, reference_id, created_by
  )
  select new.inventory_item_id, l.id, 'entrada', new.quantity,
         'inventory_entry', new.id, new.created_by
  from public.inventory_lots l
  where l.inventory_entry_id = new.id;

  return new;
end;
$function$;

-- handle_inventory_waste: catálogo auditado
CREATE OR REPLACE FUNCTION public.handle_inventory_waste()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  lot_remaining numeric(12,3);
  item_stock numeric(12,3);
begin
  select current_stock into item_stock
  from public.inventory_items
  where id = new.inventory_item_id
  for update;

  if item_stock is null then
    raise exception 'El ítem de inventario no existe.';
  end if;

  if item_stock < new.quantity then
    raise exception 'Stock insuficiente: hay % y se quiere registrar una merma de %.', item_stock, new.quantity;
  end if;

  if new.lot_id is not null then
    select remaining_quantity into lot_remaining
    from public.inventory_lots
    where id = new.lot_id
    for update;

    if lot_remaining is null then
      raise exception 'El lote indicado no existe.';
    end if;

    if lot_remaining < new.quantity then
      raise exception 'El lote solo tiene % disponible, no se pueden dar de baja %.', lot_remaining, new.quantity;
    end if;

    update public.inventory_lots
    set remaining_quantity = remaining_quantity - new.quantity
    where id = new.lot_id;
  end if;

  update public.inventory_items
  set current_stock = current_stock - new.quantity,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, lot_id, movement_type, quantity,
    reference_type, reference_id, reason, created_by
  ) values (
    new.inventory_item_id, new.lot_id, 'merma', new.quantity,
    'inventory_waste', new.id, new.reason, new.created_by
  );

  return new;
end;
$function$;

-- handle_inventory_adjustment: catálogo auditado
CREATE OR REPLACE FUNCTION public.handle_inventory_adjustment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  item_stock numeric(12,3);
begin
  select current_stock into item_stock
  from public.inventory_items
  where id = new.inventory_item_id
  for update;

  if item_stock is null then
    raise exception 'El ítem de inventario no existe.';
  end if;

  if item_stock + new.quantity_delta < 0 then
    raise exception 'El ajuste dejaría el stock en negativo (actual: %, ajuste: %).', item_stock, new.quantity_delta;
  end if;

  update public.inventory_items
  set current_stock = current_stock + new.quantity_delta,
      updated_at = now()
  where id = new.inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id, movement_type, quantity,
    reference_type, reference_id, reason, created_by
  ) values (
    new.inventory_item_id, 'ajuste', abs(new.quantity_delta),
    'inventory_adjustment', new.id, new.reason, new.created_by
  );

  return new;
end;
$function$;

-- consume_product_inventory: catálogo auditado
CREATE OR REPLACE FUNCTION public.consume_product_inventory(p_product_id uuid, p_quantity_sold numeric, p_reference_type text, p_reference_id uuid, p_created_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  req record;
  lot record;
  total_needed numeric(12,3);
  available_total numeric(12,3);
  remaining_to_consume numeric(12,3);
  take_from_lot numeric(12,3);
begin
  if p_quantity_sold <= 0 then
    raise exception 'La cantidad vendida debe ser mayor que cero.';
  end if;

  -- PASO 1: verificar que HAY suficiente de TODOS los ingredientes
  -- antes de tocar nada (para que sea todo-o-nada).
  for req in
    select inventory_item_id, quantity
    from public.product_inventory_requirements
    where product_id = p_product_id
    order by inventory_item_id
  loop
    total_needed := req.quantity * p_quantity_sold;

    select current_stock into available_total
    from public.inventory_items
    where id = req.inventory_item_id
    for update;

    if available_total is null then
      raise exception 'El ítem de inventario % ya no existe.', req.inventory_item_id;
    end if;

    if available_total < total_needed then
      raise exception 'Stock insuficiente para vender % unidad(es): el ítem % tiene % y se necesitan %.',
        p_quantity_sold, req.inventory_item_id, available_total, total_needed;
    end if;
  end loop;

  -- PASO 2: ya confirmado que alcanza para todo, ahora sí se
  -- descuenta cada ingrediente en orden FIFO (lote más viejo primero).
  for req in
    select inventory_item_id, quantity
    from public.product_inventory_requirements
    where product_id = p_product_id
    order by inventory_item_id
  loop
    total_needed := req.quantity * p_quantity_sold;
    remaining_to_consume := total_needed;

    for lot in
      select id, remaining_quantity
      from public.inventory_lots
      where inventory_item_id = req.inventory_item_id
        and remaining_quantity > 0
      order by received_at asc, created_at asc, id asc
      for update
    loop
      exit when remaining_to_consume <= 0;

      take_from_lot := least(lot.remaining_quantity, remaining_to_consume);

      update public.inventory_lots
      set remaining_quantity = remaining_quantity - take_from_lot
      where id = lot.id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, created_by
      ) values (
        req.inventory_item_id, lot.id, 'salida', take_from_lot,
        p_reference_type, p_reference_id, p_created_by
      );

      remaining_to_consume := remaining_to_consume - take_from_lot;
    end loop;

    if remaining_to_consume > 0 then
      -- No debería pasar nunca si los lotes están sincronizados con
      -- current_stock, pero se protege por si acaso quedaron
      -- desincronizados.
      raise exception 'Inconsistencia de inventario: no se encontraron lotes suficientes para el ítem %.', req.inventory_item_id;
    end if;

    update public.inventory_items
    set current_stock = current_stock - total_needed,
        updated_at = now()
    where id = req.inventory_item_id;
  end loop;
end;
$function$;

-- release_expired_reservations: catálogo auditado
CREATE OR REPLACE FUNCTION public.release_expired_reservations(p_inventory_item_id uuid DEFAULT NULL::uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE oid uuid; affected integer:=0; n integer; checked_at timestamptz;
BEGIN
 FOR oid IN SELECT DISTINCT order_id FROM public.inventory_reservations WHERE status='reserved' AND expires_at<=clock_timestamp()
  AND (p_inventory_item_id IS NULL OR inventory_item_id=p_inventory_item_id) ORDER BY order_id LOOP
  PERFORM id FROM public.orders WHERE id=oid FOR UPDATE;
  PERFORM id FROM public.payments WHERE order_id=oid ORDER BY id FOR UPDATE;
  PERFORM id FROM public.inventory_reservations WHERE order_id=oid ORDER BY inventory_item_id,id FOR UPDATE;
  checked_at:=clock_timestamp();
  IF EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND status='pendiente_pago') AND
   (EXISTS(SELECT 1 FROM public.orders WHERE id=oid AND reserved_until<=checked_at) OR
    EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=oid AND status='reserved' AND expires_at<=checked_at)) THEN
   UPDATE public.inventory_reservations SET status='released',released_at=checked_at WHERE order_id=oid AND status='reserved';
   GET DIAGNOSTICS n=ROW_COUNT; affected:=affected+n;
   UPDATE public.orders SET status='cancelado',cancelled_at=checked_at,cancellation_reason='Reserva de inventario vencida.',updated_at=checked_at WHERE id=oid AND status='pendiente_pago';
  END IF;
 END LOOP;
 RETURN affected;
END;
$function$;

-- advance_order_status: catálogo auditado
CREATE OR REPLACE FUNCTION public.advance_order_status(p_order_id uuid, p_new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_current_status text;
  v_valid_next text;
begin
  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para cambiar el estado de un pedido.';
  end if;

  select status into v_current_status from public.orders where id = p_order_id for update;

  if v_current_status is null then
    raise exception 'El pedido no existe.';
  end if;

  v_valid_next := case v_current_status
    when 'confirmado' then 'en_preparacion'
    when 'en_preparacion' then 'listo'
    when 'listo' then 'finalizado'
    else null
  end;

  if v_valid_next is null or p_new_status <> v_valid_next then
    raise exception 'No se puede pasar el pedido de "%" a "%". El siguiente paso válido es "%".',
      v_current_status, p_new_status, coalesce(v_valid_next, 'ninguno (estado final)');
  end if;

  update public.orders set status = p_new_status, updated_at = now() where id = p_order_id;
end;
$function$;

-- close_cash_session: catálogo auditado
CREATE OR REPLACE FUNCTION public.close_cash_session(p_session_id uuid, p_counted_amount numeric, p_closing_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_session record;
  v_net_movements numeric(12,2);
  v_expected numeric(12,2);
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para cerrar la caja.';
  end if;

  if p_counted_amount is null or p_counted_amount < 0 then
    raise exception 'El monto contado no puede ser negativo.';
  end if;

  select id, status, opening_amount into v_session
  from public.cash_sessions
  where id = p_session_id
  for update;

  if v_session.id is null then
    raise exception 'La sesión de caja no existe.';
  end if;

  if v_session.status = 'cerrada' then
    raise exception 'Esta sesión ya está cerrada.';
  end if;

  select coalesce(sum(
    case
      when movement_type in ('venta', 'ingreso') then amount
      when movement_type in ('gasto', 'devolucion') then -amount
      when movement_type = 'ajuste' and direction = 'entrada' then amount
      when movement_type = 'ajuste' and direction = 'salida' then -amount
      else 0
    end
  ), 0) into v_net_movements
  from public.cash_movements
  where cash_session_id = p_session_id
    and payment_method = 'efectivo';

  v_expected := v_session.opening_amount + v_net_movements;

  update public.cash_sessions
  set status = 'cerrada',
      closed_by = v_actor_id,
      closed_at = now(),
      expected_amount = v_expected,
      counted_amount = p_counted_amount,
      difference_amount = p_counted_amount - v_expected,
      closing_note = p_closing_note
  where id = p_session_id;
end;
$function$;

-- reject_payment: catálogo auditado
CREATE OR REPLACE FUNCTION public.reject_payment(p_payment_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_rejected_by uuid;
  v_payment record;
begin
  v_rejected_by := auth.uid();

  if v_rejected_by is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para rechazar pagos.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo de rechazo es obligatorio.';
  end if;

  perform o.id from public.orders o where o.id=(select order_id from public.payments where id=p_payment_id) for update;
  perform id from public.payments where order_id=(select order_id from public.payments where id=p_payment_id) order by id for update;
  perform id from public.inventory_reservations where order_id=(select order_id from public.payments where id=p_payment_id) order by inventory_item_id,id for update;
  select id, order_id, status into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'El pago no existe.';
  end if;

  if v_payment.status <> 'pendiente' then
    raise exception 'Este pago ya fue procesado (estado actual: %).', v_payment.status;
  end if;

  update public.payments
  set status = 'rechazado', rejection_reason = p_reason,
      rejected_by = v_rejected_by, rejected_at = now(), updated_at = now()
  where id = p_payment_id;

  update public.orders
  set status = 'rechazado', updated_at = now()
  where id = v_payment.order_id;

  update public.inventory_reservations
  set status = 'released', released_at = now()
  where order_id = v_payment.order_id and status = 'reserved';
end;
$function$;

-- cancel_order: catálogo auditado
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_status text;
  v_movement record;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo de cancelación es obligatorio.';
  end if;

  select status into v_status from public.orders where id = p_order_id for update;

  if v_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_status in ('cancelado', 'finalizado', 'rechazado') then
    raise exception 'Un pedido en estado "%" no se puede cancelar.', v_status;
  end if;

  if v_status = 'pendiente_pago' then
    -- Todavía no hay dinero ni inventario consumido: cualquier
    -- miembro del personal puede cancelar, solo se libera la reserva.
    if not public.is_employee_or_admin() then
      raise exception 'No tienes permisos para cancelar pedidos.';
    end if;

    update public.inventory_reservations
    set status = 'released', released_at = now()
    where order_id = p_order_id and status = 'reserved';
  else
    -- Ya está pagado (confirmado/en_preparacion/listo): solo
    -- administrador, y se revierte el inventario real consumido.
    if not public.is_admin() then
      raise exception 'Solo un administrador puede cancelar una venta ya pagada.';
    end if;

    perform id from public.payments where order_id=p_order_id order by id for update;
    perform id from public.inventory_reservations where order_id=p_order_id order by inventory_item_id,id for update;
    perform i.id from public.inventory_items i where i.id in (select inventory_item_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by i.id for update;
    perform l.id from public.inventory_lots l where l.id in (select lot_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by l.inventory_item_id,l.received_at,l.created_at,l.id for update;
    for v_movement in
      select im.id, im.inventory_item_id, im.lot_id, im.quantity
      from public.inventory_movements im
      where im.reference_type = 'order'
        and im.reference_id = p_order_id
        and im.movement_type = 'salida'
    loop
      if v_movement.lot_id is not null then
        update public.inventory_lots
        set remaining_quantity = remaining_quantity + v_movement.quantity
        where id = v_movement.lot_id;
      end if;

      update public.inventory_items
      set current_stock = current_stock + v_movement.quantity, updated_at = now()
      where id = v_movement.inventory_item_id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, reason, created_by
      ) values (
        v_movement.inventory_item_id, v_movement.lot_id, 'reversion', v_movement.quantity,
        'order', p_order_id, p_reason, v_actor_id
      );
    end loop;
  end if;

  update public.orders
  set status = 'cancelado', cancelled_at = now(), cancelled_by = v_actor_id,
      cancellation_reason = p_reason, updated_at = now()
  where id = p_order_id;
end;
$function$;

-- create_sale_return: catálogo auditado
CREATE OR REPLACE FUNCTION public.create_sale_return(p_order_id uuid, p_type text, p_amount numeric, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_order_status text;
  v_order_total numeric(12,2);
  v_already_returned numeric(12,2);
  v_return_id uuid;
  v_movement record;
  v_existing_devolucion integer;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar una devolución o reintegro.';
  end if;

  if p_type not in ('devolucion', 'reintegro') then
    raise exception 'Tipo de devolución no válido.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor que cero.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo es obligatorio.';
  end if;

  select status, total into v_order_status, v_order_total
  from public.orders where id = p_order_id for update;

  if v_order_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order_status <> 'finalizado' then
    raise exception 'Solo se puede registrar una devolución sobre un pedido ya finalizado (estado actual: %).', v_order_status;
  end if;

  select coalesce(sum(amount), 0) into v_already_returned
  from public.sale_returns where order_id = p_order_id;

  if v_already_returned + p_amount > v_order_total then
    raise exception 'El monto a devolver (%) sumado a lo ya devuelto (%) supera el total del pedido (%).',
      p_amount, v_already_returned, v_order_total;
  end if;

  if p_type = 'devolucion' then
    select count(*) into v_existing_devolucion
    from public.sale_returns where order_id = p_order_id and type = 'devolucion';

    if v_existing_devolucion > 0 then
      raise exception 'Este pedido ya tuvo una devolución de producto físico; no se puede repetir.';
    end if;

    perform id from public.payments where order_id=p_order_id order by id for update;
    perform id from public.inventory_reservations where order_id=p_order_id order by inventory_item_id,id for update;
    perform i.id from public.inventory_items i where i.id in (select inventory_item_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by i.id for update;
    perform l.id from public.inventory_lots l where l.id in (select lot_id from public.inventory_movements where reference_type='order' and reference_id=p_order_id) order by l.inventory_item_id,l.received_at,l.created_at,l.id for update;
    for v_movement in
      select im.id, im.inventory_item_id, im.lot_id, im.quantity
      from public.inventory_movements im
      where im.reference_type = 'order'
        and im.reference_id = p_order_id
        and im.movement_type = 'salida'
    loop
      if v_movement.lot_id is not null then
        update public.inventory_lots
        set remaining_quantity = remaining_quantity + v_movement.quantity
        where id = v_movement.lot_id;
      end if;

      update public.inventory_items
      set current_stock = current_stock + v_movement.quantity, updated_at = now()
      where id = v_movement.inventory_item_id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity,
        reference_type, reference_id, reason, created_by
      ) values (
        v_movement.inventory_item_id, v_movement.lot_id, 'devolucion', v_movement.quantity,
        'order', p_order_id, p_reason, v_actor_id
      );
    end loop;
  end if;

  insert into public.sale_returns (order_id, type, amount, reason, created_by)
  values (p_order_id, p_type, p_amount, p_reason, v_actor_id)
  returning id into v_return_id;

  return v_return_id;
end;
$function$;

-- record_cash_movement: catálogo auditado
CREATE OR REPLACE FUNCTION public.record_cash_movement(p_cash_session_id uuid, p_movement_type text, p_amount numeric, p_direction text, p_reason text, p_order_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_session_status text;
  v_movement_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para registrar movimientos de caja.';
  end if;

  if p_movement_type not in ('ingreso', 'gasto', 'ajuste', 'devolucion') then
    raise exception 'Tipo de movimiento no válido para registro manual.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto debe ser mayor que cero.';
  end if;

  if p_movement_type in ('gasto', 'ajuste', 'devolucion') and (p_reason is null or trim(p_reason) = '') then
    raise exception 'El motivo es obligatorio para este tipo de movimiento.';
  end if;

  if p_movement_type = 'ajuste' then
    if p_direction not in ('entrada', 'salida') then
      raise exception 'Un ajuste debe indicar dirección: entrada o salida.';
    end if;
  elsif p_direction is not null then
    raise exception 'La dirección solo aplica a movimientos de tipo "ajuste".';
  end if;

  select status into v_session_status
  from public.cash_sessions
  where id = p_cash_session_id
  for update;

  if v_session_status is null then
    raise exception 'La sesión de caja no existe.';
  end if;

  if v_session_status = 'cerrada' then
    raise exception 'Esta caja ya está cerrada. Una caja cerrada no se modifica; corrige en la siguiente sesión.';
  end if;

  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, direction, order_id, reason, created_by
  ) values (
    p_cash_session_id, p_movement_type, 'efectivo', p_amount, p_direction, p_order_id, p_reason, v_actor_id
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$function$;

-- request_order_deletion: catálogo auditado
CREATE OR REPLACE FUNCTION public.request_order_deletion(p_order_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_order_status text;
  v_deleted_at timestamptz;
  v_existing_pending integer;
  v_request_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para solicitar la eliminación de un pedido.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'El motivo es obligatorio.';
  end if;

  select status, deleted_at into v_order_status, v_deleted_at
  from public.orders where id = p_order_id;

  if v_order_status is null then
    raise exception 'El pedido no existe.';
  end if;

  if v_order_status <> 'cancelado' then
    raise exception 'Solo se puede solicitar eliminar un pedido cancelado (estado actual: %).', v_order_status;
  end if;

  if v_deleted_at is not null then
    raise exception 'Este pedido ya fue eliminado.';
  end if;

  select count(*) into v_existing_pending
  from public.order_deletion_requests
  where order_id = p_order_id and status = 'pendiente';

  if v_existing_pending > 0 then
    raise exception 'Ya existe una solicitud de eliminación pendiente para este pedido.';
  end if;

  insert into public.order_deletion_requests (order_id, requested_by, reason)
  values (p_order_id, v_actor_id, p_reason)
  returning id into v_request_id;

  return v_request_id;
end;
$function$;

-- review_order_deletion_request: catálogo auditado
CREATE OR REPLACE FUNCTION public.review_order_deletion_request(p_request_id uuid, p_approve boolean, p_review_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_request record;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_admin() then
    raise exception 'Solo un administrador puede revisar solicitudes de eliminación.';
  end if;

  if p_review_reason is null or trim(p_review_reason) = '' then
    raise exception 'El motivo de la revisión es obligatorio.';
  end if;

  select id, order_id, status into v_request
  from public.order_deletion_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'La solicitud no existe.';
  end if;

  if v_request.status <> 'pendiente' then
    raise exception 'Esta solicitud ya fue revisada (estado actual: %).', v_request.status;
  end if;

  if p_approve and not public.can_delete_cancelled_order(v_request.order_id) then
    raise exception 'Este pedido ya no cumple las condiciones para ser eliminado.';
  end if;

  update public.order_deletion_requests
  set status = case when p_approve then 'aprobada' else 'rechazada' end,
      reviewed_by = v_actor_id, reviewed_at = now(), review_reason = p_review_reason
  where id = p_request_id;

  if p_approve then
    update public.orders set deleted_at = now() where id = v_request.order_id;
  end if;
end;
$function$;

-- can_delete_cancelled_order: catálogo auditado
CREATE OR REPLACE FUNCTION public.can_delete_cancelled_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.is_admin()
    and exists (
      select 1
      from public.orders
      where id = p_order_id
        and status = 'cancelado'
        and deleted_at is null
    );
$function$;

-- open_cash_session: catálogo auditado
CREATE OR REPLACE FUNCTION public.open_cash_session(p_cash_register_id uuid, p_opening_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid;
  v_existing_open integer;
  v_session_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para abrir la caja.';
  end if;

  if p_opening_amount is null or p_opening_amount < 0 then
    raise exception 'El monto de apertura no puede ser negativo.';
  end if;

  select count(*) into v_existing_open
  from public.cash_sessions
  where cash_register_id = p_cash_register_id and status = 'abierta';

  if v_existing_open > 0 then
    raise exception 'Ya hay una sesión de caja abierta para esta caja. Ciérrala antes de abrir otra.';
  end if;

  insert into public.cash_sessions (cash_register_id, opened_by, opening_amount)
  values (p_cash_register_id, v_actor_id, p_opening_amount)
  returning id into v_session_id;

  return v_session_id;
end;
$function$;

-- get_business_status: catálogo auditado
CREATE OR REPLACE FUNCTION public.get_business_status()
 RETURNS TABLE(is_open boolean, opens_at time without time zone, closes_at time without time zone, is_closed_today boolean, accept_orders_outside_hours boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_local_now timestamptz;
  v_day_of_week smallint;
  v_local_time time;
  v_hours record;
  v_accept_outside boolean;
begin
  v_local_now := now() at time zone 'America/La_Paz';
  v_day_of_week := extract(dow from v_local_now);
  v_local_time := v_local_now::time;

  select bh.opens_at, bh.closes_at, bh.is_closed
  into v_hours
  from public.business_hours bh
  where bh.day_of_week = v_day_of_week;

  select coalesce((ss.value->>'enabled')::boolean, false) into v_accept_outside
  from public.system_settings ss
  where ss.key = 'accept_orders_outside_hours';

  return query
  select
    case
      when v_hours.is_closed then false
      when v_hours.opens_at is null or v_hours.closes_at is null then false
      else v_local_time >= v_hours.opens_at and v_local_time < v_hours.closes_at
    end,
    v_hours.opens_at,
    v_hours.closes_at,
    coalesce(v_hours.is_closed, true),
    coalesce(v_accept_outside, false);
end;
$function$;

-- notify_stock_alert: catálogo auditado
CREATE OR REPLACE FUNCTION public.notify_stock_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old_status integer;
  v_new_status integer;
begin
  v_old_status := case
    when old.current_stock <= 0 then 2
    when old.current_stock <= old.minimum_stock then 1
    else 0
  end;

  v_new_status := case
    when new.current_stock <= 0 then 2
    when new.current_stock <= new.minimum_stock then 1
    else 0
  end;

  -- Solo avisa cuando EMPEORA (cruza a un estado peor), no en
  -- cada movimiento mientras ya está bajo/agotado — evita spam.
  if v_new_status > v_old_status then
    if v_new_status = 2 then
      insert into public.notifications (type, message, reference_type, reference_id)
      values ('stock_agotado', 'Stock agotado: ' || new.name, 'inventory_item', new.id);
    elsif v_new_status = 1 then
      insert into public.notifications (type, message, reference_type, reference_id)
      values ('stock_bajo', 'Stock bajo: ' || new.name || ' (' || new.current_stock || ' ' || new.unit || ')', 'inventory_item', new.id);
    end if;
  end if;

  return new;
end;
$function$;

-- create_order: catálogo auditado
CREATE OR REPLACE FUNCTION public.create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_existing_order_id uuid;
  v_contract jsonb;
  v_existing_contract jsonb;
  v_customer_id uuid;
  v_order_id uuid;

  v_item jsonb;
  v_product record;

  v_quantity numeric(12,3);

  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;

  v_req record;

  v_needed numeric(12,3);
  v_already_reserved numeric(12,3);
  v_available numeric(12,3);

  -- Inventario acumulado de TODO el pedido.
  -- La clave es inventory_item_id.
  v_item_needs jsonb := '{}'::jsonb;

  v_inv_item_id text;

  v_reserved_until timestamptz :=
    now() + interval '30 minutes';

  v_business_is_open boolean;
  v_business_accept_outside boolean;

  v_option_id text;

  v_options_extra numeric(12,2);
  v_personalization_snapshot jsonb;

  v_option_count integer;
  v_distinct_option_count integer;

begin

  -- ==========================================================
  -- 4. VALIDACIONES GENERALES
  -- ==========================================================

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then

    raise exception
      'El pedido debe tener al menos un producto.';
  end if;


  IF nullif(trim(p_idempotency_key),'') IS NULL OR length(p_idempotency_key)>100 OR p_customer_name IS NULL OR nullif(trim(p_customer_name),'') IS NULL
     OR length(trim(coalesce(p_customer_phone,''))) NOT BETWEEN 6 AND 30 THEN RAISE EXCEPTION 'Contrato básico de pedido inválido.'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE jsonb_typeof(x)<>'object' OR x->>'product_id' IS NULL OR x->>'quantity' IS NULL
   OR (x ? 'customization_option_ids' AND jsonb_typeof(x->'customization_option_ids')<>'array')) THEN RAISE EXCEPTION 'Líneas de pedido inválidas.'; END IF;
  SELECT jsonb_build_object('name',trim(p_customer_name),'phone',trim(p_customer_phone),'whatsapp',nullif(trim(p_customer_whatsapp),''),
    'message',nullif(trim(p_customer_message),''),'promotion',p_promotion_id,'items',jsonb_agg(line ORDER BY line::text)) INTO v_contract
  FROM (SELECT jsonb_build_object('product_id',(x->>'product_id')::uuid,'quantity',(x->>'quantity')::numeric(12,3),
   'message',nullif(trim(x->>'message'),''),'note',nullif(trim(x->>'note'),''),
   'options',(SELECT coalesce(jsonb_agg(option_id::uuid ORDER BY option_id::uuid),'[]'::jsonb) FROM jsonb_array_elements_text(coalesce(x->'customization_option_ids','[]'::jsonb)) option_id)) line
   FROM jsonb_array_elements(p_items) x) lines;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,37007));
  SELECT id,request_contract INTO v_existing_order_id,v_existing_contract FROM public.orders WHERE idempotency_key=p_idempotency_key;
  IF v_existing_order_id IS NOT NULL THEN
   IF v_existing_contract IS NULL THEN RAISE EXCEPTION 'Clave antigua sin contrato verificable; requiere revisión.'; END IF;
   IF v_existing_contract IS DISTINCT FROM v_contract THEN RAISE EXCEPTION 'Reutilización inválida de clave de idempotencia: contrato diferente.'; END IF;
   RETURN v_existing_order_id;
  END IF;

  select
    gbs.is_open,
    gbs.accept_orders_outside_hours
  into
    v_business_is_open,
    v_business_accept_outside
  from public.get_business_status() gbs;


  if not v_business_is_open
     and not v_business_accept_outside then

    raise exception
      'La florería está cerrada en este momento y no se aceptan pedidos fuera de horario.';
  end if;


  if p_customer_name is null
     or trim(p_customer_name) = '' then

    raise exception
      'El nombre del cliente es obligatorio.';
  end if;


  -- ==========================================================
  -- 5. IDEMPOTENCIA
  -- ==========================================================




  -- ==========================================================
  -- 6. OBTENER / CREAR CLIENTE
  -- ==========================================================

  if p_customer_phone is not null
     and trim(p_customer_phone) <> '' then

    select id
    into v_customer_id
    from public.customers
    where phone = p_customer_phone
    limit 1;

  end if;


  if v_customer_id is null then

    insert into public.customers (
      name,
      phone,
      whatsapp
    )
    values (
      p_customer_name,
      nullif(trim(p_customer_phone), ''),
      nullif(trim(p_customer_whatsapp), '')
    )
    returning id into v_customer_id;

  end if;


  -- ==========================================================
  -- 7. PRIMERA PASADA
  --
  -- Aquí:
  --   - validamos productos
  --   - validamos cantidades
  --   - validamos opciones
  --   - rechazamos duplicados
  --   - acumulamos inventario del producto
  --   - acumulamos inventario de las opciones
  --
  -- Todavía NO creamos el pedido.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    -- --------------------------------------------------------
    -- Producto
    -- --------------------------------------------------------

    begin

      select
        id,
        name,
        price,
        is_active,
        is_available,
        is_sold_out
      into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid;

    exception
      when invalid_text_representation then

        raise exception
          'El identificador de producto no es válido.';

    end;


    if v_product.id is null then

      raise exception
        'Uno de los productos del pedido ya no existe.';

    end if;


    if not v_product.is_active
       or not v_product.is_available
       or v_product.is_sold_out then

      raise exception
        'El producto "%" ya no está disponible.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Cantidad
    -- --------------------------------------------------------

    begin

      v_quantity :=
        (v_item->>'quantity')::numeric;

    exception
      when invalid_text_representation then

        raise exception
          'La cantidad del producto "%" no es válida.',
          v_product.name;

    end;


    if v_quantity is null
       or v_quantity <= 0 then

      raise exception
        'La cantidad de "%" debe ser mayor que cero.',
        v_product.name;

    end if;


    -- ========================================================
    -- OPCIONES DE PERSONALIZACIÓN
    -- ========================================================

    if v_item ? 'customization_option_ids'
       and jsonb_typeof(v_item->'customization_option_ids') <> 'array' then

      raise exception
        'Las opciones de personalización de "%" no son válidas.',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Rechazar opciones duplicadas
    -- --------------------------------------------------------

    select
      count(*),
      count(distinct option_id)
    into
      v_option_count,
      v_distinct_option_count
    from jsonb_array_elements_text(
      coalesce(
        v_item->'customization_option_ids',
        '[]'::jsonb
      )
    ) as option_id;


    if v_option_count <> v_distinct_option_count then

      raise exception
        'No se puede seleccionar dos veces la misma opción de "%".',
        v_product.name;

    end if;


    -- --------------------------------------------------------
    -- Validar cada opción
    -- --------------------------------------------------------

    for v_option_id in
      select jsonb_array_elements_text(
        coalesce(
          v_item->'customization_option_ids',
          '[]'::jsonb
        )
      )
    loop

      begin

        if not exists (
          select 1
          from public.customization_options co
          where co.id = v_option_id::uuid
            and co.product_id = v_product.id
            and co.is_active = true
        ) then

          raise exception
            'Una opción de personalización de "%" ya no está disponible.',
            v_product.name;

        end if;

      exception
        when invalid_text_representation then

          raise exception
            'Una opción de personalización de "%" no es válida.',
            v_product.name;

      end;


      -- ------------------------------------------------------
      -- Inventario requerido por la opción
      -- ------------------------------------------------------

      for v_req in
        select
          inventory_item_id,
          quantity
        from public.customization_option_inventory_requirements
        where customization_option_id = v_option_id::uuid
      loop

        v_needed :=
          v_req.quantity * v_quantity;

        v_inv_item_id :=
          v_req.inventory_item_id::text;

        v_item_needs :=
          jsonb_set(
            v_item_needs,
            array[v_inv_item_id],
            to_jsonb(
              coalesce(
                (v_item_needs->>v_inv_item_id)::numeric,
                0
              ) + v_needed
            )
          );

      end loop;

    end loop;


    -- ========================================================
    -- INVENTARIO BASE DEL PRODUCTO
    -- ========================================================

    for v_req in
      select
        inventory_item_id,
        quantity
      from public.product_inventory_requirements
      where product_id = v_product.id
    loop

      v_needed :=
        v_req.quantity * v_quantity;

      v_inv_item_id :=
        v_req.inventory_item_id::text;

      v_item_needs :=
        jsonb_set(
          v_item_needs,
          array[v_inv_item_id],
          to_jsonb(
            coalesce(
              (v_item_needs->>v_inv_item_id)::numeric,
              0
            ) + v_needed
          )
        );

    end loop;

  end loop;


  -- ==========================================================
  -- 8. VERIFICAR STOCK
  --
  -- Producto + opciones ya están acumulados.
  -- Aquí se comprueba el total real necesario.
  -- ==========================================================

  perform public.release_expired_reservations(NULL);
  v_reserved_until:=clock_timestamp()+interval '30 minutes';
  for v_inv_item_id in
    select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop

    -- Liberar reservas vencidas antes de comprobar
    -- disponibilidad.
    


    -- Bloqueamos el ítem de inventario para que dos pedidos
    -- concurrentes no puedan comprobar el mismo stock
    -- simultáneamente.
    select current_stock
    into v_available
    from public.inventory_items
    where id = v_inv_item_id::uuid
    for update;


    if v_available is null then

      raise exception
        'Un ítem de inventario del pedido ya no existe.';

    end if;


    select coalesce(sum(quantity), 0)
    into v_already_reserved
    from public.inventory_reservations
    where inventory_item_id = v_inv_item_id::uuid
      and status = 'reserved';


    v_available :=
      v_available - v_already_reserved;


    v_needed :=
      (v_item_needs->>v_inv_item_id)::numeric;


    if v_available < v_needed then

      raise exception
        'Stock insuficiente: solo hay % disponible y se necesitan %.',
        v_available,
        v_needed;

    end if;

  end loop;


  -- ==========================================================
  -- 9. CREAR PEDIDO
  -- ==========================================================

  insert into public.orders (
    customer_id,
    status,
    customer_message,
    idempotency_key,
    request_contract,
    reserved_until
  )
  values (
    v_customer_id,
    'pendiente_pago',
    p_customer_message,
    p_idempotency_key,
    v_contract,
    v_reserved_until
  )
  returning id into v_order_id;


  -- ==========================================================
  -- 10. SEGUNDA PASADA
  --
  -- Aquí calculamos el precio REAL desde PostgreSQL.
  -- Nunca usamos extra_price enviado por el navegador.
  -- ==========================================================

  for v_item in
    select *
    from jsonb_array_elements(p_items)
  loop

    select
      id,
      name,
      price
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;


    v_quantity :=
      (v_item->>'quantity')::numeric;


    -- --------------------------------------------------------
    -- Precio real de las opciones
    -- --------------------------------------------------------

    select
      coalesce(sum(co.extra_price), 0),

      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', co.id,
            'option_type', co.option_type,
            'name', co.name,
            'value', co.value,
            'extra_price', co.extra_price
          )
          order by co.option_type, co.name, co.id
        )
        filter (where co.id is not null),
        '[]'::jsonb
      )

    into
      v_options_extra,
      v_personalization_snapshot

    from public.customization_options co

    where co.id in (
      select
        jsonb_array_elements_text(
          coalesce(
            v_item->'customization_option_ids',
            '[]'::jsonb
          )
        )::uuid
    )

    and co.product_id = v_product.id

    and co.is_active = true;


    -- --------------------------------------------------------
    -- Precio final de la línea
    -- --------------------------------------------------------

    v_line_total :=
      (v_product.price + v_options_extra)
      * v_quantity;


    v_subtotal :=
      v_subtotal + v_line_total;


    -- --------------------------------------------------------
    -- Snapshot de la personalización
    -- --------------------------------------------------------

    insert into public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total,
      personalization,
      message,
      note
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price + v_options_extra,
      v_quantity,
      v_line_total,
      v_personalization_snapshot,
      v_item->>'message',
      v_item->>'note'
    );

  end loop;


  -- ==========================================================
  -- 11. ACTUALIZAR TOTALES
  -- ==========================================================

  update public.orders
  set
    subtotal = v_subtotal,
    total = v_subtotal
  where id = v_order_id;


  -- ==========================================================
  -- 12. PROMOCIÓN
  -- ==========================================================

  if p_promotion_id is not null then

    perform public.apply_order_discount(
      v_order_id,
      v_subtotal,
      v_customer_id,
      p_promotion_id,
      null,
      null,
      null
    );

  end if;


  -- ==========================================================
  -- 13. RESERVAR INVENTARIO
  --
  -- Aquí se reserva:
  --
  --   inventario del producto
  --       +
  --   inventario de las opciones
  --
  -- en una sola reserva por ítem de inventario.
  -- ==========================================================

  for v_inv_item_id in
    select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop

    insert into public.inventory_reservations (
      order_id,
      inventory_item_id,
      quantity,
      status,
      expires_at
    )
    values (
      v_order_id,
      v_inv_item_id::uuid,
      (v_item_needs->>v_inv_item_id)::numeric,
      'reserved',
      v_reserved_until
    );

  end loop;


  -- ==========================================================
  -- 14. RESULTADO
  -- ==========================================================

  IF (SELECT total FROM public.orders WHERE id=v_order_id)=0 THEN
   PERFORM public.consume_order_reservations(v_order_id,NULL);
   UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=v_order_id;
  END IF;
  return v_order_id;

end;
$function$;

-- apply_order_discount: catálogo auditado
CREATE OR REPLACE FUNCTION public.apply_order_discount(p_order_id uuid, p_subtotal numeric, p_customer_id uuid, p_promotion_id uuid, p_manual_amount numeric, p_manual_reason text, p_actor_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_promo_id uuid;
  v_promo_name text;
  v_promo_type text;
  v_promo_discount_type text;
  v_promo_discount_value numeric(12,2);
  v_promo_combo_price numeric(12,2);
  v_promo_starts_at timestamptz;
  v_promo_ends_at timestamptz;
  v_promo_minimum_purchase numeric(12,2);
  v_promo_is_active boolean;

  v_amount numeric(12,2) := 0;

  -- Promoción por producto
  v_component_count integer;
  v_eligible_subtotal numeric(12,2);

  -- Protección de monto fijo (034)
  v_blocking_name text;
  v_blocking_price numeric(12,2);

  -- Promoción combo
  v_component record;
  v_ordered_qty numeric(12,3);
  v_times_possible numeric;
  v_normal_cost_per_set numeric(12,2);

begin

  -- ----------------------------------------------------------
  -- No se permite combinar promoción con descuento manual.
  -- ----------------------------------------------------------

  if p_promotion_id is not null
     and p_manual_amount is not null then

    raise exception
      'No se puede aplicar una promoción y un descuento manual al mismo tiempo.';

  end if;


  -- ==========================================================
  -- PROMOCIÓN
  -- ==========================================================

  if p_promotion_id is not null then

    -- --------------------------------------------------------
    -- Obtener promoción
    -- --------------------------------------------------------

    select
      pm.id,
      pm.name,
      pm.promotion_type,
      pm.discount_type,
      pm.discount_value,
      pm.combo_price,
      pm.starts_at,
      pm.ends_at,
      pm.minimum_purchase,
      pm.is_active

    into
      v_promo_id,
      v_promo_name,
      v_promo_type,
      v_promo_discount_type,
      v_promo_discount_value,
      v_promo_combo_price,
      v_promo_starts_at,
      v_promo_ends_at,
      v_promo_minimum_purchase,
      v_promo_is_active

    from public.promotions pm

    where pm.id = p_promotion_id;


    -- --------------------------------------------------------
    -- Existencia
    -- --------------------------------------------------------

    if v_promo_id is null then
      raise exception 'La promoción no existe.';
    end if;


    -- --------------------------------------------------------
    -- Estado
    -- --------------------------------------------------------

    if not v_promo_is_active then
      raise exception
        'La promoción "%" no está activa.',
        v_promo_name;
    end if;


    -- --------------------------------------------------------
    -- Inicio
    -- --------------------------------------------------------

    if v_promo_starts_at is not null
       and now() < v_promo_starts_at then

      raise exception
        'La promoción "%" todavía no empieza.',
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Finalización
    -- --------------------------------------------------------

    if v_promo_ends_at is not null
       and now() > v_promo_ends_at then

      raise exception
        'La promoción "%" ya venció.',
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Compra mínima
    -- --------------------------------------------------------

    if v_promo_minimum_purchase is not null
       and p_subtotal < v_promo_minimum_purchase then

      raise exception
        'El pedido no alcanza la compra mínima de % para la promoción "%".',
        v_promo_minimum_purchase,
        v_promo_name;

    end if;


    -- --------------------------------------------------------
    -- Verificar que tenga productos configurados.
    -- --------------------------------------------------------

    select count(*)
    into v_component_count

    from public.promotion_products pp

    where pp.promotion_id = p_promotion_id;


    if v_component_count = 0 then

      raise exception
        'La promoción "%" no tiene productos configurados.',
        v_promo_name;

    end if;


    -- ========================================================
    -- PROMOCIÓN POR PRODUCTO
    -- ========================================================

    if v_promo_type = 'producto' then

      -- ------------------------------------------------------
      -- Solamente cuenta el subtotal de productos asociados
      -- a esta promoción.
      -- ------------------------------------------------------

      select coalesce(sum(oi.line_total), 0)
      into v_eligible_subtotal

      from public.order_items oi

      join public.promotion_products pp
        on pp.product_id = oi.product_id
       and pp.promotion_id = p_promotion_id

      where oi.order_id = p_order_id;


      if v_eligible_subtotal = 0 then

        raise exception
          'Ninguno de los productos del pedido califica para la promoción "%".',
          v_promo_name;

      end if;


      -- ------------------------------------------------------
      -- Descuento porcentual
      -- ------------------------------------------------------

      if v_promo_discount_type = 'porcentaje' then

        v_amount :=
          round(
            v_eligible_subtotal
            * v_promo_discount_value
            / 100,
            2
          );


      -- ------------------------------------------------------
      -- Descuento por monto fijo
      -- ------------------------------------------------------

      else

        -- ----------------------------------------------------
        -- PROTECCIÓN (034): el monto fijo no puede superar el
        -- precio ACTUAL de ningún producto de esta promoción
        -- que esté en el pedido.
        --
        -- La pantalla y el API ya lo validan al configurar la
        -- promoción, pero el precio de un producto puede
        -- cambiar después. Esta es la última barrera: si el
        -- precio bajó por debajo del descuento, el producto
        -- saldría gratis (o con más descuento que su valor),
        -- así que se bloquea.
        --
        -- Igual a un producto de su precio sí se permite.
        -- Se compara contra products.price (precio vigente), la
        -- misma fuente que usa la validación de configuración.
        -- ----------------------------------------------------

        select
          p.name,
          p.price

        into
          v_blocking_name,
          v_blocking_price

        from public.order_items oi

        join public.promotion_products pp
          on pp.product_id = oi.product_id
         and pp.promotion_id = p_promotion_id

        join public.products p
          on p.id = oi.product_id

        where oi.order_id = p_order_id
          and p.price < v_promo_discount_value

        order by p.price asc

        limit 1;


        if v_blocking_name is not null then

          raise exception
            'La promoción "%" no se puede aplicar: su descuento de Bs % supera el precio actual de "%" (Bs %). Pide al administrador que revise la promoción.',
            v_promo_name,
            to_char(v_promo_discount_value, 'FM999999990.00'),
            v_blocking_name,
            to_char(v_blocking_price, 'FM999999990.00');

        end if;


        v_amount :=
          least(
            v_promo_discount_value,
            v_eligible_subtotal
          );

      end if;


      -- ------------------------------------------------------
      -- Registrar descuento
      -- ------------------------------------------------------

      insert into public.order_discounts (
        order_id,
        promotion_id,
        discount_type,
        discount_value,
        amount_applied,
        created_by
      )
      values (
        p_order_id,
        p_promotion_id,
        v_promo_discount_type,
        v_promo_discount_value,
        v_amount,
        p_actor_id
      );


    -- ========================================================
    -- PROMOCIÓN COMBO
    -- ========================================================

    else

      v_times_possible := null;
      v_normal_cost_per_set := 0;


      -- ------------------------------------------------------
      -- Revisar todos los componentes del combo.
      -- ------------------------------------------------------

      for v_component in

        select
          pp.product_id,
          pp.quantity,
          p.price

        from public.promotion_products pp

        join public.products p
          on p.id = pp.product_id

        where pp.promotion_id = p_promotion_id

      loop

        -- ----------------------------------------------------
        -- Cantidad del producto presente en el pedido.
        -- ----------------------------------------------------

        select coalesce(sum(oi.quantity), 0)
        into v_ordered_qty

        from public.order_items oi

        where oi.order_id = p_order_id
          and oi.product_id = v_component.product_id;


        -- ----------------------------------------------------
        -- Determinar cuántos combos completos se pueden formar.
        --
        -- El componente con menor disponibilidad determina
        -- la cantidad final de combos.
        -- ----------------------------------------------------

        if v_times_possible is null
           or floor(
                v_ordered_qty / v_component.quantity
              ) < v_times_possible then

          v_times_possible :=
            floor(
              v_ordered_qty / v_component.quantity
            );

        end if;


        -- ----------------------------------------------------
        -- Precio normal de una unidad completa del combo.
        -- ----------------------------------------------------

        v_normal_cost_per_set :=
          v_normal_cost_per_set
          + (
              v_component.price
              * v_component.quantity
            );

      end loop;


      -- --------------------------------------------------------
      -- El pedido debe permitir formar al menos un combo.
      -- --------------------------------------------------------

      if v_times_possible is null
         or v_times_possible < 1 then

        raise exception
          'El pedido no tiene los productos necesarios para el combo "%".',
          v_promo_name;

      end if;


      -- --------------------------------------------------------
      -- Descuento:
      --
      -- precio normal del combo
      -- menos
      -- precio fijo del combo
      --
      -- multiplicado por la cantidad de combos.
      -- --------------------------------------------------------

      v_amount :=
        (
          v_normal_cost_per_set
          - v_promo_combo_price
        )
        * v_times_possible;


      -- --------------------------------------------------------
      -- Nunca permitir descuento negativo.
      -- --------------------------------------------------------

      if v_amount < 0 then
        v_amount := 0;
      end if;


      -- --------------------------------------------------------
      -- Nunca permitir que el descuento supere el subtotal.
      -- --------------------------------------------------------

      if v_amount > p_subtotal then
        v_amount := p_subtotal;
      end if;


      -- --------------------------------------------------------
      -- Registrar descuento del combo.
      --
      -- discount_value contiene el precio fijo del combo.
      -- amount_applied contiene el ahorro real aplicado.
      -- --------------------------------------------------------

      insert into public.order_discounts (
        order_id,
        promotion_id,
        discount_type,
        discount_value,
        amount_applied,
        created_by
      )
      values (
        p_order_id,
        p_promotion_id,
        'combo',
        v_promo_combo_price,
        v_amount,
        p_actor_id
      );

    end if;


  -- ==========================================================
  -- DESCUENTO MANUAL DE CAJA
  -- ==========================================================

  elsif p_manual_amount is not null then

    if p_actor_id is null then

      raise exception
        'Un descuento manual requiere un empleado autenticado.';

    end if;


    if p_manual_reason is null
       or trim(p_manual_reason) = '' then

      raise exception
        'El motivo del descuento manual es obligatorio.';

    end if;


    if p_manual_amount <= 0 then

      raise exception
        'El descuento debe ser mayor que cero.';

    end if;


    if p_manual_amount > p_subtotal then

      raise exception
        'El descuento de % no puede ser mayor al subtotal de %.',
        p_manual_amount,
        p_subtotal;

    end if;


    v_amount := p_manual_amount;


    insert into public.order_discounts (
      order_id,
      promotion_id,
      discount_type,
      discount_value,
      amount_applied,
      reason,
      created_by
    )
    values (
      p_order_id,
      null,
      'manual',
      p_manual_amount,
      v_amount,
      p_manual_reason,
      p_actor_id
    );

  end if;


  -- ==========================================================
  -- ACTUALIZAR TOTAL DEL PEDIDO
  -- ==========================================================

  if v_amount > 0 then

    update public.orders

    set
      discount_total = discount_total + v_amount,
      total = total - v_amount,
      updated_at = now()

    where id = p_order_id;

  end if;


  return v_amount;

end;
$function$;

-- notify_pending_payment: catálogo auditado
CREATE OR REPLACE FUNCTION public.notify_pending_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_number bigint;
begin
  if new.status = 'pendiente' then
    select o.order_number into v_order_number from public.orders o where o.id = new.order_id;

    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'pago_pendiente',
      'Pago pendiente de verificar — pedido #' || v_order_number,
      'payment',
      new.id
    );
  end if;
  return new;
end;
$function$;

-- confirm_payment: fuente local 013, propuesta
CREATE OR REPLACE FUNCTION public.confirm_payment(p_payment_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE actor uuid:=auth.uid(); o public.orders%rowtype; p public.payments%rowtype;
BEGIN
 IF actor IS NULL OR NOT public.is_employee_or_admin() THEN RAISE EXCEPTION 'No tienes permisos para confirmar pagos.'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=(SELECT order_id FROM public.payments WHERE id=p_payment_id) FOR UPDATE;
 PERFORM id FROM public.payments WHERE order_id=o.id ORDER BY id FOR UPDATE;
 SELECT * INTO p FROM public.payments WHERE id=p_payment_id;
 IF p.id IS NULL THEN RAISE EXCEPTION 'El pago no existe.'; END IF;
 IF p.status<>'pendiente' THEN RAISE EXCEPTION 'Este pago ya fue procesado (estado actual: %).',p.status; END IF;
 IF o.deleted_at IS NOT NULL OR o.status<>'pendiente_pago' OR o.order_type<>'online' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación de pago.'; END IF;
 IF o.total<=0 OR o.total::text='NaN' OR p.amount IS DISTINCT FROM o.total THEN RAISE EXCEPTION 'El monto del pago no coincide con el pedido.'; END IF;
 PERFORM public.consume_order_reservations(o.id,actor);
 UPDATE public.payments SET status='confirmado',confirmed_by=actor,confirmed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=p.id;
 UPDATE public.orders SET status='confirmado',updated_at=clock_timestamp() WHERE id=o.id;
END;
$function$;

-- notify_new_order: catálogo auditado
CREATE OR REPLACE FUNCTION public.notify_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.order_type = 'online' then
    insert into public.notifications (type, message, reference_type, reference_id)
    values (
      'nuevo_pedido',
      'Nuevo pedido online #' || new.order_number,
      'order',
      new.id
    );
  end if;
  return new;
end;
$function$;

-- check_rate_limit: catálogo auditado
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_route text, p_max_attempts integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_count int;
begin
  if p_ip is null or p_ip = '' then
    raise exception 'IP requerida para rate limiting.';
  end if;

  if p_max_attempts is null or p_max_attempts <= 0 then
    raise exception 'p_max_attempts debe ser mayor a 0.';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds debe ser mayor a 0.';
  end if;

  -- Limpieza oportunista y acotada: 1% de las llamadas borran
  -- intentos de más de 1 hora en toda la tabla, para que no crezca
  -- indefinidamente sin depender de pg_cron (que puede no estar
  -- habilitado en todos los planes de Supabase).
  if random() < 0.01 then
    delete from public.rate_limit_attempts
    where created_at < now() - interval '1 hour';
  end if;

  select count(*) into v_count
  from public.rate_limit_attempts
  where ip = p_ip
    and route = p_route
    and created_at >= now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_attempts (ip, route)
  values (p_ip, p_route);

  return true;
end;
$function$;

-- audit_products_change: catálogo auditado
CREATE OR REPLACE FUNCTION public.audit_products_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, before, after)
  values (
    auth.uid(),
    case
      when OLD.price is distinct from NEW.price then 'precio_modificado'
      else 'producto_modificado'
    end,
    'products',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );

  return NEW;
end;
$function$;

-- get_audit_trail: catálogo auditado
CREATE OR REPLACE FUNCTION public.get_audit_trail(p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS SETOF audit_trail
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ver el historial de auditoría.';
  end if;

  if p_limit is null or p_limit <= 0 or p_limit > 200 then
    p_limit := 100;
  end if;

  if p_offset is null or p_offset < 0 then
    p_offset := 0;
  end if;

  return query
    select *
    from public.audit_trail
    order by created_at desc
    limit p_limit offset p_offset;
end;
$function$;

-- track_order: catálogo auditado
CREATE OR REPLACE FUNCTION public.track_order(p_order_number bigint, p_customer_phone text)
 RETURNS TABLE(order_number bigint, status text, order_type text, subtotal numeric, discount_total numeric, total numeric, customer_message text, created_at timestamp with time zone, updated_at timestamp with time zone, items jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid;
begin
  if p_order_number is null or p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Número de pedido y teléfono son obligatorios.';
  end if;

  select o.id into v_order_id
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.order_number = p_order_number
    and (c.phone = p_customer_phone or c.whatsapp = p_customer_phone);

  if v_order_id is null then
    raise exception 'No encontramos un pedido con ese número y teléfono.';
  end if;

  return query
  select
    o.order_number,
    o.status,
    o.order_type,
    o.subtotal,
    o.discount_total,
    o.total,
    o.customer_message,
    o.created_at,
    o.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', oi.product_name_snapshot,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price_snapshot,
            'line_total', oi.line_total,
            'personalization', oi.personalization,
            'message', oi.message,
            'note', oi.note
          )
          order by oi.created_at asc
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.id = v_order_id;
end;
$function$;

-- create_physical_sale: catálogo auditado
CREATE OR REPLACE FUNCTION public.create_physical_sale(p_items jsonb, p_customer_id uuid, p_promotion_id uuid, p_manual_discount_amount numeric, p_manual_discount_reason text, p_payment_method text)
 RETURNS TABLE(id uuid, order_number bigint, subtotal numeric, discount_total numeric, total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_seller_id uuid;
  v_cash_session_id uuid;
  v_customer_exists integer;
  v_item jsonb;
  v_product_id uuid;
  v_product_name text;
  v_product_price numeric(12,2);
  v_product_active boolean;
  v_product_available boolean;
  v_product_sold_out boolean;
  v_quantity numeric(12,3);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_final_total numeric(12,2);
  v_req_item_id uuid;
  v_req_quantity numeric(12,3);
  v_needed numeric(12,3);
  v_already_reserved numeric(12,3);
  v_available numeric(12,3);
  v_item_needs jsonb := '{}'::jsonb;
  v_inv_item_id text;
  v_order_id uuid;
  v_lot_id uuid;
  v_lot_remaining numeric(12,3);
  v_remaining_to_consume numeric(12,3);
  v_take_from_lot numeric(12,3);
begin
  v_seller_id := auth.uid();

  if v_seller_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_employee_or_admin() then
    raise exception 'No tienes permisos para registrar ventas.';
  end if;

  if p_customer_id is not null then
    select count(*) into v_customer_exists from public.customers c where c.id = p_customer_id;
    if v_customer_exists = 0 then
      raise exception 'El cliente seleccionado no existe.';
    end if;
  end if;

  select cs.id into v_cash_session_id
  from public.cash_sessions cs
  where cs.status = 'abierta'
  order by cs.opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'No hay una caja abierta. Abre la caja antes de registrar una venta física.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener al menos un producto.';
  end if;

  if p_payment_method not in ('qr', 'efectivo') then
    raise exception 'Método de pago no válido para venta física.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.id, pr.name, pr.price, pr.is_active, pr.is_available, pr.is_sold_out
    into v_product_id, v_product_name, v_product_price, v_product_active, v_product_available, v_product_sold_out
    from public.products pr
    where pr.id = (v_item->>'product_id')::uuid;

    if v_product_id is null then
      raise exception 'Uno de los productos de la venta ya no existe.';
    end if;

    if not v_product_active or not v_product_available or v_product_sold_out then
      raise exception 'El producto "%" ya no está disponible.', v_product_name;
    end if;

    v_quantity := (v_item->>'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'La cantidad de "%" debe ser mayor que cero.', v_product_name;
    end if;

    for v_req_item_id, v_req_quantity in
      select pir.inventory_item_id, pir.quantity
      from public.product_inventory_requirements pir
      where pir.product_id = v_product_id
    loop
      v_needed := v_req_quantity * v_quantity;
      v_inv_item_id := v_req_item_id::text;
      v_item_needs := jsonb_set(
        v_item_needs, array[v_inv_item_id],
        to_jsonb(coalesce((v_item_needs->>v_inv_item_id)::numeric, 0) + v_needed)
      );
    end loop;
  end loop;

  perform public.release_expired_reservations(NULL);
  for v_inv_item_id in select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop


    select ii.current_stock into v_available
    from public.inventory_items ii
    where ii.id = v_inv_item_id::uuid
    for update;

    if v_available is null then
      raise exception 'Un ítem de inventario de la venta ya no existe.';
    end if;

    select coalesce(sum(ir.quantity), 0) into v_already_reserved
    from public.inventory_reservations ir
    where ir.inventory_item_id = v_inv_item_id::uuid and ir.status = 'reserved';

    v_available := v_available - v_already_reserved;
    v_needed := (v_item_needs->>v_inv_item_id)::numeric;

    if v_available < v_needed then
      raise exception 'Stock insuficiente: solo hay % disponible (hay % reservado por pedidos online) y se necesitan %.',
        v_available, v_already_reserved, v_needed;
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.price into v_product_price from public.products pr where pr.id = (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_subtotal := v_subtotal + (v_product_price * v_quantity);
  end loop;

  -- Venta física: pagada y entregada en el momento → directo a
  -- FINALIZADO. Nunca pasa por pendiente_pago/confirmado/en_preparacion.
  insert into public.orders (customer_id, order_type, status, subtotal, discount_total, total)
  values (p_customer_id, 'fisica', 'finalizado', v_subtotal, 0, v_subtotal)
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pr.id, pr.name, pr.price
    into v_product_id, v_product_name, v_product_price
    from public.products pr where pr.id = (v_item->>'product_id')::uuid;

    v_quantity := (v_item->>'quantity')::numeric;
    v_line_total := v_product_price * v_quantity;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total
    ) values (
      v_order_id, v_product_id, v_product_name, v_product_price, v_quantity, v_line_total
    );
  end loop;

  if p_promotion_id is not null or p_manual_discount_amount is not null then
    perform public.apply_order_discount(
      v_order_id, v_subtotal, p_customer_id, p_promotion_id, p_manual_discount_amount, p_manual_discount_reason, v_seller_id
    );
  end if;

  select o.total into v_final_total from public.orders o where o.id = v_order_id;

  for v_inv_item_id in select key from jsonb_object_keys(v_item_needs) key order by key::uuid
  loop
    v_remaining_to_consume := (v_item_needs->>v_inv_item_id)::numeric;

    for v_lot_id, v_lot_remaining in
      select il.id, il.remaining_quantity
      from public.inventory_lots il
      where il.inventory_item_id = v_inv_item_id::uuid and il.remaining_quantity > 0
      order by il.received_at asc, il.created_at asc, il.id asc
      for update
    loop
      exit when v_remaining_to_consume <= 0;

      v_take_from_lot := least(v_lot_remaining, v_remaining_to_consume);

      update public.inventory_lots set remaining_quantity = remaining_quantity - v_take_from_lot
      where inventory_lots.id = v_lot_id;

      insert into public.inventory_movements (
        inventory_item_id, lot_id, movement_type, quantity, reference_type, reference_id, created_by
      ) values (
        v_inv_item_id::uuid, v_lot_id, 'salida', v_take_from_lot, 'order', v_order_id, v_seller_id
      );

      v_remaining_to_consume := v_remaining_to_consume - v_take_from_lot;
    end loop;

    if v_remaining_to_consume > 0 then
      raise exception 'Inconsistencia de inventario al registrar la venta para el ítem %.', v_inv_item_id;
    end if;

    update public.inventory_items
    set current_stock = current_stock - (v_item_needs->>v_inv_item_id)::numeric, updated_at = now()
    where inventory_items.id = v_inv_item_id::uuid;
  end loop;

  insert into public.payments (order_id, method, amount, status, confirmed_by, confirmed_at)
  values (v_order_id, p_payment_method, v_final_total, 'confirmado', v_seller_id, now());

  insert into public.cash_movements (
    cash_session_id, movement_type, payment_method, amount, order_id, created_by
  ) values (
    v_cash_session_id, 'venta', p_payment_method, v_final_total, v_order_id, v_seller_id
  );

  return query
  select o.id, o.order_number, o.subtotal, o.discount_total, o.total
  from public.orders o
  where o.id = v_order_id;
end;
$function$;

-- create_payment: catálogo auditado
-- Definición oficial propuesta: SOLO servidor, teléfono validado atómicamente.
CREATE OR REPLACE FUNCTION public.create_payment(p_order_id uuid, p_customer_phone text)
RETURNS TABLE(id uuid, amount numeric, method text, status text, order_number bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $payment$
DECLARE
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_pending_count integer;
BEGIN
  -- La ACL es la frontera servidor/cliente; la comprobación siguiente evita
  -- que un bug del servidor transforme un UUID ajeno en autorización de pago.
  SELECT o.* INTO v_order
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id AND o.deleted_at IS NULL
    AND nullif(trim(p_customer_phone), '') IS NOT NULL
    AND (c.phone = trim(p_customer_phone) OR c.whatsapp = trim(p_customer_phone))
  FOR UPDATE OF o;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'No encontramos un pedido con esos datos.';
  END IF;
  IF v_order.status <> 'pendiente_pago' OR v_order.order_type <> 'online' THEN
    RAISE EXCEPTION 'Este pedido ya no admite un pago nuevo.';
  END IF;
  IF v_order.total IS NULL OR v_order.total <= 0 OR v_order.total::text = 'NaN' THEN
    RAISE EXCEPTION 'El pedido no tiene un monto válido para reportar pago.';
  END IF;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until <= clock_timestamp() THEN
    RAISE EXCEPTION 'La reserva del pedido venció. No se puede reportar el pago.';
  END IF;
  PERFORM p.id FROM public.payments p WHERE p.order_id=p_order_id ORDER BY p.id FOR UPDATE;
  PERFORM ir.id FROM public.inventory_reservations ir WHERE ir.order_id=p_order_id ORDER BY ir.inventory_item_id,ir.id FOR UPDATE;
  IF v_order.reserved_until IS NOT NULL AND v_order.reserved_until<=clock_timestamp() THEN RAISE EXCEPTION 'La reserva del pedido venció.'; END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_reservations ir WHERE ir.order_id = p_order_id
             AND (ir.status <> 'reserved' OR ir.expires_at <= clock_timestamp())) THEN
    RAISE EXCEPTION 'La reserva del pedido ya no está vigente.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments p WHERE p.order_id = p_order_id AND p.status = 'confirmado') THEN
    RAISE EXCEPTION 'Este pedido ya tiene un pago confirmado.';
  END IF;
  SELECT count(*) INTO v_pending_count FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente';
  IF v_pending_count > 1 THEN
    RAISE EXCEPTION 'Hay pagos pendientes duplicados. Requiere revisión administrativa.';
  END IF;
  SELECT p.* INTO v_payment FROM public.payments p
  WHERE p.order_id = p_order_id AND p.status = 'pendiente' FOR UPDATE;
  IF v_payment.id IS NULL THEN
    INSERT INTO public.payments (order_id, method, amount, status)
    VALUES (p_order_id, 'qr', v_order.total, 'pendiente') RETURNING * INTO v_payment;
  ELSIF v_payment.amount IS DISTINCT FROM v_order.total OR v_payment.method <> 'qr' THEN
    RAISE EXCEPTION 'El pago pendiente no coincide con el pedido. Requiere revisión administrativa.';
  END IF;
  -- Reintentos serializados por el bloqueo del pedido reutilizan el mismo id.
  RETURN QUERY SELECT v_payment.id, v_payment.amount, v_payment.method, v_payment.status, v_order.order_number;
END;
$payment$;

-- validate_inventory_movement_actor: catálogo auditado
CREATE OR REPLACE FUNCTION public.validate_inventory_movement_actor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.created_by IS NULL AND NOT (NEW.movement_type='salida' AND NEW.reference_type='order' AND
  EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.reference_id AND order_type='online' AND status='pendiente_pago'
   AND subtotal>0 AND total=0 AND discount_total=subtotal)) THEN
  RAISE EXCEPTION 'Actor obligatorio salvo consumo automático de pedido gratuito válido.';
 END IF;
 RETURN NEW;
END;
$function$;

-- protect_order_request_contract: catálogo auditado
CREATE OR REPLACE FUNCTION public.protect_order_request_contract() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 IF NEW.request_contract IS DISTINCT FROM OLD.request_contract THEN
  RAISE EXCEPTION 'El contrato original del pedido es inmutable.';
 END IF;
 RETURN NEW;
END;
$function$;

-- consume_order_reservations: catálogo auditado
CREATE OR REPLACE FUNCTION public.consume_order_reservations(p_order_id uuid,p_actor_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE o public.orders%rowtype; r record; l record; remaining numeric; take numeric; checked_at timestamptz;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.status <> 'pendiente_pago' THEN RAISE EXCEPTION 'El pedido ya no admite confirmación.'; END IF;
 IF p_actor_id IS NULL AND NOT (o.order_type='online' AND o.subtotal>0 AND o.total=0 AND o.discount_total=o.subtotal) THEN RAISE EXCEPTION 'Consumo automático solo para pedido gratuito válido.'; END IF;
 PERFORM id FROM public.payments WHERE order_id=p_order_id ORDER BY id FOR UPDATE;
 PERFORM id FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id FOR UPDATE;
 PERFORM i.id FROM public.inventory_items i WHERE i.id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id) ORDER BY i.id FOR UPDATE;
 PERFORM locked_lot.id FROM public.inventory_lots locked_lot WHERE locked_lot.inventory_item_id IN
  (SELECT inventory_item_id FROM public.inventory_reservations WHERE order_id=p_order_id)
  ORDER BY locked_lot.inventory_item_id,locked_lot.received_at,locked_lot.created_at,locked_lot.id FOR UPDATE;
 checked_at:=clock_timestamp();
 IF o.reserved_until IS NOT NULL AND o.reserved_until<=checked_at THEN RAISE EXCEPTION 'La reserva del pedido venció. No se puede confirmar.'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_reservations WHERE order_id=p_order_id AND (status<>'reserved' OR expires_at<=checked_at)) THEN
  RAISE EXCEPTION 'La reserva de inventario venció o fue liberada.';
 END IF;
 FOR r IN SELECT * FROM public.inventory_reservations WHERE order_id=p_order_id ORDER BY inventory_item_id,id LOOP
  IF (SELECT current_stock FROM public.inventory_items WHERE id=r.inventory_item_id)<r.quantity THEN RAISE EXCEPTION 'Inconsistencia de inventario: stock insuficiente.'; END IF;
  remaining:=r.quantity;
  FOR l IN SELECT * FROM public.inventory_lots WHERE inventory_item_id=r.inventory_item_id AND remaining_quantity>0 ORDER BY received_at,created_at,id LOOP
   EXIT WHEN remaining<=0;
   take:=least(l.remaining_quantity,remaining);
   UPDATE public.inventory_lots SET remaining_quantity=remaining_quantity-take WHERE id=l.id;
   INSERT INTO public.inventory_movements(inventory_item_id,lot_id,movement_type,quantity,reference_type,reference_id,created_by)
    VALUES(r.inventory_item_id,l.id,'salida',take,'order',p_order_id,p_actor_id);
   remaining:=remaining-take;
  END LOOP;
  IF remaining>0 THEN RAISE EXCEPTION 'Inconsistencia de inventario: no quedan lotes suficientes.'; END IF;
  UPDATE public.inventory_items SET current_stock=current_stock-r.quantity,updated_at=checked_at WHERE id=r.inventory_item_id;
  UPDATE public.inventory_reservations SET status='consumed',released_at=checked_at WHERE id=r.id;
 END LOOP;
END;
$function$;

ALTER TABLE "public"."seasons" ADD CONSTRAINT "seasons_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['administrador'::text, 'empleado'::text]));

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY (key);

ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_name_unique" UNIQUE (name);

ALTER TABLE "public"."seasons" ADD CONSTRAINT "seasons_name_unique" UNIQUE (name);

ALTER TABLE "public"."products" ADD CONSTRAINT "products_price_check" CHECK (price >= 0::numeric);

ALTER TABLE "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_not_self" CHECK (parent_product_id <> component_product_id);

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_unique" UNIQUE (parent_product_id, component_product_id);

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_item_type_check" CHECK (item_type = ANY (ARRAY['flor'::text, 'insumo'::text, 'componente'::text, 'producto'::text]));

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_current_stock_check" CHECK (current_stock >= 0::numeric);

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_minimum_stock_check" CHECK (minimum_stock >= 0::numeric);

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_sku_unique" UNIQUE (sku);

ALTER TABLE "public"."inventory_entries" ADD CONSTRAINT "inventory_entries_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."inventory_entries" ADD CONSTRAINT "inventory_entries_unit_cost_check" CHECK (unit_cost >= 0::numeric);

ALTER TABLE "public"."inventory_entries" ADD CONSTRAINT "inventory_entries_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_initial_quantity_check" CHECK (initial_quantity > 0::numeric);

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_remaining_quantity_check" CHECK (remaining_quantity >= 0::numeric);

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_quantity_valid" CHECK (remaining_quantity <= initial_quantity);

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_movement_type_check" CHECK (movement_type = ANY (ARRAY['entrada'::text, 'salida'::text, 'merma'::text, 'ajuste'::text, 'devolucion'::text, 'reversion'::text]));

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_waste" ADD CONSTRAINT "inventory_waste_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."inventory_waste" ADD CONSTRAINT "inventory_waste_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_quantity_delta_check" CHECK (quantity_delta <> 0::numeric);

ALTER TABLE "public"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_inventory_requirements" ADD CONSTRAINT "product_inventory_requirements_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."product_inventory_requirements" ADD CONSTRAINT "product_inventory_requirements_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."product_inventory_requirements" ADD CONSTRAINT "product_inventory_requirements_unique" UNIQUE (product_id, inventory_item_id);

ALTER TABLE "public"."customization_options" ADD CONSTRAINT "customization_options_option_type_check" CHECK (option_type = ANY (ARRAY['cantidad_rosas'::text, 'color'::text, 'tipo_flor'::text, 'oso'::text, 'decoracion'::text, 'otro'::text]));

ALTER TABLE "public"."customization_options" ADD CONSTRAINT "customization_options_extra_price_check" CHECK (extra_price >= 0::numeric);

ALTER TABLE "public"."customization_options" ADD CONSTRAINT "customization_options_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_order_type_check" CHECK (order_type = ANY (ARRAY['online'::text, 'fisica'::text]));

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_status_check" CHECK (status = ANY (ARRAY['pendiente_pago'::text, 'confirmado'::text, 'en_preparacion'::text, 'listo'::text, 'finalizado'::text, 'cancelado'::text, 'rechazado'::text]));

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_subtotal_check" CHECK (subtotal >= 0::numeric);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_discount_total_check" CHECK (discount_total >= 0::numeric);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_total_check" CHECK (total >= 0::numeric);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_cancel_reason_required" CHECK (status <> 'cancelado'::text OR cancellation_reason IS NOT NULL);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_number_unique" UNIQUE (order_number);

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_idempotency_unique" UNIQUE (idempotency_key);

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_unit_price_snapshot_check" CHECK (unit_price_snapshot >= 0::numeric);

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_line_total_check" CHECK (line_total >= 0::numeric);

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_amount_check" CHECK (amount > 0::numeric);

ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_status_check" CHECK (status = ANY (ARRAY['reserved'::text, 'consumed'::text, 'released'::text, 'cancelled'::text]));

ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."payment_qr_config" ADD CONSTRAINT "payment_qr_config_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_method_check" CHECK (method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text]));

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_amount_check" CHECK (amount > 0::numeric);

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_status_check" CHECK (status = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'rechazado'::text, 'reembolsado'::text]));

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_confirmation_data_valid" CHECK (status = 'confirmado'::text AND confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL OR status <> 'confirmado'::text);

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_direction_check" CHECK (direction = ANY (ARRAY['entrada'::text, 'salida'::text]));

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_rejection_data_valid" CHECK (status = 'rechazado'::text AND rejection_reason IS NOT NULL AND rejected_by IS NOT NULL AND rejected_at IS NOT NULL OR status <> 'rechazado'::text);

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."whatsapp_config" ADD CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."sale_returns" ADD CONSTRAINT "sale_returns_type_check" CHECK (type = ANY (ARRAY['devolucion'::text, 'reintegro'::text]));

ALTER TABLE "public"."sale_returns" ADD CONSTRAINT "sale_returns_amount_check" CHECK (amount > 0::numeric);

ALTER TABLE "public"."sale_returns" ADD CONSTRAINT "sale_returns_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "order_deletion_requests_status_check" CHECK (status = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text]));

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_direction_only_for_ajuste" CHECK (movement_type = 'ajuste'::text AND direction IS NOT NULL OR movement_type <> 'ajuste'::text AND direction IS NULL);

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "deletion_request_review_data_valid" CHECK (status = 'pendiente'::text AND reviewed_by IS NULL AND reviewed_at IS NULL OR status <> 'pendiente'::text AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL);

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "order_deletion_requests_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."cash_registers" ADD CONSTRAINT "cash_registers_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_opening_amount_check" CHECK (opening_amount >= 0::numeric);

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_status_check" CHECK (status = ANY (ARRAY['abierta'::text, 'cerrada'::text]));

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_movement_type_check" CHECK (movement_type = ANY (ARRAY['venta'::text, 'ingreso'::text, 'gasto'::text, 'ajuste'::text, 'devolucion'::text]));

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_payment_method_check" CHECK (payment_method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text]));

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_discount_type_check" CHECK (discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text]));

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_discount_value_check" CHECK (discount_value >= 0::numeric);

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_minimum_purchase_check" CHECK (minimum_purchase >= 0::numeric);

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."promotion_products" ADD CONSTRAINT "promotion_products_pkey" PRIMARY KEY (promotion_id, product_id);

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_discount_value_check" CHECK (discount_value >= 0::numeric);

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_amount_applied_check" CHECK (amount_applied >= 0::numeric);

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_manual_reason_required" CHECK (discount_type <> 'manual'::text OR reason IS NOT NULL AND TRIM(BOTH FROM reason) <> ''::text);

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_type_check" CHECK (type = ANY (ARRAY['nuevo_pedido'::text, 'pago_pendiente'::text, 'stock_bajo'::text, 'stock_agotado'::text, 'pedido_listo'::text, 'cumpleanos'::text, 'alerta'::text]));

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_type_fields_check" CHECK (promotion_type = 'producto'::text AND discount_type IS NOT NULL AND discount_value IS NOT NULL AND combo_price IS NULL OR promotion_type = 'combo'::text AND combo_price IS NOT NULL AND discount_type IS NULL AND discount_value IS NULL);

ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_day_of_week_check" CHECK (day_of_week >= 0 AND day_of_week <= 6);

ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_hours_valid" CHECK (is_closed = true OR opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at);

ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_day_unique" UNIQUE (day_of_week);

ALTER TABLE "public"."rate_limit_attempts" ADD CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."customization_option_inventory_requirements" ADD CONSTRAINT "customization_option_inventory_requirements_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."customization_option_inventory_requirements" ADD CONSTRAINT "customization_option_inventory_requirements_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."customization_option_inventory_requirements" ADD CONSTRAINT "coir_unique" UNIQUE (customization_option_id, inventory_item_id);

ALTER TABLE "public"."promotion_products" ADD CONSTRAINT "promotion_products_quantity_check" CHECK (quantity > 0::numeric);

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_promotion_type_check" CHECK (promotion_type = ANY (ARRAY['producto'::text, 'combo'::text]));

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_combo_price_check" CHECK (combo_price IS NULL OR combo_price >= 0::numeric);

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_discount_type_check" CHECK (discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text, 'manual'::text, 'combo'::text]));

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_percent_max_check" CHECK (discount_type IS DISTINCT FROM 'porcentaje'::text OR discount_value <= 100::numeric) NOT VALID;

ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_dates_check" CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID;

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE "public"."products" ADD CONSTRAINT "products_season_id_fkey" FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL;

ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_parent_product_id_fkey" FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_component_product_id_fkey" FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_entries" ADD CONSTRAINT "inventory_entries_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_entries" ADD CONSTRAINT "inventory_entries_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_inventory_entry_id_fkey" FOREIGN KEY (inventory_entry_id) REFERENCES inventory_entries(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_lot_id_fkey" FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_waste" ADD CONSTRAINT "inventory_waste_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_waste" ADD CONSTRAINT "inventory_waste_lot_id_fkey" FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_waste" ADD CONSTRAINT "inventory_waste_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."product_inventory_requirements" ADD CONSTRAINT "product_inventory_requirements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE "public"."product_inventory_requirements" ADD CONSTRAINT "product_inventory_requirements_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."customization_options" ADD CONSTRAINT "customization_options_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_cancelled_by_fkey" FOREIGN KEY (cancelled_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_fkey" FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payment_qr_config" ADD CONSTRAINT "payment_qr_config_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_rejected_by_fkey" FOREIGN KEY (rejected_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."whatsapp_config" ADD CONSTRAINT "whatsapp_config_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."sale_returns" ADD CONSTRAINT "sale_returns_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."sale_returns" ADD CONSTRAINT "sale_returns_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "order_deletion_requests_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "order_deletion_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_deletion_requests" ADD CONSTRAINT "order_deletion_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_cash_register_id_fkey" FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_opened_by_fkey" FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_closed_by_fkey" FOREIGN KEY (closed_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."cash_movements" ADD CONSTRAINT "cash_movements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE;

ALTER TABLE "public"."promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_discounts" ADD CONSTRAINT "order_discounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_read_by_fkey" FOREIGN KEY (read_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."customization_option_inventory_requirements" ADD CONSTRAINT "customization_option_inventory_req_customization_option_id_fkey" FOREIGN KEY (customization_option_id) REFERENCES customization_options(id) ON DELETE CASCADE;

ALTER TABLE "public"."customization_option_inventory_requirements" ADD CONSTRAINT "customization_option_inventory_requireme_inventory_item_id_fkey" FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

CREATE INDEX idx_customization_product ON public.customization_options USING btree (product_id);

CREATE INDEX idx_reservations_item_status ON public.inventory_reservations USING btree (inventory_item_id, status, expires_at);

CREATE INDEX idx_reservations_order ON public.inventory_reservations USING btree (order_id);

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

CREATE INDEX idx_cash_movements_session ON public.cash_movements USING btree (cash_session_id, created_at);

CREATE INDEX idx_cash_sessions_register_status ON public.cash_sessions USING btree (cash_register_id, status);

CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id, created_at DESC);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (is_read, created_at DESC);

CREATE INDEX idx_coir_option ON public.customization_option_inventory_requirements USING btree (customization_option_id);

CREATE INDEX idx_coir_item ON public.customization_option_inventory_requirements USING btree (inventory_item_id);

CREATE INDEX idx_inventory_adjustments_item ON public.inventory_adjustments USING btree (inventory_item_id, created_at);

CREATE INDEX idx_inventory_entries_item ON public.inventory_entries USING btree (inventory_item_id, received_at);

CREATE INDEX idx_inventory_items_type ON public.inventory_items USING btree (item_type);

CREATE INDEX idx_inventory_lots_fifo ON public.inventory_lots USING btree (inventory_item_id, received_at, created_at);

CREATE INDEX idx_inventory_movements_item ON public.inventory_movements USING btree (inventory_item_id, created_at);

CREATE INDEX idx_inventory_waste_item ON public.inventory_waste USING btree (inventory_item_id, created_at);

CREATE INDEX idx_deletion_requests_order ON public.order_deletion_requests USING btree (order_id);

CREATE INDEX idx_deletion_requests_status ON public.order_deletion_requests USING btree (status);

CREATE INDEX idx_order_discounts_order ON public.order_discounts USING btree (order_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status, created_at);

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id, created_at DESC);

CREATE INDEX idx_payments_status ON public.payments USING btree (status);

CREATE INDEX idx_pir_product ON public.product_inventory_requirements USING btree (product_id);

CREATE INDEX idx_pir_item ON public.product_inventory_requirements USING btree (inventory_item_id);

CREATE INDEX idx_promotion_products_product ON public.promotion_products USING btree (product_id);

CREATE INDEX idx_rate_limit_attempts_ip_route_time ON public.rate_limit_attempts USING btree (ip, route, created_at DESC);

CREATE INDEX idx_sale_returns_order ON public.sale_returns USING btree (order_id);

ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."business_hours" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cash_movements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cash_registers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cash_sessions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customization_option_inventory_requirements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customization_options" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_adjustments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_entries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_lots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_reservations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_waste" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_deletion_requests" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_discounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payment_qr_config" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product_components" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product_inventory_requirements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promotion_products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rate_limit_attempts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sale_returns" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."whatsapp_config" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio perfil" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() = id));

CREATE POLICY "Administradores pueden ver todos los perfiles" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "Administradores pueden ver configuración" ON "public"."system_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "Administradores pueden modificar configuración" ON "public"."system_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "categories_admin_insert" ON "public"."categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "categories_admin_update" ON "public"."categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "categories_admin_select" ON "public"."categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "seasons_admin_insert" ON "public"."seasons" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "seasons_admin_update" ON "public"."seasons" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "seasons_admin_select" ON "public"."seasons" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "products_admin_insert" ON "public"."products" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "products_admin_update" ON "public"."products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "products_admin_select" ON "public"."products" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "product_images_admin_insert" ON "public"."product_images" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "product_images_admin_select" ON "public"."product_images" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "product_images_admin_update" ON "public"."product_images" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "product_images_admin_delete" ON "public"."product_images" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_admin());

CREATE POLICY "product_components_admin_insert" ON "public"."product_components" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "product_components_admin_select" ON "public"."product_components" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "product_components_admin_update" ON "public"."product_components" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "product_components_admin_delete" ON "public"."product_components" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_admin());

CREATE POLICY "categories_employee_admin_all" ON "public"."categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "seasons_employee_admin_all" ON "public"."seasons" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "products_employee_admin_all" ON "public"."products" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "product_images_employee_admin_all" ON "public"."product_images" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "product_components_employee_admin_all" ON "public"."product_components" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "product_images_employee_admin_insert" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'product-images'::text) AND is_employee_or_admin()));

CREATE POLICY "customization_staff_select" ON "public"."customization_options" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "customization_staff_insert" ON "public"."customization_options" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "customization_staff_update" ON "public"."customization_options" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "customization_staff_delete" ON "public"."customization_options" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "customers_staff_select" ON "public"."customers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "customers_staff_insert" ON "public"."customers" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "customers_staff_update" ON "public"."customers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "orders_staff_select" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "order_items_staff_select" ON "public"."order_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "reservations_staff_select" ON "public"."inventory_reservations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "product_images_employee_admin_update" ON "storage"."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'product-images'::text) AND is_employee_or_admin())) WITH CHECK (((bucket_id = 'product-images'::text) AND is_employee_or_admin()));

CREATE POLICY "product_images_employee_admin_delete" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'product-images'::text) AND is_employee_or_admin()));

CREATE POLICY "profiles_select_own" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((id = auth.uid()));

CREATE POLICY "profiles_select_admin_all" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin());

CREATE POLICY "profiles_update_admin" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "inventory_items_staff_select" ON "public"."inventory_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_items_staff_insert" ON "public"."inventory_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "inventory_items_staff_update" ON "public"."inventory_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "inventory_entries_staff_select" ON "public"."inventory_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_entries_staff_insert" ON "public"."inventory_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "inventory_lots_staff_select" ON "public"."inventory_lots" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_movements_staff_select" ON "public"."inventory_movements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_waste_staff_select" ON "public"."inventory_waste" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_waste_staff_insert" ON "public"."inventory_waste" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "inventory_adjustments_staff_select" ON "public"."inventory_adjustments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "inventory_adjustments_staff_insert" ON "public"."inventory_adjustments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "pir_staff_select" ON "public"."product_inventory_requirements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "pir_staff_insert" ON "public"."product_inventory_requirements" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "pir_staff_update" ON "public"."product_inventory_requirements" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "pir_staff_delete" ON "public"."product_inventory_requirements" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "qr_config_public_select" ON "public"."payment_qr_config" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((is_active = true));

CREATE POLICY "payments_staff_select" ON "public"."payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "whatsapp_config_public_select" ON "public"."whatsapp_config" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((is_active = true));

CREATE POLICY "sale_returns_staff_select" ON "public"."sale_returns" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "deletion_requests_staff_select" ON "public"."order_deletion_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "cash_registers_staff_select" ON "public"."cash_registers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "cash_sessions_staff_select" ON "public"."cash_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "cash_movements_staff_select" ON "public"."cash_movements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "promotions_staff_select" ON "public"."promotions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "promotions_admin_insert" ON "public"."promotions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "promotions_admin_update" ON "public"."promotions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "promotions_public_select_active" ON "public"."promotions" AS PERMISSIVE FOR SELECT TO "anon" USING ((is_active = true));

CREATE POLICY "promotion_products_staff_select" ON "public"."promotion_products" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "promotion_products_admin_insert" ON "public"."promotion_products" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_admin());

CREATE POLICY "promotion_products_admin_delete" ON "public"."promotion_products" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_admin());

CREATE POLICY "order_discounts_staff_select" ON "public"."order_discounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "system_settings_staff_select" ON "public"."system_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "notifications_staff_select" ON "public"."notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "notifications_staff_update" ON "public"."notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "business_hours_public_select" ON "public"."business_hours" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "business_hours_admin_update" ON "public"."business_hours" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "products_public_select" ON "public"."products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((is_active = true));

CREATE POLICY "categories_public_select" ON "public"."categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((is_active = true));

CREATE POLICY "seasons_public_select" ON "public"."seasons" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((is_active = true));

CREATE POLICY "product_images_public_select" ON "public"."product_images" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_images.product_id) AND (p.is_active = true)))));

CREATE POLICY "product_components_public_select" ON "public"."product_components" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_components.parent_product_id) AND (p.is_active = true)))));

CREATE POLICY "customization_options_public_select" ON "public"."customization_options" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = customization_options.product_id) AND (p.is_active = true))))));

CREATE POLICY "coir_staff_select" ON "public"."customization_option_inventory_requirements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "coir_staff_insert" ON "public"."customization_option_inventory_requirements" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_employee_or_admin());

CREATE POLICY "coir_staff_update" ON "public"."customization_option_inventory_requirements" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_employee_or_admin()) WITH CHECK (is_employee_or_admin());

CREATE POLICY "coir_staff_delete" ON "public"."customization_option_inventory_requirements" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_employee_or_admin());

CREATE POLICY "promotion_products_admin_update" ON "public"."promotion_products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_inventory_entry_created AFTER INSERT ON inventory_entries FOR EACH ROW EXECUTE FUNCTION handle_inventory_entry();

CREATE TRIGGER trg_inventory_waste_created AFTER INSERT ON inventory_waste FOR EACH ROW EXECUTE FUNCTION handle_inventory_waste();

CREATE TRIGGER trg_inventory_adjustment_created AFTER INSERT ON inventory_adjustments FOR EACH ROW EXECUTE FUNCTION handle_inventory_adjustment();

CREATE TRIGGER trg_notify_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_new_order();

CREATE TRIGGER trg_notify_pending_payment AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION notify_pending_payment();

CREATE TRIGGER trg_notify_order_ready AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION notify_order_ready();

CREATE TRIGGER trg_notify_stock_alert AFTER UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION notify_stock_alert();

CREATE TRIGGER trg_audit_products AFTER UPDATE ON products FOR EACH ROW WHEN (old.name IS DISTINCT FROM new.name OR old.description IS DISTINCT FROM new.description OR old.price IS DISTINCT FROM new.price OR old.category_id IS DISTINCT FROM new.category_id OR old.occasion IS DISTINCT FROM new.occasion OR old.season_id IS DISTINCT FROM new.season_id OR old.is_featured IS DISTINCT FROM new.is_featured OR old.is_available IS DISTINCT FROM new.is_available OR old.is_sold_out IS DISTINCT FROM new.is_sold_out OR old.catalog_order IS DISTINCT FROM new.catalog_order OR old.is_active IS DISTINCT FROM new.is_active) EXECUTE FUNCTION audit_products_change();

CREATE OR REPLACE TRIGGER protect_order_request_contract BEFORE UPDATE OF request_contract ON public.orders FOR EACH ROW EXECUTE FUNCTION public.protect_order_request_contract();
CREATE OR REPLACE TRIGGER validate_inventory_movement_actor BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_movement_actor();

-- ACL de tablas/vista: conservar accesos auditados; RLS determina acceso a filas.

REVOKE ALL ON TABLE "public"."audit_logs" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."audit_logs" TO "anon";

GRANT SELECT ON TABLE "public"."audit_logs" TO "anon";

GRANT UPDATE ON TABLE "public"."audit_logs" TO "anon";

GRANT DELETE ON TABLE "public"."audit_logs" TO "anon";

GRANT INSERT ON TABLE "public"."audit_logs" TO "authenticated";

GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";

GRANT UPDATE ON TABLE "public"."audit_logs" TO "authenticated";

GRANT DELETE ON TABLE "public"."audit_logs" TO "authenticated";

GRANT INSERT ON TABLE "public"."audit_logs" TO "service_role";

GRANT SELECT ON TABLE "public"."audit_logs" TO "service_role";

GRANT UPDATE ON TABLE "public"."audit_logs" TO "service_role";

GRANT DELETE ON TABLE "public"."audit_logs" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."audit_logs" TO "service_role";

GRANT REFERENCES ON TABLE "public"."audit_logs" TO "service_role";

GRANT TRIGGER ON TABLE "public"."audit_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."business_hours" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."business_hours" TO "anon";

GRANT SELECT ON TABLE "public"."business_hours" TO "anon";

GRANT UPDATE ON TABLE "public"."business_hours" TO "anon";

GRANT DELETE ON TABLE "public"."business_hours" TO "anon";

GRANT INSERT ON TABLE "public"."business_hours" TO "authenticated";

GRANT SELECT ON TABLE "public"."business_hours" TO "authenticated";

GRANT UPDATE ON TABLE "public"."business_hours" TO "authenticated";

GRANT DELETE ON TABLE "public"."business_hours" TO "authenticated";

GRANT INSERT ON TABLE "public"."business_hours" TO "service_role";

GRANT SELECT ON TABLE "public"."business_hours" TO "service_role";

GRANT UPDATE ON TABLE "public"."business_hours" TO "service_role";

GRANT DELETE ON TABLE "public"."business_hours" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."business_hours" TO "service_role";

GRANT REFERENCES ON TABLE "public"."business_hours" TO "service_role";

GRANT TRIGGER ON TABLE "public"."business_hours" TO "service_role";

REVOKE ALL ON TABLE "public"."cash_movements" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."cash_movements" TO "anon";

GRANT SELECT ON TABLE "public"."cash_movements" TO "anon";

GRANT UPDATE ON TABLE "public"."cash_movements" TO "anon";

GRANT DELETE ON TABLE "public"."cash_movements" TO "anon";

GRANT INSERT ON TABLE "public"."cash_movements" TO "authenticated";

GRANT SELECT ON TABLE "public"."cash_movements" TO "authenticated";

GRANT UPDATE ON TABLE "public"."cash_movements" TO "authenticated";

GRANT DELETE ON TABLE "public"."cash_movements" TO "authenticated";

GRANT INSERT ON TABLE "public"."cash_movements" TO "service_role";

GRANT SELECT ON TABLE "public"."cash_movements" TO "service_role";

GRANT UPDATE ON TABLE "public"."cash_movements" TO "service_role";

GRANT DELETE ON TABLE "public"."cash_movements" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."cash_movements" TO "service_role";

GRANT REFERENCES ON TABLE "public"."cash_movements" TO "service_role";

GRANT TRIGGER ON TABLE "public"."cash_movements" TO "service_role";

REVOKE ALL ON TABLE "public"."cash_registers" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."cash_registers" TO "anon";

GRANT SELECT ON TABLE "public"."cash_registers" TO "anon";

GRANT UPDATE ON TABLE "public"."cash_registers" TO "anon";

GRANT DELETE ON TABLE "public"."cash_registers" TO "anon";

GRANT INSERT ON TABLE "public"."cash_registers" TO "authenticated";

GRANT SELECT ON TABLE "public"."cash_registers" TO "authenticated";

GRANT UPDATE ON TABLE "public"."cash_registers" TO "authenticated";

GRANT DELETE ON TABLE "public"."cash_registers" TO "authenticated";

GRANT INSERT ON TABLE "public"."cash_registers" TO "service_role";

GRANT SELECT ON TABLE "public"."cash_registers" TO "service_role";

GRANT UPDATE ON TABLE "public"."cash_registers" TO "service_role";

GRANT DELETE ON TABLE "public"."cash_registers" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."cash_registers" TO "service_role";

GRANT REFERENCES ON TABLE "public"."cash_registers" TO "service_role";

GRANT TRIGGER ON TABLE "public"."cash_registers" TO "service_role";

REVOKE ALL ON TABLE "public"."cash_sessions" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."cash_sessions" TO "anon";

GRANT SELECT ON TABLE "public"."cash_sessions" TO "anon";

GRANT UPDATE ON TABLE "public"."cash_sessions" TO "anon";

GRANT DELETE ON TABLE "public"."cash_sessions" TO "anon";

GRANT INSERT ON TABLE "public"."cash_sessions" TO "authenticated";

GRANT SELECT ON TABLE "public"."cash_sessions" TO "authenticated";

GRANT UPDATE ON TABLE "public"."cash_sessions" TO "authenticated";

GRANT DELETE ON TABLE "public"."cash_sessions" TO "authenticated";

GRANT INSERT ON TABLE "public"."cash_sessions" TO "service_role";

GRANT SELECT ON TABLE "public"."cash_sessions" TO "service_role";

GRANT UPDATE ON TABLE "public"."cash_sessions" TO "service_role";

GRANT DELETE ON TABLE "public"."cash_sessions" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."cash_sessions" TO "service_role";

GRANT REFERENCES ON TABLE "public"."cash_sessions" TO "service_role";

GRANT TRIGGER ON TABLE "public"."cash_sessions" TO "service_role";

REVOKE ALL ON TABLE "public"."categories" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."categories" TO "anon";

GRANT SELECT ON TABLE "public"."categories" TO "anon";

GRANT UPDATE ON TABLE "public"."categories" TO "anon";

GRANT DELETE ON TABLE "public"."categories" TO "anon";

GRANT INSERT ON TABLE "public"."categories" TO "authenticated";

GRANT SELECT ON TABLE "public"."categories" TO "authenticated";

GRANT UPDATE ON TABLE "public"."categories" TO "authenticated";

GRANT DELETE ON TABLE "public"."categories" TO "authenticated";

GRANT INSERT ON TABLE "public"."categories" TO "service_role";

GRANT SELECT ON TABLE "public"."categories" TO "service_role";

GRANT UPDATE ON TABLE "public"."categories" TO "service_role";

GRANT DELETE ON TABLE "public"."categories" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."categories" TO "service_role";

GRANT REFERENCES ON TABLE "public"."categories" TO "service_role";

GRANT TRIGGER ON TABLE "public"."categories" TO "service_role";

REVOKE ALL ON TABLE "public"."customers" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."customers" TO "anon";

GRANT SELECT ON TABLE "public"."customers" TO "anon";

GRANT UPDATE ON TABLE "public"."customers" TO "anon";

GRANT DELETE ON TABLE "public"."customers" TO "anon";

GRANT INSERT ON TABLE "public"."customers" TO "authenticated";

GRANT SELECT ON TABLE "public"."customers" TO "authenticated";

GRANT UPDATE ON TABLE "public"."customers" TO "authenticated";

GRANT DELETE ON TABLE "public"."customers" TO "authenticated";

GRANT INSERT ON TABLE "public"."customers" TO "service_role";

GRANT SELECT ON TABLE "public"."customers" TO "service_role";

GRANT UPDATE ON TABLE "public"."customers" TO "service_role";

GRANT DELETE ON TABLE "public"."customers" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."customers" TO "service_role";

GRANT REFERENCES ON TABLE "public"."customers" TO "service_role";

GRANT TRIGGER ON TABLE "public"."customers" TO "service_role";

REVOKE ALL ON TABLE "public"."customization_option_inventory_requirements" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."customization_option_inventory_requirements" TO "anon";

GRANT SELECT ON TABLE "public"."customization_option_inventory_requirements" TO "anon";

GRANT UPDATE ON TABLE "public"."customization_option_inventory_requirements" TO "anon";

GRANT DELETE ON TABLE "public"."customization_option_inventory_requirements" TO "anon";

GRANT INSERT ON TABLE "public"."customization_option_inventory_requirements" TO "authenticated";

GRANT SELECT ON TABLE "public"."customization_option_inventory_requirements" TO "authenticated";

GRANT UPDATE ON TABLE "public"."customization_option_inventory_requirements" TO "authenticated";

GRANT DELETE ON TABLE "public"."customization_option_inventory_requirements" TO "authenticated";

GRANT INSERT ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT SELECT ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT UPDATE ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT DELETE ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT REFERENCES ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

GRANT TRIGGER ON TABLE "public"."customization_option_inventory_requirements" TO "service_role";

REVOKE ALL ON TABLE "public"."customization_options" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."customization_options" TO "anon";

GRANT SELECT ON TABLE "public"."customization_options" TO "anon";

GRANT UPDATE ON TABLE "public"."customization_options" TO "anon";

GRANT DELETE ON TABLE "public"."customization_options" TO "anon";

GRANT INSERT ON TABLE "public"."customization_options" TO "authenticated";

GRANT SELECT ON TABLE "public"."customization_options" TO "authenticated";

GRANT UPDATE ON TABLE "public"."customization_options" TO "authenticated";

GRANT DELETE ON TABLE "public"."customization_options" TO "authenticated";

GRANT INSERT ON TABLE "public"."customization_options" TO "service_role";

GRANT SELECT ON TABLE "public"."customization_options" TO "service_role";

GRANT UPDATE ON TABLE "public"."customization_options" TO "service_role";

GRANT DELETE ON TABLE "public"."customization_options" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."customization_options" TO "service_role";

GRANT REFERENCES ON TABLE "public"."customization_options" TO "service_role";

GRANT TRIGGER ON TABLE "public"."customization_options" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_adjustments" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_adjustments" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_adjustments" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_adjustments" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_adjustments" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_adjustments" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_adjustments" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_adjustments" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_adjustments" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_adjustments" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_adjustments" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_entries" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_entries" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_entries" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_entries" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_entries" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_entries" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_entries" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_entries" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_entries" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_entries" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_entries" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_entries" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_entries" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_entries" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_entries" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_items" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_items" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_items" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_items" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_items" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_items" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_items" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_items" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_items" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_items" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_items" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_items" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_items" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_items" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_items" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_items" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_lots" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_lots" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_lots" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_lots" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_lots" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_lots" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_lots" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_lots" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_lots" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_lots" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_lots" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_lots" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_lots" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_lots" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_lots" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_lots" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_movements" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_movements" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_movements" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_movements" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_movements" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_movements" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_movements" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_movements" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_movements" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_movements" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_movements" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_movements" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_reservations" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_reservations" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_reservations" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_reservations" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_reservations" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_reservations" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_reservations" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_reservations" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_reservations" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_reservations" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_reservations" TO "service_role";

REVOKE ALL ON TABLE "public"."inventory_waste" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."inventory_waste" TO "anon";

GRANT SELECT ON TABLE "public"."inventory_waste" TO "anon";

GRANT UPDATE ON TABLE "public"."inventory_waste" TO "anon";

GRANT DELETE ON TABLE "public"."inventory_waste" TO "anon";

GRANT INSERT ON TABLE "public"."inventory_waste" TO "authenticated";

GRANT SELECT ON TABLE "public"."inventory_waste" TO "authenticated";

GRANT UPDATE ON TABLE "public"."inventory_waste" TO "authenticated";

GRANT DELETE ON TABLE "public"."inventory_waste" TO "authenticated";

GRANT INSERT ON TABLE "public"."inventory_waste" TO "service_role";

GRANT SELECT ON TABLE "public"."inventory_waste" TO "service_role";

GRANT UPDATE ON TABLE "public"."inventory_waste" TO "service_role";

GRANT DELETE ON TABLE "public"."inventory_waste" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."inventory_waste" TO "service_role";

GRANT REFERENCES ON TABLE "public"."inventory_waste" TO "service_role";

GRANT TRIGGER ON TABLE "public"."inventory_waste" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."notifications" TO "anon";

GRANT SELECT ON TABLE "public"."notifications" TO "anon";

GRANT UPDATE ON TABLE "public"."notifications" TO "anon";

GRANT DELETE ON TABLE "public"."notifications" TO "anon";

GRANT INSERT ON TABLE "public"."notifications" TO "authenticated";

GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";

GRANT UPDATE ON TABLE "public"."notifications" TO "authenticated";

GRANT DELETE ON TABLE "public"."notifications" TO "authenticated";

GRANT INSERT ON TABLE "public"."notifications" TO "service_role";

GRANT SELECT ON TABLE "public"."notifications" TO "service_role";

GRANT UPDATE ON TABLE "public"."notifications" TO "service_role";

GRANT DELETE ON TABLE "public"."notifications" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."notifications" TO "service_role";

GRANT REFERENCES ON TABLE "public"."notifications" TO "service_role";

GRANT TRIGGER ON TABLE "public"."notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."order_deletion_requests" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."order_deletion_requests" TO "anon";

GRANT SELECT ON TABLE "public"."order_deletion_requests" TO "anon";

GRANT UPDATE ON TABLE "public"."order_deletion_requests" TO "anon";

GRANT DELETE ON TABLE "public"."order_deletion_requests" TO "anon";

GRANT INSERT ON TABLE "public"."order_deletion_requests" TO "authenticated";

GRANT SELECT ON TABLE "public"."order_deletion_requests" TO "authenticated";

GRANT UPDATE ON TABLE "public"."order_deletion_requests" TO "authenticated";

GRANT DELETE ON TABLE "public"."order_deletion_requests" TO "authenticated";

GRANT INSERT ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT SELECT ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT UPDATE ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT DELETE ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT REFERENCES ON TABLE "public"."order_deletion_requests" TO "service_role";

GRANT TRIGGER ON TABLE "public"."order_deletion_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."order_discounts" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."order_discounts" TO "anon";

GRANT SELECT ON TABLE "public"."order_discounts" TO "anon";

GRANT UPDATE ON TABLE "public"."order_discounts" TO "anon";

GRANT DELETE ON TABLE "public"."order_discounts" TO "anon";

GRANT INSERT ON TABLE "public"."order_discounts" TO "authenticated";

GRANT SELECT ON TABLE "public"."order_discounts" TO "authenticated";

GRANT UPDATE ON TABLE "public"."order_discounts" TO "authenticated";

GRANT DELETE ON TABLE "public"."order_discounts" TO "authenticated";

GRANT INSERT ON TABLE "public"."order_discounts" TO "service_role";

GRANT SELECT ON TABLE "public"."order_discounts" TO "service_role";

GRANT UPDATE ON TABLE "public"."order_discounts" TO "service_role";

GRANT DELETE ON TABLE "public"."order_discounts" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."order_discounts" TO "service_role";

GRANT REFERENCES ON TABLE "public"."order_discounts" TO "service_role";

GRANT TRIGGER ON TABLE "public"."order_discounts" TO "service_role";

REVOKE ALL ON TABLE "public"."order_items" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."order_items" TO "anon";

GRANT SELECT ON TABLE "public"."order_items" TO "anon";

GRANT UPDATE ON TABLE "public"."order_items" TO "anon";

GRANT DELETE ON TABLE "public"."order_items" TO "anon";

GRANT INSERT ON TABLE "public"."order_items" TO "authenticated";

GRANT SELECT ON TABLE "public"."order_items" TO "authenticated";

GRANT UPDATE ON TABLE "public"."order_items" TO "authenticated";

GRANT DELETE ON TABLE "public"."order_items" TO "authenticated";

GRANT INSERT ON TABLE "public"."order_items" TO "service_role";

GRANT SELECT ON TABLE "public"."order_items" TO "service_role";

GRANT UPDATE ON TABLE "public"."order_items" TO "service_role";

GRANT DELETE ON TABLE "public"."order_items" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."order_items" TO "service_role";

GRANT REFERENCES ON TABLE "public"."order_items" TO "service_role";

GRANT TRIGGER ON TABLE "public"."order_items" TO "service_role";

REVOKE ALL ON TABLE "public"."orders" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."orders" TO "anon";

GRANT SELECT ON TABLE "public"."orders" TO "anon";

GRANT UPDATE ON TABLE "public"."orders" TO "anon";

GRANT DELETE ON TABLE "public"."orders" TO "anon";

GRANT INSERT ON TABLE "public"."orders" TO "authenticated";

GRANT SELECT ON TABLE "public"."orders" TO "authenticated";

GRANT UPDATE ON TABLE "public"."orders" TO "authenticated";

GRANT DELETE ON TABLE "public"."orders" TO "authenticated";

GRANT INSERT ON TABLE "public"."orders" TO "service_role";

GRANT SELECT ON TABLE "public"."orders" TO "service_role";

GRANT UPDATE ON TABLE "public"."orders" TO "service_role";

GRANT DELETE ON TABLE "public"."orders" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."orders" TO "service_role";

GRANT REFERENCES ON TABLE "public"."orders" TO "service_role";

GRANT TRIGGER ON TABLE "public"."orders" TO "service_role";

REVOKE ALL ON TABLE "public"."payment_qr_config" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."payment_qr_config" TO "anon";

GRANT SELECT ON TABLE "public"."payment_qr_config" TO "anon";

GRANT UPDATE ON TABLE "public"."payment_qr_config" TO "anon";

GRANT DELETE ON TABLE "public"."payment_qr_config" TO "anon";

GRANT INSERT ON TABLE "public"."payment_qr_config" TO "authenticated";

GRANT SELECT ON TABLE "public"."payment_qr_config" TO "authenticated";

GRANT UPDATE ON TABLE "public"."payment_qr_config" TO "authenticated";

GRANT DELETE ON TABLE "public"."payment_qr_config" TO "authenticated";

GRANT INSERT ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT SELECT ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT UPDATE ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT DELETE ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT REFERENCES ON TABLE "public"."payment_qr_config" TO "service_role";

GRANT TRIGGER ON TABLE "public"."payment_qr_config" TO "service_role";

REVOKE ALL ON TABLE "public"."payments" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."payments" TO "anon";

GRANT SELECT ON TABLE "public"."payments" TO "anon";

GRANT UPDATE ON TABLE "public"."payments" TO "anon";

GRANT DELETE ON TABLE "public"."payments" TO "anon";

GRANT INSERT ON TABLE "public"."payments" TO "authenticated";

GRANT SELECT ON TABLE "public"."payments" TO "authenticated";

GRANT UPDATE ON TABLE "public"."payments" TO "authenticated";

GRANT DELETE ON TABLE "public"."payments" TO "authenticated";

GRANT INSERT ON TABLE "public"."payments" TO "service_role";

GRANT SELECT ON TABLE "public"."payments" TO "service_role";

GRANT UPDATE ON TABLE "public"."payments" TO "service_role";

GRANT DELETE ON TABLE "public"."payments" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."payments" TO "service_role";

GRANT REFERENCES ON TABLE "public"."payments" TO "service_role";

GRANT TRIGGER ON TABLE "public"."payments" TO "service_role";

REVOKE ALL ON TABLE "public"."product_components" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."product_components" TO "anon";

GRANT SELECT ON TABLE "public"."product_components" TO "anon";

GRANT UPDATE ON TABLE "public"."product_components" TO "anon";

GRANT DELETE ON TABLE "public"."product_components" TO "anon";

GRANT INSERT ON TABLE "public"."product_components" TO "authenticated";

GRANT SELECT ON TABLE "public"."product_components" TO "authenticated";

GRANT UPDATE ON TABLE "public"."product_components" TO "authenticated";

GRANT DELETE ON TABLE "public"."product_components" TO "authenticated";

GRANT INSERT ON TABLE "public"."product_components" TO "service_role";

GRANT SELECT ON TABLE "public"."product_components" TO "service_role";

GRANT UPDATE ON TABLE "public"."product_components" TO "service_role";

GRANT DELETE ON TABLE "public"."product_components" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."product_components" TO "service_role";

GRANT REFERENCES ON TABLE "public"."product_components" TO "service_role";

GRANT TRIGGER ON TABLE "public"."product_components" TO "service_role";

REVOKE ALL ON TABLE "public"."product_images" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."product_images" TO "anon";

GRANT SELECT ON TABLE "public"."product_images" TO "anon";

GRANT UPDATE ON TABLE "public"."product_images" TO "anon";

GRANT DELETE ON TABLE "public"."product_images" TO "anon";

GRANT INSERT ON TABLE "public"."product_images" TO "authenticated";

GRANT SELECT ON TABLE "public"."product_images" TO "authenticated";

GRANT UPDATE ON TABLE "public"."product_images" TO "authenticated";

GRANT DELETE ON TABLE "public"."product_images" TO "authenticated";

GRANT INSERT ON TABLE "public"."product_images" TO "service_role";

GRANT SELECT ON TABLE "public"."product_images" TO "service_role";

GRANT UPDATE ON TABLE "public"."product_images" TO "service_role";

GRANT DELETE ON TABLE "public"."product_images" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."product_images" TO "service_role";

GRANT REFERENCES ON TABLE "public"."product_images" TO "service_role";

GRANT TRIGGER ON TABLE "public"."product_images" TO "service_role";

REVOKE ALL ON TABLE "public"."product_inventory_requirements" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."product_inventory_requirements" TO "anon";

GRANT SELECT ON TABLE "public"."product_inventory_requirements" TO "anon";

GRANT UPDATE ON TABLE "public"."product_inventory_requirements" TO "anon";

GRANT DELETE ON TABLE "public"."product_inventory_requirements" TO "anon";

GRANT INSERT ON TABLE "public"."product_inventory_requirements" TO "authenticated";

GRANT SELECT ON TABLE "public"."product_inventory_requirements" TO "authenticated";

GRANT UPDATE ON TABLE "public"."product_inventory_requirements" TO "authenticated";

GRANT DELETE ON TABLE "public"."product_inventory_requirements" TO "authenticated";

GRANT INSERT ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT SELECT ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT UPDATE ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT DELETE ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT REFERENCES ON TABLE "public"."product_inventory_requirements" TO "service_role";

GRANT TRIGGER ON TABLE "public"."product_inventory_requirements" TO "service_role";

REVOKE ALL ON TABLE "public"."products" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."products" TO "anon";

GRANT SELECT ON TABLE "public"."products" TO "anon";

GRANT UPDATE ON TABLE "public"."products" TO "anon";

GRANT DELETE ON TABLE "public"."products" TO "anon";

GRANT INSERT ON TABLE "public"."products" TO "authenticated";

GRANT SELECT ON TABLE "public"."products" TO "authenticated";

GRANT UPDATE ON TABLE "public"."products" TO "authenticated";

GRANT DELETE ON TABLE "public"."products" TO "authenticated";

GRANT INSERT ON TABLE "public"."products" TO "service_role";

GRANT SELECT ON TABLE "public"."products" TO "service_role";

GRANT UPDATE ON TABLE "public"."products" TO "service_role";

GRANT DELETE ON TABLE "public"."products" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."products" TO "service_role";

GRANT REFERENCES ON TABLE "public"."products" TO "service_role";

GRANT TRIGGER ON TABLE "public"."products" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."profiles" TO "anon";

GRANT SELECT ON TABLE "public"."profiles" TO "anon";

GRANT UPDATE ON TABLE "public"."profiles" TO "anon";

GRANT DELETE ON TABLE "public"."profiles" TO "anon";

GRANT INSERT ON TABLE "public"."profiles" TO "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";

GRANT UPDATE ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE ON TABLE "public"."profiles" TO "authenticated";

GRANT INSERT ON TABLE "public"."profiles" TO "service_role";

GRANT SELECT ON TABLE "public"."profiles" TO "service_role";

GRANT UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE ON TABLE "public"."profiles" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."profiles" TO "service_role";

GRANT REFERENCES ON TABLE "public"."profiles" TO "service_role";

GRANT TRIGGER ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."promotion_products" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."promotion_products" TO "anon";

GRANT SELECT ON TABLE "public"."promotion_products" TO "anon";

GRANT UPDATE ON TABLE "public"."promotion_products" TO "anon";

GRANT DELETE ON TABLE "public"."promotion_products" TO "anon";

GRANT INSERT ON TABLE "public"."promotion_products" TO "authenticated";

GRANT SELECT ON TABLE "public"."promotion_products" TO "authenticated";

GRANT UPDATE ON TABLE "public"."promotion_products" TO "authenticated";

GRANT DELETE ON TABLE "public"."promotion_products" TO "authenticated";

GRANT INSERT ON TABLE "public"."promotion_products" TO "service_role";

GRANT SELECT ON TABLE "public"."promotion_products" TO "service_role";

GRANT UPDATE ON TABLE "public"."promotion_products" TO "service_role";

GRANT DELETE ON TABLE "public"."promotion_products" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."promotion_products" TO "service_role";

GRANT REFERENCES ON TABLE "public"."promotion_products" TO "service_role";

GRANT TRIGGER ON TABLE "public"."promotion_products" TO "service_role";

REVOKE ALL ON TABLE "public"."promotions" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."promotions" TO "anon";

GRANT SELECT ON TABLE "public"."promotions" TO "anon";

GRANT UPDATE ON TABLE "public"."promotions" TO "anon";

GRANT DELETE ON TABLE "public"."promotions" TO "anon";

GRANT INSERT ON TABLE "public"."promotions" TO "authenticated";

GRANT SELECT ON TABLE "public"."promotions" TO "authenticated";

GRANT UPDATE ON TABLE "public"."promotions" TO "authenticated";

GRANT DELETE ON TABLE "public"."promotions" TO "authenticated";

GRANT INSERT ON TABLE "public"."promotions" TO "service_role";

GRANT SELECT ON TABLE "public"."promotions" TO "service_role";

GRANT UPDATE ON TABLE "public"."promotions" TO "service_role";

GRANT DELETE ON TABLE "public"."promotions" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."promotions" TO "service_role";

GRANT REFERENCES ON TABLE "public"."promotions" TO "service_role";

GRANT TRIGGER ON TABLE "public"."promotions" TO "service_role";

REVOKE ALL ON TABLE "public"."rate_limit_attempts" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."rate_limit_attempts" TO "anon";

GRANT SELECT ON TABLE "public"."rate_limit_attempts" TO "anon";

GRANT UPDATE ON TABLE "public"."rate_limit_attempts" TO "anon";

GRANT DELETE ON TABLE "public"."rate_limit_attempts" TO "anon";

GRANT INSERT ON TABLE "public"."rate_limit_attempts" TO "authenticated";

GRANT SELECT ON TABLE "public"."rate_limit_attempts" TO "authenticated";

GRANT UPDATE ON TABLE "public"."rate_limit_attempts" TO "authenticated";

GRANT DELETE ON TABLE "public"."rate_limit_attempts" TO "authenticated";

GRANT INSERT ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT SELECT ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT UPDATE ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT DELETE ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT REFERENCES ON TABLE "public"."rate_limit_attempts" TO "service_role";

GRANT TRIGGER ON TABLE "public"."rate_limit_attempts" TO "service_role";

REVOKE ALL ON TABLE "public"."sale_returns" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."sale_returns" TO "anon";

GRANT SELECT ON TABLE "public"."sale_returns" TO "anon";

GRANT UPDATE ON TABLE "public"."sale_returns" TO "anon";

GRANT DELETE ON TABLE "public"."sale_returns" TO "anon";

GRANT INSERT ON TABLE "public"."sale_returns" TO "authenticated";

GRANT SELECT ON TABLE "public"."sale_returns" TO "authenticated";

GRANT UPDATE ON TABLE "public"."sale_returns" TO "authenticated";

GRANT DELETE ON TABLE "public"."sale_returns" TO "authenticated";

GRANT INSERT ON TABLE "public"."sale_returns" TO "service_role";

GRANT SELECT ON TABLE "public"."sale_returns" TO "service_role";

GRANT UPDATE ON TABLE "public"."sale_returns" TO "service_role";

GRANT DELETE ON TABLE "public"."sale_returns" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."sale_returns" TO "service_role";

GRANT REFERENCES ON TABLE "public"."sale_returns" TO "service_role";

GRANT TRIGGER ON TABLE "public"."sale_returns" TO "service_role";

REVOKE ALL ON TABLE "public"."seasons" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."seasons" TO "anon";

GRANT SELECT ON TABLE "public"."seasons" TO "anon";

GRANT UPDATE ON TABLE "public"."seasons" TO "anon";

GRANT DELETE ON TABLE "public"."seasons" TO "anon";

GRANT INSERT ON TABLE "public"."seasons" TO "authenticated";

GRANT SELECT ON TABLE "public"."seasons" TO "authenticated";

GRANT UPDATE ON TABLE "public"."seasons" TO "authenticated";

GRANT DELETE ON TABLE "public"."seasons" TO "authenticated";

GRANT INSERT ON TABLE "public"."seasons" TO "service_role";

GRANT SELECT ON TABLE "public"."seasons" TO "service_role";

GRANT UPDATE ON TABLE "public"."seasons" TO "service_role";

GRANT DELETE ON TABLE "public"."seasons" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."seasons" TO "service_role";

GRANT REFERENCES ON TABLE "public"."seasons" TO "service_role";

GRANT TRIGGER ON TABLE "public"."seasons" TO "service_role";

REVOKE ALL ON TABLE "public"."system_settings" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."system_settings" TO "anon";

GRANT SELECT ON TABLE "public"."system_settings" TO "anon";

GRANT UPDATE ON TABLE "public"."system_settings" TO "anon";

GRANT DELETE ON TABLE "public"."system_settings" TO "anon";

GRANT INSERT ON TABLE "public"."system_settings" TO "authenticated";

GRANT SELECT ON TABLE "public"."system_settings" TO "authenticated";

GRANT UPDATE ON TABLE "public"."system_settings" TO "authenticated";

GRANT DELETE ON TABLE "public"."system_settings" TO "authenticated";

GRANT INSERT ON TABLE "public"."system_settings" TO "service_role";

GRANT SELECT ON TABLE "public"."system_settings" TO "service_role";

GRANT UPDATE ON TABLE "public"."system_settings" TO "service_role";

GRANT DELETE ON TABLE "public"."system_settings" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."system_settings" TO "service_role";

GRANT REFERENCES ON TABLE "public"."system_settings" TO "service_role";

GRANT TRIGGER ON TABLE "public"."system_settings" TO "service_role";

REVOKE ALL ON TABLE "public"."whatsapp_config" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."whatsapp_config" TO "anon";

GRANT SELECT ON TABLE "public"."whatsapp_config" TO "anon";

GRANT UPDATE ON TABLE "public"."whatsapp_config" TO "anon";

GRANT DELETE ON TABLE "public"."whatsapp_config" TO "anon";

GRANT INSERT ON TABLE "public"."whatsapp_config" TO "authenticated";

GRANT SELECT ON TABLE "public"."whatsapp_config" TO "authenticated";

GRANT UPDATE ON TABLE "public"."whatsapp_config" TO "authenticated";

GRANT DELETE ON TABLE "public"."whatsapp_config" TO "authenticated";

GRANT INSERT ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT SELECT ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT UPDATE ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT DELETE ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT REFERENCES ON TABLE "public"."whatsapp_config" TO "service_role";

GRANT TRIGGER ON TABLE "public"."whatsapp_config" TO "service_role";

REVOKE ALL ON TABLE "public"."audit_trail" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE "public"."audit_trail" TO "service_role";

GRANT SELECT ON TABLE "public"."audit_trail" TO "service_role";

GRANT UPDATE ON TABLE "public"."audit_trail" TO "service_role";

GRANT DELETE ON TABLE "public"."audit_trail" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."audit_trail" TO "service_role";

GRANT REFERENCES ON TABLE "public"."audit_trail" TO "service_role";

GRANT TRIGGER ON TABLE "public"."audit_trail" TO "service_role";

-- Propuesta: no conceder TRUNCATE/TRIGGER/REFERENCES a clientes; TRUNCATE no queda protegido por RLS. service_role conserva privilegios auditados.

REVOKE ALL ON SEQUENCE "public"."order_number_seq" FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE "public"."order_number_seq" TO service_role;

REVOKE ALL ON SEQUENCE "public"."rate_limit_attempts_id_seq" FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE "public"."rate_limit_attempts_id_seq" TO service_role;

-- ACL RPC PROPUESTA: revocar PUBLIC evita EXECUTE heredado. Los helpers internos siguen funcionando bajo el propietario de los RPC SECURITY DEFINER.

ALTER FUNCTION public."notify_order_ready"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."notify_order_ready"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_order_ready"() TO service_role;

ALTER FUNCTION public."is_active_user"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."is_active_user"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_active_user"() TO anon, authenticated, service_role;

ALTER FUNCTION public."is_admin"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."is_admin"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_admin"() TO anon, authenticated, service_role;

ALTER FUNCTION public."is_employee_or_admin"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."is_employee_or_admin"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."is_employee_or_admin"() TO anon, authenticated, service_role;

ALTER FUNCTION public."handle_new_user"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."handle_new_user"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO service_role;

ALTER FUNCTION public."handle_inventory_entry"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."handle_inventory_entry"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_entry"() TO service_role;

ALTER FUNCTION public."handle_inventory_waste"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."handle_inventory_waste"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_waste"() TO service_role;

ALTER FUNCTION public."handle_inventory_adjustment"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."handle_inventory_adjustment"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."handle_inventory_adjustment"() TO service_role;

ALTER FUNCTION public."consume_product_inventory"(uuid, numeric, text, uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."consume_product_inventory"(uuid, numeric, text, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."consume_product_inventory"(uuid, numeric, text, uuid, uuid) TO service_role;

ALTER FUNCTION public."release_expired_reservations"(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."release_expired_reservations"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."release_expired_reservations"(uuid) TO service_role;

ALTER FUNCTION public."advance_order_status"(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."advance_order_status"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."advance_order_status"(uuid, text) TO authenticated, service_role;

ALTER FUNCTION public."close_cash_session"(uuid, numeric, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."close_cash_session"(uuid, numeric, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."close_cash_session"(uuid, numeric, text) TO authenticated, service_role;

ALTER FUNCTION public."reject_payment"(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."reject_payment"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."reject_payment"(uuid, text) TO authenticated, service_role;

ALTER FUNCTION public."cancel_order"(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."cancel_order"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."cancel_order"(uuid, text) TO authenticated, service_role;

ALTER FUNCTION public."create_sale_return"(uuid, text, numeric, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."create_sale_return"(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_sale_return"(uuid, text, numeric, text) TO authenticated, service_role;

ALTER FUNCTION public."record_cash_movement"(uuid, text, numeric, text, text, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."record_cash_movement"(uuid, text, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."record_cash_movement"(uuid, text, numeric, text, text, uuid) TO authenticated, service_role;

ALTER FUNCTION public."request_order_deletion"(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."request_order_deletion"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."request_order_deletion"(uuid, text) TO authenticated, service_role;

ALTER FUNCTION public."review_order_deletion_request"(uuid, boolean, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."review_order_deletion_request"(uuid, boolean, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."review_order_deletion_request"(uuid, boolean, text) TO authenticated, service_role;

ALTER FUNCTION public."can_delete_cancelled_order"(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."can_delete_cancelled_order"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."can_delete_cancelled_order"(uuid) TO authenticated, service_role;

ALTER FUNCTION public."open_cash_session"(uuid, numeric) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."open_cash_session"(uuid, numeric) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."open_cash_session"(uuid, numeric) TO authenticated, service_role;

ALTER FUNCTION public."get_business_status"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."get_business_status"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."get_business_status"() TO anon, authenticated, service_role;

ALTER FUNCTION public."notify_stock_alert"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."notify_stock_alert"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_stock_alert"() TO service_role;

ALTER FUNCTION public."create_order"(text, text, text, jsonb, text, text, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."create_order"(text, text, text, jsonb, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_order"(text, text, text, jsonb, text, text, uuid) TO anon, authenticated, service_role;

ALTER FUNCTION public."apply_order_discount"(uuid, numeric, uuid, uuid, numeric, text, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."apply_order_discount"(uuid, numeric, uuid, uuid, numeric, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."apply_order_discount"(uuid, numeric, uuid, uuid, numeric, text, uuid) TO service_role;

ALTER FUNCTION public."notify_pending_payment"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."notify_pending_payment"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_pending_payment"() TO service_role;

ALTER FUNCTION public."confirm_payment"(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."confirm_payment"(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."confirm_payment"(uuid) TO authenticated, service_role;

ALTER FUNCTION public."notify_new_order"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."notify_new_order"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."notify_new_order"() TO service_role;

ALTER FUNCTION public."check_rate_limit"(text, text, integer, integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."check_rate_limit"(text, text, integer, integer) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."check_rate_limit"(text, text, integer, integer) TO anon, authenticated, service_role;

ALTER FUNCTION public."audit_products_change"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."audit_products_change"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."audit_products_change"() TO service_role;

ALTER FUNCTION public."get_audit_trail"(integer, integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."get_audit_trail"(integer, integer) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."get_audit_trail"(integer, integer) TO authenticated, service_role;

ALTER FUNCTION public."track_order"(bigint, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."track_order"(bigint, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."track_order"(bigint, text) TO anon, authenticated, service_role;

ALTER FUNCTION public."create_physical_sale"(jsonb, uuid, uuid, numeric, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."create_physical_sale"(jsonb, uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_physical_sale"(jsonb, uuid, uuid, numeric, text, text) TO authenticated, service_role;

ALTER FUNCTION public."create_payment"(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."create_payment"(uuid, text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_payment"(uuid, text) TO service_role;

ALTER FUNCTION public."validate_inventory_movement_actor"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."validate_inventory_movement_actor"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."validate_inventory_movement_actor"() TO service_role;

ALTER FUNCTION public."protect_order_request_contract"() OWNER TO postgres;
REVOKE ALL ON FUNCTION public."protect_order_request_contract"() FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."protect_order_request_contract"() TO service_role;

ALTER FUNCTION public."consume_order_reservations"(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public."consume_order_reservations"(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."consume_order_reservations"(uuid, uuid) TO service_role;

-- Verificación defensiva de exclusiones, sin cambios de historial.
DO $verify$
BEGIN
  IF to_regclass('public.promotion_customers') IS NOT NULL
     OR to_regprocedure('public.create_order(text,text,text,jsonb,text,text)') IS NOT NULL
     OR to_regprocedure('public.track_order_details(text,bigint,uuid)') IS NOT NULL
     OR to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Objeto expresamente excluido de la baseline.';
  END IF;
END;
$verify$;
COMMIT;
