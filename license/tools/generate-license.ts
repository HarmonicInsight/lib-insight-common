#!/usr/bin/env npx ts-node
/**
 * ライセンスキー発行 CLI ツール
 *
 * 使用方法:
 *   npx ts-node generate-license.ts --product ALL --tier TRIAL
 *   npx ts-node generate-license.ts --product SLIDE --tier PRO --expires 2025-12-31
 *   npx ts-node generate-license.ts --product FORG --tier STD --months 12
 */

import {
  generateLicenseWithExpiry,
  ProductCode,
  LicenseTier,
  PRODUCT_NAMES,
  TIER_NAMES,
  TIERS,
} from '../typescript/index';

// コマンドライン引数解析
function parseArgs(): {
  product: ProductCode;
  tier: LicenseTier;
  expires?: Date;
  months?: number;
  count: number;
} {
  const args = process.argv.slice(2);
  let product: ProductCode = 'ALL';
  let tier: LicenseTier = 'TRIAL';
  let expires: Date | undefined;
  let months: number | undefined;
  let count = 1;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--product':
      case '-p':
        product = args[++i] as ProductCode;
        break;
      case '--tier':
      case '-t':
        tier = args[++i] as LicenseTier;
        break;
      case '--expires':
      case '-e':
        expires = new Date(args[++i]);
        break;
      case '--months':
      case '-m':
        months = parseInt(args[++i], 10);
        break;
      case '--count':
      case '-n':
        count = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // 月数指定の場合は有効期限を計算
  if (months && !expires) {
    expires = new Date();
    expires.setMonth(expires.getMonth() + months);
  }

  return { product, tier, expires, months, count };
}

function printHelp(): void {
  console.log(`
ライセンスキー発行ツール

使用方法:
  npx ts-node generate-license.ts [オプション]

オプション:
  -p, --product <CODE>   製品コード (SALES, SLIDE, PY, INTV, FORG, ALL)
  -t, --tier <TIER>      ティア (TRIAL, STD, PRO, ENT)
  -e, --expires <DATE>   有効期限 (YYYY-MM-DD形式)
  -m, --months <N>       有効期間（月数）
  -n, --count <N>        発行数
  -h, --help             ヘルプを表示

例:
  # 全製品トライアル（14日間）
  npx ts-node generate-license.ts -p ALL -t TRIAL

  # InsightSlide Professional（12ヶ月）
  npx ts-node generate-license.ts -p SLIDE -t PRO -m 12

  # InsightForguncy Standard（指定日まで）
  npx ts-node generate-license.ts -p FORG -t STD -e 2025-12-31

  # 10個一括発行
  npx ts-node generate-license.ts -p ALL -t TRIAL -n 10

製品コード:
  SALES  - SalesInsight
  SLIDE  - InsightSlide
  PY     - InsightPy
  INTV   - InterviewInsight
  FORG   - InsightForguncy
  ALL    - 全製品バンドル

ティア:
  TRIAL  - トライアル（デフォルト14日）
  STD    - Standard（年間）
  PRO    - Professional（年間）
  ENT    - Enterprise（永久）
`);
}

function formatDate(date: Date | null): string {
  if (!date) return '永久';
  return date.toISOString().split('T')[0];
}

function main(): void {
  const { product, tier, expires, count } = parseArgs();

  // 製品コード検証
  if (!PRODUCT_NAMES[product]) {
    console.error(`❌ 不正な製品コード: ${product}`);
    console.error(`   有効な値: ${Object.keys(PRODUCT_NAMES).join(', ')}`);
    process.exit(1);
  }

  // ティア検証
  if (!TIER_NAMES[tier]) {
    console.error(`❌ 不正なティア: ${tier}`);
    console.error(`   有効な値: ${Object.keys(TIER_NAMES).join(', ')}`);
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('  Insight Series ライセンス発行');
  console.log('========================================');
  console.log('');
  console.log(`製品: ${PRODUCT_NAMES[product]} (${product})`);
  console.log(`ティア: ${TIER_NAMES[tier]} (${tier})`);
  console.log(`発行数: ${count}`);
  console.log('');
  console.log('----------------------------------------');

  const licenses: { key: string; expires: string }[] = [];

  for (let i = 0; i < count; i++) {
    const result = generateLicenseWithExpiry({
      productCode: product,
      tier: tier,
      expiresAt: expires,
    });

    const expiresStr = formatDate(result.expiresAt);
    licenses.push({ key: result.licenseKey, expires: expiresStr });

    console.log(`${i + 1}. ${result.licenseKey}`);
    console.log(`   有効期限: ${expiresStr}`);
  }

  console.log('----------------------------------------');
  console.log('');

  // CSV形式で出力
  if (count > 1) {
    console.log('CSV形式:');
    console.log('license_key,expires_at,product,tier');
    licenses.forEach(l => {
      console.log(`${l.key},${l.expires},${product},${tier}`);
    });
    console.log('');
  }

  // JSON形式で出力
  console.log('JSON形式:');
  console.log(JSON.stringify(licenses.map(l => ({
    licenseKey: l.key,
    expiresAt: l.expires,
    product,
    tier,
    productName: PRODUCT_NAMES[product],
    tierName: TIER_NAMES[tier],
  })), null, 2));
}

main();
