# Installs Supabase CLI locally into .bin/ (no admin required)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$BinDir = Join-Path $ProjectRoot ".bin"
$ZipUrl = "https://github.com/supabase/cli/releases/download/v2.101.0/supabase_2.101.0_windows_amd64.zip"
$ZipPath = Join-Path $env:TEMP "supabase_cli.zip"

Write-Host "Downloading Supabase CLI v2.101.0..."
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

Write-Host "Extracting to $BinDir..."
Expand-Archive -Path $ZipPath -DestinationPath $BinDir -Force
Remove-Item $ZipPath -Force

$Exe = Join-Path $BinDir "supabase.exe"
if (-not (Test-Path $Exe)) {
    throw "supabase.exe not found after extract. Check $BinDir"
}

& $Exe --version
Write-Host ""
Write-Host "Installed: $Exe"
Write-Host "Run checks: .\scripts\check-supabase-cli.ps1"
