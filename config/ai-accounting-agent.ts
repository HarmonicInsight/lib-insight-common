/**
 * AI Accounting Agent 設定
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * Claude API を使った自律型 AI 経理エージェント。
 * Stripe 決済イベントと freee 会計 API を橋渡しし、
 * 売上計上・請求書発行・入金消込・月次締めを自動化する。
 *
 * ## アーキテクチャ
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  AI Accounting Agent                                            │
 * │                                                                 │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │  Trigger Layer（イベント受信）                              │  │
 * │  │                                                           │  │
 * │  │  Stripe Webhook  ──→ StripeEventHandler                   │  │
 * │  │  freee Webhook   ──→ FreeeEventHandler                    │  │
 * │  │  Cron スケジュール ──→ ScheduledTaskRunner                 │  │
 * │  │  手動実行         ──→ ManualTrigger                        │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * │                          │                                      │
 * │                          ▼                                      │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │  Workflow Engine（ワークフロー制御）                        │  │
 * │  │                                                           │  │
 * │  │  1. イベント → ワークフロー選択                             │  │
 * │  │  2. ワークフローのステップを順次実行                        │  │
 * │  │  3. 各ステップで Claude API を Tool Use で呼び出し          │  │
 * │  │  4. 承認が必要なステップは human-in-the-loop で待機         │  │
 * │  │  5. 結果をログに記録                                       │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * │                          │                                      │
 * │                          ▼                                      │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │  Tool Layer（Claude Tool Use）                             │  │
 * │  │                                                           │  │
 * │  │  freee_create_deal      freee_list_partners               │  │
 * │  │  freee_create_invoice   freee_get_trial_balance            │  │
 * │  │  freee_update_deal      freee_create_partner               │  │
 * │  │  freee_list_deals       freee_list_account_items           │  │
 * │  │  stripe_get_session     stripe_list_charges                │  │
 * │  │  lookup_product_mapping calculate_tax                      │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * │                          │                                      │
 * │                          ▼                                      │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │  Safety Layer（安全制御）                                   │  │
 * │  │                                                           │  │
 * │  │  • dry-run モード（API 呼び出しをシミュレート）             │  │
 * │  │  • 金額閾値チェック（高額取引は承認必須）                   │  │
 * │  │  • 二重登録防止（冪等性キー）                               │  │
 * │  │  • 監査ログ（全操作を記録）                                │  │
 * │  │  • ロールバック支援（作成した取引の削除）                   │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Stripe → freee 売上計上フロー（メインユースケース）
 *
 * ```
 * Stripe checkout.session.completed
 *   │
 *   ├─ 1. Stripe Session 情報を取得（stripe_get_session）
 *   │     → 顧客名、メール、製品コード、プラン、金額
 *   │
 *   ├─ 2. freee 取引先を検索/作成（freee_list_partners → freee_create_partner）
 *   │     → メールアドレスで既存取引先を検索、なければ新規作成
 *   │
 *   ├─ 3. freee 請求書を発行（freee_create_invoice）
 *   │     → 製品品目マッピング、税率10%、インボイス制度対応
 *   │
 *   ├─ 4. freee 入金取引を記録（freee_create_deal）
 *   │     → Stripe 口座からの入金、手数料の按分
 *   │
 *   └─ 5. 同期記録を保存
 *         → stripe_freee_sync テーブルに記録
 * ```
 *
 * ## 月次締めワークフロー
 *
 * ```
 * 毎月 3 日 AM 9:00 (JST)
 *   │
 *   ├─ 1. 前月の Stripe 決済を全件取得
 *   ├─ 2. freee 取引との突合（未同期を検出）
 *   ├─ 3. 未同期分を自動補完
 *   ├─ 4. 試算表（BS/PL）を取得して整合性チェック
 *   ├─ 5. レポートを生成（Slack 通知）
 *   └─ 6. 異常があれば人間にエスカレート
 * ```
 */

import type { ProductCode, PlanCode } from './products';
import type { StripeWebhookEvent, StripeCheckoutMetadata } from './stripe-integration';
import type {
  FreeeDeal,
  FreeePartner,
  FreeeInvoice,
  FreeeAccountItem,
  FreeeTrialBalanceRow,
  FreeeWebhookEvent,
} from './freee-integration';

// =============================================================================
// 型定義
// =============================================================================

/** Agent 実行モード */
export type AgentExecutionMode =
  | 'live'      // 本番（freee API を実際に呼び出す）
  | 'dry_run'   // ドライラン（API 呼び出しをシミュレート、ログのみ記録）
  | 'sandbox';  // freee 開発環境に接続

/** Agent 実行ステータス */
export type AgentExecutionStatus =
  | 'pending'          // 開始待ち
  | 'running'          // 実行中
  | 'awaiting_approval' // 承認待ち（human-in-the-loop）
  | 'completed'        // 正常完了
  | 'failed'           // エラー終了
  | 'cancelled'        // キャンセル
  | 'rolled_back';     // ロールバック済み

/** ワークフロートリガー種別 */
export type WorkflowTriggerType =
  | 'stripe_webhook'   // Stripe Webhook イベント
  | 'freee_webhook'    // freee Webhook イベント
  | 'scheduled'        // cron スケジュール
  | 'manual';          // 手動実行

/** 承認ポリシー */
export type ApprovalPolicy =
  | 'auto'             // 自動承認（閾値以下）
  | 'notify'           // 通知のみ（Slack/メール）、自動続行
  | 'require_approval'; // 承認必須（human-in-the-loop で待機）

// =============================================================================
// Agent 実行コンテキスト
// =============================================================================

