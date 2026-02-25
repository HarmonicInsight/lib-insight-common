#!/bin/bash
#
# HARMONIC insight リリースチェックスクリプト
#
# validate-standards.sh を包含し、リリース固有のチェックを追加実行する。
# 全プラットフォーム対応（Android / iOS / C# / React / Python / Expo）
#
# 使い方:
#   ./release-check.sh <project-directory> [--platform <platform>]
#
# プラットフォーム:
#   android, ios, csharp, react, python, expo（省略時は自動検出）
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

# ============================================================
# カウンタ
# ============================================================
ERRORS=0
WARNINGS=0
MANUAL_CHECKS=0
PASS=0

# ============================================================
# 出力ヘルパー
# ============================================================
print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} HARMONIC insight リリースチェック${NC}"
    echo -e "${GOLD}========================================${NC}"
    echo ""
}

print_phase() {
    echo ""
    echo -e "${CYAN}--- $1 ---${NC}"
}

print_section() {
    echo -e "${YELLOW}[$1]${NC} $2"
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

print_manual() {
    echo -e "  ${BLUE}⚠${NC} [手動確認] $1"
    ((MANUAL_CHECKS++)) || true
}

# ============================================================
# 引数解析
# ============================================================
PROJECT_DIR=""
FORCE_PLATFORM=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --platform)
            FORCE_PLATFORM="$2"
            shift 2
            ;;
        *)
            if [ -z "$PROJECT_DIR" ]; then
                PROJECT_DIR="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$PROJECT_DIR" ]; then
    echo "使用方法: $0 <project-directory> [--platform <platform>]"
    echo ""
    echo "プラットフォーム: android, ios, csharp, react, python, expo"
    echo "例: $0 /path/to/your-app --platform android"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが見つかりません: $PROJECT_DIR${NC}"
    exit 1
fi

# ============================================================
# insight-common サブモジュール自動セットアップ
# ============================================================
bootstrap_submodule() {
    local target_dir="$1"

    # .gitmodules に insight-common が登録されているか確認
    if [ -f "$target_dir/.gitmodules" ] && grep -q "insight-common" "$target_dir/.gitmodules" 2>/dev/null; then
        # サブモジュールが初期化されていない場合
        if [ ! -f "$target_dir/insight-common/CLAUDE.md" ]; then
            echo -e "${CYAN}insight-common サブモジュールを初期化しています...${NC}"
            git -C "$target_dir" submodule init 2>/dev/null || true
            git -C "$target_dir" submodule update --recursive 2>/dev/null || true
        fi

        # 最新に更新
        echo -e "${CYAN}insight-common を最新に更新しています...${NC}"
        git -C "$target_dir" submodule update --remote --merge insight-common 2>/dev/null || true

        # スクリプトの実行権限を付与
        chmod +x "$target_dir/insight-common/scripts/"*.sh 2>/dev/null || true
    fi
}

# このスクリプト自身が insight-common 内にある場合は PROJECT_DIR のサブモジュールをセットアップ
# 外部から呼ばれた場合（サブモジュール未初期化）も対応
bootstrap_submodule "$PROJECT_DIR"

