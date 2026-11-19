$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
$EmptyComposeEnv = New-TemporaryFile
try {
    $Clave = Read-Host 'Clave de PostgreSQL de Origenes (reutiliza la misma en cada inicio)' -AsSecureString
    $Credencial = New-Object System.Management.Automation.PSCredential('origenes', $Clave)
    $env:ORIGENES_PG_PASSWORD = $Credencial.GetNetworkCredential().Password
    if (!$env:ORIGENES_PG_PASSWORD) { throw 'Es necesaria la clave de la biblioteca.' }
    docker compose --env-file $EmptyComposeEnv.FullName up -d --wait archivo
    if ($LASTEXITCODE) { throw 'PostgreSQL no pudo iniciar.' }
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
