/**
 * TDWH → IPO 変換ブリッジ — テキストデータから業務プロセス構造を抽出
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * テキストデータウェアハウス（TDWH）に蓄積されたテキストデータ
 * （業務規程、議事録、マニュアル等）から、AI を用いて
 * IPO（Input-Process-Output）構造を自動抽出する。
 *
 * ```
 * TDWH CuratedRecord                    IPO JSON
 * ┌──────────────────┐                 ┌──────────────────┐
 * │ 経理規程 v2.1    │                 │ IpoData          │
 * │ 月次決算マニュアル│  → AI 抽出 →   │  └ 経理部         │
 * │ 定例会議事録     │                 │    └ 月次決算     │
 * │ ...              │                 │      ├ 原価収集   │
 * └──────────────────┘                 │      ├ 仕訳入力   │
 *                                      │      └ 決算承認   │
 *                                      └──────────────────┘
 * ```
 *
 * このモジュールは変換の「型」のみを定義する。
 * 実際の AI 抽出ロジックは各製品側で実装する。
 */

import type { IpoData, IpoNode } from '../ipo/types';
import type { CuratedRecord, CurationSourceType, MartDefinition } from './types';

// =============================================================================
// 抽出結果
// =============================================================================

/** テキストから抽出された IPO 構造 */
export interface ExtractedIpoStructure {
  /** 抽出元の TDWH CuratedRecord IDs */
  sourceRecordIds: string[];
  /** 生成された IPO データ */
  ipoData: IpoData;
  /** 抽出の信頼度 (0.0 - 1.0) */
  confidence: number;
  /** 抽出で解決できなかった点（不明な入出力先、曖昧な責任者等） */
  unresolvedItems: UnresolvedItem[];
  /** 抽出時の注意事項 */
  caveats: string[];
  /** 抽出日時 (ISO 8601) */
  extractedAt: string;
  /** 使用した LLM モデル */
  modelUsed: string;
}

/** 未解決項目（人間レビュー推奨） */
export interface UnresolvedItem {
  /** 対象ノード ID */
  nodeId: string;
  /** 未解決の種類 */
  type: 'unknown_source' | 'unknown_destination' | 'ambiguous_owner' | 'missing_kpi' | 'unclear_process';
  /** 説明 */
  description: string;
  /** 元テキストの該当箇所 */
  sourceText?: string;
}

// =============================================================================
// 抽出設定
// =============================================================================

/** IPO 抽出設定 */
export interface IpoExtractionConfig {
  /** 対象組織名 */
  companyName: string;
  /** 業種 */
  industry: string;
  /** 抽出対象とする TDWH マート ID（指定しない場合は全マート） */
  targetMarts?: string[];
  /** 抽出対象とするキュレーション済みレコードのソース種別 */
  targetSourceTypes?: CurationSourceType[];
  /** 最小信頼度閾値（これ未満の抽出結果は unresolvedItems に回す） */
  minConfidence: number;
  /** ノード階層の最大深度（default: 3 = department/process/task） */
  maxDepth: number;
  /** 実行者の自動推定を有効にするか */
  inferExecutorType: boolean;
  /** KPI の自動提案を有効にするか */
  suggestKpis: boolean;
  /** 課題の自動抽出を有効にするか */
  extractIssues: boolean;
}

/** デフォルトの IPO 抽出設定 */
export const DEFAULT_IPO_EXTRACTION_CONFIG: IpoExtractionConfig = {
  companyName: '',
  industry: '',
  minConfidence: 0.6,
  maxDepth: 3,
  inferExecutorType: true,
  suggestKpis: true,
  extractIssues: true,
};

// =============================================================================
// テキスト種別 → IPO 抽出パターンのマッピング
// =============================================================================

/**
 * テキスト種別ごとの IPO 抽出ヒント
 *
 * CurationSourceType に応じて、AI がどのような IPO 構造を
 * 探すべきかのガイダンスを提供する。
 */
export const IPO_EXTRACTION_HINTS: Record<CurationSourceType, IpoExtractionHint> = {
  web_article: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'general',
    description: 'Web 記事からプロセスの概要を抽出',
  },
  legal_text: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'rules_and_constraints',
    description: '法令条文から業務ルール・制約条件を抽出',
  },
  meeting_minutes: {
    expectedNodeTypes: ['department', 'process', 'task'],
    extractionFocus: 'decisions_and_actions',
    description: '議事録から決定事項・アクションアイテムを IPO として抽出',
  },
  interview: {
    expectedNodeTypes: ['department', 'process', 'task'],
    extractionFocus: 'as_is_process',
    description: 'ヒアリングから現行業務フロー（As-Is）を再構築',
  },
  report: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'kpis_and_issues',
    description: '報告書から KPI 実績・課題を抽出',
  },
  manual: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'step_by_step',
    description: 'マニュアルから手順・ツール・入出力を忠実に抽出',
  },
  news: {
    expectedNodeTypes: ['process'],
    extractionFocus: 'general',
    description: 'ニュースからプロセス改善の事例を抽出',
  },
  specification: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'rules_and_constraints',
    description: '仕様書から業務要件・制約を抽出',
  },
  scan_document: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'general',
    description: 'スキャン文書から業務情報を抽出（OCR 品質に注意）',
  },
  other: {
    expectedNodeTypes: ['process', 'task'],
    extractionFocus: 'general',
    description: '汎用的な IPO 構造抽出',
  },
};

/** 抽出ヒント */
export interface IpoExtractionHint {
  /** 期待されるノード種別 */
  expectedNodeTypes: ('organization' | 'department' | 'process' | 'task')[];
  /** 抽出の焦点 */
  extractionFocus: 'general' | 'step_by_step' | 'rules_and_constraints' | 'decisions_and_actions' | 'as_is_process' | 'kpis_and_issues';
  /** 説明 */
  description: string;
}

// =============================================================================
// 差分・更新
// =============================================================================

/**
 * IPO 構造の差分（テキスト更新時の自動追従用）
 *
 * テキスト DWH のデータが更新された場合、既存の IPO 構造との差分を
 * 検出し、更新提案として提示する。
 */
export interface IpoDiff {
  /** 追加されたノード */
  addedNodes: IpoNode[];
  /** 削除されたノード ID */
  removedNodeIds: string[];
  /** 変更されたノード */
  modifiedNodes: IpoNodeDiff[];
  /** 差分の信頼度 (0.0 - 1.0) */
  confidence: number;
  /** 元データの更新日時 */
  sourceUpdatedAt: string;
}

/** ノード単位の差分 */
export interface IpoNodeDiff {
  /** ノード ID */
  nodeId: string;
  /** 変更されたフィールド */
  changedFields: string[];
  /** 変更前の値 */
  before: Partial<IpoNode>;
  /** 変更後の値 */
  after: Partial<IpoNode>;
}
