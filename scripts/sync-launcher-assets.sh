#!/usr/bin/env bash
#
# sync-launcher-assets.sh
# =======================
# insight-common のランチャーアイコンを Android アプリプロジェクトにコピーする。
#
# 用途:
#   - InsightLauncher (Android) のビルド前にアイコンアセットを同期
#   - Gradle の preBuild タスクから呼び出す or 手動実行
#
# 使い方:
#   # insight-common がサブモジュールの場合
#   ./insight-common/scripts/sync-launcher-assets.sh ./app/src/main/assets/launcher
#
#   # insight-common リポジトリを直接指定
#   ./scripts/sync-launcher-assets.sh --source /path/to/insight-common /path/to/target
#
#   # ドライラン（コピーせず差分のみ表示）
#   ./scripts/sync-launcher-assets.sh --dry-run ./app/src/main/assets/launcher
#
set -euo pipefail

# =============================================================================
# 定数
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE="$(cd "$SCRIPT_DIR/.." && pwd)"
LAUNCHER_SUBDIR="brand/icons/generated/launcher"
MANIFEST_FILE="launcher-manifest.json"

# =============================================================================
# ヘルプ
# =============================================================================
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <target-dir>

Android ランチャーアプリに insight-common のアイコンとマニフェストを同期します。

Arguments:
  <target-dir>    コピー先ディレクトリ (例: app/src/main/assets/launcher)

Options:
  --source DIR    insight-common のルートディレクトリ (デフォルト: スクリプトの親ディレクトリ)
  --dry-run       コピーせず、何が行われるかだけ表示
  --clean         コピー前にターゲットディレクトリをクリーンアップ
  --manifest-only マニフェストのみコピー（アイコン画像はスキップ）
  --verify        コピー後にファイル数を検証
  -h, --help      このヘルプを表示

Examples:
  # サブモジュール利用時
  ./insight-common/scripts/sync-launcher-assets.sh app/src/main/assets/launcher

  # Gradle から呼ぶ場合
  ./insight-common/scripts/sync-launcher-assets.sh \\
    --source ./insight-common \\
    --verify \\
    app/src/main/assets/launcher
EOF
  exit 0
}

# =============================================================================
# パラメータ解析
# =============================================================================
SOURCE_DIR="$DEFAULT_SOURCE"
TARGET_DIR=""
DRY_RUN=false
CLEAN=false
MANIFEST_ONLY=false
VERIFY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE_DIR="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    --manifest-only)
      MANIFEST_ONLY=true
      shift
      ;;
    --verify)
      VERIFY=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    -*)
      echo "Error: Unknown option: $1" >&2
      usage
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  echo "Error: <target-dir> is required." >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

# =============================================================================
# ソースの検証
# =============================================================================
LAUNCHER_SOURCE="$SOURCE_DIR/$LAUNCHER_SUBDIR"

if [[ ! -d "$LAUNCHER_SOURCE" ]]; then
  echo "Error: Launcher icons directory not found: $LAUNCHER_SOURCE" >&2
  echo "Run 'python scripts/generate-app-icon.py --launcher' first to generate icons." >&2
  exit 1
fi

if [[ ! -f "$LAUNCHER_SOURCE/$MANIFEST_FILE" ]]; then
  echo "Error: Manifest not found: $LAUNCHER_SOURCE/$MANIFEST_FILE" >&2
  exit 1
fi

# =============================================================================
# 同期実行
# =============================================================================
echo "=== HARMONIC insight Launcher Asset Sync ==="
echo "Source:  $LAUNCHER_SOURCE"
echo "Target:  $TARGET_DIR"
echo ""

# カウンター
copied_files=0
copied_dirs=0

# クリーンアップ
if [[ "$CLEAN" == true ]] && [[ -d "$TARGET_DIR" ]]; then
  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Would remove: $TARGET_DIR"
  else
    echo "Cleaning target directory..."
    rm -rf "$TARGET_DIR"
  fi
fi

