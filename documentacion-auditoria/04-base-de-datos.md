# 04 · Base de datos: modelo efectivo local y SQL versionado

## 1. Alcance y nivel de certeza

El sistema utiliza PostgreSQL mediante Supabase, con PostgREST/RPC, Auth y Storage. No se encontró un ORM: la aplicación usa supabase-js, validadores Zod y tipos TypeScript locales. Esta auditoría documental leyó la cadena SQL activa, su historial legacy y el master; el agente principal añadió una lectura real de pg_catalog en el laboratorio NOVA-LOCAL-CATALOGO-DEMO con BEGIN READ ONLY y ROLLBACK. No se ejecutaron migraciones ni se consultaron filas comerciales.

| Evidencia | Qué permite afirmar | Qué no permite afirmar |
|---|---|---|
| Catálogo local verificado | PostgreSQL 17.11; 38 tablas public, 334 columnas, 231 restricciones (63 FK), 83 índices, 69 funciones public, 52 triggers de public, 2 vistas y 90 políticas public/storage; RLS habilitada en las 38 tablas. | Estado o contenido de producción; equivalencia de cada cuerpo SQL desplegado; datos correctos o pruebas transaccionales nuevas. |
| 20 migraciones activas | Declaraciones del modelo y cuerpos de negocio versionados, orden de cambios, defaults y guardas. | Que cada instalación haya aplicado exactamente la cadena. Sólo se verificó presencia del ledger, no su contenido. |
| Master y 39 legacy | Evolución histórica y reglas iniciales. | Ser el esquema actual. No deben ejecutarse concatenados con la cadena activa. |

El [diccionario completo](ANEXO-diccionario-estructural.md) contiene las 334 columnas con tipos/nulabilidad, PK/FK/CHECK/UNIQUE, índices, las 69 firmas y ACL efectivas, 90 políticas y 52 triggers. El [catálogo estructural](ANEXO-catalogo-local-verificado.json) es evidencia de lectura local, sin secretos. Los defaults del diccionario proceden del SQL, no de pg_attrdef.

## 2. Organización del dominio

| Grupo | Tablas de aplicación | Uso real |
|---|---|---|
| Identidad y trazabilidad | profiles, audit_logs, notifications, rate_limit_attempts | Personal activo y rol, auditoría, bandeja compartida y limitación de solicitudes. auth.users pertenece a Supabase; profiles.id lo referencia. |
| Catálogo | categories, seasons, products, product_images | Organización, publicación, precio, fotos y disponibilidad comercial. |
| Recetas y personalización | product_components, product_inventory_requirements, customization_options, customization_option_inventory_requirements | Productos compuestos, insumos por unidad y materiales extra de opciones. |
| Inventario | inventory_items, inventory_entries, inventory_lots, inventory_movements, inventory_reservations, inventory_waste, inventory_adjustments | Stock agregado, lotes FIFO, reservas temporales y movimientos trazables. |
| Pedidos y cobros | orders, order_items, payments, order_discounts, order_deletion_requests, sale_returns | Ventas online/físicas, snapshots, confirmación manual, descuentos, borrado lógico solicitado y devoluciones/reintegros. |
| Operación comercial | customers, promotions, promotion_products, cash_registers, cash_sessions, cash_movements | Directorio de clientes; asociaciones de promociones; turnos y efectivo. |
| Configuración | business_hours, payment_qr_config, whatsapp_config, system_settings | Horarios, dos slots de QR, contacto y JSON de servicios/ubicación/medios. |
| Complementos | product_recommendations, product_recommendation_settings, product_recommendation_preferences | Selecciones personalizadas, configuración global y modo global/custom/off. |

No existe una tabla independiente de carritos, destinatarios, domicilios o cuentas de compradores públicos. El carrito y el borrador son locales en el navegador; el comprador invitado se conserva en orders.guest_* y la entrega/dirección se transmite en customer_message. No se deben convertir esas ausencias en entidades supuestamente implementadas.

## 3. Decisiones estructurales y restricciones relevantes

