/**
 * Android ツールチェーン & ライブラリ互換性マトリクス
 *
 * ============================================================================
 * 【重要】ライブラリバージョンの組み合わせ OK/NG を一元管理
 * ============================================================================
 *
 * ## 目的
 * - AGP / Gradle / Kotlin / Compose の互換性を明確化
 * - ライブラリバージョンアップ時の衝突を事前に検知
 * - 新規プロジェクト作成時の推奨バージョンを提供
 * - 「バージョン地獄」を回避するための知識ベース
 *
 * ## 更新頻度
 * - 主要ライブラリの安定版リリース時に更新
 * - 少なくとも月1回は最新状態を確認
 *
 * ## 最終リサーチ日: 2026-02-16
 */

// =============================================================================
// 型定義
// =============================================================================

export type CompatStatus = 'ok' | 'ng' | 'warning' | 'untested';

export interface VersionConstraint {
  min: string;
  max?: string;
  recommended: string;
}

export interface CompatibilityRule {
  id: string;
  /** ルールの説明（日本語） */
  descriptionJa: string;
  /** ルールの説明（英語） */
  descriptionEn: string;
  /** 影響度 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** このルールが適用される条件 */
  when: {
    library: string;
    version: string;
  };
  /** 衝突する対象 */
  conflictsWith: {
    library: string;
    version: string;
    status: CompatStatus;
  };
  /** 修正方法 */
  resolution: {
    ja: string;
    en: string;
  };
}

export interface LibraryInfo {
  name: string;
  latestStable: string;
  /** 最終確認日 */
  lastVerified: string;
  minSdk?: number;
  /** 依存する Kotlin バージョン */
  requiredKotlin?: string;
  /** 依存する Compose BOM */
  requiredComposeBom?: string;
  /** その他の注意事項 */
  notes?: {
    ja: string;
    en: string;
  };
}

export interface ToolchainProfile {
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  agp: string;
  gradle: string;
  kotlin: string;
  ksp: string;
  composeBom: string;
  compileSdk: number;
  targetSdk: number;
  minSdk: number;
  jvmTarget: string;
}

// =============================================================================
// 推奨ツールチェーンプロファイル
// =============================================================================

/**
 * 推奨プロファイル — 新規プロジェクト or メジャーアップグレード時に使用
 */
export const ANDROID_PROFILES: Record<string, ToolchainProfile> = {

  /**
   * 最先端（AGP 9.0 + Kotlin 2.3）
   * - 全て最新安定版
   * - AGP 9.0 の Built-in Kotlin 対応
   * - KSP2（旧 KSP1 非互換）
   */
  cutting_edge_2026Q1: {
    name: 'Cutting Edge (2026 Q1)',
    nameJa: '最先端 (2026 Q1)',
    description: 'Latest stable AGP 9.0 + Kotlin 2.3. For new projects.',
    descriptionJa: 'AGP 9.0 + Kotlin 2.3 の最新安定版。新規プロジェクト向け。',
    agp: '9.0.1',
    gradle: '9.2',
    kotlin: '2.3.0',
    ksp: '2.3.5',
    composeBom: '2026.01.01',
    compileSdk: 36,
    targetSdk: 36,
    minSdk: 24,
    jvmTarget: '17',
  },

  /**
   * 安定版（AGP 8.9 + Kotlin 2.2）
   * - 十分にテスト済みの組み合わせ
   * - Gradle 8.x 系で動作（9.x 移行不要）
   * - 既存プロジェクトのアップグレードに最適
   */
  stable_2026Q1: {
    name: 'Stable (2026 Q1)',
    nameJa: '安定版 (2026 Q1)',
    description: 'Battle-tested AGP 8.9 + Kotlin 2.2. For existing projects.',
    descriptionJa: 'AGP 8.9 + Kotlin 2.2 の十分にテスト済み組み合わせ。既存プロジェクト向け。',
    agp: '8.9.0',
    gradle: '8.11.1',
    kotlin: '2.2.20',
    ksp: '2.2.20-2.0.4',
    composeBom: '2026.01.01',
    compileSdk: 35,
    targetSdk: 35,
    minSdk: 24,
    jvmTarget: '17',
  },

  /**
   * HARMONIC insight 現行標準
   * - standards/ANDROID.md に記載のバージョン
   * - テンプレートの libs.versions.toml と一致
   */
  harmonic_current: {
    name: 'HARMONIC insight Current',
    nameJa: 'HARMONIC insight 現行標準',
    description: 'Current standard used across HARMONIC insight Android apps.',
    descriptionJa: 'HARMONIC insight Android アプリの現行標準。',
    agp: '8.7.3',
    gradle: '8.11',
    kotlin: '2.1.0',
    ksp: '2.1.0-1.0.29',
    composeBom: '2024.12.01',
    compileSdk: 35,
    targetSdk: 35,
    minSdk: 26,
    jvmTarget: '17',
  },
};

