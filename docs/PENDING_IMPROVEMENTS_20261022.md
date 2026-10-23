# Mejoras sin banners — informe de implementación LOCAL

## 1. Estado Git inicial y final

Rama exclusiva: `codex/inventory-refunds-dashboard-2`. HEAD inicial y final: `42b75b8166e60cf9c44709c1891905da70a42e22`. Master conserva ese SHA. Se preservó el trabajo previo sin commit; esta ronda añade cambios sin publicar. No se creó otra rama, ni se ejecutó push, merge, deploy o SQL remoto.

## 2. Trabajo reutilizado

Se conservan QA30, sus borradores y evidencias privadas, `FINALIZATION_20261022.md`, medios públicos, dedicatorias independientes, tarjeta en blanco, edición en checkout, notas separadas, inventario compartido, reservas/FIFO, promociones, QR y confirmación manual. No se añade ningún banner ni sistema paralelo de compra.

## 3. Archivos de esta ronda

- Inventario: `src/components/admin/inventory/inventory-management.tsx`.
- Productos: `product-list.tsx`, `product-management.tsx`, nuevo `product-recommendations.tsx` en `src/components/admin/products/`.
- Público: `home/home-page.tsx`, `home/product-detail.tsx`, nuevo `home/complement-confirmation.tsx`, `home/header.tsx`, `home/catalog.tsx`, `dedication-card.tsx`, `promotion-chooser.tsx`, `checkout-form.tsx` y `src/app/globals.css`.
- Nuevas rutas `api/admin/products/[id]/recommendations` y `api/products/[id]/recommendations`.
- Nuevo test `__tests__/product-recommendations.test.ts`, runner `scripts/qa-recommendations-local.mjs`, SQL de validación y migración indicados abajo.
- Este informe. El resto del diff corresponde al trabajo anterior conservado, no debe descartarse.
- Tras recibir la lámina oficial: `public/brand/anabelle-{horizontal,complete,monogram}.webp`, `src/app/icon.png`, `src/app/favicon.ico`, `scripts/prepare-brand-assets.mjs` y la integración en medios/encabezado/footer/CustomerShell. Se retiró el icon.svg provisional de la ronda anterior.

## 4. ADM-UX-001

Los valores SQL siguen siendo `flor`, `insumo`, `componente`, `producto`; el último se muestra como **Producto terminado**. El selector explica ejemplos según el tipo. Se añadieron ayudas de unidad y mínimo y una explicación desplegable de materiales frente al producto comercial Bouquet XXL. La casilla de tarjeta conserva su contrato real con la receta. Comprobado mediante navegador: Flor e Insumo, explicación y casilla de tarjeta.

## 5. Entradas y guía

Cuando no hay artículos activos seleccionables aparece el estado “Todavía no tienes materiales registrados” con Crear primer artículo. Tras crear, se recupera la entrada y se preselecciona el ID devuelto por la API. Cancelar cancela también ese contexto. Los filtros de la tabla no reducen la lista de entrada. Guía de físico/reservado/libre/mínimo/lote/merma/reposición, sin cambios al motor.

La rama vacía de ese formulario y su retorno automático están implementados, pero no se vació el laboratorio con datos para simularlos: queda pendiente su E2E específico. No se presenta como PASS visual.

## 6. ADM-UX-002

Reproducción previa real: viewport 893 px, contenedor 784 px, tabla 2.205 px, primer botón Acciones entre x=2.126 y 2.234. El producto de nombre largo ensanchaba la tabla. No era un permiso perdido.

Corrección: ancho limitado del nombre, texto completo en title, columna Acciones fija, región de scroll accesible y explicación visible. Móvil usa filas compactas sin categoría/temporada, conservando nombre/precio/estado/disponibilidad/Acciones y el CRUD existente. Botones de 44 px.

Comprobado: Acciones para BUKETE XLL abre Editar y las acciones originales a 893 px y a 390 px reales. En móvil, botón entre x=210 y x=318, 44 px de alto, sin overflow de raíz (scrollWidth 371 / innerWidth 390). No se verificaron todas las combinaciones de zoom/sidebar/páginas/filtros; no se afirma cobertura exhaustiva.

## 7. Logo oficial

El propietario proporcionó después `Identidad floral Anabelle Floristería.png` (1254×1254, sin canal alfa). Se recortaron sus variantes originales horizontal, completa y monograma sin redibujarlas ni generar otra identidad. El script reproducible exige ese tamaño y conserva el archivo original fuera del repositorio. Las tres variantes fueron inspeccionadas. Se reemplazaron encabezado, menú móvil, footer, compra/seguimiento y favicon con la identidad suministrada; el sistema de medios conserva prioridad para una imagen configurada posteriormente.

