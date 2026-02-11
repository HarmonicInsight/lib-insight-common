# =============================================
# 変更のあるリポジトリを一括コミット＆プッシュ
#
# 使い方:
#   # ドライラン（何が起きるか確認のみ）
#   .\push-all-changes.ps1
#
#   # 実行
#   .\push-all-changes.ps1 -Execute
# =============================================

param(
    [switch]$Execute,
    [string]$DevRoot = "C:\dev"
)

Write-Host ""
Write-Host "=== Push all local changes to GitHub ===" -ForegroundColor Blue
Write-Host "Target: $DevRoot" -ForegroundColor Cyan
if (-not $Execute) {
    Write-Host "MODE: Dry run (add -Execute to actually push)" -ForegroundColor Yellow
}
Write-Host ""

$dirs = Get-ChildItem -Path $DevRoot -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName ".git")
} | Sort-Object Name

$results = @()

foreach ($d in $dirs) {
    Push-Location $d.FullName
    try {
        # 未コミット変更チェック
        $status = git status --porcelain 2>&1
        $isDirty = ($status | Where-Object { $_ -match "^\s*[MADRCU?!]" }).Count -gt 0

        # 未プッシュコミットチェック
        $ahead = 0
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        $tracking = $null
        if ($branch) {
            $tracking = git rev-parse --abbrev-ref "@{upstream}" 2>$null
            if ($tracking) {
                $aheadCount = git rev-list --count "$tracking..HEAD" 2>$null
                if ($aheadCount) { $ahead = [int]$aheadCount }
            }
        }

        if (-not $isDirty -and $ahead -eq 0) { continue }

        $results += [PSCustomObject]@{
            Name     = $d.Name
            Path     = $d.FullName
            IsDirty  = $isDirty
            Ahead    = $ahead
            Branch   = $branch
            Tracking = $tracking
        }
    }
    finally {
        Pop-Location
    }
}

if ($results.Count -eq 0) {
    Write-Host "All repos are clean. Nothing to push." -ForegroundColor Green
    exit 0
}

# --- 表示 ---

Write-Host "Repos with local changes: $($results.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($r in $results) {
    $actions = @()
    if ($r.IsDirty) { $actions += "commit" }
    if ($r.Ahead -gt 0 -or $r.IsDirty) { $actions += "push" }
    if (-not $r.Tracking) { $actions += "set upstream" }
    $actionStr = $actions -join " + "
    Write-Host "  $($r.Name)  [$($r.Branch)]  -> $actionStr" -ForegroundColor Yellow
}

if (-not $Execute) {
    Write-Host ""
    Write-Host "Dry run complete. Run with -Execute to push." -ForegroundColor Yellow
    exit 0
}

# --- 実行 ---

Write-Host ""
Write-Host "Starting commit & push ..." -ForegroundColor Cyan
Write-Host ""

$pushOk = 0
$pushFail = 0
$failedRepos = @()

foreach ($r in $results) {
    Write-Host "  $($r.Name) ... " -NoNewline
    Push-Location $r.Path
    try {
        # dirty なら commit
        if ($r.IsDirty) {
            git add -A 2>&1 | Out-Null
            $commitMsg = "chore: backup local changes (auto-push)"
            git commit -m $commitMsg --allow-empty 2>&1 | Out-Null
        }

        # push
        $branch = $r.Branch
        if (-not $branch) { $branch = "main" }

        if ($r.Tracking) {
            $pushResult = git push 2>&1
        }
        else {
            $pushResult = git push -u origin $branch 2>&1
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK" -ForegroundColor Green
            $pushOk++
        }
        else {
            Write-Host "FAIL" -ForegroundColor Red
            Write-Host "    $pushResult" -ForegroundColor DarkGray
            $pushFail++
            $failedRepos += $r.Name
        }
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $pushFail++
        $failedRepos += $r.Name
    }
    finally {
        Pop-Location
    }
}

# --- 結果 ---

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "  Pushed:  $pushOk" -ForegroundColor Green
Write-Host "  Failed:  $pushFail" -ForegroundColor $(if ($pushFail -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failedRepos.Count -gt 0) {
    Write-Host "Failed repos (need manual push):" -ForegroundColor Red
    foreach ($name in $failedRepos) {
        Write-Host "  $name" -ForegroundColor Red
    }
    Write-Host ""
}
