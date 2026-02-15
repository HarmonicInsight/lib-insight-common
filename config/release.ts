/**
 * HARMONIC insight リリース管理モジュール
 *
 * ============================================================================
 * 【リリース管理の設計方針】
 * ============================================================================
 *
 * ## 概要
 * 全製品・ユーティリティアプリのリリース設定、バージョン管理、
 * ストアメタデータ検証、リリースチェックリストを型安全に管理する。
 *
 * ## 対象
 * - 製品（ProductCode）: INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN, ISOF
 * - ユーティリティ（UtilityCode）: LAUNCHER, CAMERA, VOICE_CLOCK, QR, PINBOARD, VOICE_MEMO
 *
 * ## リリースフロー
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  1. バージョン更新                                              │
 * │     updateVersion() でバージョンコード・バージョン名を更新       │
 * │                                                                 │
 * │  2. リリースチェック実行                                        │
 * │     /release-check または release-check.sh                      │
 * │     → Phase 1〜5 の段階的検証                                   │
 * │                                                                 │
 * │  3. ストアメタデータ検証                                        │
 * │     validateStoreMetadata() で文字数制限・必須ファイルを検証     │
 * │                                                                 │
 * │  4. ビルド & 署名                                               │
 * │     プラットフォーム固有のビルドコマンドを実行                    │
 * │                                                                 │
 * │  5. ストア提出                                                  │
 * │     Play Store / App Store / 直接配布                           │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ## 使用例
 *
 * ```typescript
 * import {
 *   getReleaseConfig,
 *   validateStoreMetadata,
 *   getReleaseChecklist,
 *   getStoreMetadataTemplate,
 * } from '@/insight-common/config/release';
 *
 * // リリース設定を取得
 * const config = getReleaseConfig('CAMERA');
 * config.platform;           // 'android_native'
 * config.storeDistribution;  // 'play_store'
 *
 * // ストアメタデータの検証
 * const result = validateStoreMetadata('CAMERA', metadata);
 * result.valid;      // true / false
 * result.errors;     // 検証エラー一覧
 *
 * // リリースチェックリストの取得
 * const checklist = getReleaseChecklist('android_native');
 * ```
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** ユーティリティアプリコード */
export type UtilityCode = 'LAUNCHER' | 'CAMERA' | 'VOICE_CLOCK' | 'QR' | 'PINBOARD' | 'VOICE_MEMO';

/** リリース対象コード（製品 + ユーティリティ） */
export type ReleaseTargetCode = ProductCode | UtilityCode;

/** 配信プラットフォーム */
export type ReleasePlatform =
  | 'android_native'    // Android (Native Kotlin)
  | 'expo'              // Expo / React Native
  | 'wpf'               // C# WPF (Windows)
  | 'web'               // React / Next.js
  | 'python'            // Python
  | 'tauri'             // Tauri (cross-platform desktop)
  | 'service';          // Backend service

/** ストア配信先 */
export type StoreDistribution =
  | 'play_store'        // Google Play Store
  | 'app_store'         // Apple App Store
  | 'microsoft_store'   // Microsoft Store
  | 'direct'            // 直接配布（インストーラー / PyPI）
  | 'web_deploy'        // Web デプロイ（Vercel / Railway）
  | 'none';             // 配信なし（ライブラリ等）

/** バージョニング方式 */
export type VersioningScheme =
  | 'semver'                    // x.y.z (Semantic Versioning)
  | 'semver_with_build_number'  // x.y.z + versionCode
  | 'calver';                   // YYYY.MM.patch

/** 署名方式 */
export type SigningMethod =
  | 'android_keystore'   // Android Keystore (.jks / .keystore)
  | 'apple_signing'      // Apple Code Signing (Provisioning Profile)
  | 'windows_signing'    // Windows Code Signing (Authenticode)
  | 'none';              // 署名なし