Se conservó el fondo pastel original de la lámina: no se añadió un fondo blanco, ni se fingió disponer de transparencia. Para una versión realmente transparente en especial sobre footer oscuro, sigue siendo recomendable recibir el PNG/SVG original con alfa. El componente horizontal conserva su relación de aspecto, sin forzarlo a un cuadrado y con texto alternativo de marca.

## 8. Vista rápida

Catálogo abre un Modal existente de Radix con el mismo ProductDetailSection en modo embebido: API, imagen configurada o fallback, Bs, cantidad, disponibilidad, personalizaciones y editor de tarjetas. Se conserva el detalle inline `#detalle` y el flujo de combos/promociones. Radix gestiona Escape, focus trap y bloqueo de scroll; retorno explícito al disparador al cerrar la vista rápida. Se observó `data-scroll-locked=1`.

El botón de bolsa del catálogo abre la personalización antes de añadir. No crea pedidos. La comprobación de disponibilidad incluye las líneas actuales del carrito y las nuevas, con `combine=true`; el servidor vuelve a validar al crear el pedido. El carrito máximo de 50 líneas se respeta.

## 9. Complementos y administración

Confirmación “Agregaste al carrito”, hasta cuatro recomendaciones configuradas, subtotal real, Ir al carrito, Seguir explorando y Continuar sin complementos. Nunca se añaden extras automáticamente. La elección abre el mismo detalle/editor dentro del mismo modal; añadir un complemento vuelve a la lista, sin nuevas cadenas de recomendaciones. Se excluyen productos ya presentes en el carrito y los no vendibles.

Admin: Productos → Acciones → Editar → Complementos recomendados. Permite buscar productos existentes, ordenar subiendo y quitar; máximo cuatro. No permite el principal, duplicados, inexistentes/inactivos o ciclos. El guardado emplea al administrador autenticado; empleado recibe 403. No se usan materiales como productos vendibles.

## 10. Modelo y seguridad

Nueva tabla `product_recommendations`, FK a productos, PK compuesta, orden 0–3 único por principal, actor/fecha. RLS filtra relaciones de productos activos y vendibles. Anon/authenticated únicamente pueden leer product_id/recommended_product_id/sort_order: no actor ni fecha; no escritura directa. RPC `set_product_recommendations(uuid,uuid[],uuid)` SECURITY INVOKER exclusivamente service_role, con administrador activo validado internamente y bloqueo transaccional que serializa edición del grafo. No se expone la service key.

La relación desaparece por FK si se elimina un producto; si se desactiva, deja de mostrarse públicamente y no puede guardarse como nueva recomendación. Admin puede quitar relaciones antiguas. No se modifica inventario/precios/pedidos al configurar.

## 11. Inventario compartido

Se reutilizó TEST BO para el peluche y se crearon únicamente cuatro materiales y cuatro productos acotados de esta ronda: rosa/ramo, globo con rosa compartida, chocolates y tarjeta. No se copió LAB100 ni TEST BO.

Comprobado por API/SQL: crear carrito no consume, pedidos reservan, pago reportado no materializa cliente ni consume definitivamente, confirmación consume exactamente cuatro rosas para ramo+globo, rechazo no consume. Agotados se rechazan. Dos solicitudes HTTP simultáneas para la última rosa: 201/400. Stock negativo: 0; lotes concilian. Retorno físico repone exactamente esas cuatro rosas; merma y entrada posterior funcionan.

## 12. Promociones

Se mantiene el motor anterior. Probadas una promoción no elegible (rechazo), descuento fijo elegible de Bs 10 y combo incompleto (rechazo), sin crear promociones nuevas. Cambiar cantidad/eliminar desde navegador conserva avisos y recalcula subtotal; la sugerencia no se aplica automáticamente. Se preserva tarjeta en blanco y total cero mediante las fixtures y suite existentes; no se creó otra compra gratuita por navegador en esta ronda.

## 13. Iconos

Compras violeta; favoritos y símbolo de tarjeta rosa; entrega/recojo verde; Tag de promociones dorado; Info y bloque de notas azul suave. No se colorearon todos los botones. Contratos y mensajes de error se conservan. Navegador confirmó favoritos y tarjeta rgb(161,67,112). Detectó además que una regla de mayor especificidad mantenía violetas los pasos completados del seguimiento: se corrigió la prioridad de la regla verde. La matriz visual de contraste y colores en todos los viewports sigue pendiente de cierre, no se sustituye por una afirmación de PASS.

## 14. Siete microinteracciones

Se conservaron, sin nuevas librerías. Navegador confirmó reduced-motion=false, pétalos `nova-petal-enter` 350 ms y tarjetas `nova-enter` 220 ms. Se detectó realmente contador con `animation:none`: ahora tiene key por cantidad y reutiliza `nova-value` 160 ms. Confirmación de añadido se comprobó funcionalmente en modal.

