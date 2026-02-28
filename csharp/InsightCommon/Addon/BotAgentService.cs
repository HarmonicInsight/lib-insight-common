namespace InsightCommon.Addon;

/// <summary>
/// Service for connecting InsightOffice applications to InsightBot Orchestrator.
/// Enables remote job execution, status reporting, and log streaming.
/// </summary>
public class BotAgentService : IDisposable
{
    private readonly string _productCode;
    private readonly AddonManager _addonManager;
    private readonly PythonScriptRunner _pythonRunner;
    private readonly string _orchestratorUrl;
    private readonly int _port;
    private AgentStatus _status = new();
    private bool _disposed;

    // Document callbacks for Orchestrator JOB execution
    private Func<string, object?, Task<(bool Success, string? Error)>>? _openDocumentCallback;
    private Func<bool, string?, Task<(bool Success, string? SavedPath, string? Error)>>? _closeDocumentCallback;

    /// <summary>
    /// Fired when the connection status to Orchestrator changes.
    /// </summary>
    public event EventHandler<AgentConnectionStatus>? ConnectionStatusChanged;

    /// <summary>
    /// Fired when a job status changes.
    /// </summary>
    public event EventHandler<JobStatusEventArgs>? JobStatusChanged;

    /// <summary>
    /// Fired when a log message is received or generated.
    /// </summary>
    public event EventHandler<AgentLogEventArgs>? LogMessage;

    /// <summary>
    /// Creates a new BotAgentService instance.
    /// </summary>
    /// <param name="productCode">Product code (e.g., "IOSH", "INSS").</param>
    /// <param name="addonManager">The AddonManager instance.</param>
    /// <param name="pythonRunner">The PythonScriptRunner instance for executing scripts.</param>
    /// <param name="orchestratorUrl">URL of the InsightBot Orchestrator server.</param>
    /// <param name="port">Port for the agent server (default: 9400).</param>
    public BotAgentService(
        string productCode,
        AddonManager addonManager,
        PythonScriptRunner pythonRunner,
        string orchestratorUrl = "http://localhost",
        int port = 9400)
    {
        _productCode = productCode;
        _addonManager = addonManager;
        _pythonRunner = pythonRunner;
        _orchestratorUrl = orchestratorUrl;
        _port = port;
    }

    /// <summary>
    /// Gets the current agent status.
    /// </summary>
    public AgentStatus GetStatus() => _status;

    /// <summary>
    /// Sets document callbacks for Orchestrator JOB execution.
    /// </summary>
    /// <param name="openCallback">Callback to open a document. Args: (path, options). Returns: (success, error).</param>
    /// <param name="closeCallback">Callback to close the current document. Args: (save, saveAsPath). Returns: (success, savedPath, error).</param>
    public void SetDocumentCallbacks(
        Func<string, object?, Task<(bool Success, string? Error)>>? openCallback,
        Func<bool, string?, Task<(bool Success, string? SavedPath, string? Error)>>? closeCallback)
    {
        _openDocumentCallback = openCallback;
        _closeDocumentCallback = closeCallback;
    }

