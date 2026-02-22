#!/bin/bash
#
# Insight Series メニューアイコン標準検証スクリプト
#
# brand/menu-icons.json をソースオブトゥルースとして、
# プロジェクト内で使用されているメニューアイコンが標準に準拠しているかを検証します。
#
# 使い方:
#   ./validate-menu-icons.sh <project-directory>
#
# 検証内容:
#   1. Lucide Icons ライブラリが使用されているか
#   2. 非標準アイコンライブラリが混入していないか
#   3. brand/menu-icons.json に定義されたアイコン名が使用されているか
#   4. 同じ機能に製品間で異なるアイコンが使われていないか
#

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
NC='\033[0m'

# 検証結果
ERRORS=0
WARNINGS=0

# スクリプトの場所を基準に insight-common を解決
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSIGHT_COMMON_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MENU_ICONS_JSON="$INSIGHT_COMMON_DIR/brand/menu-icons.json"

print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} メニューアイコン標準検証${NC}"
    echo -e "${GOLD}========================================${NC}"
    echo ""
}

print_section() {
    echo ""
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
    echo "検証内容:"
    echo "  - Lucide Icons ライブラリの使用確認"
    echo "  - 非標準アイコンライブラリの検出"
    echo "  - brand/menu-icons.json との整合性チェック"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
    exit 1
fi

# menu-icons.json の存在確認
if [ ! -f "$MENU_ICONS_JSON" ]; then
    # プロジェクト内のサブモジュールとしてのパスも確認
    if [ -f "$PROJECT_DIR/insight-common/brand/menu-icons.json" ]; then
        MENU_ICONS_JSON="$PROJECT_DIR/insight-common/brand/menu-icons.json"
    else
        echo -e "${RED}エラー: brand/menu-icons.json が見つかりません${NC}"
        echo "  検索パス: $MENU_ICONS_JSON"
        echo "  検索パス: $PROJECT_DIR/insight-common/brand/menu-icons.json"
        exit 1
    fi
fi

# プラットフォーム検出
detect_platform() {
    if compgen -G "$PROJECT_DIR"/*.csproj > /dev/null 2>&1; then
        echo "csharp"
    elif [ -f "$PROJECT_DIR/build.gradle.kts" ] || [ -f "$PROJECT_DIR/build.gradle" ]; then
        echo "android"
    elif [ -f "$PROJECT_DIR/package.json" ]; then
        if grep -q '"expo"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            echo "expo"
        elif [ -f "$PROJECT_DIR/src-tauri/tauri.conf.json" ]; then
            echo "tauri"
        else
            echo "react"
        fi
    elif [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ]; then
        echo "python"
    else
        echo "unknown"
    fi
}

print_header
PLATFORM=$(detect_platform)
echo "検証対象: $PROJECT_DIR"
echo "プラットフォーム: $PLATFORM"
echo "アイコン定義: $MENU_ICONS_JSON"

# ========================================
# 1. アイコンライブラリ使用チェック
# ========================================
print_section "1" "アイコンライブラリ検証"

check_lucide_usage() {
    case "$PLATFORM" in
        react|tauri|expo)
            # lucide-react が依存関係にあるか
            if [ -f "$PROJECT_DIR/package.json" ]; then
                if grep -q '"lucide-react"' "$PROJECT_DIR/package.json" 2>/dev/null; then
                    print_ok "lucide-react が依存関係にインストールされている"
                else
                    print_warning "lucide-react が package.json に見つかりません"
                    echo "        → npm install lucide-react でインストールしてください"
                fi
            fi

            # インポート文の確認
            local lucide_imports=$(grep -r "from ['\"]lucide-react['\"]" "$PROJECT_DIR" \
                --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
                --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | wc -l)
            if [ "$lucide_imports" -gt 0 ]; then
                print_ok "Lucide Icons のインポート: ${lucide_imports} 件"
            else
                print_warning "Lucide Icons のインポートが見つかりません"
            fi
            ;;

        csharp)
            # XAML リソースに Lucide パスデータがあるか
            local icon_resources=$(grep -r "Icon\.\|MenuIcon" "$PROJECT_DIR" \
                --include="*.xaml" --include="*.cs" \
                --exclude-dir=insight-common 2>/dev/null | wc -l)
            if [ "$icon_resources" -gt 0 ]; then
                print_ok "アイコンリソース参照: ${icon_resources} 件"
            else
                print_warning "アイコンリソース参照が見つかりません"
            fi
            ;;

        python)
            # menu-icons.json を読み込んでいるか
            local json_ref=$(grep -r "menu.icons\|menu_icons" "$PROJECT_DIR" \
                --include="*.py" \
                --exclude-dir=insight-common --exclude-dir=__pycache__ 2>/dev/null | wc -l)
            if [ "$json_ref" -gt 0 ]; then
                print_ok "menu-icons 参照: ${json_ref} 件"
            else
                print_warning "menu-icons.json の参照が見つかりません"
            fi
            ;;
    esac
}

check_lucide_usage

# ========================================
# 2. 非標準ライブラリ検出
# ========================================
print_section "2" "非標準アイコンライブラリの検出"

check_non_standard_libraries() {
    local found_non_standard=0

    # Material Design Icons
    local mdi=$(grep -r "material-design-icons\|@mdi/\|MaterialDesignIcons\|mdi-\|MaterialIcon" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --include="*.cs" --include="*.xaml" --include="*.json" --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | head -3)
    if [ -n "$mdi" ]; then
        print_error "Material Design Icons が使用されています（Lucide Icons に統一してください）"
        echo "      $(echo "$mdi" | head -1)"
        found_non_standard=1
    fi

    # Font Awesome
    local fa=$(grep -r "font-awesome\|fontawesome\|fa-\|FontAwesome" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --include="*.cs" --include="*.xaml" --include="*.json" --include="*.py" --include="*.css" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | head -3)
    if [ -n "$fa" ]; then
        print_error "Font Awesome が使用されています（Lucide Icons に統一してください）"
        echo "      $(echo "$fa" | head -1)"
        found_non_standard=1
    fi

    # Heroicons
    local hero=$(grep -r "@heroicons\|heroicons" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | head -3)
    if [ -n "$hero" ]; then
        print_error "Heroicons が使用されています（Lucide Icons に統一してください）"
        echo "      $(echo "$hero" | head -1)"
        found_non_standard=1
    fi

    # Phosphor Icons
    local phosphor=$(grep -r "phosphor-react\|@phosphor-icons" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | head -3)
    if [ -n "$phosphor" ]; then
        print_error "Phosphor Icons が使用されています（Lucide Icons に統一してください）"
        echo "      $(echo "$phosphor" | head -1)"
        found_non_standard=1
    fi

    # Segoe MDL2 Assets (WPF)
    if [ "$PLATFORM" = "csharp" ]; then
        local segoe=$(grep -r "Segoe MDL2\|SegoeFluentIcons\|Symbol=" "$PROJECT_DIR" \
            --include="*.xaml" --include="*.cs" \
            --exclude-dir=insight-common 2>/dev/null | head -3)
        if [ -n "$segoe" ]; then
            print_error "Segoe MDL2 Assets / Fluent Icons が使用されています（Lucide SVG パスデータに統一してください）"
            echo "      $(echo "$segoe" | head -1)"
            found_non_standard=1
        fi
    fi

    if [ $found_non_standard -eq 0 ]; then
        print_ok "非標準アイコンライブラリは検出されませんでした"
    fi
}

check_non_standard_libraries

# ========================================
# 3. 標準アイコン名の使用チェック
# ========================================
print_section "3" "標準アイコン名の使用チェック"

check_standard_icon_names() {
    # menu-icons.json から全アイコン名を抽出
    local standard_icons=$(grep '"icon"' "$MENU_ICONS_JSON" | sed 's/.*"icon":\s*"\([^"]*\)".*/\1/' | sort -u)
    local standard_count=$(echo "$standard_icons" | wc -l)
    print_ok "標準アイコン定義数: ${standard_count} 件"

    case "$PLATFORM" in
        react|tauri|expo)
            # Lucide インポートから使用されているアイコン名を抽出
            local used_icons=$(grep -rh "import.*from ['\"]lucide-react['\"]" "$PROJECT_DIR" \
                --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
                --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null \
                | sed 's/import\s*{//;s/}\s*from.*//' \
                | tr ',' '\n' \
                | sed 's/^\s*//;s/\s*$//' \
                | grep -v '^$' \
                | sort -u)

            if [ -n "$used_icons" ]; then
                local used_count=$(echo "$used_icons" | wc -l)
                print_ok "プロジェクトで使用されている Lucide アイコン: ${used_count} 件"

                # 標準定義に含まれていないアイコンを検出
                local non_standard_count=0
                while IFS= read -r icon; do
                    if ! echo "$standard_icons" | grep -qx "$icon"; then
                        # "as" エイリアスの場合は除外
                        if ! echo "$icon" | grep -q " as "; then
                            print_warning "非標準アイコン: ${icon}（brand/menu-icons.json に未定義）"
                            ((non_standard_count++)) || true
                        fi
                    fi
                done <<< "$used_icons"

                if [ $non_standard_count -eq 0 ]; then
                    print_ok "全アイコンが標準定義に含まれています"
                else
                    echo -e "    ${YELLOW}→ 非標準アイコンは brand/menu-icons.json に追加するか、標準アイコンに置き換えてください${NC}"
                fi
            else
                print_warning "Lucide アイコンのインポートが見つかりません"
            fi
            ;;

        csharp)
            # XAML の Icon.* リソース名を検出
            local icon_keys=$(grep -rh 'x:Key="Icon\.' "$PROJECT_DIR" \
                --include="*.xaml" \
                --exclude-dir=insight-common 2>/dev/null \
                | sed 's/.*x:Key="Icon\.\([^"]*\)".*/\1/' \
                | sort -u)

            if [ -n "$icon_keys" ]; then
                local key_count=$(echo "$icon_keys" | wc -l)
                print_ok "XAML アイコンリソースキー: ${key_count} 件"
            else
                print_warning "XAML アイコンリソースキーが見つかりません"
            fi
            ;;

        *)
            print_warning "アイコン名チェックは React/Tauri/Expo/C# プラットフォームで対応しています"
            ;;
    esac
}

