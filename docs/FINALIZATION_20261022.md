# Informe de finalización y QA LOCAL — 22/10/2026

**Resultado:** correcciones y flujos funcionales comprobados en LOCAL; preparado para revisión. **No se declara certificación visual integral ni autorización de publicación.** Persisten fotografías oficiales por aportar y cobertura visual incompleta por fallos de captura/viewport. No hay P0/P1 funcional confirmado pendiente en el alcance ejecutado; las pruebas incompletas no son PASS.

## 1. Diagnóstico inicial

Se reutilizaron inventario compartido, FIFO, reservas, promociones, pagos manuales, dedicatorias, checkout y seguimiento. No se rehízo el backend. La matriz inicial y las incidencias están conservadas en la bitácora inferior; los seis documentos QA30 anteriores y su runner permanecen disponibles.

## 2. Cambios realizados y archivos

- Cuatro correcciones COM30: instrucciones de pago, selección del método/snapshot QR en detalle, encabezado de inventario y legibilidad de métricas monetarias.
- Dedicatorias: elección escribir/blanco, límites 250/60, mensaje obligatorio en modo escritura, edición desde checkout y notas independientes. La intención del editor no se agrega al esquema comercial: se transforma al contrato existente.
- Regresión adicional encontrada por navegador: la compra rápida podía omitir el snapshot explícito de tarjeta en blanco. `src/lib/public/checkout.ts` completa solo tarjetas faltantes, sin descartar ni replicar texto. Dos tests nuevos y pedido #231 verifican la corrección; #230 previo al arreglo conserva su evidencia original, sin parchearlo.
- Medios públicos opcionales: logo, foto de Nosotros e imagen de categoría; proveedor compartido, favicon provisional, formulario administrativo, validación/optimización existentes, API pública de lectura y API administrativa privada. Se quitó su editor JSON duplicado de Configuración general.
- Microinteracciones discretas sin librerías nuevas, conservación de identidad lavanda y tipografías.
- Archivos principales: `checkout.ts`, `dedications.ts`, `cart-logic.ts`; componentes `dedication-card`, `checkout-form`, `checkout-page`, `home/cart`, `home/catalog`, `home/product-detail`, `home/header`, `home/sections`, `customer-shell`, `promotion-chooser`, `payment-report-instructions`, `storefront-media`; `page-header`, `stat-card`, `orders-panel`, `reports-panel`, `system-settings`, `storefront-media-configuration`; configuración, layout, CSS, proxy y las dos rutas nuevas de medios. Pruebas de dedicatorias, COM30, métricas, medios y accesibilidad pública. El listado exacto se obtiene con `git status --short`; no se ocultan los siete artefactos QA30 previos.

## 3. Comparación visual y evidencia

Las capturas se mantienen fuera de Git, en la carpeta de visualizaciones de esta sesión. Comparación verificable: `commerce30-admin-inventario.png` conserva la descripción comprimida anterior; `finalization-20261022-inventory-390.png` y las otras capturas de inventario muestran el encabezado reorganizado. `finalization-20261022-employee-preparation.png` muestra la tarjeta lavanda separada de las notas. `finalization-20261022-cart-30-390.png` muestra el carrito lleno con total y CTA fijos. `finalization-20261022-free-blank-card.png` muestra el pedido gratuito sin QR.

No todas las capturas generadas son utilizables: carrito 430/1280 y seguimiento 375 presentan recorte/escala inconsistente del instrumento; no se usan para declarar PASS visual completo. Las capturas anteriores no se borraron. Las mediciones DOM y la revisión de una imagen son evidencias distintas.

`finalization-20261022-evidence-index.json`, fuera de Git, inventaría18capturas dimensionadas y sus SHA-256; seguimiento768 también queda marcado parcial. Conserva las exclusiones, no solo los resultados favorables.

## 4. Auditoría de imágenes

Laboratorio: **189 productos, 102 con imagen y 87 sin imagen**; los **60 TEST BO** existentes no tienen foto. El producto auxiliar creado por UI usa un icono provisional identificado como prueba, no fotografía comercial. La categoría TEST BO recibió ese mismo recurso de prueba mediante la configuración nueva, convertido a WebP y descargado correctamente por la tienda.

Logo oficial y fotografía auténtica de Nosotros: no proporcionados/configurados. Se mantienen marca provisional explícita e ilustración floral. Portada, catálogo, detalle y promociones conservan recursos existentes; no se inventaron tienda, equipo, historia, premios ni fotografías. Antes de lanzamiento comercial deben aportarse los archivos autorizados correspondientes. El favicon nuevo sigue siendo provisional y no se sincroniza automáticamente con el logo configurable.

