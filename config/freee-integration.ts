/**
 * freee API 統合設定
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * HARMONIC insight の経理・請求業務を freee 会計 + freee 請求書と連携させる。
 * OAuth 2.0 によるセキュアな接続を基盤とし、AI Accounting Agent が
 * freee API を Tool として呼び出して自律的に業務を遂行する。
 *
 * ## 対象 freee API
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ freee API エコシステム                                         │
 * │                                                                │
 * │ ① 会計 API (Accounting)        ② 請求書 API (Invoicing)       │
 * │ ┌──────────────────────┐     ┌──────────────────────┐      │
 * │ │/api/1               │     │/iv                  │      │
 * │ │• 取引 (deals)       │     │• 請求書 (invoices)  │      │
 * │ │• 取引先 (partners)  │     │• 見積書 (quotations)│      │
 * │ │• 勘定科目           │     │• 納品書             │      │
 * │ │• 経費精算           │     │                     │      │
 * │ │• 支払依頼           │     │                     │      │
 * │ │• 仕訳帳             │     │                     │      │
 * │ │• 試算表             │     │                     │      │
 * │ │• 口座               │     │                     │      │
 * │ └──────────────────────┘     └──────────────────────┘      │
 * │                                                                │
 * │ 認証: OAuth 2.0 Authorization Code Flow                        │
 * │ ベース URL: https://api.freee.co.jp                             │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Stripe → freee 連携フロー
 *
 * ```
 * Stripe Webhook                    AI Accounting Agent              freee
 * ─────────────                     ─────────────────────           ──────
 * checkout.session.completed ──→ Agent が取引内容を解析
 *                                   │取引先を特定/作成  ─────────→ POST /partners
 *                                   │請求書を発行       ─────────→ POST /iv/invoices
 *                                   │入金取引を記録     ─────────→ POST /deals
 *                                   │仕訳を確認         ─────────→ GET /journals
 *
 * invoice.paid ────────────────→ Agent が更新処理
 *                                   │入金消込を実行     ─────────→ PUT /deals/{id}
 *                                   │売上計上を確認
 * ```
 */

// =============================================================================
// OAuth 2.0 設定
// =============================================================================

/** freee OAuth 2.0 エンドポイント */
export const FREEE_OAUTH_CONFIG = {
  /** 認可エンドポイント */
  authorizationUrl: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  /** トークンエンドポイント */
  tokenUrl: 'https://accounts.secure.freee.co.jp/public_api/token',
  /** アクセストークン有効期間（秒） */
  accessTokenLifetimeSeconds: 21_600, // 6 hours
  /** リフレッシュトークンはローテーション方式（使用するたびに新しいものが発行される） */
  refreshTokenRotation: true,
  /** 環境変数キー */
  envVars: {
    clientId: 'FREEE_CLIENT_ID',
    clientSecret: 'FREEE_CLIENT_SECRET',
    redirectUri: 'FREEE_REDIRECT_URI',
    companyId: 'FREEE_COMPANY_ID',
  },
} as const;

/** freee OAuth トークン */
export interface FreeeOAuthToken {
  /** アクセストークン */
  access_token: string;
  /** トークン種別 */
  token_type: 'bearer';
  /** 有効期間（秒） */
  expires_in: number;
  /** リフレッシュトークン（ローテーション方式） */
  refresh_token: string;
  /** スコープ */
  scope: string;
  /** 発行日時 (ISO 8601) */
  created_at: number;
}

// =============================================================================
// API ベース設定
// =============================================================================

/** freee API ベース URL */
export const FREEE_API_BASE_URL = 'https://api.freee.co.jp';

/** freee API バージョン・パスプレフィックス */
export const FREEE_API_PATHS = {
  /** 会計 API */
  accounting: '/api/1',
  /** 請求書 API */
  invoicing: '/iv',
  /** 人事労務 API */
  hr: '/hr',
  /** 販売 API */
  sales: '/sm',
  /** 工数管理 API */
  projectManagement: '/pm',
} as const;

// =============================================================================
// 会計 API (Accounting) エンドポイント
// =============================================================================

/**
 * freee 会計 API エンドポイント定義
 *
 * AI Accounting Agent が Tool として使用する主要エンドポイント。
 */
