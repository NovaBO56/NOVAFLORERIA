# 06 · Modelado UML del sistema observado

## 1. Criterio del modelo

Los diagramas describen la implementación actual leída, no un diseño ideal futuro. Los datos estructurales se contrastaron con el catálogo de PostgreSQL del laboratorio local; los cuerpos de negocio proceden de las últimas migraciones versionadas. No se probó cada escenario ni se certificó producción. El modelo entidad-relación completo de las 38 tablas y 63 FK está en [04](04-base-de-datos.md); aquí se seleccionan elementos para explicar responsabilidades y flujos.

El código es principalmente funcional: componentes React, hooks, funciones TypeScript y procedimientos PL/pgSQL. Los recuadros de datos del diagrama de clases son una proyección UML de tablas y alias de tipos; no significan que existan clases Java/TypeScript, métodos de ORM o repositorios orientados a objetos. Los métodos se agrupan sólo en módulos que realmente exportan funciones.

Mermaid se utiliza para clases y secuencia; PlantUML para casos de uso, actividades y componentes. Se conserva el código fuente del diagrama, sin afirmar que haya sido renderizado por una herramienta UML en esta auditoría. Cada leyenda separa relación de datos, dependencia de llamada y decisión de negocio.

## 2. Actores y frontera

| Actor | Participación real | Límite |
|---|---|---|
| Visitante | Explora catálogo, detalle, favoritos, promociones y carrito. | Favoritos/carrito son del navegador; no hay cuenta pública sincronizada. |
| Comprador invitado | Añade datos de contacto, crea pedido, reporta pago, consulta seguimiento y recibo. | No usa registro/login de comprador; pedido/celular o token autorizan las consultas correspondientes. |
| Personal activo | Accede con correo y contraseña a operaciones permitidas por su rol. | Empleado y administrador son valores de profiles.role. Las capacidades administrativas tienen guardas adicionales. |
| Empleado activo | Atiende pedidos, confirma/rechaza pagos y opera venta/caja según los endpoints. | No se le adjudica toda acción de configuración por compartir el layout. |
| Administrador activo | Opera lo anterior y acciones reservadas: personal, configuración, devoluciones y auditoría, según API. | No equivale a usuario anónimo ni a service_role; los procedimientos sensibles verifican actor activo. |
| Supabase Auth | Proveedor técnico de identidad/sesión del personal. | No implica una función de cuentas para compradores. |

La transferencia bancaria sucede fuera del sistema; la tienda revisa el banco manualmente. WhatsApp abre un enlace con texto preparado y el usuario decide enviarlo. Ninguno se representa como integración automática de confirmación bancaria o envío de mensajes.

## 3. Diagrama de casos de uso

Las especializaciones representan permisos funcionales compartidos. La casilla de confirmación del horario registra la confirmación obtenida por el personal; el comprador sólo lee su estado desde seguimiento. La inclusión señala trabajo indispensable de un caso de uso; la extensión, una opción condicionada.

