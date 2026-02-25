/**
 * HARMONIC insight リリース管琁E��ジュール
 *
 * ============================================================================
 * 【リリース管琁E�E設計方針、E
 * ============================================================================
 *
 * ## 概要E
 * 全製品�EユーチE��リチE��アプリのリリース設定、バージョン管琁E��E
 * ストアメタチE�Eタ検証、リリースチェチE��リストを型安�Eに管琁E��る、E
 *
 * ## 対象
 * - 製品E��EroductCode�E�E INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN, ISOF
 * - ユーチE��リチE���E�EtilityCode�E�E LAUNCHER, CAMERA, VOICE_CLOCK, QR, PINBOARD, VOICE_MEMO
 *
 * ## リリースフロー
 *
 * ┌─────────────────────────────────────────────────────────────────━E
 * ━E 1. バ�Eジョン更新                                              ━E
 * ━E    updateVersion() でバ�Eジョンコード�Eバ�Eジョン名を更新       ━E
 * ━E                                                                ━E
 * ━E 2. リリースチェチE��実衁E                                       ━E
 * ━E    /release-check また�E release-check.sh                      ━E
 * ━E    ↁEPhase 1、E の段階的検証                                   ━E
 * ━E                                                                ━E
 * ━E 3. ストアメタチE�Eタ検証                                        ━E
 * ━E    validateStoreMetadata() で斁E��数制限�E忁E��ファイルを検証     ━E
 * ━E                                                                ━E
 * ━E 4. ビルチE& 署吁E                                              ━E
 * ━E    プラチE��フォーム固有�Eビルドコマンドを実衁E                   ━E
 * ━E                                                                ━E
 * ━E 5. ストア提�E                                                  ━E
 * ━E    Play Store / App Store / 直接配币E                          ━E
 * └─────────────────────────────────────────────────────────────────━E
 *
 * ## 使用侁E
 *
 * ```typescript
 * import {
 *   getReleaseConfig,
 *   validateStoreMetadata,
 *   getReleaseChecklist,
 *   getStoreMetadataTemplate,
 * } from '@/insight-common/config/release';
 *
 * // リリース設定を取征E
 * const config = getReleaseConfig('CAMERA');
 * config.platform;           // 'android_native'
 * config.storeDistribution;  // 'play_store'
 *
 * // ストアメタチE�Eタの検証
 * const result = validateStoreMetadata('CAMERA', metadata);
 * result.valid;      // true / false
 * result.errors;     // 検証エラー一覧
 *
 * // リリースチェチE��リスト�E取征E
 * const checklist = getReleaseChecklist('android_native');
 * ```
 */

import type { ProductCode } from './products';
import type { UtilityCode } from './product-catalog';

// =============================================================================
// 型定義
// =============================================================================

/** リリース対象コード（製品E+ ユーチE��リチE���E�E*/
export type ReleaseTargetCode = ProductCode | UtilityCode;

/** 配信プラチE��フォーム */
export type ReleasePlatform =
  | 'android_native'    // Android (Native Kotlin)
  | 'expo'              // Expo / React Native
  | 'wpf'               // C# WPF (Windows)
  | 'web'               // React / Next.js
  | 'python'            // Python
  | 'tauri'             // Tauri (cross-platform desktop)
  | 'service';          // Backend service

/** ストア配信允E*/
export type StoreDistribution =
  | 'play_store'        // Google Play Store
  | 'app_store'         // Apple App Store
  | 'microsoft_store'   // Microsoft Store
  | 'direct'            // 直接配币E��インスト�Eラー / PyPI�E�E
  | 'web_deploy'        // Web チE�Eロイ�E�Eercel / Railway�E�E
  | 'none';             // 配信なし（ライブラリ等！E

/** バ�Eジョニング方弁E*/
export type VersioningScheme =
  | 'semver'                    // x.y.z (Semantic Versioning)
  | 'semver_with_build_number'  // x.y.z + versionCode
  | 'calver';                   // YYYY.MM.patch

/** 署名方弁E*/
export type SigningMethod =
  | 'android_keystore'   // Android Keystore (.jks / .keystore)
  | 'apple_signing'      // Apple Code Signing (Provisioning Profile)
  | 'windows_signing'    // Windows Code Signing (Authenticode)
  | 'none';              // 署名なぁE

/** ストアメタチE�Eタの斁E��数制陁E*/
export interface StoreCharacterLimits {
  /** アプリ吁E/ タイトル */
  title: number;
  /** 短ぁE��昁E*/
  shortDescription: number;
  /** 完�Eな説昁E*/
  fullDescription: number;
  /** リリースノ�EチE/ Changelog */
  changelog: number;
  /** サブタイトル�E�Epp Store のみ�E�E*/
  subtitle?: number;
}

