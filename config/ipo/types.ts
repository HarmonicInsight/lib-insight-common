/**
 * IPO (Input-Process-Output) 業務プロセスモデル — 共通型定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * すべての業務は `function(input) → output` として抽象化できる。
 * 組織全体はこの業務関数の階層的ネスト構造で表現される。
 *
 * ```
 * 組織 (organization)
 * ├── 経理部 (department)
 * │   └── 月次決算 (process)
 * │       ├── 原価データ収集 (task)
 * │       ├── 仕訳入力・照合 (task)
 * │       └── 決算確認・承認 (task)
 * └── 工事部 (department)
 *     ├── 実行予算策定 (process)
 *     └── 現場日次業務 (process)
 * ```
 *
 * ## 利用製品
 *
 * | 製品 | 用途 |
 * |------|------|
 * | InsightProcess | IPO ビューワー/エディター（可視化・編集） |
 * | INCA | RPA 移行アセスメント（As-Is 分析 → 自動化候補特定） |
 * | INBT | Orchestrator ジョブ定義（IPO ノード → 自動実行） |
 * | IVIN | ヒアリング結果から IPO 構造を自動生成 |
 *
 * ## TDWH 連携
 *
 * ```
 * テキスト(規程/議事録/マニュアル) → TDWH → AI → IPO JSON → ビュー自動生成
 * ```
 *
 * TDWH の CuratedRecord から IPO 構造を抽出し、InsightProcess で可視化する。
 * 変換ブリッジは `config/tdwh/ipo-bridge.ts` で定義。
 */

// =============================================================================
// 基本列挙型
// =============================================================================

/**
 * タスクの実行者種別
 *
 * DX 推進の根幹概念。全タスクに「誰が実行するか」を明示することで、
 * 人手依存率の可視化と自動化候補の特定が構造的に行える。
 */
export type ExecutorType = 'human' | 'system' | 'ai' | 'hybrid';

/**
 * ノード種別（階層レベル）
 *
 * - organization: 組織ルート（複数組織の横断分析用）
 * - department: 部門・部署
 * - process: 業務プロセス（複数タスクの集合）
 * - task: 個別タスク（最小実行単位）
 */
export type NodeType = 'organization' | 'department' | 'process' | 'task';

/**
 * ビュー種別（InsightProcess 用）
 */
export type ViewType = 'tree' | 'flow' | 'cross-flow' | 'analysis';

// =============================================================================
// IPO 入出力
// =============================================================================

/** 業務ノードへの入力 */
export interface IpoInput {
  /** 入力データ名 (e.g. "現場原価データ") */
  name: string;
  /** 供給元ノード ID (e.g. "dept-construction") */
  source?: string;
  /** データ形式 (e.g. "Excel", "PDF", "基幹システム") */
  format?: string;
  /** 発生頻度 (e.g. "日次", "月次") */
  frequency?: string;
}

/** 業務ノードからの出力 */
export interface IpoOutput {
  /** 出力データ名 (e.g. "月次損益計算書") */
  name: string;
  /** 送付先ノード ID (e.g. "proc-management-report") */
  destination?: string;
  /** データ形式 */
  format?: string;
}

// =============================================================================
// 処理内容・KPI
// =============================================================================

/** 業務処理の内容 */
export interface IpoProcess {
  /** 処理概要 */
  summary?: string;
  /** 業務ルール・制約 */
  rules?: string[];
  /** 使用ツール・システム */
  tools?: string[];
  /** 所要時間 (e.g. "3営業日", "1.5時間") */
  duration?: string;
  /** 実行頻度 (e.g. "月次", "日次") */
  frequency?: string;
}

/** KPI 定義 */
export interface IpoKpi {
  /** KPI 名称 (e.g. "決算所要日数") */
  name: string;
  /** 目標値 (e.g. "5営業日以内") */
  target?: string;
  /** 単位 (e.g. "営業日", "%") */
  unit?: string;
  /** 実績値 */
  actual?: string;
  /** 達成状況 */
  status?: 'on_track' | 'at_risk' | 'off_track';
}

// =============================================================================
// コアエンティティ: IpoNode
// =============================================================================

