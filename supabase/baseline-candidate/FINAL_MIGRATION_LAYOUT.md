# Layout final vigente — ACTIVADO LOCALMENTE

Las 39 migraciones se archivaron con bytes/nombres intactos. Replay CLI directo de carpeta activa y seed completado. Ver supabase/MIGRATION_STATE.md.

```text
supabase/
  migrations-legacy/
    [39 migraciones originales; mismos nombres y bytes]
  migrations/
    20261007000100_baseline_initial.sql
    20261007000200_checkout_public_summary.sql
    20261007000300_security_rpc_hardening.sql
    20261007000400_backend_concurrency_zero_total.sql
  seed.sql
  baseline-candidate/
    [generadores, candidatas e informes]
  config.toml
```

| Destino activo | Fuente exacta | SHA-256 certificado |
|---|---|---|
| 20261007000100_baseline_initial.sql | BASELINE_CANDIDATE.sql | 4cdaf2857d683c17b82f487d2209a7946d76fa00d972dcdfc44489e1ba160b32 |
| 20261007000200_checkout_public_summary.sql | 035_checkout_public_summary.sql | 5c72b1099244e4ad6f9ab5fa01a47193f252999c7b2956140f97d83b6cf948bb |
| 20261007000300_security_rpc_hardening.sql | 036_security_rpc_hardening.sql | 61e1f355c871a98ab7c0c1758931af9d12c289d5624ad4a6a55d30d417b93765 |
| 20261007000400_backend_concurrency_zero_total.sql | 037_backend_concurrency_zero_total.sql | 7fbaf68789188cf700e5325ebf12011700c8c1afdeabe557dae676c0f018b241 |

seed.sql = SEED_CANDIDATE.sql, SHA-256 c00a87c5a0d78f20177f61dd0a3dbddd8c947ec1e467b91b236b7d432e0587f9. Configurar [db.seed] enabled=true, sql_paths=["./seed.sql"]. Semillas: buckets necesarios sin QR/datos privados, Caja principal, horarios iniciales seguros y pedidos fuera de horario desactivados. Sin usuarios/clientes/productos reales.

Baseline completa: tablas/secuencias/constraints/índices/RLS/políticas, audit_trail antes de sus funciones, triggers/ACL/integración Auth/Storage; incluye definiciones finales validadas por 037. Aplicar 036 transitoriamente restablece sus definiciones previas y 037 establece el contrato final; orden exacto ya probado. 035 agrega tracking sin entrar en la baseline. 036 retira la firma UUID solo si existe y conserva el pago de dos argumentos server-only. 037 concurrencia/gratuidad.

Sin firmas obsoletas, SQL histórico destructivo ni versiones duplicadas en la cadena activa vigente. El original 035 se conserva en legacy y su copia timestamp en la nueva cadena es byte-idéntica. Futuras migraciones usarán timestamp de 14 dígitos único, mayor que 20261007000400, y nombres snake_case; no reutilizar versiones.

El laboratorio lee directamente migrations/ mediante junction y seed.sql mediante hardlink del repositorio. Usa baseline_initial y las tres versiones siguientes; replay CLI completo terminado. Generadores y bytes certificados conservados. Nunca ejecutar baseline sobre producción.
