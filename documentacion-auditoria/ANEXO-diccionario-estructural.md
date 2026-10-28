# Anexo · diccionario estructural verificado y trazabilidad SQL

Lectura del catálogo local realizada por el agente principal mediante BEGIN READ ONLY, consultas a pg_catalog y ROLLBACK. Motor local PostgreSQL 17.11. Sin filas comerciales, secretos ni datos personales. Fuente: [catálogo estructural](ANEXO-catalogo-local-verificado.json). No describe producción.

Cobertura: **38 tablas public, 334 columnas, 231 restricciones, 63 FK, 83 índices, 69 funciones public, 90 políticas public/storage, 52 triggers public y 2 vistas**. FORCE RLS=false y ENABLE RLS=true en las 38 tablas. Tipos, nulabilidad, restricciones, ACL y nombres proceden del catálogo. Los defaults y enlaces a SQL proceden de la cadena versionada; no se consultaron como defaults desplegados.

## 1. Diccionario de las 38 tablas

### public.audit_logs

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| user_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| action | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| table_name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| record_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| before | jsonb | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| after | jsonb | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:37>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| audit_logs_pkey | PK | PRIMARY KEY (id) |
| audit_logs_user_id_fkey | FK | FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL |

### public.business_hours

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| day_of_week | smallint | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| opens_at | time without time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| closes_at | time without time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| is_closed | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| updated_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:49](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:49>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| business_hours_day_of_week_check | CHECK | CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) |
| business_hours_day_unique | UNIQUE | UNIQUE (day_of_week) |
| business_hours_hours_valid | CHECK | CHECK (((is_closed = true) OR ((opens_at IS NOT NULL) AND (closes_at IS NOT NULL) AND (opens_at < closes_at)))) |
| business_hours_open_interval | CHECK | CHECK ((is_closed OR ((opens_at IS NOT NULL) AND (closes_at IS NOT NULL) AND (opens_at < closes_at)))) |
| business_hours_pkey | PK | PRIMARY KEY (id) |
| business_hours_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |

