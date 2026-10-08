# Auditoría de Supabase y propuesta de reconciliación

Fecha: 7 de octubre de 2026. Proyecto vinculado: `uyhawlpanhbrkkhqfhbv`. Auditoría de solo lectura; no se aplicaron migraciones, cambios de permisos, reparaciones del historial ni escrituras de datos. Se mantiene la decisión del usuario de no aplicar cambios remotos.

## 1. Estado real y alcance

La vinculación coincide con la referencia local y el host configurado de Supabase. La CLI 2.117.0 pudo consultar el historial y los catálogos remotos usando la configuración existente. No hay `supabase/config.toml` local.

Se inventariaron 9 esquemas, 79 relaciones, 737 columnas, 136 funciones, 89 políticas y 17 triggers de tabla no internos. En `public` existen 35 tablas físicas y la vista `audit_trail`, 301 columnas, 161 constraints, 73 índices y 35 funciones. Las tablas públicas tienen RLS habilitada; ninguna tiene FORCE RLS. Esto no demuestra por sí solo que sus funciones sean seguras.

El inventario completo incluye columnas y tipos, defaults, PK/FK/constraints, índices, enums y otros tipos, vistas, funciones, triggers, event triggers, políticas, permisos, secuencias, publicaciones, extensiones y buckets: [INVENTARIO_REMOTO.md](INVENTARIO_REMOTO.md). Los JSON adjuntos son evidencia de catálogos y conteos, no un respaldo restaurable de datos.

## 2. Historial registrado

Solo figuran `001_correccion_rls_fase2`, `002_correccion_rls_catalogo_empleado` y `003_correccion_storage_product_images_empleado` en `supabase_migrations.schema_migrations`.

