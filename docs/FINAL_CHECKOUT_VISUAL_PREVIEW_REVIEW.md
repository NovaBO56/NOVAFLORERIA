# Correcciones finales y Preview visual — 19 de octubre de 2026

Evidencia de la etapa anterior. El propietario sustituyó la Preview separada por la preparación de publicación completa; el estado vigente está en [RELEASE_READINESS_REVIEW.md](RELEASE_READINESS_REVIEW.md). Las cifras y el estado sin commit de este documento describen aquella ejecución.

## Estado para revisión

Rama única: `codex/inventory-refunds-dashboard-2`. SHA inicial y final: `0a734db6449186174bab39d0a81d12da9341d309`. `master` conserva `05f5338ab117da5b770b462fd120ab06b2006e92`; hay diez commits previos de desarrollo sobre esa referencia, además del trabajo sin commit. Se conservaron los cambios de promociones que ya estaban en el árbol. No se hizo commit, push, merge, deploy, SQL remoto ni modificación de variables remotas.

Este informe actualiza la certificación técnica de la presentación. El [informe de promociones](PROMOTION_SHOPPING_REVIEW.md) conserva el diagnóstico y las 33 comprobaciones de la ronda anterior; sus cifras de tests describen aquella ejecución.

## Correcciones

1. Portada: se retiraron el número de productos y su separador. Se conservan horario, composición, productos, recetas y catálogo.
2. Carrito y checkout: `PromotionChooser` destaca la selección efectiva. Sin selección, propone el mayor ahorro **elegible**, con «Usar esta promoción» y aviso de que el total sigue sin descuento. No guarda ni aplica la sugerencia automáticamente. Las alternativas quedan en «Ver otras promociones»; se conserva «Sin promoción». Una selección vencida/incompleta se mantiene visible con explicación, nunca se cambia silenciosamente. Se muestran ahorro y mínimo; siguen vigentes una promoción por pedido y la validación financiera del servidor.
3. «Hacer otra compra»: aparece antes de pago/QR/espera/resumen largo, junto a un enlace diferenciado «Seguir mi pedido #…». Es principal después del hito de confirmación; durante el pago pendiente se prioriza seguimiento. Se eliminó el botón duplicado inferior y se conserva «Volver a la tienda» como alternativa secundaria.
4. Nueva compra: conserva en `sessionStorage` una referencia acotada al pedido anterior (ID, número y celular), sin token de recibo. Solo después limpia draft, intento de idempotencia, selección QR, carrito y promoción, y navega al catálogo. No crea/cancela pedidos ni reporta pagos. Seguimiento recupera la compra anterior cuando no hay una recuperación de compra actual. Si no se puede guardar la referencia, se avisa y se conserva la compra actual. La recuperación automática está limitada a la sesión; fuera de ella se usa número y celular.
5. Compatibilidad Next: se retiró únicamente `export` de `requestsHomeDelivery`, helper interno de `/api/orders`. El comprobador de rutas de Next/Webpack rechazaba esa exportación no admitida; cuerpo, condiciones y contrato HTTP no cambian.

Se conserva porcentaje, fijo, combo de participantes concretos, mínimo, vigencia y selección única. No se inventan categoría/global dinámicas. No hay cambios SQL ni reglas de QR, confirmación, inventario, caja, devoluciones, ventas o comprobantes.

## Verificaciones actuales

| Control | Resultado |
|---|---|
| `npm test` | 643/643, 52/52 archivos. 24 tests más que los 619 de entrada. |
| `npm run lint` | 0 errores / 0 warnings. |
| `npx tsc --noEmit` | PASS. |
| `npm run build`, mediante launcher con variables LOCAL | PASS, 69/69 páginas; Turbopack. |
| Build del paquete visual separado | PASS, 6/6 páginas; `npm run build -- --webpack`. |
| Regresión HTTP/Auth/inventario/concurrencia LOCAL | 24 comprobaciones distintas aprobadas. |
| HTTP del paquete visual sin DB | 17/17 comprobaciones aprobadas. |
| Secret scan / `git diff --check` | Sin hallazgos / PASS. |
| Legacy | 39/39 SHA-256 coinciden con el manifiesto histórico. |

Vitest conserva el aviso existente de API CJS de Vite y mensajes de errores simulados en tests. No se ocultan ni se confunden con warnings de ESLint.

La regresión local adicional ejecutó dos solicitudes simultáneas con la misma clave, dos reportes y dos confirmaciones. Solo un pedido, un pago y un consumo efectivo; importes y promoción exactos, cliente aún no materializado antes de confirmar, sin consumo al reportar, recibo únicamente tras confirmación y teléfono incorrecto sin acceso. Se verificaron QR2 y las dos configuraciones NO PAGAR existentes, promociones vencida/inactiva rechazadas, pedido gratuito previo sin pago, coherencia Dashboard/reportes y ausencia de stock negativo.

