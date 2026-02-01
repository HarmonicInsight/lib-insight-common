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
            BasePathText.Text = "";
            SolutionPathText.Text = "";
            ProjectPathText.Text = "";
            DebugExeText.Text = "";
            ReleaseExeText.Text = "";
            return;
        }

        SelectedAppName.Text = _selectedApp.Name;
        BasePathText.Text = string.IsNullOrEmpty(_selectedApp.BasePath) ? "(未設定)" : _selectedApp.BasePath;
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

    // ── Base Path ──

    private void BrowseEditBasePath_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog
        {
            Title = "リポジトリフォルダを選択"
        };

        if (dialog.ShowDialog() == true)
        {
            EditBasePath.Text = dialog.FolderName;
        }
    }

    private void BasePathText_Click(object sender, MouseButtonEventArgs e)
    {
        if (_selectedApp != null && !string.IsNullOrEmpty(_selectedApp.BasePath) && Directory.Exists(_selectedApp.BasePath))
        {
            Process.Start("explorer.exe", _selectedApp.BasePath);
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
        else if (!string.IsNullOrEmpty(_selectedApp.BasePath) && Directory.Exists(_selectedApp.BasePath))
        {
            Process.Start("explorer.exe", _selectedApp.BasePath);
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

    // ── Release Check ──

    private void CheckRelease_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;

        AppendOutput($"═══ リリースチェック: {_selectedApp!.Name} ({_selectedApp.ProductCode}) ═══\n\n");

        // 1. Debug exe
        var debugExe = _selectedApp.DebugExePath;
        CheckExeStatus("Debug exe", debugExe);

        // 2. Release exe
        var releaseExe = _selectedApp.ReleaseExePath;
        CheckExeStatus("Release exe", releaseExe);

        // 3. Self-contained publish (win-x64)
        var projectDir = Path.GetDirectoryName(_selectedApp.ResolvedProjectPath) ?? "";
        var publishExe = Path.Combine(projectDir, "bin", "Release", "net8.0-windows", "win-x64", "publish",
            Path.GetFileName(_selectedApp.ExeRelativePath.Replace("{config}", "Release")));
        CheckExeStatus("Publish exe (win-x64)", publishExe);

        // 4. gh CLI
        AppendOutput("── gh CLI ──\n");
        try
        {
            var psi = new ProcessStartInfo("gh", "--version")
            {
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            var proc = Process.Start(psi);
            var ghVersion = proc?.StandardOutput.ReadToEnd().Trim() ?? "";
            proc?.WaitForExit();
            AppendOutput($"  ✓ {ghVersion}\n");
        }
        catch
        {
            AppendOutput("  ✗ gh CLI が見つかりません（winget install GitHub.cli）\n");
        }

        // 5. Release repo
        AppendOutput($"\n── リリース先 ──\n");
        AppendOutput($"  リポジトリ: {AppConfig.ReleaseRepo}\n");
        var version = VersionInput.Text.Trim();
        var versionPart = string.IsNullOrEmpty(version) ? "v?.?.?" :
            (version.StartsWith("v") ? version : $"v{version}");
        AppendOutput($"  タグ: {_selectedApp.ProductCode}-{versionPart}\n\n");
    }

    private void CheckExeStatus(string label, string exePath)
    {
        AppendOutput($"── {label} ──\n");
        AppendOutput($"  パス: {exePath}\n");
        if (File.Exists(exePath))
        {
            var info = new FileInfo(exePath);
            AppendOutput($"  ✓ 存在します\n");
            AppendOutput($"  サイズ: {info.Length / (1024.0 * 1024.0):F1} MB\n");
            AppendOutput($"  作成日時: {info.CreationTime:yyyy/MM/dd HH:mm:ss}\n");
            AppendOutput($"  更新日時: {info.LastWriteTime:yyyy/MM/dd HH:mm:ss}\n\n");
        }
        else
        {
            AppendOutput($"  ✗ 見つかりません\n\n");
        }
    }

    // ── GitHub Release ──

    private async void Release_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;

        var releaseRepo = AppConfig.ReleaseRepo;

        var version = VersionInput.Text.Trim();
        if (string.IsNullOrEmpty(version))
        {
            AppendOutput("[エラー] バージョンを入力してください。\n");
            return;
        }

        var versionPart = version.StartsWith("v") ? version : $"v{version}";
        var productCode = _selectedApp.ProductCode;
        var tag = $"{productCode}-{versionPart}";
        var appName = _selectedApp.Name;
        var publishDir = Path.Combine(_selectedApp.BasePath,
            _selectedApp.ExeRelativePath
                .Replace("{config}", "Release")
                .Replace(Path.GetFileName(_selectedApp.ExeRelativePath), ""));

        // Self-contained publish output directory
        var rid = "win-x64";
        var publishOutput = Path.Combine(
            Path.GetDirectoryName(_selectedApp.ResolvedProjectPath) ?? "",
            "bin", "Release",
            Path.GetFileName(Path.GetDirectoryName(_selectedApp.ExeRelativePath.Replace("{config}", "Release"))) ?? "net8.0-windows",
            rid, "publish");

        // Use a simpler approach: derive from project path
        var projectDir = Path.GetDirectoryName(_selectedApp.ResolvedProjectPath) ?? "";
        var targetFramework = "net8.0-windows";
        publishOutput = Path.Combine(projectDir, "bin", "Release", targetFramework, rid, "publish");

        var zipName = $"{appName}-{versionPart}-{rid}.zip";
        var zipPath = Path.Combine(Path.GetTempPath(), zipName);

        var result = MessageBox.Show(
            $"以下の手順でリリースします:\n\n" +
            $"製品: {appName} ({productCode})\n" +
            $"1. dotnet publish (Release, {rid}, self-contained)\n" +
            $"2. publish フォルダを ZIP 圧縮\n" +
            $"3. gh release create {tag} → {releaseRepo}\n\n" +
            $"タグ: {tag}\n" +
            $"ZIP: {zipName}\n" +
            $"続行しますか？",
            "GitHub Release 確認",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result != MessageBoxResult.Yes) return;

        SetRunning(true);

        // Step 1: dotnet publish
        AppendOutput($"[1/3] dotnet publish -c Release -r {rid} --self-contained ...\n");
        var publishSuccess = await _runner.RunAsync("dotnet",
            $"publish \"{_selectedApp.ResolvedProjectPath}\" -c Release -r {rid} --self-contained",
            GetWorkingDir());

        if (!publishSuccess)
        {
            AppendOutput("[エラー] publish に失敗しました。リリースを中断します。\n");
            SetRunning(false);
            return;
        }

        // Step 2: ZIP
        AppendOutput($"\n[2/3] ZIP 圧縮中: {zipName}\n");
        try
        {
            if (File.Exists(zipPath))
                File.Delete(zipPath);

            if (!Directory.Exists(publishOutput))
            {
                AppendOutput($"[エラー] publish 出力フォルダが見つかりません: {publishOutput}\n");
                SetRunning(false);
                return;
            }

            System.IO.Compression.ZipFile.CreateFromDirectory(publishOutput, zipPath);
            var zipSize = new FileInfo(zipPath).Length / (1024.0 * 1024.0);
            AppendOutput($"  → {zipPath} ({zipSize:F1} MB)\n");
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] ZIP 圧縮に失敗: {ex.Message}\n");
            SetRunning(false);
            return;
        }

        // Step 3: gh release create
        AppendOutput($"\n[3/3] gh release create {tag} → {releaseRepo}\n");
        var releaseSuccess = await _runner.RunAsync("gh",
            $"release create {tag} \"{zipPath}\" --repo {releaseRepo} --title \"{appName} {tag}\" --notes \"{appName} {tag} リリース\"",
            GetWorkingDir());

        // Cleanup temp zip
        try { File.Delete(zipPath); } catch { }

        if (releaseSuccess)
        {
            AppendOutput($"\n[完了] GitHub Release を作成しました: {releaseRepo}/releases/tag/{tag}\n");
        }
        else
        {
            AppendOutput($"\n[エラー] GitHub Release の作成に失敗しました。gh auth login を確認してください。\n");
        }

        SetRunning(false);
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
        EditBasePath.Text = app.BasePath;
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
        _selectedApp.BasePath = EditBasePath.Text.Trim();
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
            Description = "説明を入力"
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

    protected override void OnClosed(EventArgs e)
    {
        SaveConfig();
        base.OnClosed(e);
    }
}
