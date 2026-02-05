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
// サーバー定数
// =============================================================================

/** Orchestrator デフォルトポート */
export const ORCHESTRATOR_PORT = 9400;

/** Orchestrator ベース URL（ローカル開発用） */
export const ORCHESTRATOR_BASE_URL = `http://localhost:${ORCHESTRATOR_PORT}`;

/** ハートビート間隔 (ms) */
export const HEARTBEAT_INTERVAL_MS = 30_000;

/** ハートビートタイムアウト (ms) — この時間ハートビートが無ければ切断扱い */
export const HEARTBEAT_TIMEOUT_MS = 90_000;

// =============================================================================
// Agent 定義
// =============================================================================

/** Agent の状態 */
export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';

/** Agent 情報（設計レベル） */
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

/** Agent 登録リクエスト（REST API 用） */
export interface AgentRegisterRequest {
  /** Agent 表示名 */
  name: string;
  /** マシンのホスト名 */
  hostname: string;
  /** Agent バージョン */
  version: string;
  /** 対応機能タグ（例: ['ui-automation', 'excel', 'web'] */
  capabilities: string[];
  /** テナントID（マルチテナント時） */
  tenant_id?: string;
}

/** Agent レコード（DB + API レスポンス） */
export interface AgentRecord {
  id: string;
  name: string;
  hostname: string;
  version: string;
  capabilities: string[];
  status: AgentStatus;
  tenant_id: string | null;
  last_heartbeat_at: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Agent ステータス更新リクエスト */
export interface AgentStatusUpdateRequest {
  status: AgentStatus;
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

/** Job ステータス（REST API 用、pending を含む） */
export type JobStatus = 'pending' | 'queued' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Job 優先度 */
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

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

/** JOB 定義（設計レベル） */
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

/** Job 作成リクエスト（REST API 用） */
export interface JobCreateRequest {
  /** Job 名 */
  name: string;
  /** Job 定義 JSON（InsightBot Studio の JobDefinition 形式） */
  definition: Record<string, unknown>;
  /** 優先度 */
  priority?: JobPriority;
  /** 対象 Agent ID（指定なしで自動割当） */
  target_agent_id?: string;
  /** 要求する機能タグ（Agent の capabilities とマッチ） */
  required_capabilities?: string[];
  /** テナントID */
  tenant_id?: string;
  /** 作成者 ユーザーID */
  created_by?: string;
}

/** Job レコード（DB + API レスポンス） */
export interface JobRecord {
  id: string;
  name: string;
  definition: Record<string, unknown>;
  status: JobStatus;
  priority: JobPriority;
  target_agent_id: string | null;
  assigned_agent_id: string | null;
  required_capabilities: string[];
  tenant_id: string | null;
  created_by: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ワークフロー定義（BPO パターン対応）
// =============================================================================

/**
 * ワークフロー（Workflow）
 *
 * 複数の JOB を順序付きで実行するパイプライン定義。
 *
 * ## ユースケース
 *
 * ### BPO パターン（書類作成の外注）
 * 1つの案件で複数のドキュメントを順番に処理する。
 * - Step 1: 売上データ.xlsx を開いて集計スクリプトを実行
 * - Step 2: 月次レポート.docx を開いてテンプレートに集計結果を注入
 * - Step 3: 報告書.pptx を開いてグラフを生成
 *
 * ### 市民開発パターン
 * ユーザーが GUI でステップを組み立てて、日次/週次で自動実行。
 *
 * ## 実行フロー
 *
 * ```
 * Orchestrator                        Agent (InsightOffice)
 * ──────────                          ─────────────────────
 * workflow_dispatch ──────────────→
 *   step[0]: open 売上データ.xlsx
 *            run  aggregate.py
 *            close
 *                 ←──────────────── step_completed (0)
 *   step[1]: open 月次レポート.docx
 *            run  fill_template.py
 *            close
 *                 ←──────────────── step_completed (1)
 *   step[2]: open 報告書.pptx
 *            run  gen_charts.py
 *            close
 *                 ←──────────────── step_completed (2)
 * workflow_completed ←────────────── all steps done
 * ```
 */

/** ワークフローのステップ */
export interface WorkflowStep {
  /** ステップ番号（0 始まり） */
  stepIndex: number;
  /** ステップ名 */
  name: string;
  /** 使用する JOB ID（既存の JOB を参照） */
  jobId: string;
  /** 操作対象のドキュメントパス（Agent 側のローカルパス） */
  documentPath: string;
  /** JOB パラメータの上書き */
  parameterOverrides?: Record<string, string | number | boolean>;
  /** 前ステップの出力をこのステップの入力に渡すマッピング */
  inputMapping?: Record<string, string>;
  /** エラー時の挙動 */
  onError: 'stop' | 'skip' | 'retry';
  /** タイムアウト（秒）、省略時は JOB のデフォルトを使用 */
  timeoutSeconds?: number;
}

/** ワークフロー定義 */
export interface WorkflowDefinition {
  /** ワークフロー ID (UUID) */
  workflowId: string;
  /** ワークフロー名 */
  name: string;
  /** 説明 */
  description: string;
  /** カテゴリ */
  category: string;
  /** 実行ステップ（順序付き） */
  steps: WorkflowStep[];
  /** 対象 Agent */
  targetAgent: JobTargetAgent;
  /** トリガー */
  trigger: JobTriggerType;
  /** スケジュール */
  schedule?: JobSchedule;
  /** 全ステップ完了後に実行する通知/アクション */
  onComplete?: {
    /** 出力ファイルのコピー先フォルダ */
    outputFolder?: string;
    /** 通知先（メール等、将来拡張） */
    notify?: string[];
  };
  /** 作成者 */
  createdBy: string;
  /** 作成日 (ISO 8601) */
  createdAt: string;
  /** 最終更新日 (ISO 8601) */
  updatedAt: string;
}

/** ワークフロー実行ログ */
export interface WorkflowExecutionLog {
  /** ワークフロー実行 ID (UUID) */
  workflowExecutionId: string;
  /** ワークフロー ID */
  workflowId: string;
  /** Agent ID */
  agentId: string;
  /** 全体ステータス */
  status: JobExecutionStatus;
  /** 各ステップの実行結果 */
  stepResults: Array<{
    stepIndex: number;
    executionId: string;
    status: JobExecutionStatus;
    documentPath: string;
    documentModified: boolean;
    durationMs: number;
    exitCode: number;
    /** このステップの出力（次ステップに渡される） */
    output?: Record<string, string>;
  }>;
  /** 開始日時 (ISO 8601) */
  startedAt: string;
  /** 完了日時 (ISO 8601) */
  completedAt?: string;
  /** 全体実行時間（ミリ秒） */
  totalDurationMs?: number;
  /** 処理したファイル数 */
  filesProcessed: number;
  triggeredBy: JobTriggerType;
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
// Execution 型定義（DB レコード用）
// =============================================================================

/** Execution ステータス */
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

/** Execution レコード（DB + API レスポンス） */
export interface ExecutionRecord {
  id: string;
  job_id: string;
  agent_id: string;
  status: ExecutionStatus;
  /** ブロック単位の進捗 (0-100) */
  progress: number;
  /** 実行ログ */
  logs: ExecutionLog[];
  /** 実行結果 */
  result: Record<string, unknown> | null;
  /** エラー情報 */
  error: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 実行ログエントリ */
export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  block_id?: string;
  block_name?: string;
}

// =============================================================================
// 通信プロトコル（低レベル メッセージ型）
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

/** Orchestrator → Agent: ワークフロー実行指示 */
export interface OrchestratorWorkflowDispatch {
  type: 'workflow_dispatch';
  workflowExecutionId: string;
  workflowId: string;
  steps: Array<{
    stepIndex: number;
    name: string;
    jobId: string;
    script: string;
    documentPath: string;
    parameters: Record<string, string | number | boolean>;
    timeoutSeconds: number;
    onError: 'stop' | 'skip' | 'retry';
  }>;
}

/** Orchestrator → Agent: ドキュメントを開く指示 */
export interface OrchestratorOpenDocument {
  type: 'open_document';
  executionId: string;
  documentPath: string;
}

/** Orchestrator → Agent: ドキュメントを閉じる指示 */
export interface OrchestratorCloseDocument {
  type: 'close_document';
  executionId: string;
  /** 変更を保存するか */
  save: boolean;
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

/** Agent → Orchestrator: ワークフロー ステップ完了通知 */
export interface AgentWorkflowStepCompleted {
  type: 'workflow_step_completed';
  workflowExecutionId: string;
  stepIndex: number;
  executionId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'timeout';
  exitCode: number;
  documentPath: string;
  documentModified: boolean;
  durationMs: number;
  /** このステップの出力値（次ステップの inputMapping に使用） */
  output?: Record<string, string>;
}

/** Agent → Orchestrator: ワークフロー全体完了通知 */
export interface AgentWorkflowCompleted {
  type: 'workflow_completed';
  workflowExecutionId: string;
  agentId: string;
  status: 'completed' | 'failed';
  completedSteps: number;
  totalSteps: number;
  filesProcessed: number;
  totalDurationMs: number;
  completedAt: string;
}

/** Agent → Orchestrator: ドキュメント操作結果 */
export interface AgentDocumentResult {
  type: 'document_result';
  executionId: string;
  agentId: string;
  action: 'opened' | 'closed';
  documentPath: string;
  success: boolean;
  error?: string;
}

/** 全メッセージタイプのユニオン（低レベルプロトコル） */
export type OrchestratorMessage =
  | OrchestratorJobDispatch
  | OrchestratorJobCancel
  | OrchestratorWorkflowDispatch
  | OrchestratorOpenDocument
  | OrchestratorCloseDocument;

export type AgentMessage =
  | AgentHeartbeat
  | AgentJobStarted
  | AgentJobLog
  | AgentJobCompleted
  | AgentWorkflowStepCompleted
  | AgentWorkflowCompleted
  | AgentDocumentResult;

// =============================================================================
// WebSocket メッセージ型（サーバー実装用 — 型付き WS プロトコル）
// =============================================================================

/** WebSocket メッセージ種別 */
export type WsMessageType =
  // Agent → Orchestrator
  | 'agent:auth'
  | 'agent:heartbeat'
  | 'agent:status'
  | 'agent:job:accept'
  | 'agent:job:reject'
  | 'agent:job:progress'
  | 'agent:job:complete'
  | 'agent:job:fail'
  // Orchestrator → Agent
  | 'server:welcome'
  | 'server:heartbeat_ack'
  | 'server:job:dispatch'
  | 'server:job:cancel'
  | 'server:error';

/** WebSocket メッセージ基底型 */
export interface WsMessageBase {
  type: WsMessageType;
  timestamp: string;
}

// --- Agent → Orchestrator ---

export interface WsAgentAuth extends WsMessageBase {
  type: 'agent:auth';
  agent_id: string;
  /** 認証トークン（将来用） */
  token?: string;
}

export interface WsAgentHeartbeat extends WsMessageBase {
  type: 'agent:heartbeat';
  agent_id: string;
  /** CPU 使用率 (0-100) */
  cpu_usage?: number;
  /** メモリ使用率 (0-100) */
  memory_usage?: number;
}

export interface WsAgentStatus extends WsMessageBase {
  type: 'agent:status';
  agent_id: string;
  status: AgentStatus;
}

export interface WsAgentJobAccept extends WsMessageBase {
  type: 'agent:job:accept';
  job_id: string;
  execution_id: string;
}

export interface WsAgentJobReject extends WsMessageBase {
  type: 'agent:job:reject';
  job_id: string;
  reason: string;
}

export interface WsAgentJobProgress extends WsMessageBase {
  type: 'agent:job:progress';
  job_id: string;
  execution_id: string;
  progress: number;
  current_block?: string;
  log?: ExecutionLog;
}

export interface WsAgentJobComplete extends WsMessageBase {
  type: 'agent:job:complete';
  job_id: string;
  execution_id: string;
  result: Record<string, unknown>;
}

export interface WsAgentJobFail extends WsMessageBase {
  type: 'agent:job:fail';
  job_id: string;
  execution_id: string;
  error: string;
}

// --- Orchestrator → Agent ---

export interface WsServerWelcome extends WsMessageBase {
  type: 'server:welcome';
  agent_id: string;
  server_version: string;
  heartbeat_interval_ms: number;
}

export interface WsServerHeartbeatAck extends WsMessageBase {
  type: 'server:heartbeat_ack';
}

export interface WsServerJobDispatch extends WsMessageBase {
  type: 'server:job:dispatch';
  job_id: string;
  execution_id: string;
  definition: Record<string, unknown>;
}

export interface WsServerJobCancel extends WsMessageBase {
  type: 'server:job:cancel';
  job_id: string;
  reason?: string;
}

export interface WsServerError extends WsMessageBase {
  type: 'server:error';
  code: string;
  message: string;
}

/** Agent → Orchestrator メッセージ Union */
export type WsAgentMessage =
  | WsAgentAuth
  | WsAgentHeartbeat
  | WsAgentStatus
  | WsAgentJobAccept
  | WsAgentJobReject
  | WsAgentJobProgress
  | WsAgentJobComplete
  | WsAgentJobFail;

/** Orchestrator → Agent メッセージ Union */
export type WsServerMessage =
  | WsServerWelcome
  | WsServerHeartbeatAck
  | WsServerJobDispatch
  | WsServerJobCancel
  | WsServerError;

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

