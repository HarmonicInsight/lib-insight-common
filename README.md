# insight-common

Insight Series製品群の共通リソースを一元管理するリポジトリです。

## 概要

このリポジトリは、9つのアプリケーションで構成されるInsight Series全体で共有するリソースを管理します。

## ディレクトリ構成

```
insight-common/
├── license/           # ライセンス管理モジュール
│   ├── typescript/    # TypeScript版(Tauri/React製品用)
│   ├── python/        # Python版(InsightPy等用)
│   └── README.md      # ライセンス仕様ドキュメント
├── i18n/              # 多言語リソース
│   ├── ja.json        # 日本語
│   ├── en.json        # 英語
│   ├── index.ts       # TypeScript用ヘルパー
│   ├── __init__.py    # Python用ヘルパー
│   └── README.md
├── utils/             # 共通ユーティリティ
│   ├── typescript/    # TypeScript版
│   ├── python/        # Python版
│   └── README.md
├── errors/            # 共通エラー定義
│   ├── index.ts       # TypeScript版
│   ├── __init__.py    # Python版
│   └── README.md
├── brand/             # ブランド・デザインシステム
│   ├── colors.json         # カラーパレット
│   ├── design-system.json  # タイポグラフィ・スペーシング等
│   └── voice-guidelines.md # トーン＆マナー
├── ui/                # UI共通定義
│   ├── menu-structure.json # メニュー・ナビゲーション
│   ├── components.md       # コンポーネント設計
│   └── README.md
├── legal/             # 法務書類
│   ├── terms-of-service.md
│   └── privacy-policy.md
├── company/           # 会社情報
│   ├── about.md
│   └── contact.json
├── config/            # 共通設定
│   └── products.json  # 製品定義・機能フラグ
├── docs/              # ドキュメント
│   ├── prompts/       # 各製品向け統合プロンプト
│   ├── QUICKSTART.md
│   └── INTEGRATION_GUIDE.md
└── README.md
```

## 製品一覧

> **全製品 法人向け（B2B）。** コンサルティング案件の一環として提供。価格は個別見積もり。

### 製品名クイックリファレンス

| コード | 製品名 | 一言説明 | 技術 | 状態 |
|:------:|-------|---------|------|:----:|
| INSS | **Insight Deck Quality Gate** | AI駆動プレゼン品質管理 | C# WPF | 安定版 |
| IOSH | **Insight Performance Management** | AI搭載 経営数値管理・財務分析 | C# WPF | 安定版 |
| IOSD | **Insight AI Briefcase** | AI搭載 業務文書一括管理ブリーフケース | C# WPF | 開発中 |
| INPY | **InsightPy** | AIエディタ搭載 Python実行基盤 | C# WPF | 開発中 |
| ISOF | **Insight Senior Office** | シニア向け統合オフィス | C# WPF | 安定版 |
| INBT | **InsightBot** | AIエディタ搭載 業務最適化RPA | C# WPF | 開発中 |
| INCA | **InsightNoCodeAnalyzer** | RPA・ローコード移行自動化 | Tauri | 開発中 |
| IVIN | **InterviewInsight** | 自動ヒアリング・業務調査支援 | Tauri | 開発中 |
| INMV | **InsightCast** | 画像・テキストから動画自動作成 | Python | 開発中 |
| INIG | **InsightImageGen** | 業務資料向けAI画像大量生成 | Python | 開発中 |

---

### Tier 1: 業務変革ツール

#### INBT — InsightBot

> AIエディタ搭載 — 業務最適化RPA + Orchestrator

搭載のAIエディタが、ボットのスクリプトを自動生成。生成したPythonをボット化し、開発したボットをビジュアルにJOB化して業務を自動化。AIによるボット作成からビジュアルなJOB設計まで、業務プロセス自動化のデリバリーを効率化します。

