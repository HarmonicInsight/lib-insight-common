#!/bin/bash
#
# Insight Series 標準検証スクリプト
# 新規プロジェクト作成時・PR作成時に実行必須
#
# 使い方:
#   ./validate-standards.sh <project-directory>
#

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color

# 検証結果
ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} Insight Series 標準検証${NC}"
    echo -e "${GOLD}========================================${NC}"
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
    ((ERRORS++)) || true
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARNINGS++)) || true
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
    if ls "$PROJECT_DIR"/*.csproj 2>/dev/null | head -1 > /dev/null 2>&1; then
        echo "csharp"
    elif [ -f "$PROJECT_DIR/build.gradle.kts" ] || [ -f "$PROJECT_DIR/build.gradle" ]; then
        echo "android"
    elif [ -f "$PROJECT_DIR/package.json" ]; then
        if grep -q '"expo"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            echo "expo"
        else
            echo "react"
        fi
    elif [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ]; then
        echo "python"
    elif [ -f "$PROJECT_DIR/Package.swift" ]; then
        echo "ios"
    else
        echo "unknown"
    fi
}

PLATFORM=$(detect_platform)
echo "検出されたプラットフォーム: $PLATFORM"
echo ""

# ========================================
# 1. デザインシステム検証（全プラットフォーム共通）
# ========================================
print_section "1" "デザインシステム（Ivory & Gold Theme）検証"

# 禁止: Blue (#2563EB) がプライマリとして使用されている
check_blue_primary() {
    local blue_as_primary=$(grep -r "primary.*#2563EB\|#2563EB.*primary\|Primary.*2563EB\|primaryColor.*2563EB" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | grep -v insight-common | head -5)

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
    local gold_primary=$(grep -r "#B8942F\|B8942F\|0xFFB8942F" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | grep -v insight-common | head -1)

    if [ -z "$gold_primary" ]; then
        print_error "Gold (#B8942F) が見つかりません"
        return 1
    fi
    print_ok "Gold (#B8942F) が使用されている"
    return 0
}

# 必須: Ivory背景 (#FAF8F5) が使用されている
check_ivory_background() {
    local ivory=$(grep -r "#FAF8F5\|FAF8F5\|0xFFFAF8F5" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" 2>/dev/null | grep -v node_modules | grep -v insight-common | head -1)

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
    local license_file=$(find "$PROJECT_DIR" -name "*LicenseManager*" -o -name "*license_manager*" 2>/dev/null | grep -v node_modules | grep -v insight-common | head -1)

    if [ -z "$license_file" ]; then
        print_warning "LicenseManager が見つかりません（ユーティリティアプリの場合は不要）"
        return 1
    fi
    print_ok "LicenseManager: $license_file"
    return 0
}

check_license_manager

# ========================================
# 3. 製品コード検証
# ========================================
print_section "3" "製品コード検証"

check_product_code() {
    local product_codes="INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN"
    local found_code=$(grep -rE "($product_codes)" "$PROJECT_DIR" --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" --include="*.kt" --include="*.json" 2>/dev/null | grep -v node_modules | grep -v insight-common | head -1)

    if [ -z "$found_code" ]; then
        print_warning "登録済み製品コードが見つかりません（新規製品の場合は config/products.ts に登録してください）"
        return 1
    fi
    print_ok "製品コードが使用されている"
    return 0
}

check_product_code

# ========================================
# 4. Android 固有検証
# ========================================
if [ "$PLATFORM" = "android" ]; then
    echo ""
    print_section "4" "Android 固有チェック"

    # 4.1 Version Catalog
    if [ -f "$PROJECT_DIR/gradle/libs.versions.toml" ]; then
        print_ok "gradle/libs.versions.toml が存在"

        agp_ver=$(grep '^agp\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$agp_ver" ]; then
            print_ok "AGP バージョン定義: $agp_ver"
        else
            print_warning "AGP バージョンが libs.versions.toml に定義されていません"
        fi

        kotlin_ver=$(grep '^kotlin\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$kotlin_ver" ]; then
            print_ok "Kotlin バージョン定義: $kotlin_ver"
        else
            print_warning "Kotlin バージョンが libs.versions.toml に定義されていません"
        fi
    else
        print_error "gradle/libs.versions.toml が見つかりません"
    fi

    # 4.2 SDK バージョン
    build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" -path "*/app/*" 2>/dev/null | head -1)
    if [ -z "$build_file" ]; then
        build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" 2>/dev/null | grep -v '/build/' | head -1)
    fi

    if [ -n "$build_file" ]; then
        compile_sdk=$(grep "compileSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$compile_sdk" | grep -q "35"; then
            print_ok "compileSdk = 35"
        elif [ -n "$compile_sdk" ]; then
            print_error "compileSdk が 35 ではありません: $compile_sdk"
        else
            print_warning "compileSdk が見つかりません"
        fi

        target_sdk=$(grep "targetSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$target_sdk" | grep -q "35"; then
            print_ok "targetSdk = 35"
        elif [ -n "$target_sdk" ]; then
            print_error "targetSdk が 35 ではありません: $target_sdk"
        fi

        min_sdk=$(grep "minSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$min_sdk" | grep -q "26"; then
            print_ok "minSdk = 26"
        elif [ -n "$min_sdk" ]; then
            print_warning "minSdk が 26 ではありません: $min_sdk"
        fi

        jvm_target=$(grep 'jvmTarget\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$jvm_target" | grep -q "17"; then
            print_ok "JVM Target = 17"
        elif [ -n "$jvm_target" ]; then
            print_error "JVM Target が 17 ではありません: $jvm_target"
        fi
    else
        print_warning "app/build.gradle.kts が見つかりません"
    fi

    # 4.3 ProGuard / R8
    if [ -n "$build_file" ]; then
        if grep -q "isMinifyEnabled\s*=\s*true" "$build_file" 2>/dev/null; then
            print_ok "ProGuard/R8 が有効 (isMinifyEnabled = true)"
        else
            print_error "リリースビルドで isMinifyEnabled = true が設定されていません"
        fi

        if grep -q "isShrinkResources\s*=\s*true" "$build_file" 2>/dev/null; then
            print_ok "リソース縮小が有効 (isShrinkResources = true)"
        else
            print_warning "isShrinkResources = true が設定されていません"
        fi
    fi

    if find "$PROJECT_DIR" -name "proguard-rules.pro" 2>/dev/null | head -1 | grep -q .; then
        print_ok "proguard-rules.pro が存在"
    else
        print_warning "proguard-rules.pro が見つかりません"
    fi

    # 4.4 テーマファイル
    color_kt=$(find "$PROJECT_DIR" -name "Color.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$color_kt" ]; then
        if grep -q "InsightPrimaryLight" "$color_kt" 2>/dev/null; then
            print_ok "Color.kt: Insight 標準命名 (InsightPrimaryLight)"
        else
            print_warning "Color.kt: InsightPrimaryLight 命名が見つかりません"
        fi
    else
        print_error "ui/theme/Color.kt が見つかりません"
    fi

    theme_kt=$(find "$PROJECT_DIR" -name "Theme.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$theme_kt" ]; then
        if grep -q "InsightTypography" "$theme_kt" 2>/dev/null; then
            print_ok "Theme.kt: InsightTypography を使用"
        else
            print_warning "Theme.kt: InsightTypography が参照されていません"
        fi
    else
        print_error "ui/theme/Theme.kt が見つかりません"
    fi

    type_kt=$(find "$PROJECT_DIR" -name "Type.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$type_kt" ]; then
        if grep -q "InsightTypography" "$type_kt" 2>/dev/null; then
            print_ok "Type.kt: InsightTypography 変数名"
        else
            print_error "Type.kt: InsightTypography 変数名が見つかりません"
        fi
    else
        print_error "ui/theme/Type.kt が見つかりません"
    fi

    # 4.5 colors.xml
    colors_xml=$(find "$PROJECT_DIR" -name "colors.xml" -path "*/values/*" 2>/dev/null | head -1)
    if [ -n "$colors_xml" ]; then
        if grep -q "B8942F" "$colors_xml" 2>/dev/null; then
            print_ok "colors.xml: Gold (#B8942F) が定義"
        else
            print_error "colors.xml: Gold (#B8942F) が見つかりません"
        fi
        if grep -q "FAF8F5" "$colors_xml" 2>/dev/null; then
            print_ok "colors.xml: Ivory (#FAF8F5) が定義"
        else
            print_warning "colors.xml: Ivory (#FAF8F5) が見つかりません"
        fi
    else
        print_error "res/values/colors.xml が見つかりません"
    fi

    # 4.6 i18n
    strings_ja=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values/*" ! -path "*/values-*/*" 2>/dev/null | head -1)
    if [ -n "$strings_ja" ]; then
        print_ok "values/strings.xml (日本語) が存在"
    else
        print_warning "values/strings.xml (日本語) が見つかりません"
    fi

    strings_en=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values-en/*" 2>/dev/null | head -1)
    if [ -n "$strings_en" ]; then
        print_ok "values-en/strings.xml (英語) が存在"
    else
        print_warning "values-en/strings.xml (英語) が見つかりません"
    fi

    # 4.7 パッケージ名
    if [ -n "$build_file" ]; then
        namespace=$(grep 'namespace\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$namespace" | grep -q "com\.harmonic"; then
            print_ok "パッケージ名: com.harmonic.* 準拠"
        elif [ -n "$namespace" ]; then
            print_warning "パッケージ名が com.harmonic.* 形式ではありません: $namespace"
        fi
    fi

    # 4.8 Adaptive Icon
    foreground=$(find "$PROJECT_DIR" -name "ic_launcher_foreground.xml" 2>/dev/null | head -1)
    if [ -n "$foreground" ]; then
        if grep -q "B8942F" "$foreground" 2>/dev/null; then
            print_ok "ic_launcher_foreground.xml: Gold (#B8942F) 使用"
        else
            print_warning "ic_launcher_foreground.xml: Gold (#B8942F) が見つかりません"
        fi
    else
        print_warning "ic_launcher_foreground.xml が見つかりません"
    fi

    background_icon=$(find "$PROJECT_DIR" -name "ic_launcher_background.xml" 2>/dev/null | head -1)
    if [ -n "$background_icon" ]; then
        if grep -q "FAF8F5" "$background_icon" 2>/dev/null; then
            print_ok "ic_launcher_background.xml: Ivory (#FAF8F5) 背景"
        else
            print_warning "ic_launcher_background.xml: Ivory (#FAF8F5) が見つかりません"
        fi
    else
        print_warning "ic_launcher_background.xml が見つかりません"
    fi
fi

# ========================================
# 5. Expo/React Native 固有検証
# ========================================
if [ "$PLATFORM" = "expo" ]; then
    echo ""
    print_section "5" "Expo/React Native 固有チェック"

    if [ -f "$PROJECT_DIR/app.json" ]; then
        if grep -q "2563EB" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_error "app.json: Blue (#2563EB) が使用されています"
        else
            print_ok "app.json: Blue が使用されていない"
        fi

        if grep -q "B8942F" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: Gold (#B8942F) が使用されている"
        else
            print_warning "app.json: Gold (#B8942F) が見つかりません"
        fi
    fi
fi

# ========================================
# 結果サマリー
# ========================================
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} 検証結果${NC}"
echo -e "${GOLD}========================================${NC}"
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

if [ "$PLATFORM" = "android" ]; then
    echo -e "参照: ${BLUE}insight-common/standards/ANDROID.md${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/android/${NC}"
else
    echo -e "参照: ${BLUE}insight-common/standards/README.md${NC}"
fi
echo ""

# 終了コード
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}標準に準拠していません。修正してください。${NC}"
    exit 1
fi

exit 0