// =============================================================================
// AGP ↔ Gradle ↔ JDK 互換性マトリクス
// =============================================================================

/**
 * AGP が要求する最小 Gradle バージョン
 *
 * ❌ NG: AGP のバージョンに対して Gradle が古いとビルド失敗
 * ✅ OK: 最小バージョン以上であれば動作
 */
export const AGP_GRADLE_MATRIX: Record<string, { minGradle: string; maxGradle?: string; jdk: string; androidStudio: string }> = {
  '8.5':  { minGradle: '8.7',    jdk: '17', androidStudio: 'Koala' },
  '8.6':  { minGradle: '8.7',    jdk: '17', androidStudio: 'Koala Feature Drop' },
  '8.7':  { minGradle: '8.9',    jdk: '17', androidStudio: 'Ladybug' },
  '8.8':  { minGradle: '8.10.2', jdk: '17', androidStudio: 'Ladybug Feature Drop' },
  '8.9':  { minGradle: '8.11.1', jdk: '17', androidStudio: 'Meerkat' },
  '8.10': { minGradle: '8.11.1', jdk: '17', androidStudio: 'Meerkat Feature Drop' },
  '8.13': { minGradle: '8.13',   jdk: '17', androidStudio: 'Otter' },
  '9.0':  { minGradle: '9.1.0',  jdk: '17', androidStudio: 'Panda 1' },
  '9.1':  { minGradle: '9.1.0',  jdk: '17', androidStudio: 'Panda 2 (canary)' },
};

// =============================================================================
// Compose Compiler ↔ Kotlin 互換性
// =============================================================================

/**
 * Kotlin 2.0 以降、Compose Compiler は Kotlin に統合。
 * バージョンは常に Kotlin バージョンと一致する。
 *
 * ❌ NG: Kotlin 2.0+ で旧 composeOptions { kotlinCompilerExtensionVersion } を使用
 * ✅ OK: org.jetbrains.kotlin.plugin.compose プラグインを適用
 */
export const COMPOSE_KOTLIN_RULES = {
  kotlinMinForMergedCompiler: '2.0.0',
  pluginId: 'org.jetbrains.kotlin.plugin.compose',
  legacyBlockToRemove: 'composeOptions { kotlinCompilerExtensionVersion = "..." }',
  note: {
    ja: 'Kotlin 2.0 以降は Compose Compiler が Kotlin に統合。composeOptions ブロックは削除し、compose-compiler プラグインを適用すること。',
    en: 'Since Kotlin 2.0, Compose Compiler is merged into Kotlin. Remove composeOptions block and apply compose-compiler plugin.',
  },
};

// =============================================================================
// KSP バージョン管理
// =============================================================================

/**
 * KSP バージョニング規約
 *
 * KSP1 (deprecated): "<kotlinVersion>-<kspVersion>" 形式。Kotlin と 1:1 対応。
 * KSP2 (current):     "2.3.x" 形式。Kotlin 2.2.x 以降で動作。Kotlin から分離。
 *
 * ❌ NG: KSP1 + Kotlin 2.3+ → ビルド失敗
 * ❌ NG: KSP1 + AGP 9.0+ → 非互換
 * ✅ OK: KSP2 (2.3.x) + Kotlin 2.2.x+
 */
