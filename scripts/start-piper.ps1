[CmdletBinding()]
param(
  [string]$Voice = 'id_ID-news_tts-medium',
  [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $projectRoot '.tools\piper\Scripts\python.exe'
$voiceRoot = Join-Path $projectRoot '.tools\piper-voices'

function Test-PiperListener {
  return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

if (Test-PiperListener) {
  Write-Host "Piper sudah berjalan di http://127.0.0.1:$Port."
  exit 0
}

if (-not (Test-Path $python)) {
  throw 'Piper belum dipasang. Jalankan .\scripts\setup-piper.ps1 terlebih dahulu.'
}

if (-not (Test-Path (Join-Path $voiceRoot "$Voice.onnx")) -or -not (Test-Path (Join-Path $voiceRoot "$Voice.onnx.json"))) {
  throw "Voice Piper '$Voice' belum siap. Jalankan .\scripts\setup-piper.ps1 terlebih dahulu."
}

& $python -m piper.http_server -m $Voice --data-dir $voiceRoot --host 127.0.0.1 --port $Port
