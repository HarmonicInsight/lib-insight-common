using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通パネルスタイル
///
/// コードベースでパネルの共通UIコンポーネントを生成。
/// XAMLリソースディクショナリと併用可能。
/// </summary>
public static class InsightPanelStyles
{
    // ═══════════════════════════════════════════════════════════════
    // パネルヘッダー生成
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 標準パネルヘッダーを生成
    /// </summary>
    /// <param name="definition">パネル定義</param>
    /// <param name="theme">テーマ</param>
    /// <param name="useEmoji">絵文字アイコンを使用（falseの場合はSegoe MDL2）</param>
    /// <param name="rightButtons">右側に配置するボタン（オプション）</param>
    public static Border CreatePanelHeader(
        PanelDefinition definition,
        InsightTheme theme,
        bool useEmoji = true,
        params Button[] rightButtons)
    {
        var header = new Border
        {
            Background = theme.SurfaceSecondaryBrush,
            Padding = new Thickness(12, 8, 12, 8),
            BorderBrush = theme.BorderBrush,
            BorderThickness = new Thickness(0, 0, 0, 1),
        };

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        // アイコン + タイトル
        var titlePanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var icon = new TextBlock
        {
            Text = useEmoji ? definition.IconEmoji : definition.IconMdl2,
            FontFamily = useEmoji ? null : new FontFamily(InsightIcons.FontFamily),
            FontSize = useEmoji ? 16 : 14,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 8, 0),
        };
        titlePanel.Children.Add(icon);

        var title = new TextBlock
        {
            Text = definition.NameJa,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            Foreground = theme.TextPrimaryBrush,
            VerticalAlignment = VerticalAlignment.Center,
        };
        titlePanel.Children.Add(title);

        Grid.SetColumn(titlePanel, 0);
        grid.Children.Add(titlePanel);

        // 右側ボタン
        if (rightButtons.Length > 0)
        {
            var buttonPanel = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right,
            };

            foreach (var btn in rightButtons)
            {
                btn.Margin = new Thickness(4, 0, 0, 0);
                buttonPanel.Children.Add(btn);
            }

