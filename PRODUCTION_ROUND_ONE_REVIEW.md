# Floristería Anabelle — primera ronda, revisión pendiente

Fecha: 2026-10-08. Rama: `fix/production-round-1`. Base de master: `9e15120cf324cd52f6c1a6573659bb98d39d052a`.

No se desplegó, fusionó ni ejecutó SQL remoto. El sitio productivo se consultó únicamente en lectura. Todas las escrituras, usuarios y pedidos sintéticos pertenecen a `NOVA-LOCAL-VALIDATION`: Supabase `http://127.0.0.1:55421`, Next.js `http://127.0.0.1:3110`. El laboratorio no tiene project-ref remoto. Las cinco migraciones previamente aplicadas y las 39 legacy permanecen intactas.

## Cambios y diagnóstico

| Tema | Hallazgo y solución |
| --- | --- |
| WhatsApp | Ya existía `wa.me`, sin integración automática. Después de reportar pago aparece un aviso manual con pedido, cliente, celular, productos, personalización, tarjeta/notas, entrega y total. Crear el pedido normal no dispara la notificación administrativa. El pago pendiente genera una sola notificación con el trigger existente. No se envió ningún mensaje real. |
| Reservas | El vencimiento existente podía liberar reservas aun con pago reportado. El contrato privado conserva las reservas hasta confirmar/rechazar; no consume inventario ni caja al reportar. Los pedidos normales sin reporte vencen a los 30 minutos. Cron corre cada minuto y conserva pedido/auditoría, por lo que la cancelación programada puede reflejarse hasta aproximadamente un minuto después del límite. Incluye pedidos sin receta. |
| Auditoría | Existía JSON técnico. Se añaden actor/nombre, insumo/unidad, número de pedido, monto/estado y filtros de fecha, usuario, módulo y acción aplicados en servidor. El JSON original sigue disponible en detalles. Para eventos de la vista sin JSON se consultan relaciones actuales; no se inventa una fotografía histórica. |
| Ubicación | Nueva sección en `/admin/configuracion`, en configuración del checkout. Reutiliza `system_settings` y su auditoría existente. Dirección, referencia, sucursal, indicaciones, Google Maps y coordenadas opcionales. GET público expone exclusivamente esta configuración. Vacío no inventa dirección. |
| Imágenes | `next.config.ts` conservaba el host del Supabase antiguo. Se restringe al Storage público del destino configurado y se agrega fallback. En la consulta pública de producción el catálogo estaba vacío: no se reprodujo una imagen individual rota ni se cambiaron URLs/datos remotos. |
| Optimización | Se reutiliza Sharp, ahora declarado directamente. Bytes/MIME coherentes, máximo 5 MB/40 millones de píxeles, imagen estática, orientación, máximo 1600 px, WebP 82 y eliminación de metadata. QR conserva sus bytes, sin compresión con pérdida; decodificación y límite de píxeles. |
| Teléfono | Nuevos pedidos requieren 8 dígitos bolivianos en cliente y servidor. Separadores se normalizan; pegado internacional se adapta en el input y el enlace no duplica 591. Seguimiento histórico conserva su contrato. |
| Checkout | Progreso Datos → Entrega → Pago → Confirmación, resumen junto a datos desde md, dos columnas de progreso en pantallas pequeñas. Conserva idempotencia, recuperación tras recarga y revisión del total definitivo. |
| Identidad | Marca visible Floristería Anabelle en sitio, checkout/seguimiento, panel y reportes. Copyright dinámico. No se renombraron tablas, claves internas ni historial. |
| Notificaciones | `9.000 Unidad` se presenta como `9 unidades`, conservando fracciones. Cada aviso tiene separación visual. No se confirmó un fallo de clasificación que mezclara “Pedido” con stock; no se atribuye una causa no demostrada. |
| Seguridad | Autorización de administrador activo antes de leer auditoría/configurar ubicación; contratos públicos limitados; pagos server-only; RLS y protección de último administrador preservadas. Sin claves en Git. |

## Nueva migración pendiente de aprobación

`supabase/migrations/20261008180000_production_round_one.sql` reemplaza solamente expiración, reporte privado de pago y comportamiento de notificación de pedido; añade trigger para pedido gratuito confirmado, configuración vacía y trabajo Cron. Actualiza exclusivamente plazos de reservas de pedidos con pagos pendientes existentes, manteniéndolos hasta revisión. No borra pedidos, pagos, stock ni caja; no usa DROP/CASCADE y no reejecuta SQL histórico.

Los pedidos gratuitos siguen confirmándose sin pago/QR/caja y conservan `order_discounts`. Un reporte correcto anterior al vencimiento mantiene `reserved_until=NULL` y reservas con `expires_at=infinity`, compatible con el contrato vigente de consumo. Confirmación/rechazo liberan o consumen según corresponda. Los reintentos reutilizan el mismo pago.