/** Agent 実行コンテキスト（各ワークフロー実行の状態） */
export interface AgentExecutionContext {
  /** 実行 ID（UUID） */
  executionId: string;
  /** ワークフロー ID */
  workflowId: string;
  /** 実行モード */
  mode: AgentExecutionMode;
  /** ステータス */
  status: AgentExecutionStatus;
  /** トリガー種別 */
  triggerType: WorkflowTriggerType;
  /** トリガーデータ（Stripe イベント、cron 情報等） */
  triggerData: Record<string, unknown>;
  /** 冪等性キー（二重実行防止） */
  idempotencyKey: string;
  /** freee 事業所 ID */
  companyId: number;
  /** 開始日時 (ISO 8601) */
  startedAt: string;
  /** 完了日時 (ISO 8601) */
  completedAt?: string;
  /** 現在のステップインデックス */
  currentStepIndex: number;
  /** ステップ実行結果 */
  stepResults: StepExecutionResult[];
  /** Agent が作成した freee リソースの ID（ロールバック用） */
  createdResources: CreatedResource[];
  /** エラー情報 */
  error?: {
    message: string;
    stepIndex: number;
    toolName?: string;
    details?: string;
  };
}

/** ステップ実行結果 */
export interface StepExecutionResult {
  /** ステップインデックス */
  stepIndex: number;
  /** ステップ名 */
  stepName: string;
  /** ステータス */
  status: 'completed' | 'skipped' | 'failed' | 'awaiting_approval';
  /** Claude API に渡したツール呼び出し */
  toolCalls: ToolCallRecord[];
  /** ステップの出力データ */
  output?: Record<string, unknown>;
  /** 実行時間（ミリ秒） */
  durationMs: number;
  /** Claude API トークン使用量 */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/** ツール呼び出し記録 */
export interface ToolCallRecord {
  /** ツール名 */
  toolName: string;
  /** 入力パラメータ */
  input: Record<string, unknown>;
  /** 出力 */
  output: string;
  /** エラーか */
  isError: boolean;
  /** dry_run か */
  isDryRun: boolean;
  /** 実行時間（ミリ秒） */
  durationMs: number;
}

/** Agent が作成した freee リソース（ロールバック用） */
export interface CreatedResource {
  /** リソース種別 */
  type: 'deal' | 'partner' | 'invoice' | 'transfer' | 'item';
  /** freee 上の ID */
  freeeId: number;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** ロールバック済みか */
  rolledBack: boolean;
}

// =============================================================================
// ワークフロー定義
// =============================================================================

/** ワークフロー定義 */
export interface WorkflowDefinition {
  /** ワークフロー ID */
  id: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
  /** トリガー種別 */
  triggerType: WorkflowTriggerType;
  /** トリガー条件（Stripe イベントタイプ等） */
  triggerCondition?: string;
  /** cron 式（scheduled の場合） */
  cronExpression?: string;
  /** ワークフローステップ */
  steps: WorkflowStepDefinition[];
  /** ワークフロー全体のタイムアウト（ミリ秒） */
  timeoutMs: number;
  /** リトライポリシー */
  retryPolicy: RetryPolicy;
}

/** ワークフローステップ定義 */
export interface WorkflowStepDefinition {
  /** ステップ名 */
  name: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** このステップで使用可能なツール名 */
  allowedTools: string[];
  /** Claude への指示（日本語） */
  instructionJa: string;
  /** 承認ポリシー */
  approvalPolicy: ApprovalPolicy;
  /** 承認が必要になる金額閾値（円）— auto の場合のみ適用 */
  approvalThresholdJpy?: number;
  /** スキップ条件（前のステップの結果に基づく） */
  skipCondition?: string;
  /** タイムアウト（ミリ秒） */
  timeoutMs: number;
}

/** リトライポリシー */
export interface RetryPolicy {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** リトライ間隔の指数バックオフ基数（ミリ秒） */
  backoffBaseMs: number;
  /** リトライ対象のエラーパターン */
  retryableErrors: string[];
}

// =============================================================================
// Claude Tool Use 定義（Agent が使用するツール）
// =============================================================================

/** Agent ツール定義 */
export interface AgentToolDefinition {
  /** ツール名 */
  name: string;
  /** 説明（Claude に渡す） */
  description: string;
  /** 入力スキーマ（JSON Schema） */
  input_schema: Record<string, unknown>;
  /** 読み取り専用か（dry_run でも実行可能） */
  readOnly: boolean;
  /** 必要な API スコープ */
  requiredScope: 'freee' | 'stripe' | 'internal';
}

/**
 * Agent ツール一覧
 *
 * Claude API の tool_use で Agent に提供するツール群。
 * 読み取り専用ツール（readOnly: true）は dry_run モードでも実際に API を呼ぶ。
 * 書き込みツール（readOnly: false）は dry_run モードではシミュレート結果を返す。
 */
export const AGENT_TOOLS: AgentToolDefinition[] = [
  // ---------------------------------------------------------------------------
  // freee 会計 — 取引
  // ---------------------------------------------------------------------------
  {
    name: 'freee_create_deal',
    description: 'freee に取引（収入または支出）を作成します。売上計上・経費記録に使用。',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: '取引種別' },
        issue_date: { type: 'string', description: '発生日（YYYY-MM-DD）' },
        due_date: { type: 'string', description: '期日（YYYY-MM-DD）' },
        partner_id: { type: 'number', description: 'freee 取引先 ID' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              account_item_id: { type: 'number', description: '勘定科目 ID' },
              tax_code: { type: 'number', description: '税区分コード' },
              amount: { type: 'number', description: '金額（税込）' },
              item_id: { type: 'number', description: '品目 ID' },
              description: { type: 'string', description: '摘要' },
            },
            required: ['account_item_id', 'tax_code', 'amount'],
          },
          description: '取引明細行',
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', description: '支払日（YYYY-MM-DD）' },
              from_walletable_type: { type: 'string', enum: ['bank_account', 'credit_card', 'wallet'] },
              from_walletable_id: { type: 'number', description: '口座 ID' },
              amount: { type: 'number', description: '支払金額' },
            },
            required: ['date', 'from_walletable_type', 'from_walletable_id', 'amount'],
          },
          description: '支払情報（決済済みの場合）',
        },
        ref_number: { type: 'string', description: '管理番号（Stripe Session ID 等）' },
      },
      required: ['type', 'issue_date', 'details'],
    },
    readOnly: false,
    requiredScope: 'freee',
  },
  {
    name: 'freee_list_deals',
    description: 'freee の取引一覧を取得します。期間・取引先・種別で絞り込み可能。',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: '取引種別' },
        partner_id: { type: 'number', description: '取引先 ID' },
        start_issue_date: { type: 'string', description: '開始日（YYYY-MM-DD）' },
        end_issue_date: { type: 'string', description: '終了日（YYYY-MM-DD）' },
        status: { type: 'string', enum: ['settled', 'unsettled'], description: 'ステータス' },
        limit: { type: 'number', description: '取得件数（最大100）' },
        offset: { type: 'number', description: 'オフセット' },
      },
    },
    readOnly: true,
    requiredScope: 'freee',
  },
  {
    name: 'freee_update_deal',
    description: 'freee の取引を更新します。入金消込（payments 追加）に使用。',
    input_schema: {
      type: 'object',
      properties: {
        deal_id: { type: 'number', description: '取引 ID' },
        issue_date: { type: 'string', description: '発生日（YYYY-MM-DD）' },
        details: { type: 'array', description: '更新する明細行' },
        payments: { type: 'array', description: '追加する支払情報' },
        ref_number: { type: 'string', description: '管理番号' },
      },
      required: ['deal_id'],
    },
    readOnly: false,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // freee 会計 — 取引先
  // ---------------------------------------------------------------------------
  {
    name: 'freee_list_partners',
    description: 'freee の取引先一覧を取得します。名前やメールアドレスでの検索に使用。',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '検索キーワード（名前・略称に部分一致）' },
        limit: { type: 'number', description: '取得件数（最大100）' },
        offset: { type: 'number', description: 'オフセット' },
      },
    },
    readOnly: true,
    requiredScope: 'freee',
  },
  {
    name: 'freee_create_partner',
    description: 'freee に取引先を新規作成します。Stripe 顧客の初回取引時に使用。',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '取引先名' },
        shortcut1: { type: 'string', description: '略称1（メールアドレスを設定）' },
        long_name: { type: 'string', description: '正式名称' },
        name_kana: { type: 'string', description: 'フリガナ' },
        country_code: { type: 'string', description: '国コード（JP 等）' },
        invoice_registration_number: { type: 'string', description: 'インボイス登録番号（T + 13桁）' },
      },
      required: ['name'],
    },
    readOnly: false,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // freee 会計 — 請求書
  // ---------------------------------------------------------------------------
  {
    name: 'freee_create_invoice',
    description: 'freee で請求書を発行します。Stripe 決済に対応する請求書を作成。',
    input_schema: {
      type: 'object',
      properties: {
        partner_id: { type: 'number', description: '取引先 ID' },
        issue_date: { type: 'string', description: '発行日（YYYY-MM-DD）' },
        due_date: { type: 'string', description: '支払期日（YYYY-MM-DD）' },
        title: { type: 'string', description: '件名' },
        invoice_lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '品名' },
              quantity: { type: 'number', description: '数量' },
              unit_price: { type: 'number', description: '単価（税抜）' },
              tax_code: { type: 'number', description: '税区分コード' },
              description: { type: 'string', description: '備考' },
            },
            required: ['name', 'quantity', 'unit_price'],
          },
          description: '請求書明細行',
        },
        description: { type: 'string', description: '備考' },
        payment_bank_info: { type: 'string', description: '振込先情報' },
      },
      required: ['partner_id', 'issue_date', 'due_date', 'invoice_lines'],
    },
    readOnly: false,
    requiredScope: 'freee',
  },
  {
    name: 'freee_list_invoices',
    description: 'freee の請求書一覧を取得します。',
    input_schema: {
      type: 'object',
      properties: {
        partner_id: { type: 'number', description: '取引先 ID' },
        invoice_status: { type: 'string', enum: ['draft', 'applying', 'approved', 'issued'], description: 'ステータス' },
        payment_status: { type: 'string', enum: ['unsettled', 'settled'], description: '入金ステータス' },
        start_issue_date: { type: 'string', description: '開始日（YYYY-MM-DD）' },
        end_issue_date: { type: 'string', description: '終了日（YYYY-MM-DD）' },
      },
    },
    readOnly: true,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // freee 会計 — 勘定科目・品目
  // ---------------------------------------------------------------------------
  {
    name: 'freee_list_account_items',
    description: 'freee の勘定科目一覧を取得します。仕訳で使う科目 ID の特定に使用。',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '検索キーワード' },
      },
    },
    readOnly: true,
    requiredScope: 'freee',
  },
  {
    name: 'freee_list_items',
    description: 'freee の品目一覧を取得します。',
    input_schema: {
      type: 'object',
      properties: {},
    },
    readOnly: true,
    requiredScope: 'freee',
  },
  {
    name: 'freee_create_item',
    description: 'freee に品目を作成します。製品品目の初期セットアップに使用。',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '品目名' },
      },
      required: ['name'],
    },
    readOnly: false,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // freee 会計 — レポート
  // ---------------------------------------------------------------------------
  {
    name: 'freee_get_trial_balance',
    description: 'freee の試算表（BS/PL）を取得します。月次締め・整合性チェックに使用。',
    input_schema: {
      type: 'object',
      properties: {
        report_type: { type: 'string', enum: ['bs', 'pl'], description: '試算表種別（bs: 貸借対照表、pl: 損益計算書）' },
        fiscal_year: { type: 'number', description: '会計年度' },
        start_month: { type: 'number', description: '開始月（1-12）' },
        end_month: { type: 'number', description: '終了月（1-12）' },
        breakdown_display_type: { type: 'string', enum: ['partner', 'item', 'section'], description: '内訳表示' },
      },
      required: ['report_type', 'fiscal_year', 'start_month', 'end_month'],
    },
    readOnly: true,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // freee 会計 — 口座
  // ---------------------------------------------------------------------------
  {
    name: 'freee_list_walletables',
    description: 'freee の口座一覧を取得します。入金先口座の特定に使用。',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['bank_account', 'credit_card', 'wallet'], description: '口座種別' },
      },
    },
    readOnly: true,
    requiredScope: 'freee',
  },

  // ---------------------------------------------------------------------------
  // Stripe（読み取り専用）
  // ---------------------------------------------------------------------------
  {
    name: 'stripe_get_session',
    description: 'Stripe Checkout Session の詳細を取得します。決済情報・顧客情報の取得に使用。',
    input_schema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Stripe Checkout Session ID' },
      },
      required: ['session_id'],
    },
    readOnly: true,
    requiredScope: 'stripe',
  },
  {
    name: 'stripe_list_charges',
    description: 'Stripe の決済一覧を取得します。月次突合に使用。',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '開始日（YYYY-MM-DD）' },
        end_date: { type: 'string', description: '終了日（YYYY-MM-DD）' },
        limit: { type: 'number', description: '取得件数（最大100）' },
      },
      required: ['start_date', 'end_date'],
    },
    readOnly: true,
    requiredScope: 'stripe',
  },
  {
    name: 'stripe_get_balance_transactions',
    description: 'Stripe の残高トランザクション（手数料込み）を取得します。Stripe 手数料の計上に使用。',
    input_schema: {
      type: 'object',
      properties: {
        payout_id: { type: 'string', description: 'Payout ID（入金ごとの明細取得）' },
        start_date: { type: 'string', description: '開始日（YYYY-MM-DD）' },
        end_date: { type: 'string', description: '終了日（YYYY-MM-DD）' },
      },
    },
    readOnly: true,
    requiredScope: 'stripe',
  },

  // ---------------------------------------------------------------------------
  // 内部ヘルパー
  // ---------------------------------------------------------------------------
  {
    name: 'lookup_product_mapping',
    description: 'HARMONIC insight 製品コードに対応する freee 品目マッピングを取得します。',
    input_schema: {
      type: 'object',
      properties: {
        product_code: { type: 'string', description: '製品コード（INSS, IOSH 等）' },
      },
      required: ['product_code'],
    },
    readOnly: true,
    requiredScope: 'internal',
  },
  {
    name: 'calculate_tax',
    description: '金額から消費税を計算します。税込金額 → 税抜金額・消費税額を算出。',
    input_schema: {
      type: 'object',
      properties: {
        amount_with_tax: { type: 'number', description: '税込金額' },
        tax_rate: { type: 'number', description: '税率（デフォルト: 0.10）' },
      },
      required: ['amount_with_tax'],
    },
    readOnly: true,
    requiredScope: 'internal',
  },
  {
    name: 'check_sync_status',
    description: 'Stripe イベントの freee 同期状況を確認します。二重登録の防止に使用。',
    input_schema: {
      type: 'object',
      properties: {
        stripe_event_id: { type: 'string', description: 'Stripe イベント ID' },
      },
      required: ['stripe_event_id'],
    },
    readOnly: true,
    requiredScope: 'internal',
  },
  {
    name: 'save_sync_record',
    description: 'Stripe ↔ freee の同期記録を保存します。',
    input_schema: {
      type: 'object',
      properties: {
        stripe_event_id: { type: 'string', description: 'Stripe イベント ID' },
        stripe_event_type: { type: 'string', description: 'Stripe イベント種別' },
        freee_deal_id: { type: 'number', description: 'freee 取引 ID' },
        freee_invoice_id: { type: 'number', description: 'freee 請求書 ID' },
        freee_partner_id: { type: 'number', description: 'freee 取引先 ID' },
        sync_status: { type: 'string', enum: ['completed', 'failed', 'partial'] },
      },
      required: ['stripe_event_id', 'stripe_event_type', 'sync_status'],
    },
    readOnly: false,
    requiredScope: 'internal',
  },
];

