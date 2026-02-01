# Harmonic Insight - 開発標準ガイド

> **重要**: このドキュメントは新規アプリ作成時・コード修正時に**必ず**参照してください。

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

### 検証スクリプト

```bash
./scripts/validate-standards.sh <project-directory>
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
│  ├── config/         # 製品・価格・販売戦略・リセラー        │
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
curl -sL https://raw.githubusercontent.com/HarmonicInsight/insight-common/main/scripts/init-app.sh | bash -s -- <app-name>

# または既存リポジトリに追加
git submodule add https://github.com/HarmonicInsight/insight-common.git
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
    "usedBy": ["HMSH", "HMDC", "HMSL"]
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
| サードパーティキーを各アプリに直書き | `config/third-party-licenses.json` で共通管理 |
| クライアントで権限判定 | `withGateway({ requiredPlan: [...] })` |
| 独自の認証実装 | `infrastructure/auth/` を使用 |

## 5. 製品コード一覧・価格戦略

### 販売チャネルと価格帯

```
┌──────────────────────────────────────────────────────────────────────┐
│  【A】コンサルティング連動型      年額 98万円〜398万円              │
│  コンサル案件（数千万円規模）の一環として提供。少量・高単価。       │
│  INCA / INBT / FGIN / INMV / INIG                                  │
├──────────────────────────────────────────────────────────────────────┤
│  【B】グローバルスタンドアロン型   年額 49,800円〜148,000円         │
│  Office系汎用ツール。5〜10万円帯でグローバルに大量販売。            │
│  INSS / INSP / INPY / HMSH / HMDC / HMSL                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 【A】コンサルティング連動型

| コード | 製品名 | 説明 | STD（税抜/年） | PRO（税抜/年） | ENT |
|-------|-------|------|---------------|---------------|-----|
| INCA | InsightNoCodeAnalyzer | RPA・ローコード解析・移行アセスメント | ¥1,980,000 | ¥3,980,000 | 個別見積 |
| INBT | InsightBot | Python RPA自動化ボット | ¥1,480,000 | ¥2,980,000 | 個別見積 |
| FGIN | ForguncyInsight | Forguncy連携 | ¥1,480,000 | ¥2,980,000 | 個別見積 |
| INMV | InsightMovie | 画像・PPTから動画作成 | ¥1,480,000 | ¥2,980,000 | 個別見積 |
| INIG | InsightImageGen | AI画像・音声生成 | ¥980,000 | ¥1,980,000 | 個別見積 |

> **考え方**: コンサルティング開発案件（数千万円規模）の中で使用するツール。ソフトウェア単体ではなく、コンサルフィーと組み合わせて収益化。大量販売は不要。

### 【B】グローバルスタンドアロン型

| コード | 製品名 | 説明 | FREE | STD（税抜/年） | PRO（税抜/年） | USD STD | USD PRO |
|-------|-------|------|------|---------------|---------------|---------|---------|
| INSS | InsightSlide | PowerPointコンテンツ抽出・更新 | ✅ | ¥49,800 | ¥98,000 | $330 | $650 |
| INSP | InsightSlide Pro | プロ向けPowerPointツール | — | ¥79,800 | ¥148,000 | $530 | $980 |
| INPY | InsightPy | Windows自動化Python実行環境 | ✅ | ¥49,800 | ¥98,000 | $330 | $650 |
| HMSH | HarmonicSheet | Excelバージョン管理・チームコラボ | — | ¥59,800 | ¥118,000 | $400 | $780 |
| HMDC | HarmonicDoc | Wordドキュメント操作・自動化 | ✅ | ¥49,800 | ¥98,000 | $330 | $650 |
| HMSL | HarmonicSlide | PowerPoint操作・自動化 | ✅ | ¥49,800 | ¥98,000 | $330 | $650 |

> **考え方**: Office系の汎用ツールとして単独でグローバル展開。5〜10万円帯で大量販売を目指す。全製品1ヶ月の無料トライアルあり。

### 価格定義ファイル

```typescript
import { getPrice, getSalesChannel } from '@/insight-common/config/pricing';

// 製品の販売チャネルを確認
getSalesChannel('INCA');  // 'consulting'
getSalesChannel('INSS');  // 'standalone'

// 価格を取得
getPrice('INSS', 'STD');  // { annualPrice: 49800, currency: 'JPY', monthlyEquivalent: 4150 }
getPrice('INCA', 'PRO');  // { annualPrice: 3980000, currency: 'JPY', monthlyEquivalent: 331667 }
```

