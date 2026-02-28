using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using InsightCommon.Theme;

namespace InsightCommon.Addon;

/// <summary>
/// Python スクリプトエディター画面（Insight Business Suite 共通）
///
/// スクリプトの名前・カテゴリ・説明・コードを編集し、保存する UI。
/// PythonScriptsPanel のリストからダブルクリックまたは「新規」ボタンで遷移する。
///
/// 使用例:
/// <code>
/// var editorPanel = new PythonScriptEditorPanel(addonManager, pythonRunner);
/// editorPanel.SaveRequested += (_, args) =>
/// {
///     scriptsPanel.SaveUserScript(args.Id, args.Name, args.Category, args.Code, args.Description);
///     ShowListPanel();
/// };
/// editorPanel.BackRequested += (_, _) => ShowListPanel();
/// </code>
/// </summary>
public class PythonScriptEditorPanel : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly PythonScriptRunner _pythonRunner;
    private readonly AiCodeEditorHost _codeEditor;

    private readonly TextBox _nameInput;
    private readonly ComboBox _categoryInput;
    private readonly TextBox _descriptionInput;
    private readonly TextBlock _statusText;

    private string _editingScriptId = "";
    private bool _isReadOnly;

    /// <summary>保存が要求されたときに発火</summary>
    public event EventHandler<ScriptSaveEventArgs>? SaveRequested;

    /// <summary>一覧に戻るが要求されたときに発火</summary>
    public event EventHandler? BackRequested;

    public PythonScriptEditorPanel(AddonManager addonManager, PythonScriptRunner pythonRunner)
    {
        _addonManager = addonManager;
        _pythonRunner = pythonRunner;
        _codeEditor = new AiCodeEditorHost(addonManager, pythonRunner);

        var mainGrid = new Grid
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Background),
        };
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // ヘッダー
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // メタデータ入力
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // エディター
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // ステータスバー

        // ── ヘッダー ──
        var header = CreateHeader();
        Grid.SetRow(header, 0);
        mainGrid.Children.Add(header);

        // ── メタデータ入力エリア ──
        var metadataPanel = new StackPanel
        {
            Margin = new Thickness(12, 8, 12, 4),
        };

        // 名前
        var nameRow = new DockPanel { Margin = new Thickness(0, 0, 0, 6) };
        nameRow.Children.Add(new TextBlock
        {
            Text = "スクリプト名",
            Width = 100,
            VerticalAlignment = VerticalAlignment.Center,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            FontSize = 12,
        });
        _nameInput = new TextBox
        {
            FontSize = 13,
            Padding = new Thickness(8, 4, 8, 4),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
        };
        nameRow.Children.Add(_nameInput);
        metadataPanel.Children.Add(nameRow);

        // カテゴリ + 説明（横並び）
        var catDescRow = new Grid { Margin = new Thickness(0, 0, 0, 6) };
        catDescRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        catDescRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(2, GridUnitType.Star) });

        // カテゴリ
        var catPanel = new DockPanel { Margin = new Thickness(0, 0, 8, 0) };
        catPanel.Children.Add(new TextBlock
        {
            Text = "カテゴリ",
            Width = 100,
            VerticalAlignment = VerticalAlignment.Center,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            FontSize = 12,
        });
        _categoryInput = new ComboBox
        {
            IsEditable = true,
            FontSize = 13,
        };
        _categoryInput.Items.Add("データ処理");
        _categoryInput.Items.Add("集計・分析");
        _categoryInput.Items.Add("ファイル操作");
        _categoryInput.Items.Add("レポート");
        _categoryInput.Items.Add("その他");
        _categoryInput.SelectedIndex = 0;
        catPanel.Children.Add(_categoryInput);
        Grid.SetColumn(catPanel, 0);
        catDescRow.Children.Add(catPanel);

        // 説明
        var descPanel = new DockPanel();
        descPanel.Children.Add(new TextBlock
        {
            Text = "説明",
            Width = 40,
            VerticalAlignment = VerticalAlignment.Center,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            FontSize = 12,
        });
        _descriptionInput = new TextBox
        {
            FontSize = 13,
            Padding = new Thickness(8, 4, 8, 4),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
        };
        descPanel.Children.Add(_descriptionInput);
        Grid.SetColumn(descPanel, 1);
        catDescRow.Children.Add(descPanel);

        metadataPanel.Children.Add(catDescRow);

        Grid.SetRow(metadataPanel, 1);
        mainGrid.Children.Add(metadataPanel);

        // ── コードエディター ──
        var editorBorder = new Border
        {
            Margin = new Thickness(12, 0, 12, 0),
            BorderBrush = InsightColors.ToBrush(InsightColors.Light.Border),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(4),
            ClipToBounds = true,
        };
        editorBorder.Child = _codeEditor;
        Grid.SetRow(editorBorder, 2);
        mainGrid.Children.Add(editorBorder);

        // ── ステータスバー ──
        var statusBar = new DockPanel
        {
            Margin = new Thickness(12, 4, 12, 8),
        };
        _statusText = new TextBlock
        {
            Text = "",
            FontSize = 12,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextTertiary),
            VerticalAlignment = VerticalAlignment.Center,
        };
        statusBar.Children.Add(_statusText);
        Grid.SetRow(statusBar, 3);
        mainGrid.Children.Add(statusBar);

        Content = mainGrid;
    }

    private DockPanel CreateHeader()
    {
        var header = new DockPanel
        {
            Background = InsightColors.ToBrush(InsightColors.Light.Surface),
            Height = 44,
        };

        // 戻るボタン
        var backButton = new Button
        {
            Content = "← 一覧に戻る",
            Padding = new Thickness(12, 4, 12, 4),
            Margin = new Thickness(8, 0, 0, 0),
            VerticalAlignment = VerticalAlignment.Center,
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(0),
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextSecondary),
            Cursor = Cursors.Hand,
        };
        backButton.Click += (_, _) => BackRequested?.Invoke(this, EventArgs.Empty);
        DockPanel.SetDock(backButton, Dock.Left);
        header.Children.Add(backButton);

        // 右側ボタン群
        var rightPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = new Thickness(0, 0, 8, 0),
            VerticalAlignment = VerticalAlignment.Center,
        };

        var runButton = new Button
        {
            Content = "▶ テスト実行",
            Padding = new Thickness(12, 4, 12, 4),
            Margin = new Thickness(0, 0, 6, 0),
        };
        runButton.Click += async (_, _) => await OnTestRun();
        rightPanel.Children.Add(runButton);

        var saveButton = new Button
        {
            Content = "保存",
            Padding = new Thickness(16, 4, 16, 4),
            FontWeight = FontWeights.SemiBold,
        };
        saveButton.Click += (_, _) => OnSave();
        rightPanel.Children.Add(saveButton);

        DockPanel.SetDock(rightPanel, Dock.Right);
        header.Children.Add(rightPanel);

        // タイトル（中央）
        var titleText = new TextBlock
        {
            Text = "スクリプト編集",
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = InsightColors.ToBrush(InsightColors.Light.TextPrimary),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
        };
        header.Children.Add(titleText);

        return header;
    }

    // =========================================================================
    // 公開メソッド
    // =========================================================================

    /// <summary>
    /// 新規スクリプト作成モードで開く
    /// </summary>
    public void OpenNew()
    {
        _editingScriptId = "";
        _isReadOnly = false;
        _nameInput.Text = "";
        _categoryInput.Text = "その他";
        _descriptionInput.Text = "";
        _codeEditor.SetCode("# 新しいスクリプト\n");
        _nameInput.Focus();
        SetInputsEnabled(true);
        SetStatus("");
    }

    /// <summary>
    /// 既存スクリプトを編集モードで開く
    /// </summary>
    public void OpenForEdit(string id, string name, string category, string description, string code, bool readOnly)
    {
        _editingScriptId = id;
        _isReadOnly = readOnly;
        _nameInput.Text = name;
        _categoryInput.Text = category;
        _descriptionInput.Text = description;
        _codeEditor.SetCode(code);
        SetInputsEnabled(!readOnly);

        if (readOnly)
            SetStatus("管理者スクリプトは読み取り専用です");
        else
            SetStatus("");
    }

    // =========================================================================
    // イベントハンドラ
    // =========================================================================

    private void OnSave()
    {
        if (_isReadOnly)
        {
            SetStatus("読み取り専用スクリプトは保存できません");
            return;
        }

        var name = _nameInput.Text.Trim();
        if (string.IsNullOrEmpty(name))
        {
            SetStatus("スクリプト名を入力してください");
            _nameInput.Focus();
            return;
        }

        var category = (_categoryInput.Text ?? _categoryInput.SelectedItem as string ?? "その他").Trim();
        if (string.IsNullOrEmpty(category))
            category = "その他";

        SaveRequested?.Invoke(this, new ScriptSaveEventArgs
        {
            Id = _editingScriptId,
            Name = name,
            Category = category,
            Description = _descriptionInput.Text.Trim(),
            Code = _codeEditor.CurrentCode,
        });

        SetStatus("保存しました");
    }

    private async Task OnTestRun()
    {
        var code = _codeEditor.CurrentCode;
        if (string.IsNullOrWhiteSpace(code))
        {
            SetStatus("実行するコードがありません");
            return;
        }

        SetStatus("テスト実行中...");
        var result = await _pythonRunner.ExecuteAsync(code);

        if (result.Success)
            SetStatus($"テスト完了 (exit: {result.ExitCode})");
        else
            SetStatus($"テスト失敗: {result.Stderr}");
    }

    private void SetInputsEnabled(bool enabled)
    {
        _nameInput.IsEnabled = enabled;
        _categoryInput.IsEnabled = enabled;
        _descriptionInput.IsEnabled = enabled;
    }

    private void SetStatus(string text)
    {
        _statusText.Text = text;
    }
}

/// <summary>スクリプト保存イベント引数</summary>
public class ScriptSaveEventArgs : EventArgs
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Description { get; set; } = "";
    public string Code { get; set; } = "";
}
