/**
 * HARMONIC insight ライセンス発行・配信システム
 *
 * ============================================================================
 * 【Syncfusion モデルを参考にしたライセンス発行フロー】
 * ============================================================================
 *
 * ## Syncfusion の流れ（参考元）
 * 1. ユーザーがメールアドレスで登録
 * 2. 「Confirm and Verify」メールが届く（15日間有効）
 * 3. メール認証完了
 * 4. 即座に仮ライセンスキーをメールで発行
 * 5. 審査完了後、正規ライセンスキーを別途送信
 *
 * ## HARMONIC insight の流れ（本実装）
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                   ライセンス発行フロー                          │
 * │                                                                │
 * │ ⓪ キーなし = FREE                                             │
 * │ ┌──────────────────────────────────────────────────────────┐  │
 * │ │ ライセンスキーが未入力 → 自動的に FREE モードで動作      │  │
 * │ │ （キー不要。制限付き基本機能のみ利用可能）                │  │
 * │ └──────────────────────────────────────────────────────────┘  │
 * │                                                                │
 * │ ① 登録            ② メール認証        ③ 仮キー発行            │
 * │ ┌──────────┐   ┌──────────────┐   ┌──────────────┐         │
 * │ │メール    │→  │Confirm &    │→  │30日間TRIAL  │         │
 * │ │製品選択  │   │Verify       │   │キー自動発行 │         │
 * │ │プラン選択│   │(15日間有効) │   │+ DLリンク   │         │
 * │ └──────────┘   └──────────────┘   └──────────────┘         │
 * │                                                                │
 * │ ④ 決済・承認       ⑤ 正式キー発行      ⑥ 利用開始             │
 * │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
 * │ │Paddle/Stripe│ │12ヶ月キー   │ │アプリ内で    │          │
 * │ │請求書払い   │→│メール送信   │→│アクティベート│          │
 * │ │リセラー経由 │ │             │ │             │          │
 * │ └──────────────┘ └──────────────┘ └──────────────┘          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ## プラン体系
 * - FREE: ライセンスキー不要（キーなし = FREE モード）。制限付き基本機能。
 * - TRIAL: 30日間全機能利用可能。HARMONIC insight が自己発行。
 * - BIZ: 法人向け全機能（365日）。STD+PRO を統合。
 * - ENT: 法人向け全機能＋コラボレーション（365日）。
 *
 * ## キーの種類
 * - 仮キー（Provisional Key）: 30日間有効、TRIAL相当、メール認証後即発行（HARMONIC insightが自己発行）
 * - 正式キー（Production Key）: 12ヶ月有効、決済完了後に発行（BIZ / ENT）
 * - NFRキー（Not For Resale）: リセラーパートナー社内評価用（BIZ相当）
 * - デモキー（Demo Key）: リセラーが顧客デモに使用
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** ライセンスキーの種類 */
export type LicenseKeyType =
  | 'provisional'   // 仮キー（30日間、メール認証後即発行 — HARMONIC insightが自己発行）
  | 'production'    // 正式キー（12ヶ月、決済完了後 — BIZ / ENT）
  | 'nfr'           // Not For Resale（パートナー社内用 — BIZ相当）
  | 'demo';         // デモ用（パートナーが顧客デモに使用）

/** 登録ステータス */
export type RegistrationStatus =
  | 'pending_verification'  // メール認証待ち
  | 'verified'              // 認証済み（仮キー発行済み — 30日間TRIAL）
  | 'pending_payment'       // 決済待ち
  | 'active'                // 正式キー発行済み・利用中（BIZ / ENT）
  | 'expired'               // 期限切れ（→ FREE モードにフォールバック）
  | 'suspended';            // 停止

/** メールテンプレート種別 */
export type EmailTemplate =
  | 'verification'          // Step ②: メール認証
  | 'provisional_key'       // Step ③: 仮キー発行
  | 'payment_confirmation'  // Step ④: 決済確認
  | 'production_key'        // Step ⑤: 正式キー発行
  | 'expiry_reminder'       // 期限切れ30日前リマインダー
  | 'expiry_notice'         // 期限切れ通知
  | 'renewal_confirmation'; // 更新完了

