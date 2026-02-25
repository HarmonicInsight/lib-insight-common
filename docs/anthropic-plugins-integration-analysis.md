# Anthropic Knowledge Work Plugins 統合�E析レポ�EチE

> **調査対象**: https://github.com/anthropics/knowledge-work-plugins
> **調査日**: 2026-02-08
> **目皁E*: HARMONIC insight 製品群への統合�E参老E��能な要素の抽出

---

## 1. リポジトリ概要E

Anthropic が�E開しぁE**Claude Cowork / Claude Code 向けプラグインマ�EケチE��プレイス**、E
11 個�E公式�EラグインぁEMarkdown ベ�Eスで構�Eされており、コードレス・インフラレスで動作する、E

### プラグイン一覧

| # | プラグイン吁E| 対象職種 | コネクタ数 |
|:-:|-------------|---------|:--------:|
| 1 | **productivity** | 全職種 | 8 |
| 2 | **sales** | 営業 | 9 |
| 3 | **customer-support** | カスタマ�Eサポ�EチE| 7 |
| 4 | **product-management** | プロダクト�Eネ�Eジャー | 12 |
| 5 | **marketing** | マ�EケチE��ング | 9 |
| 6 | **finance** | 経理・財勁E| 5 |
| 7 | **legal** | 法務 | 5 |
| 8 | **data** | チE�Eタ刁E�� | 6 |
| 9 | **enterprise-search** | 全職種 | 6 |
| 10 | **bio-research** | ライフサイエンス研究 | 10 |
| 11 | **cowork-plugin-management** | プラグイン管琁E��E| 0 |

---

## 2. プラグインアーキチE��チャ

### 2.1 標準ディレクトリ構造

```
plugin-name/
├── .claude-plugin/
━E  └── plugin.json          # マニフェスト（名前�Eバ�Eジョン・説明！E
├── .mcp.json                # MCP コネクタ定義
├── commands/                # スラチE��ュコマンド！Emd ファイル�E�E
━E  ├── command-a.md
━E  └── command-b.md
├── skills/                  # ドメイン知識！EKILL.md ファイル�E�E
━E  ├── skill-a/
━E  ━E  └── SKILL.md
━E  └── skill-b/
━E      └── SKILL.md
├── CONNECTORS.md            # コネクタ説昁E
├── README.md
└── LICENSE
```

### 2.2 plugin.json�E��Eニフェスト！E

```json
{
  "name": "productivity",
  "version": "1.0.0",
  "description": "Manage tasks, plan your day, ...",
  "author": { "name": "Anthropic" }
}
```

**ポインチE*: 極めてシンプルな 4 フィールド構�E、E

### 2.3 .mcp.json�E�コネクタ定義�E�E

```json
{
  "mcpServers": {
    "slack": { "type": "http", "url": "https://mcp.slack.com/mcp" },
    "notion": { "type": "http", "url": "https://mcp.notion.com/mcp" },
    "atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp" }
  }
}
```

**ポインチE*: MCP�E�Eodel Context Protocol�E�でチE�Eル接続を標準化、ETTP ベ�Eス、E

### 2.4 Skills�E�ドメイン知識！E

- Claude ぁE*自動的に**関連する場面で参�Eする背景知譁E
- Markdown ファイルで記述、YAML frontmatter でメタチE�Eタ定義
- 業務フロー・判断基準�EチE��プレート�E優先度ルールを含む

### 2.5 Commands�E�スラチE��ュコマンド！E

- ユーザーぁE*明示皁E��**呼び出すアクション
- `/plugin-name:command-name` 形弁E
- ワークフロー手頁E�� Markdown で定義

### 2.6 カスタマイズポイント！E~~` プレースホルダー�E�E

プラグイン冁E�� `~~chat`、`~~knowledge base`、`~~project tracker` のように `~~` 接頭辞�Eプレースホルダーが使用されており、絁E��固有�EチE�Eル名に置換する設計、E

---

## 3. 吁E�Eラグイン詳細刁E��

### 3.1 Productivity�E�生産性管琁E��E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/start`�E��E期化�E�、`/update`�E�同期�E更新�E�、`/update --comprehensive`�E�深層スキャン�E�E|
| **スキル** | task-management、memory-management |
| **コネクタ** | Slack, Notion, Asana, Linear, Jira, Monday, ClickUp, MS365 |

