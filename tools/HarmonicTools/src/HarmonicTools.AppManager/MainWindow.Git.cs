using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;

namespace HarmonicTools.AppManager;

/// <summary>
/// Git 同期関連の操作
/// </summary>
public partial class MainWindow
{
    // ── GitHub Sync ──

    private async void GitSync_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        try
        {
            await GitPullAsync(_selectedApp!);
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] Git同期で予期しないエラーが発生しました: {ex.Message}\n");
            SetRunning(false);
        }
    }

    private async void GitStatus_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        try
        {
            await GitStatusAsync(_selectedApp!);
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] Git状態取得で予期しないエラーが発生しました: {ex.Message}\n");
            SetRunning(false);
        }
    }

    private async void GitSyncAll_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            await GitSyncAllAsync();
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] 全アプリ同期で予期しないエラーが発生しました: {ex.Message}\n");
            SetRunning(false);
        }
    }

    private async Task GitSyncAllAsync()
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

    private async Task GitPullAsync(Models.AppDefinition app)
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

    private async Task GitStatusAsync(Models.AppDefinition app)
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
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
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
}
