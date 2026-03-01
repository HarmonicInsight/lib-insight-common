using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shell;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通カスタムタイトルバー
///
/// Windows標準ヘッダを非表示にし、自前のタイトルバーを構築する。
/// 最小化・最大化・閉じるボタンを統一デザインで提供。
/// </summary>
public static class InsightWindowChrome
{
    /// <summary>
    /// ウィンドウにカスタムタイトルバーを適用
    /// </summary>
    /// <param name="window">対象のWindow</param>
    /// <param name="title">タイトルテキスト</param>
    /// <param name="theme">テーマ</param>
    /// <param name="menuItems">メニュー項目（オプション）</param>
    /// <returns>タイトルバーのDockPanel（メニュー追加等のカスタマイズ用）</returns>
    public static DockPanel Apply(
        Window window,
        string title,
        InsightTheme theme,
        MenuItem[]? menuItems = null)
    {
        // WindowChrome を設定
        var chrome = new WindowChrome
        {
            CaptionHeight = 0,
            ResizeBorderThickness = new Thickness(6),
            GlassFrameThickness = new Thickness(0),
            CornerRadius = new CornerRadius(0),
        };
        WindowChrome.SetWindowChrome(window, chrome);

        window.WindowStyle = WindowStyle.None;

        // タイトルバーを構築
        var titleBar = new DockPanel
        {
            Background = theme.TitleBarBrush,
            Height = 36,
            LastChildFill = true,
        };

        // ── 右側: ウィンドウコントロールボタン ──
        var controlPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Stretch,
        };
        DockPanel.SetDock(controlPanel, Dock.Right);

        // 最小化ボタン
        var minBtn = CreateWindowButton("─", theme, false);
        minBtn.Click += (_, _) => window.WindowState = WindowState.Minimized;
        controlPanel.Children.Add(minBtn);

        // 最大化/復元ボタン
        var maxBtn = CreateWindowButton("□", theme, false);
        maxBtn.Click += (_, _) =>
        {
            window.WindowState = window.WindowState == WindowState.Maximized
                ? WindowState.Normal
                : WindowState.Maximized;
            maxBtn.Content = window.WindowState == WindowState.Maximized ? "❐" : "□";
        };
        window.StateChanged += (_, _) =>
        {
            maxBtn.Content = window.WindowState == WindowState.Maximized ? "❐" : "□";
        };
        controlPanel.Children.Add(maxBtn);

        // 閉じるボタン
        var closeBtn = CreateWindowButton("✕", theme, true);
        closeBtn.Click += (_, _) => window.Close();
        controlPanel.Children.Add(closeBtn);

        titleBar.Children.Add(controlPanel);

