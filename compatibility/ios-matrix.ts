/**
 * iOS ツールチェーン & ライブラリ互換性マトリクス
 *
 * ============================================================================
 * 【重要】Xcode / Swift / ライブラリバージョンの組み合わせ OK/NG を一元管理
 * ============================================================================
 *
 * ## 目的
 * - Xcode / Swift / iOS SDK の互換性を明確化
 * - ライブラリバージョンアップ時の衝突を事前に検知
 * - 新規プロジェクト作成時の推奨バージョンを提供
 * - 「バージョン地獄」を回避するための知識ベース
 *
 * ## 重要な注意点 (2025年〜)
 * Apple は WWDC 2025 で Xcode 16 → Xcode 26 にジャンプ（Xcode 17〜25 は存在しない）
 * 同様に iOS 18 → iOS 26 にジャンプ
 *
 * ## 更新頻度
 * - Xcode の新バージョンリリース時に更新
 * - 主要ライブラリの安定版リリース時に更新
 * - 少なくとも月1回は最新状態を確認
 *
 * ## 最終リサーチ日: 2026-02-16
 */

import type { CompatStatus, CompatibilityRule, LibraryInfo } from './android-matrix';

// =============================================================================
// 型定義
// =============================================================================

export interface XcodeVersion {
  xcode: string;
  swift: string;
  iosSdk: string;
  minMacOS: string;
  deploymentTargetRange: { min: string; max: string };
  releaseDate: string;
}

export interface IosToolchainProfile {
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  xcode: string;
  swift: string;
  swiftLanguageMode: '5' | '6';
  iosSdk: string;
  deploymentTarget: string;
  macosRequired: string;
  packageManager: 'spm';
}

// =============================================================================
// Xcode バージョン履歴
// =============================================================================

