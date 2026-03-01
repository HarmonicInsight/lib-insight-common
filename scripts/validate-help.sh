#!/bin/bash
#
# Insight Series ヘルプシステム標準検証スクリプト
#
# config/help-content.ts と standards/HELP_SYSTEM.md をソースオブトゥルースとして、
# プロジェクトの HelpWindow 実装が標準に準拠しているかを検証します。
#
# 使い方:
#   ./validate-help.sh <project-directory>
#
# 検証内容:
#   1. HelpWindow.xaml / HelpWindow.xaml.cs の存在
#   2. セクション ID が string 型（integer 禁止）
#   3. HelpWindow の開き方が ShowDialog()（Show() 禁止）
#   4. XAML 内のハードコード色がないか
#   5. 必須セクション（overview, ui-layout, shortcuts, license, system-req, support）の存在
#   6. F1 キーバインドの設定
#   7. コンテキストヘルプ（?）ボタンの存在
#   8. static ShowSection() メソッドの実装
#   9. ウィンドウサイズの標準準拠（1050×740）
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

print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} ヘルプシステム標準検証${NC}"
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
    echo "例: $0 /path/to/your-wpf-app"
    echo ""
    echo "検証内容:"
    echo "  - HelpWindow の存在確認"
    echo "  - セクション ID の型チェック（string 必須）"
    echo "  - ShowDialog() の使用確認（Show() 禁止）"
    echo "  - XAML ハードコード色の検出"
    echo "  - 必須セクションの存在確認"
    echo "  - F1 キーバインド・? ボタンの確認"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
    exit 1
fi

# WPF プロジェクトか確認
if ! compgen -G "$PROJECT_DIR"/*.csproj > /dev/null 2>&1 && \
   ! compgen -G "$PROJECT_DIR"/**/*.csproj > /dev/null 2>&1; then
    echo -e "${YELLOW}警告: .csproj ファイルが見つかりません。WPF プロジェクト以外では検証結果が限定的です。${NC}"
fi

print_header
echo "検証対象: $PROJECT_DIR"
echo "標準定義: config/help-content.ts"
echo "仕様書: standards/HELP_SYSTEM.md"

# ========================================
# 1. HelpWindow の存在確認
# ========================================
print_section "1" "HelpWindow の存在確認"

