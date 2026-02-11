using System.Diagnostics;
using System.Text;

namespace HarmonicTools.AppManager.Services;

/// <summary>
/// dotnet CLI コマンド実行サービス
/// </summary>
public class CommandRunner
{
    public event Action<string>? OutputReceived;
    public event Action<bool, string>? CommandCompleted;

    private Process? _currentProcess;
    private readonly object _lock = new();

    public bool IsRunning
    {
        get
        {
            lock (_lock)
            {
                return _currentProcess != null && !_currentProcess.HasExited;
            }
        }
    }

    /// <summary>
    /// コマンドを埋め込みコンソールで実行（出力をキャプチャ）
    /// Release パイプライン等、結果判定が必要な場合に使用
    /// </summary>
    public async Task<bool> RunAsync(string command, string arguments, string workingDirectory)
    {
        if (IsRunning)
        {
            OutputReceived?.Invoke("[エラー] 別のコマンドが実行中です。\n");
            return false;
        }

        OutputReceived?.Invoke($"$ {command} {arguments}\n");
        OutputReceived?.Invoke($"  作業ディレクトリ: {workingDirectory}\n");
        OutputReceived?.Invoke("─────────────────────────────────────────\n");

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
            var process = new Process { StartInfo = psi, EnableRaisingEvents = true };

            lock (_lock)
            {
                _currentProcess = process;
            }

            process.OutputDataReceived += (_, e) =>
            {
                if (e.Data != null)
                    OutputReceived?.Invoke(e.Data + "\n");
            };

            process.ErrorDataReceived += (_, e) =>
            {
                if (e.Data != null)
                    OutputReceived?.Invoke("[STDERR] " + e.Data + "\n");
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            var exitCode = process.ExitCode;
            var success = exitCode == 0;

            OutputReceived?.Invoke("─────────────────────────────────────────\n");
            OutputReceived?.Invoke(success
                ? $"[完了] 終了コード: {exitCode}\n\n"
                : $"[失敗] 終了コード: {exitCode}\n\n");

            CommandCompleted?.Invoke(success, success ? "コマンド完了" : $"終了コード: {exitCode}");
            return success;
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke($"[エラー] {ex.Message}\n\n");
            CommandCompleted?.Invoke(false, ex.Message);
            return false;
        }
        finally
        {
            lock (_lock)
            {
                _currentProcess = null;
            }
        }
    }

    /// <summary>
    /// 独立したコンソールウィンドウでコマンドを実行
    /// Build / Run / Publish 等、アプリごとに別ウィンドウで実行する場合に使用
    /// </summary>
    public void RunInExternalConsole(string title, string command, string arguments, string workingDirectory)
    {
        var fullCommand = $"\"{command}\" {arguments}";

        var psi = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/c title {title} && {fullCommand} & echo. & echo ──────────────────────────── & echo 完了しました。何かキーを押すと閉じます。 & pause > nul",
            WorkingDirectory = workingDirectory,
            UseShellExecute = true,
            CreateNoWindow = false
        };

        try
        {
            Process.Start(psi);
            OutputReceived?.Invoke($"[外部コンソール] {title}\n");
            OutputReceived?.Invoke($"  {command} {arguments}\n\n");
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke($"[エラー] 外部コンソール起動失敗: {ex.Message}\n\n");
        }
    }

    /// <summary>
    /// PowerShell スクリプトを独立したコンソールウィンドウで実行
    /// </summary>
    public void RunPs1InExternalConsole(string title, string scriptPath, string arguments, string workingDirectory)
    {
        var args = string.IsNullOrEmpty(arguments) ? "" : $" {arguments}";
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoExit -ExecutionPolicy Bypass -Command \"$host.UI.RawUI.WindowTitle = '{title}'; & '{scriptPath}'{args}; Write-Host ''; Write-Host '────────────────────────────'; Write-Host '完了しました。ウィンドウを閉じてください。'; Read-Host '何かキーを押すと閉じます'\"",
            WorkingDirectory = workingDirectory,
            UseShellExecute = true,
            CreateNoWindow = false
        };

        try
        {
            Process.Start(psi);
            OutputReceived?.Invoke($"[外部コンソール] {title}\n");
            OutputReceived?.Invoke($"  powershell -File {scriptPath}{args}\n\n");
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke($"[エラー] 外部コンソール起動失敗: {ex.Message}\n\n");
        }
    }

    public void Cancel()
    {
        lock (_lock)
        {
            if (_currentProcess != null && !_currentProcess.HasExited)
            {
                try
                {
                    _currentProcess.Kill(true);
                    OutputReceived?.Invoke("[中断] プロセスを終了しました。\n\n");
                }
                catch { }
            }
        }
    }
}
