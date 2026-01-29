#!/bin/bash
# =============================================
# Insight App 初期化スクリプト
#
# 使い方:
#   curl -fsSL https://raw.githubusercontent.com/HarmonicInsight/insight-common/main/scripts/init-app.sh | bash -s my-app-name
#
#   または
#   ./init-app.sh my-app-name
#
# 機能:
#   - 新規リポジトリ作成
#   - insight-common サブモジュール追加
#   - 環境変数テンプレートコピー
#   - 基本ディレクトリ構成作成
#   - package.json 生成
# =============================================

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Insight App Initializer                                     ║${NC}"
echo -e "${BLUE}║  Firebase + Supabase Hybrid Architecture                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 引数チェック
APP_NAME=$1
if [ -z "$APP_NAME" ]; then
    echo -e "${RED}❌ アプリ名を指定してください${NC}"
    echo ""
    echo "使い方:"
    echo "  ./init-app.sh my-app-name"
    echo ""
    exit 1
fi

# ディレクトリ存在チェック
if [ -d "$APP_NAME" ]; then
    echo -e "${RED}❌ ディレクトリ '$APP_NAME' は既に存在します${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 '$APP_NAME' を初期化します...${NC}"
echo ""

# =============================================
# 1. ディレクトリ作成
# =============================================
echo -e "${YELLOW}📁 ディレクトリ作成...${NC}"
mkdir -p "$APP_NAME"
cd "$APP_NAME"

# =============================================
# 2. Git 初期化
# =============================================
echo -e "${YELLOW}📦 Git リポジトリ初期化...${NC}"
git init

# =============================================
# 3. insight-common サブモジュール追加
# =============================================
echo -e "${YELLOW}📦 insight-common サブモジュール追加...${NC}"
git submodule add https://github.com/HarmonicInsight/insight-common.git

# =============================================
# 4. ディレクトリ構成作成
# =============================================
echo -e "${YELLOW}📁 ディレクトリ構成作成...${NC}"
mkdir -p src/app
mkdir -p src/components
mkdir -p src/lib
mkdir -p src/api
mkdir -p public

# =============================================
# 5. 環境変数テンプレートコピー
# =============================================
echo -e "${YELLOW}📄 環境変数テンプレート作成...${NC}"
cp insight-common/infrastructure/.env.example .env.local.example

cat > .env.local.example << 'EOF'
# =============================================
# ${APP_NAME} - 環境変数
# このファイルを .env.local にコピーして値を設定
# =============================================

# Firebase Admin (サーバー)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Firebase Client (ブラウザ)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 開発用
# TEST_FIREBASE_UID=dev-user-001
EOF

# =============================================
# 6. package.json 生成
# =============================================
echo -e "${YELLOW}📄 package.json 生成...${NC}"
cat > package.json << EOF
{
  "name": "${APP_NAME}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check:env": "ts-node insight-common/infrastructure/scripts/check-env.ts",
    "check:connection": "ts-node insight-common/infrastructure/scripts/check-connection.ts",
    "test:auth": "ts-node insight-common/infrastructure/scripts/test-auth.ts"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "firebase-admin": "^12.0.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "dotenv": "^16.3.0"
  }
}
EOF

# =============================================
# 7. tsconfig.json 生成
# =============================================
echo -e "${YELLOW}📄 tsconfig.json 生成...${NC}"
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@insight-common/*": ["./insight-common/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# =============================================
# 8. .gitignore 生成
# =============================================
echo -e "${YELLOW}📄 .gitignore 生成...${NC}"
cat > .gitignore << 'EOF'
# dependencies
node_modules/
.pnpm-store/

# next.js
.next/
out/

# production
build/
dist/

# env files
.env
.env.local
.env*.local

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# misc
*.pem
EOF

# =============================================
# 9. 初期ファイル作成
# =============================================
echo -e "${YELLOW}📄 初期ファイル作成...${NC}"

# src/lib/auth.ts
cat > src/lib/auth.ts << 'EOF'
/**
 * 認証ユーティリティ
 * insight-common の認証モジュールをラップ
 */

export {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getIdToken,
  onAuthChange,
  getAuthHeaders,
} from '../../insight-common/infrastructure/auth/firebase-client';

export type { AuthResult } from '../../insight-common/infrastructure/auth/firebase-admin';
EOF

# src/lib/api.ts
cat > src/lib/api.ts << 'EOF'
/**
 * API クライアント
 */

import { getAuthHeaders } from './auth';

const API_BASE = '/api';

export async function checkEntitlement(productCode: string, feature: string) {
  const res = await fetch(`${API_BASE}/entitlement/check`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ product_code: productCode, feature }),
  });
  return res.json();
}

export async function activateLicense(licenseKey: string) {
  const res = await fetch(`${API_BASE}/entitlement/activate`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ license_key: licenseKey }),
  });
  return res.json();
}
EOF

# =============================================
# 10. GitHub Actions ワークフロー（デザイン標準チェック）
# =============================================
echo -e "${YELLOW}🔍 GitHub Actions ワークフロー設定...${NC}"
mkdir -p .github/workflows

cat > .github/workflows/validate-standards.yml << 'EOF'
# Insight Series デザイン標準チェック
# PRを出すと自動でチェックされ、違反があるとマージできません
name: Validate Design Standards

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    uses: HarmonicInsight/lib-insight-common/.github/workflows/reusable-validate.yml@main
    with:
      project_path: '.'
EOF

echo -e "${GREEN}✅ PR時に自動でデザイン標準チェックが実行されます${NC}"

# =============================================
# 11. README 生成
# =============================================
echo -e "${YELLOW}📄 README.md 生成...${NC}"
cat > README.md << EOF
# ${APP_NAME}

Insight Apps シリーズ

## セットアップ

\`\`\`bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.local.example .env.local
# .env.local を編集

# 環境変数チェック
pnpm run check:env

# 接続テスト
pnpm run check:connection

# 開発サーバー起動
pnpm run dev
\`\`\`

## アーキテクチャ

- Firebase: Auth / Analytics / FCM
- Supabase: PostgreSQL (業務データ)
- Vercel: ホスティング

詳細は \`insight-common/infrastructure/README.md\` を参照。
EOF

# =============================================
# 12. 初回コミット
# =============================================
echo -e "${YELLOW}📦 初回コミット...${NC}"
git add .
git commit -m "feat: Initialize ${APP_NAME} with insight-common infrastructure"

# =============================================
# 完了
# =============================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ 初期化完了！                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "次のステップ:"
echo ""
echo -e "  ${BLUE}1.${NC} cd ${APP_NAME}"
echo -e "  ${BLUE}2.${NC} cp .env.local.example .env.local"
echo -e "  ${BLUE}3.${NC} .env.local を編集"
echo -e "  ${BLUE}4.${NC} pnpm install"
echo -e "  ${BLUE}5.${NC} pnpm run check:env"
echo -e "  ${BLUE}6.${NC} pnpm run dev"
echo ""
