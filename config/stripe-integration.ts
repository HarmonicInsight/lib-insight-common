/**
 * HARMONIC insight Stripe 豎ｺ貂育ｵｱ蜷郁ｨｭ螳・
 *
 * ============================================================================
 * 縲占ｨｭ險域婿驥昴・
 * ============================================================================
 *
 * ## Stripe 繧・Phase 1・域律譛ｬ蝗ｽ蜀・・3譛医Μ繝ｪ繝ｼ繧ｹ MVP・峨・荳ｻ蜉帶ｱｺ貂医↓菴ｿ逕ｨ
 *
 * 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
 * 笏・                   Stripe 豎ｺ貂医ヵ繝ｭ繝ｼ                                 笏・
 * 笏・                                                                    笏・
 * 笏・ 竭 雉ｼ蜈･繝壹・繧ｸ        竭｡ Stripe Checkout      竭｢ Webhook 蜿嶺ｿ｡         笏・
 * 笏・ 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏・
 * 笏・ 笏・陬ｽ蜩・∈謚・     笏・竊・笏・Payment Link 笏・竊・笏・checkout.session.    笏・  笏・
 * 笏・ 笏・繝励Λ繝ｳ驕ｸ謚・   笏・  笏・or Checkout  笏・  笏・completed            笏・  笏・
 * 笏・ 笏・繝｡繝ｼ繝ｫ蜈･蜉・   笏・  笏・Session      笏・  笏・                     笏・  笏・
 * 笏・ 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏・
 * 笏・                                                                    笏・
 * 笏・ 竭｣ 繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦・   竭､ 繝｡繝ｼ繝ｫ騾∽ｿ｡          竭･ 蛻ｩ逕ｨ髢句ｧ・             笏・
 * 笏・ 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・         笏・
 * 笏・ 笏・繧ｭ繝ｼ逕滓・      笏・竊・笏・Resend 縺ｧ    笏・竊・笏・繧｢繝励Μ蜀・〒    笏・         笏・
 * 笏・ 笏・DB逋ｻ骭ｲ        笏・  笏・繧ｭ繝ｼ騾∽ｻ・    笏・  笏・繧｢繧ｯ繝・ぅ繝吶・繝遺狽          笏・
 * 笏・ 笏・逶｣譟ｻ繝ｭ繧ｰ      笏・  笏・             笏・  笏・             笏・         笏・
 * 笏・ 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・  笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏・         笏・
 * 笏・                                                                    笏・
 * 笏・ 笏笏 繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ譖ｴ譁ｰ 笏笏                                        笏・
 * 笏・ 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・ 笏・
 * 笏・ 笏・invoice.paid 竊・譁ｰ繧ｭ繝ｼ逋ｺ陦・竊・繝｡繝ｼ繝ｫ騾∽ｿ｡ 竊・閾ｪ蜍募・繧頑崛縺・      笏・ 笏・
 * 笏・ 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・ 笏・
 * 笏・                                                                    笏・
 * 笏・ 笏笏 AI 繧｢繝峨が繝ｳ雉ｼ蜈･ 笏笏                                              笏・
 * 笏・ 笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・ 笏・
 * 笏・ 笏・checkout.session.completed (mode: payment)                   笏・ 笏・
 * 笏・ 笏・竊・ai_addon_packs 縺ｫ逋ｻ骭ｲ 竊・繧ｯ繝ｬ繧ｸ繝・ヨ蜊ｳ譎ょ渚譏                 笏・ 笏・
 * 笏・ 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・ 笏・
 * 笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
 *
 * ## 蟇ｾ雎｡陬ｽ蜩・
 * - 蛟倶ｺｺ繝ｻ豕穂ｺｺ蜷代￠蝙・ INSS, IOSH, IOSD, INPY・・tripe + 閾ｪ遉ｾ繧ｵ繧､繝茨ｼ・
 * - 繧ｳ繝ｳ繧ｵ繝ｫ騾｣蜍募梛: INCA, INBT, INMV, INIG, IVIN・・tripe 隲区ｱよ嶌 or 謇句虚・・
 * - AI 繧｢繝峨が繝ｳ繝代ャ繧ｯ: 蜈ｨ陬ｽ蜩∝・騾・
 *
 * ## Stripe 陬ｽ蜩∵ｧ区・
 * - 蜷・｣ｽ蜩・ﾃ・蜷・・繝ｩ繝ｳ = 1 Stripe Product + 1 Stripe Price
 * - 繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ・亥ｹｴ髢難ｼ・= recurring・井ｾ｡譬ｼ縺ｯ Stripe 繝繝・す繝･繝懊・繝峨〒險ｭ螳夲ｼ・
 * - AI 繧｢繝峨が繝ｳ = one-time・井ｾ｡譬ｼ縺ｯ Stripe 繝繝・す繝･繝懊・繝峨〒險ｭ螳夲ｼ・
 */

