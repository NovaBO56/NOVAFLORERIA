# Auditoría final de revisión — 23 de octubre de 2026

## Alcance y Git

Repositorio NovaBO56/NOVAFLORERIA. Rama exclusiva `desarrollo-auditoria`.
SHA de partida: `956bf700778458fbe86c68e82e5ed921e9cf373c`.
`master` conserva `42b75b8166e60cf9c44709c1891905da70a42e22`.
No hubo merge, deploy, cambios de variables remotas ni SQL contra Supabase remoto.
El commit de esta entrega se identifica en Git y en el informe de entrega, sin intentar incluir su propio hash dentro de sí mismo.

Esta es una revisión acotada con correcciones y regresión real, no una certificación exhaustiva de todas las combinaciones posibles. No se implementaron banners, campañas ni imágenes inventadas. Se conservan las imágenes oficiales originales.

## 1. Vercel y protección

- Proyecto productivo observado: `bryan-174f/novafloreria`, repositorio correcto. Environments muestra Production siguiendo `master`, dominio `floristeriaanabelle.vercel.app`; Preview sigue las ramas no asignadas. Producción observada Ready en `42b75b8`.
- `dpl_3kAtLkVJN7YmATJk23148wF5jLEc`: log real leído en el panel. Preview de `956bf70`, build fallido en `/login`, `src/app/login/page.tsx:14`, al crear el cliente Supabase durante prerender sin sus variables de entorno. No es un error SQL. No se copiaron variables productivas al Preview.
- `dpl_HhakJmeJkDMGMbX6oXBbxdqkJxcV`: el check de GitHub apunta a **otro ámbito**, `https://vercel.com/nova-2ccd/novafloreria/HhakJmeJkDMGMbX6oXBbxdqkJxcV`. El acceso disponible devuelve Not Found. Su log y causa individual siguen NO VERIFICADOS; no se asume que sean iguales al primer fallo. Es necesario que el propietario revise acceso y vinculación de ese ámbito.
- Corrección: el login crea Auth únicamente al enviar el formulario y maneja errores de conexión. Una prueba SSR comprueba que el formulario puede renderizarse aunque la fábrica de Supabase falle por configuración ausente. El build LOCAL completo pasa con variables exclusivamente locales. No se declara un nuevo deployment Preview aprobado: no se ejecutó.
- `vercel.json`: `deploymentEnabled.desarrollo-auditoria=false`, conservando las entradas existentes. Evita nuevos despliegues automáticos de esta rama; no cambia la rama productiva ni sus secretos.
- GitHub Settings/Branches no mostró reglas clásicas; Settings/Rulesets mostró «You haven't created any rulesets». No se cambió ninguna regla remota.

### Propuesta de protección, pendiente de autorización

Crear un ruleset activo dirigido exclusivamente a `master`: exigir Pull Request, al menos una aprobación de otra persona autorizada, resolver conversaciones, bloquear force push y borrado, limitar bypass. Una vez exista CI automático, exigir sus checks reales de tests/lint/typecheck/build; no seleccionar nombres de checks que aún no existen. Si el propietario es el único revisor, debe acordarse cómo obtener aprobación independiente antes de activar una regla que bloquee su flujo. No se implementa esta política unilateralmente.

## 2. Correcciones públicas

| Hallazgo | Solución | Comprobación |
|---|---|---|
| Hero demasiado alto en móvil | Menor padding vertical y altura mínima de imagen de 320px; límites de ancho específicos en móvil/tablet para que la imagen no invada el texto | Medidas y capturas reales; el ajuste final de tablet se volvió a compilar |
| Detalle del primer producto aparecía sin selección | Solo se monta para una oferta/combo elegido explícitamente; catálogo normal conserva vista rápida | DOM inicial sin `#detalle`; compra normal por vista rápida; oferta gratuita conserva detalle explícito |
| Cancelación de combo dejaba producto seleccionado | Limpiar selección al cancelar y al terminar el combo | Paso 1/2, paso 2/2 y cancelación real; detalle desaparece y carrito se conserva |
| Dos acciones de complementos llevaban al mismo lugar | Dos destinos claros: «Ver carrito» y «Seguir comprando» | Navegador: sugerencias opcionales, máximo cuatro, subtotal y acceso al carrito; no agregado automático |
| Fondo opaco del logo contrastaba con footer oscuro | Soporte pastel redondeado y mezcla darken sobre el mismo tono | Archivo oficial intacto; proporción 591:202; DOM object-contain y dimensiones conservadas. Captura completa disponible; capturas parciales vacías no se aprueban |

