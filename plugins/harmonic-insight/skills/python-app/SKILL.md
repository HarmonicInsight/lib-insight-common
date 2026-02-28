---
name: python-app
description: Python アプリの開発標準。.py ファイル、requirements.txt、Python GUI (Tkinter/CustomTkinter) の作業時に自動適用。カラー定義、ライセンス統合、i18n パターンを提供。
allowed-tools: Read, Grep, Glob, Bash
---

# Python 開発標準

対象製品: INSS (Insight Deck Quality Gate), INPY (InsightPy)

## プロジェクト構成（必須）

```
your-app/
├── src/
│   ├── __init__.py
│   ├── license_manager.py     # ライセンス管理
│   ├── i18n_helper.py         # 多言語対応
│   ├── decorators.py          # 共通デコレータ
│   └── main.py
├── insight-common/            # サブモジュール
└── requirements.txt
```

## カラー定義

```python
# insight-common/brand/colors.json を読み込み
import json
from pathlib import Path

COLORS_PATH = Path(__file__).parent.parent / "insight-common" / "brand" / "colors.json"

with open(COLORS_PATH) as f:
    COLORS = json.load(f)

PRIMARY = COLORS["brand"]["primary"]        # "#B8942F"
BG_PRIMARY = COLORS["background"]["primary"]  # "#FAF8F5"
```

## ライセンス検証（Python）

```python
from insight_common.license import validate_license, LicenseInfo

license_info: LicenseInfo = validate_license(
    email="user@example.com",
    key="INSS-BIZ-2601-XXXX-XXXX-XXXX"
)
```

## i18n

```python
from insight_common.i18n import get_text

label = get_text("license.activate", locale="ja")
# → "アクティベート"
```

## GUI (Tkinter / CustomTkinter)

- 背景色: `#FAF8F5` (Ivory)
- アクセント: `#B8942F` (Gold)
- フォント: "Noto Sans JP" (日本語), "Inter" (英語)
- ボタン: Gold 背景、白テキスト

## 禁止事項

- ハードコードされた色値
- 独自の認証実装
- OpenAI / Azure の使用（Claude API のみ）
- `print()` デバッグの残し（logging モジュールを使用）

## 詳細リファレンス

`insight-common/standards/PYTHON.md` に完全なガイドあり。
