# Laboratorio LOCAL LAB50 — Floristería Anabelle

Esta guía describe la preparación, los resultados comprobados y el uso del laboratorio sintético existente. Las comprobaciones corresponden al dataset y al entorno LOCAL de esta ronda; **no equivalen a certificación completa de la aplicación ni a validación de producción**. Una comprobación pendiente no equivale a PASS.

## Alcance y acceso

- Rama de trabajo: `codex/inventory-refunds-dashboard-2`.
- Laboratorio Supabase: `NOVA-LOCAL-INTEGRITY`, en la carpeta privada `inventory-refunds-final-replay`.
- Web en esta computadora: <http://127.0.0.1:3116>.
- Web desde otro dispositivo de la misma Wi-Fi privada: <http://192.168.1.32:3116>.
- API Supabase local en esta computadora: <http://127.0.0.1:62621>.
- API Supabase local desde la misma Wi-Fi, si la aplicación está configurada para acceso LAN: <http://192.168.1.32:62621>.

La IP `192.168.1.32` puede cambiar al reconectar la computadora o el router. En un celular, `127.0.0.1` apunta al propio celular; debe utilizarse la IP Wi-Fi de esta computadora. Ambos dispositivos deben estar en la misma red. Si no abre, comprobar la IP, que los servicios sigan ejecutándose y que el acceso permitido por el firewall corresponda únicamente a la red privada.

El laboratorio no debe publicarse en Internet ni exponerse mediante redirección de puertos. Sus claves y cuentas sintéticas no deben reutilizarse en producción. No compartir contraseñas, cookies, tokens ni archivos privados.

## Datos confirmados de la preparación

Las cantidades siguientes fueron comprobadas al cerrar la preparación LAB50, antes de nuevas compras o cambios manuales. Se conservaron **14 pedidos previos**, incluidos los pedidos protegidos **27, 28 y 29**.

| Elemento | Cantidad confirmada |
|---|---:|
| Productos nuevos LAB50 | 50 |
| Productos totales, incluidos los 4 anteriores | 54 |
| Productos activos disponibles en el catálogo público | 53 |
| Familias nuevas | 10, con 5 productos cada una |
| Operaciones LAB50 | 30 |
| Pedidos online LAB50 | 24 |
| Ventas físicas LAB50 | 6 |
| Operaciones pagadas LAB50 | 18: 12 online y 6 físicas |
| Pedidos gratuitos LAB50 | 2 |
| Reintegros con importe monetario | 4 |
| Registros de devolución/reintegro/retorno | 5 |
| Operaciones que restauran inventario físico | 2 |
| Insumos nuevos LAB50 | 12 |
| Lotes nuevos LAB50 | 24 |

Las diez familias son rosas, girasoles, ramos mixtos, peluches con flores, cajas, canastas, detalles románticos, cumpleaños, temporada y combos/regalos. Los códigos van de `LAB50 01` a `LAB50 50`; los precios de demostración están entre Bs45 y Bs650.

Las imágenes LAB50 son **ilustraciones propias de demostración generadas desde SVG**, identificadas como tales. No son fotografías reales ni representan productos disponibles en producción. Los dos medios QR muestran **“NO PAGAR / DEMOSTRACIÓN”**; no contienen datos bancarios ni un QR de pago real. Nunca transferir dinero para probar este laboratorio.

La configuración WhatsApp LOCAL se deja desactivada para evitar abrir conversaciones durante la prueba. Esto no modifica la configuración comercial de producción.

## Administrador sintético existente

La cuenta administrativa local ya existe; no es necesario crear otra ni registrarse como cliente para comprar. Las credenciales permanecen fuera del repositorio:

```text
%LOCALAPPDATA%\NOVA-Floreria\inventory-refunds-final-replay\admin.credentials.private.json
```

Para abrir ese archivo en Bloc de notas desde PowerShell, sin imprimir su contenido en la terminal:

```powershell
notepad "$env:LOCALAPPDATA\NOVA-Floreria\inventory-refunds-final-replay\admin.credentials.private.json"
```

