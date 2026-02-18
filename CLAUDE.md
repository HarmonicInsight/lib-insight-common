# HARMONIC insight - 開発標準ガイド

> **重要**: このドキュメントは新規アプリ作成時・コード修正時に**必ず**参照してください。

---

## ⚠️ AI アシスタントの自動行動ルール

**以下のキーワード・状況を検知したら、該当するアクションを自動で提案・実行してください。ユーザーが忘れていても AI 側から提案すること。**

| トリガー（ユーザーの発言・状況） | 自動アクション |
|-------------------------------|--------------|
| 「リリース」「デプロイ」「ストアに出す」「公開」「本番」「ship」「release」 | `/release-check` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check` の実行を推奨 |
| 新規プロジェクト作成・UI 実装開始 | デザイン標準（Ivory & Gold）を確認 |
| AI アシスタント機能の実装 | `standards/AI_ASSISTANT.md` を確認 |
| ストアメタデータ・スクリーンショットの話題 | `standards/LOCALIZATION.md` §6 を参照 |
| ライブラリ更新・バージョンアップ・依存関係の変更 | `compatibility/` の互換性マトリクスを確認 |
| 「バージョン」「アップグレード」「アップデート」 | `config/app-versions.ts` と `compatibility/` を参照 |

---

## ⚠️ 開発開始前の必須チェック（AI アシスタント向け）

**新規プロジェクト作成・UI 実装・デザイン変更を行う前に、以下を確認してください：**

### デザインシステム: Ivory & Gold Theme

```
❌ 絶対禁止: Blue (#2563EB) をプライマリカラーとして使用
✅ 必須: Gold (#B8942F) をプライマリカラーとして使用
✅ 必須: Ivory (#FAF8F5) を背景色として使用
```

| 用途 | カラーコード | 備考 |
|-----|-------------|------|
| **Primary (Gold)** | `#B8942F` | 製品タイトル、アクセント、CTA |
| **Background (Ivory)** | `#FAF8F5` | メイン背景 |
| **Background Card** | `#FFFFFF` | カード、モーダル |
| **Text Primary** | `#1C1917` | 本文、見出し |
| **Text Secondary** | `#57534E` | サブテキスト |
| **Border** | `#E7E2DA` | ボーダー |
| **Success** | `#16A34A` | 成功ステータス |
| **Warning** | `#CA8A04` | 警告ステータス |
| **Error** | `#DC2626` | エラーステータス |

### プラットフォーム別標準

実装前に該当するガイドを確認:
- **C# (WPF)**: `standards/CSHARP_WPF.md`
- **Python**: `standards/PYTHON.md`
- **React/Next.js**: `standards/REACT.md`
- **Android**: `standards/ANDROID.md`
- **iOS**: `standards/IOS.md`
- **AI アシスタント**: `standards/AI_ASSISTANT.md`（InsightOffice 系アプリ共通）
- **ローカライゼーション**: `standards/LOCALIZATION.md`（全プラットフォーム共通）
- **リリースチェック**: `standards/RELEASE_CHECKLIST.md`（全プラットフォーム共通）

### 検証スクリプト

```bash
# 開発中の標準検証
./scripts/validate-standards.sh <project-directory>

# リリース前の包括チェック（標準検証 + リリース固有チェック）
./scripts/release-check.sh <project-directory>
```

---

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      あなたのアプリ                          │
├─────────────────────────────────────────────────────────────┤
│  insight-common (サブモジュール)                             │
│  ├── standards/      # プラットフォーム別開発標準            │
│  ├── brand/          # カラー・フォント・ロゴ               │
│  ├── config/         # 製品・販売戦略・リセラー・ライセンスサーバー │
│  ├── infrastructure/ # 認証・DB・API Gateway              │
│  ├── nlp/           # 日本語NLP (JBCA)                    │
│  └── docs/          # プラットフォーム標準                 │
├─────────────────────────────────────────────────────────────┤
│  harmonic-mart-generator (ナレッジ処理が必要な場合)           │
│  ├── ingest/        # PDF解析・チャンキング                │
│  └── search/        # Hybrid Search                       │
└─────────────────────────────────────────────────────────────┘
```

## 2. 必須手順

### Step 1: リポジトリ初期化

```bash
# insight-commonのinit-app.shを使用
curl -sL https://raw.githubusercontent.com/HarmonicInsight/cross-lib-insight-common/main/scripts/init-app.sh | bash -s -- <app-name>

# または既存リポジトリに追加
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
```

### Step 2: 標準検証

```bash
# 開発前に必ず実行
./insight-common/scripts/validate-standards.sh .
```

### Step 3: ブランドカラー適用（Ivory & Gold）

**TypeScript/JavaScript:**
```typescript
import colors from '@/insight-common/brand/colors.json';

// Primary (Gold): colors.brand.primary (#B8942F)
// Background (Ivory): colors.background.primary (#FAF8F5)
```

**C# (WPF):**
```xml
<!-- Colors.xaml から読み込み -->
<Color x:Key="PrimaryColor">#B8942F</Color>
<Color x:Key="BgPrimaryColor">#FAF8F5</Color>
```

**Python:**
```python
from your_app.ui.colors import Colors
# Colors.PRIMARY = "#B8942F"
# Colors.BG_PRIMARY = "#FAF8F5"
```

## 3. サードパーティライセンス（全製品共通）

Syncfusion 等のサードパーティライセンスキーは `config/third-party-licenses.json` で**全製品共通管理**されています。

### Syncfusion Essential Studio

```json
// config/third-party-licenses.json
{
  "syncfusion": {
    "licenseKey": "Ngo9BigBOggjHTQxAR8/...",
    "usedBy": ["INSS", "IOSH", "IOSD"]
  }
}
```

**アプリ起動時の登録（C# / WPF）:**

```csharp
// App.xaml.cs の OnStartup 冒頭で呼び出す
// 優先順位: 環境変数 > third-party-licenses.json > ハードコードフォールバック
var licenseKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
if (string.IsNullOrEmpty(licenseKey))
    licenseKey = ThirdPartyLicenses.GetSyncfusionKey();  // JSONから読み込み
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(licenseKey);
```

**キー更新時:** `config/third-party-licenses.json` の `licenseKey` を書き換えるだけで全製品に反映されます。

---

## 4. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| **Blue (#2563EB) をプライマリに使用** | **Gold (#B8942F) を使用** |
| ハードコードされた色値 | StaticResource/変数を使用 |
| 独自のライセンス実装 | `InsightLicenseManager` を使用 |
| 価格情報をWebサイト・公開資料に掲載 | 個別見積もり。パートナーとの協議により決定 |
| サードパーティキーを各アプリに直書き | `config/third-party-licenses.json` で共通管理 |
| クライアントで権限判定 | `withGateway({ requiredPlan: [...] })` |
| 独自の認証実装 | `infrastructure/auth/` を使用 |
| OpenAI/Azure を AI アシスタントに使用 | **Claude (Anthropic) API** を使用 |
| モデル ID のハードコード | `MODEL_REGISTRY` / `resolveModel()` を使用（ユーザー選択対応） |
| AI 機能のライセンスチェック省略 | `checkFeature(product, 'ai_assistant', plan)` を必ず実行 |
| UI テキストのハードコード | リソースファイル / 翻訳定義から参照（`standards/LOCALIZATION.md`） |
| 英語翻訳の省略 | 日本語 + 英語の両方を必ず用意 |
| リリースチェックなしでリリース | `/release-check` または `release-check.sh` を必ず実行 |
| TODO/FIXME を残したままリリース | リリース前に全て解決する |
| API キー・シークレットのハードコード | 環境変数 / .env / secrets 経由で参照 |

## 5. 製品コード一覧

### 製品ティアと販売チャネル（全製品 法人向け B2B Only）

```
┌──────────────────────────────────────────────────────────────────┐
│  Tier 1: 業務変革ツール                                         │
│  INCA / INBT / IVIN                                            │
├──────────────────────────────────────────────────────────────────┤
│  Tier 2: AI活用ツール                                           │
│  INMV / INIG                                                    │
├──────────────────────────────────────────────────────────────────┤
│  Tier 3: InsightOffice Suite（導入ツール）                       │
│  INSS / IOSH / IOSD / INPY                                     │
│  コンサル案件のクライアントに業務ツールとして導入                  │
├──────────────────────────────────────────────────────────────────┤
│  Tier 4: InsightSeniorOffice（社会貢献ツール）                   │
│  ISOF                                                           │
└──────────────────────────────────────────────────────────────────┘
```

> 全製品をコンサルティング案件の一環として法人向けに提供。
> 個人向け（B2C）販売は行わない。決済は Stripe（自社サイト）/ 請求書払い。
> **価格は全製品個別見積もり。パートナー（販売代理店）との協議により決定。Webサイト等での価格公開は行わない。**

### Tier 1: 業務変革ツール

| コード | 製品名 | 説明 |
|-------|-------|------|
| INCA | InsightNoCodeAnalyzer | RPA・ローコード解析・移行アセスメント |
| INBT | InsightBot | AIエディタ搭載 — 業務最適化RPA + Orchestrator |
| IVIN | InterviewInsight | 自動ヒアリング・業務調査支援 |

### Tier 2: AI活用ツール

| コード | 製品名 | 説明 |
|-------|-------|------|
| INMV | InsightMovie | 画像・テキストから動画作成 |
| INIG | InsightImageGen | 業務資料向けAI画像の大量自動生成 |

### Tier 3: InsightOffice Suite

| コード | 製品名 | 説明 |
|-------|-------|------|
| INSS | InsightOfficeSlide | AIアシスタント搭載 — PowerPointテキスト抽出・レビュー |
| IOSH | InsightOfficeSheet | AIアシスタント搭載 — 経営数値管理・予実管理 |
| IOSD | InsightOfficeDoc | AIアシスタント搭載 — 参照資料付きWord文書管理 |
| INPY | InsightPy | AIエディタ搭載 — 業務調査・データ収集Python実行基盤 |

### Tier 4: InsightSeniorOffice

| コード | 製品名 | 説明 |
|-------|-------|------|
| ISOF | InsightSeniorOffice | AIアシスタント搭載 — シニア向け統合オフィスツール |

> **考え方**: 全製品コンサルティング案件の一環として提供。ソフトウェア単体ではなく、コンサルフィーと組み合わせて収益化。パートナー（代理店）経由での販売も可能。

### 製品情報の参照

```typescript
import { getSalesChannel, getProductTier } from '@/insight-common/config/pricing';

// 製品の販売チャネルを確認（全製品 consulting）
getSalesChannel('INCA');  // 'consulting'
getSalesChannel('INSS');  // 'consulting'

// 製品のティアを確認
getProductTier('INCA');   // 1
getProductTier('INSS');   // 3
```

**新規製品を追加する場合:**
1. `config/products.ts` に登録
2. `config/pricing.ts` に販売情報を設定
3. `config/sales-strategy.ts` に販売戦略を設定
4. この一覧に追加
5. ライセンス機能マトリクスを定義

## 6. 販売戦略・マーケット展開

### 展開フェーズ

```
Phase 1（現在）   Phase 2（拡大）     Phase 3（成熟）
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  日本市場  │ →  │ 東南アジア    │ →  │ 韓国・その他  │
│  実績構築  │    │ パートナー展開 │    │ パートナー拡大 │
└──────────┘    └──────────────┘    └──────────────┘
```

### 販売戦略（全製品共通）

| 項目 | 内容 |
|------|------|
| **主要市場** | 日本国内（Phase 1） → 東南アジア（Phase 2） → 韓国（Phase 3） |
| **販売方法** | コンサル案件内での直接提案 + パートナー（代理店）経由 |
| **顧客層** | 大手〜中堅企業のIT部門・DX推進部門 |
| **決済** | Stripe（自社サイト）/ 請求書払い |
| **KPI** | 案件あたり単価 × コンサル案件数 × パートナー件数 |

> **ポイント**: 新規マーケティング不要。既存コンサル案件のクライアントへの追加提案が最もROIが高い。パートナー経由で営業範囲を拡大。

**マーケティングチャネル（優先順）:**

| 優先度 | チャネル | 種別 | 対象地域 |
|:------:|---------|------|---------|
| 1 | 既存クライアントアップセル | Direct | 日本 |
| 2 | セミナー・ウェビナー | Direct | 日本・東南アジア |
| 3 | パートナー紹介・共同提案 | Partner | 日本・東南アジア・韓国 |
| 4 | SEO / コンテンツマーケティング | Organic | 全地域 |
| 5 | LinkedIn / SNS | Organic | 全地域 |

```typescript
import { getSalesStrategy, getProductsByRegion } from '@/insight-common/config/sales-strategy';

// 製品の販売戦略を取得
const strategy = getSalesStrategy('INSS');
strategy.targetMarkets;     // Phase別の展開マーケット
strategy.positioning;       // ポジショニング文

// 地域で販売可能な製品を取得
getProductsByRegion('JP');   // 全製品
getProductsByRegion('SEA');  // 全製品
```

## 7. 販売代理店（リセラー）パートナープログラム

### パートナーティア

```
┌──────────────┬───────────────┬───────────────┐
│  Registered  │    Silver     │     Gold      │
│  登録パートナー│  シルバー      │    ゴールド    │
├──────────────┼───────────────┼───────────────┤
│  誰でも参加可 │  実績に基づく   │  上位実績      │
│  非独占       │  非独占        │  地域独占可    │
│  セルフサーブ │  専任担当      │  専任+共同マーケ│
└──────────────┴───────────────┴───────────────┘
```

> 仕入れ値引率・コミッション率はパートナーとの個別協議により決定。

### リセラー対象製品（ティア別）

| 製品 | 最低ティア | デモ | NFR |
|------|:--------:|:----:|:---:|
| INSS / IOSH / IOSD / INPY / ISOF（Tier 3+4） | Registered | 5本 | 2本 |
| INMV / INIG（Tier 2） | Silver | 3本 | 1本 |
| INCA / INBT / IVIN（Tier 1） | Gold | 2本 | 1本 |

> **全製品がパートナー経由で販売可能**。ただし Tier 1 製品はティア制限あり。

### 契約条件

- **契約期間**: 12ヶ月（自動更新）、解約は3ヶ月前通知
- **支払サイト**: 30日
- **顧客所有権**: ライセンス契約はHARMONIC insightが締結。顧客リストは共有。
- **サポート分担**: 1次（操作）=パートナー、2次（バグ・技術）=HARMONIC insight

```typescript
import { getResellerProducts } from '@/insight-common/config/reseller-strategy';

// ティア別の販売可能製品
getResellerProducts('registered');  // ['INSS', 'IOSH', 'IOSD', 'INPY', 'ISOF']
getResellerProducts('silver');      // ['INSS', 'IOSH', 'IOSD', 'INPY', 'ISOF', 'INMV', 'INIG']
getResellerProducts('gold');        // 全製品
```

## 8. ライセンスシステム

### プラン体系（全製品 法人向け — FREE廃止）

| プラン | 説明 | 対象 | 有効期限 |
|-------|------|------|---------|
| TRIAL | 全機能利用可能（評価用） | 評価企業 | 14日間 |
| STD | 法人向け標準機能 | 法人利用 | 365日 |
| PRO | 法人向け全機能（AI月200回・コラボレーション） | 法人・チーム | 365日 |
| ENT | カスタマイズ | 大企業 | 要相談 |

### InsightOfficeSheet (IOSH) 機能マトリクス

> **STD = 基本機能+AI（月50回）**、**PRO = 全機能+AI月200回+コラボレーション**、**ENT = AI無制限**

| 機能 | TRIAL | STD | PRO | ENT |
|------|:-----:|:---:|:---:|:---:|
| Excel読み込み・編集 | ✅ | ✅ | ✅ | ✅ |
| バージョン管理 | ✅ | ✅ | ✅ | ✅ |
| 差分比較 | ✅ | ✅ | ✅ | ✅ |
| セル変更ログ | ✅ | ✅ | ✅ | ✅ |
| エクスポート | ✅ | ✅ | ✅ | ✅ |
| 2ファイル比較 | ✅ | ✅ | ✅ | ✅ |
| 変更者表示 | ✅ | ❌ | ✅ | ✅ |
| 掲示板 | ✅ | ❌ | ✅ | ✅ |
| 付箋 | ✅ | ✅ | ✅ | ✅ |
| AIアシスタント | ✅ | ✅(50回) | ✅(200回) | ✅ |
| AIコードエディター | ✅ | ❌ | ✅(200回) | ✅ |
| Pythonスクリプト | ✅ | ❌ | ✅ | ✅ |
| メッセージ送信 | ✅ | ❌ | ✅ | ✅ |

### InsightOffice AI アシスタント共通仕様

> 詳細は `standards/AI_ASSISTANT.md` を参照

**対象製品**: INSS / IOSH / IOSD（全 InsightOffice 系アプリ）+ INPY / INBT

| 項目 | 仕様 |
|------|------|
| AI プロバイダー | **Claude (Anthropic) API** のみ |
| モデル管理 | `MODEL_REGISTRY` で一元管理（`config/ai-assistant.ts`） |
| モデル選択 | ティアでデフォルト決定 + **ユーザーがティア内で変更可能** |
| Standard ティア | Sonnet 系（デフォルト: 最新 Sonnet） |
| Premium ティア | 全モデル利用可能（デフォルト: 最新 Opus） |
| ライセンス制御 | FREE: 20回 / PRO: 100回 / ENT: 無制限（STD は AI なし） |
| 追加パック | Standard / Premium（価格はパートナーと協議の上決定） |
| 機能キー | `ai_assistant`（products.ts で統一） |

**モデルティア:**

| ティア | デフォルトモデル | 利用可能モデル | 利用条件 |
|--------|----------------|---------------|---------|
| Standard | 最新 Sonnet | Haiku + Sonnet 系 | 基本プラン（FREE/PRO）、Standard アドオン |
| Premium | 最新 Opus | 全モデル | Premium アドオン購入、TRIAL、ENT |

```typescript
import {
  resolveModel,
  getAvailableModelsForTier,
  getBaseSystemPrompt,
  canUseAiAssistant,
  getAiCreditLabel,
  SPREADSHEET_TOOLS,
  MODEL_REGISTRY,
} from '@/insight-common/config/ai-assistant';
import { calculateCreditBalance } from '@/insight-common/config/usage-based-licensing';

// ライセンスチェック
canUseAiAssistant('PRO');   // true
canUseAiAssistant('FREE');  // true（20回制限）
canUseAiAssistant('STD');   // false

// モデル選択 UI: ティアで利用可能なモデル一覧
const models = getAvailableModelsForTier('standard');
// → [Haiku 4.5, Sonnet 4, Sonnet 4.6]

// モデル決定（ユーザー選択を考慮）
const balance = calculateCreditBalance('PRO', 10, addonPacks);
const model = resolveModel(balance.effectiveModelTier, userPreference);
// → ユーザー未選択: 'claude-sonnet-4-6-20260210'（Standard デフォルト）
// → ユーザーが Sonnet 4 を選択: 'claude-sonnet-4-20250514'

// クレジット表示（ユーザー選択モデル名を含む）
getAiCreditLabel(balance, 'ja', userPreference);
// → "AIアシスタント（スタンダード（Sonnet 4.6））— 残り 90回"
```

### ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: INCA-STD-2601-XXXX-XXXX-XXXX
```

### ライセンス画面（必須）

すべての製品で **Insight Slides 形式** のライセンス画面を実装:

```
┌────────────────────────────────────┐
│      Insight Product Name          │  ← Gold色、中央配置
│                                    │
│         現在のプラン                │
│            STD                     │  ← プラン名、大きく表示
│     有効期限: 2027年01月31日        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 機能一覧                      │  │
│  │ • 機能1          ○利用可能   │  │
│  │ • 機能2          ○利用可能   │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ライセンス認証                 │  │
│  │ メールアドレス: [          ]  │  │
│  │ ライセンスキー: [          ]  │  │
│  │ [アクティベート] [クリア]     │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## 9. 統合ライセンスサーバー

### アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│  ライセンスサーバー (Railway + Hono)                               │
│  https://license.harmonicinsight.com                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               統合発行エンジン (Issuance Engine)            │  │
│  │                                                            │  │
│  │   直販            パートナー          システム              │  │
│  │  ┌──────────┐   ┌──────────────┐   ┌──────────────┐       │  │
│  │  │ Stripe   │   │ パートナー   │   │ メール認証   │       │  │
│  │  │ 請求書   │   │ ポータル     │   │ 自動更新     │       │  │
│  │  │          │   │ 経由発行     │   │ バッチ処理   │       │  │
│  │  │          │   │              │   │              │       │  │
│  │  └────┬─────┘   └──────┬───────┘   └──────┬───────┘       │  │
│  │       └────────────────┼──────────────────┘               │  │
│  │                        ▼                                  │  │
│  │           ┌─────────────────────┐                         │  │
│  │           │ 発行 + 監査ログ記録  │                         │  │
│  │           │ 「誰が・いつ・どの   │                         │  │
│  │           │   経路で・誰に」     │                         │  │
│  │           └─────────────────────┘                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DB: Supabase  │  Auth: Firebase  │  Email: Resend              │
│  Payment: Stripe  │  Cron: Railway                              │
└──────────────────────────────────────────────────────────────────┘
```

### 発行チャネル

| チャネル | 説明 | キー種別 | 自動承認 |
|---------|------|---------|:-------:|
| `direct_stripe` | Stripe決済完了 | production | ✅ |
| `direct_invoice` | 請求書払い | production | ❌（管理者承認） |
| `partner_reseller` | パートナー経由 | production | ✅ |
| `partner_referral` | パートナー紹介 | provisional | ✅ |
| `system_trial` | メール認証後自動 | provisional | ✅ |
| `system_renewal` | サブスク自動更新 | production | ✅ |
| `system_nfr` | NFRキー（パートナー用） | nfr | ✅ |
| `system_demo` | デモキー（パートナー用） | demo | ✅ |
| `admin_manual` | 管理者手動発行 | 全種別 | ✅ |

### パートナー発行フロー

```
パートナーポータル → ライセンス発行申請 → 統合発行エンジン
  ↓                                          ↓
顧客メール入力                         licenses テーブル登録
製品・プラン選択                        issuance_logs に記録（発行者 = partner）
  ↓                                    partner_commissions にコミッション計上
発行ボタン                              顧客にメール送信（キー + DLリンク）
```

### DBテーブル構成

| テーブル | 役割 |
|---------|------|
| `partners` | パートナー企業の管理（ティア・NFR残数・APIキー） |
| `registrations` | メール認証〜仮キー〜正式キーの登録プロセス |
| `licenses` | ライセンス本体（`issuer_type`, `partner_id` で発行者追跡） |
| `issuance_logs` | 全発行の監査証跡（誰が・いつ・どのチャネルで） |
| `partner_commissions` | パートナーコミッションの計上・支払管理 |

### 使い方

```typescript
import {
  validateIssuanceRequest,
  getChannelRule,
  canPartnerIssueSpecialKey,
  LICENSE_SERVER_ENDPOINTS,
} from '@/insight-common/config/license-server';

// 発行リクエストのバリデーション
const result = validateIssuanceRequest({
  customerEmail: 'user@example.com',
  customerName: '山田太郎',
  productCode: 'INSS',
  plan: 'STD',
  keyType: 'production',
  channel: 'partner_reseller',
  issuer: { type: 'partner', id: 'partner-123', partnerId: 'partner-123', partnerTier: 'silver' },
  sendEmail: true,
  locale: 'ja',
});

// パートナーのNFRキー発行可否チェック
canPartnerIssueSpecialKey(partner, 'INSS', 'nfr');
// { allowed: true, remaining: 2 }
```

## 10. プロジェクトファイル（独自拡張子 + コンテキストメニュー）

### ファイル関連付け

InsightOffice 各アプリは独自のプロジェクトファイル形式を持つ。
ダブルクリックでアプリが自動起動し、右クリックから「〜で開く」も可能。

| 製品 | 独自拡張子 | 内包形式 | 右クリック対象 |
|------|----------|---------|--------------|
| INSS | `.inss` | .pptx + メタデータ | .pptx, .ppt |
| IOSH | `.iosh` | .xlsx + メタデータ | .xlsx, .xls, .csv |
| IOSD | `.iosd` | .docx + メタデータ | .docx, .doc |

### プロジェクトファイル構造（ZIP 形式）

```
report.iosh
├── document.xlsx          # 元の Office ファイル
├── metadata.json          # バージョン、作成者、最終更新日
├── history/               # バージョン履歴
├── sticky_notes.json      # 付箋データ
├── references/            # 参考資料
├── scripts/               # Python スクリプト
└── ai_chat_history.json   # AI チャット履歴
```

### API

```typescript
import {
  resolveProductByExtension,
  getContextMenuProducts,
  getFileAssociationInfo,
} from '@/insight-common/config/products';

// 独自拡張子 → 製品解決
resolveProductByExtension('iosh');  // 'IOSH'

// コンテキストメニュー対象
getContextMenuProducts('xlsx');  // [{ product: 'IOSH', label: 'InsightOfficeSheet で開く' }]

// インストーラー用ファイル関連付け情報
getFileAssociationInfo('IOSH');
// { progId: 'HarmonicInsight.InsightOfficeSheet', extension: '.iosh', ... }
```

## 11. InsightBot Orchestrator / Agent アーキテクチャ

### 概要

InsightBot を UiPath Orchestrator 相当の中央管理サーバーとして位置付け、
InsightOffice 各アプリ（INSS/IOSH/IOSD）を Agent（実行端末）として
リモート JOB 配信・実行監視を実現する。

```
┌─────────────────────────────────────────────────────────┐
│  InsightBot (Orchestrator) — PRO/ENT                     │
│  ├ JOB 作成・編集（AI エディター）                         │
│  ├ Agent ダッシュボード（登録・状態監視）                   │
│  ├ スケジューラー（cron 相当の定期実行）                    │
│  └ 実行ログ集約                                          │
│                     WebSocket / REST                      │
├──────────────────────┼───────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │  ← InsightOffice│
│  │ IOSH     │  │ INSS     │  │ IOSD     │    + bot_agent │
│  │ 経理PC   │  │ 営業PC   │  │ 法務PC   │    モジュール   │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### UiPath との差別化

UiPath はファイルを「外から」UI オートメーションで操作する。
InsightBot + InsightOffice はドキュメントを「中から」直接操作する。
ファイルロック・UI 遅延の問題がなく、セル・スライド・段落を高速に処理。

### プラン別制限（INBT）

| 機能 | STD | PRO | ENT |
|------|:---:|:---:|:---:|
| Orchestrator | ❌ | ✅ | ✅ |
| Agent 管理数 | - | 50台 | 無制限 |
| スケジューラー | ❌ | ✅ | ✅ |
| 同時 JOB 配信 | - | 10 | 無制限 |
| ログ保持期間 | - | 90日 | 365日 |

### API

```typescript
import {
  canUseOrchestrator,
  canAddAgent,
  ORCHESTRATOR_API,
} from '@/insight-common/config/orchestrator';

// Orchestrator 利用可否
canUseOrchestrator('PRO');  // true
canUseOrchestrator('STD');  // false

// Agent 追加可否
canAddAgent('PRO', 45);     // true（50台まで）
canAddAgent('PRO', 50);     // false（上限到達）

// API エンドポイント
ORCHESTRATOR_API.defaultPort;           // 9400
ORCHESTRATOR_API.endpoints.jobs.dispatch;  // { method: 'POST', path: '/api/jobs/:jobId/dispatch' }
```

### InsightOffice 側（Agent モジュール）

```typescript
// addon-modules.ts の bot_agent モジュールを有効化
// → InsightBot Orchestrator からの JOB 受信が可能に
canEnableModule('IOSH', 'bot_agent', 'PRO', ['python_runtime']);  // { allowed: true }
```

### ワークフロー（バッチ処理 / BPO パターン）

Orchestrator は単一 JOB 配信だけでなく、**複数ファイルの順次処理（ワークフロー）**をサポートする。
BPO（業務プロセス外注）での大量書類作成に対応。

```
ワークフロー実行フロー:
┌─────────────────────────────────────────────────────────┐
│  Orchestrator                                            │
│  ワークフロー定義:                                        │
│    Step 1: 売上.xlsx → 集計スクリプト                      │
│    Step 2: 経費.xlsx → 経費チェックスクリプト               │
│    Step 3: 報告書.docx → レポート生成スクリプト             │
│                                                          │
│  → Agent に一括配信                                      │
├──────────────────────────────────────────────────────────┤
│  Agent (InsightOffice)                                    │
│  Step 1: 売上.xlsx を開く → スクリプト実行 → 保存して閉じる │
│  Step 2: 経費.xlsx を開く → スクリプト実行 → 保存して閉じる │
│  Step 3: 報告書.docx を開く → スクリプト実行 → 保存して閉じる│
│  → 全ステップ完了を Orchestrator に報告                    │
└──────────────────────────────────────────────────────────┘
```

### 利用パターン別機能マトリクス

| パターン | 対象ユーザー | プラン | 機能 |
|---------|------------|--------|------|
| **個人 AI 利用** | 一般ユーザー | STD | AI チャット + 基本機能 |
| **市民開発** | パワーユーザー | PRO | Python + AI エディター + ローカルワークフロー |
| **リモート RPA** | BPO / IT 部門 | PRO/ENT (INBT) | Orchestrator + Agent + スケジューラー |

### ローカルワークフロー（PRO InsightOffice）

PRO の InsightOffice ユーザーは Orchestrator なしで、ローカル PC 上の簡易自動化が可能。

```typescript
import { canEnableModule } from '@/insight-common/config/addon-modules';

// PRO ユーザーはローカルワークフローを有効化可能
canEnableModule('IOSH', 'local_workflow', 'PRO', ['python_runtime', 'python_scripts']);
// { allowed: true }

// STD ユーザーは不可
canEnableModule('IOSH', 'local_workflow', 'STD', ['python_runtime', 'python_scripts']);
// { allowed: false, reasonJa: 'ローカルワークフローには TRIAL/PRO/ENT プランが必要です' }
```

### Orchestrator ワークフロー API

```typescript
import {
  canUseOrchestrator,
  canDispatchJob,
  ORCHESTRATOR_API,
} from '@/insight-common/config/orchestrator';

// ワークフロー作成・配信
ORCHESTRATOR_API.endpoints.workflows.create;    // POST /api/workflows
ORCHESTRATOR_API.endpoints.workflows.dispatch;   // POST /api/workflows/:workflowId/dispatch
ORCHESTRATOR_API.endpoints.workflows.executions; // GET  /api/workflows/:workflowId/executions
```

## 12. 開発完了チェックリスト

- [ ] **デザイン**: Gold (#B8942F) がプライマリに使用されている
- [ ] **デザイン**: Ivory (#FAF8F5) が背景に使用されている
- [ ] **デザイン**: 青色がプライマリとして使用されて**いない**
- [ ] **ライセンス**: InsightLicenseManager が実装されている
- [ ] **ライセンス**: ライセンス画面が Insight Slides 形式に準拠
- [ ] **サードパーティ**: Syncfusion キーが `third-party-licenses.json` 経由で登録されている
- [ ] **製品コード**: config/products.ts に登録されている
- [ ] **AI アシスタント**: `standards/AI_ASSISTANT.md` に準拠（InsightOffice 系のみ）
- [ ] **AI アシスタント**: モデルティア（Standard/Premium）制御が実装されている
- [ ] **AI アシスタント**: ライセンスゲート（TRIAL/STD/PRO/ENT — STD: 月50回 / PRO: 月200回）が実装されている
- [ ] **プロジェクトファイル**: 独自拡張子（.inss/.iosh/.iosd）がインストーラーで登録されている
- [ ] **プロジェクトファイル**: コマンドライン引数でファイルパスを受け取る起動処理が実装されている
- [ ] **Orchestrator**: InsightBot PRO+ で Agent 管理 UI が実装されている（INBT のみ）
- [ ] **ワークフロー**: BPO パターン（Orchestrator → Agent 連続ファイル処理）が動作する（INBT PRO+ のみ）
- [ ] **ローカルワークフロー**: PRO InsightOffice でローカル連続処理が動作する（PRO+ のみ）
- [ ] **ローカライゼーション**: UI テキストがハードコードされて**いない**（リソースファイル経由）
- [ ] **ローカライゼーション**: 日本語（デフォルト）+ 英語の翻訳が完全に用意されている
- [ ] **ローカライゼーション**: ストアメタデータ（タイトル・説明）が日英で用意されている（モバイルアプリのみ）
- [ ] **検証**: `validate-standards.sh` が成功する
- [ ] **バージョン**: `config/app-versions.ts` のバージョン・ビルド番号が更新されている
- [ ] **互換性**: `compatibility/` の NG 組み合わせに該当していない

## 13. リリースチェック

> **リリース前に必ず実行。** 詳細は `standards/RELEASE_CHECKLIST.md` を参照。

### リリースチェックの実行

```bash
# 自動スクリプト（標準検証 + リリース固有チェック）
./insight-common/scripts/release-check.sh <project-directory>

# Claude Code スキル（対話的にチェック + 修正案提示）
/release-check <project-directory>
```

### リリース前チェックリスト

#### 全プラットフォーム共通
- [ ] **バージョン**: バージョン番号が更新されている
- [ ] **コード品質**: TODO/FIXME/HACK が残っていない
- [ ] **コード品質**: デバッグ出力（console.log / print / Log.d）が残っていない
- [ ] **セキュリティ**: ハードコードされた API キー・シークレットがない
- [ ] **セキュリティ**: .env / credentials が .gitignore に含まれている
- [ ] **ローカライゼーション**: 日本語 + 英語リソースのキーが完全一致
- [ ] **Git**: 未コミットの変更がない
- [ ] **検証**: `release-check.sh` が成功する

#### Android 固有（Native Kotlin）
- [ ] **バージョン**: `versionCode` がインクリメントされている
- [ ] **バージョン**: `versionName` が更新されている
- [ ] **署名**: `signingConfigs` が設定されている
- [ ] **署名**: keystore がリポジトリに含まれて**いない**
- [ ] **ストア**: Play Store メタデータ（タイトル・説明・リリースノート）が日英で作成済み
- [ ] **ストア**: 文字数制限を超えていない（title:30, short:80, full:4000, changelog:500）
- [ ] **ストア**: スクリーンショットが日英で用意されている
- [ ] **ビルド**: Release AAB/APK がビルドできる

#### Android 固有（Expo / React Native）
- [ ] **バージョン**: `app.json` の `version` + `android.versionCode` が更新されている
- [ ] **EAS**: `eas.json` の `production` プロファイルが `app-bundle` ビルド
- [ ] **ビルド**: `eas build --platform android --profile production` が成功する

#### iOS 固有
- [ ] **バージョン**: Bundle Version がインクリメントされている
- [ ] **ストア**: App Store メタデータが日英で作成済み
- [ ] **ビルド**: Archive ビルドが成功する

#### C# (WPF) 固有
- [ ] **バージョン**: AssemblyVersion / FileVersion が更新されている
- [ ] **サードパーティ**: Syncfusion キーがハードコードされて**いない**
- [ ] **配布**: インストーラーの動作確認（クリーン環境）
- [ ] **ファイル関連付け**: 独自拡張子の登録・動作確認

#### React / Next.js 固有
- [ ] **ビルド**: `next build` が成功する
- [ ] **品質**: TypeScript strict mode が有効
- [ ] **品質**: console.log が残っていない
- [ ] **環境**: 本番環境変数が設定されている

#### Python 固有
- [ ] **バージョン**: pyproject.toml のバージョンが更新されている
- [ ] **依存**: 全パッケージがピン留め（`==`）されている

## 14. アプリバージョン管理

### バージョンレジストリ

全製品のバージョン・ビルド番号は `config/app-versions.ts` で一元管理しています。

```typescript
import { getAppVersion, getBuildNumber, toAndroidVersionCode, toIosBundleVersion } from '@/insight-common/config/app-versions';

// バージョン取得
getAppVersion('INSS');        // '2.1.0'
getBuildNumber('INSS');       // 45

// プラットフォーム固有の形式
toAndroidVersionCode('INSS'); // 2001045
toIosBundleVersion('INSS');   // '2.1.0.45'
```

### バージョン更新手順

1. `config/app-versions.ts` の該当製品の `version` / `buildNumber` を更新
2. `releaseHistory` に新エントリを追加
3. `toolchain` がアプリの実際のツールチェーンと一致することを確認
4. `validate-standards.sh` で検証

## 15. ライブラリ互換性マトリクス

### 概要

`compatibility/` ディレクトリでプラットフォーム別のツールチェーン・ライブラリ互換性を管理しています。
バージョンアップ時の衝突（NG 組み合わせ）を事前に検知するための知識ベースです。

```
compatibility/
├── index.ts            # 統合エントリポイント
├── android-matrix.ts   # Android: AGP/Gradle/Kotlin/Compose/ライブラリ
└── ios-matrix.ts       # iOS: Xcode/Swift/ライブラリ
```

### Android の主要 NG 組み合わせ

| 組み合わせ | 問題 | 深刻度 |
|-----------|------|:------:|
| AGP 9.0 + Gradle 8.x | ビルド失敗 | critical |
| AGP 9.0 + KSP1 | 非互換 | critical |
| Kotlin 2.0+ + 旧 composeOptions | ビルド失敗 | critical |
| KSP1 + Kotlin 2.3+ | 非互換 | critical |
| Firebase BOM 34.x + firebase-*-ktx | artifact 削除済み | high |
| Dagger 2.57+ + Gradle ≤8.10.2 | 互換性問題 | high |
| Ktor 3.2.0 + minSdk <30 | D8 互換性問題 | high |

### iOS の主要 NG 組み合わせ

| 組み合わせ | 問題 | 深刻度 |
|-----------|------|:------:|
| Xcode 26 + macOS <15.6 | 起動不可 | critical |
| macOS Tahoe + Xcode ≤16.3 | 動作不可 | critical |
| Swift 6.1 OSS + Xcode 26 | Foundation ビルド失敗 | critical |
| Alamofire 5.11 + Xcode <16.0 | Swift 6.0 必須 | critical |
| Swift 6 mode + 未対応ライブラリ | 大量の concurrency エラー | high |
| Realm <10.54 + Xcode 26 | コンパイル不可 | high |

### 推奨プロファイル

```typescript
import { getRecommendedProfile, getRecommendedIosProfile } from '@/insight-common/compatibility';

// Android
const androidProfile = getRecommendedProfile('stable');
// → { agp: '8.9.0', gradle: '8.11.1', kotlin: '2.2.20', ... }

// iOS
const iosProfile = getRecommendedIosProfile('cutting_edge');
// → { xcode: '26.2', swift: '6.2.3', deploymentTarget: 'iOS 17.0', ... }
```

### App Store / Google Play 期限

| プラットフォーム | 期限 | 要件 |
|----------------|------|------|
| **Google Play** | 2026-08-31 | targetSdk 36 (Android 16) |
| **App Store** | 2026-04-28 | Xcode 26 / iOS 26 SDK |

### 互換性マトリクスの更新

- 主要ライブラリのリリース時に `compatibility/*.ts` を更新
- `ANDROID_LIBRARIES` / `IOS_LIBRARIES` の `lastVerified` 日付を確認
- 新たな NG 組み合わせを発見したら `*_CONFLICT_RULES` に追加

## 16. 困ったときは

```bash
# 標準検証
./insight-common/scripts/validate-standards.sh .

# リリースチェック（包括的）
./insight-common/scripts/release-check.sh .

# セットアップ確認
./insight-common/scripts/check-app.sh

# プラットフォーム別ガイド参照
cat insight-common/standards/CSHARP_WPF.md  # C#
cat insight-common/standards/PYTHON.md      # Python
cat insight-common/standards/REACT.md       # React
cat insight-common/standards/ANDROID.md     # Android
cat insight-common/standards/IOS.md         # iOS

# リリースチェックリスト
cat insight-common/standards/RELEASE_CHECKLIST.md
```

---

**⚠️ このガイドに従わないコードはレビューで却下されます。**
**⚠️ AI アシスタントは、このガイドを確認せずにコードを生成してはいけません。**
**⚠️ リリース前に `/release-check` を実行せずにリリースしてはいけません。**
