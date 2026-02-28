# Anthropic Knowledge Work Plugins 統合分析レポート

> **調査対象**: https://github.com/anthropics/knowledge-work-plugins
> **調査日**: 2026-02-08
> **目的**: HARMONIC insight 製品群への統合で参考可能な要素の抽出

---

## 1. リポジトリ概要

Anthropic が公開している **Claude Cowork / Claude Code 向けプラグインマーケットプレイス**。
11 個の公式プラグインが Markdown ベースで構成されており、コードレス・インフラレスで動作する。

### プラグイン一覧

| # | プラグイン名 | 対象職種 | コネクタ数 |
|:-:|-------------|---------|:--------:|
| 1 | **productivity** | 全職種 | 8 |
| 2 | **sales** | 営業 | 9 |
| 3 | **customer-support** | カスタマーサポート | 7 |
| 4 | **product-management** | プロダクトマネージャー | 12 |
| 5 | **marketing** | マーケティング | 9 |
| 6 | **finance** | 経理・財務 | 5 |
| 7 | **legal** | 法務 | 5 |
| 8 | **data** | データ分析 | 6 |
| 9 | **enterprise-search** | 全職種 | 6 |
| 10 | **bio-research** | ライフサイエンス研究 | 10 |
| 11 | **cowork-plugin-management** | プラグイン管理 | 0 |

---

## 2. プラグインアーキテクチャ

### 2.1 標準ディレクトリ構造

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # マニフェスト（名前、バージョン・説明）
├── .mcp.json                # MCP コネクタ定義
├── commands/                # スラッシュコマンド（.md ファイル）
│   ├── command-a.md
│   └── command-b.md
├── skills/                  # ドメイン知識（SKILL.md ファイル）
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
├── CONNECTORS.md            # コネクタ説明
├── README.md
└── LICENSE
```

### 2.2 plugin.json（マニフェスト）

```json
{
  "name": "productivity",
  "version": "1.0.0",
  "description": "Manage tasks, plan your day, ...",
  "author": { "name": "Anthropic" }
}
```

**ポイント**: 極めてシンプルな 4 フィールド構成。

### 2.3 .mcp.json（コネクタ定義）

```json
{
  "mcpServers": {
    "slack": { "type": "http", "url": "https://mcp.slack.com/mcp" },
    "notion": { "type": "http", "url": "https://mcp.notion.com/mcp" },
    "atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp" }
  }
}
```

**ポイント**: MCP（Model Context Protocol）でツール接続を標準化。HTTP ベース。

### 2.4 Skills（ドメイン知識）

- Claude が **自動的に** 関連する場面で参照する背景知識
- Markdown ファイルで記述、YAML frontmatter でメタデータ定義
- 業務フロー・判断基準・テンプレート・優先度ルールを含む

### 2.5 Commands（スラッシュコマンド）

- ユーザーが **明示的に** 呼び出すアクション
- `/plugin-name:command-name` 形式
- ワークフロー手順を Markdown で定義

### 2.6 カスタマイズポイント（`~~` プレースホルダー）

プラグイン内で `~~chat`、`~~knowledge base`、`~~project tracker` のように `~~` 接頭辞のプレースホルダーが使用されており、組織固有のツール名に置換する設計。

---

## 3. 各プラグイン詳細分析

### 3.1 Productivity（生産性管理）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/start`（初期化）、`/update`（同期・更新）、`/update --comprehensive`（深層スキャン） |
| **スキル** | task-management、memory-management |
| **コネクタ** | Slack, Notion, Asana, Linear, Jira, Monday, ClickUp, MS365 |

**核心機能**:

1. **TASKS.md ベースのタスク管理**
   - Active / Waiting On / Someday / Done の 4 セクション
   - `- [ ] **タスク名** - コンテキスト、担当者、期限` 形式
   - dashboard.html でドラッグ&ドロップ可能なビジュアルボード

2. **2 層メモリシステム**
   - **ホットキャッシュ**（CLAUDE.md）: ~100 行、10 人・30 略語・アクティブプロジェクト
   - **ディープストレージ**（memory/）: glossary.md、people/、projects/、context/
   - 90% のクエリをホットキャッシュで処理
   - 使用頻度に基づく昇格・降格メカニズム

3. **外部ツール同期**
   - `/update` でタスクトラッカー、チャット、メール、カレンダーと同期
   - ステイル（古い）アイテムの自動トリアージ
   - **ユーザー確認なしのタスク自動追加は禁止**