**新規製品を追加する場合:**
1. `config/products.ts` に登録
2. `config/pricing.ts` に価格を設定
3. `config/sales-strategy.ts` に販売戦略を設定
4. この一覧に追加
5. ライセンス機能マトリクスを定義

## 6. 販売戦略・マーケット展開

### 展開フェーズ

```
Phase 1（現在）   Phase 2（拡大）     Phase 3（成熟）
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  日本市場  │ →  │ 北米・欧州    │ →  │ 韓国・東南ア  │
│  実績構築  │    │ グローバル展開 │    │ リセラー展開  │
└──────────┘    └──────────────┘    └──────────────┘
```

### 【A】コンサルティング連動型の販売戦略

| 項目 | 内容 |
|------|------|
| **主要市場** | 日本国内（Phase 1） → 東南アジア（Phase 2） |
| **販売方法** | コンサル案件内での直接提案（営業コスト最小） |
| **顧客層** | 大手〜中堅企業のIT部門・DX推進部門 |
| **決済** | Stripe（自社サイト）/ 請求書払い |
| **KPI** | 案件あたり単価 × コンサル案件数 |

> **ポイント**: 新規マーケティング不要。既存コンサル案件のクライアントへの追加提案が最もROIが高い。

### 【B】グローバルスタンドアロン型の販売戦略

| 項目 | 内容 |
|------|------|
| **主要市場** | 日本 → 北米・欧州 → 韓国・東南アジア |
| **販売方法** | 自社サイト + Paddle（MoR） + Microsoft Store |
| **顧客層** | Office業務ユーザー（個人〜中小企業） |
| **決済** | Paddle（グローバル税務代行） / Microsoft Store |
| **KPI** | MRR / ARR / トライアル転換率 / チャーンレート / LTV |

**マーケティングチャネル（優先順）:**

| 優先度 | チャネル | 種別 | 対象地域 |
|:------:|---------|------|---------|
| 1 | SEO / コンテンツマーケティング | Organic | 全地域 |
| 2 | YouTube 製品デモ | Organic | 日本・北米 |
| 3 | Product Hunt / Hacker News | Organic | 北米 |
| 4 | Microsoft Store | Organic | 北米・欧州 |
| 5 | Google Ads（検索連動） | Paid | 日本・北米 |
| 6 | SNS（X / LinkedIn） | Organic | 全地域 |
| 7 | リセラー・VAR | Partner | 日本・韓国・東南アジア |

**決済プラットフォーム:**

| プラットフォーム | 役割 | 手数料 | MoR | 備考 |
|----------------|------|:------:|:---:|------|
| Paddle | グローバル主力 | ~5% | ✅ | VAT/消費税の申告・納付を代行 |
| Microsoft Store | Windows流入 | ~12% | ✅ | デスクトップアプリの自然流入 |
| Stripe | 日本国内 | ~3.6% | — | 自社サイト決済・コンサル連動型 |

> **全製品共通**: 1ヶ月の無料トライアル、クレジットカード不要で開始可能。

```typescript
import { getSalesStrategy, getProductsByRegion } from '@/insight-common/config/sales-strategy';

// 製品の販売戦略を取得
const strategy = getSalesStrategy('INSS');
strategy.targetMarkets;     // Phase別の展開マーケット
strategy.positioning;       // 'PowerPointのコンテンツ抽出・一括更新を自動化...'

// 地域で販売可能な製品を取得
getProductsByRegion('US');   // ['INSS', 'INSP', 'INPY', 'HMSH', 'HMDC', 'HMSL']
getProductsByRegion('JP');   // 全製品
```

## 7. 販売代理店（リセラー）パートナープログラム

### パートナーティア

```
┌──────────────┬───────────────┬───────────────┐
│  Registered  │    Silver     │     Gold      │
│  登録パートナー│  シルバー      │    ゴールド    │
├──────────────┼───────────────┼───────────────┤
│  誰でも参加可 │  年間5件以上   │  年間20件以上  │
│  仕入値引 20% │  仕入値引 30%  │  仕入値引 40% │
│  非独占       │  非独占        │  地域独占可    │
│  セルフサーブ │  専任担当      │  専任+共同マーケ│
└──────────────┴───────────────┴───────────────┘
```

### コミッション構造（仕入れ値引きモデル）

