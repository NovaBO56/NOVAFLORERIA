# Evidencia de validación local

7 de octubre de 2026. Sin SQL ni pruebas de ataque contra Supabase real.

| Control | Resultado | Alcance |
| --- | --- | --- |
| npm test | 286 tests, 25 archivos, todos pasan | Vitest; mocks HTTP y controles estáticos incluidos |
| npm run lint | 0 errores, 6 warnings | Avisos existentes en auditoría/inventario/prueba-cliente; ninguno en los cambios nuevos |
| npm run build | Pasa | Compilación y TypeScript de Next.js; no certifica funciones SQL |
| validate-candidate.mjs | 18 controles pasan | Exclusiones, counts, ACL entregadas, seeds y hashes de 39 originales |
| ISOLATED_SECURITY_TESTS.sql | NO ejecutado | Fixture de roles/motor PostgreSQL para Supabase vacío y aislado |
| RPC por HTTP/JWT real | NO ejecutado | Permisos PostgREST y esquema cache pendientes |
| Concurrencia de pago/confirmación/rechazo | NO ejecutada | Necesita sesiones reales simultáneas |

Vitest requirió ejecución fuera del sandbox tras EPERM de lectura en node_modules; ninguna aprobación concedió SQL remoto. La migración candidata y los SQL de pruebas no fueron ejecutados. No se crearon datos reales ni fixtures en la base.

Los tests estáticos verifican lo escrito, no que PostgreSQL compile ni que sus ramas sean alcanzables. Los mocks comprueban despacho/validación HTTP, no ACL ni identidad real. Para certificar: replay desde cero, fixture SQL, roles/JWT reales, dos sesiones concurrentes y respaldo/restauración demostrados. Mantener logs de los fallos y corregir antes de cualquier aprobación remota.