            Grid.SetColumn(buttonPanel, 2);
            grid.Children.Add(buttonPanel);
        }

        header.Child = grid;
        return header;
    }

    /// <summary>
    /// パネル用小型ボタンを生成
    /// </summary>
    public static Button CreatePanelButton(
        string text,
        InsightTheme theme,
        ICommand? command = null,
        string? tooltip = null,
        bool isPrimary = false)
    {
        var btn = new Button
        {
            Content = text,
            Padding = new Thickness(8, 4, 8, 4),
            FontSize = 12,
            Background = isPrimary ? theme.PrimaryBrush : Brushes.Transparent,
            Foreground = isPrimary ? theme.PrimaryContrastBrush : theme.TextPrimaryBrush,
            BorderBrush = isPrimary ? theme.PrimaryBrush : theme.BorderBrush,
            BorderThickness = new Thickness(1),
            Cursor = Cursors.Hand,
        };

        if (command != null)
            btn.Command = command;

        if (!string.IsNullOrEmpty(tooltip))
            btn.ToolTip = tooltip;

        return btn;
    }

    /// <summary>
    /// パネル用アイコンボタンを生成
    /// </summary>
    public static Button CreateIconButton(
        string iconMdl2,
        InsightTheme theme,
        ICommand? command = null,
        string? tooltip = null)
    {
        var btn = new Button
        {
            Content = new TextBlock
            {
                Text = iconMdl2,
                FontFamily = new FontFamily(InsightIcons.FontFamily),
                FontSize = 14,
            },
            Width = 28,
            Height = 28,
            Padding = new Thickness(0),
            Background = Brushes.Transparent,
            Foreground = theme.TextPrimaryBrush,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            VerticalContentAlignment = VerticalAlignment.Center,
            HorizontalContentAlignment = HorizontalAlignment.Center,
        };

        if (command != null)
            btn.Command = command;

        if (!string.IsNullOrEmpty(tooltip))
            btn.ToolTip = tooltip;

        return btn;
    }

    // ═══════════════════════════════════════════════════════════════
    // パネルリサイズThumb
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// パネルリサイズ用Thumbを生成
    /// </summary>
    /// <param name="panelId">パネルID（Tag用）</param>
    /// <param name="theme">テーマ</param>
    public static Thumb CreateResizeThumb(string panelId, InsightTheme theme)
    {
        var thumb = new Thumb
        {
            Width = 5,
            HorizontalAlignment = HorizontalAlignment.Left,
            Cursor = Cursors.SizeWE,
            Background = Brushes.Transparent,
            Tag = panelId,
        };

        // ホバー時に線を表示
        thumb.MouseEnter += (s, e) =>
            ((Thumb)s!).Background = theme.BorderBrush;
        thumb.MouseLeave += (s, e) =>
            ((Thumb)s!).Background = Brushes.Transparent;

        return thumb;
    }

    // ═══════════════════════════════════════════════════════════════
    // ツールバーパネルトグルボタン
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// ツールバー用パネルトグルボタンを生成
    /// </summary>
    public static Button CreateToolbarToggleButton(
        PanelDefinition definition,
        PanelViewModelBase viewModel,
        InsightTheme theme,
        bool useEmoji = true)
    {
        var btn = new Button
        {
            Width = 36,
            Height = 32,
            Padding = new Thickness(0),
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            ToolTip = $"{definition.NameJa}の表示/非表示",
            Command = viewModel.ToggleCommand,
        };

        var content = new TextBlock
        {
            Text = useEmoji ? definition.IconEmoji : definition.IconMdl2,
            FontFamily = useEmoji ? null : new FontFamily(InsightIcons.FontFamily),
            FontSize = useEmoji ? 16 : 14,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };

        // Opacityバインディング（IsOpen状態を反映）
        content.SetBinding(UIElement.OpacityProperty,
            new System.Windows.Data.Binding(nameof(viewModel.Opacity))
            {
                Source = viewModel,
                Mode = System.Windows.Data.BindingMode.OneWay,
            });

        btn.Content = content;
        return btn;
    }

    // ═══════════════════════════════════════════════════════════════
    // パネル背景色（パネルタイプ別）
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// パネルタイプ別のヘッダー背景色を取得
    /// </summary>
    public static SolidColorBrush GetPanelHeaderBackground(string panelId)
    {
        return panelId switch
        {
            "ai" or "chat" => new SolidColorBrush(InsightColors.FromHex("#F3E5F5")),      // 紫
            "reference" => new SolidColorBrush(InsightColors.FromHex("#E8F5E9")),          // 緑
            "history" or "changeLog" => new SolidColorBrush(InsightColors.Light.SurfaceSecondary),
            "board" => new SolidColorBrush(InsightColors.FromHex("#FFF8E1")),              // ゴールド
            "python" => new SolidColorBrush(InsightColors.FromHex("#E3F2FD")),             // 青
            _ => new SolidColorBrush(InsightColors.Light.SurfaceSecondary),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // チャットメッセージスタイル
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// チャットメッセージの背景色を取得
    /// </summary>
    public static SolidColorBrush GetChatMessageBackground(string role)
    {
        return role.ToLowerInvariant() switch
        {
            "user" => new SolidColorBrush(InsightColors.FromHex("#E3F2FD")),      // 青
            "assistant" => new SolidColorBrush(InsightColors.FromHex("#F3E5F5")), // 紫
            "system" => new SolidColorBrush(InsightColors.Light.SurfaceSecondary),
            _ => new SolidColorBrush(Colors.White),
        };
    }

    /// <summary>
    /// チャットメッセージのコーナー半径を取得
    /// </summary>
    public static CornerRadius GetChatMessageCornerRadius(string role)
    {
        return role.ToLowerInvariant() switch
        {
            "user" => new CornerRadius(8, 8, 0, 8),      // 右下が角
            "assistant" => new CornerRadius(8, 8, 8, 0), // 左下が角
            _ => new CornerRadius(8),
        };
    }

    /// <summary>
    /// チャットメッセージの配置を取得
    /// </summary>
    public static HorizontalAlignment GetChatMessageAlignment(string role)
    {
        return role.ToLowerInvariant() switch
        {
            "user" => HorizontalAlignment.Right,
            "assistant" => HorizontalAlignment.Left,
            _ => HorizontalAlignment.Center,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 状態別行背景色
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 変更状態の行背景色を取得（Sheet/Doc/Slide共通）
    /// </summary>
    public static SolidColorBrush GetStatusRowBackground(string status)
    {
        return status.ToLowerInvariant() switch
        {
            "edited" or "modified" or "changed" => new SolidColorBrush(InsightColors.FromHex("#E3F2FD")),    // 青
            "added" or "inserted" => new SolidColorBrush(InsightColors.FromHex("#E8F5E9")),                  // 緑
            "deleted" or "removed" => new SolidColorBrush(InsightColors.FromHex("#FFEBEE")),                 // 赤
            "ai_suggested" or "suggestion" => new SolidColorBrush(InsightColors.FromHex("#FEE2B3")),         // オレンジ
            "ai_applied" => new SolidColorBrush(InsightColors.FromHex("#C8E6C9")),                           // 薄緑
            "compare_changed" => new SolidColorBrush(InsightColors.FromHex("#FFFDE7")),                      // 黄
            "compare_left_only" => new SolidColorBrush(InsightColors.FromHex("#FFEBEE")),                    // 赤
            "compare_right_only" => new SolidColorBrush(InsightColors.FromHex("#E8F5E9")),                   // 緑
            _ => new SolidColorBrush(Colors.Transparent),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // ライセンスアップグレード促進パネル
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// アップグレード促進パネルを生成
    /// </summary>
    public static Border CreateUpgradePrompt(
        PanelDefinition definition,
        InsightTheme theme,
        Action onUpgradeClick)
    {
        var panel = new Border
        {
            Background = new SolidColorBrush(InsightColors.FromHex("#FFF8E1")),
            BorderBrush = theme.BorderBrush,
            BorderThickness = new Thickness(1),
            Padding = new Thickness(16),
            Margin = new Thickness(12),
            CornerRadius = new CornerRadius(8),
        };

        var stack = new StackPanel();

        var icon = new TextBlock
        {
            Text = InsightIcons.Shield,
            FontFamily = new FontFamily(InsightIcons.FontFamily),
            FontSize = 24,
            Foreground = theme.PrimaryBrush,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 8),
        };
        stack.Children.Add(icon);

        var title = new TextBlock
        {
            Text = $"{definition.NameJa}はPRO以上で利用可能です",
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            Foreground = theme.TextPrimaryBrush,
            TextAlignment = TextAlignment.Center,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 8),
        };
        stack.Children.Add(title);

        var desc = new TextBlock
        {
            Text = "プランをアップグレードしてすべての機能をお使いください",
            FontSize = 12,
            Foreground = theme.TextSecondaryBrush,
            TextAlignment = TextAlignment.Center,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 12),
        };
        stack.Children.Add(desc);

        var upgradeBtn = new Button
        {
            Content = "アップグレード",
            Padding = new Thickness(16, 8, 16, 8),
            Background = theme.PrimaryBrush,
            Foreground = theme.PrimaryContrastBrush,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            HorizontalAlignment = HorizontalAlignment.Center,
        };
        upgradeBtn.Click += (s, e) => onUpgradeClick();
        stack.Children.Add(upgradeBtn);

        panel.Child = stack;
        return panel;
    }
}
