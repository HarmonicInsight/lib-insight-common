#!/bin/bash
# =============================================
# Codespaces セットアップスクリプト
#
# アプリリポジトリから実行して .devcontainer/ を配置する
#
# 使い方（アプリリポジトリのルートで実行）:
#   ./insight-common/scripts/setup-codespaces.sh
#
# 機能:
#   - .devcontainer/devcontainer.json を生成
#   - .devcontainer/setup.sh を生成
#   - アプリ構成を自動検出（Prisma, Docker 等）
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# スクリプトの場所からinsight-commonのルートを特定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_ROOT="$(dirname "$SCRIPT_DIR")"

# アプリリポジトリのルートを特定（insight-commonの親ディレクトリ）
APP_ROOT="$(dirname "$COMMON_ROOT")"

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Codespaces Setup for App Repository${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "App root: ${YELLOW}${APP_ROOT}${NC}"
echo ""

# .devcontainer ディレクトリ作成
mkdir -p "${APP_ROOT}/.devcontainer"

# --- アプリ構成の自動検出 ---
HAS_PRISMA=false
HAS_DOCKER=false
HAS_NEXTJS=false
EXTRA_PORTS=""
EXTRA_EXTENSIONS=""
EXTRA_FEATURES=""

if [ -d "${APP_ROOT}/prisma" ]; then
  HAS_PRISMA=true
  echo -e "${GREEN}  Prisma${NC}"
fi

if [ -f "${APP_ROOT}/Dockerfile" ] || [ -f "${APP_ROOT}/docker-compose.yml" ]; then
  HAS_DOCKER=true
  echo -e "${GREEN}  Docker${NC}"
fi

if [ -f "${APP_ROOT}/next.config.ts" ] || [ -f "${APP_ROOT}/next.config.js" ] || [ -f "${APP_ROOT}/next.config.mjs" ]; then
  HAS_NEXTJS=true
  echo -e "${GREEN}  Next.js${NC}"
fi

echo ""

# --- devcontainer.json 生成 ---
echo -e "${YELLOW}devcontainer.json を生成中...${NC}"

# ポート設定
PORTS="3000"
PORT_ATTRS='"3000": { "label": "Next.js", "onAutoForward": "openPreview" }'

if [ "$HAS_PRISMA" = true ] || [ "$HAS_DOCKER" = true ]; then
  PORTS="${PORTS}, 5432"
  PORT_ATTRS="${PORT_ATTRS},
    \"5432\": { \"label\": \"PostgreSQL\" }"
fi

# VS Code拡張
EXTENSIONS='
        "github.copilot",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss"'

if [ "$HAS_PRISMA" = true ]; then
  EXTENSIONS="${EXTENSIONS},
        \"prisma.prisma\""
fi

# Features
FEATURES='{
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/node:1": {
      "version": "24"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.13"
    }'

if [ "$HAS_DOCKER" = true ]; then
  FEATURES="${FEATURES},
    \"ghcr.io/devcontainers/features/docker-in-docker:2\": {}"
fi

FEATURES="${FEATURES}
  }"

