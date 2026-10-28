# 10. Gestión del proyecto y avance verificable

## Alcance de esta lectura

Este apartado sirve de base para la Actividad 12: Simulacro de Gestión de un Proyecto de Software. El proyecto se trabaja individualmente según la instrucción del propietario. No hay evidencia suficiente para afirmar reuniones, sprints con duración fija, un equipo con integrantes distintos, presupuesto, fecha formal de inicio/fin o un porcentaje global de avance.

La lectura de commits, documentos y código permite reconstruir **etapas observables**. No demuestra que se haya seguido una metodología formal completa. La forma iterativa de evolución es una interpretación sustentada por sucesivas correcciones/QA, no una declaración histórica de Scrum, XP o una certificación.

La rama de trabajo es desarrollo-auditoria. El HEAD observado es 7ec66ffc00b0270c878b139bb3bcbd0f91bd84fd, cuyo mensaje es “chore: snapshot avance actual proyecto Anabelle”. El árbol actual contiene cambios locales posteriores: **HEAD no representa todo el código auditado**. No se hicieron commits, push, merge, deploy ni descartes para esta auditoría. La publicación de un snapshot previo no acredita que el avance local posterior esté en GitHub.

## Etapas identificables y evidencias

| Etapa observable | Evidencia existente | Qué puede afirmarse | Límite |
|---|---|---|---|
| Construcción del sistema comercial y administrativo | Páginas/API, cadena SQL y README; inventarios 03 y 04 | Existe catálogo, carrito, pedidos, personal, inventario, caja y reportes conectados a Supabase. | No se infiere fecha de inicio, presupuesto ni cobertura integral por la mera presencia de archivos. |
| Ajustes de interfaces y controles | Historial b50cbf2, aff75f8 y README de revisión UI | Se trabajó en paginación, validación, tablas, métricas y navegación. | Sus cifras QA son antecedentes del estado de esas rondas. |
| Pagos manuales QR y recuperación | Historial eafc15a, 2bc6e8c, 05f5338; documentación backup | Se consolidaron QR y la política de backup manual de DB. | El ensayo antiguo DB+Storage dejó de ser la solución vigente. No prueba backup productivo actual. |
| Stock compartido, reservas, FIFO y disponibilidad | Historial 05cd24b, 2b6a622 y 13076c6; docs/SHARED_INVENTORY_AUDIT.md | El dominio se amplió alrededor de inventario y disponibilidad real. | Las pruebas antiguas locales no sustituyen revisar un inventario comercial actual. |
| Compra guiada, promociones y entrega | Historial bc9c770, cdae296, ba5654f; PROMOTION_SHOPPING_REVIEW y RELEASE_READINESS_REVIEW | Existen rondas de corrección y QA del flujo de promoción/checkout. | Los laboratorios generaban operaciones sintéticas; no son resultados de esta auditoría. |
| Dedicatorias, recomendaciones y experiencia pública | Historial 42b75b8 y 098619b/035eec3/699988b; informes de octubre | Existe refinamiento progresivo de tarjetas, complementos, marca y catálogo. | La disponibilidad de fotografías oficiales y casos especiales depende del contenido del entorno. |
| Rediseño administrativo SaaS y horario de recojo | Trabajo local preservado, componentes admin y seguimiento; inventarios actuales | El panel tiene shell común, navegación por rol y visuales modernizados. El seguimiento representa horario propuesto/confirmado. | La auditoría no cambia ni reprograma pedidos reales para volver a probar cada transición. |
| Promociones, notificaciones y tratamiento de imágenes | Código local y entrega previa TRES_MEJORAS/ENTREGA; 09-pruebas.md | Se mejoró selección de promociones, mensajes y miniaturas/preview con datos persistidos. | Las operaciones de guardar/subir y el negocio completo no fueron ejercitados mediante nuevas escrituras comerciales en esa revisión. |
| Auditoría integral actual | Esta carpeta, índice de 308 src/20 páginas/95 API/133 handlers y catálogo local | Se documenta el estado real y se separan fuentes, ejecución previa y pendientes. | La documentación no implementa mejoras ni autoriza producción. |

Los hashes cortos identifican commits realmente observados en el historial local. El contenido exacto de cada etapa se debe consultar junto con su documento y diff; un mensaje de commit no acredita todos los criterios de aceptación. No se asignaron fechas inventadas a las etapas.

## Actividades implementadas o verificadas

