# QA30 — guía del cliente (borrador)

Fecha: 20 de octubre de 2026. Base inspeccionada: `42b75b8166e60cf9c44709c1891905da70a42e22`, rama `codex/inventory-refunds-dashboard-2`.

**Borrador preliminar LOCAL; no es manual definitivo.** Los estados y límites de evidencia se conservan en el [índice de procedimientos QA30](COMMERCE30_PROCEDURES_DRAFTS.md) y la [matriz comercial](COMMERCE30_TEST_MATRIX.md). No ejecutar estas simulaciones en producción. Sin credenciales ni capturas incorporadas al repositorio.

Estado: **fuente inspeccionada y recorrido visual parcial comprobado**, con detalle en el índice común. Se observó un regalo con tarjeta, dos unidades/dedicatorias, carrito/recarga, checkout de recojo, QR2/recarga, aviso pendiente, seguimiento tras cambios de empleado por API, nueva compra y oferta gratuita. Los demás caminos no se convierten en PASS por compartir componentes. Utilizar únicamente el dominio/puerto del laboratorio confirmado y teléfonos sintéticos autorizados.

La configuración LOCAL leída después en el panel del propietario confirma dos QR DEMO activos, entrega y WhatsApp deshabilitados, siete días cerrados y aceptación de pedidos fuera de horario habilitada. Esto explica por qué el recorrido utilizó recojo pese a los días cerrados y no ofreció canal WhatsApp. No es una recomendación comercial ni describe producción. La revisión administrativa fue de lectura, sin guardar configuraciones, y no agrega pruebas de operación del empleado.

## CLI-01. Elegir y personalizar

1. Abrir `/`, sección `#catalogo`; buscar el producto y revisar precio, imagen, descripción y disponibilidad.
2. Abrir detalle, seleccionar opciones y cantidad. Si la receta seleccionada incluye tarjeta, aparece «Una dedicatoria especial».
3. Escribir «Mensaje (opcional)» hasta 250 caracteres y «Firma (opcional)» hasta 60 por cada tarjeta; revisar vista previa lavanda. Varias tarjetas/unidades tienen textos independientes. Producto sin tarjeta no ofrece campos.
4. «Agregar al carrito». Si dice «Agotado», «No disponible» o «Elige una cantidad menor», revisar cantidad u otro producto; no prometer reserva por estar en el carrito.

Errores: disponibilidad cambió; se retiró una opción con mensajes; más de 198 tarjetas personalizadas por línea. Leer la advertencia; corregir cantidad/selección o continuar con tarjetas en blanco cuando se ofrezca. Visual comprobado: detalle de regalo con tarjeta, cantidad dos, dos mensajes y vista previa; otros productos/errores de CLI-01 pendientes. Referencia `commerce30-08-dedicatorias.png`; casos 01–08 y 23–27 sin aprobación visual global.

## CLI-02. Promoción o combo

- Desde promoción: «Comprar esta oferta», «Elegir productos participantes» o «Comprar combo», según la oferta.
- Combo guiado: revisar cada producto; «Continuar al siguiente producto» hasta el último; «Agregar combo al carrito». Cancelar armado conserva el carrito previo; no agrega una parte silenciosamente.
- Carrito/checkout: «Usar esta promoción» para aplicar una sugerencia; «Ver otras promociones» y «Elige una sola promoción» cuando existan alternativas. «Continuar sin promoción» o «Quitar oferta seleccionada» retira selección.
- Resultado esperado: subtotal, beneficio solo sobre participantes y total estimados coherentes; combo completo, compra mínima y vigencia se validan. El servidor establece el importe definitivo antes del pago.
- Visual comprobado: compra de una oferta gratuita al comenzar la segunda compra; suplemento de combo sin crear pedido, con dos peluches (Bs 55 con tarjeta + Bs 50 sin tarjeta), pasos 1/2 y 2/2, mensaje solo en el primero, carrito Bs 105 − Bs 15 = Bs 90. Quitar el segundo participante retiró el descuento. No equivale a flores + peluche del caso 09 ni certifica el cobro del combo; demás descuentos pendientes. No hay código promocional libre que deba inventarse en la guía.

## CLI-03. Revisar y editar carrito

- Abrir «Carrito»; ajustar con botones de cantidad; «Editar dedicatorias» cuando exista tarjeta.
- «Eliminar» abre «¿Eliminar este producto del carrito?»: «Sí, eliminar producto» o «Conservar producto». Revisar aviso de descuento retirado si cambia elegibilidad.
- Alcanzar promociones dentro del área desplazable y comprobar resumen/botón final; «Continuar compra» abre `/checkout`. «Comprar por WhatsApp» es una alternativa externa, no crea un pago confirmado.
- Resultado esperado: no se pierde texto por recargar; no se tapa resumen ni botón con carritos de volumen. Si un producto ya no incluye tarjeta, se conserva el texto para revisión y se ofrece «Continuar sin dedicatorias».
- Visual comprobado: carrito de dos unidades con textos distintos y recarga persistente; carrito vacío después de «Hacer otra compra»; eliminación confirmada del segundo participante del combo con aviso de producto eliminado/descuento retirado y total Bs 55. Cantidades extremas y toda la matriz de 375/390/430/768/1280/1440 con alturas distintas siguen pendientes de esta ronda.

