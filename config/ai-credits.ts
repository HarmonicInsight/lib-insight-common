/**
 * Harmonic Insight AIカウントライセンス定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * ## コンセプト: ゲーム課金モデル
 *
 * 1. 製品ライセンスとAI課金は完全に独立した収益単位
 * 2. 無料枠で「賢い」を体感させ、追加課金へ誘導
 * 3. ヘビーユーザー（開発者等）が売上を押し上げる構造
 * 4. カウント購入制のため、構造的に赤字にならない
 *
 * ## モデル選定: Claude Opus
 *
 * - ユーザー体験が最優先。「このAI賢い」が継続率と課金率に直結
 * - Sonnetとの原価差は体験への投資
 * - カウント購入制のためOpusでも粗利62.5%以上を維持
 *
 * ## 区分別AI提供方針
 *
 * - 【A】コンサル連動型: AI込み・無制限（製品価格に含む）
 * - 【B】スタンドアロン型: 無料枠 + カウント追加購入
 *
 * ============================================================================
 * 損益分析
 * ============================================================================
 *
 * ### API原価（Claude Opus 4.5）
 * - Input:  $15.00 / 1Mトークン
 * - Output: $75.00 / 1Mトークン
 * - 1回あたり平均: ~$0.125（¥18.75）
 *
 * ### カウント単価
 * - ¥10,000 / 200カウント = ¥50/カウント
 * - 原価 ¥18.75 → 粗利 ¥31.25/カウント（62.5%）
 *
 * ### 無料枠原価（1,000ユーザー時）
 * - 1,000人 × 20回 × 12ヶ月 × ¥18.75 = ¥4,500,000/年
 * - 売上1億超に対して約4%。マーケティング費用として許容範囲。
 *
 * ### 1,000ユーザー時シミュレーション（全Opus）
 * - 製品売上:     ¥49,800,000
 * - AI課金売上:   ¥64,500,000
 * - AI原価:      -¥25,987,500
 * - 粗利:         ¥88,312,500（77%）
 */

import type { ProductCode } from './products';
import type { SalesChannel } from './pricing';

// =============================================================================
// 型定義
// =============================================================================

/** AIモデル */
export type AIModel = 'claude-opus-4-5' | 'claude-sonnet-4-5';

/** AIカウントパック定義 */
export interface AICreditPack {
  /** パックID */
  id: string;
  /** パック名 */
  name: string;
  /** パック名（日本語） */
  nameJa: string;
  /** カウント数 */
  credits: number;
  /** 価格（税抜） */
  price: number;
  /** 通貨 */
  currency: 'JPY' | 'USD';
  /** 1カウントあたり単価 */
  unitPrice: number;
  /** 対象: individual=個人購入, team=チーム購入 */
  target: 'individual' | 'team' | 'enterprise';
  /** 備考 */
  notes?: string;
}

/** AI無料枠定義 */
export interface AIFreeQuota {
  /** 月間無料カウント数 */
  monthlyCredits: number;
  /** 使用モデル */
  model: AIModel;
  /** 繰り越し可否 */
  carryOver: false;
  /** 備考 */
  notes: string;
}

/** 製品別AI提供方針 */
export interface AIProvisionPolicy {
  /** 製品コード */
  productCode: ProductCode;
  /** AI提供タイプ */
  type: 'included_unlimited' | 'free_quota_plus_purchase';
  /** 使用モデル */
  model: AIModel;
  /** 無料枠（type='free_quota_plus_purchase' の場合） */
  freeQuota?: AIFreeQuota;
  /** 説明 */
  description: string;
  /** 説明（日本語） */
  descriptionJa: string;
}

/** AI利用ログ（ライセンスサーバー連携用） */
export interface AICreditUsageRecord {
  /** ユーザーID */
  userId: string;
  /** 製品コード */
  productCode: ProductCode;
  /** 使用モデル */
  model: AIModel;
  /** 消費カウント数 */
  creditsUsed: number;
  /** タスク種別 */
  taskType: AITaskType;
  /** Input トークン数 */
  inputTokens: number;
  /** Output トークン数 */
  outputTokens: number;
  /** API原価（USD） */
  apiCostUsd: number;
  /** タイムスタンプ */
  timestamp: string;
}

/** AIタスク種別 */
export type AITaskType =
  | 'formula_generation'    // 数式・関数生成
  | 'data_analysis'         // データ分析
  | 'summarization'         // 要約
  | 'translation'           // 翻訳
  | 'document_generation'   // ドキュメント生成
  | 'code_generation'       // コード生成（InsightPy）
  | 'code_explanation'      // コード解説
  | 'chat'                  // チャット（質問応答）
  | 'rpa_analysis'          // RPA解析（INCA）
  | 'image_generation'      // 画像生成（INIG）
  | 'video_generation'      // 動画生成（INMV）
  | 'other';