# ============================================================
# プラットフォーム検出
# ============================================================
detect_platform() {
    if [ -n "$FORCE_PLATFORM" ]; then
        echo "$FORCE_PLATFORM"
        return
    fi
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

# ============================================================
# insight-common のパス解決
# ============================================================
resolve_insight_common() {
    if [ -d "$PROJECT_DIR/insight-common" ]; then
        echo "$PROJECT_DIR/insight-common"
    elif [ -d "$(dirname "$0")/.." ]; then
        echo "$(cd "$(dirname "$0")/.." && pwd)"
    else
        echo ""
    fi
}

# ============================================================
# メイン
# ============================================================
print_header

PLATFORM=$(detect_platform)
INSIGHT_COMMON=$(resolve_insight_common)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "対象: $PROJECT_DIR"
echo "プラットフォーム: $PLATFORM"
echo "実行日時: $TIMESTAMP"

# ============================================================
# Phase 1: 標準検証
# ============================================================
print_phase "Phase 1: 標準検証（validate-standards.sh）"

VALIDATE_SCRIPT=""
if [ -n "$INSIGHT_COMMON" ] && [ -f "$INSIGHT_COMMON/scripts/validate-standards.sh" ]; then
    VALIDATE_SCRIPT="$INSIGHT_COMMON/scripts/validate-standards.sh"
elif [ -f "$(dirname "$0")/validate-standards.sh" ]; then
    VALIDATE_SCRIPT="$(dirname "$0")/validate-standards.sh"
fi

if [ -n "$VALIDATE_SCRIPT" ]; then
    echo "実行: $VALIDATE_SCRIPT $PROJECT_DIR"
    echo ""
    if bash "$VALIDATE_SCRIPT" "$PROJECT_DIR"; then
        print_ok "標準検証: 全チェック通過"
    else
        print_error "標準検証: エラーあり（上記の出力を確認してください）"
    fi
else
    print_warning "validate-standards.sh が見つかりません（スキップ）"
fi

# メニューアイコン標準検証
MENU_ICONS_SCRIPT=""
if [ -n "$INSIGHT_COMMON" ] && [ -f "$INSIGHT_COMMON/scripts/validate-menu-icons.sh" ]; then
    MENU_ICONS_SCRIPT="$INSIGHT_COMMON/scripts/validate-menu-icons.sh"
elif [ -f "$(dirname "$0")/validate-menu-icons.sh" ]; then
    MENU_ICONS_SCRIPT="$(dirname "$0")/validate-menu-icons.sh"
fi

if [ -n "$MENU_ICONS_SCRIPT" ]; then
    echo ""
    echo "実行: $MENU_ICONS_SCRIPT $PROJECT_DIR"
    echo ""
    if bash "$MENU_ICONS_SCRIPT" "$PROJECT_DIR"; then
        print_ok "メニューアイコン検証: 全チェック通過"
    else
        print_warning "メニューアイコン検証: エラーまたは警告あり（上記の出力を確認してください）"
    fi
else
    print_warning "validate-menu-icons.sh が見つかりません（スキップ）"
fi

# ============================================================
# Phase 2: リリース固有チェック
# ============================================================
print_phase "Phase 2: リリース固有チェック"

# ----------------------------------------------------------
# 2.1 コード品質チェック（全プラットフォーム共通）
# ----------------------------------------------------------
print_section "2.1" "コード品質"

# TODO/FIXME/HACK チェック
todo_count=$(grep -rn "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" \
    --include="*.kt" --include="*.java" --include="*.swift" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    --include="*.cs" --include="*.py" \
    --exclude-dir=node_modules --exclude-dir=build \
    --exclude-dir=.gradle --exclude-dir=insight-common \
    --exclude-dir=.next --exclude-dir=__pycache__ \
    --exclude-dir=bin --exclude-dir=obj \
    2>/dev/null | wc -l || true)

if [ "$todo_count" -gt 0 ]; then
    print_warning "TODO/FIXME/HACK が ${todo_count} 件残っています"
    grep -rn "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" \
        --include="*.kt" --include="*.java" --include="*.swift" \
        --include="*.ts" --include="*.tsx" --include="*.js" \
        --include="*.cs" --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=build \
        --exclude-dir=.gradle --exclude-dir=insight-common \
        --exclude-dir=.next --exclude-dir=__pycache__ \
        --exclude-dir=bin --exclude-dir=obj \
        2>/dev/null | head -5 | while read -r line; do
        echo "      $line"
    done
else
    print_ok "TODO/FIXME/HACK なし"
fi

# デバッグ出力チェック
debug_patterns=""
case "$PLATFORM" in
    android)
        debug_patterns="Log\.d\|Log\.v\|println\|System\.out\.print"
        debug_files="--include=*.kt --include=*.java"
        ;;
    ios)
        debug_patterns="print(\|NSLog\|debugPrint"
        debug_files="--include=*.swift"
        ;;
    react|expo)
        debug_patterns="console\.log\|console\.debug\|console\.warn\|debugger"
        debug_files="--include=*.ts --include=*.tsx --include=*.js"
        ;;
    csharp)
        debug_patterns="Console\.WriteLine\|Debug\.WriteLine\|Trace\.WriteLine"
        debug_files="--include=*.cs"
        ;;
    python)
        debug_patterns="print(\|pdb\.set_trace\|breakpoint()"
        debug_files="--include=*.py"
        ;;
esac

