# Floristería Anabelle — informe consolidado QA30

Fecha: 20 de octubre de 2026. Código evaluado: `42b75b8166e60cf9c44709c1891905da70a42e22`. Rama: `codex/inventory-refunds-dashboard-2`.

**Resultado: certificación integral INCOMPLETA.** La evidencia técnica confirma resultados comerciales satisfactorios en los escenarios ejecutados, con las limitaciones de conservación descritas abajo. Faltan recorridos visuales y hay cuatro hallazgos de presentación pendientes. No se declara «todo PASS» ni se publica un manual definitivo.

Esta ronda utilizó exclusivamente `NOVA-LOCAL-INTEGRITY`, API `http://127.0.0.1:62621` y web `http://127.0.0.1:3116`. Las cuentas y operaciones simuladas son del laboratorio. No se accedió a Supabase remoto, Vercel ni producción para esta batería; no hubo push, merge o deploy.

## Alcance y criterio de lectura

Se investigaron los 30 escenarios solicitados, que incluyen excepciones, rechazos, cancelaciones, reservas y pruebas de inventario. **30 escenarios no significan 30 ventas finalizadas.** Los casos 19 y 20 comparten un pedido: primero se observa el reporte pendiente y después la confirmación. Las excepciones que deben rechazarse no generan pedidos; las reservas técnicas se cancelan al terminar su comprobación.

Se observaron resultados técnicos satisfactorios para los 29 escenarios distintos de la autocancelación del caso 22, pero parte del histórico de 01–20 tiene evidencia incompleta. La cancelación operativa por empleado del caso 22 funcionó; el contrato actual no ofrece autocancelación pública del cliente. Un PASS de API/Auth/SQL no certifica su pantalla, sus botones ni que una persona pueda completar el procedimiento sin ayuda.

La [matriz de los 30 casos](COMMERCE30_TEST_MATRIX.md) conserva el estado técnico, la evidencia visual y el estado completo por separado. Los recorridos completos pendientes no se convierten en PASS por tener filas finales correctas en la base.

## Datos utilizados y operaciones nuevas

Se reutilizaron los 60 productos realistas y sus insumos, recetas y promociones sintéticos anteriores. No se duplicó ese catálogo ni se borraron fixtures. Los precios en Bs son demostrativos, no afirmaciones sobre precios comerciales reales.

Para aislar las pruebas de última unidad, concurrencia y merma se añadieron por las APIs administrativas tres insumos y dos productos auxiliares. También se añadieron cuatro promociones mínimas, ocho entradas/lotes y dos mermas. Se conservaron todos los registros; el catálogo anterior no se agotó para fabricar esas condiciones.

Las operaciones comerciales recorrieron APIs reales de la aplicación con Auth real. **No se fabricaron ventas mediante INSERT en las tablas finales.** SQL se restringió a consultas de lectura para snapshots y conciliación. La foto DEMO reutiliza una ilustración sintética ya existente en Storage LOCAL; no se presenta como fotografía auténtica de la tienda.

El alcance contable explícito contiene 25 pedidos del runner —incluidas dos ventas físicas suplementarias— y los dos pedidos creados en navegador. La selección se hace por IDs conservados privadamente, no suponiendo continuidad de los números de pedido.

| Resultado del alcance | Cantidad |
|---|---:|
| Pedidos distintos | 27 |
| Finalizados | 23 |
| Rechazados | 1 |
| Cancelados | 3 |
| Pagos registrados | 22 |
| Pagos confirmados | 21 |
| Pagos rechazados | 1 |
| Devoluciones/reintegros/retorno físico registrados | 4 |
| Reservas asociadas | 60 |
| Movimientos de inventario asociados a pedidos | 57 |

SHA-256 de los 27 IDs ordenados: `7ecc2e6af1caec23e192b0018bddd9902d393a498a91bedaa6dea5aeebdccbf8`.

Los conteos globales del laboratorio incluyen además un pedido manual LOCAL fuera del alcance, pendiente por Bs 70 y con un pago pendiente. No se atribuye su autoría al runner, no se interpreta como un hueco de numeración y no se borró para hacer coincidir cifras.

