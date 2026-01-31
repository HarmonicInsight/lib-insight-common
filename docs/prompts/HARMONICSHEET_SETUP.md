# HarmonicSheet (HMSH) セットアップガイド

> Excel操作・自動化ツール「HarmonicSheet」の開発セットアップ手順

---

## 製品概要

| 項目 | 内容 |
|------|------|
| 製品コード | HMSH |
| 製品名 | HarmonicSheet |
| 説明 | Excel操作・自動化ツール |
| プラットフォーム | Windows (WPF / C#) |
| 対応Excel形式 | .xlsx, .xls, .xlsm, .xlsb |

---

## 前提条件

- Windows 10 / 11
- .NET 8.0 以上
- Visual Studio 2022 以上
- insight-common サブモジュール

---

## セットアップ手順

### 1. リポジトリクローン

```bash
git clone https://github.com/HarmonicInsight/app-Insight-excel.git
cd app-Insight-excel
git submodule update --init --recursive
```

### 2. デザインシステム適用

```xml
<!-- App.xaml で insight-common のリソースを読み込み -->
<ResourceDictionary Source="insight-common/csharp/themes/IvoryGold.xaml"/>
```

必須カラー:
- Primary (Gold): `#B8942F`
- Background (Ivory): `#FAF8F5`
- **Blue (#2563EB) を使用してはいけません**

### 3. ライセンス統合

```csharp
using InsightCommon.License;

// ライセンスマネージャーの初期化
var licenseManager = new InsightLicenseManager("HMSH");
```

### 4. メニュー構造

`insight-common/ui/menu-structure.json` の `harmonicSheet` セクションに定義されたメニューを実装してください。

#### 必須メニュー項目

**ツールメニュー:**
- Excelファイルを開く (Ctrl+O)
- シート読取 (Ctrl+R)
- シート書込 (Ctrl+W)
- 数式解析
- マクロ実行
- バッチ処理
- テンプレート
- 変更履歴 (Ctrl+H)

**ヘルプメニュー:**
- クイックスタート
- Excelコマンド集
- 履歴ファイルについて
- よくある質問 (FAQ)
- ショートカットキー一覧
- HarmonicSheetについて

### 5. ヘルプシステム

ヘルプコンテンツは `insight-common/ui/help/` に配置されています。

| ファイル | 内容 |
|---------|------|
| `QUICK_START.md` | クイックスタートガイド |
| `EXCEL_COMMANDS.md` | Excelコマンド集（関数・ショートカット） |
| `HISTORY_FILES.md` | 履歴ファイル（.hsheet）の仕組みと注意点 |
| `FAQ.md` | よくある質問 |
| `README.md` | ヘルプシステム概要 |

これらの Markdown をアプリ内のヘルプビューアで表示するか、HTML に変換してブラウザで開く形で実装してください。

### 6. 履歴ファイル（.hsheet）

HarmonicSheet は変更履歴を `.hsheet` ファイル（ZIP アーカイブ）として保存します。

```
元ファイル: C:\Users\data\売上.xlsx
履歴ファイル: C:\Users\data\売上.hsheet
```

実装要件:
- Excel ファイルと同じフォルダに、拡張子を `.hsheet` に変えて保存
- ZIP 形式で manifest.json、history/、snapshots/ を格納
- 保存のたびに変更差分を記録
- 過去のバージョンへの復元機能

---

## 機能マトリクス

| 機能 | FREE | TRIAL | STD | PRO | ENT |
|------|------|-------|-----|-----|-----|
| Excel読取 | ○ | ○ | ○ | ○ | ○ |
| Excel書込 | 3シートまで | ○ | ○ | ○ | ○ |
| 数式解析 | - | ○ | ○ | ○ | ○ |
| マクロ実行 | - | ○ | - | ○ | ○ |
| バッチ処理 | - | ○ | - | ○ | ○ |
| テンプレート | - | ○ | - | ○ | ○ |

---

## 検証チェックリスト

- [ ] Gold (#B8942F) がプライマリカラーとして使用されている
- [ ] Ivory (#FAF8F5) が背景色として使用されている
- [ ] 青色がプライマリとして使用されていない
- [ ] InsightLicenseManager が "HMSH" で初期化されている
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] メニュー構造が menu-structure.json に準拠
- [ ] ヘルプメニューから各ガイドにアクセスできる
- [ ] .hsheet 履歴ファイルが正しく作成される
- [ ] ショートカットキーが動作する
- [ ] `validate-standards.sh` が成功する

---

## 関連ドキュメント

- [C# (WPF) 開発標準](../../standards/CSHARP_WPF.md)
- [UIコンポーネントガイドライン](../../ui/components.md)
- [メニュー構造定義](../../ui/menu-structure.json)
- [ヘルプコンテンツ](../../ui/help/README.md)
- [ブランドカラー定義](../../brand/colors.json)
- [製品・機能定義](../../config/products.ts)