// =============================================================================
// ワークフロー定義（プリセット）
// =============================================================================

/**
 * プリセットワークフロー
 *
 * Agent が自律的に実行するワークフローの定義。
 * 各ステップで Claude API を呼び出し、Tool Use で freee/Stripe API を操作する。
 */
export const PRESET_WORKFLOWS: WorkflowDefinition[] = [
  // ---------------------------------------------------------------------------
  // Stripe 新規決済 → freee 売上計上
  // ---------------------------------------------------------------------------
  {
    id: 'stripe_checkout_to_freee',
    nameJa: 'Stripe 決済 → freee 売上計上',
    nameEn: 'Stripe Checkout → freee Revenue Recording',
    descriptionJa: 'Stripe の新規決済完了を検知し、freee に取引先登録・請求書発行・入金取引の記録を自動で行います。',
    descriptionEn: 'Automatically records revenue in freee when a Stripe checkout completes.',
    triggerType: 'stripe_webhook',
    triggerCondition: 'checkout.session.completed',
    steps: [
      {
        name: 'check_idempotency',
        descriptionJa: '二重登録チェック',
        allowedTools: ['check_sync_status'],
        instructionJa: 'このStripeイベントが既に処理済みでないか確認してください。処理済みの場合はワークフローをスキップしてください。',
        approvalPolicy: 'auto',
        timeoutMs: 10_000,
      },
      {
        name: 'get_stripe_session',
        descriptionJa: 'Stripe 決済情報の取得',
        allowedTools: ['stripe_get_session', 'lookup_product_mapping', 'calculate_tax'],
        instructionJa: 'Stripe Checkout Session から顧客情報・製品情報・金額を取得し、対応する freee 品目マッピングを確認してください。消費税の内訳も計算してください。',
        approvalPolicy: 'auto',
        timeoutMs: 30_000,
      },
      {
        name: 'resolve_partner',
        descriptionJa: '取引先の検索/作成',
        allowedTools: ['freee_list_partners', 'freee_create_partner'],
        instructionJa: '顧客のメールアドレスで freee の取引先を検索してください。既存の取引先が見つからない場合は、Stripe の顧客情報を元に新規作成してください。略称1にメールアドレスを設定してください。',
        approvalPolicy: 'auto',
        approvalThresholdJpy: 0,
        timeoutMs: 30_000,
      },
      {
        name: 'create_invoice',
        descriptionJa: '請求書の発行',
        allowedTools: ['freee_create_invoice', 'freee_list_account_items'],
        instructionJa: '決済情報を元に freee で請求書を発行してください。品名には製品名とプラン名を含めてください。インボイス制度対応の適格請求書として発行してください。',
        approvalPolicy: 'auto',
        approvalThresholdJpy: 500_000,
        timeoutMs: 30_000,
      },
      {
        name: 'record_income_deal',
        descriptionJa: '入金取引の記録',
        allowedTools: ['freee_create_deal', 'freee_list_walletables', 'freee_list_account_items'],
        instructionJa: '売上高（売掛金）の取引を freee に記録してください。Stripe からの入金は Stripe 用口座を使用してください。管理番号に Stripe Session ID を設定してください。',
        approvalPolicy: 'auto',
        approvalThresholdJpy: 500_000,
        timeoutMs: 30_000,
      },
      {
        name: 'save_sync',
        descriptionJa: '同期記録の保存',
        allowedTools: ['save_sync_record'],
        instructionJa: 'Stripe イベントと freee の取引・請求書・取引先の対応関係を同期記録として保存してください。',
        approvalPolicy: 'auto',
        timeoutMs: 10_000,
      },
    ],
    timeoutMs: 180_000,
    retryPolicy: {
      maxRetries: 2,
      backoffBaseMs: 5_000,
      retryableErrors: ['freee_rate_limit', 'freee_server_error', 'network_error'],
    },
  },

  // ---------------------------------------------------------------------------
  // Stripe サブスク更新 → freee 入金消込
  // ---------------------------------------------------------------------------
  {
    id: 'stripe_invoice_paid_to_freee',
    nameJa: 'Stripe サブスク更新 → freee 入金消込',
    nameEn: 'Stripe Subscription Renewal → freee Payment Reconciliation',
    descriptionJa: 'Stripe のサブスクリプション更新決済を検知し、freee の未消込売掛金に入金を記録します。',
    descriptionEn: 'Records payment in freee when a Stripe subscription renewal succeeds.',
    triggerType: 'stripe_webhook',
    triggerCondition: 'invoice.paid',
    steps: [
      {
        name: 'check_idempotency',
        descriptionJa: '二重登録チェック',
        allowedTools: ['check_sync_status'],
        instructionJa: 'このStripeイベントが既に処理済みでないか確認してください。',
        approvalPolicy: 'auto',
        timeoutMs: 10_000,
      },
      {
        name: 'find_unsettled_deal',
        descriptionJa: '未消込取引の検索',
        allowedTools: ['freee_list_deals', 'stripe_get_session'],
        instructionJa: 'Stripe の決済情報から対応する freee の未消込取引（売掛金）を検索してください。管理番号（ref_number）で照合してください。',
        approvalPolicy: 'auto',
        timeoutMs: 30_000,
      },
      {
        name: 'record_payment',
        descriptionJa: '入金消込',
        allowedTools: ['freee_update_deal', 'freee_list_walletables'],
        instructionJa: '見つかった売掛金取引に支払い情報を追加して入金消込を行ってください。Stripe の入金日を支払日として設定してください。',
        approvalPolicy: 'auto',
        approvalThresholdJpy: 500_000,
        timeoutMs: 30_000,
      },
      {
        name: 'save_sync',
        descriptionJa: '同期記録の保存',
        allowedTools: ['save_sync_record'],
        instructionJa: '同期記録を保存してください。',
        approvalPolicy: 'auto',
        timeoutMs: 10_000,
      },
    ],
    timeoutMs: 120_000,
    retryPolicy: {
      maxRetries: 2,
      backoffBaseMs: 5_000,
      retryableErrors: ['freee_rate_limit', 'freee_server_error', 'network_error'],
    },
  },

  // ---------------------------------------------------------------------------
  // 月次締め（突合・整合性チェック）
  // ---------------------------------------------------------------------------
  {
    id: 'monthly_closing',
    nameJa: '月次締め — Stripe ↔ freee 突合',
    nameEn: 'Monthly Closing — Stripe ↔ freee Reconciliation',
    descriptionJa: '前月の Stripe 決済と freee 取引を突合し、未同期の取引を検出・補完します。試算表で整合性を確認します。',
    descriptionEn: 'Reconciles previous month Stripe charges with freee deals and validates trial balance.',
    triggerType: 'scheduled',
    cronExpression: '0 0 3 * *',  // 毎月3日 AM 0:00 UTC (= AM 9:00 JST)
    steps: [
      {
        name: 'fetch_stripe_charges',
        descriptionJa: '前月の Stripe 決済一覧を取得',
        allowedTools: ['stripe_list_charges', 'stripe_get_balance_transactions'],
        instructionJa: '前月1日〜末日の全 Stripe 決済を取得してください。手数料情報も取得してください。',
        approvalPolicy: 'auto',
        timeoutMs: 60_000,
      },
      {
        name: 'fetch_freee_deals',
        descriptionJa: '前月の freee 取引一覧を取得',
        allowedTools: ['freee_list_deals', 'check_sync_status'],
        instructionJa: '前月の freee 売上取引を取得し、Stripe との同期状態を確認してください。未同期の Stripe 決済があれば一覧化してください。',
        approvalPolicy: 'auto',
        timeoutMs: 60_000,
      },
      {
        name: 'reconcile_unsynced',
        descriptionJa: '未同期取引の補完',
        allowedTools: [
          'freee_create_deal', 'freee_create_partner', 'freee_create_invoice',
          'freee_list_partners', 'freee_list_account_items', 'freee_list_walletables',
          'lookup_product_mapping', 'calculate_tax', 'save_sync_record',
        ],
        instructionJa: '未同期の Stripe 決済があれば、stripe_checkout_to_freee ワークフローと同様の手順で freee に売上計上してください。件数が多い場合は3件ずつ処理し、都度エラーがないか確認してください。',
        approvalPolicy: 'require_approval',
        skipCondition: 'no_unsynced_charges',
        timeoutMs: 300_000,
      },
      {
        name: 'record_stripe_fees',
        descriptionJa: 'Stripe 手数料の計上',
        allowedTools: ['freee_create_deal', 'freee_list_account_items', 'freee_list_walletables', 'calculate_tax'],
        instructionJa: '前月の Stripe 手数料合計を「支払手数料」として freee に経費計上してください。月次一括で1件の取引として記録してください。',
        approvalPolicy: 'notify',
        timeoutMs: 30_000,
      },
      {
        name: 'validate_trial_balance',
        descriptionJa: '試算表による整合性チェック',
        allowedTools: ['freee_get_trial_balance'],
        instructionJa: '前月の損益計算書（PL）と貸借対照表（BS）を取得し、売上高・売掛金・普通預金の整合性を確認してください。異常があれば具体的に報告してください。',
        approvalPolicy: 'auto',
        timeoutMs: 60_000,
      },
    ],
    timeoutMs: 600_000,
    retryPolicy: {
      maxRetries: 1,
      backoffBaseMs: 10_000,
      retryableErrors: ['freee_rate_limit', 'network_error'],
    },
  },

  // ---------------------------------------------------------------------------
  // 経費精算承認 → freee 記帳
  // ---------------------------------------------------------------------------
  {
    id: 'expense_approval_to_freee',
    nameJa: '経費精算承認 → freee 経費記帳',
    nameEn: 'Expense Approval → freee Expense Recording',
    descriptionJa: 'freee で経費精算が承認されたときに、対応する支出取引を自動記帳します。',
    descriptionEn: 'Records expense in freee when an expense application is approved.',
    triggerType: 'freee_webhook',
    triggerCondition: 'accounting:expense_application:updated',
    steps: [
      {
        name: 'verify_approval',
        descriptionJa: '承認状態の確認',
        allowedTools: ['check_sync_status'],
        instructionJa: '経費精算が「承認済み」ステータスであることを確認してください。未承認の場合はスキップしてください。',
        approvalPolicy: 'auto',
        timeoutMs: 10_000,
      },
      {
        name: 'record_expense',
        descriptionJa: '経費取引の記帳',
        allowedTools: ['freee_create_deal', 'freee_list_account_items', 'freee_list_walletables'],
        instructionJa: '承認された経費精算の内容を元に、freee に支出取引を記帳してください。勘定科目は経費精算の内容に応じて適切に選択してください。',
        approvalPolicy: 'auto',
        approvalThresholdJpy: 100_000,
        timeoutMs: 30_000,
      },
    ],
    timeoutMs: 60_000,
    retryPolicy: {
      maxRetries: 2,
      backoffBaseMs: 5_000,
      retryableErrors: ['freee_rate_limit', 'freee_server_error'],
    },
  },
];

