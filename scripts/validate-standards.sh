#!/bin/bash
#
# Insight Series 標準検証スクリプト
# 新規プロジェクト作成時、PR作成時に実行必須:
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
    echo -e "  ${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "  ${RED}❌${NC} $1"
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

# ============================================================
# insight-common サブモジュール自動セットアップ
# ============================================================
if [ -f "$PROJECT_DIR/.gitmodules" ] && grep -q "insight-common" "$PROJECT_DIR/.gitmodules" 2>/dev/null; then
    if [ ! -f "$PROJECT_DIR/insight-common/CLAUDE.md" ]; then
        echo -e "${YELLOW}insight-common サブモジュールを初期化しています...${NC}"
        git -C "$PROJECT_DIR" submodule init 2>/dev/null || true
        git -C "$PROJECT_DIR" submodule update --recursive 2>/dev/null || true
    fi
    # スクリプトの実行権限を付与
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

# ========================================
# 1. デザインシステム検証（全プラットフォーム共通）
# ========================================
print_section "1" "デザインシステム（Ivory & Gold Theme）検証"

# 禁止: Blue (#2563EB) がプライマリとして使用されている
check_blue_primary() {
    local blue_as_primary=$(grep -r "primary.*#2563EB\|#2563EB.*primary\|Primary.*2563EB\|primaryColor.*2563EB" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -5)

    if [ -n "$blue_as_primary" ]; then
        print_error "Blue (#2563EB) がプライマリとして使用されています"
        echo "      $blue_as_primary" | head -3
        return 1
    fi
    print_ok "Blue がプライマリとして使用されていません"
    return 0
}

