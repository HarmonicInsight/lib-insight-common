using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;

namespace InsightCommon.Addon;

/// <summary>
/// AI コードエディターホスト（WebView2 ベース、InsightOffice 共通）
///
/// WebView2 で React + CodeMirror エディターをホストし、
/// C# ↔ JavaScript 間のブリッジを提供する。
///
/// InsightPy（Python）と InsightBot（C#）で同一の AI コードエディターを
/// 使えるようにするための共通基盤。
///
/// ## アーキテクチャ
///
/// ```
/// ┌─────────────────────────────────────────┐
/// │  C# WPF ホストアプリ                     │
/// │                                         │
/// │  ┌───────────────────────────────────┐  │
/// │  │  AiCodeEditorHost                 │  │
/// │  │  ┌─────────────────────────────┐  │  │
/// │  │  │  WebView2                    │  │  │
/// │  │  │  ┌────────────────────────┐ │  │  │
/// │  │  │  │  React + CodeMirror    │ │  │  │
/// │  │  │  │  - シンタックスハイライト│ │  │  │
/// │  │  │  │  - AI 補完             │ │  │  │
/// │  │  │  │  - エラー表示          │ │  │  │
/// │  │  │  └────────────────────────┘ │  │  │
/// │  │  └─────────────────────────────┘  │  │
/// │  │                                   │  │
/// │  │  C# ↔ JS ブリッジ               │  │
/// │  │  - validateSyntax(code) → bool   │  │
/// │  │  - executeCode(code) → result    │  │
/// │  │  - aiGenerate(prompt) → code     │  │
/// │  └───────────────────────────────────┘  │
/// └─────────────────────────────────────────┘
/// ```
///
/// 使用例:
/// <code>
/// var editor = new AiCodeEditorHost(addonManager, pythonRunner);
/// bottomPanelHost.RegisterPanel("ai_code_editor", editor);
/// </code>
/// </summary>
public class AiCodeEditorHost : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly PythonScriptRunner _pythonRunner;
    private readonly Grid _container;

    /// <summary>現在エディターに表示中のコード</summary>
    public string CurrentCode { get; private set; } = "";

    /// <summary>コードが変更されたときに発火</summary>
    public event EventHandler<string>? CodeChanged;

    /// <summary>コード実行が要求されたときに発火</summary>
    public event EventHandler<CodeExecutionRequestEventArgs>? ExecutionRequested;

    public AiCodeEditorHost(AddonManager addonManager, PythonScriptRunner pythonRunner)
    {
        _addonManager = addonManager;
        _pythonRunner = pythonRunner;

        _container = new Grid();
        _container.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        _container.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        _container.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        // ツールバー
        var toolbar = CreateToolbar();
        Grid.SetRow(toolbar, 0);
        _container.Children.Add(toolbar);

        // エディター領域（WebView2 がない場合のフォールバック: TextBox）
        var editorArea = CreateFallbackEditor();
        Grid.SetRow(editorArea, 1);
        _container.Children.Add(editorArea);

        // ステータスバー
        var statusBar = CreateStatusBar();
        Grid.SetRow(statusBar, 2);
        _container.Children.Add(statusBar);

        Content = _container;
    }

    // =========================================================================
    // WebView2 ブリッジ API（JS から呼び出される）
    // =========================================================================

    /// <summary>
    /// Python 構文検証（JS → C# ブリッジ）
    ///
    /// WebView2 の CoreWebView2.AddHostObjectToScript で公開する。
    /// JavaScript 側から window.chrome.webview.hostObjects.editor.ValidateSyntax(code) で呼び出し。
    /// </summary>
    public async Task<string> ValidateSyntax(string code)
    {
        var result = await _pythonRunner.ValidateSyntaxAsync(code);
        return JsonSerializer.Serialize(result);
    }

    /// <summary>
    /// コード実行（JS → C# ブリッジ）
    /// </summary>
    public async Task<string> ExecuteCode(string code)
    {
        var result = await _pythonRunner.ExecuteAsync(code);
        ExecutionRequested?.Invoke(this, new CodeExecutionRequestEventArgs
        {
            Code = code,
            Result = result,
        });
        return JsonSerializer.Serialize(result);
    }

    /// <summary>
    /// Lint チェック（JS → C# ブリッジ）
    /// </summary>
    public async Task<string> LintCode(string code)
    {
        var diagnostics = await _pythonRunner.LintAsync(code);
        return JsonSerializer.Serialize(diagnostics);
    }

    /// <summary>
    /// ドキュメント処理実行（JS → C# ブリッジ）
    /// </summary>
    public Func<string, string, Task<DocumentProcessingResult>>? OnExecuteOnDocument { get; set; }

    /// <summary>
    /// AI コード生成（JS → C# ブリッジ）
    ///
    /// ホストアプリが AI API 呼び出しを実装して設定する。
    /// </summary>
    public Func<string, string?, Task<AiCodeGenerationResult>>? OnAiGenerateCode { get; set; }

    // =========================================================================
    // エディター操作
    // =========================================================================

    /// <summary>エディターにコードを設定</summary>
    public void SetCode(string code)
    {
        CurrentCode = code;
        CodeChanged?.Invoke(this, code);
        // WebView2 がある場合: ExecuteScriptAsync("setCode('" + escaped + "')")
        // フォールバック: _fallbackEditor.Text = code
        if (_fallbackEditor != null)
            _fallbackEditor.Text = code;
    }

    /// <summary>エディターのフォントサイズを設定</summary>
    public void SetFontSize(int size)
    {
        if (_fallbackEditor != null)
            _fallbackEditor.FontSize = size;
    }

    // =========================================================================
    // WebView2 初期化
    // =========================================================================

    /// <summary>
    /// WebView2 エディターの HTML を生成
    ///
    /// ホストアプリが WebView2 のソースとして使用する。
    /// CodeMirror + Python syntax highlighting + AI 補完 UI を含む。
    /// </summary>
    public static string GenerateEditorHtml()
    {
        return """
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>AI Code Editor</title>
            <style>
                :root {
                    --bg-primary: #FAF8F5;
                    --bg-editor: #1e1e2e;
                    --text-primary: #cdd6f4;
                    --accent-gold: #B8942F;
                    --border: #45475a;
                    --error: #f38ba8;
                    --warning: #f9e2af;
                    --success: #a6e3a1;
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: var(--bg-editor);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                #editor {
                    flex: 1;
                    font-family: 'Consolas', 'Courier New', monospace;
                    font-size: 14px;
                    padding: 12px;
                    background: var(--bg-editor);
                    color: var(--text-primary);
                    border: none;
                    outline: none;
                    resize: none;
                    width: 100%;
                    tab-size: 4;
                }
                #ai-prompt {
                    display: flex;
                    border-top: 1px solid var(--border);
                    padding: 8px;
                    background: #181825;
                }
                #ai-prompt input {
                    flex: 1;
                    background: var(--bg-editor);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 6px 10px;
                    font-size: 13px;
                    outline: none;
                }
                #ai-prompt input:focus {
                    border-color: var(--accent-gold);
                }
                #ai-prompt button {
                    background: var(--accent-gold);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 14px;
                    margin-left: 8px;
                    cursor: pointer;
                    font-size: 13px;
                }
                #diagnostics {
                    padding: 4px 12px;
                    font-size: 12px;
                    background: #181825;
                    border-top: 1px solid var(--border);
                    max-height: 80px;
                    overflow-y: auto;
                }
                .diag-error { color: var(--error); }
                .diag-warning { color: var(--warning); }
                .diag-ok { color: var(--success); }
            </style>
        </head>
        <body>
            <textarea id="editor" spellcheck="false" placeholder="# Python コードを入力..."></textarea>
            <div id="diagnostics"><span class="diag-ok">Ready</span></div>
            <div id="ai-prompt">
                <input type="text" id="ai-input"
                       placeholder="AI に指示（例: A列の空白行を削除して）" />
                <button onclick="onAiGenerate()">AI 生成</button>
            </div>
            <script>
                const editor = document.getElementById('editor');
                const diagBox = document.getElementById('diagnostics');
                const aiInput = document.getElementById('ai-input');

                let validateTimer = null;

                editor.addEventListener('input', () => {
                    clearTimeout(validateTimer);
                    validateTimer = setTimeout(() => validateCode(), 800);
                    if (window.chrome?.webview) {
                        window.chrome.webview.hostObjects.editor.OnCodeChanged(editor.value);
                    }
                });

                async function validateCode() {
                    const code = editor.value;
                    if (!code.trim()) { diagBox.innerHTML = '<span class="diag-ok">Ready</span>'; return; }
                    try {
                        const result = JSON.parse(
                            await window.chrome.webview.hostObjects.editor.ValidateSyntax(code));
                        if (result.Valid) {
                            diagBox.innerHTML = '<span class="diag-ok">Syntax OK</span>';
                        } else {
                            diagBox.innerHTML = `<span class="diag-error">Line ${result.Line}: ${result.Error}</span>`;
                        }
                    } catch(e) {
                        diagBox.innerHTML = '<span class="diag-warning">Validation unavailable</span>';
                    }
                }

                async function onAiGenerate() {
                    const prompt = aiInput.value.trim();
                    if (!prompt) return;
                    diagBox.innerHTML = '<span class="diag-warning">AI generating...</span>';
                    try {
                        const result = JSON.parse(
                            await window.chrome.webview.hostObjects.editor.AiGenerateCode(
                                prompt, editor.value));
                        if (result.Code) {
                            editor.value = result.Code;
                            diagBox.innerHTML = `<span class="diag-ok">${result.Description || 'Generated'}</span>`;
                        }
                    } catch(e) {
                        diagBox.innerHTML = '<span class="diag-error">AI generation failed</span>';
                    }
                }

                function setCode(code) { editor.value = code; validateCode(); }
                function getCode() { return editor.value; }
            </script>
        </body>
        </html>
        """;
    }

    // =========================================================================
    // フォールバック UI（WebView2 がない場合）
    // =========================================================================

    private TextBox? _fallbackEditor;
    private TextBlock? _statusText;

    private UIElement CreateFallbackEditor()
    {
        _fallbackEditor = new TextBox
        {
            FontFamily = new System.Windows.Media.FontFamily("Consolas, Courier New"),
            FontSize = _addonManager.GetModuleSetting<int>("ai_code_editor", "font_size", 14),
            AcceptsReturn = true,
            AcceptsTab = true,
            TextWrapping = TextWrapping.NoWrap,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Background = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(30, 30, 46)),
            Foreground = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(205, 214, 244)),
            Padding = new Thickness(12),
        };

        _fallbackEditor.TextChanged += async (_, _) =>
        {
            CurrentCode = _fallbackEditor.Text;
            CodeChanged?.Invoke(this, CurrentCode);

            if (_addonManager.GetModuleSetting<bool>("ai_code_editor", "auto_validate", true))
            {
                await AutoValidateAsync();
            }
        };

        return _fallbackEditor;
    }

    private DockPanel CreateToolbar()
    {
        var toolbar = new DockPanel
        {
            Background = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(24, 24, 37)),
            Height = 36,
        };

        var leftPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = new Thickness(8, 0, 0, 0),
        };

        var runButton = new Button
        {
            Content = "▶ 実行",
            Padding = new Thickness(10, 4, 10, 4),
            Margin = new Thickness(0, 4, 4, 4),
        };
        runButton.Click += async (_, _) => await OnRunCode();
        leftPanel.Children.Add(runButton);

        var validateButton = new Button
        {
            Content = "✓ 検証",
            Padding = new Thickness(10, 4, 10, 4),
            Margin = new Thickness(0, 4, 4, 4),
        };
        validateButton.Click += async (_, _) => await OnValidateCode();
        leftPanel.Children.Add(validateButton);

        DockPanel.SetDock(leftPanel, Dock.Left);
        toolbar.Children.Add(leftPanel);

        return toolbar;
    }

    private Border CreateStatusBar()
    {
        var statusBar = new Border
        {
            Background = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(24, 24, 37)),
            Padding = new Thickness(12, 4, 12, 4),
        };

        _statusText = new TextBlock
        {
            Text = "Ready",
            FontSize = 12,
            Foreground = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(166, 227, 161)),
        };

        statusBar.Child = _statusText;
        return statusBar;
    }

    private async Task OnRunCode()
    {
        if (string.IsNullOrWhiteSpace(CurrentCode)) return;

        SetStatus("実行中...", StatusColor.Warning);
        var result = await _pythonRunner.ExecuteAsync(CurrentCode);

        if (result.Success)
            SetStatus($"完了 (exit: {result.ExitCode})", StatusColor.Success);
        else
            SetStatus($"失敗: {result.Stderr}", StatusColor.Error);

        ExecutionRequested?.Invoke(this, new CodeExecutionRequestEventArgs
        {
            Code = CurrentCode,
            Result = result,
        });
    }

    private async Task OnValidateCode()
    {
        if (string.IsNullOrWhiteSpace(CurrentCode)) return;

        var result = await _pythonRunner.ValidateSyntaxAsync(CurrentCode);
        if (result.Valid)
            SetStatus("Syntax OK", StatusColor.Success);
        else
            SetStatus($"Line {result.Line}: {result.Error}", StatusColor.Error);
    }

    private async Task AutoValidateAsync()
    {
        if (string.IsNullOrWhiteSpace(CurrentCode))
        {
            SetStatus("Ready", StatusColor.Success);
            return;
        }

        var result = await _pythonRunner.ValidateSyntaxAsync(CurrentCode);
        if (result.Valid)
            SetStatus("Syntax OK", StatusColor.Success);
        else
            SetStatus($"Line {result.Line}: {result.Error}", StatusColor.Error);
    }

    private enum StatusColor { Success, Warning, Error }

    private void SetStatus(string text, StatusColor color)
    {
        if (_statusText == null) return;
        _statusText.Text = text;
        _statusText.Foreground = new System.Windows.Media.SolidColorBrush(color switch
        {
            StatusColor.Success => System.Windows.Media.Color.FromRgb(166, 227, 161),
            StatusColor.Warning => System.Windows.Media.Color.FromRgb(249, 226, 175),
            StatusColor.Error => System.Windows.Media.Color.FromRgb(243, 139, 168),
            _ => System.Windows.Media.Color.FromRgb(205, 214, 244),
        });
    }
}

/// <summary>コード実行リクエストイベント引数</summary>
public class CodeExecutionRequestEventArgs : EventArgs
{
    public string Code { get; set; } = "";
    public PythonExecutionResult? Result { get; set; }
}

/// <summary>AI コード生成結果</summary>
public class AiCodeGenerationResult
{
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> RequiredPackages { get; set; } = [];
}