La “terminación” de una actividad siempre se refiere al alcance indicado:

| Actividad | Estado comprobado | Evidencia y alcance |
|---|---|---|
| Base de aplicación Next/React/Supabase | Implementada por código | Clientes SSR/navegador/privado, rutas y guards; 02 y 08. |
| Módulos administrativos y públicos | Implementados con variantes de permisos/cobertura | Matriz exhaustiva 03; no equivale a CRUD completo para todo rol. |
| Contratos de stock, pagos y promociones | Implementados en API/SQL | 04/05/06; la auditoría distingue función SQL de escenario probado. |
| Avisos compartidos y miniaturas consistentes | Implementados por código y recorridos locales previos | Componentes Notice/ProductThumbnail y evidencia UI previa. |
| Revisión visual local de las mejoras recientes | Ejecución previa documentada | 21 capturas válidas, 48 observaciones geométricas (12 vistas por 4 anchos), sin desbordes/imágenes visibles rotas/controles fuera en esas mediciones. No garantiza todo navegador o todo dato posible. |
| Tests, lint, tipos y compilación de la mejora reciente | Ejecución previa documentada | 838 tests en 77 archivos; lint sin errores con dos advertencias previas de avatar; TypeScript correcto; build aislado correcto en 87,50 s. Ver 09. |
| Equivalencia del build anterior con fuentes auditadas | Lectura actual | 448 entradas verificadas, 448 hashes idénticos, cero diferencias; ANEXO-equivalencia-build-previo.json. No se recompiló ahora. |
| Catálogo de la base del laboratorio | Lectura actual | PostgreSQL 17.11, 38 tablas con RLS, 334 columnas, 69 funciones, 90 políticas, 52 triggers, 2 vistas; ANEXO-catalogo-local-verificado.json. Sin filas comerciales ni cambio de datos. |
| Preservación del trabajo | Restricción cumplida durante la auditoría | Fuentes, entorno privado, base y Git sin cambios por esta tarea; archivos nuevos documentales separados. |

Los resultados de QA previos no son nuevos tests ejecutados durante esta auditoría. La comparación por hashes permite relacionar el build con sus entradas; no valida la infraestructura productiva ni los servicios externos actuales.

## Trabajo en proceso y asuntos pendientes

El avance general es **un sistema funcional en desarrollo con varias rondas de QA local**, trabajo posterior al snapshot de Git y documentación acumulada de distintas fechas. No se debe usar “terminado” como sinónimo de listo para producción, entrega académica final o cobertura absoluta.

Pendientes comprobados o decisiones aún necesarias:

- Integrar y revisar esta documentación contra los anexos técnicos, evitando contradicciones entre informes históricos y el estado actual.
- Revisar los cambios locales con el propietario y decidir cuándo guardar/publicar un nuevo snapshot; esta auditoría no lo autoriza.
- Confirmar por un procedimiento separado el historial SQL, despliegue, variables y servicios de producción; el catálogo local no los representa automáticamente.
- Resolver los pendientes técnicos específicos que se detallen en 08, 09 y 14 según su evidencia, antes de asumir un riesgo productivo.
- Completar la cobertura que exige escritura controlada: guardado de formularios/subida de archivos, transiciones de pedido, devoluciones y restauración recuperable en un laboratorio expresamente autorizado. No ejecutarlos sobre datos reales.
- Mantener originales de imágenes y acordar su recuperación: el backup vigente solo protege DB y metadata. Aportar portadas/fotos oficiales donde el entorno no las tenga; un placeholder correcto no equivale a disponer de fotografía.
- Fijar runtime/herramientas y documentar instalación nueva/primer administrador, matriz de navegadores, observabilidad y publicación con rollback.
- Completar datos académicos/empíricos: entrevistas o validación con usuario, problema medido, restricciones, recursos y criterios de aceptación formales. No se inventan por observar código.

El hecho de que una cuenta o tabla exista no confirma que su flujo completo esté aceptado por el negocio. “No probado” se mantiene distinto de “defectuoso”.

## Tablero Kanban propuesto para una sola persona

El tablero es una **propuesta de gestión para continuar desde el estado auditado**, no una captura de una herramienta de gestión existente. Las prioridades siguientes son propuestas analíticas; no sustituyen una clasificación de incidente validada ni una promesa de fechas.

