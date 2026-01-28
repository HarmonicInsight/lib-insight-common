using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using InsightCommon.License;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通ライセンスダイアログ
///
/// 統一レイアウト:
///   1. タイトル（製品名）
///   2. 現在のプラン（大きな文字 + 有効期限）
///   3. 機能一覧（製品固有の機能表示）
///   4. ライセンス認証（メール + キー + アクティベート/クリア）
///   5. 閉じるボタン
/// </summary>
public class InsightLicenseDialog : Window
{
    private readonly LicenseDialogOptions _options;
    private readonly InsightTheme _theme;
    private readonly InsightLicenseManager _licenseManager;

    // UI elements
    private TextBlock _planLabel = null!;
    private TextBlock _statusLabel = null!;
    private TextBox _emailTextBox = null!;
    private TextBox _keyTextBox = null!;
    private TextBlock _validationMessage = null!;
    private StackPanel _featuresPanel = null!;

    public InsightLicenseDialog(LicenseDialogOptions options)
    {
        _options = options;
        _theme = InsightTheme.Create(options.ThemeMode);
        _licenseManager = options.LicenseManager;

        Title = options.ProductName;
        Width = 550;
        Height = 620;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        Background = _theme.BackgroundBrush;
        FontFamily = InsightTheme.UIFont;

        BuildUI();
        LoadCurrentLicense();
    }

    private void BuildUI()
    {
        var mainGrid = new Grid { Margin = new Thickness(20) };
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Title
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Content
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Close button

        // ── Scrollable Content ──
        var scroll = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
        };
        Grid.SetRow(scroll, 1);

        var content = new StackPanel();