## 5. Siete microinteracciones

|Área|Implementación/evidencia|Límite de verificación|
|---|---|---|
|Portada|Pétalos finitos, transform/opacity, 350 ms; CSS efectivo observado, una iteración|No video ni emulación de reduced motion|
|Productos|Entrada existente 220 ms y hover discreto; CSS efectivo observado|Sin benchmark de FPS|
|Añadir/carrito|Feedback y contador existentes reutilizados; 30 añadidos por botones|Capturas estáticas no prueban duración|
|Favoritos|Latido breve 160 ms al seleccionar|Revisión de implementación, no video final|
|Promoción|Fade al cambiar oferta/ahorro, sin remonte del selector|Cambio 10% → gratis probado por UI|
|Seguimiento|Etapas reales e iconos existentes, sin adelantar estados|Estados por UI y seguimiento público comprobados|
|Tarjeta|Cambio escribir/blanco y preview, 160 ms|Mensajes, firma, errores y modo mixto probados|

Animaciones nuevas bajo `prefers-reduced-motion: no-preference`, además del tratamiento global `reduce`; no se animan width/height/top/left ni se agregan dependencias pesadas. No se afirma prueba visual real con la preferencia reducida activada: el navegador observado la tenía desactivada.

## 6. Hallazgos COM30

|Hallazgo|Resultado|
|---|---|
|COM30-001 WhatsApp deshabilitado|Corregido; navegador de #227/#228/#230 no invita a enviar un mensaje inexistente. Tests cubren copia con/sin WhatsApp. No se enviaron mensajes reales.|
|COM30-002 QR mostrado como efectivo|Corregido; detalle solicita método y snapshot. QR 2 observado en #227, QR 1 en #228, efectivo real del fixture en #229.|
|COM30-003 encabezado comprimido|Corregido; capturas nuevas y geometría a seis anchos.|
|COM30-004 importes cortados|Corregido; nowrap, espacio de métricas y scroll accesible de último recurso. Importe real del lab Bs 10.000.009.485,49 leído completo en DOM; falta cerrar captura estable final del informe a todos los anchos.|

## 7. Dedicatorias e indicaciones

PASS real: escribir vacío bloquea añadir; mensaje/firma y saltos se conservan; edición en checkout persiste tras recarga; #227 llega al personal y seguimiento sin mezclar notas. #228 contiene dos tarjetas independientes, una en blanco y una escrita, con igual precio/consumo físico. #231 prueba compra rápida con snapshot en blanco sin tocar el editor. #230 documentó la omisión anterior y fue rechazado por el empleado sin materializar cliente. Producto sin tarjeta observado sin editor; SQL transaccional verifica rechazo atómico de dedicatorias no permitidas.

## 8. Promociones

PASS HTTP/Auth/SQL en elegibilidad, porcentaje, fijo, compra mínima, combo, combo incompleto, inactiva, vencida, mixto y total cero. PASS UI: sugerencia de mayor ahorro no se aplica sola; Bs 55 → Bs 49,50 al seleccionar 10%, luego Bs 0 con la oferta gratuita, una sola promoción. Admin creó oferta 10%, la editó a 12% y creó combo Bs 60 con dos productos distintos; ambas promociones auxiliares quedaron **inactivas**, preservadas.

## 9. Matriz comercial nueva de 30 casos

H = HTTP/Auth/SQL real LOCAL; N = navegador real. Ningún PASS H implica automáticamente PASS visual.

