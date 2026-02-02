using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;

namespace InsightCommon.Addon;

/// <summary>
/// Python スクリプト実行ブリッジ（InsightOffice 共通）
///
/// C# WPF アプリから Python subprocess を起動し、スクリプトを実行する。
/// InsightPy エンジンの核となる実行基盤。
///
/// ## ファイル連携プロトコル
///
/// ドキュメント処理の場合:
/// 1. ホストアプリが現在のファイルを一時ディレクトリに保存
/// 2. Python subprocess がファイルを読み込み・処理（openpyxl / python-docx / python-pptx）
/// 3. Python が処理済みファイルを一時ディレクトリに書き出し
/// 4. ホストアプリが処理済みファイルを再読み込み
///
/// ## 環境変数
///
/// Python スクリプトには以下の環境変数が自動で設定される:
/// - INPUT_PATH: 入力ファイルパス（ドキュメント処理時）
/// - OUTPUT_PATH: 出力ファイルパス（ドキュメント処理時）
/// - PRODUCT_CODE: 製品コード（HMSH/HMDC/HMSL）
///
/// 使用例:
/// <code>
/// var runner = new PythonScriptRunner("HMSH", addonManager);
///
/// // 構文検証
/// var valid = await runner.ValidateSyntaxAsync("print('hello')");
///
/// // スタンドアロン実行
/// var result = await runner.ExecuteAsync("print('hello')");
///
/// // ドキュメント処理
/// var docResult = await runner.ExecuteOnDocumentAsync(
///     code: "import openpyxl\nwb = openpyxl.load_workbook(os.environ['INPUT_PATH'])\n...",
///     documentPath: @"C:\temp\current.xlsx",
///     documentFormat: ".xlsx");
/// if (docResult.Success)
///     ReloadDocument(docResult.OutputPath!);
/// </code>
/// </summary>
public class PythonScriptRunner
{
    private readonly string _productCode;
    private readonly AddonManager _addonManager;
    private readonly string _tempDir;

    public PythonScriptRunner(string productCode, AddonManager addonManager)
    {
        _productCode = productCode;
        _addonManager = addonManager;
        _tempDir = Path.Combine(Path.GetTempPath(), "harmonic_insight", productCode.ToLowerInvariant(), "python_exchange");
        Directory.CreateDirectory(_tempDir);
    }

    /// <summary>Python 実行パスを取得（モジュール設定から）</summary>
    private string GetPythonPath()
    {
        return _addonManager.GetModuleSetting<string>("python_runtime", "python_path", "python") ?? "python";
    }

    /// <summary>デフォルトタイムアウト（秒）を取得</summary>
    private int GetDefaultTimeout()
    {
        return _addonManager.GetModuleSetting<int>("python_runtime", "execution_timeout", 30);
    }

    // =========================================================================
    // 構文検証（ast.parse）
    // =========================================================================

    /// <summary>
    /// Python コードの構文を検証（ast.parse 使用）
    ///
    /// AI が生成したコードをユーザーに提示する前に必ずこの検証を通す。
    /// </summary>
    public async Task<SyntaxValidationResult> ValidateSyntaxAsync(string code)
    {
        var script = $@"
import ast, sys, json
try:
    ast.parse({JsonSerializer.Serialize(code)})
    print(json.dumps({{'valid': True}}))
except SyntaxError as e:
    print(json.dumps({{
        'valid': False,
        'error': str(e.msg),
        'line': e.lineno,
        'offset': e.offset
    }}))
";
        var result = await RunPythonProcessAsync(script, timeoutSeconds: 10);

        if (result.ExitCode != 0 || string.IsNullOrEmpty(result.Stdout))
        {
            return new SyntaxValidationResult
            {
                Valid = false,
                Error = result.Stderr.Length > 0 ? result.Stderr : "Python process failed",
            };
        }

        try
        {
            var json = JsonSerializer.Deserialize<JsonElement>(result.Stdout.Trim());
            return new SyntaxValidationResult
            {
                Valid = json.GetProperty("valid").GetBoolean(),
                Error = json.TryGetProperty("error", out var err) ? err.GetString() : null,
                Line = json.TryGetProperty("line", out var line) ? line.GetInt32() : null,
                Offset = json.TryGetProperty("offset", out var offset) ? offset.GetInt32() : null,
            };
        }
        catch
        {
            return new SyntaxValidationResult { Valid = false, Error = "Failed to parse validation result" };
        }
    }