export const FREEE_ACCOUNTING_ENDPOINTS = {
  // --- 事業所 ---
  companies: {
    list: { method: 'GET' as const, path: '/api/1/companies' },
    get: { method: 'GET' as const, path: '/api/1/companies/{company_id}' },
  },

  // --- 取引（収入・支出） ---
  deals: {
    list: { method: 'GET' as const, path: '/api/1/deals' },
    create: { method: 'POST' as const, path: '/api/1/deals' },
    get: { method: 'GET' as const, path: '/api/1/deals/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/deals/{id}' },
    delete: { method: 'DELETE' as const, path: '/api/1/deals/{id}' },
  },

  // --- 振替 ---
  transfers: {
    list: { method: 'GET' as const, path: '/api/1/transfers' },
    create: { method: 'POST' as const, path: '/api/1/transfers' },
  },

  // --- 取引先 ---
  partners: {
    list: { method: 'GET' as const, path: '/api/1/partners' },
    create: { method: 'POST' as const, path: '/api/1/partners' },
    get: { method: 'GET' as const, path: '/api/1/partners/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/partners/{id}' },
    delete: { method: 'DELETE' as const, path: '/api/1/partners/{id}' },
  },

  // --- 勘定科目 ---
  accountItems: {
    list: { method: 'GET' as const, path: '/api/1/account_items' },
    create: { method: 'POST' as const, path: '/api/1/account_items' },
    get: { method: 'GET' as const, path: '/api/1/account_items/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/account_items/{id}' },
  },

  // --- 経費精算 ---
  expenseApplications: {
    list: { method: 'GET' as const, path: '/api/1/expense_applications' },
    create: { method: 'POST' as const, path: '/api/1/expense_applications' },
    get: { method: 'GET' as const, path: '/api/1/expense_applications/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/expense_applications/{id}' },
  },

  // --- 支払依頼 ---
  paymentRequests: {
    list: { method: 'GET' as const, path: '/api/1/payment_requests' },
    create: { method: 'POST' as const, path: '/api/1/payment_requests' },
    get: { method: 'GET' as const, path: '/api/1/payment_requests/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/payment_requests/{id}' },
  },

  // --- 各種申請 ---
  approvalRequests: {
    list: { method: 'GET' as const, path: '/api/1/approval_requests' },
    create: { method: 'POST' as const, path: '/api/1/approval_requests' },
    get: { method: 'GET' as const, path: '/api/1/approval_requests/{id}' },
    update: { method: 'PUT' as const, path: '/api/1/approval_requests/{id}' },
  },

  // --- 仕訳帳 ---
  journals: {
    download: { method: 'GET' as const, path: '/api/1/journals' },
  },

  // --- 試算表 ---
  reports: {
    trialBs: { method: 'GET' as const, path: '/api/1/reports/trial_bs' },
    trialPl: { method: 'GET' as const, path: '/api/1/reports/trial_pl' },
  },

  // --- 口座 ---
  walletables: {
    list: { method: 'GET' as const, path: '/api/1/walletables' },
    create: { method: 'POST' as const, path: '/api/1/walletables' },
  },

  // --- 明細 ---
  walletTxns: {
    list: { method: 'GET' as const, path: '/api/1/wallet_txns' },
    create: { method: 'POST' as const, path: '/api/1/wallet_txns' },
  },

  // --- 部門 ---
  sections: {
    list: { method: 'GET' as const, path: '/api/1/sections' },
    create: { method: 'POST' as const, path: '/api/1/sections' },
  },

  // --- 品目 ---
  items: {
    list: { method: 'GET' as const, path: '/api/1/items' },
    create: { method: 'POST' as const, path: '/api/1/items' },
  },

  // --- メモタグ ---
  tags: {
    list: { method: 'GET' as const, path: '/api/1/tags' },
    create: { method: 'POST' as const, path: '/api/1/tags' },
  },

  // --- ファイルボックス（領収書等） ---
  receipts: {
    list: { method: 'GET' as const, path: '/api/1/receipts' },
    create: { method: 'POST' as const, path: '/api/1/receipts' },
  },

  // --- ユーザー ---
  users: {
    me: { method: 'GET' as const, path: '/api/1/users/me' },
  },
} as const;

// =============================================================================
// 請求書 API (Invoicing) エンドポイント
// =============================================================================

/**
 * freee 請求書 API エンドポイント定義
 *
 * 旧会計 API の /invoices は非推奨。こちらが正式な請求書 API。
 * インボイス制度（適格請求書）に対応。
 */