if [ -n "$debug_patterns" ]; then
    debug_count=$(eval grep -rn "'$debug_patterns'" "$PROJECT_DIR" \
        $debug_files \
        --exclude-dir=node_modules --exclude-dir=build \
        --exclude-dir=.gradle --exclude-dir=insight-common \
        --exclude-dir=.next --exclude-dir=__pycache__ \
        --exclude-dir=bin --exclude-dir=obj \
        --exclude-dir=test --exclude-dir=tests \
        2>/dev/null | wc -l || true)

    if [ "$debug_count" -gt 0 ]; then
        print_warning "デバッグ出力が ${debug_count} 件残っています"
    else
        print_ok "デバッグ出力なし"
    fi
fi

# ----------------------------------------------------------
# 2.2 セキュリティチェック（全プラットフォーム共通）
# ----------------------------------------------------------
print_section "2.2" "セキュリティ"

# .gitignore チェック
if [ -f "$PROJECT_DIR/.gitignore" ]; then
    print_ok ".gitignore が存在"

    # .env が gitignore されているか
    if grep -q "\.env" "$PROJECT_DIR/.gitignore" 2>/dev/null; then
        print_ok ".env が .gitignore に含まれている"
    else
        print_warning ".env が .gitignore に含まれていません"
    fi
else
    print_error ".gitignore が存在しません"
fi

# ハードコードされた API キー検出
secret_patterns="api_key\s*=\s*['\"].*['\"]|apiKey\s*[:=]\s*['\"].*['\"]|secret_key\s*=\s*['\"].*['\"]|ANTHROPIC_API_KEY\s*=\s*['\"]sk-"
secret_count=$(grep -rniE "$secret_patterns" "$PROJECT_DIR" \
    --include="*.kt" --include="*.java" --include="*.swift" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    --include="*.cs" --include="*.py" \
    --exclude-dir=node_modules --exclude-dir=build \
    --exclude-dir=.gradle --exclude-dir=insight-common \
    --exclude-dir=.next --exclude-dir=__pycache__ \
    --exclude="*.example" --exclude="*.sample" \
    --exclude-dir=bin --exclude-dir=obj \
    2>/dev/null | wc -l || true)

if [ "$secret_count" -gt 0 ]; then
    print_error "ハードコードされた API キー/シークレットが ${secret_count} 件検出されました"
else
    print_ok "ハードコードされたシークレットなし"
fi

# google-services.json チェック（Android）
if [ "$PLATFORM" = "android" ]; then
    if git -C "$PROJECT_DIR" ls-files --error-unmatch "app/google-services.json" 2>/dev/null; then
        print_error "google-services.json がリポジトリに含まれています（.gitignore に追加してください）"
    else
        print_ok "google-services.json はリポジトリに含まれていない"
    fi

    # keystore チェック（dev.keystore は許可）
    keystore_in_repo=$(git -C "$PROJECT_DIR" ls-files "*.jks" "*.keystore" 2>/dev/null | grep -v "dev.keystore" | head -1)
    if [ -n "$keystore_in_repo" ]; then
        print_error "release keystore ファイルがリポジトリに含まれています: $keystore_in_repo"
    else
        print_ok "release keystore ファイルはリポジトリに含まれていない"
    fi

    # dev.keystore の存在チェック
    if [ -f "$PROJECT_DIR/app/dev.keystore" ]; then
        print_ok "app/dev.keystore が存在（チーム共有の debug 署名）"
    else
        print_warning "app/dev.keystore が見つかりません（上書きインストールに必要）"
    fi
fi

# ----------------------------------------------------------
# 2.3 Git 状態チェック
# ----------------------------------------------------------
print_section "2.3" "Git 状態"

if [ -d "$PROJECT_DIR/.git" ]; then
    # 未コミット変更
    uncommitted=$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null | wc -l || true)
    if [ "$uncommitted" -gt 0 ]; then
        print_warning "未コミットの変更が ${uncommitted} 件あります"
    else
        print_ok "ワーキングツリーがクリーン"
    fi

    # リモート同期
    git -C "$PROJECT_DIR" fetch origin 2>/dev/null || true
    local_hash=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)
    current_branch=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)
    remote_hash=$(git -C "$PROJECT_DIR" rev-parse "origin/$current_branch" 2>/dev/null || echo "")

    if [ -z "$remote_hash" ]; then
        print_warning "リモートブランチが見つかりません（未プッシュ？）"
    elif [ "$local_hash" = "$remote_hash" ]; then
        print_ok "リモートと同期済み"
    else
        print_warning "リモートと同期されていません（push が必要）"
    fi
else
    print_warning "Git リポジトリではありません"
fi

