# 標準検証コマンド

対象プロジェクトに対して HARMONIC insight の開発標準検証を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `scripts/validate-standards.sh` を実行する
3. エラーがあれば一覧を表示し、修正案を提示する
4. 警告があれば一覧を表示する

```bash
bash ./scripts/validate-standards.sh ${ARGUMENTS:-.}
```

検証に失敗した場合は、CLAUDE.md のデザインシステム（セクション「デザインシステム: Ivory & Gold Theme」）を参照して修正案を提示してください。

## 主な検証項目

### 全プラットフォーム共通
- Gold (#B8942F) がプライマリカラーとして使用されているか
- Ivory (#FAF8F5) が背景色として使用されているか
- Blue (#2563EB) がプライマリとして使用されていないか
- InsightLicenseManager が実装されているか
- ライセンスキー形式が正しいか

### C# (WPF) 固有
- **Colors.xaml / Styles.xaml が存在するか**
- **ハードコードされた色がないか**（StaticResource を使用しているか）
  - `Background="#XXXXXX"` のような直接指定は NG
  - `Background="{StaticResource BgPrimaryBrush}"` のように StaticResource を使用する
- **Syncfusion コンポーネントの内部スタイルを不正に上書きしていないか**
  - `<syncfusion:Ribbon.Resources>` などでの手動上書きは NG
  - SfSkinManager または App.xaml でのグローバル設定を使用する
- App.xaml に Colors.xaml / Styles.xaml が登録されているか
- Syncfusion ライセンス登録が App.xaml.cs で実装されているか
- **タイトルバーコンポーネント標準**（InsightOffice 統一仕様）
  - ブランド名: `InsightOffice` 固定、15px、SemiBold、PrimaryBrush (Gold)
  - 製品名: `Sheet` / `Doc` / `Slide`、15px、Normal、TextSecondaryBrush (Gray)
  - バージョン表示: `v{MAJOR}.{MINOR}.{PATCH}` 形式、11px、TextTertiaryBrush、Margin=12
  - プランバッジ: `◀ {PLAN}` 形式、11px、PrimaryLightBrush背景
  - ライセンスボタン: `🔑 ライセンス` / `🔑 License`
  - 言語切り替えボタン: `English` / `日本語`

### WPF で検出されるエラーパターン

| パターン | 問題 | 修正方法 |
|---------|------|---------|
| `Background="#FAF8F5"` | 直接の色コード | `Background="{StaticResource BgPrimaryBrush}"` |
| `Foreground="#1C1917"` | 直接の色コード | `Foreground="{StaticResource TextPrimaryBrush}"` |
| `<SolidColorBrush Color="#B8942F"/>` | インライン定義 | Colors.xaml で `x:Key` 付きで定義 |
| `<syncfusion:Ribbon.Resources>` | 内部スタイル上書き | SfSkinManager または App.xaml で設定 |

### タイトルバーコンポーネント標準（InsightOffice 統一仕様）

| コンポーネント | 正しい形式 | NG 例 |
|--------------|-----------|-------|
| ブランド名 | `InsightOffice` (15px, SemiBold, Gold) | `Insight Office`, `InsightSheet` |
| 製品名 | `Sheet` / `Doc` / `Slide` (15px, Normal, Gray) | `InsightSheet`, `Insight Slides` |
| バージョン | `v2.1.0` (11px, Margin=12) | `2.1.0`, `ver2.1.0` |
| プランバッジ | `◀ PRO` (11px) | `PRO`, `[PRO]` |
| ライセンスボタン | `🔑 ライセンス` | `ライセンス` (アイコンなし) |

詳細は `standards/CSHARP_WPF.md` の「StaticResource ルール」および「タイトルバーコンポーネント標準」セクションを参照してください。

### Syncfusion Ribbon / BackStage 標準（InsightOffice 統一仕様）

- **Ribbon 必須属性**
  - `ShowCustomizeRibbon="False"`
  - `EnableSimplifiedLayoutMode="False"`
  - `BackStageHeader="ファイル"`
- **Ribbon に Background 属性を設定しない**
- **RibbonTab を `<syncfusion:Ribbon.Items>` でラップする**
- **`<syncfusion:Ribbon.Resources>` で内部スタイルを上書きしない**
- **Backstage に Background 属性を設定しない**
- **`<syncfusion:Backstage.Resources>` で内部スタイルを上書きしない**

### BackStage 必須コマンド

| コマンド | Header | 必須 |
|---------|--------|:----:|
| 新規作成 | `新規作成` | ✅ |
| 開く | `開く` | ✅ |
| 上書き保存 | `上書き保存` | ✅ |
| 名前を付けて保存 | `名前を付けて保存` | ✅ |
| エクスポート | 製品固有（Excel/Word/PowerPoint） | 製品による |
| 印刷 | `印刷` | ✅ |
| 閉じる | `閉じる` | ✅ |

### Ribbon/BackStage で検出されるエラーパターン

| パターン | 問題 | 修正方法 |
|---------|------|---------|
| `<syncfusion:Ribbon Background="#..."` | Ribbon に背景色 | Background 属性を削除 |
| `<syncfusion:Backstage Background="#..."` | Backstage に背景色 | Background 属性を削除 |
| `<syncfusion:Ribbon.Resources>` | Ribbon 内部スタイル上書き | 削除（SfSkinManager を使用） |
| `<syncfusion:Backstage.Resources>` | Backstage 内部スタイル上書き | 削除 |
| `<syncfusion:RibbonBackStage>` | 旧 API | `<syncfusion:Ribbon.BackStage>` を使用 |
| RibbonTab が Ribbon.Items 外 | 構造エラー | `<syncfusion:Ribbon.Items>` でラップ |

詳細は `standards/CSHARP_WPF.md` の「Syncfusion Ribbon / BackStage 標準」セクションを参照してください。