~~~plantuml
@startuml
left to right direction
actor Visitante as V
actor "Comprador invitado" as C
actor "Personal activo" as P
actor "Empleado activo" as E
actor "Administrador activo" as A
actor "Supabase Auth" as AUTH
V <|-- C
P <|-- E
E <|-- A
rectangle "Floristería Anabelle" {
  usecase "Explorar catálogo y producto" as UC1
  usecase "Guardar favoritos locales" as UC2
  usecase "Gestionar carrito" as UC3
  usecase "Personalizar y escribir dedicatorias" as UC4
  usecase "Elegir promoción opcional" as UC5
  usecase "Crear pedido invitado" as UC6
  usecase "Validar precio, receta, stock y modalidad" as UC7
  usecase "Reservar materiales" as UC8
  usecase "Reportar pago QR" as UC9
  usecase "Consultar seguimiento y horario" as UC10
  usecase "Obtener recibo por token" as UC11
  usecase "Iniciar/cerrar sesión" as UC12
  usecase "Atender pedido y avanzar preparación" as UC13
  usecase "Confirmar/rechazar pago tras revisión" as UC14
  usecase "Proponer/confirmar horario" as UC15
  usecase "Registrar venta y operar caja" as UC16
  usecase "Gestionar catálogo, recetas e inventario" as UC17
  usecase "Consultar clientes y reportes permitidos" as UC18
  usecase "Administrar personal y configuración" as UC19
  usecase "Registrar devoluciones/reintegros" as UC20
  usecase "Consultar auditoría" as UC21
  usecase "Resolver complementos recomendados" as UC22
}
V --> UC1
V --> UC2
V --> UC3
V --> UC22
C --> UC4
C --> UC5
C --> UC6
C --> UC9
C --> UC10
C --> UC11
UC4 ..> UC3 : <<extend>>
UC5 ..> UC6 : <<extend>>
UC6 ..> UC7 : <<include>>
UC6 ..> UC8 : <<include>>
P --> UC12
AUTH --> UC12
E --> UC13
E --> UC14
E --> UC15
E --> UC16
E --> UC17
E --> UC18
A --> UC19
A --> UC20
A --> UC21
note bottom of UC17
 Acciones de escritura concretas sujetas
 a permisos del endpoint; no todos los
 submódulos admiten el mismo rol.
end note
note bottom of UC8
 Total positivo: reserva temporal.
 Total cero: consumo y confirmación
 en la misma operación SQL.
end note
@enduml
~~~

No se incluyen registro de comprador, contraseña pública, asignación de repartidor, pasarela bancaria ni facturación fiscal, porque no se encontraron como capacidades operativas. Ver RF propuestos en [05](05-requerimientos.md) para posibles ampliaciones separadas.

## 4. Diagrama de clases: datos y módulos existentes

Es una vista reducida. Los atributos seleccionados son nombres reales; numeric se simplifica a decimal en UML. Las FK nullable generan multiplicidad 0..1. Aunque SQL permite que un pedido tenga cero artículos estructuralmente, create_order valida al menos uno: por eso la asociación se dibuja 0..* y la regla de negocio se explica fuera del esquema. Los campos JSON no se convierten en tablas ficticias.

