using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Windows;
using HarmonicTools.AppManager.Models;
using Microsoft.Win32;

namespace HarmonicTools.AppManager;

/// <summary>
/// 編集・追加・削除・インポート/エクスポート関連の操作
/// </summary>
public partial class MainWindow
{
    // ── Edit ──

    private void EditToggle_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        var isCurrentlyOpen = _selectedApp.IsMobileApp
            ? MobileEditPanel.Visibility == Visibility.Visible
            : _selectedApp.IsWebBased
                ? WebEditPanel.Visibility == Visibility.Visible
                : EditPanel.Visibility == Visibility.Visible;

        if (!isCurrentlyOpen)
        {
            // 全編集パネルを閉じてから該当パネルを開く
            CloseAllEditPanels();

            if (_selectedApp.IsMobileApp)
            {
                PopulateMobileEditFields(_selectedApp);
                MobileEditPanel.Visibility = Visibility.Visible;
            }
            else if (_selectedApp.IsWebBased)
            {
                PopulateWebEditFields(_selectedApp);
                WebEditPanel.Visibility = Visibility.Visible;
            }
            else
            {
                PopulateEditFields(_selectedApp);
                EditPanel.Visibility = Visibility.Visible;
            }
            EditToggleBtn.Content = "閉じる";
        }
        else
        {
            CloseAllEditPanels();
            EditToggleBtn.Content = "編集";
        }
    }

    private void CloseAllEditPanels()
    {
        EditPanel.Visibility = Visibility.Collapsed;
        WebEditPanel.Visibility = Visibility.Collapsed;
        MobileEditPanel.Visibility = Visibility.Collapsed;
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

    private void PopulateMobileEditFields(AppDefinition app)
    {
        MobileEditName.Text = app.Name;
        MobileEditProductCode.Text = app.ProductCode;
        MobileEditDescription.Text = app.Description;
        MobileEditBasePath.Text = app.BasePath;
        MobileEditPlatform.Text = app.MobilePlatform;
        MobileEditFramework.Text = app.Framework;
        MobileEditBuildCommand.Text = app.WebBuildCommand;
        MobileEditBundleId.Text = app.BundleId;
        MobileEditStoreUrl.Text = app.StoreUrl;
    }

    private void EditName_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
    {
        if (_suppressAutoFill) return;

        var name = EditName.Text.Trim();
        if (string.IsNullOrEmpty(name)) return;

        // Generate product code from name (e.g. "Insight Performance Management" -> "IOSH")
        EditProductCode.Text = GenerateProductCode(name);

        // Auto-fill paths using the convention:
        //   Solution:  {Name}.sln
        //   Project:   src/{Name}.App/{Name}.App.csproj
        //   Test:      tests/{Name}.Core.Tests
        //   Exe:       src/{Name}.App/bin/{config}/net8.0-windows/{Name}.App.exe
        EditSolutionPath.Text = $"{name}.sln";
        EditProjectPath.Text = $"src/{name}.App/{name}.App.csproj";
        EditTestPath.Text = $"tests/{name}.Core.Tests";
        EditExePath.Text = $"src/{name}.App/bin/{{config}}/{BuildConstants.TargetFramework}/{name}.App.exe";
        EditDescription.Text = $"{name} アプリケーション";
    }

    private static string GenerateProductCode(string name)
    {
        // Extract uppercase letters or word starts to make a short code
        // e.g. "Insight Performance Management" -> "IPM", then pad to 4 chars -> "IPMX"
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

        SaveConfigAndRefresh("Desktop");
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

        SaveConfigAndRefresh("Web");
    }

    private void SaveMobileEdit_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;

        _selectedApp.Name = MobileEditName.Text.Trim();
        _selectedApp.ProductCode = MobileEditProductCode.Text.Trim();
        _selectedApp.Description = MobileEditDescription.Text.Trim();
        _selectedApp.BasePath = MobileEditBasePath.Text.Trim();
        _selectedApp.MobilePlatform = MobileEditPlatform.Text.Trim();
        _selectedApp.Framework = MobileEditFramework.Text.Trim();
        _selectedApp.WebBuildCommand = MobileEditBuildCommand.Text.Trim();
        _selectedApp.BundleId = MobileEditBundleId.Text.Trim();
        _selectedApp.StoreUrl = MobileEditStoreUrl.Text.Trim();

        SaveConfigAndRefresh("Mobile");
    }

    private void SaveConfigAndRefresh(string panelType)
    {
        SaveConfig();
        UpdateAppDetails();

        var saved = _selectedApp;
        RefreshAppList();
        AppListBox.SelectedItem = saved;

        CloseAllEditPanels();
        EditToggleBtn.Content = "編集";

        AppendOutput($"[保存] {_selectedApp?.Name} の設定を保存しました。\n");
    }

    // ── Add/Remove ──

    private void AddApp_Click(object sender, RoutedEventArgs e)
    {
        if (_activeTab == ActiveTab.MobileApp)
        {
            AddNewMobileApp();
        }
        else if (_activeTab == ActiveTab.WebApp || _activeTab == ActiveTab.Website)
        {
            AddNewWebApp();
        }
        else
        {
            AddNewDesktopApp();
        }
    }

    private void AddNewDesktopApp()
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

    private void AddNewWebApp()
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

    private void AddNewMobileApp()
    {
        var app = new AppDefinition
        {
            Name = "新規スマホアプリ",
            ProductCode = "MOB-NEW",
            Type = AppType.MobileApp,
            Description = "説明を入力",
            MobilePlatform = "Cross-platform",
            Framework = "React Native",
            DevCommand = "npx expo start",
            WebBuildCommand = "npx expo build",
        };

        _config.Apps.Add(app);
        RefreshAppList();
        AppListBox.SelectedItem = app;
        SaveConfig();

        PopulateMobileEditFields(app);
        MobileEditPanel.Visibility = Visibility.Visible;
        EditToggleBtn.Content = "閉じる";
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
            MobilePlatform = _selectedApp.MobilePlatform,
            BundleId = _selectedApp.BundleId,
            StoreUrl = _selectedApp.StoreUrl,
        };

        _config.Apps.Add(app);
        RefreshAppList();
        AppListBox.SelectedItem = app;
        SaveConfig();

        // Auto-open edit panel for copied app
        if (app.IsMobileApp)
        {
            PopulateMobileEditFields(app);
            MobileEditPanel.Visibility = Visibility.Visible;
        }
        else if (app.IsWebBased)
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

    // ── Move Up/Down ──

    private void MoveUp_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var index = _config.Apps.IndexOf(_selectedApp);
        if (index < 0) return;

        // 同じタブ内で1つ上のアプリを探す
        for (var i = index - 1; i >= 0; i--)
        {
            if (_config.Apps[i].Type == _selectedApp.Type)
            {
                // swap
                (_config.Apps[index], _config.Apps[i]) = (_config.Apps[i], _config.Apps[index]);
                SaveConfig();
                var saved = _selectedApp;
                RefreshAppList();
                AppListBox.SelectedItem = saved;
                return;
            }
        }
    }

    private void MoveDown_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedApp == null) return;
        var index = _config.Apps.IndexOf(_selectedApp);
        if (index < 0) return;

        // 同じタブ内で1つ下のアプリを探す
        for (var i = index + 1; i < _config.Apps.Count; i++)
        {
            if (_config.Apps[i].Type == _selectedApp.Type)
            {
                // swap
                (_config.Apps[index], _config.Apps[i]) = (_config.Apps[i], _config.Apps[index]);
                SaveConfig();
                var saved = _selectedApp;
                RefreshAppList();
                AppListBox.SelectedItem = saved;
                return;
            }
        }
    }

    // ── Import ──

    private void ImportApps_Click(object sender, RoutedEventArgs e)
    {
        // 埋め込みリソースから読むか、外部ファイルを選ぶか
        var result = MessageBox.Show(
            "スマホアプリの一括インポート\n\n" +
            "「はい」→ 内蔵データ (12アプリ) をインポート\n" +
            "「いいえ」→ JSON ファイルを選択してインポート",
            "一括インポート",
            MessageBoxButton.YesNoCancel,
            MessageBoxImage.Question);

        if (result == MessageBoxResult.Cancel) return;

        List<AppDefinition>? apps;
        if (result == MessageBoxResult.Yes)
        {
            apps = LoadEmbeddedMobileApps();
        }
        else
        {
            var dialog = new OpenFileDialog
            {
                Title = "インポートする JSON ファイルを選択",
                Filter = "JSON ファイル (*.json)|*.json|すべてのファイル (*.*)|*.*",
                DefaultExt = ".json"
            };
            if (dialog.ShowDialog() != true) return;

            try
            {
                var json = File.ReadAllText(dialog.FileName);
                apps = JsonSerializer.Deserialize<List<AppDefinition>>(json);
            }
            catch (Exception ex)
            {
                AppendOutput($"[エラー] JSON の読み込みに失敗: {ex.Message}\n");
                return;
            }
        }

        if (apps == null || apps.Count == 0)
        {
            AppendOutput("[情報] インポートするアプリがありません。\n");
            return;
        }

        var existingCodes = _config.Apps.Select(a => a.ProductCode).ToHashSet();
        var added = 0;
        var skipped = 0;

        foreach (var app in apps)
        {
            if (existingCodes.Contains(app.ProductCode))
            {
                skipped++;
                continue;
            }

            // Type を強制的に MobileApp に設定
            app.Type = AppType.MobileApp;
            _config.Apps.Add(app);
            existingCodes.Add(app.ProductCode);
            added++;
        }

        if (added > 0)
        {
            SaveConfig();
            RefreshAppList();
        }

        AppendOutput($"[一括インポート] {added} 件追加、{skipped} 件スキップ（既存）\n");

        if (added > 0)
            MessageBox.Show($"{added} 件のスマホアプリを追加しました。\n{skipped} 件は既に登録済みのためスキップしました。",
                "インポート完了", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private static List<AppDefinition>? LoadEmbeddedMobileApps()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("mobile-apps.json"));

        if (resourceName == null) return null;

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null) return null;

        return JsonSerializer.Deserialize<List<AppDefinition>>(stream);
    }

    private void ExportApps_Click(object sender, RoutedEventArgs e)
    {
        // 現在のタブのアプリを JSON エクスポート
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

        if (filtered.Count == 0)
        {
            AppendOutput("[情報] エクスポートするアプリがありません。\n");
            return;
        }

        var dialog = new SaveFileDialog
        {
            Title = "アプリ一覧をエクスポート",
            Filter = "JSON ファイル (*.json)|*.json",
            DefaultExt = ".json",
            FileName = $"{_activeTab}-apps.json"
        };
        if (dialog.ShowDialog() != true) return;

        try
        {
            var json = JsonSerializer.Serialize(filtered, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(dialog.FileName, json);
            AppendOutput($"[エクスポート] {filtered.Count} 件を {dialog.FileName} に保存しました。\n");
        }
        catch (Exception ex)
        {
            AppendOutput($"[エラー] エクスポート失敗: {ex.Message}\n");
        }
    }

    // ── Base Path ──

    private void BrowseEditBasePath_Click(object sender, RoutedEventArgs e)
    {
        var folder = BrowseForFolder("リポジトリフォルダを選択");
        if (folder != null)
        {
            EditBasePath.Text = folder;
        }
    }

    private void BrowseWebEditBasePath_Click(object sender, RoutedEventArgs e)
    {
        var folder = BrowseForFolder("リポジトリフォルダを選択");
        if (folder != null)
        {
            WebEditBasePath.Text = folder;
        }
    }

    private void BrowseMobileEditBasePath_Click(object sender, RoutedEventArgs e)
    {
        var folder = BrowseForFolder("リポジトリフォルダを選択");
        if (folder != null)
        {
            MobileEditBasePath.Text = folder;
        }
    }

    private static string? BrowseForFolder(string title)
    {
        var dialog = new OpenFolderDialog
        {
            Title = title
        };
        return dialog.ShowDialog() == true ? dialog.FolderName : null;
    }
}
