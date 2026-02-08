/**
 * IPO DX 評価・自動化分析 — 共通型定義
 *
 * 業務プロセス（IpoNode）から DX 推進に必要な分析結果を生成するための型。
 * InsightProcess の AnalysisView、INCA の RPA アセスメントで共通利用。
 *
 * ## 分析の流れ
 *
 * ```
 * IpoData (業務構造)
 *   ↓ analyzeDxReadiness()
 * DxAssessment
 *   ├── executorDistribution   — 実行者分布 (human/system/ai/hybrid)
 *   ├── humanDependencyRate    — 人手依存率
 *   ├── automationCandidates   — 自動化候補一覧
 *   ├── issues                 — プロセス課題一覧
 *   └── crossDepartmentEdges   — 部門間依存関係
 * ```
 */

import type { ExecutorType, IpoNode } from './types';

// =============================================================================
// 自動化候補
// =============================================================================

/** 自動化の複雑度 */
export type AutomationComplexity = 'low' | 'medium' | 'high';

/** 自動化候補 */
export interface AutomationCandidate {
  /** 対象ノード ID */
  nodeId: string;
  /** ノード名称 */
  nodeName: string;
  /** ルートからのパス (e.g. ["経理部", "月次決算", "仕訳入力"]) */
  nodePath: string[];
  /** 現在の実行者 */
  currentExecutor: ExecutorType;
  /** 推奨実行者 */
  suggestedExecutor: ExecutorType;
  /** 自動化の複雑度 */
  complexity: AutomationComplexity;
  /** 推奨理由 */
  reasoning: string;
  /** 推定 ROI（年間削減時間など。単位は業種・文脈依存） */
  estimatedSavings?: string;
}

// =============================================================================
// プロセス課題
// =============================================================================

/** 課題の深刻度 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/** 課題のカテゴリ */
export type IssueCategory =
  | 'bottleneck'   // ボトルネック（所要時間超過）
  | 'dependency'   // 依存関係の問題（部門間遅延）
  | 'quality'      // 品質の問題（エラー、手戻り）
  | 'compliance'   // コンプライアンスリスク
  | 'cost'         // コストの問題
  | 'knowledge';   // 属人化・知識の問題

/** プロセス課題 */
export interface ProcessIssue {
  /** 対象ノード ID */
  nodeId: string;
  /** ノード名称 */
  nodeName: string;
  /** 課題内容 */
  issue: string;
  /** 深刻度 */
  severity: IssueSeverity;
  /** カテゴリ */
  category: IssueCategory;
}

// =============================================================================
// 部門間依存関係
// =============================================================================

/** 部門間のデータ流 */
export interface CrossDepartmentEdge {
  /** 出力元ノード ID */
  sourceNodeId: string;
  /** 入力先ノード ID */
  targetNodeId: string;
  /** データ名称 (output.name) */
  label: string;
  /** 出力元部門名 */
  sourceDepartment: string;
  /** 入力先部門名 */
  targetDepartment: string;
}

// =============================================================================
// DX 評価結果
// =============================================================================

/** DX 評価結果 */
export interface DxAssessment {
  /** 総ノード数 */
  totalNodes: number;
  /** ノード種別ごとの数 */
  nodeTypeDistribution: Record<string, number>;
  /** 実行者分布 */
  executorDistribution: Record<ExecutorType | 'unknown', number>;
  /** 人手依存率 (0.0 - 1.0) */
  humanDependencyRate: number;
  /** 自動化候補一覧 */
  automationCandidates: AutomationCandidate[];
  /** 課題一覧 */
  issues: ProcessIssue[];
  /** 部門間依存関係 */
  crossDepartmentEdges: CrossDepartmentEdge[];
  /** 評価日時 (ISO 8601) */
  assessedAt: string;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/** IpoNode ツリーから全ノードをフラットに収集 */
export function collectAllNodes(nodes: IpoNode[]): IpoNode[] {
  const result: IpoNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...collectAllNodes(node.children));
    }
  }
  return result;
}

/** ノード ID から該当ノードを検索 */
export function findNodeById(nodes: IpoNode[], id: string): IpoNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** ルートからノードまでのパスを構築 */
export function buildNodePath(nodes: IpoNode[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.name];
    if (node.id === targetId) return currentPath;
    if (node.children) {
      const found = buildNodePath(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 人手タスク（自動化候補）を抽出
 *
 * executor === 'human' かつ type === 'task' のノードを返す。
 * INCA / InsightProcess の分析ビューで共通利用。
 */
export function extractAutomationCandidates(nodes: IpoNode[]): IpoNode[] {
  return collectAllNodes(nodes).filter(
    (n) => n.executor === 'human' && n.type === 'task'
  );
}

/**
 * 課題を持つノードを抽出
 */
export function extractNodesWithIssues(nodes: IpoNode[]): IpoNode[] {
  return collectAllNodes(nodes).filter(
    (n) => n.issues && n.issues.length > 0
  );
}
