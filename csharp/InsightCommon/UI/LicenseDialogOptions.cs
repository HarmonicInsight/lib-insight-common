using System.Windows.Media;
using InsightCommon.License;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// ライセンスダイアログの設定
/// </summary>
public class LicenseDialogOptions
{
    /// <summary>製品コード（例: "INMV"）</summary>
    public required string ProductCode { get; set; }

    /// <summary>製品名（表示用、例: "InsightMovie"）</summary>
    public required string ProductName { get; set; }

    /// <summary>テーマモード</summary>
    public InsightThemeMode ThemeMode { get; set; } = InsightThemeMode.Light;

    /// <summary>表示する機能一覧</summary>
    public FeatureDefinition[] Features { get; set; } = [];

    /// <summary>機能マトリクス（機能キー → 許可プラン配列）</summary>
    public Dictionary<string, PlanCode[]> FeatureMatrix { get; set; } = new();

    /// <summary>ライセンスマネージャーインスタンス</summary>
    public required InsightLicenseManager LicenseManager { get; set; }

    /// <summary>プライマリボタンのカスタム色（null の場合は InsightColors.BrandPrimary を使用）</summary>
    public Color? BrandColor { get; set; }

    /// <summary>プライマリボタンのホバー色（null の場合は BrandColor を暗くした色を使用）</summary>
    public Color? BrandHoverColor { get; set; }
}
