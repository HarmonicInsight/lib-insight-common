/**
 * Insight Series License Management - TypeScript
 * 繧ｪ繝輔Λ繧､繝ｳ繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ繝｢繧ｸ繝･繝ｼ繝ｫ
 *
 * 繧ｭ繝ｼ蠖｢蠑・ PPPP-PLAN-YYMM-HASH-SIG1-SIG2
 */

// =============================================================================
// 蝙句ｮ夂ｾｩ
// =============================================================================

export type ProductCode = 'INSS' | 'IOSH' | 'IOSD' | 'INPY' | 'INMV' | 'INBT' | 'INCA' | 'INIG' | 'IVIN';
export type Plan = 'TRIAL' | 'STD' | 'PRO';
export type ErrorCode = 'E001' | 'E002' | 'E003' | 'E004' | 'E005' | 'E006';

export interface AuthResult {
  success: boolean;
  product?: ProductCode;
  plan?: Plan;
  expires?: Date;
  errorCode?: ErrorCode;
  message?: string;
}

export type LicenseStatusType = 'valid' | 'expiring_soon' | 'expired' | 'not_found';

export interface StatusResult {
  status: LicenseStatusType;
  isValid: boolean;
  product?: ProductCode;
  plan?: Plan;
  expires?: Date;
  daysRemaining?: number;
  email?: string;
}

export interface LicenseData {
  email: string;
  key: string;
  product: string;
  productCode: ProductCode;
  plan: Plan;
  expires: string;
  verifiedAt: string;
}

// =============================================================================
// 螳壽焚
// =============================================================================

export const PRODUCT_NAMES: Record<ProductCode, string> = {
  INSS: 'InsightOfficeSlide',
  IOSH: 'InsightOfficeSheet',
  IOSD: 'InsightOfficeDoc',
  INPY: 'InsightPy',
  INMV: 'InsightCast',
  INBT: 'InsightBot',
  INCA: 'InsightNoCodeAnalyzer',
  INIG: 'InsightImageGen',
  IVIN: 'InterviewInsight',
};

export const PLAN_NAMES: Record<Plan, string> = {
  TRIAL: '繝医Λ繧､繧｢繝ｫ',
  STD: 'Standard',
  PRO: 'Pro',
};

export const PRODUCT_PLANS: Record<string, ProductCode[]> = {
  InsightOfficeSlide: ['INSS'],
  InsightOfficeSheet: ['IOSH'],
  InsightOfficeDoc: ['IOSD'],
  InsightPy: ['INPY'],
  InsightCast: ['INMV'],
  InsightBot: ['INBT'],
  InsightNoCodeAnalyzer: ['INCA'],
  InsightImageGen: ['INIG'],
  InterviewInsight: ['IVIN'],
};

export const TRIAL_DAYS = 14;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  E001: '繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ蠖｢蠑上′豁｣縺励￥縺ゅｊ縺ｾ縺帙ｓ',
  E002: '繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺檎┌蜉ｹ縺ｧ縺・,
  E003: '繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺御ｸ閾ｴ縺励∪縺帙ｓ',
  E004: '繝ｩ繧､繧ｻ繝ｳ繧ｹ縺ｮ譛牙柑譛滄剞縺悟・繧後※縺・∪縺・,
  E005: '縺薙・繝ｩ繧､繧ｻ繝ｳ繧ｹ縺ｯ {product} 逕ｨ縺ｧ縺・,
  E006: '繝医Λ繧､繧｢繝ｫ譛滄俣縺ｯ邨ゆｺ・＠縺ｦ縺・∪縺・,
};

// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ豁｣隕剰｡ｨ迴ｾ
const LICENSE_KEY_REGEX = /^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN)-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

// 鄂ｲ蜷咲畑繧ｷ繝ｼ繧ｯ繝ｬ繝・ヨ繧ｭ繝ｼ
const SECRET_KEY = 'insight-series-license-secret-2026';

// =============================================================================
// 鄂ｲ蜷阪・繝上ャ繧ｷ繝･ (繝悶Λ繧ｦ繧ｶ莠呈鋤)
// =============================================================================

async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await crypto.subtle.digest('SHA-256', data);
}

function arrayBufferToBase32(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

async function generateEmailHash(email: string): Promise<string> {
  const hash = await sha256(email.toLowerCase().trim());
  return arrayBufferToBase32(hash).substring(0, 4);
}

async function hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await crypto.subtle.sign('HMAC', cryptoKey, messageData);
}

