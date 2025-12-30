/**
 * Insight Series License Management - TypeScript
 * Tauri/React製品向けライセンス管理モジュール
 */

export interface LicenseInfo {
  isValid: boolean;
  product: ProductCode | null;
  tier: LicenseTier | null;
  expiresAt: Date | null;
  error?: string;
}

export type ProductCode = 'SALES' | 'SLIDE' | 'PY' | 'INTV' | 'ALL';
export type LicenseTier = 'TRIAL' | 'STD' | 'PRO' | 'ENT';

export const PRODUCT_NAMES: Record<ProductCode, string> = {
  SALES: 'SalesInsight',
  SLIDE: 'InsightSlide',
  PY: 'InsightPy',
  INTV: 'InterviewInsight',
  ALL: 'Insight Series Bundle',
};

export const TIER_NAMES: Record<LicenseTier, string> = {
  TRIAL: 'Trial',
  STD: 'Standard',
  PRO: 'Professional',
  ENT: 'Enterprise',
};

/**
 * ライセンスキーのフォーマット検証用正規表現
 * 形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
 */
const LICENSE_KEY_REGEX = /^INS-(SALES|SLIDE|PY|INTV|ALL)-(TRIAL|STD|PRO|ENT)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/;

/**
 * チェックサムを計算する
 */
function calculateChecksum(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i) * (i + 1);
  }
  const checksum = (sum % 1296).toString(36).toUpperCase().padStart(2, '0');
  return checksum;
}

/**
 * ライセンスバリデーター
 */
export class LicenseValidator {
  /**
   * ライセンスキーを検証する
   */
  validate(licenseKey: string): LicenseInfo {
    if (!licenseKey) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'License key is required',
      };
    }

    const normalized = licenseKey.trim().toUpperCase();
    const match = normalized.match(LICENSE_KEY_REGEX);

    if (!match) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'Invalid license key format',
      };
    }

    const [, product, tier, part1, part2, providedChecksum] = match;

    // チェックサム検証
    const baseKey = `INS-${product}-${tier}-${part1}-${part2}`;
    const expectedChecksum = calculateChecksum(baseKey);

    if (providedChecksum !== expectedChecksum) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'Invalid checksum',
      };
    }

    // 有効期限の計算（TRIALは30日、STD/PROは365日、ENTは無期限）
    let expiresAt: Date | null = null;
    if (tier !== 'ENT') {
      const days = tier === 'TRIAL' ? 30 : 365;
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    return {
      isValid: true,
      product: product as ProductCode,
      tier: tier as LicenseTier,
      expiresAt,
    };
  }

  /**
   * 製品がライセンスでカバーされているかチェック
   */
  isProductCovered(licenseInfo: LicenseInfo, targetProduct: ProductCode): boolean {
    if (!licenseInfo.isValid || !licenseInfo.product) {
      return false;
    }

    // ALLライセンスは全製品をカバー
    if (licenseInfo.product === 'ALL') {
      return true;
    }

    return licenseInfo.product === targetProduct;
  }
}

/**
 * ライセンスキーを生成する（開発・テスト用）
 */
export function generateLicenseKey(product: ProductCode, tier: LicenseTier): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const part1 = randomPart();
  const part2 = randomPart();
  const baseKey = `INS-${product}-${tier}-${part1}-${part2}`;
  const checksum = calculateChecksum(baseKey);

  return `${baseKey}-${checksum}`;
}

export default LicenseValidator;