### 3.2 Sales（営業支援）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/call-summary`、`/forecast`、`/pipeline-review` |
| **スキル** | account-research、call-prep、daily-briefing、draft-outreach、competitive-intelligence、create-an-asset |
| **コネクタ** | Slack, HubSpot, Close, Clay, ZoomInfo, Notion, Jira, Fireflies, MS365 |

**核心機能**:

1. **商談準備（call-prep）**
   - 会社名・ミーティング種別・出席者からブリーフィングを自動生成
   - Web リサーチ + CRM + メール + チャット履歴を統合
   - ディスカバリー / デモ / 交渉 / チェックインに応じたカスタマイズ

2. **パイプラインレビュー**
   - 加重売上予測の自動生成
   - パイプライン健全性分析

3. **競合インテリジェンス**
   - 競合調査・バトルカード作成

### 3.3 Customer Support（カスタマーサポート）

| 項目 | 内容 |
|------|------|
| **コマンド** | チケット対応コマンド群 |
| **スキル** | ticket-triage、customer-research、response-drafting、escalation、knowledge-management |
| **コネクタ** | Slack, Intercom, HubSpot, Guru, Jira, Notion, MS365 |

**核心機能**:

1. **チケットトリアージ（ticket-triage）**
   - 9 カテゴリ分類: Bug / How-to / Feature Request / Billing / Account / Integration / Security / Data / Performance
   - 4 段階優先度: P1（1h 対応）/ P2（4h）/ P3（1 営業日）/ P4（2 営業日）
   - 自動ルーティングルール（Tier1 → Tier2 → Engineering → Product → Security → Billing）
   - 重複検知ロジック
   - カテゴリ別自動応答テンプレート

2. **ナレッジベース記事の自動作成**
   - 解決済みチケットから KB 記事を生成

### 3.4 Product Management（プロダクト管理）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/write-spec`、`/roadmap-update`、`/stakeholder-update`、`/synthesize-research`、`/competitive-brief`、`/metrics-review` |
| **スキル** | feature-spec、roadmap-management、stakeholder-comms、user-research-synthesis、competitive-analysis、metrics-tracking |
| **コネクタ** | Slack, Linear, Asana, Monday, ClickUp, Jira, Notion, Figma, Amplitude, Pendo, Intercom, Fireflies |

**核心機能**:

1. **PRD 作成（feature-spec）**
   - 構造化テンプレート: Problem Statement → Goals → Non-Goals → User Stories → Requirements → Success Metrics → Open Questions → Timeline
   - MoSCoW 優先度フレームワーク（P0/P1/P2）
   - Given/When/Then 形式の受入基準
   - スコープクリープ防止戦略

2. **ロードマップ管理・ステークホルダー通信**

### 3.5 Marketing（マーケティング）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/draft-content`、`/campaign-plan`、`/brand-review`、`/competitive-brief`、`/performance-report`、`/seo-audit`、`/email-sequence` |
| **スキル** | content-creation、brand-voice、campaign-planning、competitive-intelligence、performance-analytics、seo |
| **コネクタ** | Slack, Canva, Figma, HubSpot, Amplitude, Notion, Ahrefs, SimilarWeb, Klaviyo |

**核心機能**:

1. **コンテンツ作成（content-creation）**
   - 7 種テンプレート: ブログ / SNS / メールニュースレター / ランディングページ / プレスリリース / ケーススタディ
   - チャネル別ベストプラクティス（LinkedIn / X / Instagram / Facebook）
   - SEO 基礎（キーワード戦略 + オンページ SEO チェックリスト）
   - ヘッドライン・フック公式集
   - CTA ベストプラクティス

2. **ブランドレビュー・キャンペーン計画・SEO 監査**

### 3.6 Finance（財務・経理）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/journal-entry`、`/reconciliation`、`/income-statement`、`/variance-analysis`、`/sox-testing` |
| **スキル** | journal-entry-prep、reconciliation、financial-statements、variance-analysis、close-management、audit-support |
| **コネクタ** | Snowflake, Databricks, BigQuery, Slack, MS365 |

**核心機能**:

1. **仕訳準備（journal-entry-prep）**
   - 5 種仕訳: AP 未払計上 / 固定資産減価償却 / 前払費用償却 / 給与計上 / 収益認識（ASC 606）
   - 承認マトリクス（金額ティア別）

