#!/bin/bash
# =============================================
# HarmonicInsight ローカルリポジトリ一括 remote URL 更新
#
# リポジトリ名の一括リネーム後、各ローカルPCで実行して
# remote URL・.gitmodules を新しいリポ名に更新するスクリプト。
#
# 使い方:
#   # 1) リポジトリが格納されているベースディレクトリを指定して実行
#   ./scripts/update-local-remotes.sh ~/repos
#   ./scripts/update-local-remotes.sh /c/dev
#
#   # 2) ドライラン（確認のみ、デフォルト）
#   ./scripts/update-local-remotes.sh ~/repos
#
#   # 3) 実行モード
#   ./scripts/update-local-remotes.sh ~/repos --execute
#
# 処理内容:
#   - ベースディレクトリ直下の各フォルダを走査
#   - git remote origin の URL が旧リポ名なら新リポ名に更新
#   - .gitmodules 内の旧リポ名を新リポ名に更新
#   - git submodule sync を実行
#   - .gitmodules の変更を自動コミット
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m'

ORG="HarmonicInsight"
DRY_RUN=true

# =============================================
# 引数解析
# =============================================
BASE_DIR=""
for arg in "$@"; do
    case "$arg" in
        --execute) DRY_RUN=false ;;
        --help|-h)
            echo "Usage: $0 <base-directory> [--execute]"
            echo ""
            echo "  base-directory  リポジトリが格納されているディレクトリ"
            echo "  --execute       実行モード（省略時はドライラン）"
            exit 0
            ;;
        *) BASE_DIR="$arg" ;;
    esac
done

if [ -z "$BASE_DIR" ]; then
    echo -e "${RED}エラー: ベースディレクトリを指定してください${NC}"
    echo "Usage: $0 <base-directory> [--execute]"
    echo "例:    $0 ~/repos --execute"
    exit 1
fi

