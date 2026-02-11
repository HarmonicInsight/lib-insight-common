#!/bin/bash
set -e

echo "============================================"
echo "  HARMONIC insight - Auto-Fix Environment"
echo "============================================"
echo ""
echo "Node.js: $(node --version)"
echo "Python:  $(python --version)"
echo "npm:     $(npm --version)"
echo ""

# ---------------------------------------------
# 1. Claude Code CLI
# ---------------------------------------------
echo "[ 1/8 ] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
echo "        Done"

# ---------------------------------------------
# 2. Platform CLIs (Vercel, Railway, EAS, Supabase)
# ---------------------------------------------
echo "[ 2/8 ] Installing Platform CLIs..."
npm install -g vercel @railway/cli eas-cli supabase
echo "        Done"

# ---------------------------------------------
# 3. Teams CLI
# ---------------------------------------------
echo "[ 3/8 ] Installing Microsoft Teams CLI..."
npm install -g @microsoft/teamsapp-cli
echo "        Done"

# ---------------------------------------------
# 4. Slack CLI (Workflow Builder)
# ---------------------------------------------
echo "[ 4/8 ] Installing Slack CLI..."
# Slack CLI はnpmではなく公式インストーラーを使用
curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash 2>/dev/null || echo "        Slack CLI: manual install required"
echo "        Done"

# ---------------------------------------------
# 5. Azure CLI (Teams Bot登録用)
# ---------------------------------------------
echo "[ 5/8 ] Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash 2>/dev/null || echo "        Azure CLI: manual install may be required"
echo "        Done"

# ---------------------------------------------
# 6. ngrok (ローカルWebhook開発用)
# ---------------------------------------------
echo "[ 6/8 ] Installing ngrok..."
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list >/dev/null
sudo apt-get update -qq && sudo apt-get install -qq ngrok 2>/dev/null || npm install -g ngrok
echo "        Done"

# ---------------------------------------------
# 7. 開発ツール
# ---------------------------------------------
echo "[ 7/8 ] Installing dev tools..."
npm install -g typescript ts-node nodemon
echo "        Done"

# ---------------------------------------------
# 8. Messaging SDK (グローバルインストール参照用)
# ---------------------------------------------
echo "[ 8/8 ] Messaging SDKs info..."
echo "        LINE:  npm install @line/bot-sdk"
echo "        Slack: npm install @slack/bolt @slack/web-api"
echo "        Teams: npm install botbuilder @microsoft/teams-js"
echo "        (Install per-project as needed)"

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
echo "  gh:       $(gh --version | head -n 1)"
echo "  claude:   $(claude --version 2>/dev/null || echo 'requires login')"
echo "  vercel:   $(vercel --version 2>/dev/null || echo 'not installed')"
echo "  railway:  $(railway --version 2>/dev/null || echo 'not installed')"
echo "  eas:      $(eas --version 2>/dev/null || echo 'not installed')"
echo "  supabase: $(supabase --version 2>/dev/null || echo 'not installed')"
echo "  teamsapp: $(teamsapp --version 2>/dev/null || echo 'not installed')"
echo "  az:       $(az --version 2>/dev/null | head -n 1 || echo 'not installed')"
echo "  ngrok:    $(ngrok --version 2>/dev/null || echo 'not installed')"
echo "-------------------------------------------"
echo ""
echo "Next steps - Login to services:"
echo ""
echo "  # Required"
echo "  claude login"
echo ""
echo "  # Build Platforms"
echo "  gh auth status      # GitHub (usually auto)"
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
echo "============================================"
