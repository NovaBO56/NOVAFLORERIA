# 11 · Información para el Proyecto Formativo

Esta es una base de investigación, no el Proyecto Formativo completo. Diferencia evidencia del software, interpretación académica y datos que requieren trabajo de campo. El proyecto se desarrolla individualmente; análisis, diseño, programación, pruebas y documentación son responsabilidades de una persona. Los roles simulados de gestión no acreditan integrantes adicionales.

## Propuesta de título y objetivos para validar

**Título propuesto:** Sistema web para la gestión de catálogo, pedidos e inventario de Floristería Anabelle.

**Objetivo general propuesto (qué + cómo + para qué):** Desarrollar y evaluar un sistema web de catálogo, pedidos y gestión operativa para Floristería Anabelle, mediante una arquitectura cliente-servidor con Next.js y Supabase y procesos verificables de análisis, diseño y pruebas, para centralizar la información de productos, compras, pagos reportados e inventario y facilitar su seguimiento por clientes y personal.

Es una formulación académica derivada del alcance del código; no se encontró un acta de aprobación de ese objetivo ni mediciones del beneficio empresarial. «Facilitar» expresa propósito, no un resultado estadístico demostrado.

Objetivos específicos propuestos, coherentes con etapas ya identificables:

1. Identificar actores, procesos, restricciones y necesidades reales de catálogo, compra y operación, contrastando el código con entrevistas pendientes.
2. Especificar y trazar requisitos funcionales y no funcionales contra evidencia técnica y criterios de aceptación.
3. Modelar arquitectura, entidades, relaciones y flujos de compra e inventario conforme a las reglas implementadas.
4. Documentar la implementación del catálogo público y módulos administrativos con controles de acceso y validación del servidor.
5. Evaluar el comportamiento con pruebas seguras, revisión de seguridad y verificación de interfaz, distinguiendo resultados locales de producción.
6. Preparar documentación de gestión, uso y mantenimiento que permita continuar y operar el proyecto con limitaciones explícitas.

## Matriz de preparación de los 18 apartados

| Apartado | Información comprobada disponible | Interpretación o propuesta académica | Falta investigar/verificar |
| --- | --- | --- | --- |
| 1. Título | Marca visible Floristería Anabelle; repo NOVAFLORERIA y package proyecto-floreria. | Título anterior, acotado a funciones existentes. | Nombre formal aprobado por institución/negocio. |
| 2. Antecedentes | README, historial Git y documentos técnicos muestran iteraciones de backend, catálogo y UX. | Relatar evolución técnica con fechas verificables de commits. | Historia del negocio y sistema previo mediante entrevista; no inferirlos de una foto. |
| 3. Problema | El código centraliza catálogo, pedidos, pagos reportados, caja e inventario. | Posible necesidad de coordinación y trazabilidad, como hipótesis. | Proceso anterior, incidentes, frecuencia, tiempos y evidencias empresariales. |
| 4. Formulación | Existen actores cliente/equipo y flujos de pedido/seguimiento. | ¿Cómo puede un sistema web centralizar y hacer trazables catálogo, pedidos e inventario de la florería? | Validación del problema con usuario responsable y alcance académico. |
| 5. Justificación | El sistema reúne operaciones y presenta controles verificables. | Justificación técnica, práctica y académica a contrastar. | Costos/beneficios, impacto social y métricas; no inventar porcentajes. |
| 6. Objetivo general | Alcance técnico y actores identificados. | Formulación qué/cómo/para qué anterior. | Aprobación institucional y del negocio. |
| 7. Objetivos específicos | Actividades de análisis, modelos, implementación y pruebas tienen evidencia. | Seis objetivos anteriores. | Criterios académicos y entregables finales acordados. |
| 8. Alcance y límites | Tienda pública y panel operativo; pago QR manual; entrega coordinada; cliente sin cuenta pública. | Delimitar escenario de evaluación local. | Entorno de producción, concurrencia, volumen y responsabilidades operativas. |
| 9. Marco teórico | Uso real de React/Next, PostgreSQL, Auth, validación, transacciones, roles, pruebas. | Temas: cliente-servidor, integridad, UX, requisitos, control de versiones y Kanban. | Bibliografía primaria/académica y formato de citas exigido; no redactada ni inventada aquí. |
| 10. Metodología | Historial evidencia incrementos y regresiones; trabajo individual. | Proponer enfoque iterativo con tablero Kanban. | No afirmar Scrum, sprints, reuniones o ceremonias sin registros. |
| 11. Requisitos | Matriz RF/RNF con evidencia y estado. | Criterios de aceptación reconstruidos, marcados como propuestos. | Validación formal y prioridades con interesado real. |
| 12. Análisis y diseño | Modelos de actores/dominio, secuencia, actividades y componentes. | Explicación académica a partir de modelos actuales. | Revisión por docente y trazabilidad entre modelos y requisitos. |
| 13. Arquitectura | Next App Router, APIs y Supabase; componentes públicos/admin separados. | Justificar decisiones según restricciones reales. | Medidas de carga, alternativas evaluadas y decisiones documentadas formalmente. |
| 14. Base de datos | Cadena SQL y migraciones, tablas, funciones, políticas y Storage. | Modelo de datos reconstruido de fuentes verificadas. | Reconciliar catálogo e historial efectivamente desplegados antes de afirmar equivalencia. |
| 15. Implementación | Código actual, rutas, componentes y módulos de negocio. | Presentar módulos y fragmentos sin secretos. | Capturas autorizadas y congelar una versión entregable del proyecto. |
| 16. Pruebas | Suite y evidencia local previa; límites de validación transaccional y visual. | Matriz de aceptación y escenarios futuros controlados. | Cobertura formal, pruebas accesibilidad/dispositivos, carga y despliegue real. |
| 17. Conclusiones | Se puede concluir qué está presente, conectado y probado localmente. | Relacionar resultados con cada objetivo validado. | No afirmar reducción de tiempos, aumento de ventas o satisfacción sin estudio. |
| 18. Recomendaciones | Hallazgos y pendientes priorizados en esta auditoría. | Plan de continuidad con tareas medibles. | Aprobación, estimación y orden de implementación. |

## Fuentes internas y límites

Las evidencias primarias son código actual y SQL, no los relatos de documentos históricos. El índice [ANEXO-indice-codigo.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/ANEXO-indice-codigo.md>) permite ubicar páginas, APIs, componentes y funciones. [05-requerimientos.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/05-requerimientos.md>) y [06-modelado-uml.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/06-modelado-uml.md>) aportan modelos técnicos; [10-gestion-y-avances.md](<C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/proyecto-floreria/documentacion-auditoria/10-gestion-y-avances.md>) organiza la gestión individual. Las recomendaciones permanecen propuestas: ninguna se implementa durante esta auditoría.

Se recomienda recoger de manera ética y con consentimiento: descripción del proceso actual del negocio, problemas observables, prioridades, reglas de entrega/pago, volumen y responsables. No se recopilaron testimonios, datos personales ni cifras reales del negocio para rellenar esos vacíos.
