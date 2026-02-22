/**
 * データ収集プラットフォーム — 型定義・API・テンプレート・マッピング
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * IOSH（InsightOfficeSheet）一体型のエンタープライズデータ収集プラットフォーム。
 * サーバー管理の Excel テンプレートを Named Ranges で DB マッピングし、
 * データ入力・AI 自動転記・AI 検証・送信を IOSH 内で完結させる。
 *
 * ## ポジショニング
 *
 * | 比較軸 | Stravis/Oracle/Tagetik | IOSH データ収集 |
 * |--------|------------------------|-----------------|
 * | クライアント | Excel Add-in / Web | **IOSH ネイティブ（Syncfusion）** |
 * | MS Office | 必要 | **不要** |
 * | データ転記 | 手動コピペ | **AI が既存 Excel から自動転記** |
 * | データ検証 | ルールベースのみ | **AI 文脈検証 + ルールベース** |
 * | オフライン | 不可 | **下書き → 接続回復時に送信** |
 * | 導入コスト | 数千万円〜 | **コンサル案件に組み込み** |
 *
 * ## 技術基盤
 *
 * - **Syncfusion XlsIO**: セル読み書き・Named Ranges・Data Validation・Sheet Protection
 * - **Syncfusion SfSpreadsheet**: WPF 上の Excel 互換 UI コントロール
 * - **Claude API**: AI 自動転記（セマンティックマッチング）・AI 検証（異常値検出）
 * - **Hono + Supabase**: サーバー側のテンプレート管理・データ格納・回収管理
 * - **顧客別 Supabase プロジェクト**: 顧客ごとにDB環境を物理分離（StravisLINK と同方式）
 * - **DC Admin Console (Next.js)**: 全テナントの一括管理・プロビジョニング・監視
 *
 * ## 認証設計（ライトウェイト）
 *
 * ```
 * Level 0: 認証なし      → ローカルテンプレートのみ（テスト・小規模利用）
 * Level 1: ライセンスキー → 既存のライセンス基盤を流用（推奨デフォルト）
 * Level 2: ユーザー識別   → メールアドレスで提出者を記録（中堅企業向け）
 * Level 3: SSO           → ENT のみ、企業の認証基盤と連携
 * ```
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 認証レベル
// =============================================================================

/** データ収集の認証レベル */
export type DataCollectionAuthLevel = 0 | 1 | 2 | 3;

/** 認証レベル定義 */
export const AUTH_LEVELS: Record<DataCollectionAuthLevel, {
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  recommendedFor: string;
}> = {
  0: {
    name: 'None',
    nameJa: '認証なし',
    description: 'Local templates only, no server connection',
    descriptionJa: 'ローカルテンプレートのみ、サーバー接続なし',
    recommendedFor: 'テスト・PoC・小規模利用',
  },
  1: {
    name: 'License Key',
    nameJa: 'ライセンスキー認証',
    description: 'Reuse existing IOSH license key for server authentication',
    descriptionJa: '既存の IOSH ライセンスキーでサーバー認証（追加の ID/PW 不要）',
    recommendedFor: '中小企業（推奨デフォルト）',
  },
  2: {
    name: 'User Identification',
    nameJa: 'ユーザー識別',
    description: 'License key + email for tracking who submitted what',
    descriptionJa: 'ライセンスキー + メールアドレスで提出者を識別（パスワード不要）',
    recommendedFor: '中堅企業（部門別の回収管理が必要な場合）',
  },
  3: {
    name: 'SSO',
    nameJa: 'SSO 連携',
    description: 'Enterprise SSO (SAML/OIDC) integration',
    descriptionJa: '企業の認証基盤と連携（SAML / OpenID Connect）',
    recommendedFor: '大企業（ENT プランのみ）',
  },
};

// =============================================================================
// テンプレート定義
// =============================================================================

/** テンプレートのステータス */
export type TemplateStatus = 'draft' | 'published' | 'archived';

/** テンプレートの配信スケジュール */
export type TemplateSchedule = 'once' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * データ収集テンプレート
 *
 * 管理者が Excel で設計した雛形をサーバーに登録する。
 * Named Ranges で入力セルを定義し、DB カラムとマッピングする。
 */
export interface DataCollectionTemplate {
  /** テンプレート ID（UUID） */
  id: string;
  /** テンプレート名 */
  name: string;
  /** テンプレート名（日本語） */
  nameJa: string;
  /** カテゴリ */
  category: string;
  /** 説明 */
  description?: string;
  /** 説明（日本語） */
  descriptionJa?: string;
  /** バージョン（テンプレート更新時にインクリメント） */
  version: number;
  /** ステータス */
  status: TemplateStatus;
  /** 配信スケジュール */
  schedule: TemplateSchedule;
  /** 締切日（ISO 8601、null = 締切なし） */
  deadline: string | null;
  /** テンプレート Excel のサーバー上のパス / URL */
  templateFileUrl: string;
  /** マッピング定義 */
  mapping: TemplateMappingDefinition;
  /** バリデーションルール */
  validationRules: ValidationRule[];
  /** シートタブの色（Hex） */
  tabColor: string;
  /** 作成者 */
  createdBy: string;
  /** 作成日時 */
  createdAt: string;
  /** 最終更新日時 */
  updatedAt: string;
  /** テナント ID（マルチテナント用） */
  tenantId: string;
}

// =============================================================================
// セル ↔ DB マッピング
// =============================================================================

/** マッピングフィールドの型 */
export type MappingFieldType = 'string' | 'number' | 'integer' | 'date' | 'boolean' | 'currency' | 'percentage';

/**
 * マッピング定義全体
 *
 * テンプレートの Named Ranges が DB のどのテーブル・カラムに対応するかを定義。
 * Syncfusion XlsIO の IWorkbook.Names でアクセスする。
 */
export interface TemplateMappingDefinition {
  /** マッピング定義のバージョン */
  version: number;
  /** 格納先テーブル名 */
  targetTable: string;
  /** フィールドマッピング一覧 */
  fields: MappingField[];
  /** メタデータフィールド（自動付与: 送信者、送信日時等） */
  autoFields: AutoField[];
}

/**
 * 個別フィールドのマッピング
 *
 * Excel の Named Range ← → DB カラムの 1:1 対応。
 */