### public.cash_movements

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| cash_session_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| movement_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| payment_method | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| amount | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| direction | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| order_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| created_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:59>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| cash_movements_amount_check | CHECK | CHECK ((amount > (0)::numeric)) |
| cash_movements_cash_session_id_fkey | FK | FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE RESTRICT |
| cash_movements_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_movements_direction_check | CHECK | CHECK ((direction = ANY (ARRAY['entrada'::text, 'salida'::text]))) |
| cash_movements_direction_only_for_ajuste | CHECK | CHECK ((((movement_type = 'ajuste'::text) AND (direction IS NOT NULL)) OR ((movement_type <> 'ajuste'::text) AND (direction IS NULL)))) |
| cash_movements_movement_type_check | CHECK | CHECK ((movement_type = ANY (ARRAY['venta'::text, 'ingreso'::text, 'gasto'::text, 'ajuste'::text, 'devolucion'::text]))) |
| cash_movements_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| cash_movements_payment_method_check | CHECK | CHECK ((payment_method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text]))) |
| cash_movements_pkey | PK | PRIMARY KEY (id) |
| finite_amount | CHECK | CHECK (((amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |

### public.cash_registers

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:72](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:72>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:72](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:72>) |
| name | text | No | 'Caja principal'::text | [supabase/migrations/20261007000100_baseline_initial.sql:72](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:72>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:72](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:72>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:72](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:72>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| cash_registers_pkey | PK | PRIMARY KEY (id) |

### public.cash_sessions

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| cash_register_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| opened_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| opened_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| opening_amount | numeric(12,2) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| closed_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| closed_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| expected_amount | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| counted_amount | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| difference_amount | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| status | text | No | 'abierta'::text | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| closing_note | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:79](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:79>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| cash_sessions_cash_register_id_fkey | FK | FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT |
| cash_sessions_closed_by_fkey | FK | FOREIGN KEY (closed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_sessions_opened_by_fkey | FK | FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_sessions_opening_amount_check | CHECK | CHECK ((opening_amount >= (0)::numeric)) |
| cash_sessions_pkey | PK | PRIMARY KEY (id) |
| cash_sessions_status_check | CHECK | CHECK ((status = ANY (ARRAY['abierta'::text, 'cerrada'::text]))) |
| finite_counted_amount | CHECK | CHECK (((counted_amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_difference_amount | CHECK | CHECK (((difference_amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_expected_amount | CHECK | CHECK (((expected_amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_opening_amount | CHECK | CHECK (((opening_amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |

### public.categories

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |
| description | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:95>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| categories_name_unique | UNIQUE | UNIQUE (name) |
| categories_pkey | PK | PRIMARY KEY (id) |

### public.customers

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| phone | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| whatsapp | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| email | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| birthday | date | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:104](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:104>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| customers_pkey | PK | PRIMARY KEY (id) |

### public.customization_option_inventory_requirements

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>) |
| customization_option_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:116](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:116>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| coir_unique | UNIQUE | UNIQUE (customization_option_id, inventory_item_id) |
| customization_option_inventory_req_customization_option_id_fkey | FK | FOREIGN KEY (customization_option_id) REFERENCES customization_options(id) ON DELETE CASCADE |
| customization_option_inventory_requireme_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| customization_option_inventory_requirements_pkey | PK | PRIMARY KEY (id) |
| customization_option_inventory_requirements_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |

### public.customization_options

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| option_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| value | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| extra_price | numeric(12,2) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:124](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:124>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| customization_options_extra_price_check | CHECK | CHECK ((extra_price >= (0)::numeric)) |
| customization_options_option_type_check | CHECK | CHECK ((option_type = ANY (ARRAY['cantidad_rosas'::text, 'color'::text, 'tipo_flor'::text, 'oso'::text, 'decoracion'::text, 'otro'::text]))) |
| customization_options_pkey | PK | PRIMARY KEY (id) |
| customization_options_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| finite_extra_price | CHECK | CHECK (((extra_price)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |

### public.inventory_adjustments

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |
| quantity_delta | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |
| reason | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |
| created_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:135](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:135>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity_delta | CHECK | CHECK (((quantity_delta)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_adjustments_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_adjustments_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_adjustments_pkey | PK | PRIMARY KEY (id) |
| inventory_adjustments_quantity_delta_check | CHECK | CHECK ((quantity_delta <> (0)::numeric)) |

### public.inventory_entries

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| unit_cost | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| supplier_name | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| notes | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| received_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| created_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:144](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:144>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_unit_cost | CHECK | CHECK (((unit_cost)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_entries_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_entries_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_entries_pkey | PK | PRIMARY KEY (id) |
| inventory_entries_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| inventory_entries_unit_cost_check | CHECK | CHECK ((unit_cost >= (0)::numeric)) |

### public.inventory_items

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| sku | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| item_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| unit | text | No | 'unidad'::text | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| current_stock | numeric(12,3) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| minimum_stock | numeric(12,3) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:156](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:156>) |
| is_dedication_card | boolean | No | false | [supabase/migrations/20261020000200_recipe_dedications.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:4>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| dedication_card_is_supply | CHECK | CHECK (((NOT is_dedication_card) OR (item_type = 'insumo'::text))) |
| finite_current_stock | CHECK | CHECK (((current_stock)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_minimum_stock | CHECK | CHECK (((minimum_stock)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_items_current_stock_check | CHECK | CHECK ((current_stock >= (0)::numeric)) |
| inventory_items_item_type_check | CHECK | CHECK ((item_type = ANY (ARRAY['flor'::text, 'insumo'::text, 'componente'::text, 'producto'::text]))) |
| inventory_items_minimum_stock_check | CHECK | CHECK ((minimum_stock >= (0)::numeric)) |
| inventory_items_pkey | PK | PRIMARY KEY (id) |
| inventory_items_sku_unique | UNIQUE | UNIQUE (sku) |

### public.inventory_lots

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| inventory_entry_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| initial_quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| remaining_quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| received_at | timestamp with time zone | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:169](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:169>) |
| inventory_adjustment_id | uuid | Sí | — | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:13>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_initial_quantity | CHECK | CHECK (((initial_quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_remaining_quantity | CHECK | CHECK (((remaining_quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_lots_initial_quantity_check | CHECK | CHECK ((initial_quantity > (0)::numeric)) |
| inventory_lots_inventory_adjustment_id_fkey | FK | FOREIGN KEY (inventory_adjustment_id) REFERENCES inventory_adjustments(id) ON DELETE RESTRICT |
| inventory_lots_inventory_entry_id_fkey | FK | FOREIGN KEY (inventory_entry_id) REFERENCES inventory_entries(id) ON DELETE RESTRICT |
| inventory_lots_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_lots_pkey | PK | PRIMARY KEY (id) |
| inventory_lots_quantity_valid | CHECK | CHECK ((remaining_quantity <= initial_quantity)) |
| inventory_lots_remaining_quantity_check | CHECK | CHECK ((remaining_quantity >= (0)::numeric)) |
| inventory_lots_source | CHECK | CHECK ((num_nonnulls(inventory_entry_id, inventory_adjustment_id) = 1)) |

### public.inventory_movements

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| lot_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| movement_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| reference_type | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| reference_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| created_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:179](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:179>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_movements_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_movements_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_movements_lot_id_fkey | FK | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT |
| inventory_movements_movement_type_check | CHECK | CHECK ((movement_type = ANY (ARRAY['entrada'::text, 'salida'::text, 'merma'::text, 'ajuste'::text, 'devolucion'::text, 'reversion'::text]))) |
| inventory_movements_pkey | PK | PRIMARY KEY (id) |
| inventory_movements_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |

### public.inventory_reservations

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| status | text | No | 'reserved'::text | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| expires_at | timestamp with time zone | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |
| released_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:192](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:192>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_reservations_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_reservations_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| inventory_reservations_pkey | PK | PRIMARY KEY (id) |
| inventory_reservations_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| inventory_reservations_status_check | CHECK | CHECK ((status = ANY (ARRAY['reserved'::text, 'consumed'::text, 'released'::text, 'cancelled'::text]))) |

### public.inventory_waste

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| lot_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| reason | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| created_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:203>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| inventory_waste_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_waste_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_waste_lot_id_fkey | FK | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT |
| inventory_waste_pkey | PK | PRIMARY KEY (id) |
| inventory_waste_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |

### public.notifications

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| message | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| reference_type | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| reference_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| is_read | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| read_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| read_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:213](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:213>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| notifications_pkey | PK | PRIMARY KEY (id) |
| notifications_read_by_fkey | FK | FOREIGN KEY (read_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| notifications_type_check | CHECK | CHECK ((type = ANY (ARRAY['nuevo_pedido'::text, 'pago_pendiente'::text, 'stock_bajo'::text, 'stock_agotado'::text, 'pedido_listo'::text, 'cumpleanos'::text, 'alerta'::text]))) |

### public.order_deletion_requests

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| requested_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| reason | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| status | text | No | 'pendiente'::text | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| reviewed_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| reviewed_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| review_reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:225](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:225>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| deletion_request_review_data_valid | CHECK | CHECK ((((status = 'pendiente'::text) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR ((status <> 'pendiente'::text) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)))) |
| order_deletion_requests_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| order_deletion_requests_pkey | PK | PRIMARY KEY (id) |
| order_deletion_requests_requested_by_fkey | FK | FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_deletion_requests_reviewed_by_fkey | FK | FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_deletion_requests_status_check | CHECK | CHECK ((status = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text]))) |

### public.order_discounts

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| promotion_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| discount_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| discount_value | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| amount_applied | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| created_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:237](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:237>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_amount_applied | CHECK | CHECK (((amount_applied)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_discount_value | CHECK | CHECK (((discount_value)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| order_discounts_amount_applied_check | CHECK | CHECK ((amount_applied >= (0)::numeric)) |
| order_discounts_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_discounts_discount_type_check | CHECK | CHECK ((discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text, 'manual'::text, 'combo'::text]))) |
| order_discounts_discount_value_check | CHECK | CHECK ((discount_value >= (0)::numeric)) |
| order_discounts_manual_reason_required | CHECK | CHECK (((discount_type <> 'manual'::text) OR ((reason IS NOT NULL) AND (TRIM(BOTH FROM reason) <> ''::text)))) |
| order_discounts_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| order_discounts_pkey | PK | PRIMARY KEY (id) |
| order_discounts_promotion_id_fkey | FK | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL |

### public.order_items

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| product_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| product_name_snapshot | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| unit_price_snapshot | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| line_total | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| personalization | jsonb | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| message | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| note | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:249](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:249>) |
| dedications | jsonb | No | '[]'::jsonb | [supabase/migrations/20261020000200_recipe_dedications.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:6>) |
| recipe_snapshot | jsonb | Sí | — | [supabase/migrations/20261024000200_order_management_details.sql:15](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:15>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| dedications_array | CHECK | CHECK (((jsonb_typeof(dedications) = 'array'::text) AND (jsonb_array_length(dedications) <= 198))) |
| finite_line_total | CHECK | CHECK (((line_total)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_unit_price_snapshot | CHECK | CHECK (((unit_price_snapshot)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| order_items_line_total_check | CHECK | CHECK ((line_total >= (0)::numeric)) |
| order_items_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| order_items_pkey | PK | PRIMARY KEY (id) |
| order_items_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL |
| order_items_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| order_items_unit_price_snapshot_check | CHECK | CHECK ((unit_price_snapshot >= (0)::numeric)) |

### public.orders

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| order_number | bigint | No | nextval('order_number_seq'::regclass) | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| customer_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| order_type | text | No | 'online'::text | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| status | text | No | 'pendiente_pago'::text | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| subtotal | numeric(12,2) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| discount_total | numeric(12,2) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| total | numeric(12,2) | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| customer_message | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| internal_note | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| idempotency_key | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| reserved_until | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| cancelled_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| cancelled_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| cancellation_reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| deleted_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:263](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:263>) |
| request_contract | jsonb | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:435](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:435>) |
| guest_name | text | Sí | — | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5>) |
| guest_phone | text | Sí | — | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5>) |
| guest_whatsapp | text | Sí | — | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5>) |
| receipt_token | uuid | No | gen_random_uuid() | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:5>) |
| inventory_review_required | boolean | No | false | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:65](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:65>) |
| scheduled_for | timestamp with time zone | Sí | — | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |
| schedule_status | text | No | 'pending' | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |
| schedule_client_confirmed | boolean | No | false | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |
| schedule_revision | integer | No | 0 | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |
| schedule_updated_by | uuid | Sí | — | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |
| schedule_updated_at | timestamp with time zone | Sí | — | [supabase/migrations/20261024000200_order_management_details.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:4>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_discount_total | CHECK | CHECK (((discount_total)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_subtotal | CHECK | CHECK (((subtotal)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_total | CHECK | CHECK (((total)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| order_schedule_consistent | CHECK | CHECK ((((scheduled_for IS NULL) AND (schedule_status = 'pending'::text) AND (NOT schedule_client_confirmed)) OR ((scheduled_for IS NOT NULL) AND (schedule_status = ANY (ARRAY['proposed'::text, 'confirmed'::text])) AND (schedule_client_confirmed = (schedule_status = 'confirmed'::text))))) |
| orders_cancel_reason_required | CHECK | CHECK (((status <> 'cancelado'::text) OR (cancellation_reason IS NOT NULL))) |
| orders_cancelled_by_fkey | FK | FOREIGN KEY (cancelled_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| orders_customer_id_fkey | FK | FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL |
| orders_discount_total_check | CHECK | CHECK ((discount_total >= (0)::numeric)) |
| orders_idempotency_unique | UNIQUE | UNIQUE (idempotency_key) |
| orders_number_unique | UNIQUE | UNIQUE (order_number) |
| orders_order_type_check | CHECK | CHECK ((order_type = ANY (ARRAY['online'::text, 'fisica'::text]))) |
| orders_pkey | PK | PRIMARY KEY (id) |
| orders_schedule_revision_check | CHECK | CHECK ((schedule_revision >= 0)) |
| orders_schedule_status_check | CHECK | CHECK ((schedule_status = ANY (ARRAY['pending'::text, 'proposed'::text, 'confirmed'::text]))) |
| orders_schedule_updated_by_fkey | FK | FOREIGN KEY (schedule_updated_by) REFERENCES profiles(id) |
| orders_status_check | CHECK | CHECK ((status = ANY (ARRAY['pendiente_pago'::text, 'confirmado'::text, 'en_preparacion'::text, 'listo'::text, 'finalizado'::text, 'cancelado'::text, 'rechazado'::text]))) |
| orders_subtotal_check | CHECK | CHECK ((subtotal >= (0)::numeric)) |
| orders_total_check | CHECK | CHECK ((total >= (0)::numeric)) |

### public.payment_qr_config

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| qr_storage_path | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| qr_public_url | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| account_label | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| updated_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:284](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:284>) |
| qr_slot | text | No | 'qr_1' | [supabase/migrations/20261012000100_two_payment_qr.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:4>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| payment_qr_config_pkey | PK | PRIMARY KEY (id) |
| payment_qr_config_qr_slot_check | CHECK | CHECK ((qr_slot = ANY (ARRAY['qr_1'::text, 'qr_2'::text]))) |
| payment_qr_config_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |

### public.payments

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| method | text | No | 'qr'::text | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| amount | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| status | text | No | 'pendiente'::text | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| reference | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| rejection_reason | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| confirmed_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| confirmed_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| rejected_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| rejected_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:295](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:295>) |
| qr_slot | text | Sí | — | [supabase/migrations/20261012000100_two_payment_qr.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:9>) |
| qr_label | text | Sí | — | [supabase/migrations/20261012000100_two_payment_qr.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:9>) |
| qr_config_id | uuid | Sí | — | [supabase/migrations/20261012000100_two_payment_qr.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:9>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_amount | CHECK | CHECK (((amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| payment_qr_snapshot_complete | CHECK | CHECK ((num_nonnulls(qr_slot, qr_label, qr_config_id) = ANY (ARRAY[0, 3]))) |
| payments_amount_check | CHECK | CHECK ((amount > (0)::numeric)) |
| payments_confirmation_data_valid | CHECK | CHECK ((((status = 'confirmado'::text) AND (confirmed_by IS NOT NULL) AND (confirmed_at IS NOT NULL)) OR (status <> 'confirmado'::text))) |
| payments_confirmed_by_fkey | FK | FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| payments_method_check | CHECK | CHECK ((method = ANY (ARRAY['qr'::text, 'efectivo'::text, 'otro'::text]))) |
| payments_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| payments_pkey | PK | PRIMARY KEY (id) |
| payments_qr_config_id_fkey | FK | FOREIGN KEY (qr_config_id) REFERENCES payment_qr_config(id) ON DELETE RESTRICT |
| payments_qr_label_check | CHECK | CHECK (((length(qr_label) >= 1) AND (length(qr_label) <= 200))) |
| payments_qr_slot_check | CHECK | CHECK ((qr_slot = ANY (ARRAY['qr_1'::text, 'qr_2'::text]))) |
| payments_rejected_by_fkey | FK | FOREIGN KEY (rejected_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| payments_rejection_data_valid | CHECK | CHECK ((((status = 'rechazado'::text) AND (rejection_reason IS NOT NULL) AND (rejected_by IS NOT NULL) AND (rejected_at IS NOT NULL)) OR (status <> 'rechazado'::text))) |
| payments_status_check | CHECK | CHECK ((status = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'rechazado'::text, 'reembolsado'::text]))) |

### public.product_components

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>) |
| parent_product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>) |
| component_product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:311](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:311>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| product_components_component_product_id_fkey | FK | FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE RESTRICT |
| product_components_not_self | CHECK | CHECK ((parent_product_id <> component_product_id)) |
| product_components_parent_product_id_fkey | FK | FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_components_pkey | PK | PRIMARY KEY (id) |
| product_components_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| product_components_unique | UNIQUE | UNIQUE (parent_product_id, component_product_id) |

### public.product_images

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| storage_path | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| public_url | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| alt_text | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| sort_order | integer | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| mime_type | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| width | integer | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| height | integer | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| file_size_bytes | bigint | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:319](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:319>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| product_images_pkey | PK | PRIMARY KEY (id) |
| product_images_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |

### public.product_inventory_requirements

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>) |
| product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>) |
| inventory_item_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>) |
| quantity | numeric(12,3) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:333](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:333>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| product_inventory_requirements_inventory_item_id_fkey | FK | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| product_inventory_requirements_pkey | PK | PRIMARY KEY (id) |
| product_inventory_requirements_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_inventory_requirements_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |
| product_inventory_requirements_unique | UNIQUE | UNIQUE (product_id, inventory_item_id) |

### public.product_recommendation_preferences

Creación: [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| product_id | uuid | No | — | [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>) |
| mode | text | No | — | [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>) |
| revision | integer | No | 1 | [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>) |
| updated_by | uuid | No | — | [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261024000100_global_product_recommendations.sql:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:20>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| product_recommendation_preferences_mode_check | CHECK | CHECK ((mode = ANY (ARRAY['global'::text, 'custom'::text, 'off'::text]))) |
| product_recommendation_preferences_pkey | PK | PRIMARY KEY (product_id) |
| product_recommendation_preferences_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendation_preferences_revision_check | CHECK | CHECK ((revision > 0)) |
| product_recommendation_preferences_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) |

### public.product_recommendation_settings

Creación: [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| key | text | No | 'global' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| enabled | boolean | No | false | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| scope | text | No | 'all' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| product_ids | uuid[] | No | '{}' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| category_ids | uuid[] | No | '{}' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| excluded_category_ids | uuid[] | No | '{}' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| excluded_product_ids | uuid[] | No | '{}' | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| revision | integer | No | 0 | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| updated_by | uuid | Sí | — | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| product_recommendation_settings_check | CHECK | CHECK (((cardinality(category_ids) <= 100) AND (cardinality(excluded_category_ids) <= 100))) |
| product_recommendation_settings_excluded_product_ids_check | CHECK | CHECK ((cardinality(excluded_product_ids) <= 200)) |
| product_recommendation_settings_key_check | CHECK | CHECK ((key = 'global'::text)) |
| product_recommendation_settings_pkey | PK | PRIMARY KEY (key) |
| product_recommendation_settings_product_ids_check | CHECK | CHECK ((cardinality(product_ids) <= 20)) |
| product_recommendation_settings_revision_check | CHECK | CHECK ((revision >= 0)) |
| product_recommendation_settings_scope_check | CHECK | CHECK ((scope = ANY (ARRAY['all'::text, 'categories'::text]))) |
| product_recommendation_settings_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) |

### public.product_recommendations

Creación: [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| product_id | uuid | No | — | [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>) |
| recommended_product_id | uuid | No | — | [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>) |
| sort_order | integer | No | — | [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>) |
| updated_by | uuid | No | — | [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261022000200_product_recommendations.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:3>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| product_recommendations_check | CHECK | CHECK ((product_id <> recommended_product_id)) |
| product_recommendations_pkey | PK | PRIMARY KEY (product_id, recommended_product_id) |
| product_recommendations_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendations_product_id_sort_order_key | UNIQUE | UNIQUE (product_id, sort_order) |
| product_recommendations_recommended_product_id_fkey | FK | FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendations_sort_order_check | CHECK | CHECK (((sort_order >= 0) AND (sort_order <= 3))) |
| product_recommendations_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) |

### public.products

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| description | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| price | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| category_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| occasion | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| season_id | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| is_featured | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| is_available | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| is_sold_out | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| catalog_order | integer | No | 0 | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| is_active | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:341](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:341>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_price | CHECK | CHECK (((price)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| products_category_id_fkey | FK | FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL |
| products_pkey | PK | PRIMARY KEY (id) |
| products_price_check | CHECK | CHECK ((price >= (0)::numeric)) |
| products_season_id_fkey | FK | FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL |

### public.profiles

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |
| full_name | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |
| role | text | No | 'empleado'::text | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:358](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:358>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| profiles_id_fkey | FK | FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE |
| profiles_pkey | PK | PRIMARY KEY (id) |
| profiles_role_check | CHECK | CHECK ((role = ANY (ARRAY['administrador'::text, 'empleado'::text]))) |

### public.promotion_products

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:367](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:367>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| promotion_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:367](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:367>) |
| product_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:367](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:367>) |
| quantity | numeric(12,3) | No | 1 | [supabase/migrations/20261007000100_baseline_initial.sql:367](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:367>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_quantity | CHECK | CHECK (((quantity)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| promotion_products_pkey | PK | PRIMARY KEY (promotion_id, product_id) |
| promotion_products_product_id_fkey | FK | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| promotion_products_promotion_id_fkey | FK | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE |
| promotion_products_quantity_check | CHECK | CHECK ((quantity > (0)::numeric)) |

### public.promotions

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| description | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| promotion_type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| discount_type | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| discount_value | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| starts_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| ends_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| minimum_purchase | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |
| combo_price | numeric(12,2) | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:373](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:373>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_combo_price | CHECK | CHECK (((combo_price)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_discount_value | CHECK | CHECK (((discount_value)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| finite_minimum_purchase | CHECK | CHECK (((minimum_purchase)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| promotions_combo_price_check | CHECK | CHECK (((combo_price IS NULL) OR (combo_price >= (0)::numeric))) |
| promotions_dates_check | CHECK | CHECK (((starts_at IS NULL) OR (ends_at IS NULL) OR (ends_at > starts_at))) NOT VALID |
| promotions_discount_type_check | CHECK | CHECK ((discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text]))) |
| promotions_discount_value_check | CHECK | CHECK ((discount_value >= (0)::numeric)) |
| promotions_minimum_purchase_check | CHECK | CHECK ((minimum_purchase >= (0)::numeric)) |
| promotions_percent_max_check | CHECK | CHECK (((discount_type IS DISTINCT FROM 'porcentaje'::text) OR (discount_value <= (100)::numeric))) NOT VALID |
| promotions_pkey | PK | PRIMARY KEY (id) |
| promotions_promotion_type_check | CHECK | CHECK ((promotion_type = ANY (ARRAY['producto'::text, 'combo'::text]))) |
| promotions_type_fields_check | CHECK | CHECK ((((promotion_type = 'producto'::text) AND (discount_type IS NOT NULL) AND (discount_value IS NOT NULL) AND (combo_price IS NULL)) OR ((promotion_type = 'combo'::text) AND (combo_price IS NOT NULL) AND (discount_type IS NULL) AND (discount_value IS NULL)))) |

### public.rate_limit_attempts

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:389](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:389>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | bigint | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:389](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:389>) |
| ip | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:389](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:389>) |
| route | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:389](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:389>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:389](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:389>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| rate_limit_attempts_pkey | PK | PRIMARY KEY (id) |

### public.sale_returns

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| order_id | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| type | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| amount | numeric(12,2) | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| reason | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| created_by | uuid | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:396](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:396>) |
| idempotency_key | uuid | Sí | — | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:119](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:119>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| finite_amount | CHECK | CHECK (((amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text]))) |
| sale_returns_amount_check | CHECK | CHECK ((((amount)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text])) AND (((type = 'retorno_fisico'::text) AND (amount = (0)::numeric)) OR ((type <> 'retorno_fisico'::text) AND (amount > (0)::numeric))))) |
| sale_returns_created_by_fkey | FK | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| sale_returns_order_id_fkey | FK | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| sale_returns_pkey | PK | PRIMARY KEY (id) |
| sale_returns_type_check | CHECK | CHECK ((type = ANY (ARRAY['devolucion'::text, 'reintegro'::text, 'retorno_fisico'::text]))) |

### public.seasons

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| name | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| description | text | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| starts_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| ends_at | timestamp with time zone | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:406](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:406>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| seasons_name_unique | UNIQUE | UNIQUE (name) |
| seasons_pkey | PK | PRIMARY KEY (id) |

### public.system_settings

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| key | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |
| value | jsonb | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |
| is_critical | boolean | No | false | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |
| updated_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:417](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:417>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| delivery_enabled_boolean | CHECK | CHECK (((key <> 'delivery_enabled'::text) OR (COALESCE(jsonb_typeof((value -> 'enabled'::text)), ''::text) = 'boolean'::text))) |
| outside_hours_boolean | CHECK | CHECK (((key <> 'accept_orders_outside_hours'::text) OR ((jsonb_typeof((value -> 'enabled'::text)) = 'boolean'::text) AND (value ? 'enabled'::text)))) |
| system_settings_pkey | PK | PRIMARY KEY (key) |
| system_settings_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |

### public.whatsapp_config

Creación: [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>). RLS local: habilitada.

| Columna | Tipo PostgreSQL local | Admite NULL | Default en SQL versionado | Fuente de la columna |
|---|---|---|---|---|
| id | uuid | No | gen_random_uuid() | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |
| phone_number | text | No | — | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |
| is_active | boolean | No | true | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |
| updated_by | uuid | Sí | — | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |
| created_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |
| updated_at | timestamp with time zone | No | now() | [supabase/migrations/20261007000100_baseline_initial.sql:426](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:426>) |

Restricciones locales vigentes:

| Nombre | Clase | Definición |
|---|---|---|
| whatsapp_config_pkey | PK | PRIMARY KEY (id) |
| whatsapp_config_updated_by_fkey | FK | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |

## 2. Relaciones físicas completas (63 FK)

reference_type/reference_id y UUID en arrays/JSON no son FK; no se suman a esta lista.

| Tabla origen | Restricción | Relación / acción referencial |
|---|---|---|
| audit_logs | audit_logs_user_id_fkey | FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL |
| business_hours | business_hours_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_movements | cash_movements_cash_session_id_fkey | FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE RESTRICT |
| cash_movements | cash_movements_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_movements | cash_movements_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| cash_sessions | cash_sessions_cash_register_id_fkey | FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT |
| cash_sessions | cash_sessions_closed_by_fkey | FOREIGN KEY (closed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| cash_sessions | cash_sessions_opened_by_fkey | FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| customization_option_inventory_requirements | customization_option_inventory_req_customization_option_id_fkey | FOREIGN KEY (customization_option_id) REFERENCES customization_options(id) ON DELETE CASCADE |
| customization_option_inventory_requirements | customization_option_inventory_requireme_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| customization_options | customization_options_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| inventory_adjustments | inventory_adjustments_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_adjustments | inventory_adjustments_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_entries | inventory_entries_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_entries | inventory_entries_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_lots | inventory_lots_inventory_adjustment_id_fkey | FOREIGN KEY (inventory_adjustment_id) REFERENCES inventory_adjustments(id) ON DELETE RESTRICT |
| inventory_lots | inventory_lots_inventory_entry_id_fkey | FOREIGN KEY (inventory_entry_id) REFERENCES inventory_entries(id) ON DELETE RESTRICT |
| inventory_lots | inventory_lots_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_movements | inventory_movements_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_movements | inventory_movements_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_movements | inventory_movements_lot_id_fkey | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT |
| inventory_reservations | inventory_reservations_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_reservations | inventory_reservations_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| inventory_waste | inventory_waste_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| inventory_waste | inventory_waste_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| inventory_waste | inventory_waste_lot_id_fkey | FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE RESTRICT |
| notifications | notifications_read_by_fkey | FOREIGN KEY (read_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_deletion_requests | order_deletion_requests_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| order_deletion_requests | order_deletion_requests_requested_by_fkey | FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_deletion_requests | order_deletion_requests_reviewed_by_fkey | FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_discounts | order_discounts_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| order_discounts | order_discounts_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| order_discounts | order_discounts_promotion_id_fkey | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL |
| order_items | order_items_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE |
| order_items | order_items_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL |
| orders | orders_cancelled_by_fkey | FOREIGN KEY (cancelled_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| orders | orders_customer_id_fkey | FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL |
| orders | orders_schedule_updated_by_fkey | FOREIGN KEY (schedule_updated_by) REFERENCES profiles(id) |
| payment_qr_config | payment_qr_config_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| payments | payments_confirmed_by_fkey | FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| payments | payments_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| payments | payments_qr_config_id_fkey | FOREIGN KEY (qr_config_id) REFERENCES payment_qr_config(id) ON DELETE RESTRICT |
| payments | payments_rejected_by_fkey | FOREIGN KEY (rejected_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| product_components | product_components_component_product_id_fkey | FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE RESTRICT |
| product_components | product_components_parent_product_id_fkey | FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_images | product_images_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_inventory_requirements | product_inventory_requirements_inventory_item_id_fkey | FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT |
| product_inventory_requirements | product_inventory_requirements_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendation_preferences | product_recommendation_preferences_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendation_preferences | product_recommendation_preferences_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) |
| product_recommendation_settings | product_recommendation_settings_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) |
| product_recommendations | product_recommendations_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendations | product_recommendations_recommended_product_id_fkey | FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE |
| product_recommendations | product_recommendations_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) |
| products | products_category_id_fkey | FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL |
| products | products_season_id_fkey | FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL |
| profiles | profiles_id_fkey | FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE |
| promotion_products | promotion_products_product_id_fkey | FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE |
| promotion_products | promotion_products_promotion_id_fkey | FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE |
| sale_returns | sale_returns_created_by_fkey | FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| sale_returns | sale_returns_order_id_fkey | FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT |
| system_settings | system_settings_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |
| whatsapp_config | whatsapp_config_updated_by_fkey | FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE RESTRICT |

## 3. Índices locales, incluidos los implícitos de PK/UNIQUE

| Tabla | Índice | Definición |
|---|---|---|
| audit_logs | audit_logs_pkey | CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id) |
| audit_logs | idx_audit_logs_created_at | CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC) |
| audit_logs | idx_audit_logs_table_record | CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id, created_at DESC) |
| business_hours | business_hours_day_unique | CREATE UNIQUE INDEX business_hours_day_unique ON public.business_hours USING btree (day_of_week) |
| business_hours | business_hours_pkey | CREATE UNIQUE INDEX business_hours_pkey ON public.business_hours USING btree (id) |
| cash_movements | cash_movements_pkey | CREATE UNIQUE INDEX cash_movements_pkey ON public.cash_movements USING btree (id) |
| cash_movements | idx_cash_movements_session | CREATE INDEX idx_cash_movements_session ON public.cash_movements USING btree (cash_session_id, created_at) |
| cash_registers | cash_registers_pkey | CREATE UNIQUE INDEX cash_registers_pkey ON public.cash_registers USING btree (id) |
| cash_sessions | cash_sessions_one_open_per_register | CREATE UNIQUE INDEX cash_sessions_one_open_per_register ON public.cash_sessions USING btree (cash_register_id) WHERE (status = 'abierta'::text) |
| cash_sessions | cash_sessions_pkey | CREATE UNIQUE INDEX cash_sessions_pkey ON public.cash_sessions USING btree (id) |
| cash_sessions | idx_cash_sessions_register_status | CREATE INDEX idx_cash_sessions_register_status ON public.cash_sessions USING btree (cash_register_id, status) |
| categories | categories_name_unique | CREATE UNIQUE INDEX categories_name_unique ON public.categories USING btree (name) |
| categories | categories_pkey | CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id) |
| customers | customers_pkey | CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id) |
| customers | customers_unique_phone | CREATE UNIQUE INDEX customers_unique_phone ON public.customers USING btree (btrim(phone)) WHERE (NULLIF(btrim(phone), ''::text) IS NOT NULL) |
| customization_option_inventory_requirements | coir_unique | CREATE UNIQUE INDEX coir_unique ON public.customization_option_inventory_requirements USING btree (customization_option_id, inventory_item_id) |
| customization_option_inventory_requirements | customization_option_inventory_requirements_pkey | CREATE UNIQUE INDEX customization_option_inventory_requirements_pkey ON public.customization_option_inventory_requirements USING btree (id) |
| customization_option_inventory_requirements | idx_coir_item | CREATE INDEX idx_coir_item ON public.customization_option_inventory_requirements USING btree (inventory_item_id) |
| customization_option_inventory_requirements | idx_coir_option | CREATE INDEX idx_coir_option ON public.customization_option_inventory_requirements USING btree (customization_option_id) |
| customization_options | customization_options_pkey | CREATE UNIQUE INDEX customization_options_pkey ON public.customization_options USING btree (id) |
| customization_options | idx_customization_product | CREATE INDEX idx_customization_product ON public.customization_options USING btree (product_id) |
| inventory_adjustments | idx_inventory_adjustments_item | CREATE INDEX idx_inventory_adjustments_item ON public.inventory_adjustments USING btree (inventory_item_id, created_at) |
| inventory_adjustments | inventory_adjustments_pkey | CREATE UNIQUE INDEX inventory_adjustments_pkey ON public.inventory_adjustments USING btree (id) |
| inventory_entries | idx_inventory_entries_item | CREATE INDEX idx_inventory_entries_item ON public.inventory_entries USING btree (inventory_item_id, received_at) |
| inventory_entries | inventory_entries_pkey | CREATE UNIQUE INDEX inventory_entries_pkey ON public.inventory_entries USING btree (id) |
| inventory_items | idx_inventory_items_type | CREATE INDEX idx_inventory_items_type ON public.inventory_items USING btree (item_type) |
| inventory_items | inventory_items_pkey | CREATE UNIQUE INDEX inventory_items_pkey ON public.inventory_items USING btree (id) |
| inventory_items | inventory_items_sku_unique | CREATE UNIQUE INDEX inventory_items_sku_unique ON public.inventory_items USING btree (sku) |
| inventory_lots | idx_inventory_lots_fifo | CREATE INDEX idx_inventory_lots_fifo ON public.inventory_lots USING btree (inventory_item_id, received_at, created_at) |
| inventory_lots | inventory_lots_pkey | CREATE UNIQUE INDEX inventory_lots_pkey ON public.inventory_lots USING btree (id) |
| inventory_movements | idx_inventory_movements_item | CREATE INDEX idx_inventory_movements_item ON public.inventory_movements USING btree (inventory_item_id, created_at) |
| inventory_movements | inventory_movements_pkey | CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id) |
| inventory_reservations | idx_reservations_item_status | CREATE INDEX idx_reservations_item_status ON public.inventory_reservations USING btree (inventory_item_id, status, expires_at) |
| inventory_reservations | idx_reservations_order | CREATE INDEX idx_reservations_order ON public.inventory_reservations USING btree (order_id) |
| inventory_reservations | inventory_reservations_pkey | CREATE UNIQUE INDEX inventory_reservations_pkey ON public.inventory_reservations USING btree (id) |
| inventory_waste | idx_inventory_waste_item | CREATE INDEX idx_inventory_waste_item ON public.inventory_waste USING btree (inventory_item_id, created_at) |
| inventory_waste | inventory_waste_pkey | CREATE UNIQUE INDEX inventory_waste_pkey ON public.inventory_waste USING btree (id) |
| notifications | idx_notifications_unread | CREATE INDEX idx_notifications_unread ON public.notifications USING btree (is_read, created_at DESC) |
| notifications | notifications_pkey | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id) |
| order_deletion_requests | idx_deletion_requests_order | CREATE INDEX idx_deletion_requests_order ON public.order_deletion_requests USING btree (order_id) |
| order_deletion_requests | idx_deletion_requests_status | CREATE INDEX idx_deletion_requests_status ON public.order_deletion_requests USING btree (status) |
| order_deletion_requests | order_deletion_requests_pkey | CREATE UNIQUE INDEX order_deletion_requests_pkey ON public.order_deletion_requests USING btree (id) |
| order_discounts | idx_order_discounts_order | CREATE INDEX idx_order_discounts_order ON public.order_discounts USING btree (order_id) |
| order_discounts | order_discounts_pkey | CREATE UNIQUE INDEX order_discounts_pkey ON public.order_discounts USING btree (id) |
| order_items | idx_order_items_order | CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id) |
| order_items | order_items_pkey | CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id) |
| orders | idx_orders_customer | CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id) |
| orders | idx_orders_status | CREATE INDEX idx_orders_status ON public.orders USING btree (status, created_at) |
| orders | orders_idempotency_unique | CREATE UNIQUE INDEX orders_idempotency_unique ON public.orders USING btree (idempotency_key) |
| orders | orders_number_unique | CREATE UNIQUE INDEX orders_number_unique ON public.orders USING btree (order_number) |
| orders | orders_pkey | CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id) |
| orders | orders_receipt_token_unique | CREATE UNIQUE INDEX orders_receipt_token_unique ON public.orders USING btree (receipt_token) |
| payment_qr_config | payment_qr_config_pkey | CREATE UNIQUE INDEX payment_qr_config_pkey ON public.payment_qr_config USING btree (id) |
| payment_qr_config | payment_qr_one_active_per_slot | CREATE UNIQUE INDEX payment_qr_one_active_per_slot ON public.payment_qr_config USING btree (qr_slot) WHERE is_active |
| payments | idx_payments_order | CREATE INDEX idx_payments_order ON public.payments USING btree (order_id, created_at DESC) |
| payments | idx_payments_status | CREATE INDEX idx_payments_status ON public.payments USING btree (status) |
| payments | payments_pkey | CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id) |
| product_components | product_components_pkey | CREATE UNIQUE INDEX product_components_pkey ON public.product_components USING btree (id) |
| product_components | product_components_unique | CREATE UNIQUE INDEX product_components_unique ON public.product_components USING btree (parent_product_id, component_product_id) |
| product_images | product_images_pkey | CREATE UNIQUE INDEX product_images_pkey ON public.product_images USING btree (id) |
| product_inventory_requirements | idx_pir_item | CREATE INDEX idx_pir_item ON public.product_inventory_requirements USING btree (inventory_item_id) |
| product_inventory_requirements | idx_pir_product | CREATE INDEX idx_pir_product ON public.product_inventory_requirements USING btree (product_id) |
| product_inventory_requirements | product_inventory_requirements_pkey | CREATE UNIQUE INDEX product_inventory_requirements_pkey ON public.product_inventory_requirements USING btree (id) |
| product_inventory_requirements | product_inventory_requirements_unique | CREATE UNIQUE INDEX product_inventory_requirements_unique ON public.product_inventory_requirements USING btree (product_id, inventory_item_id) |
| product_recommendation_preferences | product_recommendation_preferences_pkey | CREATE UNIQUE INDEX product_recommendation_preferences_pkey ON public.product_recommendation_preferences USING btree (product_id) |
| product_recommendation_settings | product_recommendation_settings_pkey | CREATE UNIQUE INDEX product_recommendation_settings_pkey ON public.product_recommendation_settings USING btree (key) |
| product_recommendations | product_recommendations_pkey | CREATE UNIQUE INDEX product_recommendations_pkey ON public.product_recommendations USING btree (product_id, recommended_product_id) |
| product_recommendations | product_recommendations_product_id_sort_order_key | CREATE UNIQUE INDEX product_recommendations_product_id_sort_order_key ON public.product_recommendations USING btree (product_id, sort_order) |
| products | products_pkey | CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id) |
| profiles | profiles_pkey | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id) |
| promotion_products | idx_promotion_products_product | CREATE INDEX idx_promotion_products_product ON public.promotion_products USING btree (product_id) |
| promotion_products | promotion_products_pkey | CREATE UNIQUE INDEX promotion_products_pkey ON public.promotion_products USING btree (promotion_id, product_id) |
| promotions | promotions_pkey | CREATE UNIQUE INDEX promotions_pkey ON public.promotions USING btree (id) |
| rate_limit_attempts | idx_rate_limit_attempts_ip_route_time | CREATE INDEX idx_rate_limit_attempts_ip_route_time ON public.rate_limit_attempts USING btree (ip, route, created_at DESC) |
| rate_limit_attempts | rate_limit_attempts_pkey | CREATE UNIQUE INDEX rate_limit_attempts_pkey ON public.rate_limit_attempts USING btree (id) |
| sale_returns | idx_sale_returns_order | CREATE INDEX idx_sale_returns_order ON public.sale_returns USING btree (order_id) |
| sale_returns | sale_returns_idempotency | CREATE UNIQUE INDEX sale_returns_idempotency ON public.sale_returns USING btree (order_id, idempotency_key) WHERE (idempotency_key IS NOT NULL) |
| sale_returns | sale_returns_pkey | CREATE UNIQUE INDEX sale_returns_pkey ON public.sale_returns USING btree (id) |
| seasons | seasons_name_unique | CREATE UNIQUE INDEX seasons_name_unique ON public.seasons USING btree (name) |
| seasons | seasons_pkey | CREATE UNIQUE INDEX seasons_pkey ON public.seasons USING btree (id) |
| system_settings | system_settings_pkey | CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (key) |
| whatsapp_config | whatsapp_config_pkey | CREATE UNIQUE INDEX whatsapp_config_pkey ON public.whatsapp_config USING btree (id) |
| whatsapp_config | whatsapp_one_active | CREATE UNIQUE INDEX whatsapp_one_active ON public.whatsapp_config USING btree (is_active) WHERE is_active |

## 4. Funciones public y privilegios efectivos locales

Sí significa EXECUTE según has_function_privilege, no autorización funcional automática: los cuerpos vuelven a comprobar actor/estado. Los triggers se ejecutan mediante el motor y no son acciones de usuario. CREATE OR REPLACE conserva ACL; por eso se usa el catálogo para el estado efectivo.

| Función y argumentos de identidad | Retorno | Seguridad | anon | authenticated | service_role | Último cuerpo SQL localizado |
|---|---|---|---|---|---|---|
| advance_order_status(p_order_id uuid, p_new_status text) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000300_security_rpc_hardening.sql:402](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000300_security_rpc_hardening.sql:402>) |
| apply_order_discount(p_order_id uuid, p_subtotal numeric, p_customer_id uuid, p_promotion_id uuid, p_manual_amount numeric, p_manual_reason text, p_actor_id uuid) | numeric | DEFINER | No | No | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:2182](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:2182>) |
| assert_product_recipe(p_product uuid) | void | DEFINER | No | No | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:8>) |
| audit_products_change() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:2849](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:2849>) |
| audit_sensitive_change() | trigger | DEFINER | No | No | No | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:102](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:102>) |
| can_delete_cancelled_order(p_order_id uuid) | boolean | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1380](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1380>) |
| cancel_order(p_order_id uuid, p_reason text) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1100](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1100>) |
| capture_order_item_recipe() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261024000200_order_management_details.sql:64](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:64>) |
| check_rate_limit(p_ip text, p_route text, p_max_attempts integer, p_window_seconds integer) | boolean | DEFINER | No | No | Sí | [supabase/migrations/20261009000200_receipt_rate_limit.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000200_receipt_rate_limit.sql:3>) |
| close_cash_session(p_session_id uuid, p_counted_amount numeric, p_closing_note text) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:888](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:888>) |
| confirm_payment(p_payment_id uuid) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:681](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:681>) |
| consume_inventory_adjustment(p_item uuid, p_quantity numeric, p_lot uuid, p_type text, p_reference uuid, p_reason text, p_actor uuid) | void | DEFINER | No | No | No | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:21](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:21>) |
| consume_order_reservations(p_order_id uuid, p_actor_id uuid) | void | DEFINER | No | No | Sí | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:28](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:28>) |
| consume_product_inventory(p_product_id uuid, p_quantity_sold numeric, p_reference_type text, p_reference_id uuid, p_created_by uuid) | void | DEFINER | No | No | Sí | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1289](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1289>) |
| create_order(p_customer_name text, p_customer_phone text, p_customer_whatsapp text, p_items jsonb, p_customer_message text, p_idempotency_key text, p_promotion_id uuid) | uuid | DEFINER | No | No | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48>) |
| create_payment(p_order_id uuid, p_customer_phone text) | TABLE(id uuid, amount numeric, method text, status text, order_number bigint) | DEFINER | No | No | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:700](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:700>) |
| create_physical_sale(p_items jsonb, p_customer_id uuid, p_promotion_id uuid, p_manual_discount_amount numeric, p_manual_discount_reason text, p_payment_method text) | TABLE(id uuid, order_number bigint, subtotal numeric, discount_total numeric, total numeric) | DEFINER | No | Sí | Sí | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:165](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:165>) |
| create_sale_return(p_order_id uuid, p_type text, p_amount numeric, p_reason text) | uuid | DEFINER | No | Sí | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:190](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:190>) |
| create_sale_return(p_order_id uuid, p_type text, p_amount numeric, p_reason text, p_idempotency_key uuid) | uuid | DEFINER | No | Sí | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:123](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:123>) |
| enforce_home_delivery_availability() | trigger | DEFINER | No | No | No | [supabase/migrations/20261017000100_home_delivery_availability.sql:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261017000100_home_delivery_availability.sql:13>) |
| get_audit_trail(p_limit integer, p_offset integer) | SETOF audit_trail | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:2874](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:2874>) |
| get_business_status() | TABLE(is_open boolean, opens_at time without time zone, closes_at time without time zone, is_closed_today boolean, accept_orders_outside_hours boolean) | DEFINER | Sí | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1439](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1439>) |
| get_product_availability(p_items jsonb, p_combine boolean) | TABLE(line_index integer, product_id uuid, available_quantity numeric, is_available boolean, is_sold_out boolean) | DEFINER | No | No | Sí | [supabase/migrations/20261020000100_product_inventory_availability.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000100_product_inventory_availability.sql:4>) |
| get_product_publication_diagnostics(p_product uuid) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261024000100_global_product_recommendations.sql:123](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:123>) |
| get_public_order_receipt(p_token uuid) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:837](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:837>) |
| guard_order_schedule() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261024000200_order_management_details.sql:17](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:17>) |
| guard_product_recipe() | trigger | DEFINER | No | No | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:29](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:29>) |
| handle_inventory_adjustment() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:48](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:48>) |
| handle_inventory_entry() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1385](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1385>) |
| handle_inventory_waste() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:42](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:42>) |
| handle_new_user() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000300_security_rpc_hardening.sql:1142](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000300_security_rpc_hardening.sql:1142>) |
| is_active_user() | boolean | DEFINER | Sí | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:537](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:537>) |
| is_admin() | boolean | DEFINER | Sí | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:552](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:552>) |
| is_employee_or_admin() | boolean | DEFINER | Sí | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:568](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:568>) |
| lock_sale_recipes(p_items jsonb) | void | DEFINER | No | No | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:19](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:19>) |
| materialize_order_customer(p_order_id uuid) | uuid | DEFINER | No | No | No | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:22](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:22>) |
| normalize_customer_phone() | trigger | INVOKER | No | No | No | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:514](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:514>) |
| notify_free_order_confirmed() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261008180000_production_round_one.sql:80](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:80>) |
| notify_new_order() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261008180000_production_round_one.sql:74](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:74>) |
| notify_order_ready() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:516](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:516>) |
| notify_pending_payment() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:2736](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:2736>) |
| notify_stock_alert() | trigger | DEFINER | No | No | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1480](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1480>) |
| open_cash_session(p_cash_register_id uuid, p_opening_amount numeric) | uuid | DEFINER | No | Sí | Sí | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:120](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:120>) |
| product_dedication_card_count(p_product_id uuid, p_option_ids uuid[]) | numeric | INVOKER | No | No | Sí | [supabase/migrations/20261020000200_recipe_dedications.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:9>) |
| protect_inventory_review_marker() | trigger | DEFINER | No | No | No | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:74](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:74>) |
| protect_last_admin() | trigger | DEFINER | No | No | No | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:1193](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:1193>) |
| protect_order_guest_snapshot() | trigger | INVOKER | No | No | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:9>) |
| protect_order_item_recipe_snapshot() | trigger | INVOKER | No | No | Sí | [supabase/migrations/20261024000200_order_management_details.sql:84](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:84>) |
| protect_order_request_contract() | trigger | DEFINER | No | No | No | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:18](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:18>) |
| record_cash_movement(p_cash_session_id uuid, p_movement_type text, p_amount numeric, p_direction text, p_reason text, p_order_id uuid) | uuid | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1202](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1202>) |
| reject_payment(p_payment_id uuid, p_reason text) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1045](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1045>) |
| release_expired_reservations(p_inventory_item_id uuid) | integer | DEFINER | No | No | Sí | [supabase/migrations/20261008180000_production_round_one.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:3>) |
| report_payment_qr(p_order_id uuid, p_customer_phone text, p_qr_slot text) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261012000100_two_payment_qr.sql:66](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:66>) |
| request_order_deletion(p_order_id uuid, p_reason text) | uuid | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1268](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1268>) |
| resolve_product_recommendation_ids(p_product uuid) | uuid[] | INVOKER | No | No | Sí | [supabase/migrations/20261024000100_global_product_recommendations.sql:100](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:100>) |
| review_order_deletion_request(p_request_id uuid, p_approve boolean, p_review_reason text) | void | DEFINER | No | Sí | Sí | [supabase/migrations/20261007000100_baseline_initial.sql:1327](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1327>) |
| save_global_product_recommendations(p_enabled boolean, p_scope text, p_products uuid[], p_categories uuid[], p_excluded_categories uuid[], p_excluded_products uuid[], p_revision integer, p_actor uuid) | integer | INVOKER | No | No | Sí | [supabase/migrations/20261024000100_global_product_recommendations.sql:54](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:54>) |
| save_product_recommendation_preferences(p_product uuid, p_mode text, p_recommendations uuid[], p_revision integer, p_actor uuid) | integer | INVOKER | No | No | Sí | [supabase/migrations/20261024000100_global_product_recommendations.sql:81](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:81>) |
| set_checkout_configuration(p_actor uuid, p_kind text, p_active boolean, p_value text, p_storage_path text, p_account_label text) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261012000100_two_payment_qr.sql:48](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:48>) |
| set_order_schedule(p_order uuid, p_when timestamp with time zone, p_status text, p_revision integer, p_client_confirmed boolean) | integer | DEFINER | No | Sí | Sí | [supabase/migrations/20261024000200_order_management_details.sql:47](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:47>) |
| set_payment_qr_slot(p_actor uuid, p_slot text, p_active boolean, p_value text, p_storage_path text, p_label text) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261012000100_two_payment_qr.sql:17](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:17>) |
| set_product_recommendations(p_product uuid, p_recommendations uuid[], p_actor uuid) | void | INVOKER | No | No | Sí | [supabase/migrations/20261024000100_global_product_recommendations.sql:37](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:37>) |
| set_storefront_media(p_kind text, p_category_id uuid, p_path text, p_actor uuid) | jsonb | INVOKER | No | No | Sí | [supabase/migrations/20261022000100_storefront_media.sql:10](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000100_storefront_media.sql:10>) |
| track_order(p_order_number bigint, p_customer_phone text) | TABLE(order_number bigint, status text, order_type text, subtotal numeric, discount_total numeric, total numeric, customer_message text, created_at timestamp with time zone, updated_at timestamp with time zone, items jsonb) | DEFINER | No | No | Sí | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:749](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:749>) |
| track_order_details(p_customer_phone text, p_order_number bigint, p_order_id uuid) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261012000100_two_payment_qr.sql:95](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:95>) |
| update_staff_profile(p_actor uuid, p_user uuid, p_role text, p_active boolean, p_name text) | jsonb | DEFINER | No | No | Sí | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:1205](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:1205>) |
| validate_dedication_recipe_units() | trigger | DEFINER | No | No | No | [supabase/migrations/20261020000200_recipe_dedications.sql:59](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:59>) |
| validate_inventory_movement_actor() | trigger | DEFINER | No | No | No | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:6>) |
| validate_order_dedications() | trigger | DEFINER | No | No | No | [supabase/migrations/20261020000200_recipe_dedications.sql:22](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:22>) |

