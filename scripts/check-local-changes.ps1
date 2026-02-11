# =============================================
# ローカルの未プッシュ変更を検出するスクリプト
#
# 使い方:
#   .\check-local-changes.ps1
#   .\check-local-changes.ps1 -DevRoot "D:\projects"
#
# 各リポジトリの状態をチェック:
#   - 未コミットの変更（dirty）
#   - 未プッシュのコミット（ahead）
#   - 未追跡ファイル（untracked）
# =============================================

param(
    [string]$DevRoot = "C:\dev"
)

Write-Host ""
Write-Host "=== Checking local changes in $DevRoot ===" -ForegroundColor Blue
Write-Host ""

$dirs = Get-ChildItem -Path $DevRoot -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName ".git")
} | Sort-Object Name

$clean = 0
$dirty = 0
$results = @()

foreach ($d in $dirs) {
    $repoPath = $d.FullName
    $name = $d.Name

    Push-Location $repoPath
    try {
        # 未コミット変更
        $status = git status --porcelain 2>&1
        $hasChanges = ($status | Where-Object { $_ -match "^\s*[MADRCU?!]" }).Count -gt 0

        # 未プッシュコミット
        $ahead = 0
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        if ($branch) {
            $tracking = git rev-parse --abbrev-ref "@{upstream}" 2>$null
            if ($tracking) {
                $aheadCount = git rev-list --count "$tracking..HEAD" 2>$null
                if ($aheadCount) { $ahead = [int]$aheadCount }
            }
            else {
                # tracking branch がない = 全コミットが未プッシュ
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
            $flagStr = $flags -join ", "

            Write-Host "  CHANGED  $name  ($flagStr)" -ForegroundColor Yellow
            $dirty++
            $results += [PSCustomObject]@{
                Name    = $name
                Status  = $flagStr
                Path    = $repoPath
            }
        }
        else {
            $clean++
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "  Clean:   $clean" -ForegroundColor Green
Write-Host "  Changed: $dirty" -ForegroundColor Yellow
Write-Host ""

if ($results.Count -gt 0) {
    Write-Host "WARNING: These repos have local-only changes:" -ForegroundColor Red
    Write-Host ""
    foreach ($r in $results) {
        Write-Host "  $($r.Name)" -ForegroundColor Yellow
        Write-Host "    Status: $($r.Status)" -ForegroundColor DarkGray
        Write-Host "    Path:   $($r.Path)" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "Do NOT delete these until changes are pushed or backed up!" -ForegroundColor Red
}
else {
    Write-Host "All repos are clean. Safe to delete unwanted ones." -ForegroundColor Green
}
Write-Host ""