export const FREEE_INVOICING_ENDPOINTS = {
  // --- 請求書 ---
  invoices: {
    list: { method: 'GET' as const, path: '/iv/invoices' },
    create: { method: 'POST' as const, path: '/iv/invoices' },
    get: { method: 'GET' as const, path: '/iv/invoices/{id}' },
    update: { method: 'PUT' as const, path: '/iv/invoices/{id}' },
    templates: { method: 'GET' as const, path: '/iv/invoices/templates' },
  },

  // --- 見積書 ---
  quotations: {
    list: { method: 'GET' as const, path: '/iv/quotations' },
    create: { method: 'POST' as const, path: '/iv/quotations' },
    get: { method: 'GET' as const, path: '/iv/quotations/{id}' },
    update: { method: 'PUT' as const, path: '/iv/quotations/{id}' },
    templates: { method: 'GET' as const, path: '/iv/quotations/templates' },
  },

  // --- 納品書 ---
  deliverySlips: {
    list: { method: 'GET' as const, path: '/iv/delivery_slips' },
    create: { method: 'POST' as const, path: '/iv/delivery_slips' },
    get: { method: 'GET' as const, path: '/iv/delivery_slips/{id}' },
    update: { method: 'PUT' as const, path: '/iv/delivery_slips/{id}' },
    templates: { method: 'GET' as const, path: '/iv/delivery_slips/templates' },
  },
} as const;

// =============================================================================
// Webhook 設定
// =============================================================================

/** freee Webhook イベント種別 */
export type FreeeWebhookEvent =
  | 'accounting:expense_application:created'
  | 'accounting:expense_application:updated'
  | 'accounting:approval_request:created'
  | 'accounting:approval_request:updated'
  | 'accounting:payment_request:created'
  | 'accounting:payment_request:updated';

/** freee Webhook ペイロード */
export interface FreeeWebhookPayload {
  /** 通知 ID */
  id: string;
  /** アプリ ID */
  application_id: string;
  /** リソース種別 */
  resource: string;
  /** アクション */
  action: 'created' | 'updated';
  /** 作成日時 */
  created_at: string;
  /** 事業所 ID */
  company_id: number;
  /** オブジェクト ID */
  object_id: number;
  /** ステータス */
  status: string;
  /** ユーザー ID */
  user_id: number;
  /** 承認アクション */
  approval_action?: 'approve' | 'reject';
}

/** freee Webhook 設定 */
export const FREEE_WEBHOOK_CONFIG = {
  /** Webhook 検証ヘッダー */
  verificationHeader: 'x-freee-token',
  /** Webhook 送信元ドメイン */
  sourceHost: 'egw.freee.co.jp',
  /** 環境変数: Webhook 検証トークン */
  verificationTokenEnvVar: 'FREEE_WEBHOOK_VERIFICATION_TOKEN',
} as const;

// =============================================================================
// freee データモデル（API レスポンス型）
// =============================================================================

/** 取引種別 */
export type FreeeDealType = 'income' | 'expense';

/** 取引ステータス */
export type FreeeDealStatus = 'settled' | 'unsettled';

/** 取引（収入・支出） — freee deals */
export interface FreeeDeal {
  id: number;
  company_id: number;
  issue_date: string;
  due_date?: string;
  type: FreeeDealType;
  ref_number?: string;
  status: FreeeDealStatus;
  partner_id?: number;
  partner_name?: string;
  amount: number;
  details: FreeeDealDetail[];
  payments: FreeeDealPayment[];
}

/** 取引明細行 */
export interface FreeeDealDetail {
  id?: number;
  account_item_id: number;
  tax_code: number;
  amount: number;
  item_id?: number;
  section_id?: number;
  tag_ids?: number[];
  description?: string;
  vat?: number;
}

/** 取引の支払い情報 */
export interface FreeeDealPayment {
  id?: number;
  date: string;
  from_walletable_type: 'bank_account' | 'credit_card' | 'wallet';
  from_walletable_id: number;
  amount: number;
}