| Tabla o grupo | Conteo inicial registrado | Conteo final global | Diferencia global |
|---|---:|---:|---:|
| Pedidos | 121 | 149 | +28 |
| Pagos | 62 | 85 | +23 |
| Líneas de pedido | 221 | 253 | +32 |
| Clientes | 44 | 64 | +20 |
| Insumos/ítems de inventario | 38 | 41 | +3 |
| Lotes / entradas | 59 | 67 | +8 |
| Reservas | 363 | 426 | +63 |
| Movimientos de inventario | 268 | 335 | +67 |
| Mermas | 5 | 7 | +2 |
| Devoluciones/reintegros/retorno físico | 14 | 18 | +4 |
| Partidas de ventas/reintegros | 70 | 96 | +26 |
| Movimientos de caja | 22 | 25 | +3 |
| Productos | 186 | 188 | +2 |
| Promociones | 26 | 30 | +4 |

Estas diferencias globales incluyen la actividad manual ajena a los 27 pedidos. Son contadores registrados y lecturas finales, no prueba de identidad de todas las filas previas; el inventario se utilizó mediante operaciones comerciales autorizadas.

## Conciliación financiera

| Concepto del alcance de 27 pedidos | Bs |
|---|---:|
| Ventas brutas reconocidas | 1.719,00 |
| Reintegros monetarios | 75,00 |
| Ventas netas | 1.644,00 |
| Ventas físicas en efectivo suplementarias | 115,00 |
| Reintegro de caja de esas ventas físicas | 10,00 |
| Efecto neto nuevo de caja | 105,00 |

Los reintegros de Bs 15 y Bs 50 de pedidos online y el reintegro físico de Bs 10 explican los Bs 75 monetarios. El retorno físico separado es de Bs 0: repone lo consumido una sola vez y no crea otro reintegro monetario. El reintento conserva esa idempotencia.

Las ventas online QR se reconocen en `sales_ledger`; no se inventan movimientos de efectivo para hacerlas aparecer en caja. El neto nuevo de caja corresponde a dos ventas físicas por Bs 50 y Bs 65, menos un reintegro de Bs 10.

Los reportes HTTP reales de Ventas, Caja, Productos vendidos, Inventario y Mermas respondieron 200. Ventas se contrastó a centavos con el ledger real. Los agregados de todo el laboratorio incluyen fixtures monetarios extremos de rondas anteriores; no deben confundirse con los Bs 1.719 de esta batería. La observación visual de dígitos extensos se documenta como COM30-004, no como un error de cálculo.

## Inventario, reservas y FIFO

- Los 41 ítems concilian stock físico con la suma remanente de sus lotes, sin existencias negativas y cubriendo las reservas que seguían vigentes al consultar.
- En el subconjunto del runner, 52 grupos pedido/insumo confirmados tienen exactamente las salidas exigidas por sus recetas. Los dos pedidos del navegador agregan verificaciones específicas de cantidad y FIFO; no se suman cifras de granularidad distinta como si fueran una misma métrica.
- Última unidad: el primer pedido reserva la capacidad y otro producto que comparte la rosa no puede reservarla. Dos solicitudes HTTP simultáneas producen exactamente un 201 y un 400, sin pedido parcial del perdedor. El ganador real fue el producto sin tarjeta de Bs 65; no se deduce por el orden de lanzamiento.
- Merma con reserva: de 10 rosas físicas y una reservada, intentar mermar 10 responde 400; mermar las nueve libres responde 201. Queda físico 1, reservado 1, libre 0 y los dos productos afectados se muestran agotados.
- Reposición: una entrada de nueve recupera capacidad del producto activo. El producto desactivado manualmente sigue sin aparecer públicamente hasta su reactivación explícita; una reposición no lo activa por sí sola.
- Tarjetas: una merma de 20 deja sin capacidad al producto que las consume; el producto sin tarjeta conserva disponibilidad. Una reposición posterior conserva el fixture utilizable.
- FIFO secuencial: dos lotes auxiliares con fechas distintas, dos rosas por lote, y una venta física real por API de empleado. Se verifica el `lot_id` exacto del lote más antiguo y que los demás remanentes no cambien.
- No se detectó doble consumo, stock negativo, reserva duplicada de la última rosa ni duplicación de clientes para las identidades sintéticas comprobadas.

Los detalles por caso y la rectificación del resumen preliminar sobre qué competidor ganó constan en la matriz. No se oculta esa corrección de evidencia.

## Cliente en navegador y empleado por API

