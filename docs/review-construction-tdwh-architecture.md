# Construction TDWH アーキテクチャレビュー

> **レビュー対象**: `construction-tdwh-prompt.md`, `setup-github-repo.sh`
> **レビュー日**: 2026-02-07
> **目的**: Insight Common での共通化戦略の検討

---

## 1. セキュリティ問題（緊急）

### `setup-github-repo.sh` に GitHub PAT がハードコード

```
行7: TOKEN="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"
```

**即時対応が必要:**
- このトークンを GitHub Settings > Developer settings > Personal access tokens から **即座に revoke** する
- `.env` または `gh auth` を使うように書き換える
- このファイルは insight-common にコミットすべきではない（リポジトリ作成用の使い捨てスクリプト）

---

## 2. TDWH 設計の評価

### 2.1 良い点

| 観点 | 評価 |
|------|------|
| DWH 設計原則のテキストへの適用 | データレイク→マート→インターフェースの 3 層構造は正しいアプローチ |
| マート分離戦略 | 6 つのセマンティックマート（law/accounting/terminology/dx_case/method/safety）は建設業ドメインを適切にカバー |
| マート別チャンク戦略 | 法令は条文単位、用語は定義単位、事例はケース単位——検索精度向上に直結する設計 |
| ディスパッチャー設計 | 質問意図分類→マートルーティング→統合の 3 段階パイプラインは RAG の best practice |
| ソース定義の網羅性 | e-Gov、国交省、厚労省、業界団体など 15+ の公的ソースを網羅 |

### 2.2 懸念点・改善が必要な点

| 懸念 | 詳細 |
|------|------|
| **建設業固有すぎる** | マート定義・ソース定義・チャンク戦略がすべて建設業にハードコードされている。他業種（製造業、金融業など）への横展開が困難 |
| **Embedding に OpenAI を使用** | CLAUDE.md で「OpenAI/Azure を AI アシスタントに使用」は禁止だが、Embedding は例外扱いか要確認。Voyager (Anthropic 未提供) の代替検討 |
| **ChromaDB → 本番 DB の移行パスが曖昧** | Factory Architecture では Supabase + pgvector を想定。ChromaDB との二重管理リスク |
| **Python 単体プロジェクトとして独立** | Insight Common (TypeScript) との型定義・設定の共有方法が未定義 |
| **スケジュール管理が `schedule` ライブラリ** | 本番では Railway Cron や Cloud Scheduler を使うべき |

---

## 3. Insight Common との関係分析

### 3.1 既存アーキテクチャとの対応

```
Factory Architecture (docs/factory-architecture.md)
  Input    → TDWH の Crawler 層に対応
  Process  → TDWH の Processor 層に対応
  Enrich   → TDWH の Embedder + Classifier に対応
  Store    → TDWH の Storage 層に対応（Supabase + pgvector）
  Deliver  → TDWH の Dispatcher 層に対応

harmonic-mart-generator (CLAUDE.md で言及)
  ingest/  → TDWH の crawler/ + processor/ に対応
  search/  → TDWH の dispatcher/ に対応
```

**結論: TDWH は `harmonic-mart-generator` の建設業特化インスタンスであるべき。**

### 3.2 何を insight-common に置くべきか

```
insight-common に置く（汎用・共通化すべき部分）
├── config/
│   ├── tdwh-marts.ts          # マート型定義・メタデータスキーマ（業種非依存）
│   └── tdwh-sources.ts        # ソース型定義・スケジュール型（業種非依存）
├── infrastructure/
│   ├── crawler/               # クローラー基底クラス・インターフェース（TypeScript型定義）
│   ├── processor/             # 加工パイプラインインターフェース
│   └── vectorstore/           # ベクトルDB接続抽象化（pgvector / ChromaDB）
└── docs/
    └── tdwh-design-guide.md   # TDWH 設計ガイド（マート設計パターン等）
```

