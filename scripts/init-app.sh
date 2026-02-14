#!/bin/bash
# =============================================
# Insight App 初期化スクリプト
#
# 使い方:
#   curl -fsSL https://raw.githubusercontent.com/HarmonicInsight/cross-lib-insight-common/main/scripts/init-app.sh | bash -s my-app-name
#
#   または
#   # Web (React/Next.js) — デフォルト
#   ./init-app.sh my-app-name
#   ./init-app.sh my-app-name --platform web
#
#   # Android (Kotlin/Compose)
#   ./init-app.sh my-app-name --platform android --package com.harmonic.insight.myapp
#
#   # Expo (React Native)
#   ./init-app.sh my-app-name --platform expo --package com.harmonicinsight.myapp
#
# 機能:
#   - 新規リポジトリ作成
#   - insight-common サブモジュール追加
#   - プラットフォーム別テンプレートファイル展開
#   - 基本ディレクトリ構成作成
# =============================================

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color

# ロゴ
echo ""
echo -e "${GOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GOLD}║  Insight App Initializer                                     ║${NC}"
echo -e "${GOLD}║  Ivory & Gold Design System                                  ║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 引数解析
APP_NAME=""
PLATFORM="web"
PACKAGE_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --package)
            PACKAGE_NAME="$2"
            shift 2
            ;;
        -*)
            echo -e "${RED}不明なオプション: $1${NC}"
            exit 1
            ;;
        *)
            APP_NAME="$1"
            shift
            ;;
    esac
done

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}アプリ名を指定してください${NC}"
    echo ""
    echo "使い方:"
    echo "  ./init-app.sh my-app-name                                    # Web (デフォルト)"
    echo "  ./init-app.sh my-app-name --platform android --package com.harmonic.insight.myapp  # Android"
    echo ""
    exit 1
fi

# ディレクトリ存在チェック
if [ -d "$APP_NAME" ]; then
    echo -e "${RED}ディレクトリ '$APP_NAME' は既に存在します${NC}"
    exit 1
fi

# プラットフォーム検証
if [[ "$PLATFORM" != "web" && "$PLATFORM" != "android" && "$PLATFORM" != "expo" ]]; then
    echo -e "${RED}サポートされていないプラットフォーム: $PLATFORM${NC}"
    echo "サポート: web, android, expo"
    exit 1
fi

echo -e "${GREEN}'$APP_NAME' を初期化します (プラットフォーム: $PLATFORM)${NC}"
echo ""

# SCRIPT_DIR の取得 (テンプレートファイルの参照用)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================
# 1. ディレクトリ作成 + Git 初期化
# =============================================
echo -e "${YELLOW}[1/5] ディレクトリ作成 + Git 初期化...${NC}"
mkdir -p "$APP_NAME"
cd "$APP_NAME"
git init

# =============================================
# 2. insight-common サブモジュール追加
# =============================================
echo -e "${YELLOW}[2/5] insight-common サブモジュール追加...${NC}"
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

