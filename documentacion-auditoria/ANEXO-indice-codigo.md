# Anexo: índice completo de rutas y código

Estado auditado: rama desarrollo-auditoria, HEAD 7ec66ffc00b0270c878b139bb3bcbd0f91bd84fd; incluye cambios locales.
Este índice se generó recorriendo sintaxis de 308 archivos fuente. La presencia de una ruta, función o importación no acredita su operación. Los documentos temáticos aportan análisis y límites.

## Páginas

| Ruta | Archivo |
| --- | --- |
| /admin/auditoria | [src/app/admin/auditoria/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/auditoria/page.tsx>) |
| /admin/caja | [src/app/admin/caja/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/caja/page.tsx>) |
| /admin/categorias | [src/app/admin/categorias/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/categorias/page.tsx>) |
| /admin/clientes | [src/app/admin/clientes/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/clientes/page.tsx>) |
| /admin/configuracion | [src/app/admin/configuracion/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/configuracion/page.tsx>) |
| /admin/inventario | [src/app/admin/inventario/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/inventario/page.tsx>) |
| /admin | [src/app/admin/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/page.tsx>) |
| /admin/pedidos | [src/app/admin/pedidos/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/pedidos/page.tsx>) |
| /admin/productos | [src/app/admin/productos/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/productos/page.tsx>) |
| /admin/promociones | [src/app/admin/promociones/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/promociones/page.tsx>) |
| /admin/prueba-ui | [src/app/admin/prueba-ui/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/prueba-ui/page.tsx>) |
| /admin/reportes | [src/app/admin/reportes/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/reportes/page.tsx>) |
| /admin/temporadas | [src/app/admin/temporadas/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/temporadas/page.tsx>) |
| /admin/usuarios | [src/app/admin/usuarios/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/usuarios/page.tsx>) |
| /admin/ventas | [src/app/admin/ventas/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/ventas/page.tsx>) |
| /checkout | [src/app/checkout/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/checkout/page.tsx>) |
| /login | [src/app/login/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx>) |
| / | [src/app/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/page.tsx>) |
| /prueba-cliente | [src/app/prueba-cliente/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/prueba-cliente/page.tsx>) |
| /seguimiento | [src/app/seguimiento/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/seguimiento/page.tsx>) |

## APIs

