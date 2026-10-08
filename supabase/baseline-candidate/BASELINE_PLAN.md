> Actualización: SECURITY_DECISIONS_FINAL.md es la autoridad técnica vigente. Confirmación incorpora guardias adicionales, pagos solo servidor y altas de personal inactivas; las tablas de propuestas iniciales de este plan se interpretan junto con esas decisiones finales.

# Baseline candidata de NOVA FLORERÍA

Fecha: 7 de octubre de 2026. **Decisiones técnicas cerradas en SECURITY_DECISIONS_FINAL.md; ejecución pendiente de aprobación, no aplicada ni certificada por replay.** Todos los archivos están fuera de la cadena activa. No se consultó ni ejecutó SQL remoto para prepararlos. Los 39 originales y el historial quedan intactos.

## Archivos y procedencia

- `BASELINE_CANDIDATE.sql`: esquema de aplicación, integración Auth/Storage y permisos propuestos.
- `SEED_CANDIDATE.sql`: defaults explícitos para instalación nueva, sin datos del negocio.
- `DRIFT_DECISIONS.md`: definiciones locales/remotas completas de las seis firmas y recomendaciones.
- `SECURITY_REVIEW.md`: revisión individual de las 35 funciones SECURITY DEFINER observadas, ejecutores efectivos, autorización y consumidores Next.js.
- `candidate-manifest.json`: hashes de los snapshots de entrada; `STATIC_VALIDATION.json`: controles estáticos.
- `generate-candidate.mjs` y `validate-candidate.mjs`: herramientas locales para regenerar/verificar los artefactos, sin conexiones ni credenciales.

La fuente del bootstrap es el catálogo real auditado, no MASTER ni la repetición de migraciones incompletas. La candidata crea 35 tablas, 34 funciones, 161 constraints y 89 políticas de aplicación/Storage. Mantiene las 21 políticas adicionales observadas hasta revisar su equivalencia; no borra políticas históricas para deduplicarlas. Incluye índices no respaldados por constraints, vista de auditoría y triggers de aplicación/Auth. Las constraints NOT VALID permanecen así para fidelidad; su validación posterior exige revisión, aunque el entorno nuevo no tiene datos.

## Contrato del entorno nuevo

Se necesita una instancia Supabase independiente y recién provisionada: esquemas `auth` y `storage`, tablas `auth.users`/`storage.objects`/`storage.buckets`, `auth.uid()`, roles `postgres`, `anon`, `authenticated`, `service_role` y servicios de plataforma. No es instalador sobre PostgreSQL vacío sin Supabase.

Se ejecutaría como `postgres`, dueño de las tablas y funciones. `public` no debe contener tablas/vistas. El SQL aborta si detecta relaciones existentes o el trigger Auth de la aplicación. Es una barrera parcial contra destino equivocado, no sustituto de verificar explícitamente URL, project-ref y entorno. No configura ni usa el proyecto vinculado.

`pgcrypto` y `uuid-ossp` son las extensiones de aplicación incluidas; `plpgsql` es prerrequisito. `pg_stat_statements`, Vault, GraphQL, Realtime y sus event triggers son infraestructura administrada por Supabase y no se reconstruyen desde su catálogo. El snapshot no tenía tablas publicadas en Realtime ni cron. El trigger `on_auth_user_created` sí se incluye porque crea perfiles de la aplicación. No se insertan usuarios ni se copian passwords, tokens o secretos.

El orden es: prerrequisitos/extensiones y barreras → secuencia independiente → todas las tablas/columnas → funciones con comprobación de cuerpos diferida → constraints (FK después de PK/UNIQUE) → índices → vista → RLS/políticas → triggers → ACL explícitas → comprobación de exclusiones. Las funciones SQL y PL/pgSQL requieren comprobación real posterior; `check_function_bodies=off` permite resolver dependencias mutuas, no certifica sus cuerpos. La identidad `rate_limit_attempts.id` crea automáticamente su secuencia; `order_number_seq` se crea separadamente. Ambas comienzan desde la instalación nueva, sin copiar valores reales.

