# Backup manual de datos — Floristería Anabelle

La decisión vigente es realizar una copia **manual una vez por semana desde la laptop**. No hay workflow automático, proveedor externo ni copia de archivos Storage. Se conservan todas las copias; la herramienta nunca elimina backups anteriores.

**Este backup protege los datos de la base. No incluye las imágenes físicas almacenadas en Supabase Storage.**

## Backup semanal

Una vez por semana:

1. Abrir PowerShell en el proyecto.
2. Configurar las variables privadas de esta sesión, como se explica abajo.
3. Ejecutar `npm run backup:manual`.
4. Comprobar el mensaje `Backup manual cifrado creado y verificado correctamente.`
5. Verificar en la carpeta elegida que existen el `.dump.enc` y su `.dump.enc.verified.json`.
6. Copiar opcionalmente **ambos archivos** a OneDrive/disco externo. Mantener la clave de cifrado separada en un gestor privado.
7. Limpiar las variables secretas y cerrar PowerShell. Si falla el comando, no contar ese intento como copia semanal.

## Preparación de la laptop

Instalar Node.js y clientes oficiales PostgreSQL compatibles con la versión de la base (17 para el laboratorio validado), con `pg_dump`, `pg_restore` y `psql` en PATH. La conexión debe permitir leer completamente los cuatro esquemas. Un rol dedicado de lectura necesita CONNECT, USAGE, SELECT sobre tablas/secuencias y acceso íntegro a datos con RLS; no usar un rol que entregue una copia filtrada. Revisar ese acceso por separado antes de un primer backup productivo. No se configura ningún permiso remoto en esta rama.

El origen autorizado es exclusivamente `groyjvbtcuhjbltmmdfl`. Se admite su host directo `db.groyjvbtcuhjbltmmdfl.supabase.co` o pooler oficial **de sesión** cuyo usuario termine en `.groyjvbtcuhjbltmmdfl`. No usar puerto transaccional 6543, la base antigua ni otra base. TLS exige `verify-full` y certificado CA verificable; no desactivar SSL si falta un certificado. Variables `PGHOSTADDR`, `PGSERVICE` y `PGSERVICEFILE` se rechazan para evitar redirecciones accidentales.

Elegir una carpeta privada absoluta de la laptop **fuera de cualquier repositorio Git**, con permisos de acceso del propietario. Puede contener espacios. La herramienta comprueba rutas reales/junctions antes de crear archivos. No hardcodea una carpeta personal ni lee `.env`. La carpeta temporal del sistema también debe estar fuera de Git, con espacio libre para dump, cifrado y comprobación. Contiene plaintext transitorio sensible, eliminado al terminar.

## Variables de sesión PowerShell

Después de revisar la conexión y guardar una clave de cifrado de 32 bytes aleatorios en base64 en un gestor privado, establecer estas variables. No generar otra clave cada semana ni perder la anterior. No enviar credenciales por chat ni pegar una connection string completa.

```powershell
$env:BACKUP_MODE = 'production'
$env:BACKUP_PROJECT_REF = 'groyjvbtcuhjbltmmdfl'
$env:PGHOST = Read-Host 'Host DB autorizado (directo o pooler de sesión)'
$env:PGPORT = '5432'
$env:PGDATABASE = 'postgres'
$env:PGUSER = Read-Host 'Usuario DB de lectura'
$env:PGSSLMODE = 'verify-full'
$env:PGSSLROOTCERT = Read-Host 'Ruta absoluta del certificado CA verificado'
$env:BACKUP_OUTPUT_DIR = Read-Host 'Carpeta absoluta privada fuera de Git'
$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Password DB' -AsSecureString)).Password
$env:BACKUP_ENCRYPTION_KEY = [System.Net.NetworkCredential]::new('', (Read-Host 'Clave de cifrado base64 del gestor privado' -AsSecureString)).Password

npm run backup:manual

Remove-Item -LiteralPath 'Env:PGPASSWORD', 'Env:BACKUP_ENCRYPTION_KEY'
```

Esos prompts no imprimen secretos ni los guardan en historial de comandos. Las variables viajan únicamente en el entorno privado del proceso; no se pasan como argumentos ni se guardan en Git/README/screenshots/logs. No configurar `BACKUP_LOCAL_CONTAINER` para producción. El cliente productivo es PostgreSQL nativo. Elegir el certificado de confianza correcto antes de ejecutar; no se incluye aquí una clave ni archivo privado.

También se puede escoger la carpeta como argumento, sin modificar código:

```powershell
npm run backup:manual -- 'C:\Backups Floristeria Anabelle'
```

La ruta anterior es solo un ejemplo. El equivalente es `node supabase/backup/manual-backup.mjs`; ambos usan las variables privadas de la sesión. No se ejecutó un backup productivo durante esta revisión.

## Qué queda protegido

Un archivo custom de PostgreSQL contiene esquema y datos necesarios para restaurar: productos, pedidos, clientes, pagos, inventario/lotes/reservas, caja/devoluciones, promociones, configuración, QR 1/QR 2 y snapshots, más Auth y metadatos/historial. Se incluyen `public`, `auth`, `storage` metadata y `supabase_migrations`. Se conserva estructura comercial, secuencias, funciones, triggers, índices, constraints, RLS/policies y grants. Se utiliza un único `pg_dump`, no consultas parciales ni datos inventados. [Formato oficial pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html).

