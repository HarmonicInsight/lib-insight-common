/**
 * UI スケール設定の定義
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * 全 WPF アプリ共通で UI 全体を拡大・縮小する機能の仕様定義。
 * シニア・視覚障害者・高齢者向けに LayoutTransform + ScaleTransform で
 * Window 全体を均一スケーリングする。
 *
 * ## 実装方式
 * - Window の root content（通常 Grid）に ScaleTransform を LayoutTransform として適用
 * - FontSize、Margin、コントロールサイズ等を均一にスケーリング
 * - Syncfusion コンポーネント（Ribbon / Spreadsheet / RichTextBoxAdv）も自動で追従
 * - 個別の FontSize 変更は不要
 *
 * ## C# 実装クラス
 * - `InsightCommon.UI.InsightScaleManager` — Singleton スケールマネージャー
 * - `InsightCommon.UI.InsightWindowChrome.Apply()` で自動適用
 *
 * ## 関連ドキュメント
 * - `standards/ACCESSIBILITY.md` — アクセシビリティ標準
 * - `standards/CSHARP_WPF.md` — WPF 開発標準（§アクセシビリティ）
 */

// =============================================================================
// スケール範囲
// =============================================================================

/** UI スケール範囲定義 */
export const UI_SCALE_RANGE = {
  /** 最小倍率 (50%) */
  min: 0.5,
  /** 最大倍率 (200%) */
  max: 2.0,
  /** デフォルト倍率 (100%) */
  default: 1.0,
  /** プリセット間のステップ */
  step: 0.25,
  /** 微調整ステップ（Ctrl+Plus/Minus） */
  fineStep: 0.05,
} as const;

// =============================================================================
// プリセット
// =============================================================================

/** UI スケールプリセット定義 */
export const UI_SCALE_PRESETS = [
  { factor: 0.5,  label: { ja: '50%（極小）',    en: '50% (Tiny)' } },
  { factor: 0.75, label: { ja: '75%（小）',      en: '75% (Small)' } },
  { factor: 1.0,  label: { ja: '100%（標準）',   en: '100% (Standard)' } },
  { factor: 1.25, label: { ja: '125%（やや大）', en: '125% (Medium)' } },
  { factor: 1.5,  label: { ja: '150%（大）',     en: '150% (Large)' } },
  { factor: 1.75, label: { ja: '175%（特大）',   en: '175% (Extra Large)' } },
  { factor: 2.0,  label: { ja: '200%（最大）',   en: '200% (Maximum)' } },
] as const;

/** プリセット型 */
export type UiScalePreset = (typeof UI_SCALE_PRESETS)[number];

// =============================================================================
// キーボードショートカット
// =============================================================================

/** UI スケール操作のキーボードショートカット */
export const UI_SCALE_SHORTCUTS = {
  zoomIn:    { key: 'Ctrl+Plus',  description: { ja: '拡大', en: 'Zoom In' } },
  zoomOut:   { key: 'Ctrl+Minus', description: { ja: '縮小', en: 'Zoom Out' } },
  resetZoom: { key: 'Ctrl+0',    description: { ja: '100% にリセット', en: 'Reset to 100%' } },
} as const;

// =============================================================================
// 永続化設定
// =============================================================================

/** UI スケール設定の保存先 */
export const UI_SCALE_STORAGE = {
  /** 保存ディレクトリ */
  directory: '%APPDATA%/HarmonicInsight',
  /** ファイル名 */
  fileName: 'ui-scale.json',
  /** JSON スキーマ */
  schema: {
    /** スケールファクター (0.5〜2.0) */
    scaleFactor: 'number' as const,
    /** 最終更新日時 (ISO 8601) */
    lastModified: 'string' as const,
  },
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * スケールファクターを有効範囲 (0.5〜2.0) にクランプする
 */
export function clampScale(factor: number): number {
  return Math.min(UI_SCALE_RANGE.max, Math.max(UI_SCALE_RANGE.min, factor));
}

/**
 * スケールファクターが有効範囲内かどうか判定する
 */
export function isValidScale(factor: number): boolean {
  return factor >= UI_SCALE_RANGE.min && factor <= UI_SCALE_RANGE.max;
}

/**
 * プリセットのラベルを取得する（一致するプリセットがなければ null）
 */
export function getPresetLabel(factor: number, locale: 'ja' | 'en'): string | null {
  const preset = UI_SCALE_PRESETS.find(p => Math.abs(p.factor - factor) < 0.001);
  return preset ? preset.label[locale] : null;
}

/**
 * スケールファクターをパーセント文字列に変換する
 */
export function formatScalePercent(factor: number): string {
  return `${Math.round(factor * 100)}%`;
}