No se eliminaron filtros, favoritos, búsquedas, personalizaciones, promociones ni secciones inferiores. La imagen del hero sigue siendo el producto destacado configurado. En el laboratorio es una ilustración sintética identificada, no una fotografía comercial.

## 3. Admin y herramientas locales

- Los trece scripts/launchers que todavía exigían la rama eliminada ahora exigen `desarrollo-auditoria`. Solo cambia el nombre de rama; siguen las comprobaciones de API local, project_id y ausencia de link remoto. No se ejecutaron todos esos scripts ni se volvieron a sembrar sus fixtures antiguos.
- Defecto real de accesibilidad: las tarjetas móviles de pedidos tenían click pero no semántica ni teclado. Se añadió role button, nombre «Ver pedido N», tabIndex, Enter/Espacio y foco visible, usando la misma apertura existente. No cambia el estado comercial.
- Inventario: prueba por botones, crear `TEST AUDIT 20261023 · Tarjeta control primera entrada` como Insumo, registrar primera entrada de **12 unidades** y comprobar mensaje de lote automático y stock12. No se modificaron materiales anteriores. No es una prueba de la pantalla global sin materiales: el laboratorio principal ya tenía46; ese estado vacío visual queda pendiente sin borrar sus datos.
- Admin: carga de Dashboard, productos, categorías, temporadas, inventario, pedidos, ventas, caja, clientes, promociones, usuarios, reportes, configuración y auditoría; no se declara un CRUD completo de cada módulo. Pedidos #251 revisado, pago confirmado y estados preparación/listo/finalizado mediante botones reales.
- Auth real LOCAL de administrador y empleado: ambos acceden a lecturas operativas. Empleado recibe403 en usuarios, configuración general y auditoría. Las credenciales solo se leyeron del almacén privado local, no se copiaron a este documento ni al código.

## 4. HTTP real y flujos de compra

### Lecturas HTTP con Auth real

API LOCAL `http://127.0.0.1:62621`; web LOCAL3116. Evidencia detallada fuera del repositorio: `audit-final-http-20261023.private.json` en el directorio privado del laboratorio.

- Público: productos, categorías, horarios, QR, promociones, ubicación e imágenes200.
- WhatsApp404: configuración LOCAL ausente/inactiva, representada por la UI con alternativa de seguimiento. No se inventó teléfono ni se cambió configuración.
- Admin y empleado: Dashboard, productos, inventario, pedidos, cajas, sesiones abiertas, clientes, promociones200. Reportes de ventas y productos vendidos con `from=2026-10-01&to=2026-10-23`:200.
- Admin: usuarios, system-settings y audit-log200. Empleado:403 en los tres.
- Incidencias del protocolo de prueba, no bugs: GET `/api/admin/sales`405 porque es contrato POST; reportes sin fechas400. Se corrigió la lectura usando los contratos existentes, sin crear ventas ni alterar endpoints.

### Navegador, operaciones sintéticas de esta ronda

Se usó el origen loopback `127.0.4.23:3116` con carrito inicialmente vacío para conservar las sesiones existentes.