```
construction-tdwh に置く（業種固有の実装）
├── config/
│   ├── sources.yaml           # 建設業ソース定義（具体的 URL）
│   └── marts.yaml             # 建設業マート定義（law/accounting/...）
├── src/
│   ├── crawler/               # Python 実装（Web/PDF/RSS）
│   ├── processor/             # 建設業向けチャンク戦略・分類プロンプト
│   ├── mart/                  # 6 つの建設業マート実装
│   ├── dispatcher/            # 建設業向け意図分類・統合プロンプト
│   └── storage/               # ChromaDB/pgvector 接続実装
└── tests/
```

### 3.3 共通化の判断基準

| コンポーネント | insight-common | construction-tdwh | 理由 |
|---------------|:-:|:-:|------|
| **マート型定義 (BaseMart interface)** | **○** | | 全業種共通の概念 |
| **ソース型定義 (Source schema)** | **○** | | URL・タイプ・スケジュールは汎用 |
| **クローラー型定義 (BaseCrawler interface)** | **○** | | Web/PDF/RSS は業種に依存しない |
| **チャンク戦略型定義** | **○** | | パターン（条文型/事例型/定義型）は汎用化可能 |
| **Embedding 設定** | **○** | | モデル・次元数・バッチサイズは共通管理 |
| **建設業ソース URL 一覧** | | **○** | 完全に業種固有 |
| **建設業マート定義 (6 マート)** | | **○** | ドメイン知識 |
| **建設業分類プロンプト** | | **○** | 業種固有のプロンプト |
| **建設業チャンク戦略実装** | | **○** | 法令条文パース等は建設業固有 |
| **建設業意図分類プロンプト** | | **○** | ドメイン固有のルーティング |
| **Python 実装 (crawler/processor)** | | **○** | 実行コードは個別リポジトリ |

---

## 4. 推奨アーキテクチャ

### 4.1 全体像

```
insight-common (TypeScript 型定義 + 設定)
├── config/
│   ├── tdwh/
│   │   ├── types.ts              # MartDefinition, SourceDefinition, ChunkStrategy 等
│   │   ├── embedding-config.ts   # Embedding モデル設定・次元数・プロバイダー
│   │   └── dispatcher-config.ts  # ディスパッチャー共通設定
│   └── ...（既存）
│
├── infrastructure/
│   ├── vectorstore/
│   │   ├── types.ts              # VectorStore 接続インターフェース
│   │   └── pgvector-schema.sql   # pgvector テーブル定義（Supabase 用）
│   └── ...（既存）
│
└── standards/
    └── TDWH.md                   # TDWH 構築標準ガイド
```

```
construction-tdwh (Python 実装) ← 別リポジトリ
├── insight-common/               # Git サブモジュール
├── config/
│   ├── sources.yaml              # 建設業ソース（insight-common の型に準拠）
│   └── marts.yaml                # 建設業マート（insight-common の型に準拠）
├── src/
│   ├── crawler/                  # BaseCrawler の Python 実装
│   ├── processor/                # 建設業チャンク戦略の実装
│   ├── mart/                     # 6 マートの実装
│   ├── dispatcher/               # 建設業ディスパッチャー
│   └── storage/                  # pgvector 接続（insight-common のスキーマに準拠）
└── ...
```

### 4.2 将来の横展開パターン

```
construction-tdwh     manufacturing-tdwh     finance-tdwh
(建設業)              (製造業)               (金融業)
     │                     │                     │
     └─────────────────────┼─────────────────────┘
                           │
                   insight-common/config/tdwh/
                   (共通型定義・インターフェース)
```

各業種の TDWH は同じインターフェースに準拠するため:
- マート検索 API が統一される
- ディスパッチャーのルーティングロジックを共有できる
- 複数業種のマートを横断検索する「統合ディスパッチャー」が構築可能

---

## 5. 具体的な実装ステップ

### Phase A: insight-common に型定義を追加

