$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if ((git branch --show-current).Trim() -ne 'desarrollo-auditoria') { throw 'Rama incorrecta.' }
$demoRoot = Join-Path $env:LOCALAPPDATA 'NOVA-Floreria\catalogo-demo'
if (Test-Path (Join-Path $demoRoot 'supabase\.temp\project-ref')) { throw 'No se admiten enlaces remotos.' }
if ((Get-Content (Join-Path $demoRoot 'supabase\config.toml') -Raw) -notmatch 'project_id = "NOVA-LOCAL-CATALOGO-DEMO"') { throw 'Identidad incorrecta.' }
$demoKeys = Get-Content (Join-Path $demoRoot 'status.private.json') -Raw | ConvertFrom-Json
if ($demoKeys.API_URL -ne 'http://127.0.0.1:50621') { throw 'Destino no autorizado.' }
if (Get-NetTCPConnection -State Listen -LocalPort 3117 -ErrorAction SilentlyContinue) { throw '3117 ocupado; detener exclusivamente el servidor web anterior antes de continuar.' }
$env:NEXT_PUBLIC_SUPABASE_URL = $demoKeys.API_URL
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $demoKeys.ANON_KEY
$env:SUPABASE_SECRET_KEY = $demoKeys.SERVICE_ROLE_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $demoKeys.SERVICE_ROLE_KEY
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3117'
$env:NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3117'
$env:NOVA_LOCAL_LAB = 'true'
npm run dev -- --webpack --hostname 127.0.0.1 --port 3117
exit $LASTEXITCODE
