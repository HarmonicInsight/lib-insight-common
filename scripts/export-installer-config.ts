/**
 * installer.ts の構成を JSON ファイルに出力するスクリプト
 *
 * 各製品の build.ps1 から呼び出され、Inno Setup スクリプト生成に必要な
 * 設定を JSON として書き出す。
 *
 * Usage:
 *   npx tsx scripts/export-installer-config.ts <ProductCode> [output-path]
 *
 * Example:
 *   npx tsx scripts/export-installer-config.ts IOSH ./installer-config.json
 *   npx tsx scripts/export-installer-config.ts INBT
 */

import { INSTALLER_CONFIGS, generateInnoSetupConfig } from '../config/installer';
import { PRODUCTS } from '../config/products';
import * as fs from 'fs';
import * as path from 'path';

const productCode = process.argv[2]?.toUpperCase();
const outputPath = process.argv[3] || './installer-config.json';

if (!productCode || !INSTALLER_CONFIGS[productCode as keyof typeof INSTALLER_CONFIGS]) {
  console.error('Usage: npx tsx scripts/export-installer-config.ts <ProductCode> [output-path]');
  console.error('');
  console.error('Available product codes:');
  for (const [code, product] of Object.entries(PRODUCTS)) {
    console.error(`  ${code}  ${product.name}`);
  }
  process.exit(1);
}

const config = INSTALLER_CONFIGS[productCode as keyof typeof INSTALLER_CONFIGS];
const innoSetup = generateInnoSetupConfig(productCode as keyof typeof INSTALLER_CONFIGS);

const output = {
  product: config.product,
  installerType: config.installerType,
  app: config.app,
  service: config.service || null,
  trayApp: config.trayApp || null,
  firewallRules: config.firewallRules,
  registryEntries: config.registryEntries,
  fileAssociations: config.fileAssociations,
  prerequisites: config.prerequisites,
  postInstallActions: config.postInstallActions,
  uninstallActions: config.uninstallActions,
  innoSetup: {
    setup: innoSetup.setup,
    registry: innoSetup.registry,
    run: innoSetup.run,
    firewall: innoSetup.firewall,
    service: innoSetup.service,
  },
};

const resolvedPath = path.resolve(outputPath);
fs.writeFileSync(resolvedPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Installer config exported: ${resolvedPath}`);
console.log(`Product: ${config.product} (${config.installerType})`);