2. **差異分析（variance-analysis）**
   - Price/Volume 分析、Rate/Mix 分析、人件費分析
   - マテリアリティ閾値（±20%）
   - ウォーターフォールチャートによる可視化

3. **SOX 404 テスト・月次クローズ管理**

### 3.7 Legal（法務）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/review-contract`、`/triage-nda`、`/vendor-check`、`/brief`、`/respond` |
| **スキル** | contract-review、nda-triage、compliance、canned-responses、legal-risk-assessment、meeting-briefing |
| **コネクタ** | Slack, Box, Egnyte, Jira, MS365 |

**核心機能**:

1. **契約レビュー（contract-review）** — 最も詳細なスキル
   - プレイブックベースのレビュー手法
   - 6 大条項分析: 責任制限 / 補償 / 知的財産 / データ保護 / 期間・解約 / 準拠法・紛争解決
   - 3 段階重大度分類: GREEN（許容） / YELLOW（交渉要） / RED（エスカレーション）
   - レッドライン生成: 具体的な代替条文 + 根拠 + フォールバック案
   - 交渉優先度: Tier 1（Deal Breakers） / Tier 2（Strong Preferences） / Tier 3（Concession Candidates）

### 3.8 Data Analysis（データ分析）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/analyze`、`/explore-data`、`/write-query`、`/create-viz`、`/build-dashboard`、`/validate` |
| **スキル** | query-writing（推定）、data-exploration、visualization、validation |
| **コネクタ** | Snowflake, Databricks, BigQuery, Hex, Amplitude, Jira |

**核心機能**:

1. **SQL クエリ作成（write-query）**
   - 自然言語 → SQL 変換
   - 9 種 SQL 方言対応（PostgreSQL / Snowflake / BigQuery / Redshift / Databricks / MySQL / SQL Server / DuckDB / SQLite）
   - CTE ベースの可読性重視構造
   - パフォーマンス最適化（パーティションフィルター、EXISTS 推奨等）
   - スキーマ自動検出（DWH 接続時）

### 3.9 Enterprise Search（社内検索）

| 項目 | 内容 |
|------|------|
| **コマンド** | `/search`、`/digest` |
| **スキル** | search-strategy、source-management、knowledge-synthesis |
| **コネクタ** | Slack, Notion, Guru, Jira, Asana, MS365 |

**核心機能**:

1. **検索戦略（search-strategy）** — クロスソース検索の知能
   - 7 種クエリタイプ分類: Decision / Status / Document / Person / Factual / Temporal / Exploratory
   - クエリ分析 → ソース別サブクエリ生成 → 並列実行
   - セマンティック検索 vs キーワード検索の使い分け
   - 重み付きランキング（Keyword Match / Freshness / Authority / Completeness）
   - 曖昧性処理・フォールバック戦略
   - クエリ段階的拡張（絞り込み → 最広範囲）

### 3.10 Plugin Manager（プラグインカスタマイザー）

| 項目 | 内容 |
|------|------|
| **コマンド** | なし |
| **スキル** | cowork-plugin-customizer |
| **コネクタ** | なし |

**核心機能**:

1. **4 フェーズカスタマイズワークフロー**
   - Phase 1: コンテキスト収集（Slack / ドキュメント / メールから組織情報を検索）
   - Phase 2: TODO リスト作成（`~~` プレースホルダーを grep で検出）
   - Phase 3: 項目完了（情報源 or ユーザーへの質問で補完）
   - Phase 4: MCP 接続（レジストリからツール検索・設定）

---

## 4. HARMONIC insight 製品への統合マッピング

### 4.1 製品別適用マトリクス

| Anthropic プラグイン | HI 製品 | 適用度 | 統合内容 |
|:---:|:---:|:---:|------|
| **Productivity** | IOSH / INSS / IOSD / INPY | **S** | タスク管理・メモリシステム、ダッシュボード |
| **Sales** | IVIN / 全製品（営業活動） | **A** | 商談準備、パイプライン管理、パートナー営業支援 |
| **Customer Support** | 全製品（サポート体制） | **A** | チケットトリアージ、応答テンプレート、KB 自動生成 |
| **Product Management** | INBT（Orchestrator） | **B** | PRD テンプレート、ロードマップ管理 |
| **Marketing** | INMV / INIG / 全製品 | **A** | コンテンツ作成、SEO、ケーススタディ生成 |
| **Finance** | IOSH | **S** | 仕訳準備、差異分析、月次クローズ、SOX テスト |
| **Legal** | IOSD | **S** | 契約レビュー、NDA トリアージ、コンプライアンス |
| **Data Analysis** | IOSH / INPY | **S** | SQL 生成、データ探索、可視化、バリデーション |
| **Enterprise Search** | 全製品（横断検索） | **A** | マルチソース検索、ナレッジ統合 |
| **Bio-Research** | — | **C** | 直接適用なし（業界特化テンプレートの参考） |
| **Plugin Manager** | 全製品 | **S** | プラグインアーキテクチャの共通基盤 |

