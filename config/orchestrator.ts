/**
 * InsightBot Orchestrator / Agent アーキテクチャ定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * InsightBot を UiPath Orchestrator 相当の中央管理サーバーとして位置付け、
 * InsightOffice 各アプリ（INSS/IOSH/IOSD）を Agent（実行端末）として
 * リモート JOB 配信・実行監視を実現する。
 *
 * ## UiPath モデルとの対比
 *
 * ```
 * UiPath                           InsightBot + InsightOffice
 * ──────────────────────────────    ──────────────────────────────
 * Orchestrator (サーバー)           InsightBot (Orchestrator モード)
 *   ├ JOB のデプロイ                ├ JOB の作成・配布
 *   ├ スケジュール管理              ├ cron 相当のスケジュール実行
 *   ├ 実行状況モニタリング          ├ リアルタイム実行ログ監視
 *   ├ キューイング                  ├ JOB キュー（順序・並列制御）
 *   └ 資産管理                      └ ライセンス・Agent 管理
 *
 * Agent / Robot (クライアント)      InsightOffice (Agent モード)
 *   ├ ロボット実行                  ├ Python スクリプト実行
 *   ├ ファイル操作                  ├ ドキュメント内部から操作（強み）
 *   ├ 実行結果報告                  ├ exit_code + stdout + 変更フラグ
 *   └ ハートビート                  └ WebSocket で接続状態通知
 * ```
 *
 * ## 差別化ポイント
 *
 * UiPath はファイルを「外から」操作する（Win32 API / UI Automation）。
 * InsightBot + InsightOffice は「中から」操作する。
 * ドキュメントがアプリ内で開いた状態のまま Python がセル・スライド・段落を
 * 直接操作するため、ファイルロックやUI遅延の問題がない。
 *
 * ## 全体アーキテクチャ
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  InsightBot (Orchestrator)                                   │
 * │  ┌───────────────────────────────────────────────────────┐  │
 * │  │  JOB マネージャー                                      │  │
 * │  │  ├ JOB 作成・編集（AI エディター）                      │  │
 * │  │  ├ JOB 配信先 Agent 選択                               │  │
 * │  │  ├ スケジュール設定（即時 / cron / イベント駆動）         │  │
 * │  │  └ 実行ログ・結果一覧                                  │  │
 * │  └───────────────────────────────────────────────────────┘  │
 * │  ┌───────────────────────────────────────────────────────┐  │
 * │  │  Agent ダッシュボード                                   │  │
 * │  │  ├ 登録済み Agent 一覧（INSS/IOSH/IOSD 各端末）         │  │
 * │  │  ├ オンライン / オフライン状態                           │  │
 * │  │  ├ 実行中 JOB リアルタイム表示                          │  │
 * │  │  └ JOB 実行履歴・ログ                                  │  │
 * │  └───────────────────────────────────────────────────────┘  │
 * │                          │                                   │
 * │                     WebSocket / REST                          │
 * │                          │                                   │
 * ├──────────────────────────┼──────────────────────────────────┤
 * │                          ▼                                   │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
 * │  │ Agent A  │  │ Agent B  │  │ Agent C  │                  │
 * │  │ IOSH     │  │ INSS     │  │ IOSD     │                  │
 * │  │ 経理PC   │  │ 営業PC   │  │ 法務PC   │                  │
 * │  │ Python   │  │ Python   │  │ Python   │                  │
 * │  │ Runtime  │  │ Runtime  │  │ Runtime  │                  │
 * │  └──────────┘  └──────────┘  └──────────┘                  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// Agent 定義
// =============================================================================

/** Agent の状態 */
export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';

/** Agent 情報 */
export interface AgentInfo {
  /** Agent 固有 ID（UUID） */
  agentId: string;
  /** 表示名（ユーザーが設定） */
  displayName: string;
  /** InsightOffice 製品コード */
  product: ProductCode;
  /** マシン名 */
  machineName: string;
  /** OS バージョン */
  osVersion: string;
  /** アプリバージョン */
  appVersion: string;
  /** Python ランタイムバージョン */
  pythonVersion: string;
  /** 現在のステータス */
  status: AgentStatus;
  /** 最終ハートビート (ISO 8601) */
  lastHeartbeat: string;
  /** Agent 登録日 (ISO 8601) */
  registeredAt: string;
  /** 現在実行中の JOB 数 */
  runningJobs: number;
  /** タグ（グルーピング・フィルタリング用） */
  tags: string[];
}

// =============================================================================
// JOB 定義
// =============================================================================

/** JOB の実行トリガータイプ */
export type JobTriggerType = 'manual' | 'scheduled' | 'event';

/** JOB のステータス */
export type JobExecutionStatus =
  | 'queued'      // キュー待ち
  | 'dispatched'  // Agent に配信済み
  | 'running'     // 実行中
  | 'completed'   // 正常完了
  | 'failed'      // エラー終了
  | 'cancelled'   // キャンセル
  | 'timeout';    // タイムアウト

