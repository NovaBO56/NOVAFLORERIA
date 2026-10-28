# 09 · Pruebas, calidad y evidencia de validación

## 1. Qué se comprobó y de qué manera

La auditoría del 26/10/2026 revisó la estrategia de pruebas existente, los 77 archivos de prueba y sus resultados conservados. No modificó fuentes, fixtures ni configuración, no creó pedidos y no repitió operaciones de pago, caja, carga de archivos o restauración. Tampoco volvió a lanzar toda la suite: existía una ejecución final reciente y fue posible contrastar sus entradas con el árbol auditado.

Se separan cuatro clases de evidencia:

1. **Código inspeccionado:** muestra qué valida cada prueba y qué dependencias simula.
2. **Ejecución previa conservada:** resultados reales obtenidos antes de esta solicitud, con log o acta de ejecución. Se identifica como previa; no se presenta como una nueva ejecución de esta auditoría.
3. **Comprobación nueva de solo lectura:** comparación de hashes y catálogo estructural del laboratorio local, realizada durante la auditoría por el agente principal; no ejecutó transacciones comerciales.
4. **Prueba pura nueva:** evaluación de tres expresiones URL en memoria para verificar el hallazgo de redirección; no abrió conexiones ni utilizó sesiones.

El recuento de pruebas es el que informa Vitest al ejecutarlas, no el número de llamadas it/describe contado estáticamente. Un it.each puede generar varios casos. El [catálogo completo de pruebas](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-catalogo-pruebas.md>) relaciona cada uno de los 77 archivos con sus casos reportados en el log; la suma comprobada es 838.

## 2. Herramientas y configuración existentes

| Elemento | Evidencia real | Alcance |
|---|---|---|
| Vitest | npm test ejecuta vitest run; versión declarada ^2.1.9 | Ejecución de pruebas TypeScript, TSX y MJS |
| Entorno de pruebas | vitest.config.ts configura environment: node, globals y alias @ a src | No configura un navegador ni jsdom |
| ESLint | npm run lint ejecuta eslint | Reglas estáticas de código, incluidas las de Next |
| TypeScript | tsconfig.json; comprobación explícita sin emisión conservada | Tipos; no sustituye ejecución ni validación de entradas externas |
| Next build | npm run build | Compilación real, comprobación integrada de tipos y generación de rutas |
| Render de componentes | react-dom/server, renderToStaticMarkup en parte de las pruebas | HTML SSR; no interacción real del usuario |
| PostgreSQL/Supabase | Migraciones y pruebas de contrato; catálogo local consultado aparte en READ ONLY | El motor real no es ejecutado por los mocks Vitest |

Fuentes: [package.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/package.json>) y [vitest.config.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/vitest.config.ts>). No se encontró configuración Playwright/Cypress ni script E2E automatizado en el árbol revisado. Tampoco un proveedor de cobertura, umbrales de cobertura o informe formal de líneas y ramas. No se atribuye un porcentaje de cobertura al proyecto.

Hay 66 archivos .ts, 8 .tsx y 3 .mjs en la suite. Los tres .mjs también importan Vitest: su extensión no los convierte en una suite distinta del ejecutor Node.

## 3. Qué prueban realmente los casos

| Familia | Qué se ejecuta | Qué permite concluir | Límite |
|---|---|---|---|
| Validaciones | Esquemas Zod y casos válidos/inválidos de pedidos, pagos, caja, productos, promociones, horarios y otros formularios | Comportamiento de esos esquemas frente a las entradas incluidas | No prueba todos los tamaños posibles ni las restricciones del motor desplegado |
| Lógica de negocio pura | Carrito, selección de promociones, subtotales, complementos, formato y estados | Resultados de los algoritmos con fixtures concretos | No demuestra consistencia bajo concurrencia en PostgreSQL |
| Handlers API con mocks | Request/Response reales y módulos Supabase/roles/rate limit simulados | Validación, construcción de parámetros, códigos y manejo de resultados simulados | No realiza una petición HTTP a Next ni una llamada real PostgREST/RPC |
| Presentación SSR | renderToStaticMarkup y búsquedas/assertions sobre el HTML | Presencia de texto, etiquetas, elementos y estados de presentación | No prueba clics, foco, estilos calculados, imágenes remotas o teclado real |
| Contratos SQL/fuentes | Lectura de migraciones y comparación de texto/expresiones | Que el contrato esperado está escrito en el archivo inspeccionado | No ejecuta SQL, RLS, locks ni permisos del despliegue |
| Respaldo | Archivos temporales, cifrado, hashes, manifiestos y adaptadores sintéticos de pg_dump/pg_restore | Validación y manipulación de archivos/cifrado dentro de esa prueba | No acredita un dump ni una restauración real de PostgreSQL |
| Datos demo | Fixtures y reglas del conjunto de demostración | Coherencia del generador/fixtures en memoria | No acredita que esos datos se hayan importado en producción |