    // =========================================================================
    // コード実行（サンドボックス）
    // =========================================================================

    /// <summary>
    /// Python コードを実行（ドキュメントアクセスなし）
    /// </summary>
    public async Task<PythonExecutionResult> ExecuteAsync(string code, int? timeoutSeconds = null)
    {
        var timeout = timeoutSeconds ?? GetDefaultTimeout();

        // まず構文検証
        var validation = await ValidateSyntaxAsync(code);
        if (!validation.Valid)
        {
            return new PythonExecutionResult
            {
                Success = false,
                Stdout = "",
                Stderr = $"SyntaxError: {validation.Error} (line {validation.Line})",
                ExitCode = 1,
                TimedOut = false,
            };
        }

        // 一時ファイルに書き出して実行
        var scriptPath = Path.Combine(_tempDir, $"exec_{Guid.NewGuid():N}.py");
        await File.WriteAllTextAsync(scriptPath, code, Encoding.UTF8);

        try
        {
            var result = await RunPythonFileAsync(scriptPath, timeout, new Dictionary<string, string>
            {
                ["PRODUCT_CODE"] = _productCode,
            });

            return new PythonExecutionResult
            {
                Success = result.ExitCode == 0,
                Stdout = result.Stdout,
                Stderr = result.Stderr,
                ExitCode = result.ExitCode,
                TimedOut = result.TimedOut,
            };
        }
        finally
        {
            TryDeleteFile(scriptPath);
        }
    }

    // =========================================================================
    // ドキュメント処理実行
    // =========================================================================

    /// <summary>
    /// ドキュメントに対して Python スクリプトを実行
    ///
    /// ファイル連携プロトコル:
    /// 1. documentPath をそのまま INPUT_PATH として渡す
    /// 2. OUTPUT_PATH に出力先一時ファイルパスを設定
    /// 3. Python が処理済みファイルを OUTPUT_PATH に書き出し
    /// 4. 呼び出し元が OUTPUT_PATH のファイルを再読み込み
    /// </summary>
    /// <param name="code">Python ソースコード（INPUT_PATH, OUTPUT_PATH 環境変数を使用）</param>
    /// <param name="documentPath">ホストアプリが保存した一時ファイルパス</param>
    /// <param name="documentFormat">ファイル拡張子（.xlsx / .docx / .pptx）</param>
    /// <param name="timeoutSeconds">タイムアウト秒数</param>
    public async Task<DocumentProcessingResult> ExecuteOnDocumentAsync(
        string code,
        string documentPath,
        string documentFormat,
        int? timeoutSeconds = null)
    {
        var timeout = timeoutSeconds ?? GetDefaultTimeout();

        // 構文検証
        var validation = await ValidateSyntaxAsync(code);
        if (!validation.Valid)
        {
            return new DocumentProcessingResult
            {
                Success = false,
                Stdout = "",
                Stderr = $"SyntaxError: {validation.Error} (line {validation.Line})",
                ExitCode = 1,
            };
        }

        // 出力先の一時ファイルを決定
        var outputPath = Path.Combine(_tempDir, $"output_{Guid.NewGuid():N}{documentFormat}");

        // スクリプトファイルを書き出し
        var scriptPath = Path.Combine(_tempDir, $"doc_{Guid.NewGuid():N}.py");
        await File.WriteAllTextAsync(scriptPath, code, Encoding.UTF8);

        try
        {
            var envVars = new Dictionary<string, string>
            {
                ["INPUT_PATH"] = documentPath,
                ["OUTPUT_PATH"] = outputPath,
                ["PRODUCT_CODE"] = _productCode,
            };

            var result = await RunPythonFileAsync(scriptPath, timeout, envVars);

            return new DocumentProcessingResult
            {
                Success = result.ExitCode == 0 && File.Exists(outputPath),
                OutputPath = File.Exists(outputPath) ? outputPath : null,
                Stdout = result.Stdout,
                Stderr = result.Stderr,
                ExitCode = result.ExitCode,
                TimedOut = result.TimedOut,
                DocumentModified = File.Exists(outputPath),
            };
        }
        finally
        {
            TryDeleteFile(scriptPath);
        }
    }