import type { ProductCode, PlanCode } from './products';
import type { IssuanceChannel } from './license-server';

// =============================================================================
// 蝙句ｮ夂ｾｩ
// =============================================================================

/** Stripe 陬ｽ蜩√・繝・ヴ繝ｳ繧ｰ */
export interface StripeProductMapping {
  /** 陬ｽ蜩√さ繝ｼ繝・*/
  productCode: ProductCode;
  /** 繝励Λ繝ｳ繧ｳ繝ｼ繝・*/
  plan: PlanCode;
  /** Stripe Product ID・育腸蠅・､画焚縺九ｉ豕ｨ蜈･・・*/
  stripeProductIdEnvKey: string;
  /** Stripe Price ID・育腸蠅・､画焚縺九ｉ豕ｨ蜈･・・*/
  stripePriceIdEnvKey: string;
  /** 隱ｲ驥代ち繧､繝・*/
  billingType: 'recurring' | 'one_time';
  /** 隱ｲ驥鷹俣髫費ｼ・ecurring 縺ｮ蝣ｴ蜷茨ｼ・*/
  billingInterval?: 'year';
  /** 隱ｬ譏・*/
  description: string;
}

/** Stripe Webhook 繧､繝吶Φ繝育ｨｮ蛻･・亥・逅・ｯｾ雎｡・・*/
export type StripeWebhookEvent =
  | 'checkout.session.completed'     // 譁ｰ隕剰ｳｼ蜈･螳御ｺ・
  | 'invoice.paid'                   // 繧ｵ繝悶せ繧ｯ譖ｴ譁ｰ豎ｺ貂域・蜉・
  | 'invoice.payment_failed'         // 豎ｺ貂亥､ｱ謨・
  | 'customer.subscription.updated'  // 繧ｵ繝悶せ繧ｯ螟画峩・医い繝・・繧ｰ繝ｬ繝ｼ繝・繝繧ｦ繝ｳ繧ｰ繝ｬ繝ｼ繝会ｼ・
  | 'customer.subscription.deleted'; // 繧ｵ繝悶せ繧ｯ隗｣邏・

/** Stripe Checkout 繝｡繧ｿ繝・・繧ｿ・医Λ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦後↓蠢・ｦ√↑諠・ｱ・・*/
export interface StripeCheckoutMetadata {
  /** 陬ｽ蜩√さ繝ｼ繝・*/
  product_code: ProductCode;
  /** 繝励Λ繝ｳ繧ｳ繝ｼ繝・*/
  plan: PlanCode;
  /** 雉ｼ蜈･遞ｮ蛻･ */
  purchase_type: 'license' | 'addon';
  /** 繧｢繝峨が繝ｳ繝代ャ繧ｯ ID・・ddon 縺ｮ蝣ｴ蜷茨ｼ・*/
  addon_pack_id?: string;
  /** 繧｢繝峨が繝ｳ繝｢繝・Ν繝・ぅ繧｢・・ddon 縺ｮ蝣ｴ蜷茨ｼ・*/
  addon_model_tier?: 'standard' | 'premium';
  /** 鬘ｧ螳｢蜷・*/
  customer_name: string;
  /** 莨夂､ｾ蜷搾ｼ井ｻｻ諢擾ｼ・*/
  customer_company?: string;
  /** 繝ｭ繧ｱ繝ｼ繝ｫ */
  locale: 'ja' | 'en';
}

