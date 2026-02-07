/**
 * 多次元分析フレームワーク (Multi-Dimensional Analysis Framework)
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * 管理会計の多次元データベース（OLAP キューブ）と同じ概念を
 * テキストデータウェアハウス（TDWH）に適用する。
 *
 * 各次元（Dimension）ごとに階層（Hierarchy）があり、
 * ドリルダウン / ロールアップ で分析粒度を変える。
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TDWH 多次元分析モデル                                          │
 * │                                                                 │
 * │  ┌──────────────────┐  各次元ごとに階層を持つ                   │
 * │  │   組織次元         │  会社 → 部署 → 担当者                   │
 * │  │  (Organization)   │                                          │
 * │  ├──────────────────┤                                          │
 * │  │   時間次元         │  年度 → 四半期 → 月 → 週                │
 * │  │  (Time)           │                                          │
 * │  ├──────────────────┤                                          │
 * │  │   トピック次元     │  ドメイン → マート → カテゴリ            │
 * │  │  (Topic)          │                                          │
 * │  ├──────────────────┤                                          │
 * │  │   プロセス次元     │  フェーズ → 工程 → タスク                │
 * │  │  (Process)        │                                          │
 * │  ├──────────────────┤                                          │
 * │  │   重要度次元       │  深刻度 → 頻度 → 影響範囲               │
 * │  │  (Severity)       │                                          │
 * │  └──────────────────┘                                          │
 * │                                                                 │
 * │              ↓  各次元の交差 = 分析キューブ                       │
 * │                                                                 │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  分析例:                                                │    │
 * │  │  「A社 × 経理部 × 2025Q1 × 課題マート × 深刻度4以上」   │    │
 * │  │  → A社経理部の2025年Q1で報告された深刻な課題一覧         │    │
 * │  │                                                         │    │
 * │  │  「全社 × 全部署 × 2024〜2025 × 声マート」              │    │
 * │  │  → 全社の感情・満足度推移（ドリルダウンで部署別に展開）  │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## OLAP 操作との対応
 *
 * | OLAP 操作     | TDWH での意味                                    |
 * |--------------|--------------------------------------------------|
 * | ドリルダウン  | 会社→部署→担当者、年度→月 へ粒度を細かく           |
 * | ロールアップ  | 担当者→部署→会社 へ集約                            |
 * | スライス      | 特定の次元値で絞り込み（A社のみ、課題マートのみ）   |
 * | ダイス        | 複数次元の範囲指定（A社×経理部×2025Q1）            |
 * | ピボット      | 分析軸の入れ替え（行=部署、列=マート → 行=マート、列=部署） |
 *
 * ## インタビュー業務調査での 3 階層分析
 *
 * ```
 * 対象会社 (Company)
 * ├── 経理部 (Department)
 * │   ├── 田中太郎 (Person) ← セッション1
 * │   ├── 佐藤花子 (Person) ← セッション2
 * │   └── [部署集約] ← セッション1+2 の統合分析
 * ├── 営業部 (Department)
 * │   ├── 鈴木一郎 (Person) ← セッション3
 * │   └── [部署集約] ← セッション3 の分析
 * └── [会社全体] ← 全セッションの横断分析
 * ```
 */

import type { Chunk, MartDefinition } from './types';

// =============================================================================
// 次元定義（Dimension Definition）
// =============================================================================

/**
 * 次元の種類
 *
 * TDWH で使用する分析次元。各次元はそれぞれ独立した階層構造を持つ。
 * 新しいドメインで TDWH を実装する際、必要な次元のみ選択して使用する。
 */
export type DimensionType =
  | 'organization'  // 組織次元: 会社 → 部署 → 担当者
  | 'time'          // 時間次元: 年度 → 四半期 → 月 → 週
  | 'topic'         // トピック次元: ドメイン → マート → カテゴリ
  | 'process'       // プロセス次元: フェーズ → 工程 → タスク
  | 'severity'      // 重要度次元: 深刻度レベル → 頻度 → 影響範囲
  | 'geography'     // 地理次元: 国 → 地域 → 拠点
  | 'custom';       // カスタム次元（ドメイン固有）

