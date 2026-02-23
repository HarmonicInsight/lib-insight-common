/**
 * HARMONIC insight — アプリバージョンレジストリ
 *
 * ============================================================================
 * 【重要】全製品のバージョン・ビルド番号を一元管理
 * ============================================================================
 *
 * ## 目的
 * - 全製品の現在のバージョンを一箇所で確認・管理
 * - リリース履歴の追跡
 * - ツールチェーン（SDK, Compiler, Framework）バージョンとの紐付け
 * - CI/CD やリリーススクリプトからの参照
 *
 * ## バージョニング規約
 * - セマンティックバージョニング: MAJOR.MINOR.PATCH
 * - MAJOR: 破壊的変更・大型機能追加
 * - MINOR: 後方互換のある機能追加
 * - PATCH: バグ修正・軽微な改善
 *
 * ## 更新手順
 * 1. リリース前に該当製品の version / buildNumber を更新
 * 2. toolchain セクションが最新の互換性マトリクスと一致することを確認
 * 3. releaseHistory に新エントリを追加
 * 4. `validate-standards.sh` で検証
 *
 * ## 参照
 * - 互換性マトリクス: compatibility/android-matrix.ts, compatibility/ios-matrix.ts
 * - リリースチェック: standards/RELEASE_CHECKLIST.md
 */

import type { ProductCode, AppPlatform } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** ツールチェーン情報（プラットフォーム共通） */
export interface ToolchainInfo {
  /** 使用言語・コンパイラバージョン */
  language: string;
  languageVersion: string;
  /** フレームワーク */
  framework: string;
  frameworkVersion: string;
  /** ビルドツール */
  buildTool: string;
  buildToolVersion: string;
  /** プラットフォーム固有の追加情報 */
  platformSpecific?: Record<string, string>;
}

/** Android 固有のツールチェーン */
export interface AndroidToolchain extends ToolchainInfo {
  platformSpecific: {
    agpVersion: string;
    gradleVersion: string;
    kspVersion: string;
    compileSdk: string;
    targetSdk: string;
    minSdk: string;
    jvmTarget: string;
    composeBom: string;
  };
}

/** iOS 固有のツールチェーン */
export interface IosToolchain extends ToolchainInfo {
  platformSpecific: {
    xcodeVersion: string;
    swiftVersion: string;
    iosSdk: string;
    deploymentTarget: string;
    macosRequired: string;
  };
}

/** WPF 固有のツールチェーン */
export interface WpfToolchain extends ToolchainInfo {
  platformSpecific: {
    dotnetVersion: string;
    targetFramework: string;
    syncfusionVersion?: string;
  };
}

/** リリース履歴エントリ */
export interface ReleaseEntry {
  version: string;
  buildNumber: number;
  date: string;
  channel: 'development' | 'staging' | 'production';
  changelog: {
    ja: string;
    en: string;
  };
}

/** アプリバージョン情報 */
export interface AppVersionInfo {
  productCode: ProductCode;
  platform: AppPlatform;
  /** 現在のバージョン（セマンティックバージョニング） */
  version: string;
  /**
   * ビルド番号（整数、リリースごとにインクリメント）
   * - Android: versionCode
   * - iOS: CFBundleVersion
   * - WPF: AssemblyVersion の 4 桁目
   */
  buildNumber: number;
  /** 開発ステータス */
  status: 'development' | 'alpha' | 'beta' | 'rc' | 'stable';
  /** ツールチェーン情報 */
  toolchain: ToolchainInfo;
  /** リリース履歴（新しい順） */
  releaseHistory: ReleaseEntry[];
  /** 最終更新日（ISO 8601） */
  lastUpdated: string;
}

// =============================================================================
// アプリバージョンレジストリ
// =============================================================================

