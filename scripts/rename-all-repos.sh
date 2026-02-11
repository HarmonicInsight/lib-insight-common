#!/bin/bash
# =============================================
# HarmonicInsight 全リポジトリ一括リネームスクリプト
#
# 前提条件:
#   - gh CLI がインストール済み
#   - gh auth login で認証済み（admin権限必要）
#
# 使い方:
#   chmod +x scripts/rename-all-repos.sh
#   ./scripts/rename-all-repos.sh           # ドライラン（確認のみ）
#   ./scripts/rename-all-repos.sh --execute # 実行
#
# 注意:
#   - GitHubはリネーム後に旧URLからリダイレクトする
#   - ただし同名の新リポジトリが作成されるとリダイレクト無効化
#   - リネーム後、全ローカルPCで remote URL 更新が必要
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

if [ "$1" = "--execute" ]; then
    DRY_RUN=false
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  HarmonicInsight Repository Rename Tool                      ║${NC}"
if $DRY_RUN; then
echo -e "${YELLOW}║  MODE: DRY RUN（確認のみ・変更なし）                          ║${NC}"
else
echo -e "${RED}║  MODE: EXECUTE（実行モード・リネームを実行します）             ║${NC}"
fi
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# gh CLI チェック
if ! command -v gh &> /dev/null; then
    echo -e "${RED}gh CLI が見つかりません。インストールしてください。${NC}"
    echo "  https://cli.github.com/"
    exit 1
fi

# 認証チェック
if ! gh auth status &> /dev/null; then
    echo -e "${RED}gh CLI が未認証です。${NC}"
    echo "  gh auth login"
    exit 1
fi

echo -e "${GREEN}gh CLI 認証OK${NC}"
echo ""

# =============================================
# リネームマッピング定義
# =============================================

# 形式: "旧名|新名"
RENAMES=(
    # === cross- (共通基盤) ===
    "lib-insight-common|cross-lib-insight-common"
    "lib-decision-structure|cross-lib-decision-structure"
    "releases|cross-releases"
    "rpatest|cross-tool-rpa-test"
    "insight-youtube-collector|cross-tool-youtube-collector"
    "tool-slide-generator|cross-tool-slide-generator"
    "tool-mart-generator|cross-tool-mart-generator"
    "tool-idea-manager|cross-tool-idea-manager"
    "tool-idea-list-web|cross-tool-idea-list"
    "tool-contract-admin|cross-tool-contract-admin"
    "tool-value-estimator-web|cross-tool-value-estimator"
    "app-family-cashflow|cross-app-family-cashflow"
    "app-insight-documentor|cross-app-insight-documentor"
    "exp-vtuber-course-web|cross-exp-vtuber-course"
    "docs-insight-suite|cross-docs-insight-suite"
    "docs-insight-creative|cross-docs-insight-creative"
    "kb-task-management|cross-kb-task-management"
    "kb-construction|cross-kb-construction"
    "kb-book-output|cross-kb-book-output"
    "01_books|cross-kb-books"

    # === win- (Windows) ===
    "app-Insight-bot-C|win-app-insight-bot"
    "app-Insight-slide|win-app-insight-slide"
    "app-Insight-doc|win-app-insight-doc"
    "app-Insight-excel|win-app-insight-sheet"
    "app-harmonic-sheet|win-app-insight-sheet-senior"
    "app-nocode-analyzer-C|win-app-nocode-analyzer"
    "app-insight-image-gen-C|win-app-insight-image-gen"
    "app-insight-movie-gen-win-C|win-app-insight-movie-gen"
    "app-insight-py-win|win-app-insight-py"
    "app-insight-py-pro-win|win-app-insight-py-pro"
    "Insight-launcher|win-app-insight-launcher"
    "insight-pinboard|win-app-insight-pinboard"
    "app-insight-sales-win|win-app-insight-sales"
    "app-forguncy-win|win-app-forguncy"
    "app-Insight-management-finance|win-app-insight-management-finance"
    "app-Insight-requirements|win-app-insight-requirements"
    "tool-file-history-manager|win-tool-file-history-manager"
    "tool-Insight-factory-win|win-tool-insight-factory"

    # === web- (Web) ===
    "app-auto-interview-web|web-app-auto-interview"
    "app-insight-bi-web|web-app-insight-bi"
    "app-insight-diagnosis-web|web-app-insight-diagnosis"
    "Insgight-browser-AI|web-app-insight-browser-ai"
    "Insight-QR|web-app-insight-qr"
    "InsightDigestDiary|web-app-insight-digest-diary"
    "InsightTidy|web-app-insight-tidy"
    "Insight-Sharing|web-app-insight-sharing"
    "Insight-Process|web-app-insight-process"
    "app-InsightChatBot-web|web-app-insight-chatbot"
    "app-Insight-learning|web-app-insight-learning"
    "app-Insight-keeper-C|web-app-insight-keeper"
    "app-insight-reports-web|web-app-insight-reports"
    "app-insight-bom-web|web-app-insight-bom"
    "app-insight-manage-storiesgame-web|web-app-insight-stories-game"
    "app-query-licence-management-web|web-app-query-license-management"
    "app-nocode-analyzer-web|web-app-nocode-analyzer"
    "app-issue-management-web|web-app-issue-management"
    "app-construction-kpi-web|web-app-construction-kpi"
    "app-const-level-web|web-app-const-level"
    "app-human-management-web|web-app-human-management"
    "app-security-check-all|web-app-security-check"
    "app-family-schedule-web|web-app-family-schedule"
    "app-schedule-generaror|web-app-schedule-generator"
    "app-logic-dojo-web|web-app-logic-dojo"
    "app-harmonic-novels-web|web-app-harmonic-novels"
    "app-toko-bi-web|web-app-toko-bi"
    "app-consul-evaluate-web|web-app-consul-evaluate"
    "app-minpakuiot-web|web-app-minpaku-iot"
    "Live2D-Talker|web-app-live2d-talker"
    "Live2D-Interview|web-app-live2d-interview"
    "arcana-code|web-app-arcana-code"
    "gcs_management|web-tool-gcs-management"
    "Insight-Office.com|web-site-insight-office"
    "site-corporate|web-site-corporate"
    "site-erik.arthur|web-site-erik-arthur"

    # === android- ===
    "Insight-launcher-Android|android-app-insight-launcher"
    "Insight-Camera-Android|android-app-insight-camera"
    "Insight-Voice-Clock|android-app-insight-voice-clock"
    "app-Insight-clip-android|android-app-insight-clip"
    "app-android-const|android-app-construction-education"
    "app-reader-android|android-app-reader"
    "app-manualsnap-android|android-app-manualsnap"
    "app-portal-android|android-app-portal"
    "app-consul-evaluate-android|android-app-consul-evaluate"
    "app-pixie-android|android-app-pixie"
    "app-path-numbers-android|android-app-path-numbers"
    "app-nback-android|android-app-nback"
    "app-horoscope-android|android-app-horoscope"
    "app-incline-insight-android|android-app-incline-insight"
    "app-gout-water-android|android-app-gout-water"
    "app-comu-test-android|android-app-comu-test"
    "app-food-medical-android|android-app-food-medical"

    # === ios- ===
    "app-intake-checker-ios|ios-app-intake-checker"
    "app-incline-insight-ios|ios-app-incline-insight"
    "app-angle-insight-ios|ios-app-angle-insight"
    "app-insight-movie-ios|ios-app-insight-movie"

    # === mobile- (cross-platform) ===
    "Insight-Senior-Phone|mobile-app-insight-senior-phone"
    "app-voice-memo-mobile|mobile-app-voice-memo"
    "app-consul-evaluate-mobile|mobile-app-consul-evaluate"

    # === unity- ===
    "app-insight-agent-Unity|unity-app-insight-agent"

    # === アーカイブ済（任意） ===
    "app-insight-slide-win|win-app-insight-slide-legacy"
    "app-insight-slide-win-C|win-app-insight-slide-v2"
    "app-insight-movie-gen-win|win-app-insight-movie-gen-legacy"
    "app-insight-image-gen-win|win-app-insight-image-gen-legacy"
    "insightbot-orchestrator|cross-app-insight-bot-orchestrator"
    "app-blender|cross-exp-blender"
    "Exp_Auto_Error_Fix|cross-exp-auto-error-fix"
    "app-sns-test|cross-exp-sns-test"
    "tool-bizrobo-analyzer|cross-tool-bizrobo-analyzer"
    "tool-slide-from-pdf|cross-tool-slide-from-pdf"
    "app-voice-task-groq-web|web-app-voice-task-groq"
    "app-android-easy-line|android-app-easy-line"
)

