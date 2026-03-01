using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shapes;
using InsightCommon.License;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通タイトルバー構築
///
/// 全製品で統一されたタイトルバーを提供:
/// - 左側: アプリ名、バージョン、プランバッジ
/// - 右側: パネルトグル、言語切替、ライセンス、ウィンドウコントロール
/// </summary>
public static class InsightTitleBar
{
    // ═══════════════════════════════════════════════════════════════
    // 製品定義
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// Insight Business Suite 製品定義
    /// </summary>
    public record ProductInfo(
        string Code,
        string NameJa,
        string NameEn,
        string ShortName,
        string Description
    );

    /// <summary>
    /// 製品一覧
    /// </summary>
    public static class Products
    {
        public static readonly ProductInfo Sheet = new(
            Code: "IOSH",
            NameJa: "Insight Performance Management",
            NameEn: "Insight Performance Management",
            ShortName: "Performance",
            Description: "AIアシスタント搭載 経営数値管理ツール"
        );

        public static readonly ProductInfo Doc = new(
            Code: "IOSD",
            NameJa: "Insight AI Doc Factory",
            NameEn: "Insight AI Doc Factory",
            ShortName: "Doc Factory",
            Description: "AIアシスタント搭載 業務文書管理ツール"
        );

        public static readonly ProductInfo Slide = new(
            Code: "INSS",
            NameJa: "Insight Deck Quality Gate",
            NameEn: "Insight Deck Quality Gate",
            ShortName: "DQG",
            Description: "AIアシスタント搭載 プレゼン品質管理ツール"
        );

        public static readonly ProductInfo SeniorOffice = new(
            Code: "ISOF",
            NameJa: "InsightSeniorOffice",
            NameEn: "InsightSeniorOffice",
            ShortName: "Senior",
            Description: "シニア向け統合オフィス"
        );

        public static readonly ProductInfo Bot = new(
            Code: "INBT",
            NameJa: "InsightBot",
            NameEn: "InsightBot",
            ShortName: "Bot",
            Description: "AIエディタ搭載RPA"
        );

        public static readonly ProductInfo Py = new(
            Code: "INPY",
            NameJa: "InsightPy",
            NameEn: "InsightPy",
            ShortName: "Py",
            Description: "AIエディタ搭載Python実行基盤"
        );

        /// <summary>
        /// コードから製品情報を取得
        /// </summary>
        public static ProductInfo? GetByCode(string code) => code.ToUpperInvariant() switch
        {
            "IOSH" => Sheet,
            "IOSD" => Doc,
            "INSS" => Slide,
            "ISOF" => SeniorOffice,
            "INBT" => Bot,
            "INPY" => Py,
            _ => null
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // タイトルバー構成
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// タイトルバー構成オプション
    /// </summary>
    public class TitleBarOptions
    {
        /// <summary>製品情報</summary>
        public ProductInfo Product { get; set; } = Products.Sheet;

        /// <summary>バージョン文字列（例: "v2.1.0"）</summary>
        public string Version { get; set; } = "";

        /// <summary>現在のプラン</summary>
        public PlanCode Plan { get; set; } = PlanCode.Trial;

        /// <summary>パネルトグルボタン（左から右の順序）</summary>
        public PanelToggleInfo[] PanelToggles { get; set; } = [];

        /// <summary>言語切替ボタンを表示</summary>
        public bool ShowLanguageToggle { get; set; } = true;

        /// <summary>ライセンスボタンを表示</summary>
        public bool ShowLicenseButton { get; set; } = true;

        /// <summary>現在の言語コード</summary>
        public string CurrentLanguage { get; set; } = "JA";

        /// <summary>タイトルバーの高さ</summary>
        public double Height { get; set; } = 48;
    }

    /// <summary>
    /// パネルトグルボタン情報
    /// </summary>
    public class PanelToggleInfo
    {
        /// <summary>パネル定義</summary>
        public PanelDefinition Definition { get; set; } = InsightIcons.Panels.History;

        /// <summary>開閉状態プロパティのバインディングパス</summary>
        public string IsOpenBindingPath { get; set; } = "";

        /// <summary>トグルコマンドのバインディングパス</summary>
        public string CommandBindingPath { get; set; } = "";

        /// <summary>絵文字アイコンを使用（falseの場合Segoe MDL2）</summary>
        public bool UseEmoji { get; set; } = true;
    }

    // ═══════════════════════════════════════════════════════════════
    // タイトルバー生成
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// タイトルバーを生成
    /// </summary>
    public static Border Create(
        TitleBarOptions options,
        InsightTheme theme,
        Action<Window>? onMinimize = null,
        Action<Window>? onMaximizeRestore = null,
        Action<Window>? onClose = null,
        Action? onLanguageToggle = null,
        Action? onLicenseClick = null)
    {
        var titleBar = new Border
        {
            Background = theme.SurfaceSecondaryBrush,
            Height = options.Height,
            CornerRadius = new CornerRadius(8, 8, 0, 0),
        };

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        // ── 左側: 製品名、バージョン、プランバッジ ──
        var leftPanel = CreateLeftPanel(options, theme);
        Grid.SetColumn(leftPanel, 0);
        grid.Children.Add(leftPanel);

        // ── 右側: パネルトグル、言語、ライセンス、ウィンドウコントロール ──
        var rightPanel = CreateRightPanel(
            options, theme,
            onMinimize, onMaximizeRestore, onClose,
            onLanguageToggle, onLicenseClick);
        Grid.SetColumn(rightPanel, 1);
        grid.Children.Add(rightPanel);

        titleBar.Child = grid;
        return titleBar;
    }

    /// <summary>
    /// 左側パネル（製品名、バージョン、プランバッジ）を生成
    /// </summary>
    private static StackPanel CreateLeftPanel(TitleBarOptions options, InsightTheme theme)
    {
        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(16, 0, 0, 0),
        };

        // 製品名
        var productName = new TextBlock
        {
            Text = options.Product.NameJa,
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            FontFamily = InsightTheme.UIFont,
            Foreground = theme.PrimaryBrush,
            VerticalAlignment = VerticalAlignment.Center,
        };
        panel.Children.Add(productName);

        // バージョン
        if (!string.IsNullOrEmpty(options.Version))
        {
            var version = new TextBlock
            {
                Text = options.Version,
                FontSize = 11,
                FontFamily = InsightTheme.UIFont,
                Foreground = theme.TextMutedBrush,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(8, 0, 0, 0),
            };
            panel.Children.Add(version);
        }

        // プランバッジ
        var badge = CreatePlanBadge(options.Plan, theme);
        badge.Margin = new Thickness(10, 0, 0, 0);
        panel.Children.Add(badge);

        return panel;
    }