/** ストアメタデータの文字数制限 */
export interface StoreCharacterLimits {
  /** アプリ名 / タイトル */
  title: number;
  /** 短い説明 */
  shortDescription: number;
  /** 完全な説明 */
  fullDescription: number;
  /** リリースノート / Changelog */
  changelog: number;
  /** サブタイトル（App Store のみ） */
  subtitle?: number;
}

/** ストアメタデータのロケール設定 */
export interface StoreLocale {
  /** ロケールコード */
  code: string;
  /** ディレクトリ名（fastlane 形式） */
  directory: string;
  /** 必須かどうか */
  required: boolean;
}

/** リリース設定 */
export interface ReleaseConfig {
  /** リリース対象コード */
  code: ReleaseTargetCode;
  /** 製品名 */
  name: string;
  /** 製品名（日本語） */
  nameJa: string;
  /** 配信プラットフォーム */
  platform: ReleasePlatform;
  /** ストア配信先 */
  storeDistribution: StoreDistribution;
  /** バージョニング方式 */
  versioningScheme: VersioningScheme;
  /** 署名方式 */
  signingMethod: SigningMethod;
  /** パッケージ名 / Bundle ID */
  packageName?: string;
  /** リポジトリ名 */
  repository: string;
  /** 必須ロケール */
  requiredLocales: StoreLocale[];
  /** ストア文字数制限 */
  characterLimits?: StoreCharacterLimits;
  /** fastlane メタデータのベースパス */
  metadataBasePath?: string;
  /** ビルドコマンド（リリース用） */
  buildCommands: string[];
  /** 備考 */
  notes?: string;
}

/** ストアメタデータ */
export interface StoreMetadata {
  locale: string;
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  changelog?: string;
  subtitle?: string;
}

/** メタデータ検証結果 */
export interface MetadataValidationResult {
  valid: boolean;
  errors: MetadataValidationError[];
  warnings: MetadataValidationWarning[];
}

/** メタデータ検証エラー */
export interface MetadataValidationError {
  locale: string;
  field: string;
  message: string;
  messageJa: string;
  currentLength?: number;
  maxLength?: number;
}

/** メタデータ検証警告 */
export interface MetadataValidationWarning {
  locale: string;
  field: string;
  message: string;
  messageJa: string;
}

/** リリースチェックリスト項目 */
export interface ReleaseCheckItem {
  /** チェック ID */
  id: string;
  /** カテゴリ */
  category: 'design' | 'version' | 'signing' | 'code_quality' | 'security' | 'localization' | 'store_metadata' | 'build' | 'manual';
  /** チェック内容 */
  description: string;
  /** チェック内容（日本語） */
  descriptionJa: string;
  /** 自動化レベル */
  automation: 'full' | 'semi' | 'manual';
  /** 対象プラットフォーム（空 = 全プラットフォーム共通） */
  platforms: ReleasePlatform[];
  /** 検証コマンド（自動の場合） */
  validationHint?: string;
}

// =============================================================================
// Play Store 文字数制限
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
// 必須ロケール定義
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
// リリース設定（全製品 + ユーティリティ）
// =============================================================================

