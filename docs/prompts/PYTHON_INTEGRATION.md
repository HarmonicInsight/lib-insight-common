# Python 製品 insight-common 統合プロンプト

対象: InsightSlide, InsightPy (Python)

---

## このプロンプトをコピーして対象リポジトリの Claude Code で実行してください

```
以下の手順で insight-common を統合してください。

## 製品情報
- 製品コード: SLIDE (または PY)
- 技術スタック: Python

## 実行手順

### 1. Submodule 追加
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

### 2. パス設定
src/__init__.py またはエントリーポイントに以下を追加:

import sys
from pathlib import Path
insight_common_path = Path(__file__).parent.parent / 'insight-common'
sys.path.insert(0, str(insight_common_path))

### 3. src/license_manager.py 作成
以下の機能を持つライセンスマネージャーを作成:
- license.python の LicenseValidator を使用
- ~/.insight/license.json にライセンスキー保存
- 機能制限チェック (has_feature)
- シングルトンインスタンス license_manager をエクスポート
- PRODUCT_CODE は製品に合わせて設定

### 4. src/i18n_helper.py 作成
以下の機能:
- i18n から t, set_locale, detect_locale をインポート
- 初期化時に detect_locale() でロケール設定
- translate 関数と _ エイリアスをエクスポート

### 5. src/decorators.py 作成
以下のデコレータを作成:
- @require_license: ライセンス必須
- @require_feature(feature): 特定機能必須
- @require_tier(min_tier): 最低ティア必須

### 6. 既存コードに組み込み
- エントリーポイントで license_manager をインポート
- UI テキストを _() で翻訳
- 機能制限が必要な関数にデコレータ適用

### 7. コミット
変更をコミットしてください:
git add .
git commit -m "feat: Integrate insight-common for license, i18n, and utils"
```

---

## ファイル構成（完成形）

```
{Repository}/
├── src/
│   ├── __init__.py              ← 修正（パス追加）
│   ├── license_manager.py       ← 新規
│   ├── i18n_helper.py           ← 新規
│   ├── decorators.py            ← 新規
│   └── main.py                  ← 修正
├── insight-common/              ← submodule
└── requirements.txt
```

---

## コード例

### license_manager.py

```python
import json
from pathlib import Path
from typing import Optional
from license.python import LicenseValidator, get_feature_limits

PRODUCT_CODE = 'SLIDE'  # 製品に合わせて変更
LICENSE_FILE = Path.home() / '.insight' / 'license.json'

class LicenseManager:
    def __init__(self):
        self.validator = LicenseValidator()
        self.current_tier: Optional[str] = None
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
            return {'success': False, 'message': result.error_message or '無効なライセンスキーです'}
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
        return value > 0 if isinstance(value, (int, float)) else bool(value)

license_manager = LicenseManager()
```

### i18n_helper.py

```python
from i18n import t, set_locale, detect_locale

set_locale(detect_locale())

def translate(key: str, **params) -> str:
    return t(key, params)

_ = translate
```

### decorators.py

```python
from functools import wraps
from .license_manager import license_manager

def require_license(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not license_manager.is_licensed:
            raise PermissionError('ライセンスが必要です')
        return func(*args, **kwargs)
    return wrapper

def require_feature(feature: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not license_manager.has_feature(feature):
                raise PermissionError(f'{feature}機能はこのプランでは利用できません')
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
                raise PermissionError('ライセンスが必要です')
            if tier_order.index(current) < tier_order.index(min_tier):
                raise PermissionError(f'{min_tier}プラン以上が必要です')
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

---

## 使用例

```python
from src.license_manager import license_manager
from src.i18n_helper import _
from src.decorators import require_license, require_feature, require_tier
from utils.python import format_date, format_currency

# ライセンス有効化
result = license_manager.activate('INS-SLIDE-PRO-2501-1534-A7')
print(result['message'])

# 翻訳
print(_('common.save'))  # 保存
print(_('license.expires', days=30))  # 残り30日

# ユーティリティ
from datetime import datetime
print(format_date(datetime.now(), 'long', 'ja'))  # 2025年1月15日
print(format_currency(1500))  # ¥1,500

# デコレータ
@require_license
def save_project():
    pass

@require_feature('cloudSync')
def sync_to_cloud():
    pass

@require_tier('PRO')
def advanced_analysis():
    pass
```

---

## InsightSlide 特記事項

既存のライセンス形式（`PRO-xxx`, `STD-xxx`, `TRIAL-xxx`）との互換性が必要な場合、
license_manager.py の activate メソッドに以下を追加:

```python
def activate(self, license_key: str) -> dict:
    # レガシー形式のチェック
    if license_key.startswith(('PRO-', 'STD-', 'TRIAL-')):
        return self._activate_legacy(license_key)

    # 新形式
    result = self.validator.validate(license_key, PRODUCT_CODE)
    ...

def _activate_legacy(self, license_key: str) -> dict:
    # 既存のライセンスロジック
    ...
```
