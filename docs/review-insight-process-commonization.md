# InsightProcess 共通化分析レビュー

> **対象リポジトリ**: https://github.com/HarmonicInsight/web-app-insight-process.git
> **レビュー日**: 2026-02-07
> **ブランチ**: claude/review-warehouse-architecture-g1Fsj

---

## 1. InsightProcess の概要

InsightProcess は「**業務 = 関数 (Input → Process → Output)**」というコンセプトで、
組織の業務プロセスを階層的ネスト構造として可視化する React SPA。

```
核心思想: すべての業務は function(input) → output である
```

### 主要機能
- **ツリービュー**: 階層ドリルダウン（department → process → task）
- **フロービュー**: タスク間の Input/Output 依存関係を自動描画
- **全社フロービュー**: 部門横断のデータ連携を俯瞰（CrossFlowView）
- **分析ビュー**: 実行者分布（human/system/ai/hybrid）、自動化候補、課題一覧

### 技術スタック
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4（Blueprint テーマ: 濃紺 #0F172A）
- Zustand（状態管理）
- XYFlow（フロー可視化）
- JSON Import/Export（データ永続化）

---

## 2. 共通化分析

### 2.1 共通化すべき: IPO データモデル（高優先度）

InsightProcess の核心である **IPO スキーマ** は、複数の HARMONIC insight 製品で
業務プロセス構造を表現する共通言語になり得る。

```
現在: web-app-insight-process/src/types/ipo.ts （アプリ内ローカル）
推奨: insight-common/config/ipo/types.ts （共通型として昇格）
```

**対象型**:

| 型名 | 説明 | 共通化の根拠 |
|------|------|-------------|
| `IpoNode` | 業務ノード（department/process/task） | 全製品の業務構造表現に必要 |
| `IpoInput` / `IpoOutput` | 入出力定義 | プロセス間の依存関係グラフ |
| `IpoProcess` | 処理内容（ルール、ツール、所要時間） | DX 評価・自動化判定に必要 |
| `IpoKpi` | KPI 定義 | 経営ダッシュボード連携 |
| `ExecutorType` | 実行者種別 (human/system/ai/hybrid) | 自動化候補判定のコア概念 |
| `NodeType` | ノード種別 (department/process/task) | 階層構造の共通定義 |
| `IpoData` | ルートデータ構造 | JSON スキーマのバリデーション |

**利用する製品**:

| 製品 | 用途 |
|------|------|
| **INCA** (InsightNoCodeAnalyzer) | RPA 移行前の As-Is 業務構造を IPO で表現 → 自動化候補を特定 |
| **INBT** (InsightBot) | Orchestrator のジョブ/ワークフローが IPO ノードに対応 |
| **IVIN** (InterviewInsight) | ヒアリング結果から IPO 構造を自動生成 |
| **InsightProcess** | IPO ビューワー/エディター（消費側） |

### 2.2 共通化すべき: TDWH → IPO 変換ブリッジ（高優先度）

CONCEPT.md Section 8「テキスト DWH 連携」に明記されている将来構想:

```
社内テキスト → テキストDWH → AI解析 → JSON(IPOスキーマ)生成 → ビュー自動生成
(規程/マニュアル/議事録)   (蓄積)    (IPO構造抽出)
```

これは既に insight-common に構築した TDWH 4 層アーキテクチャの **出口** に相当する。

```
TDWH Layer 3 (Mart) の CuratedRecord
  ↓ AI 分析
IPO JSON 自動生成
  ↓
InsightProcess で可視化
```

**共通化すべきもの**:
- TDWH CuratedRecord → IpoNode 変換の型定義
- テキストから IPO 構造を抽出する LLM プロンプトテンプレート
- 変換結果のバリデーションスキーマ

### 2.3 共通化すべき: DX 評価・自動化分析の型（中優先度）

AnalysisView で行っている分析ロジック（実行者分布、自動化候補）は
INCA / INBT のコア機能と重なる。

