# Syncfusion Community License — セットアップガイド

> **対象**: HARMONIC insight 全開発者（INSS / IOSH / IOSD で Syncfusion を使用）
> **最終更新**: 2026-02-20

---

## 概要

HARMONIC insight の InsightOffice 系製品（INSS / IOSH / IOSD）は、Syncfusion Essential Studio の WPF コンポーネントを使用しています。Syncfusion Community License を取得することで、**無償**で全コンポーネントを利用できます。

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

3. **ライセンスキー生成**
   - ダッシュボード → 「Downloads & Keys」→「Get License Key」
   - プラットフォーム: **WPF** を選択
   - バージョン: 使用中のバージョンを選択
   - 生成されたキーをコピー

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

#### INSS（InsightOfficeSlide — PowerPoint）

```xml
<ItemGroup>
    <PackageReference Include="Syncfusion.Presentation.WPF" Version="*" />
    <PackageReference Include="Syncfusion.PresentationToPdfConverter.WPF" Version="*" />
    <PackageReference Include="Syncfusion.PresentationRenderer.WPF" Version="*" />
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### IOSH（InsightOfficeSheet — Excel）

```xml
<ItemGroup>
    <PackageReference Include="Syncfusion.SfSpreadsheet.WPF" Version="*" />
    <PackageReference Include="Syncfusion.XlsIO.WPF" Version="*" />
    <PackageReference Include="Syncfusion.Licensing" Version="*" />
</ItemGroup>
```

#### IOSD（InsightOfficeDoc — Word）

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
1. 環境変数 SYNCFUSION_LICENSE_KEY（最優先）
2. config/third-party-licenses.json（共通管理）
3. ハードコードフォールバック（開発用のみ）
```

### config/third-party-licenses.json の更新

新しい Community License キーを取得したら、insight-common の JSON を更新します:

```json
{
  "syncfusion": {
    "licenseKey": "取得したキーをここに貼り付け",
    "type": "community",
    "issuedDate": "2026-02-20",
    "expiresDate": "2027-02-20"
  }
}
```

> **重要**: このファイルを更新するだけで INSS / IOSH / IOSD 全製品に反映されます。

### ThirdPartyLicenses.cs（各アプリ側）

```csharp
using System.IO;
using System.Text.Json;

public static class ThirdPartyLicenses
{
    public static string? GetSyncfusionKey()
    {
        // insight-common/config/third-party-licenses.json から読み込み
        var jsonPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "insight-common", "config", "third-party-licenses.json");

        if (!File.Exists(jsonPath)) return null;

        var json = File.ReadAllText(jsonPath);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("syncfusion")
            .GetProperty("licenseKey")
            .GetString();
    }
}
```

### App.xaml.cs での登録

```csharp
protected override void OnStartup(StartupEventArgs e)
{
    base.OnStartup(e);

    // Syncfusion ライセンス登録（優先順位: 環境変数 > JSON > フォールバック）
    var licenseKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
    if (string.IsNullOrEmpty(licenseKey))
        licenseKey = ThirdPartyLicenses.GetSyncfusionKey();
    if (!string.IsNullOrEmpty(licenseKey))
        Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(licenseKey);

    // ... 他の初期化処理
}
```

---

## 5. ライセンスキーの更新手順

Community License キーの有効期限が切れた場合:

1. Syncfusion ダッシュボードにログイン
2. 「Downloads & Keys」→「Get License Key」で新しいキーを生成
3. `config/third-party-licenses.json` の `licenseKey` を新しいキーに書き換え
4. `issuedDate` / `expiresDate` を更新
5. コミット & プッシュ → 全製品に自動反映

```bash
# 更新後の確認
dotnet build
# ライセンス警告が出なければ OK
```

---

## 6. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| DLL を GitHub にコミット | NuGet PackageReference で参照 |
| ライセンスキーを各アプリに直書き | `config/third-party-licenses.json` で共通管理 |
| DLL を ZIP で共有・手動コピー | `dotnet restore` で自動復元 |
| 期限切れキーを放置 | ダッシュボードで再生成して JSON 更新 |

---

## 7. トラブルシューティング

### ライセンス警告バナーが表示される

- `third-party-licenses.json` のキーが正しいか確認
- `Syncfusion.Licensing` NuGet パッケージが参照されているか確認
- `App.xaml.cs` の `OnStartup` で `RegisterLicense` が呼ばれているか確認

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

---

## 参照

- **NuGet パッケージ一覧**: `config/third-party-licenses.json` の `components` セクション
- **実装パターン**: `standards/CSHARP_WPF.md` の「サードパーティライセンス管理」セクション
- **リリースチェック**: `standards/RELEASE_CHECKLIST.md`（Syncfusion キーのハードコード検出）
- **Syncfusion 公式ドキュメント**: https://help.syncfusion.com/
- **Community License FAQ**: https://www.syncfusion.com/products/communitylicense
