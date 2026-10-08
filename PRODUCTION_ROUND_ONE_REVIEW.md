# Floristería Anabelle — primera ronda, revisión pendiente

## Cierre posterior: seguimiento privado y método de entrega

Commit de alcance limitado a los dos hallazgos, exclusivamente en fix/production-round-1. Nueva migración incremental `20261009000300_tracking_rpc_server_only.sql`: revoca EXECUTE de PUBLIC/anon/authenticated en track_order_details(text,bigint,uuid) y track_order(bigint,text), y concede a service_role. No cambia definiciones, datos ni migraciones previas. El propietario postgres conserva sus llamadas internas SECURITY DEFINER. Ningún archivo src invoca track_order directamente; track_order_details se consume exclusivamente desde la API del servidor.

La API de seguimiento valida entrada y pasa checkRateLimit antes de ejecutar mediante el cliente privado; errores de negocio presentan 404 genérico. Seguimiento falla cerrado cuando el limitador falla para impedir consultas sin protección. El borrador considera delivery distinto de retiro incluso sin otros campos; conserva sessionStorage, límites, campos permitidos e idempotencia/limpieza anteriores.

Resultados vigentes: **358/358 tests, 30 archivos; lint 0 errores / 0 warnings; TypeScript y build correctos (69 páginas)**. Regresión real guest-receipts **73/73**: anon y authenticated sin rol admin denegados en ambas firmas, service_role autorizado, API funcional, teléfono incorrecto sin pedido/token, token oculto hasta confirmación, primeros 20 intentos permitidos y 21 bloqueado (429). Catálogo SQL sin RPC SECURITY DEFINER público que exponga receipt_token; RLS anónima de pedidos/clientes y recibos privados también probados. No hay otra API pública que use una firma equivalente sin limitador; las rutas admin mantienen autorización. Las pruebas reales no usan mocks; los tests unitarios de API sí los utilizan.

Delta aplicado únicamente a NOVA-LOCAL-VALIDATION; replay limpio de nueve migraciones y seed en NOVA-LOCAL-ROUND2-REPLAY, ambos sin project-ref. Esquemas public idénticos tras retirar solo cabeceras aleatorias de pg_dump; incluye ACL, funciones, RLS, índices y constraints. Hashes legacy 39/39. Escaneo de secretos sin hallazgos. El primer test unitario falló por una expectativa antigua de seguimiento abierto si falla el limitador; se actualizó explícitamente al contrato protegido y se repitió la suite completa. Se conservaron fixtures sintéticos y evidencia privada local, sin credenciales versionadas ni eliminación automática.

Una repetición de Vitest dentro del sandbox terminó sin ejecutar tests por EPERM al resolver node_modules; se repitió con acceso normal, 358/358 correctos, sin cambios para ocultar el error. La clave privada local está ausente del JavaScript estático del navegador.

Las cuatro migraciones incrementales de esta rama permanecen pendientes de producción; sin merge, deploy, SQL remoto ni cambios al Supabase antiguo. Este cierre no añade funcionalidades ni sustituye la batería agresiva posterior por módulo. Persisten las limitaciones anteriores de revisión visual PDF, QR real y tooling; no se declara producción certificada.

## Cierre vigente de correcciones manuales

Rama exclusiva `fix/production-round-1`; sin merge, despliegue ni SQL remoto. Las secciones posteriores conservan la evidencia anterior y sus cifras históricas; los resultados vigentes son los de este cierre.