    /// <summary>
    /// 右側パネルを生成
    /// </summary>
    private static StackPanel CreateRightPanel(
        TitleBarOptions options,
        InsightTheme theme,
        Action<Window>? onMinimize,
        Action<Window>? onMaximizeRestore,
        Action<Window>? onClose,
        Action? onLanguageToggle,
        Action? onLicenseClick)
    {
        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
        };

        // パネルトグルボタン
        foreach (var toggle in options.PanelToggles)
        {
            var btn = CreatePanelToggleButton(toggle, theme);
            panel.Children.Add(btn);
        }

        // セパレータ（パネルトグルがある場合）
        if (options.PanelToggles.Length > 0)
        {
            panel.Children.Add(CreateSeparator(theme));
        }

        // 言語切替
        if (options.ShowLanguageToggle)
        {
            var langBtn = CreateTitleBarButton(
                options.CurrentLanguage,
                theme,
                "言語切替 / Language",
                width: 40,
                fontSize: 11,
                fontWeight: FontWeights.SemiBold);
            if (onLanguageToggle != null)
                langBtn.Click += (s, e) => onLanguageToggle();
            panel.Children.Add(langBtn);
        }

        // ライセンスボタン
        if (options.ShowLicenseButton)
        {
            var licenseBtn = CreateTitleBarButton(
                InsightIcons.Emoji.Key,
                theme,
                "ライセンス / License",
                width: 40,
                fontSize: 14);
            if (onLicenseClick != null)
                licenseBtn.Click += (s, e) => onLicenseClick();
            panel.Children.Add(licenseBtn);
        }

        // ウィンドウコントロール
        panel.Children.Add(CreateWindowControls(theme, onMinimize, onMaximizeRestore, onClose));

        return panel;
    }

    // ═══════════════════════════════════════════════════════════════
    // 個別コンポーネント
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// プランバッジを生成
    /// </summary>
    public static Border CreatePlanBadge(PlanCode plan, InsightTheme theme)
    {
        var badge = new Border
        {
            Background = new SolidColorBrush(InsightColors.FromHex("#F0E6C8")), // PrimaryLight
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(8, 2, 8, 2),
            VerticalAlignment = VerticalAlignment.Center,
        };

        var text = new TextBlock
        {
            Text = PlanDisplay.GetName(plan),
            FontSize = 11,
            FontWeight = FontWeights.SemiBold,
            FontFamily = InsightTheme.UIFont,
            Foreground = new SolidColorBrush(InsightColors.FromHex("#8C711E")), // TextAccent
        };

        badge.Child = text;
        return badge;
    }