Antes de aplicar en producción: backup restaurable; revisar pagos pendientes/reservas ya liberadas por el comportamiento anterior (esta migración no reconstruye stock liberado); comprobar disponibilidad de `pg_cron` y ausencia de otro scheduler equivalente; aprobar SQL y despliegue coordinados. No ejecutar la baseline sobre una base existente. Reversión requiere detener el nuevo job y restaurar funciones previas desde Git; no volver a vencer indiscriminadamente pagos pendientes retenidos.

## Evidencia y resultados

| Verificación | Resultado |
| --- | --- |
| Replay desde cero | PASS: cinco migraciones oficiales → nueva migración → seed, exclusivamente `supabase db reset --local` en laboratorio sin vínculo. |
| Unitarios | 28 archivos, **315 tests PASS**, incluidos 14 nuevos; no se presentan como pruebas de ACL reales. |
| Regresión HTTP/Auth/PostgreSQL existente | **127 comprobaciones PASS**, cero errores: roles activo/inactivo, QR, configuración, inventario FIFO, ajustes/mermas, caja, ventas, devolución, promociones, reportes, último administrador. |
| Nueva suite HTTP/Auth/PostgreSQL | **34/34 PASS**, cero errores: celular, notificaciones, duplicación, reservas, vencimiento, pedido gratuito, confirmación/rechazo, seguimiento, ubicación, filtros y relaciones de auditoría, ACL server-only, Cron. |
| Concurrencia real | Doble pedido con misma clave devuelve un ID; doble reporte devuelve un pago; dos confirmaciones junto con expiración: una confirma y otra falla 400, inventario consumido una vez. |
| Expiración | Timestamp retrocedido 31 minutos en PostgreSQL real, luego RPC; no se esperaron 30 minutos de reloj. Pedidos cancelados/reservas liberadas, sin pagos ni caja. Cron registró seis ejecuciones exitosas durante la validación. |
| Navegador real local | Producto/imagen válida → personalización/tarjeta → cantidad 2 → checkout → teléfono 7 rechazado → teléfono 8 → pedido #31 → QR → reporte → enlace manual → seguimiento → recuperación tras recarga. Pedido #38 con promoción 100%, total cero, confirmado sin QR y seguimiento coincidente. |
| Lint | 0 errores / 0 warnings. |
| TypeScript | `npx tsc --noEmit` PASS. |
| Build | `npm run build` PASS, 69 páginas generadas. Vite emite un aviso de deprecación de su API CJS al ejecutar tests; no es un warning de ESLint. |
| Secretos | Escáner de archivos sin hallazgos. `.env.local`, credenciales, reportes privados y capturas no se incorporan a Git. |
| Legacy | SHA-256 real comparado contra el manifiesto histórico: **39/39 idénticos**. |

Ejecución reproducible de la nueva suite: definir `NOVA_LOCAL_LAB` con la carpeta local no vinculada y `NOVA_LOCAL_HTTP=http://127.0.0.1:3110`, ejecutar `node supabase/tests/production-round-one-local.mjs`. Lee claves solamente del archivo privado del laboratorio y rechaza otros destinos. Los IDs sintéticos/resultado se guardan exclusivamente en `certification/PRODUCTION_ROUND_ONE.private.json` del laboratorio. La suite anterior usa `remaining-backend-local.mjs` y su informe privado. No se borraron fixtures automáticamente; rollback: reconstruir solamente el laboratorio mediante `db reset --local`.

## Límites y pendientes reales

- Visual local validado en el viewport disponible de 870 px. 390/768: revisión estática de grids, formularios, wrapping y overflow; falta validación visual real en navegador redimensionable. La hoja existente conserva `prefers-reduced-motion`; no se añadieron efectos continuos ni dependencia de animación.
- Las nuevas pantallas administrativas fueron verificadas por código y HTTP con Auth real; no se declara una sesión visual admin completa nueva.
- El QR sintético prueba carga/validación, no un código bancario escaneable. Falta escaneo del QR real desde un teléfono y comprobación de una imagen productiva concreta con su URL.
- Ubicación real debe ingresarse en el panel después del despliegue aprobado. WhatsApp automático requeriría una integración oficial de servidor, credenciales privadas, consentimiento/plantillas según el caso, idempotencia, reintentos y confirmación de entrega; este cambio conserva el envío manual explícito.
- `npm audit --omit=dev` informó **14 avisos: 2 moderados, 10 altos, 2 críticos** en el árbol actual. Next 16.3.4 incluye avisos corregidos en 16.3.8, entre ellos ImageResponse/optimización; Sharp 0.35.4 incluye un aviso de librsvg corregido en 0.35.5. Otros avisos están en herramientas/transitivas (incluidos shadcn/MCP/proxy-addr). No se demuestra explotación del sitio por este conteo; tampoco se declara que estén resueltos. Es necesaria una revisión y actualización controlada de dependencias antes de afirmar que puede desplegarse sin riesgos conocidos. No se ejecutó `npm audit fix --force`.
- Esta ronda no sustituye la batería futura de aproximadamente 20 pruebas por módulo, ni certifica producción. **No listo para despliegue automático:** pendiente revisión del cambio, dependencias y comprobaciones manuales anteriores.

Avisos primarios: [Next](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h). [Supabase Cron](https://supabase.com/docs/guides/cron).
