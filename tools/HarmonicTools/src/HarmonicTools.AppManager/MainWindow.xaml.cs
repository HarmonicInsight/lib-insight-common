using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicTools.AppManager.Models;
using HarmonicTools.AppManager.Services;
using Microsoft.Win32;

namespace HarmonicTools.AppManager;

public partial class MainWindow : Window
{
    private readonly AppConfig _config;
    private readonly CommandRunner _runner = new();
    private AppDefinition? _selectedApp;

    public MainWindow()
    {
        InitializeComponent();

        _config = AppConfig.Load();
        BasePathBox.Text = _config.Apps.FirstOrDefault()?.BasePath ?? "";

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

    // ── App List ──

    private void RefreshAppList()
    {
        AppListBox.ItemsSource = null;
        AppListBox.ItemsSource = _config.Apps;

        if (_config.Apps.Count > 0 && AppListBox.SelectedIndex < 0)
            AppListBox.SelectedIndex = 0;
    }

    private void AppListBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        _selectedApp = AppListBox.SelectedItem as AppDefinition;
        UpdateAppDetails();

        // Close edit panel on selection change
        EditPanel.Visibility = Visibility.Collapsed;
        EditToggleBtn.Content = "編集";
    }

    private void UpdateAppDetails()
    {
        if (_selectedApp == null)
        {
            SelectedAppName.Text = "アプリを選択してください";
            SolutionPathText.Text = "";
            ProjectPathText.Text = "";
            DebugExeText.Text = "";
            ReleaseExeText.Text = "";
            return;
        }

        _selectedApp.BasePath = BasePathBox.Text.Trim();

        SelectedAppName.Text = _selectedApp.Name;
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

    // ── Base Path ──

    private void BrowseBasePath_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog
        {
            Title = "リポジトリフォルダを選択"
        };

        if (dialog.ShowDialog() == true)
        {
            BasePathBox.Text = dialog.FolderName;
            UpdateAppDetails();
            SaveConfig();
        }
    }

    // ── Build Commands ──