/**
 * 階層レベル定義
 *
 * 次元内の1つの階層レベルを定義する。
 * 例: 組織次元の「部署」レベル
 */
export interface HierarchyLevel {
  /** レベル ID (e.g. "company", "department", "person") */
  id: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** 深度（0 = 最上位） */
  depth: number;
  /** メタデータキー: Chunk.metadata 内でこのレベルの値を持つキー */
  metadataKey: string;
}

/**
 * 次元定義
 *
 * 1つの分析次元の完全な定義。階層構造・集約ルールを含む。
 */
export interface DimensionDefinition {
  /** 次元 ID */
  id: DimensionType | string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** 階層レベル定義（上位から順） */
  levels: HierarchyLevel[];
  /** この次元が必須か（必須でない次元はドメインによって省略可能） */
  required: boolean;
}

// =============================================================================
// 組織次元: 会社 → 部署 → 担当者
// =============================================================================

/** 組織階層ノード */
export interface OrganizationNode {
  /** ノード ID */
  id: string;
  /** 表示名 */
  name: string;
  /** レベル */
  level: 'company' | 'department' | 'person';
  /** 親ノード ID（最上位は undefined） */
  parentId?: string;
  /** メタデータ（役職、連絡先等） */
  metadata?: Record<string, unknown>;
}

/** 組織階層ツリー */
export interface OrganizationHierarchy {
  /** ルート（会社） */
  company: {
    id: string;
    name: string;
    metadata?: Record<string, unknown>;
  };
  /** 部署一覧 */
  departments: Array<{
    id: string;
    name: string;
    metadata?: Record<string, unknown>;
  }>;
  /** 担当者一覧（部署 ID → 担当者リスト） */
  persons: Record<string, Array<{
    id: string;
    name: string;
    sessionIds: string[];
    metadata?: Record<string, unknown>;
  }>>;
}

// =============================================================================
// 時間次元: 年度 → 四半期 → 月 → 週
// =============================================================================

/** 時間粒度 */
export type TimeGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day';

/** 時間範囲 */
export interface TimeRange {
  /** 開始日 (ISO 8601) */
  from: string;
  /** 終了日 (ISO 8601) */
  to: string;
  /** 粒度 */
  granularity: TimeGranularity;
}

// =============================================================================
// 分析コンテキスト（OLAP クエリに相当）
// =============================================================================

/**
 * 次元フィルター
 *
 * 1つの次元に対するフィルター条件。スライス/ダイス操作に対応。
 */
export interface DimensionFilter {
  /** 次元 ID */
  dimension: DimensionType | string;
  /** 階層レベル ID */
  level: string;
  /** フィルター値（指定値に一致するチャンクのみ抽出） */
  values: string[];
  /** 除外値 */
  excludeValues?: string[];
}

/**
 * 集約指定
 *
 * どの次元のどのレベルでチャンクを集約するかを定義。
 * ロールアップ / ドリルダウン操作に対応。
 */
export interface AggregationSpec {
  /** 集約する次元 ID */
  dimension: DimensionType | string;
  /** 集約するレベル ID（このレベルでグルーピング） */
  level: string;
}

/**
 * 分析コンテキスト
 *
 * 多次元分析の1つのクエリを表現する。
 * OLAP の MDX クエリに相当。
 */
