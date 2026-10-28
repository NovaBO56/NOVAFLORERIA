# 13. Base para el manual técnico

## Propósito y límites

Este documento permite preparar un manual técnico a partir del código real, sin modificar la aplicación auditada. Los comandos que aparecen son **procedimientos documentados, no operaciones ejecutadas en esta auditoría**. La preparación de bases vacías, los cambios de infraestructura y la publicación requieren un alcance operativo separado.

Se distingue el repositorio de desarrollo, el laboratorio local con datos sintéticos y un eventual entorno productivo. Una dirección localhost, una configuración Vercel o un informe antiguo no demuestra que todos los servicios externos estén activos. Para estructura y conexiones ver 02-tecnologias-arquitectura.md; para objetos SQL e historial, 04-base-de-datos.md; para evidencia de ejecución y cobertura, 09-pruebas.md.

## Requisitos y versiones

| Elemento | Evidencia actual | Requisito/precaución |
|---|---|---|
| Node.js | Observado v24.20.0; Next instalado exige >=20.9.0 | El proyecto no fija engines/packageManager. Acordar y fijar una versión compatible antes de convertir esto en una guía de instalación reproducible. |
| npm | Observado 11.19.0; package-lock lockfileVersion 3 | Instalar respetando el lock existente; no actualizar dependencias durante instalación de auditoría. |
| Git | Observado 2.55.0.windows.5 | Control de versiones; la rama auditada es desarrollo-auditoria. |
| Next / React | 16.3.8 / 19.2.8 resueltos | Aplicación App Router; no se requiere un servidor Express adicional. |
| TypeScript / Tailwind | 5.9.3 / 4.3.3 resueltos | Desarrollo y compilación; strict y noEmit activos. |
| Supabase | Auth, PostgreSQL y Storage | La URL, clave pública y clave privada deben pertenecer al mismo entorno. |
| PostgreSQL | Major 17 declarado; 17.11 verificado en laboratorio local | No se verificó ahora la versión de producción. Los clientes pg deben ser compatibles con la base que se respalda/restaura. |
| Docker Desktop + herramientas Supabase | Utilizados por laboratorios y herramientas locales | Necesarios para esos laboratorios, no una dependencia del navegador de un cliente. No iniciar ni resetear automáticamente para auditar. |
| Navegador moderno | Interfaces web con JavaScript y CSS responsive | No existe una matriz formal completa de navegadores/SO/dispositivos soportados. |
| Red y espacio | Necesarios para paquetes, Auth/Storage y compilación | No hay mínimos documentados de RAM/CPU/disco ni benchmark; no inventarlos. |

Fuentes: [paquete](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/package.json:5>), [lock](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/package-lock.json:1>), [TypeScript](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/tsconfig.json:3>), [config DB](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/config.toml:41>), ANEXO-tecnologias-operacion.json y ANEXO-catalogo-local-verificado.json. Se necesita acceso al repositorio y a la configuración privada del entorno autorizado; este manual no contiene ni solicita copiar sus valores.

## Identificación del entorno antes de instalar

1. Ubicar el checkout correcto y leer sus instrucciones AGENTS.md y documentación Supabase. Las instrucciones para modificar código exigen consultar la documentación Next instalada; aquí no se realizaron cambios de código.
2. Revisar la rama y el estado sin descartar trabajo. El árbol auditado contiene trabajo local pendiente de publicación; no usar git reset, checkout forzado, clean ni sobrescrituras.
3. Elegir explícitamente qué entorno se desea usar: catálogo demo, laboratorio de integridad o una futura instalación nueva. No asumir que el archivo de entorno por defecto apunta a localhost.
4. Obtener la configuración privada por el mecanismo autorizado del propietario. No imprimirla en terminal, capturas, tickets ni documentación. Los archivos sincronizados de referencia de ChatGPT y los privados del laboratorio no son archivos de configuración para publicar.
5. Comprobar puertos y servicios existentes antes de arrancar. Si un puerto está ocupado, identificar el proceso responsable; no detener procesos de otras tareas de forma indiscriminada.