Comprobación posterior en navegador: contador `nova-value`160ms, favorito `nova-heart`160ms tras pulsarlo, promoción article `nova-enter`200ms, seguimiento `nova-enter`180ms tras consultar pedido246, editor de tarjeta `nova-enter`160ms al elegir escribir. El primer ajuste del contador se había aplicado al de favoritos; la comprobación real lo detectó y se corrigieron las keys de ambos antes del cierre. Reduced motion permanece en CSS, sin cambiar transforms de posicionamiento de modales. Estas lecturas de CSS y acciones funcionales no equivalen a una grabación perceptual completa: faltan esa revisión y reduced-motion emulado.

## 15. Matriz de 30 escenarios nuevos

PASS API/SQL no equivale a PASS visual. Evidencia HTTP completa y datos sensibles permanecen fuera de Git.

| Caso | Escenario | Resultado y método |
|---|---|---|
| 01 | Rosa y entrada | PASS API/Auth |
| 02 | Ramo y receta | PASS API/Auth |
| 03 | Disponibilidad | PASS API, 26 ramos inicialmente |
| 04 | Ramo sin extras | PASS API/reserva/cancelación |
| 05 | Con peluche existente | PASS API/reserva/cancelación |
| 06 | Con globo | PASS API/reserva/cancelación |
| 07 | Con chocolates | PASS API/reserva/cancelación |
| 08 | Varios complementos | PASS API/reserva/cancelación |
| 09 | Complemento agotado | PASS API, rechazado |
| 10 | Principal agotado | PASS API, rechazado |
| 11 | Insumo compartido | PASS API combinado |
| 12 | Última unidad | PASS HTTP concurrente, 201/400 después de ventana normal de rate limit |
| 13 | Cantidad en carrito | PASS navegador: ramo 1→2, subtotal 125→245, tarjeta conservada |
| 14 | Eliminar complemento | PASS navegador: confirmación explícita, solo tarjeta eliminada, subtotal 240 |
| 15 | Promoción no elegible | PASS API, 400 |
| 16 | Promoción elegible | PASS API, Bs 10 de descuento |
| 17 | Combo incompleto | PASS API, rechazado |
| 18 | Complemento con dedicatoria | PASS API/empleado; navegador escribió y agregó tarjeta sin encadenar modal |
| 19 | Tarjeta en blanco | PASS API, snapshot explícito |
| 20 | Checkout normal/QR | PASS API, QR 2 |
| 21 | Reportar | PASS API, pendiente, sin cliente/consumo/recibo |
| 22 | Confirmación manual | PASS API empleado, consumo exacto |
| 23 | Rechazo | PASS API empleado, sin consumo |
| 24 | Preparación | PASS API empleado |
| 25 | Finalizar recojo | PASS API empleado; entrega no repetida en esta ronda |
| 26 | Seguimiento | PASS API, finalizado/recibo posterior |
| 27 | Reintegro/retorno físico | PASS API, Bs 10 y cuatro rosas repuestas |
| 28 | 30 productos | PASS navegador/DOM: carrito existente, 30 líneas, Bs 8.055; no enviado. Captura final pendiente |
| 29 | Vista rápida móvil | PASS funcional navegador a 390 px; captura y teclado físico pendientes |
| 30 | Acciones visibles | PASS funcional navegador a 390 y 893 px; matriz visual completa pendiente |

El runner API conserva PENDING en los cinco casos de navegador: esta tabla agrega sus observaciones separadas, no inventa respuestas HTTP. Se registraron 159 checks (157 PASS y 2 fallos de fixture por rate limit conservados), con las repeticiones correctas documentadas. Los fallos no se borraron. 15 pedidos sintéticos de esta ronda registrados; venta real de la batería LOCAL Bs 140, reintegro Bs 10, neto Bs 130. Los importes no incluyen el resto histórico del laboratorio.

## 16. Responsive, accesibilidad y capturas

Se midieron innerWidth 375/390/430/768/1280/1440 de vista rápida y ausencia de overflow horizontal de raíz. La primera lectura tras cambiar viewport puede preceder al reajuste del diálogo: no demuestra dimensiones estabilizadas. En 1440, lectura posterior estable: modal x=208, ancho1024, alto759.59 dentro de844. En móvil se comprobó scroll y controles por navegador. No se probó teclado virtual de celular físico.

El capturador falla con “Unable to capture screenshot” al aplicar overrides. Tras reset produjo `quick-view-current.png` y `complements-desktop-final.png`, visualmente inspeccionadas, con innerWidth1600: son evidencia de escritorio, NO 1440 ni móvil. `quick-view-responsive-dom.json` guarda las medidas, no sustituye capturas. Están en la carpeta de visualizaciones de Codex, fuera de Git. No se fabricaron capturas. Las seis capturas y la revisión visual integral siguen pendientes.