export const KSP_RULES = {
  ksp2MinVersion: '2.3.0',
  ksp2SupportedKotlinMin: '2.2.0',
  ksp1DeprecatedSince: '2.3.0',
  latestKsp2: '2.3.5',
  note: {
    ja: 'KSP 2.3.0 以降は Kotlin バージョンから分離。KSP1 は Kotlin 2.3+ / AGP 9.0+ で非互換。新規は KSP2 を使用すること。',
    en: 'KSP 2.3.0+ is decoupled from Kotlin versions. KSP1 is incompatible with Kotlin 2.3+ / AGP 9.0+. Use KSP2 for new projects.',
  },
};

// =============================================================================
// ライブラリ最新バージョン（2026-02-16 時点）
// =============================================================================

export const ANDROID_LIBRARIES: Record<string, LibraryInfo> = {

  // --- Kotlin & Coroutines ---
  kotlin: {
    name: 'Kotlin',
    latestStable: '2.3.0',
    lastVerified: '2026-02-16',
    notes: {
      ja: 'K2 コンパイラがデフォルト。Java 25 サポート。Gradle 9.0 互換。',
      en: 'K2 compiler default. Java 25 support. Gradle 9.0 compatible.',
    },
  },
  coroutines: {
    name: 'kotlinx-coroutines',
    latestStable: '1.10.2',
    lastVerified: '2026-02-16',
    requiredKotlin: '2.0.0',
  },

  // --- Jetpack Compose ---
  composeBom: {
    name: 'Compose BOM',
    latestStable: '2026.01.01',
    lastVerified: '2026-02-16',
    notes: {
      ja: 'Compose UI 1.10.x, Foundation 1.10.x, Material3 1.4.0 を含む。',
      en: 'Includes Compose UI 1.10.x, Foundation 1.10.x, Material3 1.4.0.',
    },
  },
  composeMaterial3: {
    name: 'Material3',
    latestStable: '1.4.0',
    lastVerified: '2026-02-16',
    notes: {
      ja: '⚠️ 1.4.0 で material-icons-core が同梱されなくなった。明示的に依存追加が必要。',
      en: '⚠️ 1.4.0 no longer bundles material-icons-core. Add explicit dependency.',
    },
  },

  // --- Jetpack Libraries ---
  room: {
    name: 'Room',
    latestStable: '2.7.2',
    lastVerified: '2026-02-16',
    minSdk: 23,
    notes: {
      ja: 'KTX が room-runtime に統合。room-ktx は不要。KSP 推奨。',
      en: 'KTX merged into room-runtime. room-ktx no longer needed. KSP recommended.',
    },
  },
  navigation2: {
    name: 'Navigation 2.x',
    latestStable: '2.9.7',
    lastVerified: '2026-02-16',
    minSdk: 23,
  },
  navigation3: {
    name: 'Navigation 3',
    latestStable: '1.0.0',
    lastVerified: '2026-02-16',
    minSdk: 23,
    notes: {
      ja: 'Compose-first の型安全ナビゲーション。新規プロジェクト推奨。',
      en: 'Compose-first type-safe navigation. Recommended for new projects.',
    },
  },
  lifecycle: {
    name: 'Lifecycle',
    latestStable: '2.9.4',
    lastVerified: '2026-02-16',
    minSdk: 23,
    notes: {
      ja: 'DESTROYED 状態が terminal に。lifecycle-extensions は完全に削除。',
      en: 'DESTROYED state is now terminal. lifecycle-extensions fully removed.',
    },
  },
  hilt: {
    name: 'Hilt (Dagger)',
    latestStable: '2.59.1',
    lastVerified: '2026-02-16',
    notes: {
      ja: 'KSP2 完全対応。KAPT はメンテナンスモード。',
      en: 'Full KSP2 support. KAPT in maintenance mode.',
    },
  },
  hiltNavigationCompose: {
    name: 'Hilt Navigation Compose',
    latestStable: '1.3.0',
    lastVerified: '2026-02-16',
    minSdk: 23,
    notes: {
      ja: 'hiltViewModel() が新 artifact に移動。',
      en: 'hiltViewModel() moved to new artifact.',
    },
  },

  // --- Networking ---
  retrofit: {
    name: 'Retrofit',
    latestStable: '3.0.0',
    lastVerified: '2026-02-16',
    minSdk: 21,
    notes: {
      ja: 'Kotlin-first。ネイティブ coroutine suspend サポート。Call<T> 不要。',
      en: 'Kotlin-first. Native coroutine suspend support. No more Call<T> needed.',
    },
  },
  okhttp: {
    name: 'OkHttp',
    latestStable: '5.3.0',
    lastVerified: '2026-02-16',
    minSdk: 21,
    notes: {
      ja: 'JVM/Android で artifact が分離。Java 9 モジュール対応。',
      en: 'Separate JVM/Android artifacts. Java 9 modules.',
    },
  },
  coil: {
    name: 'Coil',
    latestStable: '3.3.0',
    lastVerified: '2026-02-16',
    minSdk: 21,
    notes: {
      ja: 'Compose Multiplatform 対応。artifact group が io.coil-kt.coil3 に変更。',
      en: 'Compose Multiplatform support. Artifact group changed to io.coil-kt.coil3.',
    },
  },
  ktor: {
    name: 'Ktor',
    latestStable: '3.4.0',
    lastVerified: '2026-02-16',
    minSdk: 21,
    notes: {
      ja: '⚠️ 3.2.0 で minSdk 30 未満の D8 互換性問題あり → 3.2.2 で修正済み。',
      en: '⚠️ 3.2.0 had D8 compatibility issue below API 30 → fixed in 3.2.2.',
    },
  },

  // --- Firebase ---
  firebaseBom: {
    name: 'Firebase BOM',
    latestStable: '34.9.0',
    lastVerified: '2026-02-16',
    minSdk: 23,
    notes: {
      ja: '⚠️ 全 KTX モジュール削除済み。firebase-*-ktx を使っているなら本体 artifact に移行必要。firebase-vertexai は firebase-ai に改名。',
      en: '⚠️ All KTX modules removed. Migrate from firebase-*-ktx to main artifacts. firebase-vertexai renamed to firebase-ai.',
    },
  },

  // --- Other ---
  accompanist: {
    name: 'Accompanist',
    latestStable: '0.37.3',
    lastVerified: '2026-02-16',
    notes: {
      ja: 'ほとんどの機能が Compose 本体に統合済み。残りは permissions, drawable-painter, adaptive のみ。',
      en: 'Most libraries deprecated/upstreamed. Only permissions, drawable-painter, adaptive remain.',
    },
  },
};