    // =========================================================================
    // Lint チェック
    // =========================================================================

    /// <summary>
    /// Python コードの静的解析（未定義変数・未使用インポート等）
    /// </summary>
    public async Task<List<LintDiagnostic>> LintAsync(string code)
    {
        var script = $@"
import ast, sys, json

code = {JsonSerializer.Serialize(code)}
diagnostics = []

try:
    tree = ast.parse(code)
except SyntaxError as e:
    diagnostics.append({{
        'line': e.lineno or 1,
        'column': e.offset or 0,
        'message': str(e.msg),
        'severity': 'error'
    }})
    print(json.dumps(diagnostics))
    sys.exit(0)

# 簡易チェック: import されたが使われていない名前
imported_names = set()
used_names = set()

for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        for alias in node.names:
            imported_names.add((alias.asname or alias.name, node.lineno))
    elif isinstance(node, ast.ImportFrom):
        for alias in node.names:
            imported_names.add((alias.asname or alias.name, node.lineno))
    elif isinstance(node, ast.Name):
        used_names.add(node.id)

for name, lineno in imported_names:
    if name not in used_names and not name.startswith('_'):
        diagnostics.append({{
            'line': lineno,
            'column': 0,
            'message': f""'{name}' imported but unused"",
            'severity': 'warning'
        }})

print(json.dumps(diagnostics))
";

        var result = await RunPythonProcessAsync(script, timeoutSeconds: 10);

        if (string.IsNullOrEmpty(result.Stdout))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<LintDiagnostic>>(result.Stdout.Trim()) ?? [];
        }
        catch
        {
            return [];
        }
    }

    // =========================================================================
    // 環境チェック
    // =========================================================================

    /// <summary>
    /// Python 環境が利用可能かチェック
    /// </summary>
    public async Task<PythonEnvironmentInfo> CheckEnvironmentAsync()
    {
        var pythonPath = GetPythonPath();

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = pythonPath,
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = Process.Start(psi);
            if (process == null)
                return new PythonEnvironmentInfo { Available = false, Error = "Failed to start Python process" };

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            var version = (stdout + stderr).Trim();
            var available = version.StartsWith("Python ");

            return new PythonEnvironmentInfo
            {
                Available = available,
                Version = version,
                Path = pythonPath,
                Error = available ? null : "Python not found or invalid version",
            };
        }
        catch (Exception ex)
        {
            return new PythonEnvironmentInfo
            {
                Available = false,
                Path = pythonPath,
                Error = $"Python not found: {ex.Message}",
            };
        }
    }

    /// <summary>
    /// pip パッケージのインストール
    /// </summary>
    public async Task<PythonExecutionResult> InstallPackageAsync(string packageName)
    {
        var result = await RunPythonProcessAsync(
            $"-m pip install {packageName}",
            isArguments: true,
            timeoutSeconds: 120);

        return new PythonExecutionResult
        {
            Success = result.ExitCode == 0,
            Stdout = result.Stdout,
            Stderr = result.Stderr,
            ExitCode = result.ExitCode,
        };
    }

    // =========================================================================
    // 一時ファイル管理
    // =========================================================================

    /// <summary>古い一時ファイルをクリーンアップ</summary>
    public void CleanupTempFiles(TimeSpan maxAge)
    {
        if (!Directory.Exists(_tempDir)) return;

        var cutoff = DateTime.Now - maxAge;
        foreach (var file in Directory.GetFiles(_tempDir))
        {
            try
            {
                if (File.GetLastWriteTime(file) < cutoff)
                    File.Delete(file);
            }
            catch
            {
                // ロック中のファイルは無視
            }
        }
    }

    // =========================================================================
    // 内部メソッド
    // =========================================================================

    private async Task<ProcessResult> RunPythonProcessAsync(string scriptOrArgs, bool isArguments = false, int timeoutSeconds = 30)
    {
        var pythonPath = GetPythonPath();
        var psi = new ProcessStartInfo
        {
            FileName = pythonPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = !isArguments,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        if (isArguments)
        {
            psi.Arguments = scriptOrArgs;
        }

        using var process = Process.Start(psi);
        if (process == null)
            return new ProcessResult { ExitCode = -1, Stderr = "Failed to start Python" };

        if (!isArguments)
        {
            await process.StandardInput.WriteAsync(scriptOrArgs);
            process.StandardInput.Close();
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
        try
        {
            await process.WaitForExitAsync(cts.Token);
            return new ProcessResult
            {
                ExitCode = process.ExitCode,
                Stdout = await stdoutTask,
                Stderr = await stderrTask,
                TimedOut = false,
            };
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            return new ProcessResult
            {
                ExitCode = -1,
                Stdout = await stdoutTask,
                Stderr = "Execution timed out",
                TimedOut = true,
            };
        }
    }

    private async Task<ProcessResult> RunPythonFileAsync(
        string scriptPath, int timeoutSeconds, Dictionary<string, string> envVars)
    {
        var pythonPath = GetPythonPath();
        var psi = new ProcessStartInfo
        {
            FileName = pythonPath,
            Arguments = $"\"{scriptPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        foreach (var (key, value) in envVars)
        {
            psi.EnvironmentVariables[key] = value;
        }

        using var process = Process.Start(psi);
        if (process == null)
            return new ProcessResult { ExitCode = -1, Stderr = "Failed to start Python" };

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
        try
        {
            await process.WaitForExitAsync(cts.Token);
            return new ProcessResult
            {
                ExitCode = process.ExitCode,
                Stdout = await stdoutTask,
                Stderr = await stderrTask,
                TimedOut = false,
            };
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            return new ProcessResult
            {
                ExitCode = -1,
                Stdout = await stdoutTask,
                Stderr = "Execution timed out",
                TimedOut = true,
            };
        }
    }

    private static void TryDeleteFile(string path)
    {
        try { File.Delete(path); } catch { }
    }

    private class ProcessResult
    {
        public int ExitCode { get; set; }
        public string Stdout { get; set; } = "";
        public string Stderr { get; set; } = "";
        public bool TimedOut { get; set; }
    }
}

// =========================================================================
// 結果型
// =========================================================================

/// <summary>構文検証結果</summary>
public class SyntaxValidationResult
{
    public bool Valid { get; set; }
    public string? Error { get; set; }
    public int? Line { get; set; }
    public int? Offset { get; set; }
}

/// <summary>Python 実行結果</summary>
public class PythonExecutionResult
{
    public bool Success { get; set; }
    public string Stdout { get; set; } = "";
    public string Stderr { get; set; } = "";
    public int ExitCode { get; set; }
    public bool TimedOut { get; set; }
}

/// <summary>ドキュメント処理結果</summary>
public class DocumentProcessingResult
{
    public bool Success { get; set; }
    public string? OutputPath { get; set; }
    public string Stdout { get; set; } = "";
    public string Stderr { get; set; } = "";
    public int ExitCode { get; set; }
    public bool TimedOut { get; set; }
    public bool DocumentModified { get; set; }
}

/// <summary>Lint 診断結果</summary>
public class LintDiagnostic
{
    public int Line { get; set; }
    public int Column { get; set; }
    public string Message { get; set; } = "";
    public string Severity { get; set; } = "warning";
}

/// <summary>Python 環境情報</summary>
public class PythonEnvironmentInfo
{
    public bool Available { get; set; }
    public string? Version { get; set; }
    public string? Path { get; set; }
    public string? Error { get; set; }
}
