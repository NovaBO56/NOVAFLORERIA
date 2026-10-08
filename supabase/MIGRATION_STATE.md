# Estado vigente de Supabase

La única fuente oficial de SQL es supabase/migrations/ (cuatro versiones activas) y supabase/seed.sql. Baseline exclusiva para instancias nuevas/vacías con Auth/Storage provisionados; nunca ejecutar sobre producción existente. migrations-legacy conserva 39 archivos solo como evidencia, no como cadena ejecutable.

## Validación local

Laboratorio NOVA-LOCAL-VALIDATION: API http://127.0.0.1:55421, PostgreSQL localhost:55422, sin project-ref remoto. migrations es una junction al repositorio y seed un hardlink al archivo activo. CLI aplica baseline → checkout/tracking → security hardening → concurrency/zero-total → seed.

El SQL ejecutable y los 39 SHA-256 legacy permanecen idénticos a la certificación previa; únicamente se corrigieron comentarios y se consolidaron artefactos. No cambió API ni tests funcionales. El test estático de contrato ahora lee las migraciones oficiales conservando sus aserciones.

Esquema certificado: 35 tablas, 37 funciones públicas, 161 constraints, 73 índices, 2 secuencias, 1 vista, 11 triggers de aplicación/Auth, 86 políticas public y 3 Storage. create_payment(uuid) y create_order(6) ausentes. create_payment(uuid,text) tiene EXECUTE únicamente para service_role, no PUBLIC/anon/authenticated.

## Calidad y discrepancia de lint

Lint ejecutado sobre HEAD f021381 antes de limpiar: 0 errores y 49 advertencias. Las cifras anteriores de 5 correspondían a la copia de la aplicación sin herramientas de auditoría añadidas; no al repositorio completo de ese HEAD. Esta discrepancia queda corregida aquí; no se suprimen reglas ni advertencias. Resultado vigente después de consolidar: **0 errores y 5 advertencias**. Las cinco advertencias corresponden a tres imports no utilizados y dos usos de img en la aplicación; no se ocultaron ni corrigieron funcionalmente.

Regresión final: replay local completo de las cuatro migraciones + seed exitoso; prueba SQL aislada exitosa con ROLLBACK; npm test 288/288 en 26 archivos; npm run lint exit 0; npx tsc --noEmit exit 0; npm run build exit 0. Integridad: 39/39 legacy byte-idénticos y SQL ejecutable de cuatro migraciones y seed idéntico al snapshot anterior.

## Clasificación de baseline-candidate

A: reutilizable, conservado. B: evidencia histórica, respaldada en privado y disponible en Git. C: duplicado/temporal, retirado de la estructura normal y respaldado. Los generadores que dependían de snapshots remotos quedan como evidencia histórica; no regeneran ni compiten con la cadena activa.

| Archivo anterior | Clase | Destino |
|---|---|---|
| 036_security_rpc_hardening.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| 037_backend_concurrency_zero_total.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| activate-local-migrations.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| BACKEND_037_DECISIONS.md | B | backup privado e historial Git; retirado de la estructura vigente |
| BACKEND_FINAL_DEFINITIONS.json | B | backup privado e historial Git; retirado de la estructura vigente |
| BACKEND_ORIGINAL_DEFINITIONS.json | B | backup privado e historial Git; retirado de la estructura vigente |
| BACKEND_SCHEMA_FINAL.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| BACKEND_TRIGGER_FINAL.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| BASELINE_CANDIDATE.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| BASELINE_PLAN.md | B | backup privado e historial Git; retirado de la estructura vigente |
| build-backend-037.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| build-hardening.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| candidate-manifest.json | B | backup privado e historial Git; retirado de la estructura vigente |
| CONFIRM_PAYMENT_FINAL.sql | B | backup privado e historial Git; retirado de la estructura vigente |
| CREATE_PAYMENT_FINAL.sql | B | backup privado e historial Git; retirado de la estructura vigente |
| DRIFT_DECISIONS.md | B | backup privado e historial Git; retirado de la estructura vigente |
| FINAL_MIGRATION_LAYOUT.md | B | backup privado e historial Git; retirado de la estructura vigente |
| final-payment-retirement-tests.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| finalize-local-reorganization.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| generate-candidate.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| HANDLE_NEW_USER_FINAL.sql | B | backup privado e historial Git; retirado de la estructura vigente |
| ISOLATED_SECURITY_TESTS.sql | A | supabase/tests/ISOLATED_SECURITY_TESTS.sql |
| LOCAL_CERTIFICATION_037.md | B | backup privado e historial Git; retirado de la estructura vigente |
| MIGRATION_REORGANIZATION_PLAN.md | B | backup privado e historial Git; retirado de la estructura vigente |
| PAYMENT_RETIREMENT_CERTIFICATION.md | B | backup privado e historial Git; retirado de la estructura vigente |
| RPC_FINAL_MATRIX.json | B | backup privado e historial Git; retirado de la estructura vigente |
| RPC_FINAL_MATRIX.md | B | backup privado e historial Git; retirado de la estructura vigente |
| SECURITY_DECISIONS_FINAL.md | B | backup privado e historial Git; retirado de la estructura vigente |
| SECURITY_REVIEW.md | B | backup privado e historial Git; retirado de la estructura vigente |
| SEED_CANDIDATE.sql | C | backup privado e historial Git; retirado de la estructura vigente |
| STATIC_VALIDATION.json | B | backup privado e historial Git; retirado de la estructura vigente |
| TEST_RESULTS.md | B | backup privado e historial Git; retirado de la estructura vigente |
| validate-candidate.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| verify-active-local-reorganization.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| verify-payment-retirement-generation.mjs | B | backup privado e historial Git; retirado de la estructura vigente |
| write-payment-retirement-report.mjs | B | backup privado e historial Git; retirado de la estructura vigente |

## Otros artefactos

Se retiraron los snapshots/JSON e informes de audit-supabase y el manifiesto completo de reorganización con inventarios locales. Solo se conservaron dos consultas genéricas de catálogo, sin datos capturados, en tools/. Se conserva el escáner genérico de credenciales en tools/ y la prueba SQL aislada con opt-in y ROLLBACK en tests/. Los scripts de validación de una sola fase, informes anteriores y documentos de checkout se preservan como historia y backup privado, fuera de la estructura vigente.

Documentación actual: README.md, este archivo y MIGRATION_REORGANIZATION_AUDIT.md con los 39 hashes históricos. Evidencia y logs completos de regresión permanecen en el laboratorio privado. El historial ya publicado conserva las capturas antiguas; esta limpieza no reescribe ese historial.

Antes de producción siguen pendientes auditoría vigente, backup/restore verificable, estrategia explícita de reconciliación e historial, ensayo aislado y autorización separada. No se ejecutó link/db push/repair ni SQL remoto. El repositorio público no necesita snapshots del catálogo remoto para ejecutar o desarrollar la aplicación.