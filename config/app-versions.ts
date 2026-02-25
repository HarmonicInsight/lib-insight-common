/**
 * HARMONIC insight 窶・繧｢繝励Μ繝舌・繧ｸ繝ｧ繝ｳ繝ｬ繧ｸ繧ｹ繝医Μ
 *
 * ============================================================================
 * 縲宣㍾隕√大・陬ｽ蜩√・繝舌・繧ｸ繝ｧ繝ｳ繝ｻ繝薙Ν繝臥分蜿ｷ繧剃ｸ蜈・ｮ｡逅・
 * ============================================================================
 *
 * ## 逶ｮ逧・
 * - 蜈ｨ陬ｽ蜩√・迴ｾ蝨ｨ縺ｮ繝舌・繧ｸ繝ｧ繝ｳ繧剃ｸ邂・園縺ｧ遒ｺ隱阪・邂｡逅・
 * - 繝ｪ繝ｪ繝ｼ繧ｹ螻･豁ｴ縺ｮ霑ｽ霍｡
 * - 繝・・繝ｫ繝√ぉ繝ｼ繝ｳ・・DK, Compiler, Framework・峨ヰ繝ｼ繧ｸ繝ｧ繝ｳ縺ｨ縺ｮ邏蝉ｻ倥￠
 * - CI/CD 繧・Μ繝ｪ繝ｼ繧ｹ繧ｹ繧ｯ繝ｪ繝励ヨ縺九ｉ縺ｮ蜿ら・
 *
 * ## 繝舌・繧ｸ繝ｧ繝九Φ繧ｰ隕冗ｴ・
 * - 繧ｻ繝槭Φ繝・ぅ繝・け繝舌・繧ｸ繝ｧ繝九Φ繧ｰ: MAJOR.MINOR.PATCH
 * - MAJOR: 遐ｴ螢顔噪螟画峩繝ｻ螟ｧ蝙区ｩ溯・霑ｽ蜉
 * - MINOR: 蠕梧婿莠呈鋤縺ｮ縺ゅｋ讖溯・霑ｽ蜉
 * - PATCH: 繝舌げ菫ｮ豁｣繝ｻ霆ｽ蠕ｮ縺ｪ謾ｹ蝟・
 *
 * ## 譖ｴ譁ｰ謇矩・
 * 1. 繝ｪ繝ｪ繝ｼ繧ｹ蜑阪↓隧ｲ蠖楢｣ｽ蜩√・ version / buildNumber 繧呈峩譁ｰ
 * 2. toolchain 繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ縺梧怙譁ｰ縺ｮ莠呈鋤諤ｧ繝槭ヨ繝ｪ繧ｯ繧ｹ縺ｨ荳閾ｴ縺吶ｋ縺薙→繧堤｢ｺ隱・
 * 3. releaseHistory 縺ｫ譁ｰ繧ｨ繝ｳ繝医Μ繧定ｿｽ蜉
 * 4. `validate-standards.sh` 縺ｧ讀懆ｨｼ
 *
 * ## 蜿ら・
 * - 莠呈鋤諤ｧ繝槭ヨ繝ｪ繧ｯ繧ｹ: compatibility/android-matrix.ts, compatibility/ios-matrix.ts
 * - 繝ｪ繝ｪ繝ｼ繧ｹ繝√ぉ繝・け: standards/RELEASE_CHECKLIST.md
 */

import type { ProductCode, AppPlatform } from './products';

// =============================================================================
// 蝙句ｮ夂ｾｩ
// =============================================================================

/** 繝・・繝ｫ繝√ぉ繝ｼ繝ｳ諠・ｱ・医・繝ｩ繝・ヨ繝輔か繝ｼ繝蜈ｱ騾夲ｼ・*/
export interface ToolchainInfo {
  /** 菴ｿ逕ｨ險隱槭・繧ｳ繝ｳ繝代う繝ｩ繝舌・繧ｸ繝ｧ繝ｳ */
  language: string;
  languageVersion: string;
  /** 繝輔Ξ繝ｼ繝繝ｯ繝ｼ繧ｯ */
  framework: string;
  frameworkVersion: string;
  /** 繝薙Ν繝峨ヤ繝ｼ繝ｫ */
  buildTool: string;
  buildToolVersion: string;
  /** 繝励Λ繝・ヨ繝輔か繝ｼ繝蝗ｺ譛峨・霑ｽ蜉諠・ｱ */
  platformSpecific?: Record<string, string>;
}