La existencia del repositorio no garantiza una base preparada ni cuentas válidas. El login puede ser correcto para un Supabase y fallar contra otro sin que la contraseña haya cambiado.

## Instalación de dependencias: procedimiento futuro

Una vez elegida una copia de trabajo y autorizado instalar dependencias, el comando reproducible declarado por npm es:

```powershell
npm ci
```

Instala a partir de package-lock.json y modifica node_modules; no es una comprobación de solo lectura. No se ejecutó durante esta auditoría. No sustituirlo por una actualización de paquetes ni borrar el lock para resolver un error sin investigar. Revisar acceso a red, versión Node y compatibilidad del binario nativo de Sharp si falla.

No hay una instrucción de aplicación que cree automáticamente un administrador inicial para cualquier instalación nueva. Las cuentas existentes del laboratorio no son credenciales universales. La provisión de personal, su perfil y el primer administrador deben seguir un procedimiento separado y autorizado, coherente con Auth y profiles. Ver las restricciones en 08-seguridad.md.

## Variables de entorno: nombres sin valores

### Aplicación normal

| Nombre | Ámbito comprobado | Para qué se usa |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Navegador, SSR, proxy y cliente privado | Selecciona el proyecto API/Storage. El prefijo público significa que llega al cliente; no debe contener credenciales. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Navegador, SSR y proxy | Clave pública del mismo Supabase, protegida por RLS/permisos del backend. |
| SUPABASE_SECRET_KEY | Servidor | Cliente privado para RPC/operaciones administrativas. Debe mantenerse fuera del bundle y de variables públicas. |
| NOVA_LOCAL_LAB | Configuración Next y arrancadores | Habilita validación estricta de destino local y desactiva optimización remota de imágenes para ese modo. No crea un laboratorio. |
| NODE_ENV | Gestionado por Next/Node | Bloquea demostraciones de desarrollo al ejecutar producción. No es una credencial. |

Fuentes: [clientes](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/supabase/admin.ts:3>), [configuración de imágenes/laboratorio](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/next.config.ts:7>), [proxy](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts:22>). El esquema src/config/env.ts valida opcionalmente las variables públicas, pero esa opcionalidad no hace funcional una aplicación normal sin Supabase: varias fábricas requieren sus valores y el cliente privado falla explícitamente si faltan.

Los arrancadores locales también asignan SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL y NEXT_PUBLIC_APP_URL. La búsqueda actual no encontró una lectura directa de esos tres nombres en src; se documentan como asignaciones de compatibilidad/contexto del launcher, no como nuevos requisitos funcionales de todos los módulos. La aplicación privada sí consume SUPABASE_SECRET_KEY.

### Preview visual aislado, opcional

| Nombre | Uso |
|---|---|
| NOVA_VISUAL_PREVIEW | Flag servidor del modo visual aislado. |
| NEXT_PUBLIC_NOVA_VISUAL_PREVIEW | Flag cliente; debe concordar con el anterior. |
| VERCEL_ENV | Detectado por el guard para impedir preview en producción. |
| VERCEL_GIT_COMMIT_REF | Detectado por el guard para impedir preview en master. |

No activar preview junto a NOVA_LOCAL_LAB ni junto a variables Supabase con valores. El guard rechaza esa combinación. Usa un snapshot visual propio y no permite pedidos/pagos; no sirve para validar negocio. [restricciones preview](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/lib/visual-preview/config.ts:1>) y [proxy preview](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/proxy.ts:6>).

### Herramientas de backup/restauración y laboratorio