export const RELEASE_CONFIGS: Record<ReleaseTargetCode, ReleaseConfig> = {

  // =========================================================================
  // Tier 1: 業務変革ツール
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
    notes: 'Tauri デスクトップアプリ。インストーラーで直接配布。',
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
    notes: 'バックエンドサービス + デスクトップクライアント。',
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
    notes: 'Tauri デスクトップアプリ。',
  },

  // =========================================================================
  // Tier 2: AI活用ツール
  // =========================================================================

  INMV: {
    code: 'INMV',
    name: 'InsightMovie',
    nameJa: 'InsightMovie',
    platform: 'python',
    storeDistribution: 'direct',
    versioningScheme: 'semver',
    signingMethod: 'none',
    repository: 'HarmonicInsight/desktop-app-insight-movie',
    requiredLocales: [],
    buildCommands: ['python -m build'],
    notes: 'Python デスクトップアプリ。直接配布。',
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
    notes: 'Python デスクトップアプリ。直接配布。',
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
    notes: 'WPF デスクトップアプリ。インストーラーで直接配布。独自拡張子 .inss。',
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
    notes: 'WPF デスクトップアプリ。インストーラーで直接配布。独自拡張子 .iosh。',
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
    notes: 'WPF デスクトップアプリ。インストーラーで直接配布。独自拡張子 .iosd。',
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
    notes: 'Python デスクトップアプリ。直接配布。',
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
    notes: 'WPF デスクトップアプリ。シニア向けシンプル UI。',
  },

  // =========================================================================
  // ユーティリティアプリ
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
    notes: 'Insight 製品統合ランチャー。',
  },

  CAMERA: {
    code: 'CAMERA',
    name: 'InsightCamera',
    nameJa: 'Insight Camera',
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
    notes: 'Android ネイティブカメラアプリ。CameraX Extensions 搭載。Samsung Galaxy Fold 最適化。',
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
    notes: 'Expo / React Native。音声時計アプリ。',
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
    notes: 'Expo / React Native。QR コード読み取り・生成。',
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
    notes: 'Expo / React Native。ピンボードアプリ。',
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
    notes: 'Expo / React Native。音声メモアプリ。',
  },
};

// =============================================================================
// リリースチェックリスト定義
// =============================================================================