- Checkout conserva Confirmación después del reporte, confirmación administrativa, preparación/listo/finalizado y recarga. El borrador de datos/entrega/referencia/notas se conserva en sessionStorage antes de crear; comenzar otra compra limpia únicamente las claves de este flujo.
- Se jerarquiza pedido/estado/acciones; el QR reportado queda plegado. WhatsApp abre manualmente el número configurado, normalizado sin duplicar Bolivia, con datos del pedido y sin URL administrativa. No se envían mensajes automáticamente. El teléfono sintético del laboratorio procede de su fixture existente, no de seeds productivos.
- La identidad de invitado se guarda en el pedido: crear, reportar, rechazar, cancelar o expirar no dan de alta un cliente. Confirmar efectivamente materializa/reutiliza el cliente en la misma transacción. Total cero conserva la confirmación automática y alta efectiva, sin pago/caja ficticios. Los clientes y FK históricos permanecen intactos.
- Recibos administrativos requieren pago confirmado con fecha; seguimiento entrega un token aleatorio únicamente en ese estado. El endpoint público por token usa RPC privado, rate limiting que falla cerrado, respuestas sin caché y protección contra identificación por UUID/número de pedido. El enlace es bearer: puede compartirse y no tiene expiración/rotación de UI en esta ronda. Un pedido gratuito sin pago no recibe un comprobante de pago.
- Ubicación tiene preview OpenStreetMap HTTPS antes de guardar, sin claves privadas; coordenadas inválidas impiden guardar. Se retiró su duplicado JSON del formulario genérico que producía overflow móvil. Marca visible Anabelle también en demos; nombres técnicos conservados.
- Fallo real de imágenes: Storage con el cliente de empleado podía devolver eliminación vacía al compensar un registro fallido. Se usa el cliente privado exclusivamente para la ruta aleatoria recién creada por una solicitud autorizada. Regresión real comprueba JPG/PNG/WebP, máximo 1600 px, corrupción/5 MB, limpieza ante fallo SQL y bytes de QR intactos. El primer fixture fallido dejó un objeto huérfano local; no se borró evidencia automáticamente.

Migraciones nuevas de esta corrección: `20261009000100_guest_customers_secure_receipts.sql` y `20261009000200_receipt_rate_limit.sql`. La segunda incorpora la categoría del recibo: la primera prueba encontró el rechazo exacto `Ruta inválida` del allowlist previo y un HTTP 429; después del delta adicional la regresión pasó. Las seis versiones anteriores, seed y 39 legacy no cambiaron. También sigue pendiente de autorización productiva `20261008180000_production_round_one.sql`.

Replay: ocho migraciones más seed desde cero en `NOVA-LOCAL-ROUND2-REPLAY` (API localhost:57621, sin project-ref), correcto. Actualización delta en `NOVA-LOCAL-VALIDATION` (API localhost:55421), correcta. Dumps de esquema public equivalentes byte por byte normalizando únicamente cabeceras aleatorias de pg_dump; incluyen funciones, ACL, RLS, políticas y constraints, sin afirmar equivalencia de datos Auth/archivos Storage. Un primer puerto del nuevo laboratorio estaba ocupado por otro laboratorio; se cambió solo el puerto del entorno nuevo, sin tocar el existente.

Resultados finales: **355 tests / 30 archivos**, **lint 0 errores y 0 warnings**, **TypeScript correcto**, **build correcto (69 páginas)**. Vitest muestra el aviso previo de deprecación CJS de Vite; no es un warning de lint. Pruebas reales sin mocks: production-round-one **34/34**, remaining-backend **127/127**, guest-receipts **62/62**, images-regression **16/16**; total **239/239**. Estas incluyen permisos JWT/RPC, confirmación concurrente/expiración, idempotencia, clientes diferidos, recibos confirmados, rechazos/cancelación y pedidos gratuitos. Legacy **39/39 SHA-256**.

Navegador real: borrador tras recarga, pedido sintético #82, reporte, popup manual de WhatsApp sin enviar, alta inexistente antes de confirmar, confirmación administrativa y preparación/listo/finalizado; seguimiento muestra pago confirmado y enlace de recibo. Confirmación recuperada de un pedido previo permanece en paso 4. Checkout/confirmación, pedidos/modal, mapa y seguimiento revisados visualmente a **390/768/1280 px**, con medidas DOM sin overflow horizontal. El recibo pasó HTTP/PDF real, pero el navegador integrado no expuso su descarga/visor: **la revisión visual del PDF queda pendiente**. Total cero se verificó en esta ronda por HTTP/RPC/SQL, sin afirmar una nueva ejecución completa de navegador para ese caso. Al cambiar del dev lento al servidor de build local se invalidaron pestañas antiguas; se continuó en pestañas nuevas, sin alterar contratos para ocultar retrasos de compilación.

Auditoría: runtime `npm audit --omit=dev` **0 vulnerabilidades**; tooling completo **14 (3 moderadas, 9 altas, 2 críticas)**, sin actualización forzada. Credenciales, manifiestos, backups y dumps privados permanecen fuera de Git. Fixtures sintéticos conservados para revisión en `certification/` del laboratorio; no se eliminaron automáticamente. No se confirma envío bancario/WhatsApp real.

Pendientes antes de producción: revisar/aprobar los tres deltas pendientes, backup y ensayo sobre una copia del estado productivo (la nueva columna token puede bloquear/re-escribir pedidos), revisión visual del PDF descargado, QR real con aplicación bancaria y configuración real, dependencias de tooling y batería futura por módulo. No borrar clientes históricos de pedidos temporales por inferencia. No se declara producción certificada ni se autoriza publicación.

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
| Unitarios | 28 archivos, **316 tests PASS**, incluidos 15 nuevos; no se presentan como pruebas de ACL reales. |
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