~~~mermaid
classDiagram
  class profiles {
    <<table>>
    uuid id
    text full_name
    text role
    boolean is_active
  }
  class customers {
    <<table>>
    uuid id
    text name
    text phone
    text whatsapp
  }
  class products {
    <<table>>
    uuid id
    text name
    decimal price
    boolean is_active
    boolean is_available
  }
  class orders {
    <<table>>
    uuid id
    bigint order_number
    uuid customer_id
    text guest_name
    text guest_phone
    text order_type
    text status
    decimal subtotal
    decimal discount_total
    decimal total
    jsonb request_contract
    timestamptz reserved_until
    timestamptz scheduled_for
    text schedule_status
    integer schedule_revision
  }
  class order_items {
    <<table>>
    uuid id
    uuid order_id
    uuid product_id
    text product_name_snapshot
    decimal unit_price_snapshot
    decimal quantity
    decimal line_total
    jsonb personalization
    jsonb dedications
    jsonb recipe_snapshot
  }
  class payments {
    <<table>>
    uuid id
    uuid order_id
    text method
    decimal amount
    text status
    text qr_slot
    text qr_label
  }
  class inventory_items {
    <<table>>
    uuid id
    text name
    text item_type
    decimal current_stock
  }
  class inventory_reservations {
    <<table>>
    uuid id
    uuid order_id
    uuid inventory_item_id
    decimal quantity
    text status
    timestamptz expires_at
  }
  class inventory_lots {
    <<table>>
    uuid id
    uuid inventory_item_id
    decimal initial_quantity
    decimal remaining_quantity
    timestamptz received_at
  }
  class promotions {
    <<table>>
    uuid id
    text name
    text promotion_type
    text discount_type
    decimal discount_value
    decimal combo_price
  }
  class promotion_products {
    <<table>>
    uuid promotion_id
    uuid product_id
    decimal quantity
  }
  class cash_sessions {
    <<table>>
    uuid id
    uuid cash_register_id
    uuid opened_by
    text status
    decimal opening_amount
    decimal expected_amount
    decimal counted_amount
  }
  class cash_movements {
    <<table>>
    uuid id
    uuid cash_session_id
    uuid order_id
    text movement_type
    text payment_method
    decimal amount
  }
  class CartItem {
    <<TypeScript_type>>
    string id
    string name
    number price
    string image
    number quantity
    boolean available
    Array options
    Array dedications
  }
  class CheckoutDetails {
    <<Zod_inferred_type>>
    string customer_name
    string customer_phone
    string delivery
    string address
    string reference
    string notes
    string promotion_id
  }
  class PublicOrder {
    <<TypeScript_DTO>>
    string id
    number order_number
    string status
    number total
    string payment_status
    string scheduled_for
    string schedule_status
    Array items
  }
  class CartLogic {
    <<TypeScript_module>>
    +sanitizeCart(raw) CartItem[]
    +addItem(items, product, quantity) CartItem[]
    +changeItemQuantity(items, id, quantity) CartItem[]
    +removeItem(items, id) CartItem[]
    +cartTotal(items) number
  }
  class CheckoutContract {
    <<TypeScript_module>>
    +orderPayload(items, details, key) object
    +publicRequest(url, body) Promise
    +readCheckoutDraft(storage) CheckoutDetails
    +saveCheckoutDraft(storage, details) void
  }
  class OrderProcedures {
    <<PLpgSQL_module_projection>>
    +create_order(customer, items, key, promotion) uuid
    +report_payment_qr(order, phone, slot) table
    +confirm_payment(payment) void
    +advance_order_status(order, new_status) void
    +set_order_schedule(order, when, status, revision, confirmed) integer
  }
  customers "0..1" <-- "0..*" orders : customer_id
  orders "1" <-- "0..*" order_items : order_id
  products "0..1" <-- "0..*" order_items : product_id
  orders "1" <-- "0..*" payments : order_id
  orders "1" <-- "0..*" inventory_reservations : order_id
  inventory_items "1" <-- "0..*" inventory_reservations : inventory_item_id
  inventory_items "1" <-- "0..*" inventory_lots : inventory_item_id
  promotions "1" <-- "0..*" promotion_products : promotion_id
  products "1" <-- "0..*" promotion_products : product_id
  profiles "0..1" <-- "0..*" orders : schedule_updated_by
  profiles "1" <-- "0..*" cash_sessions : opened_by
  cash_sessions "1" <-- "0..*" cash_movements : cash_session_id
  orders "0..1" <-- "0..*" cash_movements : order_id
  CartLogic ..> CartItem : inputs and outputs
  CheckoutContract ..> CartItem : serializes
  CheckoutContract ..> CheckoutDetails : validates
  CheckoutContract ..> PublicOrder : reads public summary
  OrderProcedures ..> orders : transactional operations
  OrderProcedures ..> payments : review state
  OrderProcedures ..> inventory_reservations : reserves or consumes
~~~

OrderProcedures es una agrupación documental de funciones de public, no una clase implementada. Las firmas del dibujo se abreviaron por legibilidad: el [diccionario](ANEXO-diccionario-estructural.md) conserva argumentos, tipos, retornos y ACL completos. Las tablas no tienen métodos adjuntos. product_id de una línea histórica puede ser NULL por ON DELETE SET NULL, mientras sus snapshots permanecen.

## 5. Diagrama de secuencia: pedido online y revisión de pago

El envío HTTP recibe un UUID, y la recuperación posterior consulta un resumen autorizado por celular; no se trata de un login. El camino total cero termina sin crear pago. El diagrama separa el aviso del comprador de la confirmación del personal.

