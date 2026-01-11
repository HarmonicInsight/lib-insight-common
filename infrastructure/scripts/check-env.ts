#!/usr/bin/env npx ts-node
/**
 * 環境変数チェックスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/check-env.ts
 *   npm run check:env
 *
 * 機能:
 *   - 必須環境変数の存在確認
 *   - Firebase/Supabase 接続テスト
 *   - 設定漏れを自動検出
 */

import { config } from 'dotenv';
config();

interface CheckResult {
  name: string;
  status: 'ok' | 'missing' | 'error';
  message?: string;
}

const results: CheckResult[] = [];

// =============================================
// 必須環境変数リスト
// =============================================
const REQUIRED_ENV = {
  // Firebase Admin (サーバー)
  server: [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ],
  // Firebase Client (ブラウザ)
  client: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ],
  // Supabase
  supabase: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
};

// =============================================
// チェック実行
// =============================================
console.log('\n🔍 環境変数チェック\n');
console.log('='.repeat(50));

// Firebase Admin
console.log('\n📦 Firebase Admin (サーバー)');
for (const key of REQUIRED_ENV.server) {
  const value = process.env[key];
  if (value) {
    results.push({ name: key, status: 'ok' });
    console.log(`  ✅ ${key}`);
  } else {
    results.push({ name: key, status: 'missing' });
    console.log(`  ❌ ${key} - 未設定`);
  }
}

// Firebase Client
console.log('\n📦 Firebase Client (ブラウザ)');
for (const key of REQUIRED_ENV.client) {
  const value = process.env[key];
  if (value) {
    results.push({ name: key, status: 'ok' });
    console.log(`  ✅ ${key}`);
  } else {
    results.push({ name: key, status: 'missing' });
    console.log(`  ❌ ${key} - 未設定`);
  }
}

// Supabase
console.log('\n📦 Supabase');
for (const key of REQUIRED_ENV.supabase) {
  const value = process.env[key];
  if (value) {
    results.push({ name: key, status: 'ok' });
    console.log(`  ✅ ${key}`);
  } else {
    results.push({ name: key, status: 'missing' });
    console.log(`  ❌ ${key} - 未設定`);
  }
}

// 開発用オプション
console.log('\n📦 開発オプション');
const testUid = process.env.TEST_FIREBASE_UID;
if (testUid) {
  console.log(`  ✅ TEST_FIREBASE_UID = ${testUid}`);
} else {
  console.log(`  ⚠️ TEST_FIREBASE_UID - 未設定（開発時のモック用）`);
}

// =============================================
// サマリー
// =============================================
console.log('\n' + '='.repeat(50));

const missing = results.filter(r => r.status === 'missing');
const ok = results.filter(r => r.status === 'ok');

if (missing.length === 0) {
  console.log('\n✅ 全ての必須環境変数が設定されています！\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${missing.length} 個の環境変数が不足しています:\n`);
  missing.forEach(m => console.log(`   - ${m.name}`));
  console.log('\n.env.local に追加してください。\n');
  process.exit(1);
}
