# Syncfusion Community License — セットアップガイド

> **対象**: HARMONIC insight 全開発者（INSS / IOSH / IOSD / IVIN で Syncfusion を使用）
> **最終更新**: 2026-02-21

---

## 概要

HARMONIC insight の Insight Business Suite 系製品（INSS / IOSH / IOSD）および IVIN は、Syncfusion Essential Studio のコンポーネントを使用しています。Syncfusion Community License を取得することで、**無償**で全コンポーネントを利用できます。

### ライセンス構成

```
PC（開発環境）
  ├ Syncfusion Essential Studio インストール
  ├ Visual Studio / dotnet CLI
  └ ライセンスキー設定（環境変数 or third-party-licenses.json）

GitHub（リポジトリ）
  └ ソースコードのみ（DLL は含めない）
      ├ .csproj に PackageReference（NuGet 参照）
      └ dotnet restore で自動復元
```

**DLL を GitHub にコミットしない理由:**
1. サイズが巨大でバージョン管理が煩雑になる
2. Syncfusion は NuGet 配布が標準（`dotnet restore` で自動取得）
3. ライセンスキーはコードで登録し、DLL 本体は各環境で取得する

### Edition とライセンスキーの関係

Syncfusion は **Edition ごとに異なるライセンスキー**を発行します。1つのキーで全 Edition をカバーするわけではありません。

| Edition | 説明 | 使用製品 |
|---------|------|---------|
| **UI Edition** | UI コントロール全般（WPF / JavaScript / React）。Document SDK を包含 | IOSH, IOSD, INSS, IVIN |
| **Document SDK** | ドキュメント処理ライブラリのみ（XlsIO / DocIO / Presentation / PDF） | — |
| **PDF Viewer** | PDF 表示・注釈コンポーネント | — |
| **DOCX Editor** | DOCX 編集コンポーネント | — |
| **Spreadsheet Editor** | スプレッドシート編集コンポーネント | — |

> 現在の HARMONIC insight 製品は全て **UI Edition** のキーを使用しています。
> 将来、Document SDK 単体で利用するケースが出た場合は、該当 Edition のキーを追加取得してください。

---

## 1. Community License の取得

### 適格条件

Syncfusion Community License は以下の条件を満たす個人・企業が無償で利用できます:

- **年間売上 100 万 USD 未満**の企業
- **開発者 5 名以下**の企業
- **個人開発者・学生**

> 詳細: https://www.syncfusion.com/products/communitylicense

### 取得手順

1. **Syncfusion アカウント作成**
   - https://www.syncfusion.com/account/register にアクセス
   - メールアドレスで登録（GitHub / Google 連携も可）

2. **Community License 申請**
   - https://www.syncfusion.com/products/communitylicense にアクセス
   - 「Claim License」をクリック
   - 適格条件を確認して申請

3. **ライセンスキー取得**
   - ダッシュボード左メニュー → 「**Claim License Key**」をクリック
   - **Essential Studio® Enterprise Edition** のキーをコピー

   > **⚠️ 「Claim License Key」と「Get License Key」は別物です！**
   >
   > | ページ | メニュー位置 | 生成されるキー | 用途 |
   > |--------|------------|---------------|------|
   > | **Claim License Key** | 左メニュー | Enterprise Edition キー | **こちらを使用** |
   > | **Get License Key** | Downloads & Keys 内 | Binary License キー（Edition 別） | 使用しない |
   >
   > 「Get License Key」（Downloads & Keys）で生成される Binary License キーは
   > Edition 別のキーであり、Community License では**無効**になります。
   > 必ず「**Claim License Key**」から取得した Enterprise Edition キーを使用してください。

---

## 2. 開発環境セットアップ

### Essential Studio インストール

1. **オフラインインストーラー（推奨）**
   - ダッシュボード → 「Downloads」→ 「Essential Studio for WPF」
   - オフラインインストーラー (.exe) をダウンロード
   - インストール実行（サンプル・テンプレートも含まれる）

2. **NuGet のみ（最小構成）**
   - インストーラー不要。プロジェクトの NuGet 参照だけで動作する
   - ただし Visual Studio テンプレートやサンプルは利用不可

