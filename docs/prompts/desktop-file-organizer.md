# Desktop File Organizer - 実装プロンプト

> HARMONIC insight Windows App シリーズ

## 概要

Windows向けデスクトップ整理ツールのMVP実装。
フォルダ配下の「似たファイル」を系列ごとにまとめ、各系列のMaster(正)を決定し、他をアーカイブへ退避する。

## 技術スタック

```
┌─────────────────────────────────────────────────────────┐
│  Desktop File Organizer                                 │
├─────────────────────────────────────────────────────────┤
│  技術選定（Harmonic Factory準拠）                        │
│                                                         │
│  🟢 標準採用                                            │
│  ├── Python 3.11+        # Render標準と同じ             │
│  ├── PySide6             # クロスプラットフォームUI      │
│  ├── SQLite              # ローカルDB（Firebase不要）   │
│  └── Claude Code         # AI駆動開発                   │
│                                                         │
│  ⚪ 将来拡張時                                          │
│  ├── Claude API          # AI類似度判定                 │
│  └── Firebase Sync       # クラウド同期（必要時）        │
│                                                         │
│  ❌ 不採用                                              │
│  └── Electron/Web        # ネイティブPythonで十分       │
└─────────────────────────────────────────────────────────┘
```

## コア思想

| 原則 | 内容 |
|------|------|
| **非破壊** | "削除"はしない。`_archive/`へ退避のみ |
| **2段階実行** | Plan → Preview → Apply（いきなり移動しない）|
| **Master必須** | 各グループに必ず1つのMaster。残りはArchive対象 |
| **ローカル完結** | クラウド不要。オフラインで動作 |

---

## プロジェクト構成

```
app-win-file-organizer/
├── app.py                    # エントリーポイント
├── requirements.txt
├── README.md
│
├── ui/
│   ├── __init__.py
│   ├── main_window.py        # メインウィンドウ（3ペイン）
│   ├── file_list_widget.py   # 左ペイン：ファイル一覧
│   ├── group_list_widget.py  # 中央ペイン：グループ一覧
│   └── master_board_widget.py # 右ペイン：Master決定ボード
│
├── core/
│   ├── __init__.py
│   ├── db.py                 # SQLite操作
│   ├── scanner.py            # ファイルスキャン
│   ├── normalizer.py         # ファイル名正規化（重要）
│   ├── grouping.py           # 自動グループ化
│   ├── planner.py            # 移動計画作成
│   └── executor.py           # 計画実行
│
└── tests/
    └── test_normalizer.py    # 正規化ロジックのテスト
```

---

## UI設計（横3ペイン）

```
┌──────────────────┬──────────────────┬──────────────────┐
│ 📁 ファイル一覧   │ 📂 グループ一覧   │ 🎯 Master決定    │
│                  │                  │                  │
│ [フォルダ選択]   │ [自動再グループ化] │ ── Master ──    │
│ [検索: ______]   │                  │ (D&Dでここへ)    │
│ [拡張子: ▼]      │ ┌──────────────┐ │ ┌──────────────┐│
│                  │ │ 企画書_系列   │ │ │ 企画書_最終.pptx││
│ ┌──────────────┐ │ │  (5件)       │ │ └──────────────┘│
│ │ 企画書_v1.pptx │ │ └──────────────┘ │                  │
│ │ 企画書_v2.pptx │ │ ┌──────────────┐ │ ── Archive予定 ─│
│ │ 企画書_最終.pptx│ │ │ 報告書_系列   │ │ ┌──────────────┐│
│ │ 報告書.docx   │ │ │  (3件)       │ │ │ 企画書_v1.pptx ││
│ │ ...           │ │ └──────────────┘ │ │ 企画書_v2.pptx ││
│ └──────────────┘ │                  │ │ 企画書(1).pptx ││
│                  │ グループ内ファイル:│ └──────────────┘│
│                  │ ┌──────────────┐ │                  │
│                  │ │ 企画書_v1.pptx │ │                  │
│                  │ │ 企画書_v2.pptx │ │ [Plan作成]       │
│                  │ │ 企画書_最終... │ │ [Preview]        │
│                  │ └──────────────┘ │ [Apply]          │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## ファイル名正規化ルール（MVP）

```python
# core/normalizer.py

import re
import unicodedata

