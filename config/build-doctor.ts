/**
 * HARMONIC insight — Build Doctor: クロスプラットフォーム ビルドエラー自律解消エージェント
 *
 * ============================================================================
 * 【概要】
 * iOS / Android / C#(WPF) / React / Python のビルドエラーを自動分類し、
 * 最小限の修正を提案・適用する自律エージェントの知識ベース + エンジン定義。
 *
 * 【設計思想】
 * - プラットフォーム非依存のエラー分類体系（6カテゴリ）
 * - パターンマッチによる自動原因特定
 * - 最小差分の修正戦略（1修正/ループ）
 * - 最大2ループの自動修正 → 解決しなければ最小限の情報収集
 * - compatibility/ の既知 NG 組み合わせとの自動照合
 *
 * 【使い方】
 *   import {
 *     classifyBuildError,
 *     findMatchingPatterns,
 *     suggestFix,
 *     BuildErrorCategory,
 *   } from '@/insight-common/config/build-doctor';
 *
 * 【対応プラットフォーム】
 * - iOS (xcodebuild / swift build / xcode-select)
 * - Android (gradle / agp / kotlin)
 * - C# WPF (dotnet build / msbuild)
 * - React / Next.js (npm / yarn / next build)
 * - Python (pip / pyinstaller / customtkinter)
 * - Tauri (cargo / tauri build)
 *
 * ## 最終更新: 2026-02-22
 */

// =============================================================================
// 型定義
// =============================================================================

/** ビルドエラーの6分類 */
export type BuildErrorCategory =
  | 'Compile'      // コンパイルエラー（構文、型、未解決シンボル）
  | 'Link'         // リンクエラー（未解決参照、重複シンボル、フレームワーク不足）
  | 'Dependency'   // 依存解決エラー（SPM/CocoaPods/Gradle/NuGet/npm/pip）
  | 'ScriptPhase'  // ビルドスクリプトエラー（Run Script Phase、pre/post build）
  | 'Environment'  // 環境エラー（SDK/toolchain未インストール、パス不正、バージョン不一致）
  | 'CodeSign';    // コード署名エラー（証明書/プロファイル期限切れ、entitlements不整合）

/** 対応プラットフォーム */
export type BuildPlatform =
  | 'ios'
  | 'android'
  | 'wpf'
  | 'react'
  | 'python'
  | 'tauri';

/** エラーパターン定義 */
export interface BuildErrorPattern {
  /** 一意 ID */
  id: string;
  /** 対象プラットフォーム（null = 全プラットフォーム共通） */
  platform: BuildPlatform | null;
  /** エラーカテゴリ */
  category: BuildErrorCategory;
  /** ログ行にマッチする正規表現 */
  regex: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
  /** 重要度 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** 最終検証日 */
  lastVerified: string;
}

/** 修正戦略 */
export interface FixStrategy {
  /** 対象パターン ID */
  patternId: string;
  /** 修正の種類 */
  type: FixType;
  /** 修正対象ファイルのグロブパターン */
  targetFileGlob: string;
  /** 修正内容（日本語） */
  descriptionJa: string;
  /** 修正内容（英語） */
  descriptionEn: string;
  /** 自動修正可能か（false の場合は提案のみ） */
  autoFixable: boolean;
  /** 修正コマンド（シェル実行用、null = ファイル編集） */
  command: string | null;
  /** 検索パターン（ファイル編集用） */
  searchPattern: string | null;
  /** 置換パターン（ファイル編集用） */
  replacePattern: string | null;
  /** 修正後の検証コマンド */
  verifyCommand: string | null;
  /** 前提条件チェックコマンド（null = 前提条件なし） */
  preconditionCommand: string | null;
}

/** 修正の種類 */
export type FixType =
  | 'file_edit'       // ファイルの一部を書き換え
  | 'file_add'        // ファイル追加
  | 'file_delete'     // ファイル削除
  | 'command_run'     // コマンド実行
  | 'config_change'   // 設定ファイル変更
  | 'dependency_add'  // 依存追加
  | 'dependency_remove' // 依存削除
  | 'dependency_update' // 依存バージョン更新
  | 'env_setup';      // 環境セットアップ

/** ビルドコマンド定義 */
export interface BuildCommand {
  /** プラットフォーム */
  platform: BuildPlatform;
  /** ビルドコマンド */
  command: string;
  /** クリーンビルドコマンド */
  cleanCommand: string;
  /** ログ出力先（テンプレート — {{timestamp}} が置換される） */
  logPath: string;
  /** エラー抽出: 末尾からの行数 */
  tailLines: number;
  /** ビルド成功判定の正規表現 */
  successRegex: string;
  /** プロジェクトファイル検出グロブ */
  projectFileGlob: string;
  /** 説明（日本語） */
  descriptionJa: string;
}

/** 診断結果 */
export interface DiagnosisResult {
  /** 検出されたエラーカテゴリ */
  category: BuildErrorCategory;
  /** マッチしたパターン */
  matchedPatterns: BuildErrorPattern[];
  /** 推奨修正戦略（優先度順） */
  suggestedFixes: FixStrategy[];
  /** ログから抽出した関連行 */
  relevantLines: string[];
  /** compatibility/ の既知ルールとの照合結果 */
  knownConflicts: string[];
  /** 信頼度 (0.0 - 1.0) */
  confidence: number;
}

/** エージェント実行状態 */
export interface AgentState {
  /** 現在のループ回数 */
  loop: number;
  /** 最大ループ数 */
  maxLoops: number;
  /** プラットフォーム */
  platform: BuildPlatform;
  /** プロジェクトルート */
  projectRoot: string;
  /** ビルドログのパス一覧 */
  buildLogs: string[];
  /** 適用した修正の一覧 */
  appliedFixes: Array<{
    patternId: string;
    fixDescription: string;
    diff: string;
    timestamp: string;
  }>;
  /** 現在のステータス */
  status: AgentStatus;
  /** 最終診断結果 */
  lastDiagnosis: DiagnosisResult | null;
}

export type AgentStatus =
  | 'idle'
  | 'building'
  | 'analyzing'
  | 'fixing'
  | 'verifying'
  | 'resolved'
  | 'needs_info'
  | 'escalate';

