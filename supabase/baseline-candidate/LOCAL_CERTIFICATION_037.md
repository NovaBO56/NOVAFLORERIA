# CERTIFICADO LOCALMENTE — alcance de pruebas 037

Fecha 2026-10-07. NOVA-LOCAL-VALIDATION API http://127.0.0.1:55421; DB 127.0.0.1:55422; Next http://127.0.0.1:3100. Sin project-ref, sin SQL remoto, sin link/push/repair/squash, sin datos reales. Las 39 originales conservan hashes. NO autorización de producción ni garantía universal de ausencia de deadlocks fuera de los escenarios ensayados.

## Resultado final

{
  "http": {
    "tests": 51,
    "failed": 0
  },
  "jwt": {
    "tests": 17,
    "failed": 0
  },
  "concurrency": {
    "tests": 17,
    "failed": 0
  },
  "promotions": {
    "tests": 11,
    "failed": 0
  }
}

Todos en verde. Clasificación precisa: de 51 casos agrupados como http, 46 son Next HTTP real y 5 son comparaciones negativas de contrato por Supabase RPC real para respetar el rate limit; no se desactivó rate limiting. Los 17 casos Auth/roles incluyen 3 logins con JWT real, pruebas RPC y HTTP. Los 17 casos de concurrencia/consistencia incluyen 14 carreras con dos conexiones psql independientes y 3 comprobaciones secuenciales asociadas. Promociones: 9 escenarios básicos + rollback atómico de consumo + estado gratuito HTTP. No son mocks. 

ISOLATED_SECURITY_TESTS.sql pasó sobre base vacía con opt-in explícito, final ROLLBACK (68-final-security.log). SQL de pruebas puede avanzar secuencias; no modifica histórico de migraciones. Unitarios aparte: 288 tests/26 archivos; lint exit 0 (5 warnings existentes), npx tsc --noEmit exit 0 y npm run build exacto exit 0. QUALITY_037.json y logs 73..76.

## Replay final realmente ejecutado

1. supabase db reset --local --version 20261007000100 --no-seed --workdir laboratorio --yes: schema/Auth recreados, baseline final compila.
2. psql ON_ERROR_STOP=1: seed.sql.
3. 035 independiente.
4. 036 original.
5. 037 final.
6. Fixture SQL con SET nova.security_test='isolated', después main/extended/free/edge reales.

Logs 63..72. No parche manual de esquema. SQL ejecutado corresponde a la baseline fuente final y a las copias del laboratorio (versiones únicas 20261007000100/200/300/400). Generador recompuesto a carpeta temporal reproduce byte a byte la baseline; GENERATOR_REPRODUCIBILITY_037.json. Validación estática pasa 18 checks. La 037 FINAL también se ensayó sobre un clon frío del backup anterior (sin request_contract, created_by NOT NULL). Se restauró en nova_delta_037 dentro del MISMO contenedor del laboratorio, sin alterar la base API postgres. Delta exit 0; catálogo público semánticamente idéntico al replay limpio y pedido gratuito/idempotencia funcional correctos (FINAL_DELTA_VERIFIED.json, logs 77..79).

## Errores reales encontrados durante la corrección

- Helper de consumo: alias l colisionaba con record PL/pgSQL, fixture falla antes de efectos persistidos; corregido alias locked_lot y reconstrucción.
- Pedido gratuito: created_by NOT NULL produjo 23502; resuelto con actor automático NULL estrictamente validado, no usuario ficticio. El arnés consultó UUID null después del RPC fallido y produjo 22P02 secundario; error real capturado después y arnés corregido.
- Contenedor recreado perdió archivo /tmp de fixture: fallo de ruta del arnés, se volvió a copiar; no modificación de DB para ocultarlo.
- Normalización final de cantidad a precisión numeric(12,3), probada con variantes textuales equivalentes y nuevo replay.

## Carreras y timings finales

| Caso | A / B ms | Bloqueo observado | Final |
|---|---|---|---|
| last-stock | 1005 / 899 | transactionid ← 1074 | {"orders":1,"reserved":1} |
| same-key | 982 / 865 | advisory ← 1109 | {"orders":1,"reservations":1} |
| double-report | 981 / 872 | transactionid ← 1144 | {"payments":1,"ids":["662239db-9e62-4039-8a47-2032e156caed"]} |
| double-confirm | 980 / 867 | transactionid ← 1178 | {"status":"confirmado","stock":4,"consumed":1} |
| expiry-confirm | 1250 / 920 | sin dependencia de lock capturada | {"order":"cancelado","payment":"pendiente","stock":5} |
| double-physical | 1008 / 873 | transactionid ← 1263 | {"stock":0,"sales":1} |
| same-key-different-payload-psql | 975 / 877 | advisory ← 1307 | {"orders":1} |
| distinct-keys-independent-stock | 1321 / 263 | sin dependencia de lock capturada | {"orders":2} |
| confirm-first-before-deadline | 1255 / 569 | transactionid ← 1405 | {"order":"confirmado","payment":"confirmado","stock":9,"reserved":0,"consumed":2,"released":0} |
| expiration-first-after-deadline | 980 / 861 | transactionid ← 1468 | {"order":"cancelado","payment":"pendiente","stock":10,"reserved":0,"consumed":0,"released":2} |
| transaction-started-before-expiry-lock-check-after | 1165 / 524 | transactionid ← 1524 | {"order":"cancelado","payment":"pendiente","stock":10,"reserved":0,"consumed":0,"released":2} |
| double-expiration-multiple-orders-items | 979 / 872 | transactionid ← 1580 | {"cancelled":3,"released":6,"stock":10} |
| double-confirm-multiple-items | 1118 / 1012 | transactionid ← 1636 | {"order":"confirmado","payment":"confirmado","stock":9,"reserved":0,"consumed":2,"released":0} |
| confirm-waits-item-lock-beyond-expiry | 1374 / 1274 | transactionid ← 1778 | {"order":"pendiente_pago","payment":"pendiente","stock":10,"reserved":2,"consumed":0,"released":0} |