export interface MappingField {
  /** Named Range 名（Excel 側の定義名） */
  namedRange: string;
  /** DB カラム名 */
  dbColumn: string;
  /** 表示名（日本語 — UI 表示用） */
  labelJa: string;
  /** 表示名（英語） */
  label: string;
  /** データ型 */
  type: MappingFieldType;
  /** 必須項目か */
  required: boolean;
  /** デフォルト値 */
  defaultValue?: string | number | boolean;
  /** 説明（ツールチップ表示） */
  descriptionJa?: string;
  /** 小数点以下桁数（number/currency の場合） */
  decimalPlaces?: number;
  /** 通貨コード（currency の場合） */
  currencyCode?: string;
  /** 日付フォーマット（date の場合） */
  dateFormat?: string;
  /**
   * AI 転記ヒント
   *
   * AI が転記元 Excel のどの列/セルからデータを探すべきかのヒント。
   * 例: "売上", "sales", "revenue" → これらのキーワードを含む列を優先的にマッチング。
   */
  aiTransferHints?: string[];
}

/**
 * 自動付与フィールド（ユーザー入力不要、システムが自動設定）
 */
export interface AutoField {
  /** DB カラム名 */
  dbColumn: string;
  /** 自動付与する値のソース */
  source: 'submitter_email' | 'submitted_at' | 'template_id' | 'template_version' | 'license_key' | 'tenant_id';
}

// =============================================================================
// バリデーションルール
// =============================================================================

/** ルールベースバリデーションの種別 */
export type ValidationRuleType =
  | 'required'       // 必須チェック
  | 'min'            // 最小値
  | 'max'            // 最大値
  | 'range'          // 範囲（min〜max）
  | 'regex'          // 正規表現
  | 'enum'           // 列挙値
  | 'cross_field'    // フィールド間整合性（例: 合計 = 内訳の合計）
  | 'date_range';    // 日付範囲

/**
 * バリデーションルール
 *
 * テンプレートに付属するルールベースの検証。
 * AI 検証はこれに加えて文脈・過去データを考慮した検証を行う。
 */
export interface ValidationRule {
  /** ルール ID */
  id: string;
  /** 対象の Named Range（cross_field の場合は最初のフィールド） */
  targetField: string;
  /** ルール種別 */
  type: ValidationRuleType;
  /** ルールパラメータ（種別により異なる） */
  params: Record<string, unknown>;
  /** エラーメッセージ（日本語） */
  messageJa: string;
  /** エラーメッセージ（英語） */
  message: string;
  /** 重要度（error = 送信ブロック、warning = 警告のみ） */
  severity: 'error' | 'warning';
}

// =============================================================================
// 送信（Submission）
// =============================================================================

/** 送信ステータス */
export type SubmissionStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'pending_review';

/**
 * 送信データ
 */
export interface DataCollectionSubmission {
  /** 送信 ID（UUID） */
  id: string;
  /** テンプレート ID */
  templateId: string;
  /** テンプレートバージョン（送信時点） */
  templateVersion: number;
  /** テナント ID */
  tenantId: string;
  /** 送信者メールアドレス */
  submitterEmail: string;
  /** 送信者名（Level 2+ の場合） */
  submitterName?: string;
  /** ステータス */
  status: SubmissionStatus;
  /** 送信データ（フィールド名: 値） */
  data: Record<string, unknown>;
  /** 送信日時 */
  submittedAt: string;
  /** レビュー日時（accepted/rejected の場合） */
  reviewedAt?: string;
  /** レビュアー */
  reviewedBy?: string;
  /** 差し戻し理由（rejected の場合） */
  rejectionReason?: string;
  /** 送信時コメント */
  comment?: string;
  /** AI 検証結果（送信時のスナップショット） */
  aiValidationSnapshot?: AiValidationResult;
}

/**
 * AI 検証結果
 */
export interface AiValidationResult {
  /** 全項目パスしたか */
  valid: boolean;
  /** フィールド別検証結果 */
  results: AiValidationFieldResult[];
  /** AI による全体所見 */
  summary: string;
  /** エラー数 */
  errorCount: number;
  /** 警告数 */
  warningCount: number;
  /** 検証実行日時 */
  validatedAt: string;
}

/** フィールド別の AI 検証結果 */
export interface AiValidationFieldResult {
  /** Named Range 名 */
  namedRange: string;
  /** ステータス: pass（緑）/ warning（黄）/ error（赤） */
  status: 'pass' | 'warning' | 'error';
  /** 検証メッセージ（日本語） */
  messageJa: string;
  /** 検証メッセージ（英語） */
  message: string;
  /** 重要度 */
  severity: 'error' | 'warning' | 'info';
  /** AI による修正提案値 */
  suggestedValue?: unknown;
  /** 比較情報（前月比、前年比等） */
  comparison?: {
    label: string;
    previousValue: unknown;
    change: string;
  };
}

// =============================================================================
// AI 自動転記
// =============================================================================

/**
 * AI 転記結果
 *
 * AI が既存 Excel データを分析し、テンプレートの Named Ranges に
 * セマンティックマッチングで値を転記した結果。
 */
export interface AiTransferResult {
  /** 転記成功フィールド */
  transferred: AiTransferredField[];
  /** 転記スキップフィールド */
  skipped: AiSkippedField[];
  /** 要確認フィールド（confidence < 0.8） */
  requiresReview: AiReviewField[];
  /** 転記成功数 */
  totalTransferred: number;
  /** スキップ数 */
  totalSkipped: number;
  /** 転記実行日時 */
  transferredAt: string;
}

/** 転記成功フィールド */
export interface AiTransferredField {
  /** テンプレート側の Named Range */
  namedRange: string;
  /** 転記元セルのアドレス（例: Sheet1!B5） */
  sourceCell: string;
  /** 転記された値 */
  value: unknown;
  /** AI のマッチング確信度（0.0〜1.0） */
  confidence: number;
  /** マッチング根拠 */
  reason: string;
}

/** 転記スキップフィールド */
export interface AiSkippedField {
  /** テンプレート側の Named Range */
  namedRange: string;
  /** スキップ理由（日本語） */
  reasonJa: string;
  /** スキップ理由（英語） */
  reason: string;
}

/** 要確認フィールド */
export interface AiReviewField {
  /** テンプレート側の Named Range */
  namedRange: string;
  /** AI の推定値 */
  suggestedValue: unknown;
  /** 確信度 */
  confidence: number;
  /** 代替候補 */
  alternatives: Array<{ value: unknown; sourceCell: string; confidence: number }>;
  /** 確認理由（日本語） */
  reviewReasonJa: string;
}

// =============================================================================
// シート表示設定（IOSH クライアント側）
// =============================================================================

/**
 * データ収集シートの表示設定
 *
 * IOSH のスプレッドシートコントロール（SfSpreadsheet）上で、
 * データ収集テンプレートのシートをどう表示するかを定義。
 */
