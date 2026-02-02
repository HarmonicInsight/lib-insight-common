# InsightOfficeSheet ヘルプコンテンツ

> このフォルダには、InsightOfficeSheet のアプリ内ヘルプとして表示するドキュメントが含まれています。

---

## ファイル一覧

| ファイル | 内容 | 対象メニュー |
|---------|------|-------------|
| [QUICK_START.md](./QUICK_START.md) | クイックスタートガイド | ヘルプ → クイックスタート |
| [EXCEL_COMMANDS.md](./EXCEL_COMMANDS.md) | Excelコマンド集（関数・ショートカット・書式） | ヘルプ → Excelコマンド集 |
| [HISTORY_FILES.md](./HISTORY_FILES.md) | 履歴ファイル（.hsheet）の仕組みと注意点 | ヘルプ → 履歴ファイルについて |
| [FAQ.md](./FAQ.md) | よくある質問と回答 | ヘルプ → よくある質問 |

---

## ヘルプメニューとの対応

```
ヘルプ（F1）
  ├── クイックスタート       → QUICK_START.md
  ├── Excelコマンド集        → EXCEL_COMMANDS.md
  ├── 履歴ファイルについて   → HISTORY_FILES.md
  ├── よくある質問           → FAQ.md
  ├── ショートカットキー一覧 → QUICK_START.md#ショートカットキー一覧
  └── InsightOfficeSheetについて  → About ダイアログ（アプリ内実装）
```

---

## 実装方法

### WPF (C#) の場合

Markdown をアプリ内で表示するには、以下のいずれかの方法があります。

**方法1: WebBrowser コントロールで HTML 表示**
```csharp
// Markdig 等で Markdown → HTML 変換して表示
var html = Markdig.Markdown.ToHtml(markdownContent);
webBrowser.NavigateToString(html);
```

**方法2: ビルド時に HTML 生成**
```
ビルドスクリプトで Markdown → HTML 変換し、リソースとして埋め込む
```

**方法3: 外部ブラウザで開く**
```csharp
// HTML ファイルをデフォルトブラウザで開く
Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
```

### スタイリング

HTML で表示する場合は、Ivory & Gold テーマのスタイルを適用してください。

```css
:root {
  --primary: #B8942F;
  --bg-primary: #FAF8F5;
  --bg-paper: #FFFFFF;
  --text-primary: #1C1917;
  --text-secondary: #57534E;
  --border: #E7E2DA;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Yu Gothic UI', 'Meiryo', sans-serif;
  line-height: 1.8;
}

h1, h2, h3 { color: var(--text-primary); }
a { color: var(--primary); }

table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid var(--border);
  padding: 8px 12px;
}
th {
  background-color: var(--primary);
  color: white;
}

code {
  background-color: #F3F0EB;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'MS Gothic', monospace;
}
```

---

## ターゲットユーザー

このヘルプコンテンツは **ITが得意ではない業務ユーザー** を想定しています。

- 専門用語を避け、わかりやすい日本語で記述
- 操作手順はステップバイステップで説明
- スクリーンショット風の図を文字で表現
- 具体的な使用例を多く掲載
- Excel の基本操作も合わせて掲載（Excelコマンド集）