set_order_schedule cambió posteriormente a SECURITY DEFINER y search_path fijo mediante [supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6>). La columna de seguridad refleja el estado local final.

## 5. Políticas RLS vigentes locales

| Esquema.tabla | Política | Operación | Roles | USING | WITH CHECK |
|---|---|---|---|---|---|
| public.business_hours | business_hours_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.business_hours | business_hours_public_select | SELECT | anon, authenticated | true | — |
| public.cash_movements | cash_movements_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.cash_registers | cash_registers_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.cash_sessions | cash_sessions_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.categories | categories_admin_insert | INSERT | authenticated | — | is_admin() |
| public.categories | categories_admin_select | SELECT | authenticated | is_admin() | — |
| public.categories | categories_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.categories | categories_employee_admin_all | ALL | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.categories | categories_public_select | SELECT | anon, authenticated | (is_active = true) | — |
| public.customers | customers_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.customers | customers_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.customers | customers_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.customization_option_inventory_requirements | coir_staff_delete | DELETE | authenticated | is_employee_or_admin() | — |
| public.customization_option_inventory_requirements | coir_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.customization_option_inventory_requirements | coir_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.customization_option_inventory_requirements | coir_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.customization_options | customization_options_public_select | SELECT | anon, authenticated | ((is_active = true) AND (EXISTS ( SELECT 1 FROM products p WHERE ((p.id = customization_options.product_id) AND (p.is_active = true))))) | — |
| public.customization_options | customization_staff_delete | DELETE | authenticated | is_employee_or_admin() | — |
| public.customization_options | customization_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.customization_options | customization_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.customization_options | customization_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.inventory_adjustments | inventory_adjustments_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.inventory_adjustments | inventory_adjustments_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_entries | inventory_entries_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.inventory_entries | inventory_entries_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_items | inventory_items_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.inventory_items | inventory_items_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_items | inventory_items_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.inventory_lots | inventory_lots_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_movements | inventory_movements_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_reservations | reservations_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.inventory_waste | inventory_waste_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.inventory_waste | inventory_waste_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.notifications | notifications_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.notifications | notifications_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.order_deletion_requests | deletion_requests_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.order_discounts | order_discounts_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.order_items | order_items_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.orders | orders_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.payment_qr_config | qr_config_public_select | SELECT | anon, authenticated | (is_active = true) | — |
| public.payments | payments_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.product_components | product_components_admin_delete | DELETE | authenticated | is_admin() | — |
| public.product_components | product_components_admin_insert | INSERT | authenticated | — | is_admin() |
| public.product_components | product_components_admin_select | SELECT | authenticated | is_admin() | — |
| public.product_components | product_components_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.product_components | product_components_employee_admin_all | ALL | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.product_components | product_components_public_select | SELECT | anon, authenticated | (EXISTS ( SELECT 1 FROM products p WHERE ((p.id = product_components.parent_product_id) AND (p.is_active = true)))) | — |
| public.product_images | product_images_admin_delete | DELETE | authenticated | is_admin() | — |
| public.product_images | product_images_admin_insert | INSERT | authenticated | — | is_admin() |
| public.product_images | product_images_admin_select | SELECT | authenticated | is_admin() | — |
| public.product_images | product_images_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.product_images | product_images_employee_admin_all | ALL | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.product_images | product_images_public_select | SELECT | anon, authenticated | (EXISTS ( SELECT 1 FROM products p WHERE ((p.id = product_images.product_id) AND (p.is_active = true)))) | — |
| public.product_inventory_requirements | pir_staff_delete | DELETE | authenticated | is_employee_or_admin() | — |
| public.product_inventory_requirements | pir_staff_insert | INSERT | authenticated | — | is_employee_or_admin() |
| public.product_inventory_requirements | pir_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.product_inventory_requirements | pir_staff_update | UPDATE | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.product_recommendations | recommendations_public_read | SELECT | anon, authenticated | ((EXISTS ( SELECT 1 FROM products p WHERE ((p.id = product_recommendations.product_id) AND p.is_active))) AND (EXISTS ( SELECT 1 FROM products p WHERE ((p.id = product_recommendations.recommended_product_id) AND p.is_active AND p.is_available AND (NOT p.is_sold_out))))) | — |
| public.products | products_admin_insert | INSERT | authenticated | — | is_admin() |
| public.products | products_admin_select | SELECT | authenticated | is_admin() | — |
| public.products | products_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.products | products_employee_admin_all | ALL | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.products | products_public_select | SELECT | anon, authenticated | (is_active = true) | — |
| public.profiles | Administradores pueden ver todos los perfiles | SELECT | authenticated | is_admin() | — |
| public.profiles | Usuarios pueden ver su propio perfil | SELECT | authenticated | (auth.uid() = id) | — |
| public.profiles | profiles_select_admin_all | SELECT | authenticated | is_admin() | — |
| public.profiles | profiles_select_own | SELECT | authenticated | (id = auth.uid()) | — |
| public.profiles | profiles_update_admin | UPDATE | authenticated | is_admin() | is_admin() |
| public.promotion_products | promotion_products_admin_delete | DELETE | authenticated | is_admin() | — |
| public.promotion_products | promotion_products_admin_insert | INSERT | authenticated | — | is_admin() |
| public.promotion_products | promotion_products_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.promotion_products | promotion_products_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.promotions | promotions_admin_insert | INSERT | authenticated | — | is_admin() |
| public.promotions | promotions_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.promotions | promotions_public_select_active | SELECT | anon | (is_active = true) | — |
| public.promotions | promotions_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.sale_returns | sale_returns_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.seasons | seasons_admin_insert | INSERT | authenticated | — | is_admin() |
| public.seasons | seasons_admin_select | SELECT | authenticated | is_admin() | — |
| public.seasons | seasons_admin_update | UPDATE | authenticated | is_admin() | is_admin() |
| public.seasons | seasons_employee_admin_all | ALL | authenticated | is_employee_or_admin() | is_employee_or_admin() |
| public.seasons | seasons_public_select | SELECT | anon, authenticated | (is_active = true) | — |
| public.system_settings | Administradores pueden modificar configuración | UPDATE | authenticated | is_admin() | is_admin() |
| public.system_settings | Administradores pueden ver configuración | SELECT | authenticated | is_admin() | — |
| public.system_settings | system_settings_staff_select | SELECT | authenticated | is_employee_or_admin() | — |
| public.whatsapp_config | whatsapp_config_public_select | SELECT | anon, authenticated | (is_active = true) | — |
| storage.objects | product_images_employee_admin_delete | DELETE | authenticated | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | — |
| storage.objects | product_images_employee_admin_insert | INSERT | authenticated | — | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) |
| storage.objects | product_images_employee_admin_update | UPDATE | authenticated | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) | ((bucket_id = 'product-images'::text) AND is_employee_or_admin()) |