Se creó y conservó **un pedido sintético #121**, «TEST FINAL CHECKOUT», con su pago, confirmación, reserva/consumo y registro sintético de cliente según el flujo normal. No se borró ningún fixture. Los 100 productos públicos y sus datos permanecen idénticos antes/después. Los siete pedidos y ocho promociones de la ronda anterior continúan preservados; no se duplicaron sus suites completas.

Los helpers QA tuvieron incidencias iniciales: el endpoint visual en modo normal redirige a login y la cabecera Location es relativa. Se corrigieron las expectativas del helper antes de crear el pedido. El reporte privado conserva 30 anotaciones cronológicas, con 24 nombres de comprobación distintos finalmente aprobados. No se presenta como 30 pruebas independientes ni se ocultaron efectos de reintentos.

El test nuevo de carrito utiliza almacenamiento simulado y componentes visuales aislados: prueba limpieza de líneas/promoción y conservación del seguimiento; no equivale a pulsar el botón en un navegador.

## Entorno y migraciones

Destino de todas las operaciones comerciales de prueba: `NOVA-LOCAL-INTEGRITY`, API `http://127.0.0.1:62621`, web `http://127.0.0.1:3116`, sin `project-ref`.

Lectura real del catálogo local: 35 tablas de negocio, 35 con RLS, 89 políticas public/storage y 12 migraciones registradas. Los buckets existentes son `product-images` y `payment-qr`; las imágenes públicas previstas del catálogo no se convierten en datos privados ni se modificaron sus políticas. `create_order`, `create_payment(uuid,text)`, `report_payment_qr`, `track_order`, `track_order_details`, `consume_product_inventory` y `apply_order_discount`: anon=false, authenticated=false, service_role=true.

No se hizo reset, seed, replay destructivo ni migración en esta ronda. La certificación de replay de doce migraciones + seed permanece como evidencia anterior; **no se declara un replay nuevo**. La rama mantiene como candidatas productivas `20261013000100_inventory_refunds_sales_ledger.sql` y `20261017000100_home_delivery_availability.sql`. Según el estado versionado, diez versiones pertenecen a la referencia productiva; no se consultó el historial remoto para corroborarlo. No hay migraciones nuevas o editadas por esta tarea ni cambios en seed.

El launcher local reemplaza las variables Supabase desde archivos privados externos antes de iniciar Next. El `.env.local` del repositorio no es una configuración aprobada para el paquete visual y no se copia ni se usa allí. Solo se listaron sus nombres, sin revelar claves.

## Preview visual preparada, todavía sin publicar

El propietario confirmó que no existe una Supabase remota de pruebas disponible. Se preparó un **paquete separado y sin base de datos**, mediante `scripts/prepare-visual-preview-local.mjs`, en una carpeta temporal nueva. No es el despliegue Git normal de toda la rama.

- Exporta únicamente las respuestas públicas sintéticas de los 100 productos, sus opciones/imágenes, 14 promociones, categorías y horarios del laboratorio. Rechaza productos/promociones no sintéticos y cualquier imagen fuera del Storage local esperado. Las imágenes pasan a rutas relativas del propio paquete. No exporta pedidos, clientes, Auth, recibos, QR, WhatsApp, ubicación ni claves.
- Solo contiene páginas públicas y un handler de catálogo visual. **No incluye** páginas admin/login ni handlers de APIs comerciales, aunque se intente acceder directamente.
- Dos flags explícitos activan el modo; el arranque falla con flags inconsistentes, cualquier variable Supabase con valor, Production/master o conexión al laboratorio. Los clientes Supabase también rechazan el modo visual.
- Proxy solo admite GET/HEAD; bloquea mutaciones y ofrece respuestas de snapshot para el catálogo. Las páginas incluyen «Datos sintéticos / NO PAGAR», noindex y CSP que limita las conexiones del navegador al mismo origen. Noindex no sustituye protección de acceso.
- El checkout permite revisar datos, entrega, promociones y totales estimados. El botón final está deshabilitado y explica el límite. No crea pedidos simulados ni muestra compras como operaciones reales.
- No permite probar confirmación, QR/Ya pagué, seguimiento de pedidos reales, recibos, admin ni «Hacer otra compra» después de un pedido en esa Preview; esos flujos se prueban en LOCAL. No se necesita una nueva Supabase para esta modalidad.
- La exportación, datos y bytes quedan fuera del repositorio; las rutas de generación también están ignoradas por Git. El paquete se genera nuevamente, no se mezcla con un despliegue normal.

Prueba del paquete en `http://127.0.0.1:3117`: páginas, catálogo paginado, detalle/opciones, promociones, cabeceras, denegaciones, imagen local SHA-256 y optimizador correctos. La traza de despliegue incluye el snapshot. Se verificó ausencia de `.env` y de rutas comerciales. Esto es **HTTP local**, no una URL HTTPS publicada ni validación visual.

Incidencias de construcción documentadas: Turbopack rechazó una junction de dependencias fuera de su raíz en la carpeta temporal. Webpack permitió verificar el paquete con las mismas dependencias. El primer paquete completo también intentó prerenderizar admin/login, que correctamente rechazaron Supabase; se corrigió la preparación para excluir esas rutas por completo, sin modificar sus páginas originales. El paquete final pasó. La configuración de build Webpack se aplica solo al paquete temporal; el build habitual conserva Turbopack.