        // ── 左側: タイトルテキスト（+ オプションメニュー） ──
        var leftPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
        };
        DockPanel.SetDock(leftPanel, Dock.Left);

        var titleBlock = new TextBlock
        {
            Text = title,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            FontFamily = InsightTheme.UIFont,
            Foreground = theme.TitleBarTextBrush,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(12, 0, 16, 0),
        };
        leftPanel.Children.Add(titleBlock);

        // メニューバー（指定されている場合）
        if (menuItems != null && menuItems.Length > 0)
        {
            var menuBar = new Menu
            {
                Background = Brushes.Transparent,
                Foreground = theme.MenuForegroundBrush,
                FontFamily = InsightTheme.UIFont,
                FontSize = InsightTheme.FontSizeBody,
                VerticalAlignment = VerticalAlignment.Center,
            };

            foreach (var item in menuItems)
            {
                item.Foreground = theme.MenuForegroundBrush;
                menuBar.Items.Add(item);
            }

            leftPanel.Children.Add(menuBar);
        }

        titleBar.Children.Add(leftPanel);

        // ドラッグ移動対応（空き領域）
        var dragArea = new Border
        {
            Background = Brushes.Transparent,
        };
        dragArea.MouseLeftButtonDown += (_, e) =>
        {
            if (e.ClickCount == 2)
            {
                window.WindowState = window.WindowState == WindowState.Maximized
                    ? WindowState.Normal
                    : WindowState.Maximized;
            }
            else
            {
                window.DragMove();
            }
        };
        titleBar.Children.Add(dragArea);

        // UI スケーリング自動適用
        InsightScaleManager.Instance.ApplyToWindow(window);

        return titleBar;
    }

    private static Button CreateWindowButton(string content, InsightTheme theme, bool isClose)
    {
        var btn = new Button
        {
            Content = content,
            Width = 46,
            FontSize = 12,
            FontFamily = InsightTheme.UIFont,
            Background = Brushes.Transparent,
            Foreground = theme.TitleBarTextBrush,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            VerticalAlignment = VerticalAlignment.Stretch,
            HorizontalContentAlignment = HorizontalAlignment.Center,
            VerticalContentAlignment = VerticalAlignment.Center,
        };

        // ControlTemplate でホバー色を設定
        var hoverColor = isClose
            ? InsightColors.FromHex("#E81123")
            : theme.SurfaceHover;
        var hoverFg = isClose ? Colors.White : theme.TextPrimary;

        var template = new System.Windows.Controls.ControlTemplate(typeof(Button));
        var borderFactory = new FrameworkElementFactory(typeof(Border));
        borderFactory.SetValue(Border.BackgroundProperty, Brushes.Transparent);
        borderFactory.Name = "BtnBorder";

        var contentFactory = new FrameworkElementFactory(typeof(ContentPresenter));
        contentFactory.SetValue(ContentPresenter.HorizontalAlignmentProperty, HorizontalAlignment.Center);
        contentFactory.SetValue(ContentPresenter.VerticalAlignmentProperty, VerticalAlignment.Center);
        borderFactory.AppendChild(contentFactory);

        template.VisualTree = borderFactory;

        // IsMouseOver トリガー
        var hoverTrigger = new Trigger
        {
            Property = UIElement.IsMouseOverProperty,
            Value = true,
        };
        hoverTrigger.Setters.Add(new Setter(Border.BackgroundProperty, new SolidColorBrush(hoverColor), "BtnBorder"));
        if (isClose)
        {
            hoverTrigger.Setters.Add(new Setter(Button.ForegroundProperty, new SolidColorBrush(hoverFg)));
        }
        template.Triggers.Add(hoverTrigger);

        btn.Template = template;

        return btn;
    }

    // ── ヘルパー: 標準メニュー構成 ──

    /// <summary>
    /// 統一「ヘルプ」メニューを生成（HelpMenuItemDefinition ベース）
    ///
    /// <para>
    /// 各アプリの HelpWindow セクションに対応するメニュー項目を柔軟に構成できる。
    /// config/help-content.ts の定義に基づいてアプリ側で helpTopics を構築すること。
    /// </para>
    ///
    /// <example>
    /// <code>
    /// var helpTopics = new List&lt;HelpMenuItemDefinition&gt;
    /// {
    ///     new() { Id = "overview",      Label = "操作マニュアル", InputGestureText = "F1", OnClick = () => ShowHelpSection("overview") },
    ///     new() { Id = "shortcuts",     Label = "ショートカット一覧",                      OnClick = () => ShowHelpSection("shortcuts") },
    /// };
    /// var menu = InsightWindowChrome.CreateHelpMenu("製品名", helpTopics, onLicenseManage, onAbout);
    /// </code>
    /// </example>
    /// </summary>
    /// <param name="productName">製品名</param>
    /// <param name="helpTopics">ヘルプトピック一覧</param>
    /// <param name="onLicenseManage">ライセンス管理クリック時</param>
    /// <param name="onAbout">バージョン情報クリック時</param>
    public static MenuItem CreateHelpMenu(
        string productName,
        IReadOnlyList<HelpMenuItemDefinition> helpTopics,
        Action onLicenseManage,
        Action onAbout)
    {
        var helpMenu = new MenuItem { Header = "ヘルプ(_H)" };

        foreach (var topic in helpTopics)
        {
            var item = new MenuItem { Header = topic.Label };
            if (topic.InputGestureText != null)
            {
                item.InputGestureText = topic.InputGestureText;
            }
            var onClick = topic.OnClick;
            item.Click += (_, _) => onClick();
            helpMenu.Items.Add(item);
        }

        if (helpTopics.Count > 0)
        {
            helpMenu.Items.Add(new Separator());
        }

        var licenseItem = new MenuItem { Header = "ライセンス管理..." };
        licenseItem.Click += (_, _) => onLicenseManage();
        helpMenu.Items.Add(licenseItem);

        helpMenu.Items.Add(new Separator());

        var aboutItem = new MenuItem { Header = $"{productName} について" };
        aboutItem.Click += (_, _) => onAbout();
        helpMenu.Items.Add(aboutItem);

        return helpMenu;
    }

    /// <summary>
    /// 統一「ヘルプ」メニューを生成（レガシー）
    /// </summary>
    [Obsolete("IReadOnlyList<HelpMenuItemDefinition> を受け取るオーバーロードを使用してください")]
    public static MenuItem CreateHelpMenu(
        string productName,
        Action onLicenseManage,
        Action onAbout,
        Action? onDocumentation = null,
        Action? onFaq = null)
    {
        var helpMenu = new MenuItem { Header = "ヘルプ(_H)" };

        if (onDocumentation != null)
        {
            var docItem = new MenuItem
            {
                Header = "操作マニュアル",
                InputGestureText = "F1",
            };
            docItem.Click += (_, _) => onDocumentation();
            helpMenu.Items.Add(docItem);
        }

        if (onFaq != null)
        {
            var faqItem = new MenuItem { Header = "FAQ" };
            faqItem.Click += (_, _) => onFaq();
            helpMenu.Items.Add(faqItem);
        }

        if (onDocumentation != null || onFaq != null)
        {
            helpMenu.Items.Add(new Separator());
        }

        var licenseItem = new MenuItem { Header = "ライセンス管理..." };
        licenseItem.Click += (_, _) => onLicenseManage();
        helpMenu.Items.Add(licenseItem);

        helpMenu.Items.Add(new Separator());

        var aboutItem = new MenuItem { Header = $"{productName} について" };
        aboutItem.Click += (_, _) => onAbout();
        helpMenu.Items.Add(aboutItem);

        return helpMenu;
    }
}
