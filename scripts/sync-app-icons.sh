#!/usr/bin/env bash
#
# sync-app-icons.sh
# =================
# insight-common のアイコンをアプリプロジェクトに同期する汎用スクリプト。
# 全プラットフォーム（WPF, Android, Expo, Tauri, Web）対応。
# 変更がなければスキップ（ハッシュ比較）。
#
# =============================================================================
# 使い方
# =============================================================================
#
# ■ 個別アプリ切り替え（製品アイコンだけ同期）
#   ./insight-common/scripts/sync-app-icons.sh --product IOSH Resources/
#   ./insight-common/scripts/sync-app-icons.sh --product CAMERA assets/
#   ./insight-common/scripts/sync-app-icons.sh --product INCA src-tauri/icons/
#   ./insight-common/scripts/sync-app-icons.sh --product QR public/
#
# ■ ランチャーアプリ（全製品の Android mipmap アイコン）
#   ./insight-common/scripts/sync-app-icons.sh --launcher app/src/main/assets/launcher
#
# ■ サブモジュール自動更新付き（ビルド時推奨）
#   ./insight-common/scripts/sync-app-icons.sh --product IOSH --pull Resources/
#
# ■ 強制再同期
#   ./insight-common/scripts/sync-app-icons.sh --product IOSH --force Resources/
#
set -euo pipefail

# =============================================================================
# 定数
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="brand/icons/generated"
LAUNCHER_SUBDIR="$GENERATED_DIR/launcher"
MANIFEST_FILE="launcher-manifest.json"
SYNC_HASH_FILE=".icon-sync-hash"

# 製品コード → 生成ディレクトリ名
declare -A PRODUCT_DIR_MAP=(
  [INSS]="InsightOfficeSlide"
  [IOSH]="InsightOfficeSheet"
  [IOSD]="InsightOfficeDoc"
  [ISOF]="InsightSeniorOffice"
  [INPY]="InsightPy"
  [INMV]="InsightCast"
  [INIG]="InsightImageGen"
  [INCA]="InsightNoCodeAnalyzer"
  [INBT]="InsightBot"
  [IVIN]="InterviewInsight"
  [LAUNCHER]="InsightLauncher"
  [CAMERA]="InsightCamera"
  [VOICE_CLOCK]="InsightVoiceClock"
  [QR]="InsightQR"
  [PINBOARD]="InsightPinBoard"
  [VOICE_MEMO]="InsightVoiceMemo"
)

# =============================================================================
# ヘルプ
# =============================================================================
usage() {
  cat <<'EOF'
Usage: sync-app-icons.sh [OPTIONS] <target-dir>

insight-common のアイコンをアプリプロジェクトに同期します。
変更がなければスキップ（高速）。

Modes (いずれか必須):
  --product CODE    特定製品のアイコンを同期（例: IOSH, INSS, CAMERA）
  --launcher        全製品のランチャーグリッドアイコンを同期

Options:
  --source DIR      insight-common のルートディレクトリ
  --platform NAME   プラットフォーム指定（android, expo, tauri, wpf, web）
                    指定時、生成ディレクトリ内の該当サブディレクトリをソースとして使用
  --pull            同期前に insight-common を git pull で最新化
  --force           変更チェックをスキップして強制同期
  --clean           コピー前にターゲットをクリーンアップ
  --dry-run         コピーせず差分のみ表示
  --verify          コピー後にファイル数を検証
  -h, --help        このヘルプを表示

Product Codes:
  WPF:   INSS, IOSH, IOSD, ISOF, INPY, INBT, LAUNCHER
  Tauri: INCA, IVIN
  Expo:  CAMERA, VOICE_CLOCK, PINBOARD, VOICE_MEMO
  Web:   QR
  Python: INMV, INIG

Examples:
  # WPF アプリ（InsightOfficeSheet）
  ./insight-common/scripts/sync-app-icons.sh --product IOSH --pull Resources/

  # Expo アプリ（InsightCamera）
  ./insight-common/scripts/sync-app-icons.sh --product CAMERA --pull assets/

  # Android ネイティブアプリ（mipmap のみ res/ に同期）
  ./insight-common/scripts/sync-app-icons.sh --product VOICE_CLOCK --platform android \
    app/src/main/res/

  # ランチャーアプリ（全製品）
  ./insight-common/scripts/sync-app-icons.sh --launcher --pull --verify \
    app/src/main/assets/launcher

  # CI/CD（変更時のみ同期、検証付き）
  ./insight-common/scripts/sync-app-icons.sh --product IOSH --pull --verify Resources/
EOF
  exit 0
}