## Vercel: diagnóstico y punto de autorización

El destino previsto es **el proyecto existente asociado a `floristeriaanabelle.vercel.app`**, nunca uno nuevo. No hay vinculación `.vercel/project.json` ni CLI Vercel disponible en esta copia. No se ha confirmado el ID/nombre interno del proyecto ni la configuración remota de Development/Preview/Production. No se afirma haber revisado esas variables remotamente.

| Ámbito | Estado y condición |
|---|---|
| Development | Solo se conocen nombres locales: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`. El launcher LOCAL usa su configuración privada separada. |
| Preview visual futura | Requiere `NOVA_VISUAL_PREVIEW` y `NEXT_PUBLIC_NOVA_VISUAL_PREVIEW`. Ninguna variable cuyo nombre contenga SUPABASE puede tener valor, incluidas variables compartidas heredadas. No requiere claves. |
| Production | Sin consulta o modificación; no activar los flags visuales ni cambiar sus variables existentes. |

`vercel.json` mantiene desactivado el despliegue Git automático de esta rama. No se habilitó, ni se hizo push.

Antes de una publicación autorizada habrá que:

1. Confirmar en la cuenta del propietario el ID/equipo del proyecto existente y revisar las variables Preview heredadas, sin imprimir sus valores.
2. Verificar protección de acceso del deployment Preview y la forma autorizada de abrirlo desde el celular del propietario. No está verificada aún; no se sustituye por una URL difícil de adivinar.
3. Asegurar configuración **solo del deployment Preview** sin valores Supabase. Si hay herencia que no puede aislarse sin tocar Production, detenerse; no reemplazar secretos productivos.
4. Revisar y guardar el código de la rama, regenerar el paquete público separado, instalar las dependencias del lockfile en su propio directorio y usar su build configurado. No subir el entorno local, junction, `.env`, logs o fixtures privados.
5. Publicar únicamente ese paquete como Preview del proyecto confirmado, con los dos flags y protección. Nunca `--prod`, nunca master, nunca recursos facturables nuevos sin permiso.
6. Verificar URL HTTPS, banner, protección, assets, denegaciones y ausencia de configuración Supabase; entregar esa URL y hacer la revisión visual pendiente.

**No hay autorización ejecutada de push o publicación. No existe aún una URL HTTPS de esta versión.** Se detiene la tarea en este punto para revisión técnica y autorización del siguiente paso.

## Revisión visual y riesgos pendientes

375/390/430/768/1280/1440: **PENDIENTE en navegador real**. Persiste la limitación de política del navegador integrado registrada anteriormente; no se eludió. No hay nuevas capturas del sitio. Solo revisión estática de CSS/markup: controles grandes, alternativas plegadas, ancho mínimo cero, texto con ruptura, acciones que envuelven, sin barra fija que tape QR y movimiento reducido existente.

Pendientes: swipe/doble toque reales; posición visible de las acciones con altura móvil real; menú, footer, pasos, QR y regreso al catálogo por navegación real; credenciales/acceso protegido Vercel y validación del paquete ya alojado. La Preview visual no certifica el ciclo financiero ni permite evaluar sus pantallas posteriores al pedido. No se declara la revisión visual aprobada ni la rama lista para producción por esta tarea.

Producción, ambas Supabase remotas, QR/WhatsApp comerciales, Vercel Production y master permanecen intactos.

## Archivos

Los archivos de promociones de la ronda previa siguen descritos en su informe. Esta ronda añade/cambia principalmente:

- `src/components/public/home/sections.tsx`, `home-page.tsx`: portada sin contador.
- `src/components/public/promotion-chooser.tsx`, `promotion-cart-summary.tsx`, `checkout-form.tsx`: selección compacta y sugerencia explícita.
- `src/components/public/checkout-purchase-actions.tsx`, `checkout-page.tsx`, `tracking-page.tsx`, `src/lib/public/previous-purchase.ts`: nueva posición y conservación del seguimiento.
- `src/lib/visual-preview/config.ts`, `catalog.ts`, `src/app/api/visual-preview/route.ts`: modo visual y respuestas sin DB.
- `src/proxy.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/lib/supabase/{admin,client,server}.ts`, `.gitignore`: aislamiento optativo, banner y empaquetado.
- `src/app/api/orders/route.ts`: helper interno sin exportación no admitida.
- `scripts/prepare-visual-preview-local.mjs`, `qa-final-checkout-local.mjs`: preparación de paquete y regresión local dirigida.
- `__tests__/checkout-final-experience.test.ts`, `visual-preview.test.ts`, `promotion-selection.test.ts`: casos nuevos de esta ronda.
- Este informe.

Los manifiestos privados con rutas de staging, resultados y pedido de prueba permanecen en la carpeta externa del laboratorio, sin claves en este documento.
