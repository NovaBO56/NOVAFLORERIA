# Catálogo demostrativo LOCAL

Solo `desarrollo-auditoria`. No es un seed productivo ni contiene cotizaciones oficiales. No ejecutar estos scripts contra otro destino.

## Aislamiento

- Laboratorio: `NOVA-LOCAL-CATALOGO-DEMO`, carpeta privada `%LOCALAPPDATA%\NOVA-Floreria\catalogo-demo`.
- Supabase API: `http://127.0.0.1:50621`; PostgreSQL: localhost 50622.
- Web única: `http://127.0.0.1:3117`. No ejecutar simultáneamente el launcher antiguo de 3116.
- Las claves CLI quedan en `status.private.json`, fuera del repositorio. No copiar ese archivo, dumps, sesiones o logs privados a Git.
- `next.config.ts` admite el puerto 50621 solo con `NOVA_LOCAL_LAB=true` y una dirección de esta computadora. Producción no cambia.

## Preparación desde cero

1. Crear una carpeta LOCAL nueva, fuera de Git, e inicializar allí Supabase CLI. Configurar `project_id = "NOVA-LOCAL-CATALOGO-DEMO"` y puertos 50620–50629. Confirmar que están libres.
2. Copiar las migraciones activas y `seed.sql`; no copiar `.temp/project-ref`, `.env` ni legacy. En esta fase son 17 migraciones.
3. Iniciar ese laboratorio con CLI. Auth, Storage, PostgREST y Kong deben estar activos; Studio/analytics/realtime/edge no son necesarios para el catálogo.
4. El origen de cuentas debe ser exclusivamente el laboratorio LOCAL histórico `NOVA-LOCAL-INTEGRITY`. Si no existe, detenerse: no sustituirlo por Supabase remoto.
5. Desde el repositorio ejecutar `node scripts/prepare-catalog-demo-local.mjs --prepare`. Verifica identidad y destino, guarda un dump privado previo, copia cuentas existentes con sus hashes originales y carga el catálogo en una transacción.
6. Ejecutar `node scripts/prepare-catalog-demo-photos-local.mjs` para descargar únicamente fuentes revisadas, subir imágenes a Storage LOCAL y verificar bytes. Fotografías rechazadas o no encontradas usan el fallback existente. Las descargas externas son solo archivos de banco, no conexiones a otra Supabase.
7. Opcional para inspección del pago: `node scripts/prepare-catalog-demo-payment-local.mjs`. Copia exclusivamente los placeholders LOCAL existentes rotulados **NO PAGAR**; nunca datos bancarios. No configura WhatsApp ni inventa un número.
8. Detener únicamente el servidor web previo de 3117, conservando Docker/laboratorios, y ejecutar `powershell -NoProfile -File scripts/start-catalog-demo-local.ps1`.

El origen histórico y sus archivos no se eliminan ni limpian. No hay TRUNCATE ni borrado de usuarios. El script rechaza una base comercial no vacía desconocida. Si ya terminó la carga, repetir `--prepare` verifica el resultado sin duplicar productos, entradas o promociones ni sobrescribir ediciones posteriores. `--verify` solo consulta. No es una herramienta de limpieza arbitraria ni de reset; una reconstrucción diferente requiere revisar primero pedidos, referencias y respaldo.

## Catálogo y reglas

100 productos: 25 ramos, 20 arreglos, 12 cajas, 10 flores especiales, 8 plantas, 7 peluches, 5 chocolates, 5 globos y 8 regalos. Nombres naturales, importes simulados en Bs, seis temporadas y ocho ocasiones. Un borrador no público, un activo sin existencias y un caso de stock bajo son deliberados.

Las entradas generan lotes mediante los triggers existentes. No se actualiza directamente `current_stock`. Se reutilizan cuatro tipos de inventario, recetas, incluidos, dedicatorias y promociones. Los complementos globales tienen seis candidatos ordenados y hasta cuatro resultados por cliente; se excluyen las categorías de complementos. Los 25 ramos heredan la misma configuración sin edición individual.