        // 1. タイトル
        var title = new TextBlock
        {
            Text = _options.ProductName,
            FontSize = InsightTheme.FontSizeTitle,
            FontWeight = FontWeights.Bold,
            Foreground = _theme.TextPrimaryBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 16),
        };
        content.Children.Add(title);

        // 2. 現在のプラン
        content.Children.Add(BuildPlanSection());

        // 3. 機能一覧（機能定義がある場合のみ）
        if (_options.Features.Length > 0)
        {
            content.Children.Add(BuildFeaturesSection());
        }

        // 4. ライセンス認証
        content.Children.Add(BuildInputSection());

        scroll.Content = content;
        mainGrid.Children.Add(scroll);

        // 5. 閉じるボタン
        var closePanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 12, 0, 0),
        };
        Grid.SetRow(closePanel, 2);

        var closeBtn = CreateButton("閉じる", isCancel: true);
        closeBtn.Click += (_, _) => { DialogResult = false; Close(); };
        closePanel.Children.Add(closeBtn);

        mainGrid.Children.Add(closePanel);
        Content = mainGrid;

        // Enterキーでアクティベート
        KeyDown += (_, e) => { if (e.Key == Key.Return) ActivateLicense(); };
    }

    // ── 現在のプランセクション ──

    private UIElement BuildPlanSection()
    {
        var border = CreateCardBorder();
        border.Margin = new Thickness(0, 0, 0, 12);

        var panel = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };

        panel.Children.Add(new TextBlock
        {
            Text = "現在のプラン",
            FontSize = InsightTheme.FontSizeSmall,
            Foreground = _theme.TextSecondaryBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 4),
        });

        _planLabel = new TextBlock
        {
            Text = "FREE",
            FontSize = InsightTheme.FontSizePlanDisplay,
            FontWeight = FontWeights.Bold,
            Foreground = InsightTheme.GetPlanBrush(PlanCode.Free),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 4),
        };
        panel.Children.Add(_planLabel);

        _statusLabel = new TextBlock
        {
            Text = "",
            FontSize = InsightTheme.FontSizeSmall,
            Foreground = _theme.TextSecondaryBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
        };
        panel.Children.Add(_statusLabel);

        border.Child = panel;
        return border;
    }

    // ── 機能一覧セクション ──

    private UIElement BuildFeaturesSection()
    {
        var container = new StackPanel { Margin = new Thickness(0, 0, 0, 12) };

        container.Children.Add(new TextBlock
        {
            Text = "機能一覧",
            FontSize = InsightTheme.FontSizeBody,
            FontWeight = FontWeights.Bold,
            Foreground = _theme.TextPrimaryBrush,
            Margin = new Thickness(0, 0, 0, 6),
        });

        var border = CreateCardBorder();
        _featuresPanel = new StackPanel();

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        for (int i = 0; i < _options.Features.Length; i++)
        {
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            var feature = _options.Features[i];
            var label = new TextBlock
            {
                Text = feature.Label,
                FontSize = InsightTheme.FontSizeBody,
                Foreground = _theme.TextPrimaryBrush,
                Margin = new Thickness(0, 3, 0, 3),
                VerticalAlignment = VerticalAlignment.Center,
            };
            Grid.SetRow(label, i);
            Grid.SetColumn(label, 0);
            grid.Children.Add(label);

            var valueLabel = new TextBlock
            {
                FontSize = InsightTheme.FontSizeBody,
                Margin = new Thickness(0, 3, 0, 3),
                HorizontalAlignment = HorizontalAlignment.Right,
                VerticalAlignment = VerticalAlignment.Center,
                Tag = feature.Key, // store key for updates
            };
            Grid.SetRow(valueLabel, i);
            Grid.SetColumn(valueLabel, 1);
            grid.Children.Add(valueLabel);
        }

        _featuresPanel.Children.Add(grid);
        border.Child = _featuresPanel;
        container.Children.Add(border);

        return container;
    }

    // ── ライセンス認証セクション ──

    private UIElement BuildInputSection()
    {
        var container = new StackPanel { Margin = new Thickness(0, 0, 0, 0) };

        container.Children.Add(new TextBlock
        {
            Text = "ライセンス認証",
            FontSize = InsightTheme.FontSizeBody,
            FontWeight = FontWeights.Bold,
            Foreground = _theme.TextPrimaryBrush,
            Margin = new Thickness(0, 0, 0, 6),
        });

        var border = CreateCardBorder();
        var panel = new StackPanel();

        // メールアドレス
        panel.Children.Add(new TextBlock
        {
            Text = "メールアドレス",
            FontSize = InsightTheme.FontSizeSmall,
            Foreground = _theme.TextSecondaryBrush,
            Margin = new Thickness(0, 0, 0, 4),
        });

        _emailTextBox = new TextBox
        {
            Height = 32,
            FontSize = 14,
            FontFamily = InsightTheme.UIFont,
            VerticalContentAlignment = VerticalAlignment.Center,
            Padding = new Thickness(6, 0, 6, 0),
        };
        ApplyTextBoxStyle(_emailTextBox);
        panel.Children.Add(_emailTextBox);

        // ライセンスキー
        panel.Children.Add(new TextBlock
        {
            Text = "ライセンスキー",
            FontSize = InsightTheme.FontSizeSmall,
            Foreground = _theme.TextSecondaryBrush,
            Margin = new Thickness(0, 8, 0, 4),
        });

        panel.Children.Add(new TextBlock
        {
            Text = $"{_options.ProductCode}-STD-YYMM-XXXX-XXXX-XXXX",
            FontSize = 10,
            Foreground = _theme.TextMutedBrush,
            Margin = new Thickness(0, 0, 0, 4),
        });

        _keyTextBox = new TextBox
        {
            Height = 32,
            FontSize = 14,
            FontFamily = InsightTheme.CodeFont,
            VerticalContentAlignment = VerticalAlignment.Center,
            Padding = new Thickness(6, 0, 6, 0),
            CharacterCasing = CharacterCasing.Upper,
        };
        ApplyTextBoxStyle(_keyTextBox);
        panel.Children.Add(_keyTextBox);

        // バリデーションメッセージ
        _validationMessage = new TextBlock
        {
            Text = "",
            FontSize = InsightTheme.FontSizeSmall,
            Margin = new Thickness(0, 6, 0, 0),
            TextWrapping = TextWrapping.Wrap,
        };
        panel.Children.Add(_validationMessage);

        // ボタン
        var btnPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = new Thickness(0, 10, 0, 0),
        };

        var activateBtn = CreateButton("アクティベート", isPrimary: true);
        activateBtn.MinWidth = 120;
        activateBtn.Click += (_, _) => ActivateLicense();
        btnPanel.Children.Add(activateBtn);

        var clearBtn = CreateButton("クリア");
        clearBtn.MinWidth = 70;
        clearBtn.Click += (_, _) => ClearLicense();
        btnPanel.Children.Add(clearBtn);

        panel.Children.Add(btnPanel);

        border.Child = panel;
        container.Children.Add(border);

        return container;
    }

    // ── ロジック ──

    private void LoadCurrentLicense()
    {
        var license = _licenseManager.CurrentLicense;
        if (!string.IsNullOrEmpty(license.Email))
            _emailTextBox.Text = license.Email;
        if (!string.IsNullOrEmpty(license.Key))
            _keyTextBox.Text = license.Key;
        UpdateUI();
    }

    private void UpdateUI()
    {
        var license = _licenseManager.CurrentLicense;
        var plan = license.Plan;

        // プラン表示
        _planLabel.Text = PlanDisplay.GetName(plan);
        _planLabel.Foreground = InsightTheme.GetPlanBrush(plan);

        // ステータス
        if (license.IsValid && license.ExpiresAt.HasValue)
        {
            _statusLabel.Text = $"有効期限: {license.ExpiresAt.Value:yyyy年MM月dd日}";
            var days = license.DaysRemaining ?? 0;
            _statusLabel.Foreground = days <= 30
                ? (days <= 0 ? _theme.ErrorBrush : _theme.WarningBrush)
                : _theme.TextSecondaryBrush;
        }
        else if (!string.IsNullOrEmpty(license.ErrorMessage))
        {
            _statusLabel.Text = license.ErrorMessage;
            _statusLabel.Foreground = _theme.ErrorBrush;
        }
        else
        {
            _statusLabel.Text = "";
        }

        // 機能一覧を更新
        UpdateFeatures(plan);

        // バリデーションメッセージクリア
        _validationMessage.Text = "";
    }

    private void UpdateFeatures(PlanCode plan)
    {
        if (_featuresPanel == null) return;

        var grid = _featuresPanel.Children[0] as Grid;
        if (grid == null) return;

        foreach (UIElement child in grid.Children)
        {
            if (child is TextBlock tb && tb.Tag is string featureKey)
            {
                var feature = _options.Features.FirstOrDefault(f => f.Key == featureKey);
                if (feature == null) continue;

                if (feature.ValueFormatter != null)
                {
                    // 数量表示（例: "3個", "50個", "無制限"）
                    tb.Text = feature.ValueFormatter(plan);
                    tb.Foreground = _theme.TextPrimaryBrush;
                }
                else
                {
                    // ○/× 表示
                    bool available = _licenseManager.CanUseFeature(_options.FeatureMatrix, featureKey);
                    if (available)
                    {
                        tb.Text = feature.AvailableText ?? "○利用可能";
                        tb.Foreground = new SolidColorBrush(_theme.Success);
                    }
                    else
                    {
                        tb.Text = feature.UnavailableText ?? "×STD以上が必要";
                        tb.Foreground = _theme.TextMutedBrush;
                    }
                }
            }
        }
    }

    private void ActivateLicense()
    {
        var email = _emailTextBox.Text?.Trim() ?? string.Empty;
        var key = _keyTextBox.Text?.Trim() ?? string.Empty;

        var (success, message) = _licenseManager.Activate(email, key);

        _validationMessage.Text = message;
        _validationMessage.Foreground = success
            ? new SolidColorBrush(_theme.Success)
            : _theme.ErrorBrush;

        UpdateUI();

        // UpdateUI がメッセージをクリアするので復元
        _validationMessage.Text = message;
        _validationMessage.Foreground = success
            ? new SolidColorBrush(_theme.Success)
            : _theme.ErrorBrush;
    }

    private void ClearLicense()
    {
        _licenseManager.Deactivate();
        _emailTextBox.Text = "";
        _keyTextBox.Text = "";
        UpdateUI();
        _validationMessage.Text = "ライセンスがクリアされました。";
        _validationMessage.Foreground = _theme.TextSecondaryBrush;
    }

    // ── UI ヘルパー ──

    private Border CreateCardBorder()
    {
        return new Border
        {
            Background = _theme.SurfaceBrush,
            BorderBrush = new SolidColorBrush(_theme.Border),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(16),
        };
    }

    private Button CreateButton(string text, bool isPrimary = false, bool isCancel = false)
    {
        var bg = isPrimary
            ? new SolidColorBrush(InsightColors.BrandPrimary)
            : _theme.SurfaceBrush;
        var fg = isPrimary
            ? new SolidColorBrush(Colors.White)
            : _theme.TextPrimaryBrush;
        var borderBrush = isPrimary
            ? new SolidColorBrush(InsightColors.BrandPrimary)
            : new SolidColorBrush(_theme.Border);

        var btn = new Button
        {
            Content = text,
            MinWidth = 90,
            Height = 32,
            Margin = new Thickness(0, 0, 6, 0),
            FontSize = InsightTheme.FontSizeBody,
            FontFamily = InsightTheme.UIFont,
            Cursor = Cursors.Hand,
            IsCancel = isCancel,
            // Use custom template to prevent WPF default chrome from overriding colors
            Template = CreateFlatButtonTemplate(bg, fg, borderBrush),
        };

        return btn;
    }

    private static ControlTemplate CreateFlatButtonTemplate(
        Brush background, Brush foreground, Brush borderBrush)
    {
        var template = new ControlTemplate(typeof(Button));

        var borderFactory = new FrameworkElementFactory(typeof(Border));
        borderFactory.SetValue(Border.BackgroundProperty, background);
        borderFactory.SetValue(Border.BorderBrushProperty, borderBrush);
        borderFactory.SetValue(Border.BorderThicknessProperty, new Thickness(1));
        borderFactory.SetValue(Border.CornerRadiusProperty, new CornerRadius(4));
        borderFactory.SetValue(Border.PaddingProperty, new Thickness(16, 4, 16, 4));

        var contentFactory = new FrameworkElementFactory(typeof(ContentPresenter));
        contentFactory.SetValue(ContentPresenter.HorizontalAlignmentProperty, HorizontalAlignment.Center);
        contentFactory.SetValue(ContentPresenter.VerticalAlignmentProperty, VerticalAlignment.Center);
        contentFactory.SetValue(TextElement.ForegroundProperty, foreground);

        borderFactory.AppendChild(contentFactory);
        template.VisualTree = borderFactory;

        return template;
    }

    private void ApplyTextBoxStyle(TextBox textBox)
    {
        if (_theme.Mode == InsightThemeMode.Dark)
        {
            textBox.Background = _theme.SurfaceBrush;
            textBox.Foreground = _theme.TextPrimaryBrush;
            textBox.BorderBrush = new SolidColorBrush(_theme.Border);
        }
    }
}
