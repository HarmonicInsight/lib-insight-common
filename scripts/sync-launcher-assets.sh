#!/usr/bin/env bash
#
# sync-launcher-assets.sh
# =======================
# insight-common のランチャーアイコンを Android アプリプロジェクトにコピーする。
# 変更がない場合はスキップする（ハッシュ比較）。
#
# 用途:
#   - InsightLauncher (Android) の Gradle preBuild タスクから自動呼び出し
#   - 手動実行
#
# 使い方:
#   # 基本（変更があれば同期、なければスキップ）
#   ./insight-common/scripts/sync-launcher-assets.sh app/src/main/assets/launcher
#
#   # サブモジュールを最新に pull してから同期（ビルド時推奨）
#   ./insight-common/scripts/sync-launcher-assets.sh --pull app/src/main/assets/launcher
#
#   # 変更チェックを無視して強制同期
#   ./insight-common/scripts/sync-launcher-assets.sh --force app/src/main/assets/launcher
#
set -euo pipefail

# =============================================================================
# 定数
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE="$(cd "$SCRIPT_DIR/.." && pwd)"
LAUNCHER_SUBDIR="brand/icons/generated/launcher"
MANIFEST_FILE="launcher-manifest.json"
SYNC_HASH_FILE=".launcher-sync-hash"

# =============================================================================
# ヘルプ
# =============================================================================
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <target-dir>

Android ランチャーアプリに insight-common のアイコンとマニフェストを同期します。
前回の同期からソースに変更がなければスキップします（高速）。

Arguments:
  <target-dir>    コピー先ディレクトリ (例: app/src/main/assets/launcher)

Options:
  --source DIR    insight-common のルートディレクトリ (デフォルト: スクリプトの親ディレクトリ)
  --pull          同期前に insight-common サブモジュールを git pull で最新化
  --force         変更チェックをスキップして強制同期
  --clean         コピー前にターゲットディレクトリをクリーンアップ
  --dry-run       コピーせず、何が行われるかだけ表示
  --manifest-only マニフェストのみコピー（アイコン画像はスキップ）
  --verify        コピー後にファイル数を検証
  -h, --help      このヘルプを表示

Examples:
  # Gradle preBuild から呼ぶ場合（推奨）
  ./insight-common/scripts/sync-launcher-assets.sh \\
    --pull --verify \\
    app/src/main/assets/launcher

  # 強制再同期
  ./insight-common/scripts/sync-launcher-assets.sh --force app/src/main/assets/launcher
EOF
  exit 0
}

# =============================================================================
# パラメータ解析
# =============================================================================
SOURCE_DIR="$DEFAULT_SOURCE"
TARGET_DIR=""
PULL=false
FORCE=false
DRY_RUN=false
CLEAN=false
MANIFEST_ONLY=false
VERIFY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)   SOURCE_DIR="$2"; shift 2 ;;
    --pull)     PULL=true; shift ;;
    --force)    FORCE=true; shift ;;
    --dry-run)  DRY_RUN=true; shift ;;
    --clean)    CLEAN=true; shift ;;
    --manifest-only) MANIFEST_ONLY=true; shift ;;
    --verify)   VERIFY=true; shift ;;
    -h|--help)  usage ;;
    -*)         echo "Error: Unknown option: $1" >&2; usage ;;
    *)          TARGET_DIR="$1"; shift ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  echo "Error: <target-dir> is required." >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

# =============================================================================
# サブモジュール pull
# =============================================================================
if [[ "$PULL" == true ]]; then
  echo "Pulling latest insight-common..."
  if [[ -d "$SOURCE_DIR/.git" ]] || [[ -f "$SOURCE_DIR/.git" ]]; then
    git -C "$SOURCE_DIR" pull --ff-only origin main 2>/dev/null || \
    git -C "$SOURCE_DIR" pull --ff-only 2>/dev/null || \
    echo "[WARN] git pull failed, using current version"
  else
    echo "[WARN] $SOURCE_DIR is not a git repository, skipping pull"
  fi
  echo ""
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
# 変更チェック（ハッシュ比較）
# =============================================================================
compute_source_hash() {
  # ソース側のハッシュを計算
  # 方法 1: insight-common が git リポジトリなら、launcher ディレクトリの tree hash を使う（最も正確）
  if [[ -d "$SOURCE_DIR/.git" ]] || [[ -f "$SOURCE_DIR/.git" ]]; then
    local tree_hash
    tree_hash=$(git -C "$SOURCE_DIR" log -1 --format='%H' -- "$LAUNCHER_SUBDIR" 2>/dev/null || echo "")
    if [[ -n "$tree_hash" ]]; then
      echo "$tree_hash"
      return
    fi
  fi

  # 方法 2: git が使えない場合はマニフェストの内容ハッシュ + ファイル数で代替
  local manifest_hash file_count
  if command -v sha256sum &>/dev/null; then
    manifest_hash=$(sha256sum "$LAUNCHER_SOURCE/$MANIFEST_FILE" | cut -d' ' -f1)
  elif command -v shasum &>/dev/null; then
    manifest_hash=$(shasum -a 256 "$LAUNCHER_SOURCE/$MANIFEST_FILE" | cut -d' ' -f1)
  else
    manifest_hash=$(stat -c '%Y%s' "$LAUNCHER_SOURCE/$MANIFEST_FILE" 2>/dev/null || \
                    stat -f '%m%z' "$LAUNCHER_SOURCE/$MANIFEST_FILE" 2>/dev/null || echo "unknown")
  fi
  file_count=$(find "$LAUNCHER_SOURCE" -name "ic_launcher.png" | wc -l | tr -d ' ')
  echo "${manifest_hash}_${file_count}"
}

get_last_sync_hash() {
  local hash_file="$TARGET_DIR/$SYNC_HASH_FILE"
  if [[ -f "$hash_file" ]]; then
    cat "$hash_file"
  else
    echo ""
  fi
}

save_sync_hash() {
  local hash="$1"
  echo "$hash" > "$TARGET_DIR/$SYNC_HASH_FILE"
}

if [[ "$FORCE" == false ]] && [[ "$DRY_RUN" == false ]] && [[ "$CLEAN" == false ]]; then
  current_hash=$(compute_source_hash)
  last_hash=$(get_last_sync_hash)

  if [[ -n "$last_hash" ]] && [[ "$current_hash" == "$last_hash" ]]; then
    echo "[SKIP] No changes since last sync (hash: ${current_hash:0:12}...)"
    echo "Use --force to sync anyway."
    exit 0
  fi
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
  [[ -d "$product_dir" ]] || continue

  product_code="$(basename "$product_dir")"

  # mipmap ディレクトリがあるか確認
  has_mipmap=false
  for density_dir in "$product_dir"mipmap-*/; do
    [[ -d "$density_dir" ]] && has_mipmap=true && break
  done
  [[ "$has_mipmap" == false ]] && continue

  copied_dirs=$((copied_dirs + 1))

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
# ハッシュ保存（次回のスキップ判定用）
# =============================================================================
if [[ "$DRY_RUN" == false ]]; then
  current_hash=$(compute_source_hash)
  save_sync_hash "$current_hash"
fi

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

  actual_dirs=$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

  if [[ "$actual_dirs" -eq "$expected" ]]; then
    echo "[PASS] Product directories: $actual_dirs (expected: $expected)"
  else
    echo "[FAIL] Product directories: $actual_dirs (expected: $expected)"
    exit 1
  fi

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