| Grupo | Nombres identificados | Observación |
|---|---|---|
| Conexión PostgreSQL de backup | BACKUP_MODE, BACKUP_PROJECT_REF, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGSSLMODE, PGSSLROOTCERT | Solo en la sesión privada de herramientas; la aplicación web no requiere estos datos. El modo productivo valida host autorizado y TLS. |
| Cifrado/destino | BACKUP_ENCRYPTION_KEY, BACKUP_OUTPUT_DIR | Clave base64 de 32 bytes y directorio absoluto fuera de cualquier Git; conservar la clave por separado. |
| PostgreSQL dentro de Docker local | BACKUP_LOCAL_CONTAINER, BACKUP_LOCAL_PGUSER, DOCKER_HOST, DOCKER_CONTEXT | El wrapper comprueba modo/host/contexto local; no se usa para backup productivo. |
| Diagnóstico/restauración | BACKUP_DIAGNOSTIC_FILE, RESTORE_DISPOSABLE_LOCAL, BACKUP_RESTORE_ADMIN_PASSWORD | Diagnóstico local privado y consentimiento explícito para restaurar exclusivamente un destino vacío desechable. |
| Variables PostgreSQL controladas | PGOPTIONS, PGCONNECT_TIMEOUT | Establecidas internamente para captura; no son funciones comerciales. |
| Overrides rechazados | PGHOSTADDR, PGSERVICE, PGSERVICEFILE | La validación los rechaza para evitar que cambien el destino por detrás de la configuración revisada. |
| Contexto de scripts | LOCALAPPDATA, NOVA_QA_ROUND | Directorio privado de laboratorios y etiqueta de una ronda QA. No exponer sus archivos privados. |

Evidencia: [backup manual](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/manual-backup.mjs:35>), [validación de origen](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/backup-core.mjs:14>), [herramientas PostgreSQL](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/pg-tools.mjs:16>), [restore local](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/restore-local.mjs:8>). El anexo de operación guarda únicamente nombres y referencias; no se leyeron valores de .env ni se copiaron archivos de credenciales.

## Base de datos y migraciones

La base se comunica con Next por Supabase; no hay ORM que genere el esquema al arrancar la web. El diseño incluye tablas, restricciones, RLS, triggers y funciones SQL. Una pantalla visible puede fallar si su backend usa columnas/RPC no presentes en el destino.

La cadena activa está en supabase/migrations/. El historial en migrations-legacy/ se conserva como evidencia y no debe ejecutarse como una segunda cadena. La baseline limpia solo corresponde a un Supabase nuevo vacío; no se aplica sobre una base productiva existente para “igualarla”. Los seeds y scripts demo generan datos, y db reset es destructivo para su destino. Ver [advertencia del repositorio](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/README.md:7>) y el análisis actual 04-base-de-datos.md.

El archivo supabase/config.toml del repositorio declara API 54321, DB 54322 y PostgreSQL 17. Es una configuración genérica, **distinta** de los laboratorios ya preparados:

| Entorno documentado | Web | API Supabase | Condición |
|---|---|---|---|
| Catálogo demo local | 127.0.0.1:3117 | 127.0.0.1:50621 | Es el launcher usado en las verificaciones recientes; requiere preparación privada existente e identidad específica. |
| Integridad/LAB50 | Puerto 3116 | Puerto 62621 | Launcher separado; puede usar dirección privada LAN de esta computadora validada. |
| Configuración genérica del repo | Puerto elegido para Next | 54321 | No se supone iniciada ni equivalente al catálogo demo. |

No iniciar supabase start, db push, migration up, db reset, seed ni scripts prepare-* como parte de una revisión documental. En una instalación nueva futura habrá que definir el entorno vacío, revisar la cadena con 04, preparar secretos, aplicar un plan autorizado y verificar resultados. Esta auditoría no emite una secuencia de SQL para producción ni confirma su historial actual.

## Ejecución local

El comando de desarrollo del paquete es npm run dev; sin flags adicionales usa el entorno que Next cargue. **Antes** de usarlo se debe comprobar que todas las variables apuntan al laboratorio autorizado y que el puerto está libre. No se debe inferir seguridad solo por abrir una URL 127.0.0.1 de la web: esa web podría usar una base remota.

