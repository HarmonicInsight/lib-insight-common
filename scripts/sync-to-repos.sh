#!/usr/bin/env bash
# =============================================================================
# insight-common → 各アプリリポジトリへのサブモジュール + アイコン同期
#
# 使い方:
#   ./scripts/sync-to-repos.sh                     # 全リポジトリ
#   ./scripts/sync-to-repos.sh win-app-insight-sheet  # 指定リポジトリのみ
#   ./scripts/sync-to-repos.sh --dry-run           # 変更確認のみ
#   ./scripts/sync-to-repos.sh --list              # 対象一覧表示
#
# 前提:
#   - 各リポジトリが $BASE_DIR 配下にクローン済み
#   - insight-common のルートから実行
# =============================================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSIGHT_COMMON_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ICON_GENERATED="$INSIGHT_COMMON_ROOT/brand/icons/generated"

# 開発ディレクトリ（環境変数 or デフォルト）
BASE_DIR="${INSIGHT_DEV_DIR:-$(cd "$INSIGHT_COMMON_ROOT/.." && pwd)}"

DRY_RUN=false
FILTER=""

# --- リポジトリ定義 ---
# 形式: "repo|product|name|icon_src|icon_dest|copy_mode"
REPOS=(
  "win-app-nocode-analyzer|INCA|InsightNoCodeAnalyzer|InsightNoCodeAnalyzer/|src-tauri/icons/|dir"
  "win-app-insight-bot|INBT|InsightBot|InsightBot|Resources|ico_png"
  "web-app-auto-interview|IVIN|InterviewInsight|InterviewInsight/|src-tauri/icons/|dir"
  "win-app-insight-movie-gen|INMV|InsightMovie|InsightMovie|resources|ico_png"
  "win-app-insight-image-gen|INIG|InsightImageGen|InsightImageGen|resources|ico_png"
  "win-app-insight-slide|INSS|InsightOfficeSlide|InsightOfficeSlide|Resources|ico_png"
  "win-app-insight-sheet|IOSH|InsightOfficeSheet|InsightOfficeSheet|Resources|ico_png"
  "win-app-insight-doc|IOSD|InsightOfficeDoc|InsightOfficeDoc|Resources|ico_png"
  "win-app-insight-py|INPY|InsightPy|InsightPy|resources|ico_png"
  "win-app-insight-py-pro|INPY|InsightPy|InsightPy|resources|ico_png"
  "win-app-insight-sheet-senior|ISOF|InsightSeniorOffice|InsightSeniorOffice|Resources|ico_png"
  "win-app-insight-launcher|LAUNCHER|InsightLauncher|InsightLauncher|Resources|ico_png"
  "android-app-insight-voice-clock|VOICE_CLOCK|InsightVoiceClock|InsightVoiceClock|assets|expo"
  "android-app-insight-camera|CAMERA|InsightCamera|InsightCamera|assets|expo"
  "mobile-app-voice-memo|VOICE_MEMO|InsightVoiceMemo|InsightVoiceMemo|assets|expo"
  "win-app-insight-pinboard|PINBOARD|InsightPinBoard|InsightPinBoard|assets|expo"
  "web-app-insight-qr|QR|InsightQR|InsightQR|public|web"
)

# --- Parse arguments ---
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --list)
      echo "=== 同期対象リポジトリ ==="
      printf "%-35s %-8s %s\n" "REPOSITORY" "CODE" "PRODUCT"
      printf "%-35s %-8s %s\n" "---" "---" "---"
      for entry in "${REPOS[@]}"; do
        IFS='|' read -r repo product name _ _ _ <<< "$entry"
        printf "%-35s %-8s %s\n" "$repo" "$product" "$name"
      done
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [--list] [repo-name ...]"
      echo ""
      echo "Options:"
      echo "  --dry-run  変更を確認するのみ（コミットしない）"
      echo "  --list     対象リポジトリ一覧を表示"
      echo "  --help     このヘルプを表示"
      echo ""
      echo "Environment:"
      echo "  INSIGHT_DEV_DIR  開発ディレクトリ (default: ../ from insight-common)"
      exit 0
      ;;
    -*) echo "Unknown option: $arg"; exit 1 ;;
    *) FILTER="$FILTER $arg" ;;
  esac