export interface DataCollectionSheetStyle {
  /** シートタブの色（Hex） */
  tabColor: string;
  /** 入力セルの背景色（デフォルト: 白） */
  editableCellBackground: string;
  /** 非入力セルの背景色（デフォルト: 薄いグレー） */
  lockedCellBackground: string;
  /** 入力セルのボーダー色 */
  editableCellBorder: string;
  /** 検証結果: OK セルの背景色 */
  validCellBackground: string;
  /** 検証結果: 警告セルの背景色 */
  warningCellBackground: string;
  /** 検証結果: エラーセルの背景色 */
  errorCellBackground: string;
}

/** デフォルトの表示設定 */
export const DEFAULT_SHEET_STYLE: DataCollectionSheetStyle = {
  tabColor: '#2563EB',
  editableCellBackground: '#FFFFFF',
  lockedCellBackground: '#F8FAFC',
  editableCellBorder: '#2563EB',
  validCellBackground: '#F0FDF4',
  warningCellBackground: '#FFFBEB',
  errorCellBackground: '#FEF2F2',
};

// =============================================================================
// サーバー API エンドポイント
// =============================================================================

/**
 * データ収集サーバーの API エンドポイント定義
 *
 * ライセンスサーバー（Hono + Supabase）と同じ技術基盤で構築。
 * 同一 Supabase プロジェクト内に dc_ テーブルを追加。サーバーは Railway で独立デプロイ。
 *
 * ```typescript
 * // サーバー側の Supabase 接続例
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY!  // サーバー側は service_role
 * );
 * ```
 */
export const DATA_COLLECTION_API = {
  /** デフォルトポート */
  defaultPort: 9500,

  /** 認証ヘッダー（ライセンスキーを送信） */
  authHeader: 'X-Insight-License-Key',

  /** ユーザー識別ヘッダー（Level 2+） */
  userHeader: 'X-Insight-User-Email',

  /** エンドポイント */
  endpoints: {
    // テンプレート管理
    templates: {
      list: { method: 'GET' as const, path: '/api/templates' },
      get: { method: 'GET' as const, path: '/api/templates/:templateId' },
      download: { method: 'GET' as const, path: '/api/templates/:templateId/download' },
      mapping: { method: 'GET' as const, path: '/api/templates/:templateId/mapping' },
      create: { method: 'POST' as const, path: '/api/templates' },
      update: { method: 'PUT' as const, path: '/api/templates/:templateId' },
      publish: { method: 'POST' as const, path: '/api/templates/:templateId/publish' },
      archive: { method: 'POST' as const, path: '/api/templates/:templateId/archive' },
    },
    // データ送信
    submissions: {
      submit: { method: 'POST' as const, path: '/api/submissions' },
      list: { method: 'GET' as const, path: '/api/submissions' },
      get: { method: 'GET' as const, path: '/api/submissions/:submissionId' },
      review: { method: 'POST' as const, path: '/api/submissions/:submissionId/review' },
      reject: { method: 'POST' as const, path: '/api/submissions/:submissionId/reject' },
    },
    // 下書き
    drafts: {
      save: { method: 'PUT' as const, path: '/api/drafts/:templateId' },
      get: { method: 'GET' as const, path: '/api/drafts/:templateId' },
      list: { method: 'GET' as const, path: '/api/drafts' },
      delete: { method: 'DELETE' as const, path: '/api/drafts/:templateId' },
    },
    // 回収管理（管理者用）
    collection: {
      status: { method: 'GET' as const, path: '/api/collection/:templateId/status' },
      remind: { method: 'POST' as const, path: '/api/collection/:templateId/remind' },
      export: { method: 'GET' as const, path: '/api/collection/:templateId/export' },
      dashboard: { method: 'GET' as const, path: '/api/collection/dashboard' },
    },
    // AI 関連
    ai: {
      transferHistory: { method: 'GET' as const, path: '/api/ai/transfers' },
      validationHistory: { method: 'GET' as const, path: '/api/ai/validations' },
    },
    // ヘルスチェック
    health: { method: 'GET' as const, path: '/api/health' },
  },
} as const;

// =============================================================================
// インフラストラクチャ — 顧客別 Supabase プロジェクト (PostgreSQL)
// =============================================================================

/**
 * データ収集プラットフォームのインフラ構成
 *
 * ============================================================================
 * 【テナント分離方式: 顧客ごとに Supabase プロジェクトを作成】
 * ============================================================================
 *
 * StravisLINK と同様に、顧客ごとに独立した DB 環境を提供する。
 * コンサルタントが導入時に顧客用の Supabase プロジェクトをプロビジョニングする。
 *
 * **選定理由**:
 * - コンサル導入が前提 → 顧客追加は手動プロビジョニングで問題ない
 * - 顧客データの完全な物理分離（財務・業務データの混在を回避）
 * - 顧客ごとにバックアップ・リストア・削除が独立
 * - 障害の影響範囲が顧客単位に限定される
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │  管理系（HARMONIC insight 共通）                               │
 * │                                                              │
 * │  ┌────────────────────────────────────────────────────────┐  │
 * │  │  ライセンスサーバー Supabase                             │  │
 * │  │  ├ licenses / partners / registrations                 │  │
 * │  │  └ dc_tenant_registry ← ★ 顧客環境の接続先を管理       │  │
 * │  └────────────────────────────────────────────────────────┘  │
 * │                                                              │
 * │  ┌────────────────────────────────────────────────────────┐  │
 * │  │  データ収集 API サーバー (Hono on Railway)               │  │
 * │  │  ├ テンプレート管理 / データ受信 / AI 転記・検証          │  │
 * │  │  └ ★ リクエストのテナント情報から接続先 DB を切り替え     │  │
 * │  └────────────────────────────────────────────────────────┘  │
 * ├──────────────────────────────────────────────────────────────┤
 * │  顧客環境（顧客ごとに Supabase プロジェクトを作成）            │
 * │                                                              │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
 * │  │ A社 Supabase │  │ B社 Supabase │  │ C社 Supabase │      │
 * │  │ Project      │  │ Project      │  │ Project      │      │
 * │  │              │  │              │  │              │      │
 * │  │ dc_templates │  │ dc_templates │  │ dc_templates │      │
 * │  │ dc_collected │  │ dc_collected │  │ dc_collected │      │
 * │  │ dc_drafts    │  │ dc_drafts    │  │ dc_drafts    │      │
 * │  │ dc_ai_logs   │  │ dc_ai_logs   │  │ dc_ai_logs   │      │
 * │  │              │  │              │  │              │      │
 * │  │ Storage:     │  │ Storage:     │  │ Storage:     │      │
 * │  │ テンプレート  │  │ テンプレート  │  │ テンプレート  │      │
 * │  │ .xlsx        │  │ .xlsx        │  │ .xlsx        │      │
 * │  └──────────────┘  └──────────────┘  └──────────────┘      │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 導入フロー:
 * 1. コンサルが顧客を受注
 * 2. Supabase プロジェクトを作成（CLI or ダッシュボード）
 * 3. マイグレーション実行（dc_ テーブル作成）
 * 4. dc_tenant_registry に接続情報を登録
 * 5. 顧客の IOSH にライセンスキー + テナント ID を設定
 * ```
 */
