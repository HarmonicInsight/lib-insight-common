using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.Addon;

/// <summary>
/// アドイン管理画面（InsightOffice 全アプリ共通）
///
/// モジュール一覧を表示し、ユーザーが有効/無効を切り替える UI。
/// 管理者プロファイルによるロック状態も表示する。
///
/// 使用例:
/// <code>
/// var panel = new AddonSettingsPanel(addonManager);
/// var window = new Window
/// {
///     Title = "アドイン管理",
///     Content = panel,
///     Width = 600,
///     Height = 500,
/// };
/// window.ShowDialog();
/// </code>
/// </summary>
public class AddonSettingsPanel : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly StackPanel _moduleList;

    public AddonSettingsPanel(AddonManager addonManager)
    {
        _addonManager = addonManager;

        var rootPanel = new Grid
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Background),
        };

        var scrollViewer = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Padding = new Thickness(24),
        };

        var contentPanel = new StackPanel { Orientation = Orientation.Vertical };

        // ヘッダー
        var header = new TextBlock
        {
            Text = "アドイン管理",
            FontSize = 20,
            FontWeight = FontWeights.Bold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            Margin = new Thickness(0, 0, 0, 8),
        };
        contentPanel.Children.Add(header);

        // 管理者プロファイル表示
        if (_addonManager.HasAdminProfile)
        {
            var profileBanner = CreateAdminProfileBanner();
            contentPanel.Children.Add(profileBanner);
        }

        var description = new TextBlock
        {
            Text = "モジュールの有効/無効を切り替えて、必要な機能だけを利用できます。",
            FontSize = 13,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Margin = new Thickness(0, 0, 0, 20),
            TextWrapping = TextWrapping.Wrap,
        };
        contentPanel.Children.Add(description);

        // モジュール一覧
        _moduleList = new StackPanel { Orientation = Orientation.Vertical };
        contentPanel.Children.Add(_moduleList);

        scrollViewer.Content = contentPanel;
        rootPanel.Children.Add(scrollViewer);
        Content = rootPanel;

        RefreshModuleList();
    }

    /// <summary>モジュール一覧を再描画</summary>
    public void RefreshModuleList()
    {
        _moduleList.Children.Clear();

        var viewModels = _addonManager.GetAllModuleViewModels();
        foreach (var vm in viewModels)
        {
            _moduleList.Children.Add(CreateModuleCard(vm));
        }
    }

    private Border CreateModuleCard(AddonModuleViewModel vm)
    {
        var card = new Border
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Surface),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Margin = new Thickness(0, 0, 0, 8),
            Padding = new Thickness(16),
        };

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        // 左側: モジュール情報
        var infoPanel = new StackPanel { VerticalAlignment = VerticalAlignment.Center };

        var namePanel = new StackPanel { Orientation = Orientation.Horizontal };

        // カラーインジケーター
        var indicator = new Border
        {
            Width = 4,
            Height = 20,
            CornerRadius = new CornerRadius(2),
            Background = new SolidColorBrush(InsightColors.FromHex(vm.Info.ThemeColor)),
            Margin = new Thickness(0, 0, 8, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        namePanel.Children.Add(indicator);

        var nameText = new TextBlock
        {
            Text = vm.Info.NameJa,
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(
                vm.PlanAllowed ? InsightColors.Light.TextPrimary : InsightColors.Light.TextTertiary),
        };
        namePanel.Children.Add(nameText);

        // Extension バッジ
        if (vm.Info.Distribution == AddonDistributionType.Extension)
        {
            var badge = new Border
            {
                Background = InsightColors.ToBrush(InsightColors.Light.SurfaceSecondary),
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(6, 2, 6, 2),
                Margin = new Thickness(8, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                Child = new TextBlock
                {
                    Text = "拡張",
                    FontSize = 11,
                    Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
                },
            };
            namePanel.Children.Add(badge);
        }

        infoPanel.Children.Add(namePanel);

        var descText = new TextBlock
        {
            Text = vm.Info.DescriptionJa,
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Margin = new Thickness(12, 4, 0, 0),
            TextWrapping = TextWrapping.Wrap,
        };
        infoPanel.Children.Add(descText);

        // ステータスメッセージ
        if (!string.IsNullOrEmpty(vm.StatusMessage))
        {
            var statusText = new TextBlock
            {
                Text = vm.StatusMessage,
                FontSize = 11,
                Foreground = InsightColors.ToBrush(
                    vm.LockedEnabled || vm.LockedDisabled
                        ? InsightColors.Light.Warning
                        : InsightColors.Light.TextTertiary),
                Margin = new Thickness(12, 2, 0, 0),
                FontStyle = FontStyles.Italic,
            };
            infoPanel.Children.Add(statusText);
        }

        Grid.SetColumn(infoPanel, 0);
        grid.Children.Add(infoPanel);

        // 右側: トグルスイッチ
        var togglePanel = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Right,
        };

        var toggleSwitch = new CheckBox
        {
            IsChecked = vm.IsEnabled,
            IsEnabled = vm.CanToggle && vm.DependenciesMet,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(16, 0, 0, 0),
        };

        var moduleId = vm.ModuleId;
        toggleSwitch.Checked += (_, _) => OnModuleToggled(moduleId, true);
        toggleSwitch.Unchecked += (_, _) => OnModuleToggled(moduleId, false);

        togglePanel.Children.Add(toggleSwitch);

        Grid.SetColumn(togglePanel, 1);
        grid.Children.Add(togglePanel);

        card.Child = grid;
        return card;
    }

    private Border CreateAdminProfileBanner()
    {
        var banner = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(20, 184, 148, 47)),
            BorderBrush = InsightColors.ToBrush(InsightColors.BrandPrimary),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(12, 8, 12, 8),
            Margin = new Thickness(0, 0, 0, 12),
        };

        var panel = new StackPanel { Orientation = Orientation.Horizontal };

        var icon = new TextBlock
        {
            Text = "\uE8D7", // Shield icon
            FontFamily = new FontFamily("Segoe Fluent Icons"),
            FontSize = 16,
            Foreground = InsightColors.ToBrush(InsightColors.BrandPrimary),
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 8, 0),
        };
        panel.Children.Add(icon);

        var text = new TextBlock
        {
            Text = $"管理者プロファイル適用中: {_addonManager.AdminProfileName}",
            FontSize = 13,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        panel.Children.Add(text);

        banner.Child = panel;
        return banner;
    }

    private void OnModuleToggled(string moduleId, bool enabled)
    {
        if (enabled)
        {
            var result = _addonManager.EnableModule(moduleId);
            if (!result.Success)
            {
                MessageBox.Show(result.Message, "アドイン管理", MessageBoxButton.OK, MessageBoxImage.Warning);
                RefreshModuleList();
                return;
            }
        }
        else
        {
            var result = _addonManager.DisableModule(moduleId);
            if (!result.Success)
            {
                MessageBox.Show(result.Message, "アドイン管理", MessageBoxButton.OK, MessageBoxImage.Warning);
                RefreshModuleList();
                return;
            }
        }

        // 依存関係の変更で他のモジュールの状態も変わる可能性があるため全体更新
        RefreshModuleList();
    }
}