~~~mermaid
sequenceDiagram
  actor C as Comprador invitado
  participant UI as Catálogo / Carrito / Checkout
  participant LS as Storage local y sesión
  participant API as Next Route Handlers
  participant SQL as PostgreSQL RPC / triggers
  actor BANK as Banco fuera de la aplicación
  actor E as Personal activo
  C->>UI: Elegir artículos, opciones, dedicatorias y promoción opcional
  UI->>LS: Guardar carrito / selección / borrador
  UI->>API: POST /api/products/availability
  API->>SQL: Consultar necesidad agregada y stock disponible
  SQL-->>UI: Disponibilidad vigente vía API
  C->>UI: Datos de contacto, modalidad y revisión
  UI->>LS: Conservar clave e intención de reintento
  UI->>API: POST /api/orders con clave, items y promoción
  API->>API: Limitar intentos, validar Zod y disponibilidad de entrega
  API->>SQL: service_role RPC create_order (7 argumentos)
  SQL->>SQL: Advisory lock de clave / contrato estable
  alt Misma clave y mismo contrato ya procesado
    SQL-->>API: UUID del pedido existente
  else Nueva intención válida
    SQL->>SQL: Horarios, productos, opciones, receta y bloqueos de inventario
    SQL->>SQL: Precios y promoción autoritativos; snapshots e ítems
    SQL->>SQL: Reservar necesidades agregadas por 30 minutos
    alt Total igual a cero
      SQL->>SQL: Consumir reservas, materializar cliente y confirmar
      Note over SQL: Sin pago ni movimiento de caja ficticio
    else Total positivo
      SQL->>SQL: Dejar pedido pendiente_pago
    end
    SQL-->>API: UUID del pedido creado
  end
  API-->>UI: 201 con order_id
  UI->>LS: Guardar recuperación; quitar intento/borrador; vaciar carrito
  UI->>API: POST /api/orders/track con ID y celular
  API->>SQL: track_order_details + horario autenticado
  opt Lectura opcional de imágenes
    API->>SQL: Metadatos actuales; sin cambiar snapshots financieros
  end
  API-->>UI: Resumen, estado y horario propuesto/confirmado
  alt Total positivo y pedido pendiente de pago
    C->>BANK: Transferencia manual usando QR elegido
    BANK-->>C: Resultado externo a la aplicación
    C->>UI: Ya pagué
    UI->>API: POST /api/orders/{id}/payment con celular y qr_slot
    API->>SQL: service_role RPC report_payment_qr
    SQL->>SQL: Bloquear pedido, validar teléfono, estado, reserva y monto
    SQL->>SQL: Reusar/crear pago pendiente y snapshot QR; mantener reserva
    SQL-->>UI: Aviso registrado vía API
    Note over UI,C: WhatsApp abre borrador; el comprador decide enviarlo
    E->>BANK: Revisar transferencia por el canal externo del banco
    E->>API: POST /api/admin/payments/{id}/confirm con sesión
    API->>API: Comprobar empleado/administrador activo
    API->>SQL: RPC confirm_payment con identidad del personal
    SQL->>SQL: Bloquear, consumir FIFO, confirmar pago y pedido; asociar cliente
    SQL-->>E: Resultado vía API y avisos persistentes según triggers
    C->>API: Actualizar seguimiento con ID/número y celular
    API-->>C: Pedido confirmado / en preparación / listo / finalizado
  else Total cero
    UI-->>C: Pedido confirmado, no requiere transferencia
  end
~~~

Errores de JSON, permisos, modalidad, stock, receta, horario o promoción abortan antes de una creación aceptada. Una misma clave con contrato distinto se rechaza. Si se pierde la respuesta, el navegador mantiene la intención para recuperar el pedido; un cambio de promoción en otra pestaña no debe reemplazar la promoción del intento pendiente restaurado. El camino de rechazo de pago se resume en actividades y su endpoint propio, no se confunde con un fallo de transferencia conocido por el sistema.

## 6. Diagrama de actividades: proceso de compra

La expiración se aplica cuando una rutina de negocio invoca release_expired_reservations; la existencia de la extensión pg_cron en el laboratorio no demuestra un job configurado. El cliente no elige libremente un horario confirmado en el checkout: el personal lo programa posteriormente.

~~~plantuml
@startuml
start
:Explorar catálogo y detalle;
:Seleccionar cantidades, opciones y dedicatorias;
:Revisar carrito y disponibilidad;
if (¿Elegir promoción?) then (sí)
  :Seleccionar una oferta opcional;
  if (¿Sigue aplicable?) then (sí)
    :Mostrar beneficio estimado;
  else (no)
    :Mostrar motivo y oferta no aplicada;
    :Quitar/cambiar o continuar sin promoción;
  endif
