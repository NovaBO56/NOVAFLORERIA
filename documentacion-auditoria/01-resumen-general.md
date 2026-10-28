# 01 · Resumen general del proyecto

Fecha de corte: **26 de octubre de 2026**, zona America/La_Paz. Auditoría documental del árbol local de trabajo; no se implementaron correcciones ni nuevas funciones.

## Identificación y procedencia

| Concepto | Identificación y fuente |
| --- | --- |
| Marca visible | **Floristería Anabelle**, declarada en [metadata raíz](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/src/app/layout.tsx:17>) y presentación pública. |
| Nombre técnico del paquete | `proyecto-floreria`, versión de paquete `0.1.0`, private=true en [package.json](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/package.json:2>). Esa versión no es una medición del porcentaje de avance. |
| Nombre histórico | README identifica **NOVA Florería**; el repositorio indicado por el usuario es NovaBO56/NOVAFLORERIA. Estos nombres no se presentan como negocios distintos. |
| Copia auditada | `C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria`, rama `desarrollo-auditoria`, HEAD `7ec66ffc00b0270c878b139bb3bcbd0f91bd84fd`, con cambios locales previos conservados. |
| Proyecto académico | El usuario solicita utilizar el sistema como base de Ingeniería de Software I, Proyecto Formativo, Actividad 12 y manuales. No se encontró una aprobación institucional del título u objetivos. |

La unidad auditada es el **árbol actual local**, no únicamente el commit citado ni una copia remota de GitHub. Antes de empezar se registraron hashes de 560 archivos no privados; el estado final debe leerse junto con el anexo de integridad. No se incluyeron valores de entorno, credenciales, respaldos ni datos personales de clientes.

## Tipo de sistema y finalidad verificable

Es una aplicación web de catálogo, compra asistida y gestión operativa para una florería. Next.js reúne presentación React y endpoints del servidor; Supabase aporta PostgreSQL, autenticación y almacenamiento de archivos. El código contiene una tienda pública y un panel protegido para personal.

La **finalidad inferida a partir del código** es centralizar productos, composiciones, disponibilidad, compras, avisos de pago, preparación, inventario, caja y consultas del negocio. No se encontraron estudios que permitan afirmar cuánto reduce tiempos, cuántas ventas aumenta o qué grado de satisfacción produce. Esas mediciones requieren investigación con el negocio.

El problema empresarial preciso —procedimiento anterior, errores habituales, impacto y prioridades— no queda demostrado por encontrar un catálogo o un formulario. Puede plantearse como hipótesis académica la necesidad de mejorar la coordinación y trazabilidad de pedidos e inventario, pero se requiere validación mediante entrevista y observación. Véase [base del Proyecto Formativo](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/11-base-proyecto-formativo.md>).

## Usuarios y límites de cada actor

- **Visitante/comprador/cliente:** explora, filtra, personaliza, arma carrito y promociones, compra sin cuenta pública y consulta un pedido con su número y celular.
- **Empleado activo:** accede al panel operativo conforme al permiso de cada página, API y función SQL. No se deduce autorización sólo de la visibilidad del menú.
- **Administrador activo:** además gestiona usuarios, configuración y auditoría y las acciones restringidas que identifica la matriz de permisos.
- **Responsable técnico:** mantiene código, entorno, respaldos y procedimientos de laboratorio. No es un tercer rol de aplicación identificado en `UserRole`.
- **Banco y WhatsApp:** son servicios externos utilizados por personas; la web no realiza transferencias ni envía automáticamente un mensaje de WhatsApp.

El trabajo de desarrollo es individual según la solicitud del usuario. Los roles académicos de analista, diseñador, programador, probador y gestor representan responsabilidades desempeñadas por la misma persona; no se inventan integrantes del equipo.

## Alcance funcional actual

El [inventario funcional](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/03-inventario-funcionalidades.md>) registra **67 capacidades o ausencias verificadas**, con nueve campos de trazabilidad por entrada. El índice estático recorre **308 archivos fuente, 20 páginas y 95 rutas API con 133 métodos HTTP exportados**. Esos conteos describen estructura, no funciones aprobadas o porcentaje de avance.

Los módulos principales identificados son:

1. Tienda con presentación, horarios, ubicación, catálogo, búsqueda, filtros, favoritos locales y galería.
2. Productos con opciones, componentes, recetas, tarjetas y dedicatorias; disponibilidad basada en inventario.
3. Promociones y armado guiado de combos, con selección opcional y condiciones explícitas.
4. Carrito local y checkout por pasos con validación, idempotencia y recuperación de intento.
5. Pago mediante QR configurado, reporte del cliente y revisión humana del equipo.
6. Seguimiento individual, etapas, horario propuesto/confirmado y guía/recibo según condición.
7. Administración de productos, categorías, temporadas, complementos, clientes y pedidos.
8. Venta presencial, sesiones de caja, inventario, lotes FIFO, entradas, ajustes, mermas y devoluciones/reintegros.
9. Siete reportes con datos y PDF, notificaciones internas y auditoría.
10. Configuración de atención, recepción, entrega, QR, WhatsApp, ubicación y fotografías; personal con roles y avatar propio.

## Capacidades parciales, no encontradas y demostraciones

| Tema | Estado real observado |
| --- | --- |
| Registro, OTP y cuenta pública de cliente | No encontrados. El CRM administrativo no es una cuenta de cliente. |
| Recuperación de contraseña en la web | No se encontró un recorrido implementado. La capacidad del proveedor no basta para afirmarlo. |
| Historial público completo de compras | No encontrado. Se conserva referencia de sesión/compra anterior y se consulta un pedido individual. |
| Destinatario distinto del comprador | No hay campos estructurados independientes en el checkout revisado. |
| Entrega a domicilio | Parcial: dirección/referencia para coordinación, sin cálculo automático de envío, ruteo ni repartidor en tiempo real. |
| Pago bancario | QR y reporte/verificación humana implementados; no se encontró cobro automático ni webhook bancario. |
| Facturación fiscal | No encontrada. Guía TXT y recibo PDF no acreditan facturación tributaria. |
| Destacados de portada | Hay filtro API y consulta `heroProduct`, pero no se identificó su uso para renderizar una sección dinámica de destacados. |
| 3D o realidad aumentada | No encontrados; las animaciones CSS y la galería no se clasifican como 3D. |
| Backup | Procedimiento/script manual cifrado; no se acredita automatización ni inclusión de los archivos físicos de Storage. |
| `/prueba-cliente`, `/admin/prueba-ui` y modo visual | Son demostraciones/superficies sintéticas; no representan todas las operaciones comerciales ni métricas reales. |

## Estado técnico y grado de verificación

El proyecto tiene implementación extensa y conectada de sus flujos centrales. **No se declara terminado, libre de vulnerabilidades o certificado para producción.** Se separan tres niveles:

- **Revisión de código:** rutas, componentes, validaciones, SQL y configuraciones; artefactos indexados con archivo y línea.
- **Ejecución previa corroborada:** 838 pruebas en 77 archivos, lint sin errores y dos advertencias previas, TypeScript y build aislado correctos. Se compararon 448 entradas del build anterior y ninguna cambió. No se presenta como una nueva ejecución de todo el sistema durante esta auditoría.
- **Ejecución actual segura:** consulta de metadatos en una transacción PostgreSQL READ ONLY del laboratorio identificado. Confirmó PostgreSQL 17.11, 38 tablas públicas, 334 columnas, 69 funciones públicas, dos vistas, 52 triggers de usuario y 90 políticas entre public y storage. Las 38 tablas públicas tienen RLS habilitado. No se leyeron filas comerciales ni se ejecutaron migraciones.

La evidencia de navegador anterior tiene 21 capturas aceptadas y 48 observaciones geométricas en 12 vistas por cuatro tamaños; no certifica visualmente cada estado ni cada dispositivo físico. Durante ese recorrido no se crearon pedidos ni se registraron pagos. Hubo un HTTP 500 transitorio del servidor de desarrollo durante recompilación y el flujo pudo completarse al reintentar; no se oculta esa incidencia.

Los hallazgos de seguridad, sus condiciones y recomendaciones se presentan en [08-seguridad.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/08-seguridad.md>). El catálogo del laboratorio no acredita el esquema, historial de migraciones, configuración ni datos de producción.

## Lectura recomendada

Comenzar por el informe maestro; después arquitectura, inventario funcional, base de datos, requisitos y modelos. Para evaluar calidad/limitaciones, consultar interfaces, seguridad y pruebas. Para continuidad académica, consultar gestión, bases de proyecto/manuales y pendientes. Los anexos son trazabilidad estructural, no sustituyen el análisis de los apartados.

