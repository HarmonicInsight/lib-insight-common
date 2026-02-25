# Python 開発標準

> CLI ツール・バックエンド開発時の必須チェックリスト

## 開発開始時チェックリスト

### 1. プロジェクト構成

```
your_app/
├── insight_license/
│   ├── __init__.py
│   ├── plan_code.py          # プラン列挙型
│   ├── license_info.py       # ライセンス情報クラス
│   └── license_manager.py    # ライセンス管理
├── ui/
│   └── colors.py             # カラー定義（GUI の場合）
├── config.py                  # 設定（製品コード等）
└── main.py
```

### 2. カラー定義 (colors.py)

```python
"""Insight Series カラー定義 - Ivory & Gold Theme"""

class Colors:
    # Background (Ivory)
    BG_PRIMARY = "#FAF8F5"
    BG_SECONDARY = "#F3F0EB"
    BG_CARD = "#FFFFFF"
    BG_HOVER = "#EEEBE5"

    # Brand Primary (Gold)
    PRIMARY = "#B8942F"
    PRIMARY_HOVER = "#8C711E"
    PRIMARY_LIGHT = "#F0E6C8"

    # Semantic
    SUCCESS = "#16A34A"
    WARNING = "#CA8A04"
    ERROR = "#DC2626"
    INFO = "#2563EB"

    # Text
    TEXT_PRIMARY = "#1C1917"
    TEXT_SECONDARY = "#57534E"
    TEXT_TERTIARY = "#A8A29E"
    TEXT_ACCENT = "#8C711E"

    # Border
    BORDER = "#E7E2DA"
    BORDER_LIGHT = "#F3F0EB"

    # Category
    CAT_RPA = "#16A34A"
    CAT_LOWCODE = "#7C3AED"
    CAT_DOC = "#2563EB"

    # Plan
    PLAN_TRIAL = "#2563EB"
    PLAN_STD = "#16A34A"
    PLAN_PRO = "#B8942F"
    PLAN_ENT = "#7C3AED"
```

### 3. ライセンスマネージャー

```python
"""Insight Series ライセンスマネージャー"""
import re
import json
import hmac
import hashlib
from pathlib import Path
from enum import Enum
from datetime import datetime
from dataclasses import dataclass

class PlanCode(Enum):
    TRIAL = "TRIAL"
    STD = "STD"
    PRO = "PRO"
    ENT = "ENT"

@dataclass
class LicenseInfo:
    plan: PlanCode
    email: str
    expires_at: datetime | None
    is_valid: bool

    @classmethod
    def trial(cls) -> "LicenseInfo":
        return cls(PlanCode.TRIAL, "", None, True)

class InsightLicenseManager:
    KEY_PATTERN = re.compile(
        r"^([A-Z]{4})-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
    )

    def __init__(self, product_code: str, app_name: str):
        self.product_code = product_code
        self.storage_path = Path.home() / ".harmonic_insight" / app_name / "license.json"
        self.current_license = LicenseInfo.trial()
        self._load_license()

    @property
    def is_activated(self) -> bool:
        return (
            self.current_license.plan != PlanCode.TRIAL
            and self.current_license.is_valid
        )

    def activate(self, email: str, key: str) -> tuple[bool, str]:
        """ライセンスをアクティベート"""
        match = self.KEY_PATTERN.match(key.upper())
        if not match:
            return False, "無効なライセンスキー形式です"

        product, plan, yymm, *_ = match.groups()
        if product != self.product_code:
            return False, f"この製品({self.product_code})用のキーではありません"

        # TODO: 署名検証を追加
        # 保存処理
        self._save_license(email, key, plan, yymm)
        return True, "ライセンスが有効化されました"

    def deactivate(self) -> None:
        """ライセンスを解除"""
        self.current_license = LicenseInfo.trial()
        if self.storage_path.exists():
            self.storage_path.unlink()

    def _load_license(self) -> None:
        """保存されたライセンスを読み込み"""
        if not self.storage_path.exists():
            return
        try:
            data = json.loads(self.storage_path.read_text())
            # ライセンス復元処理
        except Exception:
            pass

    def _save_license(self, email: str, key: str, plan: str, yymm: str) -> None:
        """ライセンスを保存"""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "email": email,
            "key": key,
            "plan": plan,
            "activated_at": datetime.now().isoformat()
        }
        self.storage_path.write_text(json.dumps(data, indent=2))
```

---

## 必須チェックリスト

### デザイン（GUI アプリの場合）

- [ ] `colors.py` が Ivory & Gold テーマに準拠している
- [ ] **Primary (#B8942F)** が製品タイトル、アクセントに使用されている
- [ ] **Background (#FAF8F5)** がメイン背景に使用されている
- [ ] ハードコードされた色がない（Colors クラス経由）
- [ ] 青色 (#2563EB) がプライマリとして使用されて**いない**

### ライセンス

- [ ] `InsightLicenseManager` クラスが実装されている
- [ ] ライセンスキー形式: `{製品コード}-{プラン}-{YYMM}-XXXX-XXXX-XXXX`
- [ ] ライセンス保存先: `~/.harmonic_insight/{製品名}/license.json`
- [ ] プランコード列挙型が定義されている

### 製品コード

- [ ] 製品コードが `config/products.ts` に登録されている
- [ ] `CLAUDE.md` の製品コード一覧に追加されている

### CLI 出力（該当する場合）

- [ ] エラーメッセージは赤色 (#DC2626 相当)
- [ ] 成功メッセージは緑色 (#16A34A 相当)
- [ ] 警告メッセージは黄色 (#CA8A04 相当)

---

## Rich ライブラリ使用時のスタイル

```python
from rich.console import Console
from rich.theme import Theme

insight_theme = Theme({
    "info": "bold #2563EB",
    "success": "bold #16A34A",
    "warning": "bold #CA8A04",
    "error": "bold #DC2626",
    "primary": "bold #B8942F",
    "muted": "#A8A29E",
})

console = Console(theme=insight_theme)

# 使用例
console.print("処理が完了しました", style="success")
console.print("警告: ファイルが見つかりません", style="warning")
console.print("Insight Series", style="primary")
```

---

## Tkinter/CustomTkinter 使用時

```python
import customtkinter as ctk

# Ivory & Gold テーマ設定
ctk.set_appearance_mode("light")

class InsightTheme:
    BG_PRIMARY = "#FAF8F5"
    PRIMARY = "#B8942F"
    PRIMARY_HOVER = "#8C711E"
    TEXT_PRIMARY = "#1C1917"
    TEXT_SECONDARY = "#57534E"
    BORDER = "#E7E2DA"

# ボタン例
button = ctk.CTkButton(
    master=root,
    text="アクティベート",
    fg_color=InsightTheme.PRIMARY,
    hover_color=InsightTheme.PRIMARY_HOVER,
    text_color="#FFFFFF"
)
```

---

## 参考実装

- **InsightPy**: `app-insight-py` リポジトリ
- **InsightBot**: `app-insight-bot` リポジトリ
