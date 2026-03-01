namespace InsightCommon.License;

/// <summary>
/// ライセンスプラン（4ティア制: FREE / TRIAL / BUSINESS / ENTERPRIZE）
///
/// - FREE:        無料（Group A: 保存/エクスポート不可, Group B: 閲覧モードのみ）
/// - TRIAL:       評価用（30日間, 全機能）
/// - BUSINESS:    ビジネス（365日, 全機能）
/// - ENTERPRIZE:  エンタープライズ（カスタマイズ, API/SSO/監査ログ）
/// 全プラン共通: BYOK（AIキーはクライアント自社購入）、モデルティア制限なし
/// ※ ライセンスキーでは短縮形 BIZ / ENT を使用
/// </summary>
public enum PlanCode
{
    Free,
    Trial,
    Biz,
    Ent
}

/// <summary>
/// プラン表示名（統一: FREE / TRIAL / BUSINESS / ENTERPRIZE）
/// ※ ライセンスキーの短縮形 (BIZ/ENT) とは異なる
/// </summary>
public static class PlanDisplay
{
    public static string GetName(PlanCode plan) => plan switch
    {
        PlanCode.Free  => "FREE",
        PlanCode.Trial => "TRIAL",
        PlanCode.Biz   => "BUSINESS",
        PlanCode.Ent   => "ENTERPRIZE",
        _              => plan.ToString().ToUpperInvariant(),
    };

    /// <summary>
    /// ライセンスキー / AllowedPlans 用の短縮名（FREE / TRIAL / BIZ / ENT）
    /// AddonModuleCatalog の AllowedPlans 比較に使用。
    /// </summary>
    public static string GetKeyName(PlanCode plan) => plan switch
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
        "FREE"       => PlanCode.Free,
        "TRIAL"      => PlanCode.Trial,
        "BIZ"        => PlanCode.Biz,
        "BUSINESS"   => PlanCode.Biz,
        "ENT"        => PlanCode.Ent,
        "ENTERPRIZE" => PlanCode.Ent,
        _            => PlanCode.Free,
    };
}
