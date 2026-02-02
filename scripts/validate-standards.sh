#!/bin/bash
#
# Insight Series 標準検証スクリプト
# 新規プロジェクト作成時・PR作成時に実行必須
#

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 検証結果
ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} Insight Series 標準検証${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}[$1]${NC} $2"
}

print_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
    ((ERRORS++))
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARNINGS++))
}

# 引数チェック
if [ -z "$1" ]; then
    echo "使用方法: $0 <project-directory>"
    echo ""
    echo "例: $0 /path/to/your-app"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
    exit 1
fi

print_header
echo "検証対象: $PROJECT_DIR"
echo ""

# プラットフォーム検出
detect_platform() {
    if [ -f "$PROJECT_DIR/*.csproj" ] || [ -d "$PROJECT_DIR"/*/*.csproj ] 2>/dev/null; then
        echo "csharp"
    elif [ -f "$PROJECT_DIR/package.json" ]; then
        echo "react"
    elif [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ]; then
        echo "python"
    elif [ -f "$PROJECT_DIR/build.gradle" ] || [ -f "$PROJECT_DIR/build.gradle.kts" ]; then
        echo "android"
    elif [ -f "$PROJECT_DIR/Package.swift" ] || [ -d "$PROJECT_DIR"/*.xcodeproj ] 2>/dev/null; then
        echo "ios"
    else
        echo "unknown"
    fi
}

PLATFORM=$(detect_platform)
echo "検出されたプラットフォーム: $PLATFORM"
echo ""

# ========================================
# 1. デザインシステム検証
# ========================================
print_section "1" "デザインシステム（Ivory & Gold Theme）検証"

# 禁止: Blue (#2563EB) がプライマリとして使用されている
check_blue_primary() {
    # プライマリカラーとして青が使われていないか
    local blue_as_primary=$(grep -r "primary.*#2563EB\|#2563EB.*primary\|Primary.*2563EB\|primaryColor.*2563EB" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | head -5)

    if [ -n "$blue_as_primary" ]; then
        print_error "Blue (#2563EB) がプライマリとして使用されています"
        echo "      $blue_as_primary" | head -3
        return 1
    fi
    print_ok "Blue がプライマリとして使用されていない"
    return 0
}

# 必須: Gold (#B8942F) がプライマリとして使用されている
check_gold_primary() {
    local gold_primary=$(grep -r "#B8942F\|B8942F" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | head -1)

    if [ -z "$gold_primary" ]; then
        print_error "Gold (#B8942F) が見つかりません"
        return 1
    fi
    print_ok "Gold (#B8942F) が使用されている"
    return 0
}

# 必須: Ivory背景 (#FAF8F5) が使用されている
check_ivory_background() {
    local ivory=$(grep -r "#FAF8F5\|FAF8F5" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | head -1)

    if [ -z "$ivory" ]; then
        print_warning "Ivory背景 (#FAF8F5) が見つかりません"
        return 1
    fi
    print_ok "Ivory背景 (#FAF8F5) が使用されている"
    return 0
}

check_blue_primary
check_gold_primary
check_ivory_background

# ========================================
# 2. ライセンスシステム検証
# ========================================
print_section "2" "ライセンスシステム検証"

check_license_manager() {
    local license_file=$(find "$PROJECT_DIR" -name "*LicenseManager*" -o -name "*license_manager*" 2>/dev/null | grep -v node_modules | head -1)

    if [ -z "$license_file" ]; then
        print_error "LicenseManager が見つかりません"
        return 1
    fi
    print_ok "LicenseManager: $license_file"
    return 0
}

check_license_format() {
    local license_pattern=$(grep -r "XXXX-.*-YYMM\|{製品コード}-{プラン}\|productCode.*PLAN.*YYMM" "$PROJECT_DIR" --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" --include="*.kt" 2>/dev/null | grep -v node_modules | head -1)

    if [ -z "$license_pattern" ]; then
        print_warning "ライセンスキー形式パターンが見つかりません"
        return 1
    fi
    print_ok "ライセンスキー形式パターンが定義されている"
    return 0
}

check_license_manager
check_license_format

# ========================================
# 3. 製品コード検証
# ========================================
print_section "3" "製品コード検証"

check_product_code() {
    local product_codes="INSS|INSP|INPY|FGIN|INMV|INBT|INCA|INIG|HMSH|HMDC|HMSL"
    local found_code=$(grep -rE "($product_codes)" "$PROJECT_DIR" --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" --include="*.kt" --include="*.json" 2>/dev/null | grep -v node_modules | head -1)

    if [ -z "$found_code" ]; then
        print_warning "登録済み製品コードが見つかりません（新規製品の場合は config/products.ts に登録してください）"
        return 1
    fi
    print_ok "製品コードが使用されている"
    return 0
}

check_product_code

# ========================================
# 結果サマリー
# ========================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} 検証結果${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}エラー: $ERRORS 件${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}警告: $WARNINGS 件${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}すべてのチェックに合格しました！${NC}"
fi

echo ""

# 終了コード
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}標準に準拠していません。修正してください。${NC}"
    echo ""
    echo "参照: lib-insight-common/standards/README.md"
    exit 1
fi

exit 0