/** ストアメタチE�Eタのロケール設宁E*/
export interface StoreLocale {
  /** ロケールコーチE*/
  code: string;
  /** チE��レクトリ名！Eastlane 形式！E*/
  directory: string;
  /** 忁E��かどぁE�� */
  required: boolean;
}

/** リリース設宁E*/
export interface ReleaseConfig {
  /** リリース対象コーチE*/
  code: ReleaseTargetCode;
  /** 製品名 */
  name: string;
  /** 製品名�E�日本語！E*/
  nameJa: string;
  /** 配信プラチE��フォーム */
  platform: ReleasePlatform;
  /** ストア配信允E*/
  storeDistribution: StoreDistribution;
  /** バ�Eジョニング方弁E*/
  versioningScheme: VersioningScheme;
  /** 署名方弁E*/
  signingMethod: SigningMethod;
  /** パッケージ吁E/ Bundle ID */
  packageName?: string;
  /** リポジトリ吁E*/
  repository: string;
  /** 忁E��ロケール */
  requiredLocales: StoreLocale[];
  /** ストア斁E��数制陁E*/
  characterLimits?: StoreCharacterLimits;
  /** fastlane メタチE�Eタのベ�Eスパス */
  metadataBasePath?: string;
  /** ビルドコマンド（リリース用�E�E*/
  buildCommands: string[];
  /** 備老E*/
  notes?: string;
}

/** ストアメタチE�Eタ */
export interface StoreMetadata {
  locale: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  changelog?: string;
  subtitle?: string;
}

/** メタチE�Eタ検証結果 */
export interface MetadataValidationResult {
  valid: boolean;
  errors: MetadataValidationError[];
  warnings: MetadataValidationWarning[];
}

/** メタチE�Eタ検証エラー */
export interface MetadataValidationError {
  locale: string;
  field: string;
  message: string;
  messageJa: string;
  currentLength?: number;
  maxLength?: number;
}

/** メタチE�Eタ検証警呁E*/
export interface MetadataValidationWarning {
  locale: string;
  field: string;
  message: string;
  messageJa: string;
}

/** リリースチェチE��リスト頁E�� */
export interface ReleaseCheckItem {
  /** チェチE�� ID */
  id: string;
  /** カチE��リ */
  category: 'design' | 'version' | 'signing' | 'code_quality' | 'security' | 'localization' | 'store_metadata' | 'build' | 'manual';
  /** チェチE��冁E�� */
  description: string;
  /** チェチE��冁E���E�日本語！E*/
  descriptionJa: string;
  /** 自動化レベル */
  automation: 'full' | 'semi' | 'manual';
  /** 対象プラチE��フォーム�E�空 = 全プラチE��フォーム共通！E*/
  platforms: ReleasePlatform[];
  /** 検証コマンド（�E動�E場合！E*/
  validationHint?: string;
}

// =============================================================================
// Play Store 斁E��数制陁E
// =============================================================================

export const PLAY_STORE_LIMITS: StoreCharacterLimits = {
  title: 30,
  shortDescription: 80,
  fullDescription: 4000,
  changelog: 500,
};

export const APP_STORE_LIMITS: StoreCharacterLimits = {
  title: 30,
  shortDescription: 170,   // promotional text
  fullDescription: 4000,
  changelog: 4000,
  subtitle: 30,
};

// =============================================================================
// 忁E��ロケール定義
// =============================================================================

const ANDROID_LOCALES: StoreLocale[] = [
  { code: 'ja', directory: 'ja-JP', required: true },
  { code: 'en', directory: 'en-US', required: true },
];

const IOS_LOCALES: StoreLocale[] = [
  { code: 'ja', directory: 'ja', required: true },
  { code: 'en', directory: 'en-US', required: true },
];

// =============================================================================
// リリース設定（�E製品E+ ユーチE��リチE���E�E
// =============================================================================