    /// <summary>
    /// Opens a document via the registered callback.
    /// </summary>
    public async Task<(bool Success, string? Error)> OpenDocumentAsync(string path, object? options = null)
    {
        if (_openDocumentCallback == null)
            return (false, "Open document callback not registered");

        try
        {
            var result = await _openDocumentCallback(path, options);
            if (result.Success)
                ReportDocumentOpened(path);
            return result;
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    /// <summary>
    /// Closes the current document via the registered callback.
    /// </summary>
    public async Task<(bool Success, string? SavedPath, string? Error)> CloseDocumentAsync(bool save = false, string? saveAsPath = null)
    {
        if (_closeDocumentCallback == null)
            return (false, null, "Close document callback not registered");

        try
        {
            return await _closeDocumentCallback(save, saveAsPath);
        }
        catch (Exception ex)
        {
            return (false, null, ex.Message);
        }
    }

    /// <summary>
    /// Attempts to connect to the Orchestrator.
    /// </summary>
    public async Task ConnectAsync()
    {
        if (_disposed) return;

        try
        {
            _status.Status = AgentConnectionStatus.Connecting;
            ConnectionStatusChanged?.Invoke(this, AgentConnectionStatus.Connecting);
            Log("Connecting to Orchestrator...");

            // TODO: Implement actual WebSocket/HTTP connection to Orchestrator
            await Task.Delay(100); // Placeholder

            _status.Status = AgentConnectionStatus.Online;
            _status.Connected = true;
            _status.AgentId = Guid.NewGuid().ToString("N")[..8];
            ConnectionStatusChanged?.Invoke(this, AgentConnectionStatus.Online);
            Log($"Connected as agent {_status.AgentId}");
        }
        catch (Exception ex)
        {
            _status.Status = AgentConnectionStatus.Offline;
            _status.Connected = false;
            ConnectionStatusChanged?.Invoke(this, AgentConnectionStatus.Offline);
            Log($"Connection failed: {ex.Message}", AgentLogEventArgs.LogLevel.Error);
        }
    }

    /// <summary>
    /// Disconnects from the Orchestrator.
    /// </summary>
    public async Task DisconnectAsync()
    {
        if (_disposed) return;

        try
        {
            Log("Disconnecting from Orchestrator...");
            await Task.Delay(50); // Placeholder

            _status.Status = AgentConnectionStatus.Offline;
            _status.Connected = false;
            _status.AgentId = "";
            ConnectionStatusChanged?.Invoke(this, AgentConnectionStatus.Offline);
            Log("Disconnected");
        }
        catch (Exception ex)
        {
            Log($"Disconnect error: {ex.Message}", AgentLogEventArgs.LogLevel.Warning);
        }
    }

    /// <summary>
    /// Reports that a document has been opened.
    /// </summary>
    public void ReportDocumentOpened(string documentPath)
    {
        if (!_status.OpenDocuments.Contains(documentPath))
        {
            _status.OpenDocuments.Add(documentPath);
            Log($"Document opened: {System.IO.Path.GetFileName(documentPath)}");
        }
    }

    /// <summary>
    /// Reports that a document has been closed.
    /// </summary>
    public void ReportDocumentClosed(string documentPath)
    {
        _status.OpenDocuments.Remove(documentPath);
        Log($"Document closed: {System.IO.Path.GetFileName(documentPath)}");
    }

    /// <summary>
    /// Reports job progress to the Orchestrator.
    /// </summary>
    public void ReportJobProgress(string jobId, int progress, string? message = null)
    {
        JobStatusChanged?.Invoke(this, new JobStatusEventArgs
        {
            JobId = jobId,
            Status = "running",
            Progress = progress,
        });

        if (!string.IsNullOrEmpty(message))
            Log($"[Job {jobId}] {message}");
    }

    /// <summary>
    /// Reports job completion to the Orchestrator.
    /// </summary>
    public void ReportJobCompleted(string jobId, bool success, string? errorMessage = null)
    {
        if (success)
        {
            _status.RunningJobs = Math.Max(0, _status.RunningJobs - 1);
            JobStatusChanged?.Invoke(this, new JobStatusEventArgs
            {
                JobId = jobId,
                Status = "completed",
                Progress = 100,
            });
            Log($"[Job {jobId}] Completed successfully");
        }
        else
        {
            _status.RunningJobs = Math.Max(0, _status.RunningJobs - 1);
            JobStatusChanged?.Invoke(this, new JobStatusEventArgs
            {
                JobId = jobId,
                Status = "failed",
                ErrorMessage = errorMessage,
            });
            Log($"[Job {jobId}] Failed: {errorMessage}", AgentLogEventArgs.LogLevel.Error);
        }

        // Update status if no more running jobs
        if (_status.RunningJobs == 0 && _status.Status == AgentConnectionStatus.Busy)
        {
            _status.Status = AgentConnectionStatus.Online;
            ConnectionStatusChanged?.Invoke(this, AgentConnectionStatus.Online);
        }
    }

    private void Log(string message, AgentLogEventArgs.LogLevel level = AgentLogEventArgs.LogLevel.Info)
    {
        LogMessage?.Invoke(this, new AgentLogEventArgs
        {
            Message = message,
            Level = level,
            Timestamp = DateTime.UtcNow,
        });
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        if (disposing)
        {
            // Cleanup managed resources
            _ = DisconnectAsync();
        }

        _disposed = true;
    }
}