```typescript
// config/tdwh/types.ts（案）

/** マート定義 */
export interface MartDefinition {
  id: string;
  name: string;
  description: string;
  collectionName: string;
  chunkStrategy: ChunkStrategyType;
  useCases: string[];
  metadataSchema: Record<string, MetadataFieldType>;
}

/** ソース定義 */
export interface SourceDefinition {
  id: string;
  name: string;
  url: string;
  type: 'web' | 'web_recursive' | 'pdf' | 'rss' | 'api';
  mart: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  maxDepth?: number;
  searchKeywords?: string[];
  description?: string;
}

/** チャンク戦略タイプ */
export type ChunkStrategyType =
  | 'legal_article'       // 法令条文型
  | 'section'             // セクション型
  | 'term_definition'     // 用語定義型
  | 'case_study'          // 事例型
  | 'construction_method' // 工法型
  | 'safety_topic'        // 安全トピック型
  | 'generic';            // 汎用

/** 検索結果 */
export interface SearchResult {
  content: string;
  score: float;
  metadata: Record<string, unknown>;
  sourceUrl: string;
  martName: string;
}

/** マート統計 */
export interface MartStats {
  documentCount: number;
  lastUpdated: string;
  sourceDistribution: Record<string, number>;
}
```

### Phase B: construction-tdwh を別リポジトリとして構築

1. `construction-tdwh` リポジトリを作成（`setup-github-repo.sh` からトークン削除）
2. `insight-common` をサブモジュールとして追加
3. `construction-tdwh-prompt.md` の Phase 1-7 に沿って Python 実装
4. Supabase + pgvector を本番ストレージとして使用（`infrastructure/vectorstore/pgvector-schema.sql` に準拠）

### Phase C: insight-common の Factory Architecture に統合

1. `docs/factory-architecture.md` に TDWH レイヤーを追加
2. `harmonic-mart-generator` との関係を明確化
3. ライセンスとの連携（TDWH 検索 API のアクセス制御）

---

## 6. TDWH プロンプトファイルの扱い

### 現状の問題

`construction-tdwh-prompt.md` は Claude Code への実装指示書であり、insight-common のルートに置くべきではない。

### 推奨配置

| ファイル | 現在 | 推奨 |
|---------|------|------|
| `construction-tdwh-prompt.md` | insight-common ルート | `construction-tdwh` リポジトリの `CLAUDE_CODE_PROMPT.md` に移動 |
| `setup-github-repo.sh` | insight-common ルート | **削除**（トークン漏洩リスク。`gh repo create` で代替） |

ただし、TDWH 設計のエッセンス（マート設計パターン、ディスパッチャー設計パターン）は insight-common の `docs/` または `standards/` に標準ガイドとして残す価値がある。

---

## 7. まとめ

### 結論: insight-common に「丸ごと」入れるべきではない

| | 理由 |
|---|------|
| **言語の違い** | insight-common は TypeScript、TDWH は Python。実装コードの同居は不適切 |
| **スコープの違い** | insight-common は型定義・設定・インターフェース。TDWH は実行可能なデータパイプライン |
| **業種依存性** | 建設業固有のソース・プロンプト・チャンク戦略は他製品に無関係 |

### insight-common に入れるべきもの

1. **TDWH 共通型定義** (`config/tdwh/types.ts`) — マート・ソース・チャンク戦略・検索結果の TypeScript 型
2. **Embedding 設定** (`config/tdwh/embedding-config.ts`) — モデル・次元数の一元管理
3. **pgvector スキーマ** (`infrastructure/vectorstore/pgvector-schema.sql`) — Supabase テーブル定義
4. **TDWH 設計標準** (`standards/TDWH.md`) — マート設計のベストプラクティス

### construction-tdwh（別リポジトリ）に入れるべきもの

1. Python 実装コード全体（crawler/processor/mart/dispatcher/storage）
2. 建設業固有のソース定義・マート定義（YAML）
3. 建設業固有の LLM プロンプト（分類・意図分類・統合）
4. テスト・CLI スクリプト

この分離により:
- 建設業 TDWH は独立してデプロイ・運用できる
- 他業種の TDWH を同じインターフェースで構築できる
- insight-common は型定義の共通基盤として機能する
