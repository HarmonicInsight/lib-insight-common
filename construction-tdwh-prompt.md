# 建設業テキストデータウェアハウス（TDWH）構築プロンプト
## Claude Code 実装指示書

---

## プロジェクト概要

建設業に特化したテキストデータウェアハウス（TDWH）を構築する。
インターネット上の公開情報を自動クロールし、目的別に分類された「テキストマート」に格納する。
最終的にはRAG（検索拡張生成）基盤として、AIコンサルティングサービスの知識基盤となる。

### アーキテクチャ思想
- DWH設計原則をテキストデータに適用
- データレイク層（生データ収集）→ マート層（目的別構造化）→ インターフェース層（ディスパッチ＆統合）
- 全データをいきなり一つのベクトルDBに入れない。マート単位でインデックスを分離し、検索精度を確保する

---

## Phase 1: プロジェクト初期セットアップ

```
以下のプロジェクトを作成してください。

プロジェクト名: construction-tdwh
言語: Python 3.11+
パッケージマネージャ: uv（pip互換）

ディレクトリ構成:
construction-tdwh/
├── README.md
├── pyproject.toml
├── .env.example           # API keys, DB接続情報
├── config/
│   ├── sources.yaml       # クロール対象ソース定義
│   ├── marts.yaml         # マート定義（後述）
│   └── schedule.yaml      # クロールスケジュール
├── src/
│   ├── crawler/           # クロールエンジン
│   │   ├── __init__.py
│   │   ├── base.py        # BaseCrawlerクラス
│   │   ├── web_crawler.py # 汎用Webクローラー
│   │   ├── pdf_crawler.py # PDF取得・テキスト抽出
│   │   ├── rss_crawler.py # RSSフィード監視
│   │   └── api_crawler.py # API経由データ取得（e-Gov等）
│   ├── processor/         # データ加工
│   │   ├── __init__.py
│   │   ├── cleaner.py     # テキストクリーニング
│   │   ├── chunker.py     # チャンク分割（マート別戦略）
│   │   ├── classifier.py  # マート分類器（LLM利用）
│   │   └── embedder.py    # ベクトル化
│   ├── mart/              # マート管理
│   │   ├── __init__.py
│   │   ├── base_mart.py   # BaseMartクラス
│   │   ├── law_mart.py    # 法務・法令マート
│   │   ├── accounting_mart.py    # 会計・経審マート
│   │   ├── terminology_mart.py   # 用語・技術マート
│   │   ├── dx_case_mart.py       # DX事例マート
│   │   ├── method_mart.py        # 工法・技術基準マート
│   │   └── safety_mart.py        # 安全管理マート
│   ├── dispatcher/        # クエリディスパッチ
│   │   ├── __init__.py
│   │   ├── intent_classifier.py  # 質問意図分類
│   │   ├── router.py             # マートルーティング
│   │   └── integrator.py         # 複数マート統合
│   ├── storage/           # ストレージ抽象化
│   │   ├── __init__.py
│   │   ├── datalake.py    # 生データ保存
│   │   └── vectorstore.py # ベクトルDB接続
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── rate_limiter.py
├── scripts/
│   ├── crawl.py           # クロール実行スクリプト
│   ├── process.py         # 加工・マート投入スクリプト
│   ├── query.py           # テスト検索スクリプト
│   └── setup_db.py        # DB初期化
├── tests/
│   ├── test_crawler.py
│   ├── test_classifier.py
│   ├── test_dispatcher.py
│   └── test_integration.py
└── data/
    ├── raw/               # クロール生データ
    ├── processed/         # 加工済みデータ
    └── exports/           # エクスポート用

依存パッケージ:
- httpx（非同期HTTPクライアント）
- beautifulsoup4（HTMLパース）
- pdfplumber（PDF抽出）
- feedparser（RSS）
- chromadb（ベクトルDB、ローカル）
- openai（Embeddingモデル。text-embedding-3-small推奨）
- anthropic（分類・チャンク戦略にClaude利用）
- pyyaml（設定ファイル）
- schedule（定期実行）
- rich（CLI表示）
- pydantic（データモデル）
- tenacity（リトライ）
```

---

## Phase 2: ソース定義とクローラー実装

