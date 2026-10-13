# Dashboard pastel: revisión visual

Fecha: 2026-10-13. Rama: `codex/inventory-refunds-dashboard-2`.
Base de esta ronda: `f76a63b659092c78d1146055221d4453699cbeb7`.

## Alcance

Adaptación visual del Dashboard a la referencia floral adjunta. No cambió `sales_ledger`, la lógica financiera, inventario, reintegros, caja, reportes, checkout ni QR. No se añadió una dependencia. No hubo migraciones, seed, reset, merge, push, deploy ni acceso a Supabase remoto. Se conservaron los datos del laboratorio local ya existente.

## Diseño

- Encabezado «Dashboard» / «Resumen general de tu florería», filtros Hoy/7/30 días y fechas existentes.
- Seis KPIs con iconos, tonos pastel y bordes de 22 px; ventas netas destacada. No se inventaron tendencias. Se muestran definiciones claras del importe o conteo.
- Dos columnas en móvil cuando el valor cabe; un importe excepcionalmente largo ocupa ambas columnas en móvil para conservar la lectura de todos sus dígitos. En escritorio las tarjetas se distribuyen según el ancho disponible.
- Paneles blancos con bordes de 24 px y sombra discreta. La navegación compartida conserva su diseño actual: no se rediseñó el resto del panel.
- Gráfico SVG: barras de brutas/netas, línea de devoluciones, ejes, leyenda, importe exacto de la fecha seleccionada y tabla accesible. Selección por puntero/tap o flechas de teclado; no interpolación ni recálculo financiero. Los importes negativos siguen representándose bajo cero.
- Donut CSS con estados reales, total, cantidades y porcentajes del conjunto. La leyenda pasa debajo cuando el ancho no permite mantener legibles los nombres. El conjunto operacional es independiente del rango financiero.
- Cinco pedidos recientes: número, nombre, estado, total y fecha Bolivia. Tabla en escritorio y tarjetas en móvil. Se conserva el nombre del invitado cuando aún no existe cliente materializado; no se materializa ningún cliente para mostrar la UI.
- Stock crítico con nombre de insumo, cantidad/unidad y badge. Se usa un icono de inventario: no se inventaron fotografías ni se asociaron imágenes de productos a insumos sin relación segura.
- Actividad con pedidos creados, ventas confirmadas, reintegros y estados listos/entregados existentes. No se inventaron eventos de actualización de producto ni alertas históricas. Se conserva el bloque de unidades vendidas.

## Cambio mínimo de API

Único endpoint ajustado: `GET /api/admin/dashboard`.

1. Añade los conteos existentes `cancelado` y `rechazado` al conjunto de estados, sin cambiar los cinco anteriores ni los cálculos financieros.
2. Añade `recent_orders` con una lectura de cinco pedidos no eliminados, ordenados por `created_at` e ID descendentes. Campos: `id`, `order_number`, `status`, `total`, `created_at`, `customer_name`.
3. El nombre procede del cliente relacionado o del invitado existente. No devuelve teléfono, dirección, referencia bancaria ni token de recibo.
4. Conserva `requireEmployeeOrAdmin`, cliente de sesión y RLS. No hay escrituras ni llamadas RPC nuevas. Se preserva el payload financiero previo.

No se agregaron comparaciones contra ayer porque la API no disponía de una base comparable validada. Los porcentajes del donut son proporciones reales del conteo de estados; no son tendencias.

## Validación

| Check | Resultado |
|---|---|
| Tests relevantes | 69/69 (gráficos/presentación y regresiones de API) |
| Suite completa final | 527/527, 39 archivos |
| Lint | 0 errores / 0 warnings |
| TypeScript explícito | `npx tsc --noEmit`, exit 0 |
| Build final | Correcto, 69 páginas generadas; variables únicamente locales |
| HTTP real de solo lectura | 8/8 comprobaciones contra Next local y Auth local |
| Igualdad Dashboard/Reportes | Brutas, reintegros y netas idénticos para 2026-10-13 y período vacío 2026-10-01 |
| Pedidos recientes | Cinco, campos limitados y orden estable |
| Estado vacío | Importes cero y mensaje explícito; no se inventan operaciones |
| Estado crítico | Lista del insumo ya existente y enlace de inventario |
| Donut | Siete estados existentes; total y porcentajes reales; cero sin NaN en test unitario |
| Visitante anónimo | Middleware conserva redirección a login |
| Rango inválido | HTTP 400 conservado |
| Secret scan | Sin hallazgos en los archivos de revisión |
| Áreas protegidas | Diff vacío para Supabase, cálculos/Reportes, checkout y lógica comercial |

La comprobación HTTP usa usuarios locales ya existentes y no crea pedidos, clientes, ventas ni movimientos. Resultados y credenciales permanecen fuera de Git en el laboratorio privado. Los tests de markup usan renderizado estático; las comprobaciones visuales y de interacción descritas abajo se hicieron mediante navegador real.

El primer intento de tests relevantes fue bloqueado por `EPERM` del sandbox Windows al resolver Vitest. La ejecución con acceso normal pasó. Un harness HTTP inicialmente intentó leer como JSON la redirección anónima; se corrigió el harness para verificar el comportamiento existente de login. Ninguna incidencia requirió cambiar la aplicación.

## Navegador y capturas

Destino: `http://127.0.0.1:3116/admin`; Supabase LOCAL `http://127.0.0.1:62621`, laboratorio `NOVA-LOCAL-INTEGRITY`, sin vínculo remoto.

- Escritorio: viewport 1280 px; clientWidth/scrollWidth 1265/1265.
- Móvil: viewport real 390 px; clientWidth/scrollWidth 375/375.
- No overflow horizontal global en las vistas inspeccionadas.
- Importes grandes completos, nombres largos, filtros, estado sin ventas, stock crítico, pedidos recientes y donut revisados realmente.
- Las flechas cambiaron la fecha del tooltip de 13 a 12 oct y de vuelta, mostrando los valores exactos; tabla de importes abierta correctamente.
- El vacío financiero no oculta datos operacionales: pedidos recientes/stock/estados siguen siendo actuales y se indica esa diferencia.
- No se afirma prueba en un teléfono físico ni auditoría visual del resto de módulos. Los datos proceden del laboratorio existente, no de la imagen de referencia.

Capturas fuera de Git en `%USERPROFILE%/.codex/visualizations/2026/10/07/01a1180b-d477-7f72-b90e-d71ebc2e5249/`:

- `anabelle-pastel-desktop.png`: página completa en escritorio.
- `anabelle-pastel-mobile.png`: página completa a 390 px.
- `anabelle-pastel-desktop-preview.png` y `anabelle-pastel-mobile-preview.png`: vistas iniciales.
- `anabelle-pastel-empty.png`: período sin ventas.

## Archivos de esta ronda

1. `src/components/admin/dashboard-panel.tsx`
2. `src/components/admin/dashboard-charts.tsx` (nuevo)
3. `src/app/api/admin/dashboard/route.ts`
4. `__tests__/dashboard-visual.test.ts` (nuevo, cinco casos)
5. `__tests__/certification-round-three.test.ts` (una regresión adicional y aserciones de paginación/datos recientes)
6. `docs/DASHBOARD_PASTEL_REVIEW.md`

La referencia visual aporta estilo, no datos. No se copiaron nombres, cantidades, ventas ni fechas ficticias. El SHA final se entrega con la respuesta de revisión y se obtiene mediante `git rev-parse HEAD`. Detenerse para revisión; no publicar esta ronda.