export const APP_VERSIONS: Record<ProductCode, AppVersionInfo> = {

  // ===========================================================================
  // Tier 1: 業務変革ツール
  // ===========================================================================

  INCA: {
    productCode: 'INCA',
    platform: 'tauri',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'Rust + TypeScript',
      languageVersion: 'Rust 1.82 + TypeScript 5.7',
      framework: 'Tauri',
      frameworkVersion: '2.2',
      buildTool: 'Cargo + Vite',
      buildToolVersion: 'Cargo 1.82 + Vite 6.0',
    },
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  INBT: {
    productCode: 'INBT',
    platform: 'service',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
      },
    },
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  IVIN: {
    productCode: 'IVIN',
    platform: 'tauri',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'Rust + TypeScript',
      languageVersion: 'Rust 1.82 + TypeScript 5.7',
      framework: 'Tauri',
      frameworkVersion: '2.2',
      buildTool: 'Cargo + Vite',
      buildToolVersion: 'Cargo 1.82 + Vite 6.0',
    },
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  // ===========================================================================
  // Tier 2: AI 活用ツール
  // ===========================================================================

  INMV: {
    productCode: 'INMV',
    platform: 'python',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'Python',
      languageVersion: '3.12',
      framework: 'CustomTkinter',
      frameworkVersion: '5.2',
      buildTool: 'PyInstaller',
      buildToolVersion: '6.11',
    },
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  INIG: {
    productCode: 'INIG',
    platform: 'python',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'Python',
      languageVersion: '3.12',
      framework: 'CustomTkinter',
      frameworkVersion: '5.2',
      buildTool: 'PyInstaller',
      buildToolVersion: '6.11',
    },
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  // ===========================================================================
  // Tier 3: InsightOffice Suite
  // ===========================================================================

  INSS: {
    productCode: 'INSS',
    platform: 'wpf',
    version: '2.2.0',
    buildNumber: 50,
    status: 'stable',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
        syncfusionVersion: '27.2',
      },
    } as WpfToolchain,
    releaseHistory: [
      {
        version: '2.2.0',
        buildNumber: 50,
        date: '2026-02-23',
        channel: 'production',
        changelog: {
          ja: 'リモートコンフィグ対応: API キーローテーション、モデルレジストリのホットアップデート、Velopack 自動更新、フィーチャーフラグを追加',
          en: 'Remote config support: API key rotation, model registry hot-update, Velopack auto-update, and feature flags',
        },
      },
      {
        version: '2.1.0',
        buildNumber: 45,
        date: '2026-02-16',
        channel: 'production',
        changelog: {
          ja: '安定版リリース',
          en: 'Stable release',
        },
      },
    ],
    lastUpdated: '2026-02-23',
  },

  IOSH: {
    productCode: 'IOSH',
    platform: 'wpf',
    version: '2.0.0',
    buildNumber: 38,
    status: 'stable',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
        syncfusionVersion: '27.2',
      },
    } as WpfToolchain,
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  IOSD: {
    productCode: 'IOSD',
    platform: 'wpf',
    version: '1.1.0',
    buildNumber: 5,
    status: 'development',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
        syncfusionVersion: '27.2',
      },
    } as WpfToolchain,
    releaseHistory: [
      {
        version: '1.1.0',
        buildNumber: 5,
        date: '2026-02-23',
        channel: 'development',
        changelog: {
          ja: 'リモートコンフィグ対応: API キーローテーション、モデルレジストリのホットアップデート、Velopack 自動更新、フィーチャーフラグを追加',
          en: 'Remote config support: API key rotation, model registry hot-update, Velopack auto-update, and feature flags',
        },
      },
    ],
    lastUpdated: '2026-02-23',
  },

  INPY: {
    productCode: 'INPY',
    platform: 'wpf',
    version: '1.0.0',
    buildNumber: 1,
    status: 'development',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
      },
    } as WpfToolchain,
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },

  // ===========================================================================
  // Tier 4: InsightSeniorOffice
  // ===========================================================================

  ISOF: {
    productCode: 'ISOF',
    platform: 'wpf',
    version: '1.5.0',
    buildNumber: 22,
    status: 'stable',
    toolchain: {
      language: 'C#',
      languageVersion: '12.0',
      framework: 'WPF (.NET)',
      frameworkVersion: '.NET 8.0',
      buildTool: 'MSBuild',
      buildToolVersion: '17.12',
      platformSpecific: {
        dotnetVersion: '8.0',
        targetFramework: 'net8.0-windows',
        syncfusionVersion: '27.2',
      },
    } as WpfToolchain,
    releaseHistory: [],
    lastUpdated: '2026-02-16',
  },
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 製品の現在のバージョン文字列を取得
 */