1. Vista rápida de producto con tarjeta; alternancia en blanco/escrita, mensaje con salto de línea, firma y preview. Dedicatoria conservada en carrito, checkout y detalle admin.
2. Pedido **#251**, cliente `TEST AUDIT 20261023 Navegador`, retiro, Bs70. Antes del pago: SQL real confirma pendiente_pago, cero pagos, cero consumos definitivos, tres reservas y customer_id nulo.
3. Selección de **QR2 de demostración**, recarga y selección persistida. «Ya pagué» mantiene pedido pendiente y pago reportado; no confirma automáticamente. Recibo aún no disponible.
4. Confirmación manual del pago sintético desde admin. Cliente muestra pago confirmado y enlace al comprobante; admin muestra snapshot qr_2. No se realizó transferencia ni envío de WhatsApp.
5. Admin avanza preparación → listo → finalizado. Seguimiento se consulta y actualiza desde navegador. «Hacer otra compra» deja carrito nuevo sin cancelar el pedido anterior.
6. Oferta gratuita existente `TEST BO … free`: selección explícita, tarjeta en blanco, carrito y checkout, pedido **#252**, total0 confirmado automáticamente. DOM y UI sin selector QR ni botón «Ya pagué». Seguimiento accesible.
7. Combo existente: paso1/2 → paso2/2, acción «Agregar combo al carrito» visible; cancelación conserva carrito y retira detalle. No se creó otro pedido de combo en esta ronda.
8. El carrito original de127.0.0.1 volvió a sus tres unidades: se retiró únicamente la unidad agregada por esta prueba.

Registros locales conservados: material y entrada12, pedido251, su pago confirmado/cliente/movimientos/reservas/ledger derivados, pedido252 y registros derivados del gratuito. No se borran automáticamente. Las consultas finales documentan sus estados; los nombres TEST permiten identificarlos sin publicar tokens de recibo.

## 5. Migraciones y SQL reales

Nuevo laboratorio independiente: **NOVA-LOCAL-AUDIT-20261023**, API127.0.0.1:54621, DB54622. Sin project ref remoto. Se creó desde cero en carpeta privada separada; no se reseteó ningún laboratorio existente.

- Replay **16 migraciones + seed**, exit0.
- Incluye sin modificaciones `20261022000100_storefront_media.sql` y `20261022000200_product_recommendations.sql`, que siguen pendientes de autorización productiva.
- Siete fixtures reales PASS: ISOLATED_SECURITY_TESTS, TWO_PAYMENT_QR_TESTS, DEDICATIONS_TESTS, INVENTORY_REFUNDS_TESTS, DELIVERY_AVAILABILITY_TESTS, STOREFRONT_MEDIA_TESTS, PRODUCT_RECOMMENDATIONS_TESTS.
- Cada fixture termina en ROLLBACK. Al finalizar: **0 perfiles / 0 pedidos** en ese laboratorio. Las secuencias pueden avanzar, como avisan los fixtures.
- Primer intento de seguridad bloqueado correctamente por falta de opt-in: se repitió con `SET nova.security_test='isolated'`. Delivery/media requerían admin/categoría: se añadieron prerrequisitos sintéticos dentro de sus propias transacciones. No se modificaron archivos SQL para ocultarlo.
- Compatibilidad de media: actor admin, mezcla de configuración, rutas inválidas y denegación efectiva anon/authenticated. Complementos: RPC privado, ACL, proyección RLS sin actor, ciclos, duplicados, autorreferencia, inactivos y eliminación de relaciones en transacción de prueba.
- **39/39 hashes SHA-256 legacy** coinciden con MIGRATION_REORGANIZATION_AUDIT.md. Ninguna migración ni seed tiene diff en esta ronda.

## 6. Evidencias visuales y accesibilidad

Capturas fuera de Git, carpeta de visualizaciones de Codex del23/10. Los archivos `audit-final-home-{375,390,430,768,1280,1440}-20261023.png` corresponden a anchos efectivos comprobados, no solo solicitados. Se inspeccionan sus imágenes; no se considera el relleno externo del lienzo del capturador como overflow de la aplicación.

El ajuste final de ancho de imagen en tablet se compiló, pero su nueva captura768 quedó pendiente: el override posterior afectó otra pestaña y se midió390 en la pantalla observada. No se presenta esa repetición como PASS768; la captura768 existente corresponde a la revisión previa a ese último ajuste. Los intentos posteriores de restablecer el viewport también terminaron en timeout del controlador. El servidor LOCAL siguió respondiendo HTTP200 y sin mensajes en stderr.