**核忁E���E**:

1. **TASKS.md ベ�Eスのタスク管琁E*
   - Active / Waiting On / Someday / Done の 4 セクション
   - `- [ ] **タスク吁E* - コンチE��スト、担当老E��期限` 形弁E
   - dashboard.html でドラチE��&ドロチE�E可能なビジュアルボ�EチE

2. **2 層メモリシスチE��**
   - **ホットキャチE��ュ**�E�ELAUDE.md�E�E ~100 行、E0 人・30 略語�EアクチE��ブ�EロジェクチE
   - **チE��ープストレージ**�E�Eemory/�E�E glossary.md、people/、projects/、context/
   - 90% のチE��ーチE��ングを�EチE��キャチE��ュで処琁E
   - 使用頻度に基づく�E格・降格メカニズム

3. **外部チE�Eル同期**
   - `/update` でタスクトラチE��ー、チャチE��、メール、カレンダーと同期
   - スチE��ル�E�古ぁE��アイチE��の自動トリアージ
   - **ユーザー確認なし�Eタスク自動追加は禁止**

### 3.2 Sales�E�営業支援�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/call-summary`、`/forecast`、`/pipeline-review` |
| **スキル** | account-research、call-prep、daily-briefing、draft-outreach、competitive-intelligence、create-an-asset |
| **コネクタ** | Slack, HubSpot, Close, Clay, ZoomInfo, Notion, Jira, Fireflies, MS365 |

**核忁E���E**:

1. **啁E��E��備�E�Eall-prep�E�E*
   - 会社名�Eミ�EチE��ング種別・出席老E��らブリーフィングを�E動生戁E
   - Web リサーチE+ CRM + メール + チャチE��履歴を統吁E
   - チE��スカバリー / チE�� / 交渁E/ チェチE��インに応じたカスタマイズ

2. **パイプラインレビュー**
   - 加重売上予測の自動生戁E
   - パイプライン健全性刁E��

3. **競合インチE��ジェンス**
   - 競合調査・バトルカード作�E

### 3.3 Customer Support�E�カスタマ�Eサポ�Eト！E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | チケチE��対応コマンド群 |
| **スキル** | ticket-triage、customer-research、response-drafting、escalation、knowledge-management |
| **コネクタ** | Slack, Intercom, HubSpot, Guru, Jira, Notion, MS365 |

**核忁E���E**:

1. **チケチE��トリアージ�E�Eicket-triage�E�E*
   - 9 カチE��リ刁E��E Bug / How-to / Feature Request / Billing / Account / Integration / Security / Data / Performance
   - 4 段階優先度: P1�E�Eh 対応！E P2�E�Eh�E�E P3�E�E 営業日�E�E P4�E�E 営業日�E�E
   - 自動ルーチE��ングルール�E�Eier1 ↁETier2 ↁEEngineering ↁEProduct ↁESecurity ↁEBilling�E�E
   - 重褁E���EロジチE��
   - カチE��リ別自動応答テンプレーチE

2. **ナレチE��ベ�Eス記事�E動作�E**
   - 解決済みチケチE��から KB 記事を生�E

### 3.4 Product Management�E��Eロダクト管琁E��E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/write-spec`、`/roadmap-update`、`/stakeholder-update`、`/synthesize-research`、`/competitive-brief`、`/metrics-review` |
| **スキル** | feature-spec、roadmap-management、stakeholder-comms、user-research-synthesis、competitive-analysis、metrics-tracking |
| **コネクタ** | Slack, Linear, Asana, Monday, ClickUp, Jira, Notion, Figma, Amplitude, Pendo, Intercom, Fireflies |

**核忁E���E**:

1. **PRD 作�E�E�Eeature-spec�E�E*
   - 構造化テンプレーチE Problem Statement ↁEGoals ↁENon-Goals ↁEUser Stories ↁERequirements ↁESuccess Metrics ↁEOpen Questions ↁETimeline
   - MoSCoW 優先度フレームワーク�E�E0/P1/P2�E�E
   - Given/When/Then 形式�E受�E基溁E
   - スコープクリープ防止戦略

