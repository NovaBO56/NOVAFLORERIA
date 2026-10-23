param([switch]$Build)
$ErrorActionPreference = 'Stop'
$taskRepo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRepo
if ((git branch --show-current).Trim() -ne 'desarrollo-auditoria') {
    throw 'Rama incorrecta. No se iniciaron servicios.'
}
$taskLab = Join-Path $env:LOCALAPPDATA 'NOVA-Floreria\inventory-refunds-final-replay'
if (Test-Path -LiteralPath (Join-Path $taskLab 'supabase\.temp\project-ref')) {
    throw 'El laboratorio debe estar desvinculado de proyectos remotos.'
}
$taskConfig = Get-Content -Raw -LiteralPath (Join-Path $taskLab 'supabase\config.toml')
if ($taskConfig -notmatch 'project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"') { throw 'Laboratorio incorrecto.' }
$taskKeys = Get-Content -Raw -LiteralPath (Join-Path $taskLab 'status.private.json') | ConvertFrom-Json
$taskAccess = Get-Content -Raw -LiteralPath (Join-Path $taskLab 'lab50-access.private.json') | ConvertFrom-Json
if ($taskKeys.API_URL -ne 'http://127.0.0.1:62621') { throw 'Supabase debe ser exclusivamente LOCAL.' }
$taskLocalHosts = @('127.0.0.1', 'localhost') + @(Get-NetIPAddress | Select-Object -ExpandProperty IPAddress)
foreach ($taskTarget in @(@{ Value = $taskAccess.webUrl; Port = 3116 }, @{ Value = $taskAccess.supabaseUrl; Port = 62621 })) {
    $taskUri = [Uri]$taskTarget.Value
    if ($taskUri.Scheme -ne 'http' -or $taskUri.Port -ne $taskTarget.Port -or $taskUri.Host -notin $taskLocalHosts -or $taskUri.UserInfo -or $taskUri.AbsolutePath -ne '/' -or $taskUri.Query -or $taskUri.Fragment) {
        throw 'La IP configurada ya no pertenece a esta computadora, o el puerto no es el del laboratorio. Revisar configuración privada antes de continuar.'
    }
}
# Override every Supabase variable consumed by the application before Next loads
# .env.local. Credentials stay in this process and in the existing private file.
$env:NEXT_PUBLIC_SUPABASE_URL = $taskAccess.supabaseUrl
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $taskKeys.ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $taskKeys.SERVICE_ROLE_KEY
$env:SUPABASE_SECRET_KEY = $taskKeys.SERVICE_ROLE_KEY
$env:NEXT_PUBLIC_SITE_URL = $taskAccess.webUrl
$env:NEXT_PUBLIC_APP_URL = $taskAccess.webUrl
$env:NOVA_LOCAL_LAB = 'true'
if ($Build) {
    npm run build
} else {
    npm run start -- --hostname 0.0.0.0 --port 3116
}
exit $LASTEXITCODE