> **S**: 直接統合（共通化対象）、**A**: 参考実装（カスタマイズして反映）、**B**: 部分参考、**C**: 構造のみ参考

---

## 5. 共通化提案: Insight Business Suite プラグインシステム

### 5.1 プラグインアーキテクチャの導入

Anthropic のプラグイン構造を HARMONIC insight 向けにカスタマイズ:

```
insight-common/
├── plugins/                          # 共通プラグイン基盤
│   ├── plugin-schema.json            # プラグインマニフェストスキーマ
│   ├── plugin-loader.ts              # プラグインローダー
│   └── types.ts                      # プラグイン型定義
│
├── plugins-marketplace/              # HI 公式プラグイン
│   ├── insight-productivity/         # 生産性管理
│   ├── insight-finance/              # 経理・財務（IOSH 特化）
│   ├── insight-legal/                # 法務（IOSD 特化）
│   ├── insight-data-analysis/        # データ分析（IOSH + INPY）
│   ├── insight-sales/                # 営業支援（パートナー向け）
│   ├── insight-support/              # サポート（自社 + パートナー）
│   └── insight-marketing/            # マーケティング（INMV + INIG）
```

### 5.2 HI プラグインマニフェスト（plugin.json 拡張）

```json
{
  "name": "insight-finance",
  "version": "1.0.0",
  "description": "経理・財務ワークフロー支援。仕訳準備、差異分析、月次クローズを効率化。",
  "author": { "name": "HARMONIC insight" },
  "targetProducts": ["IOSH", "INPY"],
  "requiredPlan": "BIZ",
  "locale": ["ja", "en"],
  "aiFeatureKey": "ai_assistant"
}
```

**Anthropic 拡張ポイント**:
- `targetProducts`: 対象 HI 製品コード
- `requiredPlan`: 必須プラン（FREE/TRIAL/BIZ/ENT）
- `locale`: 対応言語
- `aiFeatureKey`: ライセンスゲートのキー

### 5.3 MCP コネクタの HI 向け定義

```json
{
  "mcpServers": {
    "insight-license": {
      "type": "http",
      "url": "https://license.harmonicinsight.com/mcp"
    },
    "insight-orchestrator": {
      "type": "http",
      "url": "http://localhost:9400/mcp"
    },
    "supabase": {
      "type": "http",
      "url": "https://your-project.supabase.co/mcp"
    }
  }
}
```

---

## 6. 直接統合提案: AI アシスタントへのスキル組み込み

### 6.1 IOSH（Insight Performance Management）向けスキル

Finance プラグインと Data Analysis プラグインを統合:

| スキル名 | 参考元 | 概要 |
|---------|--------|------|
| `spreadsheet-journal-entry` | Finance: journal-entry-prep | 仕訳テンプレート・承認マトリクス |
| `spreadsheet-reconciliation` | Finance: reconciliation | 勘定照合ワークフロー |
| `spreadsheet-variance-analysis` | Finance: variance-analysis | Price/Volume 分析・ウォーターフォール |
| `spreadsheet-query-writing` | Data: write-query | 自然言語 → Excel 数式 / SQL 変換 |
| `spreadsheet-data-validation` | Data: validate | データ品質チェック |
| `spreadsheet-close-management` | Finance: close-management | 月次クローズチェックリスト |

**実装イメージ**（ai-assistant.ts への統合）:

```typescript
// config/ai-assistant-skills.ts
export const IOSH_SKILLS: SkillDefinition[] = [
  {
    name: 'spreadsheet-journal-entry',
    description: '仕訳準備・承認ワークフロー支援',
    triggerPatterns: ['仕訳', '計上', 'accrual', 'journal entry', '減価償却'],
    systemPromptExtension: `/* Finance plugin の journal-entry-prep SKILL.md から抽出 */`,
    requiredPlan: 'BIZ',
  },
  {
    name: 'spreadsheet-variance-analysis',
    description: '差異分析・要因分析',
    triggerPatterns: ['差異', '分析', 'variance', '予実', '乖離'],
    systemPromptExtension: `/* Finance plugin の variance-analysis SKILL.md から抽出 */`,
    requiredPlan: 'BIZ',
  },
  // ...
];
```

