namespace InsightCommon.Addon;

/// <summary>
/// Event arguments for job status changes from Orchestrator.
/// </summary>
public class JobStatusEventArgs : EventArgs
{
    /// <summary>Unique job identifier.</summary>
    public string JobId { get; set; } = "";

    /// <summary>Job status (e.g., "queued", "running", "completed", "failed").</summary>
    public string Status { get; set; } = "";

    /// <summary>Optional progress percentage (0-100).</summary>
    public int? Progress { get; set; }

    /// <summary>Optional error message if job failed.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Timestamp of the status change.</summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
