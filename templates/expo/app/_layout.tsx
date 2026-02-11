/**
 * Insight Root Layout (expo-router)
 *
 * __app_display_name__ をアプリ名に置換してください。
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { colors, getThemeColors } from '@/lib/colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.background },
          headerTintColor: themeColors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: themeColors.background },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="license"
          options={{
            title: 'ライセンス',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
