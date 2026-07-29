[CmdletBinding()]
param(
  [string]$Voice = 'id_ID-news_tts-medium',
  [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $projectRoot '.tools\piper\Scripts\python.exe'
$voiceRoot = Join-Path $projectRoot '.tools\piper-voices'

if (-not (Test-Path $python)) {
  throw 'Piper belum dipasang. Jalankan .\scripts\setup-piper.ps1 terlebih dahulu.'
}

& $python -m piper.http_server -m $Voice --data-dir $voiceRoot --host 127.0.0.1 --port $Port
