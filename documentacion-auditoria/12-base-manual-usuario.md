# 12 · Base para el manual de usuario

Este documento recopila procedimientos reales identificados. No sustituye un manual validado con la florería ni certifica todas las escrituras. Use datos ficticios en capturas; oculte teléfono, nombre, dirección, identificadores privados, tokens, QR bancario real y credenciales.

## Actores y acceso

El visitante/cliente utiliza la tienda, compra sin cuenta y consulta un pedido mediante número y celular. El empleado y el administrador inician sesión con correo y contraseña. Las funciones de usuarios, configuración y auditoría son exclusivas del administrador; los demás permisos deben comprobarse en las acciones, no sólo en el menú. No existe registro público del cliente, OTP ni recuperación de contraseña implementada. Evidencia: [src/app/login/page.tsx:27](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx:27>), [src/config/admin-navigation.ts:38](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/config/admin-navigation.ts:38>), [src/lib/auth/permissions.ts:32](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/permissions.ts:32>).

## Procedimientos públicos

| Procedimiento | Pasos a explicar | Capturas reales necesarias | Precaución / estado |
| --- | --- | --- | --- |
| Entrar y navegar | Abrir la dirección oficial; usar Inicio/Catálogo, filtros, búsqueda y categorías; cargar más resultados. | Portada, menú móvil y filtros con resultados. | La dirección de producción debe confirmarse; localhost es laboratorio. |
| Consultar producto | Abrir tarjeta; revisar descripción, importe, disponibilidad y galería; ampliar una foto; cerrar. | Tarjeta, detalle y ampliación; fallback sin foto. | Foto actual de catálogo, no evidencia de fabricación específica. |
| Personalizar | Elegir opciones disponibles y cantidad; escribir cada tarjeta o elegir tarjeta en blanco; revisar precio. | Opciones y editor de tarjeta con mensaje ficticio. | Notas del pedido y texto de tarjeta tienen propósitos distintos. |
| Agregar y complementar | Agregar al carrito; revisar confirmación; elegir voluntariamente complementos o continuar. | Confirmación y complementos con miniatura. | No se añaden extras automáticamente. |
| Gestionar carrito | Abrir carrito; revisar líneas; ajustar cantidades; retirar y confirmar cuando se solicite; revisar total. | Carrito con varias líneas y confirmación de retiro. | Estado local del navegador; no identifica una cuenta. |
| Usar promoción | Consultar beneficio/condición; seleccionar o armar combo; revisar bloque seleccionado; Quitar/Cambiar. | Sugerida, seleccionada, cambio y aviso de invalidez. | Descuento estimado; retirar un participante puede invalidarlo. |
| Completar compra | Datos de comprador; entrega o recojo; dirección/referencia si entrega; notas; revisar tarjetas, productos y total. | Tres pasos con datos ficticios y errores de validación. | Cliente no selecciona una hora pública; la tienda coordina. No hay destinatario independiente. |
| Crear pedido | En revisión, verificar todo y confirmar; conservar número; usar recuperación si falla la respuesta. | Botón de creación y resultado de pedido en laboratorio controlado. | Esta auditoría no crea pedidos. No repetir compra sin comprobar si el pedido ya existe. |
| Pagar y reportar | Elegir QR; pagar externamente; avisar mediante la acción de reporte; revisar pendiente de verificación. | QR ficticio de laboratorio, instrucciones y aviso reportado. | La web no transfiere dinero. No pulsar aviso antes de realizar el pago que corresponda. |
| Consultar estado | Abrir Seguimiento; indicar número y celular de la compra; consultar/actualizar. | Formulario, resumen y etapas sin datos identificables. | No requiere cuenta; el celular no es un OTP. |
| Coordinar horario | Leer Horario propuesto o confirmado en seguimiento; contactar a la tienda. | Ambos estados y caso sin horario. | Confirmación la registra el equipo tras coordinación externa; hora Bolivia. |
| Conservar referencia | Copiar número o descargar guía; abrir recibo cuando está disponible; iniciar otra compra según estado. | Acciones de número, guía y acceso de recibo sin token visible. | Guía no es factura ni comprobante de transferencia. La referencia anterior no es historial completo. |

Evidencia del recorrido público: [src/components/public/home/home-page.tsx:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/home-page.tsx:1>), [src/components/public/home/cart.tsx:211](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/home/cart.tsx:211>), [src/components/public/checkout-form.tsx:19](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-form.tsx:19>), [src/components/public/checkout-page.tsx:30](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/checkout-page.tsx:30>), [src/components/public/tracking-page.tsx:15](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/public/tracking-page.tsx:15>).

## Procedimientos del equipo

