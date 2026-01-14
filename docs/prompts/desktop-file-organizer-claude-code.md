# Desktop File Organizer - Claude Code実装プロンプト

あなたはWindows向けデスクトップ整理ツールの実装エンジニアです。

## 目的

フォルダ配下の「似たファイル」を系列ごとにまとめ、各系列のMaster(正)を決定し、他を`_archive/`へ退避するMVPを作成してください。

## 技術スタック

- Python 3.11+
- UI: PySide6
- DB: SQLite（ローカル完結）
- OS: Windows

## コア思想（必ず守る）

1. **非破壊**: 削除しない。`_archive/`への退避のみ
2. **2段階実行**: Plan → Preview → Apply（いきなり移動しない）
3. **Master必須**: 各グループに必ず1つのMaster。残りはArchive対象

---

## プロジェクト構成

```
app-win-file-organizer/
├── app.py                     # エントリーポイント
├── requirements.txt           # PySide6>=6.5.0
├── README.md
├── organizer.db              # SQLite（自動生成）
│
├── ui/
│   ├── __init__.py
│   ├── main_window.py        # メインウィンドウ（横3ペイン）
│   ├── file_list.py          # 左: ファイル一覧
│   ├── group_list.py         # 中央: グループ一覧
│   └── master_board.py       # 右: Master決定ボード
│
└── core/
    ├── __init__.py
    ├── db.py                 # SQLite操作
    ├── scanner.py            # ファイルスキャン
    ├── normalizer.py         # ファイル名正規化
    ├── grouping.py           # 自動グループ化
    ├── planner.py            # 移動計画作成
    └── executor.py           # 計画実行（shutil.move）
```

---

## 実装してください

### 1. core/normalizer.py

```python
import re
import unicodedata

def normalize(filename: str) -> str:
    """
    ファイル名→比較用キー

    "企画書_v2_最終版(1).pptx" → "企画書"
    "報告書_2026-01-14_修正.docx" → "報告書"
    """
    name = re.sub(r'\.[^.]+$', '', filename)  # 拡張子除去
    name = unicodedata.normalize('NFKC', name).lower()

    # 日付除去
    for p in [r'\d{4}[-_./]\d{2}[-_./]\d{2}', r'\d{8}']:
        name = re.sub(p, '', name)

    # バージョン・コピー除去
    for p in [r'[-_]*(v|ver)\d+', r'\(\d+\)', r'[-_]*\d+$',
              r'[-_]*(copy|コピー|final|最終|修正|提出|版)']:
        name = re.sub(p, '', name, flags=re.IGNORECASE)

    return re.sub(r'[-_\s.]+', '', name).strip()
```

### 2. core/db.py

SQLiteで以下のテーブルを作成:

```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE,
    name TEXT,
    norm_key TEXT,
    ext TEXT,
    size INTEGER,
    mtime REAL
);

CREATE TABLE groups (
    id INTEGER PRIMARY KEY,
    title TEXT,
    norm_key TEXT UNIQUE
);

CREATE TABLE group_members (
    group_id INTEGER,
    file_id INTEGER UNIQUE
);

CREATE TABLE masters (
    group_id INTEGER UNIQUE,
    file_id INTEGER UNIQUE,
    decided_at TIMESTAMP
);

CREATE TABLE plans (
    id INTEGER PRIMARY KEY,
    created_at TIMESTAMP,
    status TEXT DEFAULT 'draft'
);

CREATE TABLE plan_items (
    plan_id INTEGER,
    file_id INTEGER,
    from_path TEXT,
    to_path TEXT,
    status TEXT DEFAULT 'pending'
);
```

### 3. core/scanner.py

- 指定フォルダを再帰スキャン
- 対象: pptx, docx, xlsx, pdf, txt
- filesテーブルに登録（norm_keyも計算）

### 4. core/grouping.py

- norm_keyが同じファイルを同一グループに
- groupsテーブルとgroup_membersテーブルを更新

### 5. ui/main_window.py

横3ペインレイアウト:

```
┌─────────────┬─────────────┬─────────────┐
│ ファイル一覧 │ グループ一覧 │ Master決定  │
│             │             │             │
│ [フォルダ選択]│ [再グループ化]│ ─ Master ─ │
│             │             │ (D&Dで設定) │
│ ファイル...  │ グループ... │             │
│             │             │ ─ Archive ─ │
│             │ └ファイル... │ (自動で入る)│
│             │             │             │
│             │             │ [Plan作成]  │
│             │             │ [Preview]   │
│             │             │ [Apply]     │
└─────────────┴─────────────┴─────────────┘
```

### 6. D&D動作

- 中央のグループ内ファイル → 右のMasterエリアにドロップ → Master設定
- Master設定されたら、同グループの他ファイルは自動でArchive予定に入る
- Masterを変更したら、旧MasterはArchive予定へ移動

### 7. core/planner.py

Plan作成ボタン:
- Master決定済みグループのみ対象
- Master以外のファイルを `_archive/{group_title}/` に移動する計画を作成

### 8. core/executor.py

Apply実行:
```python
import os
import shutil

def execute_plan(plan_items):
    for item in plan_items:
        os.makedirs(os.path.dirname(item.to_path), exist_ok=True)
        shutil.move(item.from_path, item.to_path)
        # 成功/失敗をDBに記録
```

---

## 受け入れ条件

- [ ] `python app.py` で起動
- [ ] フォルダ選択 → ファイル一覧表示
- [ ] 自動グループ化 → グループ一覧表示
- [ ] D&DでMaster決定
- [ ] Plan → Preview → Apply で `_archive/` に移動
- [ ] 再起動後もMaster設定が維持される

---

## README.md

```markdown
# Desktop File Organizer

似たファイルをグループ化し、Masterを決定して他をアーカイブ。

## 起動

```bash
pip install -r requirements.txt
python app.py
```

## 使い方

1. フォルダ選択 → スキャン
2. 各グループからMasterをD&Dで決定
3. Plan作成 → Preview → Apply

## TODO

- [ ] AI類似度判定（Claude API）
- [ ] ファイル内容diff表示
- [ ] アーカイブから完全削除
```

---

このMVPを実装してください。
