using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicTools.AppManager.Models;
using HarmonicTools.AppManager.Services;
using Microsoft.Win32;

namespace HarmonicTools.AppManager;

public partial class MainWindow : Window
{
    private enum ActiveTab { Desktop, WebApp, Website }

    private readonly AppConfig _config;
    private readonly CommandRunner _runner = new();
    private AppDefinition? _selectedApp;
    private ActiveTab _activeTab = ActiveTab.Desktop;

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
        EditPanel.Visibility = Visibility.Collapsed;
        WebEditPanel.Visibility = Visibility.Collapsed;
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
            DesktopPathInfo.Visibility = Visibility.Visible;
            WebPathInfo.Visibility = Visibility.Collapsed;
            DesktopActions.Visibility = Visibility.Visible;
            WebActions.Visibility = Visibility.Collapsed;
            return;
        }

        SelectedAppName.Text = _selectedApp.Name;

        if (_selectedApp.IsWebBased)
        {
            // Web app / website details
            DesktopPathInfo.Visibility = Visibility.Collapsed;
            WebPathInfo.Visibility = Visibility.Visible;
            DesktopActions.Visibility = Visibility.Collapsed;
            WebActions.Visibility = Visibility.Visible;

            WebBasePathText.Text = string.IsNullOrEmpty(_selectedApp.BasePath) ? "(未設定)" : _selectedApp.BasePath;
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
        else
        {
            // Desktop app details
            DesktopPathInfo.Visibility = Visibility.Visible;
            WebPathInfo.Visibility = Visibility.Collapsed;
            DesktopActions.Visibility = Visibility.Visible;
            WebActions.Visibility = Visibility.Collapsed;

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

    private void BrowseWebEditBasePath_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog
        {
            Title = "リポジトリフォルダを選択"
        };

        if (dialog.ShowDialog() == true)
        {
            WebEditBasePath.Text = dialog.FolderName;
        }
    }

    private void BasePathText_Click(object sender, MouseButtonEventArgs e)
    {
        if (_selectedApp != null && !string.IsNullOrEmpty(_selectedApp.BasePath) && Directory.Exists(_selectedApp.BasePath))
        {
            Process.Start("explorer.exe", _selectedApp.BasePath);
        }
    }

    // ── Web App URL Click ──

    private void WebUrl_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is System.Windows.Controls.TextBlock tb && !string.IsNullOrEmpty(tb.Text))
        {
            try
            {
                Process.Start(new ProcessStartInfo(tb.Text) { UseShellExecute = true });
            }
            catch { }
        }
    }

    // ── Web App Commands ──

    private void WebDevServer_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        if (string.IsNullOrEmpty(_selectedApp!.DevCommand))
        {
            AppendOutput("[情報] Dev コマンドが設定されていません。\n");
            return;
        }

        var title = $"{_selectedApp.Name} - Dev Server";
        var parts = _selectedApp.DevCommand.Split(' ', 2);
        var cmd = parts[0];
        var args = parts.Length > 1 ? parts[1] : "";

        _runner.RunInExternalConsole(title, "cmd.exe",
            $"/c title {title} && {_selectedApp.DevCommand}",
            _selectedApp.BasePath);

        AppendOutput($"[Dev Server] {_selectedApp.Name} を起動しました: {_selectedApp.DevUrl}\n");
    }

    private void WebOpenBrowser_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var url = _selectedApp.DevUrl;
        if (string.IsNullOrEmpty(url))
        {
            AppendOutput("[情報] Dev URL が設定されていません。\n");
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            AppendOutput($"[ブラウザ] {url} を開きました\n");
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] ブラウザ起動失敗: {ex.Message}\n");
        }
    }

    private void WebBuild_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var buildCmd = _selectedApp!.WebBuildCommand;
        if (string.IsNullOrEmpty(buildCmd))
            buildCmd = "npm run build";

        var title = $"{_selectedApp.Name} - Build";
        _runner.RunInExternalConsole(title, "cmd.exe",
            $"/c title {title} && {buildCmd} & echo. & echo ──────────────────────────── & echo 完了しました。何かキーを押すと閉じます。 & pause > nul",
            _selectedApp.BasePath);
    }

    private void WebInstall_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - npm install";
        _runner.RunInExternalConsole(title, "cmd.exe",
            $"/c title {title} && npm install & echo. & echo ──────────────────────────── & echo 完了しました。何かキーを押すと閉じます。 & pause > nul",
            _selectedApp.BasePath);
    }

    private void WebOpenProduction_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var url = _selectedApp.ProductionUrl;
        if (string.IsNullOrEmpty(url))
        {
            AppendOutput("[情報] 本番 URL が設定されていません。\n");
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            AppendOutput($"[ブラウザ] {url} を開きました\n");
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] ブラウザ起動失敗: {ex.Message}\n");
        }
    }

    // ── Build Commands ──

    private void BuildDebug_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - Debug Build";
        if (!_selectedApp.IsDotNet)
        {
            RunBuildCommandExternal(title);
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet", $"build \"{_selectedApp.ResolvedProjectPath}\"", GetWorkingDir());
    }

    private void BuildRelease_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - Release Build";
        if (!_selectedApp.IsDotNet)
        {
            RunBuildCommandExternal(title);
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet", $"build \"{_selectedApp.ResolvedProjectPath}\" -c Release", GetWorkingDir());
    }

    private void Publish_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - Publish";

        // build.ps1 がある場合はそれを使用（dotnet publish + Inno Setup インストーラー作成）
        if (_selectedApp.HasBuildScript)
        {
            RunBuildCommandExternal(title);
            return;
        }

        if (!_selectedApp.IsDotNet)
        {
            RunBuildCommandExternal(title);
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet",
            $"publish \"{_selectedApp.ResolvedProjectPath}\" -c Release -r win-x64 --self-contained /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true",
            GetWorkingDir());
    }

    private void Run_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - Run";
        if (!_selectedApp.IsDotNet)
        {
            var exePath = _selectedApp.DistExePath;
            if (!string.IsNullOrEmpty(exePath) && File.Exists(exePath))
            {
                _runner.RunInExternalConsole(title, exePath, "", _selectedApp.BasePath);
                return;
            }
            AppendOutput("[情報] exe が見つかりません。先にビルドしてください。\n");
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet", $"run --project \"{_selectedApp.ResolvedProjectPath}\"", GetWorkingDir());
    }

    private void Test_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        if (string.IsNullOrEmpty(_selectedApp!.TestProjectPath))
        {
            AppendOutput("[情報] テストプロジェクトが設定されていません。\n");
            return;
        }
        var title = $"{_selectedApp.Name} - Test";
        _runner.RunInExternalConsole(title, "dotnet", $"test \"{_selectedApp.ResolvedTestProjectPath}\"", GetWorkingDir());
    }

    private void BuildAll_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var title = $"{_selectedApp!.Name} - Build All";
        if (!_selectedApp.IsDotNet)
        {
            RunBuildCommandExternal(title);
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet", $"build \"{_selectedApp.ResolvedSolutionPath}\"", GetWorkingDir());
    }

    /// <summary>
    /// BuildCommand を外部コンソールで実行
    /// </summary>
    private void RunBuildCommandExternal(string title, string? extraArgs = null)
    {
        if (string.IsNullOrEmpty(_selectedApp!.BuildCommand))
        {
            AppendOutput("[情報] ビルドコマンドが設定されていません。\n");
            return;
        }
        var cmdPath = Path.Combine(_selectedApp.BasePath, _selectedApp.BuildCommand);
        var args = extraArgs ?? "";

        if (_selectedApp.BuildCommand.EndsWith(".ps1", StringComparison.OrdinalIgnoreCase))
        {
            _runner.RunPs1InExternalConsole(title, cmdPath, args, _selectedApp.BasePath);
        }
        else
        {
            _runner.RunInExternalConsole(title, cmdPath, args, _selectedApp.BasePath);
        }
    }

    /// <summary>
    /// BuildCommand を埋め込みコンソールで実行（Release パイプライン用）
    /// </summary>
    private async Task<bool> RunBuildCommand(string? extraArgs = null)
    {
        if (string.IsNullOrEmpty(_selectedApp!.BuildCommand))
        {
            AppendOutput("[情報] ビルドコマンドが設定されていません。\n");
            SetRunning(false);
            return false;
        }
        var cmdPath = Path.Combine(_selectedApp.BasePath, _selectedApp.BuildCommand);
        var args = extraArgs ?? "";

        if (_selectedApp.BuildCommand.EndsWith(".ps1", StringComparison.OrdinalIgnoreCase))
        {
            return await _runner.RunAsync("powershell.exe",
                $"-ExecutionPolicy Bypass -File \"{cmdPath}\" {args}".Trim(),
                _selectedApp.BasePath);
        }
        return await _runner.RunAsync("cmd.exe", $"/c \"{cmdPath}\" {args}".Trim(), _selectedApp.BasePath);
    }

    private void OpenFolder_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        // Web app / website: always open base path
        if (_selectedApp.IsWebBased)
        {
            if (!string.IsNullOrEmpty(_selectedApp.BasePath) && Directory.Exists(_selectedApp.BasePath))
                Process.Start("explorer.exe", _selectedApp.BasePath);
            return;
        }

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

    // ── Open Exe Folder ──

    private void OpenExeFolder_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;

        // インストーラーディレクトリがあれば最優先で開く
        if (!string.IsNullOrEmpty(_selectedApp!.InstallerDir))
        {
            var installerDir = _selectedApp.ResolvedInstallerDir;
            if (Directory.Exists(installerDir))
            {
                Process.Start("explorer.exe", installerDir);
                return;
            }
        }

        // 非 dotnet: DistExePath のフォルダを開く
        if (!_selectedApp.IsDotNet)
        {
            var distExe = _selectedApp.DistExePath;
            if (!string.IsNullOrEmpty(distExe))
            {
                var dir = Path.GetDirectoryName(distExe);
                if (dir != null && Directory.Exists(dir))
                {
                    Process.Start("explorer.exe", dir);
                    return;
                }
            }
            AppendOutput("[情報] exe フォルダが見つかりません。先にビルドを実行してください。\n");
            return;
        }

        // dotnet: Publish exe (優先) → Release exe → Debug exe の順で探す
        var paths = new[]
        {
            _selectedApp.PublishExePath,
            _selectedApp.ReleaseExePath,
            _selectedApp.DebugExePath
        };

        foreach (var exePath in paths)
        {
            if (!string.IsNullOrEmpty(exePath))
            {
                var dir = Path.GetDirectoryName(exePath);
                if (dir != null && Directory.Exists(dir))
                {
                    Process.Start("explorer.exe", dir);
                    return;
                }
            }
        }

        AppendOutput("[情報] exe フォルダが見つかりません。先にビルドまたは Publish を実行してください。\n");
    }

    // ── Release Check ──

    private void CheckRelease_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;

        AppendOutput($"═══ リリースチェック: {_selectedApp!.Name} ({_selectedApp.ProductCode}) ═══\n\n");

        // ビルドスクリプト情報
        if (_selectedApp.HasBuildScript)
            AppendOutput($"── ビルドスクリプト ──\n  {_selectedApp.BuildCommand}\n\n");

        // インストーラー状態
        if (!string.IsNullOrEmpty(_selectedApp.InstallerDir))
        {
            var installer = _selectedApp.LatestInstallerExe;
            if (installer != null)
            {
                var info = new FileInfo(installer);
                AppendOutput($"── インストーラー ──\n");
                AppendOutput($"  ✓ {Path.GetFileName(installer)}\n");
                AppendOutput($"  サイズ: {info.Length / (1024.0 * 1024.0):F1} MB\n");
                AppendOutput($"  更新日時: {info.LastWriteTime:yyyy/MM/dd HH:mm:ss}\n\n");
            }
            else
            {
                AppendOutput($"── インストーラー ──\n");
                AppendOutput($"  ✗ {_selectedApp.ResolvedInstallerDir} にインストーラーが見つかりません\n\n");
            }
        }

        if (!_selectedApp.IsDotNet)
        {
            // 非 dotnet プロジェクト
            CheckExeStatus("配布 exe", _selectedApp.DistExePath);
        }
        else
        {
            // 1. Debug exe
            CheckExeStatus("Debug exe", _selectedApp.DebugExePath);

            // 2. Release exe
            CheckExeStatus("Release exe", _selectedApp.ReleaseExePath);

            // 3. Self-contained publish (win-x64)
            CheckExeStatus("Publish exe (win-x64)", _selectedApp.PublishExePath);
        }

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
        var expectedTag = $"{_selectedApp.ProductCode}-{versionPart}";
        AppendOutput($"  タグ: {expectedTag}\n");

        // 6. GitHub Release 状態
        AppendOutput($"\n── GitHub Release ──\n");
        if (!string.IsNullOrEmpty(_selectedApp.LastReleasedTag))
        {
            AppendOutput($"  最終リリース: {_selectedApp.LastReleasedTag}\n");
        }
        try
        {
            var psi = new ProcessStartInfo("gh",
                $"release view {expectedTag} --repo {AppConfig.ReleaseRepo} --json tagName,createdAt,assets")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            var proc = Process.Start(psi);
            var output = proc?.StandardOutput.ReadToEnd().Trim() ?? "";
            proc?.WaitForExit();
            if (proc?.ExitCode == 0)
            {
                AppendOutput($"  ✓ {expectedTag} はリリース済み\n");
                AppendOutput($"  {output}\n");
            }
            else
            {
                AppendOutput($"  ✗ {expectedTag} は未リリース\n");
            }
        }
        catch
        {
            AppendOutput("  ✗ gh CLI でリリース状態を確認できません\n");
        }
        AppendOutput("\n");
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
        var rid = "win-x64";

        // build.ps1 + InstallerDir がある場合: インストーラー exe をアップロード
        var useInstaller = _selectedApp.HasBuildScript && !string.IsNullOrEmpty(_selectedApp.InstallerDir);

        string buildStep;
        string uploadDescription;
        if (useInstaller)
        {
            buildStep = $"{_selectedApp.BuildCommand}（publish + インストーラー作成）";
            uploadDescription = $"インストーラー exe を Output/ から取得してアップロード";
        }
        else if (!_selectedApp.IsDotNet)
        {
            buildStep = string.IsNullOrEmpty(_selectedApp.BuildCommand) ? "手動ビルド済み" : _selectedApp.BuildCommand;
            uploadDescription = "フォルダを ZIP 圧縮してアップロード";
        }
        else
        {
            buildStep = $"dotnet publish (Release, {rid}, self-contained)";
            uploadDescription = "publish フォルダを ZIP 圧縮してアップロード";
        }

        var result = MessageBox.Show(
            $"以下の手順でリリースします:\n\n" +
            $"製品: {appName} ({productCode})\n" +
            $"1. {buildStep}\n" +
            $"2. {uploadDescription}\n" +
            $"3. gh release create {tag} → {releaseRepo}\n\n" +
            $"タグ: {tag}\n" +
            $"続行しますか？",
            "GitHub Release 確認",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result != MessageBoxResult.Yes) return;

        SetRunning(true);

        // Step 1: ビルド
        if (useInstaller || _selectedApp.HasBuildScript)
        {
            AppendOutput($"[1/3] {_selectedApp.BuildCommand} 実行中...\n");
            var buildSuccess = await RunBuildCommand();
            if (!buildSuccess)
            {
                AppendOutput("[エラー] ビルドに失敗しました。リリースを中断します。\n");
                SetRunning(false);
                return;
            }
        }
        else if (!_selectedApp.IsDotNet)
        {
            if (!string.IsNullOrEmpty(_selectedApp.BuildCommand))
            {
                AppendOutput($"[1/3] {_selectedApp.BuildCommand} 実行中...\n");
                var buildSuccess = await RunBuildCommand();
                if (!buildSuccess)
                {
                    AppendOutput("[エラー] ビルドに失敗しました。リリースを中断します。\n");
                    SetRunning(false);
                    return;
                }
            }
            else
            {
                AppendOutput("[1/3] ビルドコマンドなし — 既存 exe を使用\n");
            }
        }
        else
        {
            AppendOutput($"[1/3] dotnet publish -c Release -r {rid} --self-contained ...\n");
            var publishSuccess = await _runner.RunAsync("dotnet",
                $"publish \"{_selectedApp.ResolvedProjectPath}\" -c Release -r {rid} --self-contained /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true",
                GetWorkingDir());

            if (!publishSuccess)
            {
                AppendOutput("[エラー] publish に失敗しました。リリースを中断します。\n");
                SetRunning(false);
                return;
            }
        }

        // Step 2: アップロード対象を決定
        string uploadFile;
        bool needsCleanup = false;

        if (useInstaller)
        {
            // インストーラー exe をそのままアップロード
            var installerExe = _selectedApp.LatestInstallerExe;
            if (string.IsNullOrEmpty(installerExe))
            {
                AppendOutput($"[エラー] インストーラーが見つかりません: {_selectedApp.ResolvedInstallerDir}\n");
                SetRunning(false);
                return;
            }
            uploadFile = installerExe;
            var size = new FileInfo(installerExe).Length / (1024.0 * 1024.0);
            AppendOutput($"\n[2/3] インストーラー検出: {Path.GetFileName(installerExe)} ({size:F1} MB)\n");
        }
        else
        {
            // ZIP 圧縮
            string publishOutput;
            if (!_selectedApp.IsDotNet)
            {
                var distExe = _selectedApp.DistExePath;
                publishOutput = Path.GetDirectoryName(distExe) ?? "";
            }
            else
            {
                var projectDir = Path.GetDirectoryName(_selectedApp.ResolvedProjectPath) ?? "";
                publishOutput = Path.Combine(projectDir, "bin", "Release", "net8.0-windows", rid, "publish");
            }

            var zipName = $"{appName}-{versionPart}-{rid}.zip";
            var zipPath = Path.Combine(Path.GetTempPath(), zipName);

            AppendOutput($"\n[2/3] ZIP 圧縮中: {zipName}\n");
            try
            {
                if (File.Exists(zipPath))
                    File.Delete(zipPath);

                if (!Directory.Exists(publishOutput))
                {
                    AppendOutput($"[エラー] 出力フォルダが見つかりません: {publishOutput}\n");
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

            uploadFile = zipPath;
            needsCleanup = true;
        }

        // Step 3: 既存リリースがあれば削除
        AppendOutput($"\n[3/3] gh release create {tag} → {releaseRepo}\n");
        await _runner.RunAsync("gh",
            $"release delete {tag} --repo {releaseRepo} --yes --cleanup-tag",
            GetWorkingDir());

        var releaseSuccess = await _runner.RunAsync("gh",
            $"release create {tag} \"{uploadFile}\" --repo {releaseRepo} --title \"{appName} {tag}\" --notes \"{appName} {tag} リリース\" --draft=false",
            GetWorkingDir());

        // Cleanup temp zip if needed
        if (needsCleanup)
        {
            try { File.Delete(uploadFile); } catch { }
        }

        if (releaseSuccess)
        {
            _selectedApp.LastReleasedTag = tag;
            SaveConfig();
            RefreshStatusIcons();
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

        var isCurrentlyOpen = _selectedApp.IsWebBased
            ? WebEditPanel.Visibility == Visibility.Visible
            : EditPanel.Visibility == Visibility.Visible;

        if (!isCurrentlyOpen)
        {
            if (_selectedApp.IsWebBased)
            {
                PopulateWebEditFields(_selectedApp);
                WebEditPanel.Visibility = Visibility.Visible;
                EditPanel.Visibility = Visibility.Collapsed;
            }
            else
            {
                PopulateEditFields(_selectedApp);
                EditPanel.Visibility = Visibility.Visible;
                WebEditPanel.Visibility = Visibility.Collapsed;
            }
            EditToggleBtn.Content = "閉じる";
        }
        else
        {
            EditPanel.Visibility = Visibility.Collapsed;
            WebEditPanel.Visibility = Visibility.Collapsed;
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
        EditBuildCommand.Text = app.BuildCommand;
        EditInstallerDir.Text = app.InstallerDir;
        _suppressAutoFill = false;
    }

    private void PopulateWebEditFields(AppDefinition app)
    {
        WebEditName.Text = app.Name;
        WebEditProductCode.Text = app.ProductCode;
        WebEditDescription.Text = app.Description;
        WebEditBasePath.Text = app.BasePath;
        WebEditFramework.Text = app.Framework;
        WebEditDevCommand.Text = app.DevCommand;
        WebEditDevUrl.Text = app.DevUrl;
        WebEditProductionUrl.Text = app.ProductionUrl;
    }

    private void EditName_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
    {
        if (_suppressAutoFill) return;

        var name = EditName.Text.Trim();
        if (string.IsNullOrEmpty(name)) return;

        // Generate product code from name (e.g. "InsightOfficeSheet" -> "IOSH")
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
        // e.g. "InsightOfficeSheet" -> "IOS", then pad to 4 chars -> "IOSH"
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
        _selectedApp.BuildCommand = EditBuildCommand.Text.Trim();
        _selectedApp.InstallerDir = EditInstallerDir.Text.Trim();

        SaveConfig();
        UpdateAppDetails();

        var saved = _selectedApp;
        RefreshAppList();
        AppListBox.SelectedItem = saved;

        EditPanel.Visibility = Visibility.Collapsed;
        EditToggleBtn.Content = "編集";

        AppendOutput($"[保存] {_selectedApp.Name} の設定を保存しました。\n");
    }

    private void SaveWebEdit_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        _selectedApp.Name = WebEditName.Text.Trim();
        _selectedApp.ProductCode = WebEditProductCode.Text.Trim();
        _selectedApp.Description = WebEditDescription.Text.Trim();
        _selectedApp.BasePath = WebEditBasePath.Text.Trim();
        _selectedApp.Framework = WebEditFramework.Text.Trim();
        _selectedApp.DevCommand = WebEditDevCommand.Text.Trim();
        _selectedApp.DevUrl = WebEditDevUrl.Text.Trim();
        _selectedApp.ProductionUrl = WebEditProductionUrl.Text.Trim();

        SaveConfig();
        UpdateAppDetails();

        var saved = _selectedApp;
        RefreshAppList();
        AppListBox.SelectedItem = saved;

        WebEditPanel.Visibility = Visibility.Collapsed;
        EditToggleBtn.Content = "編集";

        AppendOutput($"[保存] {_selectedApp.Name} の設定を保存しました。\n");
    }

    // ── Add/Remove ──

    private void AddApp_Click(object sender, RoutedEventArgs e)
    {
        if (_activeTab == ActiveTab.WebApp || _activeTab == ActiveTab.Website)
        {
            var isWebSite = _activeTab == ActiveTab.Website;
            var app = new AppDefinition
            {
                Name = isWebSite ? "新規Webサイト" : "新規Webアプリ",
                ProductCode = isWebSite ? "WEB-NEW" : "APP-NEW",
                Type = isWebSite ? AppType.Website : AppType.WebApp,
                Description = "説明を入力",
                Framework = "Next.js",
                DevCommand = "npm run dev",
                WebBuildCommand = "npm run build",
                DevUrl = "http://localhost:3000",
            };

            _config.Apps.Add(app);
            RefreshAppList();
            AppListBox.SelectedItem = app;
            SaveConfig();

            PopulateWebEditFields(app);
            WebEditPanel.Visibility = Visibility.Visible;
            EditToggleBtn.Content = "閉じる";
        }
        else
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
    }

    private void CopyApp_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        var app = new AppDefinition
        {
            Name = _selectedApp.Name + " (コピー)",
            ProductCode = _selectedApp.ProductCode,
            Type = _selectedApp.Type,
            Description = _selectedApp.Description,
            BasePath = _selectedApp.BasePath,
            SolutionPath = _selectedApp.SolutionPath,
            ProjectPath = _selectedApp.ProjectPath,
            TestProjectPath = _selectedApp.TestProjectPath,
            ExeRelativePath = _selectedApp.ExeRelativePath,
            BuildCommand = _selectedApp.BuildCommand,
            InstallerDir = _selectedApp.InstallerDir,
            Framework = _selectedApp.Framework,
            DevCommand = _selectedApp.DevCommand,
            WebBuildCommand = _selectedApp.WebBuildCommand,
            DevUrl = _selectedApp.DevUrl,
            ProductionUrl = _selectedApp.ProductionUrl,
        };

        _config.Apps.Add(app);
        RefreshAppList();
        AppListBox.SelectedItem = app;
        SaveConfig();

        // Auto-open edit panel for copied app
        if (app.IsWebBased)
        {
            PopulateWebEditFields(app);
            WebEditPanel.Visibility = Visibility.Visible;
        }
        else
        {
            PopulateEditFields(app);
            EditPanel.Visibility = Visibility.Visible;
        }
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

    // ── GitHub Sync ──

    private async void GitSync_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        await GitPullAsync(_selectedApp!);
    }

    private async void GitStatus_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        await GitStatusAsync(_selectedApp!);
    }

    private async void GitSyncAll_Click(object sender, RoutedEventArgs e)
    {
        var apps = _config.Apps
            .Where(a => !string.IsNullOrEmpty(a.BasePath) && Directory.Exists(a.BasePath))
            .ToList();

        if (apps.Count == 0)
        {
            AppendOutput("[GitHub同期] リポジトリパスが設定されているアプリがありません。\n");
            return;
        }

        SetRunning(true);
        AppendOutput($"═══ 全アプリ GitHub 同期 ({apps.Count} 件) ═══\n\n");

        var successCount = 0;
        var failCount = 0;
        var skipCount = 0;

        foreach (var app in apps)
        {
            if (!IsGitRepository(app.BasePath))
            {
                AppendOutput($"[スキップ] {app.Name} — Git リポジトリではありません\n");
                skipCount++;
                continue;
            }

            AppendOutput($"── {app.Name} ({app.ProductCode}) ──\n");
            var result = await RunGitCommandAsync("git", "pull", app.BasePath);
            if (result)
                successCount++;
            else
                failCount++;
            AppendOutput("\n");
        }

        AppendOutput($"═══ 完了: 成功 {successCount} / 失敗 {failCount} / スキップ {skipCount} ═══\n\n");
        SetRunning(false);
    }

    private async Task GitPullAsync(AppDefinition app)
    {
        if (!IsGitRepository(app.BasePath))
        {
            AppendOutput($"[エラー] {app.Name} のリポジトリパスは Git リポジトリではありません。\n");
            return;
        }

        SetRunning(true);
        AppendOutput($"═══ GitHub 同期: {app.Name} ({app.ProductCode}) ═══\n\n");

        // まず fetch で最新情報を取得
        AppendOutput("── git fetch ──\n");
        await RunGitCommandAsync("git", "fetch --all --prune", app.BasePath);

        // ブランチ情報を表示
        AppendOutput("\n── git status ──\n");
        await RunGitCommandAsync("git", "status -sb", app.BasePath);

        // pull を実行
        AppendOutput("\n── git pull ──\n");
        var pullResult = await RunGitCommandAsync("git", "pull", app.BasePath);

        // サブモジュールがあれば更新
        var gitModulesPath = Path.Combine(app.BasePath, ".gitmodules");
        if (File.Exists(gitModulesPath))
        {
            AppendOutput("\n── git submodule update ──\n");
            await RunGitCommandAsync("git", "submodule update --init --recursive", app.BasePath);
        }

        AppendOutput(pullResult
            ? "\n[完了] 同期が完了しました。\n\n"
            : "\n[警告] 同期中にエラーが発生しました。出力を確認してください。\n\n");
        SetRunning(false);
    }

    private async Task GitStatusAsync(AppDefinition app)
    {
        if (!IsGitRepository(app.BasePath))
        {
            AppendOutput($"[エラー] {app.Name} のリポジトリパスは Git リポジトリではありません。\n");
            return;
        }

        SetRunning(true);
        AppendOutput($"═══ Git Status: {app.Name} ({app.ProductCode}) ═══\n\n");

        // ブランチとステータス
        AppendOutput("── ブランチ ──\n");
        await RunGitCommandAsync("git", "branch -vv", app.BasePath);

        AppendOutput("\n── ステータス ──\n");
        await RunGitCommandAsync("git", "status -s", app.BasePath);

        // リモートとの差分
        AppendOutput("\n── fetch (リモート確認) ──\n");
        await RunGitCommandAsync("git", "fetch --all --prune", app.BasePath);

        AppendOutput("\n── リモートとの差分 ──\n");
        await RunGitCommandAsync("git", "log HEAD..@{u} --oneline", app.BasePath);

        AppendOutput("\n");
        SetRunning(false);
    }

    private async Task<bool> RunGitCommandAsync(string command, string arguments, string workingDirectory)
    {
        var psi = new ProcessStartInfo
        {
            FileName = command,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            StandardOutputEncoding = System.Text.Encoding.UTF8,
            StandardErrorEncoding = System.Text.Encoding.UTF8
        };

        try
        {
            var process = new Process { StartInfo = psi };
            process.Start();

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (!string.IsNullOrWhiteSpace(stdout))
                AppendOutput(stdout.TrimEnd() + "\n");
            if (!string.IsNullOrWhiteSpace(stderr))
                AppendOutput(stderr.TrimEnd() + "\n");

            return process.ExitCode == 0;
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] {ex.Message}\n");
            return false;
        }
    }

    private static bool IsGitRepository(string path)
    {
        if (string.IsNullOrEmpty(path) || !Directory.Exists(path)) return false;
        return Directory.Exists(Path.Combine(path, ".git"));
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
            var saved = _selectedApp;
            RefreshAppList();
            if (saved != null) AppListBox.SelectedItem = saved;

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

    protected override void OnClosed(EventArgs e)
    {
        SaveConfig();
        base.OnClosed(e);
    }
}