| Módulo | Procedimiento a documentar | Capturas a obtener | Reglas y prueba pendiente |
| --- | --- | --- | --- |
| Acceso y sesión | Iniciar sesión; comprobar rol; abrir perfil propio; cambiar/quitar foto si desea; cerrar sesión. | Login, menú según rol y avatar sin datos reales. | No se comparte contraseña. Recuperación web no implementada. |
| Dashboard | Seleccionar contexto disponible y leer indicadores/gráficos del período. | Dashboard con fechas y datos sintéticos. | Explicar fuente y zona horaria; demo UI no representa métricas. |
| Productos | Buscar; crear o editar; revisar datos, fotos, receta, componentes, opciones y publicación. | Lista y cada sección del editor; aviso de guardado. | Operaciones de escritura requieren pruebas controladas posteriores. |
| Categorías y temporadas | Crear/editar/activar; revisar asociación de productos; gestionar portada desde Configuración. | Lista, formulario, preview y destino del cargador. | Categoría sin portada usa fallback. |
| Promociones | Elegir tipo; definir beneficio/participantes/vigencia/mínimo; guardar; activar/desactivar. | Formulario, selector con fotos y tarjeta registrada. | No confundir estado activo con vigencia en fecha actual. |
| Complementos | Configurar selección específica o alternativa global; ordenar y consultar vista resuelta. | Picker, regla global y preview. | Límites y permisos son parte de la validación. |
| Pedidos | Buscar/filtrar; abrir detalle; revisar artículos, cliente, pago y modalidad. | Lista y modal con miniaturas. | No confirmar pagos basándose solamente en el aviso del cliente. |
| Pagos y estados | Revisar evidencia externa; confirmar/rechazar pago; pasar a preparación/listo/finalizado si procede. | Acciones habilitadas, confirmación, resultado e historial de laboratorio. | Registrar cambio altera datos reales; no se ejecutó en esta auditoría. |
| Horario | Abrir Programar/Cambiar; elegir fecha/hora; proponer o marcar coordinado tras hablar con cliente; guardar. | Formulario, propuesta, confirmado e historial. | No envía mensaje automático; si hay conflicto de revisión, volver a abrir datos actuales. |
| Cancelar/devolver | Revisar reglas; cancelar o registrar devolución/reintegro pertinente; revisar resultado e historial. | Confirmaciones y registro en laboratorio reversible. | Devolución física y reintegro monetario difieren; la web no realiza transferencia bancaria. |
| Venta presencial | Seleccionar cliente/productos, cantidades y pago; elegir sesión/caja si corresponde; revisar y registrar. | Formulario y recibo de prueba controlada. | La venta gratuita no genera ingreso ficticio. |
| Caja | Consultar cajas/sesiones; abrir; registrar movimiento; revisar esperado; cerrar según permiso. | Apertura, movimientos y cierre con importes de ejemplo. | Registro financiero interno; no equivale a banca. |
| Inventario | Filtrar materiales; consultar historial/lotes; registrar entrada, merma o ajuste según necesidad. | Tabla, lote FIFO y formularios con unidades visibles. | No ajustar stock real durante elaboración del manual. |
| Clientes | Buscar/crear/editar ficha; consultar historial administrativo. | Lista y detalle anonimizados. | No es una cuenta de cliente público. |
| Reportes | Elegir uno de siete reportes; rango cuando corresponda; cargar; descargar PDF. | Filtros, resultado vacío/con datos y PDF. | Ventas/reintegros necesitan interpretación separada. |
| Configuración | WhatsApp, horarios, recepción/entrega, QR, ubicación, foto Nosotros/categorías. | Cada grupo, preview y mensajes de validación. | Sólo administrador; no mostrar QR ni teléfono real en material académico público. |
| Usuarios y auditoría | Crear equipo; modificar rol/estado; consultar actividad y filtros. | Lista, formulario y auditoría con datos ficticios. | No retirar último administrador activo; roles académicos no son personas adicionales reales. |
| Notificaciones | Abrir bandeja; leer tipo/fecha; marcar leído cuando corresponda. | Avisos informativos, de pago por revisar y pedido listo. | Lectura del equipo compartida; no son correos ni notificaciones móviles externas. |

## Problemas comunes y respuesta orientativa

| Situación | Orientación que debe incluir el manual |
| --- | --- |
| No inicia sesión | Verificar correo/contraseña y perfil activo con responsable; no inventar recorrido de recuperar clave. |
| No existe el pedido | Comprobar número y celular utilizados; conservar el mismo entorno de datos; distinguir un error de consulta de pedido inexistente. No crear otro automáticamente. |
| No aparece descuento | Revisar vigencia, mínimo, productos y cantidades; elegir otra promoción o continuar sin descuento. |
| Stock insuficiente | Volver al carrito, actualizar productos/cantidades y revisar opciones; el servidor realiza la validación final. |
| Tienda cerrada/entrega deshabilitada | Revisar aviso de atención y elegir alternativa disponible; conservar carrito cuando corresponda. |
| QR no disponible | Contactar a la tienda por canal configurado; no inventar cuenta bancaria ni pagar un QR de prueba. |
| Aviso enviado pero pago pendiente | Esperar comprobación humana; no equivale a pago confirmado ni indica otro cobro automático. |
| Imagen ausente | La interfaz muestra fallback; personal revisa foto configurada y Storage con su responsable. |
| Actualización automática pausada | Usar Actualizar; la pantalla conserva la última lectura recibida. |
| Guardado falló o se perdió conexión | Leer mensaje; reabrir estado real antes de repetir una escritura; para pedido usar recuperación/idempotencia existente. |

Antes de publicar el manual debe confirmarse la URL oficial, obtener autorización para material visual, capturar escenarios de escritura en un laboratorio y validar cada procedimiento con el responsable de la florería. No se inventan capturas ni resultados que aún no existen.
