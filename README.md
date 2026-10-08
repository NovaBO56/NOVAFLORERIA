# NOVA Florería

Aplicación Next.js con catálogo público, checkout, seguimiento y panel administrativo conectado a Supabase.

## Estado local de Supabase

La cadena limpia está activa en `supabase/migrations/`; los 39 originales se conservan en `supabase/migrations-legacy/` solo como evidencia, sin ejecutar. Seeds separados. Ver [documentación Supabase](supabase/README.md) y [estado/verificación final](supabase/MIGRATION_STATE.md). La baseline no debe aplicarse sobre producción existente; reconciliación e historial remoto requieren un plan y autorización separados.

## Operación del backend

El administrador activo configura QR, WhatsApp, horarios por día y pedidos fuera de horario en `/admin/configuracion`. QR acepta PNG/JPG/WebP decodificables de hasta 5 MB, con preview, reemplazo y desactivación. No hay configuraciones bancarias ni números ficticios en los seeds. `/admin/auditoria` muestra trazabilidad administrativa; la cabecera del panel incluye la bandeja compartida de notificaciones.

Pedidos y reportes de pago públicos pasan por las APIs Next.js. Los RPC de creación de pedido y pago son privados del servidor; no se expone su clave al navegador. El servidor necesita `SUPABASE_SECRET_KEY`, además de la URL y clave pública de Supabase. Las escrituras fallan cerradas si falla el limitador; las lecturas pueden continuar. En el despliegue, el proxy confiable debe sobrescribir los headers de IP; no aceptar headers de IP arbitrarios desde Internet. Auth usa además los límites propios de Supabase.

Los ajustes positivos crean lotes con origen en el ajuste; ajustes negativos y mermas consumen lotes FIFO sin tocar stock reservado. Una devolución física restituye el producto completo una sola vez; un reintegro solo devuelve dinero. Ambos respetan el total ya devuelto. Las ventas físicas registran la salida monetaria en una sesión abierta de la misma caja, conservando efectivo/QR; QR no altera el efectivo esperado. Los pedidos online no registran ingresos en caja física: su devolución bancaria requiere operación externa y revisión humana, y este backend no transfiere dinero. Las ventas gratuitas consumen stock y no inventan pagos ni movimientos de caja.

Horarios y límites diarios de reportes/dashboard usan `America/La_Paz`. Los teléfonos identifican clientes según el contrato existente (trim, sin unificación automática de números históricos). No se permite retirar el último administrador activo. `/prueba-cliente` y `/admin/prueba-ui` se conservan como demostraciones para desarrollo y devuelven 404 en producción.

Validación real reutilizable y límites de certificación: [estado de Supabase](supabase/MIGRATION_STATE.md). Credenciales y resultados detallados del laboratorio deben permanecer privados e ignorados por Git.

## Validación y mejoras posteriores

La referencia vigente de las cinco migraciones y sus resultados es `supabase/MIGRATION_STATE.md`. La revisión local pasó 301 tests unitarios, 223 comprobaciones reales de HTTP/Auth/PostgreSQL, replay limpio y pruebas de seguridad SQL. Lint: 0 errores, 0 warnings; TypeScript y build correctos. Los flujos de navegador normal y gratuito llegaron a finalizado y seguimiento.

El inventario inicial de pendientes quedó preservado en el commit `3593596`; se retiró su documento temporal al resolver los P0/P1 identificados. No quedan bloqueos P0/P1 detectados dentro del alcance local probado. Mejoras posteriores: P2, acordar normalización internacional de teléfonos y una métrica neta de ventas/devoluciones adicional al reporte bruto actual; P3, retirar definitivamente las demostraciones de desarrollo o automatizar también los recorridos visuales. No se cambió el contrato existente para tomar esas decisiones.

Los datos de prueba permanecen exclusivamente en `NOVA-LOCAL-VALIDATION`, con manifiestos y rollback privados. Esta certificación local no sustituye revisar los datos, el despliegue/proxy, los respaldos ni el historial de producción antes de autorizar una reconciliación separada.

## Microinteracciones — 8 de octubre de 2026

La interfaz conserva su diseño y usa CSS y `tw-animate-css` existente, sin dependencias nuevas. Entradas de página/cards: 200–220 ms; cifras: 160 ms; mensajes, filas y estados: 180 ms; carrito y diálogos: 200 ms. Las imágenes del catálogo usan zoom recortado del 2%; paneles y elementos se desplazan como máximo 8 px. No se añadieron temporizadores, listeners, contadores animados ni efectos decorativos continuos.