// =============================================================================
// モデル定義
// =============================================================================

/** 利用可能なAIモデル */
export const AI_MODELS: Record<AIModel, {
  name: string;
  nameJa: string;
  inputPricePerMToken: number;
  outputPricePerMToken: number;
  averageCostPerRequest: number;
  currency: 'USD';
}> = {
  'claude-opus-4-5': {
    name: 'Claude Opus 4.5',
    nameJa: 'Claude Opus 4.5',
    inputPricePerMToken: 15.00,
    outputPricePerMToken: 75.00,
    averageCostPerRequest: 0.125,  // ~$0.125/回
    currency: 'USD',
  },
  'claude-sonnet-4-5': {
    name: 'Claude Sonnet 4.5',
    nameJa: 'Claude Sonnet 4.5',
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
    averageCostPerRequest: 0.025,  // ~$0.025/回
    currency: 'USD',
  },
};

/** デフォルトモデル（全製品共通） */
export const DEFAULT_AI_MODEL: AIModel = 'claude-opus-4-5';

// =============================================================================
// 無料枠定義
// =============================================================================

/**
 * スタンドアロン型製品のAI無料枠
 *
 * 全ユーザーに月20回のOpus利用を無料提供。
 * 「賢い」を体感させ、追加課金への導線とする。
 *
 * 原価: 20回 × ¥18.75 = ¥375/月/ユーザー（¥4,500/年）
 */
export const STANDALONE_FREE_QUOTA: AIFreeQuota = {
  monthlyCredits: 20,
  model: 'claude-opus-4-5',
  carryOver: false,
  notes: '毎月1日にリセット。未使用分の繰り越しなし。',
};

// =============================================================================
// カウントパック定義
// =============================================================================

/**
 * AIカウント追加購入パック
 *
 * ゲーム課金モデル:
 * - 小額から買える（心理的ハードル低い）
 * - 大量購入で割安（ヘビーユーザー優遇）
 * - 上限なし（何度でも買える）
 */
export const AI_CREDIT_PACKS: AICreditPack[] = [
  // ── 個人向け ──────────────────────────────────────
  {
    id: 'individual_200',
    name: '200 Credits',
    nameJa: '200カウント',
    credits: 200,
    price: 10_000,
    currency: 'JPY',
    unitPrice: 50,
    target: 'individual',
    notes: '基本パック',
  },
  {
    id: 'individual_500',
    name: '500 Credits',
    nameJa: '500カウント',
    credits: 500,
    price: 22_000,
    currency: 'JPY',
    unitPrice: 44,
    target: 'individual',
    notes: '12%OFF',
  },
  {
    id: 'individual_1000',
    name: '1,000 Credits',
    nameJa: '1,000カウント',
    credits: 1_000,
    price: 40_000,
    currency: 'JPY',
    unitPrice: 40,
    target: 'individual',
    notes: '20%OFF',
  },

  // ── チーム向け ────────────────────────────────────
  {
    id: 'team_5000',
    name: '5,000 Credits (Team)',
    nameJa: '5,000カウント（チーム）',
    credits: 5_000,
    price: 175_000,
    currency: 'JPY',
    unitPrice: 35,
    target: 'team',
    notes: '30%OFF。チーム内でシェア可能。',
  },
  {
    id: 'team_10000',
    name: '10,000 Credits (Team)',
    nameJa: '10,000カウント（チーム）',
    credits: 10_000,
    price: 300_000,
    currency: 'JPY',
    unitPrice: 30,
    target: 'team',
    notes: '40%OFF。チーム内でシェア可能。',
  },

  // ── エンタープライズ ──────────────────────────────
  {
    id: 'enterprise_50000',
    name: '50,000 Credits (Enterprise)',
    nameJa: '50,000カウント（エンタープライズ）',
    credits: 50_000,
    price: 1_250_000,
    currency: 'JPY',
    unitPrice: 25,
    target: 'enterprise',
    notes: '50%OFF。全社利用。個別見積も可。',
  },
];

