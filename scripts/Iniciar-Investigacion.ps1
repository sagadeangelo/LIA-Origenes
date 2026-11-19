$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
$EmptyComposeEnv = New-TemporaryFile
try {
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        throw '[Docker] No se encontro docker.exe. Inicia Docker Desktop y abre otra consola.'
    }
    $Motor = docker info --format '{{.OSType}}'
    if ($LASTEXITCODE) {
        throw '[Motor] Docker no responde. Comprueba que Docker Desktop indique Engine running y revisa docker context ls.'
    }
    if ($Motor -ne 'linux') {
        throw '[Motor] PostgreSQL requiere contenedores Linux. Selecciona el motor Linux de Docker Desktop.'
    }
    docker compose version
    if ($LASTEXITCODE) { throw '[Compose] El complemento Docker Compose no esta disponible.' }

    $ComposeArgs = @('compose', '--env-file', $EmptyComposeEnv.FullName, '-f', (Join-Path (Get-Location) 'docker-compose.yml'))
    $Clave = Read-Host 'Clave de PostgreSQL de Origenes (reutiliza la misma en cada inicio)' -AsSecureString
    $Credencial = New-Object System.Management.Automation.PSCredential('origenes', $Clave)
    $env:ORIGENES_PG_PASSWORD = $Credencial.GetNetworkCredential().Password
    if (!$env:ORIGENES_PG_PASSWORD) { throw 'Es necesaria la clave de la biblioteca.' }
    & docker @ComposeArgs config --quiet
    if ($LASTEXITCODE) { throw '[Configuracion] Compose no pudo validar docker-compose.yml. Revisa el mensaje anterior.' }

    Write-Host '[Arranque] PostgreSQL documental en 127.0.0.1:55439'
    & docker @ComposeArgs up -d --wait archivo
    $CodigoArranque = $LASTEXITCODE
    if ($CodigoArranque) {
        Write-Host '[Diagnostico] Estado del servicio archivo:'
        & docker @ComposeArgs ps -a archivo
        $IdArchivo = & docker @ComposeArgs ps -a -q archivo
        if ($IdArchivo) {
            docker inspect --format 'Estado={{.State.Status}} Salida={{.State.ExitCode}} Salud={{if .State.Health}}{{.State.Health.Status}}{{end}}' $IdArchivo
        }
        if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
            Get-NetTCPConnection -LocalPort 55439 -State Listen -ErrorAction SilentlyContinue |
                Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table | Out-Host
        }
        throw "[Arranque] Compose termino con codigo $CodigoArranque. Conserva el primer error que aparece despues de [Arranque]."
    }
    $env:ORIGENES_RESEARCH_DSN = 'postgresql://origenes:' + [Uri]::EscapeDataString($env:ORIGENES_PG_PASSWORD) + '@127.0.0.1:55439/origenes'
    ollama pull embeddinggemma
    if ($LASTEXITCODE) { throw 'No se pudo preparar el modelo en Ollama.' }
    $env:ORIGENES_MODE = 'demo'
    & "$PSScriptRoot/Construir-LIA-Origenes.ps1"
    & "$PSScriptRoot/Iniciar-LIA-Origenes.ps1"
} finally {
    Remove-Item Env:ORIGENES_PG_PASSWORD,Env:ORIGENES_RESEARCH_DSN -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $EmptyComposeEnv.FullName
    Pop-Location
}
