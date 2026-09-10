-- ============================================================
-- FLORERÍA — MASTER DATABASE
-- PostgreSQL / Supabase
-- ============================================================
-- PROPÓSITO
-- Este archivo es el DISEÑO MAESTRO de la base de datos completa.
-- NO se debe ejecutar completo durante FASE 1.
--
-- Regla del proyecto:
-- Cada fase implementa solamente las tablas, columnas, funciones,
-- políticas y relaciones que le corresponden.
--
-- Roles oficiales:
--   administrador
--   empleado
--
-- Regla especial de pedidos:
--   * Un pedido cancelado puede ser eliminado por un ADMINISTRADOR.
--   * Un EMPLEADO NO puede eliminarlo directamente; solamente crea
--     una solicitud de eliminación.
--   * La eliminación debe ser lógica (soft delete) para conservar
--     trazabilidad y auditoría. "Eliminar" en la aplicación significa
--     que deja de aparecer como pedido activo, pero el registro histórico
--     no se destruye físicamente.
--
-- Fuente funcional: documento maestro del proyecto FLORERÍA.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. FASE 1 — AUTENTICACIÓN, USUARIOS Y PERMISOS
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'empleado'
    check (role in ('administrador', 'empleado')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- 2. FASE 2 — CATÁLOGO
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_unique unique (name)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_name_unique unique (name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  occasion text,
  season_id uuid references public.seasons(id) on delete set null,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  is_sold_out boolean not null default false,
  catalog_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text text,
  sort_order integer not null default 0,
  mime_type text,
  width integer,
  height integer,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Producto compuesto / combo.
create table if not exists public.product_components (
  id uuid primary key default gen_random_uuid(),
  parent_product_id uuid not null references public.products(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint product_components_unique
    unique (parent_product_id, component_product_id),
  constraint product_components_not_self
    check (parent_product_id <> component_product_id)
);

-- ============================================================
-- 3. FASE 3 — INVENTARIO
-- ============================================================

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  item_type text not null
    check (item_type in ('flor', 'insumo', 'componente', 'producto')),
  unit text not null default 'unidad',
  current_stock numeric(12,3) not null default 0
    check (current_stock >= 0),
  minimum_stock numeric(12,3) not null default 0
    check (minimum_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_sku_unique unique (sku)
);

create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2) check (unit_cost >= 0),
  supplier_name text,
  notes text,
  received_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- El lote nace automáticamente desde una entrada.
create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  inventory_entry_id uuid not null references public.inventory_entries(id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  initial_quantity numeric(12,3) not null check (initial_quantity > 0),
  remaining_quantity numeric(12,3) not null check (remaining_quantity >= 0),
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint inventory_lots_quantity_valid
    check (remaining_quantity <= initial_quantity)
);

-- Movimientos son el historial real del stock.
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete restrict,
  movement_type text not null
    check (movement_type in (
      'entrada',
      'salida',
      'merma',
      'ajuste',
      'devolucion',
      'reversion'
    )),
  quantity numeric(12,3) not null check (quantity > 0),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_waste (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  lot_id uuid references public.inventory_lots(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_delta numeric(12,3) not null check (quantity_delta <> 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. FASE 4 — ARREGLOS Y CONSUMO
-- ============================================================

create table if not exists public.product_inventory_requirements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint product_inventory_requirements_unique
    unique (product_id, inventory_item_id)
);

create table if not exists public.customization_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_type text not null
    check (option_type in (
      'cantidad_rosas',
      'color',
      'tipo_flor',
      'oso',
      'decoracion',
      'otro'
    )),
  name text not null,
  value text,
  extra_price numeric(12,2) not null default 0
    check (extra_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. FASE 5 — PEDIDOS ONLINE
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
      'pendiente_pago',
      'confirmado',
      'en_preparacion',
      'listo',
      'finalizado',
      'cancelado',
      'rechazado'
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
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_number_unique unique (order_number),
  constraint orders_idempotency_unique unique (idempotency_key),
  constraint orders_cancel_reason_required
    check (
      status <> 'cancelado'
      or cancellation_reason is not null
    )
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

-- Reserva de inventario para pedidos pendientes/confirmados.
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released', 'cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

-- ============================================================
-- 6. FASE 6 — PAGOS QR
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
  method text not null
    check (method in ('qr', 'efectivo', 'otro')),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'rechazado', 'reembolsado')),
  reference text,
  confirmed_by uuid references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_confirmation_data_valid
    check (
      (status = 'confirmado' and confirmed_by is not null and confirmed_at is not null)
      or status <> 'confirmado'
    )
);

-- ============================================================
-- 7. FASE 7 — WHATSAPP
-- ============================================================

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  message_type text not null
    check (message_type in (
      'pedido_creado',
      'pago_pendiente',
      'pedido_confirmado',
      'pedido_en_preparacion',
      'pedido_listo',
      'pedido_finalizado',
      'otro'
    )),
  phone text,
  message_body text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'enviado', 'fallido')),
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. FASE 8 — VENTAS FÍSICAS
-- ============================================================
-- Se reutiliza orders con order_type = 'fisica'.
-- Esto evita duplicar la lógica de productos, descuentos,
-- inventario, pagos y caja.

