using System.Windows.Media;

namespace InsightCommon.Theme;

/// <summary>
/// Insight Series 共通カラー定義
/// </summary>
public static class InsightColors
{
    // ── ブランドカラー ──
    public static readonly Color BrandPrimary = FromHex("#6366F1");
    public static readonly Color BrandTitle   = FromHex("#2563EB");

    // ── プラン別カラー（ライト・ダーク共通） ──
    public static readonly Color PlanFree  = FromHex("#9CA3AF");
    public static readonly Color PlanTrial = FromHex("#F59E0B");
    public static readonly Color PlanStd   = FromHex("#10B981");
    public static readonly Color PlanPro   = FromHex("#3B82F6");
    public static readonly Color PlanEnt   = FromHex("#F59E0B"); // Gold

    // ── ライトテーマ ──
    public static class Light
    {
        public static readonly Color Background      = FromHex("#F8FAFC");
        public static readonly Color Surface          = FromHex("#FFFFFF");
        public static readonly Color SurfaceHover     = FromHex("#F1F5F9");
        public static readonly Color TextPrimary      = FromHex("#1E293B");
        public static readonly Color TextSecondary    = FromHex("#64748B");
        public static readonly Color TextMuted        = FromHex("#94A3B8");
        public static readonly Color Border           = FromHex("#E2E8F0");
        public static readonly Color Success          = FromHex("#10B981");
        public static readonly Color Error            = FromHex("#EF4444");
        public static readonly Color Warning          = FromHex("#F59E0B");
        public static readonly Color MenuBackground   = FromHex("#F1F5F9");
        public static readonly Color MenuForeground   = FromHex("#334155");
        public static readonly Color MenuHover        = FromHex("#E2E8F0");
        public static readonly Color TitleBar         = FromHex("#F1F5F9");
        public static readonly Color TitleBarText     = FromHex("#334155");
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
