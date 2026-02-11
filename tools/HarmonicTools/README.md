# Harmonic Tools

HARMONIC insight 製品の管理ツール群（WPF / .NET 8）

## ツール一覧

| ツール | 説明 |
|-------|------|
| **HarmonicTools.AppManager** | アプリのビルド・実行・公開・テストを一元管理 |
| **HarmonicTools.LicenseManager** | ライセンスキーの発行・管理 |

## 前提条件

- Windows 10/11
- .NET 8 SDK

## ビルド

```bash
# ソリューション全体ビルド
dotnet build HarmonicTools.sln

# リリースビルド
dotnet build HarmonicTools.sln -c Release

# 個別ビルド
dotnet build src/HarmonicTools.AppManager/HarmonicTools.AppManager.csproj
dotnet build src/HarmonicTools.LicenseManager/HarmonicTools.LicenseManager.csproj
```

## 実行

```bash
dotnet run --project src/HarmonicTools.AppManager
dotnet run --project src/HarmonicTools.LicenseManager
```

## 実行可能ファイル生成（自己完結型）

```bash
dotnet publish src/HarmonicTools.AppManager -c Release -r win-x64 --self-contained
dotnet publish src/HarmonicTools.LicenseManager -c Release -r win-x64 --self-contained
```

## App Manager 機能

- 管理対象アプリの一覧表示・追加・削除
- リポジトリパスの設定
- ワンクリックでの Build (Debug/Release)、Publish、Run、Test 実行
- ソリューション全体ビルド
- 出力コンソールでコマンド結果を確認
- exe ファイルの存在確認（緑色=存在、灰色=未ビルド）
- exe フォルダをエクスプローラーで開く

## License Manager 機能

- 全 Insight 製品のライセンスキー発行
- 製品・プラン・メール・有効期限を指定して生成
- InsightLicenseManager と同一アルゴリズム（HMAC-SHA256）で検証可能
- 発行履歴の自動保存
- CSV エクスポート
- クリップボードコピー

## 設定ファイル保存先

```
%APPDATA%/HarmonicInsight/AppManager/config.json
%APPDATA%/HarmonicInsight/LicenseManager/issued-licenses.json
```
