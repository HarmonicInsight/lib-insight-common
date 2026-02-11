# =============================================
# HarmonicInsight 全リポジトリ一括クローンスクリプト (PowerShell)
#
# 使い方:
#   .\scripts\clone-all-repos.ps1                          # C:\dev にクローン（既存はスキップ）
#   .\scripts\clone-all-repos.ps1 -Backup                  # 既存を C:\dev_backup_YYYYMMDD に退避してからクローン
#   .\scripts\clone-all-repos.ps1 -Clean                   # 既存を削除してからクローン
#   .\scripts\clone-all-repos.ps1 -DevRoot "D:\projects"   # 別ディレクトリにクローン
# =============================================

param(
    [switch]$Backup,
    [switch]$Clean,
    [string]$DevRoot = "C:\dev"
)

$ORG = "HarmonicInsight"

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
        Rename-Item -Path $DevRoot -NewName $backupDir
        Write-Host "Backup complete" -ForegroundColor Green
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
        Remove-Item -Path $DevRoot -Recurse -Force
        Write-Host "Deleted" -ForegroundColor Green
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