/** USD参考価格（グローバル展開用） */
export const AI_CREDIT_PACKS_USD: AICreditPack[] = [
  {
    id: 'individual_200_usd',
    name: '200 Credits',
    nameJa: '200カウント',
    credits: 200,
    price: 65,
    currency: 'USD',
    unitPrice: 0.325,
    target: 'individual',
  },
  {
    id: 'individual_500_usd',
    name: '500 Credits',
    nameJa: '500カウント',
    credits: 500,
    price: 145,
    currency: 'USD',
    unitPrice: 0.29,
    target: 'individual',
    notes: '11%OFF',
  },
  {
    id: 'individual_1000_usd',
    name: '1,000 Credits',
    nameJa: '1,000カウント',
    credits: 1_000,
    price: 265,
    currency: 'USD',
    unitPrice: 0.265,
    target: 'individual',
    notes: '18%OFF',
  },
];

// =============================================================================
// 製品別AI提供方針
// =============================================================================

/**
 * 製品ごとのAI提供ポリシー
 *
 * 【A】コンサル連動型: AI込み・無制限
 *   - 製品価格が¥98万〜398万。AI原価は誤差。
 *   - 別課金はケチくさい。込みで使い放題。
 *
 * 【B】スタンドアロン型: 無料枠 + カウント追加購入
 *   - 無料枠20回/月で体験させる
 *   - 開発でガンガン使う人は追加購入
 */
export const AI_PROVISION_POLICIES: Record<ProductCode, AIProvisionPolicy> = {
  // ── 【A】コンサル連動型: AI込み・無制限 ──────────
  INCA: {
    productCode: 'INCA',
    type: 'included_unlimited',
    model: 'claude-opus-4-5',
    description: 'AI included unlimited. No separate billing.',
    descriptionJa: 'AI込み・無制限。別課金なし。',
  },
  INBT: {
    productCode: 'INBT',
    type: 'included_unlimited',
    model: 'claude-opus-4-5',
    description: 'AI included unlimited. No separate billing.',
    descriptionJa: 'AI込み・無制限。別課金なし。',
  },
  INMV: {
    productCode: 'INMV',
    type: 'included_unlimited',
    model: 'claude-opus-4-5',
    description: 'AI included unlimited. No separate billing.',
    descriptionJa: 'AI込み・無制限。別課金なし。',
  },
  INIG: {
    productCode: 'INIG',
    type: 'included_unlimited',
    model: 'claude-opus-4-5',
    description: 'AI included unlimited. No separate billing.',
    descriptionJa: 'AI込み・無制限。別課金なし。',
  },

  // ── 【B】スタンドアロン型: 無料枠 + 購入 ─────────
  IOSH: {
    productCode: 'IOSH',
    type: 'free_quota_plus_purchase',
    model: 'claude-opus-4-5',
    freeQuota: STANDALONE_FREE_QUOTA,
    description: '20 free AI credits/month + purchase additional packs',
    descriptionJa: '月20回無料 + カウント追加購入',
  },
  IODC: {
    productCode: 'IODC',
    type: 'free_quota_plus_purchase',
    model: 'claude-opus-4-5',
    freeQuota: STANDALONE_FREE_QUOTA,
    description: '20 free AI credits/month + purchase additional packs',
    descriptionJa: '月20回無料 + カウント追加購入',
  },
  IOSL: {
    productCode: 'IOSL',
    type: 'free_quota_plus_purchase',
    model: 'claude-opus-4-5',
    freeQuota: STANDALONE_FREE_QUOTA,
    description: '20 free AI credits/month + purchase additional packs',
    descriptionJa: '月20回無料 + カウント追加購入',
  },
  INPY: {
    productCode: 'INPY',
    type: 'free_quota_plus_purchase',
    model: 'claude-opus-4-5',
    freeQuota: STANDALONE_FREE_QUOTA,
    description: '20 free AI credits/month + purchase additional packs',
    descriptionJa: '月20回無料 + カウント追加購入',
  },
};

// =============================================================================
// カウント有効期限
// =============================================================================

