# 08 · Seguridad informática

## 1. Alcance, método y límites

Auditoría documental del árbol local de desarrollo, fechada el 26/10/2026. La rama es desarrollo-auditoria; HEAD de referencia: 7ec66ffc00b0270c878b139bb3bcbd0f91bd84fd. Los cambios locales forman parte del objeto auditado; HEAD por sí solo no identifica todo ese contenido.

Se rastrearon los 95 archivos de API y sus 133 combinaciones ruta/método, las validaciones, los clientes Supabase y los controles de sesión. Se revisaron en profundidad autenticación, funciones privilegiadas, seguimiento, recibos, pagos manuales, caja, carga de archivos y configuración. El [ANEXO-superficie-api-seguridad.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-superficie-api-seguridad.md>) permite localizar cada handler; el índice no equivale a probar todas sus ramas.

Se distingue entre:

- **Código verificado:** control encontrado en fuentes, sin afirmar su comportamiento en producción.
- **Metadata local verificada:** catálogo PostgreSQL consultado por el agente principal mediante transacción de sólo lectura y rollback; no contiene filas comerciales.
- **Comprobación pura ejecutada:** evaluación de URL en memoria, sin HTTP, cookies ni sesión.
- **Riesgo condicionado o propuesta:** requiere comprobar despliegue, cabeceras, carga o decisiones del negocio.

El [ANEXO-catalogo-local-verificado.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-catalogo-local-verificado.json>) corresponde exclusivamente al laboratorio NOVA-LOCAL-CATALOGO-DEMO: PostgreSQL 17.11, 38 tablas públicas, 334 columnas, 69 firmas de función, 90 políticas públicas/Storage, 52 triggers y dos vistas. Las 38 tablas tienen RLS habilitado; force_rls es falso. No se interpreta este último valor como vulnerabilidad automática: el cliente privado y funciones SECURITY DEFINER requieren justamente un análisis de autorización adicional.

No se consultaron valores de archivos de entorno, contraseñas ni tokens. No se ejecutaron ataques de red, escáneres externos, migraciones, escrituras de negocio o cambios de permisos. La auditoría no certifica producción ni sustituye una prueba de penetración.

## 2. Autenticación y sesiones

La cuenta de personal utiliza correo y contraseña mediante Supabase Auth. El formulario ejecuta signInWithPassword y ofrece un error genérico de credenciales; no se encontró un registro público de clientes, autenticación por SMS/OTP, recuperación de contraseña o interfaz MFA implementada. Su eventual disponibilidad en la plataforma Supabase no demuestra un flujo integrado en esta aplicación. Evidencia: [src/app/login/page.tsx:24](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx:24>).

El proxy renueva/verifica claims y separa páginas públicas de administrativas. La identidad de claims se usa para navegación; los permisos efectivos del servidor vuelven a verificar el usuario con auth.getUser y consultan profiles. Después se comprueban rol e is_active. La navegación visible por rol no es la única barrera. Evidencias: [src/lib/supabase/proxy.ts:24](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/proxy.ts:24>), [src/lib/auth/permissions.ts:28](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/permissions.ts:28>) y [src/components/admin/layout/session-guard.tsx:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/session-guard.tsx:13>).

El SDK SSR instalado declara SameSite=lax y httpOnly=false como valores predeterminados. La aplicación reenvía las opciones de cookies del SDK. No se inspeccionaron cookies reales de producción ni se verificó su bandera Secure/TLS. httpOnly=false no se clasifica aisladamente como defecto: la arquitectura actual también utiliza un cliente Auth en navegador. Cualquier endurecimiento requiere revisar ese contrato y la renovación de sesión, sin cambiar una opción a ciegas. Referencias: [src/lib/supabase/proxy.ts:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/proxy.ts:13>), [src/lib/supabase/server.ts:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/server.ts:13>) y el paquete instalado @supabase/ssr/src/utils/constants.ts.