**Las imágenes de productos y de QR no se copian.** Los registros de rutas/URLs permanecen en el dump; después de perder Storage será necesario volver a subir las imágenes. Un restore de DB no convierte esas URLs en archivos recuperados. Mantener los archivos originales de imágenes por el procedimiento manual que decida el propietario.

Fuera del dump: archivos `.env`, código, contraseñas de roles DB, secrets/JWT/SMTP/OAuth, configuración de proyecto/Vercel/dominios/certificados, otros esquemas y jobs pg_cron. Mantener esa configuración en un inventario privado independiente. Después de recuperar negocio, recrear supervisadamente el job de expiración si corresponde, sin reejecutar una migración entera ni activar emails/mensajes automáticamente.

## Formato y comprobación

Salida:

```text
floristeria-anabelle-AAAA-MM-DDTHH-MM-SS-mmmZ-<sufijo>.dump.enc
floristeria-anabelle-AAAA-MM-DDTHH-MM-SS-mmmZ-<sufijo>.dump.enc.verified.json
```

La herramienta valida el origen, captura en modo lectura, comprueba `pg_restore --list` y contenido de los cuatro esquemas, cifra por streaming AES-256-GCM, verifica SHA-256 de la copia persistida y descifra temporalmente para comparar con el dump original. Solo después crea el manifest. No imprime diagnósticos con passwords/hosts/connection strings ni el contenido del dump. Si falla, limpia únicamente archivos nuevos incompletos de ese intento, nunca copias anteriores. No hay retención automática.

El manifest contiene formato, nombre/fecha, SHA-256/tamaño cifrado, SHA-256 original, esquemas, cifrado y `storage_files=false`. `restore_verified=false` significa que esa copia todavía debe probarse restaurando: TOC/hash/cifrado correctos no sustituyen comprobar datos y Auth. El manifest no contiene claves, passwords ni tokens.

Para comprobar el hash sin abrir la DB:

```powershell
$backupPath = Read-Host 'Ruta absoluta del archivo .dump.enc'
$backupManifest = Get-Content -Raw -LiteralPath ($backupPath + '.verified.json') | ConvertFrom-Json
if ((Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $backupManifest.sha256) {
    throw 'Hash diferente: no restaurar esta copia'
}
```

## Restore exclusivamente LOCAL

1. Seleccionar el backup y verificar hash. Conservar el original; no restaurar contra producción.
2. Crear laboratorio Supabase **LOCAL vacío y desechable**, de versiones compatibles, solo plataforma Auth/Storage, sin migraciones comerciales ni seed. `public`, `auth.users`, buckets/objetos e historial deben estar vacíos.
3. En una sesión privada distinta, establecer `BACKUP_MODE=local`, `PGHOST=127.0.0.1`, puerto DB LOCAL, `PGDATABASE=postgres`, usuario/password locales, clave de descifrado y `RESTORE_DISPOSABLE_LOCAL=YES`. Quitar overrides de conexión. No reutilizar credenciales productivas.
4. Ejecutar `node supabase/backup/restore-local.mjs <ruta-absoluta.dump.enc>`. Rechaza remoto, datos existentes y falta de confirmación. Descifra autenticando GCM; restaura negocio/metadata/Auth sobre estructura de plataforma compatible, conservando propietarios y ACL. Neutraliza defaults antes de crear objetos para no abrir EXECUTE de RPC privados. No importa historiales internos de instalación de Auth/Storage.
5. Comparar tablas/datos/configuración/historial/secuencias. Probar login Auth con cuenta sintética, RLS/policies y ACL de RPC privados. `report_payment_qr` debe conservar anon/authenticated sin EXECUTE y service_role con EXECUTE. Verificar QR 1/QR 2 y snapshots en DB. Las imágenes no están recuperadas.
6. Si falla, guardar diagnóstico privado y descartar el laboratorio parcial; no parchearlo para declarar éxito. No activar jobs/correos externos ni modificar producción.

Con Docker Desktop, `BACKUP_LOCAL_CONTAINER=supabase_db_NOVA-LOCAL-...` utiliza clientes oficiales del contenedor LOCAL. Restore carga Auth/ACL con supabase_admin LOCAL; con clientes nativos necesita contraseña local de ese rol mediante `BACKUP_RESTORE_ADMIN_PASSWORD`. No introducirla por argumentos. `local-backup.mjs` permanece como alias exclusivamente LOCAL del mismo código manual; `qa-manual-backup-local.mjs` y `qa-backup-schema-local.mjs` documentan los ensayos sintéticos reutilizables.

Evidencia histórica de decisiones anteriores: [HISTORY.md](HISTORY.md). Los resultados vigentes de esta simplificación están en [MANUAL_BACKUP_VALIDATION.md](MANUAL_BACKUP_VALIDATION.md). Las evidencias privadas y backups anteriores no se borran al retirar herramientas.