|Caso|Escenario|Resultado/canal|
|---|---|---|
|01|Ramo de seis rosas/recojo|PASS H|
|02|Doce rosas/entrega|PASS H|
|03|Girasoles QR 1|PASS H|
|04|Caja floral QR 2|PASS H|
|05|Peluche sin tarjeta|PASS H|
|06|Peluche con tarjeta|PASS H|
|07|Dos regalos/mensajes distintos|PASS H|
|08|Dos unidades/tarjetas independientes|PASS H + N #228|
|09|Combo flores/peluche|PASS H|
|10|Tarjeta en componente correcto|PASS H|
|11|Combo incompleto rechazado|PASS H|
|12|Porcentaje elegible|PASS H + N|
|13|Monto fijo único|PASS H|
|14|Compra mínima|PASS H|
|15|Promoción vencida|PASS H|
|16|Promoción inactiva|PASS H|
|17|Carrito mixto/elegibilidad|PASS H|
|18|Total cero sin QR ni pago|PASS H + N #231|
|19|Reporte permanece pendiente|PASS H + N #227/#228|
|20|Empleado confirma/consumo único|PASS H + N #227/#228|
|21|Empleado rechaza/libera reserva|PASS H + N #230|
|22|Cliente solicita cancelación|Personal operativo PASS H; autoservicio público BLOQUEADO/no existente, no activado por instrucción|
|23|Última unidad/reserva excluyente|PASS H|
|24|Dos pedidos compiten por una rosa|PASS H, respuestas 201/400|
|25|Merma con reserva existente|PASS H|
|26|Reposición recupera disponibilidad|PASS H + entrada/merma/reposición N|
|27|Merma de tarjetas afecta solo receta correspondiente|PASS H|
|28|Reintegro parcial|PASS H + N #227|
|29|Devolución total/retorno físico|PASS H + N #229|
|30|Segunda compra/mismo cliente/seguimiento previo|PASS N #227 → #228; seguimiento #227 reabierto; SQL una identidad compartida con #231|

Runner: **225 comprobaciones registradas, 224 PASS**. La restante es el bloqueo inicial del fixture por la reserva previa #197: se conservó, se adaptó la disponibilidad libre y las repeticiones pasaron. No se borra ni se cuenta ese fallo inicial como PASS; tampoco se clasifica como defecto de la aplicación. Hay 28 escenarios PASS y uno con alcance comercial bloqueado en H; caso30 queda acreditado separadamente por navegador/SQL, no por respuestas HTTP inventadas.

## 10. Empleado

Sesión iniciada por el propietario, verificada como Empleado. Pedidos, QR auxiliar, confirmación manual, rechazo con motivo, dedicatorias, notas, preparación, listo, entrega y recojo comprobados mediante botones. Configuración devuelve «Acceso no autorizado»; cancelar una venta pagada está deshabilitado. HTTP suplementario confirma 403 en usuarios/configuración/creación de promociones/reintegros; RPC tracking directo denegado a JWT empleado y anon, permitido al servicio. No se amplió ningún rol.

## 11. Administrador

Comprobados por formularios/botones: producto nuevo inactivo, edición/activación/desactivación, imagen de prueba y alt, insumo y clasificación tarjeta, entrada/lote, receta, merma/reposición; promoción/edición/combo; horario y pausa/reanudación de entrega; revisión del método de pago; venta física, caja, devolución, reintegro, reportes y dashboard. La confirmación bancaria simulada de pedidos normales se ejecutó como empleado; admin revisó el pago QR y avanzó el pedido gratuito. No se afirma una segunda confirmación bancaria de admin sobre un pago ya confirmado.

Horario del jueves se probó 08:00–20:00 y se cerró por UI; luego se restauraron sus horas originales NULL mediante limpieza SQL LOCAL explícita y guardada, sin ocultar errores. Entrega quedó nuevamente desactivada. Producto auxiliar y sus dos promociones: inactivos, no eliminados. Las fotos de prueba y registros sintéticos se conservan.

## 12. Responsive/accesibilidad

- Mediciones DOM reales en **375/390/430/768/1280/1440**: inventario, seguimiento y carrito, sin overflow horizontal en las comprobaciones registradas. Carrito de 30, altura740: CTA y=668–716 visible en los seis. Checkpoints 1/5/10/20/30 a390×844: CTA y=772–820.
- Capturas utilizables e inspeccionadas: inventario (seis anchos, del corte previo al ajuste final de métricas cortas), carrito390/768/1440 y375 con escala de herramienta, seguimiento390/430/1280/1440, portada390 y confirmación gratuita1440. Las capturas parciales indicadas en sección3 no certifican la pantalla completa.
- Confirmación de eliminar visible; conservar mantiene30 líneas; navegación por teclado/Enter abre checkout. Formularios con labels, errores, radios, preview y estados accesibles; importes largos disponen de nombre accesible y scroll por teclado cuando corresponde.
- **Pendiente:** cobertura visual estable de todas las pantallas a los seis anchos, teclado virtual de celular físico, emulación visual de reduced motion y contraste instrumental completo. No se convierte en bug ni PASS por falta de herramienta.

## 13. Conciliación financiera

