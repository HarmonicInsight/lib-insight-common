# =============================================
# HarmonicInsight 全リポジトリ一括クローンスクリプト (PowerShell)
#
# 使い方（どこからでも実行可能）:
#   # Step 1: スクリプトをテンポラリにコピーして実行（推奨）
#   Copy-Item C:\dev\cross-lib-insight-common\scripts\clone-all-repos.ps1 $env:TEMP\clone-all-repos.ps1
#   & $env:TEMP\clone-all-repos.ps1 -Backup
#
#   # またはワンライナー
#   powershell -File C:\dev\cross-lib-insight-common\scripts\clone-all-repos.ps1 -Backup
#
# オプション:
#   -Backup                  既存を C:\dev_backup_YYYYMMDD に退避してからクローン
#   -Clean                   既存を削除してからクローン（確認あり）
#   (なし)                   既存フォルダはスキップ、新規のみクローン
#   -DevRoot "D:\projects"   別ディレクトリにクローン
# =============================================

param(
    [switch]$Backup,
    [switch]$Clean,
    [string]$DevRoot = "C:\dev"
)

$ORG = "HarmonicInsight"

# --- Self-copy: Backup/Clean 時は自分自身をテンポラリにコピーして再実行 ---
# （C:\dev 内から実行した場合、リネーム/削除でスクリプトが消えるのを防止）

$scriptPath = $MyInvocation.MyCommand.Path
$tempScript = Join-Path $env:TEMP "clone-all-repos_running.ps1"

if ($scriptPath -and ($Backup -or $Clean)) {
    $scriptDir = Split-Path $scriptPath -Parent
    $resolvedDevRoot = (Resolve-Path $DevRoot -ErrorAction SilentlyContinue)

    # スクリプトが DevRoot 内にあり、かつまだテンポラリにコピーされていない場合
    if ($resolvedDevRoot -and $scriptDir.StartsWith($resolvedDevRoot.Path) -and ($scriptPath -ne $tempScript)) {
        Write-Host "Script is inside $DevRoot. Copying to temp and re-launching..." -ForegroundColor Yellow
        Copy-Item -Path $scriptPath -Destination $tempScript -Force

        $args = @()
        if ($Backup) { $args += "-Backup" }
        if ($Clean)  { $args += "-Clean" }
        $args += "-DevRoot"
        $args += "`"$DevRoot`""

        & powershell.exe -ExecutionPolicy Bypass -File $tempScript @args
        exit $LASTEXITCODE
    }
}

Write-Host ""
Write-Host "=== HarmonicInsight Clone All Repos ===" -ForegroundColor Blue
Write-Host "Target: $DevRoot" -ForegroundColor Cyan
Write-Host ""

# --- Validation ---

if ($Backup -and $Clean) {
    Write-Host "ERROR: -Backup and -Clean cannot be used together" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "gh CLI not found" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "git not found" -ForegroundColor Red
    exit 1
}

$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "gh CLI not authenticated. Run: gh auth login" -ForegroundColor Red
    exit 1
}
Write-Host "gh CLI auth OK" -ForegroundColor Green

# --- Backup / Clean ---

if (Test-Path $DevRoot) {
    if ($Backup) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupDir = "${DevRoot}_backup_$timestamp"
        Write-Host ""
        Write-Host "Backing up $DevRoot -> $backupDir ..." -ForegroundColor Yellow
        try {
            Rename-Item -Path $DevRoot -NewName $backupDir -ErrorAction Stop
            Write-Host "Backup complete" -ForegroundColor Green
        }
        catch {
            Write-Host "ERROR: Backup failed - $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Hint: Close all terminals/apps using $DevRoot and retry, or run from outside $DevRoot" -ForegroundColor Yellow
            exit 1
        }
    }
    elseif ($Clean) {
        Write-Host ""
        Write-Host "WARNING: This will DELETE $DevRoot" -ForegroundColor Red
        $confirm = Read-Host "Type 'yes' to confirm"
        if ($confirm -ne "yes") {
            Write-Host "Cancelled" -ForegroundColor Yellow
            exit 0
        }
        Write-Host "Deleting $DevRoot ..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $DevRoot -Recurse -Force -ErrorAction Stop
            Write-Host "Deleted" -ForegroundColor Green
        }
        catch {
            Write-Host "ERROR: Delete failed - $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

# Create target directory
if (-not (Test-Path $DevRoot)) {
    New-Item -ItemType Directory -Path $DevRoot -Force | Out-Null
}

# --- Fetch repo list from GitHub ---

Write-Host ""
Write-Host "Fetching repo list from $ORG ..." -ForegroundColor Cyan

$reposJson = gh repo list $ORG --limit 300 --json "name,isArchived,sshUrl" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to fetch repo list" -ForegroundColor Red
    exit 1
}

$repos = $reposJson | ConvertFrom-Json
$activeRepos = $repos | Where-Object { -not $_.isArchived } | Sort-Object name
$archivedRepos = $repos | Where-Object { $_.isArchived } | Sort-Object name

Write-Host "  Active:   $($activeRepos.Count)" -ForegroundColor Green
Write-Host "  Archived: $($archivedRepos.Count)" -ForegroundColor DarkGray
Write-Host ""

# --- Clone active repos ---

$success = 0
$skipped = 0
$failed = 0

Write-Host "--- Cloning active repos ---" -ForegroundColor Blue
Write-Host ""

foreach ($repo in $activeRepos) {
    $name = $repo.name
    $targetPath = Join-Path $DevRoot $name

    if (Test-Path $targetPath) {
        Write-Host "  SKIP $name (already exists)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    Write-Host "  CLONE $name ... " -NoNewline
    $null = git clone "https://github.com/$ORG/$name.git" $targetPath 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK" -ForegroundColor Green
        $success++
    } else {
        Write-Host "FAIL" -ForegroundColor Red
        $failed++
    }
}

# --- Summary ---

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "DONE:" -ForegroundColor Green
Write-Host "  Cloned:   $success"
Write-Host "  Skipped:  $skipped"
Write-Host "  Failed:   $failed"
Write-Host "  Archived: $($archivedRepos.Count) (not cloned)"
Write-Host ""

if ($archivedRepos.Count -gt 0) {
    Write-Host "Archived repos (not cloned):" -ForegroundColor DarkGray
    foreach ($repo in $archivedRepos) {
        Write-Host "  $($repo.name)" -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host "All repos in: $DevRoot" -ForegroundColor Cyan
Write-Host ""