| 特徴 | 説明 |
|------|------|
| AIエディタ | 自然言語の指示からボットスクリプトを自動生成 |
| Python→ボット変換 | 生成したPythonコードをそのまま本番ボットに |
| ビジュアルJOB設計 | ドラッグ&ドロップでワークフローを構築 |
| Web・デスクトップ自動化 | ブラウザ操作からデスクトップ操作まで対応 |
| スケジュール・トリガー実行 | 定時実行やイベント駆動の自動実行 |
| Orchestrator | Agent集中管理・JOB配信・実行監視（PRO+） |

**リポジトリ**: `win-app-insight-bot` / **技術**: C# WPF (.NET 8.0) / **カラーテーマ**: Cool Blue & Slate

---

#### INCA — InsightNoCodeAnalyzer

> RPA・ローコードのマイグレーション自動化ツール

AIが各ローコードプラットフォームの仕組みを解析、ロジックの複雑性分析による見積もり、移行方針提案から、プロセスの自動変換作業まで対応します。

| 特徴 | 説明 |
|------|------|
| 元ロジック複雑性分析 | 既存RPA・ローコードのロジックを自動解析 |
| 移行工数の自動見積もり | 複雑度に基づく工数・コストの自動算出 |
| 移行方針の提案生成 | クライアント意思決定向けレポート |
| プラットフォーム間自動変換 | BizRobo → akaBot 等の自動変換 |
| リスク・依存関係マッピング | 移行リスクの可視化 |
| 詳細な移行ロードマップ | ステップバイステップの移行計画 |

**リポジトリ**: `win-app-nocode-analyzer` / **技術**: Tauri (Rust + TypeScript) / **カラーテーマ**: Cool Blue & Slate

---

#### IVIN — InterviewInsight

> 自動ヒアリング・業務調査支援

業務調査や要件定義時のインタビューを完全自動化。ユーザーは事前に設定されたインタビューシートに音声で回答し、リアルタイムにテキスト化されて回答が登録されます。回答はAIにより問題点・課題・懸念点、タスク、完了事項などに要約・分類されます。

| 特徴 | 説明 |
|------|------|
| インタビューシートテンプレート | 事前設定可能な質問項目 |
| 音声→テキスト変換 | リアルタイム文字起こし |
| 回答の自動登録 | 音声回答をそのままデータ化 |
| AIによる回答要約 | 回答内容の自動サマリー |
| 課題・タスク自動分類 | 問題点・懸念点・タスク・完了事項に分類 |
| インサイト抽出 | アクションにつながる示唆の自動抽出 |

**リポジトリ**: `web-app-auto-interview` / **技術**: Tauri (Rust + TypeScript) / **カラーテーマ**: Cool Blue & Slate

---

### Tier 2: AI活用ツール

#### INMV — InsightCast

> 画像とテキストから動画を自動作成

画像に説明用のテキストを入力するだけで、自動で音声化して動画を作成。PowerPointの資料をスライド画像に変換し、スピーチノートを音声化して自動で動画を作成する機能も搭載。プレゼンテーションの準備やレビューの効率が格段に向上します。

| 特徴 | 説明 |
|------|------|
| 画像＋テキスト→動画 | テキストから自動音声変換して動画生成 |
| PowerPoint→動画 | スライドとスピーチノートから自動動画化 |
| 字幕 | フォント・色・位置のカスタマイズ対応（PRO+） |
| トランジション | シーン間のトランジション効果（PRO+） |
| PPTX取込 | PowerPointファイルからの素材取込（PRO+） |
| マルチフォーマット出力 | 複数の動画形式で書き出し |

**リポジトリ**: `win-app-insight-cast` / **技術**: Python (CustomTkinter) / **カラーテーマ**: Ivory & Gold

---

#### INIG — InsightImageGen

> 業務資料向けAI画像の大量自動生成ツール

AI画像生成は同じプロンプトでも思い通りの結果になることは稀で、何十回も何百回もの試行錯誤が欠かせません。InsightImageGenはJSONにプロンプトを記述し、何十枚も何百枚もの画像を自動で大量生成。作成した画像は管理ツールで一覧確認でき、不要な画像の削除も簡単に行えます。