export interface AnalysisContext {
  /** 分析対象のマート ID（省略時は全マート） */
  martIds?: string[];
  /** 次元フィルター（スライス/ダイス） */
  filters: DimensionFilter[];
  /** 集約指定（グルーピング軸） */
  groupBy: AggregationSpec[];
  /** 時間範囲（時間次元のショートカット） */
  timeRange?: TimeRange;
  /** ソート */
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// =============================================================================
// 集約結果（Aggregation Result）
// =============================================================================

/**
 * 集約セル
 *
 * OLAP キューブの1セル。次元値の組み合わせ + 集計値。
 */
export interface AggregationCell {
  /** 次元値の組み合わせ（次元ID → 値） */
  dimensionValues: Record<string, string>;
  /** 集計指標 */
  measures: {
    /** チャンク数 */
    chunkCount: number;
    /** セッション数 */
    sessionCount: number;
    /** 平均深刻度（severity がある場合） */
    avgSeverity?: number;
    /** 最大深刻度 */
    maxSeverity?: number;
    /** 平均品質スコア */
    avgQualityScore?: number;
  };
  /** このセルに含まれるチャンク ID 一覧 */
  chunkIds: string[];
  /** 子セル（ドリルダウン時） */
  children?: AggregationCell[];
}

/**
 * 多次元分析結果
 */
export interface MultiDimensionalResult {
  /** 分析コンテキスト（実行されたクエリ） */
  context: AnalysisContext;
  /** 集約セル一覧 */
  cells: AggregationCell[];
  /** 分析対象の総チャンク数 */
  totalChunks: number;
  /** 分析対象の総セッション数 */
  totalSessions: number;
  /** 生成日時 */
  generatedAt: string;
}

// =============================================================================
// 標準次元定義
// =============================================================================

/** 組織次元の定義 */
export const DIMENSION_ORGANIZATION: DimensionDefinition = {
  id: 'organization',
  nameJa: '組織',
  nameEn: 'Organization',
  levels: [
    { id: 'company', nameJa: '会社', nameEn: 'Company', depth: 0, metadataKey: 'clientOrProject' },
    { id: 'department', nameJa: '部署', nameEn: 'Department', depth: 1, metadataKey: 'department' },
    { id: 'person', nameJa: '担当者', nameEn: 'Person', depth: 2, metadataKey: 'intervieweeName' },
  ],
  required: true,
};

/** 時間次元の定義 */
export const DIMENSION_TIME: DimensionDefinition = {
  id: 'time',
  nameJa: '時間',
  nameEn: 'Time',
  levels: [
    { id: 'year', nameJa: '年度', nameEn: 'Year', depth: 0, metadataKey: 'year' },
    { id: 'quarter', nameJa: '四半期', nameEn: 'Quarter', depth: 1, metadataKey: 'quarter' },
    { id: 'month', nameJa: '月', nameEn: 'Month', depth: 2, metadataKey: 'month' },
    { id: 'week', nameJa: '週', nameEn: 'Week', depth: 3, metadataKey: 'week' },
  ],
  required: false,
};

/** トピック次元の定義 */
export const DIMENSION_TOPIC: DimensionDefinition = {
  id: 'topic',
  nameJa: 'トピック',
  nameEn: 'Topic',
  levels: [
    { id: 'domain', nameJa: 'ドメイン', nameEn: 'Domain', depth: 0, metadataKey: 'templateDomain' },
    { id: 'mart', nameJa: 'マート', nameEn: 'Mart', depth: 1, metadataKey: 'martId' },
    { id: 'category', nameJa: 'カテゴリ', nameEn: 'Category', depth: 2, metadataKey: 'category' },
  ],
  required: true,
};

/** プロセス次元の定義 */
export const DIMENSION_PROCESS: DimensionDefinition = {
  id: 'process',
  nameJa: 'プロセス',
  nameEn: 'Process',
  levels: [
    { id: 'phase', nameJa: 'フェーズ', nameEn: 'Phase', depth: 0, metadataKey: 'phase' },
    { id: 'step', nameJa: '工程', nameEn: 'Step', depth: 1, metadataKey: 'step' },
    { id: 'task', nameJa: 'タスク', nameEn: 'Task', depth: 2, metadataKey: 'task' },
  ],
  required: false,
};

/** 重要度次元の定義 */
export const DIMENSION_SEVERITY: DimensionDefinition = {
  id: 'severity',
  nameJa: '重要度',
  nameEn: 'Severity',
  levels: [
    { id: 'severity_level', nameJa: '深刻度', nameEn: 'Severity Level', depth: 0, metadataKey: 'severity' },
    { id: 'frequency', nameJa: '頻度', nameEn: 'Frequency', depth: 1, metadataKey: 'frequency' },
    { id: 'scope', nameJa: '影響範囲', nameEn: 'Scope', depth: 2, metadataKey: 'affected_scope' },
  ],
  required: false,
};

/** 全標準次元 */
export const ALL_STANDARD_DIMENSIONS: DimensionDefinition[] = [
  DIMENSION_ORGANIZATION,
  DIMENSION_TIME,
  DIMENSION_TOPIC,
  DIMENSION_PROCESS,
  DIMENSION_SEVERITY,
];

/** インタビュー業務調査で使用する次元セット */
export const INTERVIEW_ANALYSIS_DIMENSIONS: DimensionDefinition[] = [
  DIMENSION_ORGANIZATION,
  DIMENSION_TIME,
  DIMENSION_TOPIC,
  DIMENSION_SEVERITY,
];

// =============================================================================
// 集約関数
// =============================================================================

/**
 * チャンクのメタデータから時間次元の値を抽出する
 */
export function extractTimeDimension(dateStr: string): Record<string, string> {
  const date = new Date(dateStr);
  const year = date.getFullYear().toString();
  const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const quarter = `${year}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  const weekNum = getISOWeek(date);
  const week = `${year}-W${String(weekNum).padStart(2, '0')}`;
  return { year, quarter, month, week };
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * チャンクの metadata から指定次元・レベルの値を取得する
 */
export function getDimensionValue(
  chunk: Chunk,
  dimension: DimensionDefinition,
  levelId: string
): string | undefined {
  const level = dimension.levels.find((l) => l.id === levelId);
  if (!level) return undefined;
  const meta = chunk.metadata as Record<string, unknown>;
  const value = meta[level.metadataKey];
  return value != null ? String(value) : undefined;
}

/**
 * チャンク群を指定された次元フィルターで絞り込む（スライス/ダイス）
 */
export function filterChunks(
  chunks: Chunk[],
  filters: DimensionFilter[],
  dimensions: DimensionDefinition[]
): Chunk[] {
  if (filters.length === 0) return chunks;

  return chunks.filter((chunk) => {
    for (const filter of filters) {
      const dim = dimensions.find((d) => d.id === filter.dimension);
      if (!dim) continue;

      const value = getDimensionValue(chunk, dim, filter.level);

      // 値がない場合はフィルターを通過させない
      if (value === undefined) return false;

      // 除外値チェック
      if (filter.excludeValues && filter.excludeValues.includes(value)) return false;

      // フィルター値チェック
      if (filter.values.length > 0 && !filter.values.includes(value)) return false;
    }
    return true;
  });
}

/**
 * チャンク群を指定された次元・レベルでグルーピングする
 *
 * ロールアップ / ドリルダウンの基本操作。
 */
export function groupChunks(
  chunks: Chunk[],
  groupBy: AggregationSpec[],
  dimensions: DimensionDefinition[]
): Map<string, Chunk[]> {
  const groups = new Map<string, Chunk[]>();

  for (const chunk of chunks) {
    const keyParts: string[] = [];
    for (const spec of groupBy) {
      const dim = dimensions.find((d) => d.id === spec.dimension);
      if (!dim) continue;
      const value = getDimensionValue(chunk, dim, spec.level) || '(未設定)';
      keyParts.push(`${spec.dimension}:${spec.level}=${value}`);
    }
    const key = keyParts.join('|');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(chunk);
  }

  return groups;
}

/**
 * グルーピングされたチャンク群から集約セルを生成する
 */
export function buildAggregationCells(
  groups: Map<string, Chunk[]>,
  groupBy: AggregationSpec[]
): AggregationCell[] {
  const cells: AggregationCell[] = [];

  for (const [key, chunks] of groups) {
    // キーからdimensionValuesを復元
    const dimensionValues: Record<string, string> = {};
    const parts = key.split('|');
    for (const part of parts) {
      const [dimLevel, value] = part.split('=');
      if (dimLevel && value) {
        dimensionValues[dimLevel] = value;
      }
    }

    // measures を計算
    const sessionIds = new Set<string>();
    let totalSeverity = 0;
    let severityCount = 0;
    let maxSeverity = 0;
    let totalQuality = 0;
    let qualityCount = 0;

    for (const chunk of chunks) {
      const meta = chunk.metadata as Record<string, unknown>;
      if (meta.sessionId) sessionIds.add(String(meta.sessionId));
      if (typeof meta.severity === 'number') {
        totalSeverity += meta.severity;
        severityCount++;
        if (meta.severity > maxSeverity) maxSeverity = meta.severity;
      }
      if (typeof meta.qualityScore === 'number') {
        totalQuality += meta.qualityScore;
        qualityCount++;
      }
    }

    cells.push({
      dimensionValues,
      measures: {
        chunkCount: chunks.length,
        sessionCount: sessionIds.size,
        avgSeverity: severityCount > 0 ? totalSeverity / severityCount : undefined,
        maxSeverity: severityCount > 0 ? maxSeverity : undefined,
        avgQualityScore: qualityCount > 0 ? totalQuality / qualityCount : undefined,
      },
      chunkIds: chunks.map((c) => c.id),
    });
  }

  // チャンク数降順でソート
  cells.sort((a, b) => b.measures.chunkCount - a.measures.chunkCount);
  return cells;
}

/**
 * 多次元分析を実行する
 *
 * OLAP キューブへのクエリに相当。
 * フィルター → グルーピング → 集約 の3ステップで分析結果を生成。
 *
 * @example
 * ```typescript
 * // A社の部署別 × マート別の分析
 * const result = analyzeMultiDimensional(allChunks, {
 *   filters: [
 *     { dimension: 'organization', level: 'company', values: ['A社'] },
 *   ],
 *   groupBy: [
 *     { dimension: 'organization', level: 'department' },
 *     { dimension: 'topic', level: 'mart' },
 *   ],
 * }, INTERVIEW_ANALYSIS_DIMENSIONS);
 *
 * // 全社 × 時間推移（四半期）の課題数
 * const result = analyzeMultiDimensional(allChunks, {
 *   filters: [
 *     { dimension: 'topic', level: 'mart', values: ['interview_problems'] },
 *   ],
 *   groupBy: [
 *     { dimension: 'time', level: 'quarter' },
 *   ],
 *   timeRange: { from: '2024-01-01', to: '2025-12-31', granularity: 'quarter' },
 * }, INTERVIEW_ANALYSIS_DIMENSIONS);
 * ```
 */
export function analyzeMultiDimensional(
  chunks: Chunk[],
  context: AnalysisContext,
  dimensions: DimensionDefinition[] = INTERVIEW_ANALYSIS_DIMENSIONS
): MultiDimensionalResult {
  // マートフィルター
  let filtered = context.martIds
    ? chunks.filter((c) => context.martIds!.includes(c.martId))
    : chunks;

  // 次元フィルター（スライス/ダイス）
  filtered = filterChunks(filtered, context.filters, dimensions);

  // 時間範囲フィルター
  if (context.timeRange) {
    const from = new Date(context.timeRange.from).getTime();
    const to = new Date(context.timeRange.to).getTime();
    filtered = filtered.filter((chunk) => {
      const meta = chunk.metadata as Record<string, unknown>;
      const dateStr = (meta.completedAt || meta.createdAt || chunk.createdAt) as string;
      if (!dateStr) return true;
      const t = new Date(dateStr).getTime();
      return t >= from && t <= to;
    });
  }

  // グルーピングと集約
  const groups = groupChunks(filtered, context.groupBy, dimensions);
  const cells = buildAggregationCells(groups, context.groupBy);

  // 全体集計
  const allSessionIds = new Set<string>();
  for (const chunk of filtered) {
    const meta = chunk.metadata as Record<string, unknown>;
    if (meta.sessionId) allSessionIds.add(String(meta.sessionId));
  }

  return {
    context,
    cells,
    totalChunks: filtered.length,
    totalSessions: allSessionIds.size,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 組織階層ツリーをチャンクのメタデータから自動構築する
 *
 * チャンク群から会社→部署→担当者の階層を推定し、ツリーを返す。
 */
export function buildOrganizationHierarchy(
  chunks: Chunk[]
): OrganizationHierarchy | null {
  const companies = new Map<string, Set<string>>();
  const deptPersons = new Map<string, Map<string, Set<string>>>();

  for (const chunk of chunks) {
    const meta = chunk.metadata as Record<string, unknown>;
    const company = meta.clientOrProject as string | undefined;
    const dept = meta.department as string | undefined;
    const person = meta.intervieweeName as string | undefined;
    const sessionId = meta.sessionId as string | undefined;

    if (!company) continue;

    if (!companies.has(company)) {
      companies.set(company, new Set());
    }
    if (dept) {
      companies.get(company)!.add(dept);
    }

    if (dept) {
      if (!deptPersons.has(dept)) {
        deptPersons.set(dept, new Map());
      }
      if (person) {
        if (!deptPersons.get(dept)!.has(person)) {
          deptPersons.get(dept)!.set(person, new Set());
        }
        if (sessionId) {
          deptPersons.get(dept)!.get(person)!.add(sessionId);
        }
      }
    }
  }

  if (companies.size === 0) return null;

  // 最初の会社を使用（複数会社の場合は呼び出し側でフィルター）
  const [companyName, deptNames] = [...companies.entries()][0];

  const departments = [...deptNames].map((name) => ({
    id: `dept_${name}`,
    name,
  }));

  const persons: OrganizationHierarchy['persons'] = {};
  for (const dept of departments) {
    const personMap = deptPersons.get(dept.name);
    if (personMap) {
      persons[dept.id] = [...personMap.entries()].map(([name, sessionIds]) => ({
        id: `person_${name}`,
        name,
        sessionIds: [...sessionIds],
      }));
    } else {
      persons[dept.id] = [];
    }
  }

  return {
    company: { id: `company_${companyName}`, name: companyName },
    departments,
    persons,
  };
}

/**
 * ドリルダウン: 指定セルの1つ下の階層で再分析する
 */
export function drillDown(
  chunks: Chunk[],
  cell: AggregationCell,
  drillDimension: DimensionType | string,
  dimensions: DimensionDefinition[] = INTERVIEW_ANALYSIS_DIMENSIONS
): AggregationCell[] {
  const dim = dimensions.find((d) => d.id === drillDimension);
  if (!dim) return [];

  // 現在のレベルを特定
  const currentKey = `${drillDimension}:`;
  let currentLevelId: string | undefined;
  for (const [key, _value] of Object.entries(cell.dimensionValues)) {
    if (key.startsWith(currentKey)) {
      currentLevelId = key.split(':')[1]?.split('=')[0];
      break;
    }
  }

  // 次のレベルを取得
  let nextLevel: HierarchyLevel | undefined;
  if (currentLevelId) {
    const currentDepth = dim.levels.find((l) => l.id === currentLevelId)?.depth ?? -1;
    nextLevel = dim.levels.find((l) => l.depth === currentDepth + 1);
  } else {
    // まだこの次元でグルーピングしていない場合、最上位から
    nextLevel = dim.levels[0];
  }

  if (!nextLevel) return []; // 最下位レベルに到達

  // セルに含まれるチャンクを取得してフィルター
  const cellChunks = chunks.filter((c) => cell.chunkIds.includes(c.id));

  // 次のレベルでグルーピング
  const groups = groupChunks(
    cellChunks,
    [{ dimension: drillDimension, level: nextLevel.id }],
    dimensions
  );

  return buildAggregationCells(groups, [{ dimension: drillDimension, level: nextLevel.id }]);
}
