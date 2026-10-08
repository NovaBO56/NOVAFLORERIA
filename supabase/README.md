# Supabase: fuente oficial

La única cadena activa local certificada está en `migrations/`:

1. `20261007000100_baseline_initial.sql`
2. `20261007000200_checkout_public_summary.sql`
3. `20261007000300_security_rpc_hardening.sql`
4. `20261007000400_backend_concurrency_zero_total.sql`

`seed.sql` se ejecuta después y contiene configuración mínima idempotente: buckets sin archivos, Caja principal sin abrir, siete días cerrados y pedidos fuera de horario desactivados. No contiene clientes, usuarios, productos reales, QR ni WhatsApp privados.

**La baseline es solo para instancias nuevas/vacías. Nunca aplicarla sobre producción existente.** Producción necesita un plan y autorización separados de reconciliación e historial remoto.

`migrations-legacy/` conserva los 39 originales con nombres y bytes intactos; no ejecutar ni copiar a la cadena activa. Los hashes están en [la auditoría de conservación](MIGRATION_REORGANIZATION_AUDIT.md). No existe otra carpeta editable de SQL oficial.

Para validar se usa `NOVA-LOCAL-VALIDATION`, API `http://127.0.0.1:55421` y DB `localhost:55422`, sin vínculo remoto. Su carpeta migrations y seed enlazan directamente los archivos activos. Ejecutar `supabase db reset --local` únicamente desde ese laboratorio después de respaldar fixtures necesarios. No usar el config/vínculo del checkout para operaciones remotas.

Las claves locales de pruebas están en archivos privados ignorados por Git; nunca usar credenciales productivas. `tests/ISOLATED_SECURITY_TESTS.sql` requiere base local vacía y opt-in `nova.security_test=isolated`; sus fixtures se revierten con ROLLBACK. Las dos consultas de `tools/` son genéricas y no contienen datos remotos capturados. El escáner genérico es `tools/scan-review-files.mjs`.

Crear cambios futuros con timestamp único mayor que `20261007000400` y nombres snake_case. No reactivar históricos ni sobrescribir migraciones certificadas. La consolidación actual solo corrigió comentarios y retiró duplicados; el SQL ejecutable permanece idéntico.

El [estado vigente](MIGRATION_STATE.md) contiene los resultados de calidad y la clasificación de artefactos retirados. Los informes y snapshots anteriores se conservaron en backup privado e historial Git; no son documentación vigente ni necesarios para ejecutar la aplicación.