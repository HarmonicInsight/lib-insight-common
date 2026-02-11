# =============================================
# 変更のあるリポジトリを安全にバックアップ
#
# 使い方:
#   .\backup-changed-repos.ps1
#   .\backup-changed-repos.ps1 -BackupRoot "D:\dev_backup"
# =============================================

param(
    [string]$DevRoot = "C:\dev",
    [string]$BackupRoot = "C:\dev_old_backup"
)

Write-Host ""
Write-Host "=== Backup repos with local changes ===" -ForegroundColor Blue
Write-Host "From: $DevRoot" -ForegroundColor Cyan
Write-Host "To:   $BackupRoot" -ForegroundColor Cyan
Write-Host ""

$dirs = Get-ChildItem -Path $DevRoot -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName ".git")
} | Sort-Object Name

# --- 変更のあるリポジトリを検出 ---

$changed = @()

foreach ($d in $dirs) {
    Push-Location $d.FullName
    try {
        $status = git status --porcelain 2>&1
        $hasChanges = ($status | Where-Object { $_ -match "^\s*[MADRCU?!]" }).Count -gt 0

        $ahead = 0
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        if ($branch) {
            $tracking = git rev-parse --abbrev-ref "@{upstream}" 2>$null
            if ($tracking) {
                $aheadCount = git rev-list --count "$tracking..HEAD" 2>$null
                if ($aheadCount) { $ahead = [int]$aheadCount }
            }
            else {
                $commitCount = git rev-list --count HEAD 2>$null
                if ($commitCount -and [int]$commitCount -gt 0) {
                    $ahead = [int]$commitCount
                }
            }
        }

        if ($hasChanges -or $ahead -gt 0) {
            $flags = @()
            if ($hasChanges) { $flags += "dirty" }
            if ($ahead -gt 0) { $flags += "ahead:$ahead" }
            $changed += [PSCustomObject]@{
                Name   = $d.Name
                Status = ($flags -join ", ")
                Path   = $d.FullName
            }
        }
    }
    finally {
        Pop-Location
    }
}

if ($changed.Count -eq 0) {
    Write-Host "No repos with local changes found." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($changed.Count) repos with local changes:" -ForegroundColor Yellow
Write-Host ""
foreach ($r in $changed) {
    Write-Host "  $($r.Name)  ($($r.Status))" -ForegroundColor Yellow
}
Write-Host ""

# --- 確認 ---

Write-Host "These will be MOVED (not copied) to: $BackupRoot" -ForegroundColor Cyan
$confirm = Read-Host "Type 'yes' to proceed"
if ($confirm -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

# --- バックアップ先作成 ---

if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

# --- 移動 ---

$moved = 0
$errors = 0

foreach ($r in $changed) {
    $dest = Join-Path $BackupRoot $r.Name
    Write-Host "  MOVE $($r.Name) ... " -NoNewline
    try {
        Move-Item -Path $r.Path -Destination $dest -Force -ErrorAction Stop
        Write-Host "OK" -ForegroundColor Green
        $moved++
    }
    catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "  Moved:  $moved" -ForegroundColor Green
Write-Host "  Failed: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Backup location: $BackupRoot" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Review backups in $BackupRoot" -ForegroundColor DarkGray
Write-Host "  2. Push important changes to GitHub" -ForegroundColor DarkGray
Write-Host "  3. Delete $BackupRoot when no longer needed" -ForegroundColor DarkGray
Write-Host ""
