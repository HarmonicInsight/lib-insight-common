using System.Diagnostics;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsightCommon.Addon;

/// <summary>
/// InsightBot Agent サービス（InsightOffice 全アプリ共通）
///
/// config/orchestrator.ts の通信プロトコルに準拠し、
/// addon-modules.ts の BOT_AGENT_MODULE IO コントラクト5つを実装する。
///
/// ## IO コントラクト
/// 1. agent_connect    — Orchestrator への WebSocket 接続・再接続・ハートビート
/// 2. agent_execute_job — OrchestratorJobDispatch を受けて Python スクリプト実行
/// 3. agent_status      — Agent の現在状態（接続・JOB 数・ドキュメント）を返却
/// 4. open_document     — ホストアプリ API でドキュメントを開く
/// 5. close_document    — ドキュメントを閉じる（保存オプション付き）
///
/// ## 通信プロトコル
/// - WebSocket: ws://{host}:{port}/ws/agent （デフォルト port=9400）
/// - Agent → Orchestrator: heartbeat / job_started / job_log / job_completed / workflow_* / document_result
/// - Orchestrator → Agent: job_dispatch / job_cancel / workflow_dispatch / open_document / close_document
///
/// 使用例:
/// <code>
/// var agent = new BotAgentService("HMSH", addonManager, pythonRunner);
/// agent.SetDocumentCallbacks(openDoc, closeDoc);
///
/// // IO contract: agent_connect
/// var result = await agent.ConnectAsync("ws://192.168.1.100:9400/ws/agent", "経理PC-Agent");
///
/// // IO contract: agent_status
/// var status = agent.GetStatus();
///
/// // IO contract: agent_connect (disconnect)
/// await agent.DisconnectAsync();
/// </code>
/// </summary>
public class BotAgentService : IDisposable
{
    private readonly string _productCode;
    private readonly AddonManager _addonManager;
    private readonly PythonScriptRunner _pythonRunner;

    private ClientWebSocket? _webSocket;
    private CancellationTokenSource? _connectionCts;
    private Timer? _heartbeatTimer;
    private readonly SemaphoreSlim _sendLock = new(1, 1);

    // Agent 状態
    private string _agentId = string.Empty;
    private AgentConnectionStatus _connectionStatus = AgentConnectionStatus.Offline;
    private readonly List<RunningJobInfo> _runningJobs = [];
    private readonly List<string> _openDocuments = [];
    private readonly object _stateLock = new();

    // ドキュメント操作コールバック（ホストアプリが設定）
    private Func<string, bool, Task<(bool Success, string? Error)>>? _openDocumentCallback;
    private Func<bool, string?, Task<(bool Success, string? SavedPath, string? Error)>>? _closeDocumentCallback;

    // 再接続設定
    private string? _lastUrl;
    private string? _lastDisplayName;
    private string[]? _lastTags;
    private bool _autoReconnect;
    private int _reconnectAttempts;
    private const int MaxReconnectAttempts = 10;
    private static readonly int[] ReconnectDelaysMs = [1000, 2000, 4000, 8000, 15000, 30000];

    /// <summary>接続状態が変化したとき</summary>
    public event EventHandler<AgentConnectionStatus>? ConnectionStatusChanged;

    /// <summary>JOB 実行ステータスが変化したとき</summary>
    public event EventHandler<JobStatusEventArgs>? JobStatusChanged;

    /// <summary>ログメッセージが発生したとき</summary>
    public event EventHandler<AgentLogEventArgs>? LogMessage;

    public BotAgentService(string productCode, AddonManager addonManager, PythonScriptRunner pythonRunner)
    {
        _productCode = productCode;
        _addonManager = addonManager;
        _pythonRunner = pythonRunner;
    }

    // =========================================================================
    // IO Contract: agent_connect
    // =========================================================================

    /// <summary>
    /// Orchestrator に WebSocket 接続し、Agent を登録してハートビートを開始する。
    ///
    /// IO contract: agent_connect
    /// Input:  orchestrator_url, display_name, tags
    /// Output: connected (bool), agent_id (string)
    /// </summary>
    public async Task<AgentConnectResult> ConnectAsync(
        string orchestratorUrl, string displayName, string[]? tags = null,
        CancellationToken cancellationToken = default)
    {
        // 既存接続があれば切断
        await DisconnectAsync();

        _lastUrl = orchestratorUrl;
        _lastDisplayName = displayName;
        _lastTags = tags;
        _reconnectAttempts = 0;
        _autoReconnect = true;

        return await ConnectInternalAsync(orchestratorUrl, displayName, tags, cancellationToken);
    }