/** スケジュール定義 */
export interface JobSchedule {
  /** スケジュール種別 */
  type: 'once' | 'cron' | 'interval';
  /** cron 式（type='cron' の場合） */
  cronExpression?: string;
  /** 間隔（分）（type='interval' の場合） */
  intervalMinutes?: number;
  /** 1回実行日時 (ISO 8601)（type='once' の場合） */
  executeAt?: string;
  /** スケジュールの有効/無効 */
  enabled: boolean;
  /** タイムゾーン */
  timezone: string;
}

/** JOB 定義 */
export interface JobDefinition {
  /** JOB ID (UUID) */
  jobId: string;
  /** JOB 名 */
  name: string;
  /** JOB 説明 */
  description: string;
  /** カテゴリ */
  category: string;
  /** 実行する Python スクリプト */
  script: string;
  /** 必要な pip パッケージ */
  requiredPackages: string[];
  /** パラメータ定義 */
  parameters: JobParameter[];
  /** 対象 Agent の条件 */
  targetAgent: JobTargetAgent;
  /** トリガー設定 */
  trigger: JobTriggerType;
  /** スケジュール（trigger='scheduled' の場合） */
  schedule?: JobSchedule;
  /** タイムアウト（秒） */
  timeoutSeconds: number;
  /** リトライ設定 */
  retry: {
    maxRetries: number;
    retryIntervalSeconds: number;
  };
  /** 作成者 */
  createdBy: string;
  /** 作成日 (ISO 8601) */
  createdAt: string;
  /** 最終更新日 (ISO 8601) */
  updatedAt: string;
}

/** JOB パラメータ定義 */
export interface JobParameter {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file_path';
  required: boolean;
  defaultValue?: string | number | boolean;
  description: string;
}

/** JOB の配信先 Agent 指定 */
export interface JobTargetAgent {
  /** 指定方法 */
  type: 'specific' | 'by_product' | 'by_tag' | 'any';
  /** 特定 Agent ID（type='specific'） */
  agentIds?: string[];
  /** 製品コード（type='by_product'） */
  product?: ProductCode;
  /** タグ（type='by_tag'） */
  tags?: string[];
}

// =============================================================================
// JOB 実行記録
// =============================================================================

/** JOB 実行ログエントリ */
export interface JobExecutionLog {
  /** 実行 ID (UUID) */
  executionId: string;
  /** JOB ID */
  jobId: string;
  /** 実行した Agent ID */
  agentId: string;
  /** ステータス */
  status: JobExecutionStatus;
  /** 開始日時 (ISO 8601) */
  startedAt: string;
  /** 完了日時 (ISO 8601) */
  completedAt?: string;
  /** 実行時間（ミリ秒） */
  durationMs?: number;
  /** 終了コード */
  exitCode?: number;
  /** 標準出力 */
  stdout?: string;
  /** 標準エラー */
  stderr?: string;
  /** ドキュメントが変更されたか */
  documentModified?: boolean;
  /** トリガー種別 */
  triggeredBy: JobTriggerType;
  /** リトライ回数 */
  retryCount: number;
}

// =============================================================================
// 通信プロトコル
// =============================================================================

/**
 * Orchestrator ↔ Agent 間の通信プロトコル定義
 *
 * WebSocket（リアルタイム）+ REST API（CRUD）のハイブリッド。
 * Agent はローカルネットワーク内の Orchestrator に接続する。
 */

/** Orchestrator → Agent: JOB 実行指示 */
export interface OrchestratorJobDispatch {
  type: 'job_dispatch';
  executionId: string;
  jobId: string;
  script: string;
  parameters: Record<string, string | number | boolean>;
  timeoutSeconds: number;
  /** 操作対象のドキュメントパス（Agent 側のローカルパス） */
  documentPath?: string;
}

/** Orchestrator → Agent: JOB キャンセル */
export interface OrchestratorJobCancel {
  type: 'job_cancel';
  executionId: string;
}

/** Agent → Orchestrator: ハートビート */
export interface AgentHeartbeat {
  type: 'heartbeat';
  agentId: string;
  status: AgentStatus;
  runningJobs: number;
  cpuUsagePercent: number;
  memoryUsageMb: number;
  /** 現在開いているドキュメントのパス一覧 */
  openDocuments: string[];
}

/** Agent → Orchestrator: JOB 実行開始通知 */
export interface AgentJobStarted {
  type: 'job_started';
  executionId: string;
  agentId: string;
  startedAt: string;
}

/** Agent → Orchestrator: JOB ログ行（リアルタイムストリーミング） */
export interface AgentJobLog {
  type: 'job_log';
  executionId: string;
  agentId: string;
  line: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
}

/** Agent → Orchestrator: JOB 実行完了通知 */
export interface AgentJobCompleted {
  type: 'job_completed';
  executionId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'timeout';
  exitCode: number;
  stdout: string;
  stderr: string;
  documentModified: boolean;
  completedAt: string;
  durationMs: number;
}

/** 全メッセージタイプのユニオン */
export type OrchestratorMessage = OrchestratorJobDispatch | OrchestratorJobCancel;
export type AgentMessage = AgentHeartbeat | AgentJobStarted | AgentJobLog | AgentJobCompleted;

