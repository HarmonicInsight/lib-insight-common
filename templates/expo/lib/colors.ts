/**
 * Insight Ivory & Gold カラーシステム (Expo/React Native)
 *
 * brand/colors.json に基づく統一カラー定義。
 * 全 Expo アプリはこのファイルからカラーを import する。
 * ハードコードされた色値の直接使用は禁止。
 *
 * 使い方:
 *   import { colors } from '@/lib/colors';
 *   <View style={{ backgroundColor: colors.background.primary }} />
 */

export const colors = {
  // === Brand Primary (Gold) ===
  brand: {
    primary: '#B8942F',
    primaryHover: '#8C711E',
    primaryLight: '#F0E6C8',
  },

  // === Background (Ivory) ===
  background: {
    primary: '#FAF8F5',
    secondary: '#F3F0EB',
    card: '#FFFFFF',
    hover: '#EEEBE5',
  },

  // === Accent Scale (Gold) ===
  accent: {
    50: '#FDF9EF',
    100: '#F9F0D9',
    200: '#F0E6C8',
    300: '#E5D5A0',
    400: '#D4BC6A',
    500: '#B8942F',
    600: '#8C711E',
    700: '#6B5518',
    800: '#4A3B10',
    900: '#2D2408',
  },

  // === Text ===
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    tertiary: '#A8A29E',
    muted: '#D6D3D1',
    accent: '#8C711E',
    onPrimary: '#FFFFFF',
  },

  // === Border ===
  border: {
    default: '#E7E2DA',
    light: '#F3F0EB',
    focus: '#B8942F',
  },

  // === Semantic ===
  semantic: {
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#CA8A04',
    warningLight: '#FEF9C3',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#2563EB',
    infoLight: '#DBEAFE',
  },

  // === Plan Badge ===
  plan: {
    trial: '#2563EB',
    std: '#16A34A',
    pro: '#B8942F',
    ent: '#7C3AED',
  },

  // === Dark Mode ===
  dark: {
    background: {
      primary: '#1C1917',
      secondary: '#292524',
      card: '#292524',
      hover: '#3D3835',
    },
    text: {
      primary: '#FAF8F5',
      secondary: '#D6D3D1',
      tertiary: '#A8A29E',
    },
    border: {
      default: '#3D3835',
      light: '#292524',
    },
  },
} as const;

/**
 * Light/Dark テーマ切り替え用ヘルパー
 */
export function getThemeColors(isDark: boolean) {
  return {
    primary: colors.brand.primary,
    background: isDark ? colors.dark.background.primary : colors.background.primary,
    card: isDark ? colors.dark.background.card : colors.background.card,
    text: isDark ? colors.dark.text.primary : colors.text.primary,
    textSecondary: isDark ? colors.dark.text.secondary : colors.text.secondary,
    border: isDark ? colors.dark.border.default : colors.border.default,
  };
}
