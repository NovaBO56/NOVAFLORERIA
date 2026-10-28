# 14 · Pendientes, riesgos y recomendaciones

## 1. Cómo interpretar este registro

Este documento prioriza el trabajo que podría hacerse **después de la auditoría**. No se implementó ninguna recomendación, no se corrigieron fuentes y no se modificó la base de datos. Una propuesta no debe figurar como funcionalidad entregada ni como compromiso aprobado por el usuario.

Se distinguen: **defecto confirmado en código**, **limitación de consistencia/capacidad**, **validación pendiente del despliegue**, **prueba pendiente**, **contenido pendiente** y **funcionalidad futura por decidir**. La prioridad ordena atención; no implica que todos los puntos sean vulnerabilidades ni incidentes. P1 significa revisar antes de una publicación productiva; P2, robustez y operación; P3, evolución y calidad. No se asignan fechas, porcentajes de avance ni responsables personales sin información del proyecto.

## 2. Registro priorizado

| ID | Prioridad | Tipo y certeza | Acción propuesta | Condición de cierre |
|---|---|---|---|---|
| REC-01 | P1 | Defecto confirmado; SEG-01 | Unificar la validación de destinos internos de login en formulario y proxy | Sesión autenticada y anónima rechazan destinos externos, doble barra y barra invertida; rutas internas válidas siguen funcionando |
| REC-02 | P1 | Validación de despliegue pendiente | Comparar migraciones, ACL/RLS, buckets, Auth y configuración del entorno que se vaya a publicar | Informe de metadatos y configuración sin secretos; diferencias justificadas; privilegios mínimos verificados en el entorno real |
| REC-03 | P2 | Límite de disponibilidad confirmado en fuentes; impacto condicionado | Definir presupuesto de recepción JSON/multipart y límites coherentes de líneas/opciones | Solicitudes que exceden el límite se rechazan antes de procesamiento costoso; UI, API y RPC comparten el contrato |
| REC-04 | P2 | Consistencia concurrente de imágenes | Hacer atómica la cuota y el orden de imágenes de producto | Dos cargas concurrentes no superan el máximo acordado ni producen un orden ambiguo; se conserva la funcionalidad de reordenar |
| REC-05 | P2 | Compensación ausente en una ruta | Eliminar el objeto recién creado si falla la asociación de una portada de tienda | Un fallo controlado de set_storefront_media no deja un blob huérfano ni elimina la portada anterior |
| REC-06 | P2 | Capacidad y filtros; no error actual de datos demostrado | Paginar directorio/reportes de clientes y acotar/escapar su búsqueda | Datos sintéticos por encima del máximo PostgREST producen resultados y totales completos; caracteres especiales no rompen el filtro |
| REC-07 | P2 | Prueba pendiente | Completar pruebas transaccionales reales y concurrencia en un entorno desechable | Pedido/pago/inventario/caja/roles se validan contra PostgreSQL real con rollback y reintentos, además de mocks |
| REC-08 | P2 | Endurecimiento condicionado por infraestructura | Verificar cabeceras de seguridad, origen/CSRF, cookies y confianza del proxy | Evidencia del despliegue demuestra cabeceras y política coherentes sin romper SSR, login, imágenes ni clientes admitidos |
| REC-09 | P2 | Prueba operacional pendiente | Hacer un simulacro real de recuperación y definir copia de archivos Storage | Restauración verificada en instancia desechable; inventario de lo recuperado, lo excluido y acceso a claves documentado sin exponerlas |
| REC-10 | P3 | Calidad UX y contenido | Completar pruebas de dispositivos/accesibilidad y portadas reales donde falten | Recorridos de teclado y móvil reales documentados; fallback permanece correcto si una categoría no tiene foto |
| REC-11 | P3 | Proceso de calidad | Formalizar cobertura, CI y trazabilidad de cada validación | Reporte reproducible enlaza árbol fuente, resultados, versión del esquema y cobertura de líneas/ramas sin porcentajes inventados |
| REC-12 | P3 | Funcionalidad futura por decidir | Acordar registro/recuperación de clientes, gateway, dirección estructurada u otras ampliaciones | Requisito aprobado y separado del alcance existente antes de diseñar o programar |
| REC-13 | P3 | Política de privacidad y operación pendiente | Acordar retención, acceso a logs y ciclo de vida de enlaces de recibo | Política de negocio documentada; pruebas de acceso/expiración según lo acordado, sin cambiar silenciosamente la compra invitada |
| REC-14 | P3 | Comprobación de dependencias pendiente | Revisar avisos de seguridad contra las versiones bloqueadas | Informe fechado de dependencias y aplicabilidad; actualizaciones propuestas y probadas por separado, sin audit fix automático |

## 3. Evidencia y alcance de las recomendaciones prioritarias

