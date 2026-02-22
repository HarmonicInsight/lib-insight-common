using System.IO;
using System.Text.Json;

namespace InsightCommon.License;

/// <summary>
/// サードパーティライセンスキーの共通管理クラス。
/// insight-common/config/third-party-licenses.json から読み込み、
/// 環境変数によるオーバーライドにも対応。
///
/// Syncfusion は Edition ごとにライセンスキーが異なる:
///   - uiEdition: UI コントロール全般（IOSH/IOSD/INSS/IVIN が使用）
///   - documentSdk: ドキュメント処理ライブラリのみ
///   - pdfViewer: PDF 表示コンポーネント
///   - docxEditor: DOCX 編集コンポーネント
/// </summary>
public static class ThirdPartyLicenseProvider
{
    /// <summary>
    /// Syncfusion Edition 名の定数。
    /// </summary>
    public static class SyncfusionEditions
    {
        public const string UiEdition = "uiEdition";
        public const string DocumentSdk = "documentSdk";
        public const string PdfViewer = "pdfViewer";
        public const string DocxEditor = "docxEditor";
        public const string SpreadsheetEditor = "spreadsheetEditor";
    }

    /// <summary>
    /// Syncfusion Essential Studio のライセンスキーを Edition 指定で取得する。
    /// 優先順位: Edition 別環境変数 > 汎用環境変数 SYNCFUSION_LICENSE_KEY > JSON設定ファイル（editions） > JSON設定ファイル（レガシー licenseKey） > 空文字列
    /// </summary>
    /// <param name="edition">Edition 名（uiEdition / documentSdk / pdfViewer / docxEditor）。省略時は uiEdition。</param>
    /// <param name="configJsonPath">設定ファイルパスの明示指定（テスト用）。</param>
    public static string GetSyncfusionKey(string edition = "uiEdition", string? configJsonPath = null)
    {
        // 1. Edition 別環境変数が最優先
        var editionEnvVars = new Dictionary<string, string>
        {
            ["uiEdition"] = "SYNCFUSION_LICENSE_KEY_UI",
            ["documentSdk"] = "SYNCFUSION_LICENSE_KEY_DOCSDK",
            ["pdfViewer"] = "SYNCFUSION_LICENSE_KEY_PDFVIEWER",
            ["docxEditor"] = "SYNCFUSION_LICENSE_KEY_DOCXEDITOR",
            ["spreadsheetEditor"] = "SYNCFUSION_LICENSE_KEY_SPREADSHEET",
        };

        if (editionEnvVars.TryGetValue(edition, out var envName))
        {
            var envKey = Environment.GetEnvironmentVariable(envName);
            if (!string.IsNullOrEmpty(envKey))
                return envKey;
        }

        // 2. 汎用環境変数（後方互換）
        var genericEnvKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
        if (!string.IsNullOrEmpty(genericEnvKey))
            return genericEnvKey;

        // 3. JSON 設定ファイルから読み込み
        try
        {
            var path = configJsonPath ?? FindConfigPath();
            if (path != null && File.Exists(path))
            {
                var json = File.ReadAllText(path);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("syncfusion", out var sf))
                {
                    // v2: editions.<edition>.licenseKey
                    if (sf.TryGetProperty("editions", out var editions) &&
                        editions.TryGetProperty(edition, out var ed) &&
                        ed.TryGetProperty("licenseKey", out var edKey))
                    {
                        var value = edKey.GetString();
                        if (!string.IsNullOrEmpty(value))
                            return value;
                    }

                    // v1 フォールバック: syncfusion.licenseKey（レガシー）
                    if (sf.TryGetProperty("licenseKey", out var legacyKey))
                    {
                        var value = legacyKey.GetString();
                        if (!string.IsNullOrEmpty(value))
                            return value;
                    }
                }
            }
        }
        catch
        {
            // 設定ファイル読み込み失敗は非致命的
        }

        return "";
    }

    /// <summary>
    /// Syncfusion ライセンスを登録する。全製品の起動時に呼び出す。
    /// </summary>
    /// <param name="edition">Edition 名。省略時は uiEdition（IOSH/IOSD/INSS/IVIN 共通）。</param>
    /// <param name="configJsonPath">設定ファイルパスの明示指定（テスト用）。</param>
    public static void RegisterSyncfusion(string edition = "uiEdition", string? configJsonPath = null)
    {
        var key = GetSyncfusionKey(edition, configJsonPath);
        if (!string.IsNullOrEmpty(key))
        {
            Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(key);
        }
    }

    /// <summary>
    /// insight-common/config/third-party-licenses.json のパスを探索する。
    /// サブモジュール構成・開発環境の両方に対応。
    /// </summary>
    private static string? FindConfigPath()
    {
        var candidates = new[]
        {
            // サブモジュールとして配置されている場合
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "insight-common", "config", "third-party-licenses.json"),
            // 開発環境 (ソリューションルートからの相対パス)
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "insight-common", "config", "third-party-licenses.json"),
            // cross-lib-insight-common 直下で開発中の場合
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "config", "third-party-licenses.json"),
        };

        foreach (var candidate in candidates)
        {
            var full = Path.GetFullPath(candidate);
            if (File.Exists(full))
                return full;
        }

        return null;
    }
}