# 必須: Gold (#B8942F) がプライマリとして使用されている
check_gold_primary() {
    local gold_primary=$(grep -r "#B8942F\|B8942F\|0xFFB8942F" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

    if [ -z "$gold_primary" ]; then
        print_error "Gold (#B8942F) が見つかりません"
        return 1
    fi
    print_ok "Gold (#B8942F) が使用されている"
    return 0
}

# 必須: Ivory背景 (#FAF8F5) が使用されている
check_ivory_background() {
    local ivory=$(grep -r "#FAF8F5\|FAF8F5\|0xFFFAF8F5" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

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
    local license_file=$(find "$PROJECT_DIR" \( -name "*LicenseManager*" -o -name "*license_manager*" \) -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)

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
print_section "3" "製品コード検証"

check_product_code() {
    local product_codes="INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN"
    local found_code=$(grep -rE "($product_codes)" "$PROJECT_DIR" --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" --include="*.kt" --include="*.json" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

    if [ -z "$found_code" ]; then
        print_warning "登録済み製品コードが見つかりません（新規製品の場合は config/products.ts に登録してください）"
        return 1
    fi
    print_ok "製品コードが使用されている"
    return 0
}

check_product_code || true

# ========================================
# 4. C# (WPF) 固有検証
# ========================================
if [ "$PLATFORM" = "csharp" ]; then
    echo ""
    print_section "4" "C# (WPF) 固有チェック"

    # 4.1 Colors.xaml の存在確認
    colors_xaml=$(find "$PROJECT_DIR" -name "Colors.xaml" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$colors_xaml" ]; then
        print_ok "Colors.xaml が存在: $colors_xaml"
    else
        print_error "Colors.xaml が見つかりません（Themes/Colors.xaml を作成してください）"
    fi

    # 4.2 Styles.xaml の存在確認
    styles_xaml=$(find "$PROJECT_DIR" -name "Styles.xaml" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$styles_xaml" ]; then
        print_ok "Styles.xaml が存在: $styles_xaml"
    else
        print_warning "Styles.xaml が見つかりません（Themes/Styles.xaml を作成してください）"
    fi

    # 4.3 XAML ファイル内のハードコードされた色をチェック
    echo ""
    print_section "4.3" "ハードコードされた色のチェック"

    # Colors.xaml を除外してハードコードされた色を検索
    hardcoded_colors=$(grep -rE '(Background|Foreground|Fill|Stroke|BorderBrush)="#[0-9A-Fa-f]{6}"' "$PROJECT_DIR" \
        --include="*.xaml" \
        --exclude="Colors.xaml" \
        --exclude-dir=bin \
        --exclude-dir=obj \
        --exclude-dir=insight-common \
        2>/dev/null | grep -v "<!--" | head -10)

    if [ -n "$hardcoded_colors" ]; then
        print_error "ハードコードされた色が見つかりました（StaticResource を使用してください）:"
        echo "$hardcoded_colors" | while read -r line; do
            echo "      $line"
        done | head -5
        echo "      ... (最初の5件を表示)"
    else
        print_ok "ハードコードされた色なし（StaticResource が使用されています）"
    fi

    # SolidColorBrush の Color 属性もチェック（x:Key がないもの）
    hardcoded_brush=$(grep -rE '<SolidColorBrush[^>]*Color="#[0-9A-Fa-f]{6}"' "$PROJECT_DIR" \
        --include="*.xaml" \
        --exclude="Colors.xaml" \
        --exclude-dir=bin \
        --exclude-dir=obj \
        --exclude-dir=insight-common \
        2>/dev/null | grep -v "x:Key" | grep -v "<!--" | head -5)

    if [ -n "$hardcoded_brush" ]; then
        print_error "インライン SolidColorBrush が見つかりました（Colors.xaml でリソースとして定義してください）:"
        echo "$hardcoded_brush" | while read -r line; do
            echo "      $line"
        done | head -3
    else
        print_ok "インライン SolidColorBrush なし"
    fi

    # 4.4 Syncfusion 内部スタイルの上書きチェック
    echo ""
    print_section "4.4" "Syncfusion コンポーネントの不正な上書きチェック"

    syncfusion_override=$(grep -rE '(syncfusion:|sf:)[A-Za-z]+\.(Resources|Style)>' "$PROJECT_DIR" \
        --include="*.xaml" \
        --exclude-dir=bin \
        --exclude-dir=obj \
        --exclude-dir=insight-common \
        2>/dev/null | head -5)

    if [ -n "$syncfusion_override" ]; then
        print_warning "Syncfusion コンポーネントの内部リソース/スタイル上書きが検出されました:"
        echo "$syncfusion_override" | while read -r line; do
            echo "      $line"
        done
        echo "      → Syncfusion のテーマ設定または SfSkinManager を使用してください"
    else
        print_ok "Syncfusion 内部スタイルの不正な上書きなし"
    fi

    # 4.5 App.xaml での ResourceDictionary 登録確認
    app_xaml=$(find "$PROJECT_DIR" -name "App.xaml" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$app_xaml" ]; then
        if grep -q "Colors.xaml" "$app_xaml" 2>/dev/null; then
            print_ok "App.xaml: Colors.xaml が登録されています"
        else
            print_warning "App.xaml: Colors.xaml が MergedDictionaries に登録されていません"
        fi

        if grep -q "Styles.xaml" "$app_xaml" 2>/dev/null; then
            print_ok "App.xaml: Styles.xaml が登録されています"
        else
            print_warning "App.xaml: Styles.xaml が MergedDictionaries に登録されていません"
        fi
    else
        print_warning "App.xaml が見つかりません"
    fi

    # 4.6 Syncfusion ライセンス登録確認
    app_cs=$(find "$PROJECT_DIR" -name "App.xaml.cs" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$app_cs" ]; then
        if grep -q "ThirdPartyLicenseProvider\|RegisterSyncfusion\|SyncfusionLicenseProvider" "$app_cs" 2>/dev/null; then
            print_ok "App.xaml.cs: Syncfusion ライセンス登録が実装されています"
        else
            print_warning "App.xaml.cs: Syncfusion ライセンス登録が見つかりません"
        fi
    fi

    # 4.7 .NET バージョン確認
    csproj_file=$(find "$PROJECT_DIR" -name "*.csproj" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$csproj_file" ]; then
        target_framework=$(grep -o '<TargetFramework>[^<]*</TargetFramework>' "$csproj_file" 2>/dev/null | head -1)
        if echo "$target_framework" | grep -qE "net8\.0|net9\.0"; then
            print_ok ".csproj: $target_framework"
        elif [ -n "$target_framework" ]; then
            print_warning ".csproj: $target_framework（net8.0 以上を推奨）"
        fi
    fi

    # 4.8 タイトルバーコンポーネント標準チェック
    echo ""
    print_section "4.8" "タイトルバーコンポーネント標準チェック"

    main_window=$(find "$PROJECT_DIR" -name "MainWindow.xaml" -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$main_window" ]; then
        # ブランド名 "InsightOffice" のチェック
        if grep -qE 'Text="InsightOffice"' "$main_window" 2>/dev/null; then
            print_ok "ブランド名: \"InsightOffice\" が存在"
        else
            print_warning "ブランド名: \"InsightOffice\" が見つかりません"
        fi

        # 製品名（Sheet/Doc/Slide）のチェック
        if grep -qE 'Text="(Sheet|Doc|Slide)"' "$main_window" 2>/dev/null || \
           grep -qE 'ProductName' "$main_window" 2>/dev/null; then
            print_ok "製品名: Sheet/Doc/Slide 形式"
        else
            print_warning "製品名: Sheet/Doc/Slide 形式が見つかりません"
        fi

        # バージョン表示の形式チェック（v{数字}.{数字}.{数字}）
        if grep -qE 'Text="v[0-9]+\.[0-9]+\.[0-9]+"' "$main_window" 2>/dev/null || \
           grep -qE 'StringFormat.*v\{0\}' "$main_window" 2>/dev/null || \
           grep -qE 'VersionText' "$main_window" 2>/dev/null; then
            print_ok "バージョン表示: v{MAJOR}.{MINOR}.{PATCH} 形式"
        else
            print_warning "バージョン表示: v{MAJOR}.{MINOR}.{PATCH} 形式が見つかりません"
        fi

        # プランバッジの存在チェック
        if grep -qE '◀|CurrentPlan|PlanBadge' "$main_window" 2>/dev/null; then
            print_ok "プランバッジ: 存在"
        else
            print_warning "プランバッジ: 見つかりません（◀ {PLAN} 形式を使用）"
        fi

        # ライセンスボタンの存在チェック
        if grep -qE '🔑|LicenseCommand|OpenLicenseCommand|ライセンス|License' "$main_window" 2>/dev/null; then
            print_ok "ライセンスボタン: 存在（🔑 アイコン）"
        else
            print_error "ライセンスボタン: 見つかりません（🔑 ライセンス / 🔑 License を使用）"
        fi

        # 言語切り替えボタンの存在チェック
        if grep -qE 'LanguageCommand|ToggleLanguage|English|日本語' "$main_window" 2>/dev/null; then
            print_ok "言語切り替えボタン: 存在"
        else
            print_warning "言語切り替えボタン: 見つかりません"
        fi

        # ブランド名のフォント設定チェック（FontSize=15, SemiBold, PrimaryBrush）
        brand_style=$(grep -A5 'Text="InsightOffice"' "$main_window" 2>/dev/null | head -6)
        if echo "$brand_style" | grep -qE 'FontSize="15"'; then
            print_ok "ブランド名: FontSize=15"
        else
            print_warning "ブランド名: FontSize=15 が見つかりません"
        fi

        if echo "$brand_style" | grep -qE 'FontWeight="SemiBold"'; then
            print_ok "ブランド名: FontWeight=SemiBold"
        else
            print_warning "ブランド名: FontWeight=SemiBold が見つかりません"
        fi

        if echo "$brand_style" | grep -qE 'Foreground="\{StaticResource PrimaryBrush\}"'; then
            print_ok "ブランド名: Foreground=PrimaryBrush (Gold)"
        else
            print_warning "ブランド名: Foreground={StaticResource PrimaryBrush} が見つかりません"
        fi

        # 製品名のフォント設定チェック（FontSize=15, Normal, TextSecondaryBrush）
        product_style=$(grep -A5 -E 'Text="(Sheet|Doc|Slide)"' "$main_window" 2>/dev/null | head -6)
        if [ -n "$product_style" ]; then
            if echo "$product_style" | grep -qE 'Foreground="\{StaticResource TextSecondaryBrush\}"'; then
                print_ok "製品名: Foreground=TextSecondaryBrush (Gray)"
            else
                print_warning "製品名: Foreground={StaticResource TextSecondaryBrush} が見つかりません"
            fi
        fi

        # バージョンの Margin=12 チェック
        version_style=$(grep -B2 -A3 -E 'Text="v[0-9]|VersionText' "$main_window" 2>/dev/null | head -8)
        if echo "$version_style" | grep -qE 'Margin="12'; then
            print_ok "バージョン: Margin=12"
        else
            print_warning "バージョン: Margin=\"12,0,0,0\" が見つかりません"
        fi
    else
        print_warning "MainWindow.xaml が見つかりません"
    fi

    # 4.9 Syncfusion Ribbon / BackStage 標準チェック
    echo ""
    print_section "4.9" "Syncfusion Ribbon / BackStage 標準チェック"

    # Ribbon を使用している XAML ファイルを検索
    ribbon_xaml=$(grep -rlE '<syncfusion:Ribbon' "$PROJECT_DIR" \
        --include="*.xaml" \
        --exclude-dir=bin \
        --exclude-dir=obj \
        --exclude-dir=insight-common \
        2>/dev/null | head -1)

    if [ -n "$ribbon_xaml" ]; then
        print_ok "Syncfusion Ribbon を使用: $ribbon_xaml"

        # Ribbon に Background 属性がないことを確認
        ribbon_bg=$(grep -E '<syncfusion:Ribbon[^>]*Background=' "$ribbon_xaml" 2>/dev/null | head -1)
        if [ -n "$ribbon_bg" ]; then
            print_error "Ribbon に Background 属性が設定されています（削除してください）:"
            echo "      $ribbon_bg"
        else
            print_ok "Ribbon: Background 属性なし"
        fi

        # ShowCustomizeRibbon="False" の確認
        if grep -qE 'ShowCustomizeRibbon="False"' "$ribbon_xaml" 2>/dev/null; then
            print_ok "Ribbon: ShowCustomizeRibbon=\"False\""
        else
            print_warning "Ribbon: ShowCustomizeRibbon=\"False\" が見つかりません"
        fi

        # EnableSimplifiedLayoutMode="False" の確認
        if grep -qE 'EnableSimplifiedLayoutMode="False"' "$ribbon_xaml" 2>/dev/null; then
            print_ok "Ribbon: EnableSimplifiedLayoutMode=\"False\""
        else
            print_warning "Ribbon: EnableSimplifiedLayoutMode=\"False\" が見つかりません"
        fi

        # BackStageHeader の確認
        if grep -qE 'BackStageHeader=' "$ribbon_xaml" 2>/dev/null; then
            print_ok "Ribbon: BackStageHeader が設定されています"
        else
            print_warning "Ribbon: BackStageHeader が見つかりません（\"ファイル\" を設定）"
        fi

        # Ribbon.Items でタブがラップされているか確認
        if grep -qE '<syncfusion:Ribbon\.Items>' "$ribbon_xaml" 2>/dev/null; then
            print_ok "Ribbon: RibbonTab が Ribbon.Items 内にラップされています"
        else
            print_error "Ribbon: <syncfusion:Ribbon.Items> が見つかりません（RibbonTab をラップしてください）"
        fi

        # Ribbon.Resources の不正な上書きチェック
        ribbon_resources=$(grep -E '<syncfusion:Ribbon\.Resources>' "$ribbon_xaml" 2>/dev/null | head -1)
        if [ -n "$ribbon_resources" ]; then
            print_error "Ribbon: <syncfusion:Ribbon.Resources> による内部スタイル上書きが検出されました（削除してください）"
        else
            print_ok "Ribbon: 内部リソースの不正な上書きなし"
        fi

        # BackStage の存在確認
        if grep -qE '<syncfusion:Ribbon\.BackStage>' "$ribbon_xaml" 2>/dev/null; then
            print_ok "Ribbon: BackStage が定義されています"

            # BackStage に Background 属性がないことを確認
            backstage_bg=$(grep -E '<syncfusion:Backstage[^>]*Background=' "$ribbon_xaml" 2>/dev/null | head -1)
            if [ -n "$backstage_bg" ]; then
                print_error "Backstage に Background 属性が設定されています（削除してください）:"
                echo "      $backstage_bg"
            else
                print_ok "Backstage: Background 属性なし"
            fi

            # Backstage.Resources の不正な上書きチェック
            backstage_resources=$(grep -E '<syncfusion:Backstage\.Resources>' "$ribbon_xaml" 2>/dev/null | head -1)
            if [ -n "$backstage_resources" ]; then
                print_error "Backstage: <syncfusion:Backstage.Resources> による内部スタイル上書きが検出されました（削除してください）"
            else
                print_ok "Backstage: 内部リソースの不正な上書きなし"
            fi

            # 旧 API (RibbonBackStage) の使用チェック
            old_backstage=$(grep -E '<syncfusion:RibbonBackStage' "$ribbon_xaml" 2>/dev/null | head -1)
            if [ -n "$old_backstage" ]; then
                print_warning "旧 API <syncfusion:RibbonBackStage> が使用されています（<syncfusion:Ribbon.BackStage> + <syncfusion:Backstage> を使用）"
            fi

            # 必須 BackStage コマンドの確認
            echo ""
            print_section "4.9.1" "BackStage 必須コマンドチェック"

            for cmd in "新規作成" "開く" "上書き保存" "名前を付けて保存" "印刷" "閉じる"; do
                if grep -qE "Header=\"$cmd\"" "$ribbon_xaml" 2>/dev/null; then
                    print_ok "BackStage コマンド: $cmd"
                else
                    print_warning "BackStage コマンド: $cmd が見つかりません"
                fi
            done
        else
            print_warning "Ribbon: BackStage が定義されていません"
        fi
    else
        # Ribbon を使用していない場合はスキップ
        print_warning "Syncfusion Ribbon が見つかりません（Insight Business Suite 系アプリでは必須）"
    fi
fi

# ========================================
# 5. Android 固有検証
# ========================================
if [ "$PLATFORM" = "android" ]; then
    echo ""
    print_section "5" "Android 固有チェック"

    # 5.1 Version Catalog
    if [ -f "$PROJECT_DIR/gradle/libs.versions.toml" ]; then
        print_ok "gradle/libs.versions.toml が存在"

        agp_ver=$(grep '^agp\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$agp_ver" ]; then
            print_ok "AGP バージョン定義: $agp_ver"
        else
            print_warning "AGP バージョンがlibs.versions.toml に定義されていません"
        fi

        kotlin_ver=$(grep '^kotlin\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$kotlin_ver" ]; then
            print_ok "Kotlin バージョン定義: $kotlin_ver"
        else
            print_warning "Kotlin バージョンがlibs.versions.toml に定義されていません"
        fi
    else
        print_error "gradle/libs.versions.toml が見つかりません"
    fi

    # 5.2 SDK バージョン
    build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" -path "*/app/*" 2>/dev/null | head -1)
    if [ -z "$build_file" ]; then
        build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" 2>/dev/null | grep -v '/build/' | head -1)
    fi

    if [ -n "$build_file" ]; then
        compile_sdk=$(grep "compileSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$compile_sdk" | grep -q "35"; then
            print_ok "compileSdk = 35"
        elif [ -n "$compile_sdk" ]; then
            print_error "compileSdk が35 ではありません: $compile_sdk"
        else
            print_warning "compileSdk が見つかりません"
        fi

        target_sdk=$(grep "targetSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$target_sdk" | grep -q "35"; then
            print_ok "targetSdk = 35"
        elif [ -n "$target_sdk" ]; then
            print_error "targetSdk が35 ではありません: $target_sdk"
        fi

        min_sdk=$(grep "minSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$min_sdk" | grep -q "26"; then
            print_ok "minSdk = 26"
        elif [ -n "$min_sdk" ]; then
            print_warning "minSdk が26 ではありません: $min_sdk"
        fi

        jvm_target=$(grep 'jvmTarget\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$jvm_target" | grep -q "17"; then
            print_ok "JVM Target = 17"
        elif [ -n "$jvm_target" ]; then
            print_error "JVM Target が17 ではありません: $jvm_target"
        fi
    else
        print_warning "app/build.gradle.kts が見つかりません"
    fi

    # 5.3 ProGuard / R8
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

    # 5.4 テーマファイル
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
            print_ok "Type.kt: InsightTypography 変数名が定義されています"
        else
            print_error "Type.kt: InsightTypography 変数名が見つかりません"
        fi
    else
        print_error "ui/theme/Type.kt が見つかりません"
    fi

    # 5.5 colors.xml
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

    # 5.6 i18n
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

    # 5.7 パッケージ名
    if [ -n "$build_file" ]; then
        namespace=$(grep 'namespace\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$namespace" | grep -q "com\.harmonic"; then
            print_ok "パッケージ名: com.harmonic.* 準拠"
        elif [ -n "$namespace" ]; then
            print_warning "パッケージ名が com.harmonic.* 形式ではありません: $namespace"
        fi
    fi

    # 5.8 Adaptive Icon
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

    # 5.9 AAB bundle config
    if [ -n "$build_file" ]; then
        if grep -q "bundle\s*{" "$build_file" 2>/dev/null; then
            print_ok "bundle {} ブロックが存在（AAB 最適化）"
            if grep -q "enableSplit\s*=\s*true" "$build_file" 2>/dev/null; then
                print_ok "AAB split 配信が有効"
            else
                print_warning "AAB split 配信 (enableSplit = true) が見つかりません"
            fi
        else
            print_error "bundle {} ブロックが見つかりません（Play Store の AAB ビルドに必須）"
        fi
    fi

    # 5.10 CI/CD ワークフロー
    ci_workflow=$(find "$PROJECT_DIR" -name "build.yml" -path "*/.github/workflows/*" 2>/dev/null | head -1)
    if [ -n "$ci_workflow" ]; then
        print_ok ".github/workflows/build.yml が存在"
        if grep -q "assembleRelease" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: APK ビルド (assembleRelease) が設定されている"
        else
            print_warning "CI: assembleRelease が見つかりません"
        fi
        if grep -q "bundleRelease" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: AAB ビルド (bundleRelease) が設定されている"
        else
            print_error "CI: bundleRelease が見つかりません（Play Store 必須）"
        fi
        if grep -q "submodules" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: submodules が設定されている"
        else
            if [ -f "$PROJECT_DIR/.gitmodules" ]; then
                print_warning "CI: サブモジュールが存在するが submodules: true が設定されていません"
            fi
        fi
    else
        print_warning ".github/workflows/build.yml が見つかりません"
    fi

    # 5.11 Play Store メタデータ
    if [ -d "$PROJECT_DIR/fastlane/metadata/android" ]; then
        print_ok "fastlane/metadata/android/ が存在"
        for locale in "ja-JP" "en-US"; do
            locale_dir="$PROJECT_DIR/fastlane/metadata/android/$locale"
            if [ -d "$locale_dir" ]; then
                print_ok "ストアメタデータ ($locale) が存在"
                for file in "title.txt" "short_description.txt" "full_description.txt"; do
                    if [ -f "$locale_dir/$file" ]; then
                        print_ok "  $locale/$file が存在"
                    else
                        print_warning "  $locale/$file が見つかりません"
                    fi
                done
            else
                print_warning "ストアメタデータ ($locale) が見つかりません"
            fi
        done
    else
        print_warning "fastlane/metadata/android/ が見つかりません（Play Store リリース時に必須）"
    fi

    # 5.12 Keystore 設定
    if [ -f "$PROJECT_DIR/keystore.properties" ] || [ -f "$PROJECT_DIR/keystore.properties.example" ]; then
        print_ok "keystore.properties(.example) が存在"
    else
        print_warning "keystore.properties が見つかりません（リリースビルドの署名に必須）"
    fi

    # 5.13 開発用 keystore（上書きインストール対策）
    if [ -f "$PROJECT_DIR/app/dev.keystore" ]; then
        print_ok "app/dev.keystore が存在（チーム共有の debug 署名）"
    else
        print_warning "app/dev.keystore が見つかりません（上書きインストールに必須: ANDROID.md §8.5 参照）" #�E�上書きインスト�Eルに必須: E§8.5 参�E�E�E
    fi

    # 5.14 debug signingConfig の確認
    local app_gradle="$PROJECT_DIR/app/build.gradle.kts"
    if [ -f "$app_gradle" ]; then
        if grep -q 'getByName("debug")' "$app_gradle" 2>/dev/null && grep -q "dev.keystore" "$app_gradle" 2>/dev/null; then
            print_ok "debug signingConfig が dev.keystore を参照"
        else
            print_warning "debug signingConfig が dev.keystore を参照していません（§8.5 参照）" #��せん�E�§8.5 参�E�E�E
        fi
    fi

    # keystore がリポジトリに含まれていないことを確認（dev.keystore は除外） #��とを確認！Eev.keystore は除外！E
    if find "$PROJECT_DIR" \( -name "*.jks" -o -name "*.keystore" \) ! -name "dev.keystore" 2>/dev/null | head -1 | grep -q .; then
        gitignore_file="$PROJECT_DIR/.gitignore"
        if [ -f "$gitignore_file" ]; then
            if grep -q "\.jks" "$gitignore_file" 2>/dev/null && grep -q "\.keystore" "$gitignore_file" 2>/dev/null; then
                print_ok ".gitignore: release keystore ファイルが除外されている"
            else
                print_error ".gitignore: *.jks / *.keystore が除外されていません"
            fi
        fi
    fi
fi

# ========================================
# 6. Expo/React Native 固有検証
# ========================================
if [ "$PLATFORM" = "expo" ]; then
    echo ""
    print_section "6" "Expo/React Native 固有チェック"

    # 6.1 app.json
    if [ -f "$PROJECT_DIR/app.json" ]; then
        print_ok "app.json が存在"

        if grep -q "2563EB" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_error "app.json: Blue (#2563EB) が使用されています"
        else
            print_ok "app.json: Blue が使用されていません"
        fi

        if grep -q "B8942F" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: Gold (#B8942F) が使用されている"
        else
            print_warning "app.json: Gold (#B8942F) が見つかりません"
        fi

        if grep -q "expo-router" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: expo-router プラグインが設定されている"
        else
            print_warning "app.json: expo-router プラグインが見つかりません"
        fi
    else
        print_error "app.json が見つかりません"
    fi

    # 6.2 eas.json
    if [ -f "$PROJECT_DIR/eas.json" ]; then
        print_ok "eas.json が存在"

        if grep -q '"production"' "$PROJECT_DIR/eas.json" 2>/dev/null; then
            print_ok "eas.json: production プロファイルが定義されている"
        else
            print_warning "eas.json: production プロファイルが見つかりません"
        fi
    else
        print_warning "eas.json が見つかりません（EAS Build 未設定）"
    fi

    # 6.3 package.json 依存関係
    if [ -f "$PROJECT_DIR/package.json" ]; then
        if grep -q '"expo-router"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            print_ok "package.json: expo-router が依存関係にある"
        else
            print_warning "package.json: expo-router が見つかりません"
        fi

        if grep -q '"expo"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            print_ok "package.json: expo が依存関係にある"
        fi
    fi

    # 6.4 lib/colors.ts（カラー定義）
    colors_ts=$(find "$PROJECT_DIR" -name "colors.ts" -path "*/lib/*" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$colors_ts" ]; then
        if grep -q "B8942F" "$colors_ts" 2>/dev/null; then
            print_ok "lib/colors.ts: Gold (#B8942F) が定義されている"
        else
            print_error "lib/colors.ts: Gold (#B8942F) が見つかりません"
        fi

        if grep -q "FAF8F5" "$colors_ts" 2>/dev/null; then
            print_ok "lib/colors.ts: Ivory (#FAF8F5) が定義されている"
        else
            print_warning "lib/colors.ts: Ivory (#FAF8F5) が見つかりません"
        fi
    else
        # colors.ts が src/ 配下にある可能性も
        colors_ts_alt=$(find "$PROJECT_DIR" -name "colors.ts" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
        if [ -n "$colors_ts_alt" ]; then
            print_warning "colors.ts が lib/ 以外に配置されています: $colors_ts_alt"
            if grep -q "B8942F" "$colors_ts_alt" 2>/dev/null; then
                print_ok "colors.ts: Gold (#B8942F) が定義されている"
            else
                print_error "colors.ts: Gold (#B8942F) が見つかりません"
            fi
        else
            print_error "lib/colors.ts が見つかりません（カラー定義ファイルが必須）"
        fi
    fi

    # 6.5 lib/theme.ts
    theme_ts=$(find "$PROJECT_DIR" -name "theme.ts" -path "*/lib/*" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$theme_ts" ]; then
        print_ok "lib/theme.ts が存在"
    else
        print_warning "lib/theme.ts が見つかりません（テーマ定義ファイル推奨）"
    fi

    # 6.6 lib/license-manager.ts
    license_ts=$(find "$PROJECT_DIR" \( -name "license-manager.ts" -o -name "licenseManager.ts" \) -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$license_ts" ]; then
        print_ok "license-manager.ts が存在"
    else
        print_warning "license-manager.ts が見つかりません（Insight Business Suite 製品では必須）"
    fi

    # 6.7 TypeScript strict mode
    if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
        if grep -q '"strict"\s*:\s*true' "$PROJECT_DIR/tsconfig.json" 2>/dev/null; then
            print_ok "tsconfig.json: strict mode が有効"
        else
            print_warning "tsconfig.json: strict mode が無効です"
        fi
    else
        print_warning "tsconfig.json が見つかりません"
    fi

    # 6.8 expo-router ファイル構造
    if [ -d "$PROJECT_DIR/app" ]; then
        if [ -f "$PROJECT_DIR/app/_layout.tsx" ]; then
            print_ok "app/_layout.tsx が存在（Expo-router ルートレイアウト）"
        else
            print_warning "app/_layout.tsx が見つかりません"
        fi
    else
        print_warning "app/ ディレクトリが見つかりません（Expo-router 構造ではない可能性）"
    fi

    # 6.9 パッケージ名
    if [ -f "$PROJECT_DIR/app.json" ]; then
        expo_package=$(grep -o '"package"\s*:\s*"[^"]*"' "$PROJECT_DIR/app.json" 2>/dev/null | head -1)
        if echo "$expo_package" | grep -q "com\.harmonicinsight"; then
            print_ok "パッケージ名: com.harmonicinsight.* 準拠"
        elif [ -n "$expo_package" ]; then
            print_warning "パッケージ名が com.harmonicinsight.* 形式ではありません: $expo_package"
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
elif [ "$PLATFORM" = "expo" ]; then
    echo -e "参照: ${BLUE}insight-common/standards/ANDROID.md §13${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/expo/${NC}"
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
