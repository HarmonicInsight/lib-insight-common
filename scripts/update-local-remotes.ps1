# =============================================
# HarmonicInsight ローカルリポジトリ一括 remote URL 更新 (PowerShell)
#
# リポジトリ名の一括リネーム後、各ローカルPCで実行して
# remote URL・.gitmodules を新しいリポ名に更新するスクリプト。
#
# 使い方:
#   # ドライラン（確認のみ）
#   .\scripts\update-local-remotes.ps1 -BaseDir C:\dev
#
#   # 実行モード
#   .\scripts\update-local-remotes.ps1 -BaseDir C:\dev -Execute
# =============================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BaseDir,
    [switch]$Execute
)

if (-not (Test-Path $BaseDir -PathType Container)) {
    Write-Host "エラー: ディレクトリが存在しません: $BaseDir" -ForegroundColor Red
    exit 1
}

$BaseDir = (Resolve-Path $BaseDir).Path

Write-Host ""
Write-Host "=== HarmonicInsight Local Remote URL Updater ===" -ForegroundColor Blue
if ($Execute) {
    Write-Host "MODE: EXECUTE" -ForegroundColor Red
} else {
    Write-Host "MODE: DRY RUN" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Base directory: $BaseDir" -ForegroundColor Blue
Write-Host ""

# =============================================
# リネームマッピング（rename-all-repos.ps1 と同一）
# =============================================
$renameMap = [ordered]@{
    # cross-
    "lib-insight-common"                  = "cross-lib-insight-common"
    "lib-decision-structure"              = "cross-lib-decision-structure"
    "releases"                            = "cross-releases"
    "rpatest"                             = "cross-tool-rpa-test"
    "insight-youtube-collector"           = "cross-tool-youtube-collector"
    "tool-slide-generator"               = "cross-tool-slide-generator"
    "tool-mart-generator"                = "cross-tool-mart-generator"
    "tool-idea-manager"                  = "cross-tool-idea-manager"
    "tool-idea-list-web"                 = "cross-tool-idea-list"
    "tool-contract-admin"                = "cross-tool-contract-admin"
    "tool-value-estimator-web"           = "cross-tool-value-estimator"
    "app-family-cashflow"                = "cross-app-family-cashflow"
    "app-insight-documentor"             = "cross-app-insight-documentor"
    "exp-vtuber-course-web"              = "cross-exp-vtuber-course"
    "docs-insight-suite"                 = "cross-docs-insight-suite"
    "docs-insight-creative"              = "cross-docs-insight-creative"
    "kb-task-management"                 = "cross-kb-task-management"
    "kb-construction"                    = "cross-kb-construction"
    "kb-book-output"                     = "cross-kb-book-output"
    "01_books"                           = "cross-kb-books"

    # win-
    "app-Insight-bot-C"                  = "win-app-insight-bot"
    "app-Insight-slide"                  = "win-app-insight-slide"
    "app-Insight-doc"                    = "win-app-insight-doc"
    "app-Insight-excel"                  = "win-app-insight-sheet"
    "app-harmonic-sheet"                 = "win-app-insight-sheet-senior"
    "app-nocode-analyzer-C"              = "win-app-nocode-analyzer"
    "app-insight-image-gen-C"            = "win-app-insight-image-gen"
    "app-insight-movie-gen-win-C"        = "win-app-insight-movie-gen"
    "app-insight-py-win"                 = "win-app-insight-py"
    "app-insight-py-pro-win"             = "win-app-insight-py-pro"
    "Insight-launcher"                   = "win-app-insight-launcher"
    "insight-pinboard"                   = "win-app-insight-pinboard"
    "app-insight-sales-win"              = "win-app-insight-sales"
    "app-forguncy-win"                   = "win-app-forguncy"
    "app-Insight-management-finance"     = "win-app-insight-management-finance"
    "app-Insight-requirements"           = "win-app-insight-requirements"
    "tool-file-history-manager"          = "win-tool-file-history-manager"
    "tool-Insight-factory-win"           = "win-tool-insight-factory"

    # web-
    "app-auto-interview-web"             = "web-app-auto-interview"
    "app-insight-bi-web"                 = "web-app-insight-bi"
    "app-insight-diagnosis-web"          = "web-app-insight-diagnosis"
    "Insgight-browser-AI"                = "web-app-insight-browser-ai"
    "Insight-QR"                         = "web-app-insight-qr"
    "InsightDigestDiary"                 = "web-app-insight-digest-diary"
    "InsightTidy"                        = "web-app-insight-tidy"
    "Insight-Sharing"                    = "web-app-insight-sharing"
    "Insight-Process"                    = "web-app-insight-process"
    "app-InsightChatBot-web"             = "web-app-insight-chatbot"
    "app-Insight-learning"               = "web-app-insight-learning"
    "app-Insight-keeper-C"               = "web-app-insight-keeper"
    "app-insight-reports-web"            = "web-app-insight-reports"
    "app-insight-bom-web"                = "web-app-insight-bom"
    "app-insight-manage-storiesgame-web" = "web-app-insight-stories-game"
    "app-query-licence-management-web"   = "web-app-query-license-management"
    "app-nocode-analyzer-web"            = "web-app-nocode-analyzer"
    "app-issue-management-web"           = "web-app-issue-management"
    "app-construction-kpi-web"           = "web-app-construction-kpi"
    "app-const-level-web"                = "web-app-const-level"
    "app-human-management-web"           = "web-app-human-management"
    "app-security-check-all"             = "web-app-security-check"
    "app-family-schedule-web"            = "web-app-family-schedule"
    "app-schedule-generaror"             = "web-app-schedule-generator"
    "app-logic-dojo-web"                 = "web-app-logic-dojo"
    "app-harmonic-novels-web"            = "web-app-harmonic-novels"
    "app-toko-bi-web"                    = "web-app-toko-bi"
    "app-consul-evaluate-web"            = "web-app-consul-evaluate"
    "app-minpakuiot-web"                 = "web-app-minpaku-iot"
    "Live2D-Talker"                      = "web-app-live2d-talker"
    "Live2D-Interview"                   = "web-app-live2d-interview"
    "arcana-code"                        = "web-app-arcana-code"
    "gcs_management"                     = "web-tool-gcs-management"
    "Insight-Office.com"                 = "web-site-insight-office"
    "site-corporate"                     = "web-site-corporate"
    "site-erik.arthur"                   = "web-site-erik-arthur"

    # android-
    "Insight-launcher-Android"           = "android-app-insight-launcher"
    "Insight-Camera-Android"             = "android-app-insight-camera"
    "Insight-Voice-Clock"                = "android-app-insight-voice-clock"
    "app-Insight-clip-android"           = "android-app-insight-clip"
    "app-android-const"                  = "android-app-construction-education"
    "app-reader-android"                 = "android-app-reader"
    "app-manualsnap-android"             = "android-app-manualsnap"
    "app-portal-android"                 = "android-app-portal"
    "app-consul-evaluate-android"        = "android-app-consul-evaluate"
    "app-pixie-android"                  = "android-app-pixie"
    "app-path-numbers-android"           = "android-app-path-numbers"
    "app-nback-android"                  = "android-app-nback"
    "app-horoscope-android"              = "android-app-horoscope"
    "app-incline-insight-android"        = "android-app-incline-insight"
    "app-gout-water-android"             = "android-app-gout-water"
    "app-comu-test-android"              = "android-app-comu-test"
    "app-food-medical-android"           = "android-app-food-medical"

    # ios-
    "app-intake-checker-ios"             = "ios-app-intake-checker"
    "app-incline-insight-ios"            = "ios-app-incline-insight"
    "app-angle-insight-ios"              = "ios-app-angle-insight"
    "app-insight-movie-ios"              = "ios-app-insight-movie"

    # mobile-
    "Insight-Senior-Phone"               = "mobile-app-insight-senior-phone"
    "app-voice-memo-mobile"              = "mobile-app-voice-memo"
    "app-consul-evaluate-mobile"         = "mobile-app-consul-evaluate"

    # unity-
    "app-insight-agent-Unity"            = "unity-app-insight-agent"

    # archived
    "app-insight-slide-win"              = "win-app-insight-slide-legacy"
    "app-insight-slide-win-C"            = "win-app-insight-slide-v2"
    "app-insight-movie-gen-win"          = "win-app-insight-movie-gen-legacy"
    "app-insight-image-gen-win"          = "win-app-insight-image-gen-legacy"
    "insightbot-orchestrator"            = "cross-app-insight-bot-orchestrator"
    "app-blender"                        = "cross-exp-blender"
    "Exp_Auto_Error_Fix"                 = "cross-exp-auto-error-fix"
    "app-sns-test"                       = "cross-exp-sns-test"
    "tool-bizrobo-analyzer"              = "cross-tool-bizrobo-analyzer"
    "tool-slide-from-pdf"                = "cross-tool-slide-from-pdf"
    "app-voice-task-groq-web"            = "web-app-voice-task-groq"
    "app-android-easy-line"              = "android-app-easy-line"
}

# =============================================
# メイン処理
# =============================================
$updatedRemote = 0
$updatedSubmodule = 0

foreach ($dir in Get-ChildItem -Path $BaseDir -Directory) {
    $gitDir = Join-Path $dir.FullName ".git"
    if (-not (Test-Path $gitDir)) { continue }

    $repoDir = $dir.FullName
    $folderName = $dir.Name

    # --- 1. remote origin URL の更新 ---
    $currentUrl = git -C $repoDir remote get-url origin 2>$null
    if (-not $currentUrl) { continue }

    # URLからリポ名を抽出
    $currentRepo = ($currentUrl -split '/')[-1] -replace '\.git$', ''

    if ($renameMap.Contains($currentRepo)) {
        $newName = $renameMap[$currentRepo]
        $newUrl = $currentUrl -replace [regex]::Escape($currentRepo), $newName

        if (-not $Execute) {
            Write-Host "  [REMOTE] $folderName" -ForegroundColor Cyan
            Write-Host "    - $currentUrl" -ForegroundColor Red
            Write-Host "    + $newUrl" -ForegroundColor Green
        } else {
            git -C $repoDir remote set-url origin $newUrl
            Write-Host "  [REMOTE] ${folderName}: $currentRepo -> $newName" -ForegroundColor Green
        }
        $updatedRemote++
    }

    # --- 2. .gitmodules の更新 ---
    $gitmodulesPath = Join-Path $repoDir ".gitmodules"
    if (Test-Path $gitmodulesPath) {
        $content = Get-Content $gitmodulesPath -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        $originalContent = $content
        $submoduleChanged = $false

        foreach ($oldName in $renameMap.Keys) {
            $newSubName = $renameMap[$oldName]
            if ($content -match [regex]::Escape($oldName)) {
                if (-not $Execute) {
                    Write-Host "  [SUBMODULE] $folderName/.gitmodules" -ForegroundColor Cyan
                    Write-Host "    - $oldName" -ForegroundColor Red
                    Write-Host "    + $newSubName" -ForegroundColor Green
                }
                $content = $content -replace [regex]::Escape($oldName), $newSubName
                $submoduleChanged = $true
                $updatedSubmodule++
            }
        }

        if ($Execute -and $submoduleChanged) {
            Set-Content -Path $gitmodulesPath -Value $content -NoNewline
            Write-Host "  [SUBMODULE] ${folderName}: .gitmodules を更新" -ForegroundColor Green

            # submodule sync
            git -C $repoDir submodule sync 2>$null

            # コミット
            git -C $repoDir add .gitmodules 2>$null
            $hasDiff = git -C $repoDir diff --cached --quiet .gitmodules 2>$null; $LASTEXITCODE -ne 0
            if ($hasDiff) {
                git -C $repoDir commit -m "chore: update submodule URLs after repository rename" 2>$null
                Write-Host "    コミット済み" -ForegroundColor Green
            }
        }
    }
}

# =============================================
# サマリー
# =============================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
if (-not $Execute) {
    Write-Host "ドライラン完了:" -ForegroundColor Green
    Write-Host "  remote URL 更新対象:   $updatedRemote"
    Write-Host "  .gitmodules 更新対象:  $updatedSubmodule"
    Write-Host ""
    if (($updatedRemote + $updatedSubmodule) -gt 0) {
        Write-Host "実行するには:" -ForegroundColor Yellow
        Write-Host "  .\scripts\update-local-remotes.ps1 -BaseDir $BaseDir -Execute" -ForegroundColor Cyan
    } else {
        Write-Host "更新対象はありませんでした。既に最新の可能性があります。" -ForegroundColor Green
    }
} else {
    Write-Host "実行完了:" -ForegroundColor Green
    Write-Host "  remote URL 更新:   $updatedRemote"
    Write-Host "  .gitmodules 更新:  $updatedSubmodule"
}
Write-Host ""
