#!/bin/bash
#
# iOS プロジェクト管理 CLI
#
# insight-common から iOS プロジェクトの検証・管理を行うツール。
# テンプレート内の Makefile はプロジェクト内操作用、
# このスクリプトは insight-common から外部プロジェクトを管理するためのもの。
#
# 使い方:
#   ./ios-manage.sh <command> [options]
#
# コマンド:
#   doctor               開発環境チェック
#   validate <dir>       iOS 標準検証
#   sync-colors <dir>    brand/colors.json からカラー再生成
#   help                 ヘルプ表示
#

set -e

# ============================================================
# カラー定義
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# カウンタ
ERRORS=0
WARNINGS=0
PASS=0

# ============================================================
# 出力ヘルパー
# ============================================================
print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} iOS プロジェクト管理 CLI${NC}"
    echo -e "${GOLD}========================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}--- [$1] $2 ---${NC}"
}

print_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++)) || true
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
    ((ERRORS++)) || true
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARNINGS++)) || true
}

# ============================================================
# SCRIPT_DIR の取得
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(dirname "$SCRIPT_DIR")"
COLORS_JSON="$COMMON_DIR/brand/colors.json"

# ============================================================
# doctor コマンド — 開発環境チェック
# ============================================================
cmd_doctor() {
    print_header
    echo "開発環境チェック"
    echo ""

    # Xcode
    if command -v xcodebuild &> /dev/null; then
        local xcode_ver
        xcode_ver=$(xcodebuild -version 2>/dev/null | head -1)
        print_ok "Xcode: $xcode_ver"
    else
        print_error "Xcode がインストールされていません"
    fi

    # xcode-select
    if command -v xcode-select &> /dev/null; then
        local dev_dir
        dev_dir=$(xcode-select -p 2>/dev/null || echo "未設定")
        print_ok "xcode-select: $dev_dir"
    else
        print_warning "xcode-select が見つかりません"
    fi

    # XcodeGen
    if command -v xcodegen &> /dev/null; then
        local xcodegen_ver
        xcodegen_ver=$(xcodegen --version 2>/dev/null || echo "不明")
        print_ok "XcodeGen: $xcodegen_ver"
    else
        print_error "XcodeGen がインストールされていません"
        echo -e "    ${YELLOW}インストール: brew install xcodegen${NC}"
    fi

    # xcodes (バージョン管理)
    if command -v xcodes &> /dev/null; then
        print_ok "xcodes: $(xcodes version 2>/dev/null || echo "利用可能")"
    else
        print_warning "xcodes がインストールされていません（推奨: Xcode バージョン管理）"
        echo -e "    ${YELLOW}インストール: brew install xcodesorg/made/xcodes${NC}"
    fi

    # xcpretty
    if command -v xcpretty &> /dev/null; then
        print_ok "xcpretty: 利用可能"
    else
        print_warning "xcpretty がインストールされていません（推奨: ビルド出力整形）"
        echo -e "    ${YELLOW}インストール: gem install xcpretty${NC}"
    fi

    # Swift
    if command -v swift &> /dev/null; then
        local swift_ver
        swift_ver=$(swift --version 2>/dev/null | head -1)
        print_ok "Swift: $swift_ver"
    else
        print_error "Swift が見つかりません"
    fi

    # Homebrew
    if command -v brew &> /dev/null; then
        print_ok "Homebrew: $(brew --version 2>/dev/null | head -1)"
    else
        print_warning "Homebrew がインストールされていません"
    fi

    # jq (sync-colors で必要)
    if command -v jq &> /dev/null; then
        print_ok "jq: $(jq --version 2>/dev/null)"
    else
        print_warning "jq がインストールされていません（sync-colors コマンドに必要）"
        echo -e "    ${YELLOW}インストール: brew install jq${NC}"
    fi

    # Fastlane
    if command -v fastlane &> /dev/null; then
        print_ok "Fastlane: $(fastlane --version 2>/dev/null | head -1 || echo "利用可能")"
    else
        print_warning "Fastlane がインストールされていません（App Store デプロイに必要）"
    fi

    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "  ${GREEN}✓${NC} $PASS 件 OK / ${RED}✗${NC} $ERRORS 件エラー / ${YELLOW}!${NC} $WARNINGS 件警告"
    echo -e "${GOLD}========================================${NC}"

    if [ $ERRORS -gt 0 ]; then
        echo ""
        echo -e "${RED}必須ツールが不足しています。上記のインストールコマンドを実行してください。${NC}"
        return 1
    fi
    return 0
}

