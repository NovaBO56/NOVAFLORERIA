# Preparación de publicación completa — 19 de octubre de 2026

## Punto de control

Trabajo exclusivamente en `codex/inventory-refunds-dashboard-2`. SHA de entrada: `0a734db6449186174bab39d0a81d12da9341d309`. Código y tests verificados guardados en `cdae296d093f1e50112b54f0bfead7f9804b82a0`; el commit posterior agrega únicamente herramientas QA e informes, y su SHA final exacto se entrega en la respuesta. `master`, `origin/master` y el deployment Production observado conservan `05f5338ab117da5b770b462fd120ab06b2006e92`.

La continuación del propietario exige **autorización final antes de migraciones productivas, merge y deploy**. Esta entrega prepara código, evidencia y commits; no ejecuta esos pasos ni interpreta la ausencia de datos comerciales definitivos como permiso de pérdida. No se hace push todavía.

Los informes de promociones y Preview visual anteriores son evidencia de sus respectivas rondas. La opción visual separada ya no es el plan de publicación. Su código optativo previo se conserva desactivado, junto con los avances solicitados; la publicación propuesta es la aplicación completa con los flags visuales/locales ausentes. No se publica el staging temporal ni se incorporan sus snapshots.

## Correcciones de esta ronda

- Combo con tarjeta de progreso «Paso 1 de 2» / «Paso 2 de 2», nombre e imagen del componente, cantidades, opciones y tarjeta de mensaje.
- Acciones «Continuar al siguiente producto», «Agregar combo al carrito» y «Cancelar armado del combo», con jerarquía y controles grandes.
- El armado mantiene componentes solo en memoria hasta completar. La promoción se selecciona al agregar el conjunto completo, evitando el aviso prematuro de combo incompleto durante el armado normal. Cancelar conserva el carrito y no introduce líneas parciales.
- Avisos lavanda accesibles para cancelación, eliminación, cantidades y disponibilidad; confirmación de eliminación diferenciada de cancelar el combo. Total y beneficio se recalculan con las reglas existentes.
- Corrección adicional demostrada: un aviso de eliminación reaparecía después al abrir el carrito de un combo nuevo. Ahora cerrar el carrito limpia ese aviso y la confirmación pendiente; se volvió a probar en navegador sobre el build final y no reaparece.
- Se conserva la portada sin contador, carrusel, compra de ofertas, selector compacto, sugerencia sin aplicación automática, validación en servidor, una promoción por pedido, nueva compra con seguimiento conservado, entrega administrable, QR1/QR2 y demás módulos anteriores.

No hay reglas financieras nuevas, cambios SQL ni ediciones de migraciones/seed. El ajuste de exportación del helper `/api/orders` y la integración de promociones ya estaban en el trabajo pendiente conservado.

## Evidencia LOCAL

Único entorno con operaciones de prueba: `NOVA-LOCAL-INTEGRITY`, API `127.0.0.1:62621`, web `127.0.0.1:3116`, sin project-ref. Los 100 productos y los pedidos previos se conservaron. Las credenciales y resultados detallados están en la carpeta privada externa del laboratorio.

| Prueba | Evidencia y resultado |
|---|---|
| Cancelar armado | Navegador real: iniciar combo y cancelar conserva la línea preexistente sin agregar componentes; aviso de estado claro. |
| Eliminar producto | Navegador real: confirmación específica, línea eliminada, carrito vacío y total Bs 0. |
| Eliminar componente / cantidades | Navegador real a 430 px: combo Bs 140 − Bs 40 = Bs 100; al eliminar el segundo componente, descuento retirado y total Bs 45; al subir el restante a dos unidades, subtotal/total Bs 90 sin descuento. |
| Combo de dos productos | Navegador real: dos pasos, imagen/nombre y personalización individual. |
| Doble toque | Navegador real: doble click al continuar conserva paso 2; doble click final agrega solo dos líneas, una unidad cada una. No se generaliza a todas las velocidades/dispositivos. |
| Extras y descuento | Navegador/API/DB: Bs 50 + Bs 95 = Bs 145; descuento del combo Bs 40; total Bs 105. Ambos mensajes y el extra Bs 5 se conservaron. |
| Sugerencia no automática | Navegador real: al quitar el combo sugiere Bs 50 de ahorro, pero total sigue Bs 145. Reelección explícita del combo devuelve total Bs 105. |
| Recojo / entrega desactivada | Navegador real: recojo disponible y entrega deshabilitada con explicación. |
| Reporte QR2 | Navegador real: QR NO PAGAR seleccionado; «Ya pagué» deja pago pendiente. No se envió WhatsApp ni hubo banco real. |
| Confirmación | HTTP/Auth administrativo real LOCAL; cliente y consumo definitivo no existían antes de confirmar. |
| Inventario | Lecturas reales: consumo exacto de las dos recetas y la personalización, una sola vez. |
| Seguimiento/PDF | Navegador real: confirma estado y descarga PDF mediante el enlace privado existente, disponible tras confirmar. No se publica el token. |
| Hacer otra compra | Navegador real: limpia carrito/draft/QR/intento, vuelve al catálogo y seguimiento recupera pedido anterior #124. La compra siguiente contiene solo un producto nuevo. |
| Gratuito | Navegador + DB: pedido #126 confirmado a Bs 0, sin QR/reporte/fila de pago. Es el flujo gratuito existente, no confirmación bancaria automática. |
| Normal con entrega | HTTP real LOCAL: con entrega pausada responde **409 DELIVERY_UNAVAILABLE** sin pedido parcial; activada crea pedido normal #125. Se restablece el valor original del interruptor. |
| Compra mínima / incompatible / vencida / inactiva | Tests y evidencia previa conservada: reglas sin cambios; la regresión HTTP anterior está en `PROMOTION_SHOPPING_REVIEW.md` y `FINAL_CHECKOUT_VISUAL_PREVIEW_REVIEW.md`. No se presentan como una nueva ejecución de todas esas suites. |