| ティア | 仕入れ値引き | 初年度コミッション | 更新コミッション | 紹介のみ |
|:------:|:----------:|:----------------:|:--------------:|:-------:|
| Registered | 20% | 20% | 10% | 15% |
| Silver | 30% | 30% | 15% | 20% |
| Gold | 40% | 40% | 20% | 25% |

### リセラー対象製品

| 製品 | リセラー販売 | 最低販売価格 | デモ | NFR |
|------|:----------:|:----------:|:----:|:---:|
| INSS / INSP / INPY | ✅ | 定価の80%以上 | 5本 | 2本 |
| HMSH / HMDC / HMSL | ✅ | 定価の80%以上 | 5本 | 2本 |
| INCA / INBT / FGIN / INMV / INIG | ❌ | — | — | — |

> **コンサル連動型はリセラー販売不可**（自社コンサル案件と一体のため）。

### 契約条件

- **契約期間**: 12ヶ月（自動更新）、解約は3ヶ月前通知
- **支払サイト**: 30日
- **初年度ノルマ**: なし（2年目以降、ティア維持には最低件数が必要）
- **顧客所有権**: ライセンス契約はHarmonic Insightが締結。顧客リストは共有。
- **サポート分担**: 1次（操作）=パートナー、2次（バグ・技術）=Harmonic Insight

```typescript
import { calculateWholesalePrice, getResellerProducts } from '@/insight-common/config/reseller-strategy';

// リセラー販売可能な製品
getResellerProducts();  // ['INSS', 'INSP', 'INPY', 'HMSH', 'HMDC', 'HMSL']

// Silver パートナーがINSS STD（¥49,800）を販売した場合
calculateWholesalePrice(49800, 'silver');
// { wholesalePrice: 34860, partnerProfit: 14940, discount: 0.30 }
```

## 8. ライセンスシステム

### プラン体系

| プラン | 説明 | 対象 | 有効期限 |
|-------|------|------|---------|
| FREE | 機能制限あり（※HMSHでは廃止、デフォルト=TRIAL） | — | 無期限 |
| TRIAL | 全機能利用可能（評価用） | 評価ユーザー | 1ヶ月 |
| STD | 標準機能（コラボレーション機能を除く） | 個人利用 | 12ヶ月 |
| PRO | 全機能（コラボレーション含む） | 法人・チーム | 12ヶ月 |
| ENT | カスタマイズ | 企業 | 要相談 |

### HarmonicSheet (HMSH) 機能マトリクス

> **STD = 個人利用**（1人で数値を算出）、**PRO = 法人・チーム利用**（コラボレーション）

| 機能 | TRIAL | STD | PRO | ENT |
|------|:-----:|:---:|:---:|:---:|
| Excel読み込み・編集 | ✅ | ✅ | ✅ | ✅ |
| バージョン管理 | ✅ | ✅ | ✅ | ✅ |
| 差分比較 | ✅ | ✅ | ✅ | ✅ |
| セル変更ログ | ✅ | ✅ | ✅ | ✅ |
| エクスポート | ✅ | ✅ | ✅ | ✅ |
| 変更者表示 | ✅ | ❌ | ✅ | ✅ |
| 掲示板 | ✅ | ❌ | ✅ | ✅ |
| AIアシスタント | ✅ | ❌ | ✅ | ✅ |
| メッセージ送信 | ✅ | ❌ | ✅ | ✅ |

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

## 9. 開発完了チェックリスト

- [ ] **デザイン**: Gold (#B8942F) がプライマリに使用されている
- [ ] **デザイン**: Ivory (#FAF8F5) が背景に使用されている
- [ ] **デザイン**: 青色がプライマリとして使用されて**いない**
- [ ] **ライセンス**: InsightLicenseManager が実装されている
- [ ] **ライセンス**: ライセンス画面が Insight Slides 形式に準拠
- [ ] **サードパーティ**: Syncfusion キーが `third-party-licenses.json` 経由で登録されている
- [ ] **製品コード**: config/products.ts に登録されている
- [ ] **検証**: `validate-standards.sh` が成功する

## 10. 困ったときは

```bash
# 標準検証
./insight-common/scripts/validate-standards.sh .

# セットアップ確認
./insight-common/scripts/check-app.sh

# プラットフォーム別ガイド参照
cat insight-common/standards/CSHARP_WPF.md  # C#
cat insight-common/standards/PYTHON.md      # Python
cat insight-common/standards/REACT.md       # React
```

---

**⚠️ このガイドに従わないコードはレビューで却下されます。**
**⚠️ AI アシスタントは、このガイドを確認せずにコードを生成してはいけません。**
