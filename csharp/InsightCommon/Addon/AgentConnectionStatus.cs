namespace InsightCommon.Addon;

/// <summary>
/// Connection status for InsightBot Orchestrator.
/// </summary>
public enum AgentConnectionStatus
{
    /// <summary>Agent is not connected to Orchestrator.</summary>
    Offline,

    /// <summary>Agent is attempting to connect.</summary>
    Connecting,

    /// <summary>Agent is connected and ready for jobs.</summary>
    Online,

    /// <summary>Agent is connected but currently executing a job.</summary>
    Busy,

    /// <summary>Agent lost connection and is attempting to reconnect.</summary>
    Reconnecting,
}