```
config/sources.yaml を以下の構造で作成してください。
クロール対象は日本の建設業に関する公開情報源です。

---
sources:

  # ===== 法務・法令系 =====
  - id: egov_construction_law
    name: "建設業法（e-Gov法令検索）"
    url: "https://laws.e-gov.go.jp/law/324AC0000000100"
    type: web
    mart: law
    schedule: monthly
    description: "建設業法の全文。改正を追跡"

  - id: egov_kenchiku_kijun
    name: "建築基準法（e-Gov法令検索）"
    url: "https://laws.e-gov.go.jp/law/325AC0000000201"
    type: web
    mart: law
    schedule: monthly
    description: "建築基準法の全文"

  - id: mlit_construction_policy
    name: "国土交通省 建設業政策"
    url: "https://www.mlit.go.jp/totikensangyo/const/index.html"
    type: web_recursive
    mart: law
    schedule: weekly
    max_depth: 2
    description: "建設業許可、経審、法改正通知等"

  - id: mlit_guidelines
    name: "国交省 ガイドライン・通達"
    url: "https://www.mlit.go.jp/totikensangyo/const/sosei_const_tk1_000005.html"
    type: web_recursive
    mart: law
    schedule: weekly
    max_depth: 2

  # ===== 会計・経審系 =====
  - id: mlit_keishin
    name: "経営事項審査（国交省）"
    url: "https://www.mlit.go.jp/totikensangyo/const/sosei_const_tk1_000003.html"
    type: web_recursive
    mart: accounting
    schedule: monthly
    max_depth: 2
    description: "経営事項審査の基準、計算方法、改正情報"

  - id: construction_accounting_standards
    name: "建設業会計基準"
    url: "https://jicpa.or.jp/"
    type: web
    mart: accounting
    schedule: quarterly
    search_keywords: ["建設業会計", "工事進行基準", "工事契約"]
    description: "建設業特有の会計処理基準"

  # ===== 用語・技術系 =====
  - id: nikkenren_glossary
    name: "日建連 建設用語集"
    url: "https://www.nikkenren.com/"
    type: web
    mart: terminology
    schedule: quarterly
    search_keywords: ["用語", "glossary"]

  - id: architectural_institute
    name: "日本建築学会 技術基準"
    url: "https://www.aij.or.jp/"
    type: web
    mart: terminology
    schedule: quarterly

  - id: mlit_sekisan
    name: "国交省 公共建築工事積算基準"
    url: "https://www.mlit.go.jp/gobuild/gobuild_tk2_000017.html"
    type: web_recursive
    mart: terminology
    schedule: monthly
    max_depth: 2

  # ===== DX事例系 =====
  - id: mlit_iconstruction
    name: "i-Construction事例集"
    url: "https://www.mlit.go.jp/tec/i-construction/index.html"
    type: web_recursive
    mart: dx_case
    schedule: weekly
    max_depth: 3
    description: "国交省i-Construction推進の事例・資料"

  - id: mlit_bim_cim
    name: "BIM/CIM活用事例"
    url: "https://www.mlit.go.jp/tec/content/001411771.pdf"
    type: pdf
    mart: dx_case
    schedule: monthly

  - id: kensetsu_dx_news
    name: "建設DXニュース（日経XTECH等）"
    url: "https://xtech.nikkei.com/atcl/nxt/column/18/00110/"
    type: rss_or_web
    mart: dx_case
    schedule: daily
    description: "建設IT系ニュース"

  - id: dx_case_mlit_database
    name: "国交省 建設DXデータベース"
    url: "https://www.mlit.go.jp/tec/tec_tk_000073.html"
    type: web_recursive
    mart: dx_case
    schedule: weekly
    max_depth: 2

  # ===== 工法・技術基準系 =====
  - id: mlit_doboku_standard
    name: "土木工事共通仕様書"
    url: "https://www.mlit.go.jp/tec/sekisan/sekou/pdf/all.pdf"
    type: pdf
    mart: method
    schedule: annually

  - id: mlit_kenchiku_standard
    name: "公共建築工事標準仕様書"
    url: "https://www.mlit.go.jp/gobuild/gobuild_tk2_000044.html"
    type: web_recursive
    mart: method
    schedule: annually
    max_depth: 2

  # ===== 安全管理系 =====
  - id: mhlw_anzen
    name: "厚労省 建設業労働安全"
    url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/anzen/index.html"
    type: web_recursive
    mart: safety
    schedule: weekly
    max_depth: 2

  - id: mlit_safety_guidelines
    name: "国交省 建設工事安全対策"
    url: "https://www.mlit.go.jp/tec/tec_tk_000001.html"
    type: web_recursive
    mart: safety
    schedule: monthly
    max_depth: 2


次に、各クローラーを実装してください。

## BaseCrawler（src/crawler/base.py）
- 共通インターフェース: crawl() -> list[RawDocument]
- RawDocument: Pydanticモデル（source_id, url, title, content, content_type, 
  crawled_at, metadata）
- レートリミット: デフォルト1リクエスト/秒（tenacityでリトライ）
- User-Agent: 適切に設定（ボット識別可能に）
- robots.txt 遵守チェック

## WebCrawler（src/crawler/web_crawler.py）
- httpx + BeautifulSoup
- web_recursive タイプ: BFS方式で max_depth まで辿る
- 同一ドメイン内リンクのみ追跡
- HTML→テキスト変換（見出し構造を保持）
- PDFリンクを発見した場合、pdf_crawlerに委譲

## PDFCrawler（src/crawler/pdf_crawler.py）
- pdfplumber でテキスト抽出
- テーブル検出・構造化
- 日本語対応（フォント問題のハンドリング）
- 大サイズPDF対応（ストリーミング取得）

## RSSCrawler（src/crawler/rss_crawler.py）
- feedparser ベース
- 新規記事のみ取得（既読管理）
- 本文取得: RSSに全文なければリンク先をWebCrawlerで取得
```

