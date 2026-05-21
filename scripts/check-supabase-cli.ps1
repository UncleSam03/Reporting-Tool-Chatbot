# Pre-flight checks for Supabase CLI setup
$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$BinExe = Join-Path $ProjectRoot ".bin\supabase.exe"
$Checks = @()

function Add-Check($Name, $Ok, $Detail) {
    $script:Checks += [PSCustomObject]@{ Check = $Name; Status = $(if ($Ok) { "PASS" } else { "FAIL" }); Detail = $Detail }
}

Write-Host "=== Supabase CLI checks ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot`n"

# 1. CLI binary
$cli = $null
if (Test-Path $BinExe) {
    $cli = $BinExe
    Add-Check "CLI (local .bin)" $true $BinExe
} else {
    $globalCli = Get-Command supabase -ErrorAction SilentlyContinue
    if ($globalCli) {
        $cli = $globalCli.Source
        Add-Check "CLI (PATH)" $true $cli
    } else {
        $npx = Get-Command npx -ErrorAction SilentlyContinue
        if ($npx) {
            try {
                $ver = & npx supabase --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $cli = "npx supabase"
                    Add-Check "CLI (npx)" $true $ver
                } else { Add-Check "CLI" $false "Not found. Run: .\scripts\install-supabase-cli.ps1" }
            } catch { Add-Check "CLI" $false "Not found. Run: .\scripts\install-supabase-cli.ps1" }
        } else {
            Add-Check "CLI" $false "Not found. Run: .\scripts\install-supabase-cli.ps1"
        }
    }
}

# 2. Node (for npx fallback)
$node = Get-Command node -ErrorAction SilentlyContinue
Add-Check "Node.js" ([bool]$node) $(if ($node) { & node --version } else { "Install Node 20+ for npm/npx method" })

# 3. Docker (for supabase start)
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    try {
        $dver = & docker --version 2>&1
        $running = & docker info 2>&1 | Out-String
        $dockerOk = $running -notmatch "error|cannot connect"
        Add-Check "Docker" $dockerOk $(if ($dockerOk) { $dver } else { "$dver - Docker Desktop not running" })
    } catch { Add-Check "Docker" $false "Docker not responding" }
} else {
    Add-Check "Docker" $false 'Not installed - required for supabase start (local dev)'
}

# 4. Project config
$config = Join-Path $ProjectRoot "supabase\config.toml"
Add-Check "config.toml" (Test-Path $config) $config

$migrations = Join-Path $ProjectRoot "supabase\migrations"
$migCount = if (Test-Path $migrations) { (Get-ChildItem $migrations -Filter "*.sql").Count } else { 0 }
Add-Check "Migrations" ($migCount -gt 0) "$migCount SQL file(s) in supabase/migrations"

# 5. .env
$envFile = Join-Path $ProjectRoot ".env"
$envExample = Join-Path $ProjectRoot ".env.example"
Add-Check ".env file" (Test-Path $envFile) $(if (Test-Path $envFile) { "Present" } else { "Copy .env.example to .env and add keys" })
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    Add-Check "SUPABASE_URL" ($envContent -match "SUPABASE_URL=https?://") "Set in .env"
    Add-Check "SUPABASE_SERVICE_ROLE_KEY" ($envContent -match "SUPABASE_SERVICE_ROLE_KEY=\S+") "Set in .env"
    Add-Check "SUPABASE_ANON_KEY" ($envContent -match "SUPABASE_ANON_KEY=\S+") "Set in .env (for dashboard)"
}

# 6. CLI project commands (if CLI available)
if ($cli) {
    Push-Location $ProjectRoot
    try {
        if ($cli -eq "npx supabase") {
            $help = (& npx supabase --version 2>&1 | Out-String).Trim()
        } else {
            $help = (& $cli --version 2>&1 | Out-String).Trim()
        }
        Add-Check "CLI responds" ($help -match "^\d+\.\d+") $help

        $linkFile = Join-Path $ProjectRoot ".supabase\linked"
        $linked = Test-Path (Join-Path $ProjectRoot "supabase\.temp\project-ref") -ErrorAction SilentlyContinue
        Add-Check "Project linked" $linked 'Run: supabase login; supabase link --project-ref YOUR_REF'
    } finally {
        Pop-Location
    }
}

Write-Host ""
$Checks | Format-Table -AutoSize
$failed = ($Checks | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host ""
if ($failed -eq 0) {
    Write-Host "All checks passed." -ForegroundColor Green
} else {
    Write-Host "$failed check(s) need attention. See SUPABASE_SETUP.md" -ForegroundColor Yellow
}