# ----------------------------------------------------------
# 2.4 AI アシスタントチェック（該当製品のみ）
# ----------------------------------------------------------
ai_check_needed=false
product_codes="INSS|IOSH|IOSD|INPY|INBT"
if grep -rqE "($product_codes)" "$PROJECT_DIR" \
    --include="*.cs" --include="*.ts" --include="*.py" --include="*.kt" --include="*.json" \
    --exclude-dir=node_modules --exclude-dir=insight-common \
    --exclude-dir=build --exclude-dir=.gradle 2>/dev/null; then
    ai_check_needed=true
fi

if [ "$ai_check_needed" = true ]; then
    print_section "2.4" "AI アシスタント"

    # OpenAI/Azure 使用チェック
    openai_usage=$(grep -rn "openai\|azure.*openai\|gpt-4\|gpt-3" "$PROJECT_DIR" \
        --include="*.kt" --include="*.java" --include="*.ts" --include="*.tsx" \
        --include="*.cs" --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=build \
        --exclude-dir=.gradle --exclude-dir=insight-common 2>/dev/null | head -3)

    if [ -n "$openai_usage" ]; then
        print_error "OpenAI/Azure が使用されています（Claude API のみ許可）"
        echo "      $openai_usage" | head -3
    else
        print_ok "Claude (Anthropic) API のみ使用"
    fi

    # モデルティア制御チェック
    if grep -rq "Standard\|Premium\|getModelForTier\|modelTier\|effectiveModelTier" "$PROJECT_DIR" \
        --include="*.kt" --include="*.ts" --include="*.cs" --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null; then
        print_ok "モデルティア（Standard/Premium）制御が実装されている"
    else
        print_warning "モデルティア制御が見つかりません"
    fi
fi

# ============================================================
# Phase 2.5: プラットフォーム固有リリースチェック
# ============================================================

