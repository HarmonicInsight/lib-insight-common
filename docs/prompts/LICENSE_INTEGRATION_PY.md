# InsightPy ライセンス統合プロンプト

このプロンプトを InsightPy リポジトリで実行してライセンス機能を追加します。

---

## プロンプト

```
InsightPy に insight-common のライセンス管理機能を統合してください。

## 製品情報
- 製品コード: PY
- 製品名: InsightPy
- フレームワーク: Python (デスクトップアプリ)

## 実装タスク

### 1. Git Submodule 追加
insight-common を git submodule として追加:
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common

### 2. Python パス設定
プロジェクトルートに以下のシンボリックリンクまたはパス設定:

# setup.py または pyproject.toml
import sys
sys.path.insert(0, './insight-common/license/python')

# または __init__.py でパス追加
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insight-common/license/python'))

### 3. ライセンスマネージャークラス作成
src/license_manager.py を作成:

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

# insight-common からインポート
from insight_license import (
    LicenseValidator,
    LicenseInfo,
    get_feature_limits,
    FeatureLimits,
    ProductCode,
    LicenseTier,
    TIER_NAMES,
)

class LicenseManager:
    """InsightPy ライセンス管理クラス"""

    PRODUCT_CODE = ProductCode.PY
    CONFIG_FILE = "license.json"

    def __init__(self, config_dir: Optional[Path] = None):
        self.validator = LicenseValidator()
        self.config_dir = config_dir or self._get_default_config_dir()
        self.config_path = self.config_dir / self.CONFIG_FILE

        self._license_key: Optional[str] = None
        self._expires_at: Optional[datetime] = None
        self._license_info: Optional[LicenseInfo] = None
        self._limits: FeatureLimits = get_feature_limits(None)
        self._is_activated: bool = False

        self._load_license()

    def _get_default_config_dir(self) -> Path:
        """デフォルトの設定ディレクトリを取得"""
        if os.name == 'nt':  # Windows
            base = Path(os.environ.get('APPDATA', ''))
        else:  # macOS/Linux
            base = Path.home() / '.config'
        return base / 'InsightPy'

    def _load_license(self) -> None:
        """保存されたライセンス情報を読み込む"""
        if not self.config_path.exists():
            return

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self._license_key = data.get('license_key')
            expires_at_str = data.get('expires_at')
            if expires_at_str:
                self._expires_at = datetime.fromisoformat(expires_at_str)

            if self._license_key:
                self.validate()
        except Exception as e:
            print(f"ライセンス読み込みエラー: {e}")

    def _save_license(self) -> None:
        """ライセンス情報を保存"""
        self.config_dir.mkdir(parents=True, exist_ok=True)

        data = {
            'license_key': self._license_key,
            'expires_at': self._expires_at.isoformat() if self._expires_at else None,
        }

        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    def activate(self, license_key: str, expires_at: Optional[datetime] = None) -> bool:
        """
        ライセンスをアクティベート

        Args:
            license_key: ライセンスキー
            expires_at: 有効期限（オプション）

        Returns:
            アクティベーション成功時 True
        """
        info = self.validator.validate(license_key, expires_at)

        if info.is_valid and self.validator.is_product_covered(info, self.PRODUCT_CODE):
            self._license_key = license_key
            self._expires_at = expires_at or info.expires_at
            self._license_info = info
            self._limits = get_feature_limits(info.tier)
            self._is_activated = True
            self._save_license()
            return True
        else:
            self._license_info = info
            self._is_activated = False
            return False

    def validate(self) -> LicenseInfo:
        """現在のライセンスを検証"""
        if not self._license_key:
            return LicenseInfo(
                is_valid=False,
                product=None,
                tier=None,
                expires_at=None,
                error="No license key"
            )

        info = self.validator.validate(self._license_key, self._expires_at)
        is_valid = info.is_valid and self.validator.is_product_covered(info, self.PRODUCT_CODE)

        self._license_info = info
        self._limits = get_feature_limits(info.tier)
        self._is_activated = is_valid

        return info

    def deactivate(self) -> None:
        """ライセンスを解除"""
        self._license_key = None
        self._expires_at = None
        self._license_info = None
        self._limits = get_feature_limits(None)
        self._is_activated = False

        if self.config_path.exists():
            self.config_path.unlink()

    def check_feature(self, feature: str) -> bool:
        """
        機能が利用可能かチェック

        Args:
            feature: 機能名 (max_files, max_records, batch_processing, export, cloud_sync, priority)

        Returns:
            機能が利用可能な場合 True
        """
        if not self._is_activated:
            return False

        value = getattr(self._limits, feature, None)
        if value is None:
            return False

        if isinstance(value, bool):
            return value
        return value > 0

    @property
    def is_activated(self) -> bool:
        return self._is_activated

    @property
    def license_info(self) -> Optional[LicenseInfo]:
        return self._license_info

    @property
    def limits(self) -> FeatureLimits:
        return self._limits

    @property
    def tier_name(self) -> str:
        if self._license_info and self._license_info.tier:
            return TIER_NAMES.get(self._license_info.tier, "Unknown")
        return "未認証"

    @property
    def expires_at(self) -> Optional[datetime]:
        return self._expires_at

    @property
    def days_remaining(self) -> Optional[int]:
        """残り日数を取得"""
        if not self._expires_at:
            return None
        delta = self._expires_at - datetime.now()
        return max(0, delta.days)


# シングルトンインスタンス
_license_manager: Optional[LicenseManager] = None

def get_license_manager() -> LicenseManager:
    """ライセンスマネージャーのシングルトンを取得"""
    global _license_manager
    if _license_manager is None:
        _license_manager = LicenseManager()
    return _license_manager


### 4. ライセンス入力 UI (Tkinter版)
src/ui/license_dialog.py を作成:

import tkinter as tk
from tkinter import ttk, messagebox
from license_manager import get_license_manager, TIER_NAMES

class LicenseDialog(tk.Toplevel):
    """ライセンス認証ダイアログ"""

    def __init__(self, parent):
        super().__init__(parent)
        self.title("ライセンス認証")
        self.geometry("450x300")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        self.manager = get_license_manager()
        self._create_widgets()
        self._update_status()

    def _create_widgets(self):
        # ステータスフレーム
        status_frame = ttk.LabelFrame(self, text="ライセンス状態", padding=10)
        status_frame.pack(fill=tk.X, padx=10, pady=10)

        self.status_label = ttk.Label(status_frame, text="")
        self.status_label.pack(anchor=tk.W)

        self.tier_label = ttk.Label(status_frame, text="")
        self.tier_label.pack(anchor=tk.W)

        self.expires_label = ttk.Label(status_frame, text="")
        self.expires_label.pack(anchor=tk.W)

        # 入力フレーム
        input_frame = ttk.LabelFrame(self, text="ライセンスキー入力", padding=10)
        input_frame.pack(fill=tk.X, padx=10, pady=10)

        self.key_entry = ttk.Entry(input_frame, width=40)
        self.key_entry.pack(fill=tk.X, pady=5)
        self.key_entry.insert(0, "INS-PY-XXX-XXXX-XXXX-XX")
        self.key_entry.bind('<FocusIn>', lambda e: self.key_entry.select_range(0, tk.END))

        # ボタンフレーム
        btn_frame = ttk.Frame(self)
        btn_frame.pack(fill=tk.X, padx=10, pady=10)

        self.activate_btn = ttk.Button(btn_frame, text="認証", command=self._activate)
        self.activate_btn.pack(side=tk.LEFT, padx=5)

        self.deactivate_btn = ttk.Button(btn_frame, text="解除", command=self._deactivate)
        self.deactivate_btn.pack(side=tk.LEFT, padx=5)

        ttk.Button(btn_frame, text="閉じる", command=self.destroy).pack(side=tk.RIGHT, padx=5)

    def _update_status(self):
        if self.manager.is_activated:
            self.status_label.config(text="状態: ✅ 有効", foreground="green")
            self.tier_label.config(text=f"プラン: {self.manager.tier_name}")

            if self.manager.expires_at:
                days = self.manager.days_remaining
                self.expires_label.config(
                    text=f"有効期限: {self.manager.expires_at.strftime('%Y/%m/%d')} (残り{days}日)"
                )
            else:
                self.expires_label.config(text="有効期限: 無期限")

            self.deactivate_btn.config(state=tk.NORMAL)
        else:
            self.status_label.config(text="状態: ❌ 未認証", foreground="red")
            self.tier_label.config(text="プラン: -")
            self.expires_label.config(text="有効期限: -")
            self.deactivate_btn.config(state=tk.DISABLED)

            if self.manager.license_info and self.manager.license_info.error:
                self.status_label.config(
                    text=f"状態: ❌ {self.manager.license_info.error}"
                )

    def _activate(self):
        key = self.key_entry.get().strip()
        if not key:
            messagebox.showwarning("入力エラー", "ライセンスキーを入力してください")
            return

        if self.manager.activate(key):
            messagebox.showinfo("成功", "ライセンスが認証されました")
            self._update_status()
        else:
            error = self.manager.license_info.error if self.manager.license_info else "不明なエラー"
            messagebox.showerror("認証失敗", f"ライセンスの認証に失敗しました\n{error}")
            self._update_status()

    def _deactivate(self):
        if messagebox.askyesno("確認", "ライセンスを解除しますか？"):
            self.manager.deactivate()
            self._update_status()


def show_license_dialog(parent):
    """ライセンスダイアログを表示"""
    dialog = LicenseDialog(parent)
    parent.wait_window(dialog)


### 5. 機能制限デコレーター
src/utils/license_decorators.py を作成:

from functools import wraps
from license_manager import get_license_manager

def require_license(func):
    """ライセンスが必要な関数に付けるデコレーター"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        manager = get_license_manager()
        if not manager.is_activated:
            raise PermissionError("この機能を使用するにはライセンスが必要です")
        return func(*args, **kwargs)
    return wrapper


def require_feature(feature: str):
    """特定の機能が必要な関数に付けるデコレーター"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            manager = get_license_manager()
            if not manager.check_feature(feature):
                raise PermissionError(f"この機能を使用するには上位プランが必要です: {feature}")
            return func(*args, **kwargs)
        return wrapper
    return decorator


def check_limit(limit_name: str, current_count: int) -> bool:
    """制限値をチェック"""
    manager = get_license_manager()
    limit_value = getattr(manager.limits, limit_name, 0)

    if limit_value == float('inf'):
        return True

    return current_count < limit_value


### 6. アプリ起動時のライセンス検証
main.py に追加:

from license_manager import get_license_manager

def main():
    # 起動時にライセンスを検証
    manager = get_license_manager()
    info = manager.validate()

    if not manager.is_activated:
        print("⚠️ ライセンスが未認証です。機能が制限されます。")

    # アプリケーション開始
    # ...

## 使用例

from license_manager import get_license_manager
from utils.license_decorators import require_license, require_feature, check_limit

manager = get_license_manager()

# 機能制限チェック
if manager.check_feature('cloud_sync'):
    # クラウド同期機能を有効化
    pass

# デコレーターで制限
@require_license
def premium_feature():
    pass

@require_feature('export')
def export_data():
    pass

# 数量制限チェック
if check_limit('max_files', current_file_count):
    process_file()
else:
    show_upgrade_prompt()
```

---

## 確認事項

- [ ] insight-common が submodule として追加されている
- [ ] Python パスが正しく設定されている
- [ ] LicenseManager クラスが作成されている
- [ ] ライセンスダイアログが設定メニューから呼び出せる
- [ ] 起動時にライセンス検証が実行される
- [ ] 機能制限デコレーターが正しく動作する