La nueva regresión `qa-release-readiness-local.mjs` registra **15 comprobaciones distintas finalmente aprobadas**. Conserva una expectativa inicial incorrecta del helper (esperaba 400 en vez del contrato existente 409); se corrigió solo el helper y se continuó sin repetir la confirmación. Sus anotaciones cronológicas no se cuentan como pruebas independientes adicionales.

Registros nuevos conservados:

| Número | Tipo | Estado comprobado |
|---|---|---|
| #124 | Combo personalizado desde navegador | Confirmado manualmente; un pago QR2 y consumo de recetas/extras. |
| #125 | Producto normal con entrega por API | Pedido sintético pendiente; configuración de entrega restablecida. |
| #126 | Producto promocional gratuito desde navegador | Confirmado sin pago. |

Se ejecutó `DELIVERY_AVAILABILITY_TESTS.sql` con ROLLBACK: el valor inicial true que espera ese fixture se estableció dentro de la misma transacción, preservando el valor LOCAL previo false al terminar. Se verificaron validación, rechazo, recojo y auditoría del actor. No se ejecutó `ISOLATED_SECURITY_TESTS.sql` sobre el laboratorio poblado porque exige perfiles/pedidos vacíos; no se borraron datos para satisfacerlo. Tampoco se hizo reset o un replay nuevo; la evidencia anterior de doce migraciones + seed permanece vigente como antecedente.

## Calidad

| Control | Resultado final |
|---|---|
| `npm test` | 647/647 tests, 53/53 archivos. |
| `npm run lint` | 0 errores / 0 warnings. |
| `npx tsc --noEmit` | PASS. |
| `npm run build` con launcher LOCAL | PASS, 69/69 páginas. |
| Secret scan | Sin hallazgos; no `.env`, credenciales ni snapshots de LAB100 incluidos. |
| `git diff --check` | PASS. |
| Legacy | 39/39 SHA-256 exactos. |

El build se ejecuta con las variables privadas del laboratorio, sin consumir credenciales productivas. Vitest conserva un aviso de deprecación CJS de Vite y mensajes esperados de tests de error; no se ocultan y no son warnings de ESLint.

## Navegador y responsive: alcance real

Se completaron los flujos funcionales anteriores con el navegador integrado. A **390 px CSS medidos**: carrito de 390 px, documento sin overflow horizontal; la acción Hacer otra compra quedó entre y=349 y y=399 dentro de una altura de 844 px.

Inicialmente los cambios de viewport afectaban a otra pestaña y la del pedido seguía midiendo 390 px. Al seleccionar la pestaña pública adecuada se comprobaron también **375 px** (documento 356 px), **430 px** (documento 411 px) y **1280 px** (documento 1261 px), sin overflow horizontal. A 430 px se recorrieron ambos pasos del combo y eliminación/recálculo; en escritorio se probó la limpieza del aviso entre aperturas del carrito. Estas medidas no convierten cada pantalla del flujo en una aprobación visual de todos los tamaños.

La herramienta devolvió capturas vacías y luego «Unable to capture screenshot», aunque el DOM mostraba contenido visible y opacidad 1. No se presentan esas capturas como evidencia visual válida. Quedan pendientes contraste, composición visual completa de cada resolución y capturas utilizables. No se recurrió a mecanismos no documentados para forzarlo. El override temporal se restableció al terminar.

