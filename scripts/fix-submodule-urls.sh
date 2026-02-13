#!/bin/bash
# =============================================
# HarmonicInsight サブモジュールURL一括修正スクリプト
#
# .gitmodules の誤った URL（cross-cross-lib-insight-common 等）を
# 正しい URL（cross-lib-insight-common）に一括修正します。
#
# 使い方:
#   ./scripts/fix-submodule-urls.sh                     # ドライラン
#   ./scripts/fix-submodule-urls.sh --execute           # 修正実行
#   ./scripts/fix-submodule-urls.sh --execute --commit  # 修正+コミット
#   ./scripts/fix-submodule-urls.sh --dev-root /path    # 別ディレクトリ
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

EXECUTE=false
COMMIT=false
DEV_ROOT=""

# Windows の C:\dev を自動検出
if [ -d "/mnt/c/dev" ]; then
    DEV_ROOT="/mnt/c/dev"
elif [ -d "$HOME/dev" ]; then
    DEV_ROOT="$HOME/dev"
else
    DEV_ROOT="."
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --execute) EXECUTE=true; shift ;;
        --commit) COMMIT=true; shift ;;
        --dev-root) DEV_ROOT="$2"; shift 2 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

CORRECT_URL="https://github.com/HarmonicInsight/cross-lib-insight-common.git"

echo ""
echo -e "${BLUE}=== HarmonicInsight Submodule URL Fix ===${NC}"
if $EXECUTE; then
    echo -e "${YELLOW}MODE: EXECUTE${NC}"
else
    echo -e "${CYAN}MODE: DRY RUN${NC}"
fi
echo -e "${CYAN}Target: $DEV_ROOT${NC}"
echo ""

if [ ! -d "$DEV_ROOT" ]; then
    echo -e "${RED}ERROR: $DEV_ROOT not found${NC}"
    exit 1
fi

found=0
fixed=0
already_ok=0
errors=0

for dir in "$DEV_ROOT"/*/; do
    [ -d "$dir" ] || continue

    dir_name=$(basename "$dir")

    # cross-lib-insight-common 自身はスキップ
    [ "$dir_name" = "cross-lib-insight-common" ] && continue

    gitmodules="$dir/.gitmodules"
    [ -f "$gitmodules" ] || continue

    # insight-common サブモジュールが含まれているか
    grep -q "insight-common" "$gitmodules" 2>/dev/null || continue

    ((found++))

    # 現在のURLを取得
    current_url=$(grep -oP 'url\s*=\s*\Khttps://github\.com/HarmonicInsight/[^\s]+' "$gitmodules" | head -1)

    if [ "$current_url" = "$CORRECT_URL" ]; then
        echo -e "  ${GREEN}OK${NC}   $dir_name"
        ((already_ok++))
        continue
    fi

    echo -e "  ${YELLOW}FIX${NC}  $dir_name"
    echo -e "       Current: ${GRAY}$current_url${NC}"
    echo -e "       Correct: ${GREEN}$CORRECT_URL${NC}"

    if $EXECUTE; then
        # URL を修正
        sed -i \
            -e "s|https://github\.com/HarmonicInsight/cross-cross-lib-insight-common\.git|$CORRECT_URL|g" \
            -e "s|https://github\.com/HarmonicInsight/lib-insight-common\.git|$CORRECT_URL|g" \
            "$gitmodules"

        # git submodule sync
        (cd "$dir" && git submodule sync 2>/dev/null) || true

        # サブモジュール初期化
        submodule_path="$dir/insight-common"
        if [ ! -f "$submodule_path/CLAUDE.md" ] 2>/dev/null; then
            echo -e "       ${CYAN}Initializing submodule...${NC}"
            (cd "$dir" && git submodule update --init --recursive 2>/dev/null) || true
        fi

        if $COMMIT; then
            (cd "$dir" && git add .gitmodules && \
             git diff --cached --quiet 2>/dev/null || \
             git commit -m "fix: correct insight-common submodule URL (cross-cross -> cross)" 2>/dev/null)
            echo -e "       ${GREEN}Committed${NC}"
        fi

        echo -e "       ${GREEN}Fixed${NC}"
        ((fixed++))
    else
        ((fixed++))
    fi
done

echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "Results:"
echo -e "  Repos with submodule: $found"
echo -e "  ${GREEN}Already correct:      $already_ok${NC}"
echo -e "  ${YELLOW}Need fix / Fixed:     $fixed${NC}"
if [ "$errors" -gt 0 ]; then
    echo -e "  ${RED}Errors:               $errors${NC}"
fi
echo ""

if ! $EXECUTE && [ "$fixed" -gt 0 ]; then
    echo -e "${YELLOW}To apply fixes:${NC}"
    echo -e "  ${CYAN}./scripts/fix-submodule-urls.sh --execute${NC}"
    echo ""
    echo -e "${YELLOW}To apply fixes and commit:${NC}"
    echo -e "  ${CYAN}./scripts/fix-submodule-urls.sh --execute --commit${NC}"
fi
echo ""
