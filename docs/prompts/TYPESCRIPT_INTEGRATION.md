# TypeScript 製品 insight-common 統合プロンプト

対象: SalesInsight, InterviewInsight (Tauri + React + TypeScript)

---

## このプロンプトをコピーして対象リポジトリの Claude Code で実行してください

```
以下の手順で insight-common を統合してください。

## 製品情報
- 製品コード: SALES (または INTV)
- 技術スタック: Tauri + React + TypeScript

## 実行手順

### 1. Submodule 追加
git submodule add https://github.com/HarmonicInsight/insight-common.git

### 2. tsconfig.json にパスエイリアス追加
compilerOptions.paths に以下を追加:
{
  "@insight/license": ["./insight-common/license/typescript"],
  "@insight/license/*": ["./insight-common/license/typescript/*"],
  "@insight/i18n": ["./insight-common/i18n"],
  "@insight/i18n/*": ["./insight-common/i18n/*"],
  "@insight/utils": ["./insight-common/utils/typescript"],
  "@insight/utils/*": ["./insight-common/utils/typescript/*"],
  "@insight/errors": ["./insight-common/errors"],
  "@insight/errors/*": ["./insight-common/errors/*"],
  "@insight/brand/*": ["./insight-common/brand/*"],
  "@insight/ui/*": ["./insight-common/ui/*"],
  "@insight/config/*": ["./insight-common/config/*"]
}
include に "insight-common/**/*" を追加

### 3. vite.config.ts にエイリアス追加
resolve.alias に以下を追加:
{
  '@insight/license': path.resolve(__dirname, './insight-common/license/typescript'),
  '@insight/i18n': path.resolve(__dirname, './insight-common/i18n'),
  '@insight/utils': path.resolve(__dirname, './insight-common/utils/typescript'),
  '@insight/errors': path.resolve(__dirname, './insight-common/errors'),
  '@insight/brand': path.resolve(__dirname, './insight-common/brand'),
  '@insight/ui': path.resolve(__dirname, './insight-common/ui'),
  '@insight/config': path.resolve(__dirname, './insight-common/config')
}

### 4. src/lib/license-manager.ts 作成
以下の機能を持つライセンスマネージャーを作成:
- LicenseValidator を使用したライセンス検証
- localStorage でのライセンスキー保存
- 機能制限チェック (hasFeature)
- シングルトンインスタンスとしてエクスポート
- PRODUCT_CODE は製品に合わせて設定

### 5. src/providers/I18nProvider.tsx 作成
以下の機能を持つ i18n プロバイダーを作成:
- @insight/i18n の t, setLocale, detectLocale を使用
- React Context でアプリ全体に提供
- useI18n フックをエクスポート
- ロケール変更時に localStorage に保存

### 6. src/components/FeatureGate.tsx 作成
以下の機能を持つコンポーネントを作成:
- ライセンスの機能制限に基づいて子要素を表示/非表示
- fallback プロパティで代替表示をサポート

### 7. App.tsx に組み込み
- licenseManager.initialize() を useEffect で呼び出し
- I18nProvider でアプリをラップ

### 8. ブランドカラー適用
- colors.json から製品カラーを読み込み
- CSS 変数または Tailwind 設定に反映

### 9. コミット
変更をコミットしてください:
git add .
git commit -m "feat: Integrate insight-common for license, i18n, and utils"
```

---

## ファイル構成（完成形）

```
{Repository}/
├── src/
│   ├── components/
│   │   └── FeatureGate.tsx      ← 新規
│   ├── lib/
│   │   └── license-manager.ts   ← 新規
│   ├── providers/
│   │   └── I18nProvider.tsx     ← 新規
│   └── App.tsx                  ← 修正
├── insight-common/              ← submodule
├── vite.config.ts               ← 修正
├── tsconfig.json                ← 修正
└── package.json
```

---

## 使用例

```typescript
// ライセンス
import { licenseManager } from '@/lib/license-manager';

if (licenseManager.isLicensed) {
  console.log(`Tier: ${licenseManager.tier}`);
}

// i18n
import { useI18n } from '@/providers/I18nProvider';

function MyComponent() {
  const { t } = useI18n();
  return <button>{t('common.save')}</button>;
}

// 機能制限
import { FeatureGate } from '@/components/FeatureGate';

<FeatureGate feature="cloudSync" fallback={<UpgradePrompt />}>
  <CloudSyncButton />
</FeatureGate>

// ユーティリティ
import { formatCurrency, formatDate } from '@insight/utils';

// エラー
import { LicenseError, toInsightError } from '@insight/errors';

// ブランド
import colors from '@insight/brand/colors.json';
```