# =============================================================================
# パラメータ解析
# =============================================================================
SOURCE_DIR="$DEFAULT_SOURCE"
TARGET_DIR=""
MODE=""           # "product" or "launcher"
PRODUCT_CODE=""
PLATFORM=""       # "android", "expo", "tauri", "wpf", "web" or ""
PULL=false
FORCE=false
DRY_RUN=false
CLEAN=false
VERIFY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --product)    MODE="product"; PRODUCT_CODE="${2^^}"; shift 2 ;;
    --launcher)   MODE="launcher"; shift ;;
    --source)     SOURCE_DIR="$2"; shift 2 ;;
    --platform)   PLATFORM="${2,,}"; shift 2 ;;
    --pull)       PULL=true; shift ;;
    --force)      FORCE=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --clean)      CLEAN=true; shift ;;
    --verify)     VERIFY=true; shift ;;
    -h|--help)    usage ;;
    -*)           echo "Error: Unknown option: $1" >&2; usage ;;
    *)            TARGET_DIR="$1"; shift ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "Error: --product CODE or --launcher is required." >&2
  exit 1
fi

if [[ -z "$TARGET_DIR" ]]; then
  echo "Error: <target-dir> is required." >&2
  exit 1
fi

# =============================================================================
# サブモジュール pull
# =============================================================================
if [[ "$PULL" == true ]]; then
  if [[ -d "$SOURCE_DIR/.git" ]] || [[ -f "$SOURCE_DIR/.git" ]]; then
    echo "Pulling latest insight-common..."
    git -C "$SOURCE_DIR" pull --ff-only origin main 2>/dev/null || \
    git -C "$SOURCE_DIR" pull --ff-only 2>/dev/null || \
    echo "[WARN] git pull failed, using current version"
    echo ""
  fi
fi

# =============================================================================
# ハッシュ比較関数（共通）
# =============================================================================
compute_hash() {
  local dir="$1"
  if [[ -d "$SOURCE_DIR/.git" ]] || [[ -f "$SOURCE_DIR/.git" ]]; then
    local relative_dir="${dir#$SOURCE_DIR/}"
    local hash
    hash=$(git -C "$SOURCE_DIR" log -1 --format='%H' -- "$relative_dir" 2>/dev/null || echo "")
    if [[ -n "$hash" ]]; then
      echo "$hash"
      return
    fi
  fi
  # フォールバック: ファイル数 + 最新更新時刻
  local file_count newest
  file_count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
  newest=$(find "$dir" -type f -printf '%T@\n' 2>/dev/null | sort -rn | head -1 || echo "0")
  echo "${file_count}_${newest}"
}

get_last_hash() {
  local hash_file="$TARGET_DIR/$SYNC_HASH_FILE"
  [[ -f "$hash_file" ]] && cat "$hash_file" || echo ""
}

save_hash() {
  echo "$1" > "$TARGET_DIR/$SYNC_HASH_FILE"
}

check_skip() {
  local source_dir="$1"
  if [[ "$FORCE" == false ]] && [[ "$DRY_RUN" == false ]] && [[ "$CLEAN" == false ]]; then
    local current last
    current=$(compute_hash "$source_dir")
    last=$(get_last_hash)
    if [[ -n "$last" ]] && [[ "$current" == "$last" ]]; then
      echo "[SKIP] No changes since last sync (hash: ${current:0:12}...)"
      exit 0
    fi
  fi
}

