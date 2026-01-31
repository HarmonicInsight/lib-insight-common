namespace HarmonicOffice.Common.License;

/// <summary>
/// ライセンスプラン
/// </summary>
public enum PlanCode
{
    Free,
    Trial,
    Std,
    Pro,
    Ent
}

/// <summary>
/// プラン表示名（統一: FREE / TRIAL / STD / PRO / ENT）
/// </summary>
public static class PlanDisplay
{
    public static string GetName(PlanCode plan) => plan switch
    {
        PlanCode.Free  => "FREE",
        PlanCode.Trial => "TRIAL",
        PlanCode.Std   => "STD",
        PlanCode.Pro   => "PRO",
        PlanCode.Ent   => "ENT",
        _              => plan.ToString().ToUpperInvariant(),
    };

    public static PlanCode Parse(string planStr) => planStr.ToUpperInvariant() switch
    {
        "TRIAL" => PlanCode.Trial,
        "STD"   => PlanCode.Std,
        "PRO"   => PlanCode.Pro,
        "ENT"   => PlanCode.Ent,
        _       => PlanCode.Free,
    };
}
