# 07 · Interfaces y experiencia de usuario

## Diseño encontrado

La tienda y el panel tienen lenguajes visuales distintos. La tienda emplea fondos crema/rosa, acentos vino/rosa (#873c58, #e6d7d8), imágenes florales y tipografías Lato y Dancing Script. El panel usa tokens bajo .theme-admin: marca #7c3aed, hover #6d28d9, fondo #f8fafc, superficie blanca, texto #0f172a, texto secundario #64748b, éxito #059669 y peligro #dc2626. Estas observaciones provienen de [src/app/globals.css:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/globals.css:1>), [src/app/admin/admin.css:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/admin.css:1>) y [src/components/public/home/shared.tsx:11](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/shared.tsx:11>). No se calculó un informe matemático de contraste de todas las combinaciones.

La raíz incorpora Geist/Geist Mono, lang=es y viewport para dispositivo móvil ([src/app/layout.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/layout.tsx:1>)). Que las fuentes estén declaradas no demuestra que cada texto utilice todas ellas: la tienda aplica sus clases propias y el panel hereda Geist.

## Inventario de pantallas

| Ruta | Superficie y acciones encontradas | Evidencia |
| --- | --- | --- |
| /admin/auditoria | Actividad administrativa; sólo administrador. | [src/app/admin/auditoria/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/auditoria/page.tsx:1>) |
| /admin/caja | Cajas y sesiones; apertura, movimientos y cierre. | [src/app/admin/caja/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/caja/page.tsx:1>) |
| /admin/categorias | Categorías y previsualización de portada. | [src/app/admin/categorias/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/categorias/page.tsx:1>) |
| /admin/clientes | CRM, fichas e historial administrativo. | [src/app/admin/clientes/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/clientes/page.tsx:1>) |
| /admin/configuracion | Atención, QR, WhatsApp, ubicación, fotos y preferencias; sólo administrador. | [src/app/admin/configuracion/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/configuracion/page.tsx:1>) |
| /admin/inventario | Materiales, historial, lotes FIFO y operaciones de stock. | [src/app/admin/inventario/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/inventario/page.tsx:1>) |
| /admin | Dashboard de métricas y operación. | [src/app/admin/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/page.tsx:1>) |
| /admin/pedidos | Filtros, detalle, estados, pagos, horario, devolución, solicitudes e historial. | [src/app/admin/pedidos/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/pedidos/page.tsx:1>) |
| /admin/productos | Catálogo, editor por secciones y recomendaciones. | [src/app/admin/productos/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/productos/page.tsx:1>) |
| /admin/promociones | Definición de descuentos/combos, participantes y vigencia. | [src/app/admin/promociones/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/promociones/page.tsx:1>) |
| /admin/prueba-ui | Demostración de componentes, sin operaciones comerciales. | [src/app/admin/prueba-ui/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/prueba-ui/page.tsx:1>) |
| /admin/reportes | Siete reportes y descarga PDF. | [src/app/admin/reportes/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/reportes/page.tsx:1>) |
| /admin/temporadas | Temporadas comerciales. | [src/app/admin/temporadas/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/temporadas/page.tsx:1>) |
| /admin/usuarios | Crear equipo y gestionar roles/estado; sólo administrador. | [src/app/admin/usuarios/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/usuarios/page.tsx:1>) |
| /admin/ventas | Preparación y registro de venta presencial. | [src/app/admin/ventas/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/admin/ventas/page.tsx:1>) |
| /checkout | Datos, entrega y revisión; luego pedido, QR/aviso y confirmación según backend. | [src/app/checkout/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/checkout/page.tsx:1>) |
| /login | Acceso del equipo por correo y contraseña; sin alta ni recuperación pública. | [src/app/login/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx:1>) |
| / | Catálogo y presentación; filtros, detalle, favoritos, carrito y enlaces de contacto. | [src/app/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/page.tsx:1>) |
| /prueba-cliente | Demostración pública de desarrollo: carrito independiente, compra no conectada. | [src/app/prueba-cliente/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/prueba-cliente/page.tsx:1>) |
| /seguimiento | Consulta individual y actualización por número/celular; horario y productos. | [src/app/seguimiento/page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/seguimiento/page.tsx:1>) |

La existencia de la pantalla acredita código de presentación. Las acciones conectadas y las demostraciones se distinguen en [03-inventario-funcionalidades.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/03-inventario-funcionalidades.md>); el control real se verifica en endpoint y SQL.

## Organización y reutilización

En el panel, PageHeader, StatCard, SectionCard, Table, Badge, Field, Button, EmptyState y Modal aportan jerarquía y estados comunes. La navegación agrupa Operación, Catálogo, Gestión y Administración según rol ([src/config/admin-navigation.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/config/admin-navigation.ts:1>)). El panel lateral y el menú móvil son componentes diferenciados. La búsqueda del catálogo, el filtro de pedidos y el buscador de productos del administrador son contextuales; no se presume un buscador universal entre todas las entidades.

En público, CustomerShell, CheckoutProgress, OrderSummary y DedicationEditor organizan la compra. Notice/ShoppingNotice diferencian información, éxito, advertencia y error con texto e icono; no dependen sólo de color. ProductThumbnail y SafeImage limitan tamaño, resuelven imágenes ausentes y permiten ampliar bajo demanda. La galería difiere de una carga de imágenes nuevas: en el recorrido se utilizaron fotos ya disponibles.

## Formularios y recorrido

Checkout solicita nombre y celular boliviano, entrega/recojo, dirección y referencia cuando corresponde, notas y revisión de tarjetas. No existe destinatario independiente ni selector público de hora. Los errores se vinculan a los campos y al paso pertinente. El total se presenta como estimado hasta validación del servidor; la entrega se coordina y su costo no se incorpora automáticamente. Confirmar y crear pedido es una escritura; informar un pago no es una confirmación bancaria. Evidencia: [src/components/public/checkout-form.tsx:19](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-form.tsx:19>), [src/lib/public/checkout.ts:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/public/checkout.ts:8>).

La promoción tiene estado sugerido/seleccionado/no aplicable, beneficio y condiciones, con Quitar/Cambiar. El usuario conserva control explícito. El seguimiento distingue etapas de pedido y pago, horario propuesto y confirmado y terminales cancelado/rechazado. El cliente consulta; el personal registra coordinación. La guía descargada no se presenta como factura.

## Accesibilidad: evidencia y límites

- Modal de Radix y useDialog gestionan foco/teclado; el hook propio implementa Escape, Tab y devolución del foco ([src/components/public/home/shared.tsx:52](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/shared.tsx:52>)).
- Notice usa alert para error y status para otros avisos; aria-atomic y opción sin anuncio para contenido estático ([src/components/ui/notice.tsx:23](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/ui/notice.tsx:23>)).
- Texto alternativo en imágenes, etiquetas, aria-label, aria-current, encabezados y foco visible aparecen en los componentes revisados.
- CSS y scrollToId contemplan prefers-reduced-motion; la regla se revisó en código. No se emuló sistemáticamente la preferencia ni un lector de pantalla en esta auditoría.
- Existen mínimos de 44 px en numerosas acciones; no se midió cada objetivo táctil ni se certificó WCAG. Las tablas densas tienen desplazamiento interno intencional.

## Evidencia visual ya ejecutada y estado

La revisión previa del mismo árbol local recorrió producto/galería, carrito, promociones, checkout hasta revisión, seguimiento y las cinco áreas administrativas solicitadas. Consta en el informe local de entrega anterior y su galería de 21 capturas, con 48 observaciones geométricas en 12 vistas y cuatro tamaños CSS: 390×844, 770×1025, 1280×800 y 1440×900. Las últimas muestras no detectaron desborde de documento, imágenes visibles rotas ni controles fuera. Se excluyen del detector los contenedores de tabla con desplazamiento horizontal deliberado. La galería cargada se midió aparte con 3/3 imágenes disponibles.

Esa evidencia es una ejecución previa documentada, no una nueva inspección de cada pantalla/estado durante esta auditoría. Las capturas normales tienen dimensiones de exportación distintas del viewport CSS; no prueban cuatro inspecciones visuales completas ni dispositivos físicos. No se crearon pedidos, reportaron pagos ni guardaron configuraciones para producir esas capturas. Véase [09-pruebas.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/09-pruebas.md>) para sus condiciones y límites.

## Mejoras propuestas, sin aplicar

Verificar con usuarios reales la distinción entre reportar y confirmar pago; medir contraste, navegación por teclado y errores con lector de pantalla; probar tablas y formularios extensos en dispositivos físicos; evitar duplicidad conceptual entre demos y rutas reales; decidir la presentación de destacados y la coordinación de entrega. Cualquier ampliación funcional requiere validar necesidades del negocio, no se da por aprobada.

