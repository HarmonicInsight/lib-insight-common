/**
 * ホーム画面テンプレート
 */

import { View, Text } from 'react-native';
import { commonStyles, typography, spacing } from '@/lib/theme';
import { colors } from '@/lib/colors';

export default function HomeScreen() {
  return (
    <View style={commonStyles.screenContainer}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.headlineMedium, { color: colors.brand.primary }]}>
          __app_display_name__
        </Text>
        <Text style={[typography.bodyLarge, { marginTop: spacing.sm }]}>
          HARMONIC insight アプリ
        </Text>
      </View>
    </View>
  );
}
