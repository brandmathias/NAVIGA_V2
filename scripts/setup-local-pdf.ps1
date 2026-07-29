[CmdletBinding()]
param(
  [string]$PythonCommand = 'py'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$venvPath = Join-Path $projectRoot '.tools\rapid-doc'
$python = Join-Path $venvPath 'Scripts\python.exe'

if (-not (Test-Path -LiteralPath $python)) {
  & $PythonCommand -3 -m venv $venvPath
  if ($LASTEXITCODE -ne 0) {
    throw 'Gagal membuat virtual environment RapidDoc.'
  }
}

& $python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
  throw 'Gagal memperbarui pip untuk RapidDoc.'
}

& $python -m pip install --retries 8 --resume-retries 8 --timeout 120 'pypdf>=6,<7' 'rapid-doc[cpu]==0.9.9'
if ($LASTEXITCODE -ne 0) {
  throw 'Gagal memasang RapidDoc CPU. Periksa koneksi, lalu jalankan skrip ini lagi.'
}

& $python (Join-Path $PSScriptRoot 'rapid-doc-extract.py') --warmup
if ($LASTEXITCODE -ne 0) {
  throw 'RapidDoc terpasang tetapi model lokal belum dapat disiapkan.'
}

Write-Host 'Ekstraksi PDF lokal siap. Jalankan npm run dev lalu impor PDF.'
