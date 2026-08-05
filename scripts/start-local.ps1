[CmdletBinding()]
param(
  [int]$PiperPort = 5000
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$startPiper = Join-Path $projectRoot 'scripts\start-piper.ps1'

function Test-PiperListener {
  return $null -ne (Get-NetTCPConnection -LocalPort $PiperPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

if (-not (Test-PiperListener)) {
  $piperProcess = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startPiper, '-Port', $PiperPort) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -PassThru

  $piperReady = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if (Test-PiperListener) {
      $piperReady = $true
      break
    }

    if ($piperProcess.HasExited) {
      throw 'Piper berhenti saat startup. Jalankan npm run piper:setup lalu ulangi npm run dev:local.'
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $piperReady) {
    throw 'Piper tidak siap dalam 30 detik. Periksa instalasi voice lalu ulangi npm run dev:local.'
  }
}

$env:PIPER_BASE_URL = "http://127.0.0.1:$PiperPort"
Write-Host "Piper siap di $env:PIPER_BASE_URL. Menjalankan Next.js..."
& npm run dev