---

## Phase 3: データ加工パイプライン

```
データ加工パイプラインを実装してください。

## Cleaner（src/processor/cleaner.py）
以下のクリーニング処理を実装:
- HTML残留タグの除去
- ナビゲーション・フッター等のボイラープレート除去
- 文字コード正規化（全角→半角の適切な変換、ただし日本語は保持）
- 連続空白・改行の正規化
- ヘッダー/フッター（ページ番号等）の除去
- 著作権表示・免責事項の分離（メタデータへ）
- 最低文字数チェック（100文字未満はスキップ）

## Chunker（src/processor/chunker.py）
マートの種類に応じて異なるチャンク戦略を適用:

### 法務・法令マート用チャンク戦略
- 法律の条文構造（第X条、第X項、第X号）を尊重
- 条文単位でチャンク化
- 関連条文への参照情報をメタデータに保持
- チャンクサイズ: 条文1つ〜3つ程度（500-1500トークン目安）

### 会計・経審マート用チャンク戦略
- 計算式・表は分割しない
- セクション単位でチャンク化
- 前提条件と計算結果を同一チャンクに保持
- チャンクサイズ: 800-2000トークン目安

### 用語・技術マート用チャンク戦略
- 用語1つ = 1チャンク（定義＋解説＋関連用語）
- 短いチャンクOK（200トークン程度でも可）
- 同義語・略称をメタデータに格納

### DX事例マート用チャンク戦略
- 1事例 = 1チャンク（分割しない）
- 長い事例は「概要」「課題」「取組」「結果」で分割
- 企業プロファイル（業種、規模、地域）をメタデータに
- チャンクサイズ: 1000-3000トークン目安

### 工法・技術基準マート用チャンク戦略
- 工種・工法単位でチャンク化
- 図表の参照情報を保持
- 前提条件（適用範囲）を必ず含める
- チャンクサイズ: 800-2000トークン目安

### 安全管理マート用チャンク戦略
- 災害種別・作業種別単位
- チェックリスト・手順は分割しない
- 法的根拠（安衛法何条）をメタデータに
- チャンクサイズ: 500-1500トークン目安

## Classifier（src/processor/classifier.py）
Claude APIを使ったマート分類器を実装:

```python
CLASSIFICATION_PROMPT = """
あなたは建設業の知識分類専門家です。
以下のテキストを最も適切なマートに分類してください。

## マート一覧
- law: 法律、法令、許可、規制、通達、ガイドライン
- accounting: 会計、経審、財務、原価管理、入札
- terminology: 用語定義、技術解説、基礎知識
- dx_case: DX事例、ICT活用事例、BIM/CIM導入事例
- method: 工法、施工技術、仕様書、積算基準
- safety: 安全管理、労働安全、災害防止、リスク管理

## ルール
- 1つのテキストは1つの主マートに分類
- 関連する副マートがあれば secondary_marts に記載
- 確信度を 0.0-1.0 で記載
- 分類不能な場合は "unclassified" とする

## 出力形式（JSON）
{
  "primary_mart": "law",
  "secondary_marts": ["accounting"],
  "confidence": 0.92,
  "reasoning": "建設業法の許可基準に関する通達であるため"
}

## テキスト
{text}
"""
```

ソース定義で mart が明示されている場合はそれを優先し、
classifier はソース定義にない場合や、再分類が必要な場合に使用する。

## Embedder（src/processor/embedder.py）
- OpenAI text-embedding-3-small を使用
- バッチ処理対応（最大2048テキスト/バッチ）
- エンベディング結果はマート別のChromaDBコレクションに格納
- メタデータ: source_id, url, title, mart, chunk_index, crawled_at, 
  secondary_marts, content_type
```