El alta de personal es administrativa. El servidor exige administrador, valida correo, contraseña mínima de ocho caracteres, nombre y rol, crea el usuario por Auth Admin y configura el perfil mediante update_staff_profile. Si falla esa configuración intenta compensar eliminando el usuario recién creado. email_confirm=true forma parte de este alta controlada, no de una inscripción abierta. Evidencia: [src/app/api/admin/users/create/route.ts:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/users/create/route.ts:6>).

## 3. Matriz de autorización real

| Identidad | Facultades comprobadas en código | Límites |
|---|---|---|
| Visitante sin cuenta | Catálogo, información de tienda, disponibilidad, solicitud de pedido, aviso de pago y seguimiento con comprobación específica. | No tiene rol de personal. El servidor recalcula y valida el pedido. |
| Empleado activo | Operación de productos/categorías, pedidos/pagos, ventas, caja e inventario y reportes permitidos por cada handler. | No equivale a administrador; algunas escrituras y configuraciones exigen ese rol. |
| Administrador activo | Operaciones del equipo y administración de usuarios, configuraciones, promociones, recomendaciones, devoluciones y revisiones restringidas. | Sigue sujeto a validación, invariantes SQL y registro de cambios. |
| Cuenta inactiva o sin perfil válido | Las funciones require* rechazan el acceso. | La existencia de una sesión Auth no basta para operar. |

