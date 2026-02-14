#!/bin/bash
# =============================================================
# insight-common スキル自動同期スクリプト
#
# insight-common サブモジュールの .claude/commands/ を
# 親プロジェクトの .claude/commands/ に自動コピーする。
#
# 用途:
#   - SessionStart フックで実行し、全ブランチで最新スキルを利用可能にする
#   - 手動実行でスキルを同期する
#
# 使い方:
#   bash insight-common/scripts/sync-skills.sh
#   # または SessionStart フックとして .claude/settings.json に登録:
#   # "command": "bash ${CLAUDE_PROJECT_DIR}/insight-common/scripts/sync-skills.sh"
# =============================================================

set -e

# スクリプト自身の位置から insight-common のルートを特定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(dirname "$SCRIPT_DIR")"

# プロジェクトルートを特定（insight-common の親ディレクトリ）
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(dirname "$COMMON_DIR")}"

# insight-common 本体で実行された場合はスキップ
if [ "$PROJECT_DIR" = "$COMMON_DIR" ]; then
  exit 0
fi

# insight-common がサブモジュールとして存在するか確認
SUBMODULE_COMMANDS="$COMMON_DIR/.claude/commands"
if [ ! -d "$SUBMODULE_COMMANDS" ]; then
  exit 0
fi

# プロジェクトルートの .claude/commands/ にコピー
TARGET_DIR="$PROJECT_DIR/.claude/commands"
mkdir -p "$TARGET_DIR"

SYNCED=0
for src_file in "$SUBMODULE_COMMANDS"/*.md; do
  [ -f "$src_file" ] || continue
  filename="$(basename "$src_file")"
  target_file="$TARGET_DIR/$filename"

  # 内容が異なる場合のみコピー（不要な変更を避ける）
  if [ -f "$target_file" ] && cmp -s "$src_file" "$target_file"; then
    continue
  fi

  cp "$src_file" "$target_file"
  SYNCED=$((SYNCED + 1))
done

if [ "$SYNCED" -gt 0 ]; then
  echo "[sync-skills] $SYNCED skill(s) synced from insight-common"
fi
