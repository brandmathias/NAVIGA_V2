[CmdletBinding()]
param(
  [string]$Voice = 'id_ID-news_tts-medium'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$piperRoot = Join-Path $projectRoot '.tools\piper'
$voiceRoot = Join-Path $projectRoot '.tools\piper-voices'
$python = Join-Path $piperRoot 'Scripts\python.exe'

if (-not (Test-Path $python)) {
  py -3 -m venv $piperRoot
  if ($LASTEXITCODE -ne 0) {
    throw 'Gagal membuat virtual environment Piper.'
  }
}

& $python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
  throw 'Gagal memperbarui pip untuk Piper.'
}

& $python -m pip install 'piper-tts[http]==1.5.0'
if ($LASTEXITCODE -ne 0) {
  throw 'Gagal memasang paket Piper.'
}

& $python -m piper.download_voices --data-dir $voiceRoot $Voice
if ($LASTEXITCODE -ne 0) {
  throw "Gagal mengunduh suara Piper: $Voice"
}

Write-Host "Piper siap. Jalankan .\scripts\start-piper.ps1 untuk memulai layanan lokal."