Incidencias de automatización, no bugs demostrados de la aplicación: el nombre accesible del radio QR cambia al seleccionarlo y el locator exacto agotó su verificación aunque quedó checked; se comprobó el estado antes de continuar. Las transiciones entre pasos requirieron esperar el nuevo estado. Un tiempo de revisión automática de permisos agotado se resolvió con un único reintento de lectura.

## Auditoría productiva de solo lectura

Sesión del propietario; proyecto confirmado **nova-floreria-test / groyjvbtcuhjbltmmdfl**, URL `https://groyjvbtcuhjbltmmdfl.supabase.co`. No se abrió ni utilizó el proyecto antiguo.

Se leyó el historial real en Supabase y se ejecutaron SELECT dentro de `BEGIN TRANSACTION READ ONLY ... ROLLBACK`. No se aplicaron migraciones, DDL o DML productivos. El editor conservó un snippet de auditoría, no cambios de negocio. Una consulta auxiliar quedó inicialmente con texto residual y falló por sintaxis; se limpió íntegramente y se repitió solo la lectura. Las anclas se verificaron con `chr(10)` para evitar que los escapes multilínea del editor alteraran la comprobación.

Resultados al momento de la auditoría:

- Diez migraciones registradas, desde `20261007000100` hasta `20261012000100_two_payment_qr`.
- 35 tablas públicas, las 35 con RLS; 89 políticas public/storage.
- Dos productos: **OSO** activo/disponible con una línea válida de receta; **OSO 2** activo/disponible sin receta. No se cambió todavía su estado.
- Siete pedidos (seis finalizados, uno rechazado), siete pagos, tres clientes, tres usuarios Auth, un insumo, cero movimientos de caja, cero promociones y tres objetos Storage.
- No hay pedidos pendientes que marcar por receta inválida ni pendientes sin reservas. No hay datos incompatibles con los nuevos CHECK de devoluciones.
- Ausentes, como se esperaba: vista `sales_ledger`, columnas `inventory_review_required`/`sale_returns.idempotency_key`, setting `delivery_enabled`, helpers/triggers/índice nuevos. Las dos restricciones antiguas que sustituye la candidata existen.
- Las tres anclas de modificación de funciones de la candidata coinciden con las definiciones instaladas. No se detectó conflicto de nombres de helpers o triggers.
- `create_order(7)`, `create_payment(uuid,text)`, `report_payment_qr` y `track_order_details`: anon=false, authenticated=false, service_role=true.

No se afirma equivalencia exhaustiva byte a byte de todo el catálogo remoto: se contrastaron historial, dependencias y objetos relevantes para las dos migraciones y el código.

### Vercel existente

Confirmado **equipo `bryan-174f`, proyecto `novafloreria`**, repositorio `NovaBO56/NOVAFLORERIA`. Production Ready observado: deployment `BWW5LgkxVr3Ktq1iDQBpGyjnTHuR`, hostname `novafloreria-jpve7tqu9-bryan-174f.vercel.app`, dominio `https://floristeriaanabelle.vercel.app/`, fuente master `05f5338ab117da5b770b462fd120ab06b2006e92`.