endif
:Ingresar nombre, celular y modalidad;
if (¿Entrega habilitada cuando se solicita?) then (sí)
  :Revisar datos, artículos y total estimado;
else (no)
  :Informar y permitir cambiar a recojo;
  stop
endif
:Enviar intención idempotente a API;
:Validación y transacción SQL autoritativas;
if (¿Solicitud aceptada?) then (no)
  :Mostrar error y conservar información para corregir/reintentar;
  stop
else (sí)
  :Guardar número/recuperación del pedido;
endif
if (¿Total igual a cero?) then (sí)
  :Consumir reserva y confirmar sin pago;
else (no)
  :Pedido pendiente de pago con reserva temporal;
  if (¿Reserva vigente al reportar?) then (no)
    :Rechazar aviso; revisión/contacto con tienda;
    stop
  else (sí)
    :Transferir fuera de la aplicación;
    :Reportar QR y esperar revisión del personal;
    :Mantener reserva durante revisión;
  endif
  if (¿Personal confirma tras revisar banco?) then (sí)
    :Confirmar pago y consumir stock;
    :Materializar cliente y confirmar pedido;
  else (rechaza)
    :Registrar rechazo y liberar reserva según procedimiento;
    :Mostrar estado y contacto con tienda;
    stop
  endif
endif
:Personal puede proponer/confirmar horario;
:Avanzar confirmado -> en_preparacion -> listo -> finalizado;
:Comprador consulta seguimiento y recibo permitido;
stop
@enduml
~~~

El cese de una actividad en un error significa fin de ese intento, no pérdida de carrito o borrado del pedido. Cancelación/devolución son casos adicionales administrativos documentados en 03/04; no se inventa un botón público de cancelación. Los pasos de preparación son transiciones SQL estrictas; no un motor externo de reparto.

## 7. Diagrama de componentes

El límite servidor/cliente es relevante: la clave privilegiada permanece en servidor y los RPC públicos de negocio están concedidos a service_role en el catálogo local. El personal usa cliente Supabase con sesión propia para operaciones que verifican auth.uid(). Las flechas son dependencias técnicas, no clases de negocio.

~~~plantuml
@startuml
skinparam componentStyle rectangle
package "Navegador" {
  [UI pública React] as PUBLIC
  [UI administrativa React] as ADMIN
  [Carrito / favoritos / selección / borrador / recuperación] as LOCAL
  PUBLIC --> LOCAL : almacenamiento local/sesión
}
package "Servidor Next.js App Router" {
  [Layouts / páginas / proxy] as ROUTER
  [Route Handlers públicos y privados] as API
  [Zod / permisos / rate-limit / mensajes] as GUARDS
  [Cliente Supabase con cookies] as SESSION
  [Cliente Supabase privilegiado] as SERVICE
  [Normalización Sharp / validación de archivos] as SHARP
  [Generación de PDF] as PDF
  ROUTER --> SESSION
  ROUTER --> GUARDS
  API --> GUARDS
  API --> SESSION
  API --> SERVICE
  API --> SHARP
  API --> PDF
}
package "Supabase" {
  [Auth] as AUTH
  [PostgREST / RPC] as REST
  database "PostgreSQL\nTablas / RLS / PLpgSQL / triggers" as DB
  [Storage\nImágenes públicas / avatar privado] as STORAGE
  REST --> DB
}
cloud "WhatsApp\nEnlace a borrador, envío humano" as WA
cloud "Banco\nTransferencia y revisión manual fuera de la app" as BANK
PUBLIC --> ROUTER : navegación
ADMIN --> ROUTER : navegación
PUBLIC --> API : fetch HTTP
ADMIN --> API : fetch HTTP con sesión
SESSION --> AUTH : identidad/sesión del personal
SESSION --> REST : rol authenticated
SERVICE --> REST : service_role sólo servidor
SERVICE --> STORAGE : carga/lectura autorizada
SHARP --> STORAGE : bytes normalizados a través del handler
PUBLIC --> STORAGE : URL de imagen pública
ADMIN --> API : avatar privado propio
PUBLIC --> WA : abrir enlace
note bottom of BANK
 Sin webhook/pasarela bancaria
 encontrado en el código.