-- ============================================================
-- 9. FASE 9 — CANCELACIONES, DEVOLUCIONES Y ELIMINACIÓN
-- ============================================================

create table if not exists public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  type text not null
    check (type in ('devolucion', 'reintegro')),
  amount numeric(12,2) not null check (amount >= 0),
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Solicitud obligatoria para empleado que quiera eliminar
-- un pedido ya cancelado.
create table if not exists public.order_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobada', 'rechazada')),
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  constraint deletion_request_review_data_valid
    check (
      (status = 'pendiente' and reviewed_by is null and reviewed_at is null)
      or
      (status <> 'pendiente' and reviewed_by is not null and reviewed_at is not null)
    )
);

-- ============================================================
-- 10. FASE 10 — CAJA
-- ============================================================

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Caja principal',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete restrict,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  closed_by uuid references public.profiles(id) on delete restrict,
  closed_at timestamptz,
  expected_amount numeric(12,2),
  counted_amount numeric(12,2),
  difference_amount numeric(12,2),
  status text not null default 'abierta'
    check (status in ('abierta', 'cerrada')),
  closing_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete restrict,
  movement_type text not null
    check (movement_type in ('venta', 'ingreso', 'gasto', 'ajuste', 'devolucion')),
  payment_method text
    check (payment_method in ('qr', 'efectivo', 'otro')),
  amount numeric(12,2) not null check (amount > 0),
  order_id uuid references public.orders(id) on delete restrict,
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 11. FASE 11 — CLIENTES Y PROMOCIONES
-- ============================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  promotion_type text not null
    check (promotion_type in (
      'cumpleanos',
      'recurrente',
      'temporada',
      'combo',
      'descuento'
    )),
  discount_type text not null
    check (discount_type in ('porcentaje', 'monto_fijo')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  minimum_purchase numeric(12,2) check (minimum_purchase >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

create table if not exists public.promotion_customers (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  primary key (promotion_id, customer_id)
);

create table if not exists public.order_discounts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  promotion_id uuid references public.promotions(id) on delete set null,
  discount_type text not null
    check (discount_type in ('porcentaje', 'monto_fijo', 'manual')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  amount_applied numeric(12,2) not null check (amount_applied >= 0),
  reason text,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 12. FASE 13 — NOTIFICACIONES Y HORARIOS
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  notification_type text not null
    check (notification_type in (
      'nuevo_pedido',
      'pago_pendiente',
      'stock_bajo',
      'stock_agotado',
      'pedido_listo',
      'cumpleanos',
      'alerta'
    )),
  title text not null,
  message text not null,
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null
    check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  accepts_orders_outside_hours boolean not null default true,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint business_hours_weekday_unique unique (weekday)
);

-- ============================================================
-- 13. FASE 14 — CONFIGURACIÓN CRÍTICA Y AUDITORÍA
-- ============================================================

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  is_critical boolean not null default false,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- IMPORTANTE:
-- No se debe permitir UPDATE ni DELETE normal sobre audit_logs.
-- La aplicación debe trabajar con INSERT únicamente.
-- El administrador tampoco debe "borrar" auditoría; la trazabilidad
-- es permanente.

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_products_category
  on public.products(category_id);

create index if not exists idx_products_season
  on public.products(season_id);

create index if not exists idx_product_images_product
  on public.product_images(product_id, sort_order);

create index if not exists idx_inventory_items_type
  on public.inventory_items(item_type);

create index if not exists idx_inventory_lots_fifo
  on public.inventory_lots(inventory_item_id, received_at, created_at);

create index if not exists idx_inventory_movements_item
  on public.inventory_movements(inventory_item_id, created_at);

create index if not exists idx_inventory_reservations_order
  on public.inventory_reservations(order_id, status);

create index if not exists idx_orders_customer
  on public.orders(customer_id, created_at desc);

create index if not exists idx_orders_status
  on public.orders(status, created_at desc);

create index if not exists idx_orders_type
  on public.orders(order_type, created_at desc);

create index if not exists idx_orders_deleted
  on public.orders(deleted_at);

create index if not exists idx_order_items_order
  on public.order_items(order_id);

create index if not exists idx_payments_order
  on public.payments(order_id, created_at desc);

create index if not exists idx_cash_movements_session
  on public.cash_movements(cash_session_id, created_at);

create index if not exists idx_notifications_user
  on public.notifications(user_id, is_read, created_at desc);

create index if not exists idx_audit_logs_record
  on public.audit_logs(table_name, record_id, created_at desc);

create index if not exists idx_audit_logs_user
  on public.audit_logs(user_id, created_at desc);

create index if not exists idx_order_deletion_requests_order
  on public.order_deletion_requests(order_id, status);

-- ============================================================
-- FUNCIONES BASE DE SEGURIDAD
-- ============================================================

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'administrador'
  );
$$;

create or replace function public.is_employee_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('administrador', 'empleado')
  );