Ejemplos verificables:

- [checkout-api.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/checkout-api.test.ts>) importa handlers y sustituye clientes Supabase y rate limit con vi.mock. Comprueba, entre otras cosas, rechazo de pedido vacío, transporte de la clave de idempotencia, teléfono del seguimiento y distinción de pago reportado. El título «Integración HTTP» no implica una conexión real al servidor o a PostgreSQL.
- [catalog-design.test.tsx](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/catalog-design.test.tsx>) declara explícitamente contratos de presentación SSR y simula SafeImage. Acredita el HTML esperado, no una galería descargada en el navegador.
- [security-rpc-contract.test.ts](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/security-rpc-contract.test.ts>) indica que inspecciona el contrato y no ejecuta PostgreSQL. Además, una afirmación sobre una migración concreta debe contrastarse con redefiniciones posteriores y los ACL efectivos; la auditoría de base de datos realiza esa separación.
- [manual-backup.test.mjs](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/__tests__/manual-backup.test.mjs>) usa filesystem y criptografía reales, pero genera un dump sintético mediante un adaptador. Su manifiesto de prueba conserva restore_verified: false y storage_files: false. No es evidencia de recuperación integral de la tienda.

La clasificación estática detecta 31 archivos con vi.mock, 17 con renderToStaticMarkup y 4 con comprobaciones de archivos/contratos. Estas marcas se superponen y son orientativas; no dividen los 838 casos en categorías exclusivas ni miden cobertura. La palabra production o certification en un nombre de archivo tampoco demuestra que se haya probado producción.

## 4. Resultados conservados y verificaciones actuales

| Comprobación | Fecha/condición de la evidencia | Resultado | Archivo verificable |
|---|---|---|---|
| Suite completa Vitest | Ejecución previa final del 26/10/2026, inicio 20:57:21 hora local | 77 archivos y 838 casos aprobados; duración 33,73 s | [Log final](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/qa-tres-mejoras-vitest-final.log>) |
| ESLint | Ejecución previa final del 26/10/2026 | 0 errores, 2 advertencias de img en avatar | [Log final](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/qa-tres-mejoras-lint-final.log>) |
| TypeScript | Ejecución posterior al arreglo del fixture, sesión 50135, sin emisión ni caché incremental | Exit 0, sin salida | [Acta de resultado posterior](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/qa-tres-mejoras-typescript-final-confirmado.md>) |
| Build real aislado | 27/10/2026 01:03:07–01:04:34 UTC, equivalente a la noche del 26/10 en Bolivia | Passed, exit 0; entradas originales y next.config sin cambios | [Resultado](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/isolated-builds/anabelle-2026-10-27T01-03-05-812Z-bd2379/isolated-build-result.json>), [log](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/isolated-builds/anabelle-2026-10-27T01-03-05-812Z-bd2379/build.log>) |
| Equivalencia del árbol auditado con el build previo | Comparación nueva de solo lectura durante esta auditoría | 448 de 448 entradas idénticas; ninguna diferencia | [Comparación de hashes](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-equivalencia-build-previo.json>) |
| Metadatos PostgreSQL locales | Consulta nueva BEGIN READ ONLY, SELECT de catálogo y ROLLBACK; sin filas comerciales | 38 tablas públicas con RLS activado, 69 funciones y ACL/políticas inventariados | [Catálogo local](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-catalogo-local-verificado.json>) |
| Redirección del proxy | Tres evaluaciones URL nuevas en memoria; ningún HTTP | Dos entradas admitidas por startsWith resolvieron otro origen; ruta admin permaneció interna | [Prueba pura](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-prueba-pura-redireccion.json>) |

El archivo qa-tres-mejoras-typescript-final.log conserva un TS2345 **anterior al último arreglo del fixture Map**; no representa el estado final. Se preserva como histórico y el acta enlazada distingue la ejecución posterior exit 0. El build aislado corroboró después su fase integrada de tipos.

Las dos advertencias ESLint corresponden a [profile-avatar.tsx:70](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/profile-avatar.tsx:70>) y [profile-avatar.tsx:77](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/components/admin/layout/profile-avatar.tsx:77>). Son advertencias de optimización de imagen, no errores de compilación ni evidencia de imágenes rotas.

La equivalencia de hashes permite reutilizar con trazabilidad el build y la validación previa del mismo contenido fuente. No demuestra que producción tenga esos archivos, esos secretos o esa base de datos. Tampoco congela datos, red o proveedor externos. Las 76 unidades de generación mostradas por Next no deben presentarse como 76 pantallas de negocio; el inventario del código encuentra 20 archivos page.