## 17. Pruebas técnicas

Suite previa a la incorporación de la lámina: 714/714, 60 archivos, exit0. Se añadió una regresión de proporciones/texto alternativo del logo; el cierre técnico posterior a esa integración se registra al final. La advertencia CJS de Vite en tests es de dependencia, no warning ESLint.

Replay final desde cero: 16 migraciones + seed, en `NOVA-LOCAL-RECOMMENDATIONS-20261022`, localhost55621. Se comprobó vacío y se reconstruyó solo ese entorno desechable tras limitar las columnas públicas; nunca el laboratorio con datos. Siete fixtures SQL reales PASS con ROLLBACK: ISOLATED_SECURITY_TESTS, TWO_PAYMENT_QR_TESTS, DEDICATIONS_TESTS, INVENTORY_REFUNDS_TESTS, DELIVERY_AVAILABILITY_TESTS, STOREFRONT_MEDIA_TESTS y PRODUCT_RECOMMENDATIONS_TESTS. Los dos fixtures que requieren administrador/categoría recibieron prerrequisitos sintéticos dentro de su misma transacción. Después: 0 perfiles/0 pedidos.

Legacy SHA-256 39/39. Las 14 migraciones anteriores y seed sin diff; candidata15 conservada. Diff check sin errores. Escaneo de patrones de credenciales y nombres de archivos sobre los cambios: sin hallazgos ni .env/dumps/credenciales. Es una comprobación acotada, no garantía universal de ausencia de secretos.

## 18. Migraciones e incidencias

Pendientes de revisión/publicación: `20261022000100_storefront_media.sql` (previa) y nueva `20261022000200_product_recommendations.sql`. Solo LOCAL.

Incidencias preservadas: fixture inicialmente intentó publicar producto sin receta y fue bloqueada correctamente; referencia SQL ambigua en la función candidata nueva corregida y cubierta por prueba de inactivo; permiso inicial de lectura incluía actor, reducido a columnas comerciales antes del replay final. Primer puerto de replay57622 ocupado: se usó55622 sin detener el otro laboratorio. Fixture de seguridad impidió ejecutarse sobre laboratorio poblado: se ejecutó correctamente en vacío. Rate limit devolvió429 al acumular compras; se retiró el intento de encabezado simulado bloqueado por auto-review y se esperó la ventana normal, sin cambiar el control ni repetir contra producción.

## 19. Límites, SHA y preparación de commits

No hay P0/P1 conocidos en el alcance ejecutado; no se certifica la ronda visual completa. El archivo oficial ya fue recibido e integrado. Faltan capturas de los seis anchos, teclado móvil, cierre perceptual de las siete animaciones/colores, E2E de entrada sin materiales y repetición visual exhaustiva de los formularios administrativos. La transparencia original sería una mejora de recurso, no se inventó. No se preparó el manual definitivo.

Sin commits nuevos: el árbol conserva todos los cambios para revisión. Separación sugerida cuando se apruebe: UX de inventario/productos; modelo/API de complementos; vista rápida/sugerencias; tests/documentación. No reescribir el trabajo previo para separarlo.

## 20. Publicación posterior

No publicar aún automáticamente. Primero resolver las limitaciones visuales, revisar el diff completo, repetir checks si cambia código y aprobar las candidatas15/16. Una futura publicación necesita respaldo productivo verificado y autorización expresa propia. No transferir las fixtures. Esta ronda no accedió a Supabase remota, Vercel ni a la Supabase antigua.

## Cierre posterior al logo oficial

- Suite final exacta: **715/715**, 60 archivos, 5.86s, exit0.
- Lint: exit0, **0 errores / 0 warnings**. `npx tsc --noEmit`: exit0.
- Build LOCAL: exit0, 73 páginas. La primera versión del ICO falló porque el PNG interno era RGB; el generador se corrigió a RGBA y el build final pasó. No hubo un error de SQL ni cambio comercial.
- Header oficial cargado: 163.83×56px; footer: 234.05×80px, conservando proporciones. Recursos WebP: horizontal19.062B, completo35.682B, monograma23.436B.
- Evidencia válida del logo en `official-brand-399.png`: innerWidth399, sin overflow. El nombre inicial “desktop” se corrigió al comprobar el ancho real. `official-brand-390-partial.png` es captura incompleta del capturador y NO se usa para certificar diseño.
- Seguimiento consultado por navegador para el pedido sintético246: Retirado / Pago confirmado. Después de corregir especificidad, los pasos completados mostraron rgb(56,102,71) sobre rgb(230,241,233), transición180ms.
- Web LOCAL queda ejecutándose en3116. El SHA, master y todas las restricciones de no publicación siguen iguales. No hay commits nuevos; los cambios y evidencias previos están conservados.