Los objetos correspondientes a muchas versiones posteriores sí existen. Por tanto, «no registrada» no significa «SQL pendiente de ejecutar». La CLI compara versiones del historial; no verifica equivalencia del esquema. Véase la [referencia oficial de migration list](https://supabase.com/docs/reference/cli/supabase-migration-list).

## 3. Todas las migraciones

Se revisaron los 39 archivos completos, incluyendo SQL dentro de funciones. [MIGRACIONES.md](MIGRACIONES.md) contiene la matriz por archivo con versión, propósito, objetos, registro remoto, vigencia, correcciones posteriores, duplicados, vacíos, DDL/DML, RLS, Storage, SECURITY DEFINER, conservación, consolidación y riesgo de eliminación. [migration-hashes.json](migration-hashes.json) registra sus SHA-256. Ningún archivo original fue modificado.

## 4. Duplicados

Hay dos archivos válidos por cada versión `018`, `019` y `020`. No deben enviarse así a una cadena nueva. Nominalmente también hay dos `034`, pero uno tiene nombre inválido para la CLI y se omite. Renumerar sin estudiar el historial y la presencia de objetos podría volver a ejecutar cambios existentes.

## 5. Archivo vacío

`034 fix modulo pedidos.sql` está vacío y su nombre no cumple el formato aceptado por la CLI. No aporta SQL y la CLI lo ignora. Se conserva como evidencia; no se eliminó.

## 6. Correcciones y definiciones finales

La matriz documenta las cadenas de reemplazo. La firma de siete parámetros de `create_order` coincide con 031, incluidas las dependencias de personalizaciones e inventario. `create_payment` coincide con 016. Las funciones de caja coinciden con 023; las de descuentos con 034. Triggers de inventario, consumo FIFO, seguimiento básico y funciones de horarios/notificaciones tienen las coincidencias indicadas en [COMPARACION.md](COMPARACION.md).

Consolidar debe preservar las definiciones finales y todas sus dependencias, no concatenar los archivos históricos. Especialmente, 025 eliminaba una firma antigua de `create_order`, 028 reemplazaba su lógica y 031 incorpora la validación final de opciones.

## 7. DML, semillas y configuración

Cinco archivos contienen DML al aplicar, aparte del DML dentro de cuerpos de funciones:

- 012 crea el bucket `payment-qr`.
- 022 crea la caja inicial si falta.
- 027 crea horarios iniciales por día.
- 028 crea la configuración `accept_orders_outside_hours` si falta.
- 032 elimina globalmente datos de promociones y retira una tabla anterior. **No debe repetirse en esta base:** hay 7 promociones y 26 relaciones con productos. El comentario histórico que presume datos de prueba no acredita que los datos actuales sean descartables.

Las semillas originales de caja/horarios no coinciden con la configuración actual. Hay una caja y siete horarios; `system_settings` está vacío. No se insertó ninguna configuración. `payment_qr_config` y `whatsapp_config` también están vacías.

Un squash basado en schema-only omite INSERT/UPDATE/DELETE de nivel superior, incluidos registros de buckets, cron y secretos de Vault. El DML contenido en una función forma parte de su definición y debe conservarse con ella. No basta con un squash automático: [documentación oficial](https://supabase.com/docs/reference/cli/supabase-seed).

## 8. Drift y seguridad

Comparación estática, sin ejecutar migraciones:

- 25 cuerpos de funciones coinciden con su última fuente local; tres difieren: `release_expired_reservations`, `confirm_payment` y `create_physical_sale`.
- La función remota de expiración también cancela pedidos pendientes. La confirmación remota incorpora manejo de expiración y luego puede lanzar una excepción: hay que comprobar en un entorno aislado si los cambios previos se revierten al abortar la transacción.
- La venta física remota usa estado `finalizado`; el SQL local final usa `confirmado`.
- Existe `advance_order_status(uuid,text)` usada por la API administrativa, pero no está definida en las migraciones revisadas ni en el documento MASTER.
- Sigue existiendo `create_order` de seis argumentos, equivalente a 020, aunque 025 la eliminaba. Permite una ruta antigua que no incorpora las comprobaciones añadidas en 031.
- Cuatro helpers de identidad/registro coinciden con MASTER, pero faltan en migrations. `rls_auto_enable` pertenece a la infraestructura observada y debe clasificarse separadamente.
- `track_order_details(text,bigint,uuid)` no existe: 035 permanece pendiente por decisión expresa del usuario.
- Las 237 columnas proyectadas de las 28 tablas creadas localmente coinciden en presencia, tipo, nulabilidad y defaults normalizados. Las 68 políticas finales locales coinciden en acción, roles y expresiones; existen 21 políticas adicionales. Los índices y triggers esperados están presentes y sus definiciones se adjuntan para revisión. Esto no equivale a una prueba completa de todas las constraints o a un replay ejecutado.
- Hay dos constraints de promociones NOT VALID; los conteos actuales detectaron cero infracciones, pero no se ejecutó VALIDATE.

**Riesgo alto:** las 35 funciones públicas son SECURITY DEFINER y tienen EXECUTE efectivo para anon/authenticated/service_role. Muchas verifican roles internamente; `consume_product_inventory` y `apply_order_discount` no verifican la identidad/rol del llamador en su cuerpo. Sus parámetros de actor no sustituyen esa verificación. Se infiere exposición a mutaciones mediante RPC; no se intentó explotarla ni se cambiaron permisos. RLS en las tablas no neutraliza por sí sola este riesgo.

Las políticas permisivas se combinan con OR; las 21 adicionales necesitan revisión antes de retirar cualquiera. `audit_trail` no concede SELECT a anon/authenticated. El rate limiter usa COUNT e INSERT sin serialización explícita: requiere prueba de concurrencia aislada. No se invocó durante la auditoría, pues su cuerpo puede escribir y limpiar filas.

## 9. Reproducibilidad

**No está demostrada y el historial disponible es incompleto.** Faltan las creaciones iniciales de `profiles`, `categories`, `seasons`, `products`, `product_images`, `product_components` y `system_settings`. La primera migración altera `categories`: en una base vacía sin bootstrap se espera un error de relación inexistente. Las versiones duplicadas constituyen otro impedimento. Son conclusiones estáticas, no errores obtenidos de un replay.

MASTER es una referencia, no una baseline lista para ejecutar: contiene diseño anterior y elementos que no están en la base real.

No hay Docker/Podman disponible. `supabase db dump --linked --schema public` falló por esa dependencia. `remote-schema.sql` tiene cero bytes y **no es un respaldo válido**. No se ejecutó reset local, replay ni dump restaurable. No se usó `db pull` para generar cambios.

## 10. Qué se puede consolidar

En una futura baseline aislada: las estructuras finales de inventario/pedidos/pagos/caja/promociones; las definiciones finales de funciones y triggers; políticas y permisos aprobados; índices, constraints, secuencias, vistas y dependencias de Auth/Storage. Mantener semillas y configuración como material explícito separado, con decisiones de negocio. Las tres divergencias requieren elegir el comportamiento correcto antes de consolidar.

## 11. Qué no eliminar ahora

Conservar los 39 originales, incluidos duplicados, vacíos y versiones superadas, además de MASTER y el historial remoto. No borrar 001–003 registradas; no interpretar 004–034 como pendientes; no reejecutar 032; no sustituir funciones divergentes sin revisar su comportamiento. Conservar 035 separada como cambio pendiente, sin incorporarla falsamente al estado remoto actual.

## 12. Recomendación de baseline

**Recomiendo C: preparar una baseline limpia fuera de la cadena activa, conservando el historial original.** Mientras se valida, mantener A como política operativa: congelar el historial existente. B, renumerar lo aparentemente no aplicado, no resuelve el bootstrap ausente, el drift ni los objetos ya existentes.

La baseline candidata debe representar un estado explícitamente aprobado. Las correcciones de seguridad y 035 deben ser cambios separados y revisables; no introducirlos como si ya existieran. No se creó una nueva migración ni se ejecutó squash/repair.

## 13. Plan de ejecución futuro, sujeto a aprobación

1. Congelar y archivar originales, hashes, MASTER, esquema observado y estado Git; conservar por separado la configuración privada.
2. Obtener respaldos restaurables y demostrar su restauración en un proyecto aislado antes de reconciliar el historial.
3. Resolver las tres divergencias, la firma antigua, las funciones ausentes de migrations y la autorización de los helpers. Documentar cada decisión.
4. Habilitar Docker/Podman y crear un proyecto local independiente, sin copiar el vínculo remoto. Ejecutar allí la cadena original para registrar los errores reales. No realizarlo en este checkout vinculado por accidente.
5. Preparar la baseline candidata fuera de `supabase/migrations` activa, con versiones únicas y bootstrap completo; separar semillas/configuración. Excluir los borrados históricos de 032.
6. Reproducir la candidata localmente; comparar catálogos completos, definiciones, permisos, constraints, secuencias, extensiones y semillas con el estado aprobado. Registrar diferencias residuales.
7. Probar restauración y flujos con datos claramente sintéticos: stock/reservas/expiración, pedidos/pagos, caja/promociones, seguimiento y pruebas negativas de autorización. No usar clientes reales ni mutar este proyecto para esas pruebas.
8. Presentar el SQL y la reconciliación exacta del historial, con respaldo anterior y procedimiento de reversión. Solicitar aprobación explícita antes de cualquier `migration repair`, modificación remota o cambio de carpeta activa. Una baseline no debe ejecutarse encima de tablas existentes: su adopción requiere equivalencia probada y una estrategia de historial aprobada.
9. Aplicar 035 únicamente tras nueva autorización y validarla con un pedido inexistente antes de la prueba controlada del checkout.

## 14. Riesgos y reversión

| Operación futura | Riesgo | Condición previa |
| --- | --- | --- |
| Archivar/analizar originales | Bajo | Preservar hashes y rutas |
| Crear/reproducir baseline aislada | Medio | Verificar destino local y ausencia de vínculo remoto |
| Elegir funciones divergentes/cambiar permisos | Alto | Pruebas funcionales y de autorización |
| Renumerar/reparar historial remoto | Alto | Equivalencia demostrada, copia del historial y aprobación |
| Repetir 032 o reset remoto | Crítico | No propuesto ni autorizado |

Para cambios de historial, revertir exige la copia exacta previa y un plan revisado; reparar metadatos no revierte DDL ni datos. Para un cambio de función/permisos, guardar antes su definición y ACL para restaurarlos explícitamente. La recuperación de datos necesita un respaldo restaurable, no los JSON de esta auditoría.

## 15. Respaldos necesarios y resultado

Antes de cualquier adopción: esquema completo, datos privados cifrados, roles/ACL, historial de migraciones, valores de secuencias, extensiones, event triggers, dependencias de Auth/Storage, configuración administrativa y originales Git. Respaldar también los archivos reales de Storage: el respaldo de base contiene metadatos, no los archivos ([Supabase Backups](https://supabase.com/docs/guides/platform/backups)).

Hay dos buckets: `product-images` público, límite 5 MB y MIME JPEG/PNG/WebP, con 7 objetos; `payment-qr` público, sin límites de tamaño/MIME en su metadata, con 0 objetos. No se descargaron archivos. No se observó pg_cron ni trabajos cron; Vault existe y su conteo de secretos es cero. Deben comprobarse otra vez al preparar el respaldo.

Solo se consultaron metadatos y conteos agregados. Existen categorías de datos de autenticación/perfiles, cliente/pedido/reserva, inventario, promociones, caja, notificaciones y auditoría; no se copiaron filas personales ni secretos. **Registros de prueba creados: ninguno. Cambios remotos: ninguno.**

El resultado es una auditoría y propuesta, no una activación del checkout ni una prueba de reproducción completada. Faltan respaldo/restauración demostrados, entorno local, decisiones sobre drift y permisos, baseline validada y aprobación remota antes de continuar con checkout o el siguiente módulo.
