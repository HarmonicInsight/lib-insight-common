using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicTools.AppManager.Models;
using HarmonicTools.AppManager.Services;

namespace HarmonicTools.AppManager;

/// <summary>
/// Harmonic App Manager メインウィンドウ
/// </summary>
public partial class MainWindow : Window
{
    // ── 定数（BuildConstants から参照）──

    private static string TargetFramework => BuildConstants.TargetFramework;
    private static string RuntimeIdentifier => BuildConstants.RuntimeIdentifier;

    // ── フィールド ──

    private enum ActiveTab { Desktop, WebApp, Website, MobileApp }

    private readonly AppConfig _config;
    private readonly CommandRunner _runner = new();
    private AppDefinition? _selectedApp;
    private ActiveTab _activeTab = ActiveTab.Desktop;

    // ── コンストラクタ ──

    public MainWindow()
    {
        InitializeComponent();

        _config = AppConfig.Load();

        _runner.OutputReceived += OnOutputReceived;
        _runner.CommandCompleted += OnCommandCompleted;

        RefreshAppList();
    }

    // ── Title Bar ──

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
            ToggleMaximize();
        else
            DragMove();
    }

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void Maximize_Click(object sender, RoutedEventArgs e) => ToggleMaximize();

    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private void ToggleMaximize()
    {
        WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;
    }

    // ── Tab Switching ──

    private void DesktopTab_Click(object sender, RoutedEventArgs e) => SwitchTab(ActiveTab.Desktop);
    private void WebAppTab_Click(object sender, RoutedEventArgs e) => SwitchTab(ActiveTab.WebApp);
    private void WebSiteTab_Click(object sender, RoutedEventArgs e) => SwitchTab(ActiveTab.Website);
    private void MobileTab_Click(object sender, RoutedEventArgs e) => SwitchTab(ActiveTab.MobileApp);

    private void SwitchTab(ActiveTab tab)
    {
        if (_activeTab == tab) return;
        _activeTab = tab;
        UpdateTabStyles();
        RefreshAppList();
    }

    private void UpdateTabStyles()
    {
        var inactive = (Brush)FindResource("BgSecondaryBrush");
        var inactiveText = (Brush)FindResource("TextSecondaryBrush");
        var active = (Brush)FindResource("PrimaryBrush");

        DesktopTabBtn.Background = _activeTab == ActiveTab.Desktop ? active : inactive;
        DesktopTabBtn.Foreground = _activeTab == ActiveTab.Desktop ? Brushes.White : inactiveText;

        WebAppTabBtn.Background = _activeTab == ActiveTab.WebApp ? active : inactive;
        WebAppTabBtn.Foreground = _activeTab == ActiveTab.WebApp ? Brushes.White : inactiveText;

        WebSiteTabBtn.Background = _activeTab == ActiveTab.Website ? active : inactive;
        WebSiteTabBtn.Foreground = _activeTab == ActiveTab.Website ? Brushes.White : inactiveText;

        MobileTabBtn.Background = _activeTab == ActiveTab.MobileApp ? active : inactive;
        MobileTabBtn.Foreground = _activeTab == ActiveTab.MobileApp ? Brushes.White : inactiveText;
    }

    // ── App List ──

    private void RefreshAppList()
    {
        AppListBox.ItemsSource = null;
        var filtered = _config.Apps
            .Where(a => _activeTab switch
            {
                ActiveTab.Desktop => a.Type == AppType.Desktop,
                ActiveTab.WebApp => a.Type == AppType.WebApp,
                ActiveTab.Website => a.Type == AppType.Website,
                ActiveTab.MobileApp => a.Type == AppType.MobileApp,
                _ => true,
            })
            .ToList();
        AppListBox.ItemsSource = filtered;

        if (filtered.Count > 0 && AppListBox.SelectedIndex < 0)
            AppListBox.SelectedIndex = 0;
    }

    private void AppListBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        _selectedApp = AppListBox.SelectedItem as AppDefinition;
        UpdateAppDetails();

        // Close edit panels on selection change
        CloseAllEditPanels();
        EditToggleBtn.Content = "編集";
    }

    private void UpdateAppDetails()
    {
        EditToggleBtn.Visibility = Visibility.Visible;

        if (_selectedApp == null)
        {
            SelectedAppName.Text = "アプリを選択してください";
            BasePathText.Text = "";
            SolutionPathText.Text = "";
            ProjectPathText.Text = "";
            DebugExeText.Text = "";
            ReleaseExeText.Text = "";
            DesktopPathInfo.Visibility = Visibility.Visible;
            WebPathInfo.Visibility = Visibility.Collapsed;
            MobilePathInfo.Visibility = Visibility.Collapsed;
            DesktopActions.Visibility = Visibility.Visible;
            WebActions.Visibility = Visibility.Collapsed;
            MobileActions.Visibility = Visibility.Collapsed;
            return;
        }

        SelectedAppName.Text = _selectedApp.Name;

        if (_selectedApp.IsMobileApp)
        {
            UpdateMobileAppDetails();
        }
        else if (_selectedApp.IsWebBased)
        {
            UpdateWebAppDetails();
        }
        else
        {
            UpdateDesktopAppDetails();
        }
    }

    private void UpdateDesktopAppDetails()
    {
        DesktopPathInfo.Visibility = Visibility.Visible;
        WebPathInfo.Visibility = Visibility.Collapsed;
        MobilePathInfo.Visibility = Visibility.Collapsed;
        DesktopActions.Visibility = Visibility.Visible;
        WebActions.Visibility = Visibility.Collapsed;
        MobileActions.Visibility = Visibility.Collapsed;

        BasePathText.Text = string.IsNullOrEmpty(_selectedApp!.BasePath) ? "(未設定)" : _selectedApp.BasePath;
        BasePathText.Foreground = string.IsNullOrEmpty(_selectedApp.BasePath)
            ? (Brush)FindResource("ErrorBrush")
            : (Brush)FindResource("TextPrimaryBrush");
        SolutionPathText.Text = _selectedApp.ResolvedSolutionPath;
        ProjectPathText.Text = _selectedApp.ResolvedProjectPath;

        var debugExe = _selectedApp.DebugExePath;
        var releaseExe = _selectedApp.ReleaseExePath;

        DebugExeText.Text = debugExe;
        DebugExeText.Foreground = File.Exists(debugExe)
            ? (Brush)FindResource("SuccessBrush")
            : (Brush)FindResource("TextTertiaryBrush");

        ReleaseExeText.Text = releaseExe;
        ReleaseExeText.Foreground = File.Exists(releaseExe)
            ? (Brush)FindResource("SuccessBrush")
            : (Brush)FindResource("TextTertiaryBrush");
    }

    private void UpdateWebAppDetails()
    {
        DesktopPathInfo.Visibility = Visibility.Collapsed;
        WebPathInfo.Visibility = Visibility.Visible;
        MobilePathInfo.Visibility = Visibility.Collapsed;
        DesktopActions.Visibility = Visibility.Collapsed;
        WebActions.Visibility = Visibility.Visible;
        MobileActions.Visibility = Visibility.Collapsed;

        WebBasePathText.Text = string.IsNullOrEmpty(_selectedApp!.BasePath) ? "(未設定)" : _selectedApp.BasePath;
        WebBasePathText.Foreground = string.IsNullOrEmpty(_selectedApp.BasePath)
            ? (Brush)FindResource("ErrorBrush")
            : (Brush)FindResource("TextPrimaryBrush");
        WebFrameworkText.Text = _selectedApp.Framework;
        WebDevUrlText.Text = _selectedApp.DevUrl;
        WebProductionUrlText.Text = _selectedApp.ProductionUrl;
        WebDevCommandText.Text = _selectedApp.DevCommand;

        // インラインURL表示
        WebDevUrlInline.Text = _selectedApp.DevUrl;
        WebProductionUrlInline.Text = _selectedApp.ProductionUrl;

        // 本番URLがない場合はセクションを非表示
        WebProductionSection.Visibility = string.IsNullOrEmpty(_selectedApp.ProductionUrl)
            ? Visibility.Collapsed
            : Visibility.Visible;
    }

    private void UpdateMobileAppDetails()
    {
        DesktopPathInfo.Visibility = Visibility.Collapsed;
        WebPathInfo.Visibility = Visibility.Collapsed;
        MobilePathInfo.Visibility = Visibility.Visible;
        DesktopActions.Visibility = Visibility.Collapsed;
        WebActions.Visibility = Visibility.Collapsed;
        MobileActions.Visibility = Visibility.Visible;

        MobileBasePathText.Text = string.IsNullOrEmpty(_selectedApp!.BasePath) ? "(未設定)" : _selectedApp.BasePath;
        MobileBasePathText.Foreground = string.IsNullOrEmpty(_selectedApp.BasePath)
            ? (Brush)FindResource("ErrorBrush")
            : (Brush)FindResource("TextPrimaryBrush");
        MobilePlatformText.Text = string.IsNullOrEmpty(_selectedApp.MobilePlatform) ? "(未設定)" : _selectedApp.MobilePlatform;
        MobileFrameworkText.Text = _selectedApp.Framework;
        MobileBundleIdText.Text = _selectedApp.BundleId;
        MobileStoreUrlText.Text = _selectedApp.StoreUrl;

        // インラインURL表示
        MobileStoreUrlInline.Text = _selectedApp.StoreUrl;

        // ストアURLがない場合はセクションを非表示
        MobileStoreSection.Visibility = string.IsNullOrEmpty(_selectedApp.StoreUrl)
            ? Visibility.Collapsed
            : Visibility.Visible;
    }

    private void BasePathText_Click(object sender, MouseButtonEventArgs e)
    {
        if (_selectedApp != null && !string.IsNullOrEmpty(_selectedApp.BasePath))
        {
            OpenDirectoryInExplorer(_selectedApp.BasePath);
        }
    }

    // ── Output ──

    private void OnOutputReceived(string text)
    {
        Dispatcher.Invoke(() => AppendOutput(text));
    }

    private void OnCommandCompleted(bool success, string message)
    {
        Dispatcher.Invoke(() =>
        {
            SetRunning(false);
            UpdateAppDetails();

            // ステータスアイコンを更新
            RefreshStatusIcons();

            if (success)
            {
                StatusText.Text = "完了";
                StatusBadge.Background = (Brush)FindResource("SuccessBrush");
                StatusText.Foreground = Brushes.White;
            }
            else
            {
                StatusText.Text = "失敗";
                StatusBadge.Background = (Brush)FindResource("ErrorBrush");
                StatusText.Foreground = Brushes.White;
            }
        });
    }

    private void AppendOutput(string text)
    {
        OutputBox.AppendText(text);
        OutputBox.ScrollToEnd();
    }

    private void ClearOutput_Click(object sender, RoutedEventArgs e)
    {
        OutputBox.Clear();
    }

    // ── Helpers ──

    private bool ValidateSelection()
    {
        if (_selectedApp == null)
        {
            AppendOutput("[エラー] アプリを選択してください。\n");
            return false;
        }

        if (string.IsNullOrEmpty(_selectedApp.BasePath))
        {
            AppendOutput($"[エラー] {_selectedApp.Name} のリポジトリパスを設定してください（編集ボタンから設定）。\n");
            return false;
        }

        return true;
    }

    private string GetWorkingDir()
    {
        var basePath = _selectedApp?.BasePath ?? "";
        return Directory.Exists(basePath) ? basePath : Environment.CurrentDirectory;
    }

    private void SetRunning(bool running)
    {
        CancelBtn.IsEnabled = running;
        WebCancelBtn.IsEnabled = running;
        MobileCancelBtn.IsEnabled = running;
        if (running)
        {
            StatusText.Text = "実行中...";
            StatusBadge.Background = (Brush)FindResource("PrimaryLightBrush");
            StatusText.Foreground = (Brush)FindResource("PrimaryBrush");
        }
        else
        {
            if (StatusText.Text == "実行中...")
            {
                StatusText.Text = "待機中";
                StatusBadge.Background = (Brush)FindResource("BgSecondaryBrush");
                StatusText.Foreground = (Brush)FindResource("TextSecondaryBrush");
            }
        }
    }

    private void SaveConfig()
    {
        _config.Save();
    }

    private void RefreshStatusIcons()
    {
        var selected = AppListBox.SelectedItem;
        RefreshAppList();
        if (selected != null) AppListBox.SelectedItem = selected;
    }

    /// <summary>
    /// URL をデフォルトブラウザで開く
    /// </summary>
    /// <returns>成功した場合は true</returns>
    private bool OpenUrlInBrowser(string url)
    {
        if (string.IsNullOrEmpty(url)) return false;

        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            return true;
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] ブラウザ起動失敗: {ex.Message}\n");
            return false;
        }
    }

    /// <summary>
    /// ディレクトリをエクスプローラーで開く
    /// </summary>
    /// <returns>成功した場合は true</returns>
    private bool OpenDirectoryInExplorer(string? path)
    {
        if (string.IsNullOrEmpty(path) || !Directory.Exists(path)) return false;

        try
        {
            Process.Start("explorer.exe", path);
            return true;
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] フォルダを開けませんでした: {ex.Message}\n");
            return false;
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        SaveConfig();
        base.OnClosed(e);
    }
}