Usar esos valores únicamente en el login LOCAL: <http://127.0.0.1:3116/login> o su equivalente Wi-Fi. No copiarlos a documentación, código, capturas, chats ni Git. Cerrar Bloc de notas después de consultarlos.

## Prueba manual de compra y confirmación

1. Abrir el catálogo LOCAL y buscar **LAB50 01**. Agregar una unidad al carrito.
2. Continuar al checkout como invitado. No crear una cuenta de cliente.
3. Usar nombre **LAB50 Visitante** y celular sintético **00025999**. Elegir retiro para evitar necesitar una dirección de entrega; si se prueba entrega, utilizar únicamente datos claramente sintéticos, sin destino real.
4. Continuar con el pedido **sin promoción** para probar el flujo de importe positivo. Revisar producto, cantidad y total.
5. Elegir QR1 o QR2. Ambos son demostraciones **NO PAGAR**. No escanear para transferir ni enviar dinero.
6. Pulsar **Ya pagué** para simular el aviso de pago. Guardar el número de pedido que devuelve la aplicación.
7. Comprobar la pantalla de espera floral. El aviso queda pendiente de revisión; **reportar pago no confirma el pedido**.
8. En otra pestaña, iniciar sesión con el administrador sintético y abrir `/admin/pedidos`. Buscar el número de este pedido y revisar sus datos antes de confirmar el aviso sintético.
9. Volver al seguimiento público, introducir número y celular **00025999** si se solicitan, y pulsar **Actualizar**. Comprobar el estado confirmado recuperado del servidor.
10. Desde administración avanzar, en orden, por **En preparación → Listo → Finalizado**. Actualizar el seguimiento después de cada cambio. Las etiquetas públicas dependen de si se eligió entrega o retiro.
11. Comprobar que el comprobante PDF solo esté disponible después de la confirmación efectiva del pago. No confundir el aviso reportado con autorización para descargarlo.

Los pedidos pendientes que conservan una reserva temporal siguen su vencimiento normal. No se garantiza que un pedido de demostración antiguo pueda confirmarse más tarde: **para probar la compra completa, crear un pedido nuevo** y seguir su propio número. Esta guía no promete que una reserva anterior continúe vigente.

Estas acciones generan un pedido y movimientos sintéticos adicionales. Su número debe anotarse en el registro privado; desde ese momento los totales del laboratorio pueden superar las cantidades iniciales de esta guía. No enviar mensajes reales ni probar contra una URL pública.

Para probar total cero, utilizar una unidad de **LAB50 01** con la promoción **LAB50 · Gratis producto 01**. Revisar que el total sea cero antes de continuar. Ese contrato no requiere QR, reporte de pago ni un pago monetario ficticio; consultar posteriormente el estado real del pedido. La disponibilidad del comprobante sigue el contrato vigente y no debe inferirse únicamente del total cero.

## Caja e historial de demostración

La caja histórica LAB50 abrió con Bs500 y se cerró con **Bs967,50 esperados y contados, diferencia cero**. Sus seis ventas físicas quedaron conciliadas:

| Concepto | Importe confirmado |
|---|---:|
| Ventas físicas brutas | Bs1375,00 |
| Ventas en efectivo | Bs740,00 |
| Ventas por QR | Bs635,00 |
| Reintegros en efectivo | Bs272,50 |
| Reintegros por QR | Bs159,00 |
| Reintegros monetarios totales | Bs431,50 |
| Efectivo esperado al cerrar: 500 + 740 − 272,50 | **Bs967,50** |

Se abrió después una **segunda sesión LAB50 con Bs500**, disponible para pruebas manuales y verificada como la sesión abierta más reciente. No se cerraron otras cajas previas. **No cerrar ni alterar otras cajas previas.** Verificar qué sesión muestra `/admin/caja` antes de registrar una venta física nueva; la aplicación utiliza la sesión abierta más reciente. Los importes son sintéticos, no dinero real.

Las operaciones terminales nuevas distribuyen sus fechas en una ventana de hasta 29 días para poblar los filtros de reportes. Se conserva la relación temporal entre pedidos pagados, pagos, descuentos, devoluciones y movimientos cuando los contratos lo permiten. Las reservas pendientes siguen utilizando fechas actuales.