## CLI-04. Crear pedido

1. `/checkout`: «Tus datos» → «Nombre completo», «Celular de Bolivia» de ocho dígitos, sin +591 → «Continuar a entrega».
2. «Entrega o recojo»: elegir «Recojo en tienda» o «Entrega a domicilio». Para entrega, «Dirección de entrega» y «Referencia (opcional)»; «Notas para la tienda (opcional)»; «Revisar mi pedido».
3. Revisar nombre, celular, método, dirección, productos, tarjetas, promoción y total; «Confirmar y crear pedido».
4. Si entrega está pausada: leer «Entrega a domicilio temporalmente no disponible» y usar «Cambiar a recojo» antes de confirmar. Si tienda está cerrada y no acepta fuera de horario, no se puede comprar.

Resultado esperado: un pedido con reserva, sin cobro ni consumo definitivo anticipado. Entrega se coordina con la tienda; costo de envío no incluido en el total de productos. Ante respuesta incierta, reintentar/actualizar el mismo pedido, no crear una compra nueva para pagar la anterior.

Visual comprobado: datos → recojo → revisión → creación; aviso de entrega desactivada; segunda compra con formulario vacío. Referencia `commerce30-08-checkout-review.png`. Entrega habilitada y demás excepciones siguen pendientes; casos 01–02, 18–19, 23–24 y 30 sin aprobación visual global. No inventar selector de fecha/franja de entrega: no está en el formulario inspeccionado.

## CLI-05. QR y aviso de pago

1. Con pedido creado de importe positivo, revisar «Total a pagar» y escoger el QR activo por etiqueta. Uno activo muestra uno; dos permiten selección; cero no deben habilitar un aviso sin cuenta seleccionada.
2. «Abrir QR seleccionado para guardarlo» es opcional. En operación real, pagar externamente el importe exacto; en QA LOCAL no efectuar transferencia bancaria.
3. Volver y pulsar «Ya pagué». Si WhatsApp está configurado, se prepara el mensaje con la etiqueta del QR: el propio cliente debe pulsar Enviar. Durante QA no enviarlo a números reales.
4. Leer «Pago reportado» / «Esperando confirmación del local». Usar «Actualizar pedido» o seguimiento para novedades.

Resultado esperado: solo pago pendiente de revisión; selección/etiqueta se guardan como declaración auxiliar. No equivale a aprobación bancaria ni concede recibo antes de confirmar. Pedido Bs 0: «Tu pedido gratuito está confirmado», sin QR ni reporte de pago.

Visual comprobado: QR2 conserva selección al recargar, «Ya pagué» produce aviso pendiente; pedido gratuito posterior sin QR ni reporte. Referencias `commerce30-04-qr2.png` y `commerce30-19-pago-reportado.png`, con los límites de encuadre indicados en el índice común. QR1, legibilidad completa de imágenes y gestión de cuenta sin QR siguen pendientes. Casos 03–04 y 18–21 sin aprobación visual global. Sin WhatsApp, el aviso permanece gestionado por el sistema y se consulta seguimiento; no inventar un envío automático.

## CLI-06. Seguimiento y otra compra

- Guardar referencia con «Copiar número» o «Guardar mi número de pedido». Este último prepara instrucciones de seguimiento; no es comprobante de pago.
- `/seguimiento`: «Número de pedido», «Celular de la compra» y «Consultar estado» / «Actualizar estado»; confirmar etapas reales y dedicatorias.
- «Descargar comprobante PDF» solo cuando está autorizado. La interfaz aclara: comprobante de pago verificado, **no factura fiscal**.
- «Hacer otra compra» desde checkout, cuando el flujo lo ofrece, limpia compra actual y conserva referencia anterior en la sesión. Guardar número/celular antes de abandonar el dispositivo.
- Cancelar pedido pendiente: no hay autocancelación. Usar ayuda/contacto con la tienda para que el personal evalúe «Cancelar pedido»; no enviar otra compra como sustituto.
- Visual comprobado: cliente ve confirmado → en preparación → listo → «Retirado», comienza otra compra vacía y, después del pedido gratuito #198, vuelve a consultar #196 con estado Retirado/pago confirmado, dos mensajes exactos y enlace de recibo. La captura final de esa consulta falló; no se presenta como ilustración válida. Las transiciones fueron realizadas por empleado mediante API, sin UI de empleado. Descarga efectiva del PDF, copia/archivo del número y consulta en otro dispositivo siguen pendientes. La actualización periódica no demuestra una notificación externa ni historial horario detallado de cada etapa.

## Contexto de evidencia y revisión pendiente

El índice común conserva el corte final de 27 pedidos atribuibles, 22 pagos, conciliaciones y 146 aserciones registradas (137 nombres únicos, cero FAIL), así como la pérdida parcial del manifiesto inicial. El pedido manual LOCAL #197 queda fuera del alcance e intacto; no se atribuye autoría. Un PASS técnico no aprueba pantallas ni responsive. Consultar allí las capturas utilizables, las capturas vacías, los hallazgos COM30-001/COM30-002 y las limitaciones de cada rol. Falta revisión del propietario antes de elaborar un manual ilustrado definitivo.