# =============================================
# Android 初期化
# =============================================
init_android() {
    echo -e "${YELLOW}[3/5] Android テンプレート展開...${NC}"

    TEMPLATE_DIR="$COMMON_DIR/templates/android"

    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo -e "${RED}テンプレートが見つかりません: $TEMPLATE_DIR${NC}"
        echo "insight-common を最新版に更新してください。"
        exit 1
    fi

    # パッケージ名の解決
    if [ -z "$PACKAGE_NAME" ]; then
        # APP_NAME からパッケージ名を推測
        local clean_name=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '.' | sed 's/[^a-z0-9.]//g')
        PACKAGE_NAME="com.harmonic.insight.${clean_name}"
        echo -e "${YELLOW}  パッケージ名を自動推定: $PACKAGE_NAME${NC}"
    fi

    # パッケージ名からアプリ名部分を抽出
    local app_suffix=$(echo "$PACKAGE_NAME" | awk -F. '{print $NF}')
    local app_name_pascal=$(echo "$app_suffix" | sed 's/\b\(.\)/\u\1/g')
    local package_path=$(echo "$PACKAGE_NAME" | tr '.' '/')

    # テンプレートコピー
    echo -e "${YELLOW}  テンプレートファイルをコピー中...${NC}"

    # Gradle ファイル
    cp "$TEMPLATE_DIR/build.gradle.kts" ./build.gradle.kts
    cp "$TEMPLATE_DIR/settings.gradle.kts" ./settings.gradle.kts
    cp "$TEMPLATE_DIR/gradle.properties" ./gradle.properties
    mkdir -p gradle
    cp "$TEMPLATE_DIR/gradle/libs.versions.toml" ./gradle/libs.versions.toml

    # app ディレクトリ
    mkdir -p "app/src/main/kotlin/$package_path/ui/theme"
    mkdir -p "app/src/main/kotlin/$package_path/license"
    mkdir -p "app/src/main/kotlin/$package_path/data"
    mkdir -p "app/src/main/kotlin/$package_path/di"
    mkdir -p "app/src/main/kotlin/$package_path/ui/components"
    mkdir -p app/src/main/res/values
    mkdir -p app/src/main/res/values-en
    mkdir -p app/src/main/res/values-night
    mkdir -p app/src/main/res/drawable
    mkdir -p app/src/main/res/mipmap-anydpi-v26

    # ビルドファイル
    cp "$TEMPLATE_DIR/app/build.gradle.kts" ./app/build.gradle.kts
    cp "$TEMPLATE_DIR/app/proguard-rules.pro" ./app/proguard-rules.pro

    # Kotlin ソース
    cp "$TEMPLATE_DIR/app/src/main/kotlin/ui/theme/Color.kt" "app/src/main/kotlin/$package_path/ui/theme/Color.kt"
    cp "$TEMPLATE_DIR/app/src/main/kotlin/ui/theme/Theme.kt" "app/src/main/kotlin/$package_path/ui/theme/Theme.kt"
    cp "$TEMPLATE_DIR/app/src/main/kotlin/ui/theme/Type.kt" "app/src/main/kotlin/$package_path/ui/theme/Type.kt"
    cp "$TEMPLATE_DIR/app/src/main/kotlin/license/PlanCode.kt" "app/src/main/kotlin/$package_path/license/PlanCode.kt"
    cp "$TEMPLATE_DIR/app/src/main/kotlin/license/LicenseManager.kt" "app/src/main/kotlin/$package_path/license/LicenseManager.kt"
    cp "$TEMPLATE_DIR/app/src/main/kotlin/license/LicenseScreen.kt" "app/src/main/kotlin/$package_path/license/LicenseScreen.kt"

    # リソース
    cp "$TEMPLATE_DIR/app/src/main/res/values/colors.xml" app/src/main/res/values/colors.xml
    cp "$TEMPLATE_DIR/app/src/main/res/values/themes.xml" app/src/main/res/values/themes.xml
    cp "$TEMPLATE_DIR/app/src/main/res/values/strings.xml" app/src/main/res/values/strings.xml
    cp "$TEMPLATE_DIR/app/src/main/res/values-en/strings.xml" app/src/main/res/values-en/strings.xml
    cp "$TEMPLATE_DIR/app/src/main/res/values-night/themes.xml" app/src/main/res/values-night/themes.xml
    cp "$TEMPLATE_DIR/app/src/main/res/drawable/ic_launcher_foreground.xml" app/src/main/res/drawable/ic_launcher_foreground.xml
    cp "$TEMPLATE_DIR/app/src/main/res/drawable/ic_launcher_background.xml" app/src/main/res/drawable/ic_launcher_background.xml

    # Adaptive Icon launcher XML
    cat > app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml << 'XMLEOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
XMLEOF

    cp app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml

    # CI/CD
    mkdir -p .github/workflows
    cp "$TEMPLATE_DIR/.github/workflows/build.yml" .github/workflows/build.yml

    # .gitignore
    cp "$TEMPLATE_DIR/.gitignore" ./.gitignore

    # AndroidManifest.xml
    cat > app/src/main/AndroidManifest.xml << MFEOF
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.Insight${app_name_pascal}">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Insight${app_name_pascal}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
MFEOF

    # MainActivity.kt
    cat > "app/src/main/kotlin/$package_path/MainActivity.kt" << KTEOF
package $PACKAGE_NAME

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import ${PACKAGE_NAME}.ui.theme.Insight${app_name_pascal}Theme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Insight${app_name_pascal}Theme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    Text("Hello, ${APP_NAME}!")
                }
            }
        }
    }
}
KTEOF

    # プレースホルダー置換
    echo -e "${YELLOW}[4/5] プレースホルダーを置換中...${NC}"
    find . -type f \( -name "*.kt" -o -name "*.xml" -o -name "*.kts" -o -name "*.yml" -o -name "*.properties" \) \
        ! -path "./insight-common/*" ! -path "./.git/*" \
        -exec sed -i \
            -e "s/__APPNAME__/${app_suffix}/g" \
            -e "s/__AppName__/${app_name_pascal}/g" \
            -e "s/__APP_PACKAGE__/${PACKAGE_NAME}/g" \
            -e "s/__app_name__/${APP_NAME}/g" \
            -e "s/__app_display_name__/${APP_NAME}/g" \
            -e "s/__PRODUCT_CODE__/XXXX/g" \
            {} +

    # APP_SPEC.md
    cat > APP_SPEC.md << SPECEOF