// =============================================================================
// 既知の NG 組み合わせ（衝突ルール）
// =============================================================================

export const ANDROID_CONFLICT_RULES: CompatibilityRule[] = [

  // --- AGP / Gradle / Kotlin 系 ---

  {
    id: 'agp9-gradle8',
    descriptionJa: 'AGP 9.0 は Gradle 9.1.0 以上が必須。Gradle 8.x ではビルド失敗。',
    descriptionEn: 'AGP 9.0 strictly requires Gradle 9.1.0+. Builds fail with Gradle 8.x.',
    severity: 'critical',
    when: { library: 'AGP', version: '>=9.0.0' },
    conflictsWith: { library: 'Gradle', version: '<9.1.0', status: 'ng' },
    resolution: {
      ja: 'gradle-wrapper.properties の distributionUrl を gradle-9.2-bin.zip 以上に更新。',
      en: 'Update distributionUrl in gradle-wrapper.properties to gradle-9.2-bin.zip or higher.',
    },
  },

  {
    id: 'agp9-ksp1',
    descriptionJa: 'AGP 9.0 は KSP1 と非互換。KSP2 への移行が必須。',
    descriptionEn: 'AGP 9.0 is incompatible with KSP1. Migration to KSP2 is required.',
    severity: 'critical',
    when: { library: 'AGP', version: '>=9.0.0' },
    conflictsWith: { library: 'KSP', version: '<2.3.0', status: 'ng' },
    resolution: {
      ja: 'KSP を 2.3.5 以上にアップグレード。KAPT を使用している場合も KSP に移行。',
      en: 'Upgrade KSP to 2.3.5+. If using KAPT, migrate to KSP.',
    },
  },

  {
    id: 'agp9-kgp-min',
    descriptionJa: 'AGP 9.0 は KGP (Kotlin Gradle Plugin) 2.2.10 以上が必須。低いバージョンは自動アップグレードされるが予期しない動作の原因になる。',
    descriptionEn: 'AGP 9.0 requires KGP >= 2.2.10. Lower versions are auto-upgraded, which may cause unexpected behavior.',
    severity: 'high',
    when: { library: 'AGP', version: '>=9.0.0' },
    conflictsWith: { library: 'Kotlin', version: '<2.2.10', status: 'warning' },
    resolution: {
      ja: 'Kotlin を 2.2.20 以上に明示的にアップグレード。',
      en: 'Explicitly upgrade Kotlin to 2.2.20+.',
    },
  },

  // --- Compose 系 ---

  {
    id: 'compose-old-compiler-kotlin2',
    descriptionJa: 'Kotlin 2.0 以降で旧 Compose Compiler (kotlinCompilerExtensionVersion) を使用するとビルド失敗。',
    descriptionEn: 'Using legacy Compose Compiler (kotlinCompilerExtensionVersion) with Kotlin 2.0+ causes build failure.',
    severity: 'critical',
    when: { library: 'Kotlin', version: '>=2.0.0' },
    conflictsWith: { library: 'Compose Compiler (standalone)', version: '<=1.5.x', status: 'ng' },
    resolution: {
      ja: 'composeOptions ブロックを削除し、org.jetbrains.kotlin.plugin.compose プラグインを適用。',
      en: 'Remove composeOptions block and apply org.jetbrains.kotlin.plugin.compose plugin.',
    },
  },

  {
    id: 'material3-missing-icons',
    descriptionJa: 'Compose Material3 1.4.0 で material-icons-core が同梱されなくなった。アイコンを使用している場合は明示的な依存追加が必要。',
    descriptionEn: 'Compose Material3 1.4.0 no longer bundles material-icons-core. Explicit dependency needed for icons.',
    severity: 'medium',
    when: { library: 'Material3', version: '>=1.4.0' },
    conflictsWith: { library: 'material-icons-core', version: 'not declared', status: 'warning' },
    resolution: {
      ja: 'implementation("androidx.compose.material:material-icons-core") を追加。',
      en: 'Add implementation("androidx.compose.material:material-icons-core").',
    },
  },

  // --- KSP 系 ---

  {
    id: 'ksp1-kotlin23',
    descriptionJa: 'KSP1 は Kotlin 2.3 以降をサポートしない。KSP2 への移行が必須。',
    descriptionEn: 'KSP1 does not support Kotlin 2.3+. Migration to KSP2 is required.',
    severity: 'critical',
    when: { library: 'Kotlin', version: '>=2.3.0' },
    conflictsWith: { library: 'KSP', version: '<2.3.0', status: 'ng' },
    resolution: {
      ja: 'KSP を 2.3.5 にアップグレード。',
      en: 'Upgrade KSP to 2.3.5.',
    },
  },

  // --- Firebase 系 ---

  {
    id: 'firebase-ktx-removed',
    descriptionJa: 'Firebase BOM 34.x で全 KTX モジュールが削除された。firebase-*-ktx artifact はビルドエラーになる。',
    descriptionEn: 'Firebase BOM 34.x removed all KTX modules. firebase-*-ktx artifacts cause build errors.',
    severity: 'high',
    when: { library: 'Firebase BOM', version: '>=34.0.0' },
    conflictsWith: { library: 'firebase-*-ktx', version: 'any', status: 'ng' },
    resolution: {
      ja: 'firebase-firestore-ktx → firebase-firestore のように本体 artifact に移行。',
      en: 'Migrate from firebase-firestore-ktx to firebase-firestore (main artifact).',
    },
  },

  // --- Ktor 系 ---

  {
    id: 'ktor-d8-api30',
    descriptionJa: 'Ktor 3.2.0 は minSdk 30 未満で D8 互換性問題あり。3.2.2 以上で修正済み。',
    descriptionEn: 'Ktor 3.2.0 has D8 compatibility issue below API 30. Fixed in 3.2.2+.',
    severity: 'high',
    when: { library: 'Ktor', version: '3.2.0' },
    conflictsWith: { library: 'minSdk', version: '<30', status: 'ng' },
    resolution: {
      ja: 'Ktor を 3.2.2 以上にアップグレード。',
      en: 'Upgrade Ktor to 3.2.2+.',
    },
  },

  // --- Hilt / Dagger 系 ---

  {
    id: 'dagger-257-gradle-810',
    descriptionJa: 'Dagger 2.57+ が内部で Kotlin 2.1.10 に依存し、Gradle 8.10.2 以下との互換性問題が発生する。',
    descriptionEn: 'Dagger 2.57+ internally depends on Kotlin 2.1.10, causing compatibility issues with Gradle 8.10.2 and below.',
    severity: 'high',
    when: { library: 'Dagger/Hilt', version: '>=2.57' },
    conflictsWith: { library: 'Gradle', version: '<=8.10.2', status: 'warning' },
    resolution: {
      ja: 'Gradle を 8.11.1 以上にアップグレード。',
      en: 'Upgrade Gradle to 8.11.1+.',
    },
  },

  // --- Compose Plugin 系 ---

  {
    id: 'compose-plugin-missing-module',
    descriptionJa: 'compose-compiler プラグインがアプリモジュールに適用されていないと、誤った旧 Compose Compiler バージョンのエラーが出る。',
    descriptionEn: 'If compose-compiler plugin is not applied to the app module, misleading errors about old Compose Compiler versions appear.',
    severity: 'medium',
    when: { library: 'Compose', version: 'any' },
    conflictsWith: { library: 'compose-compiler plugin', version: 'not applied to all modules', status: 'warning' },
    resolution: {
      ja: 'Compose を使用する全モジュールに org.jetbrains.kotlin.plugin.compose を適用。',
      en: 'Apply org.jetbrains.kotlin.plugin.compose to every module that uses Compose.',
    },
  },
];