HELP_WINDOW_XAML=$(find "$PROJECT_DIR" -name "HelpWindow.xaml" -not -path "*/insight-common/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null | head -1)
HELP_WINDOW_CS=$(find "$PROJECT_DIR" -name "HelpWindow.xaml.cs" -not -path "*/insight-common/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null | head -1)

if [ -n "$HELP_WINDOW_XAML" ]; then
    print_ok "HelpWindow.xaml が存在: $HELP_WINDOW_XAML"
else
    print_error "HelpWindow.xaml が見つかりません"
    echo "      → Views/HelpWindow.xaml を作成してください（standards/HELP_SYSTEM.md 参照）"
fi

if [ -n "$HELP_WINDOW_CS" ]; then
    print_ok "HelpWindow.xaml.cs が存在: $HELP_WINDOW_CS"
else
    print_error "HelpWindow.xaml.cs が見つかりません"
fi

# ========================================
# 2. セクション ID の型チェック
# ========================================
print_section "2" "セクション ID の型チェック（string 必須・integer 禁止）"

if [ -n "$HELP_WINDOW_CS" ]; then
    # integer ベースのセクション ID パターンを検出
    INTEGER_ID=$(grep -n "case [0-9]\+:\|sectionId\s*==\s*[0-9]\|section\s*==\s*[0-9]\|int\s\+.*[Ss]ection\|\.Sections\[[0-9]" "$HELP_WINDOW_CS" 2>/dev/null | head -5)
    if [ -n "$INTEGER_ID" ]; then
        print_error "セクション ID に integer が使用されています（string に移行してください）"
        echo "      $(echo "$INTEGER_ID" | head -2)"
    else
        print_ok "セクション ID は string 型"
    fi

    # scrollIntoView の使用確認（integer index ではなく string ID）
    SCROLL_BY_INDEX=$(grep -n "scrollTo.*[0-9]\|scroll.*Index\|section\[" "$HELP_WINDOW_CS" 2>/dev/null | head -3)
    if [ -n "$SCROLL_BY_INDEX" ]; then
        print_warning "インデックスベースのスクロール検出（ID ベースに移行推奨）"
        echo "      $(echo "$SCROLL_BY_INDEX" | head -1)"
    fi
else
    print_warning "HelpWindow.xaml.cs が見つからないためスキップ"
fi

# ========================================
# 3. ShowDialog() の使用確認
# ========================================
print_section "3" "HelpWindow の開き方（ShowDialog 必須・Show 禁止）"

# プロジェクト全体で HelpWindow の開き方を検索
SHOW_DIALOG_USAGE=$(grep -rn "HelpWindow.*ShowDialog\|helpWindow.*ShowDialog\|\.ShowDialog()" "$PROJECT_DIR" \
    --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | \
    grep -i "help" | head -5)

SHOW_USAGE=$(grep -rn "HelpWindow.*\.Show()\|helpWindow.*\.Show()" "$PROJECT_DIR" \
    --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | \
    grep -vi "ShowDialog" | head -5)

if [ -n "$SHOW_USAGE" ]; then
    print_error "HelpWindow が Show() で開かれています（ShowDialog() に変更してください）"
    echo "$SHOW_USAGE" | while IFS= read -r line; do
        echo "      $line"
    done
elif [ -n "$SHOW_DIALOG_USAGE" ]; then
    print_ok "HelpWindow は ShowDialog() で開かれている"
else
    if [ -n "$HELP_WINDOW_CS" ]; then
        print_warning "HelpWindow の開き方が確認できません"
    fi
fi

# ========================================
# 4. XAML ハードコード色の検出
# ========================================
print_section "4" "XAML ハードコード色の検出"

if [ -n "$HELP_WINDOW_XAML" ]; then
    # HelpWindow.xaml 内のハードコード色を検出
    HARDCODED_COLORS=$(grep -n 'Background="#\|Foreground="#\|Color="#\|Fill="#\|Stroke="#\|BorderBrush="#' "$HELP_WINDOW_XAML" 2>/dev/null | head -10)

    if [ -n "$HARDCODED_COLORS" ]; then
        print_error "HelpWindow.xaml にハードコード色が検出されました（DynamicResource を使用してください）"
        echo "$HARDCODED_COLORS" | while IFS= read -r line; do
            echo "      $line"
        done
    else
        print_ok "HelpWindow.xaml にハードコード色なし"
    fi
else
    print_warning "HelpWindow.xaml が見つからないためスキップ"
fi

# ========================================
# 5. 必須セクションの存在確認
# ========================================
print_section "5" "必須セクション（6カテゴリ）の確認"

REQUIRED_IDS=("overview" "ui-layout" "shortcuts" "license" "system-req" "support")
REQUIRED_LABELS=("はじめに/概要" "画面構成" "ショートカット" "ライセンス" "システム要件" "お問い合わせ")

if [ -n "$HELP_WINDOW_CS" ]; then
    for i in "${!REQUIRED_IDS[@]}"; do
        ID="${REQUIRED_IDS[$i]}"
        LABEL="${REQUIRED_LABELS[$i]}"
        # セクション ID またはラベルを検索
        if grep -q "\"$ID\"\|'$ID'" "$HELP_WINDOW_CS" 2>/dev/null; then
            print_ok "セクション '$ID' ($LABEL) が定義されている"
        elif grep -q "$LABEL" "$HELP_WINDOW_CS" 2>/dev/null; then
            print_ok "セクション '$ID' ($LABEL) が定義されている（ラベルで検出）"
        else
            print_error "必須セクション '$ID' ($LABEL) が見つかりません"
        fi
    done

    # AI 搭載製品の場合は ai-assistant も必須
    AI_SECTION=$(grep -c "ai-assistant\|ai_assistant\|AIアシスタント" "$HELP_WINDOW_CS" 2>/dev/null || echo "0")
    if [ "$AI_SECTION" -gt 0 ]; then
        print_ok "AI アシスタントセクションが定義されている"
    else
        print_warning "ai-assistant セクションが見つかりません（AI 搭載製品の場合は必須）"
    fi
else
    print_warning "HelpWindow.xaml.cs が見つからないためスキップ"
fi

# ========================================
# 6. F1 キーバインドの確認
# ========================================
print_section "6" "F1 キーバインドの確認"

F1_BINDING=$(grep -rn "Key=\"F1\"\|Key=.F1.\|KeyBinding.*F1\|F1.*ShowHelp\|F1.*HelpWindow" "$PROJECT_DIR" \
    --include="*.xaml" --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -3)

if [ -n "$F1_BINDING" ]; then
    print_ok "F1 キーバインドが設定されている"
else
    print_error "F1 キーバインドが見つかりません"
    echo "      → MainWindow.xaml の InputBindings に以下を追加:"
    echo '      <KeyBinding Key="F1" Command="{Binding ShowHelpSectionCommand}" CommandParameter="overview" />'
fi

# ========================================
# 7. コンテキストヘルプ（?）ボタンの確認
# ========================================
print_section "7" "コンテキストヘルプ（?）ボタンの確認"

HELP_BUTTONS=$(grep -rn 'ShowHelpSection\|HelpRequested\|ShowSection\|&#xE897;\|ContextHelp\|"?".*Help' "$PROJECT_DIR" \
    --include="*.xaml" --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -10)

HELP_BUTTON_COUNT=$(echo "$HELP_BUTTONS" | grep -c "." 2>/dev/null || echo "0")

if [ "$HELP_BUTTON_COUNT" -gt 0 ]; then
    print_ok "コンテキストヘルプボタン: ${HELP_BUTTON_COUNT} 箇所で検出"
else
    print_warning "コンテキストヘルプ（?）ボタンが見つかりません"
    echo "      → 各パネルヘッダーに ? ボタンを追加してください（standards/HELP_SYSTEM.md §5 参照）"
fi

# ShowHelpSectionCommand の実装確認
SHOW_HELP_CMD=$(grep -rn "ShowHelpSectionCommand\|ShowHelpSection\b" "$PROJECT_DIR" \
    --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -3)

if [ -n "$SHOW_HELP_CMD" ]; then
    print_ok "ShowHelpSectionCommand が実装されている"
else
    print_warning "ShowHelpSectionCommand が見つかりません"
fi

# ========================================
# 8. static ShowSection() メソッドの確認
# ========================================
print_section "8" "static ShowSection() メソッドの確認"

if [ -n "$HELP_WINDOW_CS" ]; then
    STATIC_SHOW=$(grep -n "static.*ShowSection\|public static.*Show" "$HELP_WINDOW_CS" 2>/dev/null | head -3)

    if [ -n "$STATIC_SHOW" ]; then
        print_ok "static ShowSection() メソッドが実装されている"
    else
        print_error "static ShowSection() メソッドが見つかりません"
        echo "      → HelpWindow.xaml.cs に以下を追加:"
        echo '      public static void ShowSection(Window owner, string sectionId)'
        echo '      {'
        echo '          var helpWindow = new HelpWindow(sectionId) { Owner = owner };'
        echo '          helpWindow.ShowDialog();'
        echo '      }'
    fi
else
    print_warning "HelpWindow.xaml.cs が見つからないためスキップ"
fi

# ========================================
# 9. ウィンドウサイズの標準確認
# ========================================
print_section "9" "ウィンドウサイズの確認（標準: 1050×740）"

if [ -n "$HELP_WINDOW_XAML" ]; then
    # Width と Height を確認
    WIDTH=$(grep -o 'Width="[0-9]*"' "$HELP_WINDOW_XAML" 2>/dev/null | head -1 | grep -o '[0-9]*')
    HEIGHT=$(grep -o 'Height="[0-9]*"' "$HELP_WINDOW_XAML" 2>/dev/null | head -1 | grep -o '[0-9]*')

    if [ "$WIDTH" = "1050" ] && [ "$HEIGHT" = "740" ]; then
        print_ok "ウィンドウサイズが標準 (1050×740) に準拠"
    elif [ -n "$WIDTH" ] && [ -n "$HEIGHT" ]; then
        print_warning "ウィンドウサイズが標準と異なります: ${WIDTH}×${HEIGHT}（標準: 1050×740）"
    else
        print_warning "ウィンドウサイズが XAML から取得できません"
    fi
fi

if [ -n "$HELP_WINDOW_CS" ]; then
    # C# コード側のサイズ指定も確認
    CS_WIDTH=$(grep -n "Width\s*=\s*1050\|\.Width\s*=\s*1050" "$HELP_WINDOW_CS" 2>/dev/null | head -1)
    CS_HEIGHT=$(grep -n "Height\s*=\s*740\|\.Height\s*=\s*740" "$HELP_WINDOW_CS" 2>/dev/null | head -1)

    if [ -n "$CS_WIDTH" ] && [ -n "$CS_HEIGHT" ]; then
        print_ok "C# コード内でも標準サイズ (1050×740) が設定されている"
    fi
fi

# ========================================
# 10. Ribbon ヘルプバーの確認
# ========================================
print_section "10" "Ribbon ヘルプバーの確認"

RIBBON_HELP=$(grep -rn 'ShowHelpCommand\|LocHelp.*RibbonButton\|RibbonBar.*Help\|RibbonBar.*ヘルプ\|Header.*ヘルプ.*Ribbon' "$PROJECT_DIR" \
    --include="*.xaml" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -3)

if [ -n "$RIBBON_HELP" ]; then
    print_ok "Ribbon にヘルプバーが存在"
else
    print_warning "Ribbon にヘルプバーが見つかりません"
    echo "      → Home タブの最後に RibbonBar Header=\"ヘルプ\" を追加してください"
fi

# ========================================
# 11. InsightWindowChrome.CreateHelpMenu の使用確認
# ========================================
print_section "11" "InsightWindowChrome.CreateHelpMenu の使用確認"

CREATE_HELP_MENU=$(grep -rn "CreateHelpMenu\|InsightWindowChrome.*Help" "$PROJECT_DIR" \
    --include="*.cs" \
    --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -3)

if [ -n "$CREATE_HELP_MENU" ]; then
    print_ok "InsightWindowChrome.CreateHelpMenu() が使用されている"

    # 新オーバーロード（HelpMenuItemDefinition）が使われているか
    NEW_OVERLOAD=$(grep -rn "HelpMenuItemDefinition\|IReadOnlyList.*HelpMenu\|helpTopics" "$PROJECT_DIR" \
        --include="*.cs" \
        --exclude-dir=insight-common --exclude-dir=bin --exclude-dir=obj 2>/dev/null | head -3)

    if [ -n "$NEW_OVERLOAD" ]; then
        print_ok "新オーバーロード（HelpMenuItemDefinition ベース）を使用"
    else
        print_warning "旧オーバーロードを使用しています（HelpMenuItemDefinition ベースに移行推奨）"
    fi
else
    print_warning "InsightWindowChrome.CreateHelpMenu() の使用が確認できません"
fi

# ========================================
# 結果サマリー
# ========================================
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} ヘルプシステム検証結果${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}エラー: $ERRORS 件${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}警告: $WARNINGS 件${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}すべてのヘルプシステムチェックに合格しました！${NC}"
fi

echo ""
echo -e "仕様: ${BLUE}standards/HELP_SYSTEM.md${NC}"
echo -e "定義: ${BLUE}config/help-content.ts${NC}"
echo -e "型:   ${BLUE}csharp/InsightCommon/UI/HelpMenuItemDefinition.cs${NC}"
echo ""

# 終了コード
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}ヘルプシステムが標準に準拠していません。修正してください。${NC}"
    exit 1
fi

exit 0
