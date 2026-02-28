using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsightCommon.Addon;

/// <summary>
/// 管理者デプロイプロファイル
///
/// コンサルタントや SIer が業務改善の一環として Insight Business Suite を導入する際、
/// 現場に応じてアドインの有効/無効やスクリプト一覧を制御する。
///
/// 配置場所: %APPDATA%/HarmonicInsight/{product}/admin-profile.json
/// このファイルが存在する場合、アプリはユーザー設定よりプロファイルを優先する。
/// </summary>
public class AdminDeployProfile
{
    /// <summary>プロファイル名</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>プロファイル説明</summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>作成者（コンサル会社名等）</summary>
    [JsonPropertyName("createdBy")]
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>作成日（ISO 8601）</summary>
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;

    /// <summary>対象製品</summary>
    [JsonPropertyName("product")]
    public string Product { get; set; } = string.Empty;

    /// <summary>強制的に有効にするモジュール（ユーザーは無効化できない）</summary>
    [JsonPropertyName("forcedEnabledModules")]
    public string[] ForcedEnabledModules { get; set; } = [];

    /// <summary>強制的に無効にするモジュール（ユーザーは有効化できない）</summary>
    [JsonPropertyName("disabledModules")]
    public string[] DisabledModules { get; set; } = [];

    /// <summary>モジュール別の設定上書き</summary>
    [JsonPropertyName("moduleSettings")]
    public Dictionary<string, Dictionary<string, object>> ModuleSettings { get; set; } = new();

    /// <summary>事前登録スクリプト</summary>
    [JsonPropertyName("preloadedScripts")]
    public PreloadedScript[] PreloadedScripts { get; set; } = [];
}

/// <summary>
/// 事前登録スクリプト（管理者が業務用スクリプトを配布）
/// </summary>
public class PreloadedScript
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("nameJa")]
    public string NameJa { get; set; } = string.Empty;

    [JsonPropertyName("descriptionJa")]
    public string DescriptionJa { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("requiredPackages")]
    public string[] RequiredPackages { get; set; } = [];

    [JsonPropertyName("confirmMessage")]
    public string? ConfirmMessage { get; set; }

    [JsonPropertyName("readOnly")]
    public bool ReadOnly { get; set; } = true;
}

/// <summary>
/// 管理者プロファイルローダー
///
/// %APPDATA% からプロファイルを読み込み、AddonManager に適用するユーティリティ。
/// </summary>
public static class AdminProfileLoader
{
    /// <summary>
    /// 管理者プロファイルを読み込む
    /// </summary>
    /// <param name="productName">製品名（例: HarmonicSheet）</param>
    /// <returns>プロファイル（存在しない場合は null）</returns>
    public static AdminDeployProfile? Load(string productName)
    {
        var path = GetProfilePath(productName);
        if (!File.Exists(path)) return null;

        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<AdminDeployProfile>(json,
                JsonOptions.CaseInsensitive);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// プロファイルの保存先パスを取得
    /// </summary>
    public static string GetProfilePath(string productName)
    {
        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", productName, "admin-profile.json");
    }

    /// <summary>
    /// プロファイルから事前登録スクリプト一覧を取得
    /// </summary>
    public static PreloadedScript[] GetPreloadedScripts(string productName)
    {
        var profile = Load(productName);
        return profile?.PreloadedScripts ?? [];
    }

    /// <summary>
    /// サンプルプロファイルを生成（管理者向けテンプレート）
    /// </summary>
    public static string GenerateSampleProfile(string productCode)
    {
        var profile = new AdminDeployProfile
        {
            Name = "Sample Profile",
            Description = "サンプル管理者プロファイル。このファイルを編集して admin-profile.json として配置してください。",
            CreatedBy = "HARMONIC insight",
            CreatedAt = DateTime.UtcNow.ToString("O"),
            Product = productCode,
            ForcedEnabledModules = ["python_runtime", "python_scripts"],
            DisabledModules = ["vrm_avatar"],
            ModuleSettings = new Dictionary<string, Dictionary<string, object>>
            {
                ["python_runtime"] = new()
                {
                    ["execution_timeout"] = 60,
                    ["auto_install_packages"] = true,
                },
            },
            PreloadedScripts =
            [
                new PreloadedScript
                {
                    Id = "sample_hello",
                    Name = "Hello World",
                    NameJa = "サンプルスクリプト",
                    DescriptionJa = "テスト用のサンプルスクリプトです",
                    Category = "サンプル",
                    Code = "print('Hello from admin profile!')",
                    RequiredPackages = [],
                    ReadOnly = true,
                },
            ],
        };

        return JsonSerializer.Serialize(profile, JsonOptions.WriteIndented);
    }
}