# =============================================================================
# 個別製品アイコン同期
# =============================================================================
sync_product() {
  local code="$PRODUCT_CODE"
  local dir_name="${PRODUCT_DIR_MAP[$code]:-}"

  if [[ -z "$dir_name" ]]; then
    echo "Error: Unknown product code: $code" >&2
    echo "Available: ${!PRODUCT_DIR_MAP[*]}" >&2
    exit 1
  fi

  local source_dir="$SOURCE_DIR/$GENERATED_DIR/$dir_name"

  if [[ ! -d "$source_dir" ]]; then
    echo "Error: Generated icons not found: $source_dir" >&2
    echo "Run 'python scripts/generate-app-icon.py --product $code' first." >&2
    exit 1
  fi

  # --platform 指定時、該当サブディレクトリをソースとして使用
  if [[ -n "$PLATFORM" ]]; then
    local platform_dir="$source_dir/$PLATFORM"
    if [[ ! -d "$platform_dir" ]]; then
      echo "Error: Platform directory not found: $platform_dir" >&2
      echo "Available: $(ls -d "$source_dir"/*/ 2>/dev/null | xargs -I{} basename {} | tr '\n' ' ')" >&2
      exit 1
    fi
    source_dir="$platform_dir"
  fi

  # 変更チェック
  check_skip "$source_dir"

  echo "=== Sync: $code ($dir_name) ==="
  echo "Source:  $source_dir"
  echo "Target:  $TARGET_DIR"
  echo ""

  # クリーンアップ
  if [[ "$CLEAN" == true ]] && [[ -d "$TARGET_DIR" ]]; then
    if [[ "$DRY_RUN" == true ]]; then
      echo "[DRY-RUN] Would clean: $TARGET_DIR"
    else
      rm -rf "$TARGET_DIR"
    fi
  fi

  [[ "$DRY_RUN" == false ]] && mkdir -p "$TARGET_DIR"

  # 全ファイルをコピー
  local copied=0
  while IFS= read -r -d '' file; do
    local relative="${file#$source_dir/}"
    local target_file="$TARGET_DIR/$relative"
    local target_parent
    target_parent="$(dirname "$target_file")"

    if [[ "$DRY_RUN" == true ]]; then
      echo "[DRY-RUN] Copy: $relative"
    else
      mkdir -p "$target_parent"
      cp "$file" "$target_file"
    fi
    copied=$((copied + 1))
  done < <(find "$source_dir" -type f -print0)

  if [[ "$DRY_RUN" == false ]]; then
    echo "[OK] $copied files synced"
    save_hash "$(compute_hash "$source_dir")"
  fi

  # 検証
  if [[ "$VERIFY" == true ]] && [[ "$DRY_RUN" == false ]]; then
    echo ""
    echo "--- Verification ---"
    local source_count target_count
    source_count=$(find "$source_dir" -type f | wc -l | tr -d ' ')
    target_count=$(find "$TARGET_DIR" -type f ! -name "$SYNC_HASH_FILE" | wc -l | tr -d ' ')
    if [[ "$target_count" -ge "$source_count" ]]; then
      echo "[PASS] Files: $target_count (source: $source_count)"
    else
      echo "[FAIL] Files: $target_count (expected: $source_count)"
      exit 1
    fi
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "(Dry run — no files were copied)" #  Eno files were copied)"
  fi

  echo ""
  echo "Done."
}

