# SalesInsight: insight-common 統合プロンプト

以下のプロンプトを SalesInsight リポジトリの Claude Code セッションで実行してください。

---

## プロンプト

```
# SalesInsight に insight-common を統合

## 概要
Insight Series の共通リソースリポジトリ (insight-common) を SalesInsight に統合してください。

## 手順

### 1. Submodule として追加
```bash
git submodule add https://github.com/HarmonicInsight/insight-common.git
git submodule update --init --recursive
```

### 2. TypeScript パス設定

tsconfig.json に追加:
```json
{
  "compilerOptions": {
    "paths": {
      "@insight/license": ["./insight-common/license/typescript/index.ts"],
      "@insight/brand": ["./insight-common/brand/colors.json"]
    }
  }
}
```

### 3. ライセンス管理の実装

`src/lib/license-manager.ts` を作成：

```typescript
import {
  LicenseValidator,
  LicenseInfo,
  ProductCode,
  getFeatureLimits,
  FeatureLimits
} from '@insight/license';

const CURRENT_PRODUCT: ProductCode = 'SALES';

class AppLicenseManager {
  private validator = new LicenseValidator();
  private licenseInfo: LicenseInfo | null = null;

  async loadLicense(): Promise<LicenseInfo> {
    const stored = localStorage.getItem('license');
    if (!stored) {
      return this.getTrialLicense();
    }

    const { key, expiresAt } = JSON.parse(stored);
    const result = this.validator.validate(key, new Date(expiresAt));

    if (result.isValid && this.validator.isProductCovered(result, CURRENT_PRODUCT)) {
      this.licenseInfo = result;
      return result;
    }

    return this.getTrialLicense();
  }

  async registerLicense(key: string, expiresAt: Date): Promise<LicenseInfo> {
    const result = this.validator.validate(key, expiresAt);

    if (!result.isValid) {
      throw new Error(result.error || 'Invalid license');
    }

    if (!this.validator.isProductCovered(result, CURRENT_PRODUCT)) {
      throw new Error('This license does not cover this product');
    }

    localStorage.setItem('license', JSON.stringify({ key, expiresAt }));
    this.licenseInfo = result;
    return result;
  }

  getFeatureLimits(): FeatureLimits {
    return getFeatureLimits(this.licenseInfo?.tier || null);
  }

  private getTrialLicense(): LicenseInfo {
    return {
      isValid: true,
      product: 'ALL',
      tier: 'TRIAL',
      expiresAt: null,
    };
  }
}

export const licenseManager = new AppLicenseManager();
```

### 4. 機能ゲートコンポーネント

`src/components/FeatureGate.tsx` を作成：

```tsx
import { licenseManager } from '@/lib/license-manager';

interface FeatureGateProps {
  feature: 'batchProcessing' | 'export' | 'cloudSync';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const limits = licenseManager.getFeatureLimits();

  if (!limits[feature]) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}
```

### 5. ブランドカラーの適用

insight-common/brand/colors.json から SalesInsight のカラーを取得:
- プライマリ: `#2563EB` (Blue)

テーマに適用:
```typescript
import colors from '@insight/brand';

export const theme = {
  primary: colors.products.salesInsight.primary,
  // ...
};
```

### 6. コミット

```bash
git add -A
git commit -m "feat: Integrate insight-common for unified license management"
git push
```

## 確認事項

- [ ] submodule が正しく追加された
- [ ] TypeScript パスが解決される
- [ ] ライセンス検証が動作する
- [ ] 機能制限が適用される
- [ ] ブランドカラーが適用される
```

---

## 補足情報

### SalesInsight の製品コード
- `SALES` (ライセンスキー: `INS-SALES-XXX-XXXX-XXXX-XX`)
- `ALL` も使用可能（全製品バンドル）

### 参照ドキュメント
- [クイックスタート](../QUICKSTART.md)
- [統合ガイド](../INTEGRATION_GUIDE.md)
- [ライセンス仕様](../../license/README.md)
