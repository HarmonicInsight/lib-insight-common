/**
 * 設定画面テンプレート
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, typography, spacing, borderRadius } from '@/lib/theme';
import { colors } from '@/lib/colors';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={commonStyles.screenContainer}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Pressable
          style={[commonStyles.cardBordered, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => router.push('/license')}
        >
          <Text style={typography.titleMedium}>ライセンス</Text>
          <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>{'>'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
