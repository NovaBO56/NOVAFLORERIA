# Anexo · Catálogo de los 77 archivos de prueba

Inventario del árbol auditado: 66 .ts, 8 .tsx y 3 .mjs. Los tres .mjs también importan Vitest; no se clasifican por extensión como pruebas Node independientes. La ejecución previa de 77 archivos / 838 casos se documenta en 09-pruebas.md.

Las marcas de este índice se obtienen por inspección estática y pueden superponerse: mock, SSR de markup o lectura de contratos de fuente. Un nombre como production/certification no significa ejecución contra producción. Las pruebas que invocan handlers con Supabase simulado no sustituyen PostgreSQL, RLS ni navegador real.

| Archivo | Casos reportados en log previo | Mocks vi.mock | Markup SSR | Inspección de archivos/contratos |
|---|---|---|---|---|
| [__tests__/admin-navigation.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/admin-navigation.test.ts>) | 7 | 0 | No detectado | No detectado |
| [__tests__/admin-user-bootstrap.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/admin-user-bootstrap.test.ts>) | 2 | 2 | No detectado | No detectado |
| [__tests__/audit-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/audit-validations.test.ts>) | 6 | 0 | No detectado | No detectado |
| [__tests__/backend-remaining.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/backend-remaining.test.ts>) | 13 | 1 | No detectado | No detectado |
| [__tests__/backup.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/backup.test.ts>) | 4 | 0 | No detectado | Sí |
| [__tests__/base.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/base.test.ts>) | 1 | 0 | No detectado | No detectado |
| [__tests__/cart-promotions.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/cart-promotions.test.ts>) | 16 | 0 | No detectado | No detectado |
| [__tests__/cash-register-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/cash-register-validations.test.ts>) | 11 | 0 | No detectado | No detectado |
| [__tests__/catalog-demo.test.mjs](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/catalog-demo.test.mjs>) | 7 | 0 | No detectado | No detectado |
| [__tests__/catalog-design.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/catalog-design.test.tsx>) | 9 | 2 | Sí | No detectado |
| [__tests__/certification-round-three.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/certification-round-three.test.ts>) | 64 | 5 | No detectado | No detectado |
| [__tests__/certification-round-two-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/certification-round-two-api.test.ts>) | 29 | 3 | No detectado | No detectado |
| [__tests__/checkout-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout-api.test.ts>) | 35 | 3 | No detectado | No detectado |
| [__tests__/checkout-confirmation-session.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout-confirmation-session.test.ts>) | 37 | 0 | No detectado | No detectado |
| [__tests__/checkout-final-experience.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout-final-experience.test.ts>) | 10 | 1 | Sí | No detectado |
| [__tests__/checkout-payment-ui.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout-payment-ui.test.ts>) | 6 | 0 | Sí | No detectado |
| [__tests__/checkout.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout.test.ts>) | 9 | 0 | No detectado | No detectado |
| [__tests__/combo-experience.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/combo-experience.test.tsx>) | 4 | 1 | Sí | No detectado |
| [__tests__/complement-cart-prices.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/complement-cart-prices.test.ts>) | 2 | 2 | No detectado | No detectado |
| [__tests__/customer-order-summary.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/customer-order-summary.test.ts>) | 19 | 1 | Sí | No detectado |
| [__tests__/dashboard-visual.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/dashboard-visual.test.ts>) | 5 | 0 | Sí | No detectado |
| [__tests__/dedications.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/dedications.test.tsx>) | 22 | 0 | Sí | No detectado |
| [__tests__/delivery-availability-admin.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/delivery-availability-admin.test.ts>) | 3 | 2 | No detectado | No detectado |
| [__tests__/delivery-availability-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/delivery-availability-api.test.ts>) | 3 | 3 | No detectado | No detectado |
| [__tests__/free-checkout.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/free-checkout.test.ts>) | 2 | 0 | No detectado | No detectado |
| [__tests__/global-product-recommendations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/global-product-recommendations.test.ts>) | 9 | 3 | No detectado | No detectado |
| [__tests__/Inventory queries.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/Inventory queries.test.ts>) | 10 | 0 | No detectado | No detectado |
| [__tests__/inventory-images.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/inventory-images.test.ts>) | 9 | 0 | No detectado | No detectado |
| [__tests__/inventory-refunds-dashboard.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/inventory-refunds-dashboard.test.ts>) | 22 | 0 | No detectado | No detectado |
| [__tests__/inventory-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/inventory-validations.test.ts>) | 15 | 0 | No detectado | No detectado |
| [__tests__/lab50-catalog.test.mjs](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/lab50-catalog.test.mjs>) | 5 | 0 | No detectado | No detectado |
| [__tests__/location-card.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/location-card.test.ts>) | 12 | 0 | Sí | No detectado |
| [__tests__/login-prerender.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/login-prerender.test.tsx>) | 1 | 2 | Sí | No detectado |
| [__tests__/manual-backup.test.mjs](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/manual-backup.test.mjs>) | 13 | 0 | No detectado | Sí |
| [__tests__/notice-presentation.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/notice-presentation.test.ts>) | 4 | 0 | No detectado | No detectado |
| [__tests__/notifications-and-hours-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/notifications-and-hours-validations.test.ts>) | 8 | 0 | No detectado | No detectado |
| [__tests__/order-item-images.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/order-item-images.test.ts>) | 5 | 0 | No detectado | No detectado |
| [__tests__/order-journey.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/order-journey.test.ts>) | 13 | 0 | No detectado | No detectado |
| [__tests__/order-management-details.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/order-management-details.test.ts>) | 15 | 2 | No detectado | No detectado |
| [__tests__/order-schedule-rls-contract.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/order-schedule-rls-contract.test.ts>) | 3 | 0 | No detectado | Sí |
| [__tests__/orders-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/orders-validations.test.ts>) | 13 | 0 | No detectado | No detectado |
| [__tests__/payments-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/payments-validations.test.ts>) | 5 | 0 | No detectado | No detectado |
| [__tests__/permissions.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/permissions.test.ts>) | 8 | 0 | No detectado | No detectado |
| [__tests__/product-availability-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/product-availability-api.test.ts>) | 13 | 3 | No detectado | No detectado |
| [__tests__/product-image-cleanup.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/product-image-cleanup.test.ts>) | 3 | 3 | No detectado | No detectado |
| [__tests__/product-recipe-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/product-recipe-validations.test.ts>) | 13 | 0 | No detectado | No detectado |
| [__tests__/product-recommendations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/product-recommendations.test.ts>) | 10 | 2 | No detectado | No detectado |
| [__tests__/product-thumbnail.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/product-thumbnail.test.tsx>) | 3 | 0 | Sí | No detectado |
| [__tests__/production-round-one.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/production-round-one.test.ts>) | 15 | 0 | No detectado | No detectado |
| [__tests__/products-listing-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/products-listing-validations.test.ts>) | 15 | 0 | No detectado | No detectado |
| [__tests__/profile-avatar.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/profile-avatar.test.ts>) | 12 | 2 | No detectado | No detectado |
| [__tests__/promotion-fixed-discount.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/promotion-fixed-discount.test.ts>) | 11 | 0 | No detectado | No detectado |
| [__tests__/promotion-selection.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/promotion-selection.test.ts>) | 7 | 2 | No detectado | No detectado |
| [__tests__/promotion-shopping.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/promotion-shopping.test.ts>) | 13 | 2 | Sí | No detectado |
| [__tests__/promotion-ux.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/promotion-ux.test.ts>) | 7 | 2 | Sí | No detectado |
| [__tests__/promotions-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/promotions-validations.test.ts>) | 38 | 0 | No detectado | No detectado |
| [__tests__/public-catalog-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/public-catalog-validations.test.ts>) | 11 | 0 | No detectado | No detectado |
| [__tests__/public-home.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/public-home.test.ts>) | 38 | 0 | No detectado | No detectado |
| [__tests__/public-media-route.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/public-media-route.test.ts>) | 2 | 1 | No detectado | No detectado |
| [__tests__/public-promotions-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/public-promotions-api.test.ts>) | 4 | 2 | No detectado | No detectado |
| [__tests__/public-sections.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/public-sections.test.ts>) | 11 | 2 | Sí | No detectado |
| [__tests__/qa30-corrections.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/qa30-corrections.test.tsx>) | 8 | 2 | Sí | No detectado |
| [__tests__/rate-limit.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/rate-limit.test.ts>) | 11 | 0 | No detectado | No detectado |
| [__tests__/recommendation-options.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/recommendation-options.test.ts>) | 9 | 0 | No detectado | No detectado |
| [__tests__/reports-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/reports-validations.test.ts>) | 6 | 0 | No detectado | No detectado |
| [__tests__/resolved-product-recommendations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/resolved-product-recommendations.test.ts>) | 4 | 2 | No detectado | No detectado |
| [__tests__/sale-returns-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/sale-returns-validations.test.ts>) | 10 | 0 | No detectado | No detectado |
| [__tests__/sales-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/sales-validations.test.ts>) | 14 | 0 | No detectado | No detectado |
| [__tests__/schedule-tracking.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/schedule-tracking.test.ts>) | 5 | 3 | No detectado | No detectado |
| [__tests__/security-rpc-contract.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/security-rpc-contract.test.ts>) | 7 | 0 | No detectado | Sí |
| [__tests__/shared-inventory-ui.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/shared-inventory-ui.test.tsx>) | 4 | 1 | Sí | No detectado |
| [__tests__/stat-card-layout.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/stat-card-layout.test.ts>) | 3 | 0 | Sí | No detectado |
| [__tests__/storefront-media.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/storefront-media.test.tsx>) | 9 | 0 | Sí | No detectado |
| [__tests__/tracking-image-metadata.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/tracking-image-metadata.test.ts>) | 4 | 3 | No detectado | No detectado |
| [__tests__/two-payment-qr.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/two-payment-qr.test.ts>) | 4 | 0 | No detectado | No detectado |
| [__tests__/visual-preview.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/visual-preview.test.ts>) | 13 | 2 | No detectado | No detectado |
| [__tests__/whatsapp-validations.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/whatsapp-validations.test.ts>) | 5 | 0 | No detectado | No detectado |