### REC-01 · Redirección al regresar de login

El proxy acepta cualquier cadena que empiece por una barra y la pasa a new URL. Las entradas //host y una combinación barra/barra invertida pueden resolver otro origen. El helper del formulario ya valida de forma más restrictiva, pero no se reutiliza en esa rama. Evidencia: [src/lib/supabase/proxy.ts:80](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/proxy.ts:80>) y [src/lib/auth/login-destination.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/login-destination.ts:1>).

La [prueba pura documentada](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-prueba-pura-redireccion.json>) confirma la resolución URL, sin red ni sesión real. El impacto demostrado es redirección externa con riesgo de phishing; no se demostró robo de tokens ni acceso a datos. La severidad es media y se prioriza antes de publicar por tener causa clara y una corrección localizada que deberá probarse después.

### REC-02 y REC-08 · Paridad y fronteras del despliegue

Se inspeccionó un laboratorio local real mediante consultas READ ONLY de catálogo. Allí las 38 tablas públicas tienen RLS y los ACL críticos están inventariados. Esto no certifica el proyecto Supabase remoto ni la configuración de un proveedor de hosting. Deben compararse definiciones efectivas, políticas Storage y permisos; las migraciones por sí solas no prueban la situación desplegada. Véanse [04-base-de-datos.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/04-base-de-datos.md>) y [08-seguridad.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/08-seguridad.md>).

El rate limiter toma el primer x-forwarded-for o x-real-ip. La suficiencia de ese origen depende de que el borde elimine o reescriba cabeceras aportadas por terceros: [src/lib/rate-limit.ts:35](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/rate-limit.ts:35>). No se probó que el despliegue permita falsificarlo. La CSP explícita encontrada corresponde al preview visual; las cabeceras productivas podrían existir fuera del repositorio. El control Origin está explícito en el avatar, sin un equivalente uniforme identificado en las otras mutaciones. JSON, CORS y SameSite=lax son mitigaciones que deben considerarse antes de afirmar una explotación CSRF.

La comprobación debe registrar flags de cookies y política HTTPS sin mostrar sus valores. No se propone imponer HttpOnly de forma indiscriminada: el cliente de Auth del navegador necesita compatibilidad con el flujo de sesiones existente. Tampoco se declara una vulnerabilidad por el solo hecho de que las cookies del SDK sean accesibles a JavaScript.

### REC-03 · Presupuesto de solicitudes y contratos coherentes

La interfaz limita el carrito a cincuenta líneas, pero createOrderSchema.items solo exige un array no vacío y el último create_order SQL no establece ese máximo ni otro límite explícito para IDs de opciones. La API llama request.json antes de validar el contenido. El rate limit previo mitiga frecuencia, no tamaño de un solo cuerpo: [src/validations/orders.ts:27](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/orders.ts:27>), [src/app/api/orders/route.ts:21](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts:21>) y [20261009000100_guest_customers_secure_receipts.sql:101](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/migrations/20261009000100_guest_customers_secure_receipts.sql:101>).

En productos, portadas y QR existen límites de archivo y controles de formato; parte del cuerpo multipart ya fue recibido al ejecutar la comprobación File.size. El avatar usa recepción por streaming acotada, un patrón útil para evaluar. Debe acordarse el presupuesto real y comprobar las restricciones del servidor/borde. No se hicieron solicitudes grandes ni pruebas de saturación, por lo que no se cuantifica un ataque de denegación de servicio.

### REC-04 · Cuota de imágenes y concurrencia

La ruta de imágenes consulta el número actual, compara con diez y luego sube/inserta. Dos cargas del personal autorizado podrían observar el mismo número anterior. El catálogo local y las migraciones no muestran un trigger que haga atómica esa cuota ni una restricción UNIQUE sobre sort_order: [src/app/api/admin/products/[id]/images/route.ts:248](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/route.ts:248>).

Es una brecha de consistencia y almacenamiento; no demuestra una escalada de privilegios. La ruta sí tiene autorización, validación de archivo y compensación cuando falla su inserción. La solución futura debe respetar reordenado y borrado existentes y probar dos operaciones concurrentes sin perder ninguna foto anterior. No se efectuaron cargas concurrentes durante la auditoría.

### REC-05 · Objeto huérfano al fallar una portada

La ruta de portada sube primero el archivo y luego llama set_storefront_media; si esta RPC falla devuelve un error sin retirar el objeto recién creado: [src/app/api/admin/storefront-media/route.ts:24](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/storefront-media/route.ts:24>). La configuración anterior permanece, pero puede acumularse un objeto sin asociación. Se propone compensar únicamente la clave aleatoria de esa operación, conservando la imagen previa y registrando un diagnóstico controlado. Las rutas de producto/QR ofrecen precedentes de compensación; no se propone borrar masivamente objetos sin referencias comprobadas.