Hay nueve promociones: porcentaje, monto fijo con mínimo, cinco combos, una futura y una vencida. La compra y los importes usan los contratos y precios almacenados. No existe un descuento automático nuevo.

## Fotografía

Fuentes y condiciones: [Pexels License](https://www.pexels.com/license/). Procedencia por imagen en `scripts/catalog-demo-photos.mjs`; resultados, SHA-256 y pendientes en el `photo-manifest.json` del laboratorio.

Las fotos son ilustrativas, no trabajos acreditados a Anabelle. No se usan capturas como productos, marcas de otras tiendas, imágenes generadas, URLs externas como destino permanente ni una misma foto para múltiples productos. Se descartaron composición/presentación no correspondiente, marca ajena, una descarga 404 y una orquídea sin la flor descrita. La cobertura actual es parcial: diez productos con fotografía única y 90 con fallback. Tres galerías contienen además un recorte identificado como detalle de la misma foto, no un segundo ángulo inventado.

## Verificación

```powershell
node scripts/prepare-catalog-demo-local.mjs --verify
node scripts/qa-catalog-demo-local.mjs
npm test
npm run lint
npx tsc --noEmit
```

La QA específica ejecuta SQL real con rollback: herencia en 25 ramos, exclusiones, excepción individual, agotados, compras con/sin extras, reporte y confirmación/rechazo manual, recibo, FIFO, promociones, carritos de 5/10/20/30 líneas, merma, reposición y conciliación de lotes. También realiza login Auth real con credenciales sintéticas privadas ya existentes y comprueba RPC privados. No sustituye navegación visual/E2E por botones.

## Respaldo y límites

El dump previo completo del origen se guarda fuera del repositorio. Se restauró en otro contenedor Supabase LOCAL desechable: `NOVA-LOCAL-CATALOGO-BACKUP-VERIFY`. Se requiere `supabase_admin` para conservar propietarios, y restaurar en la base `postgres` para la extensión pg_cron. No trasladar este procedimiento a producción ni a un laboratorio con datos que se deban conservar.

**El dump solo no bastó para recuperar los permisos originales.** Los permisos por defecto de la plataforma añadieron EXECUTE para anon/authenticated durante la recreación de funciones privadas. Se capturó del origen, por lectura, el archivo privado `backups/original-client-server-acl.private.sql`. Este archivo es parte obligatoria del paquete: revoca y repone exactamente los permisos PUBLIC/anon/authenticated/service_role de funciones, tablas, vistas y secuencias, actuando con sus propietarios originales. Se aplicó exclusivamente a la copia restaurada y se compararon 88 definiciones de función/SECURITY DEFINER y 168 ACL de objetos con el origen. No se aplicó esa corrección al laboratorio histórico ni al DEMO.

Una recuperación LOCAL debe restaurar el dump en una instancia vacía desechable, aplicar el sidecar ACL con `psql -v ON_ERROR_STOP=1` y comprobar los permisos antes de habilitar APIs. No exponer por HTTP una restauración intermedia. Las instancias de verificación tienen únicamente PostgreSQL. Se conservaron los intentos fallidos como evidencia; no usar la copia de verificación V2 que quedó incompleta.

Se verificaron 77 tablas: datos de negocio/perfiles y snapshot de Auth. Las sesiones Auth pueden seguir cambiando en el origen, por lo que esas tablas se compararon contra el COPY del archivo, no contra un estado posterior. Los 110 objetos Storage del origen se copiaron aparte con manifest y SHA-256. Un dump de metadata no contiene sus bytes. No se ensayó una restauración HTTP completa de esos 110 archivos en otro Storage; no afirmar lo contrario. Los respaldos locales contienen información sensible de Auth y están protegidos por la cuenta de Windows; no constituyen una copia externa con custodia independiente.

No se cambiaron contraseñas, usuarios, roles, QR productivos ni configuración remota. La nueva demostración usa horarios propios de prueba, 00:00–23:59; ubicación y WhatsApp quedan sin inventar. Puede ser necesario iniciar sesión nuevamente con la cuenta LOCAL conservada al cambiar de laboratorio.
