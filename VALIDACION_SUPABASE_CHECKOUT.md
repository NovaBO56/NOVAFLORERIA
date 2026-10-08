# Activación y validación de checkout — 7 de octubre de 2026

## Estado actual

La migración 035 fue revisada y es acotada. **No se ha aplicado: el usuario indicó explícitamente «No aplicar cambios remotos todavía».** No se crearon pedidos, clientes, pagos ni reservas de prueba. No se borró ningún dato.

## SQL y objetos afectados

El SQL exacto está en `supabase/migrations/035_checkout_public_summary.sql`, sin modificaciones. Crea o reemplaza únicamente `public.track_order_details(text,bigint,uuid)` y modifica los permisos de ejecución de esa función. No incluye DROP/TRUNCATE/DELETE, cambios de tablas o políticas RLS, ni cambios de `create_order` o `create_payment`.

Consulta `orders`, `customers` y `payments`, y reutiliza `track_order`. Requiere las tablas existentes, `orders.deleted_at` de la 018 y `track_order` de la 019. La 031 no es una dependencia directa de esta consulta, pero su lógica de opciones e inventario es necesaria para la compra personalizada.

Riesgos: `SECURITY DEFINER` realiza una consulta controlada por encima de RLS. Autoriza mediante número/UUID más teléfono coincidente; no valida identidad por SMS. Devuelve UUID, reserva y estado de pago además del resumen público anterior. En este proyecto se comprobó que la función no existe, por lo que no reemplazará una definición previa.

Reversión: retirar primero EXECUTE para `anon` y `authenticated` sobre esta función. Para retirar el objeto nuevo, eliminar únicamente esta función, con autorización separada y sin CASCADE. Coordinar la reversión con las APIs que ahora dependen de ella. No afecta registros de clientes, pedidos o pagos. No se ejecutó ninguna reversión.

## Vinculación de Supabase CLI

- CLI disponible en caché: **2.117.0**; no se instaló ni actualizó.
- Proyecto vinculado: `uyhawlpanhbrkkhqfhbv`, coincide con el host configurado en la aplicación.
- `supabase migration list --linked` conectó correctamente a la base remota.
- No existe `supabase/config.toml`; aun así, la referencia guardada y las credenciales existentes permiten consultas con CLI.
- El historial remoto solo registra 001, 002 y 003. Las migraciones locales posteriores no figuran en el historial, aunque sus objetos sí existen en la base.
- Existen versiones locales duplicadas 018, 019 y 020; además, `034 fix modulo pedidos.sql` no cumple el patrón de nombre reconocido por CLI.
- **No ejecutar `db push` sobre esta carpeta en su estado actual.** Podría aplicar migraciones históricas y cambios ajenos a la 035.

Operación propuesta para autorización:

```powershell
supabase db query --linked --file supabase/migrations/035_checkout_public_summary.sql
```

Ejecuta el archivo existente sin inventar una migración adicional. No registra automáticamente la 035 en el historial del CLI. La reconciliación de ese historial queda pendiente y requiere una auditoría independiente; no se marcarán migraciones como aplicadas sin contrastarlas con la base.

## Preflight remoto de solo lectura

Resultado de consultas a los catálogos PostgreSQL:

| Comprobación | Resultado |
| --- | --- |
| `track_order_details(text,bigint,uuid)` | No existe |
| `track_order(bigint,text)` | Existe |
| `create_order(text,text,text,jsonb,text,text,uuid)` | Existe |
| `create_payment(uuid)` | Existe |
| `customization_option_inventory_requirements` | Existe |
| Columnas requeridas de orders | Presentes |
| Referencias de opciones e inventario de la 031 en create_order | Presentes |

Huellas de definiciones para comparar después de aplicar la 035:

- create_order: `f32fc7ad74b07396ce13a6eae6b9a9f5`
- create_payment: `65c9724ee439c2e7caeb578786f6c616`
- track_order: `2a9fc504cd3ff1946c2a567827b0d5b6`

El archivo `supabase/checkout-preflight.sql` contiene consultas de solo lectura, no es una migración. La CLI devolvió únicamente el último conjunto de resultados al ejecutar ese archivo; se verificaron las demás condiciones mediante un SELECT adicional.

## APIs y páginas: comprobación anterior a la aplicación

Servidor local conectado al Supabase real, sin iniciar sesión:

| Ruta | Resultado |
| --- | --- |
| `/checkout` | 200, sin redirección a login |
| `/seguimiento` | 200, sin redirección a login |
| `/api/products?limit=1` | 200 |
| `/api/business-hours` | 200 |
| `/api/payment-qr` | 404: «Todavía no hay un QR de pago configurado.» |
| `/api/whatsapp-config` | 404: «Todavía no hay un número de WhatsApp configurado.» |

La ausencia de `track_order_details` se confirmó en catálogo. La prueba de seguimiento posterior a la migración todavía no se ejecutó. No se afirma que haya desaparecido PGRST202 antes de aplicarla.

En el momento de la consulta, el negocio estaba abierto, de 07:00 a 21:00, y no aceptaba pedidos fuera de horario. Se debe consultar nuevamente antes de una compra de prueba.

