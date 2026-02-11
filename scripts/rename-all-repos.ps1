# =============================================
# HarmonicInsight 全リポジトリ一括リネームスクリプト (PowerShell)
#
# 使い方:
#   .\scripts\rename-all-repos.ps1           # ドライラン
#   .\scripts\rename-all-repos.ps1 -Execute  # 実行
# =============================================

param(
    [switch]$Execute
)

$ORG = "HarmonicInsight"

Write-Host ""
Write-Host "=== HarmonicInsight Repository Rename Tool ===" -ForegroundColor Blue
if ($Execute) {
    Write-Host "MODE: EXECUTE" -ForegroundColor Red
} else {
    Write-Host "MODE: DRY RUN" -ForegroundColor Yellow
}
Write-Host ""

# gh CLI チェック
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "gh CLI が見つかりません" -ForegroundColor Red
    exit 1
}

# 認証チェック
$authResult = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "gh CLI 未認証。gh auth login を実行してください" -ForegroundColor Red
    exit 1
}
Write-Host "gh CLI 認証OK" -ForegroundColor Green
Write-Host ""

# リネームマッピング
$renames = @(
    # cross-
    @("lib-insight-common", "cross-lib-insight-common")
    @("lib-decision-structure", "cross-lib-decision-structure")
    @("releases", "cross-releases")
    @("rpatest", "cross-tool-rpa-test")
    @("insight-youtube-collector", "cross-tool-youtube-collector")
    @("tool-slide-generator", "cross-tool-slide-generator")
    @("tool-mart-generator", "cross-tool-mart-generator")
    @("tool-idea-manager", "cross-tool-idea-manager")
    @("tool-idea-list-web", "cross-tool-idea-list")
    @("tool-contract-admin", "cross-tool-contract-admin")
    @("tool-value-estimator-web", "cross-tool-value-estimator")
    @("app-family-cashflow", "cross-app-family-cashflow")
    @("app-insight-documentor", "cross-app-insight-documentor")
    @("exp-vtuber-course-web", "cross-exp-vtuber-course")
    @("docs-insight-suite", "cross-docs-insight-suite")
    @("docs-insight-creative", "cross-docs-insight-creative")
    @("kb-task-management", "cross-kb-task-management")
    @("kb-construction", "cross-kb-construction")
    @("kb-book-output", "cross-kb-book-output")
    @("01_books", "cross-kb-books")

    # win-
    @("app-Insight-bot-C", "win-app-insight-bot")
    @("app-Insight-slide", "win-app-insight-slide")
    @("app-Insight-doc", "win-app-insight-doc")
    @("app-Insight-excel", "win-app-insight-sheet")
    @("app-harmonic-sheet", "win-app-insight-sheet-senior")
    @("app-nocode-analyzer-C", "win-app-nocode-analyzer")
    @("app-insight-image-gen-C", "win-app-insight-image-gen")
    @("app-insight-movie-gen-win-C", "win-app-insight-movie-gen")
    @("app-insight-py-win", "win-app-insight-py")
    @("app-insight-py-pro-win", "win-app-insight-py-pro")
    @("Insight-launcher", "win-app-insight-launcher")
    @("insight-pinboard", "win-app-insight-pinboard")
    @("app-insight-sales-win", "win-app-insight-sales")
    @("app-forguncy-win", "win-app-forguncy")
    @("app-Insight-management-finance", "win-app-insight-management-finance")
    @("app-Insight-requirements", "win-app-insight-requirements")
    @("tool-file-history-manager", "win-tool-file-history-manager")
    @("tool-Insight-factory-win", "win-tool-insight-factory")

    # web-
    @("app-auto-interview-web", "web-app-auto-interview")
    @("app-insight-bi-web", "web-app-insight-bi")
    @("app-insight-diagnosis-web", "web-app-insight-diagnosis")
    @("Insgight-browser-AI", "web-app-insight-browser-ai")
    @("Insight-QR", "web-app-insight-qr")
    @("InsightDigestDiary", "web-app-insight-digest-diary")
    @("InsightTidy", "web-app-insight-tidy")
    @("Insight-Sharing", "web-app-insight-sharing")
    @("Insight-Process", "web-app-insight-process")
    @("app-InsightChatBot-web", "web-app-insight-chatbot")
    @("app-Insight-learning", "web-app-insight-learning")
    @("app-Insight-keeper-C", "web-app-insight-keeper")
    @("app-insight-reports-web", "web-app-insight-reports")
    @("app-insight-bom-web", "web-app-insight-bom")
    @("app-insight-manage-storiesgame-web", "web-app-insight-stories-game")
    @("app-query-licence-management-web", "web-app-query-license-management")
    @("app-nocode-analyzer-web", "web-app-nocode-analyzer")
    @("app-issue-management-web", "web-app-issue-management")
    @("app-construction-kpi-web", "web-app-construction-kpi")
    @("app-const-level-web", "web-app-const-level")
    @("app-human-management-web", "web-app-human-management")
    @("app-security-check-all", "web-app-security-check")
    @("app-family-schedule-web", "web-app-family-schedule")
    @("app-schedule-generaror", "web-app-schedule-generator")
    @("app-logic-dojo-web", "web-app-logic-dojo")
    @("app-harmonic-novels-web", "web-app-harmonic-novels")
    @("app-toko-bi-web", "web-app-toko-bi")
    @("app-consul-evaluate-web", "web-app-consul-evaluate")
    @("app-minpakuiot-web", "web-app-minpaku-iot")
    @("Live2D-Talker", "web-app-live2d-talker")
    @("Live2D-Interview", "web-app-live2d-interview")
    @("arcana-code", "web-app-arcana-code")
    @("gcs_management", "web-tool-gcs-management")
    @("Insight-Office.com", "web-site-insight-office")
    @("site-corporate", "web-site-corporate")
    @("site-erik.arthur", "web-site-erik-arthur")

    # android-
    @("Insight-launcher-Android", "android-app-insight-launcher")
    @("Insight-Camera-Android", "android-app-insight-camera")
    @("Insight-Voice-Clock", "android-app-insight-voice-clock")
    @("app-Insight-clip-android", "android-app-insight-clip")
    @("app-android-const", "android-app-construction-education")
    @("app-reader-android", "android-app-reader")
    @("app-manualsnap-android", "android-app-manualsnap")
    @("app-portal-android", "android-app-portal")
    @("app-consul-evaluate-android", "android-app-consul-evaluate")
    @("app-pixie-android", "android-app-pixie")
    @("app-path-numbers-android", "android-app-path-numbers")
    @("app-nback-android", "android-app-nback")
    @("app-horoscope-android", "android-app-horoscope")
    @("app-incline-insight-android", "android-app-incline-insight")
    @("app-gout-water-android", "android-app-gout-water")
    @("app-comu-test-android", "android-app-comu-test")
    @("app-food-medical-android", "android-app-food-medical")

    # ios-
    @("app-intake-checker-ios", "ios-app-intake-checker")
    @("app-incline-insight-ios", "ios-app-incline-insight")
    @("app-angle-insight-ios", "ios-app-angle-insight")
    @("app-insight-movie-ios", "ios-app-insight-movie")

    # mobile-
    @("Insight-Senior-Phone", "mobile-app-insight-senior-phone")
    @("app-voice-memo-mobile", "mobile-app-voice-memo")
    @("app-consul-evaluate-mobile", "mobile-app-consul-evaluate")

    # unity-
    @("app-insight-agent-Unity", "unity-app-insight-agent")

    # archived
    @("app-insight-slide-win", "win-app-insight-slide-legacy")
    @("app-insight-slide-win-C", "win-app-insight-slide-v2")
    @("app-insight-movie-gen-win", "win-app-insight-movie-gen-legacy")
    @("app-insight-image-gen-win", "win-app-insight-image-gen-legacy")
    @("insightbot-orchestrator", "cross-app-insight-bot-orchestrator")
    @("app-blender", "cross-exp-blender")
    @("Exp_Auto_Error_Fix", "cross-exp-auto-error-fix")
    @("app-sns-test", "cross-exp-sns-test")
    @("tool-bizrobo-analyzer", "cross-tool-bizrobo-analyzer")
    @("tool-slide-from-pdf", "cross-tool-slide-from-pdf")
    @("app-voice-task-groq-web", "web-app-voice-task-groq")
    @("app-android-easy-line", "android-app-easy-line")
)

