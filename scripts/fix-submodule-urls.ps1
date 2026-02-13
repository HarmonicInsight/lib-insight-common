# =============================================
# HarmonicInsight サブモジュールURL一括修正スクリプト
#
# .gitmodules の誤った URL（cross-cross-lib-insight-common 等）を
# 正しい URL（cross-lib-insight-common）に一括修正します。
#
# 使い方:
#   .\scripts\fix-submodule-urls.ps1                    # ドライラン（確認のみ）
#   .\scripts\fix-submodule-urls.ps1 -Execute           # 修正実行
#   .\scripts\fix-submodule-urls.ps1 -Execute -Commit   # 修正+コミット
#   .\scripts\fix-submodule-urls.ps1 -DevRoot "D:\dev"  # 別ディレクトリ
# =============================================

param(
    [switch]$Execute,
    [switch]$Commit,
    [string]$DevRoot = "C:\dev"
)

$CORRECT_URL = "https://github.com/HarmonicInsight/cross-lib-insight-common.git"

# 修正対象パターン（正規表現）
$BAD_PATTERNS = @(
    # cross- が重複している場合
    "https://github\.com/HarmonicInsight/cross-cross-lib-insight-common\.git"
    # 旧リポジトリ名（リネーム前）
    "https://github\.com/HarmonicInsight/lib-insight-common\.git"
)

Write-Host ""
Write-Host "=== HarmonicInsight Submodule URL Fix ===" -ForegroundColor Blue
if ($Execute) {
    Write-Host "MODE: EXECUTE" -ForegroundColor Yellow
} else {
    Write-Host "MODE: DRY RUN" -ForegroundColor Cyan
}
Write-Host "Target: $DevRoot" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $DevRoot)) {
    Write-Host "ERROR: $DevRoot not found" -ForegroundColor Red
    exit 1
}

$found = 0
$fixed = 0
$alreadyOk = 0
$errors = 0

# DevRoot 内の全ディレクトリを走査
$dirs = Get-ChildItem -Path $DevRoot -Directory | Where-Object { $_.Name -ne "cross-lib-insight-common" }

foreach ($dir in $dirs) {
    $gitmodulesPath = Join-Path $dir.FullName ".gitmodules"

    if (-not (Test-Path $gitmodulesPath)) {
        continue
    }

    $content = Get-Content $gitmodulesPath -Raw

    # insight-common サブモジュールが含まれているか確認
    if ($content -notmatch "insight-common") {
        continue
    }

    $found++

    # 既に正しいURLかチェック
    if ($content -match [regex]::Escape($CORRECT_URL)) {
        $needsFix = $false
        foreach ($pattern in $BAD_PATTERNS) {
            if ($content -match $pattern) {
                $needsFix = $true
                break
            }
        }
        if (-not $needsFix) {
            Write-Host "  OK   $($dir.Name)" -ForegroundColor Green
            $alreadyOk++
            continue
        }
    }

    # 問題のあるURLを検出
    $currentUrl = ""
    if ($content -match 'url\s*=\s*(https://github\.com/HarmonicInsight/[^\s]+)') {
        $currentUrl = $Matches[1]
    }

    if ($currentUrl -eq $CORRECT_URL) {
        Write-Host "  OK   $($dir.Name)" -ForegroundColor Green
        $alreadyOk++
        continue
    }

    Write-Host "  FIX  $($dir.Name)" -ForegroundColor Yellow
    Write-Host "       Current: $currentUrl" -ForegroundColor DarkYellow
    Write-Host "       Correct: $CORRECT_URL" -ForegroundColor Green

    if ($Execute) {
        try {
            # URL を修正
            $newContent = $content
            foreach ($pattern in $BAD_PATTERNS) {
                $newContent = $newContent -replace $pattern, [regex]::Escape($CORRECT_URL) -replace [regex]::Escape([regex]::Escape($CORRECT_URL)), $CORRECT_URL
            }
            # 汎用: HarmonicInsight/???-insight-common を正しいURLに
            $newContent = $newContent -replace "https://github\.com/HarmonicInsight/[a-z\-]*insight-common\.git", $CORRECT_URL

            Set-Content $gitmodulesPath $newContent -NoNewline

            # git submodule sync
            Push-Location $dir.FullName
            git submodule sync 2>&1 | Out-Null

            # サブモジュール初期化（まだの場合）
            $submodulePath = Join-Path $dir.FullName "insight-common"
            if (-not (Test-Path (Join-Path $submodulePath ".git")) -and -not (Test-Path (Join-Path $submodulePath "CLAUDE.md"))) {
                Write-Host "       Initializing submodule..." -ForegroundColor Cyan
                git submodule update --init --recursive 2>&1 | Out-Null
            }

            if ($Commit) {
                git add .gitmodules
                $hasChanges = git diff --cached --quiet 2>&1; $hasStaged = $LASTEXITCODE -ne 0
                if ($hasStaged) {
                    git commit -m "fix: correct insight-common submodule URL (cross-cross -> cross)" 2>&1 | Out-Null
                    Write-Host "       Committed" -ForegroundColor Green
                }
            }

            Pop-Location
            Write-Host "       Fixed" -ForegroundColor Green
            $fixed++
        }
        catch {
            Write-Host "       ERROR: $_" -ForegroundColor Red
            $errors++
            if ((Get-Location).Path -ne $DevRoot) { Pop-Location }
        }
    }
    else {
        $fixed++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "Results:" -ForegroundColor White
Write-Host "  Repos with submodule: $found"
Write-Host "  Already correct:      $alreadyOk" -ForegroundColor Green
Write-Host "  Need fix / Fixed:     $fixed" -ForegroundColor Yellow
if ($errors -gt 0) {
    Write-Host "  Errors:               $errors" -ForegroundColor Red
}
Write-Host ""

if (-not $Execute -and $fixed -gt 0) {
    Write-Host "To apply fixes:" -ForegroundColor Yellow
    Write-Host "  .\scripts\fix-submodule-urls.ps1 -Execute" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To apply fixes and commit:" -ForegroundColor Yellow
    Write-Host "  .\scripts\fix-submodule-urls.ps1 -Execute -Commit" -ForegroundColor Cyan
}
Write-Host ""
