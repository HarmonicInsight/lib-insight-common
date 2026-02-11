/**
 * CSS変数生成スクリプト
 *
 * brand/design-system.json と brand/colors.json から
 * CSS カスタムプロパティを生成
 *
 * 使用方法:
 *   npx ts-node scripts/generate-css-variables.ts
 *
 * 出力:
 *   styles/variables.css
 */

import * as fs from 'fs';
import * as path from 'path';

// パス設定
const BRAND_DIR = path.resolve(__dirname, '../../../brand');
const OUTPUT_DIR = path.resolve(__dirname, '../styles');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'variables.css');

// JSON ファイル読み込み
function loadJson<T>(filename: string): T {
  const filepath = path.join(BRAND_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as T;
}

// カラーJSON の型
interface ColorsJson {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  neutral: Record<string, string>;
  products: Record<string, {
    primary: string;
    secondary: string;
  }>;
}

// デザインシステムJSON の型
interface DesignSystemJson {
  typography: {
    fontFamily: {
      sans: string[];
      mono: string[];
    };
    fontSize: Record<string, { size: string; lineHeight: string }>;
    fontWeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
  breakpoints: Record<string, string>;
  zIndex: Record<string, number>;
}

// CSS 変数名に変換
function toCssVarName(prefix: string, key: string): string {
  return `--hi-${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

// ネストしたオブジェクトをフラット化
function flattenObject(obj: Record<string, any>, prefix: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const varName = toCssVarName(prefix, key);

    if (typeof value === 'string' || typeof value === 'number') {
      result[varName] = String(value);
    } else if (typeof value === 'object' && value !== null) {
      // ネストしたオブジェクト
      Object.assign(result, flattenObject(value, `${prefix}-${key}`));
    }
  }

  return result;
}

// メイン処理
function main() {
  console.log('CSS変数を生成しています...');

  // JSON 読み込み
  const colors = loadJson<ColorsJson>('colors.json');
  const designSystem = loadJson<DesignSystemJson>('design-system.json');

  // CSS 変数を収集
  const variables: Record<string, string> = {};

  // カラー変数
  variables['--hi-color-primary'] = colors.brand.primary;
  variables['--hi-color-secondary'] = colors.brand.secondary;
  variables['--hi-color-accent'] = colors.brand.accent;

  // セマンティックカラー
  for (const [key, value] of Object.entries(colors.semantic)) {
    variables[`--hi-color-${key}`] = value;
  }

  // ニュートラルカラー
  for (const [key, value] of Object.entries(colors.neutral)) {
    variables[`--hi-color-neutral-${key}`] = value;
  }

  // 製品カラー
  for (const [product, productColors] of Object.entries(colors.products)) {
    const productKey = product.replace(/([A-Z])/g, '-$1').toLowerCase();
    variables[`--hi-product-${productKey}-primary`] = productColors.primary;
    variables[`--hi-product-${productKey}-secondary`] = productColors.secondary;
  }

  // タイポグラフィ
  variables['--hi-font-sans'] = designSystem.typography.fontFamily.sans.join(', ');
  variables['--hi-font-mono'] = designSystem.typography.fontFamily.mono.join(', ');

  for (const [key, value] of Object.entries(designSystem.typography.fontSize)) {
    variables[`--hi-font-size-${key}`] = value.size;
    variables[`--hi-line-height-${key}`] = value.lineHeight;
  }

  for (const [key, value] of Object.entries(designSystem.typography.fontWeight)) {
    variables[`--hi-font-weight-${key}`] = String(value);
  }

  // スペーシング
  for (const [key, value] of Object.entries(designSystem.spacing)) {
    variables[`--hi-spacing-${key}`] = value;
  }

  // 角丸
  for (const [key, value] of Object.entries(designSystem.borderRadius)) {
    variables[`--hi-radius-${key}`] = value;
  }

  // シャドウ
  for (const [key, value] of Object.entries(designSystem.shadows)) {
    variables[`--hi-shadow-${key}`] = value;
  }

  // アニメーション
  for (const [key, value] of Object.entries(designSystem.animation.duration)) {
    variables[`--hi-duration-${key}`] = value;
  }
  for (const [key, value] of Object.entries(designSystem.animation.easing)) {
    variables[`--hi-easing-${key}`] = value;
  }

  // ブレークポイント
  for (const [key, value] of Object.entries(designSystem.breakpoints)) {
    variables[`--hi-breakpoint-${key}`] = value;
  }

  // z-index
  for (const [key, value] of Object.entries(designSystem.zIndex)) {
    variables[`--hi-z-${key}`] = String(value);
  }

  // CSS ファイル生成
  const cssContent = `/**
 * HARMONIC insight CSS Variables
 *
 * このファイルは自動生成されています。直接編集しないでください。
 * 生成元: brand/colors.json, brand/design-system.json
 * 生成日: ${new Date().toISOString()}
 */

:root {
${Object.entries(variables)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}

/* ダークモード */
@media (prefers-color-scheme: dark) {
  :root {
    --hi-nav-bg: #0a0a0a;
    --hi-nav-text: #ffffff;
    --hi-nav-text-muted: #a0a0a0;
    --hi-nav-border: #333333;
    --hi-footer-bg: #0a0a0a;
    --hi-footer-text: #ffffff;
    --hi-footer-text-muted: #a0a0a0;
    --hi-footer-border: #333333;
  }
}

/* ダークモードクラス（手動切り替え用） */
.dark {
  --hi-nav-bg: #0a0a0a;
  --hi-nav-text: #ffffff;
  --hi-nav-text-muted: #a0a0a0;
  --hi-nav-border: #333333;
  --hi-footer-bg: #0a0a0a;
  --hi-footer-text: #ffffff;
  --hi-footer-text-muted: #a0a0a0;
  --hi-footer-border: #333333;
}
`;

  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ファイル書き込み
  fs.writeFileSync(OUTPUT_FILE, cssContent, 'utf-8');

  console.log(`✅ CSS変数を生成しました: ${OUTPUT_FILE}`);
  console.log(`   変数数: ${Object.keys(variables).length}`);
}

// 実行
main();
