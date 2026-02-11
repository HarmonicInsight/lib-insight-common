#Requires -RunAsAdministrator
<#
.SYNOPSIS
    HARMONIC insight - Windows 開発環境セットアップスクリプト
.DESCRIPTION
    Claude Code による自動ビルドエラー修正環境を Windows に構築します。
    Node.js, Python, 各種CLI ツール、メッセージングSDKをインストールします。
.NOTES
    管理者権限で実行してください。
    PowerShell 5.1 以上が必要です。
#>

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HARMONIC insight - Windows Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------
# 0. winget 確認
# ---------------------------------------------
Write-Host "[0/9] Checking winget..." -ForegroundColor Yellow
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "      winget not found. Please install App Installer from Microsoft Store." -ForegroundColor Red
    Write-Host "      https://apps.microsoft.com/detail/9NBLGGH4NNS1" -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green

# ---------------------------------------------
# 1. Node.js LTS
# ---------------------------------------------
Write-Host "[1/9] Installing Node.js 24.x LTS..." -ForegroundColor Yellow
winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e 2>$null
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) {
    Write-Host "      Node.js may already be installed or failed. Continuing..." -ForegroundColor DarkYellow
}
# PATH を更新
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 2. Python
# ---------------------------------------------
Write-Host "[2/9] Installing Python 3.13..." -ForegroundColor Yellow
winget install --id Python.Python.3.13 --accept-source-agreements --accept-package-agreements -e 2>$null
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) {
    Write-Host "      Python may already be installed or failed. Continuing..." -ForegroundColor DarkYellow
}
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 3. Git
# ---------------------------------------------
Write-Host "[3/9] Installing Git..." -ForegroundColor Yellow
winget install --id Git.Git --accept-source-agreements --accept-package-agreements -e 2>$null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 4. GitHub CLI
# ---------------------------------------------
Write-Host "[4/9] Installing GitHub CLI..." -ForegroundColor Yellow
winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements -e 2>$null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 5. Azure CLI (Teams Bot用)
# ---------------------------------------------
Write-Host "[5/9] Installing Azure CLI..." -ForegroundColor Yellow
winget install --id Microsoft.AzureCLI --accept-source-agreements --accept-package-agreements -e 2>$null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 6. ngrok
# ---------------------------------------------
Write-Host "[6/9] Installing ngrok..." -ForegroundColor Yellow
winget install --id ngrok.ngrok --accept-source-agreements --accept-package-agreements -e 2>$null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 7. npm グローバルツール
# ---------------------------------------------
Write-Host "[7/9] Installing npm global tools..." -ForegroundColor Yellow
Write-Host "      This may take a few minutes..." -ForegroundColor DarkGray

# npm コマンドが使えるか確認
$npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Path
if (-not $npmPath) {
    Write-Host "      npm not found. Please restart PowerShell and run this script again." -ForegroundColor Red
    exit 1
}

# Claude Code CLI
npm install -g @anthropic-ai/claude-code 2>$null

# Platform CLIs
npm install -g vercel @railway/cli eas-cli supabase 2>$null

# Teams CLI
npm install -g @microsoft/teamsapp-cli 2>$null

# Dev tools
npm install -g typescript ts-node nodemon 2>$null

Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 8. Slack CLI (手動インストール案内)
# ---------------------------------------------
Write-Host "[8/9] Slack CLI..." -ForegroundColor Yellow
Write-Host "      Slack CLI requires manual installation:" -ForegroundColor DarkYellow
Write-Host "      https://api.slack.com/automation/cli/install-windows" -ForegroundColor DarkYellow
Write-Host "      Done" -ForegroundColor Green

# ---------------------------------------------
# 9. 確認
# ---------------------------------------------
Write-Host "[9/9] Verifying installations..." -ForegroundColor Yellow
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installed versions:" -ForegroundColor White
Write-Host "-------------------------------------------" -ForegroundColor DarkGray

$tools = @(
    @{Name="node"; Cmd="node --version"},
    @{Name="npm"; Cmd="npm --version"},
    @{Name="python"; Cmd="python --version"},
    @{Name="git"; Cmd="git --version"},
    @{Name="gh"; Cmd="gh --version"},
    @{Name="az"; Cmd="az --version"},
    @{Name="ngrok"; Cmd="ngrok --version"},
    @{Name="claude"; Cmd="claude --version"},
    @{Name="vercel"; Cmd="vercel --version"},
    @{Name="railway"; Cmd="railway --version"},
    @{Name="eas"; Cmd="eas --version"},
    @{Name="supabase"; Cmd="supabase --version"},
    @{Name="teamsapp"; Cmd="teamsapp --version"}
)

foreach ($tool in $tools) {
    try {
        $version = Invoke-Expression $tool.Cmd 2>$null | Select-Object -First 1
        if ($version) {
            Write-Host ("  {0,-12} {1}" -f "$($tool.Name):", $version) -ForegroundColor Green
        } else {
            Write-Host ("  {0,-12} not installed" -f "$($tool.Name):") -ForegroundColor DarkYellow
        }
    } catch {
        Write-Host ("  {0,-12} not installed" -f "$($tool.Name):") -ForegroundColor DarkYellow
    }
}

Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next steps - Login to services:" -ForegroundColor White
Write-Host ""
Write-Host "  # Required" -ForegroundColor Cyan
Write-Host "  claude login" -ForegroundColor White
Write-Host ""
Write-Host "  # Build Platforms" -ForegroundColor Cyan
Write-Host "  gh auth login       # GitHub" -ForegroundColor White
Write-Host "  vercel login        # Vercel" -ForegroundColor White
Write-Host "  railway login       # Railway" -ForegroundColor White
Write-Host "  eas login           # EAS (Expo)" -ForegroundColor White
Write-Host "  supabase login      # Supabase" -ForegroundColor White
Write-Host ""
Write-Host "  # Messaging Platforms" -ForegroundColor Cyan
Write-Host "  az login            # Azure (for Teams Bot)" -ForegroundColor White
Write-Host "  ngrok authtoken <TOKEN>  # ngrok" -ForegroundColor White
Write-Host ""
Write-Host "  # Messaging SDKs (per project)" -ForegroundColor Cyan
Write-Host "  npm install @line/bot-sdk                    # LINE" -ForegroundColor White
Write-Host "  npm install @slack/bolt @slack/web-api       # Slack" -ForegroundColor White
Write-Host "  npm install botbuilder @microsoft/teams-js   # Teams" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Restart PowerShell to use all tools." -ForegroundColor Yellow