// =============================================================================
// Agent Claude API 設定
// =============================================================================

/** Agent が使用する Claude API モデル */
export const AGENT_MODEL_CONFIG = {
  /** メインモデル（ワークフロー実行） */
  primary: 'claude-sonnet-4-6-20260210',
  /** フォールバックモデル */
  fallback: 'claude-sonnet-4-20250514',
  /** 最大トークン数 */
  maxTokens: 4096,
  /** Temperature（確定的な業務処理のため低く設定） */
  temperature: 0.1,
} as const;

/** Agent のシステムプロンプト */
export const AGENT_SYSTEM_PROMPT = `あなたは HARMONIC insight の AI 経理エージェントです。
Stripe 決済と freee 会計の連携を自動化する専門家として行動してください。

## 行動原則

1. **正確性**: 金額・日付・勘定科目の誤りは許されません。必ず確認してから記帳してください。
2. **冪等性**: 同じ Stripe イベントを二度処理しないでください。必ず check_sync_status で確認してください。
3. **追跡可能性**: すべての取引に管理番号（ref_number）として Stripe Session ID を設定してください。
4. **安全性**: 不明な点がある場合は処理を中断し、エラーを報告してください。推測で記帳してはいけません。

## freee の基本ルール

- 事業所 ID（company_id）は環境変数から取得します。ツール呼び出し時に自動設定されます。
- 消費税は税込金額から計算してください（税率10%: 税抜 = 税込 ÷ 1.1）。
- 売上の勘定科目は「売上高」、Stripe 手数料は「支払手数料」を使用してください。
- 入金は Stripe 用の口座（bank_account）に記録してください。
- 取引先の略称1（shortcut1）に顧客のメールアドレスを設定してください。

## インボイス制度対応

- 請求書は適格請求書（qualified_invoice）として発行してください。
- HARMONIC insight のインボイス登録番号は環境変数 INVOICE_REGISTRATION_NUMBER から取得します。
`;

