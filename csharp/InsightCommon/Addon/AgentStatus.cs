namespace InsightCommon.Addon;

/// <summary>
/// Current status of the BotAgent connection to Orchestrator.
/// </summary>
public class AgentStatus
{
    /// <summary>Whether the agent is connected to Orchestrator.</summary>
    public bool Connected { get; set; }

    /// <summary>Unique agent identifier assigned by Orchestrator.</summary>
    public string AgentId { get; set; } = "";

    /// <summary>Number of jobs currently being executed.</summary>
    public int RunningJobs { get; set; }

    /// <summary>List of documents currently open in this agent.</summary>
    public List<string> OpenDocuments { get; set; } = new();

    /// <summary>Current connection status.</summary>
    public AgentConnectionStatus Status { get; set; } = AgentConnectionStatus.Offline;
}
