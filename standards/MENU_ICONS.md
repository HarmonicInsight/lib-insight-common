# メニューアイコン標準ガイド

> **全 Insight Series 製品で統一されたメニュー・ツールバーアイコンを使用すること。**

---

## 概要

本ガイドは、Insight Business Suite 系（INSS / IOSH / IOSD / ISOF）をはじめとする全 Insight Series 製品のメニュー・ツールバー・サイドバーで使用するアイコンの標準を定義する。

### ソースオブトゥルース

| ファイル | 用途 |
|---------|------|
| `brand/menu-icons.json` | **正規定義**（JSON 形式、全カテゴリ・全アクション） |
| `config/menu-icons.ts` | TypeScript ユーティリティ（型定義・検索・バリデーション） |
| `brand/design-system.json` | アイコンスタイル（サイズ・ストローク幅） |
| `ui/menu-structure.json` | メニュー構造定義（サイドバー・ヘッダー・コンテキストメニュー） |

---

## アイコンライブラリ

**Lucide Icons** を全製品共通の標準として使用する。

- **公式サイト**: https://lucide.dev/icons
- **スタイル**: Outline（アウトライン）
- **ストローク幅**: 1.5
- **ライセンス**: ISC License（MIT 互換、商用利用可）

### 絶対禁止

```
❌ Material Design Icons を使用
❌ Font Awesome を使用
❌ 独自 SVG アイコンをメニューに使用（特別な理由がない限り）
❌ brand/menu-icons.json に未定義のアイコンをメニューに使用
❌ 同じ機能に製品ごとに異なるアイコンを使用
```

### 推奨

```
✅ brand/menu-icons.json の定義に従う
✅ config/menu-icons.ts の getMenuIcon() でアイコン名を参照
✅ 新しいメニュー項目を追加する場合は、まず brand/menu-icons.json に登録
✅ Lucide Icons 公式サイトで検索して適切なアイコンを選定
```

---

## アイコンサイズ

| サイズ | ピクセル | 用途 |
|--------|:-------:|------|
| **sm** | 16px | インラインテキスト、ボタン内テキストの横 |
| **md** | 20px | サイドバーナビゲーション |
| **lg** | 24px | ツールバーアクション、メニュー項目 |
| **xl** | 32px | 空状態イラスト、ヒーローセクション |

### メニュー項目での推奨サイズ

| 配置場所 | サイズ |
|---------|:------:|
| サイドバーメニュー | md (20px) |
| ツールバーボタン | lg (24px) |
| リボン / タブバー | lg (24px) |
| コンテキストメニュー | md (20px) |
| ステータスバー | sm (16px) |
| タブアイコン | md (20px) |

---

## カテゴリ別アイコン一覧

### ファイル操作

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `new` | `FilePlus` | 新規作成 | New | 全製品 |
| `open` | `FolderOpen` | 開く | Open | 全製品 |
| `save` | `Save` | 保存 | Save | 全製品 |
| `save_as` | `SaveAll` | 名前を付けて保存 | Save As | 全製品 |
| `import` | `FileInput` | インポート | Import | INSS/IOSH/IOSD/ISOF |
| `export` | `FileOutput` | エクスポート | Export | 全製品 |
| `export_pdf` | `FileText` | PDF出力 | Export PDF | INSS/IOSH/IOSD/ISOF |
| `print` | `Printer` | 印刷 | Print | INSS/IOSH/IOSD/ISOF |
| `close` | `X` | 閉じる | Close | 全製品 |
| `quit` | `LogOut` | 終了 | Quit | 全製品 |
| `recent` | `Clock` | 最近使用 | Recent | 全製品 |
| `file_info` | `FileSearch` | ファイル情報 | File Info | INSS/IOSH/IOSD |

### 編集操作

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `undo` | `Undo2` | 元に戻す | Undo | 全製品 |
| `redo` | `Redo2` | やり直す | Redo | 全製品 |
| `cut` | `Scissors` | 切り取り | Cut | INSS/IOSH/IOSD/ISOF |
| `copy` | `Copy` | コピー | Copy | 全製品 |
| `paste` | `ClipboardPaste` | 貼り付け | Paste | INSS/IOSH/IOSD/ISOF |
| `select_all` | `CheckSquare` | すべて選択 | Select All | INSS/IOSH/IOSD/ISOF |
| `find` | `Search` | 検索 | Find | 全製品 |
| `find_replace` | `Replace` | 検索と置換 | Find & Replace | INSS/IOSH/IOSD |
| `edit_item` | `Pencil` | 編集 | Edit | 全製品 |
| `delete` | `Trash2` | 削除 | Delete | 全製品 |
| `duplicate` | `CopyPlus` | 複製 | Duplicate | 全製品 |
| `rename` | `PencilLine` | 名前を変更 | Rename | 全製品 |