done

# --- Functions ---
copy_icons() {
  local icon_src="$1" icon_dest="$2" name="$3" mode="$4" repo_dir="$5"

  mkdir -p "$repo_dir/$icon_dest"

  case "$mode" in
    dir)
      cp -r "$ICON_GENERATED/$icon_src"* "$repo_dir/$icon_dest"
      ;;
    ico_png)
      cp "$ICON_GENERATED/$icon_src/$name.ico" "$repo_dir/$icon_dest/$name.ico"
      cp "$ICON_GENERATED/$icon_src/${name}_256.png" "$repo_dir/$icon_dest/${name}_256.png"
      ;;
    expo)
      for f in icon.png adaptive-icon.png notification-icon.png splash-icon.png favicon.png; do
        [ -f "$ICON_GENERATED/$icon_src/$f" ] && cp "$ICON_GENERATED/$icon_src/$f" "$repo_dir/$icon_dest/$f"
      done
      # Android mipmap ディレクトリ
      if [ -d "$ICON_GENERATED/$icon_src/android" ]; then
        cp -r "$ICON_GENERATED/$icon_src/android/"* "$repo_dir/$icon_dest/" 2>/dev/null || true
      fi
      ;;
    web)
      cp "$ICON_GENERATED/$icon_src/favicon.ico" "$repo_dir/$icon_dest/favicon.ico"
      for f in favicon-16.png favicon-32.png apple-touch-icon.png icon-192.png icon-512.png; do
        [ -f "$ICON_GENERATED/$icon_src/$f" ] && cp "$ICON_GENERATED/$icon_src/$f" "$repo_dir/$icon_dest/$f"
      done
      ;;
  esac
}

# --- Main ---
echo "=== insight-common → 各リポジトリ同期 ==="
echo "  insight-common: $INSIGHT_COMMON_ROOT"
echo "  開発ディレクトリ: $BASE_DIR"
echo "  Dry run: $DRY_RUN"
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

for entry in "${REPOS[@]}"; do
  IFS='|' read -r repo product name icon_src icon_dest copy_mode <<< "$entry"

  # フィルタチェック
  if [ -n "$FILTER" ]; then
    if ! echo "$FILTER" | grep -qw "$repo"; then
      continue
    fi
  fi

  REPO_DIR="$BASE_DIR/$repo"

  if [ ! -d "$REPO_DIR" ]; then
    echo "  SKIP  $repo (not found at $REPO_DIR)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  SYNC  $repo ($product: $name)"

  # 1. サブモジュール更新
  SUBMODULE_DIR="$REPO_DIR/insight-common"
  if [ -d "$SUBMODULE_DIR/.git" ] || [ -f "$SUBMODULE_DIR/.git" ]; then
    (cd "$REPO_DIR" && git submodule update --remote insight-common 2>/dev/null) || true
    echo "        submodule updated"
  else
    echo "        WARN: no insight-common submodule found"
  fi

  # 2. アイコンコピー
  if copy_icons "$icon_src" "$icon_dest" "$name" "$copy_mode" "$REPO_DIR"; then
    echo "        icons copied ($copy_mode)"
  else
    echo "        ERROR: icon copy failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  # 3. git status
  CHANGES=$(cd "$REPO_DIR" && git status --porcelain)
  if [ -z "$CHANGES" ]; then
    echo "        no changes"
    SUCCESS=$((SUCCESS + 1))
    continue
  fi

  echo "        changes detected:"
  echo "$CHANGES" | while read -r line; do echo "          $line"; done

  if [ "$DRY_RUN" = true ]; then
    echo "        (dry-run: skipping commit)"
  else
    SHORT_SHA=$(cd "$INSIGHT_COMMON_ROOT" && git rev-parse --short HEAD)
    (
      cd "$REPO_DIR"
      git add -A
      git commit -m "chore: update insight-common to $SHORT_SHA

- サブモジュール更新
- アイコンファイル同期"
    )
    echo "        committed"
  fi

  SUCCESS=$((SUCCESS + 1))
done

echo ""
echo "=== 完了: $SUCCESS synced, $SKIPPED skipped, $FAILED failed ==="
