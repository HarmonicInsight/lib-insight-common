#!/bin/bash
# =============================================================
# HARMONIC insight - ブランドカラーチェック（PreToolUse フック用）
# =============================================================
#
# Write ツール使用前に実行され、禁止カラー（Blue #2563EB）の
# 使用を検出した場合に警告を出力する。
# このスクリプトは非ブロッキング（exit 0）で動作する。
#

# ツール入力の JSON から書き込み内容を取得
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# 禁止カラーの検出
FORBIDDEN_COLORS=(
  "#2563EB"
  "#2563eb"
  "blue-600"
  "Blue"
)

FOUND_ISSUES=0

for color in "${FORBIDDEN_COLORS[@]}"; do
  if echo "$TOOL_INPUT" | grep -qi "$color" 2>/dev/null; then
    FOUND_ISSUES=1
    break
  fi
done

if [ "$FOUND_ISSUES" -eq 1 ]; then
  echo ""
  echo "WARNING: Blue (#2563EB) の使用が検出されました。"
  echo "HARMONIC insight では Gold (#B8942F) をプライマリカラーとして使用してください。"
  echo ""
  echo "  Primary (Gold):      #B8942F"
  echo "  Background (Ivory):  #FAF8F5"
  echo "  Text Primary:        #1C1917"
  echo "  Text Secondary:      #57534E"
  echo "  Border:              #E7E2DA"
  echo ""
fi

# 非ブロッキング - 常に成功で終了
exit 0