### インストールで有効になるもの

| 項目 | 説明 |
|------|------|
| NuGet ソース | Syncfusion パッケージの参照（nuget.org 経由） |
| サンプルテンプレート | Visual Studio の新規プロジェクトテンプレート |
| ライセンス登録ツール | GUI でキー登録（オプション） |
| ドキュメント・デモ | オフラインリファレンス |

---

## 3. プロジェクトへの組み込み

### NuGet パッケージ参照

各製品に必要な NuGet パッケージを `.csproj` に追加します。DLL の手動コピーは不要です。

#### INSS（Insight Deck Quality Gate — PowerPoint）

```xml
<ItemGroup>
    <PackageReference Include="Syncfusion.Presentation.WPF" Version="*" />
    <PackageReference Include="Syncfusion.PresentationToPdfConverter.WPF" Version="*" />
    <PackageReference Include="Syncfusion.PresentationRenderer.WPF" Version="*" />
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### IOSH（Insight Performance Management — Excel）

```xml
<ItemGroup>
    <PackageReference Include="Syncfusion.SfSpreadsheet.WPF" Version="*" />
    <PackageReference Include="Syncfusion.XlsIO.WPF" Version="*" />
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### IOSD（Insight AI Doc Factory — Word）

```xml
<ItemGroup>
    <PackageReference Include="Syncfusion.SfRichTextBoxAdv.WPF" Version="*" />
    <PackageReference Include="Syncfusion.DocIO.WPF" Version="*" />
    <PackageReference Include="Syncfusion.DocToPDFConverter.WPF" Version="*" />
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

### パッケージ復元

```bash
# 別 PC でクローンした場合はこれだけで Syncfusion が復元される
dotnet restore
```

---

## 4. ライセンスキーの登録

### 登録の優先順位

```
1. Edition 別環境変数（例: SYNCFUSION_LICENSE_KEY_UI）（最優先）
2. 汎用環境変数 SYNCFUSION_LICENSE_KEY（後方互換）
3. config/third-party-licenses.json — editions.<edition>.licenseKey
4. config/third-party-licenses.json — syncfusion.licenseKey（v1 レガシー）
```

### config/third-party-licenses.json の構造（v2）

```json
{
  "syncfusion": {
    "editions": {
      "uiEdition": {
        "name": "Essential Studio® UI Edition",
        "licenseKey": "ここに UI Edition のキーを貼り付け",
        "envVar": "SYNCFUSION_LICENSE_KEY_UI"
      },
      "documentSdk": {
        "name": "Essential Studio® Document SDK",
        "licenseKey": "必要に応じて Document SDK のキーを貼り付け",
        "envVar": "SYNCFUSION_LICENSE_KEY_DOCSDK"
      },
      "pdfViewer": {
        "name": "Essential Studio® PDF Viewer",
        "licenseKey": "",
        "envVar": "SYNCFUSION_LICENSE_KEY_PDFVIEWER"
      },
      "docxEditor": {
        "name": "Essential Studio® DOCX Editor",
        "licenseKey": "",
        "envVar": "SYNCFUSION_LICENSE_KEY_DOCXEDITOR"
      },
      "spreadsheetEditor": {
        "name": "Essential Studio® Spreadsheet Editor",
        "licenseKey": "",
        "envVar": "SYNCFUSION_LICENSE_KEY_SPREADSHEET"
      }
    },
    "components": {
      "IOSH": { "edition": "uiEdition", ... },
      "IOSD": { "edition": "uiEdition", ... },
      "INSS": { "edition": "uiEdition", ... },
      "IVIN": { "edition": "uiEdition", ... }
    }
  }
}
```

> **重要**: Edition のキーを更新するだけで、該当 Edition を使用する全製品に反映されます。

### 製品と Edition のマッピング

| 製品 | Edition | 環境変数 |
|------|---------|---------|
| IOSH | uiEdition | `SYNCFUSION_LICENSE_KEY_UI` |
| IOSD | uiEdition | `SYNCFUSION_LICENSE_KEY_UI` |
| INSS | uiEdition | `SYNCFUSION_LICENSE_KEY_UI` |
| IVIN | uiEdition | `SYNCFUSION_LICENSE_KEY_UI` |

### ThirdPartyLicenseProvider（insight-common 共通クラス）

各アプリは `InsightCommon.License.ThirdPartyLicenseProvider` を使用します。

```csharp
using InsightCommon.License;