Público: entrada del catálogo/detalle, selección de opciones, feedback de botones, cifras de cantidad/subtotal, apertura/cierre del carrito, bloques de checkout, resumen/QR y estado de seguimiento. Admin: entrada común por ruta, tablas al montar filas, badges de estado, métricas, botones/campos, modales, menú lateral, mensajes y bandeja de notificaciones. Los filtros no reinician la página completa. Eliminar una línea del carrito sigue siendo inmediato; las notificaciones se atenúan durante la petición y se retiran únicamente al confirmar el servidor, sin retrasos artificiales.

`prefers-reduced-motion: reduce` desactiva animaciones y transiciones globalmente, incluidos pseudo-elementos y desplazamiento suave, sin borrar los transforms usados para centrar diálogos. La regla se revisó en código; no se emuló la preferencia del sistema en el navegador. Las entradas animan transform/opacity; colores/bordes mantienen transiciones breves de controles. No se animan width/height/top/left. El cierre CSS del carrito usa mejora progresiva `allow-discrete`: navegadores sin soporte conservan cierre inmediato.

Verificación real sobre el build local: catálogo, agregar al carrito, cantidad/subtotal, Escape y restitución de foco del carrito, reapertura, checkout hasta resumen conservando campos (sin crear otro pedido), seguimiento gratuito #54, tabla de clientes, apertura/cierre de modal, navegación por menú, dashboard y bandeja de avisos. Escritorio observado a 870 px CSS, sin overflow horizontal en las superficies medidas. Se conservan las limitaciones de viewport descritas abajo: 390/768 px revisados por CSS/layout, pendientes de validación visual completa. Se observó una miniatura sintética del laboratorio sin cargar; no se alteraron Storage ni URLs de imágenes en esta tarea.

Calidad: 301 tests, lint 0 errores/0 warnings, TypeScript y build correctos. No se modificaron SQL, APIs ni contratos del backend. No se realizó un benchmark de rendimiento ni una nueva certificación integral del backend.

## Revisión de la aplicación visible — 8 de octubre de 2026

Revisión realizada en `revision/backend-certificado`, con Next.js en modo producción local y Supabase en `http://127.0.0.1:55421`. Solo se modificaron componentes de interfaz y documentación; APIs, contratos, tests funcionales, cinco migraciones, seed y 39 migraciones históricas permanecen sin cambios. Las etiquetas `TEST UI` provienen de registros sintéticos del laboratorio, nunca de datos hardcodeados en la interfaz.

| Ruta o superficie real | Clasificación al cierre dentro del alcance revisado | Comprobación en navegador |
| --- | --- | --- |
| `/` y detalle integrado `/#detalle` | Completa para el flujo probado | Catálogo, detalle, personalización, cantidades y enlaces internos |
| Carrito de la tienda | Completa para el flujo probado | Agregar, modificar cantidades, continuar y estado vacío |
| `/checkout` | Completa para el flujo probado | Crear pedido normal/gratuito, QR, reporte, recarga y recuperación |
| `/seguimiento` | Completa para el flujo probado | Número/teléfono correctos e incorrectos; estados y total cero |
| `/login` | Completa para el flujo probado | Admin, empleado activo, empleado inactivo y cierre de sesión |
| `/admin` | Completa para el flujo probado | Métricas y enlaces con datos locales |
| `/admin/productos` | Completa para el flujo probado | Crear, editar, categoría/temporada y receta de inventario |
| `/admin/categorias`, `/admin/temporadas` | Completas para el flujo probado | Crear registros sintéticos y seleccionarlos en producto |
| `/admin/inventario` | Completa para el flujo probado | Ítem, entrada, ajuste, merma y lotes FIFO |
| `/admin/pedidos` y pagos integrados | Completa para el flujo probado | Confirmar/rechazar pago, avanzar y finalizar; detalle por teclado |
| `/admin/ventas` | Completa para el flujo probado | Promoción, descuento manual, cliente, efectivo y QR |
| Devoluciones dentro del pedido finalizado | Completa para el flujo probado | Devolución completa y reintegro; empleado solo consulta |
| `/admin/caja` | Completa para el flujo probado | Abrir, movimientos de ventas/devoluciones y cierre sin diferencia |
| `/admin/clientes` | Completa para el flujo probado | Crear, detalle vacío, editar y cierre automático del formulario |
| `/admin/promociones` | Completa para el flujo probado | Crear promoción porcentual, elegibilidad y uso en venta física; promoción gratuita en checkout |
| `/admin/usuarios` | Completa para el flujo probado | Alta de empleado desde el panel, aparición automática en listado, desactivar/restaurar empleado; acceso directo denegado al empleado |
| `/admin/reportes` | Completa para el flujo probado | Siete pestañas cargadas y descarga PDF de clientes |
| `/admin/configuracion` | Completa para el flujo probado | QR: preview, reemplazo, desactivación, vacío y archivo inválido; WhatsApp: guardar, modificar, desactivar y validar; siete días, apertura/cierre y pedidos fuera de horario |
| `/admin/auditoria` | Funcional para el alcance revisado | Registros reales de las operaciones sintéticas, detalle expandido y segunda página cargada |
| Notificaciones de la cabecera | Completa para el flujo probado | Cargar, abrir bandeja y marcar leída (contador actualizado) |
| `/prueba-cliente`, `/admin/prueba-ui` | Demo exclusiva de desarrollo | HTTP 404 en modo producción local; se conserva el código de demostración |

