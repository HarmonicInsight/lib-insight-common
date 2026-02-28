namespace InsightCommon.License;

/// <summary>
/// ライセンスプラン（4ティア制: FREE / TRIAL / BIZ / ENT）
///
/// - FREE:  無料（Group A: 保存/エクスポート不可, Group B: 閲覧モードのみ）
/// - TRIAL: 評価用（30日間, 全機能）
/// - BIZ:   ビジネス（365日, 全機能）
/// - ENT:   エンタープライズ（カスタマイズ, API/SSO/監査ログ）
/// 全プラン共通: BYOK（AIキーはクライアント自社購入）、モデルティア制限なし
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
