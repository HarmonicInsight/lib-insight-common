using System.Windows.Media;

namespace InsightCommon.Theme;

/// <summary>
/// Insight Series 共通カラー定義 - Ivory & Gold Theme
/// </summary>
public static class InsightColors
{
    // ── ブランドカラー (Gold) ──
    public static readonly Color BrandPrimary = FromHex("#B8942F");  // Gold
    public static readonly Color BrandHover   = FromHex("#8C711E");  // Gold Hover
    public static readonly Color BrandLight   = FromHex("#F0E6C8");  // Gold Light

    // ── プラン別カラー ──
    public static readonly Color PlanFree  = FromHex("#A8A29E");  // Stone 400
    public static readonly Color PlanTrial = FromHex("#2563EB");  // Blue
    public static readonly Color PlanStd   = FromHex("#16A34A");  // Green
    public static readonly Color PlanPro   = FromHex("#B8942F");  // Gold
    public static readonly Color PlanEnt   = FromHex("#7C3AED");  // Purple

    // ── Ivory & Gold テーマ（標準） ──
    public static class Light
    {
        // Background (Ivory)
        public static readonly Color Background      = FromHex("#FAF8F5");  // Ivory
        public static readonly Color Surface         = FromHex("#FFFFFF");  // White
        public static readonly Color SurfaceSecondary= FromHex("#F3F0EB");  // Ivory Secondary
        public static readonly Color SurfaceHover    = FromHex("#EEEBE5");  // Ivory Hover

        // Text (Stone)
        public static readonly Color TextPrimary     = FromHex("#1C1917");  // Stone 900
        public static readonly Color TextSecondary   = FromHex("#57534E");  // Stone 600
        public static readonly Color TextTertiary    = FromHex("#A8A29E");  // Stone 400
        public static readonly Color TextMuted       = FromHex("#D6D3D1");  // Stone 300
        public static readonly Color TextAccent      = FromHex("#8C711E");  // Gold Dark

        // Border
        public static readonly Color Border          = FromHex("#E7E2DA");  // Warm Gray
        public static readonly Color BorderLight     = FromHex("#F3F0EB");  // Ivory Secondary

        // Semantic
        public static readonly Color Success         = FromHex("#16A34A");
        public static readonly Color Error           = FromHex("#DC2626");
        public static readonly Color Warning         = FromHex("#CA8A04");
        public static readonly Color Info            = FromHex("#2563EB");

        // UI Elements
        public static readonly Color MenuBackground  = FromHex("#F3F0EB");  // Ivory Secondary
        public static readonly Color MenuForeground  = FromHex("#1C1917");  // Stone 900
        public static readonly Color MenuHover       = FromHex("#EEEBE5");  // Ivory Hover
        public static readonly Color TitleBar        = FromHex("#F3F0EB");  // Ivory Secondary
        public static readonly Color TitleBarText    = FromHex("#1C1917");  // Stone 900
    }

    // ── ダークテーマ ──
    public static class Dark
    {
        public static readonly Color Background      = FromHex("#1E1E2E");
        public static readonly Color Surface          = FromHex("#313244");
        public static readonly Color SurfaceHover     = FromHex("#45475A");
        public static readonly Color TextPrimary      = FromHex("#CDD6F4");
        public static readonly Color TextSecondary    = FromHex("#A6ADC8");
        public static readonly Color TextMuted        = FromHex("#6C7086");
        public static readonly Color Border           = FromHex("#45475A");
        public static readonly Color Success          = FromHex("#A6E3A1");
        public static readonly Color Error            = FromHex("#F38BA8");
        public static readonly Color Warning          = FromHex("#F9E2AF");
        public static readonly Color MenuBackground   = FromHex("#181825");
        public static readonly Color MenuForeground   = FromHex("#CDD6F4");
        public static readonly Color MenuHover        = FromHex("#313244");
        public static readonly Color TitleBar         = FromHex("#181825");
        public static readonly Color TitleBarText     = FromHex("#CDD6F4");
    }

    // ── ユーティリティ ──

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