// =============================================================================
// Google Play ターゲット SDK 要件
// =============================================================================

export const GOOGLE_PLAY_TARGET_SDK_DEADLINES: Array<{
  deadline: string;
  requiredTargetSdk: number;
  androidVersion: string;
}> = [
  { deadline: '2025-08-31', requiredTargetSdk: 35, androidVersion: 'Android 15' },
  { deadline: '2026-08-31', requiredTargetSdk: 36, androidVersion: 'Android 16' },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * AGP バージョンに対する最小 Gradle バージョンを取得
 */
export function getMinGradleForAgp(agpVersion: string): string | undefined {
  const major = agpVersion.split('.').slice(0, 2).join('.');
  return AGP_GRADLE_MATRIX[major]?.minGradle;
}

/**
 * 推奨プロファイルを取得
 */
export function getRecommendedProfile(type: 'cutting_edge' | 'stable' | 'harmonic_current'): ToolchainProfile {
  const map: Record<string, string> = {
    cutting_edge: 'cutting_edge_2026Q1',
    stable: 'stable_2026Q1',
    harmonic_current: 'harmonic_current',
  };
  return ANDROID_PROFILES[map[type]];
}

/**
 * 指定されたライブラリバージョンの組み合わせをチェックし、
 * 衝突するルールのリストを返す
 */
export function checkAndroidCompatibility(
  versions: Record<string, string>,
): Array<{ rule: CompatibilityRule; status: CompatStatus }> {
  const issues: Array<{ rule: CompatibilityRule; status: CompatStatus }> = [];

  for (const rule of ANDROID_CONFLICT_RULES) {
    const lib = rule.when.library;
    const conflictLib = rule.conflictsWith.library;

    if (versions[lib] && versions[conflictLib]) {
      issues.push({ rule, status: rule.conflictsWith.status });
    }
  }

  return issues;
}

/**
 * ライブラリの最新バージョンを取得
 */
export function getLatestVersion(libraryKey: string): string | undefined {
  return ANDROID_LIBRARIES[libraryKey]?.latestStable;
}
