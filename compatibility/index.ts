/**
 * HARMONIC insight — 互換性マトリクス統合エントリポイント
 *
 * ============================================================================
 * 使い方:
 *   import { checkAndroidCompatibility, getRecommendedProfile } from '@/insight-common/compatibility';
 *   import { getRecommendedIosProfile, IOS_CONFLICT_RULES } from '@/insight-common/compatibility';
 *   import { APP_VERSIONS, getAppVersion } from '@/insight-common/config/app-versions';
 * ============================================================================
 */

// Android
export {
  ANDROID_PROFILES,
  ANDROID_LIBRARIES,
  ANDROID_CONFLICT_RULES,
  AGP_GRADLE_MATRIX,
  COMPOSE_KOTLIN_RULES,
  KSP_RULES,
  GOOGLE_PLAY_TARGET_SDK_DEADLINES,
  getMinGradleForAgp,
  getRecommendedProfile,
  checkAndroidCompatibility,
  getLatestVersion,
} from './android-matrix';

export type {
  CompatStatus,
  CompatibilityRule,
  LibraryInfo,
  VersionConstraint,
  ToolchainProfile,
} from './android-matrix';

// iOS
export {
  XCODE_VERSIONS,
  SWIFT_VERSIONS,
  IOS_PROFILES,
  IOS_LIBRARIES,
  IOS_CONFLICT_RULES,
  APP_STORE_SDK_DEADLINES,
  SWIFTUI_FEATURE_AVAILABILITY,
  getSwiftForXcode,
  getRecommendedIosProfile,
  getAvailableSwiftUIFeatures,
  getMinXcodeForAppStoreDeadline,
} from './ios-matrix';

export type {
  XcodeVersion,
  IosToolchainProfile,
} from './ios-matrix';

// =============================================================================
// 統合チェック関数
// =============================================================================

import { ANDROID_CONFLICT_RULES } from './android-matrix';
import { IOS_CONFLICT_RULES } from './ios-matrix';
import type { CompatibilityRule, CompatStatus } from './android-matrix';

/**
 * 全プラットフォームの衝突ルール数を取得（監査用）
 */
export function getTotalRuleCount(): { android: number; ios: number; total: number } {
  return {
    android: ANDROID_CONFLICT_RULES.length,
    ios: IOS_CONFLICT_RULES.length,
    total: ANDROID_CONFLICT_RULES.length + IOS_CONFLICT_RULES.length,
  };
}

/**
 * 指定された severity 以上の全ルールを取得
 */
export function getCriticalRules(
  minSeverity: 'critical' | 'high' | 'medium' | 'low' = 'high',
): CompatibilityRule[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const threshold = severityOrder[minSeverity];

  return [
    ...ANDROID_CONFLICT_RULES,
    ...IOS_CONFLICT_RULES,
  ].filter((rule) => severityOrder[rule.severity] <= threshold);
}

/**
 * 互換性マトリクスの最終更新日を取得
 */
export const MATRIX_LAST_UPDATED = '2026-02-16';
export const MATRIX_VERSION = '1.0.0';