export const DATA_COLLECTION_INFRASTRUCTURE = {
  /** 物理データベースエンジン */
  database: {
    engine: 'PostgreSQL' as const,
    minVersion: '15',
    hosting: 'Supabase' as const,
    /**
     * テナント分離方式: 顧客ごとに独立した Supabase プロジェクト
     *
     * - ライセンスサーバーの Supabase とは別プロジェクト
     * - コンサル導入時にプロビジョニング
     * - dc_tenant_registry（管理用 Supabase）で接続先を管理
     */
    tenantIsolation: 'project_per_tenant' as const,
    tablePrefix: 'dc_',
    requiredExtensions: [] as string[],  // JSONB + GIN は PostgreSQL 標準
    features: [
      'JSONB',
      'GIN Index',
      'Realtime',
      'Supabase Storage',
    ],
  },

  /** テナントレジストリ（管理用 Supabase に配置） */
  tenantRegistry: {
    /** ライセンスサーバーの Supabase に dc_tenant_registry テーブルを追加 */
    location: 'license_server_supabase' as const,
    table: 'dc_tenant_registry',
    columns: [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'tenant_name TEXT NOT NULL',                     // 顧客企業名
      'tenant_code TEXT UNIQUE NOT NULL',              // 短縮コード（例: 'acme-corp'）
      'supabase_url TEXT NOT NULL',                    // 顧客用 Supabase プロジェクト URL
      'supabase_anon_key TEXT NOT NULL',               // anon key（クライアント用）
      'supabase_service_role_key_encrypted TEXT NOT NULL', // service_role key（サーバー用・暗号化）
      'status TEXT DEFAULT \'active\'',                // active / suspended / decommissioned
      'license_key TEXT',                              // 紐づくライセンスキー
      'provisioned_by TEXT NOT NULL',                  // プロビジョニングしたコンサル
      'provisioned_at TIMESTAMPTZ DEFAULT NOW()',
      'notes TEXT',
    ],
  },

  /** アプリケーションサーバー */
  server: {
    runtime: 'Hono' as const,
    hosting: 'Railway' as const,
    language: 'TypeScript' as const,
    /** サーバーは1つ。リクエストのテナント情報から接続先 Supabase を動的に切り替え */
    multiTenantRouting: true,
  },

  /** ファイルストレージ（テンプレート .xlsx） */
  storage: {
    provider: 'Supabase Storage' as const,
    /** 各顧客の Supabase Storage 内にバケットを作成 */
    bucket: 'dc-templates',
    maxFileSize: '50MB',
  },

  /** AI プロバイダー */
  ai: {
    provider: 'Anthropic' as const,
    api: 'Claude API' as const,
  },
} as const;

// =============================================================================
// DB アーキテクチャ — AI 対応 JSON ストレージ (Supabase / PostgreSQL)
// =============================================================================

/**
 * データベースアーキテクチャ設計方針
 *
 * **物理 DB**: Supabase (PostgreSQL 15+)
 * **選定理由**: JSONB + GIN ネイティブサポート、既存ライセンスサーバーと同一基盤、
 *             Row Level Security によるテナント分離、Realtime で回収状況をリアルタイム配信
 *
 * ============================================================================
 * 【Stravis 型「汎用テーブル」パターンの進化版】
 * ============================================================================
 *
 * Stravis（連結会計システム）には2種類のテーブルがあった:
 *
 * 1. **固定テーブル**: 連結会計の勘定科目等、スキーマが決まっているデータ
 *    → 物理カラムで定義（高速だがスキーマ変更に DDL が必要）
 *
 * 2. **汎用テーブル**: 1つの物理テーブルに複数の論理テーブルを格納
 *    → レコードの中にテーブル識別子を持ち、論理的に分離
 *    → 新しい収集項目が追加されても DDL 変更不要
 *
 * 本システムでは Stravis の汎用テーブルパターンを **JSONB** で進化させる:
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │  dc_collected_data（物理テーブル: 1つだけ）                    │
 * │                                                              │
 * │  ┌──────────┬──────────────────────────────────────────────┐ │
 * │  │ 共通列    │ template_id, tenant_id, submitter, status   │ │
 * │  │ (物理)   │ submitted_at, reviewed_at, ...              │ │
 * │  ├──────────┼──────────────────────────────────────────────┤ │
 * │  │ データ列  │ data JSONB ← ★ ここに収集データ全体が入る    │ │
 * │  │ (論理)   │                                              │ │
 * │  │          │ テンプレート A の場合:                         │ │
 * │  │          │ { "revenue": 1000, "cost": 500, ... }        │ │
 * │  │          │                                              │ │
 * │  │          │ テンプレート B の場合:                         │ │
 * │  │          │ { "employee_count": 50, "dept": "営業", ... } │ │
 * │  │          │                                              │ │
 * │  │          │ → 論理スキーマは template の schema_json が定義 │ │
 * │  └──────────┴──────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## 従来アプローチとの比較
 *
 * | 方式 | Stravis 固定テーブル | Stravis 汎用テーブル | IOSH JSONB 方式 |
 * |------|--------------------|--------------------|-----------------|
 * | スキーマ変更 | DDL 必要 | 不要 | **不要** |
 * | データ型定義 | SQL カラム定義 | レコード内メタデータ | **JSON Schema** |
 * | AI 可読性 | SQL 解析が必要 | 解析が必要 | **そのまま読める** |
 * | クエリ性能 | 最速 | 中程度 | 中程度（GIN 索引） |
 * | 柔軟性 | 低い | 高い | **最も高い** |
 * | テンプレート追加 | テーブル作成 | 不要 | **不要** |
 *
 * ## AI にとっての利点
 *
 * - JSON はそのまま Claude API のコンテキストに渡せる
 * - スキーマ定義（JSON Schema）も JSON なので AI が理解しやすい
 * - AI 検証時に過去データも JSON で比較できる
 * - AI 転記結果をそのまま data JSONB カラムに格納できる
 *
 * ## PostgreSQL JSONB の活用
 *
 * ```sql
 * -- GIN インデックスで JSONB 内を高速検索
 * CREATE INDEX idx_dc_data_gin ON dc_collected_data USING GIN (data);
 *
 * -- 特定フィールドの集計（テンプレートの論理カラムに対するクエリ）
 * SELECT
 *   data->>'department' AS department,
 *   SUM((data->>'revenue')::numeric) AS total_revenue
 * FROM dc_collected_data
 * WHERE template_id = 'xxx' AND status = 'accepted'
 * GROUP BY data->>'department';
 *
 * -- AI 検証用: 過去データとの比較
 * SELECT data FROM dc_collected_data
 * WHERE template_id = 'xxx'
 * ORDER BY submitted_at DESC LIMIT 12;  -- 過去12回分
 * ```
 */

