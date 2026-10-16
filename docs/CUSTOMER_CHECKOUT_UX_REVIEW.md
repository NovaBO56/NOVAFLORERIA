# Revisión local de la experiencia de compra — 15/10/2026

Rama: `codex/inventory-refunds-dashboard-2`. Base de esta ronda:
`cbfe4bd9140df6ec066484df9d3f2695a9aeed09`.

Solo presentación pública. No cambia API, SQL, seed, RLS, importes, reservas,
consumo, confirmación administrativa, Dashboard ni Reportes. No hay dependencias nuevas.
Los 39 archivos legacy conservan sus hashes. No hubo merge, push, despliegue ni
operaciones contra Supabase remoto. Los metadatos públicos de GitHub identificaban
el último deployment Production exitoso con `05f5338ab117da5b770b462fd120ab06b2006e92`;
master local y origin/master seguían en ese SHA.

## Presentación y contrato

- Carrito con confirmación antes de quitar, opciones y mensaje visibles, controles
  de cantidad de 44 px y espacio inferior para safe area.
- Datos, entrega/recojo y revisión en pasos separados. Se conserva el draft de sesión,
  la validación existente y la misma clave de idempotencia para reintentos.
- Escritorio: dos columnas y resumen lateral. Móvil: una columna, inputs de 16 px,
  botones amplios; no compite una barra inferior con el avance del checkout.
- QR configurados y selección persistida mediante el mecanismo existente. El aviso
  no confirma el pago; WhatsApp sigue requiriendo pulsar Enviar manualmente.
- Espera floral con transform/opacity; movimiento desactivado por la regla global
  `prefers-reduced-motion`. No hay polling, listeners de animación ni nueva librería.
- Seguimiento con consulta real al recuperar sesión y al pulsar Actualizar. En otra
  pestaña/dispositivo se sigue usando número y celular. Se aborta la recuperación
  pendiente si el usuario cambia la consulta para evitar que sobrescriba el resultado.
- Timeline basado en estados reales. No incorpora “En camino”, fechas de entrega,
  tarifas ni notificaciones externas que el backend no soporta. Un rechazo o
  cancelación no muestra etapas anteriores como si hubieran sido confirmadas.
- `listo` se presenta como Listo para recoger o Listo para entregar; `finalizado`
  como Retirado o Entregado. Si un pedido histórico no declara método, se muestra
  entrega/recojo por coordinar. No se deduce la causa de vencimiento de una cancelación.
- Guía de texto descargable con número, estado al guardar y URL de seguimiento,
  sin UUID privado, teléfono ni token de recibo. No acredita pago.
- “Descargar comprobante PDF” solo cuando la respuesta autorizada del servidor
  incluye el token existente. El documento no se denomina factura fiscal.

## Evidencia funcional LOCAL

Laboratorio existente NOVA-LOCAL-INTEGRITY, API `http://127.0.0.1:62621`;
web `http://127.0.0.1:3116`. Sin reset, seed ni migraciones.

| Comprobación | Resultado / alcance |
|---|---|
| Carrito lleno/vacío; aumentar/disminuir; conservar ante eliminación | PASS navegador |
| Datos incompletos/completos y errores junto al campo | PASS navegador |
| Dirección solo para entrega; recojo con configuración real/vacía | PASS navegador |
| QR1/QR2 y QR2 recuperado tras recargar | PASS navegador |
| Aviso, apertura de WhatsApp sin enviar y pantalla de espera | PASS navegador |
| Pedido #27: entrega, QR2, pendiente → confirmado → preparación → listo → entregado | PASS API local + navegador |
| Antes de confirmar #27: un pago pendiente, cero clientes materializados, stock 15 | PASS SQL local de solo lectura |
| Después: cliente materializado, stock 14, PDF real HTTP 200 | PASS API/SQL local |
| Pedido #28: QR1 reportado y rechazado; sin recibo ni timeline confirmado | PASS API local + navegador |
| Pedido #29: recojo gratuito de 2 unidades, descuento 180, total 0 y cero pagos | PASS API/SQL local + navegador |
| #29: preparación → listo para recoger → retirado | PASS API local + navegador |
| Guía descargada; recuperación manual desde otra pestaña | PASS navegador |
| Nombres extensos e importe Bs 9999999999.99 sin desbordamiento | PASS navegador; importe solo carrito/resumen, sin comprar |
| Teclado Tab y foco del resultado; labels y errores asociados | PASS teclado/DOM; no equivale a probar un lector de pantalla |
| Repetición de acciones | singleFlight/idempotencia conservados y tests existentes PASS; controles ocupados deshabilitados observados. No se ejecutó una nueva carrera de doble toque en navegador |

Los pedidos sintéticos #27, #28 y #29 y sus registros relacionados se conservaron.
No se borraron los datos previos ni se modificó configuración comercial para estas pruebas.
Los identificadores y comprobaciones auxiliares están fuera de Git en el laboratorio.

## Responsive y evidencia visual

Viewport real del navegador a 375, 390, 430, 768, 1280 y 1440 px; mediciones DOM
de checkout y seguimiento sin overflow horizontal. En Windows, el ancho útil es
15 px menor por la barra de scroll: no se confunde con un viewport fijo de 1265 px.
Capturas externas a Git con prefijo `anabelle-lavender-`: carrito, datos, entrega,
recojo, QR, aviso, espera, confirmado, rechazo, gratuito, recibo, vacío, checkout
desktop y seguimiento en los seis tamaños. Son vistas Chromium, no dispositivos iOS.

Los productos locales carecen de fotos florales y la ubicación no está configurada.
Se muestran los datos/estados vacíos existentes; no se copiaron las imágenes,
bancos, nombres, importes ni direcciones ficticias de los bocetos.

## Calidad final y límites

- `npm test`: **559/559**, 42 archivos. Incluye 20 nuevos tests de recorrido y resumen.
- ESLint: **0 errores / 0 warnings**.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS, 69 páginas.
- Secret scan: sin hallazgos; hash legacy **39/39**.

Los tests de markup no prueban layout; las evidencias de layout proceden del navegador.
Los tests de API con mocks siguen siendo unitarios; los recorridos sintéticos de arriba
sí usaron la API, Auth y base locales.

Pendientes manuales: VoiceOver/TalkBack o lector de pantalla real; activación real
de la preferencia reduced motion (regla CSS revisada, sin emulación disponible);
Safari/iPhone físico, teclado virtual y safe area de hardware; nueva carrera de doble
toque en E2E. No se presentan como PASS. La persistencia tras cerrar se comprobó
mediante recarga y recuperación manual desde una pestaña nueva, no cierre físico de
la aplicación o de otro dispositivo.

Incidencias del entorno: Vitest dentro del sandbox falló por EPERM al resolver
node_modules; la ejecución normal pasó. Hubo una solicitud abortada durante navegación
en desarrollo y pestañas antiguas que mostraron conexión rechazada al reiniciar;
el servidor compilado respondió 200 y una pestaña nueva abrió correctamente.
No se clasifican como errores de negocio. La advertencia de deprecación CJS de Vite
y los logs de casos negativos unitarios no son warnings de ESLint.

Estado: implementación preparada para revisión visual. Esta ronda no autoriza publicar.