/** Stripe Webhook 蜃ｦ逅・ｵ先棡 */
export interface StripeWebhookHandlerResult {
  /** 蜃ｦ逅・・蜉溘° */
  success: boolean;
  /** 逋ｺ陦後メ繝｣繝阪Ν */
  channel: IssuanceChannel;
  /** 逋ｺ陦後＆繧後◆繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ・医Λ繧､繧ｻ繝ｳ繧ｹ雉ｼ蜈･縺ｮ蝣ｴ蜷茨ｼ・*/
  licenseKey?: string;
  /** 逋ｺ陦後＆繧後◆繧｢繝峨が繝ｳ繝代ャ繧ｯ ID・医い繝峨が繝ｳ雉ｼ蜈･縺ｮ蝣ｴ蜷茨ｼ・*/
  addonPackId?: string;
  /** 繧ｨ繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ */
  error?: string;
  /** 蜃ｦ逅・・隧ｳ邏ｰ */
  details?: string;
}

/** Stripe 鬘ｧ螳｢諠・ｱ・・heckout Session 縺九ｉ謚ｽ蜃ｺ・・*/
export interface StripeCustomerInfo {
  /** Stripe Customer ID */
  stripeCustomerId: string;
  /** 繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ */
  email: string;
  /** 鬘ｧ螳｢蜷・*/
  name: string;
  /** 莨夂､ｾ蜷・*/
  company?: string;
}

// =============================================================================
// Stripe 陬ｽ蜩√・萓｡譬ｼ繝槭ャ繝斐Φ繧ｰ
// =============================================================================

/**
 * Stripe 陬ｽ蜩√・繝・ヴ繝ｳ繧ｰ
 *
 * 縲宣㍾隕√全tripe Product ID / Price ID 縺ｯ迺ｰ蠅・､画焚縺九ｉ豕ｨ蜈･縺吶ｋ縲・
 * 縺薙％縺ｧ縺ｯ迺ｰ蠅・､画焚繧ｭ繝ｼ蜷阪・縺ｿ螳夂ｾｩ縺励！D 縺ｮ繝上・繝峨さ繝ｼ繝峨・陦後ｏ縺ｪ縺・・
 * 萓｡譬ｼ縺ｯ Stripe 繝繝・す繝･繝懊・繝我ｸ翫〒險ｭ螳壹☆繧具ｼ医ヱ繝ｼ繝医リ繝ｼ縺ｨ縺ｮ蜊碑ｭｰ縺ｫ繧医ｊ豎ｺ螳夲ｼ峨・
 *
 * 蜻ｽ蜷崎ｦ丞援:
 * - 迺ｰ蠅・､画焚: STRIPE_{PRODUCT_CODE}_{PLAN}_PRODUCT_ID / STRIPE_{PRODUCT_CODE}_{PLAN}_PRICE_ID
 * - 萓・ STRIPE_INSS_STD_PRODUCT_ID, STRIPE_INSS_STD_PRICE_ID
 */