- Identificadores UUID predominantes; order_number usa secuencia bigint. El limitador usa bigint identity.
- Dinero numeric(12,2); insumos/cantidades numeric(12,3). CHECK de importes no negativos o positivos según operación y finite_* impiden NaN/Infinity. [supabase/migrations/20261008120236_inventory_cash_configuration.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:6>).
- FK y acciones ON DELETE RESTRICT/CASCADE/SET NULL preservan historial y evitan referencias inválidas. Las relaciones completas se listan en el anexo.
- inventory_lots tiene exactamente una fuente: inventory_entry_id o inventory_adjustment_id, mediante num_nonnulls=1. [supabase/migrations/20261008120236_inventory_cash_configuration.sql:12](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:12>).
- Una sesión de caja abierta por caja, un QR activo por slot y un WhatsApp activo se protegen mediante índices únicos parciales. [supabase/migrations/20261008120236_inventory_cash_configuration.sql:15](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:15>) y [supabase/migrations/20261012000100_two_payment_qr.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:4>).
- Las promociones son de tipo producto o combo. Las relaciones monetarias y porcentajes se validan en Zod y SQL; no hay tabla promotion_categories. El carrito estima sobre las asociaciones explícitas que recibe. [src/lib/public/cart-promotions.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/cart-promotions.ts:1>) y [src/validations/promotions.ts:129](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/promotions.ts:129>).
- orders.request_contract conserva contrato normalizado para idempotencia; guest_* y receipt_token tienen protección de inmutabilidad. [supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:18](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000400_backend_concurrency_zero_total.sql:18>) y [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:9>).
- order_items guarda nombre/precio, opciones, dedications y recipe_snapshot. La receta histórica no se rellena por inferencia: NULL significa que no se capturó para ese registro. [supabase/migrations/20261024000200_order_management_details.sql:64](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:64>).
- product_recommendation_settings es una configuración singleton con key='global'. Sus arrays UUID no son FK físicas; los procedimientos comprueban referencias, límites y revisiones. [supabase/migrations/20261024000100_global_product_recommendations.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000100_global_product_recommendations.sql:4>).
- Las relaciones polimórficas de movimientos/auditoría son reference_type/reference_id o table_name/record_id: no equivalen a una FK general de PostgreSQL.

## 4. Reglas de negocio que realmente ejecuta SQL

| Operación | Regla comprobada en el último cuerpo versionado | Evidencia |
|---|---|---|
| Pedido online | Servicio privado create_order(7); valida contrato, horario, productos, receta y stock, bloquea por idempotencia e inventario, calcula precios/descuento y registra reserva de 30 minutos. | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48>) |
| Reintento | Misma clave y mismo request_contract devuelve el pedido existente; contrato diferente con la misma clave se rechaza. La UI guarda el intento y mantiene su promoción al restaurarlo. | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:110](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:110>); [src/lib/public/promotion-selection.ts:14](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/promotion-selection.ts:14>) |
| Total cero | Consume reservas, materializa cliente y confirma sin inventar pago ni caja. | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:669](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:669>) |
| Reportar pago | report_payment_qr conserva slot/etiqueta/configuración en el pago; reportar no confirma una transferencia bancaria. | [supabase/migrations/20261012000100_two_payment_qr.sql:66](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:66>) |
| Confirmar pago | Personal activo; bloquea pedido/pagos, consume reservas FIFO, confirma pago, materializa cliente y cambia pedido a confirmado. | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:681](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:681>) |
| Preparación | Únicamente confirmado → en_preparacion → listo → finalizado. No admite saltos por simple texto enviado desde cliente. | [supabase/migrations/20261007000300_security_rpc_hardening.sql:402](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000300_security_rpc_hardening.sql:402>) |
| Expiración | release_expired_reservations libera y cancela pendientes vencidos sin pago pendiente/confirmado; su existencia no demuestra un job cron instalado. Se invoca desde operaciones de negocio. | [supabase/migrations/20261008180000_production_round_one.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:3>) |
| Venta física | Personal y caja abierta; efectivo o QR; calcula importe/descuento, consume stock y registra venta/pago/movimiento atómicos. | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:165](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:165>) |
| FIFO/merma/ajuste | Bloquea ítem y lotes; no consume stock reservado; ordena lotes por antigüedad. Ajuste positivo crea lote de origen propio. | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:21](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:21>) |
| Devolución/reintegro | Administrador; idempotencia por operación, motivo, límite acumulado al total original. retorno_fisico requiere monto cero; reintegro sólo dinero; devolución combina retorno y dinero. Cancelado pagado sólo admite reintegro para no devolver stock dos veces. | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:123](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:123>) |
| Caja | Apertura serializada; cierre calcula esperado sólo con efectivo, excluye QR y guarda diferencia contra monto contado. | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:120](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:120>); [supabase/migrations/20261007000100_baseline_initial.sql:928](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000100_baseline_initial.sql:928>) |
| Horario de pedido | Fecha y estado pending/proposed/confirmed; confirmación explícita del cliente, revisión optimista, horario de atención y horizonte de 180 días. El cambio final a SECURITY DEFINER resuelve visibilidad RLS del bloqueo. | [supabase/migrations/20261024000200_order_management_details.sql:17](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:17>); [supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6>) |
| Reportes contables | sales_ledger reconoce ventas al confirmar y reintegros en su fecha; no reescribe la venta original ni transforma retorno físico sin dinero en partida financiera. | [supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:203](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261013000100_inventory_refunds_sales_ledger.sql:203>) |
| Personal | update_staff_profile exige administrador activo y protect_last_admin impide perder el último administrador activo. | [supabase/migrations/20261008120236_inventory_cash_configuration.sql:1193](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008120236_inventory_cash_configuration.sql:1193>) |

