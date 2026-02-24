using System.Diagnostics;
using System.Windows;

namespace HarmonicTools.AppManager;

/// <summary>
/// Web アプリ・サイト関連の操作
/// </summary>
public partial class MainWindow
{
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

        if (OpenUrlInBrowser(url))
        {
            AppendOutput($"[ブラウザ] {url} を開きました\n");
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

        if (OpenUrlInBrowser(url))
        {
            AppendOutput($"[ブラウザ] {url} を開きました\n");
        }
    }

    private void WebUrl_Click(object sender, System.Windows.Input.MouseButtonEventArgs e)
    {
        if (sender is System.Windows.Controls.TextBlock tb && !string.IsNullOrEmpty(tb.Text))
        {
            OpenUrlInBrowser(tb.Text);
        }
    }

    // ── Mobile App Commands ──

    private void MobileBuild_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        var buildCmd = _selectedApp!.WebBuildCommand;
        if (string.IsNullOrEmpty(buildCmd))
        {
            AppendOutput("[情報] ビルドコマンドが設定されていません。\n");
            return;
        }

        var title = $"{_selectedApp.Name} - Build";
        _runner.RunInExternalConsole(title, "cmd.exe",
            $"/c title {title} && {buildCmd} & echo. & echo ──────────────────────────── & echo 完了しました。何かキーを押すと閉じます。 & pause > nul",
            _selectedApp.BasePath);
    }

    private void MobileRun_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateSelection()) return;
        if (string.IsNullOrEmpty(_selectedApp!.DevCommand))
        {
            AppendOutput("[情報] 実行コマンドが設定されていません。\n");
            return;
        }

        var title = $"{_selectedApp.Name} - Run";
        _runner.RunInExternalConsole(title, "cmd.exe",
            $"/c title {title} && {_selectedApp.DevCommand}",
            _selectedApp.BasePath);

        AppendOutput($"[Run] {_selectedApp.Name} を起動しました\n");
    }

    private void MobileOpenStore_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var url = _selectedApp.StoreUrl;
        if (string.IsNullOrEmpty(url))
        {
            AppendOutput("[情報] ストア URL が設定されていません。\n");
            return;
        }

        if (OpenUrlInBrowser(url))
        {
            AppendOutput($"[ブラウザ] {url} を開きました\n");
        }
    }
}