### 6.2 IOSD（Insight AI Briefcase）向けスキル

Legal プラグインと Marketing プラグインを統合:

| スキル名 | 参考元 | 概要 |
|---------|--------|------|
| `document-contract-review` | Legal: contract-review | 契約条項分析・レッドライン生成 |
| `document-nda-triage` | Legal: nda-triage | NDA 迅速審査 |
| `document-compliance-check` | Legal: compliance | コンプライアンス確認 |
| `document-content-creation` | Marketing: content-creation | ブログ / プレスリリース / ケーススタディ作成 |
| `document-brand-review` | Marketing: brand-voice | ブランドガイドライン準拠チェック |

### 6.3 INSS（Insight Deck Quality Gate）向けスキル

| スキル名 | 参考元 | 概要 |
|---------|--------|------|
| `slide-stakeholder-update` | PM: stakeholder-comms | ステークホルダー向けプレゼン作成 |
| `slide-competitive-brief` | Sales/PM: competitive-intelligence | 競合分析スライド |
| `slide-campaign-plan` | Marketing: campaign-planning | キャンペーンプランスライド |

### 6.4 INPY（InsightPy）向けスキル

| スキル名 | 参考元 | 概要 |
|---------|--------|------|
| `python-data-analysis` | Data: analyze + explore-data | データ分析スクリプト生成 |
| `python-query-writing` | Data: write-query | SQL クエリ作成 |
| `python-visualization` | Data: create-viz | 可視化スクリプト生成 |
| `python-data-validation` | Data: validate | データ品質バリデーション |

### 6.5 全製品共通スキル

| スキル名 | 参考元 | 概要 |
|---------|--------|------|
| `common-task-management` | Productivity: task-management | タスク管理 |
| `common-memory-management` | Productivity: memory-management | 組織コンテキスト記憶 |
| `common-enterprise-search` | Enterprise Search: search-strategy | 横断検索 |

---

## 7. 参考実装: 自社営業・サポート向け内部ツール

### 7.1 パートナー営業支援（Sales プラグイン参考）

Sales プラグインの構造を HI のパートナープログラムに適用:

| 機能 | 実装イメージ |
|------|------------|
| **パートナー商談準備** | `/sales:call-prep` → パートナー企業情報 + 過去案件 + 製品情報を統合したブリーフィング自動生成 |
| **パイプラインレビュー** | `/sales:pipeline-review` → パートナーティア別の販売実績・予測ダッシュボード |
| **競合バトルカード** | `/sales:competitive-brief` → UiPath / Power Automate との差別化資料自動生成 |
| **売上予測** | `/sales:forecast` → Stripe + 請求書データから加重予測 |

### 7.2 カスタマーサポート体制（Customer Support プラグイン参考）

チケットトリアージのフレームワークを HI サポートに直接適用:

```
HI サポートカテゴリ分類:
├── Bug（製品バグ）
├── How-to（操作方法）
├── License（ライセンス関連）
├── AI-Assistant（AI 機能関連）
├── Integration（連携・API 関連）
├── Feature-Request（機能要望）
└── Partner（パートナー向け）

HI 優先度:
├── P1: 製品が全く使えない / データ損失 → 1h 以内対応
├── P2: 主要機能が動作しない → 4h 以内対応
├── P3: 回避策あり / 単一ユーザー影響 → 1 営業日以内
└── P4: 軽微 / 機能要望 / 操作質問 → 2 営業日以内
```

### 7.3 マーケティング活動（Marketing プラグイン参考）

| 活動 | 参考要素 |
|------|---------|
| **セミナー告知** | content-creation スキルのブログ・SNS テンプレート |
| **ケーススタディ作成** | case study テンプレート（課題 → 解決 → 成果 → 引用 → CTA） |
| **SEO 対策** | SEO チェックリスト・キーワード戦略 |
| **メール配信** | email-sequence コマンドのマルチステップ設計 |
| **ランディングページ** | LP テンプレート（ヒーロー → 価値提案 → 社会的証明 → FAQ → CTA） |

---