## Estado final propuesto: decisiones aún pendientes

| Punto | Recomendación representada en la candidata | Revisión requerida |
| --- | --- | --- |
| release_expired_reservations | Cuerpo remoto: libera y cancela pedidos pendientes afectados | Transacciones, reservas parciales y llamadores que abortan |
| confirm_payment | Derivada de 013 con guardias de pedido, monto y reserva y orden de bloqueos | Probar el contrato de rechazo y la concurrencia |
| create_physical_sale | Remoto: pedido finalizado y pago confirmado | Caja, reportes y devolución |
| advance_order_status | Recuperar remoto, ausente del historial local | Transiciones y autorización |
| create_order 6 | Omitir firma antigua de la instalación nueva | Confirmar ausencia de consumidores externos, no solo Next.js |
| create_order 7 | Mantener 031/remoto coincidente | Pruebas de personalizaciones, stock y promociones |
| Helpers mutadores | Solo service_role/propietario, sin clientes directos | Ejecución interna SECURITY DEFINER y pruebas negativas |
| RPC administrativos | authenticated + service_role; rol activo dentro del cuerpo | Usuario sin rol, inactivo y admin/empleado |
| RPC públicos | Crear pedidos/consultar horario/seguimiento según contrato; pagos solo servidor | Probar límites y credencial telefónica residual |

Las decisiones técnicas finales están en SECURITY_DECISIONS_FINAL.md; no constituyen aprobación de ejecución remota. No se agrega 035: su SQL original permanece como cambio posterior independiente. Seguimiento sigue dependiendo de 035; el reporte de pago depende del contrato nuevo de 036 y ya no consulta 035 para autorizar la escritura.

## Seeds y configuración

| Elemento | Decisión explícita para instalación nueva |
| --- | --- |
| payment-qr | Bucket público vacío, JPEG/PNG/WebP, 5 MB propuestos; sin imagen ni cuenta de pago |
| product-images | Bucket público vacío, mismos límites conocidos; no copiar archivos reales |
| Caja principal | Una caja activa si no hay ninguna; ninguna sesión, saldo o movimiento |
| business_hours | Siete días cerrados, horas NULL; administrador configura horarios antes de vender |
| accept_orders_outside_hours | `enabled:false`, crítico; no aceptar fuera de horario |
| QR/WhatsApp | Sin filas de configuración; no inventar valores |

Los INSERT usan existencia/ON CONFLICT DO NOTHING: no actualizan configuraciones existentes. El seed es para una instalación nueva, no para corregir producción. No se copian caja/horarios remotos privados. No hay productos, promociones, clientes, pedidos, pagos ni filas de prueba. La aplicación estará cerrada por defecto y necesitará configuración administrativa y catálogo real autorizado.

## Permisos propuestos y límites

Se revoca EXECUTE de PUBLIC además de anon/authenticated; después se conceden permisos por firma. Los helpers mutadores y funciones trigger quedan solo para service_role como ejecutor externo; los RPC propietarios conservan llamadas internas como postgres. Los RPC admin siguen usando JWT authenticated del cliente Next.js y sus validaciones internas de roles.

Las tablas conservan permisos CRUD auditados y RLS/políticas observadas. **Se excluyen TRUNCATE, TRIGGER y REFERENCES para anon/authenticated/PUBLIC:** la aplicación no necesita esos privilegios y TRUNCATE no se filtra con RLS. service_role conserva sus privilegios auditados. Se revoca CREATE en public para evitar objetos de clientes dentro del search_path SECURITY DEFINER; se restringe el EXECUTE por defecto de nuevas funciones creadas por postgres. Estas diferencias son propuestas explícitas, no fidelidad literal a ACL inseguras.

La candidata actualizada elimina el pago directo con UUID: create_payment(uuid,text) solo servidor, con validación telefónica atómica. Persisten riesgos que impiden llamarla lista para producción: el teléfono no prueba identidad y check_rate_limit acepta parámetros manipulables. Un endpoint Next.js validado no impide llamar a Supabase directamente. Se documentan para decidir un cambio separado de contrato/arquitectura; no se introduce un cambio silencioso que rompa checkout ni se instala una clave service_role en clientes.