# ============================================================
# validate コマンド — iOS 標準検証
# ============================================================
cmd_validate() {
    local PROJECT_DIR="$1"

    if [ -z "$PROJECT_DIR" ]; then
        echo -e "${RED}使用方法: $0 validate <project-directory>${NC}"
        exit 1
    fi

    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
        exit 1
    fi

    print_header
    echo "検証対象: $PROJECT_DIR"

    # ----------------------------------------------------------
    # 1. プロジェクト構成
    # ----------------------------------------------------------
    print_section "1" "プロジェクト構成"

    # project.yml
    if [ -f "$PROJECT_DIR/project.yml" ]; then
        print_ok "project.yml が存在（XcodeGen プロジェクト定義）"

        # deploymentTarget チェック
        if grep -q "deploymentTarget" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: deploymentTarget が設定されている"
        else
            print_warning "project.yml: deploymentTarget が設定されていません"
        fi

        # xcodeVersion チェック
        if grep -q "xcodeVersion" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: xcodeVersion が設定されている"
        else
            print_warning "project.yml: xcodeVersion が設定されていません"
        fi

        # configFiles チェック
        if grep -q "configFiles" "$PROJECT_DIR/project.yml" 2>/dev/null; then
            print_ok "project.yml: configFiles が参照されている（xcconfig 連携）"
        else
            print_warning "project.yml: configFiles が設定されていません（xcconfig 参照推奨）"
        fi
    elif [ -f "$PROJECT_DIR/Package.swift" ]; then
        print_ok "Package.swift が存在（Swift Package プロジェクト）"
    else
        print_error "project.yml も Package.swift も見つかりません"
    fi

    # ----------------------------------------------------------
    # 2. ビルド設定 (xcconfig)
    # ----------------------------------------------------------
    print_section "2" "ビルド設定 (xcconfig)"

    # Base.xcconfig
    if [ -f "$PROJECT_DIR/Configuration/Base.xcconfig" ]; then
        print_ok "Configuration/Base.xcconfig が存在"

        if grep -q "MARKETING_VERSION" "$PROJECT_DIR/Configuration/Base.xcconfig" 2>/dev/null; then
            local mkt_ver
            mkt_ver=$(grep "MARKETING_VERSION" "$PROJECT_DIR/Configuration/Base.xcconfig" | head -1 | sed 's/.*= *//')
            print_ok "MARKETING_VERSION: $mkt_ver"
        else
            print_warning "Base.xcconfig: MARKETING_VERSION が設定されていません"
        fi

        if grep -q "SWIFT_TREAT_WARNINGS_AS_ERRORS" "$PROJECT_DIR/Configuration/Base.xcconfig" 2>/dev/null; then
            print_ok "SWIFT_TREAT_WARNINGS_AS_ERRORS が設定されている"
        else
            print_warning "Base.xcconfig: SWIFT_TREAT_WARNINGS_AS_ERRORS が設定されていません"
        fi
    else
        print_error "Configuration/Base.xcconfig が見つかりません"
    fi

    # Debug.xcconfig
    if [ -f "$PROJECT_DIR/Configuration/Debug.xcconfig" ]; then
        print_ok "Configuration/Debug.xcconfig が存在"
    else
        print_error "Configuration/Debug.xcconfig が見つかりません"
    fi

    # Release.xcconfig
    if [ -f "$PROJECT_DIR/Configuration/Release.xcconfig" ]; then
        print_ok "Configuration/Release.xcconfig が存在"
    else
        print_error "Configuration/Release.xcconfig が見つかりません"
    fi

    # ----------------------------------------------------------
    # 3. Xcode バージョン管理
    # ----------------------------------------------------------
    print_section "3" "Xcode バージョン管理"

    if [ -f "$PROJECT_DIR/.xcode-version" ]; then
        local xcode_pinned
        xcode_pinned=$(cat "$PROJECT_DIR/.xcode-version" | tr -d '[:space:]')
        print_ok ".xcode-version: $xcode_pinned"
    else
        print_warning ".xcode-version が見つかりません（チームの Xcode バージョン統一に推奨）"
    fi

    # ----------------------------------------------------------
    # 4. .gitignore
    # ----------------------------------------------------------
    print_section "4" ".gitignore"

    if [ -f "$PROJECT_DIR/.gitignore" ]; then
        print_ok ".gitignore が存在"

        if grep -q '\.xcodeproj' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
            print_ok ".gitignore: *.xcodeproj が除外されている（XcodeGen 必須）"
        else
            print_error ".gitignore: *.xcodeproj が除外されていません（XcodeGen 使用時は必須）"
        fi

        if grep -q 'DerivedData' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
            print_ok ".gitignore: DerivedData が除外されている"
        else
            print_warning ".gitignore: DerivedData が除外されていません"
        fi

        if grep -q '\.DS_Store' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
            print_ok ".gitignore: .DS_Store が除外されている"
        else
            print_warning ".gitignore: .DS_Store が除外されていません"
        fi

        if grep -q '\.env' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
            print_ok ".gitignore: .env が除外されている"
        else
            print_warning ".gitignore: .env が除外されていません"
        fi
    else
        print_error ".gitignore が見つかりません"
    fi

    # ----------------------------------------------------------
    # 5. Makefile
    # ----------------------------------------------------------
    print_section "5" "Makefile"

    if [ -f "$PROJECT_DIR/Makefile" ]; then
        print_ok "Makefile が存在"

        for target in setup generate build clean nuke; do
            if grep -q "^${target}:" "$PROJECT_DIR/Makefile" 2>/dev/null; then
                print_ok "Makefile: $target ターゲットが存在"
            else
                print_warning "Makefile: $target ターゲットが見つかりません"
            fi
        done
    else
        print_warning "Makefile が見つかりません（推奨: ビルド自動化）"
    fi

    # ----------------------------------------------------------
    # 6. デザインシステム (Ivory & Gold)
    # ----------------------------------------------------------
    print_section "6" "デザインシステム (Ivory & Gold)"

    # InsightColors.swift
    local colors_swift
    colors_swift=$(find "$PROJECT_DIR" -name "InsightColors.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$colors_swift" ]; then
        print_ok "InsightColors.swift: $colors_swift"

        if grep -q "B8942F" "$colors_swift" 2>/dev/null; then
            print_ok "InsightColors.swift: Gold (#B8942F) が定義されている"
        else
            print_error "InsightColors.swift: Gold (#B8942F) が見つかりません"
        fi

        if grep -q "FAF8F5" "$colors_swift" 2>/dev/null; then
            print_ok "InsightColors.swift: Ivory (#FAF8F5) が定義されている"
        else
            print_error "InsightColors.swift: Ivory (#FAF8F5) が見つかりません"
        fi
    else
        print_error "InsightColors.swift が見つかりません"
    fi

    # Asset Catalog — InsightPrimary colorset
    local primary_colorset
    primary_colorset=$(find "$PROJECT_DIR" -path "*/InsightPrimary.colorset/Contents.json" 2>/dev/null | head -1)
    if [ -n "$primary_colorset" ]; then
        print_ok "InsightPrimary.colorset が存在"

        # Gold の sRGB float 値チェック (0.722 ≈ B8/FF)
        if grep -q "0.722" "$primary_colorset" 2>/dev/null; then
            print_ok "InsightPrimary.colorset: Gold カラー値が正しい"
        else
            print_warning "InsightPrimary.colorset: Gold カラー値を確認してください"
        fi
    else
        print_warning "InsightPrimary.colorset が見つかりません"
    fi

    # InsightTheme.swift
    local theme_swift
    theme_swift=$(find "$PROJECT_DIR" -name "InsightTheme.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$theme_swift" ]; then
        print_ok "InsightTheme.swift: $theme_swift"
    else
        print_warning "InsightTheme.swift が見つかりません"
    fi

    # InsightTypography.swift
    local typo_swift
    typo_swift=$(find "$PROJECT_DIR" -name "InsightTypography.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$typo_swift" ]; then
        print_ok "InsightTypography.swift: $typo_swift"
    else
        print_warning "InsightTypography.swift が見つかりません"
    fi

    # ----------------------------------------------------------
    # 7. ローカライゼーション
    # ----------------------------------------------------------
    print_section "7" "ローカライゼーション"

    local ja_strings
    local en_strings
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

    # 日英キー一致チェック
    if [ -n "$ja_strings" ] && [ -n "$en_strings" ]; then
        local ja_keys en_keys
        ja_keys=$(grep -o '^"[^"]*"' "$ja_strings" 2>/dev/null | sort)
        en_keys=$(grep -o '^"[^"]*"' "$en_strings" 2>/dev/null | sort)

        local ja_only en_only
        ja_only=$(comm -23 <(echo "$ja_keys") <(echo "$en_keys") 2>/dev/null)
        en_only=$(comm -13 <(echo "$ja_keys") <(echo "$en_keys") 2>/dev/null)

        if [ -z "$ja_only" ] && [ -z "$en_only" ]; then
            print_ok "日英のローカライゼーションキーが完全一致"
        else
            if [ -n "$ja_only" ]; then
                print_error "日本語のみに存在するキー:"
                echo "$ja_only" | head -5 | while read -r key; do echo "      $key"; done
            fi
            if [ -n "$en_only" ]; then
                print_error "英語のみに存在するキー:"
                echo "$en_only" | head -5 | while read -r key; do echo "      $key"; done
            fi
        fi
    fi

    # ----------------------------------------------------------
    # 8. ライセンスシステム
    # ----------------------------------------------------------
    print_section "8" "ライセンスシステム"

    local license_mgr
    license_mgr=$(find "$PROJECT_DIR" -name "LicenseManager.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$license_mgr" ]; then
        print_ok "LicenseManager.swift: $license_mgr"
    else
        print_warning "LicenseManager.swift が見つかりません（ユーティリティアプリの場合は不要）"
    fi

    local plan_code
    plan_code=$(find "$PROJECT_DIR" -name "PlanCode.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$plan_code" ]; then
        print_ok "PlanCode.swift: $plan_code"
    else
        print_warning "PlanCode.swift が見つかりません"
    fi

    local license_view
    license_view=$(find "$PROJECT_DIR" -name "LicenseView.swift" -not -path "*/build/*" 2>/dev/null | head -1)
    if [ -n "$license_view" ]; then
        print_ok "LicenseView.swift: $license_view"
    else
        print_warning "LicenseView.swift が見つかりません"
    fi

    # ----------------------------------------------------------
    # 9. CI/CD
    # ----------------------------------------------------------
    print_section "9" "CI/CD"

    if [ -f "$PROJECT_DIR/.github/workflows/build.yml" ]; then
        print_ok ".github/workflows/build.yml が存在"

        if grep -q "xcodegen" "$PROJECT_DIR/.github/workflows/build.yml" 2>/dev/null; then
            print_ok "CI: XcodeGen インストールステップが含まれている"
        else
            print_warning "CI: XcodeGen インストールステップが見つかりません"
        fi

        if grep -q "xcodebuild" "$PROJECT_DIR/.github/workflows/build.yml" 2>/dev/null; then
            print_ok "CI: xcodebuild ステップが含まれている"
        else
            print_warning "CI: xcodebuild ステップが見つかりません"
        fi
    else
        print_warning ".github/workflows/build.yml が見つかりません"
    fi

    # ----------------------------------------------------------
    # 10. App Store メタデータ
    # ----------------------------------------------------------
    print_section "10" "App Store メタデータ"

    local metadata_dir="$PROJECT_DIR/fastlane/metadata"
    if [ -d "$metadata_dir" ]; then
        for locale in "ja" "en-US"; do
            if [ -d "$metadata_dir/$locale" ]; then
                print_ok "$locale メタデータディレクトリが存在"
                for file in name.txt subtitle.txt description.txt release_notes.txt; do
                    if [ -f "$metadata_dir/$locale/$file" ]; then
                        print_ok "$locale/$file が存在"
                    else
                        print_warning "$locale/$file が見つかりません"
                    fi
                done
            else
                print_error "$locale メタデータディレクトリが見つかりません"
            fi
        done
    else
        print_warning "fastlane/metadata/ が見つかりません"
    fi

    # ----------------------------------------------------------
    # 結果サマリー
    # ----------------------------------------------------------
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} iOS 標準検証 結果${NC}"
    echo -e "${GOLD}========================================${NC}"
    echo ""
    echo -e "  ${GREEN}✓${NC} $PASS 件 OK"

    if [ $ERRORS -gt 0 ]; then
        echo -e "  ${RED}✗${NC} $ERRORS 件エラー"
    fi

    if [ $WARNINGS -gt 0 ]; then
        echo -e "  ${YELLOW}!${NC} $WARNINGS 件警告"
    fi

    echo ""
    echo -e "参照: ${BLUE}standards/IOS.md${NC}"
    echo -e "テンプレート: ${BLUE}templates/ios/${NC}"
    echo ""

    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}標準に準拠していません。修正してください。${NC}"
        return 1
    fi
    return 0
}