// =============================================================================
// 定数: ビルドコマンド（プラットフォーム別）
// =============================================================================

export const BUILD_COMMANDS: Record<BuildPlatform, BuildCommand> = {
  ios: {
    platform: 'ios',
    command: 'xcodebuild -scheme {{scheme}} -destination "generic/platform=iOS" -configuration Debug build 2>&1',
    cleanCommand: 'xcodebuild clean -scheme {{scheme}} -configuration Debug 2>&1 && rm -rf ~/Library/Developer/Xcode/DerivedData',
    logPath: 'build_logs/ios_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'BUILD SUCCEEDED|\\*\\* BUILD SUCCEEDED \\*\\*',
    projectFileGlob: '*.xcodeproj,*.xcworkspace,Package.swift',
    descriptionJa: 'Xcode ビルド（iOS）',
  },
  android: {
    platform: 'android',
    command: './gradlew assembleDebug 2>&1',
    cleanCommand: './gradlew clean 2>&1 && rm -rf .gradle build app/build',
    logPath: 'build_logs/android_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'BUILD SUCCESSFUL',
    projectFileGlob: 'build.gradle.kts,build.gradle,settings.gradle.kts',
    descriptionJa: 'Gradle ビルド（Android）',
  },
  wpf: {
    platform: 'wpf',
    command: 'dotnet build --configuration Debug 2>&1',
    cleanCommand: 'dotnet clean 2>&1 && rm -rf bin obj',
    logPath: 'build_logs/wpf_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'Build succeeded',
    projectFileGlob: '*.csproj,*.sln',
    descriptionJa: 'dotnet build（WPF / .NET）',
  },
  react: {
    platform: 'react',
    command: 'npm run build 2>&1',
    cleanCommand: 'rm -rf .next node_modules/.cache && npm run build 2>&1',
    logPath: 'build_logs/react_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'Compiled successfully|✓ Compiled|Build completed',
    projectFileGlob: 'package.json,next.config.*,tsconfig.json',
    descriptionJa: 'npm build（React / Next.js）',
  },
  python: {
    platform: 'python',
    command: 'python -m py_compile {{main}} 2>&1 && pyinstaller --noconfirm {{spec}} 2>&1',
    cleanCommand: 'rm -rf build dist __pycache__ *.spec 2>&1',
    logPath: 'build_logs/python_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'completed successfully|Building.*completed|INFO: Building',
    projectFileGlob: 'pyproject.toml,setup.py,requirements.txt,*.spec',
    descriptionJa: 'Python ビルド（PyInstaller）',
  },
  tauri: {
    platform: 'tauri',
    command: 'npm run tauri build 2>&1',
    cleanCommand: 'cargo clean 2>&1 && rm -rf src-tauri/target && npm run tauri build 2>&1',
    logPath: 'build_logs/tauri_build_{{timestamp}}.log',
    tailLines: 200,
    successRegex: 'Finished|finished.*release',
    projectFileGlob: 'src-tauri/Cargo.toml,src-tauri/tauri.conf.json',
    descriptionJa: 'Tauri ビルド（Rust + TypeScript）',
  },
};

// =============================================================================
// 定数: エラーパターン定義
// =============================================================================

