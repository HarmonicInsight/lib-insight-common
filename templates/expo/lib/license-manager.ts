/**
 * Insight ライセンスマネージャー (Expo/React Native)
 *
 * config/license-server.ts と連携。
 * __PRODUCT_CODE__ を製品コード (例: "IOSH") に置換してください。
 *
 * ライセンスキー形式:
 *   {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
 *   例: IOSH-BIZ-2601-XXXX-XXXX-XXXX
 *
 * 使い方:
 *   import { licenseManager } from '@/lib/license-manager';
 *   await licenseManager.initialize();
 *   const result = await licenseManager.activate(email, key);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCT_CODE = '__PRODUCT_CODE__';
const STORAGE_KEY = '@insight_license';

const KEY_PATTERN = /^([A-Z]{4})-(FREE|TRIAL|BIZ|ENT)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

export type PlanCode = 'FREE' | 'TRIAL' | 'BIZ' | 'ENT';

export const PLAN_LABELS: Record<PlanCode, { en: string; ja: string }> = {
  FREE: { en: 'Free', ja: 'フリー' },
  TRIAL: { en: 'Trial', ja: 'トライアル' },
  BIZ: { en: 'Business', ja: 'ビジネス' },
  ENT: { en: 'Enterprise', ja: 'エンタープライズ' },
};

interface LicenseData {
  email: string;
  key: string;
  plan: PlanCode;
  expiryDate: string; // ISO date string
}

class LicenseManager {
  private data: LicenseData | null = null;

  get currentPlan(): PlanCode | null {
    return this.data?.plan ?? null;
  }

  get email(): string | null {
    return this.data?.email ?? null;
  }

  get expiryDate(): Date | null {
    return this.data ? new Date(this.data.expiryDate) : null;
  }

  get isActivated(): boolean {
    return this.data !== null;
  }

  get isExpired(): boolean {
    if (!this.expiryDate) return true;
    return this.expiryDate < new Date();
  }

  get isValid(): boolean {
    return this.isActivated && !this.isExpired;
  }

  /**
   * AsyncStorage からライセンス情報を読み込む。
   * アプリ起動時に呼び出す。
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch {
      this.data = null;
    }
  }

  /**
   * ライセンスキーを検証してアクティベートする。
   */
  async activate(email: string, key: string): Promise<{ success: boolean; message: string }> {
    const normalized = key.trim().toUpperCase();
    const match = normalized.match(KEY_PATTERN);

    if (!match) {
      return { success: false, message: '無効なライセンスキー形式です' };
    }

    const [, productCode, planStr, yymm] = match;

    if (productCode !== PRODUCT_CODE) {
      return { success: false, message: `この製品用のキーではありません (${productCode})` };
    }

    const plan = planStr as PlanCode;

    // YYMM から有効期限を計算
    const year = 2000 + parseInt(yymm.substring(0, 2), 10);
    const month = parseInt(yymm.substring(2, 4), 10) - 1;
    const issueDate = new Date(year, month, 1);
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(
      expiryDate.getDate() + (plan === 'TRIAL' ? 30 : 365)
    );

    const licenseData: LicenseData = {
      email,
      key: normalized,
      plan,
      expiryDate: expiryDate.toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(licenseData));
      this.data = licenseData;
      return { success: true, message: `${PLAN_LABELS[plan].ja}プランが有効化されました` };
    } catch {
      return { success: false, message: '保存に失敗しました' };
    }
  }

  /**
   * ライセンスをクリアする。
   */
  async deactivate(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.data = null;
  }

  /**
   * 指定機能が現在のプランで利用可能かチェックする。
   */
  canUseFeature(feature: string, featureMatrix: Record<string, PlanCode[]>): boolean {
    if (!this.isValid || !this.currentPlan) return false;
    return featureMatrix[feature]?.includes(this.currentPlan) ?? false;
  }

  /**
   * 有効期限のフォーマット済み表示文字列を返す。
   */
  formattedExpiry(locale: 'ja' | 'en' = 'ja'): string {
    if (!this.expiryDate) return '---';
    return locale === 'ja'
      ? `${this.expiryDate.getFullYear()}年${this.expiryDate.getMonth() + 1}月${this.expiryDate.getDate()}日`
      : this.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

export const licenseManager = new LicenseManager();