| 特徴 | 説明 |
|------|------|
| JSONバッチ定義 | プロンプトをJSONで一括管理 |
| 大量自動生成 | 数十〜数百枚を自動バッチ生成 |
| 画像管理ツール | 生成画像の一覧確認・比較・削除 |
| Stable Diffusion | ローカルSD統合で画像生成 |
| VOICEVOX音声生成 | テキストからの音声ファイル生成 |
| 4K高解像度出力 | 高解像度画像の生成（PRO+） |

**リポジトリ**: `win-app-insight-image-gen` / **技術**: Python (CustomTkinter) / **カラーテーマ**: Ivory & Gold

---

### Tier 3: Insight Business Suite（導入ツール群）

> Insight Business Suite は共通で **新規ドキュメント作成（MS Office 不要）**、AIアシスタント（Claude API）、参考資料、ドキュメント評価、音声入力、VRMアバター（PRO+）を搭載。
> Syncfusion で Office 互換ファイル（.xlsx / .docx / .pptx）を直接生成するため、MS Office を購入せずにドキュメントの作成・編集・保存がすべて完結します。

#### INSS — Insight Deck Quality Gate

> AI駆動プレゼン品質管理 — スライドデッキのレビュー・抽出・自動化

スライドデッキのレビュー・抽出・自動化を実現するAI駆動プレゼン品質管理ツール。PowerPointのテキストを全て抽出し、Excelへのエクスポートで効率的な一括編集が可能。搭載のAIアシスタントが論理的一貫性・データ正確性・メッセージの明確さをチェックし、クライアント納品前のクオリティゲートとして機能します。

| 特徴 | 説明 |
|------|------|
| AI品質ゲート | 納品前のプレゼン内容を自動レビュー |
| 全テキスト抽出 | PowerPointからテキストを一括抽出 |
| Excel一括編集 | 抽出テキストをExcelで構造化レビュー |
| 整合性自動チェック | スライド横断の一貫性・正確性検証 |
| 誤字・用語検証 | 誤字検出・用語統一・構成分析 |
| 多言語翻訳ワークフロー | Excel経由の翻訳作業効率化 |

**リポジトリ**: `win-app-insight-slide` / **技術**: C# WPF (.NET 8.0) + Syncfusion / **プロジェクトファイル**: `.inss`

---

#### IOSH — Insight Performance Management

> AI搭載 ビジネスパフォーマンス管理 — 経営指標の追跡・分析・最適化

Excelベースの財務ワークフローを強力なパフォーマンス管理プラットフォームに変革します。KPI、予算、財務モデルにAI分析を適用し、計算式の検証、異常値の検出、実用的なインサイトの提供を実現。バージョン管理されたスプレッドシートで予実管理を行い、クラウド不要で共有サーバー上のコラボレーションを実現します。

| 特徴 | 説明 |
|------|------|
| AI搭載KPI追跡 | 経営指標の異常値検出・トレンド分析 |
| 予実管理ダッシュボード | 予算対実績パフォーマンス比較 |
| 財務モデル検証 | 計算式チェック・エラー防止 |
| バージョン管理 | セル単位の変更履歴付きスプレッドシート |
| チームコラボレーション | 共有サーバーでの共同作業（クラウド不要） |
| 経営レポーティング | AIインサイト付き経営レポート自動生成 |

**リポジトリ**: `win-app-insight-sheet` / **技術**: C# WPF (.NET 8.0) + Syncfusion / **プロジェクトファイル**: `.iosh`

---

#### IOSD — Insight AI Briefcase

> AI搭載 ビジネス文書ブリーフケース — インテリジェントな整理・管理・作成

ビジネス文書のためのAI搭載ブリーフケース。契約書、提案書、報告書、参考資料を1つの管理されたワークスペースに集約します。ソース文書を登録すると、AIアシスタントがそれらを相互参照して新しいコンテンツの起草、既存ファイルの要約、ドキュメントポートフォリオに関する質問への回答を行います。

