namespace InsightCommon.Addon;

/// <summary>
/// Event arguments for log messages from the BotAgent.
/// </summary>
public class AgentLogEventArgs : EventArgs
{
    /// <summary>Log message text.</summary>
    public string Message { get; set; } = "";

    /// <summary>Log level (Info, Warning, Error).</summary>
    public LogLevel Level { get; set; } = LogLevel.Info;

    /// <summary>Timestamp of the log message.</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Log level enumeration.
    /// </summary>
    public enum LogLevel
    {
        Debug,
        Info,
        Warning,
        Error
    }
}