# ----------------------------------------------------------
# Android (Native Kotlin)
# ----------------------------------------------------------
if [ "$PLATFORM" = "android" ]; then
    print_phase "Phase 2.5: Android 固有リリースチェック"

    build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" -path "*/app/*" 2>/dev/null | head -1)
    if [ -z "$build_file" ]; then
        build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" 2>/dev/null | grep -v '/build/' | head -1)
    fi

    # バージョン
    print_section "A" "バージョン"
    if [ -n "$build_file" ]; then
        version_code=$(grep "versionCode\s*=" "$build_file" 2>/dev/null | head -1)
        version_name=$(grep "versionName\s*=" "$build_file" 2>/dev/null | head -1)

        if [ -n "$version_code" ]; then
            print_ok "versionCode: $version_code"
        else
            print_error "versionCode が見つかりません"
        fi

        if [ -n "$version_name" ]; then
            print_ok "versionName: $version_name"
        else
            print_error "versionName が見つかりません"
        fi
    fi

    # 署名設定
    print_section "B" "署名設定"
    if [ -n "$build_file" ]; then
        if grep -q "signingConfigs" "$build_file" 2>/dev/null; then
            print_ok "signingConfigs が定義されている"

            if grep -q 'signingConfig\s*=\s*signingConfigs' "$build_file" 2>/dev/null; then
                print_ok "release ビルドに signingConfig が適用されている"
            else
                print_warning "release ビルドに signingConfig が適用されていない可能性"
            fi

            # debug signingConfig の dev.keystore 参照チェック
            if grep -q 'getByName("debug")' "$build_file" 2>/dev/null && grep -q "dev.keystore" "$build_file" 2>/dev/null; then
                print_ok "debug signingConfig が dev.keystore を参照"
            else
                print_warning "debug signingConfig が dev.keystore を参照していません（上書きインストール問題の原因）"
            fi
        else
            print_warning "signingConfigs が未定義（リリースビルドには署名設定が必要）"
        fi

        # keystore.properties チェック
        if [ -f "$PROJECT_DIR/keystore.properties" ] || grep -q "keystore.properties\|KEYSTORE\|STORE_FILE" "$build_file" 2>/dev/null; then
            print_ok "keystore 設定がプロパティ/環境変数経由"
        else
            print_manual "keystore の設定方法を確認してください"
        fi
    fi

    # Play Store メタデータ
    print_section "C" "Play Store メタデータ"
    metadata_dir="$PROJECT_DIR/fastlane/metadata/android"

    check_metadata_file() {
        local locale="$1"
        local filename="$2"
        local max_chars="$3"
        local filepath="$metadata_dir/$locale/$filename"

        if [ -f "$filepath" ]; then
            char_count=$(wc -m < "$filepath" | tr -d ' ')
            if [ -n "$max_chars" ] && [ "$char_count" -gt "$max_chars" ]; then
                print_error "$locale/$filename: ${char_count}文字（上限 ${max_chars}文字）"
            else
                print_ok "$locale/$filename (${char_count}文字)"
            fi
        else
            print_error "$locale/$filename が見つかりません"
        fi
    }

    if [ -d "$metadata_dir" ]; then
        check_metadata_file "ja-JP" "title.txt" 30
        check_metadata_file "en-US" "title.txt" 30
        check_metadata_file "ja-JP" "short_description.txt" 80
        check_metadata_file "en-US" "short_description.txt" 80
        check_metadata_file "ja-JP" "full_description.txt" 4000
        check_metadata_file "en-US" "full_description.txt" 4000

        # changelogs
        ja_changelog=$(find "$metadata_dir/ja-JP/changelogs" -name "*.txt" 2>/dev/null | head -1)
        en_changelog=$(find "$metadata_dir/en-US/changelogs" -name "*.txt" 2>/dev/null | head -1)

        if [ -n "$ja_changelog" ]; then
            cl_chars=$(wc -m < "$ja_changelog" | tr -d ' ')
            if [ "$cl_chars" -gt 500 ]; then
                print_error "ja-JP changelog: ${cl_chars}文字（上限 500文字）"
            else
                print_ok "ja-JP changelog (${cl_chars}文字)"
            fi
        else
            print_warning "ja-JP changelog が見つかりません"
        fi

        if [ -n "$en_changelog" ]; then
            cl_chars=$(wc -m < "$en_changelog" | tr -d ' ')
            if [ "$cl_chars" -gt 500 ]; then
                print_error "en-US changelog: ${cl_chars}文字（上限 500文字）"
            else
                print_ok "en-US changelog (${cl_chars}文字)"
            fi
        else
            print_warning "en-US changelog が見つかりません"
        fi
    else
        print_warning "fastlane/metadata/android/ が見つかりません（Play Store メタデータ未作成）"
        print_manual "Play Store リリース時は fastlane メタデータを作成してください"
    fi

    # ビルド確認
    print_section "D" "ビルド確認"
    print_manual "Release APK/AAB がビルドできることを確認: ./gradlew assembleRelease"
    print_manual "Release APK のインストール・動作確認を行ってください"
    print_manual "スクリーンショットが日英で用意されているか確認してください"
fi

# ----------------------------------------------------------
# Expo / React Native
# ----------------------------------------------------------
if [ "$PLATFORM" = "expo" ]; then
    print_phase "Phase 2.5: Expo 固有リリースチェック"

    print_section "E" "バージョン"
    if [ -f "$PROJECT_DIR/app.json" ]; then
        app_version=$(grep -o '"version"\s*:\s*"[^"]*"' "$PROJECT_DIR/app.json" 2>/dev/null | head -1)
        if [ -n "$app_version" ]; then
            print_ok "app.json version: $app_version"
        else
            print_error "app.json に version が見つかりません"
        fi

        android_version_code=$(grep -o '"versionCode"\s*:\s*[0-9]*' "$PROJECT_DIR/app.json" 2>/dev/null | head -1)
        if [ -n "$android_version_code" ]; then
            print_ok "android.versionCode: $android_version_code"
        else
            print_warning "android.versionCode が見つかりません"
        fi
    fi

    print_section "F" "EAS Build"
    if [ -f "$PROJECT_DIR/eas.json" ]; then
        if grep -q '"production"' "$PROJECT_DIR/eas.json" 2>/dev/null; then
            print_ok "eas.json: production プロファイルが存在"

            if grep -q '"app-bundle"' "$PROJECT_DIR/eas.json" 2>/dev/null; then
                print_ok "production が app-bundle ビルド"
            else
                print_warning "production が app-bundle ビルドではありません"
            fi
        else
            print_error "eas.json: production プロファイルが見つかりません"
        fi
    else
        print_error "eas.json が見つかりません"
    fi

    print_manual "eas build --platform android --profile production が成功することを確認してください"
fi

# ----------------------------------------------------------
# iOS
# ----------------------------------------------------------
if [ "$PLATFORM" = "ios" ]; then
    print_phase "Phase 2.5: iOS 固有リリースチェック"

    print_section "I" "バージョン"

    # Info.plist からバージョン取得
    info_plist=$(find "$PROJECT_DIR" -name "Info.plist" -not -path "*/build/*" -not -path "*/Pods/*" 2>/dev/null | head -1)
    if [ -n "$info_plist" ]; then
        print_ok "Info.plist が存在: $info_plist"
    else
        print_warning "Info.plist が見つかりません"
    fi

    # App Store メタデータ
    print_section "J" "App Store メタデータ"
    ios_metadata="$PROJECT_DIR/fastlane/metadata"
    if [ -d "$ios_metadata" ]; then
        for locale in "ja" "en-US"; do
            if [ -d "$ios_metadata/$locale" ]; then
                print_ok "$locale メタデータディレクトリが存在"
            else
                print_error "$locale メタデータディレクトリが見つかりません"
            fi
        done
    else
        print_warning "fastlane/metadata/ が見つかりません"
    fi

    print_manual "Archive ビルドが成功することを確認してください"
    print_manual "Provisioning Profile の有効期限を確認してください"
    print_manual "スクリーンショットが日英で用意されているか確認してください"
fi

# ----------------------------------------------------------
# C# (WPF)
# ----------------------------------------------------------
if [ "$PLATFORM" = "csharp" ]; then
    print_phase "Phase 2.5: C# (WPF) 固有リリースチェック"

    print_section "W" "バージョン"
    csproj_file=$(ls "$PROJECT_DIR"/*.csproj 2>/dev/null | head -1)

    if [ -n "$csproj_file" ]; then
        assembly_ver=$(grep -o '<AssemblyVersion>[^<]*</AssemblyVersion>' "$csproj_file" 2>/dev/null | head -1)
        file_ver=$(grep -o '<FileVersion>[^<]*</FileVersion>' "$csproj_file" 2>/dev/null | head -1)
        version=$(grep -o '<Version>[^<]*</Version>' "$csproj_file" 2>/dev/null | head -1)

        if [ -n "$assembly_ver" ]; then
            print_ok "AssemblyVersion: $assembly_ver"
        else
            print_warning "AssemblyVersion が見つかりません"
        fi

        if [ -n "$file_ver" ]; then
            print_ok "FileVersion: $file_ver"
        else
            print_warning "FileVersion が見つかりません"
        fi

        if [ -n "$version" ]; then
            print_ok "Version: $version"
        fi
    fi

    # Syncfusion ライセンス
    print_section "X" "サードパーティ"
    syncfusion_hardcoded=$(grep -rn "RegisterLicense.*\"Ngo9\|SyncfusionLicenseProvider.*\"" "$PROJECT_DIR" \
        --include="*.cs" --exclude-dir=bin --exclude-dir=obj 2>/dev/null | \
        grep -v "GetSyncfusionKey\|third-party-licenses\|Environment\.GetEnvironmentVariable" | head -3)

    if [ -n "$syncfusion_hardcoded" ]; then
        print_error "Syncfusion キーがハードコードされています（third-party-licenses.json 経由にしてください）"
    else
        print_ok "Syncfusion キーがハードコードされていない"
    fi

    # ファイル関連付け
    print_section "Y" "ファイル関連付け"
    print_manual "独自拡張子（.inss/.iosh/.iosd）がインストーラーで登録されるか確認してください"
    print_manual "ダブルクリック・コンテキストメニューの動作確認を行ってください"
    print_manual "コード署名証明書の有効期限を確認してください"
fi

# ----------------------------------------------------------
# React / Next.js
# ----------------------------------------------------------
if [ "$PLATFORM" = "react" ]; then
    print_phase "Phase 2.5: React 固有リリースチェック"

    print_section "R" "バージョン"
    if [ -f "$PROJECT_DIR/package.json" ]; then
        pkg_version=$(grep -o '"version"\s*:\s*"[^"]*"' "$PROJECT_DIR/package.json" 2>/dev/null | head -1)
        if [ -n "$pkg_version" ]; then
            print_ok "package.json version: $pkg_version"
        else
            print_warning "package.json に version が見つかりません"
        fi
    fi

    # TypeScript チェック
    print_section "S" "ビルド品質"
    if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
        if grep -q '"strict"\s*:\s*true' "$PROJECT_DIR/tsconfig.json" 2>/dev/null; then
            print_ok "TypeScript strict mode が有効"
        else
            print_warning "TypeScript strict mode が無効"
        fi
    fi

    # console.log チェック（テストファイル除外）
    console_count=$(grep -rn "console\.log\|console\.debug" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=insight-common \
        --exclude="*.test.*" --exclude="*.spec.*" \
        2>/dev/null | wc -l || true)

    if [ "$console_count" -gt 0 ]; then
        print_warning "console.log/debug が ${console_count} 件残っています"
    else
        print_ok "console.log/debug なし"
    fi

    print_manual "next build が成功することを確認してください"
    print_manual "本番環境変数（Vercel / Railway）が設定されているか確認してください"
fi

# ----------------------------------------------------------
# Python
# ----------------------------------------------------------
if [ "$PLATFORM" = "python" ]; then
    print_phase "Phase 2.5: Python 固有リリースチェック"

    print_section "P" "バージョン"
    if [ -f "$PROJECT_DIR/pyproject.toml" ]; then
        py_version=$(grep '^version\s*=' "$PROJECT_DIR/pyproject.toml" 2>/dev/null | head -1)
        if [ -n "$py_version" ]; then
            print_ok "pyproject.toml version: $py_version"
        else
            print_warning "pyproject.toml に version が見つかりません"
        fi
    elif [ -f "$PROJECT_DIR/setup.py" ]; then
        py_version=$(grep "version=" "$PROJECT_DIR/setup.py" 2>/dev/null | head -1)
        if [ -n "$py_version" ]; then
            print_ok "setup.py version: $py_version"
        fi
    fi

    # 依存パッケージのピン留め
    if [ -f "$PROJECT_DIR/requirements.txt" ]; then
        unpinned=$(grep -v "==" "$PROJECT_DIR/requirements.txt" 2>/dev/null | grep -v "^#\|^$\|^-" | wc -l || true)
        if [ "$unpinned" -gt 0 ]; then
            print_warning "ピン留めされていない依存が ${unpinned} 件あります"
        else
            print_ok "全依存パッケージがピン留め済み"
        fi
    fi

    print_manual "pytest が全て通ることを確認してください"
fi

# ============================================================
# Phase 3: 最終確認（手動チェック項目のサマリー）
# ============================================================
print_phase "Phase 3: 最終確認（手動チェック項目）"

echo ""
echo -e "  ${BLUE}以下の項目は手動で確認してください:${NC}"
echo ""
echo -e "  ${BLUE}⚠${NC} アプリの基本動作確認（主要機能が正常に動作するか）"
echo -e "  ${BLUE}⚠${NC} リリースノートの内容確認・承認"

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "expo" ]; then
    echo -e "  ${BLUE}⚠${NC} Play Store スクリーンショットが日英で用意されているか"
    echo -e "  ${BLUE}⚠${NC} Play Store コンテンツレーティングが設定されているか"
    echo -e "  ${BLUE}⚠${NC} プライバシーポリシーが最新か"
fi

if [ "$PLATFORM" = "ios" ]; then
    echo -e "  ${BLUE}⚠${NC} App Store スクリーンショットが日英で用意されているか"
    echo -e "  ${BLUE}⚠${NC} App Store レビューガイドラインに準拠しているか"
fi

if [ "$PLATFORM" = "csharp" ]; then
    echo -e "  ${BLUE}⚠${NC} インストーラーの動作確認（クリーン環境で）"
    echo -e "  ${BLUE}⚠${NC} アップデート時のデータ移行確認"
fi

# ============================================================
# 結果サマリー
# ============================================================
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} リリースチェック結果${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""

TOTAL=$((PASS + ERRORS + WARNINGS))

echo -e "  ${GREEN}✓ 合格: ${PASS} 件${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "  ${RED}✗ エラー: ${ERRORS} 件${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}! 警告: ${WARNINGS} 件${NC}"
fi

echo -e "  ${BLUE}⚠ 手動確認: ${MANUAL_CHECKS} 件${NC}"

echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}リリース準備完了！${NC} 手動確認項目を完了させてください。"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}警告があります。${NC} 確認の上、問題なければリリース可能です。"
else
    echo -e "${RED}${BOLD}エラーがあります。${NC} 修正してから再度チェックしてください。"
fi

echo ""
echo -e "参照: ${BLUE}standards/RELEASE_CHECKLIST.md${NC}"
echo ""

# 終了コード
if [ $ERRORS -gt 0 ]; then
    exit 1
fi

exit 0