Para el catálogo demo existente, el arrancador documentado es:

```powershell
powershell -NoProfile -File .\scripts\start-catalog-demo-local.ps1
```

La orden es una guía futura: no se ejecutó en esta auditoría. El script comprueba rama desarrollo-auditoria, identidad de laboratorio, ausencia de enlace remoto, API local exacta y puerto 3117 libre, configura variables en el proceso y ejecuta next dev con webpack y hostname loopback. Requiere que el laboratorio/archivo privado ya existan; no los crea. Evidencia: [launcher catálogo](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/scripts/start-catalog-demo-local.ps1:1>).

El launcher LAB50 usa otra identidad y otro destino. Su opción Build compila y su ejecución normal usa next start, por lo que necesita un build válido previo. Valida direcciones pertenecientes a esta computadora; no basta reutilizar una IP escrita en un informe antiguo. [launcher LAB50](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/scripts/start-lab50-local.ps1:5>).

Para otros dispositivos, localhost significa el propio dispositivo. Cualquier acceso LAN debe usar dirección actual y configuración privada revisada; no abrir puertos públicos ni desactivar controles para completar la guía.

## Compilación y ejecución de producción local

Los comandos definidos son:

```powershell
npm run build
npm run start
```

build genera artefactos y puede prerenderizar páginas; start sirve un build existente. No ejecutar simultáneamente build y dev en la misma carpeta .next sin plan: puede producir manifiestos inconsistentes. El modo visual utiliza .next-visual-preview; el modo normal no define una carpeta de aislamiento por un flag genérico.

La compilación previa se realizó en una copia aislada real con webpack y finalizó correctamente en 87,50 segundos. En esta auditoría se compararon 448 entradas de ese build con las fuentes/configuración auditadas: 448 idénticas, sin diferencias. Se conserva como evidencia previa aplicable por equivalencia de entradas, no como una compilación repetida ahora. Ver ANEXO-equivalencia-build-previo.json y 09-pruebas.md. No copiar directorios .next antiguos entre entornos suponiendo que sus variables públicas se recalcularán al arrancar.

## Despliegue

Existe configuración Vercel que deshabilita despliegue Git para desarrollo-auditoria y tres ramas históricas específicas. No constituye prueba de que producción esté actualizado ni un bloqueo absoluto a cualquier mecanismo manual de publicación. Evidencia: [vercel.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/vercel.json:3>).

Antes de una publicación futura se deberán revisar destino/variables, versión Node, historial remoto SQL, Storage, copia recuperable, límites/Auth, proxy de IP y los cambios del worktree; después habrá que autorizar y verificar la publicación. Esa secuencia es una recomendación operativa, no un despliegue ejecutado. No se encontró workflow CI activo; por tanto no hay checks automáticos de GitHub que este manual pueda dar por garantizados.

No hacer merge, force push, deploy ni reconciliación de migraciones para completar la presente auditoría.

## Rutas, APIs y permisos

La aplicación pública tiene /, /checkout y /seguimiento. /login autentica al personal. El panel se organiza en /admin y módulos pedidos, ventas, inventario, caja, productos, categorías, temporadas, promociones, clientes, reportes, usuarios, configuración y auditoría. /prueba-cliente y /admin/prueba-ui son demostraciones que el proxy bloquea en producción.

El índice exhaustivo de 95 rutas API y 133 handlers está en ANEXO-indice-codigo.md/.json y 03-inventario-funcionalidades.md. No es correcto deducir que todos los métodos de una carpeta /api/admin/ tienen idénticos permisos: cada handler tiene validación/guard propios. Para añadir mantenimiento futuro, seguir sus contratos y la matriz 08-seguridad.md.

Familias relevantes:

- /api/products, categories, seasons y promotions: catálogo público y elegibilidad.
- /api/orders y subrutas: creación, disponibilidad, pago reportado, consulta y comprobante; no son pruebas inocuas para ejecutar en producción.
- /api/admin/: gestión del personal autenticado y operaciones de negocio.
- /api/payment-qr, business-hours, store-location, storefront-media y whatsapp-config: configuración pública permitida.
- /api/visual-preview: snapshot del modo visual aislado.

El seguimiento usa POST con número/teléfono para consultar; el limitador puede escribir contadores aunque no cambie el pedido. Pedir un PDF puede consultar datos protegidos y consumir límites. Usar solo endpoints públicos inocuos no asegura ausencia de efectos auxiliares: revisar handler y rate-limit antes de automatizar una auditoría.

## Pruebas y clasificación de herramientas

| Herramienta | Qué comprueba / hace | Riesgo operativo |
|---|---|---|
| npm test | vitest run con entorno node, helpers/mocks/contratos/markup | No sustituye un E2E de navegador ni una prueba bancaria; revisar cada suite antes de ejecutar contra servicios. |
| npm run lint | ESLint con Next/TypeScript | No usar --fix en una auditoría sin cambios autorizados. |
| npx tsc --noEmit --incremental false | Tipos sin emitir programa ni archivo incremental | Requiere dependencias existentes; no demuestra lógica comercial. |
| npm run build | Compilación/prerender y artefactos | Escribe salida y puede usar entorno/red; aislar de servidor activo. |
| scripts/qa-*.mjs | Integración HTTP/SQL y fixtures de rondas locales | Varios crean usuarios/pedidos, confirman pagos, cambian configuración o restauran datos. No ejecutar por su nombre “QA” sin leerlos. |
| scripts/prepare-*.mjs | Preparación de catálogo, medios y laboratorios | Pueden crear tablas/datos, usuarios, buckets o archivos. No son comprobaciones de solo lectura. |
| scripts/start-*.ps1 | Arrancadores de laboratorio | Requieren configuración privada ya preparada; revisar destinos y modo de ejecución. |
| backup:manual / restore-local | Copia sensible y restauración | Backup crea archivos sensibles; restore modifica la base. Requieren procedimiento separado. |

El anexo de operación indexa 31 scripts y patrones de posibles escrituras; los patrones son un triage estático, no una garantía de seguridad. 09-pruebas.md y su anexo detallan la cobertura. En esta auditoría no se ejecutaron estas suites/preparadores ni operaciones comerciales.

## Mantenimiento y recuperación

La política vigente es **backup manual semanal de DB**, cifrado AES-256-GCM, fuera de Git, sin scheduler ni proveedor externo. El comando backup:manual ejecuta manual-backup.mjs; valida origen y destino, hace pg_dump de public/auth/storage/supabase_migrations, comprueba TOC, cifra, verifica hashes y descifra temporalmente para comprobar integridad. El manifest declara storage_files=false y restore_verified=false. Hash/TOC/cifrado válidos no demuestran que una restauración funcional ya haya sido probada. Evidencia: [política actual](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/README.md:1>), [implementación](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/manual-backup.mjs:47>).

No se incluyen los bytes de fotos de producto, QR ni otros objetos de Storage. El propietario debe definir cómo conservar sus originales; no se presenta como implementado un backup de imágenes. Los ensayos antiguos de copia a S3 o DB+Storage están sustituidos por la decisión manual actual y no deben reactivarse por leer el historial. [historial de decisión](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/HISTORY.md:3>).

restore-local.mjs exige modo local, localhost, confirmación explícita y un Supabase vacío desechable; rechaza datos/historial preexistentes. Restaura objetos y datos con tratamiento específico de ACL/roles/plataforma. No se debe ejecutar en la base productiva ni en el laboratorio poblado de trabajo. Un fallo parcial requiere conservar evidencia y preparar otro destino vacío; no insistir sobre uno parcialmente restaurado. [validación de restore](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/restore-local.mjs:8>).

