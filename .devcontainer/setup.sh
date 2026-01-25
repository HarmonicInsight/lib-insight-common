#!/bin/bash
set -e

echo "============================================"
echo "  Harmonic Insight - Auto-Fix Environment"
echo "============================================"
echo ""
echo "Node.js: $(node --version)"
echo "Python:  $(python --version)"
echo "npm:     $(npm --version)"
echo ""

# ---------------------------------------------
# 1. Claude Code CLI
# ---------------------------------------------
echo "[ 1/6 ] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
echo "        Done"

# ---------------------------------------------
# 2. Vercel CLI
# ---------------------------------------------
echo "[ 2/6 ] Installing Vercel CLI..."
npm install -g vercel
echo "        Done"

# ---------------------------------------------
# 3. Railway CLI
# ---------------------------------------------
echo "[ 3/6 ] Installing Railway CLI..."
npm install -g @railway/cli
echo "        Done"

# ---------------------------------------------
# 4. EAS CLI (Expo)
# ---------------------------------------------
echo "[ 4/6 ] Installing EAS CLI..."
npm install -g eas-cli
echo "        Done"

# ---------------------------------------------
# 5. Supabase CLI
# ---------------------------------------------
echo "[ 5/6 ] Installing Supabase CLI..."
npm install -g supabase
echo "        Done"

# ---------------------------------------------
# 6. 開発ツール
# ---------------------------------------------
echo "[ 6/6 ] Installing dev tools..."
npm install -g typescript ts-node nodemon
echo "        Done"

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
echo "  gh:       $(gh --version | head -n 1)"
echo "  node:     $(node --version)"
echo "  python:   $(python --version 2>&1)"
echo "  claude:   $(claude --version 2>/dev/null || echo 'requires login')"
echo "  vercel:   $(vercel --version)"
echo "  railway:  $(railway --version)"
echo "  eas:      $(eas --version)"
echo "  supabase: $(supabase --version)"
echo "-------------------------------------------"
echo ""
echo "Next steps - Login to each service:"
echo ""
echo "  claude login      # Claude Code (required)"
echo "  gh auth status    # GitHub (usually auto-authenticated)"
echo "  vercel login      # Vercel"
echo "  railway login     # Railway"
echo "  eas login         # EAS (Expo)"
echo "  supabase login    # Supabase"
echo ""
echo "============================================"