Hay 87 políticas public y 3 en storage.objects. Se incluyen las cuatro políticas con nombres españoles que contienen espacios, que una búsqueda de identificadores simples podría omitir.

## 6. Triggers de public

| Tabla | Trigger | Habilitado | Definición |
|---|---|---|---|
| business_hours | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.business_hours FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| cash_movements | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.cash_movements FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| cash_registers | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| cash_sessions | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.cash_sessions FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| categories | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| customers | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| customers | normalize_customer_phone | O | CREATE TRIGGER normalize_customer_phone BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION normalize_customer_phone() |
| customization_option_inventory_requirements | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.customization_option_inventory_requirements FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| customization_option_inventory_requirements | dedication_option_units | O | CREATE TRIGGER dedication_option_units BEFORE INSERT OR UPDATE ON public.customization_option_inventory_requirements FOR EACH ROW EXECUTE FUNCTION validate_dedication_recipe_units() |
| customization_options | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.customization_options FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| inventory_adjustments | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.inventory_adjustments FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| inventory_adjustments | trg_inventory_adjustment_created | O | CREATE TRIGGER trg_inventory_adjustment_created AFTER INSERT ON public.inventory_adjustments FOR EACH ROW EXECUTE FUNCTION handle_inventory_adjustment() |
| inventory_entries | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.inventory_entries FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| inventory_entries | trg_inventory_entry_created | O | CREATE TRIGGER trg_inventory_entry_created AFTER INSERT ON public.inventory_entries FOR EACH ROW EXECUTE FUNCTION handle_inventory_entry() |
| inventory_items | dedication_classification_units | O | CREATE TRIGGER dedication_classification_units BEFORE INSERT OR UPDATE OF is_dedication_card ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION validate_dedication_recipe_units() |
| inventory_items | trg_notify_stock_alert | O | CREATE TRIGGER trg_notify_stock_alert AFTER UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION notify_stock_alert() |
| inventory_movements | validate_inventory_movement_actor | O | CREATE TRIGGER validate_inventory_movement_actor BEFORE INSERT OR UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION validate_inventory_movement_actor() |
| inventory_waste | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.inventory_waste FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| inventory_waste | trg_inventory_waste_created | O | CREATE TRIGGER trg_inventory_waste_created AFTER INSERT ON public.inventory_waste FOR EACH ROW EXECUTE FUNCTION handle_inventory_waste() |
| order_items | capture_order_item_recipe | O | CREATE TRIGGER capture_order_item_recipe BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION capture_order_item_recipe() |
| order_items | guard_order_item_recipe | O | CREATE TRIGGER guard_order_item_recipe BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION guard_product_recipe() |
| order_items | protect_order_item_recipe_snapshot | O | CREATE TRIGGER protect_order_item_recipe_snapshot BEFORE UPDATE OF recipe_snapshot ON public.order_items FOR EACH ROW EXECUTE FUNCTION protect_order_item_recipe_snapshot() |
| order_items | validate_order_dedications_before_insert | O | CREATE TRIGGER validate_order_dedications_before_insert BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION validate_order_dedications() |
| orders | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| orders | enforce_home_delivery_availability_before_order | O | CREATE TRIGGER enforce_home_delivery_availability_before_order BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION enforce_home_delivery_availability() |
| orders | guard_initial_order_schedule | O | CREATE TRIGGER guard_initial_order_schedule BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION guard_order_schedule() |
| orders | guard_order_schedule | O | CREATE TRIGGER guard_order_schedule BEFORE UPDATE OF scheduled_for, schedule_status, schedule_client_confirmed, schedule_revision, schedule_updated_by, schedule_updated_at ON public.orders FOR EACH ROW EXECUTE FUNCTION guard_order_schedule() |
| orders | notify_free_order_confirmed | O | CREATE TRIGGER notify_free_order_confirmed AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_free_order_confirmed() |
| orders | protect_inventory_review_marker | O | CREATE TRIGGER protect_inventory_review_marker BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION protect_inventory_review_marker() |
| orders | protect_order_request_contract | O | CREATE TRIGGER protect_order_request_contract BEFORE UPDATE OF request_contract ON public.orders FOR EACH ROW EXECUTE FUNCTION protect_order_request_contract() |
| orders | trg_notify_new_order | O | CREATE TRIGGER trg_notify_new_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_new_order() |
| orders | trg_notify_order_ready | O | CREATE TRIGGER trg_notify_order_ready AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_order_ready() |
| orders | trg_order_guest_immutable | O | CREATE TRIGGER trg_order_guest_immutable BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION protect_order_guest_snapshot() |
| payment_qr_config | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.payment_qr_config FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| payments | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| payments | trg_notify_pending_payment | O | CREATE TRIGGER trg_notify_pending_payment AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION notify_pending_payment() |
| product_inventory_requirements | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.product_inventory_requirements FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| product_inventory_requirements | dedication_recipe_units | O | CREATE TRIGGER dedication_recipe_units BEFORE INSERT OR UPDATE ON public.product_inventory_requirements FOR EACH ROW EXECUTE FUNCTION validate_dedication_recipe_units() |
| product_inventory_requirements | guard_recipe_change | O | CREATE TRIGGER guard_recipe_change AFTER INSERT OR DELETE OR UPDATE ON public.product_inventory_requirements FOR EACH ROW EXECUTE FUNCTION guard_product_recipe() |
| product_recommendation_preferences | audit_recommendation_preferences | O | CREATE TRIGGER audit_recommendation_preferences AFTER INSERT OR DELETE OR UPDATE ON public.product_recommendation_preferences FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| product_recommendation_settings | audit_recommendation_settings | O | CREATE TRIGGER audit_recommendation_settings AFTER INSERT OR DELETE OR UPDATE ON public.product_recommendation_settings FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| product_recommendations | audit_product_recommendations | O | CREATE TRIGGER audit_product_recommendations AFTER INSERT OR DELETE OR UPDATE ON public.product_recommendations FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| products | guard_product_recipe | O | CREATE TRIGGER guard_product_recipe BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION guard_product_recipe() |
| products | trg_audit_products | O | CREATE TRIGGER trg_audit_products AFTER UPDATE ON public.products FOR EACH ROW WHEN (((old.name IS DISTINCT FROM new.name) OR (old.description IS DISTINCT FROM new.description) OR (old.price IS DISTINCT FROM new.price) OR (old.category_id IS DISTINCT FROM new.category_id) OR (old.occasion IS DISTINCT FROM new.occasion) OR (old.season_id IS DISTINCT FROM new.season_id) OR (old.is_featured IS DISTINCT FROM new.is_featured) OR (old.is_available IS DISTINCT FROM new.is_available) OR (old.is_sold_out IS DISTINCT FROM new.is_sold_out) OR (old.catalog_order IS DISTINCT FROM new.catalog_order) OR (old.is_active IS DISTINCT FROM new.is_active))) EXECUTE FUNCTION audit_products_change() |
| profiles | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| profiles | protect_last_admin | O | CREATE TRIGGER protect_last_admin BEFORE DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_last_admin() |
| promotion_products | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.promotion_products FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| promotions | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| sale_returns | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.sale_returns FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| seasons | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| system_settings | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |
| whatsapp_config | audit_sensitive_change | O | CREATE TRIGGER audit_sensitive_change AFTER INSERT OR DELETE OR UPDATE ON public.whatsapp_config FOR EACH ROW EXECUTE FUNCTION audit_sensitive_change() |

