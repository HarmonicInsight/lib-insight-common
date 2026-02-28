using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.Addon;

/// <summary>
/// Settings panel for configuring and monitoring the BotAgent connection to Orchestrator.
/// </summary>
public class BotAgentSettingsPanel : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly BotAgentService _botAgentService;

    private TextBlock _statusText = null!;
    private TextBlock _agentIdText = null!;
    private TextBlock _runningJobsText = null!;
    private TextBlock _openDocsText = null!;
    private Button _connectButton = null!;
    private TextBox _urlTextBox = null!;
    private ListBox _logListBox = null!;

    /// <summary>
    /// Creates a new BotAgentSettingsPanel.
    /// </summary>
    public BotAgentSettingsPanel(AddonManager addonManager, BotAgentService botAgentService)
    {
        _addonManager = addonManager;
        _botAgentService = botAgentService;

        BuildUI();
        SubscribeToEvents();
        UpdateDisplay();
    }

    private void BuildUI()
    {
        var scrollViewer = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Padding = new Thickness(12),
        };

        var mainStack = new StackPanel();

        // ── Connection Settings ──
        mainStack.Children.Add(CreateSectionHeader("接続設定"));

        var urlPanel = new StackPanel { Margin = new Thickness(0, 0, 0, 8) };
        urlPanel.Children.Add(new TextBlock
        {
            Text = "Orchestrator URL:",
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Margin = new Thickness(0, 0, 0, 4),
        });
        _urlTextBox = new TextBox
        {
            Text = "http://localhost:9400",
            Padding = new Thickness(8, 6, 8, 6),
            FontSize = 12,
        };
        urlPanel.Children.Add(_urlTextBox);
        mainStack.Children.Add(urlPanel);

        _connectButton = new Button
        {
            Content = "接続",
            Padding = new Thickness(16, 8, 16, 8),
            HorizontalAlignment = HorizontalAlignment.Left,
            Background = InsightColors.ToBrush(InsightColors.BrandPrimary),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
        };
        _connectButton.Click += OnConnectClick;
        mainStack.Children.Add(_connectButton);

        // ── Status ──
        mainStack.Children.Add(CreateSectionHeader("ステータス"));

        var statusGrid = new Grid { Margin = new Thickness(0, 0, 0, 8) };
        statusGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(100) });
        statusGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        statusGrid.RowDefinitions.Add(new RowDefinition());
        statusGrid.RowDefinitions.Add(new RowDefinition());
        statusGrid.RowDefinitions.Add(new RowDefinition());
        statusGrid.RowDefinitions.Add(new RowDefinition());

        // Status row
        AddStatusRow(statusGrid, 0, "状態:", out _statusText);
        // Agent ID row
        AddStatusRow(statusGrid, 1, "Agent ID:", out _agentIdText);
        // Running Jobs row
        AddStatusRow(statusGrid, 2, "実行中JOB:", out _runningJobsText);
        // Open Documents row
        AddStatusRow(statusGrid, 3, "開いている文書:", out _openDocsText);

        mainStack.Children.Add(statusGrid);

        // ── Log ──
        mainStack.Children.Add(CreateSectionHeader("ログ"));

        _logListBox = new ListBox
        {
            Height = 150,
            FontFamily = new FontFamily("Consolas, Courier New"),
            FontSize = 11,
            Background = new SolidColorBrush(Color.FromRgb(30, 30, 30)),
            Foreground = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
            BorderThickness = new Thickness(1),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
        };
        mainStack.Children.Add(_logListBox);

        var clearButton = new Button
        {
            Content = "ログをクリア",
            Padding = new Thickness(8, 4, 8, 4),
            HorizontalAlignment = HorizontalAlignment.Left,
            Margin = new Thickness(0, 4, 0, 0),
        };
        clearButton.Click += (_, _) => _logListBox.Items.Clear();
        mainStack.Children.Add(clearButton);

        scrollViewer.Content = mainStack;
        Content = scrollViewer;
    }

    private static TextBlock CreateSectionHeader(string text)
    {
        return new TextBlock
        {
            Text = text,
            FontWeight = FontWeights.SemiBold,
            FontSize = 13,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            Margin = new Thickness(0, 8, 0, 4),
        };
    }

    private static void AddStatusRow(Grid grid, int row, string label, out TextBlock valueText)
    {
        var labelBlock = new TextBlock
        {
            Text = label,
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetRow(labelBlock, row);
        Grid.SetColumn(labelBlock, 0);
        grid.Children.Add(labelBlock);

        valueText = new TextBlock
        {
            Text = "-",
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 2, 0, 2),
        };
        Grid.SetRow(valueText, row);
        Grid.SetColumn(valueText, 1);
        grid.Children.Add(valueText);
    }

    private void SubscribeToEvents()
    {
        _botAgentService.ConnectionStatusChanged += OnConnectionStatusChanged;
        _botAgentService.JobStatusChanged += OnJobStatusChanged;
        _botAgentService.LogMessage += OnLogMessage;
    }

    private void OnConnectionStatusChanged(object? sender, AgentConnectionStatus status)
    {
        Dispatcher.Invoke(UpdateDisplay);
    }

    private void OnJobStatusChanged(object? sender, JobStatusEventArgs e)
    {
        Dispatcher.Invoke(UpdateDisplay);
    }

    private void OnLogMessage(object? sender, AgentLogEventArgs e)
    {
        Dispatcher.Invoke(() =>
        {
            var prefix = e.Level switch
            {
                AgentLogEventArgs.LogLevel.Error => "[ERROR] ",
                AgentLogEventArgs.LogLevel.Warning => "[WARN] ",
                AgentLogEventArgs.LogLevel.Debug => "[DEBUG] ",
                _ => "[INFO] ",
            };

            var item = new ListBoxItem
            {
                Content = $"{e.Timestamp:HH:mm:ss} {prefix}{e.Message}",
                Foreground = e.Level switch
                {
                    AgentLogEventArgs.LogLevel.Error => Brushes.Red,
                    AgentLogEventArgs.LogLevel.Warning => Brushes.Yellow,
                    _ => new SolidColorBrush(Color.FromRgb(200, 200, 200)),
                },
            };
            _logListBox.Items.Add(item);
            _logListBox.ScrollIntoView(item);
        });
    }

    private async void OnConnectClick(object sender, RoutedEventArgs e)
    {
        var status = _botAgentService.GetStatus();
        if (status.Connected)
        {
            _connectButton.IsEnabled = false;
            _connectButton.Content = "切断中...";
            await _botAgentService.DisconnectAsync();
            _connectButton.Content = "接続";
            _connectButton.IsEnabled = true;
        }
        else
        {
            _connectButton.IsEnabled = false;
            _connectButton.Content = "接続中...";
            await _botAgentService.ConnectAsync();
            _connectButton.IsEnabled = true;
            UpdateDisplay();
        }
    }

    private void UpdateDisplay()
    {
        var status = _botAgentService.GetStatus();

        _statusText.Text = status.Status switch
        {
            AgentConnectionStatus.Online => "オンライン",
            AgentConnectionStatus.Busy => "ビジー",
            AgentConnectionStatus.Connecting => "接続中...",
            AgentConnectionStatus.Reconnecting => "再接続中...",
            _ => "オフライン",
        };
        _statusText.Foreground = status.Status switch
        {
            AgentConnectionStatus.Online => new SolidColorBrush(Color.FromRgb(22, 163, 74)),
            AgentConnectionStatus.Busy => new SolidColorBrush(Color.FromRgb(234, 179, 8)),
            AgentConnectionStatus.Connecting or AgentConnectionStatus.Reconnecting => new SolidColorBrush(Color.FromRgb(59, 130, 246)),
            _ => InsightColors.ToBrush(InsightColors.Light.TextSecondary),
        };

        _agentIdText.Text = string.IsNullOrEmpty(status.AgentId) ? "-" : status.AgentId;
        _runningJobsText.Text = status.RunningJobs.ToString(CultureInfo.InvariantCulture);
        _openDocsText.Text = status.OpenDocuments.Count.ToString(CultureInfo.InvariantCulture);

        _connectButton.Content = status.Connected ? "切断" : "接続";
        _urlTextBox.IsEnabled = !status.Connected;
    }
}