---

## Phase 4: マート定義と実装

```
config/marts.yaml と各マートクラスを実装してください。

## marts.yaml
---
marts:
  law:
    name: "法務・法令マート"
    description: "建設業法、建築基準法、関連法令、通達、ガイドライン"
    collection_name: "mart_law"
    chunk_strategy: "legal_article"
    use_cases:
      - "建設業許可の要件を知りたい"
      - "法改正の影響を確認したい"
      - "下請法の適用範囲は？"
    metadata_schema:
      law_name: string      # 法令名
      article_number: string # 条文番号
      revision_date: date    # 改正日
      category: string       # 許可/規制/手続き等

  accounting:
    name: "会計・経審マート"
    description: "建設業会計、経営事項審査、財務分析、原価管理"
    collection_name: "mart_accounting"
    chunk_strategy: "section"
    use_cases:
      - "経審のY点を上げるには？"
      - "工事進行基準の適用条件は？"
      - "JV工事の会計処理は？"
    metadata_schema:
      topic: string          # 経審/会計基準/原価管理等
      calculation_type: string # 計算式の有無
      fiscal_year: string    # 適用年度

  terminology:
    name: "用語・技術マート"
    description: "建設用語、技術用語、基礎知識、業界常識"
    collection_name: "mart_terminology"
    chunk_strategy: "term_definition"
    use_cases:
      - "スラブとは何か？"
      - "RC造とSRC造の違いは？"
      - "養生期間の目安は？"
    metadata_schema:
      term: string           # 用語名
      reading: string        # よみがな
      aliases: list[string]  # 同義語・略称
      category: string       # 躯体/仕上/設備/土木等
      difficulty: string     # 新人向け/中級/専門家

  dx_case:
    name: "DX事例マート"
    description: "建設DX導入事例、ICT活用、BIM/CIM、業務改善事例"
    collection_name: "mart_dx_case"
    chunk_strategy: "case_study"
    use_cases:
      - "BIM導入の成功事例を知りたい"
      - "中小建設会社のDX事例は？"
      - "ドローン活用で効果が出た事例は？"
    metadata_schema:
      company_size: string   # 大手/中堅/中小
      company_type: string   # ゼネコン/サブコン/専門工事/設計事務所
      technology: list[string] # BIM/ドローン/AI/IoT等
      outcome: string        # 成功/部分的成功/失敗
      region: string         # 地域
      year: integer          # 事例の年
      summary: string        # 1行サマリ

  method:
    name: "工法・技術基準マート"
    description: "施工方法、工法選定、仕様書、積算基準、品質管理"
    collection_name: "mart_method"
    chunk_strategy: "construction_method"
    use_cases:
      - "軟弱地盤での基礎工法は？"
      - "鉄筋のかぶり厚さの基準は？"
      - "コンクリートの配合設計は？"
    metadata_schema:
      work_type: string      # 土工/躯体/仕上/設備等
      method_name: string    # 工法名
      applicable_conditions: string  # 適用条件
      standard_reference: string     # 準拠基準

  safety:
    name: "安全管理マート"
    description: "労働安全、災害防止、安全教育、法令遵守"
    collection_name: "mart_safety"
    chunk_strategy: "safety_topic"
    use_cases:
      - "足場の安全基準は？"
      - "熱中症対策のガイドラインは？"
      - "新規入場者教育の内容は？"
    metadata_schema:
      hazard_type: string    # 墜落/崩壊/電気/熱中症等
      work_type: string      # 対象作業
      legal_basis: string    # 安衛法根拠条文
      severity: string       # 重大/注意/一般


## BaseMart（src/mart/base_mart.py）
各マートの共通インターフェース:
- add_documents(chunks: list[Chunk]) -> None
- search(query: str, top_k: int = 5, filters: dict = None) -> list[SearchResult]
- get_stats() -> MartStats（ドキュメント数、最終更新、ソース分布）
- export(format: str = "jsonl") -> Path

SearchResult:
- content: str
- score: float
- metadata: dict
- source_url: str
- mart_name: str
```