No se detectaron páginas operativas rotas, desconectadas o placeholders en estos recorridos. Se corrigieron: formulario de cliente que permanecía abierto al crear, listado de usuarios que no se actualizaba después del alta, modales de clientes sin el comportamiento común de diálogo, promociones y devoluciones sin conexión visible desde venta/pedido, controles sin nombres accesibles, ausencia de estados claros de carga/error/reintento en configuración/auditoría/notificaciones, bloqueo de acciones durante escrituras y mensajes transitorios engañosos en checkout. La interfaz conserva la identidad visual existente de NOVA.

Resultados sintéticos del recorrido: pedido normal #51, Bs 200, finalizado y pago confirmado; venta #52, Bs 108 con promoción del 10%, devolución completa por Bs 108; venta QR #53, Bs 110 con descuento manual de Bs 10, reintegro por Bs 10; pedido gratuito #54, Bs 0, finalizado y **cero pagos**; pedido #55, Bs 100, pago rechazado con motivo y sin QR/reporte habilitados después. Caja abrió con Bs 100 y cerró con Bs 100, diferencia cero. No se transfirió dinero ni se enviaron mensajes por WhatsApp. Registros conservados en el laboratorio, con manifiesto privado `certification/UI_RECORDS_20261008.private.json`; usuarios sintéticos y rollback también permanecen privados. No se eliminaron datos automáticamente.

**Responsive:** escritorio tuvo validación visual real y navegación real (área capturada de aproximadamente 1265 px y otro recorrido con ancho CSS de aproximadamente 870 px). Para 390/768/1265 px se revisaron estáticamente grids, breakpoints, tablas, modales, formularios, navegación, botones, imágenes y textos largos. Se corrigieron columnas sin encogimiento, tablas sin desplazamiento, nombres largos, botones sin envoltura y posición de la bandeja en pantallas estrechas. La herramienta no aplicó consistentemente los tamaños solicitados: una pestaña terminó mostrando 390 px, pero solicitar 768 px siguió produciendo 390 px. Esa observación parcial no equivale a validar visualmente todos los flujos en móvil/tablet. **Pendiente: recorridos visuales completos en 390 y 768 px con navegador redimensionable.** Es una limitación de verificación, no un defecto confirmado.

La revisión no agrega pruebas unitarias que imiten cambios de CSS. Resultado final: 301 tests aprobados en 27 archivos; lint 0 errores/0 warnings; `npx tsc --noEmit` y `npm run build` correctos. Vitest conserva el aviso de deprecación CJS de Vite; no es un warning de ESLint. No se encontraron P0/P1 nuevos en el alcance probado. P2 de verificación: recorridos visuales completos en móvil/tablet; los contratos backend conservan su certificación previa. Los P2/P3 del backend ya documentados arriba no se reabrieron ni se alteró su comportamiento. Esta revisión permite evaluar el merge dentro de ese alcance, sin afirmar cobertura exhaustiva de todos los errores de red, navegadores o variantes de datos. Master y producción no se modificaron.