/** Android 蝗ｺ譛峨・繝・・繝ｫ繝√ぉ繝ｼ繝ｳ */
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

/** iOS 蝗ｺ譛峨・繝・・繝ｫ繝√ぉ繝ｼ繝ｳ */
export interface IosToolchain extends ToolchainInfo {
  platformSpecific: {
    xcodeVersion: string;
    swiftVersion: string;
    iosSdk: string;
    deploymentTarget: string;
    macosRequired: string;
  };
}

/** WPF 蝗ｺ譛峨・繝・・繝ｫ繝√ぉ繝ｼ繝ｳ */
export interface WpfToolchain extends ToolchainInfo {
  platformSpecific: {
    dotnetVersion: string;
    targetFramework: string;
    syncfusionVersion?: string;
  };
}

/** 繝ｪ繝ｪ繝ｼ繧ｹ螻･豁ｴ繧ｨ繝ｳ繝医Μ */
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

/** 繧｢繝励Μ繝舌・繧ｸ繝ｧ繝ｳ諠・ｱ */
export interface AppVersionInfo {
  productCode: ProductCode;
  platform: AppPlatform;
  /** 迴ｾ蝨ｨ縺ｮ繝舌・繧ｸ繝ｧ繝ｳ・医そ繝槭Φ繝・ぅ繝・け繝舌・繧ｸ繝ｧ繝九Φ繧ｰ・・*/
  version: string;
  /**
   * 繝薙Ν繝臥分蜿ｷ・域紛謨ｰ縲√Μ繝ｪ繝ｼ繧ｹ縺斐→縺ｫ繧､繝ｳ繧ｯ繝ｪ繝｡繝ｳ繝茨ｼ・
   * - Android: versionCode
   * - iOS: CFBundleVersion
   * - WPF: AssemblyVersion 縺ｮ 4 譯∫岼
   */
  buildNumber: number;
  /** 髢狗匱繧ｹ繝・・繧ｿ繧ｹ */
  status: 'development' | 'alpha' | 'beta' | 'rc' | 'stable';
  /** 繝・・繝ｫ繝√ぉ繝ｼ繝ｳ諠・ｱ */
  toolchain: ToolchainInfo;
  /** 繝ｪ繝ｪ繝ｼ繧ｹ螻･豁ｴ・域眠縺励＞鬆・ｼ・*/
  releaseHistory: ReleaseEntry[];
  /** 譛邨よ峩譁ｰ譌･・・SO 8601・・*/
  lastUpdated: string;
}

// =============================================================================
// 繧｢繝励Μ繝舌・繧ｸ繝ｧ繝ｳ繝ｬ繧ｸ繧ｹ繝医Μ
// =============================================================================

export const APP_VERSIONS: Record<ProductCode, AppVersionInfo> = {

  // ===========================================================================
  // Tier 1: 讌ｭ蜍吝､蛾擠繝・・繝ｫ
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
  // Tier 2: AI 豢ｻ逕ｨ繝・・繝ｫ
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
    version: '2.1.0',
    buildNumber: 45,
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
        syncfusionVersion: '27.2',
      },
    } as WpfToolchain,
    releaseHistory: [],
    lastUpdated: '2026-02-16',
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
// 繝倥Ν繝代・髢｢謨ｰ
// =============================================================================

/**
 * 陬ｽ蜩√・迴ｾ蝨ｨ縺ｮ繝舌・繧ｸ繝ｧ繝ｳ譁・ｭ怜・繧貞叙蠕・
 */
export function getAppVersion(productCode: ProductCode): string {
  return APP_VERSIONS[productCode].version;
}

/**
 * 陬ｽ蜩√・繝薙Ν繝臥分蜿ｷ繧貞叙蠕・
 */
