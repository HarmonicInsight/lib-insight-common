using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.Addon;

/// <summary>
/// InsightBot Agent 設定・ステータスパネル（WPF UserControl）
///
/// addon-modules.ts の settingsSchema に対応:
///   - orchestrator_url:    Orchestrator URL
///   - auto_connect:        自動接続
///   - display_name:        Agent 表示名
///   - heartbeat_interval:  ハートビート間隔（秒）
///   - max_concurrent_jobs: 最大同時実行 JOB 数
///
/// 使用例:
/// <code>
/// var panel = new BotAgentSettingsPanel(addonManager, botAgentService);
/// addonPanelHost.RegisterPanel("bot_agent", panel);
/// </code>
/// </summary>
public class BotAgentSettingsPanel : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly BotAgentService _agentService;

    // 設定入力コントロール
    private readonly TextBox _urlTextBox;
    private readonly TextBox _displayNameTextBox;
    private readonly CheckBox _autoConnectCheckBox;
    private readonly TextBox _heartbeatTextBox;
    private readonly TextBox _maxJobsTextBox;

    // ステータス表示コントロール
    private readonly Border _statusIndicator;
    private readonly TextBlock _statusText;
    private readonly TextBlock _agentIdText;
    private readonly TextBlock _runningJobsText;
    private readonly TextBlock _openDocsText;
    private readonly Button _connectButton;
    private readonly Button _disconnectButton;
    private readonly StackPanel _logPanel;

    public BotAgentSettingsPanel(AddonManager addonManager, BotAgentService agentService)
    {
        _addonManager = addonManager;
        _agentService = agentService;

        var root = new Grid
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Background),
        };

        var scrollViewer = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Padding = new Thickness(20),
        };

        var content = new StackPanel { Orientation = Orientation.Vertical };

        // ── ヘッダー ──
        var headerPanel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 16) };

        var colorIndicator = new Border
        {
            Width = 4,
            Height = 24,
            CornerRadius = new CornerRadius(2),
            Background = new SolidColorBrush(InsightColors.FromHex("#6366F1")),
            Margin = new Thickness(0, 0, 10, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        headerPanel.Children.Add(colorIndicator);

        var headerText = new TextBlock
        {
            Text = "InsightBot Agent",
            FontSize = 18,
            FontWeight = FontWeights.Bold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        headerPanel.Children.Add(headerText);
        content.Children.Add(headerPanel);

        // ── 接続ステータスカード ──
        var statusCard = CreateCard();
        var statusContent = new StackPanel();

        var statusHeader = CreateSectionHeader("接続ステータス");
        statusContent.Children.Add(statusHeader);

        var statusRow = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 8, 0, 0) };

        _statusIndicator = new Border
        {
            Width = 12,
            Height = 12,
            CornerRadius = new CornerRadius(6),
            Background = InsightColors.ToBrush(InsightColors.Light.TextTertiary),
            Margin = new Thickness(0, 0, 8, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        statusRow.Children.Add(_statusIndicator);

        _statusText = new TextBlock
        {
            Text = "未接続",
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        statusRow.Children.Add(_statusText);
        statusContent.Children.Add(statusRow);

        _agentIdText = CreateInfoLabel("Agent ID: -");
        statusContent.Children.Add(_agentIdText);

        _runningJobsText = CreateInfoLabel("実行中 JOB: 0");
        statusContent.Children.Add(_runningJobsText);

        _openDocsText = CreateInfoLabel("開いているドキュメント: 0");
        statusContent.Children.Add(_openDocsText);

        // 接続/切断ボタン
        var buttonPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = new Thickness(0, 12, 0, 0),
        };

        _connectButton = CreateButton("接続", InsightColors.FromHex("#6366F1"), OnConnectClicked);
        buttonPanel.Children.Add(_connectButton);

        _disconnectButton = CreateButton("切断", InsightColors.Light.Error, OnDisconnectClicked);
        _disconnectButton.Margin = new Thickness(8, 0, 0, 0);
        _disconnectButton.IsEnabled = false;
        buttonPanel.Children.Add(_disconnectButton);

        statusContent.Children.Add(buttonPanel);
        statusCard.Child = statusContent;
        content.Children.Add(statusCard);

        // ── 接続設定カード ──
        var settingsCard = CreateCard();
        var settingsContent = new StackPanel();

        settingsContent.Children.Add(CreateSectionHeader("接続設定"));

        // Orchestrator URL
        settingsContent.Children.Add(CreateFieldLabel("Orchestrator URL"));
        _urlTextBox = CreateTextBox(
            _addonManager.GetModuleSetting<string>("bot_agent", "orchestrator_url", "") ?? "");
        _urlTextBox.Tag = "orchestrator_url";
        _urlTextBox.LostFocus += OnSettingChanged;
        settingsContent.Children.Add(_urlTextBox);

        var urlHint = new TextBlock
        {
            Text = "例: ws://192.168.1.100:9400/ws/agent",
            FontSize = 11,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextTertiary),
            Margin = new Thickness(0, 2, 0, 8),
        };
        settingsContent.Children.Add(urlHint);

        // Agent 表示名
        settingsContent.Children.Add(CreateFieldLabel("Agent 表示名"));
        _displayNameTextBox = CreateTextBox(
            _addonManager.GetModuleSetting<string>("bot_agent", "display_name", "") ?? "");
        _displayNameTextBox.Tag = "display_name";
        _displayNameTextBox.LostFocus += OnSettingChanged;
        settingsContent.Children.Add(_displayNameTextBox);

        var nameHint = new TextBlock
        {
            Text = $"空欄の場合: {Environment.MachineName}",
            FontSize = 11,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextTertiary),
            Margin = new Thickness(0, 2, 0, 8),
        };
        settingsContent.Children.Add(nameHint);

        // 自動接続
        _autoConnectCheckBox = new CheckBox
        {
            Content = "アプリ起動時に Orchestrator へ自動接続",
            IsChecked = _addonManager.GetModuleSetting<bool>("bot_agent", "auto_connect", false),
            FontSize = 13,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            Margin = new Thickness(0, 4, 0, 8),
        };
        _autoConnectCheckBox.Checked += (_, _) =>
            _addonManager.UpdateModuleSetting("bot_agent", "auto_connect", true);
        _autoConnectCheckBox.Unchecked += (_, _) =>
            _addonManager.UpdateModuleSetting("bot_agent", "auto_connect", false);
        settingsContent.Children.Add(_autoConnectCheckBox);

        // ハートビート間隔
        settingsContent.Children.Add(CreateFieldLabel("ハートビート間隔（秒）"));
        _heartbeatTextBox = CreateTextBox(
            _addonManager.GetModuleSetting<int>("bot_agent", "heartbeat_interval", 30).ToString(CultureInfo.InvariantCulture));
        _heartbeatTextBox.Tag = "heartbeat_interval";
        _heartbeatTextBox.Width = 80;
        _heartbeatTextBox.HorizontalAlignment = HorizontalAlignment.Left;
        _heartbeatTextBox.LostFocus += OnNumericSettingChanged;
        settingsContent.Children.Add(_heartbeatTextBox);

        // 最大同時実行 JOB 数
        settingsContent.Children.Add(CreateFieldLabel("最大同時実行 JOB 数"));
        _maxJobsTextBox = CreateTextBox(
            _addonManager.GetModuleSetting<int>("bot_agent", "max_concurrent_jobs", 1).ToString(CultureInfo.InvariantCulture));
        _maxJobsTextBox.Tag = "max_concurrent_jobs";
        _maxJobsTextBox.Width = 80;
        _maxJobsTextBox.HorizontalAlignment = HorizontalAlignment.Left;
        _maxJobsTextBox.LostFocus += OnNumericSettingChanged;
        settingsContent.Children.Add(_maxJobsTextBox);

        settingsCard.Child = settingsContent;
        content.Children.Add(settingsCard);

        // ── ログカード ──
        var logCard = CreateCard();
        var logContent = new StackPanel();
        logContent.Children.Add(CreateSectionHeader("Agent ログ"));

        _logPanel = new StackPanel { Orientation = Orientation.Vertical };
        var logScroll = new ScrollViewer
        {
            MaxHeight = 200,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = _logPanel,
            Margin = new Thickness(0, 8, 0, 0),
        };
        logContent.Children.Add(logScroll);

        logCard.Child = logContent;
        content.Children.Add(logCard);

        scrollViewer.Content = content;
        root.Children.Add(scrollViewer);
        Content = root;

        // イベント購読
        _agentService.ConnectionStatusChanged += OnConnectionStatusChanged;
        _agentService.JobStatusChanged += OnJobStatusChanged;
        _agentService.LogMessage += OnLogMessage;

        UpdateStatusDisplay();
    }

    // =========================================================================
    // イベントハンドラ
    // =========================================================================

    private async void OnConnectClicked(object sender, RoutedEventArgs e)
    {
        var url = _urlTextBox.Text.Trim();
        if (string.IsNullOrEmpty(url))
        {
            url = "ws://localhost:9400/ws/agent";
            _urlTextBox.Text = url;
            _addonManager.UpdateModuleSetting("bot_agent", "orchestrator_url", url);
        }

        var displayName = _displayNameTextBox.Text.Trim();
        if (string.IsNullOrEmpty(displayName))
        {
            displayName = Environment.MachineName;
        }

        _connectButton.IsEnabled = false;
        _connectButton.Content = "接続中...";

        var result = await _agentService.ConnectAsync(url, displayName);

        if (!result.Connected)
        {
            MessageBox.Show(
                $"Orchestrator への接続に失敗しました。\n\n{result.Error}",
                "InsightBot Agent",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }

        _connectButton.Content = "接続";
        UpdateStatusDisplay();
    }

    private async void OnDisconnectClicked(object sender, RoutedEventArgs e)
    {
        await _agentService.DisconnectAsync();
        UpdateStatusDisplay();
    }

    private void OnSettingChanged(object sender, RoutedEventArgs e)
    {
        if (sender is TextBox textBox && textBox.Tag is string key)
        {
            _addonManager.UpdateModuleSetting("bot_agent", key, textBox.Text.Trim());
        }
    }

    private void OnNumericSettingChanged(object sender, RoutedEventArgs e)
    {
        if (sender is TextBox textBox && textBox.Tag is string key)
        {
            if (int.TryParse(textBox.Text.Trim(), out var value) && value > 0)
            {
                _addonManager.UpdateModuleSetting("bot_agent", key, value);
            }
            else
            {
                // 不正値の場合はデフォルトに戻す
                var defaultValue = key == "heartbeat_interval" ? 30 : 1;
                textBox.Text = defaultValue.ToString(CultureInfo.InvariantCulture);
                _addonManager.UpdateModuleSetting("bot_agent", key, defaultValue);
            }
        }
    }

    private void OnConnectionStatusChanged(object? sender, AgentConnectionStatus status)
    {
        Dispatcher.Invoke(UpdateStatusDisplay);
    }

    private void OnJobStatusChanged(object? sender, JobStatusEventArgs e)
    {
        Dispatcher.Invoke(UpdateStatusDisplay);
    }

    private void OnLogMessage(object? sender, AgentLogEventArgs e)
    {
        Dispatcher.Invoke(() =>
        {
            var logEntry = new TextBlock
            {
                Text = $"[{e.Timestamp:HH:mm:ss}] [{e.Level.ToUpperInvariant()}] {e.Message}",
                FontSize = 11,
                FontFamily = new FontFamily("Consolas, Courier New"),
                Foreground = InsightColors.ToBrush(e.Level switch
                {
                    "error" => InsightColors.Light.Error,
                    "warn" => InsightColors.Light.Warning,
                    "debug" => InsightColors.Light.TextTertiary,
                    _ => InsightColors.Light.TextSecondary,
                }),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 1, 0, 1),
            };

            _logPanel.Children.Add(logEntry);

            // ログ行数制限（直近100行）
            while (_logPanel.Children.Count > 100)
                _logPanel.Children.RemoveAt(0);
        });
    }

    // =========================================================================
    // UI 更新
    // =========================================================================

    private void UpdateStatusDisplay()
    {
        var status = _agentService.GetStatus();

        // ステータスインジケーター色
        _statusIndicator.Background = InsightColors.ToBrush(status.Status switch
        {
            AgentConnectionStatus.Online => InsightColors.Light.Success,
            AgentConnectionStatus.Busy => InsightColors.Light.Warning,
            AgentConnectionStatus.Connecting or AgentConnectionStatus.Reconnecting => InsightColors.Light.Info,
            _ => InsightColors.Light.TextTertiary,
        });

        _statusText.Text = status.Status switch
        {
            AgentConnectionStatus.Online => "接続中",
            AgentConnectionStatus.Busy => "実行中",
            AgentConnectionStatus.Connecting => "接続中...",
            AgentConnectionStatus.Reconnecting => "再接続中...",
            _ => "未接続",
        };

        _agentIdText.Text = status.Connected
            ? $"Agent ID: {status.AgentId}"
            : "Agent ID: -";

        _runningJobsText.Text = $"実行中 JOB: {status.RunningJobs}";
        _openDocsText.Text = $"開いているドキュメント: {status.OpenDocuments.Count}";

        _connectButton.IsEnabled = !status.Connected;
        _disconnectButton.IsEnabled = status.Connected;
    }

    // =========================================================================
    // UI ヘルパー
    // =========================================================================

    private static Border CreateCard()
    {
        return new Border
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Surface),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(16),
            Margin = new Thickness(0, 0, 0, 12),
        };
    }

    private static TextBlock CreateSectionHeader(string text)
    {
        return new TextBlock
        {
            Text = text,
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
        };
    }

    private static TextBlock CreateFieldLabel(string text)
    {
        return new TextBlock
        {
            Text = text,
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Margin = new Thickness(0, 8, 0, 4),
        };
    }

    private static TextBlock CreateInfoLabel(string text)
    {
        return new TextBlock
        {
            Text = text,
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Margin = new Thickness(20, 4, 0, 0),
        };
    }

    private static TextBox CreateTextBox(string initialValue)
    {
        return new TextBox
        {
            Text = initialValue,
            FontSize = 13,
            Padding = new Thickness(8, 6, 8, 6),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
            Background = InsightColors.ToBrush(InsightColors.Light.Surface),
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
        };
    }

    private static Button CreateButton(string text, Color bgColor, RoutedEventHandler clickHandler)
    {
        var button = new Button
        {
            Content = text,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Colors.White),
            Background = new SolidColorBrush(bgColor),
            BorderThickness = new Thickness(0),
            Padding = new Thickness(16, 8, 16, 8),
            Cursor = System.Windows.Input.Cursors.Hand,
        };
        button.Click += clickHandler;
        return button;
    }
}