// =============================================================================
// REST API エンドポイント定義
// =============================================================================

/**
 * Orchestrator REST API エンドポイント
 *
 * InsightBot 内にローカル HTTP サーバーとして起動。
 * Agent はこのサーバーに対して REST + WebSocket で接続する。
 */
export const ORCHESTRATOR_API = {
  /** デフォルトポート */
  defaultPort: 9400,

  /** WebSocket エンドポイント */
  ws: '/ws/agent',

  /** REST エンドポイント */
  endpoints: {
    // Agent 管理
    agents: {
      list: { method: 'GET' as const, path: '/api/agents' },
      register: { method: 'POST' as const, path: '/api/agents/register' },
      unregister: { method: 'DELETE' as const, path: '/api/agents/:agentId' },
      status: { method: 'GET' as const, path: '/api/agents/:agentId/status' },
    },
    // JOB 管理
    jobs: {
      list: { method: 'GET' as const, path: '/api/jobs' },
      create: { method: 'POST' as const, path: '/api/jobs' },
      get: { method: 'GET' as const, path: '/api/jobs/:jobId' },
      update: { method: 'PUT' as const, path: '/api/jobs/:jobId' },
      delete: { method: 'DELETE' as const, path: '/api/jobs/:jobId' },
      dispatch: { method: 'POST' as const, path: '/api/jobs/:jobId/dispatch' },
      cancel: { method: 'POST' as const, path: '/api/jobs/:jobId/cancel' },
    },
    // 実行ログ
    executions: {
      list: { method: 'GET' as const, path: '/api/executions' },
      get: { method: 'GET' as const, path: '/api/executions/:executionId' },
      logs: { method: 'GET' as const, path: '/api/executions/:executionId/logs' },
    },
    // スケジュール
    schedules: {
      list: { method: 'GET' as const, path: '/api/schedules' },
      update: { method: 'PUT' as const, path: '/api/schedules/:jobId' },
      enable: { method: 'POST' as const, path: '/api/schedules/:jobId/enable' },
      disable: { method: 'POST' as const, path: '/api/schedules/:jobId/disable' },
    },
  },
} as const;

// =============================================================================
// Agent 設定（InsightOffice 側）
// =============================================================================

/** InsightOffice Agent の設定 */
export interface AgentConfig {
  /** Orchestrator のアドレス（例: '192.168.1.100:9400'） */
  orchestratorUrl: string;
  /** Agent 表示名 */
  displayName: string;
  /** 自動接続（アプリ起動時に Orchestrator に自動接続） */
  autoConnect: boolean;
  /** ハートビート間隔（秒） */
  heartbeatIntervalSeconds: number;
  /** Agent タグ */
  tags: string[];
  /** JOB 同時実行上限 */
  maxConcurrentJobs: number;
}

/** デフォルト Agent 設定 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  orchestratorUrl: '',
  displayName: '',
  autoConnect: false,
  heartbeatIntervalSeconds: 30,
  tags: [],
  maxConcurrentJobs: 1,
};

// =============================================================================
// ライセンスチェック
// =============================================================================

/** Orchestrator 機能のプラン別制限 */
export const ORCHESTRATOR_LIMITS: Record<PlanCode, {
  maxAgents: number;
  schedulerEnabled: boolean;
  maxConcurrentDispatches: number;
  logRetentionDays: number;
}> = {
  TRIAL: {
    maxAgents: 5,
    schedulerEnabled: true,
    maxConcurrentDispatches: 2,
    logRetentionDays: 7,
  },
  STD: {
    maxAgents: 0,  // STD ではオーケストレーター不可
    schedulerEnabled: false,
    maxConcurrentDispatches: 0,
    logRetentionDays: 0,
  },
  PRO: {
    maxAgents: 50,
    schedulerEnabled: true,
    maxConcurrentDispatches: 10,
    logRetentionDays: 90,
  },
  ENT: {
    maxAgents: -1,  // 無制限
    schedulerEnabled: true,
    maxConcurrentDispatches: -1,
    logRetentionDays: 365,
  },
};

/**
 * Orchestrator 機能が利用可能かチェック
 */
export function canUseOrchestrator(plan: PlanCode): boolean {
  return ORCHESTRATOR_LIMITS[plan].maxAgents !== 0;
}

/**
 * Agent 追加可能かチェック
 */
export function canAddAgent(plan: PlanCode, currentAgentCount: number): boolean {
  const limit = ORCHESTRATOR_LIMITS[plan].maxAgents;
  if (limit === -1) return true;  // 無制限
  return currentAgentCount < limit;
}

/**
 * JOB 同時配信可能かチェック
 */
export function canDispatchJob(plan: PlanCode, currentRunningJobs: number): boolean {
  const limit = ORCHESTRATOR_LIMITS[plan].maxConcurrentDispatches;
  if (limit === -1) return true;
  return currentRunningJobs < limit;
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // 定数
  ORCHESTRATOR_API,
  ORCHESTRATOR_LIMITS,
  DEFAULT_AGENT_CONFIG,

  // チェック関数
  canUseOrchestrator,
  canAddAgent,
  canDispatchJob,
};