// =============================================================================
// JSON Schema — テンプレートの論理スキーマ定義
// =============================================================================

/**
 * テンプレートの JSON Schema 定義
 *
 * 各テンプレートが「このテンプレートで収集するデータの構造」を定義する。
 * dc_collected_data.data JSONB カラムに格納されるデータの型を規定。
 *
 * Stravis の汎用テーブルにおける「論理テーブル定義」に相当する。
 */
export interface TemplateDataSchema {
  /** スキーマバージョン（テンプレート更新時にインクリメント） */
  version: number;
  /** 論理テーブル名（人間が読む識別名、例: "monthly_budget_report"） */
  logicalTableName: string;
  /** 論理テーブル名（日本語、例: "月次予算報告"） */
  logicalTableNameJa: string;
  /** フィールド定義 */
  fields: SchemaField[];
  /** 複合キー（同一テンプレート内でのユニーク制約、例: ["department", "fiscal_month"]） */
  uniqueKeys?: string[];
}

/** JSON Schema のフィールド定義 */
export interface SchemaField {
  /** フィールド名（JSON のキー名、DB カラム相当） */
  key: string;
  /** 表示名（英語） */
  label: string;
  /** 表示名（日本語） */
  labelJa: string;
  /** データ型 */
  type: MappingFieldType;
  /** 必須項目か */
  required: boolean;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 説明（日本語、ツールチップ表示） */
  descriptionJa?: string;
  /** 小数点以下桁数（number/currency） */
  decimalPlaces?: number;
  /** 通貨コード（currency） */
  currencyCode?: string;
  /** 日付フォーマット（date） */
  dateFormat?: string;
  /** 列挙値（ドロップダウン候補） */
  enumValues?: Array<{ value: string; label: string; labelJa: string }>;
  /**
   * AI 転記ヒント
   * AI が転記元 Excel から該当データを探す際のキーワード。
   * 例: ["売上", "revenue", "sales", "売上高"]
   */
  aiTransferHints?: string[];
  /**
   * Excel Named Range 名
   * テンプレート Excel のどの Named Range にこのフィールドが対応するか。
   */
  namedRange: string;
}

// =============================================================================
// DB テーブル定義（Supabase / PostgreSQL）
// =============================================================================

/**
 * データ収集サーバーの DB テーブル構成
 *
 * **設計原則**: 物理テーブルは最小限。データ本体は JSONB。
 * テンプレートの JSON Schema が論理スキーマを定義する。
 *
 * ```
 * dc_templates          → テンプレート定義 + JSON Schema（論理テーブル定義）
 * dc_collected_data     → ★ 全テンプレートの収集データを格納する汎用テーブル
 * dc_drafts             → 下書き（JSONB）
 * dc_ai_logs            → AI 転記・検証のログ
 * ```
 */