# =============================================
# リネーム実行
# =============================================

TOTAL=${#RENAMES[@]}
SUCCESS=0
SKIP=0
FAIL=0

echo -e "${BLUE}リネーム対象: ${TOTAL} リポジトリ${NC}"
echo ""

for entry in "${RENAMES[@]}"; do
    OLD_NAME="${entry%%|*}"
    NEW_NAME="${entry##*|}"

    # リポジトリ存在チェック
    if ! gh repo view "${ORG}/${OLD_NAME}" --json name &> /dev/null; then
        # 既にリネーム済みかチェック
        if gh repo view "${ORG}/${NEW_NAME}" --json name &> /dev/null; then
            echo -e "  ${GRAY}SKIP ${OLD_NAME} → ${NEW_NAME}（リネーム済み）${NC}"
        else
            echo -e "  ${YELLOW}SKIP ${OLD_NAME}（存在しません）${NC}"
        fi
        ((SKIP++))
        continue
    fi

    if $DRY_RUN; then
        echo -e "  ${BLUE}PLAN${NC} ${OLD_NAME} → ${GREEN}${NEW_NAME}${NC}"
        ((SUCCESS++))
    else
        echo -n "  EXEC ${OLD_NAME} → ${NEW_NAME} ... "
        if gh repo rename "${NEW_NAME}" --repo "${ORG}/${OLD_NAME}" --yes 2>/dev/null; then
            echo -e "${GREEN}OK${NC}"
            ((SUCCESS++))
        else
            echo -e "${RED}FAIL${NC}"
            ((FAIL++))
        fi
        # API レート制限対策（1秒待機）
        sleep 1
    fi
done

# =============================================
# サマリー
# =============================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
if $DRY_RUN; then
    echo -e "${GREEN}ドライラン完了:${NC}"
    echo -e "  リネーム予定: ${SUCCESS}"
    echo -e "  スキップ:     ${SKIP}"
    echo ""
    echo -e "${YELLOW}実行するには:${NC}"
    echo -e "  ${BLUE}./scripts/rename-all-repos.sh --execute${NC}"
else
    echo -e "${GREEN}リネーム完了:${NC}"
    echo -e "  成功:   ${SUCCESS}"
    echo -e "  スキップ: ${SKIP}"
    echo -e "  失敗:   ${FAIL}"
    echo ""
    echo -e "${YELLOW}次のステップ:${NC}"
    echo -e "  1. 全ローカルPCで remote URL を更新"
    echo -e "     → docs/migration-guide-rename.md 参照"
    echo -e "  2. .gitmodules のサブモジュール URL を更新"
    echo -e "  3. CI/CD の workflow 参照を更新"
fi
echo ""
