# TDWH (テキストデータウェアハウス) 設計標準

> 業種特化ナレッジ基盤を構築する際の共通設計ガイド

---

## 1. アーキテクチャ概要

TDWH は DWH 設計原則をテキストナレッジに適用した 3 層構造。

```
┌───────────────────────────────────────────────────────────────┐
│  Layer 1: データレイク (Data Lake)                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Crawler (Web/PDF/RSS/API)                               │  │
│  │  → RawDocument → data/raw/ (JSONL)                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             ↓                                  │
│  Layer 2: マート (Mart)                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Cleaner → Classifier → Chunker → Embedder              │  │
│  │  → VectorDB (pgvector / ChromaDB)                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             ↓                                  │
│  Layer 3: ディスパッチ (Dispatch)                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  IntentClassifier → Router → Integrator                  │  │
│  │  → IntegrationResult (出典付き統合回答コンテキスト)        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## 2. マート設計パターン

### 2.1 マート分類の原則

| 原則 | 説明 |
|------|------|
| **目的別分離** | 「何を調べたいか」で分ける。検索意図が異なるデータは別マートに |
| **チャンク粒度の統一** | 同一マート内のチャンクは粒度を揃える |
| **メタデータの充実** | フィルタリング・ファセット検索に使えるメタデータを定義 |
| **6±2 マート** | マート数は 4〜8 が適正。多すぎるとルーティング精度が低下 |

### 2.2 汎用チャンク戦略パターン

| パターン | 用途 | トークン目安 | 例 |
|---------|------|-------------|------|
| `legal_article` | 法令・規則 | 500-1,500 | 条文単位、関連条文を参照保持 |
| `section` | 報告書・ガイドライン | 800-2,000 | 見出し単位、前提条件を含める |
| `term_definition` | 用語辞書 | 200-800 | 1 用語 = 1 チャンク、同義語メタデータ |
| `case_study` | 事例集 | 1,000-3,000 | 1 事例 = 1 チャンク、段階分割可 |
| `construction_method` | 技術・手法 | 800-2,000 | 工種・手法単位、適用条件含む |
| `safety_topic` | 安全・コンプライアンス | 500-1,500 | 災害種別単位、法的根拠メタデータ |
| `generic` | 汎用 | 500-1,000 | 固定トークン + オーバーラップ |

### 2.3 新マート追加チェックリスト

新しいマートを追加する際は以下を確認:

- [ ] マート ID が既存と重複しないこと
- [ ] `MartDefinition` 型に準拠した定義を作成
- [ ] チャンク戦略を選定（上記パターンから選ぶか、新パターンを `types.ts` に追加）
- [ ] メタデータスキーマを定義
- [ ] 最低 3 つのユースケース例を記載
- [ ] 対応するソース定義を `sources.yaml` に追加
- [ ] ディスパッチャーの意図分類プロンプトにマートを追加

## 3. クローラー設計標準

### 3.1 必須要件

| 要件 | 説明 |
|------|------|
| **robots.txt 遵守** | クロール前に robots.txt を確認し、Disallow パスをスキップ |
| **レートリミット** | デフォルト 1 リクエスト/秒。サイト別に設定可能 |
| **User-Agent** | ボット識別可能な UA を設定 (e.g. `HarmonicInsight-TDWH/1.0`) |
| **リトライ** | 3 回リトライ後にスキップ。指数バックオフ |
| **重複検出** | URL + content_hash (SHA-256) で重複排除 |
| **ログ記録** | 全クロールの成功/失敗/スキップをログに記録 |

### 3.2 クローラータイプ別実装ガイド

```
web           → httpx + BeautifulSoup で単一ページ取得
web_recursive → BFS 方式で max_depth まで同一ドメインリンク追跡
pdf           → pdfplumber でテキスト抽出 + テーブル構造化
rss           → feedparser + 既読管理 + 本文なければリンク先を web で取得
api           → REST/GraphQL クライアント（e-Gov 等の政府 API 向け）
```

## 4. データ加工パイプライン標準

### 4.1 パイプラインフロー

```
RawDocument → Cleaner → Classifier → Chunker → Embedder → VectorDB
```

### 4.2 Cleaner 標準処理

1. HTML 残留タグの除去
2. ナビゲーション・フッターのボイラープレート除去
3. 文字コード正規化（全角英数→半角、日本語は保持）
4. 連続空白・改行の正規化
5. ページヘッダー/フッター除去
6. 著作権表示の分離（メタデータへ）
7. 最低文字数チェック（100 文字未満はスキップ）

### 4.3 Classifier の使い分け

| 条件 | 分類方法 |
|------|---------|
| ソース定義で `mart` が明示 | ソース定義の値を使用（Classifier 不要） |
| ソース定義で `mart` が未指定 | LLM ベースの Classifier で自動分類 |
| 再分類が必要 | Classifier で再分類（`--reprocess` フラグ） |

### 4.4 Embedding 標準

- **モデル**: OpenAI `text-embedding-3-small` (1536 次元)
- **バッチ処理**: 最大 2048 テキスト/バッチ
- **設定**: `config/tdwh/embedding-config.ts` に定義済み
- **ストレージ**: 本番は Supabase + pgvector、開発は ChromaDB

## 5. ディスパッチャー設計標準

### 5.1 3 段階パイプライン

```
質問 → IntentClassifier → Router → Mart検索(並列) → Integrator → 統合回答
```

### 5.2 設定値

| パラメータ | デフォルト | 説明 |
|-----------|----------|------|
| `maxConcurrentMarts` | 3 | 並列検索する最大マート数 |
| `topKPerMart` | 5 | マートあたりの検索結果上限 |
| `minScoreThreshold` | 0.3 | 最低類似度スコア |

### 5.3 統合優先順位

複数マートの結果に矛盾がある場合の優先順位:

```
法令・規則 > 技術基準・仕様書 > 公式ガイドライン > 事例・解説
```

## 6. ストレージ標準

### 6.1 ローカル開発

```
data/
├── raw/            # クロール生データ (JSONL)
├── processed/      # 加工済みデータ (JSONL)
├── exports/        # エクスポート用
└── .chroma/        # ChromaDB データ
```

### 6.2 本番 (Supabase + pgvector)

スキーマ: `infrastructure/vectorstore/pgvector-schema.sql`

主要テーブル:
- `tdwh_marts` — マート定義
- `tdwh_sources` — ソース定義
- `tdwh_raw_documents` — 生ドキュメント（データレイク層）
- `tdwh_chunks` — チャンク + embedding（マート層）
- `tdwh_crawl_logs` — クロールログ

検索関数:
- `tdwh_search()` — 単一マート検索
- `tdwh_search_multi()` — 複数マート横断検索

## 7. 新規 TDWH プロジェクト作成手順

### Step 1: リポジトリ作成

```bash
mkdir {industry}-tdwh && cd {industry}-tdwh
git init
git submodule add https://github.com/HarmonicInsight/insight-common.git
```

### Step 2: Python プロジェクト初期化

```bash
uv init
uv add httpx beautifulsoup4 pdfplumber feedparser chromadb \
       openai anthropic pyyaml schedule rich pydantic tenacity tiktoken