    private async void BuildDebug_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        SetRunning(true);
        await _runner.RunAsync("dotnet", $"build \"{_selectedApp!.ResolvedProjectPath}\"", GetWorkingDir());
    }

    private async void BuildRelease_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        SetRunning(true);
        await _runner.RunAsync("dotnet", $"build \"{_selectedApp!.ResolvedProjectPath}\" -c Release", GetWorkingDir());
    }

    private async void Publish_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        SetRunning(true);
        await _runner.RunAsync("dotnet",
            $"publish \"{_selectedApp!.ResolvedProjectPath}\" -c Release -r win-x64 --self-contained",
            GetWorkingDir());
    }

    private async void Run_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        SetRunning(true);
        await _runner.RunAsync("dotnet", $"run --project \"{_selectedApp!.ResolvedProjectPath}\"", GetWorkingDir());
    }

    private async void Test_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        if (string.IsNullOrEmpty(_selectedApp!.TestProjectPath))
        {
            AppendOutput("[情報] テストプロジェクトが設定されていません。\n");
            return;
        }
        SetRunning(true);
        await _runner.RunAsync("dotnet", $"test \"{_selectedApp!.ResolvedTestProjectPath}\"", GetWorkingDir());
    }

    private async void BuildAll_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        SetRunning(true);
        await _runner.RunAsync("dotnet", $"build \"{_selectedApp!.ResolvedSolutionPath}\"", GetWorkingDir());
    }

    private void OpenFolder_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var dir = Path.GetDirectoryName(_selectedApp.ResolvedProjectPath);
        if (dir != null && Directory.Exists(dir))
        {
            Process.Start("explorer.exe", dir);
        }
        else
        {
            var basePath = BasePathBox.Text.Trim();
            if (Directory.Exists(basePath))
                Process.Start("explorer.exe", basePath);
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        _runner.Cancel();
        SetRunning(false);
    }

    private void ExePath_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is System.Windows.Controls.TextBlock tb && !string.IsNullOrEmpty(tb.Text))
        {
            var dir = Path.GetDirectoryName(tb.Text);
            if (dir != null && Directory.Exists(dir))
                Process.Start("explorer.exe", dir);
        }
    }

    // ── Edit ──

    private void EditToggle_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        if (EditPanel.Visibility == Visibility.Collapsed)
        {
            PopulateEditFields(_selectedApp);
            EditPanel.Visibility = Visibility.Visible;
            EditToggleBtn.Content = "閉じる";
        }
        else
        {
            EditPanel.Visibility = Visibility.Collapsed;
            EditToggleBtn.Content = "編集";
        }
    }

    private bool _suppressAutoFill;

    private void PopulateEditFields(AppDefinition app)
    {
        _suppressAutoFill = true;
        EditName.Text = app.Name;
        EditProductCode.Text = app.ProductCode;
        EditDescription.Text = app.Description;
        EditSolutionPath.Text = app.SolutionPath;
        EditProjectPath.Text = app.ProjectPath;
        EditTestPath.Text = app.TestProjectPath;
        EditExePath.Text = app.ExeRelativePath;
        _suppressAutoFill = false;
    }

    private void EditName_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
    {
        if (_suppressAutoFill) return;

        var name = EditName.Text.Trim();
        if (string.IsNullOrEmpty(name)) return;

        // Generate product code from name (e.g. "HarmonicSheet" -> "HMSH")
        EditProductCode.Text = GenerateProductCode(name);

        // Auto-fill paths using the convention:
        //   Solution:  {Name}.sln
        //   Project:   src/{Name}.App/{Name}.App.csproj
        //   Test:      tests/{Name}.Core.Tests
        //   Exe:       src/{Name}.App/bin/{config}/net8.0-windows/{Name}.App.exe
        EditSolutionPath.Text = $"{name}.sln";
        EditProjectPath.Text = $"src/{name}.App/{name}.App.csproj";
        EditTestPath.Text = $"tests/{name}.Core.Tests";
        EditExePath.Text = $"src/{name}.App/bin/{{config}}/net8.0-windows/{name}.App.exe";
        EditDescription.Text = $"{name} アプリケーション";
    }

    private static string GenerateProductCode(string name)
    {
        // Extract uppercase letters or word starts to make a short code
        // e.g. "HarmonicSheet" -> "HS", then pad to 4 chars -> "HMSH"
        // Strategy: take first 2 chars of each PascalCase word
        var words = new List<string>();
        var current = "";
        foreach (var c in name)
        {
            if (char.IsUpper(c) && current.Length > 0)
            {
                words.Add(current);
                current = c.ToString();
            }
            else
            {
                current += c;
            }
        }
        if (current.Length > 0) words.Add(current);

        if (words.Count == 0) return "NEW";

        // Take first 2 chars of each word, up to 4 chars total
        var code = "";
        var charsPerWord = Math.Max(1, Math.Min(4 / words.Count, 2));
        foreach (var w in words)
        {
            code += w[..Math.Min(charsPerWord, w.Length)];
            if (code.Length >= 4) break;
        }

        return code.ToUpperInvariant().PadRight(4, 'X')[..4];
    }

    private void SaveEdit_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        _selectedApp.Name = EditName.Text.Trim();
        _selectedApp.ProductCode = EditProductCode.Text.Trim();
        _selectedApp.Description = EditDescription.Text.Trim();
        _selectedApp.SolutionPath = EditSolutionPath.Text.Trim();
        _selectedApp.ProjectPath = EditProjectPath.Text.Trim();
        _selectedApp.TestProjectPath = EditTestPath.Text.Trim();
        _selectedApp.ExeRelativePath = EditExePath.Text.Trim();

        SaveConfig();
        UpdateAppDetails();

        var saved = _selectedApp;
        RefreshAppList();
        AppListBox.SelectedItem = saved;

        EditPanel.Visibility = Visibility.Collapsed;
        EditToggleBtn.Content = "編集";

        AppendOutput($"[保存] {_selectedApp.Name} の設定を保存しました。\n");
    }

    // ── Add/Remove ──

    private void AddApp_Click(object sender, RoutedEventArgs e)
    {
        var app = new AppDefinition
        {
            Name = "新規アプリ",
            ProductCode = "NEW",
            Description = "説明を入力",
            BasePath = BasePathBox.Text.Trim()
        };

        _config.Apps.Add(app);
        RefreshAppList();
        AppListBox.SelectedItem = app;
        SaveConfig();

        // Auto-open edit panel for new app
        PopulateEditFields(app);
        EditPanel.Visibility = Visibility.Visible;
        EditToggleBtn.Content = "閉じる";
    }

    private void RemoveApp_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var result = MessageBox.Show(
            $"{_selectedApp.Name} を一覧から削除しますか？",
            "確認", MessageBoxButton.YesNo, MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            _config.Apps.Remove(_selectedApp);
            _selectedApp = null;
            RefreshAppList();
            SaveConfig();
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

        _selectedApp.BasePath = BasePathBox.Text.Trim();

        if (string.IsNullOrEmpty(_selectedApp.BasePath))
        {
            AppendOutput("[エラー] リポジトリパスを設定してください。\n");
            return false;
        }

        return true;
    }

    private string GetWorkingDir()
    {
        var basePath = BasePathBox.Text.Trim();
        return Directory.Exists(basePath) ? basePath : Environment.CurrentDirectory;
    }

    private void SetRunning(bool running)
    {
        CancelBtn.IsEnabled = running;
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
        foreach (var app in _config.Apps)
            app.BasePath = BasePathBox.Text.Trim();
        _config.Save();
    }

    protected override void OnClosed(EventArgs e)
    {
        SaveConfig();
        base.OnClosed(e);
    }
}