El cliente recorrió realmente búsqueda, detalle, cantidad dos, dos dedicatorias distintas y sus vistas previas, carrito, recarga, checkout de recojo, revisión, QR2, recarga de la selección y «Ya pagué». El pedido de Bs 110 quedó en espera de revisión; no se confirmó automáticamente.

Se conservaron snapshots actuales antes y después del reporte: sin cliente materializado, sin recibo y sin consumo físico definitivo. La confirmación con Auth de empleado consumió exactamente dos peluches y dos tarjetas, siguiendo FIFO, y materializó al cliente. Un segundo intento respondió 400 sin consumo adicional.

El navegador del cliente observó Confirmado, En preparación, Listo y Retirado mientras las transiciones se ejecutaban mediante API de empleado. Las dedicatorias exactas siguieron disponibles. El enlace del recibo apareció después de confirmar; la petición HTTP devolvió PDF válido, 200, con 5.038 bytes y SHA-256 conservado privadamente. **La descarga desde navegador se abortó tras 155 segundos y no se marca PASS visual.**

La acción real de nueva compra permitió empezar otra compra con carrito y campos anteriores limpios. Se eligió una oferta gratuita, se ingresó la misma identidad sintética y una dedicatoria nueva: total Bs 0, sin QR ni «Ya pagué», sin pago creado, mismo cliente y consumo único de un peluche y una tarjeta. El pedido anterior y sus mensajes quedaron intactos. La segunda compra finalizó después mediante API de empleado, sin volver a consumir inventario.

También se probó en navegador un combo de dos peluches ya existente: subtotal Bs 105, total Bs 90 y dedicatoria solo en su componente elegible. Eliminar el componente sin tarjeta mediante la confirmación real retira el descuento y deja Bs 55, explicando que falta completar el combo. No se creó otro pedido. Ese suplemento no sustituye la prueba visual específica de flores más peluche.

El seguimiento anterior se reabrió realmente después de la segunda compra y conservó estado, importe y mensajes. Su última captura falló; la observación del navegador no se reemplaza por una fotografía de otro momento.

**Pendiente:** sesión visual de empleado. No se atribuyen sus botones o facilidad de operación a las llamadas API que sí fueron comprobadas.

## Administración observada

Se utilizó la sesión LOCAL del propietario, sin copiar ni publicar su contraseña. La revisión gráfica fue de lectura:

| Pantalla | Evidencia real | Lo que no se certifica por esa lectura |
|---|---|---|
| Pedidos | Listado, búsqueda del pedido del navegador y detalle con ambas dedicatorias. | Confirmar/rechazar/avanzar mediante botones de empleado; registrar devolución visual. |
| Dashboard | Métricas, gráfico y estados cargados. | Que su período/global coincida con los 27 pedidos seleccionados. |
| Inventario | Total de 41, búsqueda de insumos y consulta de lotes FIFO/remanentes. | Crear entradas, ajustes o mermas mediante la UI. |
| Caja | Caja abierta y los tres movimientos nuevos: 50, 65 y reintegro 10. | Apertura/cierre o registro de movimientos mediante botones. |
| Reportes | Ventas y Productos vendidos cargados realmente. | Descargas y observación de todos los demás reportes por UI. |
| Productos | Buscar, Acciones → Editar, Información y receta de tres insumos. | Guardar, crear o modificar producto/receta visualmente. No se pulsó guardar. |
| Configuración | QR DEMO, horarios y disponibilidad LOCAL. | Guardar cambios o extrapolar esos valores a producción. No se pulsó guardar. |
| Promociones | Listado, búsqueda, estados y búsqueda de participantes. | Crear, guardar, activar/desactivar o modificar participantes mediante UI. |

Las mutaciones técnicas de insumos, recetas, promociones, delivery, imagen, caja y reintegros sí pasaron por sus APIs reales. La carga multipart DEMO quedó enlazada al producto auxiliar y pudo descargarse desde Storage LOCAL con tamaño y SHA-256 comprobados; falta su documentación visual administrativa.

## Auth y contratos públicos

El empleado activo pudo confirmar/rechazar pagos y avanzar estados mediante las rutas previstas. Recibió 403 en configuración, usuarios, creación de promociones y registro de reintegros. No se ampliaron sus permisos para facilitar las pruebas.