Misma key/contrato por SQL devuelve ambas veces mismo UUID, count orders 1, reserva 1; B espera advisory lock, sin 23505. HTTP concurrente devuelve dos 201 con mismo order_id, incluido gratuito. Contrato distinto P0001/HTTP400 explícito, incluyendo teléfono, nombre, WhatsApp, cantidades, productos, opciones, promoción, mensajes y notas. Dos keys con stock independiente terminan en paralelo. Clock real tras espera de lock de item rechaza pago sin consumir; release posterior cancela/libera de manera consistente. Ninguna carrera final produjo 40P01. psql aplica SET ROLE/claims para operaciones administrativas; JWT verificado criptográficamente por Auth/PostgREST/Next en la suite HTTP separada.

## Gratuito y promociones

Porcentaje/fijo/combo: descuentos y pagos pendientes correctos. Mínimo, no elegible, expirada, inactiva, descuento>subtotal rechazan. 100%: subtotal100, descuento100, total0, confirmado, un consumo y cero payments/cash; seguimiento200 y avances200. RPC/HTTP directo de pago gratuito rechazado: no se requiere llamarlo desde checkout. FREE_HTTP_SECURITY_037.json demuestra creación concurrente/API, provenance de actor NULL y denegaciones del helper para anon/empleado/inactivo. Fallo intencional de stock sin lotes prueba rollback completo. Ese ítem sintético inconsistente permanece identificado en manifest, no es un parche de esquema ni un dato real.

QR y WhatsApp no se inventaron; quedan sin configurar (404 esperado). No hubo transferencias bancarias. El flujo de pago probado es el contrato de reporte/revisión con datos sintéticos.

## Diferencias de esquema intencionales

35 tablas, 161 constraints, 73 índices, 89 políticas public/storage, 2 secuencias y audit_trail preservados. Funciones totales 38: 37 baseline + 035; 3 helpers nuevos. Triggers 11: dos nuevos frente a 9 originales. Columnas: orders.request_contract añadida; inventory_movements.created_by permite NULL bajo trigger. FK/PK, políticas y grants de tablas conservados. Nuevo helper de consumo solo service_role; triggers sin EXECUTE externo después de 037. create_order(6) ausente; create_payment(uuid) todavía existe solo para propietario, sin acceso anon/authenticated/service; create_payment(uuid,text) sigue solo servidor. No se modificó 036 ni se mezcló 035. Definiciones modificadas y justificación en BACKEND_037_DECISIONS.md.

## Alcance y reorganización

Backend certificado localmente para el contrato y matriz ejecutados, en READ COMMITTED. No garantiza aislamientos distintos ni todas las combinaciones de operaciones/eventos futuras. Tres bloqueos cerrados; flujo gratuito completo y fuerte idempotencia de requests nuevos demostrados. Los retries legacy sin snapshot se rechazan explícitamente; revisar esa compatibilidad antes de una adopción remota.

NO activar todavía reorganización: requiere aprobación del usuario y preparar layout de CUATRO versiones incluyendo 037. La propuesta anterior sin firmas obsoletas aún exige omitir create_payment(uuid) en la baseline definitiva y convertir su REVOKE de 036 en guardia de existencia; eso debe ensayarse por separado antes de mover los 39 archivos. No se hizo esa retirada física ni cambio de 036 en esta tarea. Final layout actual certificado del laboratorio: baseline, 035, 036, 037; seeds externos. No equivale al procedimiento de transición del historial productivo.

## Registros y backup

{"orders":26,"payments":15,"users":3,"products":26,"inventory":26,"promotions":11,"cashSessions":1,"cashMovements":2}. IDs en SYNTHETIC_RECORDS_037.json, usuarios test-nova-*. Sin eliminación posterior automática. Rollback preparado en LOCAL_CLEANUP_037.md; elimina todo SOLO en laboratorio y deja baseline+035+036+037+seed limpios. Backup nuevo backups/nova-validation-037-final.dump (hash BACKUP_037_FINAL_HASH.json). No se restauró este último dump en esta fase: el procedimiento de restore anterior está demostrado para la versión previa, no se afirma otra cosa. No es backup de producción.


Base auxiliar local nova_delta_037: copia de datos exclusivamente sintéticos del snapshot previo más un pedido gratuito TEST-NOVA-FINAL-DELTA y sus fixtures. IDs nuevos en FINAL_DELTA_VERIFIED.json. No se conecta desde Next ni Auth HTTP, no tiene project ref separado. Se conserva para inspección, con rollback explicitado.