# =============================================================================
# ランチャー全製品同期
# =============================================================================
sync_launcher() {
  local launcher_source="$SOURCE_DIR/$LAUNCHER_SUBDIR"

  if [[ ! -d "$launcher_source" ]]; then
    echo "Error: Launcher icons not found: $launcher_source" >&2
    echo "Run 'python scripts/generate-app-icon.py --launcher' first." >&2
    exit 1
  fi

  if [[ ! -f "$launcher_source/$MANIFEST_FILE" ]]; then
    echo "Error: Manifest not found: $launcher_source/$MANIFEST_FILE" >&2
    exit 1
  fi

  # 変更チェック
  check_skip "$launcher_source"

  echo "=== Sync: Launcher (all products) ==="
  echo "Source:  $launcher_source"
  echo "Target:  $TARGET_DIR"
  echo ""

  # クリーンアップ
  if [[ "$CLEAN" == true ]] && [[ -d "$TARGET_DIR" ]]; then
    if [[ "$DRY_RUN" == true ]]; then
      echo "[DRY-RUN] Would clean: $TARGET_DIR"
    else
      rm -rf "$TARGET_DIR"
    fi
  fi

  [[ "$DRY_RUN" == false ]] && mkdir -p "$TARGET_DIR"

  local copied_files=0
  local copied_dirs=0

  # マニフェスト
  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] Copy: $MANIFEST_FILE"
  else
    cp "$launcher_source/$MANIFEST_FILE" "$TARGET_DIR/$MANIFEST_FILE"
    echo "[OK] $MANIFEST_FILE"
  fi
  copied_files=$((copied_files + 1))

  # 製品ディレクトリ
  for product_dir in "$launcher_source"/*/; do
    [[ -d "$product_dir" ]] || continue
    local product_code
    product_code="$(basename "$product_dir")"

    # mipmap があるか確認
    local has_mipmap=false
    for d in "$product_dir"mipmap-*/; do
      [[ -d "$d" ]] && has_mipmap=true && break
    done
    [[ "$has_mipmap" == false ]] && continue

    copied_dirs=$((copied_dirs + 1))

    for density_dir in "$product_dir"mipmap-*/; do
      [[ -d "$density_dir" ]] || continue
      local density_name
      density_name="$(basename "$density_dir")"
      local target_density_dir="$TARGET_DIR/$product_code/$density_name"
      local icon_file="$density_dir/ic_launcher.png"

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

    [[ "$DRY_RUN" == false ]] && echo "[OK] $product_code (5 densities)"
  done

  # ハッシュ保存
  if [[ "$DRY_RUN" == false ]]; then
    save_hash "$(compute_hash "$launcher_source")"
  fi

  echo ""
  echo "--- Summary ---"
  echo "Products synced: $copied_dirs"
  echo "Files copied:    $copied_files"

  # 検証
  if [[ "$VERIFY" == true ]] && [[ "$DRY_RUN" == false ]]; then
    echo ""
    echo "--- Verification ---"

    local expected
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
      expected="$copied_dirs"
    fi

    local actual_dirs
    actual_dirs=$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

    if [[ "$actual_dirs" -eq "$expected" ]]; then
      echo "[PASS] Product directories: $actual_dirs (expected: $expected)"
    else
      echo "[FAIL] Product directories: $actual_dirs (expected: $expected)"
      exit 1
    fi

    local verify_ok=true
    for pd in "$TARGET_DIR"/*/; do
      [[ -d "$pd" ]] || continue
      local pc
      pc="$(basename "$pd")"
      local ic
      ic=$(find "$pd" -name "ic_launcher.png" | wc -l | tr -d ' ')
      if [[ "$ic" -ne 5 ]]; then
        echo "[FAIL] $pc: $ic densities (expected: 5)"
        verify_ok=false
      fi
    done
    [[ "$verify_ok" == true ]] && echo "[PASS] All products have 5 density variants"
    [[ "$verify_ok" == false ]] && exit 1
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "(Dry run — no files were copied)" #  Eno files were copied)"
  fi

  echo ""
  echo "Done."
}

# =============================================================================
# メインディスパッチ
# =============================================================================
case "$MODE" in
  product)  sync_product ;;
  launcher) sync_launcher ;;
esac
