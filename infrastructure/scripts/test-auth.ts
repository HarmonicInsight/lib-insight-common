#!/usr/bin/env npx ts-node
/**
 * 認証テストスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/test-auth.ts
 *   npm run test:auth
 *
 * 機能:
 *   - 開発用 TEST_FIREBASE_UID での認証テスト
 *   - API エンドポイント呼び出しテスト
 *   - entitlement_check のテスト
 */

import { config } from 'dotenv';
config();

async function main() {
  console.log('\n🧪 認証テスト\n');
  console.log('='.repeat(50));

  const testUid = process.env.TEST_FIREBASE_UID;

  if (!testUid) {
    console.log('❌ TEST_FIREBASE_UID が設定されていません');
    console.log('   開発環境で .env.local に以下を追加してください:');
    console.log('   TEST_FIREBASE_UID=dev-user-001\n');
    process.exit(1);
  }

  console.log(`\n📦 テスト用UID: ${testUid}\n`);

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // =============================================
  // 1. ユーザー作成テスト
  // =============================================
  console.log('1️⃣ ユーザー作成テスト');

  const testUser = {
    firebase_uid: testUid,
    email: 'dev@test.local',
    display_name: 'Dev User',
  };

  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert(testUser, { onConflict: 'firebase_uid' })
    .select()
    .single();

  if (userError) {
    console.log(`   ❌ エラー: ${userError.message}`);
  } else {
    console.log(`   ✅ ユーザー作成/更新成功`);
    console.log(`      id: ${user.id}`);
    console.log(`      firebase_uid: ${user.firebase_uid}`);
  }

  // =============================================
  // 2. ライセンス作成テスト
  // =============================================
  console.log('\n2️⃣ ライセンス作成テスト');

  if (user) {
    const testLicense = {
      user_id: user.id,
      product_code: 'INSS',
      plan: 'BIZ',
      license_key: 'TEST-BIZ-2512-XXXX-XXXX-XXXX',
      is_active: true,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後
    };

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .upsert(testLicense, { onConflict: 'user_id,product_code' })
      .select()
      .single();

    if (licenseError) {
      console.log(`   ❌ エラー: ${licenseError.message}`);
    } else {
      console.log(`   ✅ ライセンス作成/更新成功`);
      console.log(`      plan: ${license.plan}`);
      console.log(`      expires_at: ${license.expires_at}`);
    }
  }

  // =============================================
  // 3. Entitlement チェックテスト
  // =============================================
  console.log('\n3️⃣ Entitlement チェックテスト');

  if (user) {
    const { data: license } = await supabase
      .from('licenses')
      .select('plan, is_active, expires_at')
      .eq('user_id', user.id)
      .eq('product_code', 'INSS')
      .single();

    const testCases = [
      { feature: 'basic', expected: true },
      { feature: 'export_pdf', expected: true },  // BIZ なので許可
      { feature: 'batch_process', expected: true }, // BIZ なので許可
      { feature: 'api_access', expected: false },  // ENT のみ
    ];

    const FEATURE_MATRIX: Record<string, string[]> = {
      'basic': ['FREE', 'TRIAL', 'BIZ', 'ENT'],
      'export_pdf': ['BIZ', 'ENT'],
      'batch_process': ['BIZ', 'ENT'],
      'api_access': ['ENT'],
    };

    for (const tc of testCases) {
      const allowed = FEATURE_MATRIX[tc.feature]?.includes(license?.plan || 'TRIAL') ?? false;
      const status = allowed === tc.expected ? '✅' : '❌';
      console.log(`   ${status} ${tc.feature}: ${allowed} (期待値: ${tc.expected})`);
    }
  }

  // =============================================
  // クリーンアップオプション
  // =============================================
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ テスト完了\n');
  console.log('💡 テストデータを削除するには:');
  console.log(`   DELETE FROM users WHERE firebase_uid = '${testUid}';\n`);
}

main().catch(console.error);
