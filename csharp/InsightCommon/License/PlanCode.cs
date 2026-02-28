namespace InsightCommon.License;

/// <summary>
/// ライセンスプラン（4ティア制: FREE / TRIAL / BIZ / ENT）
///
/// - FREE:  無料（Group A: 保存/エクスポート不可, Group B: 閲覧モードのみ, Standard ティア）
/// - TRIAL: 評価用（14日間, 全機能, Standard ティア）
/// - BIZ:   ビジネス（365日, 全機能, Standard ティア）
/// - ENT:   エンタープライズ（カスタマイズ, Premium ティア, API/SSO/監査ログ）
/// </summary>
public enum PlanCode
{
    Free,
    Trial,
    Biz,
    Ent
}

/// <summary>
/// プラン表示名（統一: FREE / TRIAL / BIZ / ENT）
/// </summary>
public static class PlanDisplay
{
    public static string GetName(PlanCode plan) => plan switch
    {
        PlanCode.Free  => "FREE",
        PlanCode.Trial => "TRIAL",
        PlanCode.Biz   => "BIZ",
        PlanCode.Ent   => "ENT",
        _              => plan.ToString().ToUpperInvariant(),
    };

    public static string GetNameJa(PlanCode plan) => plan switch
    {
        PlanCode.Free  => "フリー",
        PlanCode.Trial => "トライアル",
        PlanCode.Biz   => "ビジネス",
        PlanCode.Ent   => "エンタープライズ",
        _              => plan.ToString(),
    };

    public static PlanCode Parse(string planStr) => planStr.ToUpperInvariant() switch
    {
        "FREE"  => PlanCode.Free,
        "TRIAL" => PlanCode.Trial,
        "BIZ"   => PlanCode.Biz,
        "ENT"   => PlanCode.Ent,
        _       => PlanCode.Free,
    };
}
