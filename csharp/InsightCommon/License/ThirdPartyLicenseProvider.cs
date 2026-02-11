using System.IO;
using System.Text.Json;

namespace InsightCommon.License;

/// <summary>
/// サードパーティライセンスキーの共通管理クラス。
/// insight-common/config/third-party-licenses.json から読み込み、
/// 環境変数によるオーバーライドにも対応。
/// </summary>
public static class ThirdPartyLicenseProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Syncfusion Essential Studio のライセンスキーを取得する。
    /// 優先順位: 環境変数 SYNCFUSION_LICENSE_KEY > JSON設定ファイル > 空文字列
    /// </summary>
    public static string GetSyncfusionKey(string? configJsonPath = null)
    {
        // 1. 環境変数が最優先
        var envKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");
        if (!string.IsNullOrEmpty(envKey))
            return envKey;

        // 2. JSON 設定ファイルから読み込み
        try
        {
            var path = configJsonPath ?? FindConfigPath();
            if (path != null && File.Exists(path))
            {
                var json = File.ReadAllText(path);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("syncfusion", out var sf) &&
                    sf.TryGetProperty("licenseKey", out var key))
                {
                    var value = key.GetString();
                    if (!string.IsNullOrEmpty(value))
                        return value;
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
    public static void RegisterSyncfusion(string? configJsonPath = null)
    {
        var key = GetSyncfusionKey(configJsonPath);
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