# ターゲットディレクトリ作成
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$TARGET_DIR"
fi

# マニフェストをコピー
if [[ "$DRY_RUN" == true ]]; then
  echo "[DRY-RUN] Copy: $MANIFEST_FILE"
else
  cp "$LAUNCHER_SOURCE/$MANIFEST_FILE" "$TARGET_DIR/$MANIFEST_FILE"
  echo "[OK] $MANIFEST_FILE"
fi
copied_files=$((copied_files + 1))

# マニフェストのみモードなら終了
if [[ "$MANIFEST_ONLY" == true ]]; then
  echo ""
  echo "Manifest-only mode: Done."
  exit 0
fi

# 製品アイコンディレクトリを列挙してコピー
for product_dir in "$LAUNCHER_SOURCE"/*/; do
  # ディレクトリのみ処理
  [[ -d "$product_dir" ]] || continue

  product_code="$(basename "$product_dir")"

  # mipmap ディレクトリがあるか確認（製品ディレクトリの判別）
  has_mipmap=false
  for density_dir in "$product_dir"mipmap-*/; do
    [[ -d "$density_dir" ]] && has_mipmap=true && break
  done

  if [[ "$has_mipmap" == false ]]; then
    continue
  fi

  copied_dirs=$((copied_dirs + 1))

  # 各密度のアイコンをコピー
  for density_dir in "$product_dir"mipmap-*/; do
    [[ -d "$density_dir" ]] || continue
    density_name="$(basename "$density_dir")"
    target_density_dir="$TARGET_DIR/$product_code/$density_name"

    icon_file="$density_dir/ic_launcher.png"
    if [[ -f "$icon_file" ]]; then
      if [[ "$DRY_RUN" == true ]]; then
        echo "[DRY-RUN] Copy: $product_code/$density_name/ic_launcher.png"
      else
        mkdir -p "$target_density_dir"
        cp "$icon_file" "$target_density_dir/ic_launcher.png"
      fi
      copied_files=$((copied_files + 1))
    fi
  done

  if [[ "$DRY_RUN" == false ]]; then
    echo "[OK] $product_code (5 densities)"
  fi
done

# =============================================================================
# 検証
# =============================================================================
echo ""
echo "--- Summary ---"
echo "Products synced: $copied_dirs"
echo "Files copied:    $copied_files"

if [[ "$VERIFY" == true ]] && [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo "--- Verification ---"

  # マニフェストの entries 数を取得
  if command -v python3 &>/dev/null; then
    expected=$(python3 -c "
import json
with open('$TARGET_DIR/$MANIFEST_FILE') as f:
    m = json.load(f)
print(len(m['entries']))
")
  elif command -v jq &>/dev/null; then
    expected=$(jq '.entries | length' "$TARGET_DIR/$MANIFEST_FILE")
  else
    echo "[WARN] python3 or jq not found, skipping entry count verification"
    expected="$copied_dirs"
  fi

  # 実際にコピーされたディレクトリ数と比較
  actual_dirs=$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

  if [[ "$actual_dirs" -eq "$expected" ]]; then
    echo "[PASS] Product directories: $actual_dirs (expected: $expected)"
  else
    echo "[FAIL] Product directories: $actual_dirs (expected: $expected)"
    exit 1
  fi

  # 各製品に5つの密度があるか確認
  verify_ok=true
  for product_dir in "$TARGET_DIR"/*/; do
    [[ -d "$product_dir" ]] || continue
    product_code="$(basename "$product_dir")"
    icon_count=$(find "$product_dir" -name "ic_launcher.png" | wc -l | tr -d ' ')
    if [[ "$icon_count" -ne 5 ]]; then
      echo "[FAIL] $product_code: $icon_count density variants (expected: 5)"
      verify_ok=false
    fi
  done

  if [[ "$verify_ok" == true ]]; then
    echo "[PASS] All products have 5 density variants"
  else
    exit 1
  fi
fi

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "(Dry run — no files were actually copied)"
fi

echo ""
echo "Done."
