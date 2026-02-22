#!/usr/bin/env bash
# =============================================================================
# HARMONIC insight — Build Doctor
# クロスプラットフォーム ビルドエラー自律解消エージェント
#
# 使い方:
#   ./scripts/build-doctor.sh [project-directory] [--platform ios|android|wpf|react|python|tauri]
#
# 動作:
#   1) ビルドを実行し、ログを build_logs/ に保存（日時付き）
#   2) エラー末尾200行を抽出し、原因カテゴリを1つに分類
#      (Compile / Link / Dependency / ScriptPhase / Environment / CodeSign)
#   3) 分類に応じて最小の修正を1つだけ行う（差分を出す）
#   4) 再度ビルドし、改善したか確認
#   5) 最大2ループ。解決しない場合は追加情報を収集して報告
#
# 対応プラットフォーム:
#   iOS / Android / C# WPF / React(Next.js) / Python / Tauri
#
# =============================================================================
set -euo pipefail

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# =============================================================================
# ユーティリティ関数
# =============================================================================

log_info()    { echo -e "${BLUE}[BUILD-DOCTOR]${NC} $*"; }
log_success() { echo -e "${GREEN}[BUILD-DOCTOR] ✓${NC} $*"; }
log_error()   { echo -e "${RED}[BUILD-DOCTOR] ✗${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[BUILD-DOCTOR] !${NC} $*"; }
log_step()    { echo -e "${CYAN}[BUILD-DOCTOR] →${NC} $*"; }
log_header()  { echo -e "\n${BOLD}══════════════════════════════════════════════════${NC}"; echo -e "${BOLD}  $*${NC}"; echo -e "${BOLD}══════════════════════════════════════════════════${NC}\n"; }

timestamp() { date '+%Y%m%d_%H%M%S'; }
iso_timestamp() { date '+%Y-%m-%dT%H:%M:%S'; }

# =============================================================================
# プラットフォーム検出
# =============================================================================

