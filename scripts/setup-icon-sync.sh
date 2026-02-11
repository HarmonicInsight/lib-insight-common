#!/usr/bin/env bash
#
# setup-icon-sync.sh
# ==================
# 既存アプリに insight-common のアイコン自動同期を設定する。
# プラットフォームを自動検出し、ビルドフックを注入。
#
# 使い方:
#   cd /path/to/my-app
#   ./insight-common/scripts/setup-icon-sync.sh --product IOSH
#   ./insight-common/scripts/setup-icon-sync.sh --launcher   # ランチャーアプリ用
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# =============================================================================
# カラー
# =============================================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# ヘルプ
# =============================================================================
usage() {
  cat <<'EOF'
Usage: setup-icon-sync.sh [OPTIONS]

既存アプリに insight-common アイコン自動同期を設定します。
プラットフォームを自動検出し、適切なビルドフックを注入します。

Options:
  --product CODE    製品コード（例: IOSH, INSS, CAMERA）
  --launcher        ランチャーモード（全製品アイコン）
  --app-dir DIR     アプリのルートディレクトリ（デフォルト: カレント）
  --dry-run         変更せず、何が行われるかだけ表示
  -h, --help        このヘルプ

Examples:
  # WPF アプリ (InsightOfficeSheet)
  cd /path/to/InsightOfficeSheet
  ./insight-common/scripts/setup-icon-sync.sh --product IOSH

  # Android ランチャー
  cd /path/to/android-launcher
  ./insight-common/scripts/setup-icon-sync.sh --launcher

  # Expo アプリ
  cd /path/to/InsightCamera
  ./insight-common/scripts/setup-icon-sync.sh --product CAMERA
EOF
  exit 0
}

# =============================================================================
# パラメータ
# =============================================================================
MODE=""
PRODUCT_CODE=""
APP_DIR="."
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --product)   MODE="product"; PRODUCT_CODE="${2^^}"; shift 2 ;;
    --launcher)  MODE="launcher"; shift ;;
    --app-dir)   APP_DIR="$2"; shift 2 ;;
    --dry-run)   DRY_RUN=true; shift ;;
    -h|--help)   usage ;;
    *)           echo -e "${RED}Unknown option: $1${NC}" >&2; usage ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo -e "${RED}Error: --product CODE or --launcher is required.${NC}" >&2
  exit 1
fi

APP_DIR="$(cd "$APP_DIR" && pwd)"

