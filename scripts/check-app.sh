#!/bin/bash
# =============================================
# Insight App セットアップチェッカー
#
# 使い方:
#   ./check-app.sh
#
# 機能:
#   - insight-common サブモジュール確認
#   - 必須ファイル確認
#   - 環境変数確認
#   - 依存関係確認
# =============================================

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Insight App Setup Checker                                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# =============================================
# 1. insight-common サブモジュール
# =============================================
echo -e "${YELLOW}📦 insight-common サブモジュール${NC}"

if [ -d "insight-common" ]; then
    if [ -f "insight-common/infrastructure/index.ts" ]; then
        echo -e "  ${GREEN}✅ insight-common 存在${NC}"
    else
        echo -e "  ${RED}❌ insight-common が不完全です${NC}"
        echo -e "     git submodule update --init --recursive を実行してください"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}❌ insight-common が見つかりません${NC}"
    echo -e "     git submodule add https://github.com/HarmonicInsight/insight-common.git"
    ((ERRORS++))
fi

# =============================================
# 2. 必須ファイル
# =============================================
echo ""
echo -e "${YELLOW}📄 必須ファイル${NC}"

FILES=(
    "package.json"
    "tsconfig.json"
    ".gitignore"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${RED}❌ $file が見つかりません${NC}"
        ((ERRORS++))
    fi
done

# =============================================
# 3. 環境変数ファイル
# =============================================
echo ""
echo -e "${YELLOW}🔐 環境変数${NC}"

if [ -f ".env.local" ]; then
    echo -e "  ${GREEN}✅ .env.local 存在${NC}"

    # 必須キーチェック
    REQUIRED_KEYS=(
        "FIREBASE_PROJECT_ID"
        "SUPABASE_URL"
    )

    for key in "${REQUIRED_KEYS[@]}"; do
        if grep -q "^${key}=" .env.local 2>/dev/null; then
            value=$(grep "^${key}=" .env.local | cut -d'=' -f2)
            if [ -n "$value" ]; then
                echo -e "  ${GREEN}✅ $key 設定済み${NC}"
            else
                echo -e "  ${YELLOW}⚠️ $key が空です${NC}"
                ((WARNINGS++))
            fi
        else
            echo -e "  ${RED}❌ $key が未設定${NC}"
            ((ERRORS++))
        fi
    done
else
    echo -e "  ${RED}❌ .env.local が見つかりません${NC}"
    echo -e "     cp .env.local.example .env.local"
    ((ERRORS++))
fi

# =============================================
# 4. node_modules
# =============================================
echo ""
echo -e "${YELLOW}📦 依存関係${NC}"

if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✅ node_modules 存在${NC}"

    # 必須パッケージチェック
    PACKAGES=(
        "firebase"
        "firebase-admin"
        "@supabase/supabase-js"
    )

    for pkg in "${PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            echo -e "  ${GREEN}✅ $pkg インストール済み${NC}"
        else
            echo -e "  ${RED}❌ $pkg がインストールされていません${NC}"
            ((ERRORS++))
        fi
    done
else
    echo -e "  ${YELLOW}⚠️ node_modules が見つかりません${NC}"
    echo -e "     pnpm install を実行してください"
    ((WARNINGS++))
fi

# =============================================
# 5. package.json スクリプト
# =============================================
echo ""
echo -e "${YELLOW}📜 npm scripts${NC}"

SCRIPTS=(
    "check:env"
    "check:connection"
)

for script in "${SCRIPTS[@]}"; do
    if grep -q "\"$script\"" package.json 2>/dev/null; then
        echo -e "  ${GREEN}✅ $script 定義済み${NC}"
    else
        echo -e "  ${YELLOW}⚠️ $script が未定義${NC}"
        ((WARNINGS++))
    fi
done

# =============================================
# サマリー
# =============================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 全てのチェックに合格しました！${NC}"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ $WARNINGS 件の警告があります${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS 件のエラー、$WARNINGS 件の警告${NC}"
    echo ""
    exit 1
fi