Scope explícito: **29 pedidos** (24 runner + cinco UI #227–#231), **24 pagos:22 confirmados/2 rechazados**. Bruto **Bs1.664**, reintegros **Bs100**, neto **Bs1.564**. Subscope UI: bruto115, reintegros25, neto90. #229 caja: venta15/devolución15/neto0. Reintegro QR #227 no inventa movimiento de efectivo ni transferencia bancaria. #231 cero pagos. Estas cifras no son el total histórico del laboratorio, que conserva otras pruebas de importes extremos.

## 14. Inventario y datos

**42/42** insumos con físico=lotes, sin negativos; **58/58** grupos pedido/insumo con consumo exacto. Auxiliar de tarjetas: entrada10, merma2, reposición2, pedido228 consume2, venta229 consume1 y devolución repone1: saldo8. Rechazo230 no consume definitivamente. #197 sigue pendiente y no se canceló para facilitar pruebas.

Contadores del último snapshot del runner: pedidos178, pagos109, líneas286, clientes65, insumos42, lotes72, reservas490, movimientos408, entradas72, mermas11, devoluciones24, ledger125, movimientos de caja29, productos189, promociones32. Los cambios de estado posteriores no crean filas comerciales adicionales. Se reutilizaron los60 TEST BO; no se clonaron. Ningún dato se transfirió a producción ni se borró automáticamente.

## 15. Pruebas técnicas, SQL y seguridad

|Comprobación|Resultado|
|---|---|
|npm test, último corte|**704/704**,59 archivos,6,80s,exit0|
|npm run lint|**0 errores/0 warnings**,exit0|
|npx tsc --noEmit|PASS,exit0|
|Build LOCAL final|PASS,exit0; compilación4,4s,TypeScript3,2s,73/73páginas|
|Replay aislado|**15 migraciones+seed**,15 versiones,0pedidos iniciales, sin reset del lab principal|
|ISOLATED_SECURITY_TESTS.sql|PASS real/ROLLBACK|
|TWO_PAYMENT_QR_TESTS.sql|PASS real/ROLLBACK|
|DEDICATIONS_TESTS.sql|PASS real/ROLLBACK|
|INVENTORY_REFUNDS_TESTS.sql|PASS real/ROLLBACK|
|DELIVERY_AVAILABILITY_TESTS.sql|PASS real/ROLLBACK tras añadir prerrequisito sintético explícito|
|STOREFRONT_MEDIA_TESTS.sql|PASS real/ROLLBACK; ACL anon/auth denegada, servicio permitido, merge/actor/ruta inválida|
|HTTP medios|Anon POST307 sin acceso; empleado403; admin archivo inválido400; lectura pública200; subida UI exitosa|
|PDF #227|HTTP200 application/pdf,4974bytes,magic%PDF-,SHA256 guardado en privado; no se afirma descarga por navegador|
|Smoke final GET LOCAL|200 en home,checkout,seguimiento,products?limit=1,business-hours,payment-qr,storefront-media; sin escrituras|
|Legacy|**39/39 SHA-256** idénticos al manifiesto original|
|14 migraciones previas y seed|Sin modificación|

La primera ejecución del fixture de entrega en replay vacío se detuvo por falta de administrador. Se repitió dentro de transacción con Auth/perfil/categoría sintéticos y terminó en ROLLBACK; posteriormente0perfiles/0categorías/0pedidos. No se omitió el error. Advertencia CJS de Vite existente no es warning de ESLint. Secret scan final:47archivos modificados/nuevos,0coincidencias; ningún .env, archivo privado, dump o node_modules incluido. Escaneo por patrones, no garantía absoluta. `git diff --check`:PASS. La eliminación del editor JSON duplicado también se verificó por DOM en el build final: un panel «Imágenes de la tienda», cero etiquetas `storefront_media`.

Replay: `NOVA-LOCAL-FINALIZATION-20261022`,localhost58621/58622, desvinculado. Web de revisión: localhost3116 → **NOVA-LOCAL-INTEGRITY**,localhost62621. Credenciales/manifiestos/PDF/imágenes permanecen privados fuera de Git. El launcher LOCAL sobrescribe las variables Supabase; no se utilizó la configuración remota de `.env.local`.

## 16. Migración necesaria

Solo nueva **20261022000100_storefront_media.sql**: inserción idempotente de configuración vacía y función SECURITY INVOKER privada para actualización atómica, actor activo administrador, validación de rutas, lock y auditoría existente. Sin alteraciones comerciales, eliminación de registros, nuevas tablas de pedidos ni buckets. Permiso EXECUTE exclusivo service_role. Probada LOCAL y por replay; **no aplicada remotamente**. No se editan14anteriores,seed ni39legacy.

## 17. Pendientes y riesgos

- Cerrar revisión visual incompleta con instrumento estable o dispositivo; no se promete certificación completa por mediciones DOM.
- Aportar logo y fotografías comerciales auténticas/autorizadas; no publicar los recursos de prueba como marca/fotos oficiales.
- Delivery conserva envío por coordinar; tarifas y autocancelación se analizan pero no se activan. No agregar cargos ni cancelación pública solo con UUID.
- Subida de medio que termina en error al guardar configuración mantiene la imagen previa y devuelve503; puede dejar un archivo huérfano. No se implementa limpieza destructiva automática.
- Los cambios están en worktree, no en un commit certificado nuevo. Revisar diff antes de crear el commit/publicar.
- No se revisó un backup productivo vigente en esta ronda LOCAL; comprobarlo antes de cualquier futura migración.

## 18. SHA y Git

Rama **codex/inventory-refunds-dashboard-2**. HEAD y master local **42b75b8166e60cf9c44709c1891905da70a42e22**; los tests corresponden al worktree modificado, no a ese commit sin cambios. No se crearon commits, ramas, push, merge ni deploy. Árbol con cambios preservados para revisión; no se afirma árbol limpio. No se accedió a Supabase productivo/antiguo ni Vercel.

## 19. Pasos futuros para publicar — no ejecutados

1. Revisar diff/capturas/limitaciones y aportar medios definitivos. Cerrar cobertura visual pendiente.
2. Crear commit revisable de este worktree y registrar su SHA; conservar evidencia privada fuera de Git y repetir checks ante cambios nuevos.
3. Con autorización posterior, verificar backup productivo recuperable e historial real de migraciones. No suponer desde LOCAL qué versiones tiene remoto.
4. Aprobar únicamente la migración nueva necesaria; nunca baseline sobre producción existente, legacy ni seed sintético.
5. Solo tras autorización expresa: integración a master, proyecto Vercel existente y smoke no destructivo del SHA desplegado. Ningún producto/pedido/promoción LAB debe transferirse.

---

# Bitácora de ejecución anterior al cierre

Ronda iniciada el 22/10/2026. Rama `codex/inventory-refunds-dashboard-2`, base `42b75b8166e60cf9c44709c1891905da70a42e22`. Documento en curso, no certificado final ni autorización de publicación.

## Preservación y diagnóstico inicial

Se leyeron el informe QA30, su matriz y los borradores. Sus siete archivos sin commit se conservaron; no se sobrescribieron sus manifiestos privados. Master sigue en el SHA base. Ninguna operación remota, push, merge o deploy está autorizada en esta ronda. Las 14 migraciones anteriores y seed se preservan.

| Subsistema | Estado inicial | Evidencia / pendiente |
|---|---|---|
| Inventario compartido, recetas, FIFO, disponibilidad | EXISTENTE / FUNCIONA en contratos probados | QA30 real; repetir conciliación después de la nueva batería, no reconstruir inventario. |
| Tarjetas y dedicatorias | EXISTENTE / INCOMPLETO | Persisten por artículo; faltaban elección explícita escribir/blanco y edición en checkout. |
| Promociones y combos | EXISTENTE / FUNCIONA en contratos probados | Una promoción; elegibilidad y sugerencia sin aplicación automática ya implementadas. |
| Carrito | EXISTENTE / INCOMPLETO visual | Footer y cuerpo desplazable existentes; repetir 1/5/10/20/30 líneas y teclado. |
| Checkout, QR1/QR2, reporte y confirmación | EXISTENTE / FUNCIONA en contratos probados | Confirmación siempre manual; COM30-001 y COM30-002 de presentación. |
| Seguimiento y recibos | EXISTENTE / NO VERIFICADO completamente en navegador | Descargar PDF y completar observación del empleado. |
| Pedidos, caja, devoluciones y reportes | EXISTENTE / FUNCIONA técnicamente / INCOMPLETO visual | QA30 incluyó lectura admin; faltan mutaciones por botones. |
| Delivery/recojo | EXISTENTE / FUNCIONA según contrato | Envío por coordinar sin tarifa automática; no se inventan zonas/precios. |
| Autocancelación pública | NO EXISTENTE / NO ACTIVAR | Mantener cancelación por personal; analizar alternativas antes de decidir. |
| Logo, imágenes de categorías y Nosotros administrables | INCOMPLETO | Sin logo oficial ni fotografías auténticas disponibles en el repositorio; conservar recursos provisionales identificados. |

## Implementaciones en curso

- COM30-001: instrucciones de pago reportado condicionadas al WhatsApp realmente disponible; no cambia pagos.
- COM30-002: detalle solicita método y snapshot QR persistidos; fallback desconocido deja de inventar Efectivo.
- COM30-003: encabezado compartido coloca acciones debajo hasta escritorio amplio, evitando comprimir descripción.
- COM30-004: métricas monetarias sin cortes de dígitos, más espacio de tarjeta y desplazamiento interno de último recurso accesible por teclado.
- Tarjetas: elección escribir/blanco por unidad, validación de mensaje obligatorio al escribir, límites 250/60; intención solo de borrador, retirada antes de guardar `order_items.dedications`. Se conservan receta, precio y consumo de tarjeta en blanco.
- Checkout: edición de tarjetas en la revisión reutiliza el mismo carrito y campo de pedido; indicaciones adicionales separadas y aclaradas, usando notas existentes.
- Carrito: revisión de tarjetas desplegable y rechazo de borradores de escritura incompletos; no duplica cantidades/descuentos.
- Medios públicos opcionales: logo, Nosotros y categoría en configuración existente, Storage `product-images`; optimización y validación de imagen reutilizadas. Marca floral provisional explícita cuando falta logo.
- Microinteracciones: pétalos finitos de portada, hover existente, feedback/contador existente, corazón breve, transición del descuento, estados reales existentes y editor de tarjeta. Solo transform/opacity para animaciones nuevas, sin dependencias añadidas, bajo `prefers-reduced-motion: no-preference`.

## Migración nueva y pruebas SQL

`20261022000100_storefront_media.sql`: solo configuración de imágenes y RPC privado de actualización atómica. No modifica tablas o funciones comerciales, pedidos ni registros financieros. No se cambia seed. Pendiente de aprobación y aplicación productiva.

En LOCAL se confirmó API `http://127.0.0.1:62621`, contenedor `supabase_db_NOVA-LOCAL-INTEGRITY`, ausencia de project-ref remoto, 14 versiones previas registradas y 149 pedidos existentes antes de pruebas nuevas.

Incidencias registradas, sin correcciones silenciosas:

1. Docker estaba detenido. Se inició Docker Desktop instalado; ningún reset de base.
2. `migration up --local` se detuvo porque la carpeta del laboratorio no tenía las copias de las migraciones 13/14 ya registradas. Se copiaron los originales oficiales faltantes, sin ejecutar repair ni cambiar su historial. Después se aplicó únicamente la 15.
3. La prueba nueva encontró la suposición incorrecta `role='admin'`; el sistema usa `administrador`. Se corrigió solo la candidata nueva y su función LOCAL, conservando las 14 originales. La repetición transaccional pasó y terminó en ROLLBACK.
4. HTTP detectó que el nuevo endpoint público estaba redirigido al login por la lista explícita del proxy. Se añadió solamente la ruta de lectura; la subida administrativa continúa privada. Se agregó regresión de ambas rutas. Falta repetir el HTTP con el siguiente build.

`STOREFRONT_MEDIA_TESTS.sql`: PASS LOCAL en ACL real anon/authenticated denegadas, grant de servicio, actualización combinada sin pérdida y `updated_by`, y ruta inválida rechazada. Todos los cambios de fixture revertidos por ROLLBACK. No equivalen a una prueba HTTP de subida ni a un replay limpio completo.

## Calidad — cortes parciales

- 66/66 tests dirigidos de correcciones/dedicatorias/checkout antes de soporte fotográfico.
- Suite completa posterior: 700/700 tests, 58 archivos, 14,02 s. Primer intento dentro del sandbox: 699 PASS y una junction temporal de backup denegada por EPERM; repetición fuera de esa restricción: 700 PASS, sin omitir/modificar ese test.
- ESLint completo: 0 errores / 0 warnings en el corte anterior al ajuste de proxy y sus dos tests nuevos. Repetir al cierre.
- TypeScript y build de ese corte: PASS; 73/73 páginas generadas. Hay cambios posteriores de proxy que requieren nuevo build.
- No atribuir PASS de QA30 anterior a la nueva batería solicitada. Repetición de 30 escenarios, replay limpio, conciliación, secret scan y hashes finales: pendientes.

## Evidencia visual de esta ronda

El navegador aplicaba factor 1,25 entre la dimensión solicitada y `innerWidth`. Se calibró mediante la capacidad oficial viewport: override 312×675 produjo **390×844 CSS reales**, medidos en DOM. ClientWidth y scrollWidth 371: sin overflow horizontal en la portada observada. Esto permite intentar los anchos solicitados con medición real; no asumir que el parámetro de la herramienta sea el ancho CSS.

Captura nueva fuera de Git: `finalization-20261022-home-390.png`. La portada usa la ilustración DEMO ya existente, sin inventar fotografía del negocio. Sesión admin LOCAL del propietario verificada en navegador; sesión empleado todavía por comprobar.

El primer intento de leer la pestaña de error fue bloqueado por política de URL del navegador. No se eludió: el propietario abrió una nueva pestaña LOCAL válida y luego se continuó allí. No se inspeccionaron pestañas de Vercel/Supabase remoto.

## Auditoría fotográfica inicial

| Espacio | Fuente actual | Acción |
|---|---|---|
| Portada | Imagen de producto destacado; en este lab es ilustración DEMO | Reutilizar fotografía comercial configurada cuando exista; no llamarla foto auténtica. |
| Categorías | Antes solo texto | Soporte de imagen individual administrable; mientras falta, icono floral neutral. |
| Catálogo/detalle/carrito | Storage de productos existente | Mantener alt, tamaños y carga existente; no sustituir con fotos inventadas. |
| Promociones | Productos participantes existentes | Mantener relación con productos y su imagen real configurada. |
| Nosotros | Ilustración floral identificada | Configuración de foto auténtica preparada; ilustración se conserva cuando falta. |
| Dedicatorias | Vista previa lavanda con icono floral | No necesita fotografía decorativa. |
| Formularios/pago | Datos del pedido y QR configurado | No añadir decoración fotográfica en formularios sensibles. |
| Footer/favicon | Marca floral provisional | Identificada como provisional; logo real configurable en header/footer/compra. |

## Decisiones comerciales que no se activan

- Delivery: mantener costo por coordinar. Alternativas futuras: importe informado por personal antes de cobrar, zonas y tarifa explícita, o cotización externa; cada una requiere reglas de recálculo/confirmación y comunicación al cliente. No añadir un cargo sin aprobación.
- Cancelación pública: mantener solicitud al personal. Un autoservicio futuro necesitaría identidad/token, límite de estado/tiempo, manejo de pago ya reportado y carreras con confirmación; no exponer cancelación solo con UUID.

El manual definitivo queda fuera de esta ronda. Esta bitácora se completará con evidencia nueva antes de declarar la certificación integral.

## Corte adicional — sesiones y replay limpio

- Sesión empleado LOCAL confirmada después del acceso realizado por el propietario. Dashboard y pedidos cargan; `/admin/configuracion` muestra «Acceso no autorizado».
- Navegador cliente independiente `127.0.0.7`: escribir tarjeta vacía impide añadir; mensaje y firma válidos permiten añadir. Edición del mensaje en checkout sobrevive a recarga, al igual que datos y notas. Sin tarjeta en receta no apareció editor en el producto de control observado.
- Pedido sintético nuevo **#227**, Bs 70, recojo, QR 2: creado y reportado mediante botones; permanece pendiente hasta confirmación del empleado. Este confirmó, inició preparación, marcó listo y finalizó mediante botones reales. Detalle muestra QR 2 auxiliar, tarjeta lavanda y notas independientes; cancelar venta pagada está deshabilitado para empleado. Seguimiento público posterior: Retirado/Pago confirmado y comprobante disponible. No hubo pago bancario ni contacto WhatsApp real.
- Insumo nuevo `TEST UI FINAL 20261022 · Tarjeta de felicitación`: entrada 10, merma 2 y reposición 2 mediante formularios. Resultado físico final 10. No se borró evidencia ni se alteró el pedido previo #197.
- Captura `finalization-20261022-employee-preparation.png` fuera de Git. Seguimiento capturado a **375/390/430/768/1280/1440 CSS**, medidos individualmente; clientWidth=scrollWidth en los seis. La escala de herramienta cambió entre llamadas: las primeras capturas con dimensiones menores quedan identificadas por su ancho real, no se cuentan como los anchos requeridos.
- Suite final en este corte: **702/702**, 59 archivos, 6,96 s. ESLint salida 0, sin errores/warnings. `npx tsc --noEmit` salida 0. Build con los últimos ajustes todavía pendiente.
- Replay adicional en **NOVA-LOCAL-FINALIZATION-20261022**, API localhost:58621, DB localhost:58622, desvinculado; no se reseteó NOVA-LOCAL-INTEGRITY. **15 migraciones + seed**, inicio satisfactorio, 15 versiones registradas y 0 pedidos.
- SQL real en esa instancia nueva: ISOLATED_SECURITY_TESTS, TWO_PAYMENT_QR_TESTS, DEDICATIONS_TESTS e INVENTORY_REFUNDS_TESTS terminaron en ROLLBACK y PASS.
- DELIVERY_AVAILABILITY_TESTS se detuvo primero por falta de su administrador sintético requerido, no por defecto del esquema. Repetición explícita con usuario/categoría sintéticos dentro de la misma transacción: PASS/ROLLBACK. STOREFRONT_MEDIA_TESTS también PASS/ROLLBACK con esos prerrequisitos. Verificación posterior: 0 perfiles, 0 categorías y 0 pedidos persistidos.

No se certifican todavía todas las acciones visuales administrativas ni los 30 escenarios completos de esta nueva ronda. Continúan pendientes las pruebas visuales restantes, subida por UI, revisión final del build y conciliación con las nuevas acciones UI.

## Corte de navegador y calidad posterior

- Producto auxiliar nuevo `TEST UI FINAL 20261022 · Tarjeta de regalo`, Bs 15: creación inactiva, receta de una tarjeta por unidad, subida de PNG derivado del icono provisional existente, edición de alt descriptivo, activación y disponibilidad por formularios. Imagen identificada como prueba, no fotografía auténtica. Catálogo y detalle cargan la imagen y detectan la tarjeta de la receta.
- Configuración de medios: seleccionada categoría TEST BO existente, preview antes de guardar, guardado exitoso, input limpiado y objeto WebP cargado en la tienda pública desde Storage LOCAL. Logo/Nosotros permanecen sin configurar: no se presentó el icono sintético como logo oficial ni foto auténtica.
- Entrega se activó mediante switch solo para crear **#228**, luego se restauró desactivada. #228, Bs 30, dos unidades: tarjeta 1 en blanco, tarjeta 2 escrita. Reportó QR 1 y el empleado confirmó/preparó/marcó listo/finalizó por UI aun después de desactivar nuevas entregas. SQL confirma dos snapshots independientes, método QR real y consumo de dos tarjetas; el insumo auxiliar queda en 8 tras esta venta. #227 permanece finalizado.
- Carrito en origen LOCAL separado `127.0.0.8`: se añadieron **30 productos distintos** existentes mediante botones reales, sin crear pedido. Checkpoints 1/5/10/20/30: a 390×844 CSS el CTA quedó entre y=772 y=820, siempre visible. Carrito de 30 a 375/390/430/768/1280/1440×740 CSS: CTA entre y=668 e y=716 y clientWidth=scrollWidth en los seis. Capturas fuera de Git. Confirmación de eliminar visible, «Conservar producto» mantiene las 30 líneas; Enter sobre «Continuar compra» navega a checkout.
- Capturas inspeccionadas visualmente de carrito lleno a 390 y 1440; las otras cuatro conservan evidencia y medición DOM pero requieren revisión visual individual para no extender el PASS indebidamente.
- La prueba posterior del checkout de 30 tuvo interrupción de herramienta; al recuperar la pestaña se verificó que estaba en Entrega, luego Revisión. No se creó ningún pedido de volumen. No se atribuye fallo a la aplicación por el timeout del navegador.
- Build más reciente **PASS**: compilación 5,7 s, TypeScript 9,1 s, 73/73 páginas. Se detuvo únicamente Next LOCAL y se reinició con el launcher seguro, sin resetear Supabase. Web sigue en 3116.
- **39/39 hashes SHA-256 legacy** coinciden byte a byte con el manifiesto histórico; seed sin diff. Secret scan por patrones en los **46 archivos modificados/nuevos**: 0 coincidencias y 0 nombres privados/.env/dumps. Revisión por patrones tiene alcance limitado y no constituye garantía matemática de ausencia de secretos.
- HEAD y master siguen **42b75b8166e60cf9c44709c1891905da70a42e22**, sin commit/push/merge/deploy ni SQL remoto. Árbol deliberadamente con cambios de esta ronda pendientes de revisión, no se declara limpio.