Todas estas filas describen código de negocio y contratos. Los resultados de ejecución disponibles y sus límites se documentan separadamente en 09-pruebas.md.

## 5. Seguridad de datos y Storage

El anexo muestra EXECUTE efectivo por anon/authenticated/service_role, no sólo declaraciones históricas. create_order(7), report_payment_qr, seguimiento, recibo público, limitador y actualización privada del personal están destinados a service_role a través de APIs que validan primero. Las operaciones del empleado usan sesión autenticada y vuelven a comprobar rol/estado en SQL. Hay 60 funciones SECURITY DEFINER y 9 INVOKER en el catálogo local; no son por sí mismas una vulnerabilidad, pero requieren revisar search_path y autorización. RLS está habilitada sin FORCE RLS; propietario/service_role son privilegiados y los handlers no pueden confiar en RLS cuando usan el cliente administrativo. Ver 08-seguridad.md.

| Bucket | Declaración versionada | Acceso/uso de aplicación |
|---|---|---|
| product-images | Público; límite 5 MiB, JPEG/PNG/WebP desde seed. | Fotografías de productos y storefront/about/category. Tres políticas de escritura para personal autenticado activo; imágenes públicas por URL. |
| payment-qr | Público; límite 5 MiB, JPEG/PNG/WebP desde seed. | QR visibles al comprador; carga/configuración mediante handler administrativo. No implica integración bancaria. |
| profile-avatars | Privado; 2 MiB, WebP. | Ruta servidor deriva owner del usuario activo y usa profile.id/avatar.webp. Devuelve bytes privados no-store; no existe columna avatar en profiles. |

Fuentes: [supabase/seed.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/seed.sql:4>), [supabase/migrations/20261024000300_private_profile_avatars.sql:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000300_private_profile_avatars.sql:4>), [src/app/api/admin/profile/avatar/route.ts:19](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts:19>). Los buckets no se leyeron como filas del catálogo durante esta auditoría; sus propiedades se verifican en SQL/handlers, no como configuración física remota. El seed declara defaults y no contiene usuarios/clientes/productos reales; no se ejecutó.

El backend de medios aún admite la clave logo en set_storefront_media, mientras la UI administrativa sólo ofrece Nosotros/categoría. Es una capacidad residual del contrato, no una opción visible al empleado. [supabase/migrations/20261022000100_storefront_media.sql:14](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261022000100_storefront_media.sql:14>) y [src/components/admin/storefront-media-configuration.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/storefront-media-configuration.tsx:1>).

## 6. Modelos TypeScript y ausencia de ORM

