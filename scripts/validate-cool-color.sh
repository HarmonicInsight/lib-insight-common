#!/bin/bash
#
# Insight Series Cool Blue & Slate テーマ検証スクリプト
# 業務系アプリケーション（INBT/INCA/IVIN）の標準検証
#
# 使い方:
#   ./validate-cool-color.sh <project-directory>
#

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 検証結果
ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} Cool Blue & Slate テーマ検証${NC}"
    echo -e "${CYAN}========================================${NC}"
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
    echo ""
    echo "対象: 業務系アプリケーション (INBT/INCA/IVIN)"
    echo "テーマ: Cool Blue & Slate"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
    exit 1
fi

# insight-common サブモジュール自動セットアップ
if [ -f "$PROJECT_DIR/.gitmodules" ] && grep -q "insight-common" "$PROJECT_DIR/.gitmodules" 2>/dev/null; then
    if [ ! -f "$PROJECT_DIR/insight-common/CLAUDE.md" ]; then
        echo -e "${YELLOW}insight-common サブモジュールを初期化しています...${NC}"
        git -C "$PROJECT_DIR" submodule init 2>/dev/null || true
        git -C "$PROJECT_DIR" submodule update --recursive 2>/dev/null || true
    fi
    chmod +x "$PROJECT_DIR/insight-common/scripts/"*.sh 2>/dev/null || true
fi

print_header
echo "検証対象: $PROJECT_DIR"
echo ""