export const RELEASE_CONFIGS: Record<ReleaseTargetCode, ReleaseConfig> = {

  // =========================================================================
  // Tier 1: 業務変革チE�Eル
  // =========================================================================

  INCA: {
    code: 'INCA',
    name: 'InsightNoCodeAnalyzer',
    nameJa: 'InsightNoCodeAnalyzer',
    platform: 'tauri',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-insight-nca',
    requiredLocales: [],
    buildCommands: ['npm run tauri build'],
    notes: 'Tauri チE��クトップアプリ。インスト�Eラーで直接配币E��E,
  },

  INBT: {
    code: 'INBT',
    name: 'InsightBot',
    nameJa: 'InsightBot',
    platform: 'service',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'none',
    repository: 'HarmonicInsight/service-insight-bot',
    requiredLocales: [],
    buildCommands: ['npm run build'],
    notes: 'バックエンドサービス + チE��クトップクライアント、E,
  },

  IVIN: {
    code: 'IVIN',
    name: 'InterviewInsight',
    nameJa: 'InterviewInsight',
    platform: 'tauri',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-interview-insight',
    requiredLocales: [],
    buildCommands: ['npm run tauri build'],
    notes: 'Tauri チE��クトップアプリ、E,
  },

  // =========================================================================
  // Tier 2: AI活用チE�Eル
  // =========================================================================

  INMV: {
    code: 'INMV',
    name: 'InsightCast',
    nameJa: 'InsightCast',
    platform: 'python',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'none',
    repository: 'HarmonicInsight/desktop-app-insight-cast',
    requiredLocales: [],
    buildCommands: ['python -m build'],
    notes: 'Python チE��クトップアプリ。直接配币E��E,
  },

  INIG: {
    code: 'INIG',
    name: 'InsightImageGen',
    nameJa: 'InsightImageGen',
    platform: 'python',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'none',
    repository: 'HarmonicInsight/desktop-app-insight-imagegen',
    requiredLocales: [],
    buildCommands: ['python -m build'],
    notes: 'Python チE��クトップアプリ。直接配币E��E,
  },

  // =========================================================================
  // Tier 3: InsightOffice Suite
  // =========================================================================

  INSS: {
    code: 'INSS',
    name: 'InsightOfficeSlide',
    nameJa: 'InsightOfficeSlide',
    platform: 'wpf',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-insight-slide',
    requiredLocales: [],
    buildCommands: ['dotnet build -c Release', 'dotnet publish -c Release'],
    notes: 'WPF チE��クトップアプリ。インスト�Eラーで直接配币E��独自拡張孁E.inss、E,
  },

  IOSH: {
    code: 'IOSH',
    name: 'InsightOfficeSheet',
    nameJa: 'InsightOfficeSheet',
    platform: 'wpf',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-insight-sheet',
    requiredLocales: [],
    buildCommands: ['dotnet build -c Release', 'dotnet publish -c Release'],
    notes: 'WPF チE��クトップアプリ。インスト�Eラーで直接配币E��独自拡張孁E.iosh、E,
  },

  IOSD: {
    code: 'IOSD',
    name: 'InsightOfficeDoc',
    nameJa: 'InsightOfficeDoc',
    platform: 'wpf',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-insight-doc',
    requiredLocales: [],
    buildCommands: ['dotnet build -c Release', 'dotnet publish -c Release'],
    notes: 'WPF チE��クトップアプリ。インスト�Eラーで直接配币E��独自拡張孁E.iosd、E,
  },

  INPY: {
    code: 'INPY',
    name: 'InsightPy',
    nameJa: 'InsightPy',
    platform: 'python',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'none',
    repository: 'HarmonicInsight/desktop-app-insight-py',
    requiredLocales: [],
    buildCommands: ['python -m build'],
    notes: 'Python チE��クトップアプリ。直接配币E��E,
  },

  // =========================================================================
  // Tier 4: シニア向け
  // =========================================================================

  ISOF: {
    code: 'ISOF',
    name: 'InsightSeniorOffice',
    nameJa: 'InsightSeniorOffice',
    platform: 'wpf',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-senior-office',
    requiredLocales: [],
    buildCommands: ['dotnet build -c Release', 'dotnet publish -c Release'],
    notes: 'WPF チE��クトップアプリ。シニア向けシンプル UI、E,
  },

  // =========================================================================
  // ユーチE��リチE��アプリ
  // =========================================================================

  LAUNCHER: {
    code: 'LAUNCHER',
    name: 'InsightLauncher',
    nameJa: 'Insight Launcher',
    platform: 'wpf',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'windows_signing',
    repository: 'HarmonicInsight/desktop-app-insight-launcher',
    requiredLocales: [],
    buildCommands: ['dotnet build -c Release'],
    notes: 'Insight 製品統合ランチャー、E,
  },

  CAMERA: {
    code: 'CAMERA',
    name: 'InsightCamera',
    nameJa: 'スチE��リカメラ',
    platform: 'android_native',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonic.insight.camera',
    repository: 'HarmonicInsight/android-app-insight-camera',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      './gradlew bundleRelease --stacktrace',
      './gradlew assembleRelease --stacktrace',
    ],
    notes: 'Android ネイチE��ブカメラアプリ、EameraX Extensions 搭載。Samsung Galaxy Fold 最適化、E,
  },

  VOICE_CLOCK: {
    code: 'VOICE_CLOCK',
    name: 'InsightVoiceClock',
    nameJa: 'Insight Voice Clock',
    platform: 'expo',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonicinsight.insightvoiceclock',
    repository: 'HarmonicInsight/android-app-insight-voice-clock',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      'eas build --platform android --profile production',
    ],
    notes: 'Expo / React Native。音声時計アプリ、E,
  },

  QR: {
    code: 'QR',
    name: 'InsightQR',
    nameJa: 'Insight QR',
    platform: 'expo',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonicinsight.insightqr',
    repository: 'HarmonicInsight/android-app-insight-qr',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      'eas build --platform android --profile production',
    ],
    notes: 'Expo / React Native。QR コード読み取り・生�E、E,
  },

  PINBOARD: {
    code: 'PINBOARD',
    name: 'InsightPinBoard',
    nameJa: 'Insight PinBoard',
    platform: 'expo',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonicinsight.insightpinboard',
    repository: 'HarmonicInsight/mobile-app-pinboard',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      'eas build --platform android --profile production',
    ],
    notes: 'Expo / React Native。ピンボ�Eドアプリ、E,
  },

  VOICE_MEMO: {
    code: 'VOICE_MEMO',
    name: 'InsightVoiceMemo',
    nameJa: 'Insight Voice Memo',
    platform: 'expo',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonicinsight.insightvoicememo',
    repository: 'HarmonicInsight/mobile-app-voice-memo',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      'eas build --platform android --profile production',
    ],
    notes: 'Expo / React Native。音声メモアプリ、E,
  },

  VOICE_TASK_CALENDAR: {
    code: 'VOICE_TASK_CALENDAR',
    name: 'Shabette Calendar',
    nameJa: 'しゃべってカレンダー',
    platform: 'android_native',
    storeDistribution: 'play_store',
    versioningScheme: 'semver_with_build_number',
    signingMethod: 'android_keystore',
    packageName: 'com.harmonicinsight.insightvoicetaskcalendar',
    repository: 'HarmonicInsight/android-app-voice-tesk-calendar',
    requiredLocales: ANDROID_LOCALES,
    characterLimits: PLAY_STORE_LIMITS,
    metadataBasePath: 'fastlane/metadata/android',
    buildCommands: [
      './gradlew bundleRelease --stacktrace',
      './gradlew assembleRelease --stacktrace',
    ],
    notes: 'Android ネイチE��ブ。しめE��ってカレンダー  E音声入力でタスク・メモ・予定をサクチE��管琁E��E,
  },
};