export const XCODE_VERSIONS: XcodeVersion[] = [

  // --- Xcode 15.x ---
  { xcode: '15.0',   swift: '5.9',   iosSdk: '17.0', minMacOS: 'macOS 13.5 (Ventura)',  deploymentTargetRange: { min: 'iOS 12', max: 'iOS 17' },   releaseDate: '2023-09-18' },
  { xcode: '15.1',   swift: '5.9.2', iosSdk: '17.2', minMacOS: 'macOS 13.5',            deploymentTargetRange: { min: 'iOS 12', max: 'iOS 17.2' }, releaseDate: '2023-12-11' },
  { xcode: '15.3',   swift: '5.10',  iosSdk: '17.4', minMacOS: 'macOS 14.0 (Sonoma)',   deploymentTargetRange: { min: 'iOS 12', max: 'iOS 17.4' }, releaseDate: '2024-03-05' },
  { xcode: '15.4',   swift: '5.10',  iosSdk: '17.5', minMacOS: 'macOS 14.0',            deploymentTargetRange: { min: 'iOS 12', max: 'iOS 17.5' }, releaseDate: '2024-05-13' },

  // --- Xcode 16.x ---
  { xcode: '16.0',   swift: '6.0',   iosSdk: '18.0', minMacOS: 'macOS 14.5 (Sonoma)',   deploymentTargetRange: { min: 'iOS 15', max: 'iOS 18' },   releaseDate: '2024-09-16' },
  { xcode: '16.1',   swift: '6.0.2', iosSdk: '18.1', minMacOS: 'macOS 14.5',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 18' },   releaseDate: '2024-10-28' },
  { xcode: '16.2',   swift: '6.0.3', iosSdk: '18.2', minMacOS: 'macOS 14.5',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 18' },   releaseDate: '2024-12-11' },
  { xcode: '16.3',   swift: '6.1',   iosSdk: '18.4', minMacOS: 'macOS 15.2 (Sequoia)',  deploymentTargetRange: { min: 'iOS 15', max: 'iOS 18' },   releaseDate: '2025-03-31' },
  { xcode: '16.4',   swift: '6.1.2', iosSdk: '18.5', minMacOS: 'macOS 15.3',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 18' },   releaseDate: '2025-05-27' },

  // --- Xcode 26.x (Apple のバージョンジャンプ: 16 → 26) ---
  { xcode: '26.0',   swift: '6.2',   iosSdk: '26.0', minMacOS: 'macOS 15.6 (Sequoia)',  deploymentTargetRange: { min: 'iOS 15', max: 'iOS 26' },   releaseDate: '2025-09-15' },
  { xcode: '26.0.1', swift: '6.2',   iosSdk: '26.0', minMacOS: 'macOS 15.6',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 26' },   releaseDate: '2025-09-22' },
  { xcode: '26.1',   swift: '6.2.1', iosSdk: '26.1', minMacOS: 'macOS 15.6',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 26.1' }, releaseDate: '2025-11-03' },
  { xcode: '26.2',   swift: '6.2.3', iosSdk: '26.2', minMacOS: 'macOS 15.6',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 26.2' }, releaseDate: '2025-12-12' },
  { xcode: '26.3',   swift: '6.2.4', iosSdk: '26.2', minMacOS: 'macOS 15.6',            deploymentTargetRange: { min: 'iOS 15', max: 'iOS 26.2' }, releaseDate: '2026-02-03' },
];

// =============================================================================
// Swift バージョン情報
// =============================================================================

export const SWIFT_VERSIONS: Array<{
  version: string;
  languageModes: string[];
  shippedWith: string;
  keyChanges: { ja: string; en: string };
}> = [
  {
    version: '5.9',
    languageModes: ['Swift 5'],
    shippedWith: 'Xcode 15.0-15.2',
    keyChanges: { ja: 'マクロ、パラメータパック', en: 'Macros, parameter packs' },
  },
  {
    version: '5.10',
    languageModes: ['Swift 5'],
    shippedWith: 'Xcode 15.3-15.4',
    keyChanges: { ja: '完全なデータ分離チェック', en: 'Full data isolation checking' },
  },
  {
    version: '6.0',
    languageModes: ['Swift 5', 'Swift 6'],
    shippedWith: 'Xcode 16.0-16.2',
    keyChanges: { ja: 'Swift 6 モードでデフォルトの厳格な並行性', en: 'Strict concurrency by default in Swift 6 mode' },
  },
  {
    version: '6.1',
    languageModes: ['Swift 5', 'Swift 6'],
    shippedWith: 'Xcode 16.3-16.4',
    keyChanges: { ja: '@implementation、末尾カンマ、パッケージトレイト', en: '@implementation, trailing commas everywhere, package traits' },
  },
  {
    version: '6.2',
    languageModes: ['Swift 5', 'Swift 6'],
    shippedWith: 'Xcode 26.0-26.3',
    keyChanges: { ja: '"Approachable Concurrency" — @MainActor デフォルト、@concurrent、nonisolated(nonsending)', en: '"Approachable Concurrency" — @MainActor default, @concurrent, nonisolated(nonsending)' },
  },
];

// =============================================================================
// App Store 提出期限
// =============================================================================

export const APP_STORE_SDK_DEADLINES: Array<{
  deadline: string;
  requiredXcode: string;
  requiredSdk: string;
}> = [
  { deadline: '2025-04-24', requiredXcode: 'Xcode 16', requiredSdk: 'iOS 18 SDK' },
  { deadline: '2026-04-28', requiredXcode: 'Xcode 26', requiredSdk: 'iOS 26 SDK' },
];

// =============================================================================
// SwiftUI 機能の iOS バージョン別対応
// =============================================================================

export const SWIFTUI_FEATURE_AVAILABILITY: Array<{
  minIos: string;
  features: string[];
  notes: { ja: string; en: string };
}> = [
  {
    minIos: '14.0',
    features: ['App protocol', '@StateObject', 'LazyVStack/HStack'],
    notes: { ja: 'SwiftUI 2.0', en: 'SwiftUI 2.0' },
  },
  {
    minIos: '15.0',
    features: ['searchable', 'AsyncImage', 'FocusState', 'swipeActions'],
    notes: { ja: 'SwiftUI 3.0', en: 'SwiftUI 3.0' },
  },
  {
    minIos: '16.0',
    features: ['NavigationStack', 'Layout protocol', 'Charts'],
    notes: { ja: 'SwiftUI 4.0 — NavigationStack で型安全ナビゲーション', en: 'SwiftUI 4.0 — Type-safe navigation with NavigationStack' },
  },
  {
    minIos: '17.0',
    features: ['@Observable macro', 'SwiftData', 'StoreKit views', 'TipKit'],
    notes: { ja: 'SwiftUI 5.0 — @Observable で ObservableObject 不要に', en: 'SwiftUI 5.0 — @Observable replaces ObservableObject' },
  },
  {
    minIos: '18.0',
    features: ['Mesh gradients', 'Custom containers', 'SF Symbol effects'],
    notes: { ja: 'SwiftUI (2024)', en: 'SwiftUI (2024)' },
  },
  {
    minIos: '26.0',
    features: ['Liquid Glass', 'Foundation Models', 'WebView', 'SwiftUI scenes in UIKit'],
    notes: { ja: 'SwiftUI (2025) — Liquid Glass デザイン言語', en: 'SwiftUI (2025) — Liquid Glass design language' },
  },
];

// =============================================================================
// 推奨ツールチェーンプロファイル
// =============================================================================

export const IOS_PROFILES: Record<string, IosToolchainProfile> = {

  /**
   * 最先端（Xcode 26.2 + Swift 6.2）
   * - 2026年4月の App Store 提出期限対応
   * - Approachable Concurrency 利用可能
   */
  cutting_edge_2026Q1: {
    name: 'Cutting Edge (2026 Q1)',
    nameJa: '最先端 (2026 Q1)',
    description: 'Xcode 26.2 stable. Ready for April 2026 App Store deadline.',
    descriptionJa: 'Xcode 26.2 安定版。2026年4月の App Store 期限対応済み。',
    xcode: '26.2',
    swift: '6.2.3',
    swiftLanguageMode: '5',
    iosSdk: '26.2',
    deploymentTarget: 'iOS 17.0',
    macosRequired: 'macOS 15.6 (Sequoia)',
    packageManager: 'spm',
  },

  /**
   * 安定版（Xcode 16.4 + Swift 6.1）
   * - 十分にテスト済み
   * - ただし 2026年4月以降は App Store 提出不可
   */
  stable_2025Q4: {
    name: 'Stable (2025 Q4)',
    nameJa: '安定版 (2025 Q4)',
    description: 'Xcode 16.4 battle-tested. Note: Cannot submit to App Store after April 2026.',
    descriptionJa: 'Xcode 16.4 十分にテスト済み。注意: 2026年4月以降は App Store 提出不可。',
    xcode: '16.4',
    swift: '6.1.2',
    swiftLanguageMode: '5',
    iosSdk: '18.5',
    deploymentTarget: 'iOS 16.0',
    macosRequired: 'macOS 15.3 (Sequoia)',
    packageManager: 'spm',
  },
};

// =============================================================================
// ライブラリ最新バージョン（2026-02-16 時点）
// =============================================================================

export const IOS_LIBRARIES: Record<string, LibraryInfo> = {

  alamofire: {
    name: 'Alamofire',
    latestStable: '5.11.0',
    lastVerified: '2026-02-16',
    minSdk: 12,
    requiredKotlin: 'Swift 6.0 (Swift 5 or 6 mode)',
    notes: {
      ja: '⚠️ Xcode 16.0 以上が必須（Swift 6.0 コンパイラ）。Lazy リクエストセットアップがデフォルト、resume() の呼び出しが必要。',
      en: '⚠️ Requires Xcode 16.0+ (Swift 6.0 compiler). Lazy request setup by default, requires resume() call.',
    },
  },

  kingfisher: {
    name: 'Kingfisher',
    latestStable: '8.6.2',
    lastVerified: '2026-02-16',
    minSdk: 13,
    notes: {
      ja: 'Swift 6 ready（データ競合エラーゼロ）。SwiftUI 対応は iOS 14+。',
      en: 'Swift 6 ready (zero data-race errors). SwiftUI support requires iOS 14+.',
    },
  },

  snapkit: {
    name: 'SnapKit',
    latestStable: '5.7.1',
    lastVerified: '2026-02-16',
    minSdk: 12,
    notes: {
      ja: '安定。約2年間大きな更新なし。UIKit Auto Layout 用。SwiftUI では不要。',
      en: 'Stable. No major updates in ~2 years. For UIKit Auto Layout. Not needed with SwiftUI.',
    },
  },

  realmSwift: {
    name: 'Realm Swift',
    latestStable: '20.0.3',
    lastVerified: '2026-02-16',
    minSdk: 12,
    notes: {
      ja: '⚠️ Atlas Device Sync は 2024年9月に非推奨。v20 は sync-free 版。Xcode 16.3〜26.0.1 が対応範囲。',
      en: '⚠️ Atlas Device Sync deprecated Sep 2024. v20 is sync-free. Supports Xcode 16.3-26.0.1.',
    },
  },

  firebaseIos: {
    name: 'Firebase iOS SDK',
    latestStable: '12.9.0',
    lastVerified: '2026-02-16',
    minSdk: 13,
    notes: {
      ja: 'Xcode 16.2 以上が必要。一部機能は iOS 12+ 対応（Analytics, Crashlytics）。',
      en: 'Requires Xcode 16.2+. Some features support iOS 12+ (Analytics, Crashlytics).',
    },
  },

  lottieIos: {
    name: 'Lottie iOS',
    latestStable: '4.6.0',
    lastVerified: '2026-02-16',
    minSdk: 13,
    notes: {
      ja: 'Swift 6.0 + Xcode 16.0 以上が必須。SPM は lottie-spm リポジトリを使用（ダウンロードサイズ削減）。',
      en: 'Requires Swift 6.0 + Xcode 16.0+. Use lottie-spm repo for SPM (smaller download).',
    },
  },

  swiftlint: {
    name: 'SwiftLint',
    latestStable: '0.63.2',
    lastVerified: '2026-02-16',
    notes: {
      ja: 'ビルドには Swift 6.0 + Xcode 16 が必要。SPM プラグインとしては Swift 5.9+ で動作。Homebrew 経由のインストール推奨。',
      en: 'Requires Swift 6.0 + Xcode 16 to build. SPM plugins work with Swift 5.9+. Homebrew installation recommended.',
    },
  },

  moya: {
    name: 'Moya',
    latestStable: '15.0.3',
    lastVerified: '2026-02-16',
    minSdk: 13,
    notes: {
      ja: '⚠️ メンテナンスモード（約3年間リリースなし）。新規プロジェクトでは Alamofire を直接使用するか、ネイティブ URLSession を推奨。',
      en: '⚠️ Maintenance mode (no release in ~3 years). For new projects, use Alamofire directly or native URLSession.',
    },
  },

  rswift: {
    name: 'R.swift',
    latestStable: '7.8.0',
    lastVerified: '2026-02-16',
    minSdk: 13,
    notes: {
      ja: '⚠️ Xcode 26 対応リリースが未確認。Swift 6.2 strict concurrency でエラーの可能性あり。代替: Xcode ネイティブの String Catalogs (iOS 16+)。',
      en: '⚠️ No confirmed Xcode 26-specific release. May encounter errors with Swift 6.2 strict concurrency. Alternative: Xcode native String Catalogs (iOS 16+).',
    },
  },
};

// =============================================================================
// 既知の NG 組み合わせ（衝突ルール）
// =============================================================================

export const IOS_CONFLICT_RULES: CompatibilityRule[] = [

  // --- Xcode / macOS 系 ---

  {
    id: 'xcode26-macos-min',
    descriptionJa: 'Xcode 26.x は macOS 15.6 (Sequoia) 以上が必須。それ以前の macOS では起動不可。',
    descriptionEn: 'Xcode 26.x requires macOS 15.6 (Sequoia) or later. Cannot run on earlier macOS.',
    severity: 'critical',
    when: { library: 'Xcode', version: '>=26.0' },
    conflictsWith: { library: 'macOS', version: '<15.6', status: 'ng' },
    resolution: {
      ja: 'macOS を 15.6 (Sequoia) 以上にアップグレード。',
      en: 'Upgrade macOS to 15.6 (Sequoia) or later.',
    },
  },

  {
    id: 'xcode16-macos-tahoe',
    descriptionJa: 'macOS Tahoe (26) をインストールすると Xcode 16.x は動作しない（16.4 が macOS Tahoe 26.1.x まで動作する例外あり）。',
    descriptionEn: 'Installing macOS Tahoe (26) prevents Xcode 16.x from running (except 16.4 works up to macOS Tahoe 26.1.x).',
    severity: 'critical',
    when: { library: 'macOS', version: '>=26.0' },
    conflictsWith: { library: 'Xcode', version: '<=16.3', status: 'ng' },
    resolution: {
      ja: 'Xcode 26.x にアップグレード。macOS Tahoe では Xcode 26 を使用。',
      en: 'Upgrade to Xcode 26.x. Use Xcode 26 on macOS Tahoe.',
    },
  },

  // --- Swift 6 Concurrency 系 ---

  {
    id: 'swift6-mode-libraries',
    descriptionJa: 'Swift 6 language mode を有効にすると、未対応のサードパーティライブラリから大量の Sendable / concurrency エラーが発生する。',
    descriptionEn: 'Enabling Swift 6 language mode causes thousands of Sendable/concurrency errors from third-party libraries not yet migrated.',
    severity: 'high',
    when: { library: 'Swift Language Mode', version: '6' },
    conflictsWith: { library: 'Third-party libraries (many)', version: 'not Swift 6 ready', status: 'warning' },
    resolution: {
      ja: 'Swift 5 language mode のまま Swift 6.x コンパイラを使用。モジュール単位で段階的に Swift 6 に移行。または Swift 6.2 の "Approachable Concurrency" 設定を使用。',
      en: 'Use Swift 5 language mode with Swift 6.x compiler. Migrate to Swift 6 module-by-module. Or use Swift 6.2 "Approachable Concurrency" setting.',
    },
  },

  // --- Swift OSS Toolchain 系 ---

  {
    id: 'swift61-oss-xcode26',
    descriptionJa: 'Swift 6.1 OSS ツールチェーン + Xcode 26 がインストールされた環境で Foundation をインポートするとビルド失敗。SDK が Swift 6.2 でビルドされているため。',
    descriptionEn: 'Swift 6.1 OSS toolchain + Xcode 26 installed: anything importing Foundation fails. SDK is built with Swift 6.2.',
    severity: 'critical',
    when: { library: 'Swift OSS Toolchain', version: '6.1' },
    conflictsWith: { library: 'Xcode', version: '>=26.0', status: 'ng' },
    resolution: {
      ja: 'Xcode 26 バンドルのツールチェーンを使用するか、Xcode 26 をアンインストール。',
      en: 'Use the Xcode 26 bundled toolchain or uninstall Xcode 26.',
    },
  },

  // --- Xcode 26.0 SWBBuildService 系 ---

  {
    id: 'xcode26-build-crash',
    descriptionJa: 'Xcode 26.0 初回ビルド後の再ビルドで SWBBuildService がクラッシュ。26.0.1 で修正済み。',
    descriptionEn: 'Xcode 26.0 SWBBuildService crashes on subsequent builds. Fixed in 26.0.1.',
    severity: 'high',
    when: { library: 'Xcode', version: '26.0' },
    conflictsWith: { library: 'SWBBuildService', version: 'n/a', status: 'ng' },
    resolution: {
      ja: 'Xcode 26.0.1 以上にアップグレード。',
      en: 'Upgrade to Xcode 26.0.1 or later.',
    },
  },

  // --- ライブラリ固有 ---

  {
    id: 'moya-alamofire-minsdk',
    descriptionJa: 'Moya 15.0.3 は iOS 10.0 を宣言するが、Alamofire 5.x は iOS 11.0+ が必要。iOS 10 ターゲットでビルドエラー。',
    descriptionEn: 'Moya 15.0.3 declares iOS 10.0 but Alamofire 5.x requires iOS 11.0+. Build error with iOS 10 target.',
    severity: 'high',
    when: { library: 'Moya', version: '15.0.3' },
    conflictsWith: { library: 'Deployment Target', version: '<11.0', status: 'ng' },
    resolution: {
      ja: 'Deployment Target を iOS 11.0 以上に設定。または Moya を使わず Alamofire を直接使用。',
      en: 'Set Deployment Target to iOS 11.0+. Or use Alamofire directly without Moya.',
    },
  },

  {
    id: 'realm-xcode26',
    descriptionJa: 'Realm Swift の初期バージョンは Xcode 26 / iOS 26 でコンパイル不可。v10.54.x / v20.0.3 で修正済み。',
    descriptionEn: 'Early Realm Swift versions cannot compile on Xcode 26 / iOS 26. Fixed in v10.54.x / v20.0.3.',
    severity: 'high',
    when: { library: 'Realm Swift', version: '<10.54.0' },
    conflictsWith: { library: 'Xcode', version: '>=26.0', status: 'ng' },
    resolution: {
      ja: 'Realm Swift を 10.54.x (with sync) または 20.0.3 (sync-free) にアップグレード。',
      en: 'Upgrade Realm Swift to 10.54.x (with sync) or 20.0.3 (sync-free).',
    },
  },

  {
    id: 'rswift-xcode26-concurrency',
    descriptionJa: 'R.swift 7.8.0 は Xcode 26 / Swift 6.2 strict concurrency で問題が発生する可能性あり。',
    descriptionEn: 'R.swift 7.8.0 may encounter issues with Xcode 26 / Swift 6.2 strict concurrency.',
    severity: 'medium',
    when: { library: 'R.swift', version: '7.8.0' },
    conflictsWith: { library: 'Xcode', version: '>=26.0', status: 'warning' },
    resolution: {
      ja: 'Xcode ネイティブの String Catalogs (.xcstrings) への移行を検討。iOS 16+ で利用可能。',
      en: 'Consider migrating to Xcode native String Catalogs (.xcstrings). Available on iOS 16+.',
    },
  },

  {
    id: 'alamofire-xcode15',
    descriptionJa: 'Alamofire 5.11.0 は Swift 6.0 コンパイラが必要。Xcode 15.x (Swift 5.9/5.10) ではビルド不可。',
    descriptionEn: 'Alamofire 5.11.0 requires Swift 6.0 compiler. Cannot build with Xcode 15.x (Swift 5.9/5.10).',
    severity: 'critical',
    when: { library: 'Alamofire', version: '>=5.11.0' },
    conflictsWith: { library: 'Xcode', version: '<16.0', status: 'ng' },
    resolution: {
      ja: 'Xcode 16.0 以上にアップグレード。',
      en: 'Upgrade to Xcode 16.0 or later.',
    },
  },

  {
    id: 'lottie-xcode15',
    descriptionJa: 'Lottie 4.6.0 は Swift 6.0 が必須。Xcode 15.x ではビルド不可。',
    descriptionEn: 'Lottie 4.6.0 requires Swift 6.0. Cannot build with Xcode 15.x.',
    severity: 'critical',
    when: { library: 'Lottie', version: '>=4.6.0' },
    conflictsWith: { library: 'Xcode', version: '<16.0', status: 'ng' },
    resolution: {
      ja: 'Xcode 16.0 以上にアップグレード。',
      en: 'Upgrade to Xcode 16.0 or later.',
    },
  },

  {
    id: 'firebase-xcode16-min',
    descriptionJa: 'Firebase iOS SDK 12.x は Xcode 16.2 以上が必要。',
    descriptionEn: 'Firebase iOS SDK 12.x requires Xcode 16.2+.',
    severity: 'high',
    when: { library: 'Firebase iOS SDK', version: '>=12.0.0' },
    conflictsWith: { library: 'Xcode', version: '<16.2', status: 'ng' },
    resolution: {
      ja: 'Xcode 16.2 以上にアップグレード。',
      en: 'Upgrade to Xcode 16.2 or later.',
    },
  },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * Xcode バージョンに対応する Swift バージョンを取得
 */
export function getSwiftForXcode(xcodeVersion: string): string | undefined {
  const entry = XCODE_VERSIONS.find((v) => v.xcode === xcodeVersion);
  return entry?.swift;
}

/**
 * 推奨プロファイルを取得
 */
export function getRecommendedIosProfile(type: 'cutting_edge' | 'stable'): IosToolchainProfile {
  const map: Record<string, string> = {
    cutting_edge: 'cutting_edge_2026Q1',
    stable: 'stable_2025Q4',
  };
  return IOS_PROFILES[map[type]];
}

/**
 * iOS デプロイメントターゲットで使える SwiftUI 機能を取得
 */
export function getAvailableSwiftUIFeatures(deploymentTarget: string): string[] {
  const targetVersion = parseFloat(deploymentTarget.replace('iOS ', ''));
  const features: string[] = [];

  for (const entry of SWIFTUI_FEATURE_AVAILABILITY) {
    if (parseFloat(entry.minIos) <= targetVersion) {
      features.push(...entry.features);
    }
  }

  return features;
}

/**
 * App Store 提出期限に間に合う最小 Xcode バージョンを取得
 */
export function getMinXcodeForAppStoreDeadline(deadline: string): string | undefined {
  const entry = APP_STORE_SDK_DEADLINES.find((d) => d.deadline === deadline);
  return entry?.requiredXcode;
}
