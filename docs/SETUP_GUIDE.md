# insight-common 絁E��込みガイチE

Insight Series の吁E��ポジトリに insight-common を絁E��込む手頁E��す、E

---

## 対象リポジトリ

| リポジトリ | 技術スタチE�� | 製品コーチE|
|-----------|-------------|-----------|
| InsightOfficeSlide | Python + Tkinter | `INSS` |
| InsightOfficeSheet | C# + WPF | `IOSH` |
| InsightOfficeDoc | C# + WPF | `IOSD` |
| InsightPy | Python | `INPY` |
| InsightCast | Python | `INMV` |
| InsightImageGen | Python | `INIG` |
| InsightBot | Python | `INBT` |
| InsightNoCodeAnalyzer | Tauri + React + TypeScript | `INCA` |
| InterviewInsight | Tauri + React + TypeScript | `IVIN` |

---

## TypeScript 製品E(InsightNoCodeAnalyzer, InterviewInsight)

### Step 1: Submodule 追加

```bash
# リポジトリのルートで実衁E
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

### Step 2: tsconfig.json 設宁E

`tsconfig.json` また�E `tsconfig.base.json` に追加:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
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
      "@insight/config/*": ["./insight-common/config/*"],
      "@insight/company/*": ["./insight-common/company/*"]
    }
  },
  "include": [
    "src/**/*",
    "insight-common/**/*"
  ]
}
```

### Step 3: Vite 設宁E(Tauri)

`vite.config.ts` に追加:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@insight/license': path.resolve(__dirname, './insight-common/license/typescript'),
      '@insight/i18n': path.resolve(__dirname, './insight-common/i18n'),
      '@insight/utils': path.resolve(__dirname, './insight-common/utils/typescript'),
      '@insight/errors': path.resolve(__dirname, './insight-common/errors'),
      '@insight/brand': path.resolve(__dirname, './insight-common/brand'),
      '@insight/ui': path.resolve(__dirname, './insight-common/ui'),
      '@insight/config': path.resolve(__dirname, './insight-common/config'),
      '@insight/company': path.resolve(__dirname, './insight-common/company'),
    }
  }
});
```

### Step 4: ライセンスマネージャー作�E

`src/lib/license-manager.ts`:

```typescript
import { LicenseValidator, getFeatureLimits, type LicenseTier, type FeatureLimits } from '@insight/license';

const PRODUCT_CODE = 'INCA'; // 製品に合わせて変更
const LICENSE_STORAGE_KEY = 'insight_license_key';

class LicenseManager {
  private validator: LicenseValidator;
  private currentTier: LicenseTier | null = null;
  private expiresAt: Date | null = null;

  constructor() {
    this.validator = new LicenseValidator();
  }

  async initialize(): Promise<void> {
    const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (storedKey) {
      await this.activate(storedKey);
    }
  }

  async activate(licenseKey: string): Promise<{ success: boolean; message: string }> {
    const result = this.validator.validate(licenseKey, PRODUCT_CODE);

    if (!result.isValid) {
      return { success: false, message: result.errorMessage || '無効なライセンスキーでぁE };
    }

    this.currentTier = result.tier!;
    this.expiresAt = result.expiresAt || null;
    localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);

    return { success: true, message: 'ライセンスを有効化しました' };
  }

  deactivate(): void {
    this.currentTier = null;
    this.expiresAt = null;
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  }

  get isLicensed(): boolean {
    return this.currentTier !== null;
  }

  get tier(): LicenseTier | null {
    return this.currentTier;
  }

  get limits(): FeatureLimits | null {
    return this.currentTier ? getFeatureLimits(this.currentTier) : null;
  }

