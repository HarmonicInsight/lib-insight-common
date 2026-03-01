# ヘルプシステム標準検証コマンド

対象プロジェクトに対して HARMONIC insight のヘルプシステム標準検証を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `scripts/validate-help.sh` を実行する
3. エラーがあれば一覧を表示し、修正案を提示する
4. 警告があれば一覧を表示する

```bash
# ヘルプシステム標準検証
bash ./scripts/validate-help.sh ${ARGUMENTS:-.}
```

検証に失敗した場合は、以下を参照して修正案を提示してください:
- **ヘルプシステム仕様**: `standards/HELP_SYSTEM.md`
- **セクション定義**: `config/help-content.ts`
- **HelpMenuItemDefinition**: `csharp/InsightCommon/UI/HelpMenuItemDefinition.cs`
- **WPF 標準**: `standards/CSHARP_WPF.md`（Ribbon ヘルプバー・? ボタン・AI パネル）

## 主な検証項目

### HelpWindow 基本構成
- HelpWindow.xaml / HelpWindow.xaml.cs が存在するか
- ウィンドウサイズが標準 (1050×740) に準拠しているか
- ShowDialog() で開かれているか（Show() は禁止）
- XAML 内にハードコード色がないか（DynamicResource 必須）

### セクション ID・必須セクション
- セクション ID が全て string 型であること（integer 禁止）
- 必須6セクション（overview, ui-layout, shortcuts, license, system-req, support）が含まれること
- AI 搭載製品は ai-assistant セクションが含まれること

### ナビゲーション・コマンド
- F1 キーバインドで HelpWindow が開くこと
- 全パネルヘッダーにコンテキストヘルプ（?）ボタンがあること
- ShowHelpSectionCommand が ViewModel に実装されていること
- static ShowSection() メソッドが HelpWindow に実装されていること

### メニュー統合
- Ribbon Home タブにヘルプバーが存在すること
- InsightWindowChrome.CreateHelpMenu() が使用されていること
- 新オーバーロード（HelpMenuItemDefinition ベース）への移行状況

## 検出されるエラーパターンと修正方法

| パターン | 問題 | 修正方法 |
|---------|------|---------|
| `case 1:` / `case 2:` | integer セクション ID | string ID に移行（`case "overview":` 等） |
| `helpWindow.Show()` | 非モーダル表示 | `helpWindow.ShowDialog()` に変更 |
| `Background="#FAF8F5"` | XAML ハードコード色 | `DynamicResource` を使用 |
| F1 未設定 | F1 でヘルプが開かない | `<KeyBinding Key="F1" ...>` を追加 |
| ShowSection() なし | ダイアログからヘルプ表示不可 | `public static void ShowSection(...)` を追加 |

## 参照

- `standards/HELP_SYSTEM.md` — ヘルプシステム全体仕様
- `config/help-content.ts` — 製品別セクション定義（ソースオブトゥルース）
- `csharp/InsightCommon/UI/HelpMenuItemDefinition.cs` — メニュー項目型定義
- `csharp/InsightCommon/UI/InsightWindowChrome.cs` — CreateHelpMenu()
- `standards/CSHARP_WPF.md` — WPF 標準（Ribbon・? ボタン・AI パネル）