**Excepción documentada:** los movimientos de inventario de pedidos gratuitos conservan su fecha auténtica de creación. El trigger vigente protege su actor automático; no se desactiva, no se inventa un actor y no se cambia el estado de un pedido para modificar artificialmente esos movimientos.

El dashboard y el reporte financiero reconocen ventas pagadas por fecha de confirmación y reintegros por su propia fecha. El reporte de productos vendidos utiliza la fecha del pedido. Los importes globales también incluyen los datos anteriores preservados; no compararlos directamente con cifras que incluyan solo LAB50.

La conciliación del ledger exclusivamente LAB50 confirmó **Bs5083,00 brutos − Bs431,50 de reintegros = Bs4651,50 netos**. Dashboard y reporte financiero coincidieron en los rangos **Hoy, 7 días y 30 días**.

## Comprobaciones reales completadas

| Comprobación LOCAL | Resultado |
|---|---|
| HTTP de seguimiento, escenarios privados `04`, `07`, `19` y `23` | Correcto; estados y autorización de comprobante coinciden con el RPC del servidor |
| Teléfono incorrecto en seguimiento | HTTP404, sin pedido ni token de comprobante |
| UUID de pedido pendiente utilizado como autorización de comprobante | HTTP404 |
| Comprobante de pedido con pago confirmado | HTTP200, PDF válido, privado y con `Cache-Control: no-store` |
| Imágenes QR1 y QR2 mediante Storage LAN | Ambas HTTP200 y decodificables |
| Stock por insumo, lotes y movimientos | Conciliado; 12 insumos y 24 lotes nuevos |
| Caja histórica | Cerrada, Bs967,50 esperados/contados, diferencia cero |
| Caja manual nueva | Abierta con Bs500 y seleccionada como la más reciente |
| Preservación de pedidos anteriores | 14 conservados, incluidos 27/28/29 |

Las claves `04`, `07`, `19` y `23` identifican escenarios del informe privado; no son necesariamente los números públicos de los pedidos.

Se navegó realmente por el navegador usando loopback: catálogo con ilustraciones LAB50 cargadas, login administrador, pedidos, inventario, caja, productos con 54 registros, búsqueda de los 50 productos LAB50 para venta, reportes con registros, configuración con ambos QR cargados y seguimiento en espera. Las ilustraciones se identifican como demostración y no son fotografías. Las pestañas nuevas de invitado y administrador no registraron errores de consola.

La revisión visual real incluyó **escritorio de 1280 px** y **viewport de 390 px**. En 390 px se verificaron catálogo, checkout y seguimiento sin overflow horizontal. Esto no acredita una prueba en un teléfono físico ni en todos los tamaños o navegadores.

El acceso HTTP a través de la IP LAN guardada funcionó desde la herramienta de línea de comandos. La herramienta de navegador bloqueó su navegación a esa IP LAN; se registra como **limitación del entorno de pruebas, no como un defecto demostrado de la aplicación**. La prueba desde un celular físico conectado a la misma Wi-Fi queda pendiente del usuario.

| Calidad final de esta ronda | Resultado |
|---|---|
| `npm test` | **564/564**, 43 archivos |
| `npm run lint` | **0 errores / 0 warnings** |
| `npx tsc --noEmit` | Correcto |
| `npm run build` | Correcto, 69 páginas |
| Secret scan | 405 archivos, sin hallazgos |
| Integridad legacy | **39/39 byte-idénticos** |

Las operaciones de preparación se ejecutaron mediante los contratos RPC/API existentes y se revisaron las pantallas indicadas. **No se presenta esta preparación como un flujo de compra completo certificado de punta a punta por navegador**; el usuario realizará la batería manual sobre el laboratorio preparado. La evidencia visual se conserva fuera de Git, en la carpeta privada de visualizaciones de esta revisión.

No se modificaron APIs comerciales, migraciones SQL ni seed para preparar el laboratorio. Las pruebas realizadas no autorizan merge, deploy ni operaciones remotas.