  /** REST エンドポイント（ネスト構造） */
  endpoints: {
    // Health check
    health: { method: 'GET' as const, path: '/api/health' },
    // Agent 管理
    agents: {
      list: { method: 'GET' as const, path: '/api/agents' },
      register: { method: 'POST' as const, path: '/api/agents' },
      get: { method: 'GET' as const, path: '/api/agents/:agentId' },
      unregister: { method: 'DELETE' as const, path: '/api/agents/:agentId' },
      status: { method: 'GET' as const, path: '/api/agents/:agentId/status' },
      updateStatus: { method: 'PATCH' as const, path: '/api/agents/:agentId/status' },
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
      executions: { method: 'GET' as const, path: '/api/jobs/:jobId/executions' },
    },
    // 実行ログ
    executions: {
      list: { method: 'GET' as const, path: '/api/executions' },
      get: { method: 'GET' as const, path: '/api/executions/:executionId' },
      logs: { method: 'GET' as const, path: '/api/executions/:executionId/logs' },
    },
    // ワークフロー
    workflows: {
      list: { method: 'GET' as const, path: '/api/workflows' },
      create: { method: 'POST' as const, path: '/api/workflows' },
      get: { method: 'GET' as const, path: '/api/workflows/:workflowId' },
      update: { method: 'PUT' as const, path: '/api/workflows/:workflowId' },
      delete: { method: 'DELETE' as const, path: '/api/workflows/:workflowId' },
      dispatch: { method: 'POST' as const, path: '/api/workflows/:workflowId/dispatch' },
      cancel: { method: 'POST' as const, path: '/api/workflows/:workflowId/cancel' },
      executions: { method: 'GET' as const, path: '/api/workflows/:workflowId/executions' },
    },
    // スケジュール
    schedules: {
      list: { method: 'GET' as const, path: '/api/schedules' },
      update: { method: 'PUT' as const, path: '/api/schedules/:jobId' },
      enable: { method: 'POST' as const, path: '/api/schedules/:jobId/enable' },
      disable: { method: 'POST' as const, path: '/api/schedules/:jobId/disable' },
    },
  },

