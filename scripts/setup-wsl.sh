#!/bin/bash
# ============================================
# Harmonic Insight - WSL 2 セットアップスクリプト
# ============================================
set -e

echo "============================================"
echo "  Harmonic Insight - WSL 2 Setup"
echo "============================================"
echo ""

# ---------------------------------------------
# 0. システム更新
# ---------------------------------------------
echo "[0/9] Updating system..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
echo "      Done"

# ---------------------------------------------
# 1. 必要なパッケージ
# ---------------------------------------------
echo "[1/9] Installing base packages..."
sudo apt-get install -y -qq build-essential curl git ripgrep jq unzip
echo "      Done"

# ---------------------------------------------
# 2. Node.js (nvm経由)
# ---------------------------------------------
echo "[2/9] Installing Node.js 24.x LTS via nvm..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
nvm alias default 24
echo "      Done"

# ---------------------------------------------
# 3. Python (pyenv経由)
# ---------------------------------------------
echo "[3/9] Installing Python 3.13 via pyenv..."
if [ ! -d "$HOME/.pyenv" ]; then
    curl https://pyenv.run | bash
    echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
    echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
    echo 'eval "$(pyenv init -)"' >> ~/.bashrc
fi
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Python ビルドに必要な依存関係
sudo apt-get install -y -qq libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libffi-dev liblzma-dev

pyenv install -s 3.13.1
pyenv global 3.13.1
echo "      Done"

# ---------------------------------------------
# 4. GitHub CLI
# ---------------------------------------------
echo "[4/9] Installing GitHub CLI..."
if ! command -v gh &> /dev/null; then
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt-get update -qq && sudo apt-get install -y -qq gh
fi
echo "      Done"

# ---------------------------------------------
# 5. Azure CLI
# ---------------------------------------------
echo "[5/9] Installing Azure CLI..."
if ! command -v az &> /dev/null; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi
echo "      Done"

# ---------------------------------------------
# 6. Supabase CLI (ネイティブ)
# ---------------------------------------------
echo "[6/9] Installing Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    curl -fsSL https://deb.supabase.com/signing-key.asc | sudo gpg --dearmor -o /usr/share/keyrings/supabase-archive-keyring.gpg 2>/dev/null || true
    echo "deb [signed-by=/usr/share/keyrings/supabase-archive-keyring.gpg] https://deb.supabase.com stable main" | sudo tee /etc/apt/sources.list.d/supabase.list > /dev/null
    sudo apt-get update -qq && sudo apt-get install -y -qq supabase || npm install -g supabase
fi
echo "      Done"

# ---------------------------------------------
# 7. ngrok
# ---------------------------------------------
echo "[7/9] Installing ngrok..."
if ! command -v ngrok &> /dev/null; then
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list >/dev/null
    sudo apt-get update -qq && sudo apt-get install -y -qq ngrok
fi
echo "      Done"

# ---------------------------------------------
# 8. npm グローバルツール
# ---------------------------------------------
echo "[8/9] Installing npm global tools..."

# nvm を再読み込み
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

npm install -g @anthropic-ai/claude-code
npm install -g vercel @railway/cli eas-cli
npm install -g @microsoft/teamsapp-cli
npm install -g typescript ts-node nodemon
echo "      Done"

# ---------------------------------------------
# 9. Slack CLI
# ---------------------------------------------
echo "[9/9] Installing Slack CLI..."
curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash 2>/dev/null || echo "      Slack CLI: manual install may be required"
echo "      Done"

# ---------------------------------------------
# 確認
# ---------------------------------------------
echo ""
echo "============================================"
echo "  Installation Complete"
echo "============================================"
echo ""
echo "Installed versions:"
echo "-------------------------------------------"
echo "  node:     $(node --version 2>/dev/null || echo 'not found')"
echo "  npm:      $(npm --version 2>/dev/null || echo 'not found')"
echo "  python:   $(python --version 2>/dev/null || echo 'not found')"
echo "  git:      $(git --version 2>/dev/null || echo 'not found')"
echo "  gh:       $(gh --version 2>/dev/null | head -n 1 || echo 'not found')"
echo "  az:       $(az --version 2>/dev/null | head -n 1 || echo 'not found')"
echo "  ngrok:    $(ngrok --version 2>/dev/null || echo 'not found')"
echo "  claude:   $(claude --version 2>/dev/null || echo 'requires login')"
echo "  vercel:   $(vercel --version 2>/dev/null || echo 'not found')"
echo "  railway:  $(railway --version 2>/dev/null || echo 'not found')"
echo "  eas:      $(eas --version 2>/dev/null || echo 'not found')"
echo "  supabase: $(supabase --version 2>/dev/null || echo 'not found')"
echo "  teamsapp: $(teamsapp --version 2>/dev/null || echo 'not found')"
echo "-------------------------------------------"
echo ""
echo "Next steps - Login to services:"
echo ""
echo "  # Required"
echo "  claude login"
echo ""
echo "  # Build Platforms"
echo "  gh auth login       # GitHub"
echo "  vercel login        # Vercel"
echo "  railway login       # Railway"
echo "  eas login           # EAS (Expo)"
echo "  supabase login      # Supabase"
echo ""
echo "  # Messaging Platforms"
echo "  az login            # Azure (for Teams Bot)"
echo "  slack login         # Slack CLI"
echo "  ngrok authtoken <TOKEN>  # ngrok"
echo ""
echo "  # Messaging SDKs (per project)"
echo "  npm install @line/bot-sdk                    # LINE"
echo "  npm install @slack/bolt @slack/web-api       # Slack"
echo "  npm install botbuilder @microsoft/teams-js   # Teams"
echo ""
echo "============================================"
echo ""
echo "Run 'source ~/.bashrc' or restart terminal to use all tools."