- Validación visual local inicial a 870 px. En el cierre posterior el navegador aceptó dimensiones reales: formulario de checkout revisado a **390, 768 y 1280 px**, sin overflow horizontal (scrollWidth 375, 753 y 1265 respectivamente). Capturas privadas fuera de Git. Esto no equivale a probar todas las pantallas administrativas en móvil. La hoja existente conserva `prefers-reduced-motion`; no se añadieron efectos continuos ni dependencia de animación.
- Las nuevas pantallas administrativas fueron verificadas por código y HTTP con Auth real; no se declara una sesión visual admin completa nueva.
- El QR sintético prueba carga/validación, no un código bancario escaneable. Falta escaneo del QR real desde un teléfono y comprobación de una imagen productiva concreta con su URL.
- Ubicación real debe ingresarse en el panel después del despliegue aprobado. WhatsApp automático requeriría una integración oficial de servidor, credenciales privadas, consentimiento/plantillas según el caso, idempotencia, reintentos y confirmación de entrega; este cambio conserva el envío manual explícito.
- Cierre de dependencias: Next y eslint-config-next **16.3.8**, Sharp **0.35.5**, versiones exactas. Parches compatibles de source-map-js/proxy-addr/MCP y otras transitivas actualizados en lockfile. Shadcn **4.21.0** es herramienta de compilación (solo su CSS se importa en la aplicación) y pasa a devDependencies; continúa disponible para el build. `npm audit --omit=dev`: **0 avisos**. `npm audit` completo: **14 avisos, 3 moderados, 9 altos y 2 críticos**, estos últimos en Vitest/Tinypool. La reclasificación no soluciona las vulnerabilidades de herramientas: siguen pendientes y requieren una actualización mayor controlada. No iniciar servidores Vitest UI/MCP accesibles externamente ni procesar proyectos no confiables. No se ejecutó `npm audit fix --force`.
- Esta ronda no sustituye la batería futura de aproximadamente 20 pruebas por módulo, ni certifica producción. **No listo para despliegue automático:** pendiente revisión del cambio, dependencias y comprobaciones manuales anteriores.

Avisos primarios: [Next](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h). [Supabase Cron](https://supabase.com/docs/guides/cron).

## Cierre para revisión externa

- Nuevo cambio: resolución de auditoría en lotes (hasta seis consultas por página en vez de consultas por fila); títulos explícitos de rechazo/merma/reversión/devolución/descuento; estado de eventos históricos de pago derivado de su acción, manteniendo JSON/detalles actuales sin alteración. Test adicional cubre la diferencia entre evento histórico y estado actual.
- La regresión de horarios encontró una suposición incorrecta del fixture en un laboratorio reutilizado: cerrar conserva las horas anteriores. Se prepara explícitamente un domingo cerrado sin horas en el script local antes de comprobar la reapertura inválida; no se cambió comportamiento de la API. El primer run dio 126/127 y se repitió tras corregir el fixture.
- Durante la instalación/reinicio se intentó TypeScript mientras Next reemplazaba dependencias y regeneraba `.next/dev/types`; fallaron referencias temporales. Tras completar instalación y generación se repitieron TypeScript y build correctamente. No se cambiaron tipos para ocultar ese error.
- `vercel.json` contiene exclusivamente `git.deploymentEnabled["fix/production-round-1"]=false`, para que el push de revisión no active el despliegue automático de esa rama. Otras ramas conservan su configuración. [Documentación oficial](https://vercel.com/docs/project-configuration/git-configuration).
- Sin migración adicional en este cierre. La única nueva respecto de master sigue siendo `20261008180000_production_round_one.sql`, pendiente de autorización para producción; no se aplicó remotamente.
- Archivos de este cierre: `package.json`, `package-lock.json`, `src/app/api/admin/audit-log/route.ts`, `src/lib/audit-presentation.ts`, `__tests__/production-round-one.test.ts`, `supabase/tests/remaining-backend-local.mjs`, este informe y `vercel.json`.
- Master conserva `9e15120cf324cd52f6c1a6573659bb98d39d052a`. Se sube solamente `fix/production-round-1` para revisión; no se hace merge ni se ejecuta deploy/link/db push/repair/SQL remoto.