$total = $renames.Count
$success = 0
$skip = 0
$fail = 0

Write-Host "リネーム対象: $total リポジトリ" -ForegroundColor Blue
Write-Host ""

foreach ($pair in $renames) {
    $oldName = $pair[0]
    $newName = $pair[1]

    # 存在チェック
    $null = gh repo view "$ORG/$oldName" --json name 2>&1
    if ($LASTEXITCODE -ne 0) {
        # 既にリネーム済みか
        $null = gh repo view "$ORG/$newName" --json name 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SKIP $oldName -> $newName (already renamed)" -ForegroundColor DarkGray
        } else {
            Write-Host "  SKIP $oldName (not found)" -ForegroundColor Yellow
        }
        $skip++
        continue
    }

    if (-not $Execute) {
        Write-Host "  PLAN $oldName -> " -NoNewline -ForegroundColor Cyan
        Write-Host "$newName" -ForegroundColor Green
        $success++
    } else {
        Write-Host "  EXEC $oldName -> $newName ... " -NoNewline
        $null = gh repo rename $newName --repo "$ORG/$oldName" --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK" -ForegroundColor Green
            $success++
        } else {
            Write-Host "FAIL" -ForegroundColor Red
            $fail++
        }
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
if (-not $Execute) {
    Write-Host "DRY RUN:" -ForegroundColor Green
    Write-Host "  Rename: $success"
    Write-Host "  Skip:   $skip"
    Write-Host ""
    Write-Host "Execute:" -ForegroundColor Yellow
    Write-Host "  .\scripts\rename-all-repos.ps1 -Execute"
} else {
    Write-Host "DONE:" -ForegroundColor Green
    Write-Host "  Success: $success"
    Write-Host "  Skip:    $skip"
    Write-Host "  Fail:    $fail"
    Write-Host ""
    Write-Host "Next:" -ForegroundColor Yellow
    Write-Host "  1. Update local remote URLs (docs/migration-guide-rename.md)"
    Write-Host "  2. Update .gitmodules submodule URLs"
}
Write-Host ""