El RPC privado de seguimiento rechazó acceso directo de anon y empleado; service_role pudo ejecutarlo. La API pública de seguimiento siguió funcionando y un teléfono incorrecto devolvió 404 sin pedido ni token. No se expusieron credenciales de servidor al navegador ni se publicaron los tokens de recibo.

No se ejecutó una nueva campaña de carga o fuzzing. La concurrencia nueva fue el caso acotado de dos solicitudes por una rosa. Las pruebas de otras rondas se mantienen como antecedentes, no se contabilizan como recién ejecutadas.

## Hallazgos y diferencias de contrato

| ID | Prioridad | Hallazgo confirmado | Impacto y estado |
|---|---|---|---|
| COM30-001 | P3 | La pantalla de pago reportado habla de pulsar Enviar en WhatsApp aunque el canal está deshabilitado y no aparece esa acción. | Instrucción confusa; no confirma pagos ni modifica importes. Pendiente. |
| COM30-002 | P2 | El listado reconoce QR, pero el modal administrativo presenta el mismo pago como «Efectivo · verificado». | Presentación inconsistente del método de pago; el dato persistido es QR y no se observó asiento incorrecto. Pendiente. |
| COM30-003 | P3 | La descripción del encabezado de Inventario queda prácticamente a una palabra por línea junto a cuatro acciones. | Lectura incómoda; botones visibles, sin bloqueo demostrado. Pendiente. |
| COM30-004 | P3 | Importes extremos de fixtures anteriores se parten dentro de un grupo de dígitos en Reportes. | Todos los dígitos están completos, pero son difíciles de recomponer; no se observó cálculo incorrecto. Pendiente. |

La matriz conserva pasos, esperado/obtenido, evidencia, impacto, mutación parcial y causa confirmada o hipótesis por hallazgo. COM30-002 tiene causa de presentación identificada en el contrato del detalle y su helper; las causas de layout de COM30-003/004 siguen siendo hipótesis sin un cambio experimental que las aísle.

No se confirmó un defecto P0/P1 en esta evidencia. Eso no certifica los recorridos faltantes. No se corrigió código comercial durante esta ronda; las correcciones realizadas fueron del harness y de la precisión de la documentación.

Dos diferencias comerciales se separan de los bugs:

1. **Entrega por coordinar:** la interfaz no calcula ni incorpora una tarifa de envío. Se verifican dirección, referencia y total de productos; no se inventa un cargo automático. Definir una tarifa sería otra decisión comercial.
2. **Cancelación pública:** no hay autocancelación de pedido por cliente. La cancelación atendida por personal libera reservas correctamente, pero no demuestra un botón cliente inexistente. Esa parte del caso 22 queda bloqueada/faltante.

## Incidencias de entorno y evidencia

Una interrupción durante la escritura no atómica truncó el manifiesto privado inicial de los casos 01–20. Los datos de negocio no se borraron; se habían observado sus resultados en terminal. Se reconstruyeron por SELECT 17 pedidos y sus datos durables para continuar sin repetir operaciones. **Esos metadatos reconstruidos no son respuestas HTTP originales ni un estado final recupera por sí solo sus preestados perdidos.** Se conserva la distinción entre observación histórica, reconstrucción y evidencia actual.

Los conteos iniciales registrados se conservan; no existe un snapshot original completo de filas que permita afirmar su identidad byte a byte. El snapshot posterior a la recuperación corresponde a otro momento y está marcado como tal. El runner ahora escribe atómicamente, conserva una versión anterior y se detiene si encuentra JSON vacío o inválido. El mecanismo excepcional de recuperación fue retirado del código versionable y permanece documentado privadamente.

Los nuevos snapshots del recorrido del navegador prueban otra vez las invariantes de reporte, confirmación, stock y cliente; no se presentan como recuperación de los snapshots perdidos. Los abortos/fallos de captura o descarga se registran como limitaciones de herramienta y no como defectos confirmados de la aplicación.

## Capturas y responsive

Hay 17 PNG conservados fuera de Git, inventariados individualmente en la matriz. Dos imágenes son fondos vacíos byte-idénticos y **no** se usan como evidencia visual aprobada. Los 15 PNG con UI también tienen límites de encuadre: una imagen del comienzo de Inventario no prueba sus lotes inferiores y una captura fuera del encabezado no demuestra por sí sola «Retirado».