Los cuerpos finales conservan DML operacional necesario: actualizaciones de stock/pago, registros de auditoría y limpieza del rate limiter. No hay DELETE/DROP/TRUNCATE históricos de nivel superior; se excluye la limpieza de 032. Las FK `ON DELETE` son reglas de integridad, no instrucciones de borrado ejecutadas por la baseline. Tampoco se recrea `promotion_customers` ni se ejecuta DROP de la firma antigua: se omiten ambos al crear desde cero.

## Validación y plan antes de ejecutar

1. Revisar y aprobar decisiones de drift, privilegios, contrato público y defaults. Actualizar candidata si la elección cambia.
2. Disponer de Docker/Podman o PostgreSQL/Supabase local independiente. En esta sesión no están disponibles; no se instalaron. No presentar controles estáticos como prueba de compilación/reproducibilidad.
3. Crear directorio/proyecto local separado sin `.temp/project-ref` del proyecto real. Verificar destino y ausencia de vínculo remoto antes de ejecutar los dos SQL. No usar db push/repair/squash/reset vinculado.
4. Ejecutar baseline y seed en ese destino aislado, registrar errores completos y comparar tablas, constraints, índices, funciones, triggers, ACL y políticas con los artefactos. Verificar los cuerpos con llamadas sintéticas, pues se creó con comprobación diferida.
5. Repetir desde otra instancia local vacía: demostrar instalación reproducible. Ejecutar seed una segunda vez y demostrar que no agrega duplicados ni sobrescribe configuración.
6. Probar casos positivos y negativos por JWT: anon, cliente authenticated sin rol, empleado/admin activo e inactivo y service_role. Confirmar bloqueo directo de consume/apply/release, y funcionamiento de sus llamadas internas.
7. Probar expiración/pago simultáneo, stock compartido, FIFO/opciones, idempotencia, venta física/caja/devolución/promos/transiciones. Comprobar rollback ante reservas vencidas y ausencia de dinero/stock parcial. Incluir concurrencia de rate limit.
8. Aplicar 035 solo en la prueba aislada como cambio posterior para completar checkout/seguimiento. Mantener separadas las evidencias antes/después de 035.
9. Presentar evidencia de replay, pruebas y restore. Una eventual reconciliación remota necesita autorización nueva y plan exacto de adopción del historial; no ejecutar esta baseline sobre tablas existentes.

## Qué puede aprobarse y qué sería peligroso

Puede aprobarse la conservación de originales, la carpeta separada, el bootstrap de catálogo y la exclusión de 032/promotion_customers/035. El DDL requiere replay antes de aprobar su ejecución. Las decisiones de la tabla anterior necesitan aprobación funcional y de seguridad.

Es peligroso aplicar esta candidata sobre la base actual, sustituir funciones divergentes sin pruebas, revocar permisos usados por consumidores desconocidos, reparar versiones porque no aparecen registradas, reiniciar secuencias con datos, reejecutar 032 o considerar estos catálogos respaldo restaurable. No se incluyen comandos para esas acciones.

## Respaldos previos a cualquier reconciliación remota

Preservar los 39 SQL originales y hashes, MASTER, estado Git y tabla exacta de historial. Obtener respaldo restaurable cifrado de esquema/datos, roles/ACL/default privileges, secuencias con valores actuales, extensiones, funciones y triggers, integración Auth/Storage y configuraciones reales. Respaldar los archivos binarios de Storage aparte de su metadata. Conservar Auth/secretos de manera privada, nunca en estos seeds. Inventariar nuevamente Vault/cron/configuración de plataforma si cambian desde el snapshot. Demostrar restauración en entorno independiente antes de tocar historial o producción.

Resultado de esta preparación: archivos candidatos y controles estáticos locales. Cambios remotos, registros creados y reconciliaciones: **ninguno**.

