/**
 * Insight Series License Management - TypeScript
 * オフラインライセンス認証モジュール
 *
 * キー形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2
 */

// =============================================================================
// 型定義
// =============================================================================

export type ProductCode = 'INSS' | 'IOSH' | 'IOSD' | 'INPY' | 'INMV' | 'INBT' | 'INCA' | 'INIG' | 'IVIN' | 'ISOF';
export type Plan = 'FREE' | 'TRIAL' | 'BIZ' | 'ENT';
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
// 定数
// =============================================================================

export const PRODUCT_NAMES: Record<ProductCode, string> = {
  INSS: 'Insight Deck Quality Gate',
  IOSH: 'Insight Performance Management',
  IOSD: 'Insight AI Doc Factory',
  INPY: 'InsightPy',
  INMV: 'Insight Training Studio',
  INBT: 'InsightBot',
  INCA: 'InsightNoCodeAnalyzer',
  INIG: 'InsightImageGen',
  IVIN: 'InterviewInsight',
  ISOF: 'InsightSeniorOffice',
};

export const PLAN_NAMES: Record<Plan, string> = {
  FREE: 'フリー',
  TRIAL: 'トライアル',
  BIZ: 'Business',
  ENT: 'Enterprise',
};

export const PRODUCT_PLANS: Record<string, ProductCode[]> = {
  'Insight Deck Quality Gate': ['INSS'],
  'Insight Performance Management': ['IOSH'],
  'Insight AI Doc Factory': ['IOSD'],
  InsightPy: ['INPY'],
  'Insight Training Studio': ['INMV'],
  InsightBot: ['INBT'],
  InsightNoCodeAnalyzer: ['INCA'],
  InsightImageGen: ['INIG'],
  InterviewInsight: ['IVIN'],
  InsightSeniorOffice: ['ISOF'],
};

export const TRIAL_DAYS = 30;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  E001: 'ライセンスキーの形式が正しくありません',
  E002: 'ライセンスキーが無効です',
  E003: 'メールアドレスが一致しません',
  E004: 'ライセンスの有効期限が切れています',
  E005: 'このライセンスは {product} 用です',
  E006: 'トライアル期間は終了しています',
};

// ライセンスキー正規表現
const LICENSE_KEY_REGEX = /^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN|ISOF)-(FREE|TRIAL|BIZ|ENT)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

// 署名用シークレットキー
const SECRET_KEY = 'insight-series-license-secret-2026';

// =============================================================================
// 署名・ハッシュ (ブラウザ互換)
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
// ストレージインターフェース
// =============================================================================

export interface LicenseStorage {
  load(): Promise<LicenseData | null>;
  save(data: LicenseData): Promise<void>;
  clear(): Promise<void>;
}

/**
 * ローカルストレージベースのストレージ（ブラウザ/Tauri用）
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
// ライセンスマネージャー
// =============================================================================

export interface LicenseManagerOptions {
  product: string;
  storage?: LicenseStorage;
}

/**
 * ライセンスマネージャー
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
   * ライセンス認証
   */
  async authenticate(email: string, key: string): Promise<AuthResult> {
    email = email.trim().toLowerCase();
    key = key.trim().toUpperCase();

    // 1. キー形式チェック
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

    // 2. 署名検証
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

    // 3. メールハッシュ照合
    const expectedHash = await generateEmailHash(email);
    if (emailHash !== expectedHash) {
      return {
        success: false,
        errorCode: 'E003',
        message: ERROR_MESSAGES.E003,
      };
    }

    // 4. 有効期限チェック
    const year = 2000 + parseInt(yymm.substring(0, 2), 10);
    const month = parseInt(yymm.substring(2, 4), 10);
    const expires = new Date(year, month, 0, 23, 59, 59); // 月末

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

    // 5. 製品コードチェック
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

    // 認証成功 → ローカル保存
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
   * ライセンス状態を確認
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
   * ライセンス情報をクリア
   */
  async clearLicense(): Promise<void> {
    this.cachedData = null;
    await this.storage.clear();
  }

  /**
   * 残り日数を取得
   */
  async getDaysRemaining(): Promise<number> {
    const status = await this.checkStatus();
    return status.daysRemaining || 0;
  }
}

// =============================================================================
// ライセンスキー生成（開発者・Node.js環境用）
// =============================================================================

export interface GenerateOptions {
  productCode: ProductCode;
  plan: Plan;
  email: string;
  expires: Date;
}

/**
 * Node.js Buffer を Base32 (RFC 4648) にエンコード
 * ※ ブラウザ版 arrayBufferToBase32 と同一のアルゴリズム
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
 * ライセンスキーを生成（同期版・CLIツール用）
 * ※ Node.js 環境でのみ使用
 */
export function generateLicenseKeySync(options: GenerateOptions): string {
  // Node.js crypto を使用
  const crypto = require('crypto');
  const { productCode, plan, email, expires } = options;

  // YYMM形式
  const yy = String(expires.getFullYear()).substring(2);
  const mm = String(expires.getMonth() + 1).padStart(2, '0');
  const yymm = yy + mm;

  // メールハッシュ（Base32）
  const emailHashRaw = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest();
  const emailHash = bufferToBase32(emailHashRaw).substring(0, 4).toUpperCase();

  // 署名（Base32）
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
 * トライアルキーを生成（同期版）
 */
export function generateTrialKeySync(productCode: ProductCode, email: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + TRIAL_DAYS);
  return generateLicenseKeySync({ productCode, plan: 'TRIAL', email, expires });
}

export default LicenseManager;
