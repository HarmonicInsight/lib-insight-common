using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.Addon;

/// <summary>
/// Python スクリプト一覧パネル（InsightOffice 共通）
///
/// ユーザー作成スクリプトと管理者事前配布スクリプトを一覧表示し、
/// ワンクリックで実行できる UI。InsightPy のスクリプト管理を
/// InsightOffice アプリに組み込んだもの。
///
/// 使用例:
/// <code>
/// var scriptsPanel = new PythonScriptsPanel(
///     addonManager, pythonRunner, "HarmonicSheet");
/// bottomPanelHost.RegisterPanel("python_scripts", scriptsPanel);
/// </code>
/// </summary>
public class PythonScriptsPanel : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly PythonScriptRunner _pythonRunner;
    private readonly string _productName;
    private readonly string _userScriptsDir;
    private readonly StackPanel _scriptList;
    private readonly TextBox _outputBox;
    private readonly ComboBox _categoryFilter;

    private List<ScriptItem> _allScripts = [];

    public PythonScriptsPanel(
        AddonManager addonManager,
        PythonScriptRunner pythonRunner,
        string productName)
    {
        _addonManager = addonManager;
        _pythonRunner = pythonRunner;
        _productName = productName;

        _userScriptsDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", productName, "scripts");
        Directory.CreateDirectory(_userScriptsDir);

        // メインレイアウト
        var mainGrid = new Grid
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Background),
        };
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(120) });

        // ヘッダー
        var headerPanel = new DockPanel { Margin = new Thickness(12, 8, 12, 8) };

        var titleText = new TextBlock
        {
            Text = "Python スクリプト",
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        DockPanel.SetDock(titleText, Dock.Left);
        headerPanel.Children.Add(titleText);

        _categoryFilter = new ComboBox
        {
            Width = 150,
            Margin = new Thickness(8, 0, 0, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        _categoryFilter.Items.Add("すべて");
        _categoryFilter.SelectedIndex = 0;
        _categoryFilter.SelectionChanged += (_, _) => FilterScripts();
        DockPanel.SetDock(_categoryFilter, Dock.Right);
        headerPanel.Children.Add(_categoryFilter);

        var addButton = new Button
        {
            Content = "＋ 新規",
            Padding = new Thickness(12, 4, 12, 4),
            Margin = new Thickness(0, 0, 8, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };
        addButton.Click += (_, _) => OnAddScript();
        DockPanel.SetDock(addButton, Dock.Right);
        headerPanel.Children.Add(addButton);

        Grid.SetRow(headerPanel, 0);
        mainGrid.Children.Add(headerPanel);

        // スクリプト一覧
        var scrollViewer = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Padding = new Thickness(12, 0, 12, 0),
        };
        _scriptList = new StackPanel();
        scrollViewer.Content = _scriptList;
        Grid.SetRow(scrollViewer, 1);
        mainGrid.Children.Add(scrollViewer);

        // 出力パネル
        var outputPanel = new Border
        {
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(0, 1, 0, 0),
        };
        _outputBox = new TextBox
        {
            IsReadOnly = true,
            FontFamily = new FontFamily("Consolas, Courier New"),
            FontSize = 12,
            Background = new SolidColorBrush(Color.FromRgb(30, 30, 30)),
            Foreground = new SolidColorBrush(Colors.LightGreen),
            TextWrapping = TextWrapping.Wrap,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Padding = new Thickness(8),
            Text = "// 実行結果がここに表示されます",
        };
        outputPanel.Child = _outputBox;
        Grid.SetRow(outputPanel, 2);
        mainGrid.Children.Add(outputPanel);

        Content = mainGrid;
        LoadScripts();
    }

    /// <summary>スクリプト一覧を再読み込み</summary>
    public void LoadScripts()
    {
        _allScripts.Clear();

        // 管理者プリロードスクリプト
        var preloaded = AdminProfileLoader.GetPreloadedScripts(_productName);
        foreach (var ps in preloaded)
        {
            _allScripts.Add(new ScriptItem
            {
                Id = ps.Id,
                Name = ps.NameJa,
                Category = ps.Category,
                Description = ps.DescriptionJa,
                Code = ps.Code,
                ReadOnly = ps.ReadOnly,
                Source = ScriptSource.Admin,
                RequiredPackages = ps.RequiredPackages.ToList(),
            });
        }

        // ユーザースクリプト
        if (Directory.Exists(_userScriptsDir))
        {
            foreach (var file in Directory.GetFiles(_userScriptsDir, "*.json"))
            {
                try
                {
                    var json = File.ReadAllText(file);
                    var script = JsonSerializer.Deserialize<UserScriptData>(json,
                        JsonOptions.CaseInsensitive);
                    if (script != null)
                    {
                        _allScripts.Add(new ScriptItem
                        {
                            Id = script.Id,
                            Name = script.Name,
                            Category = script.Category,
                            Description = script.Description,
                            Code = script.Code,
                            ReadOnly = false,
                            Source = ScriptSource.User,
                        });
                    }
                }
                catch
                {
                    // 読み込み失敗は無視
                }
            }
        }

        // カテゴリフィルターの更新
        var categories = _allScripts.Select(s => s.Category).Distinct().OrderBy(c => c).ToList();
        _categoryFilter.Items.Clear();
        _categoryFilter.Items.Add("すべて");
        foreach (var cat in categories)
            _categoryFilter.Items.Add(cat);
        _categoryFilter.SelectedIndex = 0;

        FilterScripts();
    }

    /// <summary>ドキュメント処理実行のデリゲート（ホストアプリが設定）</summary>
    public Func<string, string, Task<DocumentProcessingResult>>? OnExecuteOnDocument { get; set; }

    private void FilterScripts()
    {
        _scriptList.Children.Clear();

        var selectedCategory = _categoryFilter.SelectedItem as string;
        var filtered = selectedCategory == "すべて"
            ? _allScripts
            : _allScripts.Where(s => s.Category == selectedCategory).ToList();

        foreach (var script in filtered)
        {
            _scriptList.Children.Add(CreateScriptCard(script));
        }

        if (filtered.Count == 0)
        {
            _scriptList.Children.Add(new TextBlock
            {
                Text = "スクリプトがありません。「＋ 新規」から追加できます。",
                Foreground = InsightColors.ToBrush(InsightColors.Light.TextTertiary),
                Margin = new Thickness(0, 20, 0, 0),
                HorizontalAlignment = HorizontalAlignment.Center,
            });
        }
    }

    private Border CreateScriptCard(ScriptItem script)
    {
        var card = new Border
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Surface),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Margin = new Thickness(0, 0, 0, 6),
            Padding = new Thickness(12, 8, 12, 8),
        };

        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var infoPanel = new StackPanel();

        var namePanel = new StackPanel { Orientation = Orientation.Horizontal };
        namePanel.Children.Add(new TextBlock
        {
            Text = script.Name,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
        });

        if (script.Source == ScriptSource.Admin)
        {
            namePanel.Children.Add(new Border
            {
                Background = new SolidColorBrush(Color.FromArgb(30, 184, 148, 47)),
                CornerRadius = new CornerRadius(3),
                Padding = new Thickness(4, 1, 4, 1),
                Margin = new Thickness(6, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center,
                Child = new TextBlock
                {
                    Text = "管理者",
                    FontSize = 10,
                    Foreground = InsightColors.ToBrush(InsightColors.BrandPrimary),
                },
            });
        }

        infoPanel.Children.Add(namePanel);

        if (!string.IsNullOrEmpty(script.Description))
        {
            infoPanel.Children.Add(new TextBlock
            {
                Text = script.Description,
                FontSize = 11,
                Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
                Margin = new Thickness(0, 2, 0, 0),
            });
        }

        Grid.SetColumn(infoPanel, 0);
        grid.Children.Add(infoPanel);

        // 実行ボタン
        var buttonPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center,
        };

        var runButton = new Button
        {
            Content = "▶ 実行",
            Padding = new Thickness(10, 4, 10, 4),
            Margin = new Thickness(8, 0, 0, 0),
        };
        var scriptCapture = script;
        runButton.Click += async (_, _) => await OnRunScript(scriptCapture);
        buttonPanel.Children.Add(runButton);

        Grid.SetColumn(buttonPanel, 1);
        grid.Children.Add(buttonPanel);

        card.Child = grid;
        return card;
    }

    private async Task OnRunScript(ScriptItem script)
    {
        var confirmSetting = _addonManager.GetModuleSetting<bool>("python_scripts", "confirm_before_run", true);
        if (confirmSetting)
        {
            var confirmResult = MessageBox.Show(
                $"スクリプト「{script.Name}」を実行しますか？",
                "スクリプト実行確認",
                MessageBoxButton.OKCancel,
                MessageBoxImage.Question);
            if (confirmResult != MessageBoxResult.OK) return;
        }

        _outputBox.Text = $"[{DateTime.Now:HH:mm:ss}] 実行中: {script.Name}...\n";

        // 構文検証
        var validation = await _pythonRunner.ValidateSyntaxAsync(script.Code);
        if (!validation.Valid)
        {
            _outputBox.Text += $"[ERROR] 構文エラー: {validation.Error} (行 {validation.Line})\n";
            return;
        }

        // ドキュメント処理かスタンドアロン実行かを判別
        PythonExecutionResult result;
        if (OnExecuteOnDocument != null && script.Code.Contains("INPUT_PATH"))
        {
            var docResult = await OnExecuteOnDocument(script.Code, script.Id);
            result = new PythonExecutionResult
            {
                Success = docResult.Success,
                Stdout = docResult.Stdout,
                Stderr = docResult.Stderr,
                ExitCode = docResult.ExitCode,
                TimedOut = docResult.TimedOut,
            };
            if (docResult.DocumentModified)
                _outputBox.Text += "[INFO] ドキュメントが更新されました。\n";
        }
        else
        {
            result = await _pythonRunner.ExecuteAsync(script.Code);
        }

        _outputBox.Text += result.Stdout;
        if (!string.IsNullOrEmpty(result.Stderr))
            _outputBox.Text += $"\n[STDERR] {result.Stderr}";

        _outputBox.Text += result.Success
            ? $"\n[{DateTime.Now:HH:mm:ss}] 完了 (exit: {result.ExitCode})"
            : $"\n[{DateTime.Now:HH:mm:ss}] 失敗 (exit: {result.ExitCode})";
    }

    private void OnAddScript()
    {
        // 新規スクリプト作成ダイアログ
        ScriptCreated?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>新規スクリプト作成が要求されたときに発火</summary>
    public event EventHandler? ScriptCreated;

    /// <summary>
    /// ユーザースクリプトを保存
    /// </summary>
    public void SaveUserScript(string id, string name, string category, string code, string? description = null)
    {
        var data = new UserScriptData
        {
            Id = string.IsNullOrEmpty(id) ? Guid.NewGuid().ToString("N") : id,
            Name = name,
            Category = category,
            Code = code,
            Description = description ?? "",
        };

        var json = JsonSerializer.Serialize(data, JsonOptions.WriteIndented);
        File.WriteAllText(Path.Combine(_userScriptsDir, $"{data.Id}.json"), json);

        LoadScripts();
    }
}

// =========================================================================
// 内部型
// =========================================================================

internal enum ScriptSource { User, Admin }

internal class ScriptItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Description { get; set; } = "";
    public string Code { get; set; } = "";
    public bool ReadOnly { get; set; }
    public ScriptSource Source { get; set; }
    public List<string> RequiredPackages { get; set; } = [];
}

internal class UserScriptData
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
}
