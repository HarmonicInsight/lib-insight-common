using System.Windows.Media;

namespace HarmonicOffice.Common.Theme;

/// <summary>
/// Insight Series 共通カラー定義 - Ivory & Gold Theme
/// </summary>
public static class InsightColors
{
    // ── ブランドカラー (Gold) ──
    public static readonly Color BrandPrimary = FromHex("#B8942F");
    public static readonly Color BrandHover   = FromHex("#8C711E");
    public static readonly Color BrandLight   = FromHex("#F0E6C8");

    // ── プラン別カラー ──
    public static readonly Color PlanFree  = FromHex("#A8A29E");
    public static readonly Color PlanTrial = FromHex("#2563EB");
    public static readonly Color PlanStd   = FromHex("#16A34A");
    public static readonly Color PlanPro   = FromHex("#B8942F");
    public static readonly Color PlanEnt   = FromHex("#7C3AED");

    // ── Ivory & Gold テーマ（標準） ──
    public static class Light
    {
        public static readonly Color Background       = FromHex("#FAF8F5");
        public static readonly Color Surface          = FromHex("#FFFFFF");
        public static readonly Color SurfaceSecondary = FromHex("#F3F0EB");
        public static readonly Color SurfaceHover     = FromHex("#EEEBE5");

        public static readonly Color TextPrimary   = FromHex("#1C1917");
        public static readonly Color TextSecondary = FromHex("#57534E");
        public static readonly Color TextTertiary  = FromHex("#A8A29E");
        public static readonly Color TextMuted     = FromHex("#D6D3D1");
        public static readonly Color TextAccent    = FromHex("#8C711E");

        public static readonly Color Border      = FromHex("#E7E2DA");
        public static readonly Color BorderLight = FromHex("#F3F0EB");

        public static readonly Color Success = FromHex("#16A34A");
        public static readonly Color Error   = FromHex("#DC2626");
        public static readonly Color Warning = FromHex("#CA8A04");
        public static readonly Color Info    = FromHex("#2563EB");
    }

    public static Color FromHex(string hex)
    {
        hex = hex.TrimStart('#');
        return hex.Length switch
        {
            6 => Color.FromRgb(
                Convert.ToByte(hex[..2], 16),
                Convert.ToByte(hex[2..4], 16),
                Convert.ToByte(hex[4..6], 16)),
            8 => Color.FromArgb(
                Convert.ToByte(hex[..2], 16),
                Convert.ToByte(hex[2..4], 16),
                Convert.ToByte(hex[4..6], 16),
                Convert.ToByte(hex[6..8], 16)),
            _ => Colors.Gray
        };
    }

    public static SolidColorBrush ToBrush(Color color) => new(color);
}