## 8. メモリシステムの導入提案

### 8.1 AI アシスタントへの 2 層メモリシステム導入

Productivity プラグインのメモリアーキテクチャを Insight Business Suite AI アシスタントに統合:

```
プロジェクトファイル（.iosh / .inss / .iosd）
├── ai_chat_history.json        # 既存: チャット履歴
├── ai_memory.json              # 新規: ホットキャッシュ（50 エントリ）
│   ├── people[]                # 頻出人物（名前、役職・関連プロジェクト）
│   ├── glossary[]              # 社内用語・専門用語
│   ├── active_projects[]       # アクティブプロジェクト
│   └── preferences[]           # ユーザーの好み（表示形式等）
└── ai_memory_deep/             # 新規: ディープストレージ
    ├── glossary.json           # 完全用語集
    ├── people/                 # 人物詳細プロファイル
    └── context/                # 組織コンテキスト
```

**検索フロー**:
1. `ai_memory.json`（ホットキャッシュ）をまず参照
2. 見つからなければ `ai_memory_deep/` を検索
3. それでも不足ならユーザーに質問
4. 学習した内容を自動的に適切な層に保存

### 8.2 プラン別メモリ制限

| プラン | ホットキャッシュ | ディープストレージ |
|:------:|:--------------:|:----------------:|
| FREE | 20 エントリ | なし |
| BIZ | 100 エントリ | 500 エントリ |
| ENT | 無制限 | 無制限 |

---

## 9. Enterprise Search の InsightBot 統合

### 9.1 Orchestrator への横断検索機能追加

Enterprise Search プラグインの検索戦略を InsightBot Orchestrator に統合:

```
InsightBot Orchestrator（BIZ+）
  └── /search コマンド
      ├── IOSH ファイル群からの検索
      ├── INSS ファイル群からの検索
      ├── IOSD ファイル群からの検索
      ├── INPY スクリプト群からの検索
      └── 結果統合・ランキング・重複除去
```

**クエリタイプ分類**（Enterprise Search 参考）:

| クエリタイプ | 検索戦略 |
|------------|---------|
| 数値検索 | IOSH ファイル優先 → INPY スクリプト |
| 書類検索 | IOSD ファイル優先 → INSS スライド |
| 人物検索 | 全ファイルの作成者・変更者メタデータ |
| 時系列検索 | バージョン履歴からの時間順検索 |

---

## 10. 建設業界向けカスタムプラグイン設計

Plugin Manager の仕組みを参考に、建設業界向けプラグインの設計指針:

### 10.1 想定プラグイン構造

```
insight-construction/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── commands/
│   ├── site-report.md           # 現場報告書作成
│   ├── safety-check.md          # 安全管理チェック
│   ├── progress-update.md       # 工程進捗更新
│   └── cost-analysis.md         # コスト分析
├── skills/
│   ├── construction-terminology/ # 建設用語辞書
│   │   └── SKILL.md
│   ├── safety-compliance/        # 安全基準・法令
│   │   └── SKILL.md
│   ├── project-scheduling/       # 工程管理
│   │   └── SKILL.md
│   └── cost-estimation/          # 積算・見積もり
│       └── SKILL.md
└── README.md
```

### 10.2 建設業界特有のスキル定義例

**construction-terminology SKILL.md**:
- 建設業界固有の略語辞書（RC / SRC / PC / 鉄骨 / 仮設等）
- 工種分類コード
- 法令用語マッピング

**safety-compliance SKILL.md**:
- 労働安全衛生法準拠チェックリスト
- KY（危険予知）活動テンプレート
- ヒヤリハット分類・報告フォーマット

---

## 11. 実装ロードマップ

### Phase 1: 基盤整備（共通化）

| 優先度 | タスク | 対象ファイル |
|:------:|--------|------------|
| 1 | プラグインスキーマ定義 | `config/plugin-schema.ts` |
| 2 | プラグインローダー実装 | `config/plugin-loader.ts` |
| 3 | スキル型定義 | `config/ai-assistant-skills.ts` |
| 4 | メモリシステム型定義 | `config/ai-memory.ts` |

### Phase 2: 製品特化スキル実装

| 優先度 | タスク | 対象製品 |
|:------:|--------|---------|
| 1 | Finance スキル群（仕訳・差異分析・クローズ） | IOSH |
| 2 | Legal スキル群（契約レビュー・NDA） | IOSD |
| 3 | Data Analysis スキル群（SQL・可視化） | IOSH / INPY |
| 4 | Content Creation スキル群 | INSS / IOSD |

