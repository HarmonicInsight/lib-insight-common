using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Media;
using HarmonicTools.AppManager.Models;

namespace HarmonicTools.AppManager;

/// <summary>
/// リリース・チェック関連の操作
/// </summary>
public partial class MainWindow
{
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
            CheckExeStatus($"Publish exe ({RuntimeIdentifier})", _selectedApp.PublishExePath);
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
        AppendOutput($"  リポジトリ: {Models.AppConfig.ReleaseRepo}\n");
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
                $"release view {expectedTag} --repo {Models.AppConfig.ReleaseRepo} --json tagName,createdAt,assets")
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

        try
        {
            await ExecuteReleaseAsync();
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] リリース処理で予期しないエラーが発生しました: {ex.Message}\n");
            SetRunning(false);
        }
    }

    private async Task ExecuteReleaseAsync()
    {
        var releaseRepo = Models.AppConfig.ReleaseRepo;

        var version = VersionInput.Text.Trim();
        if (string.IsNullOrEmpty(version))
        {
            AppendOutput("[エラー] バージョンを入力してください。\n");
            return;
        }

        var versionPart = version.StartsWith("v") ? version : $"v{version}";
        var productCode = _selectedApp!.ProductCode;
        var tag = $"{productCode}-{versionPart}";
        var appName = _selectedApp.Name;

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
            buildStep = $"dotnet publish (Release, {RuntimeIdentifier}, self-contained)";
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
            AppendOutput($"[1/3] dotnet publish -c Release -r {RuntimeIdentifier} --self-contained ...\n");
            var publishSuccess = await _runner.RunAsync("dotnet",
                $"publish \"{_selectedApp.ResolvedProjectPath}\" -c Release -r {RuntimeIdentifier} --self-contained /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true",
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
                publishOutput = Path.Combine(projectDir, "bin", "Release", TargetFramework, RuntimeIdentifier, "publish");
            }

            var zipName = $"{appName}-{versionPart}-{RuntimeIdentifier}.zip";
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
            try { File.Delete(uploadFile); }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Temp file cleanup failed: {ex.Message}");
            }
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
}