## Incidencias del preparador corregidas

Estas incidencias pertenecieron a la herramienta de preparación/verificación; no se presentan como defectos nuevos de la aplicación:

- La creación de la caja con el usuario autenticado devolvió `42501`, porque su RLS permite lectura pero no ese bootstrap. Se utilizó exclusivamente `service_role` LOCAL para crear la configuración de caja. No se modificaron políticas; ventas, sesiones y devoluciones utilizaron las APIs comerciales autenticadas.
- El intento de cambiar la fecha de movimientos gratuitos encontró el trigger que protege su actor automático. Se conservaron sus fechas auténticas, sin inventar actor ni desactivar el trigger.
- La verificación de método de pago usaba incorrectamente `payment.payment_method`; se corrigió a la columna real `payment.method`.
- El cálculo histórico basado en día UTC podía adelantar la fecha comercial de Bolivia. Se cambió a `America/La_Paz` y se comprobó que no quedaran pedidos LAB50 con fecha futura.

## Scripts y evidencias

- `scripts/lab50-catalog.mjs`: definición pura de las categorías, insumos y productos sintéticos; importarlo no modifica la base.
- `scripts/prepare-lab50-local.mjs --prepare`: preparación aditiva y reanudable de este laboratorio fijo. No es un seed general ni un comando para producción.
- `scripts/prepare-lab50-local.mjs --verify`: comprueba el estado esperado de las fixtures existentes. Puede escribir el informe privado y requiere acceso al laboratorio; no implica que toda prueba de navegador esté completada.
- `scripts/start-lab50-local.ps1`: inicia la web del laboratorio en el puerto 3116 con sus variables privadas. Con `-Build`, compila la aplicación en lugar de iniciar el servidor.
- `lab50-results.private.json` y `LAB50-GUIA-PRIVADA.md`, dentro de la carpeta privada del laboratorio: resultados y referencias de pedidos generados. No agregarlos a Git.

La reanudación existe para terminar una preparación interrumpida. **No volver a ejecutar automáticamente `--prepare` después de pruebas manuales:** primero revisar cambios, estado de pedidos, reservas, caja y resultados privados para evitar reinterpretar datos que el usuario ya modificó. Tampoco declarar fallo de la aplicación porque una verificación del dataset inicial detecte cambios manuales posteriores esperados.

Para compilar o iniciar la web, desde PowerShell en la raíz del repositorio:

```powershell
# Compilar con configuración exclusivamente LOCAL:
.\scripts\start-lab50-local.ps1 -Build

# Iniciar el servidor LOCAL; mantener esa terminal abierta:
.\scripts\start-lab50-local.ps1
```

El script valida rama, laboratorio desvinculado, puertos fijos e IP perteneciente a esta computadora antes de usar las variables privadas. No imprime claves. Requiere que el laboratorio Supabase existente esté activo; no lo resetea ni ejecuta seed.

El opt-in `NOVA_LOCAL_LAB=true` permite servir directamente las imágenes de Storage al navegador LAN mediante `images.unoptimized`, únicamente si la URL Supabase es HTTP, utiliza el puerto 62621 y pertenece a esta computadora. No se habilita `dangerouslyAllowLocalIP`. Sin ese opt-in, la configuración normal mantiene la optimización habitual; no se cambiaron las variables productivas.

## Límites y conservación

- No resetear, reseedear, borrar ni truncar la base.
- No eliminar datos sintéticos ni registros anteriores automáticamente.
- No ejecutar migraciones nuevas para preparar estas fixtures.
- No acceder a producción ni a ninguna Supabase remota, incluida la antigua.
- No realizar merge, deploy ni modificar configuración comercial remota.
- No guardar claves, contraseñas, cookies, tokens, dumps ni informes privados en Git.
- No presentar cifras esperadas, revisión estática o una prueba incompleta como una validación aprobada.

El laboratorio queda destinado a revisión manual con datos sintéticos. Los resultados reales y cualquier limitación de acceso móvil, navegador o entorno deben constar por separado en el informe final.