---

## Phase 5: ディスパッチャー実装

```
クエリディスパッチャーを実装してください。
これがTDWHの中核であり、ユーザーの質問を適切なマートにルーティングし、
複数マートの結果を統合する。

## IntentClassifier（src/dispatcher/intent_classifier.py）
Claude APIを使った質問意図分類:

```python
INTENT_PROMPT = """
あなたは建設業の質問を分析する専門家です。
ユーザーの質問から、必要な情報源（マート）を特定してください。

## マート一覧
- law: 法律、法令、許可、規制
- accounting: 会計、経審、財務、原価
- terminology: 用語、基礎知識
- dx_case: DX事例、ICT活用事例
- method: 工法、施工技術、仕様
- safety: 安全管理、災害防止

## 分析指示
1. 質問の主要テーマを特定
2. 必要なマートを優先順位付きでリスト化
3. 各マートへの具体的な検索クエリを生成
4. 追加で聞くべき質問があれば提示

## 出力形式（JSON）
{
  "primary_intent": "工法選定の相談",
  "mart_queries": [
    {"mart": "method", "query": "軟弱地盤 杭基礎 工法選定", "priority": 1},
    {"mart": "terminology", "query": "杭基礎 種類 特徴", "priority": 2},
    {"mart": "dx_case", "query": "地盤改良 ICT活用", "priority": 3}
  ],
  "clarification_needed": [
    "建物の用途と規模は？",
    "地盤調査のデータはありますか？"
  ],
  "reasoning": "軟弱地盤での基礎工法を聞いており、工法マートがメイン。
    用語の前提知識補完と、ICT活用事例も参考になる可能性がある。"
}
"""
```

## Router（src/dispatcher/router.py）
- IntentClassifier の結果に基づいて各マートに検索を並列実行
- priority順に最大3マートまで検索（パフォーマンス考慮）
- 各マートの検索結果を score でソートして上位を保持

## Integrator（src/dispatcher/integrator.py）
複数マートの検索結果を統合して一貫した回答コンテキストを構築:

```python
INTEGRATION_PROMPT = """
あなたは建設業の知識を統合する専門家です。
複数の情報源から得られた以下の情報を、ユーザーの質問に対する
一貫した回答コンテキストとして統合してください。

## ユーザーの質問
{question}

## 各マートからの検索結果
{mart_results}

## 統合ルール
1. 情報の矛盾がある場合は、法令 > 技術基準 > 事例 の優先順位
2. 各情報の出典（マート名、URL）を保持
3. 不足している情報を明示
4. ユーザーの状況に応じた判断が必要な場合はその旨を記載
5. 直接回答できる部分と、追加情報が必要な部分を分離

## 出力形式
{
  "integrated_context": "統合された情報テキスト",
  "sources": [{"mart": "...", "url": "...", "relevance": 0.95}],
  "gaps": ["この質問に完全に答えるには〇〇の情報が必要"],
  "caveats": ["この情報は2024年時点のものであり、最新の法改正を確認してください"]
}
"""
```
```

---

## Phase 6: CLIスクリプト実装

```
以下のCLIスクリプトを実装してください。

## scripts/crawl.py
使い方:
  python scripts/crawl.py --all              # 全ソースクロール
  python scripts/crawl.py --mart law         # 法務マートのソースのみ
  python scripts/crawl.py --source egov_construction_law  # 特定ソース
  python scripts/crawl.py --schedule         # スケジュールに基づく自動実行

処理フロー:
1. sources.yaml から対象ソースを読み込み
2. 各ソースに適切なクローラーを選択・実行
3. 取得した RawDocument を data/raw/ に保存（JSON Lines形式）
4. クロールログを出力（成功/失敗/スキップ数）

## scripts/process.py
使い方:
  python scripts/process.py --all            # 全未処理データを加工
  python scripts/process.py --mart dx_case   # 特定マート向けのみ
  python scripts/process.py --reprocess      # 全データ再処理

処理フロー:
1. data/raw/ から未処理データを読み込み
2. Cleaner でクリーニング
3. Classifier でマート分類（ソース定義で明示されていない場合）
4. Chunker でマート別戦略に基づきチャンク化
5. Embedder でベクトル化
6. 各マートの ChromaDB コレクションに格納
7. 処理済みデータを data/processed/ に保存

## scripts/query.py
使い方:
  python scripts/query.py "軟弱地盤での杭の選び方は？"
  python scripts/query.py --mart terminology "スラブ厚とは"
  python scripts/query.py --interactive      # 対話モード

対話モード:
- ユーザーの質問を受付
- IntentClassifier → Router → 各マート検索 → Integrator
- 統合結果を表示（出典付き）
- clarification_needed があれば追加質問を表示
- "quit" で終了

## scripts/setup_db.py
- ChromaDB の初期化
- 各マートのコレクション作成
- テスト用サンプルデータの投入（各マート5件程度）
```

