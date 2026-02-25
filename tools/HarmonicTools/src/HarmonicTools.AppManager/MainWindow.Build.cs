using System.Diagnostics;
using System.IO;
using System.Windows;
using HarmonicTools.AppManager.Models;

namespace HarmonicTools.AppManager;

/// <summary>
/// ビルド・実行関連の操作
/// </summary>
public partial class MainWindow
{
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
            RunBuildCommandExternal(title, "-Publish");
            return;
        }

        if (!_selectedApp.IsDotNet)
        {
            RunBuildCommandExternal(title, "-Publish");
            return;
        }
        _runner.RunInExternalConsole(title, "dotnet",
            $"publish \"{_selectedApp.ResolvedProjectPath}\" -c Release -r {RuntimeIdentifier} --self-contained /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true",
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

        if (!File.Exists(cmdPath))
        {
            AppendOutput($"[エラー] ビルドスクリプトが見つかりません: {cmdPath}\n");
            AppendOutput("[ヒント] リポジトリに build.ps1 を作成してください。\n");
            return;
        }

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

        if (!File.Exists(cmdPath))
        {
            AppendOutput($"[エラー] ビルドスクリプトが見つかりません: {cmdPath}\n");
            AppendOutput("[ヒント] リポジトリに build.ps1 を作成してください。\n");
            SetRunning(false);
            return false;
        }

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

        // Web app / website / mobile app: always open base path
        if (_selectedApp.IsWebBased || _selectedApp.IsMobileApp)
        {
            OpenDirectoryInExplorer(_selectedApp.BasePath);
            return;
        }

        var dir = Path.GetDirectoryName(_selectedApp.ResolvedProjectPath);
        if (dir != null && Directory.Exists(dir))
        {
            OpenDirectoryInExplorer(dir);
        }
        else
        {
            OpenDirectoryInExplorer(_selectedApp.BasePath);
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        _runner.Cancel();
        SetRunning(false);
    }

    private void ExePath_Click(object sender, System.Windows.Input.MouseButtonEventArgs e)
    {
        if (sender is System.Windows.Controls.TextBlock tb && !string.IsNullOrEmpty(tb.Text))
        {
            var dir = Path.GetDirectoryName(tb.Text);
            OpenDirectoryInExplorer(dir);
        }
    }

    // ── Open Exe Folder ──

    private void OpenExeFolder_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;

        // build.ps1 がある場合: publish フォルダを最優先で開く
        if (_selectedApp!.HasBuildScript)
        {
            var publishDir = Path.Combine(_selectedApp.BasePath, "publish");
            if (Directory.Exists(publishDir))
            {
                OpenDirectoryInExplorer(publishDir);
                return;
            }
        }

        // インストーラーディレクトリがあれば開く
        if (!string.IsNullOrEmpty(_selectedApp.InstallerDir))
        {
            var installerDir = _selectedApp.ResolvedInstallerDir;
            if (Directory.Exists(installerDir))
            {
                OpenDirectoryInExplorer(installerDir);
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
                if (OpenDirectoryInExplorer(dir))
                    return;
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
                if (OpenDirectoryInExplorer(dir))
                    return;
            }
        }

        AppendOutput("[情報] exe フォルダが見つかりません。先にビルドまたは Publish を実行してください。\n");
    }
}