export const DB_TABLES = {
  // -------------------------------------------------------------------------
  // テンプレート管理
  // -------------------------------------------------------------------------
  /** テンプレート定義（= 論理テーブル定義） */
  dc_templates: {
    description: 'テンプレートのメタデータ + JSON Schema（論理テーブル定義）+ マッピング定義',
    columns: [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      // tenant_id 不要 — 顧客ごとに Supabase プロジェクトが分離されている
      'name TEXT NOT NULL',
      'name_ja TEXT NOT NULL',
      'category TEXT',
      'description TEXT',
      'description_ja TEXT',
      'version INTEGER DEFAULT 1',
      'status TEXT DEFAULT \'draft\'',           // draft / published / archived
      'schedule TEXT DEFAULT \'once\'',           // once / monthly / quarterly / yearly / custom
      'deadline TIMESTAMPTZ',
      'template_file_path TEXT',                  // サーバー上の .xlsx ファイルパス
      'schema_json JSONB NOT NULL',              // ★ 論理テーブル定義（TemplateDataSchema）
      'mapping_json JSONB NOT NULL',             // Named Range ↔ schema_json.fields のマッピング
      'validation_rules JSONB DEFAULT \'[]\'',   // ルールベース検証ルール
      'tab_color TEXT DEFAULT \'#2563EB\'',
      'created_by TEXT NOT NULL',
      'created_at TIMESTAMPTZ DEFAULT NOW()',
      'updated_at TIMESTAMPTZ DEFAULT NOW()',
    ],
    indexes: [
      'CREATE INDEX idx_dc_templates_status ON dc_templates(status)',
      'CREATE INDEX idx_dc_templates_category ON dc_templates(category)',
    ],
  },

  // -------------------------------------------------------------------------
  // 収集データ（汎用テーブル — Stravis 型進化版）
  // -------------------------------------------------------------------------
  /**
   * ★ 全テンプレートの収集データを格納する汎用テーブル
   *
   * 1つの物理テーブルに全テンプレートのデータが入る。
   * template_id で論理的にテーブルを分離。
   * data JSONB カラムの構造は dc_templates.schema_json が定義。
   *
   * Stravis の汎用テーブルと同じ考え方:
   * - 物理テーブル: 1つ（dc_collected_data）
   * - 論理テーブル: テンプレート数だけ存在（template_id で識別）
   * - 論理スキーマ: dc_templates.schema_json が定義
   */
  dc_collected_data: {
    description: '全テンプレートの収集データを格納する汎用テーブル（data JSONB に論理レコードを格納）',
    columns: [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      // --- 共通メタデータ（全テンプレート共通の物理カラム） ---
      'template_id UUID NOT NULL REFERENCES dc_templates(id)',
      'template_version INTEGER NOT NULL',       // 送信時点のテンプレートバージョン
      // tenant_id 不要 — DB 自体が顧客専用
      'submitter_email TEXT NOT NULL',
      'submitter_name TEXT',
      'status TEXT DEFAULT \'submitted\'',        // draft / submitted / accepted / rejected / pending_review
      'comment TEXT',                             // 送信時コメント
      'submitted_at TIMESTAMPTZ DEFAULT NOW()',
      'reviewed_at TIMESTAMPTZ',
      'reviewed_by TEXT',
      'rejection_reason TEXT',
      // --- データ本体（テンプレートごとに構造が異なる JSONB） ---
      'data JSONB NOT NULL',                     // ★ 収集データ本体（論理レコード）
      // --- AI 関連 ---
      'ai_validation_snapshot JSONB',            // AI 検証結果のスナップショット
      'ai_transfer_used BOOLEAN DEFAULT FALSE',  // AI 自動転記を使用したか
    ],
    indexes: [
      '-- テンプレート別検索（最も頻繁なクエリパターン）',
      'CREATE INDEX idx_dc_data_template ON dc_collected_data(template_id)',
      '-- 送信者別検索（回収管理用）',
      'CREATE INDEX idx_dc_data_submitter ON dc_collected_data(submitter_email)',
      '-- ステータス別検索（回収状況確認用）',
      'CREATE INDEX idx_dc_data_status ON dc_collected_data(template_id, status)',
      '-- JSONB 内検索用 GIN インデックス（AI クエリ・集計用）',
      'CREATE INDEX idx_dc_data_gin ON dc_collected_data USING GIN (data)',
      '-- 時系列検索（過去データ比較用）',
      'CREATE INDEX idx_dc_data_timeline ON dc_collected_data(template_id, submitted_at DESC)',
    ],
    /** JSONB クエリ例 */
    queryExamples: [
      '-- テンプレート別のフィールド集計（売上合計など）',
      'SELECT SUM((data->>\'revenue\')::numeric) FROM dc_collected_data WHERE template_id = $1 AND status = \'accepted\'',
      '',
      '-- 部門別クロス集計',
      'SELECT data->>\'department\' AS dept, SUM((data->>\'revenue\')::numeric) AS total',
      'FROM dc_collected_data WHERE template_id = $1 GROUP BY data->>\'department\'',
      '',
      '-- AI 検証用: 同一テンプレートの過去12回分データ取得',
      'SELECT data, submitted_at FROM dc_collected_data',
      'WHERE template_id = $1 AND status = \'accepted\' ORDER BY submitted_at DESC LIMIT 12',
      '',
      '-- 特定フィールドが閾値を超えるレコード検出（異常値アラート）',
      'SELECT * FROM dc_collected_data',
      'WHERE template_id = $1 AND (data->>\'expense\')::numeric > 1000000',
    ],
  },

  // -------------------------------------------------------------------------
  // 下書き
  // -------------------------------------------------------------------------
  /** 下書きデータ（ユーザー × テンプレートで一意） */
  dc_drafts: {
    description: '入力途中の下書きデータ（data JSONB に未完成の論理レコードを格納）',
    columns: [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'template_id UUID NOT NULL REFERENCES dc_templates(id)',
      'user_email TEXT NOT NULL',
      'data JSONB NOT NULL',                     // 下書きデータ（dc_collected_data.data と同じ構造）
      'saved_at TIMESTAMPTZ DEFAULT NOW()',
      'UNIQUE(template_id, user_email)',          // 1ユーザー1テンプレートにつき1下書き
    ],
    indexes: [
      'CREATE INDEX idx_dc_drafts_user ON dc_drafts(user_email)',
    ],
  },

  // -------------------------------------------------------------------------
  // AI ログ
  // -------------------------------------------------------------------------
  /** AI 転記・検証の実行ログ（品質追跡・利用量カウント用） */
  dc_ai_logs: {
    description: 'AI 自動転記・AI 検証の実行ログ',
    columns: [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'template_id UUID NOT NULL REFERENCES dc_templates(id)',
      'user_email TEXT NOT NULL',
      'action TEXT NOT NULL',                    // 'transfer' / 'validate'
      'source_file_name TEXT',                   // 転記元ファイル名（transfer の場合）
      'result_summary JSONB',                    // 結果サマリー（件数・エラー数等）
      'executed_at TIMESTAMPTZ DEFAULT NOW()',
    ],
    indexes: [
      '-- 利用量カウント用（月次集計）',
      'CREATE INDEX idx_dc_ai_logs_usage ON dc_ai_logs(user_email, action, executed_at)',
    ],
  },

  // -------------------------------------------------------------------------
  // ビュー（集計用）
  // -------------------------------------------------------------------------
  /** 回収ステータスビュー */
  dc_collection_status_view: {
    description: 'テンプレートごとの回収状況集計ビュー',
    ddl: [
      'CREATE OR REPLACE VIEW dc_collection_status AS',
      'SELECT',
      '  t.id AS template_id,',
      '  t.name_ja AS template_name,',
      '  t.deadline,',
      '  COUNT(*) FILTER (WHERE d.status = \'submitted\') AS submitted_count,',
      '  COUNT(*) FILTER (WHERE d.status = \'accepted\') AS accepted_count,',
      '  COUNT(*) FILTER (WHERE d.status = \'rejected\') AS rejected_count,',
      '  COUNT(*) FILTER (WHERE d.status = \'pending_review\') AS pending_count,',
      '  (SELECT COUNT(*) FROM dc_drafts dr WHERE dr.template_id = t.id) AS draft_count',
      'FROM dc_templates t',
      'LEFT JOIN dc_collected_data d ON d.template_id = t.id',
      'WHERE t.status = \'published\'',
      'GROUP BY t.id, t.name_ja, t.deadline;',
    ],
  },

  // -------------------------------------------------------------------------
  // Row Level Security（ユーザーレベルのアクセス制御）
  // -------------------------------------------------------------------------
  /**
   * RLS ポリシー — ユーザーレベルのアクセス制御
   *
   * テナント分離は DB 自体が顧客ごとに分離されているため不要。
   * RLS はオプションで、下書きの本人制限など軽量な用途のみ。
   * Hono サーバー経由のアクセスは service_role で RLS をバイパスする。
   */
  _rls_policies: {
    description: 'ユーザーレベルのアクセス制御（テナント分離は DB 分離で実現済み）',
    ddl: [
      '-- 下書き: 本人の下書きのみ閲覧・編集可（Level 2+ の場合のみ有効化）',
      'ALTER TABLE dc_drafts ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "own_drafts_only" ON dc_drafts',
      '  USING (user_email = auth.jwt()->>\'email\');',
    ],
    note: 'テナント分離は Supabase プロジェクト分離で実現。RLS は補助的な用途のみ。'
        + 'サーバー側は service_role キーで接続するため RLS をバイパスする。',
  },
} as const;