```typescript
// 共通化すべき分析型
interface DxAssessment {
  totalNodes: number;
  executorDistribution: Record<ExecutorType, number>;
  automationCandidates: AutomationCandidate[];
  issues: ProcessIssue[];
  humanDependencyRate: number;
}

interface AutomationCandidate {
  nodeId: string;
  nodeName: string;
  currentExecutor: ExecutorType;
  suggestedExecutor: ExecutorType;
  estimatedRoi: number;     // 自動化 ROI 推定
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
}
```

### 2.4 共通化しない: UI コンポーネント・テーマ

| 項目 | 理由 |
|------|------|
| React コンポーネント | アプリ固有の UI 実装 |
| Blueprint テーマ (#0F172A) | InsightProcess 固有。Insight Common は Ivory & Gold |
| Zustand ストア | アプリ状態管理はアプリ固有 |
| XYFlow 設定 | 可視化ライブラリの設定はアプリ固有 |

### 2.5 共通化しない: サンプルデータ

`sample-construction.json` は建設業固有のデモデータ。
業種テンプレートとして将来的にマーケットプレイス化する場合は
別リポジトリ（`ipo-templates`）で管理すべき。

---

## 3. 推奨アーキテクチャ

```
insight-common/
├── config/
│   ├── ipo/                    ← 新規追加
│   │   ├── types.ts            # IPO コアスキーマ（業種非依存）
│   │   ├── analysis.ts         # DX 評価・自動化候補分析の型
│   │   ├── validation.ts       # IPO JSON バリデーション
│   │   └── index.ts            # barrel exports
│   ├── tdwh/
│   │   ├── types.ts            # 既存: TDWH 4層アーキテクチャ型
│   │   ├── ipo-bridge.ts       # 新規: TDWH → IPO 変換の型定義
│   │   └── ...
│   └── ...
├── standards/
│   └── IPO.md                  ← 新規: IPO データモデル設計標準
└── ...

web-app-insight-process/
├── src/
│   ├── types/
│   │   └── ipo.ts              → insight-common/config/ipo/types.ts から import
│   ├── components/             # アプリ固有（共通化しない）
│   └── ...
└── ...
```

### 3.1 config/ipo/types.ts — 共通 IPO スキーマ

InsightProcess の `src/types/ipo.ts` をベースに、以下を拡張:

```typescript
// insight-common/config/ipo/types.ts

/** 実行者種別 */
export type ExecutorType = 'human' | 'system' | 'ai' | 'hybrid';

/** ノード種別 */
export type NodeType = 'organization' | 'department' | 'process' | 'task';
//                      ↑ 組織ルートを追加（複数企業横断分析用）

/** IPO 入力 */
export interface IpoInput {
  name: string;
  source?: string;       // ソースノード ID
  format?: string;       // データ形式
  frequency?: string;    // 発生頻度（日次、月次等）
}

/** IPO 出力 */
export interface IpoOutput {
  name: string;
  destination?: string;  // 宛先ノード ID
  format?: string;
}

/** IPO 処理内容 */
export interface IpoProcess {
  summary?: string;
  rules?: string[];
  tools?: string[];
  duration?: string;
  frequency?: string;
}

/** KPI 定義 */
export interface IpoKpi {
  name: string;
  target?: string;
  unit?: string;
  actual?: string;        // 実績値（新規追加）
  status?: 'on_track' | 'at_risk' | 'off_track';  // 達成状況
}

/** 業務ノード（IPO の基本単位） */
export interface IpoNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  owner?: string;
  executor?: ExecutorType;
  input?: IpoInput[];
  process?: IpoProcess;
  output?: IpoOutput[];
  kpi?: IpoKpi[];
  issues?: string[];
  children?: IpoNode[];
  metadata?: Record<string, unknown>;
}

/** IPO データルート */
export interface IpoData {
  /** 対象組織名 */
  company: string;
  /** スキーマバージョン */
  version: string;
  /** 最終更新日時 (ISO 8601) */
  updatedAt: string;
  /** 部門一覧（最上位ノード） */
  departments: IpoNode[];
  /** メタデータ（業種、規模等） */
  metadata?: {
    industry?: string;
    employeeCount?: number;
    region?: string;
  };
}
```

### 3.2 config/ipo/analysis.ts — DX 評価・分析型

```typescript
// insight-common/config/ipo/analysis.ts

/** 自動化候補 */
export interface AutomationCandidate {
  nodeId: string;
  nodeName: string;
  nodePath: string[];        // ルートからのパス
  currentExecutor: ExecutorType;
  suggestedExecutor: ExecutorType;
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
}

/** プロセス課題 */
export interface ProcessIssue {
  nodeId: string;
  nodeName: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bottleneck' | 'dependency' | 'quality' | 'compliance' | 'cost';
}

/** 部門間依存関係 */
export interface CrossDepartmentEdge {
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  sourceDepartment: string;
  targetDepartment: string;
}

/** DX 評価結果 */
export interface DxAssessment {
  /** 総ノード数 */
  totalNodes: number;
  /** 実行者分布 */
  executorDistribution: Record<ExecutorType, number>;
  /** 人手依存率 (0.0 - 1.0) */
  humanDependencyRate: number;
  /** 自動化候補一覧 */
  automationCandidates: AutomationCandidate[];
  /** 課題一覧 */
  issues: ProcessIssue[];
  /** 部門間依存関係 */
  crossDepartmentEdges: CrossDepartmentEdge[];
  /** 評価日時 */
  assessedAt: string;
}
```

### 3.3 config/tdwh/ipo-bridge.ts — TDWH → IPO 変換ブリッジ

```typescript
// insight-common/config/tdwh/ipo-bridge.ts

/** テキストから抽出された IPO 構造 */
export interface ExtractedIpoStructure {
  /** 抽出元の TDWH CuratedRecord IDs */
  sourceRecordIds: string[];
  /** 生成された IPO データ */
  ipoData: IpoData;
  /** 抽出の信頼度 (0.0 - 1.0) */
  confidence: number;
  /** 抽出時の注意事項 */
  caveats: string[];
  /** 抽出日時 */
  extractedAt: string;
}

/** IPO 抽出設定 */
export interface IpoExtractionConfig {
  /** 抽出対象のマート ID */
  targetMarts: string[];
  /** 最小信頼度閾値 */
  minConfidence: number;
  /** 組織名 */
  companyName: string;
  /** 業種 */
  industry: string;
}
```

---

## 4. 実装優先順位

| 優先度 | タスク | 理由 |
|:------:|--------|------|
| 1 | `config/ipo/types.ts` — IPO コアスキーマ | 全製品の基盤。InsightProcess が即座に利用可能 |
| 2 | `config/ipo/analysis.ts` — DX 評価型 | INCA の RPA 移行アセスメント機能のコア |
| 3 | `config/tdwh/ipo-bridge.ts` — TDWH→IPO ブリッジ | construction-tdwh と InsightProcess の統合 |
| 4 | `standards/IPO.md` — 設計標準 | 新規 IPO 対応製品の開発ガイド |
| 5 | InsightProcess 側の import 切り替え | 共通型への移行 |

---

## 5. InsightProcess の製品コード登録

InsightProcess はまだ `config/products.ts` に登録されていない。
製品として正式化する場合、以下の登録が必要:

```
コード: INPR (仮)
名称:   InsightProcess
説明:   業務プロセス可視化・DX 評価ツール
ティア: Tier 2 or Tier 1（コンサル案件の入口ツールとしての位置付け次第）
```

ただし、InsightProcess を「**製品**」ではなく「**コンサルティング支援ツール（内部利用）**」
として位置付ける選択肢もある。この場合、products.ts への登録は不要で、
IPO スキーマのみ共通化すれば十分。

---

## 6. まとめ

| 共通化する | 共通化しない |
|-----------|-------------|
| IPO データモデル (IpoNode 等) | React コンポーネント |
| DX 評価・分析型 | Blueprint UI テーマ |
| TDWH → IPO 変換ブリッジ | Zustand ストア |
| IPO JSON バリデーション | XYFlow 設定 |
| IPO 設計標準ドキュメント | サンプルデータ |

**最も重要なポイント**: IPO スキーマは INCA / INBT / IVIN の業務構造表現の
共通言語であり、TDWH の出力先として InsightProcess と統合される。
この接点を insight-common で型定義として管理することで、
**テキスト → 構造化 → 可視化** のパイプラインが製品横断で実現される。