### Phase 3: 営業・サポート内部ツール

| 優先度 | タスク | 用途 |
|:------:|--------|------|
| 1 | サポートトリアージシステム | 自社サポート体制 |
| 2 | パートナー商談準備ツール | パートナー営業 |
| 3 | マーケティングテンプレート集 | コンテンツ作成 |

### Phase 4: 業界特化プラグイン

| 優先度 | タスク | 業界 |
|:------:|--------|------|
| 1 | 建設業界プラグイン | 建設 |
| 2 | 製造業プラグイン | 製造 |
| 3 | 金融業プラグイン | 金融 |

---

## 12. 設計原則（Anthropic プラグインから学ぶ）

### 12.1 "No Code, No Infrastructure, No Build Steps"

- すべて Markdown + JSON で定義
- ビルドプロセス不要
- ファイルベースのデプロイ

### 12.2 "Skills fire when relevant"

- スキルはユーザーの入力に基づいて自動的に有効化
- コマンドはユーザーが明示的に呼び出す
- この 2 層構造が使いやすさの鍵

### 12.3 "Generic starting points → Company customization"

- プラグインは汎用テンプレートとして提供
- `~~` プレースホルダーで組織固有の値に置換
- 段階的カスタマイズが可能

### 12.4 "Never auto-add without user confirmation"

- 自動アクションは常にユーザー確認を要求
- HI の AI アシスタントにも同じ原則を適用

### 12.5 "Classify → Prioritize → Route → Template"

- サポートチケットもリーガルレビューも同じパターン
- 分類 → 優先度付け → ルーティング → テンプレート応答
- この構造化アプローチは HI の全製品で活用可能

---

## 13. 技術的注意事項

### MCP（Model Context Protocol）との互換性

Anthropic プラグインは MCP サーバーを前提としている。HI 製品は現在 BYOK（API キー直接利用）モデルだが、将来的に MCP 互換レイヤーを検討する価値がある。

```
現在: ユーザー → Claude API（直接）
将来: ユーザー → Insight Business Suite → MCP Layer → Claude API + 外部ツール
```

### ライセンスゲートとの統合

Anthropic プラグインにはライセンスの概念がないが、HI ではプラン別に利用可能なスキル/コマンドを制御する必要がある:

```typescript
// スキル有効化のライセンスチェック
function canActivateSkill(
  product: ProductCode,
  skillName: string,
  plan: PlanType
): boolean {
  const skill = getSkillDefinition(skillName);
  return checkFeature(product, skill.aiFeatureKey, plan);
}
```

---

## 付録 A: Anthropic プラグインコネクタ一覧

| コネクタ名 | MCP URL | 利用プラグイン |
|-----------|---------|--------------|
| Slack | `https://mcp.slack.com/mcp` | 全プラグイン |
| Notion | `https://mcp.notion.com/mcp` | Productivity, Sales, CS, PM, Marketing, Search |
| MS365 | `https://microsoft365.mcp.claude.com/mcp` | Productivity, Sales, CS, Finance, Legal, Search |
| Asana | `https://mcp.asana.com/v2/mcp` | Productivity, PM, Search |
| Linear | `https://mcp.linear.app/mcp` | Productivity, PM |
| Atlassian (Jira) | `https://mcp.atlassian.com/v1/mcp` | Productivity, Sales, CS, PM, Data, Legal, Search |
| HubSpot | `https://mcp.hubspot.com/mcp` | Sales, CS, Marketing |
| Monday | `https://mcp.monday.com/mcp` | Productivity, PM |
| ClickUp | `https://mcp.clickup.com/mcp` | Productivity, PM |
| Intercom | `https://mcp.intercom.com/mcp` | CS, PM |
| Figma | `https://mcp.figma.com/mcp` | PM, Marketing |
| Amplitude | `https://mcp.amplitude.com/mcp` | PM, Marketing, Data |
| Snowflake | （DWH コネクタ） | Finance, Data |
| Databricks | （DWH コネクタ） | Finance, Data |
| BigQuery | （DWH コネクタ） | Finance, Data |

## 付録 B: 参考 URL

- リポジトリ: https://github.com/anthropics/knowledge-work-plugins
- プラグインマーケットプレイス: https://claude.com/plugins
- MCP 仕様: https://modelcontextprotocol.io/