Variables de proyecto listadas en Production, sin exponer valores: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`. No se editaron. Se comprobó en el JavaScript público de login que el único project ref compilado es el autorizado; catálogo/QR públicos y las lecturas de su base coinciden. No se reveló la clave de servidor ni se modificaron QR, WhatsApp, ubicación u horarios comerciales.

La rama mantiene desactivado su despliegue Git automático en `vercel.json`. No se publica una Preview visual ni se configura otra base.

## Migraciones propuestas y efectos

**Orden, solo tras autorización final:**

1. `20261013000100_inventory_refunds_sales_ledger.sql`.
2. `20261017000100_home_delivery_availability.sql`.

No ejecutar ninguna de las diez anteriores, baseline, seed, legacy o helpers LAB100 en producción.

Primera candidata: cambia defaults de productos nuevos a inactivos/no disponibles; agrega guardias y bloqueo de recetas; **pondría OSO 2 inactivo y no disponible (`is_active=false,is_available=false`)**, conservando todos sus datos y sin alterar artificialmente su stock. OSO conserva su estado. Agrega revisión a pedidos antiguos con receta inválida (ninguno de los siete actuales se marcaría true), idempotencia y tipos de devolución, adaptador de firma anterior y vista contable común. Los dos DROP son de restricciones reemplazadas dentro de la transacción, no de tablas ni datos. Los UPDATE de stock dentro de la función nueva solo se ejecutan cuando posteriormente se registra una devolución autorizada; no se ejecutan por instalarla.

Segunda candidata: setting persistente `delivery_enabled=true` si aún no existe, CHECK booleano y trigger privado para nuevas entregas online. No cambia pedidos existentes, horarios, precio de envío ni inventario.

No contienen DELETE/TRUNCATE de registros ni DROP TABLE. Las 39 migraciones legacy y las versiones activas existentes no se editaron en esta ronda.

## Respaldo y riesgo que requiere decisión expresa

Supabase indica **Free Plan does not include project backups** y la vista de proyecto indica **No backups**. No se encontró un `.verified.json` de respaldo productivo ni configuración de backup activa en la carpeta privada NOVA revisada. No se buscó indiscriminadamente en todos los archivos personales; por tanto se informa **no hay copia productiva recuperable verificada en esta ejecución**, no que ninguna copia pueda existir fuera de lo revisado.

La herramienta oficial del repositorio conserva backup PostgreSQL cifrado y restore exclusivamente LOCAL: [procedimiento manual](../supabase/backup/README.md). Sus ensayos previos son LOCAL, no respaldo de los datos productivos actuales. Incluye public, auth, metadata Storage e historial; **no los bytes de las tres imágenes/QR**. No se inventaron credenciales ni se inició una restauración productiva.

Sin una copia actual con recuperación verificada, un error de aplicación/infraestructura durante la migración no tendría una recuperación de datos garantizada para los dos productos/recetas, siete pedidos/pagos, tres clientes, tres usuarios Auth, insumo y configuración. No hay intención de borrarlos; sí existe el cambio deliberado de disponibilidad de OSO 2 y cambios de esquema/funciones. Una reversión del deployment no deshace SQL ni reconstruye datos/archivos Storage.

**Antes de SQL el propietario debe elegir:** aportar/crear y verificar un respaldo recuperable (con copia separada de imágenes si desea recuperación completa), o aceptar expresamente el riesgo concreto de proceder sin él. Esta entrega no incluye esa aceptación ni una autorización anticipada.

## Publicación y recuperación propuestas, todavía NO ejecutadas

1. Revisar el SHA final y autorizar explícitamente las dos migraciones, cuarentena de OSO 2, integración master y deployment completo. Resolver por separado la compuerta de backup anterior.
2. Reconfirmar ref `groyjvbtcuhjbltmmdfl` y las diez versiones; abortar ante otro ref o drift. Aplicar exclusivamente la primera candidata, transaccionalmente y registrando su versión; verificar resultado antes de la segunda. No ejecutar db push general sobre un enlace desconocido, repair, seed ni histórico.
3. Verificar ambas versiones, disponibilidad de productos, los siete pedidos intactos, vista/columnas/settings/triggers y ACL; sin crear operaciones de prueba productivas durante esta verificación.
4. Integrar el SHA aprobado a master sin force, push al repositorio correcto. La configuración existente actualizará el mismo proyecto Vercel. No activar flags de laboratorio/visual ni cambiar secretos productivos.
5. Esperar Production / Ready / Current y comprobar SHA y dominio efectivo. Smoke no destructivo de catálogo, producto, carrito/checkout sin enviar pedido, tracking, login y admin si hay sesión del propietario. Comprobar que se conservan los dos registros de productos (OSO activo y OSO 2 inactivo), no los 100 LAB ni promociones sintéticas.
6. Pruebas comerciales posteriores desde celular solo controladas, identificadas y autorizadas por separado; sin transferencias bancarias reales.

Ante error SQL: detenerse y comprobar rollback/versiones antes de cualquier paso siguiente. No continuar con la otra migración ni forzar historia. Ante fallo de build/deployment: no promover; conservar/reponer el deployment previamente Ready mediante el mecanismo existente de Vercel. El adaptador de devolución de cuatro argumentos conserva el contrato anterior durante la transición. No improvisar down migrations, eliminar columnas, reactivar stock ni borrar pedidos. Una restauración de datos requiere primero el procedimiento y backup comprobados, y autorización específica; nunca probar restore sobre producción.

El procedimiento general de restore se ensayó históricamente en LOCAL; no se afirma haber ensayado recuperación de la base productiva actual, cuyo backup falta. Esta limitación forma parte de la decisión, no se oculta tras el rollback de código.

## Archivos y límites de la entrega

Se conservan los archivos pendientes detallados en los dos informes previos. Esta ronda agrega `combo-progress.tsx`, `shopping-notice.tsx`, `combo-experience.test.tsx`, `qa-release-readiness-local.mjs` y este informe; modifica `home-page.tsx`, `product-detail.tsx` y `cart.tsx` para el armado/avisos. No se incorporan archivos de laboratorio, PDFs, claves o snapshots privados.

**Estado al detenerse:** código completo preparado en la rama de desarrollo; master y producción sin cambios; migraciones pendientes; despliegue y riesgo de falta de respaldo sujetos a aprobación final expresa.