La consulta local excluyó triggers internos y el esquema Auth. El alta on_auth_user_created en auth.users consta en [supabase/migrations/20261007000100_baseline_initial.sql:3935](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:3935>); su existencia local no se volvió a consultar aquí. La migración de configuración crea 22 triggers de auditoría mediante DO y checks finite_* para numeric; aquí se listan desde el catálogo.

## 7. Vistas y secuencias

### audit_trail

[supabase/migrations/20261007000100_baseline_initial.sql:440](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:440>)

~~~sql
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
~~~

### sales_ledger

[supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:203>)

~~~sql
CREATE VIEW public.sales_ledger WITH(security_invoker=true) AS
 SELECT 'sale'::text AS kind,o.id AS event_id,o.id AS order_id,o.order_number,o.order_type,o.status AS order_status,c.name AS customer_name,o.total AS original_total,
 o.total AS amount,coalesce(p.confirmed_at,o.created_at) AS occurred_at,p.method AS payment_method,
 p.confirmed_by AS actor_id,pr.full_name AS actor_name,NULL::text AS return_type,NULL::text AS reason
 FROM public.orders o LEFT JOIN LATERAL (SELECT confirmed_at,method,confirmed_by FROM public.payments
 WHERE order_id=o.id AND status='confirmado' ORDER BY confirmed_at,id LIMIT 1) p ON true
 LEFT JOIN public.customers c ON c.id=o.customer_id
 LEFT JOIN public.profiles pr ON pr.id=p.confirmed_by
 -- El estado operacional cancelado no borra un cobro confirmado sin reintegro.
 WHERE p.confirmed_at IS NOT NULL OR (o.total=0 AND o.status IN ('confirmado','en_preparacion','listo','finalizado'))
 UNION ALL
 SELECT 'refund',r.id,o.id,o.order_number,o.order_type,o.status,c.name,o.total,r.amount,r.created_at,p.method,r.created_by,pr.full_name,r.type,r.reason
 FROM public.sale_returns r JOIN public.orders o ON o.id=r.order_id
 LEFT JOIN LATERAL (SELECT method FROM public.payments WHERE order_id=o.id AND status='confirmado' ORDER BY confirmed_at,id LIMIT 1) p ON true
 LEFT JOIN public.customers c ON c.id=o.customer_id
 LEFT JOIN public.profiles pr ON pr.id=r.created_by WHERE r.amount>0;
