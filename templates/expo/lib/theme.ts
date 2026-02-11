/**
 * Insight デザインシステム (Expo/React Native)
 *
 * brand/design-system.json に基づく統一定義。
 * タイポグラフィ、スペーシング、ボーダー半径、シャドウを定義。
 *
 * 使い方:
 *   import { theme } from '@/lib/theme';
 *   <Text style={theme.typography.headlineLarge}>タイトル</Text>
 */

import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

// === Typography ===
export const typography = StyleSheet.create({
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '300',
    letterSpacing: -0.25,
    color: colors.text.primary,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '300',
    color: colors.text.primary,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400',
    color: colors.text.primary,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',
    color: colors.text.primary,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400',
    color: colors.text.primary,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400',
    color: colors.text.primary,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
    color: colors.text.primary,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
    color: colors.text.primary,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: colors.text.primary,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: colors.text.primary,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
    color: colors.text.secondary,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: colors.text.primary,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
});

// === Spacing (4px unit) ===
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

// === Border Radius ===
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// === Shadow ===
export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

// === Common Styles ===
export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.md,
  },
  cardBordered: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  primaryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    color: colors.text.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outlinedButtonText: {
    color: colors.brand.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
});

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
  commonStyles,
};