### 表示操作

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `zoom_in` | `ZoomIn` | 拡大 | Zoom In | INSS/IOSH/IOSD/ISOF |
| `zoom_out` | `ZoomOut` | 縮小 | Zoom Out | INSS/IOSH/IOSD/ISOF |
| `zoom_reset` | `Maximize2` | 100%表示 | Reset Zoom | INSS/IOSH/IOSD/ISOF |
| `fullscreen` | `Maximize` | 全画面 | Fullscreen | 全製品 |
| `sidebar_toggle` | `PanelLeftClose` | サイドバー表示切替 | Toggle Sidebar | 全製品 |
| `grid_view` | `LayoutGrid` | グリッド表示 | Grid View | IOSH |
| `list_view` | `List` | リスト表示 | List View | 全製品 |
| `preview` | `Eye` | プレビュー | Preview | INSS/IOSD |
| `split_view` | `Columns2` | 分割表示 | Split View | IOSH/IOSD |
| `freeze_panes` | `Lock` | ウィンドウ枠の固定 | Freeze Panes | IOSH/ISOF |

### AI・アシスタント

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `ai_assistant` | `BotMessageSquare` | AIアシスタント | AI Assistant | INSS/IOSH/IOSD/ISOF/INPY/INBT |
| `ai_code_editor` | `Code` | AIコードエディター | AI Code Editor | INSS/IOSH/IOSD/INPY/INBT |
| `voice_input` | `Mic` | 音声入力 | Voice Input | INSS/IOSH/IOSD/ISOF |
| `voice_readout` | `Volume2` | 読み上げ | Read Aloud | ISOF |
| `vrm_avatar` | `PersonStanding` | VRMアバター | VRM Avatar | INSS/IOSH/IOSD |
| `reference_docs` | `BookMarked` | 参考資料 | Reference Docs | INSS/IOSH/IOSD |
| `doc_evaluation` | `ClipboardCheck` | ドキュメント評価 | Document Evaluation | INSS/IOSH/IOSD |
| `ai_memory` | `Brain` | AIメモリ | AI Memory | INSS/IOSH/IOSD |

### ナビゲーション

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `home` | `Home` | ホーム | Home | 全製品 |
| `dashboard` | `LayoutDashboard` | ダッシュボード | Dashboard | 全製品 |
| `projects` | `FolderOpen` | プロジェクト | Projects | 全製品 |
| `favorites` | `Star` | お気に入り | Favorites | 全製品 |
| `notifications` | `Bell` | 通知 | Notifications | 全製品 |
| `back` | `ArrowLeft` | 戻る | Back | 全製品 |
| `forward` | `ArrowRight` | 進む | Forward | 全製品 |
| `menu` | `Menu` | メニュー | Menu | 全製品 |
| `more` | `MoreHorizontal` | その他 | More | 全製品 |

### 設定・システム

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `settings` | `Settings` | 設定 | Settings | 全製品 |
| `help` | `HelpCircle` | ヘルプ | Help | 全製品 |
| `info` | `Info` | 情報 | Info | 全製品 |
| `profile` | `User` | プロフィール | Profile | 全製品 |
| `license` | `Key` | ライセンス | License | 全製品 |
| `logout` | `LogOut` | ログアウト | Logout | 全製品 |
| `appearance` | `Palette` | 外観 | Appearance | 全製品 |
| `language` | `Languages` | 言語 | Language | 全製品 |
| `updates` | `RefreshCw` | アップデート確認 | Check Updates | 全製品 |
| `advanced` | `Wrench` | 詳細設定 | Advanced | 全製品 |
| `keyboard_shortcuts` | `Keyboard` | ショートカットキー | Keyboard Shortcuts | 全製品 |

### ステータス表示

| アクション ID | アイコン名 | 日本語 | English | 対象 |
|:-------------|:----------|:------|:--------|:-----|
| `success` | `CheckCircle` | 成功 | Success | 全製品 |
| `error` | `XCircle` | エラー | Error | 全製品 |
| `warning` | `AlertTriangle` | 警告 | Warning | 全製品 |
| `info_status` | `Info` | 情報 | Info | 全製品 |
| `loading` | `Loader2` | 読み込み中 | Loading | 全製品 |

> **全カテゴリの詳細**: `brand/menu-icons.json` を参照（挿入・書式・ツール・スライド・シート・文書・コラボレーション・バージョン履歴・業務ツール・メディア・シニア向け）

---

## プラットフォーム別実装ガイド

### React / TypeScript（Tauri: INCA, IVIN）

```tsx
import { Save, FolderOpen, Undo2 } from 'lucide-react';
import { getMenuIcon } from '@/insight-common/config/menu-icons';

// 推奨: config から正規アイコン名を参照
const saveIcon = getMenuIcon('save');
// → { icon: 'Save', label: { ja: '保存', en: 'Save' }, ... }

// コンポーネントで使用
<Button>
  <Save size={24} strokeWidth={1.5} />
  {saveIcon.label.ja}
</Button>
```