2. **ロード�EチE�E管琁E�EスチE�Eクホルダー通信**

### 3.5 Marketing�E��EーケチE��ング�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/draft-content`、`/campaign-plan`、`/brand-review`、`/competitive-brief`、`/performance-report`、`/seo-audit`、`/email-sequence` |
| **スキル** | content-creation、brand-voice、campaign-planning、competitive-intelligence、performance-analytics、seo |
| **コネクタ** | Slack, Canva, Figma, HubSpot, Amplitude, Notion, Ahrefs, SimilarWeb, Klaviyo |

**核忁E���E**:

1. **コンチE��チE���E�E�Eontent-creation�E�E*
   - 7 種チE��プレーチE ブログ / SNS / メールニュースレター / ランチE��ングペ�Eジ / プレスリリース / ケーススタチE��
   - チャネル別ベスト�EラクチE��ス�E�EinkedIn / X / Instagram / Facebook�E�E
   - SEO 基礎（キーワード戦略 + オンペ�Eジ SEO チェチE��リスト！E
   - ヘッドライン・フック公式集
   - CTA ベスト�EラクチE��ス

2. **ブランドレビュー・キャンペ�Eン計画・SEO 監査**

### 3.6 Finance�E�財務�E経理�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/journal-entry`、`/reconciliation`、`/income-statement`、`/variance-analysis`、`/sox-testing` |
| **スキル** | journal-entry-prep、reconciliation、financial-statements、variance-analysis、close-management、audit-support |
| **コネクタ** | Snowflake, Databricks, BigQuery, Slack, MS365 |

**核忁E���E**:

1. **仕訳準備�E�Eournal-entry-prep�E�E*
   - 5 種仕訳: AP 未払計丁E/ 固定賁E��減価償却 / 前払費用償却 / 給与計丁E/ 収益認識！ESC 606�E�E
   - 承認�Eトリクス�E���額ティア別�E�E

2. **差異刁E���E�Eariance-analysis�E�E*
   - Price/Volume 刁E��、Rate/Mix 刁E��、人件費刁E��
   - マテリアリチE��閾値�E�E-20%�E�E
   - ウォーターフォールチャートによる可視化

3. **SOX 404 チE��ト�E月次クローズ管琁E*

### 3.7 Legal�E�法務�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/review-contract`、`/triage-nda`、`/vendor-check`、`/brief`、`/respond` |
| **スキル** | contract-review、nda-triage、compliance、canned-responses、legal-risk-assessment、meeting-briefing |
| **コネクタ** | Slack, Box, Egnyte, Jira, MS365 |

**核忁E���E**:

1. **契紁E��レビュー�E�Eontract-review�E�E*  E最も詳細なスキル
   - プレイブックベ�Eスのレビュー手況E
   - 6 大条頁E�E极E 責任制陁E/ 補償 / 知皁E��産 / チE�Eタ保護 / 期間・解紁E/ 準拠法�E紛争解決
   - 3 段階重大度刁E��E GREEN�E�許容�E�E YELLOW�E�交渉要E��E RED�E�エスカレーション�E�E
   - レチE��ライン生�E: 具体的な代替斁E�� + 根拠 + フォールバック桁E
   - 交渉優先度: Tier 1�E�Eeal Breakers�E�E Tier 2�E�Etrong Preferences�E�E Tier 3�E�Eoncession Candidates�E�E

### 3.8 Data Analysis�E�データ刁E���E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/analyze`、`/explore-data`、`/write-query`、`/create-viz`、`/build-dashboard`、`/validate` |
| **スキル** | query-writing�E�推定）、data-exploration、visualization、validation |
| **コネクタ** | Snowflake, Databricks, BigQuery, Hex, Amplitude, Jira |

**核忁E���E**:

1. **SQL クエリ作�E�E�Ewrite-query�E�E*
   - 自然言誁EↁESQL 変換
   - 9 種 SQL 方言対応！EostgreSQL / Snowflake / BigQuery / Redshift / Databricks / MySQL / SQL Server / DuckDB / SQLite�E�E
   - CTE ベ�Eスの可読性重視構造
   - パフォーマンス最適化（パーチE��ションフィルター、EXISTS 推奨等！E
   - スキーマ�E動検�E�E�EWH 接続時�E�E