def normalize_filename(filename: str) -> str:
    """
    ファイル名を正規化して比較用キーを生成

    例:
      "企画書_v2_最終版(1).pptx" → "企画書"
      "報告書_2026-01-14_修正.docx" → "報告書"
      "Meeting Notes - Final.pptx" → "meetingnotes"
    """
    # 拡張子を除去
    name = re.sub(r'\.[^.]+$', '', filename)

    # 全角→半角、大文字→小文字
    name = unicodedata.normalize('NFKC', name).lower()

    # 日付パターンを除去
    date_patterns = [
        r'\d{4}[-_./]\d{2}[-_./]\d{2}',  # 2026-01-14, 2026/01/14
        r'\d{8}',                          # 20260114
        r'\d{4}\.\d{2}\.\d{2}',           # 2026.01.14
    ]
    for pattern in date_patterns:
        name = re.sub(pattern, '', name)

    # バージョン・コピー表記を除去
    version_patterns = [
        r'[-_\s]*(v|ver|version)[\s_-]?\d+',  # v1, ver2, version3
        r'[-_\s]*\(\d+\)',                     # (1), (2)
        r'[-_\s]*\d+$',                        # 末尾の数字
        r'[-_\s]*(copy|コピー)',               # copy, コピー
        r'[-_\s]*(final|最終|修正|提出|版|rev|revision)',
    ]
    for pattern in version_patterns:
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)

    # 記号・空白を除去
    name = re.sub(r'[-_\s.]+', '', name)

    return name.strip()
```

---

## DBスキーマ（SQLite）

```sql
-- core/db.py で管理

-- ファイル情報
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    norm_key TEXT NOT NULL,
    ext TEXT,
    size INTEGER,
    mtime REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_files_norm_key ON files(norm_key);

-- グループ（系列）
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    norm_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- グループメンバー
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    file_id INTEGER UNIQUE NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Master設定
CREATE TABLE IF NOT EXISTS masters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER UNIQUE NOT NULL,
    file_id INTEGER UNIQUE NOT NULL,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- 実行計画
CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft'  -- draft, previewed, applied
);

-- 計画明細
CREATE TABLE IF NOT EXISTS plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    from_path TEXT NOT NULL,
    to_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, success, failed
    error_message TEXT,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);
```

---

## 実行フロー

```
1. 起動
   ↓
2. フォルダ選択 → scanner.py でスキャン
   ↓
3. normalizer.py で正規化 → grouping.py で自動グループ化
   ↓
4. ユーザーがD&DでMaster決定
   ↓
5. [Plan作成] → planner.py で移動計画生成
   ↓
6. [Preview] → 移動予定一覧をダイアログ表示
   ↓
7. [Apply] → executor.py で実行
   - _archive/{group_title}/ にMaster以外を移動
   - shutil.move() 使用
   - 失敗時はエラーログ保存
   ↓
8. 再スキャン → 画面更新
```

---

## 受け入れ条件（MVP）

- [ ] `python app.py` で起動できる
- [ ] フォルダ選択 → 左ペインにファイル一覧表示
- [ ] 自動グループ化 → 中央ペインにグループ一覧表示
- [ ] グループ選択 → そのグループ内のファイル表示
- [ ] D&DでMaster決定できる
- [ ] Master決定 → 他のファイルが自動でArchive予定に入る
- [ ] Plan作成 → Preview → Apply で `_archive/` に移動
- [ ] DBに状態保存、再起動後もMaster設定維持
- [ ] requirements.txt, README.md 完備

---

## requirements.txt

```
PySide6>=6.5.0
```

---

## README.md（テンプレート）

```markdown
# Desktop File Organizer

似たファイルをグループ化し、Master（正）を決定して他をアーカイブするツール。

## セットアップ

\`\`\`bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
\`\`\`

## 使い方

1. 「フォルダ選択」でスキャン対象を選ぶ
2. 自動でグループ化される
3. 各グループからMasterをD&Dで決定
4. Plan作成 → Preview → Apply

## TODO（将来拡張）

- [ ] Claude APIで内容類似度判定
- [ ] ファイル内容のdiff表示
- [ ] 完全削除オプション（アーカイブから削除）
- [ ] クラウド同期（Firebase）
- [ ] 設定画面（正規化ルールのカスタマイズ）
```

---

## 実装開始

このMVPを作成してください。動作確認後、次の拡張をTODOとしてREADMEに追記してください。