[src/lib/public/types.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/types.ts:1>) define DTO de catálogo/pedido, imágenes, promociones, horarios y opciones. [src/lib/public/cart-logic.ts:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/cart-logic.ts:13>) define CartItem, no una tabla. [src/lib/auth/permissions.ts:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/permissions.ts:3>) define AuthProfile/UserRole; [src/lib/public/checkout.ts:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/checkout.ts:8>) deriva CheckoutDetails del esquema Zod. Otros tipos son locales de cada módulo; no se encontró un archivo generado completo de Database a partir de Supabase. Los DTO pueden omitir campos privados y no reemplazan las restricciones del motor. El diagrama de clases de 06 es una proyección analítica, no clases OOP/ORM implementadas.

## 7. Diagrama ER completo de claves foráneas

La cardinalidad depende de nulabilidad y PK/UNIQUE, no de cantidades actuales de filas. auth_users representa únicamente la FK externa conocida de Supabase. Las 63 relaciones aparecen en el anexo con su ON DELETE; el gráfico no inventa relaciones para JSON/arrays ni destinatarios.

~~~mermaid
erDiagram
    audit_logs {
        uuid id PK
    }
    business_hours {
        uuid id PK
    }
    cash_movements {
        uuid id PK
        uuid cash_session_id
        uuid order_id
    }
    cash_registers {
        uuid id PK
    }
    cash_sessions {
        uuid id PK
        uuid cash_register_id
    }
    categories {
        uuid id PK
    }
    customers {
        uuid id PK
    }
    customization_option_inventory_requirements {
        uuid id PK
        uuid inventory_item_id
    }
    customization_options {
        uuid id PK
        uuid product_id
    }
    inventory_adjustments {
        uuid id PK
        uuid inventory_item_id
    }
    inventory_entries {
        uuid id PK
        uuid inventory_item_id
    }
    inventory_items {
        uuid id PK
    }
    inventory_lots {
        uuid id PK
        uuid inventory_item_id
    }
    inventory_movements {
        uuid id PK
        uuid inventory_item_id
    }
    inventory_reservations {
        uuid id PK
        uuid order_id
        uuid inventory_item_id
    }
    inventory_waste {
        uuid id PK
        uuid inventory_item_id
    }
    notifications {
        uuid id PK
    }
    order_deletion_requests {
        uuid id PK
        uuid order_id
    }
    order_discounts {
        uuid id PK
        uuid order_id
        uuid promotion_id
    }
    order_items {
        uuid id PK
        uuid order_id
        uuid product_id
    }
    orders {
        uuid id PK
        uuid customer_id
    }
    payment_qr_config {
        uuid id PK
    }
    payments {
        uuid id PK
        uuid order_id
    }
    product_components {
        uuid id PK
        uuid parent_product_id
        uuid component_product_id
    }
    product_images {
        uuid id PK
        uuid product_id
    }
    product_inventory_requirements {
        uuid id PK
        uuid product_id
        uuid inventory_item_id
    }
    product_recommendation_preferences {
        uuid product_id PK
    }
    product_recommendation_settings {
        text key PK
    }
    product_recommendations {
        uuid product_id PK
        uuid recommended_product_id PK
    }
    products {
        uuid id PK
    }
    profiles {
        uuid id PK
    }
    promotion_products {
        uuid promotion_id PK
        uuid product_id PK
    }
    promotions {
        uuid id PK
    }
    rate_limit_attempts {
        bigint id PK
    }
    sale_returns {
        uuid id PK
        uuid order_id
    }
    seasons {
        uuid id PK
    }
    system_settings {
        text key PK
    }
    whatsapp_config {
        uuid id PK
    }
    auth_users {
        uuid id PK
    }
    profiles o|--o{ audit_logs : "user_id"
    profiles o|--o{ business_hours : "updated_by"
    cash_sessions ||--o{ cash_movements : "cash_session_id"
    profiles ||--o{ cash_movements : "created_by"
    orders o|--o{ cash_movements : "order_id"
    cash_registers ||--o{ cash_sessions : "cash_register_id"
    profiles o|--o{ cash_sessions : "closed_by"
    profiles ||--o{ cash_sessions : "opened_by"
    customization_options ||--o{ customization_option_inventory_requirements : "customization_option_id"
    inventory_items ||--o{ customization_option_inventory_requirements : "inventory_item_id"
    products ||--o{ customization_options : "product_id"
    profiles ||--o{ inventory_adjustments : "created_by"
    inventory_items ||--o{ inventory_adjustments : "inventory_item_id"
    profiles ||--o{ inventory_entries : "created_by"
    inventory_items ||--o{ inventory_entries : "inventory_item_id"
    inventory_adjustments o|--o{ inventory_lots : "inventory_adjustment_id"
    inventory_entries o|--o{ inventory_lots : "inventory_entry_id"
    inventory_items ||--o{ inventory_lots : "inventory_item_id"
    profiles o|--o{ inventory_movements : "created_by"
    inventory_items ||--o{ inventory_movements : "inventory_item_id"
    inventory_lots o|--o{ inventory_movements : "lot_id"
    inventory_items ||--o{ inventory_reservations : "inventory_item_id"
    orders ||--o{ inventory_reservations : "order_id"
    profiles ||--o{ inventory_waste : "created_by"
    inventory_items ||--o{ inventory_waste : "inventory_item_id"
    inventory_lots o|--o{ inventory_waste : "lot_id"
    profiles o|--o{ notifications : "read_by"
    orders ||--o{ order_deletion_requests : "order_id"
    profiles ||--o{ order_deletion_requests : "requested_by"
    profiles o|--o{ order_deletion_requests : "reviewed_by"
    profiles o|--o{ order_discounts : "created_by"
    orders ||--o{ order_discounts : "order_id"
    promotions o|--o{ order_discounts : "promotion_id"
    orders ||--o{ order_items : "order_id"
    products o|--o{ order_items : "product_id"
    profiles o|--o{ orders : "cancelled_by"
    customers o|--o{ orders : "customer_id"
    profiles o|--o{ orders : "schedule_updated_by"
    profiles o|--o{ payment_qr_config : "updated_by"
    profiles o|--o{ payments : "confirmed_by"
    orders ||--o{ payments : "order_id"
    payment_qr_config o|--o{ payments : "qr_config_id"
    profiles o|--o{ payments : "rejected_by"
    products ||--o{ product_components : "component_product_id"
    products ||--o{ product_components : "parent_product_id"
    products ||--o{ product_images : "product_id"
    inventory_items ||--o{ product_inventory_requirements : "inventory_item_id"
    products ||--o{ product_inventory_requirements : "product_id"
    products ||--o| product_recommendation_preferences : "product_id"
    profiles ||--o{ product_recommendation_preferences : "updated_by"
    profiles o|--o| product_recommendation_settings : "updated_by"
    products ||--o{ product_recommendations : "product_id"
    products ||--o{ product_recommendations : "recommended_product_id"
    profiles ||--o{ product_recommendations : "updated_by"
    categories o|--o{ products : "category_id"
    seasons o|--o{ products : "season_id"
    auth_users ||--o| profiles : "id"
    products ||--o{ promotion_products : "product_id"
    promotions ||--o{ promotion_products : "promotion_id"
    profiles ||--o{ sale_returns : "created_by"
    orders ||--o{ sale_returns : "order_id"
    profiles o|--o{ system_settings : "updated_by"
    profiles o|--o{ whatsapp_config : "updated_by"
~~~

## 8. Límites y hallazgos para continuar

1. El master omite extensiones funcionales posteriores —invitados/recibos, dos QR, reintegros, recomendaciones, dedicatorias, receta y horario—. Debe tratarse como historia y no como script de instalación actual.
2. Los defaults del SQL no se contrastaron con pg_attrdef; tampoco los cuerpos desplegados con hashes. Una auditoría remota separada debe repetir un catálogo de sólo lectura y revisar ledger, Storage y drift.
3. product_images no tiene CHECK de máximo 10 ni UNIQUE por sort_order y el catálogo local no registra trigger de cuota: la concurrencia de altas de imágenes depende del handler y no quedó certificada aquí.
4. El contenido de arrays/JSON depende de validación procedural; agregar campos libres no crea automáticamente FK ni un modelo de entrega estructurado.
5. Extensiones pg_cron/Vault/pg_stat_statements presentes en la plataforma local no prueban que existan tareas programadas, un uso de Vault o monitoreo operativo configurado por esta aplicación.
6. No se infiere integridad de datos reales, backups restaurables o seguridad productiva sólo por observar estructura y código.