| Ruta | Métodos y líneas | Archivo |
| --- | --- | --- |
| /api/admin-check | GET:5 | [src/app/api/admin-check/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin-check/route.ts>) |
| /api/admin/audit-log | GET:6 | [src/app/api/admin/audit-log/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/audit-log/route.ts>) |
| /api/admin/business-hours/[dayOfWeek] | PATCH:8 | [src/app/api/admin/business-hours/[dayOfWeek]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/business-hours/[dayOfWeek]/route.ts>) |
| /api/admin/business-hours | GET:5 | [src/app/api/admin/business-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/business-hours/route.ts>) |
| /api/admin/cash-registers | GET:5 | [src/app/api/admin/cash-registers/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-registers/route.ts>) |
| /api/admin/cash-sessions/[id]/close | POST:8 | [src/app/api/admin/cash-sessions/[id]/close/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/[id]/close/route.ts>) |
| /api/admin/cash-sessions/[id]/movements | GET:11, POST:35 | [src/app/api/admin/cash-sessions/[id]/movements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/[id]/movements/route.ts>) |
| /api/admin/cash-sessions | GET:13, POST:41 | [src/app/api/admin/cash-sessions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/route.ts>) |
| /api/admin/categories/[id] | PATCH:10 | [src/app/api/admin/categories/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/categories/[id]/route.ts>) |
| /api/admin/categories | GET:8, POST:33 | [src/app/api/admin/categories/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/categories/route.ts>) |
| /api/admin/customers/[id] | GET:12, PATCH:51 | [src/app/api/admin/customers/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/customers/[id]/route.ts>) |
| /api/admin/customers | GET:9, POST:65 | [src/app/api/admin/customers/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/customers/route.ts>) |
| /api/admin/dashboard | GET:9 | [src/app/api/admin/dashboard/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/dashboard/route.ts>) |
| /api/admin/deletion-requests/[id]/review | POST:8 | [src/app/api/admin/deletion-requests/[id]/review/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/deletion-requests/[id]/review/route.ts>) |
| /api/admin/deletion-requests | GET:5 | [src/app/api/admin/deletion-requests/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/deletion-requests/route.ts>) |
| /api/admin/inventory/adjustments | GET:7, POST:38 | [src/app/api/admin/inventory/adjustments/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/adjustments/route.ts>) |
| /api/admin/inventory/entries | GET:8, POST:39 | [src/app/api/admin/inventory/entries/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/entries/route.ts>) |
| /api/admin/inventory/items/[id] | PATCH:12 | [src/app/api/admin/inventory/items/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/items/[id]/route.ts>) |
| /api/admin/inventory/items | GET:20, POST:61 | [src/app/api/admin/inventory/items/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/items/route.ts>) |
| /api/admin/inventory/lots | GET:8 | [src/app/api/admin/inventory/lots/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/lots/route.ts>) |
| /api/admin/inventory/movements | GET:9 | [src/app/api/admin/inventory/movements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/movements/route.ts>) |
| /api/admin/inventory/waste | GET:8, POST:36 | [src/app/api/admin/inventory/waste/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/waste/route.ts>) |
| /api/admin/notifications/[id]/read | POST:7 | [src/app/api/admin/notifications/[id]/read/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/notifications/[id]/read/route.ts>) |
| /api/admin/notifications | GET:5 | [src/app/api/admin/notifications/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/notifications/route.ts>) |
| /api/admin/orders/[id]/cancel | POST:9 | [src/app/api/admin/orders/[id]/cancel/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/cancel/route.ts>) |
| /api/admin/orders/[id]/deletion-request | POST:8 | [src/app/api/admin/orders/[id]/deletion-request/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/deletion-request/route.ts>) |
| /api/admin/orders/[id]/history | GET:8 | [src/app/api/admin/orders/[id]/history/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/history/route.ts>) |
| /api/admin/orders/[id]/receipt | GET:29 | [src/app/api/admin/orders/[id]/receipt/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/receipt/route.tsx>) |
| /api/admin/orders/[id]/returns | GET:8, POST:32 | [src/app/api/admin/orders/[id]/returns/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/returns/route.ts>) |
| /api/admin/orders/[id] | GET:19 | [src/app/api/admin/orders/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/route.ts>) |
| /api/admin/orders/[id]/schedule | POST:7 | [src/app/api/admin/orders/[id]/schedule/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/schedule/route.ts>) |
| /api/admin/orders/[id]/status | POST:8 | [src/app/api/admin/orders/[id]/status/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/status/route.ts>) |
| /api/admin/orders | GET:17 | [src/app/api/admin/orders/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/route.ts>) |
| /api/admin/payment-qr | POST:12, GET:91, PATCH:101 | [src/app/api/admin/payment-qr/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payment-qr/route.ts>) |
| /api/admin/payments/[id]/confirm | POST:8 | [src/app/api/admin/payments/[id]/confirm/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/confirm/route.ts>) |
| /api/admin/payments/[id]/reject | POST:9 | [src/app/api/admin/payments/[id]/reject/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/reject/route.ts>) |
| /api/admin/payments | GET:11 | [src/app/api/admin/payments/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/route.ts>) |
| /api/admin/product-recommendations/preview | GET:5 | [src/app/api/admin/product-recommendations/preview/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/product-recommendations/preview/route.ts>) |
| /api/admin/product-recommendations | GET:7, PUT:16 | [src/app/api/admin/product-recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/product-recommendations/route.ts>) |
| /api/admin/products/[id]/components/[componentId] | PATCH:24, DELETE:66 | [src/app/api/admin/products/[id]/components/[componentId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/components/[componentId]/route.ts>) |
| /api/admin/products/[id]/components | GET:19, POST:46 | [src/app/api/admin/products/[id]/components/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/components/route.ts>) |
| /api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/[requirementId] | PATCH:14, DELETE:146 | [src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/[requirementId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/[requirementId]/route.ts>) |
| /api/admin/products/[id]/customization-options/[optionId]/inventory-requirements | GET:76, POST:150, PATCH:304, DELETE:465 | [src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/route.ts>) |
| /api/admin/products/[id]/customization-options/[optionId] | PATCH:10, DELETE:54 | [src/app/api/admin/products/[id]/customization-options/[optionId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/route.ts>) |
| /api/admin/products/[id]/customization-options | GET:10, POST:37 | [src/app/api/admin/products/[id]/customization-options/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/route.ts>) |
| /api/admin/products/[id]/images/[imageId] | PATCH:15, DELETE:57 | [src/app/api/admin/products/[id]/images/[imageId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/[imageId]/route.ts>) |
| /api/admin/products/[id]/images/reorder | PATCH:14 | [src/app/api/admin/products/[id]/images/reorder/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/reorder/route.ts>) |
| /api/admin/products/[id]/images | GET:29, POST:128 | [src/app/api/admin/products/[id]/images/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/route.ts>) |
| /api/admin/products/[id]/inventory-requirements/[requirementId] | PATCH:8, DELETE:48 | [src/app/api/admin/products/[id]/inventory-requirements/[requirementId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/inventory-requirements/[requirementId]/route.ts>) |
| /api/admin/products/[id]/inventory-requirements | GET:13, POST:41 | [src/app/api/admin/products/[id]/inventory-requirements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/inventory-requirements/route.ts>) |
| /api/admin/products/[id]/publication | GET:5 | [src/app/api/admin/products/[id]/publication/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/publication/route.ts>) |
| /api/admin/products/[id]/recommendations | GET:13, PUT:40, PATCH:41 | [src/app/api/admin/products/[id]/recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/recommendations/route.ts>) |
| /api/admin/products/[id] | PATCH:35 | [src/app/api/admin/products/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/route.ts>) |
| /api/admin/products | GET:10, POST:91 | [src/app/api/admin/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/route.ts>) |
| /api/admin/profile/avatar | GET:18, PUT:35, DELETE:49 | [src/app/api/admin/profile/avatar/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts>) |
| /api/admin/promotions/[id]/products/[productId] | PATCH:8, DELETE:47 | [src/app/api/admin/promotions/[id]/products/[productId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/products/[productId]/route.ts>) |
| /api/admin/promotions/[id]/products | GET:13, POST:36 | [src/app/api/admin/promotions/[id]/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/products/route.ts>) |
| /api/admin/promotions/[id] | PATCH:22 | [src/app/api/admin/promotions/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/route.ts>) |
| /api/admin/promotions | GET:20, POST:53 | [src/app/api/admin/promotions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/route.ts>) |
| /api/admin/reports/cancellations | GET:12 | [src/app/api/admin/reports/cancellations/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/cancellations/route.tsx>) |
| /api/admin/reports/cash | GET:12 | [src/app/api/admin/reports/cash/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/cash/route.tsx>) |
| /api/admin/reports/customers | GET:23 | [src/app/api/admin/reports/customers/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/customers/route.tsx>) |
| /api/admin/reports/inventory | GET:22 | [src/app/api/admin/reports/inventory/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/inventory/route.tsx>) |
| /api/admin/reports/products-sold | GET:17 | [src/app/api/admin/reports/products-sold/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/products-sold/route.tsx>) |
| /api/admin/reports/sales | GET:19 | [src/app/api/admin/reports/sales/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/sales/route.tsx>) |
| /api/admin/reports/waste | GET:19 | [src/app/api/admin/reports/waste/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/waste/route.tsx>) |
| /api/admin/sales | POST:6 | [src/app/api/admin/sales/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/sales/route.ts>) |
| /api/admin/seasons/[id] | PATCH:10 | [src/app/api/admin/seasons/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/seasons/[id]/route.ts>) |
| /api/admin/seasons | GET:8, POST:33 | [src/app/api/admin/seasons/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/seasons/route.ts>) |
| /api/admin/store-location | GET:6, PATCH:12 | [src/app/api/admin/store-location/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/store-location/route.ts>) |
| /api/admin/storefront-media | POST:8 | [src/app/api/admin/storefront-media/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/storefront-media/route.ts>) |
| /api/admin/system-settings/accept-orders-outside-hours | PATCH:6 | [src/app/api/admin/system-settings/accept-orders-outside-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/system-settings/accept-orders-outside-hours/route.ts>) |
| /api/admin/system-settings | GET:8, PATCH:49 | [src/app/api/admin/system-settings/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/system-settings/route.ts>) |
| /api/admin/users/[id]/role | PATCH:16 | [src/app/api/admin/users/[id]/role/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/[id]/role/route.ts>) |
| /api/admin/users/[id]/status | PATCH:16 | [src/app/api/admin/users/[id]/status/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/[id]/status/route.ts>) |
| /api/admin/users/create | POST:13 | [src/app/api/admin/users/create/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/create/route.ts>) |
| /api/admin/users | GET:5 | [src/app/api/admin/users/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/route.ts>) |
| /api/admin/whatsapp-config | POST:6, GET:40, PATCH:49 | [src/app/api/admin/whatsapp-config/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/whatsapp-config/route.ts>) |
| /api/business-hours | GET:6 | [src/app/api/business-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/business-hours/route.ts>) |
| /api/categories | GET:4 | [src/app/api/categories/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/categories/route.ts>) |
| /api/orders/[id]/payment | POST:10 | [src/app/api/orders/[id]/payment/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/[id]/payment/route.ts>) |
| /api/orders/receipt/[token] | GET:8 | [src/app/api/orders/receipt/[token]/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/receipt/[token]/route.tsx>) |
| /api/orders | POST:12 | [src/app/api/orders/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts>) |
| /api/orders/track | POST:8 | [src/app/api/orders/track/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/track/route.ts>) |
| /api/payment-qr | GET:6 | [src/app/api/payment-qr/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/payment-qr/route.ts>) |
| /api/products/[id]/recommendations | GET:4 | [src/app/api/products/[id]/recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/[id]/recommendations/route.ts>) |
| /api/products/[id] | GET:25 | [src/app/api/products/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/[id]/route.ts>) |
| /api/products/availability | POST:11 | [src/app/api/products/availability/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/availability/route.ts>) |
| /api/products | GET:11 | [src/app/api/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/route.ts>) |
| /api/promotions | GET:19 | [src/app/api/promotions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/promotions/route.ts>) |
| /api/seasons | GET:4 | [src/app/api/seasons/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/seasons/route.ts>) |
| /api/store-location | GET:5 | [src/app/api/store-location/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/store-location/route.ts>) |
| /api/storefront-media | GET:4 | [src/app/api/storefront-media/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/storefront-media/route.ts>) |
| /api/visual-preview | GET:10 | [src/app/api/visual-preview/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/visual-preview/route.ts>) |
| /api/whatsapp-config | GET:5 | [src/app/api/whatsapp-config/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/whatsapp-config/route.ts>) |

## Archivos fuente, componentes y funciones identificadas

| Archivo | Líneas | Funciones nombradas (línea) |
| --- | --- | --- |
| [src/app/admin/auditoria/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/auditoria/page.tsx>) | 10 | AuditPage:6 |
| [src/app/admin/caja/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/caja/page.tsx>) | 35 | AdminCashPage:9 |
| [src/app/admin/categorias/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/categorias/page.tsx>) | 20 | AdminCategoriesPage:6 |
| [src/app/admin/clientes/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/clientes/page.tsx>) | 8 | ClientesPage:3 |
| [src/app/admin/configuracion/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/configuracion/page.tsx>) | 13 | ConfigurationPage:9 |
| [src/app/admin/inventario/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/inventario/page.tsx>) | 15 | AdminInventoryPage:6 |
| [src/app/admin/layout.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/layout.tsx>) | 66 | AdminLayout:19 |
| [src/app/admin/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/page.tsx>) | 18 | AdminDashboardPage:5 |
| [src/app/admin/pedidos/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/pedidos/page.tsx>) | 32 | AdminOrdersPage:10 |
| [src/app/admin/productos/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/productos/page.tsx>) | 19 | AdminProductsPage:5 |
| [src/app/admin/promociones/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/promociones/page.tsx>) | 27 | AdminPromotionsPage:9 |
| [src/app/admin/prueba-ui/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/prueba-ui/page.tsx>) | 157 | PruebaUiPage:39, showPreview:41 |
| [src/app/admin/reportes/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/reportes/page.tsx>) | 20 | AdminReportsPage:6 |
| [src/app/admin/temporadas/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/temporadas/page.tsx>) | 20 | AdminSeasonsPage:6 |
| [src/app/admin/usuarios/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/usuarios/page.tsx>) | 21 | AdminUsersPage:6 |
| [src/app/admin/ventas/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/ventas/page.tsx>) | 35 | AdminSalesPage:9 |
| [src/app/api/admin-check/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin-check/route.ts>) | 32 | GET:5 |
| [src/app/api/admin/audit-log/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/audit-log/route.ts>) | 103 | GET:6, ids:54, recordIds:58 |
| [src/app/api/admin/business-hours/[dayOfWeek]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/business-hours/[dayOfWeek]/route.ts>) | 56 | PATCH:8 |
| [src/app/api/admin/business-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/business-hours/route.ts>) | 14 | GET:5 |
| [src/app/api/admin/cash-registers/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-registers/route.ts>) | 26 | GET:5 |
| [src/app/api/admin/cash-sessions/[id]/close/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/[id]/close/route.ts>) | 43 | POST:8 |
| [src/app/api/admin/cash-sessions/[id]/movements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/[id]/movements/route.ts>) | 75 | GET:11, POST:35 |
| [src/app/api/admin/cash-sessions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/cash-sessions/route.ts>) | 74 | GET:13, POST:41 |
| [src/app/api/admin/categories/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/categories/[id]/route.ts>) | 67 | PATCH:10 |
| [src/app/api/admin/categories/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/categories/route.ts>) | 75 | GET:8, POST:33 |
| [src/app/api/admin/customers/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/customers/[id]/route.ts>) | 96 | GET:12, PATCH:51 |
| [src/app/api/admin/customers/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/customers/route.ts>) | 128 | GET:9, POST:65 |
| [src/app/api/admin/dashboard/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/dashboard/route.ts>) | 50 | GET:9 |
| [src/app/api/admin/deletion-requests/[id]/review/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/deletion-requests/[id]/review/route.ts>) | 46 | POST:8 |
| [src/app/api/admin/deletion-requests/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/deletion-requests/route.ts>) | 36 | GET:5 |
| [src/app/api/admin/inventory/adjustments/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/adjustments/route.ts>) | 74 | GET:7, POST:38 |
| [src/app/api/admin/inventory/entries/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/entries/route.ts>) | 83 | GET:8, POST:39 |
| [src/app/api/admin/inventory/items/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/items/[id]/route.ts>) | 68 | PATCH:12 |
| [src/app/api/admin/inventory/items/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/items/route.ts>) | 104 | withStockStatus:10, GET:20, POST:61 |
| [src/app/api/admin/inventory/lots/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/lots/route.ts>) | 65 | GET:8 |
| [src/app/api/admin/inventory/movements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/movements/route.ts>) | 59 | GET:9 |
| [src/app/api/admin/inventory/waste/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/inventory/waste/route.ts>) | 79 | GET:8, POST:36 |
| [src/app/api/admin/notifications/[id]/read/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/notifications/[id]/read/route.ts>) | 33 | POST:7 |
| [src/app/api/admin/notifications/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/notifications/route.ts>) | 35 | GET:5 |
| [src/app/api/admin/orders/[id]/cancel/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/cancel/route.ts>) | 45 | POST:9 |
| [src/app/api/admin/orders/[id]/deletion-request/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/deletion-request/route.ts>) | 42 | POST:8 |
| [src/app/api/admin/orders/[id]/history/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/history/route.ts>) | 36 | GET:8 |
| [src/app/api/admin/orders/[id]/receipt/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/receipt/route.tsx>) | 99 | renderReceiptPdf:25, GET:29 |
| [src/app/api/admin/orders/[id]/returns/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/returns/route.ts>) | 73 | GET:8, POST:32 |
| [src/app/api/admin/orders/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/route.ts>) | 46 | GET:19 |
| [src/app/api/admin/orders/[id]/schedule/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/schedule/route.ts>) | 25 | POST:7 |
| [src/app/api/admin/orders/[id]/status/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/status/route.ts>) | 42 | POST:8 |
| [src/app/api/admin/orders/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/route.ts>) | 69 | GET:17, buildQuery:30 |
| [src/app/api/admin/payment-qr/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payment-qr/route.ts>) | 113 | POST:12, GET:91, PATCH:101 |
| [src/app/api/admin/payments/[id]/confirm/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/confirm/route.ts>) | 31 | POST:8 |
| [src/app/api/admin/payments/[id]/reject/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/[id]/reject/route.ts>) | 45 | POST:9 |
| [src/app/api/admin/payments/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/payments/route.ts>) | 37 | GET:11 |
| [src/app/api/admin/product-recommendations/preview/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/product-recommendations/preview/route.ts>) | 12 | GET:5 |
| [src/app/api/admin/product-recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/product-recommendations/route.ts>) | 26 | GET:7, PUT:16 |
| [src/app/api/admin/products/[id]/components/[componentId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/components/[componentId]/route.ts>) | 147 | PATCH:24, DELETE:66 |
| [src/app/api/admin/products/[id]/components/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/components/route.ts>) | 125 | GET:19, POST:46 |
| [src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/[requirementId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/[requirementId]/route.ts>) | 255 | PATCH:14, DELETE:146 |
| [src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/inventory-requirements/route.ts>) | 593 | verifyOptionBelongsToProduct:31, GET:76, POST:150, PATCH:304, DELETE:465 |
| [src/app/api/admin/products/[id]/customization-options/[optionId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/[optionId]/route.ts>) | 79 | PATCH:10, DELETE:54 |
| [src/app/api/admin/products/[id]/customization-options/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/customization-options/route.ts>) | 82 | GET:10, POST:37 |
| [src/app/api/admin/products/[id]/images/[imageId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/[imageId]/route.ts>) | 104 | PATCH:15, DELETE:57 |
| [src/app/api/admin/products/[id]/images/reorder/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/reorder/route.ts>) | 86 | PATCH:14 |
| [src/app/api/admin/products/[id]/images/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/route.ts>) | 407 | GET:29, POST:128 |
| [src/app/api/admin/products/[id]/inventory-requirements/[requirementId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/inventory-requirements/[requirementId]/route.ts>) | 74 | PATCH:8, DELETE:48 |
| [src/app/api/admin/products/[id]/inventory-requirements/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/inventory-requirements/route.ts>) | 110 | GET:13, POST:41 |
| [src/app/api/admin/products/[id]/publication/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/publication/route.ts>) | 13 | GET:5 |
| [src/app/api/admin/products/[id]/recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/recommendations/route.ts>) | 42 | preference:8, GET:13, update:25, PUT:40, PATCH:41 |
| [src/app/api/admin/products/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/route.ts>) | 98 | normalizeBody:14, PATCH:35 |
| [src/app/api/admin/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/route.ts>) | 142 | GET:10, POST:91 |
| [src/app/api/admin/profile/avatar/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts>) | 59 | json:8, actor:10, sameOrigin:13, GET:18, PUT:35, DELETE:49 |
| [src/app/api/admin/promotions/[id]/products/[productId]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/products/[productId]/route.ts>) | 72 | PATCH:8, DELETE:47 |
| [src/app/api/admin/promotions/[id]/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/products/route.ts>) | 159 | GET:13, POST:36 |
| [src/app/api/admin/promotions/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/[id]/route.ts>) | 239 | fail:18, PATCH:22 |
| [src/app/api/admin/promotions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/route.ts>) | 142 | fail:16, GET:20, POST:53 |
| [src/app/api/admin/reports/cancellations/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/cancellations/route.tsx>) | 71 | renderCancellationsPdf:8, GET:12 |
| [src/app/api/admin/reports/cash/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/cash/route.tsx>) | 72 | renderCashPdf:8, GET:12 |
| [src/app/api/admin/reports/customers/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/customers/route.tsx>) | 90 | renderCustomersPdf:14, GET:23 |
| [src/app/api/admin/reports/inventory/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/inventory/route.tsx>) | 78 | withStockStatus:12, renderInventoryPdf:18, GET:22 |
| [src/app/api/admin/reports/products-sold/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/products-sold/route.tsx>) | 76 | renderProductsSoldPdf:13, GET:17 |
| [src/app/api/admin/reports/sales/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/sales/route.tsx>) | 68 | renderSalesReportPdf:15, GET:19 |
| [src/app/api/admin/reports/waste/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/waste/route.tsx>) | 80 | renderWastePdf:8, GET:19 |
| [src/app/api/admin/sales/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/sales/route.ts>) | 48 | POST:6 |
| [src/app/api/admin/seasons/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/seasons/[id]/route.ts>) | 64 | PATCH:10 |
| [src/app/api/admin/seasons/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/seasons/route.ts>) | 80 | GET:8, POST:33 |
| [src/app/api/admin/store-location/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/store-location/route.ts>) | 20 | GET:6, PATCH:12 |
| [src/app/api/admin/storefront-media/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/storefront-media/route.ts>) | 31 | POST:8 |
| [src/app/api/admin/system-settings/accept-orders-outside-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/system-settings/accept-orders-outside-hours/route.ts>) | 45 | PATCH:6 |
| [src/app/api/admin/system-settings/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/system-settings/route.ts>) | 152 | GET:8, PATCH:49 |
| [src/app/api/admin/users/[id]/role/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/[id]/role/route.ts>) | 73 | PATCH:16 |
| [src/app/api/admin/users/[id]/status/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/[id]/status/route.ts>) | 73 | PATCH:16 |
| [src/app/api/admin/users/create/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/create/route.ts>) | 98 | POST:13 |
| [src/app/api/admin/users/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/route.ts>) | 44 | GET:5 |
| [src/app/api/admin/whatsapp-config/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/whatsapp-config/route.ts>) | 59 | POST:6, GET:40, PATCH:49 |
| [src/app/api/business-hours/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/business-hours/route.ts>) | 56 | GET:6 |
| [src/app/api/categories/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/categories/route.ts>) | 23 | GET:4 |
| [src/app/api/orders/[id]/payment/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/[id]/payment/route.ts>) | 70 | POST:10 |
| [src/app/api/orders/receipt/[token]/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/receipt/[token]/route.tsx>) | 24 | GET:8, unavailable:11 |
| [src/app/api/orders/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts>) | 112 | requestsHomeDelivery:8, POST:12 |
| [src/app/api/orders/track/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/track/route.ts>) | 78 | POST:8 |
| [src/app/api/payment-qr/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/payment-qr/route.ts>) | 39 | GET:6 |
| [src/app/api/products/[id]/recommendations/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/[id]/recommendations/route.ts>) | 11 | GET:4 |
| [src/app/api/products/[id]/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/[id]/route.ts>) | 63 | GET:25 |
| [src/app/api/products/availability/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/availability/route.ts>) | 22 | POST:11 |
| [src/app/api/products/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/products/route.ts>) | 86 | GET:11 |
| [src/app/api/promotions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/promotions/route.ts>) | 92 | GET:19 |
| [src/app/api/seasons/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/seasons/route.ts>) | 23 | GET:4 |
| [src/app/api/store-location/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/store-location/route.ts>) | 12 | GET:5 |
| [src/app/api/storefront-media/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/storefront-media/route.ts>) | 9 | GET:4 |
| [src/app/api/visual-preview/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/visual-preview/route.ts>) | 21 | GET:10 |
| [src/app/api/whatsapp-config/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/whatsapp-config/route.ts>) | 46 | GET:5 |
| [src/app/checkout/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/checkout/page.tsx>) | 3 | Page:2 |
| [src/app/layout.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/layout.tsx>) | 40 | RootLayout:23 |
| [src/app/login/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx>) | 112 | LoginPage:9, LoginForm:13, handleLogin:22 |
| [src/app/not-found.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/not-found.tsx>) | 44 | NotFound:12 |
| [src/app/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/page.tsx>) | 14 | Page:11 |
| [src/app/prueba-cliente/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/prueba-cliente/page.tsx>) | 1150 | PruebaClientePage:75, addToCart:91, increaseQuantity:111, decreaseQuantity:121, removeFromCart:133, loadProducts:150, loadCategories:185 |
| [src/app/seguimiento/page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/seguimiento/page.tsx>) | 3 | Page:2 |
| [src/components/admin/audit-entries.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/audit-entries.tsx>) | 46 | AuditEntries:10 |
| [src/components/admin/cash/cash-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/cash/cash-panel.tsx>) | 684 | first:26, computeExpectedCash:58, CashPanel:71, load:77, OpenSessionForm:138, load:148, submit:166, OpenSessionPanel:281, submitMovement:304, CloseSessionModal:545, submit:568 |
| [src/components/admin/checkout-configuration.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/checkout-configuration.tsx>) | 91 | api:19, json:25, CheckoutConfiguration:27, save:48, deactivate:55, updateDay:56 |
| [src/components/admin/create-user-form.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/create-user-form.tsx>) | 130 | CreateUserForm:14, handleSubmit:23 |
| [src/components/admin/customers/customer-detail.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/customers/customer-detail.tsx>) | 194 | formatMoney:24, formatDate:31, CustomerDetail:39 |
| [src/components/admin/customers/customer-form.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/customers/customer-form.tsx>) | 192 | CustomerForm:18, submit:42 |
| [src/components/admin/customers/customer-list.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/customers/customer-list.tsx>) | 289 | getInitials:30, CustomerList:39, submitSearch:71 |
| [src/components/admin/customers/customer-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/customers/customer-management.tsx>) | 295 | CustomerManagement:42, loadCustomers:57, openCustomer:103, closeDetail:135, startEditing:140, handleSaved:145, handleDeletedOrDisabled:162 |
| [src/components/admin/dashboard-charts.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/dashboard-charts.tsx>) | 99 | dateLabel:11, compactMoney:12, SalesChart:15, y:23, x:24, OrderStatusDonut:75 |
| [src/components/admin/dashboard-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/dashboard-panel.tsx>) | 124 | range:28, DashboardPanel:34, RecentOrders:105, RecentActivity:113, Activity:121 |
| [src/components/admin/error.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/error.tsx>) | 36 | AdminError:9 |
| [src/components/admin/inventory/inventory-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/inventory/inventory-management.tsx>) | 2052 | formatNumber:148, formatDate:154, statusVariant:161, movementVariant:165, readResponse:171, InventoryManagement:183, openNewItem:414, openEditItem:430, openEntry:448, openWaste:461, openAdjustment:474, saveItem:485, saveEntry:552, saveWaste:617, saveAdjustment:672, supplierName:736 |
| [src/components/admin/layout.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout.tsx>) | 3 |  |
| [src/components/admin/layout/access-denied.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/access-denied.tsx>) | 23 | AccessDenied:7 |
| [src/components/admin/layout/account-disabled.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/account-disabled.tsx>) | 25 | AccountDisabled:8 |
| [src/components/admin/layout/admin-header.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/admin-header.tsx>) | 86 | AdminHeader:26, handleScroll:31 |
| [src/components/admin/layout/admin-mobile-nav.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/admin-mobile-nav.tsx>) | 35 | AdminMobileNav:11 |
| [src/components/admin/layout/admin-nav-list.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/admin-nav-list.tsx>) | 90 | AdminNavList:51 |
| [src/components/admin/layout/admin-sidebar.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/admin-sidebar.tsx>) | 21 | AdminBrand:5, AdminSidebar:14 |
| [src/components/admin/layout/page-motion.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/page-motion.tsx>) | 11 | PageMotion:7 |
| [src/components/admin/layout/profile-avatar.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/profile-avatar.tsx>) | 97 | ProfileAvatar:9, changeOpen:39, choose:46, save:54 |
| [src/components/admin/layout/session-guard.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/session-guard.tsx>) | 61 | SessionGuard:15, goToLogin:41 |
| [src/components/admin/layout/use-sign-out.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/use-sign-out.ts>) | 20 | useSignOut:7, signOut:11 |
| [src/components/admin/notifications.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/notifications.tsx>) | 58 | Notifications:10, markRead:30 |
| [src/components/admin/orders/order-detail-sections.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/orders/order-detail-sections.tsx>) | 84 | OrderProgress:15, OrderPayment:24, OrderContact:32, OrderSchedule:50, OrderComposition:72, OrderHistory:79 |
| [src/components/admin/orders/order-overview.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/orders/order-overview.tsx>) | 24 | OrderOverview:7 |
| [src/components/admin/orders/order-returns.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/orders/order-returns.tsx>) | 59 | OrderReturns:8 |
| [src/components/admin/orders/orders-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/orders/orders-panel.tsx>) | 678 | first:37, OrdersPanel:137, paymentLabel:373, OrderDetailModal:382, refreshDetail:405, load:422, runAction:448 |
| [src/components/admin/payment-qr-configuration.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/payment-qr-configuration.tsx>) | 63 | request:14, PaymentQrConfiguration:20, load:23, QrCard:30, submit:41 |
| [src/components/admin/products/category-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/category-management.tsx>) | 319 | CategoryManagement:35, loadCategories:48, handleInputChange:89, resetForm:99, startEditing:106, handleSubmit:118, toggleCategory:200 |
| [src/components/admin/products/global-product-recommendations.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/global-product-recommendations.tsx>) | 88 | CategoryChoices:13, GlobalProductRecommendations:16, save:38, reload:49 |
| [src/components/admin/products/product-component-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-component-management.tsx>) | 496 | ProductComponentManagement:42, handleAddComponent:124, startEditingComponent:185, cancelEditingComponent:192, handleUpdateComponent:197, handleDeleteComponent:253 |
| [src/components/admin/products/product-form.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-form.tsx>) | 396 | getInitialForm:66, ProductForm:98, updateForm:118, handleSubmit:128 |
| [src/components/admin/products/product-image-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-image-management.tsx>) | 530 | ProductImageManagement:36, handleUpload:97, handleReorder:149, startEditingAltText:219, cancelEditingAltText:225, handleSaveAltText:230, handleDelete:284, openFileSelector:329 |
| [src/components/admin/products/product-inventory-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-inventory-management.tsx>) | 539 | formatQuantity:45, formatUnit:53, ProductInventoryManagement:57, addRequirement:170, updateRequirement:228, deleteRequirement:279 |
| [src/components/admin/products/product-list.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-list.tsx>) | 93 | nameOf:24, ProductStatus:27, ProductActions:33, Thumbnail:50, ProductList:54 |
| [src/components/admin/products/product-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-management.tsx>) | 560 | ProductManagement:82, warn:112, warnNavigation:114, selectTab:123, updateFilter:227, clearFilters:239, handleEdit:244, handleCreate:251, handleCancelEdit:258, handleProductSaved:266, handleToggle:278 |
| [src/components/admin/products/product-publication.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-publication.tsx>) | 43 | ProductPublication:8, publish:23 |
| [src/components/admin/products/product-recommendation-photo.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-recommendation-photo.tsx>) | 21 | ProductPhoto:6 |
| [src/components/admin/products/product-recommendation-picker.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-recommendation-picker.tsx>) | 51 | ProductRecommendationPicker:8 |
| [src/components/admin/products/product-recommendations.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/product-recommendations.tsx>) | 134 | ProductInfo:13, ProductRecommendations:20, save:69 |
| [src/components/admin/products/recommendation-options.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/recommendation-options.ts>) | 40 | recommendationImage:8, recommendationStatus:12, canAddRecommendation:18, moveRecommendation:21, recommendationPreview:32 |
| [src/components/admin/products/resolved-recommendation-preview.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/products/resolved-recommendation-preview.tsx>) | 21 | ResolvedRecommendationPreview:5 |
| [src/components/admin/promotions/promotion-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/promotions/promotion-management.tsx>) | 1295 | request:119, errorMessage:141, formatMoney:145, formatPercent:149, formatDate:153, formatValidity:164, formatBenefit:174, toDateTimeLocal:188, toISOStringOrNull:202, getStatus:214, PromotionManagement:234, updateForm:354, resetForm:360, changeType:367, toggleProduct:376, removeProduct:394, updateQuantity:401, startEditing:410, syncPromotionProducts:461, handleSubmit:528, savePromotion:647, togglePromotion:726 |
| [src/components/admin/reports/reports-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/reports/reports-panel.tsx>) | 627 | todayISO:118, firstDayOfMonthISO:121, ReportsPanel:137, buildUrl:155, loadReport:165, downloadPdf:216, SalesReportView:302, CashReportView:363, InventoryReportView:419, WasteReportView:464, CancellationsReportView:513, CustomersReportView:554, ProductsSoldReportView:591 |
| [src/components/admin/sales/sales-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/sales/sales-panel.tsx>) | 583 | SalesPanel:30, check:38, SaleForm:104, addProduct:187, updateQuantity:200, resetForm:215, submit:227 |
| [src/components/admin/season-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/season-management.tsx>) | 350 | SeasonManagement:37, loadSeasons:48, handleInputChange:83, resetForm:93, startEditing:98, handleSubmit:116, toggleSeason:209, formatDate:252 |
| [src/components/admin/store-location.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/store-location.tsx>) | 27 | StoreLocationConfiguration:12 |
| [src/components/admin/storefront-media-configuration.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/storefront-media-configuration.tsx>) | 38 | StorefrontMediaConfiguration:10, refresh:17, chooseFile:24 |
| [src/components/admin/system-settings.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/system-settings.tsx>) | 199 | SystemSettings:21, loadSettings:31, updateSetting:65 |
| [src/components/admin/user-management.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/user-management.tsx>) | 143 | UserManagement:22, loadUsers:29, updateStatus:64, updateRole:85 |
| [src/components/admin/users-panel.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/users-panel.tsx>) | 16 | UsersPanel:8 |
| [src/components/public/checkout-form.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-form.tsx>) | 60 | CheckoutForm:19, move:34, submit:35, input:48 |
| [src/components/public/checkout-page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-page.tsx>) | 196 | CheckoutPage:33, update:106, startAnotherPurchase:107, refreshOrder:115, run:121, createOrder:127, reportPayment:156 |
| [src/components/public/checkout-payment.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-payment.tsx>) | 25 | CheckoutPayment:9 |
| [src/components/public/checkout-purchase-actions.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-purchase-actions.tsx>) | 14 | CheckoutPurchaseActions:5 |
| [src/components/public/combo-progress.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/combo-progress.tsx>) | 20 | ComboProgress:7 |
| [src/components/public/customer-shell.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/customer-shell.tsx>) | 28 | CustomerShell:9, WaitingFlower:17, CheckoutIntro:21, CheckoutProgress:25 |
| [src/components/public/dedication-card.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/dedication-card.tsx>) | 39 | DedicationPreview:7, DedicationEditor:18, change:25 |
| [src/components/public/home/cart.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/cart.tsx>) | 423 | useCart:48, clearCart:62, updateCartDedications:63, addComboToCart:66, addToCart:73, changeQuantity:88, removeFromCart:95, refreshCartItems:108, useCartAvailability:177, refresh:183, CartDrawer:211, notifyChange:231, close:238 |
| [src/components/public/home/catalog.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/catalog.tsx>) | 329 | ProductCard:29, CatalogSection:153, choose:179 |
| [src/components/public/home/complement-confirmation.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/complement-confirmation.tsx>) | 58 | ComplementConfirmation:10, close:26 |
| [src/components/public/home/header.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/header.tsx>) | 282 | SearchForm:23, handleSubmit:34, SiteHeader:71, submitSearch:88 |
| [src/components/public/home/home-page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/home-page.tsx>) | 651 | sanitize:53, toggleFavorite:61, getJson:78, settled:92, productsUrl:142, mergeUnique:154, HomePage:164, followHash:194, refresh:208, update:226, loadMore:326, selectCategory:437, showPromotions:444, handleSearch:448, handleAdd:454, openQuickView:458, openDetail:463, chooseOfferProduct:470, buildCombo:475, cancelCombo:485, addDetail:491 |
| [src/components/public/home/product-detail.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/product-detail.tsx>) | 309 | ProductDetailSection:45, refresh:75, addSelection:115, clearOffer:141 |
| [src/components/public/home/promotion-section.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/promotion-section.tsx>) | 79 | PromotionSection:11, move:33, choose:34 |
| [src/components/public/home/sections.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/sections.tsx>) | 296 | ClosedBanner:35, HeroSection:56, ServiceStrip:101, AboutSection:148, LocationSection:194, ContactSection:208, SiteFooter:267 |
| [src/components/public/home/shared.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/shared.tsx>) | 116 | scrollToId:26, useDialog:52, focusable:69, onKeyDown:78 |
| [src/components/public/location-card.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/location-card.tsx>) | 48 | MapPreview:9, LocationCard:19 |
| [src/components/public/mobile-navigation.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/mobile-navigation.tsx>) | 20 | MobileNavigation:6, update:9 |
| [src/components/public/order-number-actions.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/order-number-actions.tsx>) | 31 | OrderNumberActions:8, copy:13 |
| [src/components/public/order-summary.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/order-summary.tsx>) | 29 | OrderSummary:12 |
| [src/components/public/payment-report-instructions.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/payment-report-instructions.tsx>) | 4 | PaymentReportInstructions:1 |
| [src/components/public/product-placeholder.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/product-placeholder.tsx>) | 7 | ProductPlaceholder:4 |
| [src/components/public/promotion-cart-summary.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/promotion-cart-summary.tsx>) | 17 | PromotionCartSummary:7 |
| [src/components/public/promotion-chooser.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/promotion-chooser.tsx>) | 78 | promotionChoices:10, PromotionChooser:18 |
| [src/components/public/safe-image.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/safe-image.tsx>) | 14 | SafeImage:5 |
| [src/components/public/shopping-notice.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/shopping-notice.tsx>) | 8 | ShoppingNotice:5 |
| [src/components/public/store-location.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/store-location.tsx>) | 23 | PublicStoreLocation:6 |
| [src/components/public/storefront-media.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/storefront-media.tsx>) | 29 | StorefrontMediaProvider:6, refresh:10, useStorefrontMedia:16, BrandLogo:18, FloralMark:25 |
| [src/components/public/tracking-page.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/tracking-page.tsx>) | 44 | TrackingPage:15, query:37 |
| [src/components/public/use-order-updates.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/use-order-updates.ts>) | 32 | useOrderUpdates:8 |
| [src/components/public/weekly-hours.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/weekly-hours.tsx>) | 18 | WeeklyHours:6 |
| [src/components/ui/badge.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/badge.tsx>) | 155 | Badge:109 |
| [src/components/ui/button.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/button.tsx>) | 176 | Button:139 |
| [src/components/ui/card.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/card.tsx>) | 118 | Card:17, CardHeader:49, CardTitle:59, CardDescription:76, CardContent:89, CardFooter:99 |
| [src/components/ui/empty-state.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/empty-state.tsx>) | 75 | EmptyState:10 |
| [src/components/ui/field.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/field.tsx>) | 207 | Input:41, Textarea:64, Field:110 |
| [src/components/ui/modal.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/modal.tsx>) | 244 | ModalContent:41, ModalHeader:156, ModalTitle:172, ModalDescription:192, ModalFooter:212 |
| [src/components/ui/notice.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/notice.tsx>) | 37 | Notice:23 |
| [src/components/ui/page-header.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/page-header.tsx>) | 89 | PageHeader:10 |
| [src/components/ui/product-image-preview.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/product-image-preview.tsx>) | 20 | ProductImagePreview:7 |
| [src/components/ui/product-thumbnail.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/product-thumbnail.tsx>) | 41 | ProductThumbnail:23 |
| [src/components/ui/section-card.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/section-card.tsx>) | 67 | SectionCard:19 |
| [src/components/ui/stat-card.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/stat-card.tsx>) | 69 | StatCard:15 |
| [src/components/ui/status-dot.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/status-dot.tsx>) | 28 | StatusDot:13 |
| [src/components/ui/table.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/table.tsx>) | 186 | Table:23, TableHeader:44, TableBody:64, TableRow:80, TableHead:107, TableCell:138, TableCaption:162 |
| [src/components/ux/action-bar.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ux/action-bar.tsx>) | 31 | ActionBar:9 |
| [src/components/ux/page-section.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ux/page-section.tsx>) | 24 | PageSection:9 |
| [src/components/ux/responsive-container.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ux/responsive-container.tsx>) | 28 | ResponsiveContainer:9 |
| [src/config/admin-navigation.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/config/admin-navigation.ts>) | 103 | getNavSectionsForRole:87, getAdminHomeHref:95, isNavItemActive:100 |
| [src/config/env.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/config/env.ts>) | 11 |  |
| [src/config/system-settings.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/config/system-settings.ts>) | 18 |  |
| [src/lib/admin/inventory-images.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/admin/inventory-images.ts>) | 44 | inventoryPhotos:18 |
| [src/lib/admin/order-detail.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/admin/order-detail.ts>) | 55 | orderProgress:8, detailPaymentLabel:32, laPazDateTime:40, historyProjection:44 |
| [src/lib/audit-presentation.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/audit-presentation.ts>) | 20 | auditPresentation:3 |
| [src/lib/auth/login-destination.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/login-destination.ts>) | 5 | loginDestination:1 |
| [src/lib/auth/permissions.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/permissions.ts>) | 85 | canUseAdminFunctions:17, canUseEmployeeFunctions:21, getCurrentUserProfile:28, requireActiveUser:53, requireAdmin:67, requireEmployeeOrAdmin:77 |
| [src/lib/business-date.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/business-date.ts>) | 9 | businessDate:2, businessDayStart:6 |
| [src/lib/db/read-all-pages.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/db/read-all-pages.ts>) | 17 | readAllPages:5 |
| [src/lib/errors.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/errors.ts>) | 15 |  |
| [src/lib/format.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/format.ts>) | 28 | formatMoney:2, formatDateTime:10, formatDate:21 |
| [src/lib/inventory/user-names.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/inventory/user-names.ts>) | 34 | attachUserNames:12 |
| [src/lib/money.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/money.ts>) | 9 | cents:2, sumMoney:6 |
| [src/lib/notice-presentation.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/notice-presentation.ts>) | 7 | friendlyErrorMessage:2 |
| [src/lib/notification-presentation.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/notification-presentation.ts>) | 25 | notificationMessage:3, notificationPresentation:11 |
| [src/lib/payment-qr-file.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/payment-qr-file.ts>) | 12 | paymentQrExtension:3, starts:6 |
| [src/lib/product-image-file.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/product-image-file.ts>) | 11 | optimizeProductImage:4 |
| [src/lib/product-images.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/product-images.ts>) | 15 | primaryProductImage:8 |
| [src/lib/product-recommendations.server.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/product-recommendations.server.ts>) | 24 | recommendationProducts:6, resolvedRecommendations:18 |
| [src/lib/profile-avatar.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/profile-avatar.ts>) | 42 | readAvatarBody:11, normalizeAvatar:32 |
| [src/lib/promotions/fixed-discount.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/promotions/fixed-discount.ts>) | 63 | toCents:20, formatMoney:24, findCheapestProduct:29, findFixedDiscountViolation:47, fixedDiscountMessage:58 |
| [src/lib/public/cart-logic.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/cart-logic.ts>) | 192 | clampQuantity:37, sanitizeCart:45, addItem:91, addCartBatch:134, changeItemQuantity:147, removeItem:161, cartCount:165, cartTotal:169, hasUnavailable:173, buildOrderMessage:178 |
| [src/lib/public/cart-promotions.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/cart-promotions.ts>) | 48 | cents:4, cartPromotion:9 |
| [src/lib/public/checkout.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/checkout.ts>) | 82 | orderPayload:18, publicRequest:36, singleFlight:44, requiresPayment:53, reachedConfirmation:57, checkoutStep:60, readCheckoutDraft:67, saveCheckoutDraft:70, hasCheckoutDraft:73, clearCheckoutSession:76 |
| [src/lib/public/client-id.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/client-id.ts>) | 9 | clientId:2 |
| [src/lib/public/dedications.server.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/dedications.server.ts>) | 10 | dedicationCardCount:4 |
| [src/lib/public/dedications.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/dedications.ts>) | 25 | resizeDedications:18, hasDedication:22 |
| [src/lib/public/format.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/format.ts>) | 148 | formatMoney:15, formatTime:20, pickImage:27, isPurchasable:32, initials:39, promotionBenefit:50, formatDay:64, promotionValidity:78, acceptingOrders:93, todayHoursLabel:100, orderedWeek:121, dayHoursLabel:129, whatsappLink:139 |
| [src/lib/public/local-store.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/local-store.ts>) | 94 | createLocalStore:19, load:31, get:41, emit:52, update:56, subscribe:70, onStorage:73, useValue:89 |
| [src/lib/public/location-map.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/location-map.ts>) | 32 | locationMapLinks:4 |
| [src/lib/public/order-contact.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/order-contact.ts>) | 10 | orderContact:4 |
| [src/lib/public/order-error.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/order-error.ts>) | 16 | publicOrderError:2 |
| [src/lib/public/order-item-images.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/order-item-images.ts>) | 37 | identity:13, withOrderItemImages:19 |
| [src/lib/public/order-journey.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/order-journey.ts>) | 48 | orderDelivery:4, orderJourney:12, orderGuide:24, journeyMessage:28, downloadOrderGuide:43 |
| [src/lib/public/payment-notice.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/payment-notice.ts>) | 8 | paymentNotice:5 |
| [src/lib/public/payment-qrs.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/payment-qrs.ts>) | 21 | qrSlotLabel:4, selectedPaymentQr:6, readPaymentQrSelection:12, savePaymentQrSelection:18 |
| [src/lib/public/phone.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/phone.ts>) | 11 | phoneInput:6, internationalBoliviaPhone:7 |
| [src/lib/public/previous-purchase.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/previous-purchase.ts>) | 21 | readPreviousPurchase:9, beginAnotherPurchase:13 |
| [src/lib/public/product-availability.server.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/product-availability.server.ts>) | 25 | productAvailability:7, withProductAvailability:20 |
| [src/lib/public/promotion-selection.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/promotion-selection.ts>) | 18 | sanitize:8, selectPromotion:12, checkoutPromotionId:15 |
| [src/lib/public/promotion-shopping.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/promotion-shopping.ts>) | 41 | promotionIsCurrent:6, canBuildCombo:10, promotionProgress:17, promotionPricePreview:33 |
| [src/lib/public/storefront-media.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/storefront-media.ts>) | 12 | publicStorefrontMedia:6, url:9 |
| [src/lib/public/types.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/types.ts>) | 94 |  |
| [src/lib/rate-limit.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/rate-limit.ts>) | 86 | getClientIp:34, checkRateLimit:54, rateLimitResponse:77 |
| [src/lib/reports/cancellations-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/cancellations-report-pdf.tsx>) | 73 | CancellationsReportDocument:22 |
| [src/lib/reports/cash-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/cash-report-pdf.tsx>) | 67 | CashReportDocument:24 |
| [src/lib/reports/customers-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/customers-report-pdf.tsx>) | 59 | CustomersReportDocument:21 |
| [src/lib/reports/inventory-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/inventory-report-pdf.tsx>) | 71 | InventoryReportDocument:23 |
| [src/lib/reports/order-receipt-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/order-receipt-pdf.tsx>) | 130 | FloralSprig:24, OrderReceiptDocument:52 |
| [src/lib/reports/products-sold-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/products-sold-report-pdf.tsx>) | 66 | ProductsSoldReportDocument:20 |
| [src/lib/reports/sales-ledger.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/sales-ledger.ts>) | 54 | salesTotals:15, readSalesLedger:48 |
| [src/lib/reports/sales-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/sales-report-pdf.tsx>) | 102 | SalesReportDocument:37 |
| [src/lib/reports/waste-report-pdf.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/reports/waste-report-pdf.tsx>) | 63 | WasteReportDocument:22 |
| [src/lib/supabase/admin.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/admin.ts>) | 19 | createAdminClient:3 |
| [src/lib/supabase/client.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/client.ts>) | 9 | createClient:3 |
| [src/lib/supabase/proxy.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/proxy.ts>) | 91 | updateSession:4, getAll:14, setAll:17 |
| [src/lib/supabase/server.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/server.ts>) | 28 | createClient:4, getAll:13, setAll:16 |
| [src/lib/utils.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/utils.ts>) | 2 |  |
| [src/lib/visual-preview/catalog.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/visual-preview/catalog.ts>) | 42 | visualCatalogResponse:12, ok:14, fail:15 |
| [src/lib/visual-preview/config.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/visual-preview/config.ts>) | 10 | visualPreviewEnabled:1 |
| [src/proxy.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts>) | 34 | proxy:6 |
| [src/types/index.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/types/index.ts>) | 1 |  |
| [src/validations/audit.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/audit.ts>) | 12 |  |
| [src/validations/cash-register.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/cash-register.ts>) | 48 |  |
| [src/validations/categories.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/categories.ts>) | 17 |  |
| [src/validations/database-values.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/database-values.ts>) | 39 | hasPrecision:8 |
| [src/validations/index.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/index.ts>) | 3 |  |
| [src/validations/inventory-queries.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/inventory-queries.ts>) | 28 |  |
| [src/validations/inventory.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/inventory.ts>) | 52 |  |
| [src/validations/notifications-and-hours.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/notifications-and-hours.ts>) | 18 |  |
| [src/validations/order-list.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/order-list.ts>) | 11 |  |
| [src/validations/order-schedule.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/order-schedule.ts>) | 20 | scheduleInstant:17 |
| [src/validations/orders.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/orders.ts>) | 34 |  |
| [src/validations/payments.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/payments.ts>) | 20 |  |
| [src/validations/product-components.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/product-components.ts>) | 10 |  |
| [src/validations/product-images-detail.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/product-images-detail.ts>) | 5 |  |
| [src/validations/product-images.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/product-images.ts>) | 8 |  |
| [src/validations/product-recipe.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/product-recipe.ts>) | 64 |  |
| [src/validations/product-recommendations.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/product-recommendations.ts>) | 11 | ids:2 |
| [src/validations/products.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/products.ts>) | 72 |  |
| [src/validations/promotions.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/promotions.ts>) | 357 | toNumberOrNull:22, toNumberOrUndefined:32, hasMaxDecimals:38, requiredPositiveMoney:45, datesAreOrdered:108 |
| [src/validations/public-catalog.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/public-catalog.ts>) | 34 |  |
| [src/validations/reports.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/reports.ts>) | 29 |  |
| [src/validations/sale-returns.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/sale-returns.ts>) | 18 |  |
| [src/validations/sales.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/sales.ts>) | 38 |  |
| [src/validations/seasons.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/seasons.ts>) | 33 | dateOrder:3 |
| [src/validations/store-location.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/store-location.ts>) | 31 | isMapsUrl:3, coordinate:6, mapsDestination:16, storeMapPreview:21 |
| [src/validations/users.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/users.ts>) | 31 |  |
| [src/validations/whatsapp.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/whatsapp.ts>) | 8 |  |

Las funciones anónimas y callbacks sin nombre no se listan individualmente. El JSON adjunto incluye imports, exports, llamadas literales a APIs, RPC y tablas para trazabilidad. No se incluyeron valores de entorno ni archivos privados.
