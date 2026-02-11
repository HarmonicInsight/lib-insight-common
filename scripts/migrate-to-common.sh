#!/bin/bash
# =============================================
# Insight Series - InsightCommon 統合スクリプト
#
# 既存のC# WPFアプリに lib-insight-common サブモジュールを追加し、
# ローカルの License フォルダを共通コードに置き換える。
#
# 使い方:
#   cd <app-directory>
#   bash path/to/migrate-to-common.sh
#
# 前提条件:
#   - .NET 8 SDK がインストールされている
#   - git が設定済み
#   - 対象アプリに InsightNoCodeAnalyzer/License/ 相当のフォルダがある
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  InsightCommon Migration Tool                                ║${NC}"
echo -e "${BLUE}║  ローカル License → 共通 InsightCommon への移行              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================
# 1. 現在のディレクトリ確認
# =============================================
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Git リポジトリのルートで実行してください${NC}"
    exit 1
fi

REPO_NAME=$(basename "$(pwd)")
echo -e "${GREEN}📁 リポジトリ: ${REPO_NAME}${NC}"

# =============================================
# 2. C# プロジェクト検出
# =============================================
echo -e "${YELLOW}🔍 C# プロジェクト検出...${NC}"

CSPROJ=$(find . -maxdepth 2 -name "*.csproj" -not -path "./lib-insight-common/*" | head -1)
if [ -z "$CSPROJ" ]; then
    echo -e "${RED}❌ .csproj ファイルが見つかりません${NC}"
    exit 1
fi

PROJECT_DIR=$(dirname "$CSPROJ")
PROJECT_NAME=$(basename "$CSPROJ" .csproj)
echo -e "${GREEN}  プロジェクト: ${PROJECT_NAME}${NC}"
echo -e "${GREEN}  パス: ${CSPROJ}${NC}"

# =============================================
# 3. サブモジュール追加（既に存在する場合はスキップ）
# =============================================
if [ -d "lib-insight-common" ]; then
    echo -e "${YELLOW}📦 lib-insight-common は既に存在します（スキップ）${NC}"
else
    echo -e "${YELLOW}📦 lib-insight-common サブモジュール追加...${NC}"
    git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git lib-insight-common

    # .gitmodules のURLからトークンを除去（安全対策）
    if grep -q "ghp_" .gitmodules 2>/dev/null; then
        sed -i 's|https://ghp_[^@]*@github.com|https://github.com|g' .gitmodules
        echo -e "${GREEN}  ✅ .gitmodules のトークンを除去しました${NC}"
    fi
fi

# =============================================
# 4. InsightCommon プロジェクト参照追加
# =============================================
echo -e "${YELLOW}🔗 プロジェクト参照追加...${NC}"

RELATIVE_PATH="../lib-insight-common/csharp/InsightCommon/InsightCommon.csproj"

if grep -q "InsightCommon.csproj" "$CSPROJ"; then
    echo -e "${YELLOW}  参照は既に存在します（スキップ）${NC}"
else
    # </Project> の前に ProjectReference を追加
    sed -i "s|</Project>|  <ItemGroup>\n    <ProjectReference Include=\"${RELATIVE_PATH}\" />\n  </ItemGroup>\n\n</Project>|" "$CSPROJ"
    echo -e "${GREEN}  ✅ プロジェクト参照を追加しました${NC}"
fi

# =============================================
# 5. ローカル License フォルダの検出と置換
# =============================================
LICENSE_DIR="${PROJECT_DIR}/License"

if [ -d "$LICENSE_DIR" ]; then
    echo -e "${YELLOW}🔄 ローカル License フォルダを検出${NC}"

    # バックアップ
    BACKUP_DIR=".license-backup-$(date +%Y%m%d%H%M%S)"
    cp -r "$LICENSE_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}  📁 バックアップ: ${BACKUP_DIR}${NC}"

    # using の置換
    echo -e "${YELLOW}🔄 using ステートメント置換...${NC}"

    # プロジェクトの namespace を検出
    NAMESPACE=$(grep -r "namespace " "$PROJECT_DIR" --include="*.cs" -m 1 | sed 's/.*namespace \([^;]*\).*/\1/' | tr -d ' ')
    LOCAL_LICENSE_NS="${NAMESPACE%.ViewModels}.License"
    LOCAL_LICENSE_NS2="${PROJECT_NAME}.License"

    echo -e "  検索: using ${LOCAL_LICENSE_NS} / using ${LOCAL_LICENSE_NS2}"

    find "$PROJECT_DIR" -name "*.cs" -not -path "*/License/*" | while read -r file; do
        if grep -q "using ${LOCAL_LICENSE_NS}\|using ${LOCAL_LICENSE_NS2}" "$file" 2>/dev/null; then
            sed -i "s|using ${LOCAL_LICENSE_NS};|using InsightCommon.License;|g" "$file"
            sed -i "s|using ${LOCAL_LICENSE_NS2};|using InsightCommon.License;|g" "$file"
            echo -e "${GREEN}  ✅ $(basename "$file")${NC}"
        fi
    done

    # ローカル License フォルダ削除
    rm -rf "$LICENSE_DIR"
    echo -e "${GREEN}  ✅ ローカル License フォルダを削除しました${NC}"
else
    echo -e "${YELLOW}  License フォルダが見つかりません（スキップ）${NC}"
fi

# =============================================
# 6. ビルド確認
# =============================================
echo ""
echo -e "${YELLOW}🔨 ビルド確認...${NC}"

if command -v dotnet &> /dev/null; then
    SLN=$(find . -maxdepth 1 -name "*.sln" | head -1)
    if [ -n "$SLN" ]; then
        if dotnet build "$SLN" --verbosity quiet 2>&1; then
            echo -e "${GREEN}  ✅ ビルド成功${NC}"
        else
            echo -e "${RED}  ❌ ビルドエラー - 手動で修正が必要です${NC}"
            echo -e "${YELLOW}  バックアップ: ${BACKUP_DIR}${NC}"
        fi
    fi
else
    echo -e "${YELLOW}  ⚠️ dotnet SDK が見つかりません。手動でビルドしてください${NC}"
fi

# =============================================
# 7. 結果サマリー
# =============================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ 移行完了                                                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "変更内容:"
echo -e "  ${BLUE}1.${NC} lib-insight-common サブモジュール追加"
echo -e "  ${BLUE}2.${NC} InsightCommon プロジェクト参照追加"
echo -e "  ${BLUE}3.${NC} ローカル License → InsightCommon.License に置換"
echo ""
echo -e "次のステップ:"
echo -e "  ${BLUE}1.${NC} dotnet build でビルド確認"
echo -e "  ${BLUE}2.${NC} 動作テスト"
echo -e "  ${BLUE}3.${NC} git add -A && git commit -m 'refactor: use lib-insight-common shared License module'"
echo -e "  ${BLUE}4.${NC} git push origin main"
echo ""
echo -e "問題がある場合:"
echo -e "  バックアップ: ${BACKUP_DIR:-なし}"
echo ""