El escritorio se revisó realmente. No se dispone de validación visual completa y fiable de esta ronda en 375, 390, 430, 768 y 1440 px, con alturas variadas; las dimensiones del PNG no se hacen pasar por ancho CSS del viewport. Los breakpoints revisados estáticamente no equivalen a PASS visual móvil/tablet. Tampoco se repitió una validación visual nueva de carritos de 5/10/20/30 líneas ni de la legibilidad completa de ambos QR en todos los tamaños.

## Calidad y conservación

| Control | Resultado de esta ronda |
|---|---|
| Suite `npm test -- --maxWorkers=2 --minWorkers=1` | PASS: 56 archivos, 684/684 tests; 137,23 segundos. |
| Lint completo | PASS: 0 errores, 0 warnings. El runner final volvió a pasar su lint específico. |
| TypeScript `npx tsc --noEmit` | PASS, exit 0. |
| Build | PASS, exit 0: `scripts/start-lab50-local.ps1 -Build` ejecutó `npm run build` con variables exclusivamente LOCAL. Compilación 19,0 s, TypeScript 12,6 s y 70/70 páginas generadas. |
| Secret scan | PASS de revisión por patrones en los siete archivos nuevos: cero coincidencias de claves privadas, JWT, tokens GitHub/AWS o URI PostgreSQL con contraseña; sin `.env`, dumps ni manifiestos privados incluidos. |
| `git diff --check` / sintaxis Node del runner | PASS, exit 0; también se revisaron los siete archivos sin seguimiento: cero líneas con espacios finales. |
| 14 migraciones activas y seed | Sin cambios respecto del SHA base. |
| Legacy | 39/39 hashes coinciden con el manifiesto histórico. |
| Replay 14 migraciones + seed | **No ejecutado nuevamente esta ronda.** Evidencia anterior, no nuevo PASS. |
| `ISOLATED_SECURITY_TESTS.sql`, `TWO_PAYMENT_QR_TESTS.sql`, `DEDICATIONS_TESTS.sql` | **No ejecutados nuevamente esta ronda.** SQL de esta ronda fue SELECT, no aplicación de fixtures SQL. |
| Código comercial / esquema | Sin cambios en `src/`, tests funcionales, migraciones o seed. |

El primer intento de Vitest fue bloqueado por el sandbox antes de ejecutar tests; el comando posterior completó la suite. La advertencia de deprecación CJS de Vite es de la herramienta y no un warning de ESLint. El manifiesto del runner registra 146 aserciones, 137 nombres únicos y cero FAIL; contiene relecturas, no 146 escenarios comerciales distintos.

Los cambios nuevos están limitados al runner y a documentación QA/borradores. No se crearon commits. HEAD sigue en `42b75b8166e60cf9c44709c1891905da70a42e22`; los archivos nuevos están sin commit para revisión, por lo que no se declara árbol limpio. Master y producción permanecen intactos.

La web LOCAL se reinició después del build con el launcher que sustituye explícitamente todas las variables Supabase consumidas por la aplicación. El catálogo respondió HTTP 200. No se copió la configuración privada al repositorio ni se reutilizaron credenciales remotas.

## Material para manuales y siguientes revisiones

- [Matriz comercial, hallazgos y catálogo de capturas](COMMERCE30_TEST_MATRIX.md).
- [Índice y criterios de los borradores](COMMERCE30_PROCEDURES_DRAFTS.md).
- [Borrador del administrador](COMMERCE30_ADMIN_DRAFT.md).
- [Borrador del empleado](COMMERCE30_EMPLOYEE_DRAFT.md).
- [Guía de cliente en borrador](COMMERCE30_CLIENT_DRAFT.md).

Los manifiestos JSON, snapshots, IDs de operación, hashes por tabla, recibo PDF y capturas permanecen en carpetas privadas fuera de Git. Este informe publica agregados y referencias de procedimientos, no credenciales ni tokens de recibo.

Para cerrar la certificación integral faltan: sesión visual de empleado, mutaciones administrativas mediante controles reales, cobertura móvil/tablet completa, capturas pendientes y revisión de los cuatro hallazgos. Los borradores son una base fiel a lo observado y marcan las partes pendientes; todavía no constituyen el manual oficial ilustrado.

**Conclusión:** evidencia funcional LOCAL sólida para los contratos probados y conciliación correcta del alcance, pero certificación integral **INCOMPLETA**. Se detiene para revisión; este informe no autoriza publicación, nuevas operaciones comerciales ni cambios productivos.