// Edition を指定してキーを取得
var key = ThirdPartyLicenseProvider.GetSyncfusionKey("uiEdition");

// Edition を指定してライセンス登録（推奨）
ThirdPartyLicenseProvider.RegisterSyncfusion("uiEdition");

// Edition 省略時は uiEdition がデフォルト
ThirdPartyLicenseProvider.RegisterSyncfusion();
```

### App.xaml.cs での登録

```csharp
protected override void OnStartup(StartupEventArgs e)
{
    base.OnStartup(e);

    // Syncfusion ライセンス登録（Edition 指定）
    // 優先順位: Edition 別環境変数 > 汎用環境変数 > JSON(editions) > JSON(レガシー)
    ThirdPartyLicenseProvider.RegisterSyncfusion("uiEdition");

    // ... 他の初期化処理
}
```

---

## 5. ライセンスキーの更新手順

Community License キーの有効期限が切れた場合:

1. Syncfusion ダッシュボードにログイン
2. 左メニュー → 「**Claim License Key**」をクリック
3. Enterprise Edition のキーをコピー
4. `config/third-party-licenses.json` の `editions.uiEdition.licenseKey` を書き換え
5. `issuedDate` / `expiresDate` を更新
6. コミット & プッシュ → 全製品に自動反映

```bash
# 更新後の確認
dotnet build
# ライセンス警告が出なければ OK
```

> **⚠️ 注意**: 「Downloads & Keys」→「Get License Key」ではなく、「**Claim License Key**」のキーを使用してください。

---

## 6. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| DLL を GitHub にコミット | NuGet PackageReference で参照 |
| ライセンスキーを各アプリに直書き | `config/third-party-licenses.json` で共通管理 |
| DLL を ZIP で共有・手動コピー | `dotnet restore` で自動復元 |
| 期限切れキーを放置 | ダッシュボードで再生成して JSON 更新 |
| 「Get License Key」(Binary License) を使用 | 「**Claim License Key**」(Enterprise Edition) を使用 |

---

## 7. トラブルシューティング

### 「The included Syncfusion® license key is invalid」エラー

**最も多い原因: 「Get License Key」と「Claim License Key」を間違えている**

1. **まず確認**: 使用中のキーが「**Claim License Key**」から取得したものか確認
   - ❌ 「Downloads & Keys」→「Get License Key」= Binary License キー（**無効**）
   - ✅ 左メニュー →「Claim License Key」= Enterprise Edition キー（**有効**）
2. `third-party-licenses.json` の `editions.uiEdition.licenseKey` が Claim License Key のキーか確認
3. `Syncfusion.Licensing` NuGet パッケージが参照されているか確認
4. `App.xaml.cs` の `OnStartup` で `RegisterSyncfusion` が呼ばれているか確認

### dotnet restore でパッケージが見つからない

- nuget.org がソースに含まれているか確認:
  ```bash
  dotnet nuget list source
  ```
- プロキシ環境の場合はNuGet ソースの設定を確認

### ビルドエラー: Syncfusion の型が見つからない

- `.csproj` の `PackageReference` が正しいか確認
- `dotnet restore` を再実行
- Visual Studio の場合は NuGet パッケージマネージャーで復元

### 間違ったキーを設定してしまった

- ダッシュボード左メニュー →「**Claim License Key**」でキーを再取得
- `third-party-licenses.json` の `editions.uiEdition.licenseKey` を更新

---

## 参照

- **NuGet パッケージ一覧**: `config/third-party-licenses.json` の `components` セクション
- **実装パターン**: `standards/CSHARP_WPF.md` の「サードパーティライセンス管理」セクション
- **リリースチェック**: `standards/RELEASE_CHECKLIST.md`（Syncfusion キーのハードコード検出）
- **Syncfusion 公式ドキュメント**: https://help.syncfusion.com/
- **Community License FAQ**: https://www.syncfusion.com/products/communitylicense