/** 取引先 — freee partners */
export interface FreeePartner {
  id: number;
  company_id: number;
  name: string;
  code?: string;
  shortcut1?: string;
  shortcut2?: string;
  long_name?: string;
  name_kana?: string;
  country_code?: string;
  address_attributes?: {
    zipcode?: string;
    prefecture_code?: number;
    street_name1?: string;
    street_name2?: string;
  };
  partner_doc_setting?: {
    sending_method?: 'email' | 'posting' | 'main_and_sub';
  };
  partner_bank_account_attributes?: {
    bank_name?: string;
    bank_code?: string;
    branch_name?: string;
    branch_code?: string;
    account_type?: 'ordinary' | 'checking' | 'savings';
    account_number?: string;
    account_name?: string;
  };
  invoice_registration_number?: string;
}

/** 請求書 — freee invoicing API */
export interface FreeeInvoice {
  id: number;
  company_id: number;
  issue_date: string;
  due_date: string;
  partner_id: number;
  partner_name?: string;
  invoice_number?: string;
  title?: string;
  total_amount: number;
  sub_total: number;
  total_vat: number;
  invoice_status: 'draft' | 'applying' | 'remanded' | 'rejected' | 'approved' | 'issued' | 'unread' | 'read';
  payment_status: 'unsettled' | 'settled';
  invoice_lines: FreeeInvoiceLine[];
  qualified_invoice_status?: 'qualified' | 'category_based' | 'none';
  invoice_registration_number?: string;
  description?: string;
  payment_bank_info?: string;
  notes?: string;
}

/** 請求書明細行 */
export interface FreeeInvoiceLine {
  id?: number;
  type?: 'normal' | 'discount' | 'text';
  name: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  vat?: number;
  reduced_vat?: boolean;
  description?: string;
  account_item_id?: number;
  tax_code?: number;
}

/** 経費精算 — freee expense_applications */
export interface FreeeExpenseApplication {
  id: number;
  company_id: number;
  title: string;
  issue_date: string;
  status: 'draft' | 'in_progress' | 'approved' | 'rejected';
  total_amount: number;
  expense_application_lines: FreeeExpenseApplicationLine[];
  description?: string;
  section_id?: number;
  tag_ids?: number[];
  applicant_id?: number;
}

/** 経費精算明細行 */
export interface FreeeExpenseApplicationLine {
  id?: number;
  transaction_date: string;
  description: string;
  amount: number;
  expense_application_line_template_id?: number;
  receipt_id?: number;
}

/** 支払依頼 — freee payment_requests */
export interface FreeePaymentRequest {
  id: number;
  company_id: number;
  title: string;
  issue_date: string;
  payment_date?: string;
  status: 'draft' | 'in_progress' | 'approved' | 'rejected';
  total_amount: number;
  partner_id?: number;
  partner_name?: string;
  payment_request_lines: FreeePaymentRequestLine[];
  description?: string;
  document_code?: string;
}

/** 支払依頼明細行 */
export interface FreeePaymentRequestLine {
  id?: number;
  line_type: 'payment' | 'withholding_tax' | 'adjustment';
  description?: string;
  amount: number;
  account_item_id?: number;
  tax_code?: number;
  section_id?: number;
  tag_ids?: number[];
}

/** 勘定科目 — freee account_items */
export interface FreeeAccountItem {
  id: number;
  company_id: number;
  name: string;
  shortcut?: string;
  shortcut_num?: string;
  tax_code: number;
  default_tax_id: number;
  categories: string[];
  available: boolean;
  walletable_id?: number;
  group_name?: string;
}

/** 口座 — freee walletables */
export interface FreeeWalletable {
  id: number;
  company_id: number;
  name: string;
  type: 'bank_account' | 'credit_card' | 'wallet';
  bank_id?: number;
  last_balance?: number;
}

/** 試算表行 — freee reports */
export interface FreeeTrialBalanceRow {
  account_item_id: number;
  account_item_name: string;
  account_category_name: string;
  opening_balance: number;
  debit_amount: number;
  credit_amount: number;
  closing_balance: number;
  /** 取引先内訳（partners パラメータ指定時） */
  partners?: Array<{
    id: number;
    name: string;
    debit_amount: number;
    credit_amount: number;
    closing_balance: number;
  }>;
}

// =============================================================================
// freee → HARMONIC insight マッピング
// =============================================================================

/**
 * HARMONIC insight 製品 → freee 品目マッピング
 *
 * freee 上で各製品をどの品目として計上するかの対応表。
 * 初回起動時に freee の items API で品目を自動作成する。
 */