export const RELEASE_CHECKLIST: ReleaseCheckItem[] = [

  // ─────────────────────────────────────────────────────────
  // 全プラットフォーム共通
  // ─────────────────────────────────────────────────────────

  // デザイン
  {
    id: 'D1',
    category: 'design',
    description: 'Gold is used as primary color',
    descriptionJa: 'Gold (#B8942F) がプライマリカラーとして使用されている',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#B8942F\\|#D4BC6A\\|#b8942f\\|#d4bc6a"',
  },
  {
    id: 'D2',
    category: 'design',
    description: 'Ivory is used as background color',
    descriptionJa: 'Ivory (#FAF8F5) が背景色として使用されている',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#FAF8F5\\|#faf8f5"',
  },
  {
    id: 'D3',
    category: 'design',
    description: 'Blue is NOT used as primary',
    descriptionJa: 'Blue (#2563EB) がプライマリとして使用されていない',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -r "#2563EB" should return 0 results',
  },

  // コード品質
  {
    id: 'Q1',
    category: 'code_quality',
    description: 'No TODO/FIXME/HACK remaining',
    descriptionJa: 'TODO/FIXME/HACK が残っていない',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -rn "TODO\\|FIXME\\|HACK" --include="*.kt" --include="*.ts" --include="*.cs" --include="*.py"',
  },
  {
    id: 'Q2',
    category: 'code_quality',
    description: 'No debug output remaining',
    descriptionJa: 'デバッグ出力（console.log / print / Log.d）が残っていない',
    automation: 'semi',
    platforms: [],
  },
  {
    id: 'Q3',
    category: 'code_quality',
    description: 'No hardcoded API keys or secrets',
    descriptionJa: 'ハードコードされた API キー・シークレットがない',
    automation: 'full',
    platforms: [],
    validationHint: 'grep -rn "sk-\\|AIza\\|AKIA"',
  },

  // セキュリティ
  {
    id: 'S1',
    category: 'security',
    description: '.env is in .gitignore',
    descriptionJa: '.env が .gitignore に含まれている',
    automation: 'full',
    platforms: [],
    validationHint: 'grep ".env" .gitignore',
  },
  {
    id: 'S2',
    category: 'security',
    description: 'Credentials files are excluded from git',
    descriptionJa: 'credentials ファイルが .gitignore に含まれている',
    automation: 'full',
    platforms: [],
  },
  {
    id: 'S3',
    category: 'security',
    description: 'No passwords in documentation files',
    descriptionJa: 'ドキュメントファイルにパスワードが記載されていない',
    automation: 'semi',
    platforms: [],
    validationHint: 'grep -rn "password\\|Password" --include="*.md"',
  },

  // Git
  {
    id: 'G1',
    category: 'security',
    description: 'No uncommitted changes',
    descriptionJa: '未コミットの変更がない',
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
    descriptionJa: 'versionCode がインクリメントされている',
    automation: 'semi',
    platforms: ['android_native'],
    validationHint: 'grep "versionCode" app/build.gradle.kts',
  },
  {
    id: 'A2',
    category: 'version',
    description: 'versionName follows semantic versioning',
    descriptionJa: 'versionName がセマンティックバージョニングに準拠',
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
    descriptionJa: 'minSdk が適切に設定されている',
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
    descriptionJa: 'release signingConfig が環境変数経由で設定されている',
    automation: 'semi',
    platforms: ['android_native'],
  },
  {
    id: 'AS2',
    category: 'signing',
    description: 'Keystore files excluded from git',
    descriptionJa: 'キーストアファイルが .gitignore で除外されている',
    automation: 'full',
    platforms: ['android_native'],
    validationHint: 'grep ".jks\\|.keystore" .gitignore',
  },

  // ローカライゼーション
  {
    id: 'L1',
    category: 'localization',
    description: 'Japanese strings.xml exists',
    descriptionJa: '日本語 strings.xml が存在する',
    automation: 'full',
    platforms: ['android_native', 'expo'],
    validationHint: 'ls app/src/main/res/values/strings.xml',
  },
  {
    id: 'L2',
    category: 'localization',
    description: 'English strings.xml exists',
    descriptionJa: '英語 strings.xml が存在する',
    automation: 'full',
    platforms: ['android_native', 'expo'],
    validationHint: 'ls app/src/main/res/values-en/strings.xml',
  },

  // ストアメタデータ
  {
    id: 'AP1',
    category: 'store_metadata',
    description: 'Play Store title (ja-JP) exists and within 30 chars',
    descriptionJa: 'Play Store タイトル（日本語）が30文字以内',
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP2',
    category: 'store_metadata',
    description: 'Play Store title (en-US) exists and within 30 chars',
    descriptionJa: 'Play Store タイトル（英語）が30文字以内',
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP3',
    category: 'store_metadata',
    description: 'Short description exists (ja + en, max 80 chars)',
    descriptionJa: '短い説明（日英）が80文字以内',
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP4',
    category: 'store_metadata',
    description: 'Full description exists (ja + en, max 4000 chars)',
    descriptionJa: '完全な説明（日英）が4000文字以内',
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'AP5',
    category: 'store_metadata',
    description: 'Changelog exists (ja + en, max 500 chars)',
    descriptionJa: 'リリースノート（日英）が500文字以内',
    automation: 'full',
    platforms: ['android_native', 'expo'],
  },

  // 手動確認
  {
    id: 'M1',
    category: 'manual',
    description: 'App basic functionality verified',
    descriptionJa: 'アプリの基本動作確認（主要機能が正常に動作するか）',
    automation: 'manual',
    platforms: [],
  },
  {
    id: 'M2',
    category: 'manual',
    description: 'Screenshots prepared for all locales',
    descriptionJa: 'スクリーンショットが全ロケールで準備されている',
    automation: 'manual',
    platforms: ['android_native', 'expo'],
  },
  {
    id: 'M3',
    category: 'manual',
    description: 'Release notes approved',
    descriptionJa: 'リリースノートの内容が承認されている',
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
    descriptionJa: 'AssemblyVersion が更新されている',
    automation: 'semi',
    platforms: ['wpf'],
  },
  {
    id: 'W2',
    category: 'version',
    description: 'FileVersion updated',
    descriptionJa: 'FileVersion が更新されている',
    automation: 'semi',
    platforms: ['wpf'],
  },
  {
    id: 'W3',
    category: 'signing',
    description: 'Syncfusion key via third-party-licenses.json',
    descriptionJa: 'Syncfusion キーが third-party-licenses.json 経由',
    automation: 'full',
    platforms: ['wpf'],
  },
  {
    id: 'W4',
    category: 'build',
    description: 'File associations registered in installer',
    descriptionJa: '独自拡張子がインストーラーで登録されている',
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
    descriptionJa: 'app.json の version が更新されている',
    automation: 'semi',
    platforms: ['expo'],
  },
  {
    id: 'E2',
    category: 'version',
    description: 'android.versionCode incremented',
    descriptionJa: 'android.versionCode がインクリメントされている',
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
    descriptionJa: 'production が app-bundle ビルド',
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
    descriptionJa: 'pyproject.toml のバージョンが更新されている',
    automation: 'semi',
    platforms: ['python'],
  },
  {
    id: 'P2',
    category: 'build',
    description: 'All dependencies pinned with ==',
    descriptionJa: '全依存パッケージがピン留め（==）されている',
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
    descriptionJa: 'package.json のバージョンが更新されている',
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
// Insight Camera Play Store メタデータテンプレート
// =============================================================================

/**
 * Insight Camera 用の Play Store メタデータテンプレート
 *
 * このテンプレートを基に fastlane/metadata/android/ ディレクトリを構成する。
 * 文字数は各フィールドの上限値内に収める必要がある。
 */
export const CAMERA_STORE_METADATA: Record<string, StoreMetadata> = {
  'ja-JP': {
    locale: 'ja-JP',
    title: 'Insight Camera',  // 14文字（上限30）
    shortDescription: 'シンプルで綺麗に撮れるカメラ。常時ライト・ワンタップ操作・OEM画質自動適用。',  // 37文字（上限80）
    fullDescription:
      'Insight Camera は「難しいことを考えなくても綺麗な写真が撮れる」をコンセプトにした、シンプルなカメラアプリです。\n\n' +
      '■ 主な特徴\n' +
      '・常時ライト点灯 — 撮影構図を確認しながらフラッシュライトを常時 ON にできます\n' +
      '・OEM 画質の自動適用 — CameraX Extensions により端末メーカーの画像処理（HDR・夜景・ボケ）を自動活用\n' +
      '・ワンタップ操作 — フォーカス、撮影、録画がすべてワンタップで完結\n\n' +
      '■ 撮影機能\n' +
      '・写真撮影（JPEG 最高画質）\n' +
      '・動画録画（MP4 最高画質・音声付き）\n' +
      '・タップでフォーカス（AF/AE 自動調整）\n' +
      '・フラッシュモード（OFF / ON / AUTO）\n' +
      '・セルフタイマー（OFF / 3秒 / 10秒）\n' +
      '・アスペクト比（4:3 / 16:9）\n' +
      '・ピンチズーム + プリセット（0.5x〜10x）\n\n' +
      '■ 対応端末\n' +
      '・Samsung Galaxy Fold / S シリーズ（最適化済み）\n' +
      '・Google Pixel\n' +
      '・その他 Android 端末（Extensions はメーカーにより異なります）\n\n' +
      '■ プライバシー\n' +
      '・データ収集なし\n' +
      '・インターネット接続不要\n' +
      '・必要な権限: カメラ、マイク（録画時のみ）',
    changelog:
      'v1.0.0 初回リリース\n' +
      '・写真撮影・動画録画\n' +
      '・常時ライト点灯\n' +
      '・CameraX Extensions（AUTO / HDR / Night / Bokeh / Beauty）\n' +
      '・ピンチズーム + プリセット\n' +
      '・セルフタイマー\n' +
      '・4:3 / 16:9 アスペクト比切替',
  },
  'en-US': {
    locale: 'en-US',
    title: 'Insight Camera',  // 14 chars (max 30)
    shortDescription: 'Simple camera with great photos. Always-on light, one-tap, auto OEM quality.',  // 76 chars (max 80)
    fullDescription:
      'Insight Camera is a simple camera app designed to take beautiful photos without complexity.\n\n' +
      '■ Key Features\n' +
      '• Always-on Flashlight — Keep the flash on while composing your shot\n' +
      '• Auto OEM Quality — CameraX Extensions automatically apply your device manufacturer\'s image processing (HDR, Night, Bokeh)\n' +
      '• One-tap Operation — Focus, capture, and record with a single tap\n\n' +
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
// ヘルパー関数
// =============================================================================

/**
 * リリース設定を取得
 */
export function getReleaseConfig(code: ReleaseTargetCode): ReleaseConfig {
  return RELEASE_CONFIGS[code];
}

/**
 * プラットフォーム別のリリース対象を取得
 */
export function getReleasesByPlatform(platform: ReleasePlatform): ReleaseConfig[] {
  return Object.values(RELEASE_CONFIGS).filter(c => c.platform === platform);
}

/**
 * ストア配信が必要な製品を取得
 */
export function getStoreReleases(): ReleaseConfig[] {
  return Object.values(RELEASE_CONFIGS).filter(
    c => c.storeDistribution === 'play_store' || c.storeDistribution === 'app_store',
  );
}

/**
 * プラットフォームに適用されるチェックリストを取得
 */
export function getReleaseChecklist(platform: ReleasePlatform): ReleaseCheckItem[] {
  return RELEASE_CHECKLIST.filter(
    item => item.platforms.length === 0 || item.platforms.includes(platform),
  );
}

/**
 * ストアメタデータを検証
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

  // 必須ロケールの存在チェック
  for (const locale of config.requiredLocales) {
    if (!locale.required) continue;
    const meta = metadata.find(m => m.locale === locale.directory);
    if (!meta) {
      errors.push({
        locale: locale.directory,
        field: 'all',
        message: `Required locale "${locale.directory}" metadata is missing`,
        messageJa: `必須ロケール「${locale.directory}」のメタデータが存在しません`,
      });
      continue;
    }

    // 各フィールドの検証
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
 * 個別フィールドの検証
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
      messageJa: `ロケール「${locale}」の「${field}」が未設定です`,
    });
    return;
  }

  if (typeof value === 'string' && value.length > maxLength) {
    errors.push({
      locale,
      field,
      message: `"${field}" exceeds character limit (${value.length}/${maxLength})`,
      messageJa: `「${field}」が文字数制限を超えています（${value.length}/${maxLength}文字）`,
      currentLength: value.length,
      maxLength,
    });
  }
}

/**
 * ストアメタデータテンプレートを取得（製品別）
 */
export function getStoreMetadataTemplate(code: ReleaseTargetCode): Record<string, StoreMetadata> | null {
  if (code === 'CAMERA') return CAMERA_STORE_METADATA;
  return null;
}

/**
 * semver 形式のバージョンを解析
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
 * semver バージョンをインクリメント
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
 * Android 用: versionCode と versionName の整合性チェック
 */
export function validateAndroidVersion(
  versionCode: number,
  versionName: string,
): { valid: boolean; message: string; messageJa: string } {
  if (versionCode < 1) {
    return {
      valid: false,
      message: 'versionCode must be >= 1',
      messageJa: 'versionCode は 1 以上である必要があります',
    };
  }

  const parsed = parseSemver(versionName);
  if (!parsed) {
    return {
      valid: false,
      message: `versionName "${versionName}" does not follow semantic versioning (x.y.z)`,
      messageJa: `versionName「${versionName}」がセマンティックバージョニング（x.y.z）に準拠していません`,
    };
  }

  return {
    valid: true,
    message: `Version OK: ${versionName} (code: ${versionCode})`,
    messageJa: `バージョン OK: ${versionName} (code: ${versionCode})`,
  };
}

// =============================================================================
// エクスポート
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