# =============================================================================
# プラットフォーム自動検出
# =============================================================================
detect_platform() {
  if [[ -f "$APP_DIR/app/build.gradle.kts" ]] || [[ -f "$APP_DIR/app/build.gradle" ]]; then
    echo "android"
  elif [[ -f "$APP_DIR/app.json" ]] && grep -q "expo" "$APP_DIR/app.json" 2>/dev/null; then
    echo "expo"
  elif [[ -f "$APP_DIR/package.json" ]] && grep -q "next" "$APP_DIR/package.json" 2>/dev/null; then
    echo "web"
  elif ls "$APP_DIR"/*.csproj 2>/dev/null | head -1 | grep -q ".csproj"; then
    echo "wpf"
  elif ls "$APP_DIR"/*.sln 2>/dev/null | head -1 | grep -q ".sln"; then
    echo "wpf"
  elif [[ -f "$APP_DIR/src-tauri/tauri.conf.json" ]]; then
    echo "tauri"
  else
    echo "unknown"
  fi
}

PLATFORM=$(detect_platform)

echo -e "${YELLOW}=== insight-common Icon Sync Setup ===${NC}"
echo -e "App:      $APP_DIR"
echo -e "Platform: $PLATFORM"
echo -e "Mode:     $MODE"
[[ "$MODE" == "product" ]] && echo -e "Product:  $PRODUCT_CODE"
echo ""

# =============================================================================
# insight-common サブモジュール確認
# =============================================================================
if [[ ! -d "$APP_DIR/insight-common" ]]; then
  echo -e "${YELLOW}insight-common submodule not found. Adding...${NC}"
  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common"
  else
    cd "$APP_DIR"
    git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common 2>/dev/null || true
    git submodule update --init 2>/dev/null || true
  fi
fi

# =============================================================================
# sync コマンドの組み立て
# =============================================================================
build_sync_command() {
  local script="./insight-common/scripts/sync-app-icons.sh"
  if [[ "$MODE" == "launcher" ]]; then
    echo "$script --launcher --pull --verify"
  else
    echo "$script --product $PRODUCT_CODE --pull --verify"
  fi
}

SYNC_CMD=$(build_sync_command)

# =============================================================================
# プラットフォーム別セットアップ
# =============================================================================

# --- Android (Gradle Kotlin DSL) ---
setup_android() {
  local build_file="$APP_DIR/app/build.gradle.kts"
  local target_dir

  if [[ "$MODE" == "launcher" ]]; then
    target_dir="src/main/assets/launcher"
  else
    target_dir="src/main/res"
  fi

  # 既にセットアップ済みか確認
  if grep -q "syncAppIcons\|syncLauncherAssets\|sync-app-icons" "$build_file" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] Gradle task already configured in build.gradle.kts${NC}"
    return
  fi

  local gradle_snippet
  if [[ "$MODE" == "launcher" ]]; then
    gradle_snippet=$(cat <<'GRADLE'

// ---------------------------------------------------------------------------
// insight-common: Launcher icon sync (all products → assets)
// Runs on every build. Skips if no changes (hash-based).
// ---------------------------------------------------------------------------
val syncAppIcons by tasks.registering(Exec::class) {
    val syncScript = rootProject.file("insight-common/scripts/sync-app-icons.sh")
    val targetDir = layout.projectDirectory.dir("src/main/assets/launcher").asFile

    commandLine("bash", syncScript.absolutePath,
        "--launcher", "--pull", "--verify", targetDir.absolutePath)
    workingDir(rootProject.projectDir)

    inputs.dir(rootProject.file("insight-common/brand/icons/generated/launcher"))
    outputs.dir(targetDir)
    isIgnoreExitValue = true
}

tasks.configureEach {
    if (name.startsWith("pre") && name.endsWith("Build")) {
        dependsOn(syncAppIcons)
    }
}
GRADLE
)
  else
    gradle_snippet=$(cat <<GRADLE

// ---------------------------------------------------------------------------
// insight-common: App icon sync ($PRODUCT_CODE)
// Runs on every build. Skips if no changes (hash-based).
// ---------------------------------------------------------------------------
val syncAppIcons by tasks.registering(Exec::class) {
    val syncScript = rootProject.file("insight-common/scripts/sync-app-icons.sh")
    val targetDir = layout.projectDirectory.dir("src/main/res").asFile

    commandLine("bash", syncScript.absolutePath,
        "--product", "$PRODUCT_CODE", "--pull", "--verify", targetDir.absolutePath)
    workingDir(rootProject.projectDir)

    inputs.dir(rootProject.file("insight-common/brand/icons/generated"))
    outputs.dir(targetDir)
    isIgnoreExitValue = true
}

tasks.configureEach {
    if (name.startsWith("pre") && name.endsWith("Build")) {
        dependsOn(syncAppIcons)
    }
}
GRADLE
)
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would append to $build_file:"
    echo "$gradle_snippet"
  else
    # plugins { ... } ブロックの直後に挿入
    # 安全のため末尾に追記（Gradle はブロック順序に敏感でない）
    echo "$gradle_snippet" >> "$build_file"
    echo -e "${GREEN}[OK] Added syncAppIcons task to app/build.gradle.kts${NC}"
  fi
}

# --- Android (Gradle Groovy) ---
setup_android_groovy() {
  local build_file="$APP_DIR/app/build.gradle"

  if grep -q "syncAppIcons\|syncLauncherAssets\|sync-app-icons" "$build_file" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] Gradle task already configured${NC}"
    return
  fi

  local target_flag
  local target_dir
  if [[ "$MODE" == "launcher" ]]; then
    target_flag="'--launcher'"
    target_dir="src/main/assets/launcher"
  else
    target_flag="'--product', '$PRODUCT_CODE'"
    target_dir="src/main/res"
  fi

  local groovy_snippet
  groovy_snippet=$(cat <<GROOVY

// insight-common: App icon sync
task syncAppIcons(type: Exec) {
    def syncScript = rootProject.file('insight-common/scripts/sync-app-icons.sh')
    def targetDir = file('$target_dir')
    commandLine 'bash', syncScript.absolutePath,
        $target_flag, '--pull', '--verify', targetDir.absolutePath
    workingDir rootProject.projectDir
    ignoreExitValue true
}
preBuild.dependsOn syncAppIcons
GROOVY
)

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would append to $build_file"
  else
    echo "$groovy_snippet" >> "$build_file"
    echo -e "${GREEN}[OK] Added syncAppIcons task to app/build.gradle${NC}"
  fi
}

# --- Web (Next.js / package.json) ---
setup_web() {
  local pkg="$APP_DIR/package.json"

  if grep -q "sync-app-icons\|sync:icons" "$pkg" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] npm script already configured${NC}"
    return
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would add 'prebuild' and 'sync:icons' scripts to package.json"
  else
    # jq があれば使う、なければ sed
    if command -v jq &>/dev/null; then
      local tmp
      tmp=$(mktemp)
      jq --arg cmd "$SYNC_CMD public/" \
        '.scripts["sync:icons"] = $cmd | .scripts.prebuild = "npm run sync:icons"' \
        "$pkg" > "$tmp" && mv "$tmp" "$pkg"
    else
      # sed で scripts ブロックに追加
      sed -i 's/"scripts": {/"scripts": {\n    "sync:icons": "'"${SYNC_CMD//\//\\/}"' public\/",\n    "prebuild": "npm run sync:icons",/' "$pkg"
    fi
    echo -e "${GREEN}[OK] Added sync:icons script to package.json${NC}"
  fi
}

# --- Expo (React Native) ---
setup_expo() {
  local pkg="$APP_DIR/package.json"

  if grep -q "sync-app-icons\|sync:icons" "$pkg" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] npm script already configured${NC}"
    return
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would add sync:icons scripts to package.json"
  else
    if command -v jq &>/dev/null; then
      local tmp
      tmp=$(mktemp)
      jq --arg cmd "$SYNC_CMD assets/" \
        '.scripts["sync:icons"] = $cmd | .scripts.prebuild = "npm run sync:icons"' \
        "$pkg" > "$tmp" && mv "$tmp" "$pkg"
    else
      sed -i 's/"scripts": {/"scripts": {\n    "sync:icons": "'"${SYNC_CMD//\//\\/}"' assets\/",\n    "prebuild": "npm run sync:icons",/' "$pkg"
    fi
    echo -e "${GREEN}[OK] Added sync:icons script to package.json${NC}"
  fi
}

# --- WPF (C# / MSBuild) ---
setup_wpf() {
  # .csproj ファイルを探す
  local csproj
  csproj=$(ls "$APP_DIR"/*.csproj 2>/dev/null | head -1 || echo "")

  if [[ -z "$csproj" ]]; then
    # src/ 以下を探す
    csproj=$(find "$APP_DIR" -maxdepth 3 -name "*.csproj" | head -1 || echo "")
  fi

  if [[ -z "$csproj" ]]; then
    echo -e "${RED}[ERROR] .csproj file not found${NC}"
    echo "手動で MSBuild PreBuildEvent を追加してください:"
    echo "  <Exec Command=\"bash insight-common/scripts/sync-app-icons.sh --product $PRODUCT_CODE --pull Resources/\" />"
    return
  fi

  if grep -q "sync-app-icons" "$csproj" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] MSBuild target already configured in $(basename "$csproj")${NC}"
    return
  fi

  local msbuild_snippet
  msbuild_snippet=$(cat <<MSBUILD

  <!-- insight-common: App icon sync ($PRODUCT_CODE) -->
  <Target Name="SyncAppIcons" BeforeTargets="PreBuildEvent">
    <Exec Command="bash \$(SolutionDir)insight-common/scripts/sync-app-icons.sh --product $PRODUCT_CODE --pull --verify Resources/"
          WorkingDirectory="\$(SolutionDir)"
          IgnoreExitCode="true" />
  </Target>
MSBUILD
)

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would add MSBuild target to $(basename "$csproj")"
  else
    # </Project> の直前に挿入
    sed -i "s|</Project>|${msbuild_snippet}\n</Project>|" "$csproj"
    echo -e "${GREEN}[OK] Added SyncAppIcons target to $(basename "$csproj")${NC}"
  fi
}

# --- Tauri ---
setup_tauri() {
  local pkg="$APP_DIR/package.json"

  if grep -q "sync-app-icons\|sync:icons" "$pkg" 2>/dev/null; then
    echo -e "${GREEN}[SKIP] npm script already configured${NC}"
    return
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would add sync:icons scripts to package.json"
  else
    if command -v jq &>/dev/null; then
      local tmp
      tmp=$(mktemp)
      jq --arg cmd "$SYNC_CMD src-tauri/icons/" \
        '.scripts["sync:icons"] = $cmd | .scripts["pretauri:build"] = "npm run sync:icons"' \
        "$pkg" > "$tmp" && mv "$tmp" "$pkg"
    else
      sed -i 's/"scripts": {/"scripts": {\n    "sync:icons": "'"${SYNC_CMD//\//\\/}"' src-tauri\/icons\/",\n    "pretauri:build": "npm run sync:icons",/' "$pkg"
    fi
    echo -e "${GREEN}[OK] Added sync:icons script to package.json${NC}"
  fi
}

# =============================================================================
# .gitignore にアイコン出力先を追加
# =============================================================================
setup_gitignore() {
  local gitignore="$APP_DIR/.gitignore"
  local ignore_entry

  if [[ "$MODE" == "launcher" ]]; then
    ignore_entry="app/src/main/assets/launcher/"
  else
    # 個別アプリは生成物を直接 Resources/ 等に入れるので gitignore 不要なことが多い
    return
  fi

  if [[ -f "$gitignore" ]] && grep -qF "$ignore_entry" "$gitignore" 2>/dev/null; then
    return
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would add '$ignore_entry' to .gitignore"
  else
    echo "" >> "$gitignore"
    echo "# insight-common icon sync output" >> "$gitignore"
    echo "$ignore_entry" >> "$gitignore"
    echo -e "${GREEN}[OK] Updated .gitignore${NC}"
  fi
}

# =============================================================================
# ディスパッチ
# =============================================================================
case "$PLATFORM" in
  android)
    if [[ -f "$APP_DIR/app/build.gradle.kts" ]]; then
      setup_android
    elif [[ -f "$APP_DIR/app/build.gradle" ]]; then
      setup_android_groovy
    fi
    setup_gitignore
    ;;
  expo)
    setup_expo
    ;;
  web)
    setup_web
    ;;
  wpf)
    setup_wpf
    ;;
  tauri)
    setup_tauri
    ;;
  *)
    echo -e "${RED}Platform not detected. Please set up manually.${NC}"
    echo ""
    echo "手動セットアップ:"
    echo "  ビルドの pre-build ステップに以下を追加:"
    echo "  $SYNC_CMD <output-dir>"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "ビルド時に自動的にアイコンが同期されます。"
echo "手動で実行する場合:"
echo -e "  ${BLUE}$SYNC_CMD <output-dir>${NC}"
echo ""
echo "初回テスト:"
echo -e "  ${BLUE}$SYNC_CMD --dry-run <output-dir>${NC}"