$$;

-- ============================================================
-- TRIGGER DE PERFIL SUPABASE AUTH
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- REGLA DE ELIMINACIÓN DE PEDIDOS
-- ============================================================
-- La lógica de autorización definitiva se implementará mediante
-- funciones RPC/operaciones de servidor en la fase correspondiente.
--
-- REGLA:
-- 1. order.status debe ser 'cancelado'.
-- 2. ADMINISTRADOR: puede marcar deleted_at/deleted_by.
-- 3. EMPLEADO: no puede modificar deleted_at/deleted_by.
-- 4. EMPLEADO: puede INSERTAR order_deletion_requests.
-- 5. ADMINISTRADOR: puede aprobar/rechazar solicitudes.
-- 6. Una solicitud no convierte automáticamente el pedido en eliminado.
-- 7. El pedido cancelado conserva su auditoría y trazabilidad.

create or replace function public.can_delete_cancelled_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    and exists (
      select 1
      from public.orders
      where id = p_order_id
        and status = 'cancelado'
        and deleted_at is null
    );
$$;

-- ============================================================
-- REGLAS DE NEGOCIO QUE DEBEN IMPLEMENTARSE EN RPC/SERVIDOR
-- ============================================================
--
-- INVENTARIO:
-- * No stock negativo.
-- * FIFO: consumir primero el lote más antiguo disponible.
-- * Entradas generan lote automáticamente.
-- * Merma exige motivo y usuario.
-- * Ajuste exige motivo y usuario.
-- * Movimientos quedan registrados.
--
-- PEDIDOS:
-- * order_number único.
-- * idempotency_key único cuando exista.
-- * Nunca confiar en el precio enviado por el navegador.
-- * Precio real se obtiene desde PostgreSQL.
-- * Verificar disponibilidad de producto.
-- * Verificar stock de forma atómica.
-- * Evitar doble creación por doble clic.
-- * Reserva/consumo/liberación de stock debe ser atómico.
--
-- PAGOS:
-- * El cliente nunca confirma su propio pago.
-- * Confirmación manual por usuario autorizado.
-- * No permitir doble confirmación.
--
-- VENTAS:
-- * Venta física usa order_type = 'fisica'.
-- * Pago es independiente del tipo de venta.
-- * Inventario y caja se actualizan dentro de una operación segura.
--
-- CANCELACIONES:
-- * Motivo obligatorio.
-- * La operación revierte inventario cuando corresponda.
-- * La cancelación queda auditada.
--
-- CAJA:
-- * Una caja cerrada no se modifica normalmente.
-- * Correcciones generan auditoría.
--
-- AUDITORÍA:
-- * Usuario.
-- * Fecha/hora.
-- * Acción.
-- * Registro.
-- * Antes.
-- * Después.
-- * Motivo.
-- * No borrar ni modificar auditoría desde la aplicación.
--
-- SEGURIDAD:
-- * RLS en todas las tablas con datos de negocio.
-- * Operaciones sensibles mediante servidor/RPC.
-- * Administrador y empleado no tienen los mismos permisos.
-- * Usuarios inactivos no operan.
-- * Validación con Zod en frontend/backend.
-- * Rate limiting e idempotencia en endpoints sensibles.
--
-- ============================================================
-- FIN DEL MASTER DATABASE
-- ============================================================