export const STRIPE_PRODUCT_MAPPINGS: StripeProductMapping[] = [
  // --- InsightOffice Suite・・ier 3・・--
  // INSS (InsightOfficeSlide)
  {
    productCode: 'INSS',
    plan: 'STD',
    stripeProductIdEnvKey: 'STRIPE_INSS_STD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INSS_STD_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeSlide Standard (Annual)',
  },
  {
    productCode: 'INSS',
    plan: 'PRO',
    stripeProductIdEnvKey: 'STRIPE_INSS_PRO_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INSS_PRO_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeSlide Professional (Annual)',
  },

  // IOSH (InsightOfficeSheet)
  {
    productCode: 'IOSH',
    plan: 'STD',
    stripeProductIdEnvKey: 'STRIPE_IOSH_STD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSH_STD_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeSheet Standard (Annual)',
  },
  {
    productCode: 'IOSH',
    plan: 'PRO',
    stripeProductIdEnvKey: 'STRIPE_IOSH_PRO_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSH_PRO_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeSheet Professional (Annual)',
  },

  // IOSD (InsightOfficeDoc)
  {
    productCode: 'IOSD',
    plan: 'STD',
    stripeProductIdEnvKey: 'STRIPE_IOSD_STD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSD_STD_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeDoc Standard (Annual)',
  },
  {
    productCode: 'IOSD',
    plan: 'PRO',
    stripeProductIdEnvKey: 'STRIPE_IOSD_PRO_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_IOSD_PRO_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightOfficeDoc Professional (Annual)',
  },

  // INPY (InsightPy)
  {
    productCode: 'INPY',
    plan: 'STD',
    stripeProductIdEnvKey: 'STRIPE_INPY_STD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INPY_STD_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightPy Standard (Annual)',
  },
  {
    productCode: 'INPY',
    plan: 'PRO',
    stripeProductIdEnvKey: 'STRIPE_INPY_PRO_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_INPY_PRO_PRICE_ID',

    billingType: 'recurring',
    billingInterval: 'year',
    description: 'InsightPy Professional (Annual)',
  },

  // --- AI 繧｢繝峨が繝ｳ繝代ャ繧ｯ・亥・陬ｽ蜩∝・騾壹｛ne-time縲・繝・ぅ繧｢・・---
  {
    productCode: 'INSS',
    plan: 'STD', // 繝励Λ繝ｳ縺ｫ髢｢菫ゅ↑縺剰ｳｼ蜈･蜿ｯ閭ｽ・・etadata 縺ｧ蛻ｶ蠕｡・・
    stripeProductIdEnvKey: 'STRIPE_AI_ADDON_STANDARD_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_AI_ADDON_STANDARD_PRICE_ID',

    billingType: 'one_time',
    description: 'AI Credits - Standard 200 (up to Sonnet)',
  },
  {
    productCode: 'INSS',
    plan: 'STD', // 繝励Λ繝ｳ縺ｫ髢｢菫ゅ↑縺剰ｳｼ蜈･蜿ｯ閭ｽ・・etadata 縺ｧ蛻ｶ蠕｡・・
    stripeProductIdEnvKey: 'STRIPE_AI_ADDON_PREMIUM_PRODUCT_ID',
    stripePriceIdEnvKey: 'STRIPE_AI_ADDON_PREMIUM_PRICE_ID',

    billingType: 'one_time',
    description: 'AI Credits - Premium 200 (including Opus)',
  },
];

// =============================================================================
// Stripe Checkout 險ｭ螳・
// =============================================================================

/**
 * Stripe Checkout Session 菴懈・繝代Λ繝｡繝ｼ繧ｿ繝ｼ
 *
 * Payment Links 繧・MVP 縺ｧ菴ｿ逕ｨ縺励∝ｰ・擂逧・↓ Custom Checkout 縺ｫ遘ｻ陦悟庄閭ｽ縲・
 */