    /// <summary>
    /// パネルトグルボタンを生成
    /// </summary>
    public static Button CreatePanelToggleButton(PanelToggleInfo info, InsightTheme theme)
    {
        var btn = new Button
        {
            Width = 36,
            Height = 32,
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            ToolTip = $"{info.Definition.NameJa}の表示/非表示",
            VerticalContentAlignment = VerticalAlignment.Center,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        var icon = new TextBlock
        {
            Text = info.UseEmoji ? info.Definition.IconEmoji : info.Definition.IconMdl2,
            FontFamily = info.UseEmoji ? null : new FontFamily(InsightIcons.FontFamily),
            FontSize = info.UseEmoji ? 16 : 14,
            Foreground = theme.TextSecondaryBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            // 開閉状態に応じた透明度はバインディングで設定
        };

        btn.Content = icon;
        return btn;
    }

    /// <summary>
    /// タイトルバー用ボタンを生成
    /// </summary>
    public static Button CreateTitleBarButton(
        string content,
        InsightTheme theme,
        string? tooltip = null,
        double width = 46,
        double fontSize = 13,
        FontWeight? fontWeight = null)
    {
        var btn = new Button
        {
            Content = content,
            Width = width,
            Height = 32,
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Foreground = theme.TextSecondaryBrush,
            FontSize = fontSize,
            FontWeight = fontWeight ?? FontWeights.Normal,
            FontFamily = InsightTheme.UIFont,
            Cursor = Cursors.Hand,
            VerticalContentAlignment = VerticalAlignment.Center,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        if (!string.IsNullOrEmpty(tooltip))
            btn.ToolTip = tooltip;

        return btn;
    }

    /// <summary>
    /// セパレータを生成
    /// </summary>
    public static Rectangle CreateSeparator(InsightTheme theme)
    {
        return new Rectangle
        {
            Width = 1,
            Height = 20,
            Fill = theme.BorderBrush,
            Margin = new Thickness(4, 0, 4, 0),
        };
    }

    /// <summary>
    /// ウィンドウコントロールボタンを生成
    /// </summary>
    public static StackPanel CreateWindowControls(
        InsightTheme theme,
        Action<Window>? onMinimize = null,
        Action<Window>? onMaximizeRestore = null,
        Action<Window>? onClose = null)
    {
        var panel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
        };

        // 最小化
        var minBtn = CreateWindowControlButton(InsightIcons.Minimize, theme, false);
        if (onMinimize != null)
        {
            minBtn.Click += (s, e) =>
            {
                if (Window.GetWindow(minBtn) is Window w)
                    onMinimize(w);
            };
        }
        panel.Children.Add(minBtn);

        // 最大化/復元
        var maxBtn = CreateWindowControlButton(InsightIcons.Maximize, theme, false);
        maxBtn.Tag = "maximize";
        if (onMaximizeRestore != null)
        {
            maxBtn.Click += (s, e) =>
            {
                if (Window.GetWindow(maxBtn) is Window w)
                {
                    onMaximizeRestore(w);
                    ((TextBlock)maxBtn.Content).Text =
                        w.WindowState == WindowState.Maximized
                            ? InsightIcons.Restore
                            : InsightIcons.Maximize;
                }
            };
        }
        panel.Children.Add(maxBtn);

        // 閉じる
        var closeBtn = CreateWindowControlButton(InsightIcons.CloseX, theme, true);
        if (onClose != null)
        {
            closeBtn.Click += (s, e) =>
            {
                if (Window.GetWindow(closeBtn) is Window w)
                    onClose(w);
            };
        }
        panel.Children.Add(closeBtn);

        return panel;
    }

    /// <summary>
    /// ウィンドウコントロールボタン（最小化/最大化/閉じる）を生成
    /// </summary>
    private static Button CreateWindowControlButton(string icon, InsightTheme theme, bool isClose)
    {
        var btn = new Button
        {
            Width = 46,
            Height = 32,
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            VerticalContentAlignment = VerticalAlignment.Center,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        var content = new TextBlock
        {
            Text = icon,
            FontFamily = new FontFamily(InsightIcons.FontFamily),
            FontSize = 10,
            Foreground = theme.TextSecondaryBrush,
        };
        btn.Content = content;

        // ホバー時の色（ControlTemplateで本来は設定するが、簡易版）
        btn.MouseEnter += (s, e) =>
        {
            if (isClose)
            {
                btn.Background = new SolidColorBrush(InsightColors.FromHex("#DC2626"));
                content.Foreground = Brushes.White;
            }
            else
            {
                btn.Background = theme.SurfaceHoverBrush;
            }
        };
        btn.MouseLeave += (s, e) =>
        {
            btn.Background = Brushes.Transparent;
            content.Foreground = theme.TextSecondaryBrush;
        };

        return btn;
    }

    // ═══════════════════════════════════════════════════════════════
    // ライセンス画面用アイコン
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 機能利用可能アイコン
    /// </summary>
    public static string GetFeatureAvailableIcon(bool isAvailable)
    {
        return isAvailable ? InsightIcons.Emoji.CheckMark : $"{InsightIcons.Emoji.Lock} BIZ";
    }

    /// <summary>
    /// 機能利用可能アイコンの色を取得
    /// </summary>
    public static SolidColorBrush GetFeatureAvailableBrush(bool isAvailable, InsightTheme theme)
    {
        return isAvailable ? theme.SuccessBrush : theme.TextMutedBrush;
    }

    /// <summary>
    /// プラン別アイコンを取得
    /// </summary>
    public static string GetPlanIcon(PlanCode plan)
    {
        return plan switch
        {
            PlanCode.Ent => InsightIcons.Emoji.Crown,
            PlanCode.Biz => InsightIcons.Emoji.Star,
            PlanCode.Trial => "⏱",
            _ => InsightIcons.Emoji.Lock,
        };
    }
}