### REC-06 · Paginación y búsqueda de clientes

El directorio consulta clientes sin recorrer páginas; el reporte obtiene pedidos y los agrupa también sin paginación. La configuración local PostgREST declara max_rows = 1000. Con un volumen mayor podría resultar un directorio o reporte incompleto; no se demostró que los datos actuales excedan el límite, y el valor remoto no se verificó. Evidencias: [src/app/api/admin/customers/route.ts:20](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/customers/route.ts:20>), [src/app/api/admin/reports/customers/route.tsx:44](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/customers/route.tsx:44>), [supabase/config.toml:18](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/config.toml:18>).

La búsqueda del directorio interpola el término en una expresión .or de PostgREST. Se recomienda acotar/normalizar y escapar caracteres de filtro. No equivale a una concatenación SQL ni se ha demostrado una elevación de permisos: el endpoint ya exige personal activo. Hay un helper de recorrido de páginas reutilizable en [src/lib/db/read-all-pages.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/db/read-all-pages.ts>); adoptar una solución requiere revisar orden estable y volumen, sin cambiar los totales de negocio.

## 4. Pruebas y recuperación pendientes

Los 838 casos previos aprobaron y el build real quedó verificado contra el mismo contenido fuente. Gran parte de los escenarios API usa Supabase simulado; las pruebas de contrato SQL leen texto y las de respaldo simulan comandos PostgreSQL. Esa evidencia es valiosa y sus límites están descritos en [09-pruebas.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/09-pruebas.md>).

REC-07 debe comprobar invariantes reales de idempotencia, reserva/caducidad, inventario, descuento, pago, devolución y caja, con fallos y concurrencia. Una prueba de interfaz completa también debe demostrar que «pago reportado» nunca se convierte en «pago confirmado» por una acción del cliente. Las pruebas con escritura requieren un laboratorio desechable, datos sintéticos y una limpieza definida; no se ejecutaron aquí.

REC-09 no consiste solo en comprobar que exista un archivo cifrado. Debe recuperar una base real, verificar su estructura/consistencia y documentar separadamente archivos Storage, configuración y claves requeridas. Los tests existentes de filesystem/cifrado no prueban recuperación de las fotografías. No se ejecutó ningún respaldo ni restauración productiva durante esta auditoría.

## 5. UX, contenido y ampliaciones que requieren decisión

Las mediciones responsive y las capturas normales conservadas se detallan en [07-interfaces.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/07-interfaces.md>). Medir cuatro tamaños CSS no equivale a probar cuatro dispositivos ni accesibilidad completa. Las advertencias existentes del avatar se refieren a optimización de img, sin fallo demostrado de carga. Deben priorizarse según impacto medido, sin alterar un flujo de avatar que ya contempla acceso privado y fallback.

En la muestra anterior las categorías carecían de portadas configuradas y mostraban un fallback intencional. Añadir fotografías reales es un pendiente de contenido, no un error que justifique inventar imágenes o cambiar el modelo de datos.

No se encontró registro público de cuentas de cliente, recuperación de contraseña de cliente, OTP por celular ni una interfaz MFA propia. La compra invitada con número de pedido/teléfono sí existe. Tampoco debe confundirse el QR manual con un gateway automático, el enlace WhatsApp con envío automático, ni el comprobante PDF con facturación fiscal. Añadir esas funciones exige requisitos y aprobación; su ausencia no incumple por sí sola un requisito actual documentado. El inventario [03-inventario-funcionalidades.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/03-inventario-funcionalidades.md>) registra el estado real.

El enlace de recibo funciona como una capacidad de acceso de quien conoce su token; no se identificó un ciclo de expiración/revocación en la ruta pública. El seguimiento usa conocimiento de pedido y teléfono, sin OTP. Son decisiones de privacidad y experiencia de la compra invitada que deben acordarse con el negocio antes de cambiar sus reglas. No se presenta una ausencia de login de cliente como un bypass del diseño existente.

## 6. Uso en el proyecto formativo y seguimiento de trabajo

Cada recomendación puede convertirse en una tarea con criterio de aceptación, vínculo a un RF/RNF, evidencia de prueba y estado pendiente/en curso/verificado. Los roles de análisis, desarrollo, pruebas y operación son responsabilidades propuestas; no acreditan cuatro integrantes ni una metodología que ya se haya aplicado.

La siguiente iteración debe comenzar por decidir el alcance y validar el entorno, después realizar correcciones aisladas y volver a ejecutar las pruebas pertinentes. Se debe conservar trazabilidad de fuentes y resultados, solicitar aprobación para nuevas funciones y mantener separados los datos históricos de las fotos/precios actuales de catálogo. Esta auditoría entrega el registro y la evidencia; el código existente queda sin reparaciones aplicadas.