detect_platform() {
  local dir="$1"

  # 明示的に指定されている場合
  if [[ -n "${FORCE_PLATFORM:-}" ]]; then
    echo "$FORCE_PLATFORM"
    return
  fi

  # 優先順位付き検出
  if ls "$dir"/*.xcodeproj 1>/dev/null 2>&1 || ls "$dir"/*.xcworkspace 1>/dev/null 2>&1 || [[ -f "$dir/Package.swift" ]]; then
    echo "ios"
  elif [[ -f "$dir/build.gradle.kts" ]] || [[ -f "$dir/build.gradle" ]] || [[ -f "$dir/settings.gradle.kts" ]]; then
    echo "android"
  elif ls "$dir"/*.csproj 1>/dev/null 2>&1 || ls "$dir"/*.sln 1>/dev/null 2>&1; then
    echo "wpf"
  elif [[ -f "$dir/src-tauri/Cargo.toml" ]]; then
    echo "tauri"
  elif [[ -f "$dir/next.config.js" ]] || [[ -f "$dir/next.config.ts" ]] || [[ -f "$dir/next.config.mjs" ]]; then
    echo "react"
  elif [[ -f "$dir/package.json" ]]; then
    # package.json はあるが next.config がない → 一般的な React / Node
    echo "react"
  elif [[ -f "$dir/pyproject.toml" ]] || [[ -f "$dir/setup.py" ]] || [[ -f "$dir/requirements.txt" ]]; then
    echo "python"
  else
    echo "unknown"
  fi
}

# =============================================================================
# ビルドコマンド取得
# =============================================================================

get_build_command() {
  local platform="$1"
  local dir="$2"

  case "$platform" in
    ios)
      # スキーム自動検出
      local scheme=""
      if [[ -f "$dir/Package.swift" ]]; then
        echo "cd '$dir' && swift build 2>&1"
        return
      fi
      local workspace
      workspace=$(ls "$dir"/*.xcworkspace 2>/dev/null | head -1)
      local project
      project=$(ls "$dir"/*.xcodeproj 2>/dev/null | head -1)

      if [[ -n "$workspace" ]]; then
        scheme=$(xcodebuild -list -workspace "$workspace" 2>/dev/null | grep -A 20 'Schemes:' | grep -v 'Schemes:' | head -1 | xargs)
        echo "xcodebuild -workspace '$workspace' -scheme '${scheme}' -destination 'generic/platform=iOS' -configuration Debug build 2>&1"
      elif [[ -n "$project" ]]; then
        scheme=$(xcodebuild -list -project "$project" 2>/dev/null | grep -A 20 'Schemes:' | grep -v 'Schemes:' | head -1 | xargs)
        echo "xcodebuild -project '$project' -scheme '${scheme}' -destination 'generic/platform=iOS' -configuration Debug build 2>&1"
      else
        echo "echo 'ERROR: No Xcode project or workspace found'"
      fi
      ;;
    android)
      if [[ -f "$dir/gradlew" ]]; then
        echo "cd '$dir' && ./gradlew assembleDebug 2>&1"
      else
        echo "echo 'ERROR: gradlew not found'"
      fi
      ;;
    wpf)
      echo "cd '$dir' && dotnet build --configuration Debug 2>&1"
      ;;
    react)
      echo "cd '$dir' && npm run build 2>&1"
      ;;
    python)
      local main_file
      main_file=$(find "$dir" -maxdepth 2 -name "main.py" -o -name "app.py" -o -name "__main__.py" 2>/dev/null | head -1)
      if [[ -n "$main_file" ]]; then
        echo "cd '$dir' && python -m py_compile '$main_file' 2>&1"
      else
        echo "cd '$dir' && python -m compileall . 2>&1"
      fi
      ;;
    tauri)
      echo "cd '$dir' && npm run tauri build 2>&1"
      ;;
    *)
      echo "echo 'ERROR: Unknown platform: $platform'"
      ;;
  esac
}

get_clean_command() {
  local platform="$1"
  local dir="$2"

  case "$platform" in
    ios)
      if [[ -f "$dir/Package.swift" ]]; then
        echo "cd '$dir' && swift package clean 2>&1"
      else
        echo "cd '$dir' && xcodebuild clean 2>&1; rm -rf ~/Library/Developer/Xcode/DerivedData"
      fi
      ;;
    android)  echo "cd '$dir' && ./gradlew clean 2>&1" ;;
    wpf)      echo "cd '$dir' && dotnet clean 2>&1" ;;
    react)    echo "cd '$dir' && rm -rf .next node_modules/.cache 2>&1" ;;
    python)   echo "cd '$dir' && rm -rf build dist __pycache__ 2>&1" ;;
    tauri)    echo "cd '$dir' && cargo clean --manifest-path src-tauri/Cargo.toml 2>&1" ;;
    *)        echo "echo 'No clean command for unknown platform'" ;;
  esac
}

# =============================================================================
# ビルド成功判定
# =============================================================================

check_build_success() {
  local platform="$1"
  local log_file="$2"

  case "$platform" in
    ios)
      grep -qE 'BUILD SUCCEEDED|\*\* BUILD SUCCEEDED \*\*' "$log_file" 2>/dev/null
      ;;
    android)
      grep -qE 'BUILD SUCCESSFUL' "$log_file" 2>/dev/null
      ;;
    wpf)
      grep -qE 'Build succeeded' "$log_file" 2>/dev/null
      ;;
    react)
      grep -qE 'Compiled successfully|✓ Compiled|Build completed' "$log_file" 2>/dev/null
      ;;
    python)
      # py_compile は成功時に何も出力しない → エラーがなければ成功
      ! grep -qE 'SyntaxError:|IndentationError:|ModuleNotFoundError:|ImportError:' "$log_file" 2>/dev/null
      ;;
    tauri)
      grep -qE 'Finished|finished.*release' "$log_file" 2>/dev/null
      ;;
    *)
      return 1
      ;;
  esac
}

# =============================================================================
# エラーカテゴリ分類
# =============================================================================

classify_error() {
  local platform="$1"
  local log_tail="$2"

  # カテゴリごとのスコア
  local score_compile=0
  local score_link=0
  local score_dependency=0
  local score_scriptphase=0
  local score_environment=0
  local score_codesign=0

  # --- Compile パターン ---
  if echo "$log_tail" | grep -qEi "cannot convert|cannot find .+ in scope|undeclared identifier|type mismatch|error CS[0-9]+|error TS[0-9]+|SyntaxError:|Unresolved reference|@Composable invocations"; then
    score_compile=$((score_compile + 4))
  fi
  if echo "$log_tail" | grep -qEi "sending .+ risks causing data races|non-sendable|actor-isolated"; then
    score_compile=$((score_compile + 5))
  fi
  if echo "$log_tail" | grep -qEi "no such module|module .+ not found|XAML.*error|error MC[0-9]+"; then
    score_compile=$((score_compile + 4))
  fi
  if echo "$log_tail" | grep -qEi "deprecated in|was deprecated"; then
    score_compile=$((score_compile + 2))
  fi

  # --- Link パターン ---
  if echo "$log_tail" | grep -qEi "Undefined symbols? for architecture|Undefined symbol:|duplicate symbol"; then
    score_link=$((score_link + 4))
  fi
  if echo "$log_tail" | grep -qEi "framework not found|library not found for -l"; then
    score_link=$((score_link + 4))
  fi

  # --- Dependency パターン ---
  if echo "$log_tail" | grep -qEi "Could not resolve|Could not find .+\.jar|Failed to resolve:|Dependencies could not be resolved"; then
    score_dependency=$((score_dependency + 4))
  fi
  if echo "$log_tail" | grep -qEi "CocoaPods could not find|Unable to find a specification|pod install.*failed"; then
    score_dependency=$((score_dependency + 4))
  fi
  if echo "$log_tail" | grep -qEi "version solving failed|npm ERR!.*ERESOLVE|npm ERR!.*peer dep|NU[0-9]+:.*Unable to resolve|pip.*ResolutionImpossible"; then
    score_dependency=$((score_dependency + 4))
  fi
  if echo "$log_tail" | grep -qEi "resolved source packages|version catalog .+ does not contain"; then
    score_dependency=$((score_dependency + 3))
  fi

  # --- ScriptPhase パターン ---
  if echo "$log_tail" | grep -qEi "PhaseScriptExecution failed|swiftlint.*error|SwiftLint.*not installed"; then
    score_scriptphase=$((score_scriptphase + 4))
  fi

  # --- Environment パターン ---
  if echo "$log_tail" | grep -qEi "xcode-select: error:|unable to find utility|no developer tools|SDK .+ cannot be located|unable to find SDK"; then
    score_environment=$((score_environment + 5))
  fi
  if echo "$log_tail" | grep -qEi "SDK location not found|ANDROID_HOME .+ not set|Unsupported Java version|requires JDK|dotnet.*not found|framework .+ was not found"; then
    score_environment=$((score_environment + 5))
  fi
  if echo "$log_tail" | grep -qEi "No space left on device|disk full|ENOSPC|out of memory|ENOMEM|JavaScript heap out of memory"; then
    score_environment=$((score_environment + 5))
  fi
  if echo "$log_tail" | grep -qEi "Minimum supported Gradle version|This version of the Android Gradle plugin requires|requires Xcode"; then
    score_environment=$((score_environment + 4))
  fi

  # --- CodeSign パターン ---
  if echo "$log_tail" | grep -qEi "No profiles for|Provisioning profile .+ not found|Certificate .+ has expired|entitlements .+ not permitted|Signing requires a development team|No signing certificate|Keystore .+ not found|keystore password"; then
    score_codesign=$((score_codesign + 5))
  fi

  # 最高スコアのカテゴリを返す
  local max_score=0
  local category="Compile"

  for cat_name in Compile Link Dependency ScriptPhase Environment CodeSign; do
    local var_name="score_$(echo "$cat_name" | tr '[:upper:]' '[:lower:]')"
    local score
    score=$(eval echo "\$$var_name")
    if [[ $score -gt $max_score ]]; then
      max_score=$score
      category=$cat_name
    fi
  done

  echo "$category"
}

# =============================================================================
# 自動修正
# =============================================================================

attempt_fix() {
  local platform="$1"
  local category="$2"
  local log_tail="$3"
  local dir="$4"
  local fix_applied=0

  log_step "カテゴリ: ${BOLD}${category}${NC} — 修正戦略を選択中..."

  case "$platform" in
    ios)
      attempt_fix_ios "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
    android)
      attempt_fix_android "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
    wpf)
      attempt_fix_wpf "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
    react)
      attempt_fix_react "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
    python)
      attempt_fix_python "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
    tauri)
      attempt_fix_tauri "$category" "$log_tail" "$dir"
      fix_applied=$?
      ;;
  esac

  return $fix_applied
}

# --- iOS 修正 ---
attempt_fix_ios() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Compile)
      # Swift 6 Concurrency 緩和
      if echo "$log_tail" | grep -qEi "sending .+ risks|non-sendable|actor-isolated"; then
        if [[ -f "$dir/Package.swift" ]] && grep -q "StrictConcurrency" "$dir/Package.swift"; then
          log_step "修正: Swift StrictConcurrency を complete → targeted に緩和"
          sed -i.bak 's/\.complete/\.targeted/g' "$dir/Package.swift"
          echo "--- diff ---"
          diff "$dir/Package.swift.bak" "$dir/Package.swift" || true
          rm -f "$dir/Package.swift.bak"
          return 0
        fi
      fi
      # モジュール未検出 → SPM リセット
      if echo "$log_tail" | grep -qEi "no such module|module .+ not found"; then
        if [[ -f "$dir/Package.swift" ]]; then
          log_step "修正: SPM パッケージキャッシュクリア + 再解決"
          (cd "$dir" && swift package purge-cache 2>/dev/null; swift package resolve 2>&1 | tail -5)
          return 0
        fi
        if [[ -f "$dir/Podfile" ]]; then
          log_step "修正: CocoaPods 再インストール"
          (cd "$dir" && pod deintegrate 2>/dev/null; pod install --repo-update 2>&1 | tail -10)
          return 0
        fi
      fi
      ;;
    Link)
      if [[ -f "$dir/Package.swift" ]]; then
        log_step "修正: SPM パッケージ再フェッチ"
        (cd "$dir" && swift package update 2>&1 | tail -5)
        return 0
      fi
      ;;
    Dependency)
      if [[ -f "$dir/Package.swift" ]]; then
        log_step "修正: Package.resolved を削除して SPM 再解決"
        rm -f "$dir/Package.resolved"
        (cd "$dir" && swift package resolve 2>&1 | tail -5)
        return 0
      fi
      if [[ -f "$dir/Podfile" ]]; then
        log_step "修正: CocoaPods リポジトリ更新 + 再インストール"
        (cd "$dir" && pod repo update 2>/dev/null; pod install 2>&1 | tail -10)
        return 0
      fi
      ;;
    ScriptPhase)
      if echo "$log_tail" | grep -qEi "swiftlint|SwiftLint"; then
        if command -v brew &>/dev/null; then
          log_step "修正: SwiftLint をインストール"
          brew install swiftlint 2>&1 | tail -3
          return 0
        fi
      fi
      ;;
    Environment)
      if echo "$log_tail" | grep -qEi "xcode-select: error:|no developer tools"; then
        if [[ -d "/Applications/Xcode.app" ]]; then
          log_step "修正: xcode-select でアクティブ Xcode を設定"
          sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer 2>&1
          return 0
        else
          log_step "修正: Command Line Tools をインストール"
          xcode-select --install 2>&1 || true
          return 0
        fi
      fi
      if echo "$log_tail" | grep -qEi "No space left|disk full|ENOSPC"; then
        log_step "修正: Xcode DerivedData をクリア"
        rm -rf ~/Library/Developer/Xcode/DerivedData 2>/dev/null
        log_success "DerivedData をクリアしました"
        return 0
      fi
      ;;
    CodeSign)
      # 自動署名の有効化
      local pbxproj
      pbxproj=$(find "$dir" -name "project.pbxproj" -path "*.xcodeproj/*" 2>/dev/null | head -1)
      if [[ -n "$pbxproj" ]] && grep -q "CODE_SIGN_STYLE = Manual" "$pbxproj"; then
        log_step "修正: 自動署名を有効化 (Manual → Automatic)"
        sed -i.bak 's/CODE_SIGN_STYLE = Manual/CODE_SIGN_STYLE = Automatic/g' "$pbxproj"
        echo "--- diff ---"
        diff "$pbxproj.bak" "$pbxproj" || true
        rm -f "$pbxproj.bak"
        return 0
      fi
      ;;
  esac
  return 1
}

# --- Android 修正 ---
attempt_fix_android() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Dependency)
      log_step "修正: Gradle キャッシュクリア + 再ビルド"
      (cd "$dir" && ./gradlew clean 2>/dev/null; rm -rf .gradle/caches 2>/dev/null; ./gradlew --refresh-dependencies 2>&1 | tail -5)
      return 0
      ;;
    Environment)
      if echo "$log_tail" | grep -qEi "SDK location not found|ANDROID_HOME"; then
        if [[ -d "$HOME/Android/Sdk" ]]; then
          log_step "修正: local.properties に ANDROID_HOME を設定"
          echo "sdk.dir=$HOME/Android/Sdk" > "$dir/local.properties"
          return 0
        elif [[ -n "${ANDROID_HOME:-}" ]]; then
          log_step "修正: local.properties に ANDROID_HOME を設定"
          echo "sdk.dir=$ANDROID_HOME" > "$dir/local.properties"
          return 0
        fi
      fi
      if echo "$log_tail" | grep -qEi "Minimum supported Gradle version"; then
        local required_version
        required_version=$(echo "$log_tail" | grep -oP 'Minimum supported Gradle version is \K[0-9.]+' | head -1)
        if [[ -n "$required_version" ]]; then
          log_step "修正: Gradle ラッパーを $required_version に更新"
          (cd "$dir" && ./gradlew wrapper --gradle-version="$required_version" 2>&1 | tail -3)
          return 0
        fi
      fi
      ;;
    CodeSign)
      log_warn "Keystore エラー — keystore パスとパスワードを確認してください"
      return 1
      ;;
    *)
      if [[ -f "$dir/gradlew" ]]; then
        log_step "修正: Gradle クリーンビルド"
        (cd "$dir" && ./gradlew clean 2>&1 | tail -3)
        return 0
      fi
      ;;
  esac
  return 1
}

# --- C# WPF 修正 ---
attempt_fix_wpf() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Dependency)
      log_step "修正: NuGet パッケージ強制復元"
      (cd "$dir" && dotnet restore --force 2>&1 | tail -5)
      return 0
      ;;
    Environment)
      log_step "情報収集: .NET SDK バージョン一覧"
      dotnet --list-sdks 2>&1
      return 1
      ;;
    *)
      log_step "修正: dotnet クリーン + 再ビルド"
      (cd "$dir" && dotnet clean 2>/dev/null; dotnet restore 2>&1 | tail -5)
      return 0
      ;;
  esac
}

# --- React 修正 ---
attempt_fix_react() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Dependency)
      log_step "修正: node_modules 再インストール"
      (cd "$dir" && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps 2>&1 | tail -10)
      return 0
      ;;
    Environment)
      if echo "$log_tail" | grep -qEi "JavaScript heap out of memory"; then
        log_step "修正: Node.js ヒープサイズを拡大 (8GB)"
        export NODE_OPTIONS="--max-old-space-size=8192"
        return 0
      fi
      ;;
    *)
      log_step "修正: ビルドキャッシュクリア"
      (cd "$dir" && rm -rf .next node_modules/.cache 2>/dev/null)
      return 0
      ;;
  esac
  return 1
}

# --- Python 修正 ---
attempt_fix_python() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Dependency)
      if [[ -f "$dir/requirements.txt" ]]; then
        log_step "修正: pip 依存を再インストール"
        (cd "$dir" && pip install -r requirements.txt --force-reinstall 2>&1 | tail -10)
        return 0
      fi
      ;;
    Compile)
      if echo "$log_tail" | grep -qEi "ModuleNotFoundError:|ImportError:"; then
        local missing_module
        missing_module=$(echo "$log_tail" | grep -oP "No module named '\\K[^']+'" | head -1 | tr -d "'")
        if [[ -n "$missing_module" ]]; then
          log_step "修正: 不足モジュール '$missing_module' をインストール"
          pip install "$missing_module" 2>&1 | tail -5
          return 0
        fi
      fi
      ;;
    *)
      log_step "修正: __pycache__ をクリア"
      find "$dir" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
      return 0
      ;;
  esac
  return 1
}

# --- Tauri 修正 ---
attempt_fix_tauri() {
  local category="$1"
  local log_tail="$2"
  local dir="$3"

  case "$category" in
    Dependency)
      log_step "修正: Cargo 依存を再取得"
      (cd "$dir" && cargo update --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5)
      return 0
      ;;
    Compile)
      log_step "修正: Cargo クリーンビルド"
      (cd "$dir" && cargo clean --manifest-path src-tauri/Cargo.toml 2>&1 | tail -3)
      return 0
      ;;
    *)
      log_step "修正: Tauri フロントエンド + Rust 両方クリア"
      (cd "$dir" && rm -rf node_modules/.cache .next 2>/dev/null; cargo clean --manifest-path src-tauri/Cargo.toml 2>/dev/null)
      return 0
      ;;
  esac
  return 1
}

# =============================================================================
# 追加情報収集
# =============================================================================

gather_info() {
  local platform="$1"
  local category="$2"
  local dir="$3"

  log_header "追加情報収集"

  case "$platform" in
    ios)
      log_step "Xcode バージョン:"
      xcodebuild -version 2>&1 || echo "xcodebuild not found"
      log_step "Swift バージョン:"
      swift --version 2>&1 || echo "swift not found"
      log_step "アクティブ Xcode パス:"
      xcode-select -p 2>&1 || echo "xcode-select not found"
      if [[ "$category" == "Dependency" ]] && [[ -f "$dir/Package.swift" ]]; then
        log_step "SPM 依存ツリー:"
        (cd "$dir" && swift package show-dependencies 2>/dev/null | head -30)
      fi
      if [[ "$category" == "CodeSign" ]]; then
        log_step "署名証明書一覧:"
        security find-identity -v -p codesigning 2>/dev/null | head -10
      fi
      ;;
    android)
      log_step "Gradle バージョン:"
      (cd "$dir" && ./gradlew --version 2>/dev/null | head -5) || echo "gradlew not found"
      log_step "JDK バージョン:"
      java -version 2>&1 | head -3
      log_step "ANDROID_HOME:"
      echo "${ANDROID_HOME:-NOT SET}"
      ;;
    wpf)
      log_step ".NET SDK バージョン一覧:"
      dotnet --list-sdks 2>&1 || echo "dotnet not found"
      ;;
    react)
      log_step "Node.js / npm バージョン:"
      node --version 2>&1; npm --version 2>&1
      ;;
    python)
      log_step "Python / pip バージョン:"
      python --version 2>&1; pip --version 2>&1
      ;;
    tauri)
      log_step "Rust / Cargo バージョン:"
      rustc --version 2>&1; cargo --version 2>&1
      log_step "Node.js / npm バージョン:"
      node --version 2>&1; npm --version 2>&1
      ;;
  esac
}

# =============================================================================
# メインループ
# =============================================================================

main() {
  local project_dir="${1:-.}"
  local max_loops=2
  local loop=0

  # --platform オプション解析
  FORCE_PLATFORM=""
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --platform)
        FORCE_PLATFORM="$2"
        shift 2
        ;;
      --max-loops)
        max_loops="$2"
        shift 2
        ;;
      *)
        shift
        ;;
    esac
  done

  # 絶対パスに変換
  project_dir=$(cd "$project_dir" 2>/dev/null && pwd)

  log_header "Build Doctor — ビルドエラー自律解消エージェント"
  log_info "プロジェクト: $project_dir"

  # プラットフォーム検出
  local platform
  platform=$(detect_platform "$project_dir")
  if [[ "$platform" == "unknown" ]]; then
    log_error "プラットフォームを検出できませんでした"
    log_info "--platform オプションで明示的に指定してください"
    exit 1
  fi
  log_info "プラットフォーム: ${BOLD}${platform}${NC}"

  # ログディレクトリ作成
  local log_dir="$project_dir/build_logs"
  mkdir -p "$log_dir"

  while [[ $loop -lt $max_loops ]]; do
    loop=$((loop + 1))
    log_header "ループ ${loop}/${max_loops}"

    # =========================================================================
    # Step 1: ビルド実行 + ログ保存
    # =========================================================================
    log_step "Step 1: ビルド実行"

    local ts
    ts=$(timestamp)
    local log_file="$log_dir/${platform}_build_${ts}.log"
    local build_cmd
    build_cmd=$(get_build_command "$platform" "$project_dir")

    log_info "コマンド: $build_cmd"
    log_info "ログ保存先: $log_file"

    # ビルド実行（タイムアウト 10分）
    set +e
    eval timeout 600 "$build_cmd" > "$log_file" 2>&1
    local build_exit=$?
    set -e

    # =========================================================================
    # ビルド成功判定
    # =========================================================================
    if check_build_success "$platform" "$log_file"; then
      log_success "ビルド成功！"
      echo ""
      log_info "=== 結果サマリー ==="
      log_info "ループ数: $loop"
      log_info "ログファイル: $log_file"
      log_info "ステータス: ${GREEN}RESOLVED${NC}"
      exit 0
    fi

    log_warn "ビルド失敗 (exit code: $build_exit)"

    # =========================================================================
    # Step 2: エラー末尾抽出 + カテゴリ分類
    # =========================================================================
    log_step "Step 2: エラー分析"

    local log_tail
    log_tail=$(tail -200 "$log_file")

    local category
    category=$(classify_error "$platform" "$log_tail")

    log_info "原因カテゴリ: ${BOLD}${category}${NC}"

    # エラー関連行を表示
    echo ""
    log_info "--- エラー関連行（最大20行） ---"
    echo "$log_tail" | grep -Ei "error:|Error:|ERROR:|fatal:|FATAL:|failed|FAILED" | tail -20
    echo "--- end ---"
    echo ""

    # =========================================================================
    # Step 3: 最小の修正を1つ適用
    # =========================================================================
    log_step "Step 3: 修正適用"

    set +e
    attempt_fix "$platform" "$category" "$log_tail" "$project_dir"
    local fix_result=$?
    set -e

    if [[ $fix_result -ne 0 ]]; then
      log_warn "自動修正を適用できませんでした"

      # 追加情報収集
      gather_info "$platform" "$category" "$project_dir"

      echo ""
      log_info "=== 結果サマリー ==="
      log_info "ループ数: $loop"
      log_info "ログファイル: $log_file"
      log_info "原因カテゴリ: $category"
      log_info "ステータス: ${YELLOW}NEEDS_INFO${NC}"
      log_info ""
      log_info "自動修正の範囲を超えています。"
      log_info "上記の追加情報とエラーログを確認してください。"
      exit 1
    fi

    log_success "修正を適用しました — 再ビルドで検証します"
    echo ""
  done

  # =========================================================================
  # ループ上限到達
  # =========================================================================
  log_header "ループ上限 (${max_loops}) に到達"

  # 最終情報収集
  gather_info "$platform" "${category:-Compile}" "$project_dir"

  local last_log
  last_log=$(ls -t "$log_dir"/${platform}_build_*.log 2>/dev/null | head -1)

  echo ""
  log_info "=== 結果サマリー ==="
  log_info "ループ数: $max_loops"
  log_info "最終ログ: ${last_log:-N/A}"
  log_info "最終カテゴリ: ${category:-N/A}"
  log_info "ステータス: ${RED}ESCALATE${NC}"
  log_info ""
  log_info "自動解消できませんでした。以下を確認してください:"
  log_info "  1. ログファイルのエラー詳細"
  log_info "  2. 上記の環境情報"
  log_info "  3. compatibility/ の既知 NG 組み合わせ"
  exit 1
}

# =============================================================================
# エントリポイント
# =============================================================================

main "$@"
