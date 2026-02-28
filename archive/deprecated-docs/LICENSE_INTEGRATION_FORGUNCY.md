> **DEPRECATED**: ForguncyInsight (FORG/FGIN) has been discontinued. This document is retained for historical reference only.

# InsightForguncy ライセンス統合プロンプト

このプロンプトを InsightForguncy リポジトリで実行してライセンス機能を追加します。

---

## プロンプト

```
InsightForguncy に insight-common のライセンス管理機能を統合してください。

## 製品情報
- 製品コード: FORG
- 製品名: InsightForguncy
- フレームワーク: Tauri + React + TypeScript

## 実装タスク

### 1. Git Submodule 追加
insight-common を git submodule として追加:
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

### 2. TypeScript パス設定
tsconfig.json に以下を追加:
{
  "compilerOptions": {
    "paths": {
      "@insight/license": ["./insight-common/license/typescript/index.ts"]
    }
  }
}

### 3. ライセンスストア作成
src/stores/licenseStore.ts を作成:

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LicenseValidator,
  LicenseInfo,
  getFeatureLimits,
  FeatureLimits,
  ProductCode,
} from '@insight/license';

interface LicenseState {
  licenseKey: string | null;
  expiresAt: Date | null;
  licenseInfo: LicenseInfo | null;
  limits: FeatureLimits;
  isActivated: boolean;

  setLicense: (key: string, expiresAt?: Date) => void;
  validateLicense: () => LicenseInfo;
  clearLicense: () => void;
  checkFeature: (feature: keyof FeatureLimits) => boolean;
}

const validator = new LicenseValidator();
const PRODUCT_CODE: ProductCode = 'FORG';

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      licenseKey: null,
      expiresAt: null,
      licenseInfo: null,
      limits: getFeatureLimits(null),
      isActivated: false,

      setLicense: (key: string, expiresAt?: Date) => {
        const info = validator.validate(key, expiresAt);

        if (info.isValid && validator.isProductCovered(info, PRODUCT_CODE)) {
          set({
            licenseKey: key,
            expiresAt: expiresAt || info.expiresAt,
            licenseInfo: info,
            limits: getFeatureLimits(info.tier),
            isActivated: true,
          });
        } else {
          set({
            licenseKey: key,
            licenseInfo: info,
            isActivated: false,
          });
        }
      },

      validateLicense: () => {
        const { licenseKey, expiresAt } = get();
        if (!licenseKey) {
          return {
            isValid: false,
            product: null,
            tier: null,
            expiresAt: null,
            error: 'No license key',
          };
        }

        const info = validator.validate(licenseKey, expiresAt || undefined);
        const isValid = info.isValid && validator.isProductCovered(info, PRODUCT_CODE);

        set({
          licenseInfo: info,
          limits: getFeatureLimits(info.tier),
          isActivated: isValid,
        });

        return info;
      },

      clearLicense: () => {
        set({
          licenseKey: null,
          expiresAt: null,
          licenseInfo: null,
          limits: getFeatureLimits(null),
          isActivated: false,
        });
      },

      checkFeature: (feature: keyof FeatureLimits) => {
        const { limits, isActivated } = get();
        if (!isActivated) return false;
        const value = limits[feature];
        return typeof value === 'boolean' ? value : value > 0;
      },
    }),
    {
      name: 'insight-forguncy-license',
      partialize: (state) => ({
        licenseKey: state.licenseKey,
        expiresAt: state.expiresAt,
      }),
    }
  )
);

### 4. ライセンス入力コンポーネント作成
src/components/LicenseActivation.tsx を作成:

import React, { useState } from 'react';
import { useLicenseStore } from '../stores/licenseStore';
import { TIER_NAMES } from '@insight/license';

export function LicenseActivation() {
  const [inputKey, setInputKey] = useState('');
  const { licenseInfo, isActivated, setLicense, clearLicense } = useLicenseStore();

  const handleActivate = () => {
    if (inputKey.trim()) {
      setLicense(inputKey.trim());
    }
  };

  if (isActivated && licenseInfo) {
    return (
      <div className="license-activated">
        <div className="license-status">
          <span className="status-badge active">有効</span>
          <span className="tier">{TIER_NAMES[licenseInfo.tier!]}</span>
        </div>
        {licenseInfo.expiresAt && (
          <p className="expires">
            有効期限: {licenseInfo.expiresAt.toLocaleDateString('ja-JP')}
          </p>
        )}
        <button onClick={clearLicense} className="btn-secondary">
          ライセンスを解除
        </button>
      </div>
    );
  }

  return (
    <div className="license-activation">
      <h3>ライセンス認証</h3>
      <div className="input-group">
        <input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="INS-FORG-XXX-XXXX-XXXX-XX"
          className="license-input"
        />
        <button onClick={handleActivate} className="btn-primary">
          認証
        </button>
      </div>
      {licenseInfo && !licenseInfo.isValid && (
        <p className="error">{licenseInfo.error}</p>
      )}
    </div>
  );
}

### 5. 機能ゲートコンポーネント作成
src/components/FeatureGate.tsx を作成:

import React from 'react';
import { useLicenseStore } from '../stores/licenseStore';
import { FeatureLimits } from '@insight/license';

interface FeatureGateProps {
  feature: keyof FeatureLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const checkFeature = useLicenseStore((state) => state.checkFeature);

  if (checkFeature(feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

### 6. アプリ起動時のライセンス検証
src/App.tsx に追加:

import { useEffect } from 'react';
import { useLicenseStore } from './stores/licenseStore';

function App() {
  const validateLicense = useLicenseStore((state) => state.validateLicense);

  useEffect(() => {
    // 起動時にライセンスを検証
    validateLicense();
  }, []);

  // ... rest of app
}

### 7. Forguncy固有の機能制限
InsightForguncyでは以下の機能を制限:

- FREE: 基本的なコード生成、10プロジェクトまで
- TRIAL: 全機能利用可能（30日間評価用）
- BIZ: 無制限プロジェクト、クラウド同期
- ENT: 全機能 + 優先サポート

## 使用例

// 機能制限チェック
const { checkFeature, limits } = useLicenseStore();

if (checkFeature('cloudSync')) {
  // クラウド同期機能を有効化
}

// プロジェクト数制限チェック
if (currentProjectCount >= limits.maxFiles) {
  showUpgradePrompt();
}

// FeatureGate でUI制御
<FeatureGate
  feature="cloudSync"
  fallback={<UpgradePrompt />}
>
  <CloudSyncPanel />
</FeatureGate>
```

---

## 確認事項

- [ ] insight-common が submodule として追加されている
- [ ] TypeScript パスが正しく設定されている
- [ ] licenseStore が作成されている
- [ ] LicenseActivation コンポーネントが設定画面に組み込まれている
- [ ] 起動時にライセンス検証が実行される
- [ ] 機能制限が正しく動作する