    private async Task<AgentConnectResult> ConnectInternalAsync(
        string orchestratorUrl, string displayName, string[]? tags,
        CancellationToken cancellationToken)
    {
        try
        {
            SetConnectionStatus(AgentConnectionStatus.Connecting);
            EmitLog("info", $"Orchestrator に接続中: {orchestratorUrl}");

            _connectionCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            _webSocket = new ClientWebSocket();

            var uri = new Uri(orchestratorUrl);
            await _webSocket.ConnectAsync(uri, _connectionCts.Token);

            // Agent ID を生成（マシン名 + GUID サフィックス）
            if (string.IsNullOrEmpty(_agentId))
            {
                _agentId = $"{Environment.MachineName}-{Guid.NewGuid():N}"[..32];
            }

            SetConnectionStatus(AgentConnectionStatus.Online);
            EmitLog("info", $"接続完了 (Agent ID: {_agentId})");

            // ハートビート開始
            var heartbeatInterval = _addonManager.GetModuleSetting<int>(
                "bot_agent", "heartbeat_interval", 30);
            _heartbeatTimer = new Timer(
                async _ => await SendHeartbeatSafeAsync(),
                null,
                TimeSpan.Zero,
                TimeSpan.FromSeconds(heartbeatInterval));

            // 受信ループ開始（バックグラウンド）
            _ = Task.Run(() => ReceiveLoopAsync(_connectionCts.Token), _connectionCts.Token);

            _reconnectAttempts = 0;

            return new AgentConnectResult { Connected = true, AgentId = _agentId };
        }
        catch (Exception ex)
        {
            SetConnectionStatus(AgentConnectionStatus.Offline);
            EmitLog("error", $"接続失敗: {ex.Message}");
            return new AgentConnectResult { Connected = false, AgentId = string.Empty, Error = ex.Message };
        }
    }