```

### Step 3: ディレクトリ構成

```
{industry}-tdwh/
├── insight-common/           # Git サブモジュール
├── config/
│   ├── sources.yaml          # 業種固有ソース定義
│   ├── marts.yaml            # 業種固有マート定義
│   └── schedule.yaml         # クロールスケジュール
├── src/
│   ├── crawler/              # BaseCrawler + 業種固有クローラー
│   ├── processor/            # Cleaner / Chunker / Classifier / Embedder
│   ├── mart/                 # BaseMart + 業種固有マート
│   ├── dispatcher/           # IntentClassifier / Router / Integrator
│   ├── storage/              # データレイク + VectorStore 接続
│   └── utils/                # ロガー・レートリミッター等
├── scripts/
│   ├── crawl.py              # クロール実行
│   ├── process.py            # 加工・マート投入
│   ├── query.py              # 検索テスト
│   └── setup_db.py           # DB 初期化
├── tests/
└── data/
    ├── raw/
    ├── processed/
    └── exports/
```

### Step 4: 型準拠の確認

`insight-common/config/tdwh/types.ts` の型定義に準拠していることを確認。
Python 実装では Pydantic モデルで同等の型を定義する。

## 8. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| 全データを 1 つのベクトル DB に投入 | マート単位でコレクションを分離 |
| チャンク戦略を全マートで統一 | マート種類に応じた戦略を使い分け |
| robots.txt を無視 | 必ず robots.txt を確認してからクロール |
| API キーをコードにハードコード | `.env` で管理、`.gitignore` に追加 |
| GitHub トークンをスクリプトに記載 | `gh auth` または環境変数を使用 |
| ChromaDB を本番で使用 | 本番は Supabase + pgvector |