export const STRIPE_CHECKOUT_CONFIG = {
  /** 謌仙粥譎ゅ・繝ｪ繝繧､繝ｬ繧ｯ繝・URL */
  successUrl: 'https://account.harmonicinsight.com/purchase/success?session_id={CHECKOUT_SESSION_ID}',
  /** 繧ｭ繝｣繝ｳ繧ｻ繝ｫ譎ゅ・繝ｪ繝繧､繝ｬ繧ｯ繝・URL */
  cancelUrl: 'https://account.harmonicinsight.com/purchase/cancel',
  /** 蟇ｾ蠢憺夊ｲｨ */
  currency: 'jpy' as const,
  /** 閾ｪ蜍慕ｨ朱｡崎ｨ育ｮ・*/
  automaticTax: true,
  /** 隲区ｱょ・菴乗園縺ｮ蜿朱寔 */
  collectBillingAddress: true,
  /** 繝励Ο繝｢繝ｼ繧ｷ繝ｧ繝ｳ繧ｳ繝ｼ繝峨・險ｱ蜿ｯ */
  allowPromotionCodes: true,
  /** 蜷梧э譚｡鬆・URL */
  termsOfServiceUrl: 'https://harmonicinsight.com/terms',
  /** 繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ險ｭ螳・*/
  subscription: {
    /** 繝医Λ繧､繧｢繝ｫ譛滄俣・域律・俄・0 = 繝医Λ繧､繧｢繝ｫ縺ｪ縺暦ｼ亥挨騾・TRIAL 繧ｭ繝ｼ縺ｧ蟇ｾ蠢懶ｼ・*/
    trialPeriodDays: 0,
    /** 豎ｺ貂亥､ｱ謨玲凾縺ｮ迪ｶ莠域悄髢難ｼ域律・・*/
    paymentGracePeriodDays: 7,
    /** 閾ｪ蜍墓峩譁ｰ縺ｮ繝・ヵ繧ｩ繝ｫ繝・*/
    defaultAutoRenew: true,
  },
} as const;

// =============================================================================
// Webhook 繧､繝吶Φ繝医ワ繝ｳ繝峨Λ繝ｼ繝槭ャ繝斐Φ繧ｰ
// =============================================================================

/**
 * Stripe Webhook 繧､繝吶Φ繝・竊・蜃ｦ逅・・螳ｹ縺ｮ繝槭ャ繝斐Φ繧ｰ
 *
 * 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｵ繝ｼ繝舌・縺ｧ菴ｿ逕ｨ縺吶ｋ蜿ら・螳夂ｾｩ縲・
 */