check_standard_icon_names

# ========================================
# 4. アイコンスタイルの一貫性チェック
# ========================================
print_section "4" "アイコンスタイルの一貫性"

check_icon_style() {
    case "$PLATFORM" in
        react|tauri|expo)
            # strokeWidth の統一チェック（1.5 が標準）
            local non_standard_stroke=$(grep -rn "strokeWidth" "$PROJECT_DIR" \
                --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
                --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null \
                | grep -v "strokeWidth={1.5}" \
                | grep -v "strokeWidth=\s*{1.5}" \
                | grep -v 'strokeWidth="1.5"' \
                | grep -v "// " \
                | head -5)

            if [ -n "$non_standard_stroke" ]; then
                print_warning "標準外の strokeWidth が使用されています（標準: 1.5）"
                echo "      $(echo "$non_standard_stroke" | head -2)"
            else
                local any_stroke=$(grep -r "strokeWidth" "$PROJECT_DIR" \
                    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
                    --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null | head -1)
                if [ -n "$any_stroke" ]; then
                    print_ok "strokeWidth が標準値 (1.5) で統一されている"
                else
                    print_ok "strokeWidth 指定なし（ライブラリデフォルトを使用）"
                fi
            fi

            # アイコンサイズの確認
            local non_standard_size=$(grep -rn "size={[0-9]" "$PROJECT_DIR" \
                --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
                --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.next 2>/dev/null \
                | grep -v "size={16}" \
                | grep -v "size={20}" \
                | grep -v "size={24}" \
                | grep -v "size={32}" \
                | head -5)

            if [ -n "$non_standard_size" ]; then
                print_warning "非標準サイズのアイコンが使用されています（標準: 16/20/24/32px）"
                echo "      $(echo "$non_standard_size" | head -2)"
            else
                print_ok "アイコンサイズが標準値に準拠"
            fi
            ;;

        csharp)
            # StrokeThickness の統一チェック
            local non_standard_stroke=$(grep -rn "StrokeThickness" "$PROJECT_DIR" \
                --include="*.xaml" \
                --exclude-dir=insight-common 2>/dev/null \
                | grep -v 'StrokeThickness="1.5"' \
                | grep -v "StrokeThickness=\"{" \
                | head -5)

            if [ -n "$non_standard_stroke" ]; then
                print_warning "標準外の StrokeThickness が使用されています（標準: 1.5）"
                echo "      $(echo "$non_standard_stroke" | head -2)"
            else
                print_ok "StrokeThickness が標準値で統一されている"
            fi
            ;;

        *)
            print_ok "スタイルチェックはスキップ"
            ;;
    esac
}

