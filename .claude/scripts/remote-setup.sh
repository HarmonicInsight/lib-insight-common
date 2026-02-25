#!/bin/bash
# =============================================================
# HARMONIC insight - Claude Code リモートセッション環境セットアップ
# =============================================================
#
# Claude Code の SessionStart フックで自動実行される。
# リモート環境（Codespaces / Claude Code Web）でのみ動作し、
# ローカル環境では何もしない。
#

# リモート環境でなければスキップ
if [ "${CLAUDE_CODE_REMOTE}" != "true" ] && [ -z "${CODESPACES}" ]; then
  exit 0
fi

echo "============================================"
echo "  HARMONIC insight - Remote Session Setup"
echo "============================================"

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# ---------------------------------------------
# 1. DNS 設定（コンテナ環境で必要な場合）
# ---------------------------------------------
if [ "${CLAUDE_CODE_REMOTE}" = "true" ]; then
  if ! host github.com >/dev/null 2>&1; then
    echo "[1/4] Configuring DNS..."
    echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf >/dev/null 2>&1 || true
  else
    echo "[1/4] DNS OK"
  fi
else
  echo "[1/4] DNS OK (Codespaces)"
fi

# ---------------------------------------------
# 2. Node.js 依存関係の確認
# ---------------------------------------------
echo "[2/4] Checking Node.js..."
if command -v node >/dev/null 2>&1; then
  echo "       Node.js $(node --version) found"
else
  echo "       WARNING: Node.js not found"
fi

# ---------------------------------------------
# 3. 標準検証スクリプトの実行権限
# ---------------------------------------------
echo "[3/4] Setting up scripts..."
if [ -f "${PROJECT_DIR}/scripts/validate-standards.sh" ]; then
  chmod +x "${PROJECT_DIR}/scripts/validate-standards.sh"
  echo "       validate-standards.sh ready"
fi
if [ -f "${PROJECT_DIR}/scripts/validate-menu-icons.sh" ]; then
  chmod +x "${PROJECT_DIR}/scripts/validate-menu-icons.sh"
  echo "       validate-menu-icons.sh ready"
fi
if [ -f "${PROJECT_DIR}/scripts/auto-fix.sh" ]; then
  chmod +x "${PROJECT_DIR}/scripts/auto-fix.sh"
  echo "       auto-fix.sh ready"
fi
# PreToolUse フックスクリプトの実行権限
for hook_script in "${PROJECT_DIR}/.claude/scripts/"*.sh; do
  [ -f "$hook_script" ] && chmod +x "$hook_script"
done

# ---------------------------------------------
# 4. 環境変数の永続化
# ---------------------------------------------
echo "[4/4] Exporting environment..."
if [ -n "${CLAUDE_ENV_FILE}" ]; then
  ENV_BEFORE=$(env | sort)

  export INSIGHT_COMMON_DIR="${PROJECT_DIR}"
  export INSIGHT_BRAND_PRIMARY="#B8942F"
  export INSIGHT_BRAND_BG="#FAF8F5"

  ENV_AFTER=$(env | sort)
  comm -13 <(echo "$ENV_BEFORE") <(echo "$ENV_AFTER") | while IFS='=' read -r key value; do
    printf '%s=%q\n' "$key" "$value"
  done >> "$CLAUDE_ENV_FILE"
  echo "       Environment exported"
else
  echo "       CLAUDE_ENV_FILE not set, skipping export"
fi

echo ""
echo "============================================"
echo "  Setup Complete"
echo "============================================"