    /// <summary>Orchestrator から切断</summary>
    public async Task DisconnectAsync()
    {
        _autoReconnect = false;
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;

        if (_webSocket is { State: WebSocketState.Open })
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Agent disconnecting", cts.Token);
            }
            catch
            {
                // 切断失敗は無視
            }
        }

        _connectionCts?.Cancel();
        _connectionCts?.Dispose();
        _connectionCts = null;
        _webSocket?.Dispose();
        _webSocket = null;

        SetConnectionStatus(AgentConnectionStatus.Offline);
        EmitLog("info", "切断しました");
    }

    // =========================================================================
    // IO Contract: agent_status
    // =========================================================================

    /// <summary>
    /// Agent の現在ステータスを取得（同期）
    ///
    /// IO contract: agent_status
    /// Output: connected, orchestrator_url, running_jobs, open_documents
    /// </summary>
    public AgentStatusResult GetStatus()
    {
        lock (_stateLock)
        {
            return new AgentStatusResult
            {
                Connected = _connectionStatus == AgentConnectionStatus.Online
                         || _connectionStatus == AgentConnectionStatus.Busy,
                OrchestratorUrl = _lastUrl ?? string.Empty,
                AgentId = _agentId,
                Status = _connectionStatus,
                RunningJobs = _runningJobs.Count,
                RunningJobDetails = _runningJobs.Select(j => new RunningJobInfo
                {
                    ExecutionId = j.ExecutionId,
                    JobId = j.JobId,
                    StartedAt = j.StartedAt,
                }).ToList(),
                OpenDocuments = [.. _openDocuments],
            };
        }
    }

    // =========================================================================
    // IO Contract: agent_execute_job
    // =========================================================================

    /// <summary>
    /// Orchestrator から配信された JOB を実行する。
    ///
    /// IO contract: agent_execute_job
    /// Input:  execution_id, script, parameters, timeout_seconds
    /// Output: status, exit_code, stdout, stderr, document_modified, duration_ms
    ///
    /// 通常は Orchestrator からの job_dispatch メッセージ経由で呼ばれるが、
    /// ローカルテスト用に直接呼び出しも可能。
    /// </summary>
    public async Task<JobExecutionResult> ExecuteJobAsync(
        string executionId, string jobId, string script,
        Dictionary<string, object>? parameters = null,
        int timeoutSeconds = 300, string? documentPath = null,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        var jobInfo = new RunningJobInfo
        {
            ExecutionId = executionId,
            JobId = jobId,
            StartedAt = DateTime.UtcNow.ToString("o"),
        };

        lock (_stateLock)
        {
            _runningJobs.Add(jobInfo);
            UpdateBusyStatus();
        }

        JobStatusChanged?.Invoke(this, new JobStatusEventArgs(executionId, "running"));

        // Agent → Orchestrator: job_started
        await SendMessageAsync(new
        {
            type = "job_started",
            executionId,
            agentId = _agentId,
            startedAt = jobInfo.StartedAt,
        });

        try
        {
            // ドキュメントを開く（指定がある場合）
            bool documentModified = false;
            if (!string.IsNullOrEmpty(documentPath))
            {
                var openResult = await OpenDocumentAsync(executionId, documentPath);
                if (!openResult.Success)
                {
                    return await CompleteJobAsync(executionId, sw, "failed", 1,
                        "", $"Failed to open document: {openResult.Error}", false);
                }
            }

            // パラメータを環境変数化したスクリプトラッパーを作成
            var wrappedScript = BuildParameterizedScript(script, parameters);

            EmitLog("info", $"JOB 実行開始: {executionId}");

            // Python 実行（リアルタイムログストリーミング付き）
            var result = await ExecuteWithStreamingAsync(
                executionId, wrappedScript, timeoutSeconds, documentPath, cancellationToken);

            documentModified = result.DocumentModified;

            var status = result.TimedOut ? "timeout"
                       : result.ExitCode == 0 ? "completed"
                       : "failed";

            return await CompleteJobAsync(executionId, sw, status, result.ExitCode,
                result.Stdout, result.Stderr, documentModified);
        }
        catch (OperationCanceledException)
        {
            return await CompleteJobAsync(executionId, sw, "cancelled", -1, "", "Job cancelled", false);
        }
        catch (Exception ex)
        {
            EmitLog("error", $"JOB 実行エラー: {ex.Message}");
            return await CompleteJobAsync(executionId, sw, "failed", -1, "", ex.Message, false);
        }
        finally
        {
            lock (_stateLock)
            {
                _runningJobs.RemoveAll(j => j.ExecutionId == executionId);
                UpdateBusyStatus();
            }
        }
    }

    // =========================================================================
    // IO Contract: open_document
    // =========================================================================

    /// <summary>
    /// ドキュメントを開く。
    ///
    /// IO contract: open_document
    /// Input:  execution_id, document_path, read_only
    /// Output: success, document_path, error
    /// </summary>
    public async Task<DocumentOperationResult> OpenDocumentAsync(
        string executionId, string documentPath, bool readOnly = false)
    {
        EmitLog("info", $"ドキュメントを開く: {documentPath}");

        try
        {
            if (_openDocumentCallback == null)
            {
                return new DocumentOperationResult
                {
                    Success = false,
                    DocumentPath = documentPath,
                    Error = "Document open callback not configured",
                };
            }

            var (success, error) = await _openDocumentCallback(documentPath, readOnly);

            if (success)
            {
                lock (_stateLock)
                {
                    if (!_openDocuments.Contains(documentPath))
                        _openDocuments.Add(documentPath);
                }
            }

            // Agent → Orchestrator: document_result
            await SendMessageAsync(new
            {
                type = "document_result",
                executionId,
                agentId = _agentId,
                action = "opened",
                documentPath,
                success,
                error = error ?? (string?)null,
            });

            return new DocumentOperationResult
            {
                Success = success,
                DocumentPath = documentPath,
                Error = error,
            };
        }
        catch (Exception ex)
        {
            EmitLog("error", $"ドキュメントを開けません: {ex.Message}");
            return new DocumentOperationResult
            {
                Success = false,
                DocumentPath = documentPath,
                Error = ex.Message,
            };
        }
    }

    // =========================================================================
    // IO Contract: close_document (5th contract — replaces execute_workflow at IO level)
    // =========================================================================

    /// <summary>
    /// ドキュメントを閉じる。
    ///
    /// IO contract: close_document
    /// Input:  execution_id, save, save_as_path
    /// Output: success, saved_path, error
    /// </summary>
    public async Task<CloseDocumentResult> CloseDocumentAsync(
        string executionId, bool save = true, string? saveAsPath = null)
    {
        EmitLog("info", $"ドキュメントを閉じる (save={save})");

        try
        {
            if (_closeDocumentCallback == null)
            {
                return new CloseDocumentResult
                {
                    Success = false,
                    Error = "Document close callback not configured",
                };
            }

            var (success, savedPath, error) = await _closeDocumentCallback(save, saveAsPath);

            if (success)
            {
                lock (_stateLock)
                {
                    // 最後に開いたドキュメントを除去
                    if (_openDocuments.Count > 0)
                        _openDocuments.RemoveAt(_openDocuments.Count - 1);
                }
            }

            // Agent → Orchestrator: document_result
            await SendMessageAsync(new
            {
                type = "document_result",
                executionId,
                agentId = _agentId,
                action = "closed",
                documentPath = savedPath ?? string.Empty,
                success,
                error = error ?? (string?)null,
            });

            return new CloseDocumentResult
            {
                Success = success,
                SavedPath = savedPath,
                Error = error,
            };
        }
        catch (Exception ex)
        {
            EmitLog("error", $"ドキュメントを閉じられません: {ex.Message}");
            return new CloseDocumentResult
            {
                Success = false,
                Error = ex.Message,
            };
        }
    }

    // =========================================================================
    // ホストアプリ連携
    // =========================================================================

    /// <summary>
    /// ドキュメント操作コールバックを設定（ホストアプリが呼ぶ）
    ///
    /// openCallback:  (filePath, readOnly) → (success, error)
    /// closeCallback: (save, saveAsPath) → (success, savedPath, error)
    /// </summary>
    public void SetDocumentCallbacks(
        Func<string, bool, Task<(bool Success, string? Error)>> openCallback,
        Func<bool, string?, Task<(bool Success, string? SavedPath, string? Error)>> closeCallback)
    {
        _openDocumentCallback = openCallback;
        _closeDocumentCallback = closeCallback;
    }

    // =========================================================================
    // WebSocket 受信ループ
    // =========================================================================

    private async Task ReceiveLoopAsync(CancellationToken ct)
    {
        var buffer = new byte[8192];
        var messageBuffer = new MemoryStream();

        try
        {
            while (!ct.IsCancellationRequested && _webSocket?.State == WebSocketState.Open)
            {
                WebSocketReceiveResult receiveResult;
                messageBuffer.SetLength(0);

                do
                {
                    receiveResult = await _webSocket.ReceiveAsync(
                        new ArraySegment<byte>(buffer), ct);
                    messageBuffer.Write(buffer, 0, receiveResult.Count);
                }
                while (!receiveResult.EndOfMessage);

                if (receiveResult.MessageType == WebSocketMessageType.Close)
                {
                    EmitLog("info", "Orchestrator が接続を閉じました");
                    break;
                }

                if (receiveResult.MessageType == WebSocketMessageType.Text)
                {
                    var json = Encoding.UTF8.GetString(
                        messageBuffer.GetBuffer(), 0, (int)messageBuffer.Length);
                    await HandleMessageAsync(json);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // 正常キャンセル
        }
        catch (WebSocketException ex)
        {
            EmitLog("warn", $"WebSocket エラー: {ex.Message}");
        }
        catch (Exception ex)
        {
            EmitLog("error", $"受信ループエラー: {ex.Message}");
        }
        finally
        {
            messageBuffer.Dispose();
        }

        // 自動再接続
        if (_autoReconnect && !ct.IsCancellationRequested)
        {
            await AttemptReconnectAsync();
        }
    }

    private async Task HandleMessageAsync(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("type", out var typeProp))
                return;

            var type = typeProp.GetString();
            EmitLog("debug", $"受信: {type}");

            switch (type)
            {
                case "job_dispatch":
                    await HandleJobDispatchAsync(root);
                    break;

                case "job_cancel":
                    HandleJobCancel(root);
                    break;

                case "workflow_dispatch":
                    await HandleWorkflowDispatchAsync(root);
                    break;

                case "open_document":
                    await HandleOpenDocumentAsync(root);
                    break;

                case "close_document":
                    await HandleCloseDocumentAsync(root);
                    break;

                default:
                    EmitLog("warn", $"未知のメッセージタイプ: {type}");
                    break;
            }
        }
        catch (Exception ex)
        {
            EmitLog("error", $"メッセージ処理エラー: {ex.Message}");
        }
    }

    /// <summary>OrchestratorJobDispatch を処理</summary>
    private Task HandleJobDispatchAsync(JsonElement root)
    {
        var executionId = root.GetProperty("executionId").GetString()!;
        var jobId = root.GetProperty("jobId").GetString()!;
        var script = root.GetProperty("script").GetString()!;
        var timeoutSeconds = root.GetProperty("timeoutSeconds").GetInt32();
        var documentPath = root.TryGetProperty("documentPath", out var dp) ? dp.GetString() : null;

        Dictionary<string, object>? parameters = null;
        if (root.TryGetProperty("parameters", out var paramsProp))
        {
            parameters = [];
            foreach (var prop in paramsProp.EnumerateObject())
            {
                parameters[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString()!,
                    JsonValueKind.Number => prop.Value.GetDouble(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    _ => prop.Value.GetRawText(),
                };
            }
        }

        // 最大同時実行数チェック
        var maxConcurrent = _addonManager.GetModuleSetting<int>("bot_agent", "max_concurrent_jobs", 1);
        lock (_stateLock)
        {
            if (_runningJobs.Count >= maxConcurrent)
            {
                EmitLog("warn", $"JOB 拒否（同時実行上限 {maxConcurrent} に達しています）: {executionId}");
                _ = SendMessageAsync(new
                {
                    type = "job_completed",
                    executionId,
                    agentId = _agentId,
                    status = "failed",
                    exitCode = -1,
                    stdout = "",
                    stderr = $"Agent busy: max concurrent jobs ({maxConcurrent}) reached",
                    documentModified = false,
                    completedAt = DateTime.UtcNow.ToString("o"),
                    durationMs = 0,
                });
                return Task.CompletedTask;
            }
        }

        // バックグラウンドで JOB 実行
        _ = Task.Run(async () =>
        {
            await ExecuteJobAsync(executionId, jobId, script, parameters,
                timeoutSeconds, documentPath);
        });

        return Task.CompletedTask;
    }

    /// <summary>OrchestratorJobCancel を処理</summary>
    private void HandleJobCancel(JsonElement root)
    {
        var executionId = root.GetProperty("executionId").GetString()!;
        EmitLog("info", $"JOB キャンセル要求: {executionId}");
        // CancellationToken で対応するジョブをキャンセル（将来拡張）
        // 現在は実行中のジョブに対するキャンセル通知機構を持たないため、ログのみ
        JobStatusChanged?.Invoke(this, new JobStatusEventArgs(executionId, "cancelled"));
    }

    /// <summary>OrchestratorWorkflowDispatch を処理</summary>
    private async Task HandleWorkflowDispatchAsync(JsonElement root)
    {
        var workflowExecutionId = root.GetProperty("workflowExecutionId").GetString()!;
        var steps = root.GetProperty("steps");
        var totalSteps = steps.GetArrayLength();
        var completedSteps = 0;
        var overallStatus = "completed";
        var sw = Stopwatch.StartNew();

        EmitLog("info", $"ワークフロー開始: {workflowExecutionId} ({totalSteps} ステップ)");

        foreach (var step in steps.EnumerateArray())
        {
            var stepIndex = step.GetProperty("stepIndex").GetInt32();
            var stepName = step.GetProperty("name").GetString()!;
            var jobId = step.GetProperty("jobId").GetString()!;
            var script = step.GetProperty("script").GetString()!;
            var documentPath = step.GetProperty("documentPath").GetString()!;
            var timeoutSeconds = step.GetProperty("timeoutSeconds").GetInt32();
            var onError = step.GetProperty("onError").GetString()!;

            var executionId = $"{workflowExecutionId}-step{stepIndex}";

            EmitLog("info", $"ステップ {stepIndex}: {stepName}");

            // ドキュメントを開く
            var openResult = await OpenDocumentAsync(executionId, documentPath);
            if (!openResult.Success)
            {
                await SendWorkflowStepResult(workflowExecutionId, stepIndex, executionId,
                    "failed", -1, documentPath, false, 0);

                if (onError == "stop")
                {
                    overallStatus = "failed";
                    break;
                }
                continue;
            }

            // スクリプト実行
            var stepSw = Stopwatch.StartNew();
            var jobResult = await ExecuteJobAsync(executionId, jobId, script,
                null, timeoutSeconds, documentPath);
            stepSw.Stop();

            // ドキュメントを閉じる
            await CloseDocumentAsync(executionId, save: true);

            var stepStatus = jobResult.Status;

            await SendWorkflowStepResult(workflowExecutionId, stepIndex, executionId,
                stepStatus, jobResult.ExitCode, documentPath,
                jobResult.DocumentModified, (int)stepSw.ElapsedMilliseconds);

            if (stepStatus == "completed")
            {
                completedSteps++;
            }
            else if (onError == "stop")
            {
                overallStatus = "failed";
                break;
            }
            else if (onError == "skip")
            {
                continue;
            }
        }

        sw.Stop();

        // Agent → Orchestrator: workflow_completed
        await SendMessageAsync(new
        {
            type = "workflow_completed",
            workflowExecutionId,
            agentId = _agentId,
            status = overallStatus,
            completedSteps,
            totalSteps,
            filesProcessed = completedSteps,
            totalDurationMs = (int)sw.ElapsedMilliseconds,
            completedAt = DateTime.UtcNow.ToString("o"),
        });

        EmitLog("info", $"ワークフロー完了: {workflowExecutionId} ({completedSteps}/{totalSteps})");
    }

    /// <summary>OrchestratorOpenDocument を処理</summary>
    private async Task HandleOpenDocumentAsync(JsonElement root)
    {
        var executionId = root.GetProperty("executionId").GetString()!;
        var documentPath = root.GetProperty("documentPath").GetString()!;
        await OpenDocumentAsync(executionId, documentPath);
    }

    /// <summary>OrchestratorCloseDocument を処理</summary>
    private async Task HandleCloseDocumentAsync(JsonElement root)
    {
        var executionId = root.GetProperty("executionId").GetString()!;
        var save = root.TryGetProperty("save", out var saveProp) && saveProp.GetBoolean();
        await CloseDocumentAsync(executionId, save);
    }

    // =========================================================================
    // ハートビート
    // =========================================================================

    private async Task SendHeartbeatSafeAsync()
    {
        try
        {
            await SendHeartbeatAsync();
        }
        catch (Exception ex)
        {
            EmitLog("warn", $"ハートビート送信失敗: {ex.Message}");
        }
    }

    private async Task SendHeartbeatAsync()
    {
        if (_webSocket?.State != WebSocketState.Open) return;

        int runningJobs;
        string[] openDocs;
        lock (_stateLock)
        {
            runningJobs = _runningJobs.Count;
            openDocs = [.. _openDocuments];
        }

        var currentProcess = Process.GetCurrentProcess();
        var cpuUsage = 0.0; // CPU 使用率の精密計測は省略（将来拡張）
        var memoryMb = currentProcess.WorkingSet64 / (1024.0 * 1024.0);

        await SendMessageAsync(new
        {
            type = "heartbeat",
            agentId = _agentId,
            status = _connectionStatus switch
            {
                AgentConnectionStatus.Busy => "busy",
                AgentConnectionStatus.Online => "online",
                _ => "offline",
            },
            runningJobs,
            cpuUsagePercent = Math.Round(cpuUsage, 1),
            memoryUsageMb = Math.Round(memoryMb, 0),
            openDocuments = openDocs,
        });
    }

    // =========================================================================
    // 再接続
    // =========================================================================

    private async Task AttemptReconnectAsync()
    {
        if (!_autoReconnect || _lastUrl == null || _lastDisplayName == null)
            return;

        while (_autoReconnect && _reconnectAttempts < MaxReconnectAttempts)
        {
            _reconnectAttempts++;
            var delayIndex = Math.Min(_reconnectAttempts - 1, ReconnectDelaysMs.Length - 1);
            var delay = ReconnectDelaysMs[delayIndex];

            SetConnectionStatus(AgentConnectionStatus.Reconnecting);
            EmitLog("info", $"再接続試行 {_reconnectAttempts}/{MaxReconnectAttempts} ({delay}ms 待機)");

            await Task.Delay(delay);

            if (!_autoReconnect) return;

            var result = await ConnectInternalAsync(_lastUrl, _lastDisplayName, _lastTags, default);
            if (result.Connected)
            {
                EmitLog("info", "再接続成功");
                return;
            }
        }

        if (_reconnectAttempts >= MaxReconnectAttempts)
        {
            EmitLog("error", $"再接続失敗（{MaxReconnectAttempts} 回試行）");
            SetConnectionStatus(AgentConnectionStatus.Offline);
        }
    }

    // =========================================================================
    // Python 実行（ストリーミングログ付き）
    // =========================================================================

    private async Task<StreamingExecutionResult> ExecuteWithStreamingAsync(
        string executionId, string script, int timeoutSeconds,
        string? documentPath, CancellationToken ct)
    {
        // PythonScriptRunner を使ってドキュメント処理または通常実行
        if (!string.IsNullOrEmpty(documentPath))
        {
            var ext = Path.GetExtension(documentPath);
            var result = await _pythonRunner.ExecuteOnDocumentAsync(script, documentPath, ext, timeoutSeconds);
            return new StreamingExecutionResult
            {
                ExitCode = result.ExitCode,
                Stdout = result.Stdout,
                Stderr = result.Stderr,
                TimedOut = result.TimedOut,
                DocumentModified = result.DocumentModified,
            };
        }
        else
        {
            var result = await _pythonRunner.ExecuteAsync(script, timeoutSeconds);
            return new StreamingExecutionResult
            {
                ExitCode = result.ExitCode,
                Stdout = result.Stdout,
                Stderr = result.Stderr,
                TimedOut = result.TimedOut,
                DocumentModified = false,
            };
        }
    }

    // =========================================================================
    // ヘルパー
    // =========================================================================

    private async Task<JobExecutionResult> CompleteJobAsync(
        string executionId, Stopwatch sw, string status,
        int exitCode, string stdout, string stderr, bool documentModified)
    {
        sw.Stop();
        var durationMs = (int)sw.ElapsedMilliseconds;

        // Agent → Orchestrator: job_completed
        await SendMessageAsync(new
        {
            type = "job_completed",
            executionId,
            agentId = _agentId,
            status,
            exitCode,
            stdout,
            stderr,
            documentModified,
            completedAt = DateTime.UtcNow.ToString("o"),
            durationMs,
        });

        EmitLog("info", $"JOB 完了: {executionId} (status={status}, {durationMs}ms)");
        JobStatusChanged?.Invoke(this, new JobStatusEventArgs(executionId, status));

        return new JobExecutionResult
        {
            Status = status,
            ExitCode = exitCode,
            Stdout = stdout,
            Stderr = stderr,
            DocumentModified = documentModified,
            DurationMs = durationMs,
        };
    }

    private async Task SendWorkflowStepResult(
        string workflowExecutionId, int stepIndex, string executionId,
        string status, int exitCode, string documentPath,
        bool documentModified, int durationMs)
    {
        await SendMessageAsync(new
        {
            type = "workflow_step_completed",
            workflowExecutionId,
            stepIndex,
            executionId,
            agentId = _agentId,
            status,
            exitCode,
            documentPath,
            documentModified,
            durationMs,
        });
    }

    private async Task SendMessageAsync(object message)
    {
        if (_webSocket?.State != WebSocketState.Open) return;

        var json = JsonSerializer.Serialize(message, JsonOptions.CamelCase);
        var bytes = Encoding.UTF8.GetBytes(json);

        await _sendLock.WaitAsync();
        try
        {
            await _webSocket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                _connectionCts?.Token ?? CancellationToken.None);
        }
        finally
        {
            _sendLock.Release();
        }
    }

    private static string BuildParameterizedScript(string script, Dictionary<string, object>? parameters)
    {
        if (parameters == null || parameters.Count == 0)
            return script;

        // パラメータを Python 変数として先頭に注入
        var sb = new StringBuilder();
        sb.AppendLine("# --- InsightBot Agent: JOB Parameters ---");
        sb.AppendLine("import json as _json");
        sb.Append("_params = _json.loads(")
          .Append(JsonSerializer.Serialize(JsonSerializer.Serialize(parameters)))
          .AppendLine(")");

        foreach (var (key, _) in parameters)
        {
            sb.Append(key).Append(" = _params[")
              .Append(JsonSerializer.Serialize(key))
              .AppendLine("]");
        }

        sb.AppendLine("# --- End Parameters ---");
        sb.AppendLine();
        sb.Append(script);

        return sb.ToString();
    }

    private void SetConnectionStatus(AgentConnectionStatus status)
    {
        if (_connectionStatus == status) return;
        _connectionStatus = status;
        ConnectionStatusChanged?.Invoke(this, status);
    }

    private void UpdateBusyStatus()
    {
        var shouldBeBusy = _runningJobs.Count > 0;
        var currentlyConnected = _connectionStatus == AgentConnectionStatus.Online
                              || _connectionStatus == AgentConnectionStatus.Busy;
        if (!currentlyConnected) return;

        SetConnectionStatus(shouldBeBusy ? AgentConnectionStatus.Busy : AgentConnectionStatus.Online);
    }

    private void EmitLog(string level, string message)
    {
        LogMessage?.Invoke(this, new AgentLogEventArgs(level, message, DateTime.UtcNow));
    }

    public void Dispose()
    {
        _autoReconnect = false;
        _heartbeatTimer?.Dispose();
        _connectionCts?.Cancel();
        _connectionCts?.Dispose();
        _webSocket?.Dispose();
        _sendLock.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>JSON シリアライズオプション</summary>
    private static class JsonOptions
    {
        public static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };
    }

    private sealed class StreamingExecutionResult
    {
        public int ExitCode { get; set; }
        public string Stdout { get; set; } = "";
        public string Stderr { get; set; } = "";
        public bool TimedOut { get; set; }
        public bool DocumentModified { get; set; }
    }
}

