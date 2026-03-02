# HARMONIC insight - 開発標準ガイド

> **重要**: このドキュメントは新規アプリ作成時・コード修正時に**必ず**参照してください。

---

## ⚠️ AI アシスタントの自動行動ルール

**以下のキーワード・状況を検知したら、該当するアクションを自動で提案・実行してください。ユーザーが忘れていても AI 側から提案すること。**

| トリガー（ユーザーの発言・状況） | 自動アクション |
|-------------------------------|--------------|
| 「リリース」「デプロイ」「ストアに出す」「公開」「本番」「ship」「release」 | `/release-check` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check` の実行を推奨 |
| 新規プロジェクト作成・UI 実装開始 | デザイン標準（Ivory & Gold / Cool Blue & Slate）を確認 |
| 業務系アプリ（INBT/INCA/IVIN）のUI 実装 | `standards/COOL_COLOR.md` と `brand/colors-cool.json` を確認 |
| AI アシスタント機能の実装 | `standards/AI_ASSISTANT.md` を確認 |
| ストアメタデータ・スクリーンショットの話題 | `standards/LOCALIZATION.md` §6 を参照 |
| ライブラリ更新・バージョンアップ・依存関係の変更 | `compatibility/` の互換性マトリクスを確認 |
| 「バージョン」「アップグレード」「アップデート」 | `config/app-versions.ts` と `compatibility/` を参照 |
| 「リモートコンフィグ」「API キーローテーション」「自動更新」「OTA」 | `config/remote-config.ts` を確認 |
| 「Syncfusion」「NuGet」「Essential Studio」「ライセンスキー期限切れ」 | `docs/SYNCFUSION_SETUP.md` と `config/third-party-licenses.json` を確認 |
| 「ビルドエラー」「build failed」「コンパイルエラー」「リンクエラー」「署名エラー」 | `scripts/build-doctor.sh` を実行、`config/build-doctor.ts` と `standards/BUILD_DOCTOR.md` を参照 |
| 「メニューアイコン」「ツールバー」「アイコン統一」「Lucide」 | `standards/MENU_ICONS.md` と `brand/menu-icons.json` を確認 |
| メニュー・ツールバー・サイドバーの UI 実装 | `brand/menu-icons.json` のアイコン定義を参照、`config/menu-icons.ts` の API を使用 |
| 「ヘルプ」「HelpWindow」「操作マニュアル」「?ボタン」「F1」 | `standards/HELP_SYSTEM.md` と `config/help-content.ts` を確認、`/validate-help` を提案 |
| HelpWindow の新規作成・修正 | `standards/HELP_SYSTEM.md` の実装チェックリスト（§12）を参照、完了後 `/validate-help` を実行 |
| 「文字サイズ」「拡大」「縮小」「ズーム」「アクセシビリティ」「シニア」「高齢者」「スケーリング」 | `standards/ACCESSIBILITY.md` と `config/ui-scale.ts` を確認 |

---

## ⚠️ 開発開始前の必須チェック（AI アシスタント向け）

**新規プロジェクト作成・UI 実装・デザイン変更を行う前に、以下を確認してください：**

### デザインシステム

> 製品カテゴリに応じて2つのテーマから選択してください。

#### テーマ A: Ivory & Gold（デフォルト）

**対象**: Insight Business Suite 系（INSS/IOSH/IOSD/INPY）、ISOF、マーケティング系（INMV/INIG）、公開 Web サイト

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

#### テーマ B: Cool Blue & Slate（業務系アプリケーション向け）

**対象**: 業務ツール系（INBT/INCA/IVIN）、データダッシュボード、管理画面

> 詳細は `standards/COOL_COLOR.md` を参照

```
❌ 絶対禁止: Gold (#B8942F) をプライマリカラーとして使用
❌ 絶対禁止: Ivory (#FAF8F5) を背景として使用
✅ 必須: Blue (#2563EB) をプライマリカラーとして使用
✅ 必須: Slate (#F8FAFC) を背景色として使用
```

| 用途 | カラーコード | 備考 |
|-----|-------------|------|
| **Primary (Blue)** | `#2563EB` | アクセント、CTA、選択状態 |
| **Background (Slate)** | `#F8FAFC` | メイン背景（寒色系オフホワイト） |
| **Background Card** | `#FFFFFF` | カード、モーダル |
| **Sidebar** | `#1E293B` | ダークサイドバー（業務系推奨） |
| **Text Primary** | `#0F172A` | 本文、見出し（高コントラスト） |
| **Text Secondary** | `#475569` | サブテキスト |
| **Border** | `#E2E8F0` | ボーダー |
| **Success** | `#16A34A` | 成功ステータス |
| **Warning** | `#D97706` | 警告ステータス |
| **Error** | `#DC2626` | エラーステータス |
| **Info** | `#0EA5E9` | 情報ステータス |

### プラットフォーム別標準

実装前に該当するガイドを確認:
- **C# (WPF)**: `standards/CSHARP_WPF.md`
- **Python**: `standards/PYTHON.md`
- **React/Next.js**: `standards/REACT.md`
- **Android**: `standards/ANDROID.md`
- **iOS**: `standards/IOS.md`
- **AI アシスタント**: `standards/AI_ASSISTANT.md`（Insight Business Suite 系アプリ共通）
- **ローカライゼーション**: `standards/LOCALIZATION.md`（全プラットフォーム共通）
- **リリースチェック**: `standards/RELEASE_CHECKLIST.md`（全プラットフォーム共通）
- **寒色系カラー標準**: `standards/COOL_COLOR.md`（業務系アプリ: INBT/INCA/IVIN）
- **メニューアイコン標準**: `standards/MENU_ICONS.md`（全製品共通 — Lucide Icons）
- **アクセシビリティ**: `standards/ACCESSIBILITY.md`（全 WPF 製品共通 — UI スケーリング）

### 検証スクリプト

```bash
# 開発中の標準検証（Ivory & Gold テーマ）
./scripts/validate-standards.sh <project-directory>

# 開発中の標準検証（Cool Blue & Slate テーマ — 業務系アプリ）
./scripts/validate-cool-color.sh <project-directory>

# メニューアイコン標準検証（Lucide Icons 統一）
./scripts/validate-menu-icons.sh <project-directory>

# ヘルプシステム標準検証（WPF プロジェクト）
./scripts/validate-help.sh <project-directory>

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

### Syncfusion Essential Studio（Community License）

> **セットアップ手順の詳細**: `docs/SYNCFUSION_SETUP.md` を参照

**ライセンス形態**: Community License（無償・年間売上 100 万 USD 未満 / 開発者 5 名以下）

**構成の原則**:
- PC にインストール + NuGet で参照管理（DLL は GitHub にコミットしない）
- `dotnet restore` で自動復元

```json
// config/third-party-licenses.json
{
  "syncfusion": {
    "licenseKey": "取得したキーをここに設定",
    "type": "community",
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
| Material Design Icons / Font Awesome 等をメニューに使用 | **Lucide Icons** に統一（`brand/menu-icons.json`） |
| `brand/menu-icons.json` に未定義のアイコンをメニューに使用 | 先に `brand/menu-icons.json` に登録してから使用 |
| UI テキストのハードコード | リソースファイル / 翻訳定義から参照（`standards/LOCALIZATION.md`） |
| XAML 内に日本語テキスト直書き | `DynamicResource` / `LanguageManager` / `x:Static` 経由で参照 |
| 英語翻訳の省略 | 日本語 + 英語の両方を必ず用意 |
| リリースチェックなしでリリース | `/release-check` または `release-check.sh` を必ず実行 |
| TODO/FIXME を残したままリリース | リリース前に全て解決する |
| API キー・シークレットのハードコード | 環境変数 / .env / secrets 経由で参照 |
| ライセンス秘密鍵をソースに直書き | 非対称鍵署名（公開鍵のみ埋め込み）or サーバー検証 |
| API キー（Claude 等）を平文保存 | DPAPI / Windows Credential Manager で暗号化保存 |
| ライセンスデータ（license.json）を平文保存 | DPAPI で暗号化してから %APPDATA% に保存 |
| 空の catch ブロック（例外の握りつぶし） | 最低限ログ出力、または意図的な場合はコメントで理由明記 |
| バージョン番号を複数箇所にハードコード | `.csproj` を唯一のソースオブトゥルースとし、`Assembly` 属性から取得 |
| AutomationProperties なしでリリース | 主要 UI コントロールに `AutomationProperties.Name` を設定 |
| ハイパーリンク URL を未検証で使用 | 許可スキーム（http/https/mailto）のホワイトリスト検証 |
| `UnobservedTaskException` をログなしで握りつぶし | App.xaml.cs でログ出力付きハンドラを登録 |
| HelpWindow のセクション ID に integer を使用 | **string ID** を使用（`config/help-content.ts` 参照） |
| HelpWindow を `Show()` で開く | **`ShowDialog()`** で開く（非モーダル禁止） |
| HelpWindow の XAML で色をハードコード | `DynamicResource` / `StaticResource` を使用 |
| ヘルプコンテンツに機能説明のみ記載 | **導入効果・ベネフィット**を先に伝える（`HELP_SYSTEM.md` §0） |
| FontSize 個別変更でスケーリング | `InsightScaleManager` + `LayoutTransform` を使用（`standards/ACCESSIBILITY.md`） |
| `InsightScaleManager` を介さず独自スケール機構を実装 | `InsightScaleManager.Instance` を使用 |

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
│  Tier 3: Insight Business Suite（導入ツール）                     │
│  INSS / IOSH / IOSD / INPY                                     │
│  コンサル案件のクライアントに業務ツールとして導入                  │
├──────────────────────────────────────────────────────────────────┤
│  Tier 4: InsightSeniorOffice（社会貢献ツール）                   │
│  ISOF                                                           │
├──────────────────────────────────────────────────────────────────┤
│  ユーティリティ（非公開・補助ツール）                              │
│  LAUNCHER / CAMERA / VOICE_CLOCK / QR / PINBOARD / VOICE_MEMO  │
│  VOICE_TASK_CALENDAR / CONSUL_EVAL                              │
└──────────────────────────────────────────────────────────────────┘
```

> 全製品をコンサルティング案件の一環として法人向けに提供。
> 個人向け（B2C）販売は行わない。決済は Stripe（自社サイト）/ 請求書払い。
> **価格は全製品個別見積もり。パートナー（販売代理店）との協議により決定。Webサイト等での価格公開は行わない。**

### 製品サマリー

| 区分 | 製品数 | 安定版 | 開発中 | リポジトリ数 |
|------|:------:|:-----:|:-----:|:-----------:|
| メイン製品 (Tier 1-4) | 11 | 3 (INSS, IOSH, ISOF) | 8 | 12 |
| ユーティリティ | 8 | — | — | 9 |
| **合計** | **19** | **3** | **8** | **21** |

### 技術スタック分布

| 技術 | 対象製品 |
|------|---------|
| **C# WPF (.NET 8.0)** | INSS, IOSH, IOSD, INPY, ISOF, INBT, INMV, LAUNCHER(Win), PINBOARD |
| **Tauri (Rust + TypeScript)** | INCA, IVIN |
| **Python (CustomTkinter)** | INIG |
| **Android Kotlin Native** | CAMERA, VOICE_CLOCK, QR(Android), LAUNCHER(Android), CONSUL_EVAL, VOICE_TASK_CALENDAR |
| **Expo (React Native)** | QR(iOS), VOICE_MEMO |

---

### Tier 1: 業務変革ツール

#### INCA — InsightNoCodeAnalyzer

| 項目 | 内容 |
|------|------|
| **説明** | RPA・ローコードのマイグレーション自動化ツール |
| **技術** | Tauri (Rust + TypeScript) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `win-app-nocode-analyzer` |
| **カラーテーマ** | Cool Blue & Slate |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| RPA解析 | ○ | ○ | ○ | BizRobo等のRPAソース解析 |
| ローコード解析 | ○ | ○ | ○ | Forguncy等のローコードツール解析 |
| 移行アセスメント | ○ | ○ | ○ | 工数見積もり・複雑度分析 |
| akaBot変換 | — | — | ○ | BizRoboからakaBotへの変換 |
| JSON出力 | ○ | ○ | ○ | 解析結果のJSON形式出力 |
| Markdown出力 | ○ | ○ | ○ | 解析結果のMarkdown形式出力 |

#### INBT — InsightBot

| 項目 | 内容 |
|------|------|
| **説明** | AIエディタ搭載 — 業務最適化RPA + Orchestrator |
| **技術** | C# WPF (.NET 8.0) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `win-app-insight-bot` |
| **カラーテーマ** | Cool Blue & Slate |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| スクリプト実行 | ○ | ○ | ○ | RPAスクリプトの実行 |
| プリセット利用 | ○ | ○ | ○ | 定義済みスクリプトテンプレート |
| JOB保存数 | 5 | 50 | 無制限 | 保存可能なJOB数 |
| クラウド同期 | — | — | ○ | JOBのクラウド同期 |
| AIコードエディター | ○(BYOK) | ○(BYOK) | 無制限 | AIによるPythonコード生成・編集 |
| オーケストレーター | — | — | ○ | Agent集中管理・JOB配信・実行監視 |
| Agent管理 | — | — | 無制限 | 管理可能な Insight Business Suite 端末数 |
| JOBスケジューラー | — | — | ○ | 定期実行スケジュール設定 |

#### IVIN — InterviewInsight

| 項目 | 内容 |
|------|------|
| **説明** | 自動ヒアリング・業務調査支援 |
| **技術** | Tauri (Rust + TypeScript) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `web-app-auto-interview` |
| **カラーテーマ** | Cool Blue & Slate |

> 機能定義は開発進行に合わせて追加予定

---

### Tier 2: AI活用ツール

#### INMV — Insight Training Studio

| 項目 | 内容 |
|------|------|
| **説明** | 画像とテキストから動画を自動作成 |
| **技術** | C# WPF (.NET 8.0) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `win-app-insight-cast` |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| 動画生成 | ○ | ○ | ○ | 画像・テキストから動画を生成 |
| 字幕 | ○ | ○ | ○ | 動画への字幕追加 |
| 字幕スタイル選択 | ○ | ○ | ○ | フォント・色・位置のカスタマイズ |
| トランジション | ○ | ○ | ○ | シーン間のトランジション効果 |
| PPTX取込 | ○ | ○ | ○ | PowerPointファイルからの素材取込 |
| AIアシスタント | ○(BYOK) | ○(BYOK) | 無制限 | AIによる動画構成提案・ナレーション作成・字幕最適化 |
| AIコードエディター | ○(BYOK) | ○(BYOK) | 無制限 | AIによるPython自動処理 |
| 参考資料 | ○ | ○ | ○ | 参考資料の添付・AIコンテキスト活用 |
| ドキュメント評価 | ○(BYOK) | ○(BYOK) | 無制限 | AIによる動画の多角的評価・スコアリング |
| 音声入力 | ○ | ○ | ○ | 音声認識によるハンズフリー入力 |
| VRMアバター | ○ | ○ | ○ | 3Dアバターによる音声会話 |

**プラン別制限（INMV固有）:** BIZ: 最大200MB / 1080p、ENT: 無制限 / 4K

#### INIG — InsightImageGen

| 項目 | 内容 |
|------|------|
| **説明** | 業務資料向けAI画像の大量自動生成ツール |
| **技術** | Python (CustomTkinter + PyInstaller) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `win-app-insight-image-gen` |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| 画像生成 | ○ | ○ | ○ | Stable Diffusionによる画像生成 |
| バッチ画像生成 | ○ | ○ | ○ | 複数画像の一括生成 |
| 音声生成 | ○ | ○ | ○ | VOICEVOXによる音声生成 |
| キャラクタープロンプト | 5個 | 20個 | 無制限 | 保存可能なプロンプト数 |
| 高解像度出力 | — | — | ○ | 高解像度画像の生成 |
| クラウド同期 | — | — | ○ | プロンプト・設定の同期 |

---

### Tier 3: Insight Business Suite

> Insight Business Suite 系は共通で **新規ドキュメント作成（MS Office 不要）**、AI アシスタント（Claude API）、参考資料、ドキュメント評価、音声入力、VRMアバター（ENT）を搭載。
> Syncfusion で Office 互換ファイル（.xlsx / .docx / .pptx）を直接生成するため、MS Office を購入せずにドキュメントの作成・編集・保存がすべて完結する。
> 独自プロジェクトファイル形式（.inss / .iosh / .iosd）対応、AI メモリ機能あり。

#### INSS — Insight Deck Quality Gate

| 項目 | 内容 |
|------|------|
| **説明** | AIアシスタント搭載 — プレゼン資料の品質管理・抽出・自動化ツール（MS Office 不要） |
| **技術** | C# WPF (.NET 8.0) + Syncfusion |
| **バージョン** | **2.2.0** (build 50) — **安定版** |
| **リポジトリ** | `win-app-insight-slide` |
| **プロジェクトファイル** | `.inss`（内包: .pptx）、右クリック対象: .pptx, .ppt |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| **新規作成** | **○** | **○** | **○** | **空の PowerPoint を新規作成（MS Office 不要）** |
| スライド編集 | ○ | ○ | ○ | スライドのテキスト・レイアウト編集 |
| テキスト書式 | ○ | ○ | ○ | フォント（種類・サイズ・太字・斜体・下線・色）、段落（配置・行間・箇条書き） |
| スライド操作 | ○ | ○ | ○ | スライドの追加・複製・削除・並べ替え・レイアウト変更・セクション管理 |
| 画像挿入 | ○ | ○ | ○ | 画像の挿入・トリミング・サイズ変更・位置調整 |
| 図形挿入 | ○ | ○ | ○ | 図形・矢印・吹き出し・テキストボックス・ワードアートの挿入 |
| 表の挿入 | ○ | ○ | ○ | スライドへの表の挿入・行列追加・セル結合・スタイル設定 |
| グラフの挿入 | ○ | ○ | ○ | 棒・折れ線・円・散布図等のグラフ挿入・データ編集 |
| SmartArt挿入 | ○ | ○ | ○ | SmartArt（リスト・手順・循環・階層・関係等）の挿入 |
| メディア挿入 | ○ | ○ | ○ | 動画・音声ファイルの挿入・再生設定 |
| ハイパーリンク | ○ | ○ | ○ | テキスト・オブジェクトへのリンク挿入 |
| コメント | ○ | ○ | ○ | スライドへのコメント挿入・返信・解決 |
| ヘッダーとフッター | ○ | ○ | ○ | スライド番号・日付・フッターテキストの設定 |
| デザインテーマ | ○ | ○ | ○ | テーマ・配色・フォント・効果のカスタマイズ |
| スライドのサイズ | ○ | ○ | ○ | 標準 4:3 / ワイド 16:9 / カスタムサイズ設定 |
| オブジェクト書式 | ○ | ○ | ○ | 塗りつぶし・枠線・効果（影・反射・光彩）・サイズ・回転 |
| オブジェクトの整列 | ○ | ○ | ○ | 整列・配置・グループ化・前面/背面移動 |
| スライドショー | ○ | ○ | ○ | スライドショーの再生（最初から・現在のスライドから） |
| 発表者ツール | ○ | ○ | ○ | ノート表示・次スライドプレビュー・タイマー・レーザーポインター |
| 発表者ノート | ○ | ○ | ○ | スライドごとの発表者メモの編集・印刷 |
| 印刷 | ○ | ○ | ○ | 配布資料・ノート付き印刷 |
| 検索・置換 | ○ | ○ | ○ | スライド内テキストの検索・一括置換 |
| スペルチェック | ○ | ○ | ○ | スライド内テキストのスペルチェック |
| スライドマスター | — | — | ○ | スライドマスター・レイアウトの編集 |
| スライド切替効果 | — | — | ○ | スライド間のトランジション効果 |
| アニメーション | — | — | ○ | オブジェクトのアニメーション効果（開始・強調・終了・軌跡） |
| Excelインポート | — | ○ | ○ | Excelデータのスライドへのインポート |
| コンテンツ抽出 | ○ | ○ | ○ | PowerPointからテキスト・画像を抽出 |
| スライド一括更新 | ○ | ○ | ○ | スライドの一括更新 |
| JSON入出力 | ○ | ○ | ○ | JSON形式でのデータ入出力 |
| フォルダ一括処理 | ○ | ○ | ○ | 複数ファイルの一括処理 |
| 2ファイル比較 | ○ | ○ | ○ | 2つのPowerPointファイルの差分比較（FREE: 閲覧のみ） |
| 選択した変更を適用 | — | ○ | ○ | ファイル比較結果から選択した変更を適用 |
| 自動バックアップ | — | — | ○ | 編集前の自動バックアップ作成 |
| AIアシスタント | △(BYOK) | ○(BYOK) | 無制限 | AIによるスライドテキストの校正・改善提案（FREE: プロンプト編集可・実行不可） |
| AIコードエディター | — | — | 無制限 | AIによるPython自動処理 |
| 参考資料 | ○ | ○ | ○ | 参考資料の添付・AIコンテキスト活用 |
| ドキュメント評価 | ○(BYOK) | ○(BYOK) | 無制限 | AIによる多角的評価・スコアリング |
| 音声入力 | ○ | ○ | ○ | 音声認識によるハンズフリー入力 |
| VRMアバター | — | — | ○ | 3Dアバターによる音声会話 |

#### IOSH — Insight Performance Management

| 項目 | 内容 |
|------|------|
| **説明** | AIアシスタント搭載 — 経営数値管理・財務分析ツール |
| **技術** | C# WPF (.NET 8.0) + Syncfusion |
| **バージョン** | **2.0.0** (build 38) — **安定版** |
| **リポジトリ** | `win-app-insight-sheet` |
| **プロジェクトファイル** | `.iosh`（内包: .xlsx）、右クリック対象: .xlsx, .xls, .csv |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| **新規作成** | **○** | **○** | **○** | **空の Excel スプレッドシートを新規作成（MS Office 不要）** |
| Excel読み込み・編集 | ○ | ○ | ○ | Excelファイルの読み込み・編集・保存 |
| セル書式設定 | ○ | ○ | ○ | フォント（種類・サイズ・太字・斜体・下線・色）、背景色・罫線 |
| 表示形式 | ○ | ○ | ○ | 数値・通貨・日付・パーセント・会計等のセル表示形式 |
| 配置 | ○ | ○ | ○ | 水平・垂直配置、折り返し、インデント、テキスト方向 |
| セルの結合 | ○ | ○ | ○ | セルの結合・結合解除 |
| 行と列の操作 | ○ | ○ | ○ | 行・列の挿入・削除・非表示・高さ/幅の調整 |
| シート管理 | ○ | ○ | ○ | シートの追加・削除・名前変更・移動・コピー・タブ色 |
| ウィンドウ枠の固定 | ○ | ○ | ○ | 先頭行・先頭列・任意セル位置での固定 |
| 数式と関数 | ○ | ○ | ○ | 数式入力・関数挿入（SUM / VLOOKUP / IF 等 400+ 関数） |
| 名前の定義 | ○ | ○ | ○ | セル範囲への名前定義・管理 |
| 数式の検証 | ○ | ○ | ○ | 参照元/参照先トレース・エラーチェック |
| 検索・置換 | ○ | ○ | ○ | セル値の検索・一括置換（正規表現対応） |
| ソート・フィルタ | ○ | ○ | ○ | 列のソート・オートフィルタ・色フィルタ |
| オートフィル | ○ | ○ | ○ | 連続データの自動入力（数値・日付・曜日） |
| グラフ作成 | ○ | ○ | ○ | 棒・折れ線・円・散布図・面・レーダー等の作成・編集 |
| 画像の挿入 | ○ | ○ | ○ | 画像ファイルの挿入・サイズ変更 |
| 図形の挿入 | ○ | ○ | ○ | 図形・テキストボックス・ワードアートの挿入 |
| ハイパーリンク | ○ | ○ | ○ | セルへのリンク挿入（URL・メール・シート内参照） |
| コメント | ○ | ○ | ○ | セルへのコメント挿入・編集・スレッド表示 |
| ページ設定 | ○ | ○ | ○ | 用紙サイズ・余白・印刷の向き・印刷範囲 |
| 印刷 | ○ | ○ | ○ | 範囲指定・ヘッダーフッター・改ページ設定対応 |
| PDF出力 | — | ○ | ○ | PDF形式でエクスポート |
| スペルチェック | ○ | ○ | ○ | セル内テキストのスペルチェック |
| シート・ブックの保護 | ○ | ○ | ○ | シート保護（パスワード付き）・ブック構成の保護 |
| 条件付き書式 | — | — | ○ | カラースケール・データバー・アイコンセット |
| ピボットテーブル | — | — | ○ | データの集計・クロス分析 |
| データ入力規則 | — | — | ○ | 入力制限・ドロップダウンリスト |
| 区切り位置 | — | — | ○ | テキストデータを区切り文字で複数列に分割 |
| 重複の削除 | — | — | ○ | 選択範囲内の重複データ検出・削除 |
| グループ化とアウトライン | — | — | ○ | 行・列のグループ化・アウトライン・小計 |
| ゴールシーク | — | — | ○ | 目標値に対するセル値の逆算（What-If 分析） |
| バージョン管理 | ○ | ○ | ○ | ファイルのバージョン管理・履歴保持 |
| 差分比較 | ○ | ○ | ○ | バージョン間のセル差分比較 |
| セル変更ログ | ○ | ○ | ○ | セル単位の変更履歴の記録・表示 |
| エクスポート | — | ○ | ○ | 変更履歴・差分のエクスポート出力 |
| 2ファイル比較 | ○ | ○ | ○ | 2つのExcelファイルのセル単位差分比較 |
| 変更者表示 | — | — | ○ | 変更者（誰が変更したか）を表示 |
| 掲示板 | — | — | ○ | チーム向け掲示板機能 |
| 付箋 | ○ | ○ | ○ | セルに付箋（メモ）を貼り付け |
| メッセージ送信 | — | — | ○ | チームメンバーへのメッセージ送信 |
| AIアシスタント | ○(BYOK) | ○(BYOK) | 無制限 | AIチャットによるExcel操作支援 |
| AIコードエディター | — | — | 無制限 | AIによるPython自動処理 |
| 参考資料 | ○ | ○ | ○ | 参考資料の添付・AIコンテキスト活用 |
| ドキュメント評価 | ○(BYOK) | ○(BYOK) | 無制限 | AIによる多角的評価・スコアリング |
| 音声入力 | ○ | ○ | ○ | 音声認識によるハンズフリー入力 |
| VRMアバター | — | — | ○ | 3Dアバターによる音声会話 |

#### IOSD — Insight AI Briefcase

| 項目 | 内容 |
|------|------|
| **説明** | AIアシスタント搭載 — 業務文書一括管理ブリーフケース（MS Office 不要） |
| **技術** | C# WPF (.NET 8.0) + Syncfusion |
| **バージョン** | 1.1.0 (build 5) — 開発中 |
| **リポジトリ** | `win-app-insight-doc` |
| **プロジェクトファイル** | `.iosd`（内包: .docx）、右クリック対象: .docx, .doc |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| **新規作成** | **○** | **○** | **○** | **空の Word ドキュメントを新規作成（MS Office 不要）** |
| ドキュメント読取・書込 | ○ | ○ | ○ | Word ドキュメントの読み込み・編集・保存 |
| フォント書式 | ○ | ○ | ○ | フォント種類・サイズ・太字・斜体・下線・取り消し線・文字色・蛍光ペン |
| 段落書式 | ○ | ○ | ○ | 配置（左・中央・右・両端揃え）・行間・段落間隔・インデント |
| 箇条書きと段落番号 | ○ | ○ | ○ | 箇条書き・番号付きリスト・アウトライン番号 |
| スタイル | ○ | ○ | ○ | 見出しスタイル（H1〜H6）・本文・引用・カスタムスタイル |
| 検索・置換 | ○ | ○ | ○ | テキストの検索・一括置換（正規表現・書式検索対応） |
| 表の挿入・編集 | ○ | ○ | ○ | 行列追加・セル結合・罫線スタイル・表スタイルの適用 |
| 画像挿入 | ○ | ○ | ○ | 画像の挿入・トリミング・文字列の折り返し設定 |
| 図形挿入 | ○ | ○ | ○ | 図形・テキストボックス・ワードアートの挿入 |
| グラフの挿入 | ○ | ○ | ○ | グラフの挿入・データ編集 |
| ハイパーリンク | ○ | ○ | ○ | テキスト・画像へのリンク挿入（URL・メール・文書内参照） |
| ブックマーク | ○ | ○ | ○ | ブックマークの挿入・管理・相互参照 |
| コメント | ○ | ○ | ○ | テキストへのコメント挿入・返信・解決 |
| ヘッダー・フッター | ○ | ○ | ○ | ページ番号・日付・ロゴ・奇数/偶数ページ別 |
| 改ページ・セクション区切り | ○ | ○ | ○ | 改ページ・セクション区切りの挿入 |
| 記号と特殊文字 | ○ | ○ | ○ | 特殊文字・記号の挿入 |
| 脚注・文末脚注 | ○ | ○ | ○ | 脚注・文末脚注の挿入・編集 |
| ページ設定 | ○ | ○ | ○ | 用紙サイズ・余白・ページの向き・段組み |
| 罫線と網かけ | ○ | ○ | ○ | ページ罫線・段落罫線・網かけ |
| 段組み | ○ | ○ | ○ | 文書の段組みレイアウト |
| 透かし | ○ | ○ | ○ | テキスト・画像の透かし挿入 |
| 行番号 | ○ | ○ | ○ | 行番号の表示設定 |
| 印刷 | ○ | ○ | ○ | ページ範囲指定・部数・用紙サイズ対応 |
| PDF出力 | — | ○ | ○ | PDF形式でエクスポート |
| フォーマット変換 | — | ○ | ○ | PDF・HTML・RTF・テキスト等への変換 |
| スペルチェック | ○ | ○ | ○ | 文書内テキストのスペルチェック・文章校正 |
| 文字カウント | ○ | ○ | ○ | 文字数・単語数・段落数・行数のカウント |
| 文書の保護 | ○ | ○ | ○ | 編集制限・パスワード保護・読み取り専用 |
| 目次生成 | — | — | ○ | 見出しスタイルから目次を自動生成・更新 |
| 変更履歴の記録 | — | — | ○ | 変更追跡・承認・却下（Word 互換） |
| テンプレート | — | — | ○ | テンプレートからのドキュメント生成 |
| 差し込み印刷 | — | — | ○ | データソース（Excel/CSV）からの差し込み印刷・文書生成 |
| バッチ処理 | — | — | ○ | 複数ドキュメントの一括処理 |
| マクロ実行 | — | — | ○ | VBAマクロの実行・変換 |
| AIアシスタント | ○(BYOK) | ○(BYOK) | 無制限 | AIによるドキュメントの校正・要約・構成提案 |
| AIコードエディター | — | — | 無制限 | AIによるPython自動処理 |
| 参考資料 | ○ | ○ | ○ | 参考資料の添付・AIコンテキスト活用 |
| ドキュメント評価 | ○(BYOK) | ○(BYOK) | 無制限 | AIによる多角的評価・スコアリング |
| 音声入力 | ○ | ○ | ○ | 音声認識によるハンズフリー入力 |
| VRMアバター | — | — | ○ | 3Dアバターによる音声会話 |

#### INPY — InsightPy

| 項目 | 内容 |
|------|------|
| **説明** | AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤 |
| **技術** | C# WPF (.NET 8.0) |
| **バージョン** | 1.0.0 — 開発中 |
| **リポジトリ** | `win-app-insight-py` / `win-app-insight-py-pro` |
| **カラーテーマ** | Ivory & Gold |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| コード実行 | ○ | ○ | ○ | Pythonコードの実行 |
| プリセット利用 | ○ | ○ | ○ | 定義済みスクリプトテンプレート |
| スクリプト保存数 | 5 | 50 | 無制限 | 保存可能なスクリプト数 |
| クラウド同期 | — | — | ○ | スクリプトのクラウド同期 |
| AIコードエディター | ○(BYOK) | ○(BYOK) | 無制限 | AIによるPythonコード生成・編集・デバッグ |

---

### Tier 4: InsightSeniorOffice

#### ISOF — InsightSeniorOffice

| 項目 | 内容 |
|------|------|
| **説明** | AIアシスタント搭載 — シニア向け統合オフィスツール（表計算・文書・iCloudメール） |
| **技術** | C# WPF (.NET 8.0) + Syncfusion |
| **バージョン** | **1.5.0** (build 22) — **安定版** |
| **リポジトリ** | `win-app-insight-sheet-senior` |
| **カラーテーマ** | Ivory & Gold |
| **プラン体系** | FREE / BIZ / ENT |

**主要機能:**

| 機能 | FREE | BIZ | ENT | 説明 |
|------|:----:|:---:|:---:|------|
| **新規作成** | **○** | **○** | **○** | **空の表計算・文書を新規作成（MS Office 不要）** |
| 表計算 | ○ | ○ | ○ | Excelファイルの読み込み・編集・保存 |
| 文書作成 | ○ | ○ | ○ | Wordドキュメントの読み込み・編集・保存 |
| iCloudメール | ○ | ○ | ○ | iCloudメールの送受信（iPhoneと同じメールをPCで閲覧） |
| AIアシスタント | ○(BYOK) | ○(BYOK) | 無制限 | 自然言語操作支援（「A2に1万円入れて」等） |
| 音声入力 | ○ | ○ | ○ | 音声認識によるハンズフリー入力 |
| 読み上げ | ○ | ○ | ○ | メール・文書の音声読み上げ |
| 文字サイズ調整 | ○ | ○ | ○ | 50%〜200%の拡大縮小 |
| 初期設定ウィザード | ○ | ○ | ○ | 5ステップの簡単初期設定 |
| チュートリアル | ○ | ○ | ○ | 10ステップの対話型ガイドツアー |
| 印刷 | ○ | ○ | ○ | シニア向け大きい文字での印刷 |
| 連絡先管理 | ○ | ○ | ○ | グループ別連絡先管理 |

---

### ユーティリティアプリ（非公開・社内/補助ツール）

| コード | 製品名 | プラットフォーム | 技術スタック | リポジトリ |
|--------|--------|:---------------:|-------------|-----------|
| LAUNCHER | InsightLauncher | Windows | C# WPF | `win-app-insight-launcher` |
| LAUNCHER | InsightLauncher Android | Android | Kotlin Native | `android-app-insight-launcher` |
| CAMERA | スッキリカメラ | Android | Kotlin Native | `android-app-insight-camera` |
| VOICE_CLOCK | InsightVoiceClock | Android/iOS | Kotlin Native | `android-app-insight-voice-clock` |
| QR | InsightQR | Android/iOS/Web | Expo + Kotlin Native | `web-app-insight-qr` / `android-app-insight-qr` |
| PINBOARD | InsightPinBoard | Windows | C# WPF | `win-app-insight-pinboard` |
| VOICE_MEMO | InsightVoiceMemo | Android/iOS | Expo (React Native) | `mobile-app-voice-memo` |
| VOICE_TASK_CALENDAR | しゃべってカレンダー | Android | Kotlin Native | `android-app-voice-tesk-calendar` |
| CONSUL_EVAL | ConsulEvaluate | Android | Kotlin Native | `android-app-consul-evaluate` |

---

### 全製品共通機能（ENT）

| 機能 | BIZ | ENT | 説明 |
|------|:---:|:---:|------|
| API利用 | — | ○ | 外部システムからのAPI経由アクセス |
| シングルサインオン | — | ○ | 企業の認証基盤との連携 |
| 監査ログ | — | ○ | 操作履歴の詳細記録 |
| 優先サポート | — | ○ | 優先的なサポート対応 |

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

### プラン体系（全製品 法人向け — 4ティア）

| プラン | 説明 | 対象 | 有効期限 |
|-------|------|------|---------|
| FREE | 全機能利用可能（保存・エクスポート制限あり） | 評価・個人利用 | 無期限 |
| TRIAL | 全機能利用可能（評価用） | 評価企業 | 30日間 |
| BIZ | 法人向け全機能 | 法人利用 | 365日 |
| ENT | 法人向け全機能（カスタマイズ・API/SSO/監査ログ） | 大企業 | 要相談 |

### Insight Performance Management (IOSH) 機能マトリクス

> **FREE = 全機能利用可能（保存・エクスポート制限）**、**BIZ/ENT = 全機能**。AI は全プラン BYOK（クライアント自社 API キー・回数制限なし・モデル制限なし）。

| 機能 | FREE | TRIAL | BIZ | ENT |
|------|:----:|:-----:|:---:|:---:|
| Excel読み込み・編集 | ✅ | ✅ | ✅ | ✅ |
| バージョン管理 | ✅ | ✅ | ✅ | ✅ |
| 差分比較 | ✅ | ✅ | ✅ | ✅ |
| セル変更ログ | ✅ | ✅ | ✅ | ✅ |
| エクスポート | ❌ | ✅ | ✅ | ✅ |
| 2ファイル比較 | ✅ | ✅ | ✅ | ✅ |
| 変更者表示 | ✅ | ✅ | ❌ | ✅ |
| 掲示板 | ✅ | ✅ | ❌ | ✅ |
| 付箋 | ✅ | ✅ | ✅ | ✅ |
| AIアシスタント | ✅(BYOK) | ✅(BYOK) | ✅(BYOK) | ✅(BYOK) |
| AIコードエディター | ❌ | ✅ | ❌ | ✅ |
| Pythonスクリプト | ❌ | ✅ | ❌ | ✅ |
| メッセージ送信 | ❌ | ✅ | ❌ | ✅ |

### Insight Business Suite AI アシスタント共通仕様

> 詳細は `standards/AI_ASSISTANT.md` を参照

**対象製品**: INSS / IOSH / IOSD（全 Insight Business Suite 系アプリ）+ INPY / INBT / INMV

| 項目 | 仕様 |
|------|------|
| AI プロバイダー | **Claude (Anthropic) API** のみ |
| API キー方式 | **BYOK**（クライアント企業が自社で Anthropic から購入） |
| モデル管理 | `MODEL_REGISTRY` で一元管理（`config/ai-assistant.ts`） |
| モデル選択 | **全プランで全モデル利用可能** — クライアントが自由に選択 |
| 利用制限 | **なし**（回数制限なし・モデルティア制限なし） |
| 機能キー | `ai_assistant`（products.ts で統一） |

```typescript
import {
  resolveModel,
  getBaseSystemPrompt,
  canUseAiAssistant,
  SPREADSHEET_TOOLS,
  MODEL_REGISTRY,
} from '@/insight-common/config/ai-assistant';

// ライセンスチェック（全プランで利用可能）
canUseAiAssistant('BIZ');   // true
canUseAiAssistant('FREE');  // true

// モデル選択 UI: 全モデルが利用可能（BYOK — 制限なし）
// クライアントが自社の API キーで任意のモデルを選択
const model = resolveModel(userPreference);
// → ユーザーが Opus を選択: 'claude-opus-4-6-...'
// → ユーザーが Sonnet を選択: 'claude-sonnet-4-6-...'
```

### ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: INCA-BIZ-2601-XXXX-XXXX-XXXX
```

### ライセンス画面（必須）

すべての製品で **Insight Slides 形式** のライセンス画面を実装:

```
┌────────────────────────────────────┐
│      Insight Product Name          │  ← Gold色、中央配置
│                                    │
│         現在のプラン                │
│            BIZ                     │  ← プラン名、大きく表示
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
  plan: 'BIZ',
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

## 10. リモートコンフィグ & アプリ自動更新

> **仕様定義**: `config/remote-config.ts` — リモート構成管理・バージョンチェック・API キーローテーション

### 設計思想

デスクトップアプリ（WPF / Tauri / Python）において、**アプリ再ビルドなし**で以下を配信する：

1. **バージョンチェック & 自動更新通知** — 新バージョンのリリース時にアプリ内で通知
2. **API キーローテーション** — Claude API キー / Syncfusion キーをサーバーから配信
3. **モデルレジストリのホットアップデート** — 新しい Claude モデルの追加・非推奨化を即座に反映
4. **フィーチャーフラグ** — 段階的ロールアウト、プラン別機能制御

### アーキテクチャ

```
ライセンスサーバー (既存インフラを拡張)
https://license.harmonicinsight.com

  /api/v1/remote-config/
  ├── config          POST  統合コンフィグ取得（起動時1回）
  ├── versions/:code  GET   バージョンチェック
  ├── api-keys        POST  API キー取得（暗号化配信）
  ├── models          GET   モデルレジストリ
  └── features/:code  GET   フィーチャーフラグ

  /api/v1/admin/remote-config/
  ├── PUT             コンフィグ更新
  ├── rotate-key      API キーローテーション
  ├── releases        リリース登録
  ├── features/:key   フラグ更新
  └── log             変更ログ（監査）

        ▲ HTTPS + ETag (ポーリング: 起動時 + 4時間ごと)
        │
  デスクトップアプリ
  ├── RemoteConfigClient (共通 HTTP ポーリング)
  ├── ローカルキャッシュ (オフライン対応)
  └── AutoUpdater
      ├── WPF   → Velopack (差分更新)
      ├── Tauri → tauri-plugin-updater
      └── Python → カスタム
```

### API キーローテーション

| プロバイダー | 暗号化 | ローテーション間隔 | キャッシュ TTL |
|------------|:------:|:----------------:|:------------:|
| Claude API | AES-256-GCM | 90日 | 24時間 |
| Syncfusion | なし（公開情報） | 365日 | 7日 |

- Claude API キーはモデル更新・アカウント変更時にサーバー側でローテーション
- クライアントは起動時 + 24時間ごとにポーリングで最新キーを取得
- ローテーション時は**旧キーを7日間有効**に保ち、全クライアントが移行する猶予を確保

### 使い方

```typescript
import {
  checkForUpdates,
  isFeatureEnabled,
  isCacheValid,
  getAutoUpdateManifestUrl,
  getUpdateNotificationType,
  REMOTE_CONFIG_ENDPOINTS,
  REMOTE_CONFIG_SETTINGS,
  AUTO_UPDATE_CONFIG,
  API_KEY_POLICIES,
} from '@/insight-common/config/remote-config';

import {
  isUpdateAvailable,
  meetsMinimumVersion,
  compareVersions,
} from '@/insight-common/config/app-versions';

// バージョンチェック（ローカル比較）
isUpdateAvailable('INSS', '2.3.0', 55);  // true（現在 2.2.0 build 50）
meetsMinimumVersion('INSS', '2.0.0', 30); // true（強制更新不要）

// サーバーレスポンスから更新判定
const result = checkForUpdates(releaseInfo, '2.2.0', 50);
const notifyType = getUpdateNotificationType(result);
// → 'dialog' | 'banner' | 'badge' | 'none' | 'force_dialog'

// フィーチャーフラグ判定
isFeatureEnabled(flag, { productCode: 'INSS', userId: 'user-123', plan: 'BIZ' });

// ポーリング間隔
REMOTE_CONFIG_SETTINGS.polling.defaultIntervalMs;  // 4時間
REMOTE_CONFIG_SETTINGS.cacheTtl.apiKeys;           // 24時間

// プラットフォーム別の自動更新 URL
getAutoUpdateManifestUrl('wpf', 'INSS');
// → 'https://releases.harmonicinsight.com/wpf/INSS/RELEASES'
```

### DB テーブル（Supabase 追加）

| テーブル | 役割 |
|---------|------|
| `app_releases` | リリース情報・DLリンク・自動更新マニフェスト |
| `api_key_vault` | 暗号化 API キー保管庫（バージョン管理付き） |
| `feature_flags` | フラグ定義・ロールアウト率・対象プラン |
| `remote_config_log` | 全変更の監査ログ |

---

## 11. プロジェクトファイル（ZIP パッケージ形式）

> **仕様定義**: `config/project-file.ts` — ZIP 内部構造・メタデータスキーマ・バリデーション

### 設計思想

Insight Business Suite のプロジェクトファイル（.inss / .iosh / .iosd）は **ZIP 形式のアーカイブ**。
Office ドキュメント + メタデータ + 付随データを 1 ファイルに集約し、ファイル 1 つ移動すれば全データが移動する。
.docx / .xlsx / .pptx / .epub 等と同じ業界標準の ZIP ベースアプローチ。

### ファイル関連付け

| 製品 | 独自拡張子 | 内包 Office 形式 | 右クリック対象 |
|------|----------|-----------------|--------------|
| INSS | `.inss` | .pptx | .pptx, .ppt |
| IOSH | `.iosh` | .xlsx | .xlsx, .xls, .csv |
| IOSD | `.iosd` | .docx | .docx, .doc |

### プロジェクトファイル構造（ZIP 形式）

```
report.iosh (ZIP archive)
├── [content_types].xml          # コンテントタイプ定義（OPC 準拠）
├── metadata.json                # プロジェクトメタデータ（バージョン、作成者、最終更新日）
├── document.xlsx                # 元の Office ファイル（製品により .pptx / .docx）
├── sticky_notes.json            # 付箋データ
├── ai_memory.json               # AI ホットキャッシュ
├── ai_memory_deep/              # AI ディープストレージ（ENT）
│   ├── glossary.json
│   ├── people.json
│   ├── projects.json
│   └── context.json
├── ai_chat_history.json         # AI チャット履歴
├── history/                     # バージョン履歴
│   ├── index.json               # 履歴インデックス
│   └── snapshots/               # 過去バージョンのスナップショット
├── references/                  # 参考資料
│   ├── index.json               # 参考資料インデックス
│   └── files/                   # 添付ファイル本体
└── scripts/                     # Python スクリプト
    ├── index.json               # スクリプトインデックス
    └── files/
```

### 実装ガイドライン（C# WPF）

- `System.IO.Compression.ZipArchive`（.NET 標準）を使用、外部ライブラリ不要
- **保存時**: 一時ファイルに書き込み → 完了後にリネーム（アトミック保存で破損防止）
- **読込時**: 一時ディレクトリに展開 → アプリ終了時にクリーンアップ
- **マイグレーション**: 既存 .xlsx を右クリック→「Insight Performance Management で開く」で .iosh に自動変換

### API

```typescript
// ファイル関連付け（config/products.ts）
import {
  resolveProductByExtension,
  getContextMenuProducts,
  getFileAssociationInfo,
} from '@/insight-common/config/products';

resolveProductByExtension('iosh');  // 'IOSH'
getContextMenuProducts('xlsx');     // [{ product: 'IOSH', label: 'Insight Performance Management で開く' }]
getFileAssociationInfo('IOSH');     // { progId: 'HarmonicInsight.InsightPerformanceManagement', ... }

// ZIP パッケージ仕様（config/project-file.ts）
import {
  PROJECT_FILE_PATHS,
  PROJECT_FILE_LIMITS,
  getInnerDocumentName,
  getInitialEntries,
  createEmptyMetadata,
  getNewDocumentTemplates,
  createNewDocumentMetadata,
  validateMetadata,
  checkProjectFileLimits,
  generateContentTypesXml,
} from '@/insight-common/config/project-file';

// ZIP 内パス参照
PROJECT_FILE_PATHS.METADATA;        // 'metadata.json'
PROJECT_FILE_PATHS.HISTORY_INDEX;   // 'history/index.json'
getInnerDocumentName('IOSH');       // 'document.xlsx'

// 新規プロジェクト作成時のエントリ一覧
const entries = getInitialEntries('IOSH');
// → [{ path: 'metadata.json', type: 'json', required: true }, ...]

// 既存ファイルインポート時のメタデータ生成
const metadata = createEmptyMetadata('IOSH', '売上報告.xlsx', '山田太郎', '2.0.0', 38);

// 新規作成（MS Office 不要 — Syncfusion で空の Office ファイルを生成）
const templates = getNewDocumentTemplates('IOSH');
// → [{ type: 'blank_spreadsheet', nameJa: '空のスプレッドシート', syncfusionApi: 'Syncfusion.XlsIO.ExcelEngine', ... }]
const newMeta = createNewDocumentMetadata('IOSH', 'blank_spreadsheet', '山田太郎', '2.0.0', 38);
// → metadata.originalFileName === '新しいスプレッドシート.xlsx'

// プラン別容量制限チェック
checkProjectFileLimits('BIZ', { historyVersions: 25 });
// → { withinLimits: false, exceeded: ['history_versions (25/20)'] }
```

## 12. InsightBot Orchestrator / Agent アーキテクチャ

### 概要

InsightBot を UiPath Orchestrator 相当の中央管理サーバーとして位置付け、
Insight Business Suite 各アプリ（INSS/IOSH/IOSD）を Agent（実行端末）として
リモート JOB 配信・実行監視を実現する。

```
┌─────────────────────────────────────────────────────────┐
│  InsightBot (Orchestrator) — ENT                           │
│  ├ JOB 作成・編集（AI エディター）                         │
│  ├ Agent ダッシュボード（登録・状態監視）                   │
│  ├ スケジューラー（cron 相当の定期実行）                    │
│  └ 実行ログ集約                                          │
│                     WebSocket / REST                      │
├──────────────────────┼───────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │ ← Business Suite│
│  │ IOSH     │  │ INSS     │  │ IOSD     │  + bot_agent  │
│  │ 経理PC   │  │ 営業PC   │  │ 法務PC   │    モジュール   │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### UiPath との差別化

UiPath はファイルを「外から」UI オートメーションで操作する。
InsightBot + Insight Business Suite はドキュメントを「中から」直接操作する。
ファイルロック・UI 遅延の問題がなく、セル・スライド・段落を高速に処理。

### プラン別制限（INBT）

| 機能 | FREE | BIZ | ENT |
|------|:----:|:---:|:---:|
| Orchestrator | ❌ | ❌ | ✅ |
| Agent 管理数 | - | - | 無制限 |
| スケジューラー | ❌ | ❌ | ✅ |
| 同時 JOB 配信 | - | - | 無制限 |
| ログ保持期間 | - | - | 365日 |

### API

```typescript
import {
  canUseOrchestrator,
  canAddAgent,
  ORCHESTRATOR_API,
} from '@/insight-common/config/orchestrator';

// Orchestrator 利用可否
canUseOrchestrator('ENT');  // true
canUseOrchestrator('BIZ');  // false

// Agent 追加可否
canAddAgent('ENT', 45);     // true
canAddAgent('ENT', 100);    // true（無制限）

// API エンドポイント
ORCHESTRATOR_API.defaultPort;           // 9400
ORCHESTRATOR_API.endpoints.jobs.dispatch;  // { method: 'POST', path: '/api/jobs/:jobId/dispatch' }
```

### Insight Business Suite 側（Agent モジュール）

```typescript
// addon-modules.ts の bot_agent モジュールを有効化
// → InsightBot Orchestrator からの JOB 受信が可能に
canEnableModule('IOSH', 'bot_agent', 'ENT', ['python_runtime']);  // { allowed: true }
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
│  Agent (Insight Business Suite)                            │
│  Step 1: 売上.xlsx を開く → スクリプト実行 → 保存して閉じる │
│  Step 2: 経費.xlsx を開く → スクリプト実行 → 保存して閉じる │
│  Step 3: 報告書.docx を開く → スクリプト実行 → 保存して閉じる│
│  → 全ステップ完了を Orchestrator に報告                    │
└──────────────────────────────────────────────────────────┘
```

### 利用パターン別機能マトリクス

| パターン | 対象ユーザー | プラン | 機能 |
|---------|------------|--------|------|
| **個人 AI 利用** | 一般ユーザー | FREE/BIZ | AI チャット + 基本機能 |
| **市民開発** | パワーユーザー | ENT | Python + AI エディター + ローカルワークフロー |
| **リモート RPA** | BPO / IT 部門 | ENT (INBT) | Orchestrator + Agent + スケジューラー |

### ローカルワークフロー（ENT Insight Business Suite）

ENT の Insight Business Suite ユーザーは Orchestrator なしで、ローカル PC 上の簡易自動化が可能。

```typescript
import { canEnableModule } from '@/insight-common/config/addon-modules';

// ENT ユーザーはローカルワークフローを有効化可能
canEnableModule('IOSH', 'local_workflow', 'ENT', ['python_runtime', 'python_scripts']);
// { allowed: true }

// BIZ ユーザーは不可
canEnableModule('IOSH', 'local_workflow', 'BIZ', ['python_runtime', 'python_scripts']);
// { allowed: false, reasonJa: 'ローカルワークフローには TRIAL/ENT プランが必要です' }
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

## 13. 開発完了チェックリスト

- [ ] **デザイン**: Gold (#B8942F) がプライマリに使用されている
- [ ] **デザイン**: Ivory (#FAF8F5) が背景に使用されている
- [ ] **デザイン**: 青色がプライマリとして使用されて**いない**
- [ ] **ライセンス**: InsightLicenseManager が実装されている
- [ ] **ライセンス**: ライセンス画面が Insight Slides 形式に準拠
- [ ] **サードパーティ**: Syncfusion キーが `third-party-licenses.json` 経由で登録されている
- [ ] **製品コード**: config/products.ts に登録されている
- [ ] **AI アシスタント**: `standards/AI_ASSISTANT.md` に準拠（Insight Business Suite 系のみ）
- [ ] **AI アシスタント**: モデルティア（Standard/Premium）制御が実装されている
- [ ] **AI アシスタント**: BYOK（クライアント自社 API キー）が実装されている（回数制限なし・モデル制限なし）
- [ ] **プロジェクトファイル**: 独自拡張子（.inss/.iosh/.iosd）がインストーラーで登録されている
- [ ] **プロジェクトファイル**: コマンドライン引数でファイルパスを受け取る起動処理が実装されている
- [ ] **Orchestrator**: InsightBot ENT で Agent 管理 UI が実装されている（INBT のみ）
- [ ] **ワークフロー**: BPO パターン（Orchestrator → Agent 連続ファイル処理）が動作する（INBT ENT のみ）
- [ ] **ローカルワークフロー**: ENT Insight Business Suite でローカル連続処理が動作する（ENT のみ）
- [ ] **メニューアイコン**: `brand/menu-icons.json` の定義に従っている（Lucide Icons 統一）
- [ ] **メニューアイコン**: 非標準アイコンライブラリ（Material Design / Font Awesome 等）を使用して**いない**
- [ ] **メニューアイコン**: `validate-menu-icons.sh` が成功する
- [ ] **ローカライゼーション**: UI テキストがハードコードされて**いない**（リソースファイル経由）
- [ ] **ローカライゼーション**: XAML 内に日本語ハードコードテキストがない（WPF — DynamicResource / LanguageManager 経由）
- [ ] **ローカライゼーション**: C# コード内のユーザー向けメッセージがローカライズ済み（WPF）
- [ ] **ローカライゼーション**: 日本語（デフォルト）+ 英語の翻訳が完全に用意されている
- [ ] **ローカライゼーション**: ストアメタデータ（タイトル・説明）が日英で用意されている（モバイルアプリのみ）
- [ ] **セキュリティ**: ライセンス秘密鍵がソースにハードコードされて**いない**（WPF — 非対称鍵署名推奨）
- [ ] **セキュリティ**: API キー（Claude 等）が暗号化保存されている（WPF — DPAPI / Credential Manager）
- [ ] **セキュリティ**: ライセンスデータ（license.json）が暗号化保存されている（WPF — DPAPI 推奨）
- [ ] **アクセシビリティ**: 主要 UI コントロールに `AutomationProperties.Name` が設定されている（WPF）
- [ ] **コード品質**: 空の catch ブロックがない（例外の握りつぶし禁止）
- [ ] **コード品質**: IDisposable の Dispose でイベント購読が解除されている（WPF）
- [ ] **コード品質**: バージョン番号が複数箇所にハードコードされて**いない**（一元管理）
- [ ] **セキュリティ**: ハイパーリンク URL の `javascript:` スキームが検証されている（WPF）
- [ ] **セキュリティ**: `UnobservedTaskException` ハンドラがログ出力付きで登録されている（WPF）
- [ ] **検証**: `validate-standards.sh` が成功する
- [ ] **バージョン**: `config/app-versions.ts` のバージョン・ビルド番号が更新されている
- [ ] **互換性**: `compatibility/` の NG 組み合わせに該当していない
- [ ] **リモートコンフィグ**: 起動時のバージョンチェックが実装されている（`remote-config.ts`）
- [ ] **リモートコンフィグ**: API キー（Claude/Syncfusion）がリモート取得に対応している
- [ ] **リモートコンフィグ**: モデルレジストリがリモート更新に対応している（AI 搭載アプリのみ）
- [ ] **ヘルプ**: `HelpWindow.xaml` + `.cs` が存在する（WPF アプリ）
- [ ] **ヘルプ**: セクション ID が全て string 型（integer 禁止）
- [ ] **ヘルプ**: `ShowDialog()` で開く（`Show()` 禁止）
- [ ] **ヘルプ**: 必須6セクション（overview, ui-layout, shortcuts, license, system-req, support）が含まれる
- [ ] **ヘルプ**: AI 搭載製品は `ai-assistant` セクションが含まれる
- [ ] **ヘルプ**: 全パネルヘッダーに ? ボタンがある
- [ ] **ヘルプ**: F1 キーで HelpWindow が開く
- [ ] **ヘルプ**: `static ShowSection()` メソッドが実装されている
- [ ] **ヘルプ**: ヘルプコンテンツがマーケティング方針（`HELP_SYSTEM.md` §0）に準拠
- [ ] **アクセシビリティ**: `InsightScaleManager.ApplyToWindow()` が呼ばれている（InsightWindowChrome 経由で自動適用）
- [ ] **アクセシビリティ**: Ctrl+Plus / Ctrl+Minus / Ctrl+0 キーバインドがある
- [ ] **アクセシビリティ**: ステータスバーにスケール倍率が表示されている

## 14. リリースチェック

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
- [ ] **コード品質**: 空の catch ブロックがない（例外の握りつぶし禁止）
- [ ] **コード品質**: バージョン番号が全箇所で一致している
- [ ] **セキュリティ**: ハードコードされた API キー・シークレットがない
- [ ] **セキュリティ**: ライセンス秘密鍵がソースにハードコードされていない
- [ ] **セキュリティ**: .env / credentials / secrets が .gitignore に含まれている
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
- [ ] **バージョン**: バージョン番号が .csproj / XAML / C# コードで一致
- [ ] **バージョン**: Copyright 年が最新
- [ ] **サードパーティ**: Syncfusion キーがハードコードされて**いない**
- [ ] **セキュリティ**: ライセンス秘密鍵がハードコードされていない（`standards/CSHARP_WPF.md` 参照）
- [ ] **セキュリティ**: API キーが DPAPI / Credential Manager で暗号化保存
- [ ] **セキュリティ**: license.json が暗号化保存（DPAPI 推奨）
- [ ] **アクセシビリティ**: 主要 UI コントロールに `AutomationProperties.Name` 設定
- [ ] **コード品質**: 空の catch ブロックがない
- [ ] **コード品質**: Dispose でイベント購読が解除されている
- [ ] **ローカライゼーション**: XAML 内に日本語ハードコードテキストがない
- [ ] **ローカライゼーション**: C# コード内のメッセージがローカライズ済み
- [ ] **セキュリティ**: ハイパーリンク URL スキーム検証済み（javascript: XSS 防止）
- [ ] **セキュリティ**: `UnobservedTaskException` ハンドラが登録済み（ログ出力付き）
- [ ] **配布**: インストーラーの動作確認（クリーン環境）
- [ ] **ファイル関連付け**: 独自拡張子の登録・動作確認
- [ ] **ヘルプ**: HelpWindow が `standards/HELP_SYSTEM.md` に準拠
- [ ] **ヘルプ**: ヘルプコンテンツのセクション ID が string（integer 禁止）
- [ ] **ヘルプ**: 共通コンテンツ（ライセンス・システム要件・サポート）が最新

#### React / Next.js 固有
- [ ] **ビルド**: `next build` が成功する
- [ ] **品質**: TypeScript strict mode が有効
- [ ] **品質**: console.log が残っていない
- [ ] **環境**: 本番環境変数が設定されている

#### Python 固有
- [ ] **バージョン**: pyproject.toml のバージョンが更新されている
- [ ] **依存**: 全パッケージがピン留め（`==`）されている

## 15. アプリバージョン管理

### バージョンレジストリ

全製品のバージョン・ビルド番号は `config/app-versions.ts` で一元管理しています。

```typescript
import { getAppVersion, getBuildNumber, toAndroidVersionCode, toIosBundleVersion } from '@/insight-common/config/app-versions';

// バージョン取得
getAppVersion('INSS');        // '2.2.0'
getBuildNumber('INSS');       // 50

// プラットフォーム固有の形式
toAndroidVersionCode('INSS'); // 2002050
toIosBundleVersion('INSS');   // '2.2.0.50'
```

### バージョン更新手順

1. `config/app-versions.ts` の該当製品の `version` / `buildNumber` を更新
2. `releaseHistory` に新エントリを追加
3. `toolchain` がアプリの実際のツールチェーンと一致することを確認
4. `validate-standards.sh` で検証

## 16. ライブラリ互換性マトリクス

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

## 17. 困ったときは

```bash
# 標準検証
./insight-common/scripts/validate-standards.sh .

# リリースチェック（包括的）
./insight-common/scripts/release-check.sh .

# ビルドエラー自動解消（iOS/Android/WPF/React/Python/Tauri）
./insight-common/scripts/build-doctor.sh .

# メニューアイコン標準検証
./insight-common/scripts/validate-menu-icons.sh .

# ヘルプシステム標準検証（WPF プロジェクト）
./insight-common/scripts/validate-help.sh .

# セットアップ確認
./insight-common/scripts/check-app.sh

# プラットフォーム別ガイド参照
cat insight-common/standards/CSHARP_WPF.md  # C#
cat insight-common/standards/PYTHON.md      # Python
cat insight-common/standards/REACT.md       # React
cat insight-common/standards/ANDROID.md     # Android
cat insight-common/standards/IOS.md         # iOS

# メニューアイコン標準
cat insight-common/standards/MENU_ICONS.md

# アクセシビリティ標準（UI スケーリング）
cat insight-common/standards/ACCESSIBILITY.md

# ヘルプシステム標準
cat insight-common/standards/HELP_SYSTEM.md

# リリースチェックリスト
cat insight-common/standards/RELEASE_CHECKLIST.md

# Syncfusion セットアップ（Community License）
cat insight-common/docs/SYNCFUSION_SETUP.md
```

---

**⚠️ このガイドに従わないコードはレビューで却下されます。**
**⚠️ AI アシスタントは、このガイドを確認せずにコードを生成してはいけません。**
**⚠️ リリース前に `/release-check` を実行せずにリリースしてはいけません。**
