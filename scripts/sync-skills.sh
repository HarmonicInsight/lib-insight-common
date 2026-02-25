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

# PreToolUse フックスクリプトの同期
SUBMODULE_SCRIPTS="$COMMON_DIR/.claude/scripts"
if [ -d "$SUBMODULE_SCRIPTS" ]; then
  TARGET_SCRIPTS="$PROJECT_DIR/.claude/scripts"
  mkdir -p "$TARGET_SCRIPTS"

  HOOKS_SYNCED=0
  for src_file in "$SUBMODULE_SCRIPTS"/*.sh; do
    [ -f "$src_file" ] || continue
    filename="$(basename "$src_file")"
    target_file="$TARGET_SCRIPTS/$filename"

    if [ -f "$target_file" ] && cmp -s "$src_file" "$target_file"; then
      continue
    fi

    cp "$src_file" "$target_file"
    chmod +x "$target_file"
    HOOKS_SYNCED=$((HOOKS_SYNCED + 1))
  done

  if [ "$HOOKS_SYNCED" -gt 0 ]; then
    echo "[sync-skills] $HOOKS_SYNCED hook script(s) synced from insight-common"
  fi
fi

# .claude/settings.json の同期（プロジェクト側に存在しない場合のみ）
SUBMODULE_SETTINGS="$COMMON_DIR/.claude/settings.json"
if [ -f "$SUBMODULE_SETTINGS" ]; then
  TARGET_SETTINGS="$PROJECT_DIR/.claude/settings.json"
  if [ ! -f "$TARGET_SETTINGS" ]; then
    # insight-common の settings.json をベースに、パスを調整してコピー
    sed 's|\${CLAUDE_PROJECT_DIR}/\.claude/scripts/|\${CLAUDE_PROJECT_DIR}/insight-common/.claude/scripts/|g' \
      "$SUBMODULE_SETTINGS" > "$TARGET_SETTINGS"
    echo "[sync-skills] settings.json created from insight-common template"
  fi
fi
