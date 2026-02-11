# =============================================
# 不要なクローン済みリポジトリを削除するスクリプト
#
# 使い方:
#   # 今日クローンされたリポジトリを一覧表示（削除しない）
#   .\cleanup-cloned-repos.ps1
#
#   # 保持するリポジトリを指定して、残りを削除
#   .\cleanup-cloned-repos.ps1 -Delete -Keep "cross-lib-insight-common","wpf-app-insight-slides"
#
#   # 保持リストをファイルで指定
#   .\cleanup-cloned-repos.ps1 -Delete -KeepFile ".\keep-repos.txt"
#
#   # 今日クローンされたもの全て削除
#   .\cleanup-cloned-repos.ps1 -Delete
# =============================================

param(
    [switch]$Delete,
    [string[]]$Keep = @(),
    [string]$KeepFile,
    [string]$DevRoot = "C:\dev"
)

$ORG = "HarmonicInsight"

# --- Keep リスト構築 ---

$keepSet = [System.Collections.Generic.HashSet[string]]::new(
    [System.StringComparer]::OrdinalIgnoreCase
)

foreach ($r in $Keep) { $null = $keepSet.Add($r) }

if ($KeepFile -and (Test-Path $KeepFile)) {
    Get-Content $KeepFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $null = $keepSet.Add($line)
        }
    }
}

# --- 今日クローンされたリポジトリを検出 ---

$today = (Get-Date).Date

$dirs = Get-ChildItem -Path $DevRoot -Directory | Where-Object {
    $_.CreationTime.Date -eq $today -and
    (Test-Path (Join-Path $_.FullName ".git"))
}

if ($dirs.Count -eq 0) {
    Write-Host "Today cloned repos not found in $DevRoot" -ForegroundColor Green
    exit 0
}

# --- 分類 ---

$toDelete = $dirs | Where-Object { -not $keepSet.Contains($_.Name) }
$toKeep   = $dirs | Where-Object { $keepSet.Contains($_.Name) }

Write-Host ""
Write-Host "=== Cloned today: $($dirs.Count) repos ===" -ForegroundColor Cyan
Write-Host ""

if ($toKeep.Count -gt 0) {
    Write-Host "KEEP ($($toKeep.Count)):" -ForegroundColor Green
    foreach ($d in $toKeep | Sort-Object Name) {
        Write-Host "  $($d.Name)" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "DELETE ($($toDelete.Count)):" -ForegroundColor Red
foreach ($d in $toDelete | Sort-Object Name) {
    Write-Host "  $($d.Name)" -ForegroundColor Red
}
Write-Host ""

if (-not $Delete) {
    Write-Host "Dry run. Add -Delete to actually remove." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor DarkGray
    Write-Host "  .\cleanup-cloned-repos.ps1 -Delete -Keep `"cross-lib-insight-common`",`"wpf-app-insight-slides`"" -ForegroundColor DarkGray
    exit 0
}

# --- 確認 ---

Write-Host "$($toDelete.Count) repos will be PERMANENTLY deleted." -ForegroundColor Red
$confirm = Read-Host "Type 'yes' to confirm"
if ($confirm -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

# --- 削除 ---

$deleted = 0
$errors  = 0

foreach ($d in $toDelete) {
    Write-Host "  DEL $($d.Name) ... " -NoNewline
    try {
        Remove-Item -Path $d.FullName -Recurse -Force -ErrorAction Stop
        Write-Host "OK" -ForegroundColor Green
        $deleted++
    }
    catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "Done: $deleted deleted, $errors failed" -ForegroundColor Cyan