if [ ! -d "$BASE_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが存在しません: ${BASE_DIR}${NC}"
    exit 1
fi

# 絶対パスに変換
BASE_DIR="$(cd "$BASE_DIR" && pwd)"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  HarmonicInsight Local Remote URL Updater                    ║${NC}"
if $DRY_RUN; then
echo -e "${YELLOW}║  MODE: DRY RUN（確認のみ・変更なし）                          ║${NC}"
else
echo -e "${RED}║  MODE: EXECUTE（実行モード）                                  ║${NC}"
fi
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Base directory: ${BLUE}${BASE_DIR}${NC}"
echo ""

# =============================================
# リネームマッピング（rename-all-repos.sh と同一）
# =============================================
declare -A RENAME_MAP

# cross-
RENAME_MAP["lib-insight-common"]="cross-lib-insight-common"
RENAME_MAP["lib-decision-structure"]="cross-lib-decision-structure"
RENAME_MAP["releases"]="cross-releases"
RENAME_MAP["rpatest"]="cross-tool-rpa-test"
RENAME_MAP["insight-youtube-collector"]="cross-tool-youtube-collector"
RENAME_MAP["tool-slide-generator"]="cross-tool-slide-generator"
RENAME_MAP["tool-mart-generator"]="cross-tool-mart-generator"
RENAME_MAP["tool-idea-manager"]="cross-tool-idea-manager"
RENAME_MAP["tool-idea-list-web"]="cross-tool-idea-list"
RENAME_MAP["tool-contract-admin"]="cross-tool-contract-admin"
RENAME_MAP["tool-value-estimator-web"]="cross-tool-value-estimator"
RENAME_MAP["app-family-cashflow"]="cross-app-family-cashflow"
RENAME_MAP["app-insight-documentor"]="cross-app-insight-documentor"
RENAME_MAP["exp-vtuber-course-web"]="cross-exp-vtuber-course"
RENAME_MAP["docs-insight-suite"]="cross-docs-insight-suite"
RENAME_MAP["docs-insight-creative"]="cross-docs-insight-creative"
RENAME_MAP["kb-task-management"]="cross-kb-task-management"
RENAME_MAP["kb-construction"]="cross-kb-construction"
RENAME_MAP["kb-book-output"]="cross-kb-book-output"
RENAME_MAP["01_books"]="cross-kb-books"

# win-
RENAME_MAP["app-Insight-bot-C"]="win-app-insight-bot"
RENAME_MAP["app-Insight-slide"]="win-app-insight-slide"
RENAME_MAP["app-Insight-doc"]="win-app-insight-doc"
RENAME_MAP["app-Insight-excel"]="win-app-insight-sheet"
RENAME_MAP["app-harmonic-sheet"]="win-app-insight-sheet-senior"
RENAME_MAP["app-nocode-analyzer-C"]="win-app-nocode-analyzer"
RENAME_MAP["app-insight-image-gen-C"]="win-app-insight-image-gen"
RENAME_MAP["app-insight-movie-gen-win-C"]="win-app-insight-movie-gen"
RENAME_MAP["app-insight-py-win"]="win-app-insight-py"
RENAME_MAP["app-insight-py-pro-win"]="win-app-insight-py-pro"
RENAME_MAP["Insight-launcher"]="win-app-insight-launcher"
RENAME_MAP["insight-pinboard"]="win-app-insight-pinboard"
RENAME_MAP["app-insight-sales-win"]="win-app-insight-sales"
RENAME_MAP["app-forguncy-win"]="win-app-forguncy"
RENAME_MAP["app-Insight-management-finance"]="win-app-insight-management-finance"
RENAME_MAP["app-Insight-requirements"]="win-app-insight-requirements"
RENAME_MAP["tool-file-history-manager"]="win-tool-file-history-manager"
RENAME_MAP["tool-Insight-factory-win"]="win-tool-insight-factory"

# web-
RENAME_MAP["app-auto-interview-web"]="web-app-auto-interview"
RENAME_MAP["app-insight-bi-web"]="web-app-insight-bi"
RENAME_MAP["app-insight-diagnosis-web"]="web-app-insight-diagnosis"
RENAME_MAP["Insgight-browser-AI"]="web-app-insight-browser-ai"
RENAME_MAP["Insight-QR"]="web-app-insight-qr"
RENAME_MAP["InsightDigestDiary"]="web-app-insight-digest-diary"
RENAME_MAP["InsightTidy"]="web-app-insight-tidy"
RENAME_MAP["Insight-Sharing"]="web-app-insight-sharing"
RENAME_MAP["Insight-Process"]="web-app-insight-process"
RENAME_MAP["app-InsightChatBot-web"]="web-app-insight-chatbot"
RENAME_MAP["app-Insight-learning"]="web-app-insight-learning"
RENAME_MAP["app-Insight-keeper-C"]="web-app-insight-keeper"
RENAME_MAP["app-insight-reports-web"]="web-app-insight-reports"
RENAME_MAP["app-insight-bom-web"]="web-app-insight-bom"
RENAME_MAP["app-insight-manage-storiesgame-web"]="web-app-insight-stories-game"
RENAME_MAP["app-query-licence-management-web"]="web-app-query-license-management"
RENAME_MAP["app-nocode-analyzer-web"]="web-app-nocode-analyzer"
RENAME_MAP["app-issue-management-web"]="web-app-issue-management"
RENAME_MAP["app-construction-kpi-web"]="web-app-construction-kpi"
RENAME_MAP["app-const-level-web"]="web-app-const-level"
RENAME_MAP["app-human-management-web"]="web-app-human-management"
RENAME_MAP["app-security-check-all"]="web-app-security-check"
RENAME_MAP["app-family-schedule-web"]="web-app-family-schedule"
RENAME_MAP["app-schedule-generaror"]="web-app-schedule-generator"
RENAME_MAP["app-logic-dojo-web"]="web-app-logic-dojo"
RENAME_MAP["app-harmonic-novels-web"]="web-app-harmonic-novels"
RENAME_MAP["app-toko-bi-web"]="web-app-toko-bi"
RENAME_MAP["app-consul-evaluate-web"]="web-app-consul-evaluate"
RENAME_MAP["app-minpakuiot-web"]="web-app-minpaku-iot"
RENAME_MAP["Live2D-Talker"]="web-app-live2d-talker"
RENAME_MAP["Live2D-Interview"]="web-app-live2d-interview"
RENAME_MAP["arcana-code"]="web-app-arcana-code"
RENAME_MAP["gcs_management"]="web-tool-gcs-management"
RENAME_MAP["Insight-Office.com"]="web-site-insight-office"
RENAME_MAP["site-corporate"]="web-site-corporate"
RENAME_MAP["site-erik.arthur"]="web-site-erik-arthur"

# android-
RENAME_MAP["Insight-launcher-Android"]="android-app-insight-launcher"
RENAME_MAP["Insight-Camera-Android"]="android-app-insight-camera"
RENAME_MAP["Insight-Voice-Clock"]="android-app-insight-voice-clock"
RENAME_MAP["app-Insight-clip-android"]="android-app-insight-clip"
RENAME_MAP["app-android-const"]="android-app-construction-education"
RENAME_MAP["app-reader-android"]="android-app-reader"
RENAME_MAP["app-manualsnap-android"]="android-app-manualsnap"
RENAME_MAP["app-portal-android"]="android-app-portal"
RENAME_MAP["app-consul-evaluate-android"]="android-app-consul-evaluate"
RENAME_MAP["app-pixie-android"]="android-app-pixie"
RENAME_MAP["app-path-numbers-android"]="android-app-path-numbers"
RENAME_MAP["app-nback-android"]="android-app-nback"
RENAME_MAP["app-horoscope-android"]="android-app-horoscope"
RENAME_MAP["app-incline-insight-android"]="android-app-incline-insight"
RENAME_MAP["app-gout-water-android"]="android-app-gout-water"
RENAME_MAP["app-comu-test-android"]="android-app-comu-test"
RENAME_MAP["app-food-medical-android"]="android-app-food-medical"

# ios-
RENAME_MAP["app-intake-checker-ios"]="ios-app-intake-checker"
RENAME_MAP["app-incline-insight-ios"]="ios-app-incline-insight"
RENAME_MAP["app-angle-insight-ios"]="ios-app-angle-insight"
RENAME_MAP["app-insight-movie-ios"]="ios-app-insight-movie"

# mobile-
RENAME_MAP["Insight-Senior-Phone"]="mobile-app-insight-senior-phone"
RENAME_MAP["app-voice-memo-mobile"]="mobile-app-voice-memo"
RENAME_MAP["app-consul-evaluate-mobile"]="mobile-app-consul-evaluate"

# unity-
RENAME_MAP["app-insight-agent-Unity"]="unity-app-insight-agent"

# archived
RENAME_MAP["app-insight-slide-win"]="win-app-insight-slide-legacy"
RENAME_MAP["app-insight-slide-win-C"]="win-app-insight-slide-v2"
RENAME_MAP["app-insight-movie-gen-win"]="win-app-insight-movie-gen-legacy"
RENAME_MAP["app-insight-image-gen-win"]="win-app-insight-image-gen-legacy"
RENAME_MAP["insightbot-orchestrator"]="cross-app-insight-bot-orchestrator"
RENAME_MAP["app-blender"]="cross-exp-blender"
RENAME_MAP["Exp_Auto_Error_Fix"]="cross-exp-auto-error-fix"
RENAME_MAP["app-sns-test"]="cross-exp-sns-test"
RENAME_MAP["tool-bizrobo-analyzer"]="cross-tool-bizrobo-analyzer"
RENAME_MAP["tool-slide-from-pdf"]="cross-tool-slide-from-pdf"
RENAME_MAP["app-voice-task-groq-web"]="web-app-voice-task-groq"
RENAME_MAP["app-android-easy-line"]="android-app-easy-line"

# =============================================
# ヘルパー関数
# =============================================

# URLからリポ名を抽出（.git 末尾を除去）
extract_repo_name() {
    local url="$1"
    local name
    name="$(basename "$url")"
    name="${name%.git}"
    echo "$name"
}

# 旧リポ名 → 新リポ名を検索
lookup_new_name() {
    local old_name="$1"
    echo "${RENAME_MAP[$old_name]:-}"
}

# URL内の旧リポ名を新リポ名に置換
replace_repo_in_url() {
    local url="$1"
    local old_name="$2"
    local new_name="$3"
    echo "${url//$old_name/$new_name}"
}

# =============================================
# メイン処理
# =============================================

UPDATED_REMOTE=0
UPDATED_SUBMODULE=0
SKIPPED=0
ERRORS=0

for dir in "$BASE_DIR"/*/; do
    [ -d "$dir/.git" ] || continue

    repo_dir="$(cd "$dir" && pwd)"
    folder_name="$(basename "$repo_dir")"

    # --- 1. remote origin URL の更新 ---
    current_url="$(git -C "$repo_dir" remote get-url origin 2>/dev/null || true)"
    if [ -z "$current_url" ]; then
        continue
    fi

    current_repo="$(extract_repo_name "$current_url")"
    new_name="$(lookup_new_name "$current_repo")"

    if [ -n "$new_name" ] && [ "$current_repo" != "$new_name" ]; then
        new_url="$(replace_repo_in_url "$current_url" "$current_repo" "$new_name")"
        if $DRY_RUN; then
            echo -e "  ${BLUE}[REMOTE]${NC} ${folder_name}"
            echo -e "    ${RED}- ${current_url}${NC}"
            echo -e "    ${GREEN}+ ${new_url}${NC}"
        else
            git -C "$repo_dir" remote set-url origin "$new_url"
            echo -e "  ${GREEN}[REMOTE]${NC} ${folder_name}: ${current_repo} → ${new_name}"
        fi
        ((UPDATED_REMOTE++))
    fi

    # --- 2. .gitmodules の更新 ---
    gitmodules="$repo_dir/.gitmodules"
    if [ -f "$gitmodules" ]; then
        gitmodules_changed=false

        for old_name in "${!RENAME_MAP[@]}"; do
            new_sub_name="${RENAME_MAP[$old_name]}"
            if grep -q "$old_name" "$gitmodules" 2>/dev/null; then
                if $DRY_RUN; then
                    echo -e "  ${BLUE}[SUBMODULE]${NC} ${folder_name}/.gitmodules"
                    echo -e "    ${RED}- ${old_name}${NC}"
                    echo -e "    ${GREEN}+ ${new_sub_name}${NC}"
                else
                    # macOS sed と GNU sed の両対応
                    if sed --version 2>/dev/null | grep -q GNU; then
                        sed -i "s|${old_name}|${new_sub_name}|g" "$gitmodules"
                    else
                        sed -i '' "s|${old_name}|${new_sub_name}|g" "$gitmodules"
                    fi
                    gitmodules_changed=true
                fi
                ((UPDATED_SUBMODULE++))
            fi
        done

        if ! $DRY_RUN && $gitmodules_changed; then
            echo -e "  ${GREEN}[SUBMODULE]${NC} ${folder_name}: .gitmodules を更新"

            # submodule sync
            git -C "$repo_dir" submodule sync 2>/dev/null || true

            # 変更をコミット
            git -C "$repo_dir" add .gitmodules 2>/dev/null || true
            if ! git -C "$repo_dir" diff --cached --quiet .gitmodules 2>/dev/null; then
                git -C "$repo_dir" commit -m "chore: update submodule URLs after repository rename" 2>/dev/null || true
                echo -e "    ${GREEN}コミット済み${NC}"
            fi
        fi
    fi
done

# =============================================
# サマリー
# =============================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
if $DRY_RUN; then
    echo -e "${GREEN}ドライラン完了:${NC}"
    echo -e "  remote URL 更新対象:     ${UPDATED_REMOTE}"
    echo -e "  .gitmodules 更新対象:    ${UPDATED_SUBMODULE}"
    echo ""
    if [ $((UPDATED_REMOTE + UPDATED_SUBMODULE)) -gt 0 ]; then
        echo -e "${YELLOW}実行するには:${NC}"
        echo -e "  ${BLUE}$0 ${BASE_DIR} --execute${NC}"
    else
        echo -e "${GREEN}更新対象はありませんでした。既に最新の可能性があります。${NC}"
    fi
else
    echo -e "${GREEN}実行完了:${NC}"
    echo -e "  remote URL 更新:     ${UPDATED_REMOTE}"
    echo -e "  .gitmodules 更新:    ${UPDATED_SUBMODULE}"
fi
echo ""