export const STRIPE_WEBHOOK_HANDLERS: Record<StripeWebhookEvent, {
  /** 蜃ｦ逅・・隱ｬ譏・*/
  description: string;
  /** 蟇ｾ蠢懊☆繧狗匱陦後メ繝｣繝阪Ν */
  issuanceChannel: IssuanceChannel | null;
  /** 蜃ｦ逅・・螳ｹ */
  actions: string[];
}> = {
  'checkout.session.completed': {
    description: '譁ｰ隕剰ｳｼ蜈･螳御ｺ・窶・繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ逋ｺ陦・or 繧｢繝峨が繝ｳ繧ｯ繝ｬ繧ｸ繝・ヨ莉倅ｸ・,
    issuanceChannel: 'direct_stripe',
    actions: [
      'metadata 縺九ｉ product_code, plan, purchase_type 繧貞叙蠕・,
      'purchase_type === "license" 縺ｮ蝣ｴ蜷・',
      '  竊・邨ｱ蜷育匱陦後お繝ｳ繧ｸ繝ｳ縺ｧ繧ｭ繝ｼ逕滓・ + DB逋ｻ骭ｲ + 逶｣譟ｻ繝ｭ繧ｰ',
      '  竊・Resend 縺ｧ繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ繝｡繝ｼ繝ｫ騾∽ｿ｡',
      'purchase_type === "addon" 縺ｮ蝣ｴ蜷・',
      '  竊・ai_addon_packs 繝・・繝悶Ν縺ｫ繧ｯ繝ｬ繧ｸ繝・ヨ逋ｻ骭ｲ',
      '  竊・繝｡繝ｼ繝ｫ縺ｧ雉ｼ蜈･遒ｺ隱阪ｒ騾∽ｿ｡',
    ],
  },
  'invoice.paid': {
    description: '繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ譖ｴ譁ｰ豎ｺ貂域・蜉・窶・譁ｰ繧ｭ繝ｼ逋ｺ陦・,
    issuanceChannel: 'system_renewal',
    actions: [
      'subscription metadata 縺九ｉ陬ｽ蜩√・繝励Λ繝ｳ諠・ｱ繧貞叙蠕・,
      '譁ｰ縺励＞繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ繧堤函謌撰ｼ域怏蜉ｹ譛滄剞繧・+365譌･・・,
      'licenses 繝・・繝悶Ν縺ｮ expires_at 繧呈峩譁ｰ',
      '譖ｴ譁ｰ螳御ｺ・Γ繝ｼ繝ｫ繧帝∽ｿ｡・域眠繧ｭ繝ｼ + 譁ｰ譛牙柑譛滄剞・・,
    ],
  },
  'invoice.payment_failed': {
    description: '豎ｺ貂亥､ｱ謨・窶・迪ｶ莠域悄髢薙・譯亥・',
    issuanceChannel: null,
    actions: [
      '豎ｺ貂亥､ｱ謨励Γ繝ｼ繝ｫ繧帝∽ｿ｡・域峩譁ｰ繝ｪ繝ｳ繧ｯ莉倥″・・,
      'licenses 繝・・繝悶Ν縺ｮ payment_status 繧・"past_due" 縺ｫ譖ｴ譁ｰ',
      '迪ｶ莠域悄髢難ｼ・譌･・牙ｾ後↓繝ｩ繧､繧ｻ繝ｳ繧ｹ繧貞●豁｢',
    ],
  },
  'customer.subscription.updated': {
    description: '繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ螟画峩 窶・繝励Λ繝ｳ螟画峩繧貞渚譏',
    issuanceChannel: null,
    actions: [
      '螟画峩蠕後・繝励Λ繝ｳ繧堤音螳・,
      'licenses 繝・・繝悶Ν縺ｮ plan 繧呈峩譁ｰ',
      '繧｢繝・・繧ｰ繝ｬ繝ｼ繝・ 蜊ｳ譎ょ渚譏縲∝ｷｮ鬘阪・譌･蜑ｲ繧・,
      '繝繧ｦ繝ｳ繧ｰ繝ｬ繝ｼ繝・ 谺｡蝗樊峩譁ｰ譌･縺ｫ蜿肴丐',
    ],
  },
  'customer.subscription.deleted': {
    description: '繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ隗｣邏・窶・繝ｩ繧､繧ｻ繝ｳ繧ｹ譛滄剞蛻・ｌ莠育ｴ・,
    issuanceChannel: null,
    actions: [
      '隗｣邏・｢ｺ隱阪Γ繝ｼ繝ｫ繧帝∽ｿ｡',
      'licenses 繝・・繝悶Ν縺ｮ auto_renew 繧・false 縺ｫ譖ｴ譁ｰ',
      '迴ｾ蝨ｨ縺ｮ譛牙柑譛滄剞縺ｾ縺ｧ縺ｯ縺昴・縺ｾ縺ｾ蛻ｩ逕ｨ蜿ｯ閭ｽ',
      '譛牙柑譛滄剞蠕後↓ FREE 繝励Λ繝ｳ縺ｫ閾ｪ蜍慕ｧｻ陦・,
    ],
  },
};

// =============================================================================
// Stripe 迺ｰ蠅・､画焚荳隕ｧ
// =============================================================================

/**
 * 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｵ繝ｼ繝舌・縺ｧ蠢・ｦ√↑ Stripe 髢｢騾｣縺ｮ迺ｰ蠅・､画焚
 */