export function getBuildNumber(productCode: ProductCode): number {
  return APP_VERSIONS[productCode].buildNumber;
}

/**
 * Android versionCode 蠖｢蠑上・繝舌・繧ｸ繝ｧ繝ｳ譁・ｭ怜・繧堤函謌・
 * 萓・ "2.1.0" buildNumber=45 竊・"2001045"
 */
export function toAndroidVersionCode(productCode: ProductCode): number {
  const info = APP_VERSIONS[productCode];
  const [major, minor, patch] = info.version.split('.').map(Number);
  return major * 1000000 + minor * 1000 + patch * 100 + info.buildNumber;
}

/**
 * iOS Bundle Version 譁・ｭ怜・繧堤函謌・
 * 萓・ "2.1.0" buildNumber=45 竊・"2.1.0.45"
 */
export function toIosBundleVersion(productCode: ProductCode): string {
  const info = APP_VERSIONS[productCode];
  return `${info.version}.${info.buildNumber}`;
}

/**
 * WPF AssemblyVersion 譁・ｭ怜・繧堤函謌・
 * 萓・ "2.1.0" buildNumber=45 竊・"2.1.0.45"
 */
export function toAssemblyVersion(productCode: ProductCode): string {
  const info = APP_VERSIONS[productCode];
  return `${info.version}.${info.buildNumber}`;
}

/**
 * 蜈ｨ陬ｽ蜩√・繝舌・繧ｸ繝ｧ繝ｳ繧ｵ繝槭Μ繝ｼ繧貞叙蠕・
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
 * 陬ｽ蜩√・繝・・繝ｫ繝√ぉ繝ｼ繝ｳ諠・ｱ繧貞叙蠕・
 */
export function getToolchain(productCode: ProductCode): ToolchainInfo {
  return APP_VERSIONS[productCode].toolchain;
}

// =============================================================================
// 繝ｪ繝｢繝ｼ繝医ヰ繝ｼ繧ｸ繝ｧ繝ｳ繝√ぉ繝・け逕ｨ繝倥Ν繝代・
// =============================================================================

/**
 * 繧ｻ繝槭Φ繝・ぅ繝・け繝舌・繧ｸ繝ｧ繝ｳ繧呈ｯ碑ｼ・
 *
 * @returns 雋謨ｰ: a < b, 0: a == b, 豁｣謨ｰ: a > b
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
 * 陬ｽ蜩√・繝舌・繧ｸ繝ｧ繝ｳ縺後Μ繝｢繝ｼ繝医・譛譁ｰ迚医ｈ繧雁商縺・°繝√ぉ繝・け
 *
 * 繝ｪ繝｢繝ｼ繝医さ繝ｳ繝輔ぅ繧ｰ縺九ｉ蜿門ｾ励＠縺滓怙譁ｰ繝舌・繧ｸ繝ｧ繝ｳ縺ｨ豈碑ｼ・☆繧矩圀縺ｫ菴ｿ逕ｨ縲・
 *
 * @example
 * ```typescript
 * const needsUpdate = isUpdateAvailable('INSS', '2.2.0', 50);
 * // 竊・INSS 縺ｯ迴ｾ蝨ｨ 2.1.0 build 45 縺ｪ縺ｮ縺ｧ true
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
 * 陬ｽ蜩√・繝舌・繧ｸ繝ｧ繝ｳ縺梧怙菴主ｿ・医ヰ繝ｼ繧ｸ繝ｧ繝ｳ繧呈ｺ縺溘＠縺ｦ縺・ｋ縺・
 *
 * 蠑ｷ蛻ｶ譖ｴ譁ｰ縺悟ｿ・ｦ√°縺ｮ蛻､螳壹↓菴ｿ逕ｨ縲・
 *
 * @example
 * ```typescript
 * const mustUpdate = !meetsMinimumVersion('INSS', '2.0.0', 30);
 * // 竊・INSS 縺ｯ 2.1.0 build 45 縺ｪ縺ｮ縺ｧ false・域峩譁ｰ荳崎ｦ・ｼ・
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
