#!/bin/bash
# =============================================================
# HARMONIC insight - メニューアイコン標準チェック（PreToolUse フック用）
# =============================================================
#
# Write ツール使用前に実行され、非標準アイコンライブラリの
# 使用を検出した場合に警告を出力する。
# このスクリプトは非ブロッキング（exit 0）で動作する。
#
# 検出対象:
#   - Material Design Icons
#   - Font Awesome
#   - Heroicons
#   - Phosphor Icons
#   - Segoe MDL2 Assets (WPF)
#
# 標準: Lucide Icons (brand/menu-icons.json)
#

# ツール入力の JSON から書き込み内容を取得
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# 対象ファイルの拡張子を判定（関係ないファイルはスキップ）
FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' 2>/dev/null | sed 's/.*"\([^"]*\)"$/\1/' || true)
if [ -n "$FILE_PATH" ]; then
  case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.cs|*.xaml|*.py|*.css|*.json)
      # チェック対象
      ;;
    *.md|*.txt|*.yml|*.yaml|*.sh|*.toml|*.lock|*.svg|*.png|*.ico)
      # 非対象 — スキップ
      exit 0
      ;;
  esac
fi

# 非標準アイコンライブラリの検出
FORBIDDEN_PATTERNS=(
  "material-design-icons"
  "@mdi/"
  "MaterialDesignIcons"
  "font-awesome"
  "fontawesome"
  "FontAwesome"
  "@heroicons"
  "phosphor-react"
  "@phosphor-icons"
  "Segoe MDL2"
  "SegoeFluentIcons"
)

FOUND_LIBRARY=""

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if echo "$TOOL_INPUT" | grep -qi "$pattern" 2>/dev/null; then
    FOUND_LIBRARY="$pattern"
    break
  fi
done

if [ -n "$FOUND_LIBRARY" ]; then
  echo ""
  echo "WARNING: 非標準アイコンライブラリの使用が検出されました: ${FOUND_LIBRARY}"
  echo ""
  echo "HARMONIC insight では Lucide Icons を標準として使用してください。"
  echo ""
  echo "  標準ライブラリ:  Lucide Icons (https://lucide.dev/icons)"
  echo "  アイコン定義:    brand/menu-icons.json"
  echo "  API:            config/menu-icons.ts"
  echo "  ガイド:         standards/MENU_ICONS.md"
  echo ""
  echo "  React:  import { Save, Undo2 } from 'lucide-react'"
  echo "  WPF:    <Path Data=\"{StaticResource Icon.Save}\" />"
  echo ""
fi

# 非ブロッキング - 常に成功で終了
exit 0
