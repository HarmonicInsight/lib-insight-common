#!/usr/bin/env bash
#
# update-launcher-icons.sh
# ========================
# マスター PNG からランチャー用 mipmap アイコンを再生成し、マニフェストを更新する。
# insight-common でアイコンを変更した後にこれを 1 回実行するだけで OK。
#
# 使い方:
#   # 全製品を再生成
#   ./scripts/update-launcher-icons.sh
#
#   # 特定製品だけ再生成
#   ./scripts/update-launcher-icons.sh --product IOSH
#
#   # 再生成 + git commit まで一括
#   ./scripts/update-launcher-icons.sh --commit
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATE_SCRIPT="$SCRIPT_DIR/generate-app-icon.py"
LAUNCHER_DIR="$ROOT_DIR/brand/icons/generated/launcher"

# =============================================================================
# ヘルプ
# =============================================================================
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

マスター PNG からランチャーアイコン (mipmap) を再生成し、マニフェストを更新します。

Options:
  --product CODE    特定の製品コードのみ再生成 (例: --product IOSH)
  --commit          再生成後に git add + commit する
  --push            再生成後に git add + commit + push する
  -h, --help        このヘルプを表示

Examples:
  # 全製品のランチャーアイコンを再生成
  ./scripts/update-launcher-icons.sh

  # IOSH のアイコンだけ再生成
  ./scripts/update-launcher-icons.sh --product IOSH

  # 再生成して commit + push まで一括
  ./scripts/update-launcher-icons.sh --push
EOF
  exit 0
}

# =============================================================================
# パラメータ
# =============================================================================
PRODUCT=""
DO_COMMIT=false
DO_PUSH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --product)
      PRODUCT="$2"
      shift 2
      ;;
    --commit)
      DO_COMMIT=true
      shift
      ;;
    --push)
      DO_COMMIT=true
      DO_PUSH=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Error: Unknown option: $1" >&2
      usage
      ;;
  esac
done

# =============================================================================
# 依存チェック
# =============================================================================
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required" >&2
  exit 1
fi

# Pillow チェック
if ! python3 -c "from PIL import Image" 2>/dev/null; then
  echo "Error: Pillow is required. Install with: pip install Pillow" >&2
  exit 1
fi

if [[ ! -f "$GENERATE_SCRIPT" ]]; then
  echo "Error: generate-app-icon.py not found at $GENERATE_SCRIPT" >&2
  exit 1
fi

# =============================================================================
# 再生成
# =============================================================================
echo "=== HARMONIC insight Launcher Icon Update ==="
echo ""

if [[ -n "$PRODUCT" ]]; then
  # 単一製品の再生成
  echo "Regenerating launcher icon for: $PRODUCT"
  echo ""

  # まず単一製品の mipmap を生成
  MASTER_PNG="$ROOT_DIR/brand/icons/png/$(python3 -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR')
# generate-app-icon.py の PRODUCT_ICONS / UTILITY_ICONS を参照
exec(open('$GENERATE_SCRIPT').read().split('def find_insight_common_root')[0])
icons = {**PRODUCT_ICONS, **UTILITY_ICONS}
if '$PRODUCT' in icons:
    print(icons['$PRODUCT']['icon'])
else:
    print('NOT_FOUND')
")"

  if [[ "$MASTER_PNG" == *"NOT_FOUND"* ]] || [[ ! -f "$MASTER_PNG" ]]; then
    echo "Error: Master icon not found for product $PRODUCT" >&2
    exit 1
  fi

  echo "Master: $MASTER_PNG"

  # mipmap 生成（Python で直接実行）
  python3 -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR')
from PIL import Image

LAUNCHER_GRID_SIZES = {
    'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192,
}

import os
master = Image.open('$MASTER_PNG').convert('RGBA')
product_dir = os.path.join('$LAUNCHER_DIR', '$PRODUCT')
for density, size in LAUNCHER_GRID_SIZES.items():
    density_dir = os.path.join(product_dir, f'mipmap-{density}')
    os.makedirs(density_dir, exist_ok=True)
    img = master.copy().resize((size, size), Image.LANCZOS)
    img.save(os.path.join(density_dir, 'ic_launcher.png'))
    print(f'  [OK] mipmap-{density}/ic_launcher.png ({size}x{size})')
"

  echo ""
  echo "Note: launcher-manifest.json is not changed (metadata only updates with --launcher full regen)"

else
  # 全製品の再生成（generate-app-icon.py --launcher を使用）
  echo "Regenerating ALL launcher icons from master PNGs..."
  echo ""
  python3 "$GENERATE_SCRIPT" --launcher
fi

# =============================================================================
# Git commit
# =============================================================================
if [[ "$DO_COMMIT" == true ]]; then
  echo ""
  echo "=== Git Commit ==="

  cd "$ROOT_DIR"
  git add brand/icons/generated/launcher/

  # 変更があるか確認
  if git diff --cached --quiet; then
    echo "No changes to commit (icons are already up to date)"
  else
    if [[ -n "$PRODUCT" ]]; then
      MSG="update: regenerate launcher icon for $PRODUCT"
    else
      MSG="update: regenerate all launcher icons from master PNGs"
    fi

    git commit -m "$MSG"
    echo "Committed: $MSG"

    if [[ "$DO_PUSH" == true ]]; then
      BRANCH=$(git rev-parse --abbrev-ref HEAD)
      echo "Pushing to origin/$BRANCH..."
      git push -u origin "$BRANCH"
      echo "Pushed."
    fi
  fi
fi

echo ""
echo "Done."