El recuento estático identifica 34 handlers con autorización de administrador y 82 de equipo activo, incluidos wrappers: 115 métodos dentro de /api/admin/* más el GET /api/admin-check. El avatar delega en actor(); las exportaciones PUT/PATCH de recomendaciones delegan en update(). No se presentaron esos wrappers como APIs sin protección.

Existen diferencias deliberadas por método. Por ejemplo, promociones permite lectura al equipo y escritura al administrador; devoluciones de pedidos permite GET al equipo y POST al administrador. La matriz detallada evita asumir un permiso idéntico para todo un módulo. Fuentes: [src/app/api/admin/promotions/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/promotions/route.ts>), [src/app/api/admin/orders/[id]/returns/route.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/returns/route.ts>) y [ANEXO-superficie-api-seguridad.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-superficie-api-seguridad.md>).

## 4. Controles PostgreSQL y RPC

| Función sensible | ACL verificada en laboratorio | Control de aplicación relacionado |
|---|---|---|
| create_order, firma de siete argumentos | anon=false; authenticated=false; service_role=true. | API pública valida, limita intentos y llama desde el servidor; no acepta precios del cliente como autoridad. |
| track_order y track_order_details | Sólo service_role entre esos tres roles. | Se comprueban número/UUID de pedido y teléfono mediante la RPC antes de leer horario o fotografías. |
| report_payment_qr | Sólo service_role. | El aviso no confirma un pago; recibe pedido, teléfono y selección de QR. |
| get_public_order_receipt | Sólo service_role. | UUID opaco de recibo y comprobación de disponibilidad en SQL. |
| check_rate_limit | Sólo service_role. | Contador atómico invocado desde el servidor. |
| update_staff_profile | Sólo service_role. | API exige administrador y aporta actor del perfil autenticado. |
| confirm_payment, open_cash_session, close_cash_session, record_cash_movement | anon=false; authenticated=true; service_role=true. | La API exige equipo activo; las funciones SQL aplican controles internos y restricciones. |

Fuente de ACL: [ANEXO-catalogo-local-verificado.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-catalogo-local-verificado.json>). La semántica y últimas definiciones se describen en [04-base-de-datos.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/04-base-de-datos.md>). CREATE OR REPLACE no debe interpretarse como una sustitución automática de todas las ACL anteriores.

RLS habilitado no demuestra por sí solo aislamiento correcto. Las operaciones sensibles combinan guardas de aplicación, funciones SQL, claves foráneas, checks de importes finitos, estados y auditoría. El cliente administrativo omite RLS por diseño; por ello las consultas que lo usan deben quedar restringidas por actor u objeto previamente autenticado. La ampliación de fotos del seguimiento filtra exclusivamente order_id del pedido que devolvió la RPC validada; no resuelve acceso por nombre del producto: [src/app/api/orders/track/route.ts:28](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/track/route.ts:28>).

No se observó una vía directa anónima de ejecución de las RPC sensibles anteriores en el catálogo local. Tampoco se ejecutaron operaciones de pago, caja o concurrencia para convertir esa conclusión estructural en una garantía conductual completa.

## 5. Validación, solicitudes públicas y recibos

Zod se utiliza para UUID, enumeraciones, fechas reales, importes finitos, longitudes y cantidades. Hay esquemas compartidos y otros inline; el anexo enumera los archivos de src/validations y las llamadas localizadas. La validación del navegador mejora UX pero no sustituye a la del servidor.

La creación pública envía identificadores de producto/opciones, cantidades y mensajes. No toma subtotal o total del navegador como un precio definitivo. Usa idempotency_key; los precios, promociones y disponibilidad deben seguir comprobándose en las funciones SQL. Evidencias: [src/validations/orders.ts:6](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/orders.ts:6>) y [src/app/api/orders/route.ts:21](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts:21>).

El seguimiento es una consulta autenticada por conocimiento de número/UUID y teléfono, no una cuenta de cliente ni una verificación OTP. Esta decisión permite compra como invitado, pero deja un riesgo residual de privacidad si ambas piezas se conocen o comparten. Debe contrastarse con la política de privacidad del negocio.

El recibo público utiliza un UUID como capacidad de acceso; quien posee el enlace puede consultarlo si la función lo considera disponible. Se valida el formato, se limita la frecuencia y se devuelven Cache-Control=private,no-store, Referrer-Policy=no-referrer y nosniff. No es un enlace numérico abierto a todos los pedidos. No se encontró un mecanismo de caducidad temporal del token expuesto en esta ruta; la conveniencia de expiración/revocación queda como decisión pendiente, no como un bypass demostrado. Evidencia: [src/app/api/orders/receipt/[token]/route.tsx:8](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/receipt/[token]/route.tsx:8>).

Los recibos administrativos requieren equipo activo y pago confirmado antes de generar PDF. Los reportes JSON/PDF también verifican rol antes de consultar datos. No se demuestra una filtración por caché; sí conviene uniformar cabeceras privadas en todas las respuestas administrativas sensibles. Evidencias: [src/app/api/admin/orders/[id]/receipt/route.tsx:29](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/orders/[id]/receipt/route.tsx:29>) y [src/app/api/admin/reports/customers/route.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/reports/customers/route.tsx>).

## 6. Límites de frecuencia

| Ruta lógica | Intentos / ventana |
|---|---|
| Disponibilidad del carrito | 60 / 60 s |
| Seguimiento | 20 / 300 s |
| Recibo público | 10 / 300 s |
| Crear pedido | 10 / 300 s |
| Reportar pago | 5 / 300 s |
| QR, horario y WhatsApp públicos | 30 / 60 s cada uno |

La caída del contador falla cerrada para disponibilidad, creación, aviso de pago, recibos y seguimiento. Algunas lecturas informativas pueden continuar. Estos valores y el retorno se verifican en [src/lib/rate-limit.ts:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/rate-limit.ts:13>) y [src/lib/rate-limit.ts:69](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/rate-limit.ts:69>).

La IP se deriva del primer x-forwarded-for, luego x-real-ip, y finalmente unknown. Su efectividad depende de que la infraestructura de entrada sustituya cabeceras no confiables. No se probó el saneamiento del proxy de producción. El riesgo es eludir cuotas cambiando una cabecera si el despliegue acepta su valor directamente; no es una vulnerabilidad de SQL ni de autenticación de personal.

## 7. Almacenamiento y cargas de imágenes

Los productos aceptan JPG/PNG/WebP de hasta 5 MB, con máximo de diez imágenes verificado en aplicación. Se contrasta el formato binario, se decodifica con límite de 40 megapíxeles, se rechazan imágenes animadas y se reencoda a WebP de hasta 1600 px. La ruta de Storage se genera con UUID; no utiliza el nombre del archivo como ruta de escritura. Evidencias: [src/lib/product-image-file.ts:4](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/product-image-file.ts:4>) y [src/app/api/admin/products/[id]/images/route.ts:143](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/products/[id]/images/route.ts:143>).

El avatar establece medidas adicionales: cuerpo leído por streaming con límite de 2 MB, máximo de 16 megapíxeles, recorte a 256 px, reencodificación que elimina metadata y comprobación de Origin en PUT/DELETE. El propietario y el path se derivan del perfil autenticado, no de parámetros enviados por el cliente. La migración configura un bucket privado y la entrega se realiza por el endpoint con cabeceras privadas; no se verificó una configuración de producción. Evidencias: [src/lib/profile-avatar.ts:11](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/profile-avatar.ts:11>) y [src/app/api/admin/profile/avatar/route.ts:10](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts:10>).

Los QR y portadas requieren administrador y validación del archivo. Los activos de catálogo destinados a ser públicos no deben confundirse con el avatar privado. La existencia de un public_url de un producto no constituye por sí sola exposición de un documento privado.

## 8. Hallazgos confirmados y riesgos condicionados

### SEG-01 · Redirección externa en el proxy de login

- **Estado:** defecto de validación confirmado en código y expresión URL evaluada en memoria.
- **Severidad:** media; priorizar antes de publicar. Requiere que una persona con sesión acceda a /login con un redirect manipulado.
- **Ubicación:** [src/lib/supabase/proxy.ts:80](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/proxy.ts:80>).
- **Causa:** startsWith("/") también acepta rutas que empiezan por dos barras y ciertas combinaciones de barra invertida. new URL resuelve entonces otro origen.
- **Prueba segura:** [ANEXO-prueba-pura-redireccion.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-prueba-pura-redireccion.json>). Dos entradas cambiaron a un host reservado de prueba y /admin/pedidos permaneció interno; no se hizo ninguna solicitud de red.
- **Impacto:** enlace de phishing/redirección fuera del sitio. Esta prueba no demuestra robo de cookies, tokens ni autorización sobre datos.
- **Recomendación:** reutilizar la validación central loginDestination también en el proxy y añadir pruebas de esa rama autenticada. El helper del formulario ya rechaza doble barra y barras invertidas: [src/lib/auth/login-destination.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/auth/login-destination.ts:1>).
- **Cambios aplicados por esta auditoría:** ninguno.

### SEG-02 · Presupuesto de entrada pública no acotado de extremo a extremo

- **Estado:** limitación de disponibilidad verificada en fuentes; no se realizó prueba de saturación.
- **Ubicación:** createOrderSchema.items utiliza mínimo de un elemento, sin máximo; el último create_order SQL tampoco impone el límite de cincuenta líneas de la UI. La API ejecuta request.json antes de la validación. [src/validations/orders.ts:27](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/validations/orders.ts:27>); [src/app/api/orders/route.ts:21](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts:21>).
- **Impacto posible:** solicitudes excesivas consumen memoria, validación y procesamiento desproporcionados; la interfaz no es una frontera de seguridad. El rate limit previo a parseo mitiga frecuencia, no tamaño individual.
- **Recomendación:** acordar límites de líneas, opciones y tamaño total; aplicarlos antes o durante recepción y también en los contratos del servidor. Comprobar el límite real de la plataforma HTTP antes de asignar una severidad de explotación.

### SEG-03 · Protección de origen y cabeceras no uniforme

- **Estado:** brecha de endurecimiento y verificación de despliegue; no se demostró un ataque CSRF/XSS/clickjacking.
- El avatar comprueba Origin; no se encontró un control equivalente uniforme en las demás mutaciones. SameSite=lax y solicitudes JSON son mitigaciones relevantes. No corresponde afirmar que todas esas operaciones sean explotables.
- CSP se configura explícitamente para preview; no se encontró una política general de producción o frame-ancestors en las fuentes revisadas. El proveedor podría añadir cabeceras fuera del repositorio.
- **Recomendación:** verificar HTTPS, flags reales de cookies, cabeceras de producción y confianza del proxy; definir protección de origen/CSRF coherente con los clientes admitidos. Evidencias: [src/proxy.ts:18](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts:18>), [src/app/api/admin/profile/avatar/route.ts:13](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/admin/profile/avatar/route.ts:13>) y [next.config.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/next.config.ts>).

### SEG-04 · Límites de carga comprobados después de parsear multipart

- **Estado:** control existente pero tardío en productos/portadas/QR; riesgo de consumo de recursos por personal autorizado o cuenta comprometida.
- Se evalúa File.size después de request.formData; el avatar sí tiene lectura acotada por streaming.
- **Recomendación:** documentar y probar un presupuesto de recepción en el borde/servidor, además de MIME, firma y dimensiones que ya existen. No se enviaron archivos de gran tamaño.

Los hallazgos de cuota concurrente de imágenes, compensación de Storage y capacidad de reportes se recogen en [14-pendientes-y-recomendaciones.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/14-pendientes-y-recomendaciones.md>) como consistencia y mantenimiento, sin atribuirles una escalada de privilegios no demostrada.

## 9. Secretos, diagnósticos y verificaciones pendientes

NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY están destinadas al cliente; su seguridad depende de RLS y ACL. SUPABASE_SECRET_KEY se lee en el cliente administrativo del servidor y no lleva prefijo público. La búsqueda estática no encontró una importación del cliente administrativo en componentes cliente; no se inspeccionó un bundle desplegado. [src/lib/supabase/admin.ts:3](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/admin.ts:3>).

.gitignore excluye archivos de entorno, claves, dumps y archivos privados. Esto no demuestra que el historial nunca haya contenido un secreto; no se examinó un historial de credenciales ni se leyeron archivos privados. Puede reforzarse la frontera del módulo administrativo con server-only/reglas de imports, como defensa preventiva.

Las APIs suelen registrar diagnósticos en servidor y devolver mensajes controlados. Algunos catch devuelven error.message y agrupan fallos diversos como 403. La presentación amigable del frontend no sustituye a un contrato de error seguro para llamadas directas. No se encontró una prueba de exfiltración; se recomienda homogeneizar códigos, redacción y retención/redacción de logs.

La configuración de vista previa exige flags coherentes, rechaza credenciales Supabase y separa la vista sintética; las rutas de prueba se bloquean bajo NODE_ENV=production. Su CSP restringe conexiones y frames. Esto es una modalidad de prueba, no la certificación de la aplicación comercial: [src/lib/visual-preview/config.ts:1](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/visual-preview/config.ts:1>) y [src/proxy.ts:5](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts:5>).

Quedan sin verificar: configuración real de Supabase Auth en producción, MFA, límites de login del proveedor, cabeceras/edge, revisión de dependencias contra avisos externos, retención de datos/logs, protección de respaldos en operación y restauración real. No se declara ausencia de vulnerabilidades conocidas de dependencias: no se consultaron servicios externos ni se ejecutó un escáner.

## 10. Dictamen limitado

Hay controles efectivos y verificables de autenticación de personal, roles, validación de servidor, RLS local, ACL de RPC y protección de recibos. El defecto de redirección merece corrección; los controles de disponibilidad y despliegue requieren completar pruebas y acuerdos. El resultado es una revisión técnica con evidencia delimitada, no una garantía de seguridad total ni una aprobación de producción.