### 3.9 Enterprise Search�E�社冁E��索�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | `/search`、`/digest` |
| **スキル** | search-strategy、source-management、knowledge-synthesis |
| **コネクタ** | Slack, Notion, Guru, Jira, Asana, MS365 |

**核忁E���E**:

1. **検索戦略�E�Eearch-strategy�E�E*  Eクロスソース検索の知能
   - 7 種クエリタイプ�E顁E Decision / Status / Document / Person / Factual / Temporal / Exploratory
   - クエリ刁E�� ↁEソース別サブクエリ生�E ↁE並列実衁E
   - セマンチE��チE��検索 vs キーワード検索の使ぁE�EぁE
   - 重み付きランキング�E�Eeyword Match / Freshness / Authority / Completeness�E�E
   - 曖昧性処琁E�Eフォールバック戦略
   - クエリ段階的拡張�E�絞り込み ↁE最庁E��E���E�E

### 3.10 Plugin Manager�E��Eラグインカスタマイザー�E�E

| 頁E�� | 冁E�� |
|------|------|
| **コマンチE* | なぁE|
| **スキル** | cowork-plugin-customizer |
| **コネクタ** | なぁE|

**核忁E���E**:

1. **4 フェーズカスタマイズワークフロー**
   - Phase 1: コンチE��スト収雁E��Elack / ドキュメンチE/ メールから絁E��情報を検索�E�E
   - Phase 2: TODO リスト作�E�E�E~~` プレースホルダーめEgrep で検�E�E�E
   - Phase 3: 頁E��完亁E��情報溁Eor ユーザーへの質問で補完！E
   - Phase 4: MCP 接続（レジストリからチE�Eル検索・設定！E

---

## 4. HARMONIC insight 製品への統合�EチE��ング

### 4.1 製品別適用マトリクス

| Anthropic プラグイン | HI 製品E| 適用度 | 統合�E容 |
|:---:|:---:|:---:|------|
| **Productivity** | IOSH / INSS / IOSD / INPY | **S** | タスク管琁E��メモリシスチE��、ダチE��ュボ�EチE|
| **Sales** | IVIN / 全製品E��営業活動！E| **A** | 啁E��E��備、パイプライン管琁E��パートナー営業支援�E�E|
| **Customer Support** | 全製品E��サポ�Eト体制�E�E| **A** | チケチE��トリアージ、応答テンプレート、KB 自動生戁E|
| **Product Management** | INBT�E�Erchestrator�E�E| **B** | PRD チE��プレート、ロード�EチE�E管琁E|
| **Marketing** | INMV / INIG / 全製品E| **A** | コンチE��チE���E、SEO、ケーススタチE��生�E |
| **Finance** | IOSH | **S** | 仕訳準備、差異刁E��、月次クローズ、SOX チE��チE|
| **Legal** | IOSD | **S** | 契紁E��レビュー、NDA トリアージ、コンプライアンス |
| **Data Analysis** | IOSH / INPY | **S** | SQL 生�E、データ探索、可視化、バリチE�Eション |
| **Enterprise Search** | 全製品E��横断検索�E�E| **A** | マルチソース検索、ナレチE��統吁E|
| **Bio-Research** |  E| **C** | 直接適用なし（業界特化テンプレート�E参老E��E|
| **Plugin Manager** | 全製品E| **S** | プラグインアーキチE��チャの共通基盤 |

> **S**: 直接統合（�E通化対象�E�、E*A**: 参老E��裁E��カスタマイズして反映�E�、E*B**: 部刁E��老E��E*C**: 構造のみ参老E

---

## 5. 共通化提桁E InsightOffice プラグインシスチE��

### 5.1 プラグインアーキチE��チャの導�E

Anthropic のプラグイン構造めEHARMONIC insight 向けにカスタマイズ:

```
insight-common/
├── plugins/                          # 共通�Eラグイン基盤
━E  ├── plugin-schema.json            # プラグインマニフェストスキーチE
━E  ├── plugin-loader.ts              # プラグインローダー
━E  └── types.ts                      # プラグイン型定義
━E
├── plugins-marketplace/              # HI 公式�Eラグイン
━E  ├── insight-productivity/         # 生産性管琁E
━E  ├── insight-finance/              # 経理・財務！EOSH 特化！E
━E  ├── insight-legal/                # 法務�E�EOSD 特化！E
━E  ├── insight-data-analysis/        # チE�Eタ刁E���E�EOSH + INPY�E�E
━E  ├── insight-sales/                # 営業支援�E�パートナー向け�E�E
━E  ├── insight-support/              # サポ�Eト（�E社 + パ�Eトナー�E�E
━E  └── insight-marketing/            # マ�EケチE��ング�E�ENMV + INIG�E�E
```

### 5.2 HI プラグインマニフェスト！Elugin.json 拡張�E�E

```json
{
  "name": "insight-finance",
  "version": "1.0.0",
  "description": "経理・財務ワークフロー支援。仕訳準備、差異刁E��、月次クローズを効玁E��、E,
  "author": { "name": "HARMONIC insight" },
  "targetProducts": ["IOSH", "INPY"],
  "requiredPlan": "PRO",
  "locale": ["ja", "en"],
  "aiFeatureKey": "ai_assistant"
}
```

**Anthropic 拡張ポインチE*:
- `targetProducts`: 対象 HI 製品コーチE
- `requiredPlan`: 忁E���Eラン�E�ERIAL/STD/PRO/ENT�E�E
- `locale`: 対応言誁E
- `aiFeatureKey`: ライセンスゲート�Eキー

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

## 6. 直接統合提桁E AI アシスタントへのスキル絁E��込み

### 6.1 IOSH�E�EnsightOfficeSheet�E�向けスキル

Finance プラグインと Data Analysis プラグインを統吁E

| スキル吁E| 参�E允E| 概要E|
|---------|--------|------|
| `spreadsheet-journal-entry` | Finance: journal-entry-prep | 仕訳チE��プレート�E承認�Eトリクス |
| `spreadsheet-reconciliation` | Finance: reconciliation | 勘定�E合ワークフロー |
| `spreadsheet-variance-analysis` | Finance: variance-analysis | Price/Volume 刁E��・ウォーターフォール |
| `spreadsheet-query-writing` | Data: write-query | 自然言誁EↁEExcel 数弁E/ SQL 変換 |
| `spreadsheet-data-validation` | Data: validate | チE�Eタ品質チェチE�� |
| `spreadsheet-close-management` | Finance: close-management | 月次クローズチェチE��リスチE|

**実裁E��メージ**�E�Ei-assistant.ts への統合！E

```typescript
// config/ai-assistant-skills.ts
export const IOSH_SKILLS: SkillDefinition[] = [
  {
    name: 'spreadsheet-journal-entry',
    description: '仕訳準備・承認ワークフロー支援',
    triggerPatterns: ['仕訳', '計丁E, 'accrual', 'journal entry', '減価償却'],
    systemPromptExtension: `/* Finance plugin の journal-entry-prep SKILL.md から抽出 */`,
    requiredPlan: 'PRO',
  },
  {
    name: 'spreadsheet-variance-analysis',
    description: '差異刁E��・要因刁E��',
    triggerPatterns: ['差異', '刁E��', 'variance', '予宁E, '乖離'],
    systemPromptExtension: `/* Finance plugin の variance-analysis SKILL.md から抽出 */`,
    requiredPlan: 'PRO',
  },
  // ...
];
```

### 6.2 IOSD�E�EnsightOfficeDoc�E�向けスキル

Legal プラグインと Marketing プラグインを統吁E

| スキル吁E| 参�E允E| 概要E|
|---------|--------|------|
| `document-contract-review` | Legal: contract-review | 契紁E��条頁E�E析�EレチE��ライン生�E |
| `document-nda-triage` | Legal: nda-triage | NDA 迁E��審査 |
| `document-compliance-check` | Legal: compliance | コンプライアンス確誁E|
| `document-content-creation` | Marketing: content-creation | ブログ / プレスリリース / ケーススタチE��作�E |
| `document-brand-review` | Marketing: brand-voice | ブランドガイドライン準拠チェチE�� |

### 6.3 INSS�E�EnsightOfficeSlide�E�向けスキル

| スキル吁E| 参�E允E| 概要E|
|---------|--------|------|
| `slide-stakeholder-update` | PM: stakeholder-comms | スチE�Eクホルダー向けプレゼン作�E |
| `slide-competitive-brief` | Sales/PM: competitive-intelligence | 競合�E析スライチE|
| `slide-campaign-plan` | Marketing: campaign-planning | キャンペ�EンプランスライチE|

### 6.4 INPY�E�EnsightPy�E�向けスキル

| スキル吁E| 参�E允E| 概要E|
|---------|--------|------|
| `python-data-analysis` | Data: analyze + explore-data | チE�Eタ刁E��スクリプト生�E |
| `python-query-writing` | Data: write-query | SQL クエリ作�E |
| `python-visualization` | Data: create-viz | 可視化スクリプト生�E |
| `python-data-validation` | Data: validate | チE�Eタ品質バリチE�Eション |

### 6.5 全製品�E通スキル

| スキル吁E| 参�E允E| 概要E|
|---------|--------|------|
| `common-task-management` | Productivity: task-management | タスク管琁E|
| `common-memory-management` | Productivity: memory-management | 絁E��コンチE��スト記�E |
| `common-enterprise-search` | Enterprise Search: search-strategy | 横断検索 |

---

## 7. 参老E���E: 自社営業・サポ�Eト向け�E部チE�Eル

### 7.1 パ�Eトナー営業支援�E�Eales プラグイン参老E��E

Sales プラグインの構造めEHI のパ�Eトナープログラムに適用:

| 機�E | 実裁E��メージ |
|------|------------|
| **パ�Eトナー啁E��E��備** | `/sales:call-prep` ↁEパ�Eトナー企業惁E�� + 過去案件 + 製品情報を統合したブリーフィング自動生戁E|
| **パイプラインレビュー** | `/sales:pipeline-review` ↁEパ�EトナーチE��ア別の販売実績・予測ダチE��ュボ�EチE|
| **競合バトルカーチE* | `/sales:competitive-brief` ↁEUiPath / Power Automate との差別化賁E��自動生戁E|
| **売上予測** | `/sales:forecast` ↁEStripe + 請求書チE�Eタから加重予測 |

### 7.2 カスタマ�Eサポ�Eト体制�E�Eustomer Support プラグイン参老E��E

チケチE��トリアージのフレームワークめEHI サポ�Eトに直接適用:

```
HI サポ�EトカチE��リ刁E��E
├── Bug�E�製品バグ�E�E
├── How-to�E�操作方法！E
├── License�E�ライセンス関連�E�E
├── AI-Assistant�E�EI 機�E関連�E�E
├── Integration�E�連携・API 関連�E�E
├── Feature-Request�E�機�E要望�E�E
└── Partner�E�パートナー向け�E�E

HI 優先度:
├── P1: 製品が全く使えなぁE/ チE�Eタ損失 ↁE1h 以冁E��忁E
├── P2: 主要機�Eが動作しなぁEↁE4h 以冁E��忁E
├── P3: 回避策あめE/ 単一ユーザー影響 ↁE1 営業日以冁E
└── P4: 軽微 / 機�E要望 / 操作質啁EↁE2 営業日以冁E
```

### 7.3 マ�EケチE��ング活動！Earketing プラグイン参老E��E

| 活勁E| 参老E��素 |
|------|---------|
| **セミナー告知** | content-creation スキルのブログ・SNS チE��プレーチE|
| **ケーススタチE��作�E** | case study チE��プレート（課題�E解決→�E果�E引用→CTA�E�E|
| **SEO 対筁E* | SEO チェチE��リスト�Eキーワード戦略 |
| **メール配信** | email-sequence コマンド�EマルチスチE��プ設訁E|
| **ランチE��ングペ�Eジ** | LP チE��プレート（ヒーロー→価値提案�E社会的証明�EFAQ→CTA�E�E|

---

## 8. メモリシスチE��の導�E提桁E

### 8.1 AI アシスタントへの 2 層メモリシスチE��導�E

Productivity プラグインのメモリアーキチE��チャめEInsightOffice AI アシスタントに統吁E

```
プロジェクトファイル�E�Eiosh / .inss / .iosd�E�E
├── ai_chat_history.json        # 既孁E チャチE��履歴
├── ai_memory.json              # 新要E ホットキャチE��ュ�E�E50 エントリ�E�E
━E  ├── people[]                # 頻出人物�E�名前�E役職・関連プロジェクト！E
━E  ├── glossary[]              # 社冁E��語�E専門用誁E
━E  ├── active_projects[]       # アクチE��ブ�EロジェクチE
━E  └── preferences[]           # ユーザーの好み�E�表示形式等！E
└── ai_memory_deep/             # 新要E チE��ープストレージ
    ├── glossary.json           # 完�E用語集
    ├── people/                 # 人物詳細プロファイル
    └── context/                # 絁E��コンチE��スチE
```

**検索フロー**:
1. `ai_memory.json`�E��EチE��キャチE��ュ�E�をまず参照
2. 見つからなければ `ai_memory_deep/` を検索
3. それでも不�Eならユーザーに質啁E
4. 学習した�E容を�E動的に適刁E��層に保孁E

### 8.2 プラン別メモリ制陁E

| プラン | ホットキャチE��ュ | チE��ープストレージ |
|:------:|:--------------:|:----------------:|
| STD | 20 エントリ | なぁE|
| PRO | 100 エントリ | 500 エントリ |
| ENT | 無制陁E| 無制陁E|

---

## 9. Enterprise Search の InsightBot 統吁E

### 9.1 Orchestrator への横断検索機�E追加

Enterprise Search プラグインの検索戦略めEInsightBot Orchestrator に統吁E

```
InsightBot Orchestrator�E�ERO+�E�E
  └── /search コマンチE
      ├── IOSH ファイル群からの検索
      ├── INSS ファイル群からの検索
      ├── IOSD ファイル群からの検索
      ├── INPY スクリプト群からの検索
      └── 結果統合�Eランキング・重褁E��除
```

**クエリタイプ�E顁E*�E�Enterprise Search 参老E��E

| クエリタイチE| 検索戦略 |
|------------|---------|
| 数値検索 | IOSH ファイル優允EↁEINPY スクリプト |
| 斁E��検索 | IOSD ファイル優允EↁEINSS スライチE|
| 人物検索 | 全ファイルの作�E老E�E変更老E��タチE�Eタ |
| 時系列検索 | バ�Eジョン履歴からの時間頁E��索 |

---

## 10. 建設業界向けカスタムプラグイン設訁E

Plugin Manager の仕絁E��を参老E��、建設業界向け�Eラグインの設計指釁E

### 10.1 想定�Eラグイン構造

```
insight-construction/
├── .claude-plugin/
━E  └── plugin.json
├── .mcp.json
├── commands/
━E  ├── site-report.md           # 現場報告書作�E
━E  ├── safety-check.md          # 安�E管琁E��ェチE��
━E  ├── progress-update.md       # 工程進捗更新
━E  └── cost-analysis.md         # コスト�E极E
├── skills/
━E  ├── construction-terminology/ # 建設用語辞書
━E  ━E  └── SKILL.md
━E  ├── safety-compliance/        # 安�E基準�E法令
━E  ━E  └── SKILL.md
━E  ├── project-scheduling/       # 工程管琁E
━E  ━E  └── SKILL.md
━E  └── cost-estimation/          # 積算�E見穁E
━E      └── SKILL.md
└── README.md
```

### 10.2 建設業界特有�Eスキル定義侁E

**construction-terminology SKILL.md**:
- 建設業界固有�E略語辞書�E�EC / SRC / PC / 鉁E�� / 仮設等！E
- 工種刁E��コーチE
- 法令用語�EチE��ング

**safety-compliance SKILL.md**:
- 労働安�E衛生法準拠チェチE��リスチE
- KY�E�危険予知�E�活動テンプレーチE
- ヒヤリハット�E類�E報告フォーマッチE

---

## 11. 実裁E��ード�EチE�E

### Phase 1: 基盤整備（�E通化�E�E

| 優先度 | タスク | 対象ファイル |
|:------:|--------|------------|
| 1 | プラグインスキーマ定義 | `config/plugin-schema.ts` |
| 2 | プラグインローダー実裁E| `config/plugin-loader.ts` |
| 3 | スキル型定義 | `config/ai-assistant-skills.ts` |
| 4 | メモリシスチE��型定義 | `config/ai-memory.ts` |

### Phase 2: 製品特化スキル実裁E

| 優先度 | タスク | 対象製品E|
|:------:|--------|---------|
| 1 | Finance スキル群�E�仕訳・差異刁E��・クローズ�E�E| IOSH |
| 2 | Legal スキル群�E�契紁E��レビュー・NDA�E�E| IOSD |
| 3 | Data Analysis スキル群�E�EQL・可視化�E�E| IOSH / INPY |
| 4 | Content Creation スキル群 | INSS / IOSD |

### Phase 3: 営業・サポ�Eト�E部チE�Eル

| 優先度 | タスク | 用送E|
|:------:|--------|------|
| 1 | サポ�EトトリアージシスチE�� | 自社サポ�Eト体制 |
| 2 | パ�Eトナー啁E��E��備チE�Eル | パ�Eトナー営業 |
| 3 | マ�EケチE��ングチE��プレート集 | コンチE��チE��佁E|

### Phase 4: 業界特化�Eラグイン

| 優先度 | タスク | 業畁E|
|:------:|--------|------|
| 1 | 建設業界�Eラグイン | 建設 |
| 2 | 製造業プラグイン | 製造 |
| 3 | 金融業プラグイン | 金融 |

---

## 12. 設計原剁E��Enthropic プラグインから学ぶ�E�E

### 12.1 "No Code, No Infrastructure, No Build Steps"

- すべて Markdown + JSON で定義
- ビルド�Eロセス不要E
- ファイルベ�EスのチE�Eロイ

### 12.2 "Skills fire when relevant"

- スキルはユーザーの入力に基づぁE��自動的に有効匁E
- コマンド�Eユーザーが�E示皁E��呼び出ぁE
- こ�E 2 層構造が使ぁE��すさの鍵

### 12.3 "Generic starting points ↁECompany customization"

- プラグインは汎用チE��プレートとして提侁E
- `~~` プレースホルダーで絁E��固有�E値に置揁E
- 段階的カスタマイズが可能

### 12.4 "Never auto-add without user confirmation"

- 自動アクションは常にユーザー確認を要汁E
- HI の AI アシスタントにも同じ原剁E��適用

### 12.5 "Classify ↁEPrioritize ↁERoute ↁETemplate"

- サポ�EトチケチE��もリーガルレビューも同じパターン
- 刁E��EↁE優先度付け ↁEルーチE��ング ↁEチE��プレート応筁E
- こ�E構造化アプローチ�E HI の全製品で活用可能

---

## 13. 技術的注意事頁E

### MCP�E�Eodel Context Protocol�E�との互換性

Anthropic プラグインは MCP サーバ�Eを前提としてぁE��、EI 製品�E現在 BYOK�E�EPI キー直接利用�E�モチE��だが、封E��皁E�� MCP 互換レイヤーを検討する価値があめE

```
現在: ユーザー ↁEClaude API�E�直接�E�E
封E��: ユーザー ↁEInsightOffice ↁEMCP Layer ↁEClaude API + 外部チE�Eル
```

### ライセンスゲートとの統吁E

Anthropic プラグインにはライセンスの概念がなぁE��、HI ではプラン別に利用可能なスキル/コマンドを制御する忁E��がある:

```typescript
// スキル有効化�EライセンスチェチE��
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

| コネクタ吁E| MCP URL | 利用プラグイン |
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
| Snowflake | �E�EWH コネクタ�E�E| Finance, Data |
| Databricks | �E�EWH コネクタ�E�E| Finance, Data |
| BigQuery | �E�EWH コネクタ�E�E| Finance, Data |

## 付録 B: 参�E URL

- リポジトリ: https://github.com/anthropics/knowledge-work-plugins
- プラグインマ�EケチE��プレイス: https://claude.com/plugins
- MCP 仕槁E https://modelcontextprotocol.io/