/** ライセンス登録情報 */
export interface LicenseRegistration {
  /** 登録ID */
  id: string;
  /** メールアドレス */
  email: string;
  /** 氏名 */
  name: string;
  /** 会社名（任意） */
  company?: string;
  /** 製品コード */
  productCode: ProductCode;
  /** 希望プラン */
  requestedPlan: PlanCode;
  /** 登録ステータス */
  status: RegistrationStatus;
  /** 認証トークン */
  verificationToken: string;
  /** 認証トークン有効期限 */
  verificationExpiresAt: Date;
  /** 認証完了日時 */
  verifiedAt: Date | null;
  /** 仮キー */
  provisionalKey: string | null;
  /** 仮キー有効期限 */
  provisionalExpiresAt: Date | null;
  /** 正式キー */
  productionKey: string | null;
  /** 正式キー有効期限 */
  productionExpiresAt: Date | null;
  /** 決済方法 */
  paymentMethod: 'paddle' | 'stripe' | 'invoice' | 'reseller' | null;
  /** 決済ID */
  paymentId: string | null;
  /** リセラーパートナーID（リセラー経由の場合） */
  resellerPartnerId: string | null;
  /** 登録日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// =============================================================================
// ライセンスキー生成ルール
// =============================================================================

/**
 * ライセンスキー形式
 *
 * 正式キー:  {PRODUCT}-{PLAN}-{YYMM}-{HASH}-{SIG1}-{SIG2}
 * 仮キー:    {PRODUCT}-TRIAL-{YYMM}-{HASH}-{SIG1}-{SIG2}
 * NFRキー:   {PRODUCT}-NFR-{YYMM}-{HASH}-{SIG1}-{SIG2}
 * デモキー:  {PRODUCT}-DEMO-{YYMM}-{HASH}-{SIG1}-{SIG2}
 *
 * 例:
 *   INSS-BIZ-2602-A3F1-B7C2-D9E4    （正式キー: BIZプラン、2026年2月発行）
 *   INSS-ENT-2602-K8L9-M0N1-P2Q3    （正式キー: ENTプラン、2026年2月発行）
 *   INSS-TRIAL-2602-X1Y2-Z3W4-V5U6  （仮キー: 30日間 — HARMONIC insight自己発行）
 *   IOSH-NFR-2602-N1F2-R3P4-Q5S6    （NFRキー: パートナー用 — BIZ相当）
 *   IOSH-DEMO-2602-D1E2-F3G4-H5I6   （デモキー: パートナーが顧客デモに使用）
 *
 * 注意:
 *   - FREE プランはライセンスキー不要（キーなし = FREE モード）
 *   - STD / PRO プランは廃止済み。BIZ に統合。
 */
export interface LicenseKeyConfig {
  /** キー種別 */
  type: LicenseKeyType;
  /** 有効日数 */
  validityDays: number;
  /** 対応するプランコード（機能制限に使用） */
  effectivePlan: PlanCode;
  /** キーに埋め込むプラン表記 */
  keyPlanCode: string;
  /** 説明 */
  description: string;
}

export const LICENSE_KEY_CONFIGS: Record<LicenseKeyType, LicenseKeyConfig> = {
  provisional: {
    type: 'provisional',
    validityDays: 30,
    effectivePlan: 'TRIAL',
    keyPlanCode: 'TRIAL',
    description: 'メール認証後に即発行。30日間の全機能利用可能。HARMONIC insightが自己発行。',
  },
  production: {
    type: 'production',
    validityDays: 365,
    effectivePlan: 'BIZ', // 決済時のプランで上書き
    keyPlanCode: 'BIZ',   // 決済時のプランで上書き
    description: '決済完了後に発行。12ヶ月間有効。',
  },
  nfr: {
    type: 'nfr',
    validityDays: 365,
    effectivePlan: 'BIZ',
    keyPlanCode: 'NFR',
    description: 'リセラーパートナー社内評価用。BIZ相当の全機能。',
  },
  demo: {
    type: 'demo',
    validityDays: 30,
    effectivePlan: 'TRIAL',
    keyPlanCode: 'DEMO',
    description: 'リセラーが顧客デモに使用。30日間の全機能。',
  },
};

// =============================================================================
// メール認証設定
// =============================================================================

export const VERIFICATION_CONFIG = {
  /** 認証リンク有効期間（日） */
  tokenExpiryDays: 15,
  /** 認証メール再送可能回数 */
  maxResendCount: 3,
  /** 認証メール再送間隔（秒） */
  resendCooldownSeconds: 60,
  /** 認証URL形式 */
  verificationUrlPattern: 'https://account.harmonicinsight.com/verify?token={token}',
};

// =============================================================================
// ステップ別処理定義
// =============================================================================

/**
 * Step ①: ユーザー登録
 *
 * トリガー: Webフォーム送信
 * 処理:
 *   1. registrations テーブルに登録（status: pending_verification）
 *   2. 認証トークン生成（UUID v4、15日間有効）
 *   3. 認証メール送信
 */
export interface Step1_RegistrationInput {
  email: string;
  name: string;
  company?: string;
  productCode: ProductCode;
  requestedPlan: PlanCode;
  locale: 'ja' | 'en';
}

/**
 * Step ②: メール認証
 *
 * トリガー: 認証リンクのクリック
 * 処理:
 *   1. トークン検証（有効期限チェック）
 *   2. status を verified に更新
 *   3. verifiedAt を記録
 *   4. → Step ③ を即実行
 */
export interface Step2_VerificationInput {
  token: string;
}

/**
 * Step ③: 仮キー発行
 *
 * トリガー: Step ② 完了後に自動実行（HARMONIC insightが自己発行）
 * 処理:
 *   1. 仮ライセンスキー生成（TRIAL、30日間）
 *   2. registrations テーブルに仮キーを記録
 *   3. 仮キー発行メール送信（製品DLリンク付き）
 *   4. licenses テーブルにTRIALとして登録
 */
export interface Step3_ProvisionalKeyOutput {
  provisionalKey: string;
  expiresAt: Date;
  downloadLinks: ProductDownloadLinks;
}

/**
 * Step ④: 決済・承認
 *
 * トリガー: Paddle/Stripe webhook or リセラー注文 or 請求書払い確認
 * 処理:
 *   1. 決済情報を記録
 *   2. status を active に更新
 *   3. → Step ⑤ を即実行
 */
export interface Step4_PaymentInput {
  registrationId: string;
  paymentMethod: 'paddle' | 'stripe' | 'invoice' | 'reseller';
  paymentId: string;
  plan: PlanCode;
  resellerPartnerId?: string;
}

/**
 * Step ⑤: 正式キー発行
 *
 * トリガー: Step ④ 完了後に自動実行
 * 処理:
 *   1. 正式ライセンスキー生成（決済プランで12ヶ月 — BIZ or ENT）
 *   2. licenses テーブルを更新（TRIAL → BIZ / ENT）
 *   3. 正式キー発行メール送信
 */
export interface Step5_ProductionKeyOutput {
  productionKey: string;
  plan: PlanCode;
  expiresAt: Date;
}

/**
 * Step ⑥: 利用開始
 *
 * トリガー: ユーザーがアプリ内でライセンスキーを入力
 * 処理:
 *   - activate-license.ts の既存フローを使用
 *   - アプリ内のライセンス画面でキーを入力→アクティベート
 */

// =============================================================================
// 製品ダウンロードリンク
// =============================================================================

export interface ProductDownloadLinks {
  productCode: ProductCode;
  productName: string;
  /** Windowsインストーラー */
  windows?: string;
  /** macOSインストーラー */
  mac?: string;
  /** Linuxインストーラー */
  linux?: string;
  /** Web版URL */
  web?: string;
  /** ドキュメント */
  documentation: string;
  /** APIリファレンス */
  apiReference?: string;
}

/** 製品別ダウンロードリンク（テンプレート） */
export const PRODUCT_DOWNLOAD_LINKS: Record<ProductCode, ProductDownloadLinks> = {
  INSS: {
    productCode: 'INSS',
    productName: 'Insight Deck Quality Gate',
    windows: 'https://download.harmonicinsight.com/insightofficeslide/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightofficeslide',
  },
  INPY: {
    productCode: 'INPY',
    productName: 'InsightPy',
    windows: 'https://download.harmonicinsight.com/insightpy/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightpy',
  },
  IOSH: {
    productCode: 'IOSH',
    productName: 'Insight Performance Management',
    windows: 'https://download.harmonicinsight.com/insightofficesheet/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightofficesheet',
  },
  IOSD: {
    productCode: 'IOSD',
    productName: 'Insight AI Briefcase',
    windows: 'https://download.harmonicinsight.com/insightofficedoc/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightofficedoc',
  },
  INCA: {
    productCode: 'INCA',
    productName: 'InsightNoCodeAnalyzer',
    windows: 'https://download.harmonicinsight.com/insightnocode/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightnocode',
  },
  INBT: {
    productCode: 'INBT',
    productName: 'InsightBot',
    windows: 'https://download.harmonicinsight.com/insightbot/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightbot',
  },
  INMV: {
    productCode: 'INMV',
    productName: 'InsightCast',
    windows: 'https://download.harmonicinsight.com/InsightCast/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/InsightCast',
  },
  INIG: {
    productCode: 'INIG',
    productName: 'InsightImageGen',
    windows: 'https://download.harmonicinsight.com/insightimagegen/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightimagegen',
  },
  IVIN: {
    productCode: 'IVIN',
    productName: 'InterviewInsight',
    windows: 'https://download.harmonicinsight.com/insightinterview/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightinterview',
  },
  ISOF: {
    productCode: 'ISOF',
    productName: 'InsightSeniorOffice',
    windows: 'https://download.harmonicinsight.com/insightsenioroffice/latest/windows',
    documentation: 'https://docs.harmonicinsight.com/insightsenioroffice',
  },
};

// =============================================================================
// メールテンプレート定義
// =============================================================================

export interface EmailTemplateConfig {
  template: EmailTemplate;
  subject: {
    ja: string;
    en: string;
  };
  description: string;
  /** 送信タイミング */
  trigger: string;
}

export const EMAIL_TEMPLATES: Record<EmailTemplate, EmailTemplateConfig> = {
  verification: {
    template: 'verification',
    subject: {
      ja: '【HARMONIC insight】メールアドレスの確認',
      en: '[HARMONIC insight] Verify your email address',
    },
    description: 'メール認証リンク付き。Confirm and Verifyボタン。15日間有効。',
    trigger: 'Step ① 登録直後',
  },
  provisional_key: {
    template: 'provisional_key',
    subject: {
      ja: '【HARMONIC insight】{productName} — 30日間トライアルキー',
      en: '[HARMONIC insight] {productName} — Your 30-Day Trial Key',
    },
    description: '30日間仮キー + 製品ダウンロードリンク + ドキュメントリンク。',
    trigger: 'Step ② メール認証完了直後',
  },
  payment_confirmation: {
    template: 'payment_confirmation',
    subject: {
      ja: '【HARMONIC insight】お支払い確認 — {productName} {planName}',
      en: '[HARMONIC insight] Payment Confirmed — {productName} {planName}',
    },
    description: '決済完了確認。正式キーは別メールで送付する旨を案内。',
    trigger: 'Step ④ 決済完了時',
  },
  production_key: {
    template: 'production_key',
    subject: {
      ja: '【HARMONIC insight】{productName} {planName} — 正式ライセンスキー',
      en: '[HARMONIC insight] {productName} {planName} — Your License Key',
    },
    description: '正式キー（12ヶ月）+ アクティベーション手順 + サポート連絡先。',
    trigger: 'Step ⑤ 決済完了後即時（または審査完了後）',
  },
  expiry_reminder: {
    template: 'expiry_reminder',
    subject: {
      ja: '【HARMONIC insight】{productName} — ライセンス更新のお知らせ（残り30日）',
      en: '[HARMONIC insight] {productName} — License Renewal Reminder (30 days)',
    },
    description: '期限切れ30日前に自動送信。更新リンク付き。',
    trigger: '期限切れ30日前（バッチ処理）',
  },
  expiry_notice: {
    template: 'expiry_notice',
    subject: {
      ja: '【HARMONIC insight】{productName} — ライセンスの有効期限が切れました',
      en: '[HARMONIC insight] {productName} — Your License Has Expired',
    },
    description: '期限切れ通知。更新リンク + FREE モードへのフォールバック案内。',
    trigger: '期限切れ当日（バッチ処理）',
  },
  renewal_confirmation: {
    template: 'renewal_confirmation',
    subject: {
      ja: '【HARMONIC insight】{productName} — ライセンス更新完了',
      en: '[HARMONIC insight] {productName} — License Renewal Confirmed',
    },
    description: '更新完了 + 新しいキー + 新しい有効期限。',
    trigger: '更新決済完了時',
  },
};

// =============================================================================
// DBスキーマ（Supabase テーブル定義参照）
// =============================================================================

/**
 * registrations テーブル
 *
 * ライセンス登録〜発行までの全ステータスを管理。
 * licenses テーブルとは別に、登録プロセスの状態を追跡する。
 *
 * CREATE TABLE registrations (
 *   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email           TEXT NOT NULL,
 *   name            TEXT NOT NULL,
 *   company         TEXT,
 *   product_code    TEXT NOT NULL,
 *   requested_plan  TEXT NOT NULL,
 *   status          TEXT NOT NULL DEFAULT 'pending_verification',
 *   verification_token     TEXT NOT NULL,
 *   verification_expires_at TIMESTAMPTZ NOT NULL,
 *   verified_at     TIMESTAMPTZ,
 *   provisional_key TEXT,
 *   provisional_expires_at TIMESTAMPTZ,
 *   production_key  TEXT,
 *   production_expires_at  TIMESTAMPTZ,
 *   payment_method  TEXT,
 *   payment_id      TEXT,
 *   reseller_partner_id TEXT,
 *   locale          TEXT DEFAULT 'ja',
 *   created_at      TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at      TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_registrations_email ON registrations(email);
 * CREATE INDEX idx_registrations_token ON registrations(verification_token);
 * CREATE INDEX idx_registrations_status ON registrations(status);
 */

// =============================================================================
// ライセンスキー正規表現パターン
// =============================================================================

/**
 * ライセンスキーのバリデーション用正規表現パターン
 *
 * 形式: {PRODUCT}-{PLAN}-{YYMM}-{HASH}-{SIG1}-{SIG2}
 * PLAN部: BIZ | ENT | TRIAL | NFR | DEMO
 *
 * 注意:
 * - FREE プランはキー不要のためパターンに含まない
 * - STD / PRO は廃止済み。レガシーキーの検証には LEGACY_LICENSE_KEY_REGEX を使用。
 */
export const LICENSE_KEY_REGEX = /^[A-Z]{4}-(?:BIZ|ENT|TRIAL|NFR|DEMO)-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * レガシーキーの検証用（STD / PRO は廃止済みだが、移行期間中は受け付ける）
 */
export const LEGACY_LICENSE_KEY_REGEX = /^[A-Z]{4}-(?:STD|PRO)-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * 全キー形式の検証用（現行 + レガシー）
 */
export const ANY_LICENSE_KEY_REGEX = /^[A-Z]{4}-(?:BIZ|ENT|TRIAL|NFR|DEMO|STD|PRO)-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * キーの PLAN 部分を抽出
 */
export function extractPlanFromKey(licenseKey: string): string | null {
  const match = licenseKey.match(/^[A-Z]{4}-([A-Z]+)-\d{4}/);
  return match ? match[1] : null;
}

/**
 * キーの PLAN 部分から有効なプランコードに変換
 *
 * レガシーキー（STD / PRO）は BIZ にマッピングする。
 * FREE はキー不要のためマッピング対象外。
 */
export function mapKeyPlanToEffectivePlan(keyPlanCode: string): PlanCode | null {
  const mapping: Record<string, PlanCode> = {
    BIZ: 'BIZ',
    ENT: 'ENT',
    TRIAL: 'TRIAL',
    NFR: 'BIZ',    // NFR は BIZ 相当
    DEMO: 'TRIAL',  // DEMO は TRIAL 相当
    // レガシーマッピング
    STD: 'BIZ',     // STD は廃止 → BIZ にマッピング
    PRO: 'BIZ',     // PRO は廃止 → BIZ にマッピング
  };
  return mapping[keyPlanCode] ?? null;
}

/**
 * ライセンスキーが不要な FREE プランかどうかを判定
 *
 * FREE プランはライセンスキーが存在しない（未入力・null・空文字）状態で自動的に適用される。
 * アプリ側ではキーが入力されていなければ FREE モードとして動作する。
 */
export function isFreeMode(licenseKey: string | null | undefined): boolean {
  return !licenseKey || licenseKey.trim() === '';
}

/**
 * ライセンスキーの有無からプラン種別を推定
 *
 * - キーなし → FREE（キー不要、制限付き機能のみ）
 * - キーあり → サーバー検証が必要（TRIAL / BIZ / ENT のいずれか）
 */
export function resolveEffectivePlanFromKey(
  licenseKey: string | null | undefined,
): { plan: 'FREE'; requiresServerValidation: false } | { plan: null; requiresServerValidation: true } {
  if (isFreeMode(licenseKey)) {
    return { plan: 'FREE', requiresServerValidation: false };
  }
  return { plan: null, requiresServerValidation: true };
}

/**
 * ライセンスキー形式のバリデーション
 *
 * @param licenseKey 検証するライセンスキー
 * @param allowLegacy レガシーキー（STD/PRO）を許可するか（デフォルト: true）
 * @returns バリデーション結果
 */
export function validateLicenseKeyFormat(
  licenseKey: string,
  allowLegacy: boolean = true,
): { valid: boolean; isLegacy: boolean; error?: string } {
  if (isFreeMode(licenseKey)) {
    return { valid: false, isLegacy: false, error: 'FREE プランはライセンスキー不要です。' };
  }

  if (LICENSE_KEY_REGEX.test(licenseKey)) {
    return { valid: true, isLegacy: false };
  }

  if (LEGACY_LICENSE_KEY_REGEX.test(licenseKey)) {
    if (allowLegacy) {
      return { valid: true, isLegacy: true };
    }
    return {
      valid: false,
      isLegacy: true,
      error: 'STD / PRO プランは廃止されました。BIZ プランのキーに移行してください。',
    };
  }

  return { valid: false, isLegacy: false, error: 'ライセンスキーの形式が不正です。' };
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 仮キーの有効期限を計算（30日間）
 */
export function getProvisionalKeyExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + LICENSE_KEY_CONFIGS.provisional.validityDays * 24 * 60 * 60 * 1000);
}