end note
note bottom of DB
 El esquema efectivo local fue leído.
 Los cuerpos SQL se documentan desde
 migraciones, sin ejecutar negocio.
end note
@enduml
~~~

No se encontró Prisma/ORM, GraphQL, Redux, microservicios propios separados, una cola de trabajos como componente explícito ni un motor 3D operativo. La presencia de librerías o extensiones por sí sola no demuestra una función activa. Storage es un servicio real; los buckets/formatos declarados se distinguen de su despliegue en 04.

## 8. Trazabilidad y límites

| Elemento del modelo | Fuente comprobada |
|---|---|
| Identidad, roles y perfil activo | [src/lib/auth/permissions.ts:77](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/permissions.ts:77>) |
| Datos públicos PublicProduct/PublicOrder | [src/lib/public/types.ts:85](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/types.ts:85>) |
| CartItem y funciones puras | [src/lib/public/cart-logic.ts:12](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/cart-logic.ts:12>) |
| CheckoutDetails y contrato de serialización | [src/lib/public/checkout.ts:18](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/checkout.ts:18>) |
| Restauración/reintento y reporte de pago | [src/components/public/checkout-page.tsx:127](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-page.tsx:127>) |
| Creación HTTP y llamada privilegiada | [src/app/api/orders/route.ts:12](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts:12>) |
| Disponibilidad agregada | [src/app/api/products/availability/route.ts:11](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/availability/route.ts:11>) |
| Creación SQL, snapshots y reserva | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:48>) |
| Total cero y confirmación de pago | [supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:669](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:669>) |
| Reporte QR y snapshot | [supabase/migrations/20261012000100_two_payment_qr.sql:66](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261012000100_two_payment_qr.sql:66>) |
| Seguimiento y enriquecimiento opcional de imagen | [src/app/api/orders/track/route.ts:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/track/route.ts:8>) |
| Autorización administrativa de confirmación | [src/app/api/admin/payments/[id]/confirm/route.ts:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/confirm/route.ts:8>) |
| Rechazo de pago y liberación | [src/app/api/admin/payments/[id]/reject/route.ts:9](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/reject/route.ts:9>) |
| Transiciones de preparación | [supabase/migrations/20261007000300_security_rpc_hardening.sql:402](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261007000300_security_rpc_hardening.sql:402>) |
| Programación administrativa | [src/app/api/admin/orders/[id]/schedule/route.ts:7](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/schedule/route.ts:7>) |
| Última corrección de seguridad de programación | [supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261025000100_order_schedule_rls_fix.sql:6>) |
| Receta histórica capturada por trigger | [supabase/migrations/20261024000200_order_management_details.sql:64](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261024000200_order_management_details.sql:64>) |
| Expiración invocada por procedimientos | [supabase/migrations/20261008180000_production_round_one.sql:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261008180000_production_round_one.sql:3>) |
| Avatar con Storage privado | [src/app/api/admin/profile/avatar/route.ts:19](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts:19>) |
| Guardas de acceso a API y sesión | [src/proxy.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts:1>) |
| Cliente servidor privilegiado | [src/lib/supabase/admin.ts:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/admin.ts:3>) |
| PDF de recibo | [src/app/api/orders/receipt/[token]/route.tsx:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/receipt/[token]/route.tsx:8>) |

Las 63 FK, columnas seleccionadas, roles EXECUTE, triggers y multiplicidades se derivan del [catálogo local verificado](ANEXO-catalogo-local-verificado.json) y del [diccionario estructural](ANEXO-diccionario-estructural.md). Los diagramas no añaden métodos a tablas, no representan datos personales reales y no sustituyen una prueba de extremo a extremo. Para ejecución previa, cobertura y límites de pruebas, consultar 09.
