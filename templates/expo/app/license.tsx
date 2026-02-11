/**
 * ライセンス画面 (Insight Slides 形式)
 *
 * CLAUDE.md § 8「ライセンス画面（必須）」に準拠。
 * __PRODUCT_CODE__ を製品コードに置換してください。
 */

import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { licenseManager, PLAN_LABELS } from '@/lib/license-manager';
import { colors } from '@/lib/colors';
import { commonStyles, typography, spacing, borderRadius } from '@/lib/theme';

export default function LicenseScreen() {
  const [email, setEmail] = useState(licenseManager.email ?? '');
  const [key, setKey] = useState('');
  const [plan, setPlan] = useState(licenseManager.currentPlan);

  const planColor = plan
    ? colors.plan[plan.toLowerCase() as keyof typeof colors.plan] ?? colors.text.primary
    : colors.text.secondary;

  const handleActivate = async () => {
    const result = await licenseManager.activate(email, key);
    if (result.success) {
      setPlan(licenseManager.currentPlan);
      Alert.alert('成功', result.message);
    } else {
      Alert.alert('エラー', result.message);
    }
  };

  const handleClear = async () => {
    await licenseManager.deactivate();
    setPlan(null);
    setEmail('');
    setKey('');
  };

  return (
    <ScrollView
      style={commonStyles.screenContainer}
      contentContainerStyle={{ padding: spacing.lg, alignItems: 'center' }}
    >
      {/* アプリ名 (Gold) */}
      <Text style={[typography.headlineMedium, { color: colors.brand.primary, fontWeight: '700', textAlign: 'center' }]}>
        __app_display_name__
      </Text>

      <View style={{ height: spacing.xl }} />

      {/* 現在のプラン */}
      <Text style={[typography.bodyMedium, { color: colors.text.secondary }]}>
        現在のプラン
      </Text>
      <Text style={[typography.displaySmall, { color: planColor, fontWeight: '700', marginTop: spacing.xs }]}>
        {plan ?? '---'}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.text.secondary, marginTop: spacing.xs }]}>
        有効期限: {licenseManager.formattedExpiry()}
      </Text>

      <View style={{ height: spacing.lg }} />

      {/* ライセンス認証カード */}
      <View style={[commonStyles.card, { width: '100%' }]}>
        <Text style={[typography.titleMedium, { fontWeight: '700' }]}>
          ライセンス認証
        </Text>

        <View style={{ height: spacing.md }} />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="メールアドレス"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: borderRadius.md,
            padding: spacing.sm + 4,
            fontSize: 16,
            color: colors.text.primary,
          }}
        />

        <View style={{ height: spacing.sm }} />

        <TextInput
          value={key}
          onChangeText={setKey}
          placeholder="ライセンスキー"
          autoCapitalize="characters"
          style={{
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: borderRadius.md,
            padding: spacing.sm + 4,
            fontSize: 16,
            color: colors.text.primary,
          }}
        />

        <View style={{ height: spacing.md }} />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            style={[commonStyles.primaryButton, { flex: 1 }]}
            onPress={handleActivate}
          >
            <Text style={commonStyles.primaryButtonText}>アクティベート</Text>
          </Pressable>

          <Pressable
            style={[commonStyles.outlinedButton, { flex: 1 }]}
            onPress={handleClear}
          >
            <Text style={commonStyles.outlinedButtonText}>クリア</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
