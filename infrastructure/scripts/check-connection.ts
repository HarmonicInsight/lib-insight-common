#!/usr/bin/env npx ts-node
/**
 * 接続チェックスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/check-connection.ts
 *   npm run check:connection
 *
 * 機能:
 *   - Firebase Admin SDK 初期化テスト
 *   - Supabase 接続テスト
 *   - DB スキーマ確認
 */

import { config } from 'dotenv';
config();

async function main() {
  console.log('\n🔌 接続チェック\n');
  console.log('='.repeat(50));

  let hasError = false;

  // =============================================
  // Firebase Admin
  // =============================================
  console.log('\n📦 Firebase Admin');
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
    }

    const auth = getAuth();
    // 接続テスト（ユーザー一覧を1件取得）
    await auth.listUsers(1);

    console.log('  ✅ Firebase Admin 接続成功');
    console.log(`     Project: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error) {
    hasError = true;
    console.log('  ❌ Firebase Admin 接続失敗');
    console.log(`     エラー: ${error instanceof Error ? error.message : error}`);
  }

  // =============================================
  // Supabase
  // =============================================
  console.log('\n📦 Supabase');
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 接続テスト（usersテーブルを確認）
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      throw error;
    }

    console.log('  ✅ Supabase 接続成功');
    console.log(`     URL: ${process.env.SUPABASE_URL}`);

    // テーブル確認
    console.log('\n📋 テーブル確認');
    const tables = ['users', 'licenses', 'tenants', 'memberships', 'usage_logs'];

    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('id').limit(1);
      if (tableError) {
        console.log(`  ❌ ${table} - 存在しないか権限なし`);
        hasError = true;
      } else {
        console.log(`  ✅ ${table}`);
      }
    }
  } catch (error) {
    hasError = true;
    console.log('  ❌ Supabase 接続失敗');
    console.log(`     エラー: ${error instanceof Error ? error.message : error}`);
  }

  // =============================================
  // サマリー
  // =============================================
  console.log('\n' + '='.repeat(50));

  if (hasError) {
    console.log('\n❌ 一部の接続に問題があります\n');
    process.exit(1);
  } else {
    console.log('\n✅ 全ての接続が正常です！\n');
    process.exit(0);
  }
}

main().catch(console.error);