export const BUILD_ERROR_PATTERNS: BuildErrorPattern[] = [
  // =========================================================================
  // iOS — Compile
  // =========================================================================
  {
    id: 'ios-compile-swift-type',
    platform: 'ios',
    category: 'Compile',
    regex: "cannot convert value of type '(.+)' to expected argument type '(.+)'",
    descriptionJa: 'Swift 型不一致エラー',
    descriptionEn: 'Swift type mismatch error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-undeclared',
    platform: 'ios',
    category: 'Compile',
    regex: "cannot find '(.+)' in scope|use of undeclared identifier '(.+)'",
    descriptionJa: '未宣言シンボルの参照',
    descriptionEn: 'Use of undeclared identifier',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-concurrency',
    platform: 'ios',
    category: 'Compile',
    regex: 'sending .+ risks causing data races|non-sendable type .+ cannot|actor-isolated .+ cannot be referenced',
    descriptionJa: 'Swift 6 Concurrency エラー（Sendable / actor isolation）',
    descriptionEn: 'Swift 6 concurrency error (Sendable / actor isolation)',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-deprecated-api',
    platform: 'ios',
    category: 'Compile',
    regex: "'(.+)' was deprecated in (iOS|macOS|Swift) ([0-9.]+)",
    descriptionJa: '非推奨 API 使用',
    descriptionEn: 'Deprecated API usage',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-module-not-found',
    platform: 'ios',
    category: 'Compile',
    regex: "no such module '(.+)'|module '(.+)' not found",
    descriptionJa: 'モジュールが見つからない',
    descriptionEn: 'Module not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-swift-version',
    platform: 'ios',
    category: 'Compile',
    regex: 'compiling for (.+) but module .+ has a minimum deployment target of (.+)',
    descriptionJa: 'デプロイメントターゲットの不一致',
    descriptionEn: 'Deployment target mismatch',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-compile-access-control',
    platform: 'ios',
    category: 'Compile',
    regex: "'(.+)' is inaccessible due to '(internal|private|fileprivate)' protection level",
    descriptionJa: 'アクセス制御エラー',
    descriptionEn: 'Access control error',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // iOS — Link
  // =========================================================================
  {
    id: 'ios-link-undefined-symbol',
    platform: 'ios',
    category: 'Link',
    regex: 'Undefined symbols? for architecture|Undefined symbol:',
    descriptionJa: '未定義シンボル（リンクエラー）',
    descriptionEn: 'Undefined symbol (linker error)',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-link-duplicate-symbol',
    platform: 'ios',
    category: 'Link',
    regex: 'duplicate symbol .+ in:',
    descriptionJa: 'シンボル重複（リンクエラー）',
    descriptionEn: 'Duplicate symbol (linker error)',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-link-framework-not-found',
    platform: 'ios',
    category: 'Link',
    regex: 'framework not found (.+)|library not found for -l(.+)',
    descriptionJa: 'フレームワーク / ライブラリが見つからない',
    descriptionEn: 'Framework or library not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // iOS — Dependency
  // =========================================================================
  {
    id: 'ios-dep-spm-resolve',
    platform: 'ios',
    category: 'Dependency',
    regex: 'resolved source packages|package .+ is using Swift tools version|Dependencies could not be resolved',
    descriptionJa: 'SPM パッケージ解決エラー',
    descriptionEn: 'SPM package resolution failure',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-dep-cocoapods',
    platform: 'ios',
    category: 'Dependency',
    regex: "\\[!\\] CocoaPods could not find|\\[!\\] Unable to find a specification for|pod install.*failed",
    descriptionJa: 'CocoaPods 解決エラー',
    descriptionEn: 'CocoaPods resolution failure',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-dep-version-conflict',
    platform: 'ios',
    category: 'Dependency',
    regex: 'version solving failed|because .+ depends on .+ which requires',
    descriptionJa: 'パッケージバージョン衝突',
    descriptionEn: 'Package version conflict',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // iOS — ScriptPhase
  // =========================================================================
  {
    id: 'ios-script-phase-fail',
    platform: 'ios',
    category: 'ScriptPhase',
    regex: 'Command PhaseScriptExecution failed with a nonzero exit code',
    descriptionJa: 'Run Script Phase の実行失敗',
    descriptionEn: 'Run Script Phase execution failed',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-script-swiftlint',
    platform: 'ios',
    category: 'ScriptPhase',
    regex: 'swiftlint.*error|SwiftLint.*not installed',
    descriptionJa: 'SwiftLint スクリプトフェーズエラー',
    descriptionEn: 'SwiftLint script phase error',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // iOS — Environment
  // =========================================================================
  {
    id: 'ios-env-xcode-select',
    platform: 'ios',
    category: 'Environment',
    regex: 'xcode-select: error:|unable to find utility|no developer tools were found',
    descriptionJa: 'Xcode / Command Line Tools が見つからない',
    descriptionEn: 'Xcode or Command Line Tools not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-env-sdk-not-found',
    platform: 'ios',
    category: 'Environment',
    regex: 'SDK "(.+)" cannot be located|unable to find SDK',
    descriptionJa: 'iOS SDK が見つからない',
    descriptionEn: 'iOS SDK not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-env-simulator-runtime',
    platform: 'ios',
    category: 'Environment',
    regex: 'unable to find a destination matching|no matching destination|Simulator.*runtime.*not available',
    descriptionJa: 'シミュレーターランタイムが見つからない',
    descriptionEn: 'Simulator runtime not available',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-env-xcode-version',
    platform: 'ios',
    category: 'Environment',
    regex: 'requires Xcode ([0-9.]+) or later|Xcode version .+ is not supported',
    descriptionJa: 'Xcode バージョン不足',
    descriptionEn: 'Xcode version too old',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // iOS — CodeSign
  // =========================================================================
  {
    id: 'ios-codesign-no-profile',
    platform: 'ios',
    category: 'CodeSign',
    regex: 'No profiles for .+ were found|Provisioning profile .+ not found',
    descriptionJa: 'プロビジョニングプロファイルが見つからない',
    descriptionEn: 'Provisioning profile not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-codesign-expired',
    platform: 'ios',
    category: 'CodeSign',
    regex: 'Certificate .+ has expired|Provisioning profile .+ has expired',
    descriptionJa: '証明書 / プロファイルの有効期限切れ',
    descriptionEn: 'Certificate or provisioning profile has expired',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-codesign-entitlements',
    platform: 'ios',
    category: 'CodeSign',
    regex: 'entitlements .+ not permitted|provisioning profile doesn.t support .+ entitlement',
    descriptionJa: 'Entitlements の不整合',
    descriptionEn: 'Entitlements mismatch',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'ios-codesign-team',
    platform: 'ios',
    category: 'CodeSign',
    regex: 'Signing requires a development team|No signing certificate',
    descriptionJa: '開発チーム / 署名証明書が未設定',
    descriptionEn: 'Development team or signing certificate not set',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Android — Compile
  // =========================================================================
  {
    id: 'android-compile-kotlin',
    platform: 'android',
    category: 'Compile',
    regex: 'e: .+\\.kt:.+: (.+)|Unresolved reference: (.+)',
    descriptionJa: 'Kotlin コンパイルエラー',
    descriptionEn: 'Kotlin compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-compile-java',
    platform: 'android',
    category: 'Compile',
    regex: 'error: cannot find symbol|error: incompatible types',
    descriptionJa: 'Java コンパイルエラー',
    descriptionEn: 'Java compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-compile-kapt',
    platform: 'android',
    category: 'Compile',
    regex: 'kapt.*error|KaptExecution.*failed|Annotation processing error',
    descriptionJa: 'KAPT / アノテーション処理エラー',
    descriptionEn: 'KAPT / annotation processing error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-compile-compose',
    platform: 'android',
    category: 'Compile',
    regex: '@Composable invocations can only happen|Composable .+ is not a function',
    descriptionJa: 'Jetpack Compose コンパイルエラー',
    descriptionEn: 'Jetpack Compose compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Android — Dependency
  // =========================================================================
  {
    id: 'android-dep-gradle-resolve',
    platform: 'android',
    category: 'Dependency',
    regex: 'Could not resolve .+|Could not find .+\\.jar|Failed to resolve:',
    descriptionJa: 'Gradle 依存解決エラー',
    descriptionEn: 'Gradle dependency resolution failure',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-dep-version-catalog',
    platform: 'android',
    category: 'Dependency',
    regex: 'Version catalog .+ does not contain|libs\\.versions\\.toml.*error',
    descriptionJa: 'バージョンカタログエラー',
    descriptionEn: 'Version catalog error',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Android — Environment
  // =========================================================================
  {
    id: 'android-env-sdk',
    platform: 'android',
    category: 'Environment',
    regex: 'SDK location not found|ANDROID_HOME .+ not set|failed to find target.*android-',
    descriptionJa: 'Android SDK パスが見つからない',
    descriptionEn: 'Android SDK path not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-env-jdk',
    platform: 'android',
    category: 'Environment',
    regex: 'Unsupported Java version|requires JDK ([0-9]+)|UnsupportedClassVersionError',
    descriptionJa: 'JDK バージョン不一致',
    descriptionEn: 'JDK version mismatch',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'android-env-agp-gradle',
    platform: 'android',
    category: 'Environment',
    regex: 'Minimum supported Gradle version is|This version of the Android Gradle plugin requires',
    descriptionJa: 'AGP と Gradle のバージョン不整合',
    descriptionEn: 'AGP / Gradle version incompatibility',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Android — CodeSign
  // =========================================================================
  {
    id: 'android-codesign-keystore',
    platform: 'android',
    category: 'CodeSign',
    regex: 'Keystore .+ not found|keystore password was incorrect|Cannot sign APK',
    descriptionJa: 'Keystore エラー',
    descriptionEn: 'Keystore error',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // C# WPF — Compile
  // =========================================================================
  {
    id: 'wpf-compile-cs',
    platform: 'wpf',
    category: 'Compile',
    regex: 'error CS[0-9]+:',
    descriptionJa: 'C# コンパイルエラー',
    descriptionEn: 'C# compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'wpf-compile-xaml',
    platform: 'wpf',
    category: 'Compile',
    regex: 'error MC[0-9]+:|XamlParseException|XAML.*error',
    descriptionJa: 'XAML パースエラー',
    descriptionEn: 'XAML parse error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // C# WPF — Dependency
  // =========================================================================
  {
    id: 'wpf-dep-nuget',
    platform: 'wpf',
    category: 'Dependency',
    regex: 'NU[0-9]+:.*Unable to resolve|error NU[0-9]+|package .+ is not compatible',
    descriptionJa: 'NuGet パッケージ解決エラー',
    descriptionEn: 'NuGet package resolution error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'wpf-dep-syncfusion',
    platform: 'wpf',
    category: 'Dependency',
    regex: 'Syncfusion.*license.*invalid|Syncfusion.*version.*mismatch',
    descriptionJa: 'Syncfusion ライセンス / バージョンエラー',
    descriptionEn: 'Syncfusion license or version error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // C# WPF — Environment
  // =========================================================================
  {
    id: 'wpf-env-dotnet',
    platform: 'wpf',
    category: 'Environment',
    regex: 'The framework .+ was not found|dotnet.*not found|MSB4019',
    descriptionJa: '.NET SDK / ランタイムが見つからない',
    descriptionEn: '.NET SDK or runtime not found',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // React / Next.js — Compile
  // =========================================================================
  {
    id: 'react-compile-ts',
    platform: 'react',
    category: 'Compile',
    regex: 'error TS[0-9]+:|Type error:',
    descriptionJa: 'TypeScript コンパイルエラー',
    descriptionEn: 'TypeScript compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'react-compile-jsx',
    platform: 'react',
    category: 'Compile',
    regex: 'SyntaxError:.*Unexpected token|Parsing error:',
    descriptionJa: 'JSX / 構文エラー',
    descriptionEn: 'JSX / syntax error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // React / Next.js — Dependency
  // =========================================================================
  {
    id: 'react-dep-npm',
    platform: 'react',
    category: 'Dependency',
    regex: "npm ERR!.*ERESOLVE|npm ERR!.*peer dep|Cannot find module '(.+)'",
    descriptionJa: 'npm 依存解決エラー',
    descriptionEn: 'npm dependency resolution error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Python — Compile
  // =========================================================================
  {
    id: 'python-compile-syntax',
    platform: 'python',
    category: 'Compile',
    regex: 'SyntaxError:|IndentationError:|TabError:',
    descriptionJa: 'Python 構文エラー',
    descriptionEn: 'Python syntax error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'python-compile-import',
    platform: 'python',
    category: 'Compile',
    regex: 'ModuleNotFoundError:|ImportError:',
    descriptionJa: 'Python モジュール未検出',
    descriptionEn: 'Python module not found',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Python — Dependency
  // =========================================================================
  {
    id: 'python-dep-pip',
    platform: 'python',
    category: 'Dependency',
    regex: 'ERROR:.*No matching distribution|pip.*ResolutionImpossible|Could not find a version',
    descriptionJa: 'pip 依存解決エラー',
    descriptionEn: 'pip dependency resolution error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Tauri — Compile
  // =========================================================================
  {
    id: 'tauri-compile-rust',
    platform: 'tauri',
    category: 'Compile',
    regex: 'error\\[E[0-9]+\\]:',
    descriptionJa: 'Rust コンパイルエラー',
    descriptionEn: 'Rust compilation error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // Tauri — Dependency
  // =========================================================================
  {
    id: 'tauri-dep-cargo',
    platform: 'tauri',
    category: 'Dependency',
    regex: 'failed to select a version for|no matching package named',
    descriptionJa: 'Cargo 依存解決エラー',
    descriptionEn: 'Cargo dependency resolution error',
    severity: 'high',
    lastVerified: '2026-02-22',
  },

  // =========================================================================
  // 共通（全プラットフォーム）
  // =========================================================================
  {
    id: 'common-env-disk-space',
    platform: null,
    category: 'Environment',
    regex: 'No space left on device|disk full|ENOSPC',
    descriptionJa: 'ディスク容量不足',
    descriptionEn: 'Disk space exhausted',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
  {
    id: 'common-env-permission',
    platform: null,
    category: 'Environment',
    regex: 'Permission denied|EACCES',
    descriptionJa: 'パーミッションエラー',
    descriptionEn: 'Permission denied',
    severity: 'high',
    lastVerified: '2026-02-22',
  },
  {
    id: 'common-env-network',
    platform: null,
    category: 'Environment',
    regex: 'Could not connect|Network is unreachable|Connection timed out|ETIMEDOUT|ECONNREFUSED',
    descriptionJa: 'ネットワーク接続エラー',
    descriptionEn: 'Network connection error',
    severity: 'medium',
    lastVerified: '2026-02-22',
  },
  {
    id: 'common-env-memory',
    platform: null,
    category: 'Environment',
    regex: 'out of memory|ENOMEM|Killed.*signal|heap.*exhausted|JavaScript heap out of memory',
    descriptionJa: 'メモリ不足',
    descriptionEn: 'Out of memory',
    severity: 'critical',
    lastVerified: '2026-02-22',
  },
];

// =============================================================================
// 定数: 修正戦略
// =============================================================================

export const FIX_STRATEGIES: FixStrategy[] = [
  // =========================================================================
  // iOS — Compile fixes
  // =========================================================================
  {
    patternId: 'ios-compile-concurrency',
    type: 'config_change',
    targetFileGlob: 'Package.swift',
    descriptionJa: 'Swift Concurrency を StrictConcurrency: complete ではなく targeted に緩和',
    descriptionEn: 'Relax Swift Concurrency from complete to targeted',
    autoFixable: true,
    command: null,
    searchPattern: 'StrictConcurrency: .complete',
    replacePattern: 'StrictConcurrency: .targeted',
    verifyCommand: 'swift build 2>&1 | tail -5',
    preconditionCommand: 'grep -r "StrictConcurrency" Package.swift',
  },
  {
    patternId: 'ios-compile-concurrency',
    type: 'config_change',
    targetFileGlob: '*.xcodeproj/project.pbxproj',
    descriptionJa: 'SWIFT_STRICT_CONCURRENCY を targeted に設定（Xcode プロジェクト）',
    descriptionEn: 'Set SWIFT_STRICT_CONCURRENCY to targeted in Xcode project',
    autoFixable: true,
    command: null,
    searchPattern: 'SWIFT_STRICT_CONCURRENCY = complete',
    replacePattern: 'SWIFT_STRICT_CONCURRENCY = targeted',
    verifyCommand: null,
    preconditionCommand: 'grep -r "SWIFT_STRICT_CONCURRENCY" *.xcodeproj/project.pbxproj',
  },
  {
    patternId: 'ios-compile-module-not-found',
    type: 'command_run',
    targetFileGlob: 'Package.swift',
    descriptionJa: 'SPM パッケージキャッシュをクリアして再解決',
    descriptionEn: 'Clear SPM package cache and re-resolve',
    autoFixable: true,
    command: 'swift package purge-cache && swift package resolve',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'swift build 2>&1 | tail -5',
    preconditionCommand: 'test -f Package.swift',
  },
  {
    patternId: 'ios-compile-module-not-found',
    type: 'command_run',
    targetFileGlob: 'Podfile',
    descriptionJa: 'CocoaPods を再インストール',
    descriptionEn: 'Reinstall CocoaPods dependencies',
    autoFixable: true,
    command: 'pod deintegrate && pod install --repo-update',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: null,
    preconditionCommand: 'test -f Podfile',
  },
  {
    patternId: 'ios-compile-swift-version',
    type: 'config_change',
    targetFileGlob: 'Package.swift',
    descriptionJa: 'Package.swift の platform 最小バージョンを引き上げ',
    descriptionEn: 'Raise minimum platform version in Package.swift',
    autoFixable: false,
    command: null,
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'swift build 2>&1 | tail -5',
    preconditionCommand: null,
  },

  // =========================================================================
  // iOS — Link fixes
  // =========================================================================
  {
    patternId: 'ios-link-framework-not-found',
    type: 'command_run',
    targetFileGlob: 'Package.swift',
    descriptionJa: 'SPM パッケージを再フェッチ',
    descriptionEn: 'Re-fetch SPM packages',
    autoFixable: true,
    command: 'swift package resolve --skip-update && swift package update',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'swift build 2>&1 | tail -5',
    preconditionCommand: 'test -f Package.swift',
  },

  // =========================================================================
  // iOS — Dependency fixes
  // =========================================================================
  {
    patternId: 'ios-dep-spm-resolve',
    type: 'command_run',
    targetFileGlob: 'Package.swift',
    descriptionJa: 'Package.resolved を削除して SPM を再解決',
    descriptionEn: 'Delete Package.resolved and re-resolve SPM',
    autoFixable: true,
    command: 'rm -f Package.resolved && swift package resolve',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'swift build 2>&1 | tail -5',
    preconditionCommand: 'test -f Package.swift',
  },
  {
    patternId: 'ios-dep-cocoapods',
    type: 'command_run',
    targetFileGlob: 'Podfile',
    descriptionJa: 'CocoaPods リポジトリ更新 + 再インストール',
    descriptionEn: 'Update CocoaPods repo and reinstall',
    autoFixable: true,
    command: 'pod repo update && pod install',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: null,
    preconditionCommand: 'test -f Podfile',
  },

  // =========================================================================
  // iOS — ScriptPhase fixes
  // =========================================================================
  {
    patternId: 'ios-script-swiftlint',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'SwiftLint をインストール（Homebrew）',
    descriptionEn: 'Install SwiftLint via Homebrew',
    autoFixable: true,
    command: 'which swiftlint || brew install swiftlint',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'swiftlint version',
    preconditionCommand: 'which brew',
  },

  // =========================================================================
  // iOS — Environment fixes
  // =========================================================================
  {
    patternId: 'ios-env-xcode-select',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'xcode-select でアクティブな Xcode を設定',
    descriptionEn: 'Set active Xcode via xcode-select',
    autoFixable: true,
    command: 'sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'xcode-select -p',
    preconditionCommand: 'test -d /Applications/Xcode.app',
  },
  {
    patternId: 'ios-env-xcode-select',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'Command Line Tools をインストール',
    descriptionEn: 'Install Command Line Tools',
    autoFixable: true,
    command: 'xcode-select --install',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'xcode-select -p',
    preconditionCommand: null,
  },

  // =========================================================================
  // iOS — CodeSign fixes
  // =========================================================================
  {
    patternId: 'ios-codesign-team',
    type: 'config_change',
    targetFileGlob: '*.xcodeproj/project.pbxproj',
    descriptionJa: '自動署名を有効化',
    descriptionEn: 'Enable automatic code signing',
    autoFixable: false,
    command: null,
    searchPattern: 'CODE_SIGN_STYLE = Manual',
    replacePattern: 'CODE_SIGN_STYLE = Automatic',
    verifyCommand: null,
    preconditionCommand: 'grep -r "CODE_SIGN_STYLE = Manual" *.xcodeproj/project.pbxproj',
  },

  // =========================================================================
  // Android — Compile fixes
  // =========================================================================
  {
    patternId: 'android-compile-kapt',
    type: 'config_change',
    targetFileGlob: 'app/build.gradle.kts',
    descriptionJa: 'kapt を KSP に移行（Dagger/Hilt/Room）',
    descriptionEn: 'Migrate from kapt to KSP (Dagger/Hilt/Room)',
    autoFixable: false,
    command: null,
    searchPattern: null,
    replacePattern: null,
    verifyCommand: './gradlew assembleDebug 2>&1 | tail -5',
    preconditionCommand: 'grep -r "kapt" app/build.gradle.kts',
  },

  // =========================================================================
  // Android — Dependency fixes
  // =========================================================================
  {
    patternId: 'android-dep-gradle-resolve',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'Gradle キャッシュをクリアして再ビルド',
    descriptionEn: 'Clear Gradle cache and rebuild',
    autoFixable: true,
    command: './gradlew clean && rm -rf ~/.gradle/caches && ./gradlew --refresh-dependencies',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: './gradlew assembleDebug 2>&1 | tail -5',
    preconditionCommand: 'test -f gradlew',
  },

  // =========================================================================
  // Android — Environment fixes
  // =========================================================================
  {
    patternId: 'android-env-sdk',
    type: 'env_setup',
    targetFileGlob: 'local.properties',
    descriptionJa: 'local.properties に ANDROID_HOME を設定',
    descriptionEn: 'Set ANDROID_HOME in local.properties',
    autoFixable: true,
    command: 'echo "sdk.dir=$HOME/Android/Sdk" > local.properties',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'cat local.properties',
    preconditionCommand: 'test -d "$HOME/Android/Sdk" -o -d "$ANDROID_HOME"',
  },
  {
    patternId: 'android-env-agp-gradle',
    type: 'config_change',
    targetFileGlob: 'gradle/wrapper/gradle-wrapper.properties',
    descriptionJa: 'Gradle ラッパーバージョンを AGP 要件に合わせて更新',
    descriptionEn: 'Update Gradle wrapper version to match AGP requirements',
    autoFixable: false,
    command: null,
    searchPattern: null,
    replacePattern: null,
    verifyCommand: './gradlew --version',
    preconditionCommand: null,
  },

  // =========================================================================
  // C# WPF — Dependency fixes
  // =========================================================================
  {
    patternId: 'wpf-dep-nuget',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'NuGet パッケージを復元',
    descriptionEn: 'Restore NuGet packages',
    autoFixable: true,
    command: 'dotnet restore --force',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'dotnet build --no-restore 2>&1 | tail -5',
    preconditionCommand: null,
  },

  // =========================================================================
  // C# WPF — Environment fixes
  // =========================================================================
  {
    patternId: 'wpf-env-dotnet',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: '.NET SDK 情報を表示（バージョン確認）',
    descriptionEn: 'Display .NET SDK information (version check)',
    autoFixable: false,
    command: 'dotnet --list-sdks',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: null,
    preconditionCommand: null,
  },

  // =========================================================================
  // React — Dependency fixes
  // =========================================================================
  {
    patternId: 'react-dep-npm',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'node_modules 再インストール（legacy-peer-deps）',
    descriptionEn: 'Reinstall node_modules with legacy-peer-deps',
    autoFixable: true,
    command: 'rm -rf node_modules package-lock.json && npm install --legacy-peer-deps',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'npm run build 2>&1 | tail -5',
    preconditionCommand: 'test -f package.json',
  },

  // =========================================================================
  // Python — Dependency fixes
  // =========================================================================
  {
    patternId: 'python-dep-pip',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'pip 依存を再インストール',
    descriptionEn: 'Reinstall pip dependencies',
    autoFixable: true,
    command: 'pip install -r requirements.txt --force-reinstall',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'python -c "import sys; print(sys.version)"',
    preconditionCommand: 'test -f requirements.txt',
  },

  // =========================================================================
  // 共通
  // =========================================================================
  {
    patternId: 'common-env-disk-space',
    type: 'command_run',
    targetFileGlob: '.',
    descriptionJa: 'ビルドキャッシュをクリア（ディスク容量確保）',
    descriptionEn: 'Clear build caches (free disk space)',
    autoFixable: true,
    command: 'rm -rf ~/Library/Developer/Xcode/DerivedData ~/.gradle/caches /tmp/build-* 2>/dev/null; echo "Cleared build caches"',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: 'df -h .',
    preconditionCommand: null,
  },
  {
    patternId: 'common-env-memory',
    type: 'env_setup',
    targetFileGlob: '.',
    descriptionJa: 'ビルド時のメモリ制限を引き上げ',
    descriptionEn: 'Increase memory limit for build',
    autoFixable: true,
    command: 'export NODE_OPTIONS="--max-old-space-size=8192"; export GRADLE_OPTS="-Xmx4g"',
    searchPattern: null,
    replacePattern: null,
    verifyCommand: null,
    preconditionCommand: null,
  },
];

// =============================================================================
// エージェント設定
// =============================================================================

export const AGENT_CONFIG = {
  /** 最大自動修正ループ回数 */
  maxLoops: 2,
  /** ログ保存ディレクトリ */
  logDir: 'build_logs',
  /** エラー抽出: 末尾行数 */
  tailLines: 200,
  /** 信頼度閾値: これ以上なら自動修正を試行 */
  autoFixThreshold: 0.6,
  /** 信頼度閾値: これ以下なら情報収集に移行 */
  needsInfoThreshold: 0.3,
  /** プラットフォーム検出の優先順 */
  platformDetectionOrder: [
    'ios', 'android', 'wpf', 'tauri', 'react', 'python',
  ] as BuildPlatform[],
  /** プラットフォーム検出ファイル */
  platformDetectionFiles: {
    ios: ['*.xcodeproj', '*.xcworkspace', 'Package.swift', 'Podfile'],
    android: ['build.gradle.kts', 'build.gradle', 'settings.gradle.kts'],
    wpf: ['*.csproj', '*.sln'],
    tauri: ['src-tauri/Cargo.toml', 'src-tauri/tauri.conf.json'],
    react: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    python: ['pyproject.toml', 'setup.py', 'requirements.txt'],
  } as Record<BuildPlatform, string[]>,
} as const;

// =============================================================================
// プラットフォーム別情報収集コマンド
// =============================================================================

/** 追加情報を収集するためのコマンド群 */
export const INFO_GATHERING_COMMANDS: Record<BuildPlatform, Array<{
  id: string;
  command: string;
  descriptionJa: string;
  descriptionEn: string;
  category: BuildErrorCategory;
}>> = {
  ios: [
    { id: 'ios-xcode-version',    command: 'xcodebuild -version',                   descriptionJa: 'Xcode バージョン確認',      descriptionEn: 'Check Xcode version',       category: 'Environment' },
    { id: 'ios-swift-version',    command: 'swift --version',                       descriptionJa: 'Swift バージョン確認',       descriptionEn: 'Check Swift version',        category: 'Environment' },
    { id: 'ios-xcode-select',     command: 'xcode-select -p',                       descriptionJa: 'アクティブ Xcode パス確認',  descriptionEn: 'Check active Xcode path',    category: 'Environment' },
    { id: 'ios-sdk-list',         command: 'xcodebuild -showsdks 2>/dev/null | grep -i ios', descriptionJa: '利用可能 iOS SDK 一覧', descriptionEn: 'List available iOS SDKs', category: 'Environment' },
    { id: 'ios-spm-deps',         command: 'swift package show-dependencies 2>/dev/null | head -30', descriptionJa: 'SPM 依存ツリー', descriptionEn: 'SPM dependency tree',    category: 'Dependency' },
    { id: 'ios-signing',          command: 'security find-identity -v -p codesigning 2>/dev/null | head -10', descriptionJa: '署名証明書一覧', descriptionEn: 'List signing certificates', category: 'CodeSign' },
    { id: 'ios-schemes',          command: 'xcodebuild -list 2>/dev/null | head -20', descriptionJa: 'Xcode スキーム一覧',       descriptionEn: 'List Xcode schemes',         category: 'Environment' },
  ],
  android: [
    { id: 'android-gradle-version', command: './gradlew --version 2>/dev/null | head -5', descriptionJa: 'Gradle バージョン確認', descriptionEn: 'Check Gradle version', category: 'Environment' },
    { id: 'android-java-version',   command: 'java -version 2>&1 | head -3',          descriptionJa: 'JDK バージョン確認',     descriptionEn: 'Check JDK version',    category: 'Environment' },
    { id: 'android-sdk-path',       command: 'echo $ANDROID_HOME',                     descriptionJa: 'ANDROID_HOME パス確認',  descriptionEn: 'Check ANDROID_HOME',   category: 'Environment' },
    { id: 'android-deps',           command: './gradlew dependencies --configuration debugRuntimeClasspath 2>/dev/null | head -40', descriptionJa: 'Gradle 依存ツリー', descriptionEn: 'Gradle dependency tree', category: 'Dependency' },
  ],
  wpf: [
    { id: 'wpf-dotnet-version', command: 'dotnet --list-sdks',                        descriptionJa: '.NET SDK バージョン一覧', descriptionEn: 'List .NET SDK versions', category: 'Environment' },
    { id: 'wpf-nuget-sources',  command: 'dotnet nuget list source',                  descriptionJa: 'NuGet ソース一覧',        descriptionEn: 'List NuGet sources',     category: 'Dependency' },
  ],
  react: [
    { id: 'react-node-version', command: 'node --version && npm --version',            descriptionJa: 'Node.js / npm バージョン確認', descriptionEn: 'Check Node.js / npm versions', category: 'Environment' },
    { id: 'react-deps',         command: 'npm ls --depth=0 2>/dev/null | head -30',    descriptionJa: 'npm 依存一覧',            descriptionEn: 'List npm dependencies',        category: 'Dependency' },
  ],
  python: [
    { id: 'python-version',    command: 'python --version && pip --version',           descriptionJa: 'Python / pip バージョン確認', descriptionEn: 'Check Python / pip versions', category: 'Environment' },
    { id: 'python-deps',       command: 'pip list 2>/dev/null | head -30',             descriptionJa: 'pip パッケージ一覧',       descriptionEn: 'List pip packages',            category: 'Dependency' },
  ],
  tauri: [
    { id: 'tauri-rust-version', command: 'rustc --version && cargo --version',         descriptionJa: 'Rust / Cargo バージョン確認', descriptionEn: 'Check Rust / Cargo versions', category: 'Environment' },
    { id: 'tauri-node-version', command: 'node --version && npm --version',            descriptionJa: 'Node.js / npm バージョン確認', descriptionEn: 'Check Node.js / npm versions', category: 'Environment' },
  ],
};

// =============================================================================
// コア関数
// =============================================================================

/**
 * ビルドログからエラーカテゴリを分類する
 *
 * @param logLines ビルドログの行配列
 * @param platform 対象プラットフォーム
 * @returns 最も確度の高いエラーカテゴリ
 */
export function classifyBuildError(
  logLines: string[],
  platform: BuildPlatform,
): BuildErrorCategory {
  const matches = findMatchingPatterns(logLines, platform);
  if (matches.length === 0) {
    return 'Compile'; // デフォルト: コンパイルエラーとして扱う
  }

  // severity で重み付けしてカテゴリごとにスコアリング
  const categoryScores: Record<BuildErrorCategory, number> = {
    Compile: 0,
    Link: 0,
    Dependency: 0,
    ScriptPhase: 0,
    Environment: 0,
    CodeSign: 0,
  };

  const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };

  for (const match of matches) {
    categoryScores[match.category] += severityWeight[match.severity];
  }

  // 最高スコアのカテゴリを返す
  let maxCategory: BuildErrorCategory = 'Compile';
  let maxScore = 0;
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as BuildErrorCategory;
    }
  }

  return maxCategory;
}

/**
 * ビルドログにマッチするエラーパターンを検索する
 *
 * @param logLines ビルドログの行配列
 * @param platform 対象プラットフォーム
 * @returns マッチしたパターンの配列
 */
export function findMatchingPatterns(
  logLines: string[],
  platform: BuildPlatform,
): BuildErrorPattern[] {
  const applicablePatterns = BUILD_ERROR_PATTERNS.filter(
    (p) => p.platform === null || p.platform === platform,
  );

  const matched: BuildErrorPattern[] = [];
  const logText = logLines.join('\n');

  for (const pattern of applicablePatterns) {
    try {
      const regex = new RegExp(pattern.regex, 'mi');
      if (regex.test(logText)) {
        matched.push(pattern);
      }
    } catch {
      // 無効な正規表現はスキップ
    }
  }

  // severity 順でソート（critical が先頭）
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  matched.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return matched;
}

/**
 * マッチしたパターンに基づいて修正戦略を提案する
 *
 * @param patterns マッチしたエラーパターン
 * @returns 優先度順の修正戦略リスト
 */
export function suggestFixes(patterns: BuildErrorPattern[]): FixStrategy[] {
  const fixes: FixStrategy[] = [];
  const seenPatternIds = new Set<string>();

  for (const pattern of patterns) {
    if (seenPatternIds.has(pattern.id)) continue;
    seenPatternIds.add(pattern.id);

    const matchingFixes = FIX_STRATEGIES.filter(
      (f) => f.patternId === pattern.id,
    );
    fixes.push(...matchingFixes);
  }

  // autoFixable を優先
  fixes.sort((a, b) => {
    if (a.autoFixable && !b.autoFixable) return -1;
    if (!a.autoFixable && b.autoFixable) return 1;
    return 0;
  });

  return fixes;
}

/**
 * ビルドログを分析して診断結果を生成する
 *
 * @param logLines ビルドログの行配列
 * @param platform 対象プラットフォーム
 * @returns 診断結果
 */
export function diagnose(
  logLines: string[],
  platform: BuildPlatform,
): DiagnosisResult {
  const matchedPatterns = findMatchingPatterns(logLines, platform);
  const category = classifyBuildError(logLines, platform);
  const suggestedFixes = suggestFixes(matchedPatterns);

  // エラー関連行を抽出
  const errorKeywords = ['error:', 'Error:', 'ERROR:', 'fatal:', 'FATAL:', 'failed', 'FAILED'];
  const relevantLines = logLines.filter((line) =>
    errorKeywords.some((kw) => line.includes(kw)),
  );

  // 信頼度の計算
  let confidence = 0;
  if (matchedPatterns.length > 0) {
    confidence = Math.min(1.0, 0.3 + (matchedPatterns.length * 0.15));
    if (suggestedFixes.some((f) => f.autoFixable)) {
      confidence = Math.min(1.0, confidence + 0.2);
    }
    if (matchedPatterns.some((p) => p.severity === 'critical')) {
      confidence = Math.min(1.0, confidence + 0.1);
    }
  }

  return {
    category,
    matchedPatterns,
    suggestedFixes,
    relevantLines: relevantLines.slice(0, 50), // 最大50行
    knownConflicts: [], // compatibility/ との照合は呼び出し側で実施
    confidence,
  };
}

/**
 * プロジェクトルートからプラットフォームを自動検出する
 *
 * @param files プロジェクトルート直下のファイル名一覧
 * @returns 検出されたプラットフォーム、または null
 */
export function detectPlatform(files: string[]): BuildPlatform | null {
  for (const platform of AGENT_CONFIG.platformDetectionOrder) {
    const detectionFiles = AGENT_CONFIG.platformDetectionFiles[platform];
    for (const pattern of detectionFiles) {
      // 簡易マッチ（グロブの * を正規表現に変換）
      const regex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$',
      );
      if (files.some((f) => regex.test(f))) {
        return platform;
      }
    }
  }
  return null;
}

/**
 * エージェントの初期状態を生成する
 */
export function createAgentState(
  platform: BuildPlatform,
  projectRoot: string,
): AgentState {
  return {
    loop: 0,
    maxLoops: AGENT_CONFIG.maxLoops,
    platform,
    projectRoot,
    buildLogs: [],
    appliedFixes: [],
    status: 'idle',
    lastDiagnosis: null,
  };
}

/**
 * 次のアクションを決定する
 *
 * @param state 現在のエージェント状態
 * @param buildSucceeded 直前のビルドが成功したか
 * @returns 次のステータス
 */
export function determineNextAction(
  state: AgentState,
  buildSucceeded: boolean,
): AgentStatus {
  if (buildSucceeded) {
    return 'resolved';
  }

  if (state.loop >= state.maxLoops) {
    // ループ上限に到達
    if (state.lastDiagnosis && state.lastDiagnosis.confidence < AGENT_CONFIG.needsInfoThreshold) {
      return 'needs_info';
    }
    return 'escalate';
  }

  if (state.lastDiagnosis) {
    if (state.lastDiagnosis.confidence >= AGENT_CONFIG.autoFixThreshold) {
      return 'fixing';
    }
    return 'needs_info';
  }

  return 'analyzing';
}

/**
 * カテゴリ別の情報収集コマンドを取得する
 *
 * @param platform プラットフォーム
 * @param category エラーカテゴリ
 * @returns カテゴリに関連する情報収集コマンド
 */
export function getInfoGatheringCommands(
  platform: BuildPlatform,
  category: BuildErrorCategory,
): Array<{ id: string; command: string; descriptionJa: string; descriptionEn: string }> {
  const commands = INFO_GATHERING_COMMANDS[platform] || [];
  return commands.filter((cmd) => cmd.category === category);
}

/**
 * ビルドコマンドのテンプレートを変数で置換する
 *
 * @param template コマンドテンプレート
 * @param variables 変数マップ
 * @returns 置換後のコマンド文字列
 */
export function renderCommand(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * タイムスタンプ付きのログファイルパスを生成する
 *
 * @param platform プラットフォーム
 * @returns ログファイルパス
 */
export function generateLogPath(platform: BuildPlatform): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  return BUILD_COMMANDS[platform].logPath.replace('{{timestamp}}', timestamp);
}

// =============================================================================
// エクスポートまとめ
// =============================================================================

export const BUILD_DOCTOR_VERSION = '1.0.0';
export const BUILD_DOCTOR_LAST_UPDATED = '2026-02-22';