~~~

order_number_seq se declara en [supabase/migrations/20261007000100_baseline_initial.sql:35](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:35>). rate_limit_attempts.id usa GENERATED ALWAYS AS IDENTITY; su secuencia implícita y valores actuales no se incluyeron en la consulta. No se afirma continuidad de folios en producción.

## 8. Cadena activa versionada (20 migraciones)

| Orden | Archivo | Líneas |
|---|---|---|
| 1 | [supabase/migrations/20261007000100_baseline_initial.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:1>) | 5296 |
| 2 | [supabase/migrations/20261007000200_checkout_public_summary.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000200_checkout_public_summary.sql:1>) | 26 |
| 3 | [supabase/migrations/20261007000300_security_rpc_hardening.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000300_security_rpc_hardening.sql:1>) | 1300 |
| 4 | [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:1>) | 1428 |
| 5 | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:1>) | 1223 |
| 6 | [supabase/migrations/20261008180000_production_round_one.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:1>) | 106 |
| 7 | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:1>) | 857 |
| 8 | [supabase/migrations/20261009000200_receipt_rate_limit.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000200_receipt_rate_limit.sql:1>) | 17 |
| 9 | [supabase/migrations/20261009000300_tracking_rpc_server_only.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000300_tracking_rpc_server_only.sql:1>) | 9 |
| 10 | [supabase/migrations/20261012000100_two_payment_qr.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:1>) | 122 |
| 11 | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:1>) | 222 |
| 12 | [supabase/migrations/20261017000100_home_delivery_availability.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261017000100_home_delivery_availability.sql:1>) | 51 |
| 13 | [supabase/migrations/20261020000100_product_inventory_availability.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000100_product_inventory_availability.sql:1>) | 65 |
| 14 | [supabase/migrations/20261020000200_recipe_dedications.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261020000200_recipe_dedications.sql:1>) | 114 |
| 15 | [supabase/migrations/20261022000100_storefront_media.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000100_storefront_media.sql:1>) | 32 |
| 16 | [supabase/migrations/20261022000200_product_recommendations.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000200_product_recommendations.sql:1>) | 49 |
| 17 | [supabase/migrations/20261024000100_global_product_recommendations.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:1>) | 138 |
| 18 | [supabase/migrations/20261024000200_order_management_details.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:1>) | 98 |
| 19 | [supabase/migrations/20261024000300_private_profile_avatars.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000300_private_profile_avatars.sql:1>) | 8 |
| 20 | [supabase/migrations/20261025000100_order_schedule_rls_fix.sql:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261025000100_order_schedule_rls_fix.sql:1>) | 17 |

supabase/migrations-legacy conserva 39 archivos históricos y no forma parte de la cadena activa: [supabase/MIGRATION_REORGANIZATION_AUDIT.md:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/MIGRATION_REORGANIZATION_AUDIT.md:3>). El master SQL es diseño inicial; cadena activa y catálogo local tienen precedencia.

## 9. Límites

- Lectura local, sin certificación remota ni revisión de filas.
- Ledger de migraciones presente; no se extrajo su contenido ni se comparó producción.
- No se compararon hashes de cuerpos desplegados. Se analizaron últimos cuerpos versionados; firmas, seguridad y ACL sí se contrastaron.
- Defaults documentados desde SQL; pg_attrdef no se consultó.
- No se listan internals completos de auth/storage/Vault, sólo objetos referenciados.
- El temporal _inventario-sql-analisis.json no se entrega; este anexo excluye cuerpos completos y sentencias de datos innecesarias.