export function getAppVersion(productCode: ProductCode): string {
  return APP_VERSIONS[productCode].version;
}

/**
 * 製品のビルド番号を取得
 */
export function getBuildNumber(productCode: ProductCode): number {
  return APP_VERSIONS[productCode].buildNumber;
}

/**
 * Android versionCode 形式のバージョン文字列を生成
 * 例: "2.1.0" buildNumber=45 → "2001045"
 */
export function toAndroidVersionCode(productCode: ProductCode): number {
  const info = APP_VERSIONS[productCode];
  const [major, minor, patch] = info.version.split('.').map(Number);
  return major * 1000000 + minor * 1000 + patch * 100 + info.buildNumber;
}

/**
 * iOS Bundle Version 文字列を生成
 * 例: "2.1.0" buildNumber=45 → "2.1.0.45"
 */
export function toIosBundleVersion(productCode: ProductCode): string {
  const info = APP_VERSIONS[productCode];
  return `${info.version}.${info.buildNumber}`;
}

/**
 * WPF AssemblyVersion 文字列を生成
 * 例: "2.1.0" buildNumber=45 → "2.1.0.45"
 */
export function toAssemblyVersion(productCode: ProductCode): string {
  const info = APP_VERSIONS[productCode];
  return `${info.version}.${info.buildNumber}`;
}

/**
 * 全製品のバージョンサマリーを取得
 */
export function getAllVersionsSummary(): Array<{
  productCode: ProductCode;
  version: string;
  buildNumber: number;
  status: string;
  platform: AppPlatform;
}> {
  return (Object.keys(APP_VERSIONS) as ProductCode[]).map((code) => ({
    productCode: code,
    version: APP_VERSIONS[code].version,
    buildNumber: APP_VERSIONS[code].buildNumber,
    status: APP_VERSIONS[code].status,
    platform: APP_VERSIONS[code].platform,
  }));
}

/**
 * 製品のツールチェーン情報を取得
 */
export function getToolchain(productCode: ProductCode): ToolchainInfo {
  return APP_VERSIONS[productCode].toolchain;
}

// =============================================================================
// リモートバージョンチェック用ヘルパー
// =============================================================================

/**
 * セマンティックバージョンを比較
 *
 * @returns 負数: a < b, 0: a == b, 正数: a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

/**
 * 製品のバージョンがリモートの最新版より古いかチェック
 *
 * リモートコンフィグから取得した最新バージョンと比較する際に使用。
 *
 * @example
 * ```typescript
 * const needsUpdate = isUpdateAvailable('INSS', '2.3.0', 55);
 * // → INSS は現在 2.2.0 build 50 なので true
 * ```
 */
export function isUpdateAvailable(
  productCode: ProductCode,
  remoteVersion: string,
  remoteBuildNumber: number,
): boolean {
  const current = APP_VERSIONS[productCode];
  const versionDiff = compareVersions(remoteVersion, current.version);
  if (versionDiff > 0) return true;
  if (versionDiff === 0 && remoteBuildNumber > current.buildNumber) return true;
  return false;
}

/**
 * 製品のバージョンが最低必須バージョンを満たしているか
 *
 * 強制更新が必要かの判定に使用。
 *
 * @example
 * ```typescript
 * const mustUpdate = !meetsMinimumVersion('INSS', '2.0.0', 30);
 * // → INSS は 2.2.0 build 50 なので false（更新不要）
 * ```
 */
export function meetsMinimumVersion(
  productCode: ProductCode,
  minimumVersion: string,
  minimumBuildNumber: number,
): boolean {
  const current = APP_VERSIONS[productCode];
  const versionDiff = compareVersions(current.version, minimumVersion);
  if (versionDiff > 0) return true;
  if (versionDiff === 0 && current.buildNumber >= minimumBuildNumber) return true;
  if (versionDiff < 0) return false;
  return false;
}