export const STRIPE_ENV_VARS = {
  /** Stripe Secret Key */
  secretKey: 'STRIPE_SECRET_KEY',
  /** Stripe Publishable Key・医け繝ｩ繧､繧｢繝ｳ繝育畑・・*/
  publishableKey: 'STRIPE_PUBLISHABLE_KEY',
  /** Stripe Webhook Signing Secret */
  webhookSecret: 'STRIPE_WEBHOOK_SECRET',
  /** Stripe Customer Portal URL・郁・蟾ｱ邂｡逅・畑・・*/
  customerPortalUrl: 'STRIPE_CUSTOMER_PORTAL_URL',
} as const;

// =============================================================================
// 繝倥Ν繝代・髢｢謨ｰ
// =============================================================================

/**
 * 陬ｽ蜩√・繝励Λ繝ｳ縺ｫ蟇ｾ蠢懊☆繧・Stripe 繝槭ャ繝斐Φ繧ｰ繧貞叙蠕・
 */
export function getStripeMapping(
  productCode: ProductCode,
  plan: PlanCode,
): StripeProductMapping | null {
  return STRIPE_PRODUCT_MAPPINGS.find(
    m => m.productCode === productCode && m.plan === plan && m.billingType === 'recurring',
  ) ?? null;
}

/**
 * AI 繧｢繝峨が繝ｳ縺ｮ Stripe 繝槭ャ繝斐Φ繧ｰ繧貞叙蠕・
 */
export function getAddonStripeMapping(): StripeProductMapping | null {
  return STRIPE_PRODUCT_MAPPINGS.find(
    m => m.billingType === 'one_time',
  ) ?? null;
}

/**
 * Stripe Checkout 繝｡繧ｿ繝・・繧ｿ繧堤函謌・
 */
export function buildCheckoutMetadata(params: {
  productCode: ProductCode;
  plan: PlanCode;
  purchaseType: 'license' | 'addon';
  customerName: string;
  customerCompany?: string;
  locale?: 'ja' | 'en';
  addonPackId?: string;
}): StripeCheckoutMetadata {
  return {
    product_code: params.productCode,
    plan: params.plan,
    purchase_type: params.purchaseType,
    addon_pack_id: params.addonPackId,
    customer_name: params.customerName,
    customer_company: params.customerCompany,
    locale: params.locale ?? 'ja',
  };
}

/**
 * Stripe Checkout Session 縺九ｉ繝｡繧ｿ繝・・繧ｿ繧貞ｮ牙・縺ｫ謚ｽ蜃ｺ
 *
 * @param metadata - Stripe Session 縺ｮ metadata 繧ｪ繝悶ず繧ｧ繧ｯ繝・
 * @returns 繝代・繧ｹ貂医∩繝｡繧ｿ繝・・繧ｿ縲∫┌蜉ｹ縺ｪ蝣ｴ蜷医・ null
 */
export function parseCheckoutMetadata(
  metadata: Record<string, string> | null,
): StripeCheckoutMetadata | null {
  if (!metadata) return null;

  const productCode = metadata.product_code;
  const plan = metadata.plan;
  const purchaseType = metadata.purchase_type;
  const customerName = metadata.customer_name;

  if (!productCode || !plan || !purchaseType || !customerName) {
    return null;
  }

  return {
    product_code: productCode as ProductCode,
    plan: plan as PlanCode,
    purchase_type: purchaseType as 'license' | 'addon',
    addon_pack_id: metadata.addon_pack_id,
    customer_name: customerName,
    customer_company: metadata.customer_company,
    locale: (metadata.locale as 'ja' | 'en') || 'ja',
  };
}

/**
 * Stripe 陬ｽ蜩√′險ｭ螳壽ｸ医∩縺九メ繧ｧ繝・け・育腸蠅・､画焚縺ｮ蟄伜惠遒ｺ隱搾ｼ・
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env[STRIPE_ENV_VARS.secretKey] &&
    process.env[STRIPE_ENV_VARS.webhookSecret]
  );
}

/**
 * Stripe Price ID 繧堤腸蠅・､画焚縺九ｉ蜿門ｾ・
 */