/**
 * 業務ノード — IPO モデルの基本単位
 *
 * すべての業務を「入力 → 処理 → 出力」の関数として抽象化し、
 * 階層的ネスト構造で組織全体を表現する。
 *
 * ```typescript
 * // 例: 月次決算プロセス
 * const monthlyClosing: IpoNode = {
 *   id: 'proc-monthly-closing',
 *   name: '月次決算',
 *   type: 'process',
 *   executor: 'hybrid',
 *   input: [{ name: '現場原価データ', source: 'dept-construction' }],
 *   process: { summary: '各部門のデータを集約し月次財務諸表を作成', duration: '10営業日' },
 *   output: [{ name: '月次損益計算書', destination: 'proc-management-report' }],
 *   kpi: [{ name: '決算所要日数', target: '5営業日以内', unit: '営業日' }],
 *   issues: ['現場からの原価データ提出が遅延（平均3日遅れ）'],
 *   children: [/* task nodes */],
 * };
 * ```
 */
export interface IpoNode {
  /** ノード一意識別子 */
  id: string;
  /** 業務名称 */
  name: string;
  /** ノード種別 */
  type: NodeType;
  /** 業務の説明 */
  description?: string;
  /** 責任者 */
  owner?: string;
  /** 実行者種別 */
  executor?: ExecutorType;

  // IPO（業務関数の本体）
  /** この業務への入力 */
  input?: IpoInput[];
  /** 処理内容 */
  process?: IpoProcess;
  /** この業務からの出力 */
  output?: IpoOutput[];

  // 評価・課題
  /** KPI 定義 */
  kpi?: IpoKpi[];
  /** 課題・問題点 */
  issues?: string[];

  // 階層構造
  /** 下位ノード（department → process → task） */
  children?: IpoNode[];

  // 拡張
  /** ドメイン固有メタデータ */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// ルートデータ構造
// =============================================================================

/** IPO データルート（1組織分） */
export interface IpoData {
  /** 対象組織名 */
  company: string;
  /** スキーマバージョン */
  version: string;
  /** 最終更新日時 (ISO 8601) */
  updatedAt: string;
  /** 部門一覧（最上位ノード） */
  departments: IpoNode[];
  /** 組織メタデータ */
  metadata?: IpoDataMetadata;
}

/** 組織メタデータ */
export interface IpoDataMetadata {
  /** 業種 (e.g. "建設業", "製造業") */
  industry?: string;
  /** 従業員数 */
  employeeCount?: number;
  /** 地域 */
  region?: string;
  /** TDWH インスタンス ID（テキスト DWH 連携時） */
  tdwhInstanceId?: string;
}

// =============================================================================
// パンくずリスト（UI ヘルパー）
// =============================================================================

/** パンくずアイテム */
export interface BreadcrumbItem {
  id: string;
  name: string;
}

// =============================================================================
// ExecutorType 設定（UI 表示用）
// =============================================================================

/** 実行者種別の表示設定 */
export interface ExecutorConfig {
  label: string;
  labelJa: string;
  color: string;
  description: string;
  descriptionJa: string;
}

/** 実行者種別のデフォルト表示設定 */
export const EXECUTOR_CONFIGS: Record<ExecutorType, ExecutorConfig> = {
  human: {
    label: 'Human',
    labelJa: '人手',
    color: '#3B82F6',
    description: 'Manual execution by a person',
    descriptionJa: '人間が手動で実行',
  },
  system: {
    label: 'System',
    labelJa: 'システム',
    color: '#10B981',
    description: 'Automated by existing system',
    descriptionJa: '既存システムで自動実行',
  },
  ai: {
    label: 'AI',
    labelJa: 'AI',
    color: '#8B5CF6',
    description: 'AI-powered execution',
    descriptionJa: 'AI が実行',
  },
  hybrid: {
    label: 'Hybrid',
    labelJa: 'ハイブリッド',
    color: '#F59E0B',
    description: 'Human + System collaboration',
    descriptionJa: '人+システム併用',
  },
};

// =============================================================================
// IPO スキーマバージョン
// =============================================================================

/** 現在の IPO スキーマバージョン */
export const IPO_SCHEMA_VERSION = '1.0.0';
