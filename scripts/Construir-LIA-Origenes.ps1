$ErrorActionPreference = 'Stop'
$Raiz = Split-Path $PSScriptRoot -Parent
Push-Location $Raiz
try {
    if (!(Test-Path '.venv\Scripts\python.exe')) {
        py -3.12 -m venv .venv
        if ($LASTEXITCODE) { throw 'Fallo al crear el entorno Python 3.12.' }
    }
    & .\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
    if ($LASTEXITCODE) { throw 'Fallo la instalacion del backend.' }
    Push-Location frontend
    try {
        npm.cmd ci --no-audit
        if ($LASTEXITCODE) { throw 'Fallo npm ci.' }
        npm.cmd run build
        if ($LASTEXITCODE) { throw 'Fallo el build Vite.' }
    } finally { Pop-Location }
} finally { Pop-Location }
