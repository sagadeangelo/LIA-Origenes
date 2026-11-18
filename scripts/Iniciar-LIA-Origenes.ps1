$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if (!(Test-Path 'frontend/dist/index.html') -or !(Test-Path '.venv/Scripts/python.exe')) {
        & "$PSScriptRoot/Construir-LIA-Origenes.ps1"
    }
    Write-Host 'LIA Origenes: http://127.0.0.1:8113'
    & .\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8113
    if ($LASTEXITCODE) { throw 'El servidor se detuvo con error.' }
} finally { Pop-Location }