Mantenimiento propuesto, sin ejecutar: revisar dependencias por un cambio separado, mantener contratos SQL/API, registrar migraciones realmente aplicadas, verificar restauraciones locales y disponibilidad de fotos, revisar estado de cuentas/roles y tener una guía de respuesta a incidentes. No hay evidencia de monitoreo externo, retención automática ni pruebas periódicas programadas actualmente.

## Resolución de incidencias frecuentes

| Síntoma | Verificación técnica segura | Evitar |
|---|---|---|
| Login falla con credenciales conocidas | Verificar que web, claves públicas/privada y cuenta pertenecen al mismo Supabase; leer estado del perfil activo y error sin exponer credenciales. | Resetear contraseñas o crear otra cuenta antes de comprobar el destino. |
| Se redirige de admin a login | Comprobar cookies/sesión, expiración y respuesta del proxy; el layout vuelve a verificar perfil. | Bypassear guards o dar por autorizado al usuario por ver un enlace. |
| Conexión rechazada | Confirmar proceso y puerto de la web, y después el servicio Supabase. Revisar salida del proceso de arranque. | Reiniciar Docker/servidores ajenos o lanzar duplicados sin identificar puertos. |
| Guard NOVA_LOCAL_LAB rechaza inicio | Comprobar URL local, puerto permitido y direcciones de esta computadora. | Desactivar el guard para apuntar a una base remota con datos de prueba. |
| “No encontramos un pedido” | Revisar número/celular exactos y que se consulta el entorno donde se creó; comprobar contrato de tracking y permisos con acceso autorizado. | Crear pedidos o alterar datos solo para ocultar el error. |
| Horario no disponible / consulta 503 | Revisar columnas scheduled_for/schedule_status y estado del endpoint en la base seleccionada; separar error de horario del de identificación. | Aplicar migraciones automáticamente sin comprobar historial. |
| Imágenes faltantes | Revisar URL actual, origen permitido, metadata y existencia de bytes en Storage; usar fallback discreto del UI. | Dar por recuperada la foto porque su URL exista en un backup. |
| RPC/columna no existe | Comparar código con catálogo e historial de migraciones del entorno específico. | Ejecutar baseline sobre una base existente. |
| Error 429 o indisponibilidad del limitador | Respetar la ventana; revisar configuración proxy/IP y función check_rate_limit. | Saltarse límites o atribuirlo a un pago confirmado. |
| 500 temporal de manifiesto Next en desarrollo | Revisar logs, compilación en curso y concurrencia; esperar/reintentar lectura. Hubo una incidencia previa que cesó y un build aislado posterior correcto. | Declarar toda la app rota o ejecutar limpieza destructiva global sin evidencia. |
| Falla Sharp/instalación nativa | Revisar Node, plataforma, lock y error de instalación. | Sustituir imágenes originales o actualizar todo el stack para probar. |
| Warning de imagen del avatar | Dos next/no-img-element existentes se registraron en lint previo; valorar después el requisito de imagen privada. | Confundirlos con errores de TypeScript o afirmar lint sin advertencias. |
| Enlace de WhatsApp/mapa no abre | Revisar configuración pública permitida y navegador/red; son servicios externos. | Enviar mensajes reales de prueba sin autorización. |

La lista es una guía de diagnóstico, no una certificación de que esas causas expliquen todos los errores posibles. Toda bitácora debe omitir claves, tokens, teléfonos, correos reales y respuestas con datos privados.

## Información que falta para cerrar un manual operativo

Fijar versiones de herramientas/runtime y matriz de navegadores; documentar la creación inicial segura del primer administrador y un entorno nuevo; confirmar infraestructura/SQL productivos con autorización de lectura; validar backup recuperable y tratamiento de imágenes; definir observabilidad, disponibilidad y recuperación; registrar una publicación real aprobada y su rollback. Ninguno se presenta como completado por esta documentación.