/** カウントの有効期限ルール */
export const CREDIT_EXPIRY_RULES = {
  /** 無料枠: 毎月リセット、繰り越しなし */
  freeQuota: {
    expiryType: 'monthly_reset' as const,
    carryOver: false,
  },
  /** 購入カウント: 購入日から12ヶ月有効 */
  purchased: {
    expiryType: 'from_purchase' as const,
    validDays: 365,
  },
  /** エンタープライズ: 契約期間に準拠 */
  enterprise: {
    expiryType: 'contract_based' as const,
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品のAI提供方針を取得
 */
export function getAIPolicy(productCode: ProductCode): AIProvisionPolicy {
  return AI_PROVISION_POLICIES[productCode];
}

/**
 * AIが無制限（込み）の製品かどうか
 */
export function isAIUnlimited(productCode: ProductCode): boolean {
  return AI_PROVISION_POLICIES[productCode].type === 'included_unlimited';
}

/**
 * カウントパックを取得（通貨指定）
 */
export function getCreditPacks(currency: 'JPY' | 'USD' = 'JPY', target?: 'individual' | 'team' | 'enterprise'): AICreditPack[] {
  const packs = currency === 'USD' ? AI_CREDIT_PACKS_USD : AI_CREDIT_PACKS;
  if (target) {
    return packs.filter(p => p.target === target);
  }
  return packs;
}

/**
 * 指定カウント数に最適なパックを提案
 */
export function recommendPack(desiredCredits: number, currency: 'JPY' | 'USD' = 'JPY'): AICreditPack | null {
  const packs = getCreditPacks(currency);
  // desiredCredits 以上で最もコスパが良いパックを返す
  const candidates = packs.filter(p => p.credits >= desiredCredits);
  if (candidates.length === 0) {
    // 最大パックを返す
    return packs[packs.length - 1] || null;
  }
  return candidates.reduce((best, pack) =>
    pack.unitPrice < best.unitPrice ? pack : best
  );
}

/**
 * カウント消費の原価を計算
 */
export function calculateCreditCost(credits: number, model: AIModel = DEFAULT_AI_MODEL): {
  apiCostUsd: number;
  apiCostJpy: number;
  revenueJpy: number;
  profitJpy: number;
  marginPercent: number;
} {
  const modelInfo = AI_MODELS[model];
  const apiCostUsd = credits * modelInfo.averageCostPerRequest;
  const apiCostJpy = apiCostUsd * 150; // 参考レート
  const revenueJpy = credits * 50;     // ¥50/カウント（基本単価）
  const profitJpy = revenueJpy - apiCostJpy;
  const marginPercent = (profitJpy / revenueJpy) * 100;

  return { apiCostUsd, apiCostJpy, revenueJpy, profitJpy, marginPercent };
}

/**
 * 月間無料枠の原価を計算（ユーザー数指定）
 */
export function calculateFreeQuotaCost(userCount: number, model: AIModel = DEFAULT_AI_MODEL): {
  monthlyCostJpy: number;
  annualCostJpy: number;
  perUserAnnualCostJpy: number;
} {
  const modelInfo = AI_MODELS[model];
  const monthlyCredits = STANDALONE_FREE_QUOTA.monthlyCredits;
  const monthlyCostUsd = userCount * monthlyCredits * modelInfo.averageCostPerRequest;
  const monthlyCostJpy = monthlyCostUsd * 150;

  return {
    monthlyCostJpy: Math.round(monthlyCostJpy),
    annualCostJpy: Math.round(monthlyCostJpy * 12),
    perUserAnnualCostJpy: Math.round((monthlyCostJpy * 12) / userCount),
  };
}

// =============================================================================
// ライセンスサーバーAPI連携
// =============================================================================

/** AIカウント関連のAPIエンドポイント */
export const AI_CREDIT_ENDPOINTS = {
  /** カウント残高照会 */
  balance: '/api/ai-credits/balance',
  /** カウント購入 */
  purchase: '/api/ai-credits/purchase',
  /** カウント消費（AI利用時） */
  consume: '/api/ai-credits/consume',
  /** 利用履歴 */
  history: '/api/ai-credits/history',
  /** チームカウント管理 */
  teamManage: '/api/ai-credits/team',
  /** 無料枠リセット（cron） */
  resetFreeQuota: '/api/ai-credits/reset-free-quota',
} as const;

/** DB テーブル定義（Supabase） */
export const AI_CREDIT_TABLES = {
  /** カウント残高 */
  balances: 'ai_credit_balances',
  /** 購入履歴 */
  purchases: 'ai_credit_purchases',
  /** 消費履歴 */
  usage: 'ai_credit_usage',
  /** チームプール */
  teamPools: 'ai_credit_team_pools',
} as const;

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // モデル
  AI_MODELS,
  DEFAULT_AI_MODEL,

  // 無料枠
  STANDALONE_FREE_QUOTA,

  // カウントパック
  AI_CREDIT_PACKS,
  AI_CREDIT_PACKS_USD,

  // 製品別ポリシー
  AI_PROVISION_POLICIES,

  // 有効期限
  CREDIT_EXPIRY_RULES,

  // API
  AI_CREDIT_ENDPOINTS,
  AI_CREDIT_TABLES,

  // ヘルパー
  getAIPolicy,
  isAIUnlimited,
  getCreditPacks,
  recommendPack,
  calculateCreditCost,
  calculateFreeQuotaCost,
};
