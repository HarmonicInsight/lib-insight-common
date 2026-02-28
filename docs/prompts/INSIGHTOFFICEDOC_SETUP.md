# Insight AI Briefcase (IOSD) セットアップガイド

> Word文書操作・自動化ツール「Insight AI Briefcase」の開発セットアップ手順

---

## 製品概要

| 項目 | 内容 |
|------|------|
| 製品コード | IOSD |
| 製品名 | Insight AI Briefcase |
| 説明 | Word文書操作・自動化ツール |
| プラットフォーム | Windows (WPF / C#) |
| 対応Word形式 | .docx, .doc, .rtf, .txt |

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
git clone https://github.com/HarmonicInsight/win-app-insight-doc.git
cd win-app-insight-doc
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

### 3. サードパーティライセンス（Syncfusion DocIO）

Insight AI Briefcase は **Syncfusion DocIO** および **SfRichTextBoxAdv** を使用しています。ライセンスキーは `insight-common/config/third-party-licenses.json` で全製品共通管理されています。

#### 必須 NuGet パッケージ

```xml
<ItemGroup>
    <!-- Word 文書表示・編集 UI -->
    <PackageReference Include="Syncfusion.SfRichTextBoxAdv.WPF" Version="*" />
    <!-- Word 文書バックエンド処理（読み書き・変換） -->
    <PackageReference Include="Syncfusion.DocIO.WPF" Version="*" />
    <!-- PDF変換（オプション） -->
    <PackageReference Include="Syncfusion.DocToPDFConverter.WPF" Version="*" />
    <!-- ライセンス管理（共通） -->
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### App.xaml.cs でのライセンス登録

```csharp
// App.xaml.cs の OnStartup 冒頭
// ThirdPartyLicenses.cs が JSON → 環境変数 → フォールバックの順で取得
var licenseKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
if (string.IsNullOrEmpty(licenseKey))
    licenseKey = ThirdPartyLicenses.GetSyncfusionKey();
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(licenseKey);
```

キー更新時は `insight-common/config/third-party-licenses.json` の `syncfusion.licenseKey` を書き換えるだけで IOSH/IOSD/INSS すべてに反映されます。

### 4. DocIO 基本使用パターン

#### 文書の読み込み・保存

```csharp
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.Windows.Controls.RichTextBoxAdv;

// === 文書の読み込み ===
public WordDocument LoadDocument(string filePath)
{
    using var stream = File.OpenRead(filePath);
    var document = new WordDocument(stream, FormatType.Automatic);
    return document;
}

// === 文書の保存 ===
public void SaveDocument(WordDocument document, string filePath, FormatType format = FormatType.Docx)
{
    using var stream = File.Create(filePath);
    document.Save(stream, format);
}

// === SfRichTextBoxAdv への読み込み ===
public void LoadToRichTextBox(SfRichTextBoxAdv richTextBox, string filePath)
{
    using var stream = File.OpenRead(filePath);
    richTextBox.Load(stream, FormatType.Docx);
}

// === SfRichTextBoxAdv から保存 ===
public void SaveFromRichTextBox(SfRichTextBoxAdv richTextBox, string filePath)
{
    using var stream = File.Create(filePath);
    richTextBox.Save(stream, FormatType.Docx);
}
```

#### テキスト抽出・検索・置換

```csharp
// === 全文テキスト抽出 ===
public string ExtractText(WordDocument document)
{
    return document.GetText();
}

// === 段落単位でのテキスト取得 ===
public IEnumerable<string> GetParagraphs(WordDocument document)
{
    foreach (WSection section in document.Sections)
    {
        foreach (WParagraph paragraph in section.Body.Paragraphs)
        {
            yield return paragraph.Text;
        }
    }
}

// === テキスト検索・置換 ===
public void FindAndReplace(WordDocument document, string find, string replace)
{
    document.Replace(find, replace, false, false);
}
```

#### PDF 変換

```csharp
using Syncfusion.DocToPDFConverter;
using Syncfusion.Pdf;

public void ConvertToPdf(WordDocument document, string outputPath)
{
    using var converter = new DocToPDFConverter();
    using var pdfDocument = converter.ConvertToPDF(document);
    using var stream = File.Create(outputPath);
    pdfDocument.Save(stream);
}
```

### 5. Insight ライセンス統合

```csharp
using InsightCommon.License;

// ライセンスマネージャーの初期化
var licenseManager = new InsightLicenseManager("IOSD");
```

### 6. メニュー構造

`insight-common/ui/menu-structure.json` の `insightAiBriefcase` セクションに定義されたメニューを実装してください。

#### 必須メニュー項目

**ツールメニュー:**
- Wordファイルを開く (Ctrl+O)
- 文書読取 (Ctrl+R)
- 文書書込 (Ctrl+W)
- テキスト抽出
- 検索・置換
- バッチ処理
- テンプレート
- 変更履歴 (Ctrl+H)
- PDF変換

**ヘルプメニュー:**
- クイックスタート
- Wordコマンド集
- 履歴ファイルについて
- よくある質問 (FAQ)
- ショートカットキー一覧
- Insight AI Briefcaseについて

### 7. 履歴ファイル（.iosd）

Insight AI Briefcase は変更履歴を `.iosd` ファイル（ZIP アーカイブ）として保存します。

```
元ファイル: C:\Users\data\報告書.docx
履歴ファイル: C:\Users\data\報告書.iosd
```

実装要件:
- Word ファイルと同じフォルダに、拡張子を `.iosd` に変えて保存
- ZIP 形式で manifest.json、history/、snapshots/ を格納
- 保存のたびに変更差分を記録
- 過去のバージョンへの復元機能

#### .iosd ファイル構造

```
report.iosd
├── document.docx          # 元の Word ファイル
├── metadata.json          # バージョン、作成者、最終更新日
├── history/               # バージョン履歴
├── sticky_notes.json      # 付箋データ
├── references/            # 参考資料
├── scripts/               # Python スクリプト
└── ai_chat_history.json   # AI チャット履歴
```

---

## 機能マトリクス

| 機能 | TRIAL | STD | PRO | ENT |
|------|-------|-----|-----|-----|
| Word読取 | ○ | ○ | ○ | ○ |
| Word書込 | ○ | ○ | ○ | ○ |
| テキスト抽出 | ○ | ○ | ○ | ○ |
| 検索・置換 | ○ | ○ | ○ | ○ |
| PDF変換 | ○ | ○ | ○ | ○ |
| バッチ処理 | ○ | - | ○ | ○ |
| テンプレート | ○ | - | ○ | ○ |
| AIアシスタント | ○ | ○ | ○ | ○ |
| AIコードエディター | ○ | - | ○ | ○ |
| Pythonスクリプト | ○ | - | ○ | ○ |

---

## 検証チェックリスト

- [ ] Gold (#B8942F) がプライマリカラーとして使用されている
- [ ] Ivory (#FAF8F5) が背景色として使用されている
- [ ] 青色がプライマリとして使用されていない
- [ ] Syncfusion キーが ThirdPartyLicenses 経由で登録されている
- [ ] **Syncfusion.DocIO.WPF** パッケージが追加されている
- [ ] **Syncfusion.SfRichTextBoxAdv.WPF** パッケージが追加されている
- [ ] InsightLicenseManager が "IOSD" で初期化されている
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] メニュー構造が menu-structure.json に準拠
- [ ] ヘルプメニューから各ガイドにアクセスできる
- [ ] .iosd 履歴ファイルが正しく作成される
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
- [サードパーティライセンス](../../config/third-party-licenses.json)