| 特徴 | 説明 |
|------|------|
| AI文書ブリーフケース | 契約書・提案書・報告書を1ワークスペースで管理 |
| 相互参照AIアシスト起草 | 登録資料を参照してAIが新規コンテンツを起草 |
| バージョン履歴 | すべての改訂を安全に保持 |
| ドキュメントQ&A | ポートフォリオ全体に対する質問回答 |
| AI要約・コンテンツ生成 | ソース資料からの自動要約・文書生成 |
| マルチフォーマット出力 | PDF・Word等への変換エクスポート |

**リポジトリ**: `win-app-insight-doc` / **技術**: C# WPF (.NET 8.0) + Syncfusion / **プロジェクトファイル**: `.iosd`

---

#### INPY — InsightPy

> AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤

手間のかかるPython実行環境なしでPythonの実行が可能に。搭載のAIエディタに欲しい機能を日本語で指示するだけでPythonコードを自動生成 — プログラミング知識がなくても業務ツールを作成できます。

| 特徴 | 説明 |
|------|------|
| AIエディタ | 日本語で指示するだけでPythonコードを自動生成 |
| 環境構築不要 | Python実行環境のセットアップが不要 |
| 構文チェック・即時テスト | コード検証とワンクリック実行 |
| クライアント端末自動化 | 業務PCの作業を自動化 |
| 民主化開発 | 非エンジニアでも業務ツールを作成可能 |
| クラウド同期 | スクリプトの同期管理（PRO+） |

**リポジトリ**: `win-app-insight-py` / **技術**: C# WPF (.NET 8.0)

---

### Tier 4: 社会貢献ツール

#### ISOF — Insight Senior Office

> シニア向けシンプルオフィス — 文書・表計算・メールを1つに

80代以上の高齢者も迷わず使えるオフィスアプリ。Microsoft Officeのライセンスは不要です。大きな文字とボタンで見やすく押しやすい。話すだけで文字入力、文書やメールの読み上げ、「A2に1万円入れて」などの自然言語操作に対応。

| 特徴 | 説明 |
|------|------|
| MS Office不要 | ライセンスコスト削減、Word/Excel互換 |
| 大きな文字とボタン | サイズ調整可能（70%〜150%） |
| 音声入力 | 話すだけで文字入力 |
| 読み上げ機能 | 文書やメールを音声で確認 |
| 自然言語操作 | 「A2に1万円入れて」等の直感的操作 |
| iCloudメール | iPhoneと同じメールをPCで送受信 |

**リポジトリ**: `win-app-insight-sheet-senior` / **技術**: C# WPF (.NET 8.0) + Syncfusion

---

### 製品名と内部名の対応表

> 一部の製品はリブランド（2026年2月）により、製品名（ユーザー向け表示名）と内部名（リポジトリ・exe・アイコン等）が異なります。
> コード内で `InsightOfficeSlide` 等の内部名が残っている箇所は、exe・ico・レジストリキー等の内部識別子です。

| コード | 製品名（表示名） | 旧名 / 内部名 | リポジトリ | exe | 拡張子 |
|:------:|-----------------|--------------|-----------|-----|:------:|
| INSS | **Insight Deck Quality Gate** | InsightOfficeSlide | `win-app-insight-slide` | `InsightOfficeSlide.exe` | `.inss` |
| IOSH | **Insight Performance Management** | InsightOfficeSheet | `win-app-insight-sheet` | `InsightOfficeSheet.exe` | `.iosh` |
| IOSD | **Insight AI Briefcase** | InsightOfficeDoc | `win-app-insight-doc` | `InsightOfficeDoc.exe` | `.iosd` |

**据え置きの内部識別子**: exe名、ico/pngファイル名、レジストリ progId（`HarmonicInsight.InsightOffice*`）、MIME type（`application/x-insightoffice-*`）、sln/csproj パス、リポジトリ名、製品コード（INSS/IOSH/IOSD）、ファイル拡張子（.inss/.iosh/.iosd）はすべて互換性維持のため据え置きです。

## ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
```

### ティア

| コード | 名称 | 期間 |
|--------|------|------|
| TRIAL | Trial | 任意指定（デフォルト14日） |
| STD | Standard | 年間 |
| PRO | Professional | 年間 |
| ENT | Enterprise | 永久 |

詳細は [license/README.md](./license/README.md) を参照してください。

## ドキュメント

### 技術ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [クイックスタート](./docs/QUICKSTART.md) | 5分で導入 |
| [統合ガイド](./docs/INTEGRATION_GUIDE.md) | 詳細な統合手順 |
| [ライセンス仕様](./license/README.md) | ライセンスキー形式・機能制限 |
| [多言語対応](./i18n/README.md) | i18n リソースとヘルパー関数 |
| [ユーティリティ](./utils/README.md) | 共通ユーティリティ関数 |
| [エラー定義](./errors/README.md) | 共通エラー型とコード |
| [統合プロンプト](./docs/prompts/README.md) | 各製品向けセットアップ手順 |

### デザイン・UXドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [デザインシステム](./brand/design-system.json) | タイポグラフィ・スペーシング・アニメーション |
| [カラーパレット](./brand/colors.json) | ブランドカラー・製品カラー |
| [トーン＆マナー](./brand/voice-guidelines.md) | UIテキスト・メッセージの書き方 |
| [UIコンポーネント](./ui/components.md) | 共通UI設計ガイドライン |
| [メニュー構造](./ui/menu-structure.json) | ナビゲーション・設定画面の構造 |

## 使用方法

### TypeScript製品での利用

```typescript
// ライセンス管理
import { LicenseValidator, getFeatureLimits } from '@insight/license';

const validator = new LicenseValidator();
const result = validator.validate(licenseKey);

if (result.isValid) {
  const limits = getFeatureLimits(result.tier);
  console.log(`Tier: ${result.tier}, Max Files: ${limits.maxFiles}`);
}

// 多言語対応
import { t, setLocale } from '@insight/i18n';

setLocale('ja');
console.log(t('common.save'));  // "保存"

// ユーティリティ
import { formatDate, formatCurrency, isValidEmail } from '@insight/utils';

formatDate(new Date(), 'long', 'ja');  // "2025年1月15日"
formatCurrency(1500);                   // "¥1,500"
isValidEmail('test@example.com');       // true

// エラーハンドリング
import { InsightError, LicenseError, isRetryable } from '@insight/errors';

throw new LicenseError('LICENSE_EXPIRED', 'ライセンスの有効期限が切れています');
```

### Python製品での利用

```python
# ライセンス管理
from insight_common.license import LicenseValidator, get_feature_limits

validator = LicenseValidator()
result = validator.validate(license_key)

if result.is_valid:
    limits = get_feature_limits(result.tier)
    print(f"Tier: {result.tier}, Max Files: {limits['max_files']}")

# 多言語対応
from insight_common.i18n import t, set_locale

set_locale('ja')
print(t('common.save'))  # "保存"

# ユーティリティ
from insight_common.utils import format_date, format_currency, is_valid_email

format_date(datetime.now(), 'long', 'ja')  # "2025年1月15日"
format_currency(1500)                       # "¥1,500"
is_valid_email('test@example.com')          # True

# エラーハンドリング
from insight_common.errors import LicenseError, ErrorCode, is_retryable

raise LicenseError(ErrorCode.LICENSE_EXPIRED, 'ライセンスの有効期限が切れています')
```

## サブモジュールとしての利用

各製品リポジトリでは、このリポジトリをGit Submoduleとして取り込むことを推奨します。

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

## 開発

### 前提条件

- Node.js 18+（TypeScript版）
- Python 3.10+（Python版）

### TypeScriptモジュールのビルド

```bash
cd license/typescript
npm install
npm run build
```

### Pythonモジュールのテスト

```bash
cd license/python
python -m pytest
```

## ライセンス

このリポジトリはHARMONIC insightの内部利用専用です。

## 連絡先

- 一般: info@h-insight.jp
- サポート: support@h-insight.jp
- 開発チーム: developer@h-insight.jp