  get daysRemaining(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hasFeature(feature: keyof FeatureLimits): boolean {
    if (!this.limits) return false;
    const value = this.limits[feature];
    return typeof value === 'boolean' ? value : value > 0;
  }
}

export const licenseManager = new LicenseManager();
```

### Step 5: i18n プロバイダー作�E

`src/providers/I18nProvider.tsx`:

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translate, setLocale, detectLocale, type Locale } from '@insight/i18n';

interface I18nContextType {
  locale: Locale;
  t: typeof translate;
  changeLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const changeLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, t: translate, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
```

### Step 6: 機�E制限ゲート作�E

`src/components/FeatureGate.tsx`:

```tsx
import React from 'react';
import { licenseManager } from '@/lib/license-manager';
import type { FeatureLimits } from '@insight/license';

interface FeatureGateProps {
  feature: keyof FeatureLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  if (!licenseManager.hasFeature(feature)) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
```

### Step 7: アプリケーションに絁E��込み

`src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { I18nProvider } from '@/providers/I18nProvider';
import { licenseManager } from '@/lib/license-manager';

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    licenseManager.initialize().then(() => setInitialized(true));
  }, []);

  if (!initialized) return <div>Loading...</div>;

  return (
    <I18nProvider>
      {/* アプリケーション */}
    </I18nProvider>
  );
}

export default App;
```

---

## Python 製品E(InsightOfficeSlide, InsightPy)

### Step 1: Submodule 追加

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

### Step 2: パス設宁E

`src/__init__.py` また�Eエントリーポイントに追加:

```python
import sys
from pathlib import Path

# insight-common をパスに追加
insight_common_path = Path(__file__).parent.parent / 'insight-common'
sys.path.insert(0, str(insight_common_path))
```

### Step 3: ライセンスマネージャー作�E

`src/license_manager.py`:

```python
import json
from pathlib import Path
from typing import Optional
from license.python import LicenseValidator, get_feature_limits, LicenseTier

PRODUCT_CODE = 'INSS'  # 製品に合わせて変更
LICENSE_FILE = Path.home() / '.insight' / 'license.json'

class LicenseManager:
    def __init__(self):
        self.validator = LicenseValidator()
        self.current_tier: Optional[LicenseTier] = None
        self.expires_at: Optional[str] = None
        self._load_stored_license()

    def _load_stored_license(self) -> None:
        if LICENSE_FILE.exists():
            try:
                data = json.loads(LICENSE_FILE.read_text())
                self.activate(data.get('license_key', ''))
            except Exception:
                pass

    def _save_license(self, license_key: str) -> None:
        LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
        LICENSE_FILE.write_text(json.dumps({'license_key': license_key}))

    def activate(self, license_key: str) -> dict:
        result = self.validator.validate(license_key, PRODUCT_CODE)

        if not result.is_valid:
            return {'success': False, 'message': result.error_message or '無効なライセンスキーでぁE}

        self.current_tier = result.tier
        self.expires_at = result.expires_at
        self._save_license(license_key)

        return {'success': True, 'message': 'ライセンスを有効化しました'}

    def deactivate(self) -> None:
        self.current_tier = None
        self.expires_at = None
        if LICENSE_FILE.exists():
            LICENSE_FILE.unlink()

    @property
    def is_licensed(self) -> bool:
        return self.current_tier is not None

    @property
    def tier(self) -> Optional[str]:
        return self.current_tier

    @property
    def limits(self) -> Optional[dict]:
        return get_feature_limits(self.current_tier) if self.current_tier else None

    def has_feature(self, feature: str) -> bool:
        if not self.limits:
            return False
        value = self.limits.get(feature)
        if isinstance(value, bool):
            return value
        return value > 0 if value else False


license_manager = LicenseManager()
```

### Step 4: i18n ヘルパ�E

`src/i18n_helper.py`:

```python
from i18n import t, set_locale, detect_locale

# 初期匁E
set_locale(detect_locale())

def translate(key: str, **params) -> str:
    return t(key, params)

# エイリアス
_ = translate
```

### Step 5: 機�E制限デコレータ

`src/decorators.py`:

```python
from functools import wraps
from .license_manager import license_manager

def require_license(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not license_manager.is_licensed:
            raise PermissionError('ライセンスが忁E��でぁE)
        return func(*args, **kwargs)
    return wrapper

def require_feature(feature: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not license_manager.has_feature(feature):
                raise PermissionError(f'{feature}機�Eはこ�Eプランでは利用できません')
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_tier(min_tier: str):
    tier_order = ['TRIAL', 'STD', 'PRO', 'ENT']
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current = license_manager.tier
            if not current:
                raise PermissionError('ライセンスが忁E��でぁE)
            if tier_order.index(current) < tier_order.index(min_tier):
                raise PermissionError(f'{min_tier}プラン以上が忁E��でぁE)
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

### Step 6: 使用侁E

```python
from src.license_manager import license_manager
from src.i18n_helper import _
from src.decorators import require_license, require_feature

# ライセンス有効匁E
result = license_manager.activate('INS-INSS-PRO-2501-1534-A7')
print(result['message'])

# 翻訳
print(_('common.save'))  # 保孁E

# 機�E制陁E
@require_license
def process_file(file_path):
    pass

@require_feature('cloudSync')
def sync_to_cloud():
    pass
```

---

## チE��レクトリ構�E�E�完�E形�E�E

### TypeScript 製品E

```
InsightNoCodeAnalyzer/
├── apps/
━E  └── desktop/
━E      ├── src/
━E      ━E  ├── components/
━E      ━E  ━E  └── FeatureGate.tsx
━E      ━E  ├── lib/
━E      ━E  ━E  └── license-manager.ts
━E      ━E  ├── providers/
━E      ━E  ━E  └── I18nProvider.tsx
━E      ━E  └── App.tsx
━E      ├── vite.config.ts      ↁEエイリアス設宁E
━E      └── tsconfig.json       ↁEパス設宁E
├── packages/
━E  └── ...
├── insight-common/             ↁEsubmodule
├── tsconfig.base.json          ↁE共通パス設宁E
└── package.json
```

### Python 製品E

```
InsightOfficeSlide/
├── src/
━E  ├── __init__.py             ↁEパス設宁E
━E  ├── license_manager.py
━E  ├── i18n_helper.py
━E  ├── decorators.py
━E  └── main.py
├── insight-common/             ↁEsubmodule
└── requirements.txt
```

---

## Submodule 更新

```bash
# 最新に更新
git submodule update --remote

# 特定�Eコミットに固宁E
cd insight-common
git checkout <commit-hash>
cd ..
git add insight-common
git commit -m "Update insight-common"
```

---

## トラブルシューチE��ング

### エイリアスが認識されなぁE

1. `tsconfig.json` の `baseUrl` が正しく設定されてぁE��か確誁E
2. `vite.config.ts` のパスが絶対パスになってぁE��か確誁E
3. IDE を�E起勁E

### Python でインポ�Eトエラー

1. `sys.path` に insight-common が追加されてぁE��か確誁E
2. `__init__.py` が存在するか確誁E

### Submodule が空

```bash
git submodule update --init --recursive
```
