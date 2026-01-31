namespace HarmonicOffice.Common.License;

/// <summary>
/// ライセンス情報（全製品共通）
/// </summary>
public class LicenseInfo
{
    public bool IsValid { get; set; }
    public PlanCode Plan { get; set; } = PlanCode.Free;
    public string? ProductCode { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Email { get; set; }
    public string? Key { get; set; }

    public bool IsExpired => ExpiresAt.HasValue && DateTime.Now > ExpiresAt.Value;

    public int? DaysRemaining
    {
        get
        {
            if (!ExpiresAt.HasValue) return null;
            var days = (ExpiresAt.Value - DateTime.Now).Days;
            return days < 0 ? 0 : days;
        }
    }

    /// <summary>
    /// プラン表示名（統一: FREE / TRIAL / STD / PRO / ENT）
    /// </summary>
    public string PlanDisplayName => PlanDisplay.GetName(Plan);
}