// =============================================================================
// リリースチェチE��リスト定義
// =============================================================================

export const RELEASE_CHECKLIST: ReleaseCheckItem[] = [

  // ─────────────────────────────────────────────────────────
  // 全プラチE��フォーム共送E
  // ─────────────────────────────────────────────────────────

  // チE��イン
  {
    id: 'D1',
    category: 'design',
    description: 'Gold is used as primary color',
    descriptionJa: 'Gold (#B8942F) が�Eライマリカラーとして使用されてぁE��',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#B8942F\\|#D4BC6A\\|#b8942f\\|#d4bc6a"',
  },
  {
    id: 'D2',
    category: 'design',
    description: 'Ivory is used as background color',
    descriptionJa: 'Ivory (#FAF8F5) が背景色として使用されてぁE��',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#FAF8F5\\|#faf8f5"',
  },
  {
    id: 'D3',
    category: 'design',
    description: 'Blue is NOT used as primary',
    descriptionJa: 'Blue (#2563EB) が�Eライマリとして使用されてぁE��ぁE,
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#2563EB" should return 0 results',
  },

  // コード品質
  {
    id: 'Q1',
    category: 'code_quality',
    description: 'No TODO/FIXME/HACK remaining',
    descriptionJa: 'TODO/FIXME/HACK が残ってぁE��ぁE,
    automation: 'full',
    platforms: [],
    validationHint: 'grep -rn "TODO\\|FIXME\\|HACK" --include="*.kt" --include="*.ts" --include="*.cs" --include="*.py"',
  },
  {
    id: 'Q2',
    category: 'code_quality',
    description: 'No debug output remaining',
    descriptionJa: 'チE��チE��出力！Eonsole.log / print / Log.d�E�が残ってぁE��ぁE,
    automation: 'semi',
    platforms: [],
  },
  {
    id: 'Q3',
    category: 'code_quality',
    description: 'No hardcoded API keys or secrets',
    descriptionJa: 'ハ�Eドコードされた API キー・シークレチE��がなぁE,
    automation: 'full',
    platforms: [],
    validationHint: 'grep -rn "sk-\\|AIza\\|AKIA"',
  },

  // セキュリチE��
  {
    id: 'S1',
    category: 'security',
    description: '.env is in .gitignore',
    descriptionJa: '.env ぁE.gitignore に含まれてぁE��',
    automation: 'full',
    platforms: [],
    validationHint: 'grep ".env" .gitignore',
  },
  {
    id: 'S2',
    category: 'security',
    description: 'Credentials files are excluded from git',
    descriptionJa: 'credentials ファイルぁE.gitignore に含まれてぁE��',
    automation: 'full',
    platforms: [],
  },
  {
    id: 'S3',
    category: 'security',
    description: 'No passwords in documentation files',
    descriptionJa: 'ドキュメントファイルにパスワードが記載されてぁE��ぁE,
    automation: 'semi',
    platforms: [],
    validationHint: 'grep -rn "password\\|Password" --include="*.md"',
  },

  // Git
  {
    id: 'G1',
    category: 'security',
    description: 'No uncommitted changes',
    descriptionJa: '未コミット�E変更がなぁE,
    automation: 'full',
    platforms: [],
    validationHint: 'git status --porcelain',
  },
  {
    id: 'G2',
    category: 'security',
    description: 'In sync with remote',
    descriptionJa: 'リモートと同期済み',
    automation: 'full',
    platforms: [],
    validationHint: 'git status -sb',
  },

  // ─────────────────────────────────────────────────────────
  // Android Native (Kotlin)
  // ─────────────────────────────────────────────────────────

  {
    id: 'A1',
    category: 'version',
    description: 'versionCode is incremented',
    descriptionJa: 'versionCode がインクリメントされてぁE��',
    automation: 'semi',
    platforms: ['android_native'],
    validationHint: 'grep "versionCode" app/build.gradle.kts',
  },
  {
    id: 'A2',
    category: 'version',
    description: 'versionName follows semantic versioning',
    descriptionJa: 'versionName がセマンチE��チE��バ�Eジョニングに準拠',
    automation: 'semi',
    platforms: ['android_native'],
    validationHint: 'grep "versionName" app/build.gradle.kts',
  },
  {
    id: 'A3',
    category: 'build',
    description: 'compileSdk is 35',
    descriptionJa: 'compileSdk = 35',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'grep "compileSdk" app/build.gradle.kts',
  },
  {
    id: 'A4',
    category: 'build',
    description: 'targetSdk is 35',
    descriptionJa: 'targetSdk = 35',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'grep "targetSdk" app/build.gradle.kts',
  },
  {
    id: 'A5',
    category: 'build',
    description: 'minSdk is set appropriately',
    descriptionJa: 'minSdk が適刁E��設定されてぁE��',
    automation: 'full',
    platforms: ['android_native'],
  },
  {
    id: 'A6',
    category: 'build',
    description: 'R8 minification enabled for release',
    descriptionJa: 'isMinifyEnabled = true (release)',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'grep "isMinifyEnabled" app/build.gradle.kts',
  },
  {
    id: 'A7',
    category: 'build',
    description: 'Resource shrinking enabled for release',
    descriptionJa: 'isShrinkResources = true (release)',
    automation: 'full',
    platforms: ['android_native'],
  },
  {
    id: 'A8',
    category: 'build',
    description: 'ProGuard rules exist',
    descriptionJa: 'ProGuard ルールファイルが存在する',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'ls app/proguard-rules.pro',
  },
  {
    id: 'AS1',
    category: 'signing',
    description: 'Release signing config uses environment variables',
    descriptionJa: 'release signingConfig が環墁E��数経由で設定されてぁE��',
    automation: 'semi',
    platforms: ['android_native'],
  },
  {
    id: 'AS2',
    category: 'signing',
    description: 'Keystore files excluded from git',
    descriptionJa: 'キーストアファイルぁE.gitignore で除外されてぁE��',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'grep ".jks\\|.keystore" .gitignore',
  },

  // ローカライゼーション
  {
    id: 'L1',
    category: 'localization',
    description: 'Japanese strings.xml exists',
    descriptionJa: '日本誁Estrings.xml が存在する',
    automation: 'full',
    platforms: ['android_native', 'expo'],
    validationHint: 'ls app/src/main/res/values/strings.xml',
  },
  {
    id: 'L2',
    category: 'localization',
    description: 'English strings.xml exists',
    descriptionJa: '英誁Estrings.xml が存在する',
    automation: 'full',
    platforms: ['android_native', 'expo'],
    validationHint: 'ls app/src/main/res/values-en/strings.xml',
  },

  // ストアメタチE�Eタ
  {
    id: 'AP1',
    category: 'store_metadata',
    description: 'Play Store title (ja-JP) exists and within 30 chars',
    descriptionJa: 'Play Store タイトル�E�日本語）が30斁E��以冁E,
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP2',
    category: 'store_metadata',
    description: 'Play Store title (en-US) exists and within 30 chars',
    descriptionJa: 'Play Store タイトル�E�英語）が30斁E��以冁E,
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP3',
    category: 'store_metadata',
    description: 'Short description exists (ja + en, max 80 chars)',
    descriptionJa: '短ぁE��明（日英�E�が80斁E��以冁E,
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP4',
    category: 'store_metadata',
    description: 'Full description exists (ja + en, max 4000 chars)',
    descriptionJa: '完�Eな説明（日英�E�が4000斁E��以冁E,
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP5',
    category: 'store_metadata',
    description: 'Changelog exists (ja + en, max 500 chars)',
    descriptionJa: 'リリースノ�Eト（日英�E�が500斁E��以冁E,
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },

  // 手動確誁E
  {
    id: 'M1',
    category: 'manual',
    description: 'App basic functionality verified',
    descriptionJa: 'アプリの基本動作確認（主要機�Eが正常に動作するか�E�E,
    automation: 'manual',
    platforms: [],
  },
  {
    id: 'M2',
    category: 'manual',
    description: 'Screenshots prepared for all locales',
    descriptionJa: 'スクリーンショチE��が�Eロケールで準備されてぁE��',
    automation: 'manual',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'M3',
    category: 'manual',
    description: 'Release notes approved',
    descriptionJa: 'リリースノ�Eト�E冁E��が承認されてぁE��',
    automation: 'manual',
    platforms: [],
  },

  // ─────────────────────────────────────────────────────────
  // C# WPF
  // ─────────────────────────────────────────────────────────

  {
    id: 'W1',
    category: 'version',
    description: 'AssemblyVersion updated',
    descriptionJa: 'AssemblyVersion が更新されてぁE��',
    automation: 'semi',
    platforms: ['wpf'],
  },
  {
    id: 'W2',
    category: 'version',
    description: 'FileVersion updated',
    descriptionJa: 'FileVersion が更新されてぁE��',
    automation: 'semi',
    platforms: ['wpf'],
  },
  {
    id: 'W3',
    category: 'signing',
    description: 'Syncfusion key via third-party-licenses.json',
    descriptionJa: 'Syncfusion キーぁEthird-party-licenses.json 経由',
    automation: 'full',
    platforms: ['wpf'],
  },
  {
    id: 'W4',
    category: 'build',
    description: 'File associations registered in installer',
    descriptionJa: '独自拡張子がインスト�Eラーで登録されてぁE��',
    automation: 'manual',
    platforms: ['wpf'],
  },

  // ─────────────────────────────────────────────────────────
  // Expo / React Native
  // ─────────────────────────────────────────────────────────

  {
    id: 'E1',
    category: 'version',
    description: 'app.json version updated',
    descriptionJa: 'app.json の version が更新されてぁE��',
    automation: 'semi',
    platforms: ['expo'],
  },
  {
    id: 'E2',
    category: 'version',
    description: 'android.versionCode incremented',
    descriptionJa: 'android.versionCode がインクリメントされてぁE��',
    automation: 'semi',
    platforms: ['expo'],
  },
  {
    id: 'E3',
    category: 'build',
    description: 'eas.json production profile exists',
    descriptionJa: 'eas.json の production プロファイルが存在する',
    automation: 'full',
    platforms: ['expo'],
  },
  {
    id: 'E4',
    category: 'build',
    description: 'Production builds app-bundle',
    descriptionJa: 'production ぁEapp-bundle ビルチE,
    automation: 'full',
    platforms: ['expo'],
  },

  // ─────────────────────────────────────────────────────────
  // Python
  // ─────────────────────────────────────────────────────────

  {
    id: 'P1',
    category: 'version',
    description: 'pyproject.toml version updated',
    descriptionJa: 'pyproject.toml のバ�Eジョンが更新されてぁE��',
    automation: 'semi',
    platforms: ['python'],
  },
  {
    id: 'P2',
    category: 'build',
    description: 'All dependencies pinned with ==',
    descriptionJa: '全依存パチE��ージがピン留め�E�E=�E�されてぁE��',
    automation: 'full',
    platforms: ['python'],
  },

  // ─────────────────────────────────────────────────────────
  // Web (React / Next.js)
  // ─────────────────────────────────────────────────────────

  {
    id: 'R1',
    category: 'version',
    description: 'package.json version updated',
    descriptionJa: 'package.json のバ�Eジョンが更新されてぁE��',
    automation: 'semi',
    platforms: ['web'],
  },
  {
    id: 'R2',
    category: 'build',
    description: 'TypeScript strict mode enabled',
    descriptionJa: 'TypeScript strict mode が有効',
    automation: 'full',
    platforms: ['web'],
  },
];

