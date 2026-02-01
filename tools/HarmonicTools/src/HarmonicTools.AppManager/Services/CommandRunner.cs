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