# プラットフォーム検出
detect_platform() {
    if compgen -G "$PROJECT_DIR"/*.csproj > /dev/null 2>&1; then
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

# 検索対象ファイル拡張子（共通）
SEARCH_INCLUDES='--include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --include="*.py" --include="*.cs"'
SEARCH_EXCLUDES='--exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git --exclude-dir=build --exclude-dir=dist'

# ========================================
# 1. Cool Blue & Slate テーマ検証
# ========================================
print_section "1" "カラーシステム（Cool Blue & Slate Theme）検証"

# 必須: Blue (#2563EB) がプライマリとして使用されている
check_blue_primary() {
    local blue_found=$(grep -r "#2563EB\|2563EB\|0xFF2563EB" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$blue_found" ]; then
        print_error "Blue (#2563EB) が見つかりません（Cool テーマのプライマリカラー）"
        return 1
    fi
    print_ok "Blue (#2563EB) が使用されている"
    return 0
}

# 必須: Slate 背景 (#F8FAFC) が使用されている
check_slate_background() {
    local slate_found=$(grep -r "#F8FAFC\|F8FAFC\|0xFFF8FAFC" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$slate_found" ]; then
        print_error "Slate 背景 (#F8FAFC) が見つかりません"
        return 1
    fi
    print_ok "Slate 背景 (#F8FAFC) が使用されている"
    return 0
}

# 禁止: Gold (#B8942F) がプライマリとして使用されていない
check_no_gold_primary() {
    local gold_as_primary=$(grep -r "primary.*#B8942F\|#B8942F.*primary\|Primary.*B8942F\|primaryColor.*B8942F" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -5)

    if [ -n "$gold_as_primary" ]; then
        print_error "Gold (#B8942F) がプライマリとして使用されています（Cool テーマでは Blue を使用）"
        echo "      $gold_as_primary" | head -3
        return 1
    fi
    print_ok "Gold がプライマリとして使用されていない"
    return 0
}

# 禁止: Ivory (#FAF8F5) が背景として使用されていない
check_no_ivory_background() {
    local ivory_as_bg=$(grep -r "background.*#FAF8F5\|#FAF8F5.*background\|Background.*FAF8F5\|BgPrimary.*FAF8F5" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -5)

    if [ -n "$ivory_as_bg" ]; then
        print_error "Ivory (#FAF8F5) が背景として使用されています（Cool テーマでは Slate #F8FAFC を使用）"
        echo "      $ivory_as_bg" | head -3
        return 1
    fi
    print_ok "Ivory が背景として使用されていない"
    return 0
}

# 推奨: 高コントラストテキスト (#0F172A) が使用されている
check_high_contrast_text() {
    local text_found=$(grep -r "#0F172A\|0F172A\|0xFF0F172A" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$text_found" ]; then
        print_warning "高コントラストテキスト (#0F172A) が見つかりません"
        return 1
    fi
    print_ok "高コントラストテキスト (#0F172A) が使用されている"
    return 0
}

# 推奨: ダークサイドバー (#1E293B) が使用されている
check_dark_sidebar() {
    local sidebar_found=$(grep -r "#1E293B\|1E293B\|0xFF1E293B" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$sidebar_found" ]; then
        print_warning "ダークサイドバー (#1E293B) が見つかりません（業務系アプリでは推奨）"
        return 1
    fi
    print_ok "ダークサイドバー (#1E293B) が使用されている"
    return 0
}

# 推奨: ステータスカラーの使用（RPA系のみ）
check_status_colors() {
    local status_colors_found=0

    for color in "#DBEAFE" "#DCFCE7" "#FEF3C7" "#FEE2E2"; do
        if grep -rq "$color" "$PROJECT_DIR" \
            --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
            --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
            --include="*.py" --include="*.cs" \
            --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
            2>/dev/null; then
            ((status_colors_found++)) || true
        fi
    done

    if [ "$status_colors_found" -ge 3 ]; then
        print_ok "ステータスバッジカラーが使用されている ($status_colors_found/4)"
    elif [ "$status_colors_found" -ge 1 ]; then
        print_warning "ステータスバッジカラーが部分的に使用 ($status_colors_found/4)（全ステータス色を揃えてください）"
    else
        print_warning "ステータスバッジカラーが見つかりません（RPA/ダッシュボード系では推奨）"
    fi
}

# ハードコードされた色値のチェック
check_hardcoded_colors() {
    local hardcoded_count=0

    # 一般的な色値のハードコード検出（#xxx 形式で、定義ファイル以外）
    local color_defs=$(grep -rn "background:\s*#\|color:\s*#\|fill:\s*#\|stroke:\s*#" "$PROJECT_DIR" \
        --include="*.tsx" --include="*.ts" --include="*.css" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | grep -v "colors" | grep -v "theme" | grep -v "Color" | head -5)

    if [ -n "$color_defs" ]; then
        print_warning "ハードコードされた色値が検出されました（変数 / colors-cool.json を参照してください）"
        echo "      $(echo "$color_defs" | head -3)"
    else
        print_ok "ハードコードされた色値は検出されませんでした"
    fi
}

check_blue_primary
check_slate_background
check_no_gold_primary
check_no_ivory_background
check_high_contrast_text
check_dark_sidebar
check_status_colors
check_hardcoded_colors

# ========================================
# 2. ライセンスシステム検証
# ========================================
echo ""
print_section "2" "ライセンスシステム検証"

check_license_manager() {
    local license_file=$(find "$PROJECT_DIR" \( -name "*LicenseManager*" -o -name "*license_manager*" \) \
        -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)

    if [ -z "$license_file" ]; then
        print_warning "LicenseManager が見つかりません（ユーティリティアプリの場合は不要）"
        return 1
    fi
    print_ok "LicenseManager: $license_file"
    return 0
}

check_license_manager || true

# ========================================
# 3. 製品コード検証
# ========================================
echo ""
print_section "3" "製品コード検証"

check_product_code() {
    # Cool テーマ対象の製品コード
    local cool_product_codes="INBT|INCA|IVIN"
    local found_cool=$(grep -rE "($cool_product_codes)" "$PROJECT_DIR" \
        --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" \
        --include="*.kt" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -n "$found_cool" ]; then
        print_ok "Cool テーマ対象の製品コードが使用されている"
        return 0
    fi

    # Ivory テーマ対象の製品コードが使われていないかチェック
    local ivory_product_codes="INSS|IOSH|IOSD|ISOF|INMV|INIG|INPY"
    local found_ivory=$(grep -rE "($ivory_product_codes)" "$PROJECT_DIR" \
        --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" \
        --include="*.kt" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -n "$found_ivory" ]; then
        print_warning "Ivory & Gold テーマ対象の製品コードが検出されました（Cool テーマが正しいか確認してください）"
        return 1
    fi

    print_warning "登録済み製品コードが見つかりません（config/products.ts に登録してください）"
    return 1
}

check_product_code || true

# ========================================
# 4. セキュリティ・品質チェック
# ========================================
echo ""
print_section "4" "セキュリティ・品質チェック"

# API キーのハードコード
check_hardcoded_secrets() {
    local secrets=$(grep -rn "api_key\s*=\s*['\"].\+['\"\|API_KEY\s*=\s*['\"].\+['\"]" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.py" --include="*.cs" \
        --include="*.kt" --include="*.swift" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        --exclude="*.example" --exclude="*.sample" \
        2>/dev/null | grep -vi "process\.env\|os\.environ\|Environment\." | head -3)

    if [ -n "$secrets" ]; then
        print_error "ハードコードされた API キーが検出されました"
        echo "      $secrets" | head -2
    else
        print_ok "ハードコードされた API キーは検出されませんでした"
    fi
}

# デバッグ出力の残存
check_debug_output() {
    local debug_count=0

    local console_logs=$(grep -rn "console\.log\|console\.debug" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    local print_stmts=$(grep -rn "^[[:space:]]*print(" "$PROJECT_DIR" \
        --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    debug_count=$((console_logs + print_stmts))

    if [ "$debug_count" -gt 0 ]; then
        print_warning "デバッグ出力が $debug_count 件検出されました（リリース前に除去してください）"
    else
        print_ok "デバッグ出力は検出されませんでした"
    fi
}

# TODO/FIXME の残存
check_todos() {
    local todo_count=$(grep -rn "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.py" --include="*.cs" \
        --include="*.kt" --include="*.swift" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    if [ "$todo_count" -gt 0 ]; then
        print_warning "TODO/FIXME が $todo_count 件検出されました（リリース前に解決してください）"
    else
        print_ok "TODO/FIXME は検出されませんでした"
    fi
}

check_hardcoded_secrets
check_debug_output
check_todos

# ========================================
# 5. ローカライゼーション検証
# ========================================
echo ""
print_section "5" "ローカライゼーション検証"

check_i18n() {
    case "$PLATFORM" in
        android)
            local strings_ja=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values/*" ! -path "*/values-*/*" 2>/dev/null | head -1)
            local strings_en=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values-en/*" 2>/dev/null | head -1)

            if [ -n "$strings_ja" ]; then
                print_ok "values/strings.xml (日本語) が存在"
            else
                print_warning "values/strings.xml (日本語) が見つかりません"
            fi

            if [ -n "$strings_en" ]; then
                print_ok "values-en/strings.xml (英語) が存在"
            else
                print_warning "values-en/strings.xml (英語) が見つかりません"
            fi
            ;;
        react|expo)
            local i18n_ja=$(find "$PROJECT_DIR" -name "ja.json" -path "*/i18n/*" -o -name "ja.json" -path "*/locales/*" -o -name "ja.json" -path "*/lang/*" 2>/dev/null | head -1)
            local i18n_en=$(find "$PROJECT_DIR" -name "en.json" -path "*/i18n/*" -o -name "en.json" -path "*/locales/*" -o -name "en.json" -path "*/lang/*" 2>/dev/null | head -1)

            if [ -n "$i18n_ja" ]; then
                print_ok "日本語リソースファイルが存在: $i18n_ja"
            else
                print_warning "日本語リソースファイルが見つかりません"
            fi

            if [ -n "$i18n_en" ]; then
                print_ok "英語リソースファイルが存在: $i18n_en"
            else
                print_warning "英語リソースファイルが見つかりません"
            fi
            ;;
        csharp)
            local resx_ja=$(find "$PROJECT_DIR" -name "*.resx" ! -name "*.en.resx" ! -name "*.en-US.resx" 2>/dev/null | head -1)
            local resx_en=$(find "$PROJECT_DIR" -name "*.en.resx" -o -name "*.en-US.resx" 2>/dev/null | head -1)

            if [ -n "$resx_ja" ]; then
                print_ok "日本語リソース (.resx) が存在"
            else
                print_warning "日本語リソース (.resx) が見つかりません"
            fi

            if [ -n "$resx_en" ]; then
                print_ok "英語リソース (.resx) が存在"
            else
                print_warning "英語リソース (.resx) が見つかりません"
            fi
            ;;
        python)
            local i18n_dir=$(find "$PROJECT_DIR" -type d \( -name "i18n" -o -name "locales" -o -name "translations" \) 2>/dev/null | head -1)
            if [ -n "$i18n_dir" ]; then
                print_ok "ローカライゼーションディレクトリが存在: $i18n_dir"
            else
                print_warning "ローカライゼーションディレクトリが見つかりません"
            fi
            ;;
        *)
            print_warning "プラットフォーム固有のローカライゼーションチェックをスキップ"
            ;;
    esac
}

check_i18n

# ========================================
# 結果サマリー
# ========================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN} 検証結果${NC}"
echo -e "${CYAN}========================================${NC}"
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
echo -e "テーマ標準: ${CYAN}insight-common/standards/COOL_COLOR.md${NC}"
echo -e "カラー定義: ${CYAN}insight-common/brand/colors-cool.json${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Cool Blue & Slate 標準に準拠していません。修正してください。${NC}"
    exit 1
fi

exit 0