check_icon_style

# ========================================
# 5. menu-icons.json の整合性チェック
# ========================================
print_section "5" "menu-icons.json 整合性チェック"

check_json_integrity() {
    # JSON パース可能か
    if command -v python3 > /dev/null 2>&1; then
        if python3 -c "import json; json.load(open('$MENU_ICONS_JSON'))" 2>/dev/null; then
            print_ok "menu-icons.json は有効な JSON"
        else
            print_error "menu-icons.json の JSON パースに失敗"
            return 1
        fi

        # カテゴリ数と全アイコン数を集計
        local stats=$(python3 -c "
import json
with open('$MENU_ICONS_JSON') as f:
    data = json.load(f)
cats = data.get('categories', {})
total_icons = 0
for cat in cats.values():
    total_icons += len(cat.get('icons', {}))
print(f'{len(cats)} {total_icons}')
" 2>/dev/null)

        if [ -n "$stats" ]; then
            local cat_count=$(echo "$stats" | cut -d' ' -f1)
            local icon_count=$(echo "$stats" | cut -d' ' -f2)
            print_ok "カテゴリ数: ${cat_count}、アイコン定義数: ${icon_count}"
        fi

        # 重複アイコン名チェック（同じアクション ID が複数カテゴリに存在しないか）
        local duplicates=$(python3 -c "
import json
with open('$MENU_ICONS_JSON') as f:
    data = json.load(f)
seen = {}
dups = []
for cat_id, cat in data.get('categories', {}).items():
    for action_id in cat.get('icons', {}):
        if action_id in seen:
            dups.append(f'{action_id} ({seen[action_id]} と {cat_id})')
        else:
            seen[action_id] = cat_id
for d in dups:
    print(d)
" 2>/dev/null)

        if [ -n "$duplicates" ]; then
            print_warning "重複するアクション ID があります:"
            echo "      $duplicates"
        else
            print_ok "アクション ID に重複なし"
        fi

        # 全アイコンに ja/en ラベルがあるか
        local missing_labels=$(python3 -c "
import json
with open('$MENU_ICONS_JSON') as f:
    data = json.load(f)
missing = []
for cat_id, cat in data.get('categories', {}).items():
    for action_id, icon in cat.get('icons', {}).items():
        label = icon.get('label', {})
        if not label.get('ja') or not label.get('en'):
            missing.append(f'{action_id} (category: {cat_id})')
for m in missing:
    print(m)
" 2>/dev/null)

        if [ -n "$missing_labels" ]; then
            print_error "日英ラベルが欠けているアイコンがあります:"
            echo "      $missing_labels"
        else
            print_ok "全アイコンに日本語・英語ラベルが定義されている"
        fi

    else
        print_warning "python3 が見つかりません。JSON 整合性チェックをスキップします"
    fi
}

check_json_integrity

# ========================================
# 結果サマリー
# ========================================
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} メニューアイコン検証結果${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}エラー: $ERRORS 件${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}警告: $WARNINGS 件${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}すべてのメニューアイコンチェックに合格しました！${NC}"
fi

echo ""
echo -e "参照: ${BLUE}standards/MENU_ICONS.md${NC}"
echo -e "定義: ${BLUE}brand/menu-icons.json${NC}"
echo -e "API:  ${BLUE}config/menu-icons.ts${NC}"
echo ""

# 終了コード
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}メニューアイコンが標準に準拠していません。修正してください。${NC}"
    exit 1
fi

exit 0