export interface FreeeProductItemMapping {
  /** HARMONIC insight 製品コード */
  productCode: string;
  /** freee 品目名 */
  freeeItemName: string;
  /** freee 品目名（英語） */
  freeeItemNameEn: string;
  /** 売上計上時の勘定科目名 */
  revenueAccountName: string;
  /** 売上計上時の税区分コード（課税売上 10%） */
  revenueTaxCode: number;
}

/** 製品 → freee 品目マッピング定義 */
export const FREEE_PRODUCT_ITEM_MAPPINGS: FreeeProductItemMapping[] = [
  // --- Tier 3: Insight Business Suite ---
  { productCode: 'INSS', freeeItemName: 'Insight Deck Quality Gate ライセンス', freeeItemNameEn: 'Insight Deck Quality Gate License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'IOSH', freeeItemName: 'Insight Performance Management ライセンス', freeeItemNameEn: 'Insight Performance Management License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'IOSD', freeeItemName: 'Insight AI Briefcase ライセンス', freeeItemNameEn: 'Insight AI Briefcase License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'INPY', freeeItemName: 'InsightPy ライセンス', freeeItemNameEn: 'InsightPy License', revenueAccountName: '売上高', revenueTaxCode: 1 },

  // --- Tier 4: InsightSeniorOffice ---
  { productCode: 'ISOF', freeeItemName: 'InsightSeniorOffice ライセンス', freeeItemNameEn: 'InsightSeniorOffice License', revenueAccountName: '売上高', revenueTaxCode: 1 },

  // --- Tier 2: AI ツール ---
  { productCode: 'INMV', freeeItemName: 'Insight Training Studio ライセンス', freeeItemNameEn: 'Insight Training Studio License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'INIG', freeeItemName: 'InsightImageGen ライセンス', freeeItemNameEn: 'InsightImageGen License', revenueAccountName: '売上高', revenueTaxCode: 1 },

  // --- Tier 1: 業務変革ツール ---
  { productCode: 'INCA', freeeItemName: 'InsightNoCodeAnalyzer ライセンス', freeeItemNameEn: 'InsightNoCodeAnalyzer License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'INBT', freeeItemName: 'InsightBot ライセンス', freeeItemNameEn: 'InsightBot License', revenueAccountName: '売上高', revenueTaxCode: 1 },
  { productCode: 'IVIN', freeeItemName: 'InterviewInsight ライセンス', freeeItemNameEn: 'InterviewInsight License', revenueAccountName: '売上高', revenueTaxCode: 1 },

  // --- コンサルティング ---
  { productCode: 'CONSULTING', freeeItemName: 'コンサルティングサービス', freeeItemNameEn: 'Consulting Service', revenueAccountName: '売上高', revenueTaxCode: 1 },
];

/**
 * HARMONIC insight で使用する freee 勘定科目カテゴリ
 *
 * Agent が仕訳を切る際に参照する勘定科目の論理マッピング。
 * 実際の account_item_id は freee 側で事業所ごとに異なるため、
 * Agent が初回接続時に name ベースで ID を解決しキャッシュする。
 */
export const FREEE_ACCOUNT_CATEGORY_MAP = {
  // --- 売上・収入 ---
  revenue: {
    sales: { name: '売上高', nameEn: 'Sales Revenue', category: 'income' },
    consulting: { name: 'コンサルティング収入', nameEn: 'Consulting Revenue', category: 'income' },
  },
  // --- 売上原価 ---
  cogs: {
    apiCost: { name: '外注費', nameEn: 'API/Infrastructure Cost', category: 'expense' },
    serverCost: { name: 'サーバー費用', nameEn: 'Server Cost', category: 'expense' },
  },
  // --- 販管費 ---
  sga: {
    advertising: { name: '広告宣伝費', nameEn: 'Advertising', category: 'expense' },
    travel: { name: '旅費交通費', nameEn: 'Travel', category: 'expense' },
    supplies: { name: '消耗品費', nameEn: 'Supplies', category: 'expense' },
    communication: { name: '通信費', nameEn: 'Communication', category: 'expense' },
    subscription: { name: '支払手数料', nameEn: 'Subscription/Commission', category: 'expense' },
    stripe_fee: { name: '支払手数料', nameEn: 'Stripe Fee', category: 'expense' },
  },
  // --- 資産・負債 ---
  balance: {
    accountsReceivable: { name: '売掛金', nameEn: 'Accounts Receivable', category: 'asset' },
    accountsPayable: { name: '買掛金', nameEn: 'Accounts Payable', category: 'liability' },
    bankAccount: { name: '普通預金', nameEn: 'Bank Account', category: 'asset' },
  },
} as const;

// =============================================================================
// レート制限設定
// =============================================================================

/** freee API レート制限ハンドリング設定 */
export const FREEE_RATE_LIMIT_CONFIG = {
  /** 403 発生時のクールダウン期間（ミリ秒） */
  globalCooldownMs: 10 * 60 * 1000, // 10 minutes
  /** 429 発生時の最大リトライ回数 */
  maxRetries: 3,
  /** リトライ間隔の指数バックオフ基数（ミリ秒） */
  retryBackoffBaseMs: 2_000,
  /** ファイルボックス API のレート制限（リクエスト/分） */
  fileBoxRatePerMinute: 300,
  /** 通常 API の安全なリクエスト間隔（ミリ秒） */
  safeIntervalMs: 500,
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品コードに対応する freee 品目マッピングを取得
 */
export function getFreeeItemMapping(productCode: string): FreeeProductItemMapping | null {
  return FREEE_PRODUCT_ITEM_MAPPINGS.find(m => m.productCode === productCode) ?? null;
}

/**
 * freee OAuth が設定済みかチェック
 */
export function isFreeeConfigured(): boolean {
  return !!(
    process.env[FREEE_OAUTH_CONFIG.envVars.clientId] &&
    process.env[FREEE_OAUTH_CONFIG.envVars.clientSecret] &&
    process.env[FREEE_OAUTH_CONFIG.envVars.companyId]
  );
}

/**
 * freee API の完全 URL を構築
 */
export function buildFreeeApiUrl(path: string): string {
  return `${FREEE_API_BASE_URL}${path}`;
}

// =============================================================================
// DB スキーマ参照
// =============================================================================

/**
 * freee 統合に必要な DB テーブル
 */
export const FREEE_DB_SCHEMA_REFERENCE = {
  /** freee OAuth トークン管理 */
  freee_tokens: `
    CREATE TABLE IF NOT EXISTS freee_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id INTEGER NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      scope TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX idx_freee_tokens_company ON freee_tokens(company_id);
  `,

  /** freee 品目 ID キャッシュ（name → id マッピング） */
  freee_item_cache: `
    CREATE TABLE IF NOT EXISTS freee_item_cache (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id INTEGER NOT NULL,
      product_code TEXT NOT NULL,
      freee_item_id INTEGER NOT NULL,
      freee_item_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(company_id, product_code)
    );
  `,

  /** freee 勘定科目 ID キャッシュ */
  freee_account_cache: `
    CREATE TABLE IF NOT EXISTS freee_account_cache (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id INTEGER NOT NULL,
      account_key TEXT NOT NULL,
      freee_account_item_id INTEGER NOT NULL,
      freee_account_item_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(company_id, account_key)
    );
  `,

  /** Stripe → freee 同期記録 */
  stripe_freee_sync: `
    CREATE TABLE IF NOT EXISTS stripe_freee_sync (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      stripe_event_id TEXT NOT NULL UNIQUE,
      stripe_event_type TEXT NOT NULL,
      freee_deal_id INTEGER,
      freee_invoice_id INTEGER,
      freee_partner_id INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      agent_execution_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_stripe_freee_sync_status ON stripe_freee_sync(sync_status);
    CREATE INDEX idx_stripe_freee_sync_event ON stripe_freee_sync(stripe_event_id);
  `,
} as const;

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // OAuth
  FREEE_OAUTH_CONFIG,

  // API
  FREEE_API_BASE_URL,
  FREEE_API_PATHS,
  FREEE_ACCOUNTING_ENDPOINTS,
  FREEE_INVOICING_ENDPOINTS,

  // Webhook
  FREEE_WEBHOOK_CONFIG,

  // マッピング
  FREEE_PRODUCT_ITEM_MAPPINGS,
  FREEE_ACCOUNT_CATEGORY_MAP,

  // レート制限
  FREEE_RATE_LIMIT_CONFIG,

  // DB
  FREEE_DB_SCHEMA_REFERENCE,

  // ヘルパー
  getFreeeItemMapping,
  isFreeeConfigured,
  buildFreeeApiUrl,
};
