# =============================================
# push 失敗リポジトリを pull --rebase してから再 push
#
# 使い方:
#   .\retry-push-with-rebase.ps1
#   .\retry-push-with-rebase.ps1 -Execute
# =============================================

param(
    [switch]$Execute,
    [string]$DevRoot = "C:\dev"
)

$repos = @(
    "web-app-auto-interview",
    "mobile-app-consul-evaluate",
    "mobile-app-voice-memo",
    "win-app-nocode-analyzer",
    "cross-kb-book-output",
    "unity-app-insight-agent",
    "web-app-insight-diagnosis",
    "win-app-insight-py",
    "mobile-app-insight-senior-phone",
    "web-app-insight-tidy",
    "win-tool-insight-factory",
    "win-app-forguncy"
)

Write-Host ""
Write-Host "=== Retry push with rebase ($($repos.Count) repos) ===" -ForegroundColor Blue
Write-Host ""

if (-not $Execute) {
    Write-Host "Will pull --rebase and push:" -ForegroundColor Yellow
    foreach ($name in $repos) {
        Write-Host "  $name" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Dry run. Add -Execute to proceed." -ForegroundColor Yellow
    exit 0
}

$ok = 0
$fail = 0
$failedRepos = @()

foreach ($name in $repos) {
    $repoPath = Join-Path $DevRoot $name
    if (-not (Test-Path $repoPath)) {
        Write-Host "  SKIP $name (not found)" -ForegroundColor DarkGray
        continue
    }

    Write-Host "  $name ... " -NoNewline
    Push-Location $repoPath
    try {
        # pull --rebase
        $pullResult = git pull --rebase 2>&1
        if ($LASTEXITCODE -ne 0) {
            # rebase conflict の場合は abort して報告
            git rebase --abort 2>&1 | Out-Null
            Write-Host "FAIL (rebase conflict)" -ForegroundColor Red
            Write-Host "    $pullResult" -ForegroundColor DarkGray
            $fail++
            $failedRepos += $name
            continue
        }

        # push
        $pushResult = git push 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK" -ForegroundColor Green
            $ok++
        }
        else {
            Write-Host "FAIL (push)" -ForegroundColor Red
            Write-Host "    $pushResult" -ForegroundColor DarkGray
            $fail++
            $failedRepos += $name
        }
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $fail++
        $failedRepos += $name
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "  OK:     $ok" -ForegroundColor Green
Write-Host "  Failed: $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })

if ($failedRepos.Count -gt 0) {
    Write-Host ""
    Write-Host "Still failed (need manual fix):" -ForegroundColor Red
    foreach ($name in $failedRepos) {
        Write-Host "  $name" -ForegroundColor Red
    }
}
Write-Host ""
