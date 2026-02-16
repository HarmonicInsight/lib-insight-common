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
    elif [ -f "$PROJECT_DIR/Package.swift" ] || [ -f "$PROJECT_DIR/project.yml" ]; then
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
    print_ok "Blue がプライマリとして使用されていない"
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

    # 4.9 AAB bundle config
    if [ -n "$build_file" ]; then
        if grep -q "bundle\s*{" "$build_file" 2>/dev/null; then
            print_ok "bundle {} ブロックが存在（AAB 最適化）"
            if grep -q "enableSplit\s*=\s*true" "$build_file" 2>/dev/null; then
                print_ok "AAB split 配信が有効"
            else
                print_warning "AAB split 配信 (enableSplit = true) が見つかりません"
            fi
        else
            print_error "bundle {} ブロックが見つかりません（Play Store の AAB ビルドに必要）"
        fi
    fi

    # 4.10 CI/CD ワークフロー
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

    # 4.11 Play Store メタデータ
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
        print_warning "fastlane/metadata/android/ が見つかりません（Play Store リリース時に必要）"
    fi

    # 4.12 Keystore 設定
    if [ -f "$PROJECT_DIR/keystore.properties" ] || [ -f "$PROJECT_DIR/keystore.properties.example" ]; then
        print_ok "keystore.properties(.example) が存在"
    else
        print_warning "keystore.properties が見つかりません（リリースビルドの署名に必要）"
    fi

    # 4.13 開発用 keystore（上書きインストール対策）
    if [ -f "$PROJECT_DIR/app/dev.keystore" ]; then
        print_ok "app/dev.keystore が存在（チーム共有の debug 署名）"
    else
        print_warning "app/dev.keystore が見つかりません（上書きインストールに必要 — §8.5 参照）"
    fi

    # 4.14 debug signingConfig の確認
    local app_gradle="$PROJECT_DIR/app/build.gradle.kts"
    if [ -f "$app_gradle" ]; then
        if grep -q 'getByName("debug")' "$app_gradle" 2>/dev/null && grep -q "dev.keystore" "$app_gradle" 2>/dev/null; then
            print_ok "debug signingConfig が dev.keystore を参照"
        else
            print_warning "debug signingConfig が dev.keystore を参照していません（§8.5 参照）"
        fi
    fi

    # keystore がリポジトリに含まれていないことを確認（dev.keystore は除外）
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
# 5. Expo/React Native 固有検証
# ========================================
if [ "$PLATFORM" = "expo" ]; then
    echo ""
    print_section "5" "Expo/React Native 固有チェック"

    # 5.1 app.json
    if [ -f "$PROJECT_DIR/app.json" ]; then
        print_ok "app.json が存在"

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

        if grep -q "expo-router" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: expo-router プラグインが設定されている"
        else
            print_warning "app.json: expo-router プラグインが見つかりません"
        fi
    else
        print_error "app.json が見つかりません"
    fi

    # 5.2 eas.json
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

    # 5.3 package.json 依存関係
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

    # 5.4 lib/colors.ts
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
            print_error "lib/colors.ts が見つかりません（カラー定義ファイルが必要）"
        fi
    fi

    # 5.5 lib/theme.ts
    theme_ts=$(find "$PROJECT_DIR" -name "theme.ts" -path "*/lib/*" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$theme_ts" ]; then
        print_ok "lib/theme.ts が存在"
    else
        print_warning "lib/theme.ts が見つかりません（テーマ定義ファイル推奨）"
    fi

    # 5.6 lib/license-manager.ts
    license_ts=$(find "$PROJECT_DIR" \( -name "license-manager.ts" -o -name "licenseManager.ts" \) -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$license_ts" ]; then
        print_ok "license-manager.ts が存在"
    else
        print_warning "license-manager.ts が見つかりません（InsightOffice 製品では必須）"
    fi

    # 5.7 TypeScript strict mode
    if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
        if grep -q '"strict"\s*:\s*true' "$PROJECT_DIR/tsconfig.json" 2>/dev/null; then
            print_ok "tsconfig.json: strict mode が有効"
        else
            print_warning "tsconfig.json: strict mode が無効です"
        fi
    else
        print_warning "tsconfig.json が見つかりません"
    fi

    # 5.8 expo-router ファイル構造
    if [ -d "$PROJECT_DIR/app" ]; then
        if [ -f "$PROJECT_DIR/app/_layout.tsx" ]; then
            print_ok "app/_layout.tsx が存在（expo-router ルートレイアウト）"
        else
            print_warning "app/_layout.tsx が見つかりません"
        fi
    else
        print_warning "app/ ディレクトリが見つかりません（expo-router 構造ではない可能性）"
    fi

    # 5.9 パッケージ名
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
# 6. iOS 固有チェック
# ========================================
if [ "$PLATFORM" = "ios" ]; then
    print_section "6" "iOS 固有チェック"

    # 6.1 project.yml (XcodeGen)
    if [ -f "$PROJECT_DIR/project.yml" ]; then
        print_ok "project.yml が存在（XcodeGen プロジェクト定義）"

        if grep -q "deploymentTarget" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: deploymentTarget が設定されている"
        else
            print_warning "project.yml: deploymentTarget が設定されていません"
        fi

        if grep -q "xcodeVersion" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: xcodeVersion が設定されている"
        else
            print_warning "project.yml: xcodeVersion が設定されていません"
        fi

        if grep -q "configFiles" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: configFiles が参照されている"
        else
            print_warning "project.yml: configFiles（xcconfig 参照）が設定されていません"
        fi
    elif [ -f "$PROJECT_DIR/Package.swift" ]; then
        print_ok "Package.swift が存在（Swift Package プロジェクト）"
    else
        print_error "project.yml も Package.swift も見つかりません"
    fi

    # 6.2 xcconfig ファイル
    if [ -f "$PROJECT_DIR/Configuration/Base.xcconfig" ]; then
        print_ok "Configuration/Base.xcconfig が存在"

        if grep -q "MARKETING_VERSION" "$PROJECT_DIR/Configuration/Base.xcconfig" 2>/dev/null; then
            mkt_ver=$(grep "MARKETING_VERSION" "$PROJECT_DIR/Configuration/Base.xcconfig" | head -1 | sed 's/.*= *//')
            print_ok "MARKETING_VERSION: $mkt_ver"
        else
            print_warning "Base.xcconfig: MARKETING_VERSION が設定されていません"
        fi

        if grep -q "SWIFT_TREAT_WARNINGS_AS_ERRORS" "$PROJECT_DIR/Configuration/Base.xcconfig" 2>/dev/null; then
            print_ok "SWIFT_TREAT_WARNINGS_AS_ERRORS が設定されている"
        else
            print_warning "Base.xcconfig: SWIFT_TREAT_WARNINGS_AS_ERRORS が未設定"
        fi
    else
        print_warning "Configuration/Base.xcconfig が見つかりません"
    fi

    if [ -f "$PROJECT_DIR/Configuration/Debug.xcconfig" ]; then
        print_ok "Configuration/Debug.xcconfig が存在"
    else
        print_warning "Configuration/Debug.xcconfig が見つかりません"
    fi

    if [ -f "$PROJECT_DIR/Configuration/Release.xcconfig" ]; then
        print_ok "Configuration/Release.xcconfig が存在"
    else
        print_warning "Configuration/Release.xcconfig が見つかりません"
    fi

    # 6.3 .xcode-version
    if [ -f "$PROJECT_DIR/.xcode-version" ]; then
        print_ok ".xcode-version: $(cat "$PROJECT_DIR/.xcode-version" | tr -d '[:space:]')"
    else
        print_warning ".xcode-version が見つかりません（チームの Xcode バージョン統一に推奨）"
    fi

    # 6.4 .gitignore
    if [ -f "$PROJECT_DIR/.gitignore" ]; then
        if grep -q '\.xcodeproj' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
            print_ok ".gitignore: *.xcodeproj が除外されている"
        else
            print_error ".gitignore: *.xcodeproj が除外されていません（XcodeGen 使用時は必須）"
        fi
    fi

    # 6.5 Makefile
    if [ -f "$PROJECT_DIR/Makefile" ]; then
        print_ok "Makefile が存在（ビルド自動化）"
    else
        print_warning "Makefile が見つかりません（推奨）"
    fi

    # 6.6 InsightColors.swift
    colors_swift=$(find "$PROJECT_DIR" -name "InsightColors.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$colors_swift" ]; then
        print_ok "InsightColors.swift: $colors_swift"
        if grep -q "B8942F" "$colors_swift" 2>/dev/null; then
            print_ok "InsightColors.swift: Gold (#B8942F) が定義されている"
        else
            print_error "InsightColors.swift: Gold (#B8942F) が見つかりません"
        fi
    else
        print_warning "InsightColors.swift が見つかりません"
    fi

    # 6.7 Asset Catalog — InsightPrimary
    primary_colorset=$(find "$PROJECT_DIR" -path "*/InsightPrimary.colorset/Contents.json" 2>/dev/null | head -1)
    if [ -n "$primary_colorset" ]; then
        print_ok "InsightPrimary.colorset が存在"
    else
        print_warning "InsightPrimary.colorset が見つかりません"
    fi

    # 6.8 ローカライゼーション
    ja_strings=$(find "$PROJECT_DIR" -path "*/ja.lproj/Localizable.strings" -not -path "*/build/*" 2>/dev/null | head -1)
    en_strings=$(find "$PROJECT_DIR" -path "*/en.lproj/Localizable.strings" -not -path "*/build/*" 2>/dev/null | head -1)

    if [ -n "$ja_strings" ]; then
        print_ok "ja.lproj/Localizable.strings が存在"
    else
        print_error "ja.lproj/Localizable.strings が見つかりません"
    fi

    if [ -n "$en_strings" ]; then
        print_ok "en.lproj/Localizable.strings が存在"
    else
        print_error "en.lproj/Localizable.strings が見つかりません"
    fi

    if [ -n "$ja_strings" ] && [ -n "$en_strings" ]; then
        ja_keys=$(grep -o '^"[^"]*"' "$ja_strings" 2>/dev/null | sort)
        en_keys=$(grep -o '^"[^"]*"' "$en_strings" 2>/dev/null | sort)

        ja_only=$(comm -23 <(echo "$ja_keys") <(echo "$en_keys") 2>/dev/null)
        en_only=$(comm -13 <(echo "$ja_keys") <(echo "$en_keys") 2>/dev/null)

        if [ -z "$ja_only" ] && [ -z "$en_only" ]; then
            print_ok "日英のローカライゼーションキーが完全一致"
        else
            print_error "日英のローカライゼーションキーが不一致"
            if [ -n "$ja_only" ]; then
                echo "      日本語のみ: $(echo "$ja_only" | head -3 | tr '\n' ' ')"
            fi
            if [ -n "$en_only" ]; then
                echo "      英語のみ: $(echo "$en_only" | head -3 | tr '\n' ' ')"
            fi
        fi
    fi

    # 6.9 CI/CD
    if [ -f "$PROJECT_DIR/.github/workflows/build.yml" ]; then
        print_ok ".github/workflows/build.yml が存在"
    else
        print_warning ".github/workflows/build.yml が見つかりません"
    fi

    # 6.10 App Store メタデータ
    if [ -d "$PROJECT_DIR/fastlane/metadata" ]; then
        for locale in "ja" "en-US"; do
            if [ -d "$PROJECT_DIR/fastlane/metadata/$locale" ]; then
                print_ok "fastlane/metadata/$locale が存在"
            else
                print_warning "fastlane/metadata/$locale が見つかりません"
            fi
        done
    else
        print_warning "fastlane/metadata/ が見つかりません"
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
elif [ "$PLATFORM" = "ios" ]; then
    echo -e "参照: ${BLUE}insight-common/standards/IOS.md${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/ios/${NC}"
    echo -e "管理ツール: ${BLUE}insight-common/scripts/ios-manage.sh${NC}"
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