/**
 * 正式キーの有効期限を計算
 */
export function getProductionKeyExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + LICENSE_KEY_CONFIGS.production.validityDays * 24 * 60 * 60 * 1000);
}

/**
 * 認証トークンの有効期限を計算
 */
export function getVerificationTokenExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + VERIFICATION_CONFIG.tokenExpiryDays * 24 * 60 * 60 * 1000);
}

/**
 * 製品のダウンロードリンクを取得
 */
export function getDownloadLinks(productCode: ProductCode): ProductDownloadLinks {
  return PRODUCT_DOWNLOAD_LINKS[productCode];
}

/**
 * メールテンプレートの件名を取得（プレースホルダー置換）
 */
export function getEmailSubject(
  template: EmailTemplate,
  locale: 'ja' | 'en',
  vars: Record<string, string> = {},
): string {
  let subject = EMAIL_TEMPLATES[template].subject[locale];
  for (const [key, value] of Object.entries(vars)) {
    subject = subject.replace(`{${key}}`, value);
  }
  return subject;
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  LICENSE_KEY_CONFIGS,
  LICENSE_KEY_REGEX,
  LEGACY_LICENSE_KEY_REGEX,
  ANY_LICENSE_KEY_REGEX,
  VERIFICATION_CONFIG,
  PRODUCT_DOWNLOAD_LINKS,
  EMAIL_TEMPLATES,
  extractPlanFromKey,
  mapKeyPlanToEffectivePlan,
  isFreeMode,
  resolveEffectivePlanFromKey,
  validateLicenseKeyFormat,
  getProvisionalKeyExpiry,
  getProductionKeyExpiry,
  getVerificationTokenExpiry,
  getDownloadLinks,
  getEmailSubject,
};
