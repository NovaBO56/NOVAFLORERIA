# Supabase: cadena local activa

`migrations/` contiene las cuatro migraciones limpias certificadas, con versiones CLI únicas. `migrations-legacy/` conserva los 39 archivos anteriores, nombres y bytes intactos; es evidencia histórica y no debe ejecutarse ni copiarse a la cadena activa. `seed.sql` contiene únicamente configuración inicial segura y queda fuera de migrations.

La baseline requiere una instancia Supabase vacía con Auth/Storage provisionados. **No aplicar la baseline sobre producción existente.** La adopción productiva requiere un plan separado de reconciliación e historial remoto, backups verificables y nueva aprobación. Esta reorganización no cambia el historial remoto ni autoriza link, db push, repair o reset remoto.

Para validar localmente se usa `NOVA-LOCAL-VALIDATION`, API `http://127.0.0.1:55421`, PostgreSQL `127.0.0.1:55422`. Su config mantiene project_id local y no tiene project-ref. Su carpeta migrations es una junction a esta carpeta activa y su seed.sql es un hardlink al seed del repositorio: CLI lee los archivos definitivos, sin copias SQL manuales. El config del repositorio conserva su configuración previa; no se usa para resetear el proyecto vinculado.

Desde ese laboratorio, `supabase db reset --local` aplica baseline → checkout → hardening → concurrencia/gratuidad → seed. Antes de resetear, respaldar cualquier fixture local que se necesite conservar. Las claves locales de la copia Next.js se mantienen en archivos privados ignorados por Git; no utilizar las credenciales productivas para las pruebas.

Defaults seed: dos buckets sin archivos, Caja principal sin abrir, siete días cerrados y pedidos fuera de horario desactivados. QR, WhatsApp, horarios y configuración comercial deben configurarse explícitamente. El seed conserva filas existentes y su idempotencia fue verificada en PostgreSQL local.

Para nuevas modificaciones crear una migración timestamp de 14 dígitos, única y mayor que `20261007000400`, con nombre snake_case. No editar las cuatro migraciones certificadas ni reactivar originales históricos. Los generadores/candidatas sirven para revisión y no deben sobrescribir automáticamente la cadena activa.

Ver [estado final](MIGRATION_STATE.md), [auditoría de movimiento](MIGRATION_REORGANIZATION_AUDIT.md) y `MIGRATION_REORGANIZATION_MANIFEST.json` para hashes, backup y evidencias de pruebas.
