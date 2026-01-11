#!/usr/bin/env npx ts-node
/**
 * Supabase セットアップスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/setup-supabase.ts
 *   npm run setup:supabase
 *
 * 機能:
 *   - テーブル作成（schema.sql 実行）
 *   - インデックス作成
 *   - 初期データ投入（オプション）
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

async function main() {
  console.log('\n🚀 Supabase セットアップ\n');
  console.log('='.repeat(50));

  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // schema.sql を読み込み
  const schemaPath = join(__dirname, '../db/schema.sql');
  let schemaSql: string;

  try {
    schemaSql = readFileSync(schemaPath, 'utf-8');
    console.log('📄 schema.sql を読み込みました\n');
  } catch (error) {
    console.error('❌ schema.sql が見つかりません:', schemaPath);
    process.exit(1);
  }

  // SQL を個別のステートメントに分割
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📦 ${statements.length} 個のSQLステートメントを実行します\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    // コメント行をスキップ
    if (statement.startsWith('--')) continue;

    try {
      // Supabase の rpc を使って raw SQL 実行
      // 注意: Supabase では直接 SQL 実行は Dashboard から行う必要がある場合あり
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // pg_catalog エラーなどは無視
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️ スキップ（既存）: ${statement.substring(0, 50)}...`);
        } else {
          throw error;
        }
      } else {
        successCount++;
        console.log(`  ✅ 実行: ${statement.substring(0, 50)}...`);
      }
    } catch (error) {
      errorCount++;
      console.log(`  ❌ エラー: ${statement.substring(0, 50)}...`);
      console.log(`     ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ 成功: ${successCount} / ❌ エラー: ${errorCount}\n`);

  if (errorCount > 0) {
    console.log('⚠️ エラーがあった場合は Supabase Dashboard から直接 schema.sql を実行してください。');
    console.log('   SQL Editor: https://supabase.com/dashboard/project/<your-project>/sql\n');
  }
}

main().catch(console.error);