# ============================================================
# sync-colors コマンド — brand/colors.json からカラー再生成
# ============================================================
cmd_sync_colors() {
    local PROJECT_DIR="$1"

    if [ -z "$PROJECT_DIR" ]; then
        echo -e "${RED}使用方法: $0 sync-colors <project-directory>${NC}"
        exit 1
    fi

    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${RED}エラー: jq が必要です。インストール: brew install jq${NC}"
        exit 1
    fi

    if [ ! -f "$COLORS_JSON" ]; then
        echo -e "${RED}エラー: brand/colors.json が見つかりません: $COLORS_JSON${NC}"
        exit 1
    fi

    print_header
    echo "カラー同期: $COLORS_JSON → $PROJECT_DIR"
    echo ""

    # hex → sRGB float 変換関数
    hex_to_float() {
        local hex="$1"
        local r=$((16#${hex:0:2}))
        local g=$((16#${hex:2:2}))
        local b=$((16#${hex:4:2}))
        printf "%.3f %.3f %.3f" "$(echo "scale=3; $r/255" | bc)" "$(echo "scale=3; $g/255" | bc)" "$(echo "scale=3; $b/255" | bc)"
    }

    # colorset JSON 生成関数
    generate_colorset() {
        local name="$1"
        local light_hex="$2"
        local dark_hex="$3"
        local output_dir="$4"

        local light_rgb dark_rgb
        light_rgb=$(hex_to_float "$light_hex")
        local lr lg lb
        lr=$(echo "$light_rgb" | awk '{print $1}')
        lg=$(echo "$light_rgb" | awk '{print $2}')
        lb=$(echo "$light_rgb" | awk '{print $3}')

        mkdir -p "$output_dir/${name}.colorset"

        if [ -n "$dark_hex" ]; then
            dark_rgb=$(hex_to_float "$dark_hex")
            local dr dg db
            dr=$(echo "$dark_rgb" | awk '{print $1}')
            dg=$(echo "$dark_rgb" | awk '{print $2}')
            db=$(echo "$dark_rgb" | awk '{print $3}')

            cat > "$output_dir/${name}.colorset/Contents.json" << JSONEOF
{
  "colors" : [
    {
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : "1.000",
          "blue" : "$lb",
          "green" : "$lg",
          "red" : "$lr"
        }
      },
      "idiom" : "universal"
    },
    {
      "appearances" : [
        {
          "appearance" : "luminosity",
          "value" : "dark"
        }
      ],
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : "1.000",
          "blue" : "$db",
          "green" : "$dg",
          "red" : "$dr"
        }
      },
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
JSONEOF
        else
            cat > "$output_dir/${name}.colorset/Contents.json" << JSONEOF
{
  "colors" : [
    {
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : "1.000",
          "blue" : "$lb",
          "green" : "$lg",
          "red" : "$lr"
        }
      },
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
JSONEOF
        fi
        print_ok "生成: ${name}.colorset"
    }

    # Asset Catalog のカラーディレクトリを探す
    local colors_dir
    colors_dir=$(find "$PROJECT_DIR" -path "*/Assets.xcassets/Colors" -type d 2>/dev/null | head -1)

    if [ -z "$colors_dir" ]; then
        # Colors サブディレクトリがなければ Assets.xcassets 直下に作成
        colors_dir=$(find "$PROJECT_DIR" -name "Assets.xcassets" -type d 2>/dev/null | head -1)
        if [ -z "$colors_dir" ]; then
            echo -e "${RED}Assets.xcassets が見つかりません${NC}"
            exit 1
        fi
        colors_dir="$colors_dir/Colors"
        mkdir -p "$colors_dir"
    fi

    echo -e "${CYAN}出力先: $colors_dir${NC}"
    echo ""

    # colors.json から値を読み取り、colorset を生成
    local primary dark_primary bg dark_bg surface border dark_border
    local text_primary dark_text_primary text_secondary dark_text_secondary
    local success warning error_color

    primary=$(jq -r '.brand.primary' "$COLORS_JSON" | tr -d '#')
    dark_primary=$(jq -r '.accent.gold["400"]' "$COLORS_JSON" | tr -d '#')
    bg=$(jq -r '.background.primary' "$COLORS_JSON" | tr -d '#')
    dark_bg=$(jq -r '.darkMode.background.primary' "$COLORS_JSON" | tr -d '#')
    surface=$(jq -r '.background.card' "$COLORS_JSON" | tr -d '#')
    dark_surface=$(jq -r '.darkMode.background.card' "$COLORS_JSON" | tr -d '#')
    text_primary=$(jq -r '.text.primary' "$COLORS_JSON" | tr -d '#')
    dark_text_primary=$(jq -r '.darkMode.text.primary' "$COLORS_JSON" | tr -d '#')
    text_secondary=$(jq -r '.text.secondary' "$COLORS_JSON" | tr -d '#')
    dark_text_secondary=$(jq -r '.darkMode.text.secondary' "$COLORS_JSON" | tr -d '#')
    border=$(jq -r '.border.default' "$COLORS_JSON" | tr -d '#')
    dark_border=$(jq -r '.darkMode.border.default' "$COLORS_JSON" | tr -d '#')
    success=$(jq -r '.semantic.success' "$COLORS_JSON" | tr -d '#')
    warning=$(jq -r '.semantic.warning' "$COLORS_JSON" | tr -d '#')
    error_color=$(jq -r '.semantic.error' "$COLORS_JSON" | tr -d '#')

    generate_colorset "InsightPrimary" "$primary" "$dark_primary" "$colors_dir"
    generate_colorset "InsightBackground" "$bg" "$dark_bg" "$colors_dir"
    generate_colorset "InsightSurface" "$surface" "$dark_surface" "$colors_dir"
    generate_colorset "InsightTextPrimary" "$text_primary" "$dark_text_primary" "$colors_dir"
    generate_colorset "InsightTextSecondary" "$text_secondary" "$dark_text_secondary" "$colors_dir"
    generate_colorset "InsightBorder" "$border" "$dark_border" "$colors_dir"
    generate_colorset "InsightSuccess" "$success" "" "$colors_dir"
    generate_colorset "InsightWarning" "$warning" "" "$colors_dir"
    generate_colorset "InsightError" "$error_color" "" "$colors_dir"

    # AccentColor (= Gold)
    generate_colorset "AccentColor" "$primary" "$dark_primary" "$(dirname "$colors_dir")"

    echo ""

    # InsightColors.swift の更新
    local colors_swift
    colors_swift=$(find "$PROJECT_DIR" -name "InsightColors.swift" -not -path "*/build/*" 2>/dev/null | head -1)

    if [ -n "$colors_swift" ]; then
        echo -e "${CYAN}InsightColors.swift を更新中...${NC}"

        # gold 50-900 の値を取得
        local g50 g100 g200 g300 g400 g500 g600 g700 g800 g900
        g50=$(jq -r '.accent.gold["50"]' "$COLORS_JSON" | tr -d '#')
        g100=$(jq -r '.accent.gold["100"]' "$COLORS_JSON" | tr -d '#')
        g200=$(jq -r '.accent.gold["200"]' "$COLORS_JSON" | tr -d '#')
        g300=$(jq -r '.accent.gold["300"]' "$COLORS_JSON" | tr -d '#')
        g400=$(jq -r '.accent.gold["400"]' "$COLORS_JSON" | tr -d '#')
        g500=$(jq -r '.accent.gold["500"]' "$COLORS_JSON" | tr -d '#')
        g600=$(jq -r '.accent.gold["600"]' "$COLORS_JSON" | tr -d '#')
        g700=$(jq -r '.accent.gold["700"]' "$COLORS_JSON" | tr -d '#')
        g800=$(jq -r '.accent.gold["800"]' "$COLORS_JSON" | tr -d '#')
        g900=$(jq -r '.accent.gold["900"]' "$COLORS_JSON" | tr -d '#')

        cat > "$colors_swift" << 'SWIFTEOF'
import SwiftUI

// ============================================================
// Insight Series カラー定義 — Ivory & Gold Theme
// brand/colors.json から自動生成 (ios-manage.sh sync-colors)
// 手動編集禁止 — 変更は brand/colors.json で行うこと
// ============================================================

enum InsightColors {
    // MARK: - Brand
SWIFTEOF

        cat >> "$colors_swift" << SWIFTEOF
    static let primary = Color(hex: "$primary")
    static let primaryHover = Color(hex: "$(jq -r '.brand.primaryHover' "$COLORS_JSON" | tr -d '#')")
    static let primaryLight = Color(hex: "$(jq -r '.brand.primaryLight' "$COLORS_JSON" | tr -d '#')")

    // MARK: - Background
    static let bgPrimary = Color(hex: "$bg")
    static let bgSecondary = Color(hex: "$(jq -r '.background.secondary' "$COLORS_JSON" | tr -d '#')")
    static let bgCard = Color(hex: "$surface")

    // MARK: - Text
    static let textPrimary = Color(hex: "$text_primary")
    static let textSecondary = Color(hex: "$text_secondary")
    static let textTertiary = Color(hex: "$(jq -r '.text.tertiary' "$COLORS_JSON" | tr -d '#')")

    // MARK: - Border
    static let border = Color(hex: "$border")
    static let borderLight = Color(hex: "$(jq -r '.border.light' "$COLORS_JSON" | tr -d '#')")

    // MARK: - Semantic
    static let success = Color(hex: "$success")
    static let warning = Color(hex: "$warning")
    static let error = Color(hex: "$error_color")

    // MARK: - Gold Scale
    static let gold50 = Color(hex: "$g50")
    static let gold100 = Color(hex: "$g100")
    static let gold200 = Color(hex: "$g200")
    static let gold300 = Color(hex: "$g300")
    static let gold400 = Color(hex: "$g400")
    static let gold500 = Color(hex: "$g500")
    static let gold600 = Color(hex: "$g600")
    static let gold700 = Color(hex: "$g700")
    static let gold800 = Color(hex: "$g800")
    static let gold900 = Color(hex: "$g900")

    // MARK: - Dark Mode
    enum Dark {
        static let bgPrimary = Color(hex: "$(jq -r '.darkMode.background.primary' "$COLORS_JSON" | tr -d '#')")
        static let bgSecondary = Color(hex: "$(jq -r '.darkMode.background.secondary' "$COLORS_JSON" | tr -d '#')")
        static let bgCard = Color(hex: "$(jq -r '.darkMode.background.card' "$COLORS_JSON" | tr -d '#')")
        static let primary = Color(hex: "$dark_primary")
        static let textPrimary = Color(hex: "$dark_text_primary")
        static let textSecondary = Color(hex: "$dark_text_secondary")
        static let border = Color(hex: "$dark_border")
    }
}
SWIFTEOF

        print_ok "InsightColors.swift を更新しました"
    else
        print_warning "InsightColors.swift が見つかりません（新規生成はテンプレートを使用してください）"
    fi

    echo ""
    echo -e "${GREEN}カラー同期が完了しました。${NC}"
    echo -e "ソース: ${BLUE}$COLORS_JSON${NC}"
}

# ============================================================
# help コマンド
# ============================================================
cmd_help() {
    echo ""
    echo -e "${GOLD}iOS プロジェクト管理 CLI${NC}"
    echo ""
    echo "使い方:"
    echo "  $0 <command> [options]"
    echo ""
    echo "コマンド:"
    echo "  doctor               開発環境チェック（Xcode, XcodeGen 等）"
    echo "  validate <dir>       iOS 標準検証（project.yml, xcconfig, カラー等）"
    echo "  sync-colors <dir>    brand/colors.json からカラー定義を再生成"
    echo "  help                 このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 doctor"
    echo "  $0 validate /path/to/ios-app"
    echo "  $0 sync-colors /path/to/ios-app"
    echo ""
}

# ============================================================
# メインディスパッチ
# ============================================================
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
    doctor)
        cmd_doctor
        ;;
    validate)
        cmd_validate "$@"
        ;;
    sync-colors)
        cmd_sync_colors "$@"
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        echo -e "${RED}不明なコマンド: $COMMAND${NC}"
        cmd_help
        exit 1
        ;;
esac