// =============================================================================
// 安全制御設定
// =============================================================================

/** 金額閾値設定（承認ポリシーに使用） */
export const APPROVAL_THRESHOLDS = {
  /** この金額以下は自動処理 */
  autoApproveMaxJpy: 500_000,
  /** この金額以上は必ず人間の承認が必要 */
  requireApprovalMinJpy: 1_000_000,
  /** 月次の自動処理累計上限 */
  monthlyAutoLimitJpy: 10_000_000,
} as const;

/** dry-run モード設定 */
export const DRY_RUN_CONFIG = {
  /** 初回セットアップ時は dry-run を強制する */
  forceOnFirstRun: true,
  /** dry-run 結果のログ保持期間（日） */
  logRetentionDays: 30,
} as const;

// =============================================================================
// 通知設定
// =============================================================================

/** Agent 通知チャネル */
export type NotificationChannel = 'slack' | 'email';

/** 通知設定 */
export interface NotificationConfig {
  /** 通知チャネル */
  channel: NotificationChannel;
  /** 通知先（Slack チャンネル名 or メールアドレス） */
  destination: string;
}

/** 通知イベント種別 */
export type NotificationEvent =
  | 'workflow_completed'       // ワークフロー正常完了
  | 'workflow_failed'          // ワークフローエラー
  | 'approval_required'        // 承認待ち
  | 'monthly_report'           // 月次レポート
  | 'anomaly_detected';        // 異常検出