async function generateSignature(data: string): Promise<string> {
  const sig = await hmacSha256(SECRET_KEY, data);
  return arrayBufferToBase32(sig).substring(0, 8);
}

async function verifySignature(data: string, signature: string): Promise<boolean> {
  const expected = await generateSignature(data);
  return expected === signature;
}

// =============================================================================
// 繧ｹ繝医Ξ繝ｼ繧ｸ繧､繝ｳ繧ｿ繝ｼ繝輔ぉ繝ｼ繧ｹ
// =============================================================================

export interface LicenseStorage {
  load(): Promise<LicenseData | null>;
  save(data: LicenseData): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 繝ｭ繝ｼ繧ｫ繝ｫ繧ｹ繝医Ξ繝ｼ繧ｸ繝吶・繧ｹ縺ｮ繧ｹ繝医Ξ繝ｼ繧ｸ・医ヶ繝ｩ繧ｦ繧ｶ/Tauri逕ｨ・・
 */
export class LocalStorageAdapter implements LicenseStorage {
  private key: string;

  constructor(productName: string) {
    this.key = `insight-license-${productName}`;
  }

  async load(): Promise<LicenseData | null> {
    try {
      const encoded = localStorage.getItem(this.key);
      if (!encoded) return null;
      const decoded = atob(encoded);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  async save(data: LicenseData): Promise<void> {
    const encoded = btoa(JSON.stringify(data));
    localStorage.setItem(this.key, encoded);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

// =============================================================================
// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ
// =============================================================================

export interface LicenseManagerOptions {
  product: string;
  storage?: LicenseStorage;
}

/**
 * 繝ｩ繧､繧ｻ繝ｳ繧ｹ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ
 */
export class LicenseManager {
  private product: string;
  private storage: LicenseStorage;
  private cachedData: LicenseData | null = null;

  constructor(options: LicenseManagerOptions) {
    this.product = options.product;
    this.storage = options.storage || new LocalStorageAdapter(options.product);
  }

  private getValidProductCodes(): ProductCode[] {
    return PRODUCT_PLANS[this.product] || [];
  }

  /**
   * 繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ
   */
  async authenticate(email: string, key: string): Promise<AuthResult> {
    email = email.trim().toLowerCase();
    key = key.trim().toUpperCase();

    // 1. 繧ｭ繝ｼ蠖｢蠑上メ繧ｧ繝・け
    const match = key.match(LICENSE_KEY_REGEX);
    if (!match) {
      return {
        success: false,
        errorCode: 'E001',
        message: ERROR_MESSAGES.E001,
      };
    }

    const [, productCodeStr, planStr, yymm, emailHash, sig1, sig2] = match;
    const productCode = productCodeStr as ProductCode;
    const plan = planStr as Plan;
    const signature = sig1 + sig2;

    // 2. 鄂ｲ蜷肴､懆ｨｼ
    const signData = `${productCodeStr}-${planStr}-${yymm}-${emailHash}`;
    try {
      if (!(await verifySignature(signData, signature))) {
        return {
          success: false,
          errorCode: 'E002',
          message: ERROR_MESSAGES.E002,
        };
      }
    } catch {
      return {
        success: false,
        errorCode: 'E002',
        message: ERROR_MESSAGES.E002,
      };
    }

    // 3. 繝｡繝ｼ繝ｫ繝上ャ繧ｷ繝･辣ｧ蜷・
    const expectedHash = await generateEmailHash(email);
    if (emailHash !== expectedHash) {
      return {
        success: false,
        errorCode: 'E003',
        message: ERROR_MESSAGES.E003,
      };
    }

    // 4. 譛牙柑譛滄剞繝√ぉ繝・け
    const year = 2000 + parseInt(yymm.substring(0, 2), 10);
    const month = parseInt(yymm.substring(2, 4), 10);
    const expires = new Date(year, month, 0, 23, 59, 59); // 譛域忰

    if (new Date() > expires) {
      return {
        success: false,
        product: productCode,
        plan,
        expires,
        errorCode: 'E004',
        message: ERROR_MESSAGES.E004,
      };
    }

    // 5. 陬ｽ蜩√さ繝ｼ繝峨メ繧ｧ繝・け
    const validCodes = this.getValidProductCodes();
    if (!validCodes.includes(productCode)) {
      return {
        success: false,
        product: productCode,
        plan,
        expires,
        errorCode: 'E005',
        message: ERROR_MESSAGES.E005.replace('{product}', PRODUCT_NAMES[productCode]),
      };
    }

    // 隱崎ｨｼ謌仙粥 竊・繝ｭ繝ｼ繧ｫ繝ｫ菫晏ｭ・
    const data: LicenseData = {
      email,
      key,
      product: PRODUCT_NAMES[productCode],
      productCode,
      plan,
      expires: expires.toISOString().split('T')[0],
      verifiedAt: new Date().toISOString(),
    };

    await this.storage.save(data);
    this.cachedData = data;

    return {
      success: true,
      product: productCode,
      plan,
      expires,
    };
  }

  /**
   * 繝ｩ繧､繧ｻ繝ｳ繧ｹ迥ｶ諷九ｒ遒ｺ隱・
   */
  async checkStatus(): Promise<StatusResult> {
    const data = this.cachedData || (await this.storage.load());

    if (!data) {
      return {
        status: 'not_found',
        isValid: false,
      };
    }

    this.cachedData = data;

    try {
      const expires = new Date(data.expires + 'T23:59:59');
      const now = new Date();
      const daysRemaining = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (now > expires) {
        return {
          status: 'expired',
          isValid: false,
          product: data.productCode,
          plan: data.plan,
          expires,
          daysRemaining: 0,
          email: data.email,
        };
      }

      const status: LicenseStatusType = daysRemaining <= 30 ? 'expiring_soon' : 'valid';

      return {
        status,
        isValid: true,
        product: data.productCode,
        plan: data.plan,
        expires,
        daysRemaining,
        email: data.email,
      };
    } catch {
      return {
        status: 'not_found',
        isValid: false,
      };
    }
  }

  /**
   * 繝ｩ繧､繧ｻ繝ｳ繧ｹ諠・ｱ繧偵け繝ｪ繧｢
   */
  async clearLicense(): Promise<void> {
    this.cachedData = null;
    await this.storage.clear();
  }

  /**
   * 谿九ｊ譌･謨ｰ繧貞叙蠕・
   */
  async getDaysRemaining(): Promise<number> {
    const status = await this.checkStatus();
    return status.daysRemaining || 0;
  }
}

// =============================================================================
// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ逕滓・・磯幕逋ｺ閠・畑繝ｻNode.js迺ｰ蠅・ｼ・
// =============================================================================

export interface GenerateOptions {
  productCode: ProductCode;
  plan: Plan;
  email: string;
  expires: Date;
}

/**
 * Node.js Buffer 繧・Base32 (RFC 4648) 縺ｫ繧ｨ繝ｳ繧ｳ繝ｼ繝・
 * 窶ｻ 繝悶Λ繧ｦ繧ｶ迚・arrayBufferToBase32 縺ｨ蜷御ｸ縺ｮ繧｢繝ｫ繧ｴ繝ｪ繧ｺ繝
 */
function bufferToBase32(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ繧堤函謌撰ｼ亥酔譛溽沿繝ｻCLI繝・・繝ｫ逕ｨ・・
 * 窶ｻ Node.js 迺ｰ蠅・〒縺ｮ縺ｿ菴ｿ逕ｨ
 */
export function generateLicenseKeySync(options: GenerateOptions): string {
  // Node.js crypto 繧剃ｽｿ逕ｨ
  const crypto = require('crypto');
  const { productCode, plan, email, expires } = options;

  // YYMM蠖｢蠑・
  const yy = String(expires.getFullYear()).substring(2);
  const mm = String(expires.getMonth() + 1).padStart(2, '0');
  const yymm = yy + mm;

  // 繝｡繝ｼ繝ｫ繝上ャ繧ｷ繝･・・ase32・・
  const emailHashRaw = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest();
  const emailHash = bufferToBase32(emailHashRaw).substring(0, 4).toUpperCase();

  // 鄂ｲ蜷搾ｼ・ase32・・
  const signData = `${productCode}-${plan}-${yymm}-${emailHash}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(signData);
  const sig = hmac.digest();
  const signature = bufferToBase32(sig).substring(0, 8).toUpperCase();
  const sig1 = signature.substring(0, 4);
  const sig2 = signature.substring(4, 8);

  return `${productCode}-${plan}-${yymm}-${emailHash}-${sig1}-${sig2}`;
}

/**
 * 繝医Λ繧､繧｢繝ｫ繧ｭ繝ｼ繧堤函謌撰ｼ亥酔譛溽沿・・
 */
export function generateTrialKeySync(productCode: ProductCode, email: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + TRIAL_DAYS);
  return generateLicenseKeySync({ productCode, plan: 'TRIAL', email, expires });
}

export default LicenseManager;