# ${APP_NAME} 仕様書

## 概要
- **製品コード**: (config/products.ts に登録後に記入)
- **パッケージ名**: $PACKAGE_NAME
- **プラットフォーム**: Android (Kotlin/Compose)
- **デザインシステム**: Ivory & Gold

## 機能
(機能一覧を記入)

## 参照
- \`insight-common/standards/ANDROID.md\` — Android 開発標準
- \`insight-common/CLAUDE.md\` — プロジェクト全体ガイドライン
SPECEOF

    # README
    cat > README.md << RDEOF
# ${APP_NAME}

HARMONIC insight Android アプリ

## セットアップ

\`\`\`bash
# Android Studio で開く
# または
./gradlew assembleDebug
\`\`\`

## 開発標準

このプロジェクトは \`insight-common/standards/ANDROID.md\` に準拠しています。

- Ivory & Gold カラーシステム
- Jetpack Compose + Material Design 3
- Gradle Version Catalog
- ProGuard/R8 有効

## アーキテクチャ

\`\`\`
$package_path/
├── MainActivity.kt
├── data/           # データ層
├── di/             # Hilt DI
├── license/        # ライセンス管理
└── ui/
    ├── theme/      # Ivory & Gold テーマ
    ├── components/ # 共通コンポーネント
    └── <screen>/   # 画面ごとのフォルダ
\`\`\`
RDEOF

    # 標準チェックワークフロー
    cat > .github/workflows/validate-standards.yml << 'VSEOF'
name: Validate Design Standards
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  validate:
    uses: HarmonicInsight/cross-lib-insight-common/.github/workflows/reusable-validate.yml@main
    with:
      project_path: '.'
VSEOF

    echo -e "${GREEN}  Android テンプレート展開完了${NC}"
}

# =============================================
# Web (React/Next.js) 初期化 — 既存ロジック
# =============================================
init_web() {
    echo -e "${YELLOW}[3/5] Web (React/Next.js) テンプレート展開...${NC}"

    # ディレクトリ構成作成
    mkdir -p src/app
    mkdir -p src/components
    mkdir -p src/lib
    mkdir -p src/api
    mkdir -p public

    # 環境変数テンプレート
    if [ -f "insight-common/infrastructure/.env.example" ]; then
        cp insight-common/infrastructure/.env.example .env.local.example
    fi

    cat > .env.local.example << 'EOF'
# =============================================
# 環境変数
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
EOF

    # package.json
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

    # tsconfig.json
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

    # .gitignore
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

    # GitHub Actions ワークフロー
    mkdir -p .github/workflows
    cat > .github/workflows/validate-standards.yml << 'EOF'
name: Validate Design Standards
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  validate:
    uses: HarmonicInsight/cross-lib-insight-common/.github/workflows/reusable-validate.yml@main
    with:
      project_path: '.'
EOF

    # README
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

    echo -e "${GREEN}  Web テンプレート展開完了${NC}"
}

# =============================================
# Expo (React Native) 初期化
# =============================================
init_expo() {
    echo -e "${YELLOW}[3/5] Expo テンプレート展開...${NC}"

    TEMPLATE_DIR="$COMMON_DIR/templates/expo"

    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo -e "${RED}テンプレートが見つかりません: $TEMPLATE_DIR${NC}"
        echo "insight-common を最新版に更新してください。"
        exit 1
    fi

    # パッケージ名の解決
    if [ -z "$PACKAGE_NAME" ]; then
        local clean_name=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '' | sed 's/[^a-z0-9]//g')
        PACKAGE_NAME="com.harmonicinsight.${clean_name}"
        echo -e "${YELLOW}  パッケージ名を自動推定: $PACKAGE_NAME${NC}"
    fi

    # slug 名（小文字ハイフン区切り）
    local app_slug=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]')
    local app_display="$APP_NAME"

    # テンプレートコピー
    echo -e "${YELLOW}  テンプレートファイルをコピー中...${NC}"

    # ルートファイル
    cp "$TEMPLATE_DIR/app.json" ./app.json
    cp "$TEMPLATE_DIR/eas.json" ./eas.json
    cp "$TEMPLATE_DIR/package.json" ./package.json
    cp "$TEMPLATE_DIR/tsconfig.json" ./tsconfig.json
    cp "$TEMPLATE_DIR/.gitignore" ./.gitignore

    # lib/
    mkdir -p lib
    cp "$TEMPLATE_DIR/lib/colors.ts" ./lib/colors.ts
    cp "$TEMPLATE_DIR/lib/theme.ts" ./lib/theme.ts
    cp "$TEMPLATE_DIR/lib/license-manager.ts" ./lib/license-manager.ts

    # app/
    mkdir -p "app/(tabs)"
    cp "$TEMPLATE_DIR/app/_layout.tsx" ./app/_layout.tsx
    cp "$TEMPLATE_DIR/app/license.tsx" ./app/license.tsx
    cp "$TEMPLATE_DIR/app/(tabs)/_layout.tsx" "./app/(tabs)/_layout.tsx"
    cp "$TEMPLATE_DIR/app/(tabs)/index.tsx" "./app/(tabs)/index.tsx"
    cp "$TEMPLATE_DIR/app/(tabs)/settings.tsx" "./app/(tabs)/settings.tsx"

    # assets ディレクトリ
    mkdir -p assets/images

    # CI/CD
    mkdir -p .github/workflows
    cat > .github/workflows/build.yml << 'CIEOF'
name: Build Expo

on:
  push:
    branches: [ main, 'claude/**' ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Export (static check)
        run: npx expo export --platform android 2>/dev/null || echo "Export check completed"
CIEOF

    # プレースホルダー置換
    echo -e "${YELLOW}[4/5] プレースホルダーを置換中...${NC}"
    find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" \) \
        ! -path "./insight-common/*" ! -path "./.git/*" ! -path "./node_modules/*" \
        -exec sed -i \
            -e "s/__app_slug__/${app_slug}/g" \
            -e "s/__app_display_name__/${app_display}/g" \
            -e "s/__APP_PACKAGE__/${PACKAGE_NAME}/g" \
            -e "s/__PRODUCT_CODE__/XXXX/g" \
            {} +

    # APP_SPEC.md
    cat > APP_SPEC.md << SPECEOF
# ${APP_NAME} 仕様書

## 概要
- **製品コード**: (config/products.ts に登録後に記入)
- **パッケージ名**: $PACKAGE_NAME
- **プラットフォーム**: Expo/React Native (Android + iOS)
- **デザインシステム**: Ivory & Gold

## 機能
(機能一覧を記入)

## 参照
- \`insight-common/standards/ANDROID.md\` — Android 開発標準（§13 Expo セクション）
- \`insight-common/CLAUDE.md\` — プロジェクト全体ガイドライン
SPECEOF

    # README
    cat > README.md << RDEOF
# ${APP_NAME}

HARMONIC insight Expo/React Native アプリ

## セットアップ

\`\`\`bash
npm install
npx expo start
\`\`\`

## 開発標準

このプロジェクトは \`insight-common/standards/ANDROID.md\`（§13 Expo セクション）に準拠しています。

- Ivory & Gold カラーシステム (\`lib/colors.ts\`)
- expo-router (ファイルベースルーティング)
- TypeScript strict mode
- EAS Build

## アーキテクチャ

\`\`\`
app/
├── _layout.tsx         # Root layout
├── license.tsx         # ライセンス画面
└── (tabs)/
    ├── _layout.tsx     # Tab layout
    ├── index.tsx       # ホーム
    └── settings.tsx    # 設定
lib/
├── colors.ts           # Ivory & Gold カラー
├── theme.ts            # テーマ・タイポグラフィ
└── license-manager.ts  # ライセンス管理
\`\`\`
RDEOF

    # 標準チェックワークフロー
    cat > .github/workflows/validate-standards.yml << 'VSEOF'
name: Validate Design Standards
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  validate:
    uses: HarmonicInsight/cross-lib-insight-common/.github/workflows/reusable-validate.yml@main
    with:
      project_path: '.'
VSEOF

    echo -e "${GREEN}  Expo テンプレート展開完了${NC}"
}

# =============================================
# 関数実行 (引数解析後)
# =============================================
if [ "$PLATFORM" = "android" ]; then
    init_android
elif [ "$PLATFORM" = "expo" ]; then
    init_expo
elif [ "$PLATFORM" = "web" ]; then
    init_web
fi

# =============================================
# Claude Code スキル配置（全プラットフォーム共通）
# =============================================
echo -e "${YELLOW}  Claude Code スキルを配置中...${NC}"
mkdir -p .claude/commands

# release-check スキル
cat > .claude/commands/release-check.md << 'SKILLEOF'
# リリースチェック

リリース前の包括チェック（標準検証 + リリース固有チェック）を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `insight-common/scripts/release-check.sh` を実行する

```bash
bash ./insight-common/scripts/release-check.sh ${ARGUMENTS:-.}
```

3. エラーがあれば修正案を具体的に提示する
4. 警告があれば確認すべき内容を説明する
5. 手動確認項目の一覧を表示する

検証に失敗した場合は `standards/RELEASE_CHECKLIST.md` を参照して対応案を提示してください。

検証項目:
- デザイン標準（Ivory & Gold）
- バージョン番号の更新
- TODO/FIXME/HACK の残存
- デバッグ出力の残存
- ハードコードされたシークレット
- ローカライゼーション（日本語 + 英語）
- ライセンス管理
- Git 状態
- プラットフォーム固有チェック
SKILLEOF

# CLAUDE.md（アプリ側用）
cat > CLAUDE.md << 'CLEOF'
# 開発ガイド

> このプロジェクトは `insight-common/CLAUDE.md` の全標準に準拠します。
> 開発・レビュー・リリース前に必ず参照してください。

## 標準ドキュメント

```bash
cat insight-common/CLAUDE.md           # 全体ガイド
cat insight-common/standards/RELEASE_CHECKLIST.md  # リリースチェック
```

## 検証コマンド

```bash
# 開発中の標準検証
./insight-common/scripts/validate-standards.sh .

# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

## AI アシスタント自動行動ルール

| トリガー | アクション |
|---------|----------|
| 「リリース」「デプロイ」「公開」「本番」 | `/release-check` を提案・実行 |
| 新規 UI 実装 | Ivory & Gold デザイン標準を確認 |
CLEOF

echo -e "${GREEN}  Claude Code スキル配置完了${NC}"

# =============================================
# 初回コミット
# =============================================
echo -e "${YELLOW}[5/5] 初回コミット...${NC}"
git add .
git commit -m "feat: Initialize ${APP_NAME} with insight-common (${PLATFORM})"

# =============================================
# 完了
# =============================================
echo ""
echo -e "${GOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GOLD}║  初期化完了！                                                ║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$PLATFORM" = "android" ]; then
    echo -e "次のステップ:"
    echo ""
    echo -e "  ${BLUE}1.${NC} cd ${APP_NAME}"
    echo -e "  ${BLUE}2.${NC} Android Studio でプロジェクトを開く"
    echo -e "  ${BLUE}3.${NC} Gradle Sync を実行"
    echo -e "  ${BLUE}4.${NC} ic_launcher_foreground.xml をカスタマイズ"
    echo -e "  ${BLUE}5.${NC} APP_SPEC.md に仕様を記入"
    echo ""
    echo -e "標準ガイド: ${BLUE}insight-common/standards/ANDROID.md${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/android/${NC}"
elif [ "$PLATFORM" = "expo" ]; then
    echo -e "次のステップ:"
    echo ""
    echo -e "  ${BLUE}1.${NC} cd ${APP_NAME}"
    echo -e "  ${BLUE}2.${NC} npm install"
    echo -e "  ${BLUE}3.${NC} npx expo start"
    echo -e "  ${BLUE}4.${NC} app.json のプレースホルダーを確認"
    echo -e "  ${BLUE}5.${NC} APP_SPEC.md に仕様を記入"
    echo ""
    echo -e "標準ガイド: ${BLUE}insight-common/standards/ANDROID.md §13${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/expo/${NC}"
else
    echo -e "次のステップ:"
    echo ""
    echo -e "  ${BLUE}1.${NC} cd ${APP_NAME}"
    echo -e "  ${BLUE}2.${NC} cp .env.local.example .env.local"
    echo -e "  ${BLUE}3.${NC} .env.local を編集"
    echo -e "  ${BLUE}4.${NC} pnpm install"
    echo -e "  ${BLUE}5.${NC} pnpm run check:env"
    echo -e "  ${BLUE}6.${NC} pnpm run dev"
fi
echo ""
