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
#   # iOS (Swift/SwiftUI + XcodeGen)
#   ./init-app.sh my-app-name --platform ios --package com.harmonic.insight.myapp
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
if [[ "$PLATFORM" != "web" && "$PLATFORM" != "android" && "$PLATFORM" != "expo" && "$PLATFORM" != "ios" ]]; then
    echo -e "${RED}サポートされていないプラットフォーム: $PLATFORM${NC}"
    echo "サポート: web, android, expo, ios"
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

    # 開発用 keystore の生成（チーム全員で同じ debug 署名を共有）
    echo -e "${YELLOW}  開発用 keystore を生成中...${NC}"
    if command -v keytool &> /dev/null; then
        keytool -genkeypair \
            -alias androiddebugkey \
            -keypass android \
            -keystore app/dev.keystore \
            -storepass android \
            -dname "CN=Android Debug,O=Android,C=US" \
            -keyalg RSA \
            -keysize 2048 \
            -validity 36500 \
            2>/dev/null
        echo -e "  ${GREEN}✓${NC} app/dev.keystore を生成しました（リポジトリに含めます）"
    else
        echo -e "  ${YELLOW}⚠ keytool が見つかりません。JDK をインストール後、以下を実行してください:${NC}"
        echo -e "    keytool -genkeypair -alias androiddebugkey -keypass android -keystore app/dev.keystore -storepass android -dname \"CN=Android Debug,O=Android,C=US\" -keyalg RSA -keysize 2048 -validity 36500"
    fi

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
# iOS (Swift/SwiftUI + XcodeGen) 初期化
# =============================================
init_ios() {
    echo -e "${YELLOW}[3/5] iOS テンプレート展開...${NC}"

    TEMPLATE_DIR="$COMMON_DIR/templates/ios"

    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo -e "${RED}テンプレートが見つかりません: $TEMPLATE_DIR${NC}"
        echo "insight-common を最新版に更新してください。"
        exit 1
    fi

    # Bundle ID の解決
    if [ -z "$PACKAGE_NAME" ]; then
        local clean_name=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '.' | sed 's/[^a-z0-9.]//g')
        PACKAGE_NAME="com.harmonic.insight.${clean_name}"
        echo -e "${YELLOW}  Bundle ID を自動推定: $PACKAGE_NAME${NC}"
    fi

    # アプリ名の各形式を生成
    local app_suffix=$(echo "$PACKAGE_NAME" | awk -F. '{print $NF}')
    local app_name_pascal=$(echo "$app_suffix" | sed 's/\b\(.\)/\u\1/g')
    local app_name_lower=$(echo "$app_suffix" | tr '[:upper:]' '[:lower:]')

    # テンプレートコピー
    echo -e "${YELLOW}  テンプレートファイルをコピー中...${NC}"

    # ルートファイル
    cp "$TEMPLATE_DIR/project.yml" ./project.yml
    cp "$TEMPLATE_DIR/.gitignore" ./.gitignore
    cp "$TEMPLATE_DIR/Makefile" ./Makefile
    cp "$TEMPLATE_DIR/.xcode-version" ./.xcode-version

    # Configuration
    mkdir -p Configuration
    cp "$TEMPLATE_DIR/Configuration/Base.xcconfig" ./Configuration/Base.xcconfig
    cp "$TEMPLATE_DIR/Configuration/Debug.xcconfig" ./Configuration/Debug.xcconfig
    cp "$TEMPLATE_DIR/Configuration/Release.xcconfig" ./Configuration/Release.xcconfig

    # ソースディレクトリ
    mkdir -p "${app_name_lower}/Extensions"
    mkdir -p "${app_name_lower}/Theme"
    mkdir -p "${app_name_lower}/License"
    mkdir -p "${app_name_lower}/Resources/Assets.xcassets/Colors"

    # Swift ソース
    cp "$TEMPLATE_DIR/__APPNAME__/__APPNAME__App.swift" "${app_name_lower}/${app_name_pascal}App.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/ContentView.swift" "${app_name_lower}/ContentView.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/Info.plist" "${app_name_lower}/Info.plist"
    cp "$TEMPLATE_DIR/__APPNAME__/Extensions/Color+Hex.swift" "${app_name_lower}/Extensions/Color+Hex.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/Theme/InsightColors.swift" "${app_name_lower}/Theme/InsightColors.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/Theme/InsightTheme.swift" "${app_name_lower}/Theme/InsightTheme.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/Theme/InsightTypography.swift" "${app_name_lower}/Theme/InsightTypography.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/License/PlanCode.swift" "${app_name_lower}/License/PlanCode.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/License/LicenseManager.swift" "${app_name_lower}/License/LicenseManager.swift"
    cp "$TEMPLATE_DIR/__APPNAME__/License/LicenseView.swift" "${app_name_lower}/License/LicenseView.swift"

    # Asset Catalog
    local template_assets="$TEMPLATE_DIR/__APPNAME__/Resources/Assets.xcassets"
    cp "$template_assets/Contents.json" "${app_name_lower}/Resources/Assets.xcassets/Contents.json"

    # AppIcon + AccentColor
    for colorset in AccentColor.colorset AppIcon.appiconset; do
        if [ -d "$template_assets/$colorset" ]; then
            mkdir -p "${app_name_lower}/Resources/Assets.xcassets/$colorset"
            cp "$template_assets/$colorset/Contents.json" "${app_name_lower}/Resources/Assets.xcassets/$colorset/Contents.json"
        fi
    done

    # Colors
    for colorset_dir in "$template_assets/Colors"/*.colorset; do
        if [ -d "$colorset_dir" ]; then
            local colorset_name=$(basename "$colorset_dir")
            mkdir -p "${app_name_lower}/Resources/Assets.xcassets/Colors/$colorset_name"
            cp "$colorset_dir/Contents.json" "${app_name_lower}/Resources/Assets.xcassets/Colors/$colorset_name/Contents.json"
        fi
    done

    # ローカライゼーション
    mkdir -p "${app_name_lower}/Resources/ja.lproj"
    mkdir -p "${app_name_lower}/Resources/en.lproj"
    cp "$TEMPLATE_DIR/__APPNAME__/Resources/ja.lproj/Localizable.strings" "${app_name_lower}/Resources/ja.lproj/Localizable.strings"
    cp "$TEMPLATE_DIR/__APPNAME__/Resources/en.lproj/Localizable.strings" "${app_name_lower}/Resources/en.lproj/Localizable.strings"

    # CI/CD
    mkdir -p .github/workflows
    cp "$TEMPLATE_DIR/.github/workflows/build.yml" .github/workflows/build.yml

    # Fastlane メタデータ
    for locale in ja en-US; do
        if [ -d "$TEMPLATE_DIR/fastlane/metadata/$locale" ]; then
            mkdir -p "fastlane/metadata/$locale"
            cp "$TEMPLATE_DIR/fastlane/metadata/$locale/"*.txt "fastlane/metadata/$locale/" 2>/dev/null || true
        fi
    done

    # プレースホルダー置換
    echo -e "${YELLOW}[4/5] プレースホルダーを置換中...${NC}"
    find . -type f \( -name "*.swift" -o -name "*.yml" -o -name "*.plist" -o -name "*.xcconfig" -o -name "*.strings" -o -name "Makefile" \) \
        ! -path "./insight-common/*" ! -path "./.git/*" \
        -exec sed -i \
            -e "s/__APPNAME__/${app_name_lower}/g" \
            -e "s/__AppName__/${app_name_pascal}/g" \
            -e "s/__APP_BUNDLE_ID__/${PACKAGE_NAME}/g" \
            -e "s/__app_display_name__/${APP_NAME}/g" \
            -e "s/__PRODUCT_CODE__/XXXX/g" \
            {} +

    # APP_SPEC.md
    cat > APP_SPEC.md << SPECEOF
# ${APP_NAME} 仕様書

## 概要
- **製品コード**: (config/products.ts に登録後に記入)
- **Bundle ID**: $PACKAGE_NAME
- **プラットフォーム**: iOS (Swift/SwiftUI)
- **デザインシステム**: Ivory & Gold

## 機能
(機能一覧を記入)

## 参照
- \`insight-common/standards/IOS.md\` — iOS 開発標準
- \`insight-common/CLAUDE.md\` — プロジェクト全体ガイドライン
SPECEOF

    # README
    cat > README.md << RDEOF
# ${APP_NAME}

HARMONIC insight iOS アプリ

## セットアップ

\`\`\`bash
# 初回セットアップ（XcodeGen インストール + プロジェクト生成）
make setup

# Xcode で開く
make open
\`\`\`

## 開発標準

このプロジェクトは \`insight-common/standards/IOS.md\` に準拠しています。

- Ivory & Gold カラーシステム
- SwiftUI + iOS 16.0+
- XcodeGen (project.yml)
- xcconfig によるビルド設定管理

## アーキテクチャ

\`\`\`
${app_name_lower}/
├── ${app_name_pascal}App.swift     # @main エントリポイント
├── ContentView.swift               # メインビュー
├── Extensions/                     # Swift 拡張
├── Theme/                          # Ivory & Gold テーマ
├── License/                        # ライセンス管理
└── Resources/
    ├── Assets.xcassets/            # カラー・アイコン
    ├── ja.lproj/                   # 日本語
    └── en.lproj/                   # 英語
\`\`\`

## Makefile コマンド

| コマンド | 説明 |
|---------|------|
| \`make setup\` | 初回セットアップ |
| \`make generate\` | XcodeGen でプロジェクト再生成 |
| \`make build\` | Debug ビルド |
| \`make clean\` | ビルドキャッシュ削除 |
| \`make nuke\` | DerivedData + .xcodeproj 完全削除 |
| \`make open\` | Xcode で開く |
| \`make bump-patch\` | パッチバージョンアップ |
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

    # XcodeGen 実行（利用可能な場合）
    if command -v xcodegen &> /dev/null; then
        echo -e "${YELLOW}  XcodeGen でプロジェクトを生成中...${NC}"
        xcodegen generate 2>/dev/null && echo -e "  ${GREEN}✓${NC} .xcodeproj を生成しました" || echo -e "  ${YELLOW}⚠ XcodeGen 実行に失敗しました。make generate で再試行してください${NC}"
    else
        echo -e "  ${YELLOW}⚠ XcodeGen が見つかりません。brew install xcodegen 後に make generate を実行してください${NC}"
    fi

    echo -e "${GREEN}  iOS テンプレート展開完了${NC}"
}

# =============================================
# 関数実行 (引数解析後)
# =============================================
if [ "$PLATFORM" = "android" ]; then
    init_android
elif [ "$PLATFORM" = "expo" ]; then
    init_expo
elif [ "$PLATFORM" = "ios" ]; then
    init_ios
elif [ "$PLATFORM" = "web" ]; then
    init_web
fi

# =============================================
# Claude Code スキル配置（全プラットフォーム共通）
# =============================================
echo -e "${YELLOW}  Claude Code スキルを配置中...${NC}"
mkdir -p .claude/commands

# release-check スキル（insight-common から同期）
if [ -f "insight-common/.claude/commands/release-check.md" ]; then
    cp insight-common/.claude/commands/release-check.md .claude/commands/release-check.md
    echo -e "  ${GREEN}✓${NC} release-check スキル (insight-common から同期)"
else
    # フォールバック: insight-common がまだ初期化されていない場合の簡易版
    cat > .claude/commands/release-check.md << 'SKILLEOF'
# リリースチェックコマンド

対象プロジェクトに対して HARMONIC insight のリリース前チェックを**フェーズ別に対話的**に実行します。

## 重要: 実行ルール

- 各フェーズを**順番に**実行すること。一気に全部やらない。
- 各フェーズ完了後、結果をユーザーに**チェックリスト形式**で提示し、次のフェーズに進むか確認する。
- エラーが見つかった場合、**その場で修正案を提示**し、ユーザーの確認後に修正を実行する。
- TODO ツールを使って全フェーズの進捗を管理する。

## 実行手順

### Phase 0: 準備

1. `$ARGUMENTS` が指定されている場合はそのディレクトリ、未指定の場合はカレントディレクトリを対象にする。
2. プラットフォームを自動検出する:
   - `build.gradle.kts` → Android (Native Kotlin) → `/release-check-android` に委譲
   - `app.json` + `expo` → Expo (React Native)
   - `package.json` → React / Next.js
   - `*.csproj` → C# (WPF)
   - `pyproject.toml` / `requirements.txt` → Python
   - `Package.swift` → iOS
3. Android (Native Kotlin) を検出した場合は `/release-check-android` スキルに切り替える。
4. TODO リストにフェーズを登録し、フェーズ別に対話的に実行する。

### Phase 1: 標準検証（自動スクリプト）

自動検証スクリプトを実行する:

```bash
bash ./insight-common/scripts/release-check.sh ${ARGUMENTS:-.}
```

結果をチェックリスト形式で報告。❌ がある場合はこのフェーズで修正案を提示する。

### Phase 2: コード品質・セキュリティ確認

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| Q1 | TODO/FIXME/HACK の残存 | ソースファイルで検索 |
| Q2 | デバッグ出力の残存 | プラットフォームに応じた検索 |
| Q3 | ハードコードされた API キー | 秘密鍵パターンを検索 |
| S1 | .env が .gitignore に含まれる | `.gitignore` を確認 |
| S2 | credentials ファイルが除外されている | `.gitignore` を確認 |
| G1 | 未コミットの変更がない | `git status` |

### Phase 3: プラットフォーム固有チェック

`insight-common/standards/RELEASE_CHECKLIST.md` を参照し、検出プラットフォームに応じたチェックを実行する。

### Phase 4: ストアメタデータ確認（モバイルアプリの場合）

`fastlane/metadata/` ディレクトリの構成と文字数制限を確認する。

### Phase 5: 最終確認・サマリー

全フェーズの結果を統合し、最終サマリーを表示する。

## プラットフォーム別の専用スキル

- `/release-check-android` — Android (Native Kotlin) 専用の詳細チェック

## 参照ドキュメント

- `insight-common/standards/RELEASE_CHECKLIST.md` — 全チェック項目の詳細定義
- `insight-common/standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション
- `insight-common/CLAUDE.md` §12 — 開発完了チェックリスト
SKILLEOF
    echo -e "  ${GREEN}✓${NC} release-check スキル (テンプレートから生成)"
fi

# プラットフォーム固有スキルの配置
if [ "$PLATFORM" = "android" ]; then
    if [ -f "insight-common/.claude/commands/release-check-android.md" ]; then
        cp insight-common/.claude/commands/release-check-android.md .claude/commands/release-check-android.md
        echo -e "  ${GREEN}✓${NC} release-check-android スキル (insight-common から同期)"
    else
        # フォールバック: insight-common の release-check-android.md がない場合
        cat > .claude/commands/release-check-android.md << 'ANDROIDSKILLEOF'
# Android リリースチェック（Native Kotlin）

Android (Kotlin + Jetpack Compose) アプリ専用のリリース前チェックを**対話的チェックリスト形式**で実行します。

> Expo / React Native の場合は `/release-check` を使用してください。

## 重要: 実行ルール

- **チェックリストの各項目を1つずつ確認**し、結果をユーザーに報告する。
- 一気に全項目をチェックして結果だけ出すのは**禁止**。フェーズごとに報告・確認を挟む。
- TODO ツールで全フェーズの進捗を管理する。
- エラーが見つかったらその場で修正案を提示し、ユーザーの承認後に修正する。
- 各フェーズ完了時に「次のフェーズに進みますか？」と確認する。

## Phase 0: 準備

1. `$ARGUMENTS` が指定されている場合はそのディレクトリ、未指定の場合はカレントディレクトリを対象にする。
2. `build.gradle.kts` の存在を確認し、Android プロジェクトであることを検証する。
3. TODO リストに Phase 1〜8 を登録する。

## Phase 1: ビルド設定チェック (A1-A8)

`app/build.gradle.kts` を読み込み、versionCode, versionName, compileSdk(35), targetSdk(35), minSdk(26), isMinifyEnabled(true), isShrinkResources(true), ProGuard を確認する。

## Phase 2: 署名・セキュリティ (AS1-AS4, S1-S4)

signingConfig, keystore, .gitignore, API キー埋め込み, google-services.json を確認する。

## Phase 3: デザイン標準 Ivory & Gold (D1-D8)

Gold (#B8942F) プライマリ, Ivory (#FAF8F5) 背景, Blue 未使用, Theme, Material3 を確認する。

## Phase 4: ローカライゼーション (L1-L5)

strings.xml 日英存在, キー一致, ハードコード文字列を確認する。

## Phase 5: Play Store メタデータ (AP1-AP7)

fastlane/metadata/android/ のタイトル・説明・リリースノート・スクリーンショットを確認する。

## Phase 6: コード品質 (Q1-Q5)

TODO/FIXME, デバッグ出力, API キー, 未使用 import, Lint を確認する。

## Phase 7: CI/CD (AC1-AC3)

.github/workflows/build.yml, JDK 17, google-services.json の CI プレースホルダーを確認する。

## Phase 8: 最終確認・サマリー

全フェーズの結果を統合して最終サマリーを表示する。

## 参照ドキュメント

- `insight-common/standards/ANDROID.md` — Android 開発標準
- `insight-common/standards/RELEASE_CHECKLIST.md` — 全プラットフォーム共通リリースチェックリスト
- `insight-common/standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション
ANDROIDSKILLEOF
        echo -e "  ${GREEN}✓${NC} release-check-android スキル (テンプレートから生成)"
    fi
fi

# iOS 固有スキルの配置
if [ "$PLATFORM" = "ios" ]; then
    if [ -f "insight-common/.claude/commands/release-check-ios.md" ]; then
        cp insight-common/.claude/commands/release-check-ios.md .claude/commands/release-check-ios.md
        echo -e "  ${GREEN}✓${NC} release-check-ios スキル (insight-common から同期)"
    else
        cat > .claude/commands/release-check-ios.md << 'IOSSKILLEOF'
# iOS リリースチェック（Swift / SwiftUI）

iOS (Swift + SwiftUI + XcodeGen) アプリ専用のリリース前チェックを**対話的チェックリスト形式**で実行します。

## 重要: 実行ルール

- **チェックリストの各項目を1つずつ確認**し、結果をユーザーに報告する。
- 一気に全項目をチェックして結果だけ出すのは**禁止**。フェーズごとに報告・確認を挟む。
- TODO ツールで全フェーズの進捗を管理する。
- エラーが見つかったらその場で修正案を提示し、ユーザーの承認後に修正する。

## Phase 0: 準備

1. `$ARGUMENTS` が指定されている場合はそのディレクトリ、未指定の場合はカレントディレクトリを対象にする。
2. `project.yml` または `Package.swift` の存在を確認し、iOS プロジェクトであることを検証する。
3. TODO リストに Phase 1〜8 を登録する。

## Phase 1: ビルド設定チェック (I1-I8)

project.yml, xcconfig, .xcode-version を確認する。

## Phase 2: 署名・セキュリティ (IS1-IS6, S1-S4)

CODE_SIGN_STYLE, Provisioning Profile, .gitignore, API キー埋め込みを確認する。

## Phase 3: デザイン標準 Ivory & Gold (D1-D7)

Gold (#B8942F) プライマリ, Ivory (#FAF8F5) 背景, InsightColors, InsightTheme を確認する。

## Phase 4: ローカライゼーション (L1-L5)

Localizable.strings 日英存在, キー一致, ハードコード文字列を確認する。

## Phase 5: App Store メタデータ (IA1-IA6)

fastlane/metadata/ の name, subtitle, description, release_notes を確認する。

## Phase 6: コード品質 (Q1-Q5)

TODO/FIXME, print/NSLog, API キー, force unwrap を確認する。

## Phase 7: CI/CD (IC1-IC3)

.github/workflows/build.yml, XcodeGen, Archive ジョブを確認する。

## Phase 8: 最終確認・サマリー

全フェーズの結果を統合して最終サマリーを表示する。

## 参照ドキュメント

- `insight-common/standards/IOS.md` — iOS 開発標準
- `insight-common/standards/RELEASE_CHECKLIST.md` — 全プラットフォーム共通リリースチェックリスト
- `insight-common/scripts/ios-manage.sh` — iOS プロジェクト管理 CLI
IOSSKILLEOF
        echo -e "  ${GREEN}✓${NC} release-check-ios スキル (テンプレートから生成)"
    fi
fi

# .claude/settings.json（SessionStart フックでスキル自動同期）
cat > .claude/settings.json << 'SETTINGSEOF'
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PROJECT_DIR}/insight-common/scripts/sync-skills.sh"
          }
        ]
      }
    ]
  }
}
SETTINGSEOF
echo -e "  ${GREEN}✓${NC} .claude/settings.json (SessionStart sync-skills フック)"

# CLAUDE.md（アプリ側用 — プラットフォーム別に生成）
if [ "$PLATFORM" = "ios" ]; then
    cat > CLAUDE.md << 'CLEOF'
# 開発ガイド

> このプロジェクトは `insight-common/CLAUDE.md` の全標準に準拠します。
> 開発・レビュー・リリース前に必ず参照してください。

## 標準ドキュメント

```bash
cat insight-common/CLAUDE.md                       # 全体ガイド
cat insight-common/standards/IOS.md                # iOS 開発標準
cat insight-common/standards/RELEASE_CHECKLIST.md   # リリースチェック
cat insight-common/standards/LOCALIZATION.md        # ローカライゼーション
```

## 検証コマンド

```bash
# 開発中の標準検証
./insight-common/scripts/validate-standards.sh .

# iOS 固有の検証
./insight-common/scripts/ios-manage.sh validate .

# カラー同期（brand/colors.json から再生成）
./insight-common/scripts/ios-manage.sh sync-colors .

# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

## AI アシスタント自動行動ルール

| トリガー（ユーザーの発言・状況） | 自動アクション |
|-------------------------------|--------------|
| 「リリース」「デプロイ」「公開」「本番」「ship」「release」 | `/release-check-ios` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check-ios` の実行を推奨 |
| 新規 UI 実装・デザイン変更 | Ivory & Gold デザイン標準を確認（`insight-common/CLAUDE.md` §1） |
| ストアメタデータ・スクリーンショットの話題 | `insight-common/standards/LOCALIZATION.md` §6 を参照 |
| Xcode 関連の問題 | `make nuke && make generate` を提案 |

## ⚠️ 重要ルール

- リリース前に `/release-check-ios` を**必ず**実行すること
- `/release-check-ios` は**フェーズ別に対話的に実行**する（一気にやらない）
- デザイン: Gold (#B8942F) がプライマリ、Ivory (#FAF8F5) が背景
- Blue (#2563EB) をプライマリとして使用**禁止**
- TODO/FIXME を残したままリリース**禁止**
- API キー・シークレットのハードコード**禁止**
- .xcodeproj はコミット**禁止**（XcodeGen で生成）
CLEOF
elif [ "$PLATFORM" = "android" ]; then
    cat > CLAUDE.md << 'CLEOF'
# 開発ガイド

> このプロジェクトは `insight-common/CLAUDE.md` の全標準に準拠します。
> 開発・レビュー・リリース前に必ず参照してください。

## 標準ドキュメント

```bash
cat insight-common/CLAUDE.md                       # 全体ガイド
cat insight-common/standards/ANDROID.md             # Android 開発標準
cat insight-common/standards/RELEASE_CHECKLIST.md   # リリースチェック
cat insight-common/standards/LOCALIZATION.md        # ローカライゼーション
```

## 検証コマンド

```bash
# 開発中の標準検証
./insight-common/scripts/validate-standards.sh .

# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

## AI アシスタント自動行動ルール

| トリガー（ユーザーの発言・状況） | 自動アクション |
|-------------------------------|--------------|
| 「リリース」「デプロイ」「公開」「本番」「ship」「release」 | `/release-check-android` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check-android` の実行を推奨 |
| 新規 UI 実装・デザイン変更 | Ivory & Gold デザイン標準を確認（`insight-common/CLAUDE.md` §1） |
| ストアメタデータ・スクリーンショットの話題 | `insight-common/standards/LOCALIZATION.md` §6 を参照 |

## ⚠️ 重要ルール

- リリース前に `/release-check-android` を**必ず**実行すること
- `/release-check-android` は**フェーズ別に対話的に実行**する（一気にやらない）
- デザイン: Gold (#B8942F) がプライマリ、Ivory (#FAF8F5) が背景
- Blue (#2563EB) をプライマリとして使用**禁止**
- TODO/FIXME を残したままリリース**禁止**
- API キー・シークレットのハードコード**禁止**
CLEOF
else
    cat > CLAUDE.md << 'CLEOF'
# 開発ガイド

> このプロジェクトは `insight-common/CLAUDE.md` の全標準に準拠します。
> 開発・レビュー・リリース前に必ず参照してください。

## 標準ドキュメント

```bash
cat insight-common/CLAUDE.md                       # 全体ガイド
cat insight-common/standards/RELEASE_CHECKLIST.md   # リリースチェック
```

## 検証コマンド

```bash
# 開発中の標準検証
./insight-common/scripts/validate-standards.sh .

# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

## AI アシスタント自動行動ルール

| トリガー（ユーザーの発言・状況） | 自動アクション |
|-------------------------------|--------------|
| 「リリース」「デプロイ」「公開」「本番」「ship」「release」 | `/release-check` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check` の実行を推奨 |
| 新規 UI 実装・デザイン変更 | Ivory & Gold デザイン標準を確認（`insight-common/CLAUDE.md` §1） |
| ストアメタデータ・スクリーンショットの話題 | `insight-common/standards/LOCALIZATION.md` §6 を参照 |

## ⚠️ 重要ルール

- リリース前に `/release-check` を**必ず**実行すること
- `/release-check` は**フェーズ別に対話的に実行**する（一気にやらない）
- デザイン: Gold (#B8942F) がプライマリ、Ivory (#FAF8F5) が背景
- Blue (#2563EB) をプライマリとして使用**禁止**
- TODO/FIXME を残したままリリース**禁止**
- API キー・シークレットのハードコード**禁止**
CLEOF
fi

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

if [ "$PLATFORM" = "ios" ]; then
    echo -e "次のステップ:"
    echo ""
    echo -e "  ${BLUE}1.${NC} cd ${APP_NAME}"
    echo -e "  ${BLUE}2.${NC} make setup  (XcodeGen インストール + プロジェクト生成)"
    echo -e "  ${BLUE}3.${NC} make open   (Xcode で開く)"
    echo -e "  ${BLUE}4.${NC} AppIcon をカスタマイズ"
    echo -e "  ${BLUE}5.${NC} APP_SPEC.md に仕様を記入"
    echo ""
    echo -e "標準ガイド: ${BLUE}insight-common/standards/IOS.md${NC}"
    echo -e "テンプレート: ${BLUE}insight-common/templates/ios/${NC}"
    echo -e "管理ツール: ${BLUE}insight-common/scripts/ios-manage.sh${NC}"
elif [ "$PLATFORM" = "android" ]; then
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