export function getStripePriceId(productCode: ProductCode, plan: PlanCode): string | null {
  const mapping = getStripeMapping(productCode, plan);
  if (!mapping) return null;
  return process.env[mapping.stripePriceIdEnvKey] ?? null;
}

/**
 * Stripe 縺ｧ雉ｼ蜈･蜿ｯ閭ｽ縺ｪ陬ｽ蜩√・繝励Λ繝ｳ縺ｮ荳隕ｧ繧貞叙蠕・
 */
export function getStripePurchasableProducts(): Array<{
  productCode: ProductCode;
  plan: PlanCode;
  billingType: 'recurring' | 'one_time';
}> {
  return STRIPE_PRODUCT_MAPPINGS
    .filter(m => m.billingType === 'recurring')
    .map(m => ({
      productCode: m.productCode,
      plan: m.plan,
      billingType: m.billingType,
    }));
}

// =============================================================================
// DB 繧ｹ繧ｭ繝ｼ繝槫盾辣ｧ・・upabase 繝・・繝悶Ν霑ｽ蜉・・
// =============================================================================

/**
 * Stripe 邨ｱ蜷医↓蠢・ｦ√↑霑ｽ蜉繝・・繝悶Ν繝ｻ繧ｫ繝ｩ繝
 */
export const STRIPE_DB_SCHEMA_REFERENCE = {
  /** Stripe 鬘ｧ螳｢繝槭ャ繝斐Φ繧ｰ */
  stripe_customers: `
    CREATE TABLE IF NOT EXISTS stripe_customers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      stripe_customer_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      company TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
    CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);
  `,

  /** Stripe 繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ險倬鹸 */
  stripe_subscriptions: `
    CREATE TABLE IF NOT EXISTS stripe_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      license_id UUID REFERENCES licenses(id),
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      stripe_customer_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      canceled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_stripe_subs_user ON stripe_subscriptions(user_id);
    CREATE INDEX idx_stripe_subs_stripe ON stripe_subscriptions(stripe_subscription_id);
    CREATE INDEX idx_stripe_subs_status ON stripe_subscriptions(status);
  `,

  /** Stripe 豎ｺ貂亥ｱ･豁ｴ */
  stripe_payments: `
    CREATE TABLE IF NOT EXISTS stripe_payments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      stripe_payment_intent_id TEXT,
      stripe_checkout_session_id TEXT,
      stripe_invoice_id TEXT,
      product_code TEXT NOT NULL,
      plan TEXT,
      purchase_type TEXT NOT NULL CHECK (purchase_type IN ('license', 'addon')),
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'jpy',
      status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_stripe_payments_user ON stripe_payments(user_id);
    CREATE INDEX idx_stripe_payments_session ON stripe_payments(stripe_checkout_session_id);
  `,

  /** licenses 繝・・繝悶Ν縺ｸ縺ｮ霑ｽ蜉繧ｫ繝ｩ繝 */
  licenses_stripe_columns: `
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active';
    -- payment_status: 'active' | 'past_due' | 'canceled' | 'unpaid'
  `,
} as const;

// =============================================================================
// 繧ｨ繧ｯ繧ｹ繝昴・繝・
// =============================================================================

export default {
  // 繝槭ャ繝斐Φ繧ｰ
  STRIPE_PRODUCT_MAPPINGS,
  STRIPE_CHECKOUT_CONFIG,
  STRIPE_WEBHOOK_HANDLERS,
  STRIPE_ENV_VARS,
  STRIPE_DB_SCHEMA_REFERENCE,

  // 繝倥Ν繝代・
  getStripeMapping,
  getAddonStripeMapping,
  buildCheckoutMetadata,
  parseCheckoutMetadata,
  isStripeConfigured,
  getStripePriceId,
  getStripePurchasableProducts,
};
