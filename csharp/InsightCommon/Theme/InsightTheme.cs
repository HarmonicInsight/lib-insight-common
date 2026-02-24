using System.Windows;
using System.Windows.Media;
using InsightCommon.License;

namespace InsightCommon.Theme;

/// <summary>
/// テーマモード
/// </summary>
public enum InsightThemeMode
{
    Light,
    Dark
}

/// <summary>
/// Insight Series 共通テーマ
/// </summary>
public class InsightTheme
{
    public InsightThemeMode Mode { get; }

    // ── カラー ──
    public Color Background { get; }
    public Color Surface { get; }
    public Color SurfaceSecondary { get; }
    public Color SurfaceHover { get; }
    public Color Primary { get; }
    public Color PrimaryContrast { get; }
    public Color TextPrimary { get; }
    public Color TextSecondary { get; }
    public Color TextMuted { get; }
    public Color Border { get; }
    public Color Success { get; }
    public Color Error { get; }
    public Color Warning { get; }
    public Color MenuBackground { get; }
    public Color MenuForeground { get; }
    public Color MenuHover { get; }
    public Color TitleBar { get; }
    public Color TitleBarText { get; }

    // ── Brush（便利アクセス） ──
    public SolidColorBrush BackgroundBrush => new(Background);
    public SolidColorBrush SurfaceBrush => new(Surface);
    public SolidColorBrush SurfaceSecondaryBrush => new(SurfaceSecondary);
    public SolidColorBrush SurfaceHoverBrush => new(SurfaceHover);
    public SolidColorBrush PrimaryBrush => new(Primary);
    public SolidColorBrush PrimaryContrastBrush => new(PrimaryContrast);
    public SolidColorBrush TextPrimaryBrush => new(TextPrimary);
    public SolidColorBrush TextSecondaryBrush => new(TextSecondary);
    public SolidColorBrush TextMutedBrush => new(TextMuted);
    public SolidColorBrush BorderBrush => new(Border);
    public SolidColorBrush SuccessBrush => new(Success);
    public SolidColorBrush ErrorBrush => new(Error);
    public SolidColorBrush WarningBrush => new(Warning);
    public SolidColorBrush MenuBackgroundBrush => new(MenuBackground);
    public SolidColorBrush MenuForegroundBrush => new(MenuForeground);
    public SolidColorBrush TitleBarBrush => new(TitleBar);
    public SolidColorBrush TitleBarTextBrush => new(TitleBarText);

    private InsightTheme(InsightThemeMode mode)
    {
        Mode = mode;
        // ブランドカラー（モード共通）
        Primary = InsightColors.BrandPrimary;
        PrimaryContrast = Colors.White;

        if (mode == InsightThemeMode.Dark)
        {
            Background = InsightColors.Dark.Background;
            Surface = InsightColors.Dark.Surface;
            SurfaceSecondary = InsightColors.Dark.Surface;
            SurfaceHover = InsightColors.Dark.SurfaceHover;
            TextPrimary = InsightColors.Dark.TextPrimary;
            TextSecondary = InsightColors.Dark.TextSecondary;
            TextMuted = InsightColors.Dark.TextMuted;
            Border = InsightColors.Dark.Border;
            Success = InsightColors.Dark.Success;
            Error = InsightColors.Dark.Error;
            Warning = InsightColors.Dark.Warning;
            MenuBackground = InsightColors.Dark.MenuBackground;
            MenuForeground = InsightColors.Dark.MenuForeground;
            MenuHover = InsightColors.Dark.MenuHover;
            TitleBar = InsightColors.Dark.TitleBar;
            TitleBarText = InsightColors.Dark.TitleBarText;
        }
        else
        {
            Background = InsightColors.Light.Background;
            Surface = InsightColors.Light.Surface;
            SurfaceSecondary = InsightColors.Light.SurfaceSecondary;
            SurfaceHover = InsightColors.Light.SurfaceHover;
            TextPrimary = InsightColors.Light.TextPrimary;
            TextSecondary = InsightColors.Light.TextSecondary;
            TextMuted = InsightColors.Light.TextMuted;
            Border = InsightColors.Light.Border;
            Success = InsightColors.Light.Success;
            Error = InsightColors.Light.Error;
            Warning = InsightColors.Light.Warning;
            MenuBackground = InsightColors.Light.MenuBackground;
            MenuForeground = InsightColors.Light.MenuForeground;
            MenuHover = InsightColors.Light.MenuHover;
            TitleBar = InsightColors.Light.TitleBar;
            TitleBarText = InsightColors.Light.TitleBarText;
        }
    }

    /// <summary>テーマを作成</summary>
    public static InsightTheme Create(InsightThemeMode mode = InsightThemeMode.Light) => new(mode);

    /// <summary>プラン別カラーを取得</summary>
    public static SolidColorBrush GetPlanBrush(PlanCode plan) => new(GetPlanColor(plan));

    /// <summary>プラン別カラーを取得</summary>
    public static Color GetPlanColor(PlanCode plan) => plan switch
    {
        PlanCode.Ent   => InsightColors.PlanEnt,
        PlanCode.Pro   => InsightColors.PlanPro,
        PlanCode.Std   => InsightColors.PlanStd,
        PlanCode.Trial => InsightColors.PlanTrial,
        _              => InsightColors.PlanFree,
    };

    // ── フォント ──
    public static readonly FontFamily UIFont = new("Segoe UI Variable, Segoe UI, Yu Gothic UI, Meiryo UI");
    public static readonly FontFamily CodeFont = new("Consolas, Cascadia Code, MS Gothic");

    public static readonly double FontSizeSmall = 11;
    public static readonly double FontSizeBody = 13;
    public static readonly double FontSizeHeading = 15;
    public static readonly double FontSizeTitle = 20;
    public static readonly double FontSizePlanDisplay = 28;
}