// =============================================================================
// 結果型・イベント型
// =============================================================================

/// <summary>Agent の接続状態</summary>
public enum AgentConnectionStatus
{
    Offline,
    Connecting,
    Online,
    Busy,
    Reconnecting,
}

/// <summary>agent_connect の結果</summary>
public class AgentConnectResult
{
    public bool Connected { get; set; }
    public string AgentId { get; set; } = string.Empty;
    public string? Error { get; set; }
}

/// <summary>agent_status の結果</summary>
public class AgentStatusResult
{
    public bool Connected { get; set; }
    public string OrchestratorUrl { get; set; } = string.Empty;
    public string AgentId { get; set; } = string.Empty;
    public AgentConnectionStatus Status { get; set; }
    public int RunningJobs { get; set; }
    public List<RunningJobInfo> RunningJobDetails { get; set; } = [];
    public List<string> OpenDocuments { get; set; } = [];
}

/// <summary>agent_execute_job の結果</summary>
public class JobExecutionResult
{
    public string Status { get; set; } = "failed";
    public int ExitCode { get; set; }
    public string Stdout { get; set; } = "";
    public string Stderr { get; set; } = "";
    public bool DocumentModified { get; set; }
    public int DurationMs { get; set; }
}

/// <summary>open_document の結果</summary>
public class DocumentOperationResult
{
    public bool Success { get; set; }
    public string DocumentPath { get; set; } = string.Empty;
    public string? Error { get; set; }
}

/// <summary>close_document の結果</summary>
public class CloseDocumentResult
{
    public bool Success { get; set; }
    public string? SavedPath { get; set; }
    public string? Error { get; set; }
}

/// <summary>実行中 JOB 情報</summary>
public class RunningJobInfo
{
    public string ExecutionId { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;
    public string StartedAt { get; set; } = string.Empty;
}

/// <summary>JOB ステータス変更イベント</summary>
public class JobStatusEventArgs(string executionId, string status) : EventArgs
{
    public string ExecutionId { get; } = executionId;
    public string Status { get; } = status;
}

/// <summary>Agent ログイベント</summary>
public class AgentLogEventArgs(string level, string message, DateTime timestamp) : EventArgs
{
    public string Level { get; } = level;
    public string Message { get; } = message;
    public DateTime Timestamp { get; } = timestamp;
}