---

## Phase 7: テスト

```
以下のテストを実装してください。

## tests/test_crawler.py
- WebCrawler: モックHTTPレスポンスでパース確認
- PDFCrawler: サンプルPDFでテキスト抽出確認
- レートリミットの動作確認

## tests/test_classifier.py
- 各マートに対応するサンプルテキスト6種類を用意
- 分類精度のアサーション（正しいprimary_martに分類されること）

## tests/test_dispatcher.py
- IntentClassifier: サンプル質問10問で意図分類の妥当性確認
  - 「建設業許可の更新手続きは？」→ law
  - 「経審のP点の計算方法は？」→ accounting
  - 「コンクリートの養生期間は？」→ terminology + method
  - 「中小ゼネコンのBIM導入事例を教えて」→ dx_case
  - 「杭打ち工事の工法比較をしたい」→ method
  - 「足場の点検基準は？」→ safety
  - 「軟弱地盤での基礎工事、予算感も含めて」→ method + accounting
  - 「新人に建設用語を教えるカリキュラム」→ terminology
  - 「ドローンで測量を効率化した事例は？」→ dx_case + method
  - 「建設業の安全管理体制の法的要件は？」→ safety + law

## tests/test_integration.py
- E2Eテスト: クロール→加工→マート投入→検索 の一連フロー
- サンプルデータ（手動作成）を使用
```

---

## 実装上の注意事項

### 日本語処理
- テキスト分割にはtiktoken（cl100k_base）を使用してトークン数を正確に計算
- 日本語特有の文区切り（。！？）を考慮したチャンク分割
- 法令テキストの「第〜条」パターンの正規表現: r'第[一二三四五六七八九十百千]+条'

### エラーハンドリング
- クロール失敗時: リトライ3回後にスキップ、ログに記録
- PDF抽出失敗時: OCRフォールバック（tesseract）を将来追加可能な設計に
- API制限: OpenAI/Anthropic の rate limit を tenacity で管理
- 重複検出: URL + content_hash で重複排除

### スケーラビリティ
- ChromaDB はローカル開発用。本番ではPinecone/Qdrant/Weaviateに差し替え可能な設計
- Embedding モデルも差し替え可能に（Embedder クラスの抽象化）
- 将来的にPostgreSQL + pgvector への移行パスを考慮

### セキュリティ
- .env にAPIキーを格納、.gitignore に追加
- クロール対象はrobots.txtを遵守
- 個人情報が含まれるデータのフィルタリング（将来実装）

---

## 最初の実行手順

1. `uv init construction-tdwh && cd construction-tdwh`
2. `uv add httpx beautifulsoup4 pdfplumber feedparser chromadb openai anthropic pyyaml schedule rich pydantic tenacity tiktoken`
3. `.env` にAPIキーを設定
4. `python scripts/setup_db.py` でDB初期化
5. `python scripts/crawl.py --source egov_construction_law` で1ソースだけテスト
6. `python scripts/process.py --all` で加工・投入
7. `python scripts/query.py "建設業許可の要件は？"` で検索テスト
8. 問題なければ `python scripts/crawl.py --all` で全ソースクロール

---

## 今後の拡張（Phase 8以降の構想メモ）

- **オートインタビュー統合**: このTDWHをRAG基盤として、対話型AIコンサルティングサービスの
  バックエンドに接続。対話フロー（初期ヒアリング→事例提示→深掘り→差分分析→個別提案）の
  実装はフロントエンド側で別途設計。
- **ユーザー企業データマート**: 各ユーザー企業の経営数値・プロジェクト情報を格納する
  プライベートマートの追加。
- **判断ロジック層**: Erik の経験知（「この条件ならこうすべき」）をルールベースで格納する
  専門家ナレッジマートの追加。
- **自動更新ダッシュボード**: 各マートのデータ鮮度、カバレッジ、検索精度のモニタリング。
- **マルチモーダル対応**: 図面画像、施工写真の格納・検索。
