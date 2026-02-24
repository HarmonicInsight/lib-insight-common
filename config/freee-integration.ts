/**
 * freee API 統合設宁E
 *
 * ============================================================================
 * 【設計方針、E
 * ============================================================================
 *
 * HARMONIC insight の経理・請求業務を freee 会訁E+ freee 請求書と連携させる、E
 * OAuth 2.0 によるセキュアな接続を基盤とし、AI Accounting Agent ぁE
 * freee API めETool として呼び出して自律的に業務を遂行する、E
 *
 * ## 対象 freee API
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────━E
 * ━E freee API エコシスチE��                                         ━E
 * ━E                                                                ━E
 * ━E ① 会訁EAPI (Accounting)        ② 請求書 API (Invoicing)       ━E
 * ━E ┌──────────────────────━E     ┌──────────────────────━E      ━E
 * ━E ━E/api/1               ━E     ━E/iv                  ━E      ━E
 * ━E ━E• 取弁E(deals)       ━E     ━E• 請求書 (invoices)  ━E      ━E
 * ━E ━E• 取引�E (partners)  ━E     ━E• 見積書 (quotations)━E      ━E
 * ━E ━E• 勘定科目           ━E     ━E• 納品書             ━E      ━E
 * ━E ━E• 経費精箁E          ━E     ━E                     ━E      ━E
 * ━E ━E• 支払依頼           ━E     ━E                     ━E      ━E
 * ━E ━E• 仕訳帳             ━E     ━E                     ━E      ━E
 * ━E ━E• 試算表             ━E     ━E                     ━E      ━E
 * ━E ━E• 口座               ━E     ━E                     ━E      ━E
 * ━E └──────────────────────━E     └──────────────────────━E      ━E
 * ━E                                                                ━E
 * ━E 認証: OAuth 2.0 Authorization Code Flow                        ━E
 * ━E ベ�EスURL: https://api.freee.co.jp                             ━E
 * └─────────────────────────────────────────────────────────────────━E
 * ```
 *
 * ## Stripe ↁEfreee 連携フロー
 *
 * ```
 * Stripe Webhook                    AI Accounting Agent              freee
 * ─────────────                     ─────────────────────           ──────
 * checkout.session.completed ──ↁEAgent が取引�E容を解极E
 *                                   ━E取引�Eを特宁E作�E  ─────────ↁEPOST /partners
 *                                   ━E請求書を発衁E      ─────────ↁEPOST /iv/invoices
 *                                   ━E入金取引を記録     ─────────ↁEPOST /deals
 *                                   ━E仕訳を確誁E        ─────────ↁEGET /journals
 *
 * invoice.paid ────────────────ↁEAgent が更新処琁E
 *                                   ━E入金消込を実衁E    ─────────ↁEPUT /deals/{id}
 *                                   ━E売上計上を確誁E
 * ```
 */

// =============================================================================
// OAuth 2.0 設宁E
// =============================================================================

/** freee OAuth 2.0 エンド�EインチE*/
export const FREEE_OAUTH_CONFIG = {
  /** 認可エンド�EインチE*/
  authorizationUrl: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  /** ト�Eクンエンド�EインチE*/
  tokenUrl: 'https://accounts.secure.freee.co.jp/public_api/token',
  /** アクセスト�Eクン有効期間�E�秒！E*/
  accessTokenLifetimeSeconds: 21_600, // 6 hours
  /** リフレチE��ュト�EクンはローチE�Eション方式（使用するた�Eに新しいも�Eが発行される�E�E*/
  refreshTokenRotation: true,
  /** 環墁E��数キー */
  envVars: {
    clientId: 'FREEE_CLIENT_ID',
    clientSecret: 'FREEE_CLIENT_SECRET',
    redirectUri: 'FREEE_REDIRECT_URI',
    companyId: 'FREEE_COMPANY_ID',
  },
} as const;

/** freee OAuth ト�Eクン */
export interface FreeeOAuthToken {
  /** アクセスト�Eクン */
  access_token: string;
  /** ト�Eクン種別 */
  token_type: 'bearer';
  /** 有効期間�E�秒！E*/
  expires_in: number;
  /** リフレチE��ュト�Eクン�E�ローチE�Eション方式！E*/
  refresh_token: string;
  /** スコーチE*/
  scope: string;
  /** 発行日晁E(ISO 8601) */
  created_at: number;
}