### C# WPF（INSS, IOSH, IOSD, ISOF, INBT, INPY）

WPF では Lucide アイコンの SVG パスデータを XAML リソースとして管理する。

```xml
<!-- Resources/MenuIcons.xaml -->
<ResourceDictionary>
  <!-- brand/menu-icons.json と同期 -->
  <!-- アクション ID: save → Lucide: Save -->
  <PathGeometry x:Key="Icon.Save" Figures="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 ..." />
  <PathGeometry x:Key="Icon.Undo" Figures="M3 7v6h6 M21 17a9 9 0 0 0-9-9 ..." />
</ResourceDictionary>
```

```xml
<!-- 使用例 -->
<Button ToolTip="保存 (Ctrl+S)">
  <Path Data="{StaticResource Icon.Save}"
        Stroke="{StaticResource TextPrimary}"
        StrokeThickness="1.5"
        Width="24" Height="24" />
</Button>
```

> **重要**: WPF で独自のアイコンフォント（Segoe MDL2 Assets 等）を使用しないこと。Lucide の SVG パスデータに統一する。

### Python CustomTkinter（INMV, INIG）

```python
import json
from pathlib import Path

# brand/menu-icons.json を読み込み
MENU_ICONS_PATH = Path(__file__).parent.parent / "insight-common" / "brand" / "menu-icons.json"

with open(MENU_ICONS_PATH) as f:
    MENU_ICONS = json.load(f)

def get_menu_icon(action_id: str) -> dict | None:
    """アクション ID からアイコン定義を取得"""
    for category in MENU_ICONS["categories"].values():
        if action_id in category["icons"]:
            return category["icons"][action_id]
    return None

# 使用例
save_icon = get_menu_icon("save")
# → {"icon": "Save", "label": {"ja": "保存", "en": "Save"}, ...}
```

### Android Kotlin（ユーティリティアプリ）

```kotlin
// Lucide Icons は lucide-android ライブラリで提供
// https://github.com/nicholasgasior/lucide-android

import com.nicholasgasior.lucide.LucideIcons

// menu_icons.json のアイコン名に対応
val saveIcon = LucideIcons.Save
val undoIcon = LucideIcons.Undo2
```

---

## バリデーション

### 自動検証スクリプト

```bash
# メニューアイコンの標準準拠チェック
./scripts/validate-menu-icons.sh <project-directory>

# 標準検証に含めて実行
./scripts/validate-standards.sh <project-directory>
```

### TypeScript バリデーション API

```typescript
import { validateMenuIconUsage } from '@/insight-common/config/menu-icons';

const result = validateMenuIconUsage('IOSH', [
  { actionId: 'save', usedIcon: 'Save' },          // ✅ OK
  { actionId: 'save', usedIcon: 'FloppyDisk' },     // ❌ 非標準
  { actionId: 'undo', usedIcon: 'ArrowLeft' },       // ❌ Undo2 が正解
]);

// result.valid === false
// result.errors[0].message === 'Action "save": expected icon "Save" but found "FloppyDisk".'
```

---

## 新しいアイコンの追加手順

1. **Lucide Icons で検索**: https://lucide.dev/icons で適切なアイコンを選定
2. **`brand/menu-icons.json` に追加**: 該当カテゴリの `icons` にエントリを追加
3. **`config/menu-icons.ts` に追加**: JSON と同期して TypeScript 定義を更新
4. **`ui/menu-structure.json` に反映**: メニュー構造で使用する場合は更新
5. **バリデーションスクリプトで確認**: `validate-menu-icons.sh` を実行

### アイコン選定の基準

| 基準 | 説明 |
|------|------|
| **一貫性** | 同じ機能には同じアイコンを使用する |
| **認知性** | ユーザーが直感的に理解できるアイコンを選ぶ |
| **差別化** | 隣接するメニュー項目で似すぎるアイコンを避ける |
| **Lucide 公式** | Lucide Icons に存在するアイコンのみ使用する |

---

## チェックリスト

- [ ] メニュー・ツールバーのアイコンが `brand/menu-icons.json` の定義に従っている
- [ ] 独自の SVG / アイコンフォントを使用して**いない**（Lucide Icons に統一）
- [ ] アイコンサイズが用途に応じた標準サイズ（sm/md/lg/xl）に従っている
- [ ] ストローク幅が 1.5 に設定されている
- [ ] 同じ機能に対して製品間で異なるアイコンを使用して**いない**
- [ ] 新規アイコンは `brand/menu-icons.json` に登録してから使用している
- [ ] `validate-menu-icons.sh` が成功する
