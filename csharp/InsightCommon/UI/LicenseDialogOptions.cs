using System.Windows.Media;
using InsightCommon.License;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繝繧､繧｢繝ｭ繧ｰ縺ｮ險ｭ螳・
/// </summary>
public class LicenseDialogOptions
{
    /// <summary>陬ｽ蜩√さ繝ｼ繝会ｼ井ｾ・ "INMV"・・/summary>
    public required string ProductCode { get; set; }

    /// <summary>陬ｽ蜩∝錐・郁｡ｨ遉ｺ逕ｨ縲∽ｾ・ "InsightCast"・・/summary>
    public required string ProductName { get; set; }

    /// <summary>繝・・繝槭Δ繝ｼ繝・/summary>
    public InsightThemeMode ThemeMode { get; set; } = InsightThemeMode.Light;

    /// <summary>陦ｨ遉ｺ險隱橸ｼ・ja" or "en"縲√ョ繝輔か繝ｫ繝・ "ja"・・/summary>
    public string Locale { get; set; } = "ja";

    /// <summary>陦ｨ遉ｺ縺吶ｋ讖溯・荳隕ｧ</summary>
    public FeatureDefinition[] Features { get; set; } = [];

    /// <summary>讖溯・繝槭ヨ繝ｪ繧ｯ繧ｹ・域ｩ溯・繧ｭ繝ｼ 竊・險ｱ蜿ｯ繝励Λ繝ｳ驟榊・・・/summary>
    public Dictionary<string, PlanCode[]> FeatureMatrix { get; set; } = new();

    /// <summary>繝ｩ繧､繧ｻ繝ｳ繧ｹ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ繧､繝ｳ繧ｹ繧ｿ繝ｳ繧ｹ</summary>
    public required InsightLicenseManager LicenseManager { get; set; }

    /// <summary>繝励Λ繧､繝槭Μ繝懊ち繝ｳ縺ｮ繧ｫ繧ｹ繧ｿ繝濶ｲ・・ull 縺ｮ蝣ｴ蜷医・ InsightColors.BrandPrimary 繧剃ｽｿ逕ｨ・・/summary>
    public Color? BrandColor { get; set; }

    /// <summary>繝励Λ繧､繝槭Μ繝懊ち繝ｳ縺ｮ繝帙ヰ繝ｼ濶ｲ・・ull 縺ｮ蝣ｴ蜷医・ BrandColor 繧呈囓縺上＠縺溯牡繧剃ｽｿ逕ｨ・・/summary>
    public Color? BrandHoverColor { get; set; }
}