// =============================================================================
// API ベ�Eス設宁E
// =============================================================================

/** freee API ベ�Eス URL */
export const FREEE_API_BASE_URL = 'https://api.freee.co.jp';

/** freee API バ�Eジョン・パスプレフィチE��ス */
export const FREEE_API_PATHS = {
  /** 会訁EAPI */
  accounting: '/api/1',
  /** 請求書 API */
  invoicing: '/iv',
  /** 人事労勁EAPI */
  hr: '/hr',
  /** 販売 API */
  sales: '/sm',
  /** 工数管琁EAPI */
  projectManagement: '/pm',
} as const;

// =============================================================================
// 会訁EAPI (Accounting) エンド�EインチE
// =============================================================================

/**
 * freee 会訁EAPI エンド�Eイント定義
 *
 * AI Accounting Agent ぁETool として使用する主要エンド�Eイント、E
 */
export const FREEE_ACCOUNTING_ENDPOINTS = {
  // --- 事業所 ---
  companies: {
    list: { method: 'GET' as const, path: '/api/1/companies' },
    get: { method: 'GET' as const, path: '/api/1/companies/{company_id}' },
  },

  // --- 取引（収入・支出�E�E---
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

  // --- 取引�E ---
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

  // --- 経費精箁E---
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

  // --- 吁E��申諁E---
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

  // --- ファイルボックス�E�領収書等！E---
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
// 請求書 API (Invoicing) エンド�EインチE
// =============================================================================

/**
 * freee 請求書 API エンド�Eイント定義
 *
 * 旧会訁EAPI の /invoices は非推奨。こちらが正式な請求書 API、E
 * インボイス制度�E�適格請求書�E�に対応、E
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
// Webhook 設宁E
// =============================================================================

/** freee Webhook イベント種別 */
export type FreeeWebhookEvent =
  | 'accounting:expense_application:created'
  | 'accounting:expense_application:updated'
  | 'accounting:approval_request:created'
  | 'accounting:approval_request:updated'
  | 'accounting:payment_request:created'
  | 'accounting:payment_request:updated';

/** freee Webhook ペイローチE*/
export interface FreeeWebhookPayload {
  /** 通知 ID */
  id: string;
  /** アプリ ID */
  application_id: string;
  /** リソース種別 */
  resource: string;
  /** アクション */
  action: 'created' | 'updated';
  /** 作�E日晁E*/
  created_at: string;
  /** 事業所 ID */
  company_id: number;
  /** オブジェクチEID */
  object_id: number;
  /** スチE�Eタス */
  status: string;
  /** ユーザー ID */
  user_id: number;
  /** 承認アクション */
  approval_action?: 'approve' | 'reject';
}

/** freee Webhook 設宁E*/
export const FREEE_WEBHOOK_CONFIG = {
  /** Webhook 検証ヘッダー */
  verificationHeader: 'x-freee-token',
  /** Webhook 送信允E��メイン */
  sourceHost: 'egw.freee.co.jp',
  /** 環墁E��数: Webhook 検証ト�Eクン */
  verificationTokenEnvVar: 'FREEE_WEBHOOK_VERIFICATION_TOKEN',
} as const;

// =============================================================================
// freee チE�EタモチE���E�EPI レスポンス型！E
// =============================================================================

/** 取引種別 */
export type FreeeDealType = 'income' | 'expense';

/** 取引スチE�Eタス */
export type FreeeDealStatus = 'settled' | 'unsettled';

/** 取引（収入・支出�E� Efreee deals */
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

/** 取引�E細衁E*/
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

/** 取引�E支払い惁E�� */
export interface FreeeDealPayment {
  id?: number;
  date: string;
  from_walletable_type: 'bank_account' | 'credit_card' | 'wallet';
  from_walletable_id: number;
  amount: number;
}

/** 取引�E  Efreee partners */
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

/** 請求書  Efreee invoicing API */
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

/** 請求書明細衁E*/
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

/** 経費精箁E Efreee expense_applications */
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

/** 経費精算�E細衁E*/
export interface FreeeExpenseApplicationLine {
  id?: number;
  transaction_date: string;
  description: string;
  amount: number;
  expense_application_line_template_id?: number;
  receipt_id?: number;
}

/** 支払依頼  Efreee payment_requests */
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

/** 支払依頼明細衁E*/
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

/** 勘定科目  Efreee account_items */
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

/** 口座  Efreee walletables */
export interface FreeeWalletable {
  id: number;
  company_id: number;
  name: string;
  type: 'bank_account' | 'credit_card' | 'wallet';
  bank_id?: number;
  last_balance?: number;
}

/** 試算表衁E Efreee reports */
export interface FreeeTrialBalanceRow {
  account_item_id: number;
  account_item_name: string;
  account_category_name: string;
  opening_balance: number;
  debit_amount: number;
  credit_amount: number;
  closing_balance: number;
  /** 取引�E冁E���E�Eartners パラメータ持E��時�E�E*/
  partners?: Array<{
    id: number;
    name: string;
    debit_amount: number;
    credit_amount: number;
    closing_balance: number;
  }>;
}

// =============================================================================
// freee ↁEHARMONIC insight マッピング
// =============================================================================

/**
 * HARMONIC insight 製品EↁEfreee 品目マッピング
 *
 * freee 上で吁E��品をどの品目として計上するかの対応表、E
 * 初回起動時に freee の items API で品目を�E動作�Eする、E
 */
export interface FreeeProductItemMapping {
  /** HARMONIC insight 製品コーチE*/
  productCode: string;
  /** freee 品目吁E*/
  freeeItemName: string;
  /** freee 品目名（英語！E*/
  freeeItemNameEn: string;
  /** 売上計上時の勘定科目吁E*/
  revenueAccountName: string;
  /** 売上計上時の税区刁E��ード（課税売丁E0%�E�E*/
  revenueTaxCode: number;
}

/** 製品EↁEfreee 品目マッピング定義 */
export const FREEE_PRODUCT_ITEM_MAPPINGS: FreeeProductItemMapping[] = [
  // --- Tier 3: InsightOffice Suite ---
  { productCode: 'INSS', freeeItemName: 'InsightOfficeSlide ライセンス', freeeItemNameEn: 'InsightOfficeSlide License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'IOSH', freeeItemName: 'InsightOfficeSheet ライセンス', freeeItemNameEn: 'InsightOfficeSheet License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'IOSD', freeeItemName: 'InsightOfficeDoc ライセンス', freeeItemNameEn: 'InsightOfficeDoc License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'INPY', freeeItemName: 'InsightPy ライセンス', freeeItemNameEn: 'InsightPy License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },

  // --- Tier 4: InsightSeniorOffice ---
  { productCode: 'ISOF', freeeItemName: 'InsightSeniorOffice ライセンス', freeeItemNameEn: 'InsightSeniorOffice License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },

  // --- Tier 2: AI チE�Eル ---
  { productCode: 'INMV', freeeItemName: 'InsightCast ライセンス', freeeItemNameEn: 'InsightCast License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'INIG', freeeItemName: 'InsightImageGen ライセンス', freeeItemNameEn: 'InsightImageGen License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },

  // --- Tier 1: 業務変革チE�Eル ---
  { productCode: 'INCA', freeeItemName: 'InsightNoCodeAnalyzer ライセンス', freeeItemNameEn: 'InsightNoCodeAnalyzer License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'INBT', freeeItemName: 'InsightBot ライセンス', freeeItemNameEn: 'InsightBot License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'IVIN', freeeItemName: 'InterviewInsight ライセンス', freeeItemNameEn: 'InterviewInsight License', revenueAccountName: '売上髁E, revenueTaxCode: 1 },

  // --- AI アドオン ---
  { productCode: 'AI_ADDON_STANDARD', freeeItemName: 'AI クレジチE�� Standard 200', freeeItemNameEn: 'AI Credits Standard 200', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
  { productCode: 'AI_ADDON_PREMIUM', freeeItemName: 'AI クレジチE�� Premium 200', freeeItemNameEn: 'AI Credits Premium 200', revenueAccountName: '売上髁E, revenueTaxCode: 1 },

  // --- コンサルチE��ング ---
  { productCode: 'CONSULTING', freeeItemName: 'コンサルチE��ングサービス', freeeItemNameEn: 'Consulting Service', revenueAccountName: '売上髁E, revenueTaxCode: 1 },
];

/**
 * HARMONIC insight で使用する freee 勘定科目カチE��リ
 *
 * Agent が仕訳を�Eる際に参�Eする勘定科目の論理マッピング、E
 * 実際の account_item_id は freee 側で事業所ごとに異なるため、E
 * Agent が�E回接続時に name ベ�Eスで ID を解決しキャチE��ュする、E
 */
export const FREEE_ACCOUNT_CATEGORY_MAP = {
  // --- 売上�E収�E ---
  revenue: {
    sales: { name: '売上髁E, nameEn: 'Sales Revenue', category: 'income' },
    consulting: { name: 'コンサルチE��ング収�E', nameEn: 'Consulting Revenue', category: 'income' },
  },
  // --- 売上原価 ---
  cogs: {
    apiCost: { name: '外注費', nameEn: 'API/Infrastructure Cost', category: 'expense' },
    serverCost: { name: 'サーバ�E費用', nameEn: 'Server Cost', category: 'expense' },
  },
  // --- 販管費 ---
  sga: {
    advertising: { name: '庁E��宣伝費', nameEn: 'Advertising', category: 'expense' },
    travel: { name: '旁E��交通費', nameEn: 'Travel', category: 'expense' },
    supplies: { name: '消耗品費', nameEn: 'Supplies', category: 'expense' },
    communication: { name: '通信費', nameEn: 'Communication', category: 'expense' },
    subscription: { name: '支払手数斁E, nameEn: 'Subscription/Commission', category: 'expense' },
    stripe_fee: { name: '支払手数斁E, nameEn: 'Stripe Fee', category: 'expense' },
  },
  // --- 賁E��・負債 ---
  balance: {
    accountsReceivable: { name: '売掛��', nameEn: 'Accounts Receivable', category: 'asset' },
    accountsPayable: { name: '買掛��', nameEn: 'Accounts Payable', category: 'liability' },
    bankAccount: { name: '普通預��', nameEn: 'Bank Account', category: 'asset' },
  },
} as const;

// =============================================================================
// レート制限設宁E
// =============================================================================

/** freee API レート制限ハンドリング設宁E*/
export const FREEE_RATE_LIMIT_CONFIG = {
  /** 403 発生時のクールダウン期間�E�ミリ秒！E*/
  globalCooldownMs: 10 * 60 * 1000, // 10 minutes
  /** 429 発生時の最大リトライ回数 */
  maxRetries: 3,
  /** リトライ間隔の持E��バックオフ基数�E�ミリ秒！E*/
  retryBackoffBaseMs: 2_000,
  /** ファイルボックス API のレート制限（リクエスチE刁E��E*/
  fileBoxRatePerMinute: 300,
  /** 通常 API の安�Eなリクエスト間隔（ミリ秒！E*/
  safeIntervalMs: 500,
} as const;

// =============================================================================
// ヘルパ�E関数
// =============================================================================

/**
 * 製品コードに対応すめEfreee 品目マッピングを取征E
 */
export function getFreeeItemMapping(productCode: string): FreeeProductItemMapping | null {
  return FREEE_PRODUCT_ITEM_MAPPINGS.find(m => m.productCode === productCode) ?? null;
}

/**
 * freee OAuth が設定済みかチェチE��
 */
export function isFreeeConfigured(): boolean {
  return !!(
    process.env[FREEE_OAUTH_CONFIG.envVars.clientId] &&
    process.env[FREEE_OAUTH_CONFIG.envVars.clientSecret] &&
    process.env[FREEE_OAUTH_CONFIG.envVars.companyId]
  );
}

/**
 * freee API の完�E URL を構篁E
 */
export function buildFreeeApiUrl(path: string): string {
  return `${FREEE_API_BASE_URL}${path}`;
}

// =============================================================================
// DB スキーマ参照
// =============================================================================

/**
 * freee 統合に忁E��な DB チE�Eブル
 */
export const FREEE_DB_SCHEMA_REFERENCE = {
  /** freee OAuth ト�Eクン管琁E*/
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

  /** freee 品目 ID キャチE��ュ�E�Eame ↁEid マッピング�E�E*/
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

  /** freee 勘定科目 ID キャチE��ュ */
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

  /** Stripe ↁEfreee 同期記録 */
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
// エクスポ�EチE
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

  // レート制陁E
  FREEE_RATE_LIMIT_CONFIG,

  // DB
  FREEE_DB_SCHEMA_REFERENCE,

  // ヘルパ�E
  getFreeeItemMapping,
  isFreeeConfigured,
  buildFreeeApiUrl,
};