## Configurar QR y WhatsApp: no existe UI funcional

La navegación declara `/admin/configuracion` con `available: false`; no existe su página. El componente actual de ajustes tampoco implementa formularios de QR ni WhatsApp. Por tanto, no hay una ruta funcional del panel desde la que configurarlos actualmente.

APIs existentes, con una sesión de **administrador**:

- **QR:** `POST /api/admin/payment-qr`, multipart/form-data con `file` (imagen auténtica del QR del negocio, PNG/JPG/WebP, máximo 5 MB) y `account_label` opcional. Guarda el archivo en el bucket `payment-qr` y la configuración en `payment_qr_config`. Desactiva configuraciones activas anteriores. La lectura pública es `GET /api/payment-qr`.
- **WhatsApp:** `POST /api/admin/whatsapp-config`, JSON con `phone_number`, número auténtico del negocio en formato internacional, solo 7–15 dígitos. Guarda en `whatsapp_config` y desactiva configuraciones activas anteriores. La lectura pública es `GET /api/whatsapp-config`.

Ambas APIs usan `SUPABASE_SECRET_KEY` en el servidor y requieren que esa variable esté configurada, además de la sesión administrativa. No se imprimieron claves, no se enviaron configuraciones y no se inventó un QR o número del negocio.

## Prueba real controlada preparada, todavía no ejecutada

Cada operación que cree o cambie registros remotos requiere autorización previa, además de la autorización de la migración.

Producto candidato leído de catálogo: **Rosa Roja**, UUID `3422d51a-9dd1-4d6b-9d00-6442e74ffb50`, precio publicado Bs 12, disponible y no agotado en la consulta. Esto no garantiza stock de inventario: el backend debe validarlo al crear el pedido.

Datos sintéticos propuestos, sin clientes reales:

- Nombre: `NOVA TEST CHECKOUT 20261007 — RECHAZO` o `NOVA TEST CHECKOUT 20261007 — CONFIRMACION`.
- Teléfonos ficticios de prueba: `00020261007001` y `00020261007002`, sin envío de mensajes. Antes de usarlos, comprobar únicamente que no existen en customers; si existe coincidencia, elegir otro identificador ficticio.
- Notas y tarjeta: `PRUEBA CONTROLADA NOVA — NO ENTREGAR — NO CONTACTAR — SIN TRANSFERENCIA REAL`.
- Método: retiro; cantidad 1; sin promoción para la primera comprobación.
- Clave de idempotencia distinta por escenario, reutilizada al reintentar el mismo escenario.

Secuencia preparada:

1. Tras autorizar y aplicar la 035, verificar existencia de la función y conservar las huellas anteriores de las funciones existentes.
2. Consultar `/api/orders/track` con un número inexistente y teléfono ficticio: esperar 404 y mensaje de pedido no encontrado, sin PGRST202. Confirmar también el resultado SQL, no solo el HTTP.
3. Repetir páginas y APIs; configurar QR y WhatsApp auténticos mediante una operación administrativa autorizada antes de probar la interfaz de pago.
4. Crear un pedido desde producto → carrito → checkout con los datos sintéticos; registrar inmediatamente UUID, número, cliente creado, líneas y reservas.
5. Reportar un pago de prueba solo si se autoriza expresamente el registro pendiente **sin transferencia real**, conservando su UUID y monto. Nunca presentarlo como un pago bancario verificado.
6. En `/admin/pedidos`, abrir el pedido de prueba y pulsar **Rechazar pago**, motivo `PRUEBA CONTROLADA NOVA — sin transferencia real`. Verificar pago rechazado, pedido rechazado y liberación de reservas; comprobarlo también en `/seguimiento`.
7. Para la rama de confirmación, pedir autorización separada: **Confirmar pago consume stock e incorpora una venta real al sistema**. No ejecutar esa rama sin aceptar esos efectos sobre inventario y reportes, o usar un entorno de pruebas adecuado. Identificar igualmente cliente, pedido, líneas, pago, reservas y movimientos afectados.
8. Comprobar pérdida de respuesta/reintento, carrito conservado ante error y consulta con teléfono incorrecto sin exponer datos.

No se borrará nada automáticamente. Antes de cualquier limpieza se entregará la lista exacta de registros creados y los efectos de cancelación/reversión; una confirmación puede necesitar compensaciones de inventario y caja, no un DELETE.

## Resultado y pendientes

1. Migración: revisada, dependencias verificadas, no aplicada por indicación explícita del usuario.
2. APIs: productos y horarios correctos; QR y WhatsApp sin configurar; páginas públicas accesibles.
3. Checkout con Supabase real: conexión comprobada, flujo completo todavía no validado ni activado.
4. Registros de prueba creados: ninguno.
5. Pedido/pago/seguimiento de prueba: preparación completa, ejecución pendiente.
6. Errores/limitaciones: historial CLI desincronizado, nombres duplicados, función 035 ausente, configuración QR/WhatsApp ausente y falta de UI para configurarlas.
7. Antes del siguiente módulo: autorizar/aplicar 035, configurar datos auténticos del negocio, ejecutar prueba controlada autorizada y revisar los efectos administrativos de confirmación/rechazo.