/** デフォルト通知設定 */
export const DEFAULT_NOTIFICATION_CONFIG = {
  /** 環境変数: Slack Webhook URL */
  slackWebhookEnvVar: 'ACCOUNTING_AGENT_SLACK_WEBHOOK_URL',
  /** 環境変数: 通知先メールアドレス */
  notificationEmailEnvVar: 'ACCOUNTING_AGENT_NOTIFICATION_EMAIL',
  /** 通知イベントごとのデフォルト設定 */
  eventDefaults: {
    workflow_completed: { enabled: false },
    workflow_failed: { enabled: true },
    approval_required: { enabled: true },
    monthly_report: { enabled: true },
    anomaly_detected: { enabled: true },
  },
} as const;

// =============================================================================
// DB スキーマ参照
// =============================================================================

/** AI Accounting Agent 用 DB テーブル */
export const AGENT_DB_SCHEMA_REFERENCE = {
  /** Agent 実行ログ */
  agent_executions: `
    CREATE TABLE IF NOT EXISTS agent_executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      execution_mode TEXT NOT NULL DEFAULT 'dry_run',
      status TEXT NOT NULL DEFAULT 'pending',
      trigger_type TEXT NOT NULL,
      trigger_data JSONB,
      idempotency_key TEXT NOT NULL UNIQUE,
      company_id INTEGER NOT NULL,
      current_step_index INTEGER DEFAULT 0,
      step_results JSONB DEFAULT '[]'::jsonb,
      created_resources JSONB DEFAULT '[]'::jsonb,
      error JSONB,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_agent_executions_workflow ON agent_executions(workflow_id);
    CREATE INDEX idx_agent_executions_status ON agent_executions(status);
    CREATE INDEX idx_agent_executions_idempotency ON agent_executions(idempotency_key);
  `,

  /** Agent 承認リクエスト */
  agent_approval_requests: `
    CREATE TABLE IF NOT EXISTS agent_approval_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      execution_id UUID NOT NULL REFERENCES agent_executions(id),
      step_index INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_jpy INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      approved_by TEXT,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_agent_approvals_status ON agent_approval_requests(status);
    CREATE INDEX idx_agent_approvals_execution ON agent_approval_requests(execution_id);
  `,

  /** Agent 通知ログ */
  agent_notifications: `
    CREATE TABLE IF NOT EXISTS agent_notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      execution_id UUID REFERENCES agent_executions(id),
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      destination TEXT NOT NULL,
      payload JSONB NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * ワークフローを ID で取得
 */
export function getWorkflow(workflowId: string): WorkflowDefinition | null {
  return PRESET_WORKFLOWS.find(w => w.id === workflowId) ?? null;
}

/**
 * Stripe イベント種別に対応するワークフローを取得
 */
export function getWorkflowForStripeEvent(eventType: StripeWebhookEvent): WorkflowDefinition | null {
  return PRESET_WORKFLOWS.find(
    w => w.triggerType === 'stripe_webhook' && w.triggerCondition === eventType
  ) ?? null;
}

/**
 * freee Webhook イベント種別に対応するワークフローを取得
 */
export function getWorkflowForFreeeEvent(eventType: FreeeWebhookEvent): WorkflowDefinition | null {
  return PRESET_WORKFLOWS.find(
    w => w.triggerType === 'freee_webhook' && w.triggerCondition === eventType
  ) ?? null;
}

/**
 * スケジュール実行のワークフロー一覧を取得
 */
export function getScheduledWorkflows(): WorkflowDefinition[] {
  return PRESET_WORKFLOWS.filter(w => w.triggerType === 'scheduled');
}

/**
 * ツール名から定義を取得
 */
export function getToolDefinition(toolName: string): AgentToolDefinition | null {
  return AGENT_TOOLS.find(t => t.name === toolName) ?? null;
}

/**
 * 読み取り専用ツールのみ取得（dry_run モードで使用可能なツール）
 */
export function getReadOnlyTools(): AgentToolDefinition[] {
  return AGENT_TOOLS.filter(t => t.readOnly);
}

/**
 * 指定モードで使用可能なツール一覧を取得
 */
export function getToolsForMode(mode: AgentExecutionMode): AgentToolDefinition[] {
  if (mode === 'live' || mode === 'sandbox') {
    return AGENT_TOOLS;
  }
  // dry_run: 読み取り専用ツール + internal スコープのツール
  return AGENT_TOOLS.filter(t => t.readOnly || t.requiredScope === 'internal');
}

/**
 * 金額に基づく承認ポリシーを判定
 */
export function resolveApprovalPolicy(
  stepPolicy: ApprovalPolicy,
  amountJpy: number,
  thresholdJpy?: number,
): ApprovalPolicy {
  if (stepPolicy === 'require_approval') {
    return 'require_approval';
  }

  // 高額取引は必ず承認必須
  if (amountJpy >= APPROVAL_THRESHOLDS.requireApprovalMinJpy) {
    return 'require_approval';
  }

  // ステップの閾値を超えた場合は承認必須
  if (thresholdJpy !== undefined && amountJpy > thresholdJpy) {
    return 'require_approval';
  }

  return stepPolicy;
}

/**
 * 冪等性キーを生成（Stripe イベント ID ベース）
 */
export function generateIdempotencyKey(
  workflowId: string,
  triggerType: WorkflowTriggerType,
  triggerIdentifier: string,
): string {
  return `${workflowId}:${triggerType}:${triggerIdentifier}`;
}

/**
 * Claude API の Tool Use 形式に変換
 */
export function toClaudeToolDefinitions(tools: AgentToolDefinition[]): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

/**
 * Agent 環境設定が完了しているかチェック
 */
export function isAgentConfigured(): boolean {
  const requiredEnvVars = [
    'FREEE_CLIENT_ID',
    'FREEE_CLIENT_SECRET',
    'FREEE_COMPANY_ID',
    'STRIPE_SECRET_KEY',
    'ANTHROPIC_API_KEY',
  ];
  return requiredEnvVars.every(key => !!process.env[key]);
}

/**
 * Agent 設定のバリデーション結果
 */
export interface AgentConfigValidation {
  valid: boolean;
  missingEnvVars: string[];
  warnings: string[];
}

/**
 * Agent 環境設定をバリデーション
 */
export function validateAgentConfig(): AgentConfigValidation {
  const requiredEnvVars = [
    'FREEE_CLIENT_ID',
    'FREEE_CLIENT_SECRET',
    'FREEE_COMPANY_ID',
    'STRIPE_SECRET_KEY',
    'ANTHROPIC_API_KEY',
  ];

  const optionalEnvVars = [
    { key: 'INVOICE_REGISTRATION_NUMBER', warning: 'インボイス登録番号が未設定です。適格請求書を発行できません。' },
    { key: 'ACCOUNTING_AGENT_SLACK_WEBHOOK_URL', warning: 'Slack 通知が設定されていません。エラー通知がメールのみになります。' },
    { key: 'ACCOUNTING_AGENT_NOTIFICATION_EMAIL', warning: '通知メールアドレスが未設定です。' },
  ];

  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
  const warnings = optionalEnvVars
    .filter(({ key }) => !process.env[key])
    .map(({ warning }) => warning);

  return {
    valid: missingEnvVars.length === 0,
    missingEnvVars,
    warnings,
  };
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // ツール
  AGENT_TOOLS,

  // ワークフロー
  PRESET_WORKFLOWS,

  // Claude API 設定
  AGENT_MODEL_CONFIG,
  AGENT_SYSTEM_PROMPT,

  // 安全制御
  APPROVAL_THRESHOLDS,
  DRY_RUN_CONFIG,

  // 通知
  DEFAULT_NOTIFICATION_CONFIG,

  // DB
  AGENT_DB_SCHEMA_REFERENCE,

  // ヘルパー
  getWorkflow,
  getWorkflowForStripeEvent,
  getWorkflowForFreeeEvent,
  getScheduledWorkflows,
  getToolDefinition,
  getReadOnlyTools,
  getToolsForMode,
  resolveApprovalPolicy,
  generateIdempotencyKey,
  toClaudeToolDefinitions,
  isAgentConfigured,
  validateAgentConfig,
};