| Columna | ID | Tarea | Prioridad propuesta | Dependencia / criterio de salida |
|---|---|---|---|---|
| Terminadas, alcance local | K-01 | Conservar rediseño/funciones actuales e inventariar páginas, APIs y SQL | Alta | Índices trazables, sin descartar cambios; verificar 03/04 y anexos. |
| Terminadas, alcance previo documentado | K-02 | QA de las tres mejoras recientes | Alta | Evidencia previa en 09; 838/77, compilación, recorridos y límites explícitos. |
| Terminadas, auditoría actual | K-03 | Verificar metadatos del laboratorio y equivalencia de build | Alta | Consultas solo catálogo y hashes 448/448; archivos anexos. |
| Terminadas, auditoría actual | K-04 | Integrar los 14 documentos y el informe maestro | Alta | Revisión cruzada terminada; enlaces y líneas válidos, anexos consistentes y fuentes anteriores preservadas. |
| Pendientes | K-05 | Priorizar hallazgos y obtener decisiones del propietario | Alta | Depende de K-04 y de 08/09/14; cada tarea debe tener evidencia, alcance y aceptación. |
| Pendientes | K-06 | Diseñar QA de escritura en laboratorio desechable | Alta | Requiere alcance autorizado y preservación de datos; verificar guardar/subir/transiciones sin operación comercial real. |
| Pendientes | K-07 | Comprobar entorno productivo y plan de migraciones | Alta antes de publicar | Requiere autorización de lectura y plan específico; inventario local/remoto comparado y reversión definida. |
| Pendientes | K-08 | Validar recuperación de DB y conservación de imágenes | Alta antes de publicar | Copia actual, prueba local vacía y política de originales; no activar la herramienta histórica de Storage. |
| Pendientes | K-09 | Fijar runtime y guía de instalación/primer administrador | Media | Basarse en 02/13; no publicar secretos ni modificar cuentas reales para documentar. |
| Pendientes | K-10 | Definir CI y protección de rama con flujo viable individual | Media | Solo propuesta; no hay checks CI activos que se puedan marcar hoy como obligatorios. |
| Pendientes | K-11 | Completar QA de navegadores/dispositivos/casos no cubiertos | Media | Matriz y datos sintéticos autorizados; no reutilizar una captura de escritorio como prueba móvil. |
| Pendientes | K-12 | Preparar documentos académicos y manuales finales | Media | Depende de inventario/aceptación y evidencia empírica; esta carpeta es su base, no los reemplaza íntegramente. |
| Pendientes | K-13 | Revisar/presentar cambios para snapshot o publicación futura | Según decisión del propietario | Revisión de diff y secretos, alcance autorizado; merge/deploy no forman parte de esta auditoría. |

Al cierre se completó K-04. No se observó otra tarea de implementación en ejecución durante esta auditoría; la columna En proceso queda disponible para el próximo trabajo que se autorice. Puede haber más tareas después de validar los hallazgos y prioridades; no se inventa un volumen fijo de backlog. Una tarea entra en Terminadas solo si cumple su criterio de salida, no por tener interfaz.

## Responsabilidades reales y simulación académica

Una sola persona puede desempeñar sucesivamente distintos roles. La auditoría no acredita que existan otros integrantes ni asigna identidades a autores a partir de commits.

| Responsabilidad | Trabajo que debe realizar la persona responsable | Rol académico que puede representarla |
|---|---|---|
| Decidir alcance y aceptar cambios | Acordar comportamiento, prioridades y autorización de pruebas/publicación | Propietario del producto / interesado |
| Analizar el negocio | Registrar requisitos, estados y criterios de aceptación trazables | Analista de sistemas |
| Diseñar UX y arquitectura | Mantener consistencia de interfaces y contratos cliente/servidor/SQL | Diseñador UX y arquitecto |
| Implementar y mantener | Realizar cambios separados, preservar datos, revisar dependencias | Desarrollador full stack |
| Verificar | Diseñar casos, ejecutar solo en destino autorizado y conservar fallos/límites | Responsable de QA |
| Operar y proteger | Gestionar configuración privada, backups, despliegue y respuesta a incidentes | Operaciones / seguridad |
| Coordinar el avance | Mantener Kanban, dependencias, riesgos, evidencia y aceptación | Gestor del proyecto |

En la simulación, esos son **sombreros de la misma persona**, no contrataciones ni miembros independientes. La aceptación independiente de una PR necesitaría una persona autorizada adicional o una política de revisión acordada; no se finge que el autor se convierte en un segundo revisor.

## Decisiones técnicas y consecuencias de gestión

