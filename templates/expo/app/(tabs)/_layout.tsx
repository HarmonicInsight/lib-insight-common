/**
 * Insight Tab Layout (expo-router)
 *
 * タブアイコンとカラーを Ivory & Gold テーマに合わせる。
 * __app_display_name__ をアプリ名に置換してください。
 */

import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { getThemeColors, colors } from '@/lib/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
        },
        headerStyle: { backgroundColor: themeColors.background },
        headerTintColor: themeColors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          // tabBarIcon: ({ color, size }) => <IconComponent name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          // tabBarIcon: ({ color, size }) => <IconComponent name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