cat > "${APP_ROOT}/.devcontainer/devcontainer.json" << DEVJSON
{
  "name": "HARMONIC insight - Web App Build Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:2",

  "features": ${FEATURES},

  "postCreateCommand": "bash .devcontainer/setup.sh",

  "customizations": {
    "vscode": {
      "extensions": [${EXTENSIONS}
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash",
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },

  "forwardPorts": [${PORTS}],

  "portsAttributes": {
    ${PORT_ATTRS}
  },

  "remoteEnv": {
    "ANTHROPIC_API_KEY": "\${localEnv:ANTHROPIC_API_KEY}",
    "VERCEL_TOKEN": "\${localEnv:VERCEL_TOKEN}"
  }
}
DEVJSON

echo -e "  ${GREEN}Done${NC}"

# --- setup.sh 生成 ---
echo -e "${YELLOW}setup.sh を生成中...${NC}"

cat > "${APP_ROOT}/.devcontainer/setup.sh" << 'SETUPSH'
#!/bin/bash
set -e

echo "============================================"
echo "  HARMONIC insight - Web App Environment"
echo "============================================"
echo ""
echo "Node.js: $(node --version)"
echo "Python:  $(python --version)"
echo "npm:     $(npm --version)"
echo ""

# ---------------------------------------------
# 1. Claude Code CLI
# ---------------------------------------------
echo "[ 1/5 ] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
echo "        Done"

# ---------------------------------------------
# 2. Platform CLIs (Vercel, Supabase)
# ---------------------------------------------
echo "[ 2/5 ] Installing Platform CLIs..."
npm install -g vercel supabase
echo "        Done"

# ---------------------------------------------
# 3. 開発ツール
# ---------------------------------------------
echo "[ 3/5 ] Installing dev tools..."
npm install -g typescript ts-node
echo "        Done"

# ---------------------------------------------
# 4. npm install（プロジェクト依存関係）
# ---------------------------------------------
echo "[ 4/5 ] Installing project dependencies..."
if [ -f "package-lock.json" ]; then
  npm install
elif [ -f "pnpm-lock.yaml" ]; then
  npm install -g pnpm
  pnpm install
elif [ -f "yarn.lock" ]; then
  npm install -g yarn
  yarn install
else
  npm install
fi
echo "        Done"

# ---------------------------------------------
# 5. Prisma / DB セットアップ（検出された場合）
# ---------------------------------------------
if [ -d "prisma" ]; then
  echo "[ 5/5 ] Setting up Prisma..."
  npx prisma generate
  echo "        Done"
else
  echo "[ 5/5 ] No Prisma detected, skipping..."
fi

# ---------------------------------------------
# サブモジュール初期化
# ---------------------------------------------
if [ -f ".gitmodules" ]; then
  echo ""
  echo "Initializing git submodules..."
  git submodule update --init --recursive
  echo "        Done"
fi

# ---------------------------------------------
# 確認
# ---------------------------------------------
echo ""
echo "============================================"
echo "  Installation Complete"
echo "============================================"
echo ""
echo "Installed CLIs:"
echo "-------------------------------------------"
echo "  node:     $(node --version)"
echo "  python:   $(python --version 2>&1)"
echo "  gh:       $(gh --version 2>/dev/null | head -n 1)"
echo "  claude:   $(claude --version 2>/dev/null || echo 'requires login')"
echo "  vercel:   $(vercel --version 2>/dev/null || echo 'not installed')"
echo "  supabase: $(supabase --version 2>/dev/null || echo 'not installed')"
echo "-------------------------------------------"
echo ""
echo "Next steps:"
echo ""
echo "  claude login        # Claude Code"
echo "  gh auth status      # GitHub (usually auto)"
echo "  vercel login        # Vercel"
echo "  supabase login      # Supabase"
echo ""
echo "  npm run dev         # Start dev server"
echo ""
echo "============================================"
SETUPSH

chmod +x "${APP_ROOT}/.devcontainer/setup.sh"

echo -e "  ${GREEN}Done${NC}"

# --- 完了 ---
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Codespaces セットアップ完了${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "生成されたファイル:"
echo -e "  ${BLUE}.devcontainer/devcontainer.json${NC}"
echo -e "  ${BLUE}.devcontainer/setup.sh${NC}"
echo ""
echo -e "次のステップ:"
echo ""
echo -e "  1. ${YELLOW}git add .devcontainer/${NC}"
echo -e "  2. ${YELLOW}git commit -m \"feat: Add Codespaces auto-build configuration\"${NC}"
echo -e "  3. ${YELLOW}git push${NC}"
echo ""
echo -e "Codespace を新規作成すると、自動的に CLI がインストールされます。"
echo ""
