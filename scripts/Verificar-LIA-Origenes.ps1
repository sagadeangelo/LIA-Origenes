$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
$ModoAnterior = $env:ORIGENES_MODE
try {
    $env:ORIGENES_MODE = 'demo'
    & "$PSScriptRoot/Construir-LIA-Origenes.ps1"
    & .\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
    if ($LASTEXITCODE) { throw 'Fallaron las pruebas.' }
} finally {
    $env:ORIGENES_MODE = $ModoAnterior
    Pop-Location
}