// =============================================================================
// スチE��リカメラ Play Store メタチE�EタチE��プレーチE
// =============================================================================

/**
 * スチE��リカメラ用の Play Store メタチE�EタチE��プレーチE
 *
 * こ�EチE��プレートを基に fastlane/metadata/android/ チE��レクトリを構�Eする、E
 * 斁E��数は吁E��ィールド�E上限値冁E��収める忁E��がある、E
 */
export const CAMERA_STORE_METADATA: Record<string, StoreMetadata> = {
  'ja-JP': {
    locale: 'ja-JP',
    title: 'スチE��リカメラ',  // 6斁E��（上限30�E�E
    shortDescription: 'シンプルで綺麗に撮れるカメラ。常時ライト�EワンタチE�E操作�EOEM画質自動適用、E,  // 37斁E��（上限80�E�E
    fullDescription:
      'スチE��リカメラは「難しいことを老E��なくても綺麗な写真が撮れる」をコンセプトにした、シンプルなカメラアプリです、En\n' +
      '■ 主な特徴\n' +
      '・常時ライト点灯  E撮影構図を確認しながらフラチE��ュライトを常晁EON にできます\n' +
      '・OEM 画質の自動適用  ECameraX Extensions により端末メーカーの画像�E琁E��EDR・夜景・ボケ�E�を自動活用\n' +
      '・ワンタチE�E操佁E Eフォーカス、撮影、E��画がすべてワンタチE�Eで完結\n\n' +
      '■ 撮影機�E\n' +
      '・写真撮影�E�EPEG 最高画質�E�\n' +
      '・動画録画�E�EP4 最高画質・音声付き�E�\n' +
      '・タチE�Eでフォーカス�E�EF/AE 自動調整�E�\n' +
      '・フラチE��ュモード！EFF / ON / AUTO�E�\n' +
      '・セルフタイマ�E�E�EFF / 3私E/ 10秒）\n' +
      '・アスペクト比！E:3 / 16:9�E�\n' +
      '・ピンチズーム + プリセチE���E�E.5x、E0x�E�\n\n' +
      '■ 対応端末\n' +
      '・Samsung Galaxy Fold / S シリーズ�E�最適化済み�E�\n' +
      '・Google Pixel\n' +
      '・そ�E仁EAndroid 端末�E�Extensions はメーカーにより異なります）\n\n' +
      '■ プライバシー\n' +
      '・チE�Eタ収集なし\n' +
      '・インターネット接続不要\n' +
      '・忁E��な権陁E カメラ、�Eイク�E�録画時�Eみ�E�E,
    changelog:
      'v1.0.0 初回リリース\n' +
      '・写真撮影・動画録画\n' +
      '・常時ライト点灯\n' +
      '・CameraX Extensions�E�EUTO / HDR / Night / Bokeh / Beauty�E�\n' +
      '・ピンチズーム + プリセチE��\n' +
      '・セルフタイマ�E\n' +
      '・4:3 / 16:9 アスペクト比�E替',
  },
  'en-US': {
    locale: 'en-US',
    title: 'Insight Camera',  // 14 chars (max 30)
    shortDescription: 'Simple camera with great photos. Always-on light, one-tap, auto OEM quality.',  // 76 chars (max 80)
    fullDescription:
      'Insight Camera is a simple camera app designed to take beautiful photos without complexity.\n\n' +
      '■ Key Features\n' +
      '• Always-on Flashlight  EKeep the flash on while composing your shot\n' +
      '• Auto OEM Quality  ECameraX Extensions automatically apply your device manufacturer\'s image processing (HDR, Night, Bokeh)\n' +
      '• One-tap Operation  EFocus, capture, and record with a single tap\n\n' +
      '■ Camera Features\n' +
      '• Photo Capture (highest quality JPEG)\n' +
      '• Video Recording (MP4 with audio)\n' +
      '• Tap to Focus (AF/AE auto adjustment)\n' +
      '• Flash Mode (OFF / ON / AUTO)\n' +
      '• Self-timer (OFF / 3s / 10s)\n' +
      '• Aspect Ratio (4:3 / 16:9)\n' +
      '• Pinch Zoom + Presets (0.5x to 10x)\n\n' +
      '■ Supported Devices\n' +
      '• Samsung Galaxy Fold / S Series (optimized)\n' +
      '• Google Pixel\n' +
      '• Other Android devices (Extensions vary by manufacturer)\n\n' +
      '■ Privacy\n' +
      '• No data collection\n' +
      '• No internet required\n' +
      '• Permissions: Camera, Microphone (recording only)',
    changelog:
      'v1.0.0 Initial Release\n' +
      '• Photo capture & video recording\n' +
      '• Always-on flashlight\n' +
      '• CameraX Extensions (AUTO / HDR / Night / Bokeh / Beauty)\n' +
      '• Pinch zoom + presets\n' +
      '• Self-timer\n' +
      '• 4:3 / 16:9 aspect ratio switching',
  },
};