| Decisión evidenciada | Motivo/efecto verificable | Consecuencia |
|---|---|---|
| Next con frontend y APIs en un proyecto | App Router + Route Handlers en src/app | Un cambio puede afectar UI, servidor y compilación; coordinar pruebas por contrato. |
| Supabase Auth/PostgreSQL/Storage | Tres clientes y SQL/RLS | Separar entorno, sesión, permisos y almacenamiento; no confiar en ocultar menús. |
| Operaciones sensibles mediante RPC privado | Creación/reportes de pago y limitador usan servidor privado | Conservar validación/autorización y paridad SQL antes de publicar. |
| Cliente compra como invitado | /login es personal; checkout toma datos del pedido | No documentar registro/OTP/historial de cuenta pública inexistente. |
| Confirmación manual de pagos | Reporte QR deja revisión de personal | QA no debe afirmar validación bancaria automática ni transferir dinero. |
| Fotos actuales en miniaturas | Lookup de media asociada al producto | Una foto futura puede cambiar la visualización de un pedido antiguo; no tratarla como snapshot contractual. |
| Backup semanal manual, solo DB | Decisión final documentada | No hay scheduler ni protección de bytes Storage; definir conservación de originales. |
| Laboratorios separados y guards locales | Launchers validan identidad/URL/rama | Un script QA puede mutar datos aunque sea “local”; revisar destino antes de ejecutarlo. |
| Desarrollo-auditoria sin auto deploy Git en config | vercel.json | La rama puede revisarse sin esa vía automática; no demuestra protección de rama ni ausencia de despliegue manual. |
| Trabajo incremental preservado | Cambios actuales posteriores a HEAD | Los resultados de worktree no deben atribuirse sin más al commit publicado. |

Evidencia principal: [decisión backup](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/supabase/backup/HISTORY.md:3>), [contrato servidor de pedidos](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/api/orders/route.ts:72>), [login](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/login/page.tsx:30>), [arrancador local](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/scripts/start-catalog-demo-local.ps1:3>), [Vercel](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/vercel.json:3>).

## Problemas conocidos, soluciones evidenciadas y riesgo pendiente

| Situación | Evidencia/solución existente | Riesgo o acción pendiente |
|---|---|---|
| Confundir reporte de pago con confirmación | Estados separados y confirmación manual, documentados en rondas QA | La capacitación y los manuales deben conservar esa distinción. |
| Tabla administrativa ancha ocultaba acciones | Informe de recomendaciones registra ancho medido y ajuste de scroll/columna acciones | No extender esa comprobación a todos los módulos/datos; seguir matriz responsive. |
| Herramienta de captura falló bajo emulación | Documentos históricos distinguen DOM medido de captura válida | Guardar solo capturas verificadas; no convertir el fallo del capturador en defecto de app ni en PASS visual. |
| 500 transitorio de manifiesto en Next dev | Evidencia reciente: lecturas correctas al reintentar y build aislado final correcto | Evitar build/dev concurrente en la misma salida; revisar logs si reaparece. No declarar inexistencia de todo error intermitente. |
| Documentación histórica divergente | README conserva 301 tests y cinco migraciones; nuevas evidencias tienen 838 tests y otra cadena | Actualización documental propuesta por tarea separada; no editar los archivos existentes durante esta auditoría. |
| Backup antiguo más amplio que el actual | HISTORY declara sustitución de S3/Storage por DB manual | No prometer recuperación de imágenes ni restauración productiva validada. |
| Versiones de runtime no fijadas | package.json sin engines/packageManager | Reproducibilidad dependiente del entorno; fijarla en trabajo futuro. |
| Alcance de producción desconocido ahora | Config e informes históricos no equivalen a lectura productiva actual | No publicar ni aplicar SQL sin revisar el entorno y el plan aprobado. |

El riesgo de fallo debe documentarse con probabilidad/impacto cualitativos y evidencia antes de decidir prioridad. Esta auditoría no asigna números arbitrarios ni convierte una incertidumbre en vulnerabilidad demostrada.

## Recomendación de continuidad

Primero revisar el informe maestro y resolver discrepancias documentales; después acordar el backlog priorizado y los criterios de aceptación. Las verificaciones que escriben datos deben tener destino sintético y autorización específicos. La revisión de infraestructura/recuperación precede a cualquier publicación. Los cambios de código, contenido visual, ramas y base de datos permanecen fuera del alcance de esta entrega.


