---
description: 既存アプリを Harmonic Insight 開発標準に準拠させる。リポジトリ URL またはカレントディレクトリを対象に、カラー置換、ライセンス追加、API ラッパー適用、AI プロバイダー移行を段階的に実行。
argument-hint: "[repo-url or nothing]"
---

# 既存アプリの標準化マイグレーション

## Step 0: 対象リポジトリの準備

引数の形式に応じて対象を決定:

### パターン A: リポジトリ URL が渡された場合

`$ARGUMENTS` が `http` / `https` / `git@` で始まる場合:

```bash
# 1. クローン
git clone $ARGUMENTS /tmp/hi-standardize-target
cd /tmp/hi-standardize-target

# 2. 作業ブランチ作成
git checkout -b feat/standardize-to-hi-standards
```

### パターン B: 引数なし（カレントディレクトリ）

`$ARGUMENTS` が空の場合:

```bash
# 1. 現在のディレクトリが git リポジトリか確認
git rev-parse --is-inside-work-tree

# 2. 作業ブランチ作成
git checkout -b feat/standardize-to-hi-standards
```

### 製品コードの自動検出

以下の順で製品コードを推定:
1. `package.json` の `name` / `productCode` フィールド
2. `.csproj` の `AssemblyName` / `Product`
3. リポジトリ名（InsightOfficeSheet → IOSH, InsightSlide → INSS 等）
4. 見つからない場合はユーザーに確認

**このコマンドは既存コードを変更します。作業ブランチで実行されていることを確認してから進めてください。**

---

## Phase 0: 現状分析

まずプロジェクトの状態をスキャンして、修正が必要な箇所の全体像を把握する。

### 0-1. プラットフォーム自動検出

以下のファイルを探索して技術スタックを特定:

| 検出ファイル | プラットフォーム |
|------------|---------------|
| `*.csproj` + `*.xaml` | WPF (C#) |
| `package.json` + `next.config.*` | Next.js (React) |
| `tauri.conf.json` | Tauri + React |
| `app.json` + `expo` | Expo (React Native) |
| `build.gradle.kts` + `*.kt` | Android ネイティブ |
| `Package.swift` / `*.xcodeproj` | iOS ネイティブ |
| `requirements.txt` / `pyproject.toml` + GUI | Python デスクトップ |

### 0-2. 違反スキャン

以下を検索してレポート作成。**各カテゴリの検出件数を表示**:

```
[スキャン結果]
┌────────────────────┬───────┬──────────────────────────────────┐
│ カテゴリ            │ 件数  │ 概要                              │
├────────────────────┼───────┼──────────────────────────────────┤
│ 1. カラー違反       │ XX件  │ Blue プライマリ / ハードコード色値   │
│ 2. ライセンス欠落   │ XX件  │ LicenseManager / ライセンス画面     │
│ 3. API パターン     │ XX件  │ withGateway 未使用 / console.log   │
│ 4. AI プロバイダー   │ XX件  │ OpenAI / Azure の使用              │
│ 5. 認証             │ XX件  │ 独自認証 / Firebase Auth 未使用    │
│ 6. サードパーティ    │ XX件  │ ライセンスキー直書き               │
│ 7. i18n            │ XX件  │ 多言語対応の欠落                   │
│ 8. insight-common  │ XX件  │ サブモジュール / import パス        │
└────────────────────┴───────┴──────────────────────────────────┘
合計: XX 件の修正が必要
```

**レポートをユーザーに見せて、進めてよいか確認してから Phase 1 に進む。**

---

## Phase 1: カラー標準化 (Ivory & Gold)

### 1-1. 非標準カラーの検出

検索パターン:

```
# プライマリとして使われている Blue 系
#2563EB, #3B82F6, blue-500, blue-600, Blue, bg-blue, text-blue

# その他のハードコードされたプライマリ候補
#[0-9A-F]{6} が PrimaryColor / primary / accent / brand に代入されている箇所
```

### 1-2. 置換マッピング

| 検出パターン | 置換先 | 備考 |
|------------|--------|------|
| `#2563EB` / `#3B82F6` がプライマリ | `#B8942F` | Gold に置換 |
| `blue-500` / `blue-600` がボタン/CTA | `brand-primary` | Tailwind 変数化 |
| `#FFFFFF` が背景 | `#FAF8F5` | Ivory に置換 |
| `Color.Blue` / `Colors.Blue` がテーマ | `Color(0xFFB8942F)` | Gold に置換 |

### 1-3. プラットフォーム別の適用

**WPF の場合:**
- `Colors.xaml` が存在しなければ `insight-common/standards/CSHARP_WPF.md` のテンプレートから生成
- 既存の色定義を Ivory & Gold に置換
- `App.xaml` の ResourceDictionary に Colors.xaml を追加

**React の場合:**
- `colors.ts` / `globals.css` / `tailwind.config.js` を生成または修正
- `import colors from '@/insight-common/brand/colors.json'` を追加
- ハードコード色値を変数参照に置換

**Python の場合:**
- カラー定数ファイルを生成
- ハードコード色値を定数参照に置換

**Expo の場合:**
- `tailwind.config.js` (NativeWind) に brand カラー追加
- `app.json` の splash backgroundColor を `#FAF8F5` に

**完了後、ユーザーに差分を見せて確認。**

---

## Phase 2: ライセンスシステム追加

### 2-1. 不足チェック

- [ ] InsightLicenseManager クラス/モジュールが存在するか
- [ ] ライセンス画面（LicenseView / LicenseScreen）が存在するか
- [ ] プラン列挙型（TRIAL/STD/PRO/ENT）が定義されているか
- [ ] ライセンスキー検証ロジックがあるか

### 2-2. 不足分の生成

**WPF:**
```
生成ファイル:
├── License/PlanCode.cs
├── License/LicenseInfo.cs
├── License/InsightLicenseManager.cs
├── Views/LicenseView.xaml
└── ViewModels/LicenseViewModel.cs
```

**React:**
```
生成ファイル:
├── lib/license/types.ts
├── lib/license/license-manager.ts
└── components/license/LicenseView.tsx
```

**Python:**
```
生成ファイル:
├── src/license_manager.py
└── src/ui/license_view.py
```

### 2-3. ライセンス画面レイアウト

Insight Slides 形式に準拠しているか確認。していなければ修正:
- 製品名: Gold 色、中央配置
- プラン表示 + 有効期限
- 機能一覧（プラン別 ○/×）
- メールアドレス + ライセンスキー入力
- アクティベート / クリアボタン

---

## Phase 3: API パターン修正

### 3-1. withGateway 未適用の API 検出

```
検索: pages/api/ または app/api/ 配下で
  export default ... かつ withGateway を含まないファイル
```

### 3-2. 自動ラップ

各 API エンドポイントを `withGateway()` でラップ:

```typescript
// Before
export default async function handler(req, res) { ... }

// After
import { withGateway } from '@/insight-common/infrastructure/api/gateway';
export default withGateway(async (req, res) => { ... }, {
  requireAuth: true,
  rateLimit: 60,
  audit: true,
});
```

### 3-3. console.log の除去

`console.log` → `logAudit()` または削除。デバッグ目的のものは削除、監査目的のものは `logAudit()` に置換。

---

## Phase 4: AI プロバイダー移行

### 4-1. OpenAI / Azure の検出

```
検索パターン:
  import.*openai, from 'openai', from '@azure/openai'
  OpenAIClient, AzureOpenAI, ChatCompletion
  OPENAI_API_KEY, AZURE_OPENAI
  gpt-4, gpt-3.5, gpt-4o
```

### 4-2. Claude API への移行

| OpenAI | Claude (Anthropic) |
|--------|-------------------|
| `import OpenAI from 'openai'` | `import Anthropic from '@anthropic-ai/sdk'` |
| `openai.chat.completions.create()` | `anthropic.messages.create()` |
| `model: 'gpt-4o'` | `model: getModelForTier(tier)` |
| `messages: [{role, content}]` | `messages: [{role, content}]` |
| `OPENAI_API_KEY` | BYOK（ユーザーの Claude API キー） |

### 4-3. ペルソナ・ティア制御の追加

```typescript
import { getModelForTier, canUseAiAssistant } from '@/insight-common/config/ai-assistant';

// ライセンスチェック追加
if (!canUseAiAssistant(plan)) {
  throw new Error('AI アシスタントは現在のプランでは利用できません');
}
```

---

## Phase 5: 認証の標準化

### 5-1. 独自認証の検出

```
検索: jwt.sign, jwt.verify, bcrypt, passport, 独自 session 管理
```

### 5-2. Firebase Auth への移行

- 既存の認証ロジック → Firebase Auth SDK に置換
- ユーザー ID → Firebase UID に統一
- セッション管理 → Firebase ID Token 検証

---

## Phase 6: サードパーティライセンス

### 6-1. ハードコードされたキーの検出

```
検索: Syncfusion のライセンスキー文字列（"Ngo9..." など）
```

### 6-2. third-party-licenses.json 経由に移行

```csharp
// Before
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("Ngo9...");

// After
var key = ThirdPartyLicenses.GetSyncfusionKey();
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(key);
```

---

## Phase 7: i18n 追加

### 7-1. ハードコード日本語文字列の検出

UI に表示される日本語文字列がコード内に直書きされている箇所を検出。

### 7-2. i18n ヘルパーの追加

プラットフォームに応じて:
- **React**: `next-intl` または `i18next` + `ja.json` / `en.json`
- **WPF**: `Resources/Strings.ja.resx` / `Strings.en.resx`
- **Python**: `insight_common.i18n.get_text()`

---

## Phase 8: insight-common サブモジュール確認

### 8-1. サブモジュールの存在確認

```bash
git submodule status insight-common
```

なければ追加:

```bash
git submodule add https://github.com/HarmonicInsight/insight-common.git
```

### 8-2. import パスの修正

`@/insight-common/` または `../insight-common/` のパスが正しく設定されているか確認。

---

## 完了レポート

全 Phase 完了後、以下の形式でレポート:

```
[標準化完了レポート]
┌────────────────────┬────────┬───────┬─────────────────────┐
│ カテゴリ            │ Before │ After │ 変更内容             │
├────────────────────┼────────┼───────┼─────────────────────┤
│ 1. カラー           │ 12件   │ 0件   │ Blue→Gold 12箇所     │
│ 2. ライセンス       │ 欠落   │ 実装済 │ 3ファイル新規作成     │
│ 3. API             │ 5件    │ 0件   │ withGateway 5箇所追加 │
│ 4. AI              │ 3件    │ 0件   │ OpenAI→Claude 移行   │
│ 5. 認証             │ OK     │ OK    │ 変更なし             │
│ 6. サードパーティ    │ 1件    │ 0件   │ キー外部化            │
│ 7. i18n            │ 欠落   │ 実装済 │ ja/en リソース追加    │
│ 8. insight-common  │ OK     │ OK    │ 変更なし             │
└────────────────────┴────────┴───────┴─────────────────────┘

変更ファイル数: XX
新規作成ファイル数: XX
```

最後に検証を実行:

```bash
./insight-common/scripts/validate-standards.sh .
```