// =============================================================================
// テナント管理コンソール（HARMONIC insight 管理者用 Web UI）
// =============================================================================

/**
 * データ収集テナント管理コンソール
 *
 * 導入企業が増えるにつれ、各顧客の Supabase プロジェクトを個別に管理するのは
 * 煩雑になる。全テナントを一覧・監視・操作できるグラフィカルな管理ツールが必要。
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  DC Admin Console (React / Next.js)                              │
 * │  https://dc-admin.harmonicinsight.com                            │
 * │                                                                  │
 * │  ┌────────────────────────────────────────────────────────────┐  │
 * │  │  ダッシュボード                                             │  │
 * │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │  │
 * │  │  │ 稼働中   │ │ テンプレ │ │ 回収率   │ │ AI利用量 │     │  │
 * │  │  │ 12 社    │ │ 総数 45  │ │ 78%     │ │ 1,234回  │     │  │
 * │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │  │
 * │  └────────────────────────────────────────────────────────────┘  │
 * │                                                                  │
 * │  ┌────────────────────────────────────────────────────────────┐  │
 * │  │  テナント一覧                                               │  │
 * │  │  ┌─────────┬────────┬──────┬───────┬──────┬─────────────┐ │  │
 * │  │  │ 企業名   │ ステータス│ テンプレ│ 回収率 │ AI利用│ 操作          │ │  │
 * │  │  ├─────────┼────────┼──────┼───────┼──────┼─────────────┤ │  │
 * │  │  │ A社     │ ● 稼働  │  5   │ 92%  │ 120  │ [詳細][設定] │ │  │
 * │  │  │ B社     │ ● 稼働  │  8   │ 65%  │ 340  │ [詳細][設定] │ │  │
 * │  │  │ C社     │ ○ 停止  │  3   │ --   │  0   │ [詳細][再開] │ │  │
 * │  │  └─────────┴────────┴──────┴───────┴──────┴─────────────┘ │  │
 * │  └────────────────────────────────────────────────────────────┘  │
 * │                                                                  │
 * │  機能:                                                           │
 * │  ├ テナント新規作成（Supabase プロジェクト自動プロビジョニング）     │
 * │  ├ テナント一覧・検索・ステータス管理（稼働/停止/廃止）             │
 * │  ├ テナント詳細（接続情報・テンプレート・回収状況・AI利用量）        │
 * │  ├ テンプレート配布（全テナントへの一括配布 or 選択配布）            │
 * │  ├ 回収状況の横断集計（全テナントの回収率を一覧）                   │
 * │  ├ AI 利用量モニタリング（月次集計・アラート）                      │
 * │  ├ マイグレーション実行（スキーマ更新を全テナントに適用）            │
 * │  └ ヘルスチェック（全テナントの DB 接続確認・ストレージ使用量）       │
 * └──────────────────────────────────────────────────────────────────┘
 * ```
 */
export const TENANT_ADMIN_CONSOLE = {
  /** 技術スタック */
  tech: {
    framework: 'Next.js' as const,
    ui: 'React' as const,
    hosting: 'Vercel' as const,
    /** 管理用 Supabase（ライセンスサーバーと同一プロジェクト）への接続 */
    registryDb: 'license_server_supabase' as const,
  },

  /** 認証（管理者のみアクセス可能） */
  auth: {
    provider: 'Firebase' as const,
    /** HARMONIC insight 社員 + 認定パートナーのみ */
    allowedRoles: ['admin', 'consultant', 'partner_admin'] as const,
  },

  /** 画面一覧 */
  pages: {
    dashboard: {
      path: '/',
      description: '全テナントの概況（稼働数・テンプレート総数・回収率・AI利用量）',
    },
    tenantList: {
      path: '/tenants',
      description: 'テナント一覧（検索・フィルタ・ステータス管理）',
    },
    tenantDetail: {
      path: '/tenants/:tenantId',
      description: 'テナント詳細（接続情報・テンプレート・回収状況・AI利用ログ）',
    },
    tenantCreate: {
      path: '/tenants/new',
      description: 'テナント新規作成ウィザード（Supabase プロジェクト自動プロビジョニング）',
    },
    templateDistribution: {
      path: '/templates/distribute',
      description: 'テンプレートの一括配布・選択配布',
    },
    collectionOverview: {
      path: '/collection',
      description: '全テナント横断の回収状況ダッシュボード',
    },
    aiUsage: {
      path: '/ai-usage',
      description: 'AI 利用量モニタリング（テナント別・月次推移・アラート設定）',
    },
    migration: {
      path: '/migration',
      description: 'スキーママイグレーション（全テナント or 選択テナントに適用）',
    },
    health: {
      path: '/health',
      description: 'ヘルスチェック（DB 接続・ストレージ使用量・API レスポンスタイム）',
    },
  },

  /** テナント管理 API（管理コンソール → Hono サーバー） */
  adminApi: {
    /** テナントの CRUD */
    tenants: {
      list: { method: 'GET' as const, path: '/admin/tenants' },
      get: { method: 'GET' as const, path: '/admin/tenants/:tenantId' },
      create: { method: 'POST' as const, path: '/admin/tenants' },
      update: { method: 'PUT' as const, path: '/admin/tenants/:tenantId' },
      suspend: { method: 'POST' as const, path: '/admin/tenants/:tenantId/suspend' },
      resume: { method: 'POST' as const, path: '/admin/tenants/:tenantId/resume' },
      decommission: { method: 'POST' as const, path: '/admin/tenants/:tenantId/decommission' },
    },
    /** プロビジョニング */
    provisioning: {
      /** Supabase プロジェクト作成 + マイグレーション + レジストリ登録を一括実行 */
      provision: { method: 'POST' as const, path: '/admin/provisioning/provision' },
      /** マイグレーション実行（全テナント or 選択テナント） */
      migrate: { method: 'POST' as const, path: '/admin/provisioning/migrate' },
      /** ヘルスチェック（全テナントの DB 接続確認） */
      healthCheck: { method: 'GET' as const, path: '/admin/provisioning/health' },
    },
    /** テンプレート配布 */
    distribution: {
      /** テンプレートを選択テナントに配布 */
      distribute: { method: 'POST' as const, path: '/admin/templates/distribute' },
      /** 配布状況確認 */
      status: { method: 'GET' as const, path: '/admin/templates/distribute/status' },
    },
    /** 横断集計 */
    analytics: {
      /** 全テナントの回収状況サマリー */
      collectionSummary: { method: 'GET' as const, path: '/admin/analytics/collection' },
      /** AI 利用量サマリー */
      aiUsageSummary: { method: 'GET' as const, path: '/admin/analytics/ai-usage' },
      /** ストレージ使用量 */
      storageSummary: { method: 'GET' as const, path: '/admin/analytics/storage' },
    },
  },

  /** 自動プロビジョニングスクリプト */
  provisioning: {
    /**
     * テナント作成時に自動実行されるステップ:
     *
     * 1. Supabase CLI でプロジェクト作成
     *    `supabase projects create <tenant-code> --org-id <org-id>`
     *
     * 2. マイグレーション実行（dc_ テーブル作成）
     *    `supabase db push --project-ref <ref>`
     *
     * 3. Storage バケット作成
     *    `dc-templates` バケットを作成
     *
     * 4. dc_tenant_registry に接続情報を登録
     *
     * 5. 初期テンプレートの配布（任意）
     */
    steps: [
      'create_supabase_project',
      'run_migration',
      'create_storage_bucket',
      'register_tenant',
      'distribute_initial_templates',
    ] as const,
  },
} as const;