  // --- フラット参照（サーバー実装で直接利用） ---
  HEALTH: '/api/health',
  AGENT_REGISTER:      '/api/agents',
  AGENT_LIST:          '/api/agents',
  AGENT_GET:           '/api/agents/:id',
  AGENT_UPDATE_STATUS: '/api/agents/:id/status',
  AGENT_DELETE:        '/api/agents/:id',
  JOB_CREATE:   '/api/jobs',
  JOB_LIST:     '/api/jobs',
  JOB_GET:      '/api/jobs/:id',
  JOB_DISPATCH: '/api/jobs/:id/dispatch',
  JOB_CANCEL:   '/api/jobs/:id/cancel',
  EXECUTION_LIST:       '/api/jobs/:id/executions',
  EXECUTION_GET:        '/api/executions/:id',
  WS_AGENT: '/ws/agent',
  // Schedules
  SCHEDULE_LIST:   '/api/schedules',
  SCHEDULE_CREATE: '/api/schedules',
  SCHEDULE_GET:    '/api/schedules/:id',
  SCHEDULE_UPDATE: '/api/schedules/:id',
  SCHEDULE_DELETE: '/api/schedules/:id',
  // Workflows
  WORKFLOW_LIST:     '/api/workflows',
  WORKFLOW_CREATE:   '/api/workflows',
  WORKFLOW_GET:      '/api/workflows/:id',
  WORKFLOW_UPDATE:   '/api/workflows/:id',
  WORKFLOW_DELETE:   '/api/workflows/:id',
  WORKFLOW_DISPATCH: '/api/workflows/:id/dispatch',
  // Alerts
  ALERT_LIST:   '/api/alerts',
  ALERT_CREATE: '/api/alerts',
  ALERT_GET:    '/api/alerts/:id',
  ALERT_UPDATE: '/api/alerts/:id',
  ALERT_DELETE: '/api/alerts/:id',
  ALERT_HISTORY: '/api/alerts/:id/history',
  // Assets
  ASSET_LIST:   '/api/assets',
  ASSET_CREATE: '/api/assets',
  ASSET_GET:    '/api/assets/:id',
  ASSET_UPDATE: '/api/assets/:id',
  ASSET_DELETE: '/api/assets/:id',
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
} as const;

/** API レスポンス共通ラッパー */
export interface OrchestratorApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

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
// Schedule 定義（サーバー DB レコード用）
// =============================================================================

/** スケジュール種別 */
export type ScheduleType = 'once' | 'cron' | 'interval';

/** スケジュールレコード（DB + API レスポンス） */
export interface ScheduleRecord {
  id: string;
  job_id: string;
  type: ScheduleType;
  cron_expression: string | null;
  interval_minutes: number | null;
  execute_at: string | null;
  enabled: boolean;
  timezone: string;
  last_run_at: string | null;
  next_run_at: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

/** スケジュール作成リクエスト */
export interface ScheduleCreateRequest {
  job_id: string;
  type: ScheduleType;
  cron_expression?: string;
  interval_minutes?: number;
  execute_at?: string;
  enabled?: boolean;
  timezone?: string;
  tenant_id?: string;
}

// =============================================================================
// Workflow 定義（サーバー DB レコード用）
// =============================================================================

/** ワークフローステップ（DB JSON 用） */
export interface WorkflowStepRecord {
  step_index: number;
  name: string;
  job_id: string;
  document_path?: string;
  on_failure: 'stop' | 'skip' | 'retry';
  timeout_seconds?: number;
}

/** ワークフローレコード（DB + API レスポンス） */
export interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  steps: WorkflowStepRecord[];
  trigger: 'manual' | 'scheduled' | 'event';
  enabled: boolean;
  tenant_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** ワークフロー作成リクエスト */
export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  steps: WorkflowStepRecord[];
  trigger?: 'manual' | 'scheduled' | 'event';
  enabled?: boolean;
  tenant_id?: string;
  created_by?: string;
}

/** ワークフロー実行レコード（DB + API レスポンス） */
export interface WorkflowExecutionRecord {
  id: string;
  workflow_id: string;
  agent_id: string | null;
  status: ExecutionStatus;
  current_step: number;
  step_results: Array<{
    step_index: number;
    execution_id: string | null;
    status: ExecutionStatus | 'pending';
    started_at: string | null;
    finished_at: string | null;
    error: string | null;
  }>;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Alert 定義（サーバー DB レコード用）
// =============================================================================

/** アラート種別 */
export type AlertType = 'job_failed' | 'job_succeeded' | 'agent_offline' | 'workflow_failed' | 'schedule_missed';

/** 通知チャネル */
export type NotificationChannel = 'email' | 'webhook' | 'slack' | 'teams';

/** アラートレコード（DB + API レスポンス） */
export interface AlertRecord {
  id: string;
  name: string;
  type: AlertType;
  channel: NotificationChannel;
  destination: string;
  enabled: boolean;
  filter_job_ids: string[] | null;
  filter_agent_ids: string[] | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

/** アラート作成リクエスト */
export interface AlertCreateRequest {
  name: string;
  type: AlertType;
  channel: NotificationChannel;
  destination: string;
  enabled?: boolean;
  filter_job_ids?: string[];
  filter_agent_ids?: string[];
  tenant_id?: string;
}

/** アラート履歴レコード（DB + API レスポンス） */
export interface AlertHistoryRecord {
  id: string;
  alert_id: string;
  event_type: AlertType;
  event_payload: Record<string, unknown>;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'failed';
  error: string | null;
  created_at: string;
}

// =============================================================================
// Asset 定義（サーバー DB レコード用）
// =============================================================================

/** アセット種別 */
export type AssetType = 'text' | 'integer' | 'boolean' | 'credential';

/** アセットスコープ */
export type AssetScope = 'global' | 'per_agent';

/** アセットレコード（DB + API レスポンス） */
export interface AssetRecord {
  id: string;
  name: string;
  type: AssetType;
  value: string | null;
  scope: AssetScope;
  description: string | null;
  agent_ids: string[] | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

/** アセット作成リクエスト */
export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  value?: string;
  scope?: AssetScope;
  description?: string;
  agent_ids?: string[];
  tenant_id?: string;
}

// =============================================================================
// Dashboard 統計（API レスポンス用）
// =============================================================================

/** ダッシュボード統計 */
export interface OrchestratorStats {
  agents: {
    total: number;
    online: number;
    busy: number;
    offline: number;
    error: number;
  };
  jobs: {
    total: number;
    pending: number;
    running: number;
    completed_today: number;
    failed_today: number;
  };
  workflows: {
    total: number;
    enabled: number;
    running: number;
  };
  schedules: {
    total: number;
    enabled: number;
    next_run_in_minutes: number | null;
  };
  alerts: {
    total: number;
    triggered_today: number;
  };
  assets: {
    total: number;
    credentials: number;
  };
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // 定数
  ORCHESTRATOR_PORT,
  ORCHESTRATOR_BASE_URL,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  ORCHESTRATOR_API,
  ORCHESTRATOR_LIMITS,
  DEFAULT_AGENT_CONFIG,

  // チェック関数
  canUseOrchestrator,
  canAddAgent,
  canDispatchJob,
};