// =============================================================================
// ヘルパ�E関数
// =============================================================================

/**
 * リリース設定を取征E
 */
export function getReleaseConfig(code: ReleaseTargetCode): ReleaseConfig {
  return RELEASE_CONFIGS[code];
}

/**
 * プラチE��フォーム別のリリース対象を取征E
 */
export function getReleasesByPlatform(platform: ReleasePlatform): ReleaseConfig[] {
  return Object.values(RELEASE_CONFIGS).filter(c => c.platform === platform);
}

/**
 * ストア配信が忁E��な製品を取征E
 */
export function getStoreReleases(): ReleaseConfig[] {
  return Object.values(RELEASE_CONFIGS).filter(
    c => c.storeDistribution === 'play_store' || c.storeDistribution === 'app_store',
  );
}

/**
 * プラチE��フォームに適用されるチェチE��リストを取征E
 */
export function getReleaseChecklist(platform: ReleasePlatform): ReleaseCheckItem[] {
  return RELEASE_CHECKLIST.filter(
    item => item.platforms.length === 0 || item.platforms.includes(platform),
  );
}

/**
 * ストアメタチE�Eタを検証
 */
export function validateStoreMetadata(
  code: ReleaseTargetCode,
  metadata: StoreMetadata[],
): MetadataValidationResult {
  const config = RELEASE_CONFIGS[code];
  const errors: MetadataValidationError[] = [];
  const warnings: MetadataValidationWarning[] = [];

  if (!config.characterLimits) {
    return { valid: true, errors: [], warnings: [] };
  }

  const limits = config.characterLimits;

  // 忁E��ロケールの存在チェチE��
  for (const locale of config.requiredLocales) {
    if (!locale.required) continue;
    const meta = metadata.find(m => m.locale === locale.directory);
    if (!meta) {
      errors.push({
        locale: locale.directory,
        field: 'all',
        message: `Required locale "${locale.directory}" metadata is missing`,
        messageJa: `忁E��ロケール、E{locale.directory}」�EメタチE�Eタが存在しません`,
      });
      continue;
    }

    // 吁E��ィールド�E検証
    validateField(meta, 'title', limits.title, locale.directory, errors, warnings);
    validateField(meta, 'shortDescription', limits.shortDescription, locale.directory, errors, warnings);
    validateField(meta, 'fullDescription', limits.fullDescription, locale.directory, errors, warnings);
    validateField(meta, 'changelog', limits.changelog, locale.directory, errors, warnings);

    if (limits.subtitle !== undefined) {
      validateField(meta, 'subtitle', limits.subtitle, locale.directory, errors, warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 個別フィールド�E検証
 */
function validateField(
  meta: StoreMetadata,
  field: keyof StoreMetadata,
  maxLength: number,
  locale: string,
  errors: MetadataValidationError[],
  warnings: MetadataValidationWarning[],
): void {
  const value = meta[field];

  if (field === 'locale') return;

  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    errors.push({
      locale,
      field,
      message: `"${field}" is missing for locale "${locale}"`,
      messageJa: `ロケール、E{locale}」�E、E{field}」が未設定です`,
    });
    return;
  }

  if (typeof value === 'string' && value.length > maxLength) {
    errors.push({
      locale,
      field,
      message: `"${field}" exceeds character limit (${value.length}/${maxLength})`,
      messageJa: `、E{field}」が斁E��数制限を趁E��てぁE��す！E{value.length}/${maxLength}斁E��）`,
      currentLength: value.length,
      maxLength,
    });
  }
}

/**
 * ストアメタチE�EタチE��プレートを取得（製品別�E�E
 */
export function getStoreMetadataTemplate(code: ReleaseTargetCode): Record<string, StoreMetadata> | null {
  if (code === 'CAMERA') return CAMERA_STORE_METADATA;
  return null;
}

/**
 * semver 形式�Eバ�Eジョンを解极E
 */
export function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * semver バ�EジョンをインクリメンチE
 */
export function incrementVersion(
  version: string,
  type: 'major' | 'minor' | 'patch',
): string | null {
  const parsed = parseSemver(version);
  if (!parsed) return null;

  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

/**
 * Android 用: versionCode と versionName の整合性チェチE��
 */
export function validateAndroidVersion(
  versionCode: number,
  versionName: string,
): { valid: boolean; message: string; messageJa: string } {
  if (versionCode < 1) {
    return {
      valid: false,
      message: 'versionCode must be >= 1',
      messageJa: 'versionCode は 1 以上である忁E��がありまぁE,
    };
  }

  const parsed = parseSemver(versionName);
  if (!parsed) {
    return {
      valid: false,
      message: `versionName "${versionName}" does not follow semantic versioning (x.y.z)`,
      messageJa: `versionName、E{versionName}」がセマンチE��チE��バ�Eジョニング�E�E.y.z�E�に準拠してぁE��せん`,
    };
  }

  return {
    valid: true,
    message: `Version OK: ${versionName} (code: ${versionCode})`,
    messageJa: `バ�Eジョン OK: ${versionName} (code: ${versionCode})`,
  };
}

// =============================================================================
// エクスポ�EチE
// =============================================================================

export default {
  RELEASE_CONFIGS,
  RELEASE_CHECKLIST,
  PLAY_STORE_LIMITS,
  APP_STORE_LIMITS,
  CAMERA_STORE_METADATA,
  getReleaseConfig,
  getReleasesByPlatform,
  getStoreReleases,
  getReleaseChecklist,
  validateStoreMetadata,
  getStoreMetadataTemplate,
  parseSemver,
  incrementVersion,
  validateAndroidVersion,
};