// =============================================================================
// プラン別制限
// =============================================================================

/** データ収集のプラン別制限 */
export const DATA_COLLECTION_LIMITS: Record<PlanCode, {
  /** データ収集機能が利用可能か */
  enabled: boolean;
  /** 利用可能テンプレート数（-1 = 無制限） */
  maxTemplates: number;
  /** AI 自動転記回数/月（-1 = 無制限） */
  aiTransferPerMonth: number;
  /** AI 検証回数/月（-1 = 無制限） */
  aiValidatePerMonth: number;
  /** 送信データ保持期間（日、-1 = 無制限） */
  dataRetentionDays: number;
  /** 過去データ参照（AI 検証の比較用） */
  historicalDataAccess: boolean;
}> = {
  TRIAL: {
    enabled: true,
    maxTemplates: -1,
    aiTransferPerMonth: -1,
    aiValidatePerMonth: -1,
    dataRetentionDays: 14,
    historicalDataAccess: true,
  },
  STD: {
    enabled: false,
    maxTemplates: 0,
    aiTransferPerMonth: 0,
    aiValidatePerMonth: 0,
    dataRetentionDays: 0,
    historicalDataAccess: false,
  },
  PRO: {
    enabled: true,
    maxTemplates: 50,
    aiTransferPerMonth: 200,
    aiValidatePerMonth: 200,
    dataRetentionDays: 365,
    historicalDataAccess: true,
  },
  ENT: {
    enabled: true,
    maxTemplates: -1,
    aiTransferPerMonth: -1,
    aiValidatePerMonth: -1,
    dataRetentionDays: -1,
    historicalDataAccess: true,
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/** データ収集機能が利用可能かチェック */
export function canUseDataCollection(plan: PlanCode): boolean {
  return DATA_COLLECTION_LIMITS[plan].enabled;
}

/** AI 自動転記が利用可能かチェック */
export function canUseAiTransfer(plan: PlanCode, currentMonthUsage: number): boolean {
  const limits = DATA_COLLECTION_LIMITS[plan];
  if (!limits.enabled) return false;
  if (limits.aiTransferPerMonth === -1) return true;
  return currentMonthUsage < limits.aiTransferPerMonth;
}

/** AI 検証が利用可能かチェック */
export function canUseAiValidation(plan: PlanCode, currentMonthUsage: number): boolean {
  const limits = DATA_COLLECTION_LIMITS[plan];
  if (!limits.enabled) return false;
  if (limits.aiValidatePerMonth === -1) return true;
  return currentMonthUsage < limits.aiValidatePerMonth;
}

/** テンプレート追加可能かチェック */
export function canAddTemplate(plan: PlanCode, currentCount: number): boolean {
  const limits = DATA_COLLECTION_LIMITS[plan];
  if (!limits.enabled) return false;
  if (limits.maxTemplates === -1) return true;
  return currentCount < limits.maxTemplates;
}

/** マッピング定義のバリデーション */
export function validateMapping(mapping: TemplateMappingDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!mapping.targetTable) {
    errors.push('targetTable is required');
  }
  if (!mapping.fields || mapping.fields.length === 0) {
    errors.push('At least one field mapping is required');
  }

  const namedRanges = new Set<string>();
  const dbColumns = new Set<string>();

  for (const field of mapping.fields) {
    if (!field.namedRange) {
      errors.push(`Field missing namedRange: ${JSON.stringify(field)}`);
    }
    if (!field.dbColumn) {
      errors.push(`Field missing dbColumn: ${field.namedRange}`);
    }
    if (namedRanges.has(field.namedRange)) {
      errors.push(`Duplicate namedRange: ${field.namedRange}`);
    }
    if (dbColumns.has(field.dbColumn)) {
      errors.push(`Duplicate dbColumn: ${field.dbColumn}`);
    }
    namedRanges.add(field.namedRange);
    dbColumns.add(field.dbColumn);
  }

  return { valid: errors.length === 0, errors };
}

/** クレジット残量ラベルの生成 */
export function getDataCollectionCreditLabel(
  plan: PlanCode,
  feature: 'aiTransferPerMonth' | 'aiValidatePerMonth',
  currentUsage: number,
  locale: 'ja' | 'en' = 'ja',
): string {
  const limits = DATA_COLLECTION_LIMITS[plan];
  const limit = limits[feature];
  const featureNames = {
    aiTransferPerMonth: { ja: 'AI 自動転記', en: 'AI Auto-Transfer' },
    aiValidatePerMonth: { ja: 'AI 検証', en: 'AI Validation' },
  };

  const name = featureNames[feature][locale];

  if (limit === -1) {
    return locale === 'ja' ? `${name} — 無制限` : `${name} — Unlimited`;
  }
  const remaining = Math.max(0, limit - currentUsage);
  return locale === 'ja'
    ? `${name} — 残り ${remaining}回（月${limit}回）`
    : `${name} — ${remaining} remaining (${limit}/month)`;
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // 定義
  AUTH_LEVELS,
  DATA_COLLECTION_API,
  DATA_COLLECTION_LIMITS,
  DB_TABLES,
  DEFAULT_SHEET_STYLE,

  // ヘルパー
  canUseDataCollection,
  canUseAiTransfer,
  canUseAiValidation,
  canAddTemplate,
  validateMapping,
  getDataCollectionCreditLabel,
};