Las primeras capturas durante scroll mostraron solo categorías o una región vacía. No se usaron como prueba de footer ni de una pantalla completa. Se renovó el encuadre de Inicio en scroll0. La captura de página completa `audit-final-full-390-20261023.png` existe; las capturas parciales vacías del footer quedan expresamente NO APROBADAS. El navegador tiene limitaciones al capturar contenido desplazado.

Comprobaciones de DOM/layout: raíz sin overflow horizontal en seis anchos, logo object-contain, recursos cargados. Cabecera/hero con capturas reales. No equivale a revisión exhaustiva de cada sección inferior en cada ancho ni a prueba en celular físico.

Menú y diálogos conservan su implementación de foco, Escape y retorno al disparador. Después del build final, Enter sobre «Ver pedido251» abrió el diálogo de carga. La espera de detalle y la comprobación posterior de Escape/foco terminaron con timeout del controlador; quedan INCOMPLETAS, sin atribuir su causa a la aplicación sin evidencia. CSS conserva reduced-motion; su cumplimiento está revisado por código, no se afirma una emulación visual de la preferencia si no fue ejecutada. Contraste: revisión básica, sin auditoría WCAG integral ni certificación con lector de pantalla.

## 7. Calidad final

Repetición final estándar `npm test`: **716/716**, **61/61 archivos**, exit0, **5.55s**, sin aumentar timeouts. `npm run lint`: exit0, **0 errores / 0 warnings**. Build final mediante launcher que fija exclusivamente variables LOCAL y ejecuta `npm run build`: exit0, compilación3.8s, TypeScript interno3.6s, **73/73 páginas**. `npx tsc --noEmit`: exit0. `git diff --check`: exit0. El aviso CJS de Vite es de dependencia y no un warning de ESLint. El primer diff-check detectó espacios al indentar login; se retiraron antes de estos controles finales.

Archivos de aplicación: login/page.tsx; public/home/{home-page,sections,complement-confirmation}.tsx; admin/orders/orders-panel.tsx. Configuración: vercel.json. Nuevo test login-prerender.test.tsx. Trece scripts locales: solo guardia de rama actualizada. Más este informe.

## 8. Pendientes para segunda revisión

| Prioridad | Pendiente | Límite |
|---|---|---|
| P2 | Obtener acceso/log del deployment Hhak… en nova-2ccd y revisar por qué ese ámbito también publica checks | No asumir causa ni borrar/desvincular proyectos sin autorización |
| P2 | Aprobar y configurar protección de master/CI | Propuesta, no cambios remotos |
| P2 | UI del inventario completamente vacío, CRUD exhaustivo por módulo, rechazo de pago por botones y checkout de entrega habilitada | SQL/mocks cubren contratos, no sustituyen estos recorridos visuales; no se vació el laboratorio ni se cambió su disponibilidad |
| P2 | Revisión visual detallada de todos los formularios y secciones inferiores en los seis anchos, incluido footer con captura parcial fiable | Capturador desplazado falla; DOM no se presenta como PASS visual |
| P3 | Unificación tipográfica global: token --font-display referencia --font-dancing-script no definido explícitamente | No se alteró el sistema de fuentes compartido sin pruebas de todas las pantallas |
| P3 | Fotografía auténtica y futuras campañas/banners | No crear recursos ficticios |

No se identificó un nuevo P0/P1 en el alcance ejecutado. No se declara el sistema completo certificado ni autorizado para producción. La revisión visual de tablet del último ajuste y el retorno de foco móvil siguen pendientes por las incidencias descritas. La siguiente acción es revisión independiente de esta rama; cualquier publicación requiere autorización expresa y revisión de las migraciones pendientes.

Control previo al commit: 21 archivos de esta ronda revisados; escaneo acotado de patrones de claves/JWT/conexiones y nombres sensibles sin hallazgos. .env, credenciales, dumps y evidencia privada excluidos. No es una garantía universal de ausencia de secretos.