## 5. Evidencia previa de interfaz y lecturas reales

Existe evidencia de navegación y consultas locales conservada antes de esta auditoría:

- [Galería de capturas inspeccionadas](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/GALERIA_TRES_MEJORAS_2026-10-26.md>): 21 capturas locales revisadas, con tienda, galería, carrito, promociones, checkout, seguimiento y administración. Los exports corresponden a la vista normal, no a cuatro dispositivos físicos.
- [Resumen responsive](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/qa-tres-mejoras-2026-10-26/responsive-resumen.json>): 48 observaciones geométricas, 12 vistas por 4 tamaños CSS; no se detectaron desbordes ni imágenes rotas en esa muestra.
- [Medición detallada de galería](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/qa-tres-mejoras-2026-10-26/galeria-responsive-detallado.json>): tres imágenes cargadas en los cuatro tamaños medidos, visor encontrado y sin desborde. No equivale a inspección visual completa en cuatro móviles.
- [Lecturas HTTP de imágenes administrativas](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/ADMIN_IMAGES_HTTP_READONLY_2026-10-26.json>) y [catálogo público](<C:/Users/carli/.codex/.chatgpt-projects/g-p-6ac5b22758108191847461f8c9e9fc63/PUBLIC_CATALOG_READONLY_2026-10-26.json>): resultados previos de consultas locales de lectura. La configuración y permisos de una instalación remota no se deducen de ellos.

La consola final de esa revisión visual no registró errores/advertencias en la muestra revisada. Ese resultado no garantiza que todas las ramas y estados posibles carezcan de errores. No se realizaron nuevas llamadas HTTP en esta auditoría de seguridad, evitando incluso los cambios de contadores que producen los limitadores de frecuencia.

## 6. Brechas de prueba y escenarios recomendados

Son propuestas para una fase posterior autorizada; no se implementaron ni ejecutaron ahora.

| Prioridad | Escenario | Criterio de aceptación propuesto |
|---|---|---|
| P1 | Proxy autenticado y destinos de login | Rutas internas permitidas; doble barra, barra invertida, controles y destinos externos rechazados en formulario y proxy |
| P1 | Roles y RPC efectivos | Anónimo, personal inactivo y empleado no acceden a operaciones exclusivas de administrador; los ACL reales coinciden con el contrato y no hay escrituras indirectas sin actor válido |
| P2 | Pedido y pago completos en laboratorio desechable | UI→HTTP→RPC→DB; clave de idempotencia sin duplicación; pago reportado sigue pendiente y solo personal autorizado confirma |
| P2 | Concurrencia y rollback | Stock/reservas, FIFO, caducidad, descuentos, pago, devolución, caja y último administrador conservan invariantes bajo dos solicitudes concurrentes y fallos inducidos |
| P2 | Seguimiento y recibos | Teléfono incorrecto y token inválido no revelan contenido; horario propuesto/confirmado coincide con DB; recibo conserva controles de pago y no-cache |
| P2 | Entrada y archivos | Límites antes/durante recepción, formato inválido, cuota concurrente de imágenes, rollback Storage/DB y conservación de imagen previa al fallar |
| P2 | Volumen superior al límite PostgREST | Directorio y reportes incluyen todas las filas autorizadas y sus totales; búsqueda acotada y caracteres especiales no alteran el filtro |
| P2 | Recuperación real | Dump real cifrado, integridad y restauración en instancia desechable; informe separado de objetos Storage y secretos necesarios, sin tocar producción |
| P3 | Interacción y accesibilidad | Recorridos con teclado, foco de diálogos, lector de pantalla, contraste y dispositivos reales; estados vacíos/errores con contenido real y largo |
| P3 | Cobertura y reproducibilidad | Reporte formal de líneas/ramas, umbrales acordados, CI con manifest de entradas y versión de esquema; sin atribuir cobertura a un recuento de casos |

Las pruebas con escritura deben usar datos sintéticos y una base explícitamente desechable; no se propone desactivar RLS ni utilizar cuentas reales para facilitar el recorrido. La base local cuya estructura se inspeccionó sigue siendo un laboratorio, no la base productiva certificada.

## 7. Conclusión de calidad delimitada

La validación previa aprobada ofrece evidencia útil de compilación, tipos, reglas estáticas y 838 casos automatizados. La auditoría añade trazabilidad y distingue sus límites. Aún se requiere evidencia automatizada de extremo a extremo contra un motor real, concurrencia, restauración y configuración productiva para afirmar fiabilidad operacional completa. El hallazgo de redirección confirma que una suite aprobada puede coexistir con una rama de seguridad no cubierta; se documenta sin modificarla.

