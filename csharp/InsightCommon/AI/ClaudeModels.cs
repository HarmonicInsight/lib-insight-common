namespace InsightCommon.AI;

/// <summary>
/// Claude APIモデル定義 — 全Insight Business Suite系アプリで共通利用
///
/// 【モデルレジストリ方式】
/// 新モデルのリリース時は Registry に1エントリ追加し、
/// DefaultStandardModel / DefaultPremiumModel を更新するだけで全製品に反映。
/// BYOK — 全プランで全モデル利用可能（モデルティア制限なし）。
/// ユーザーは設定画面から全モデルを自由に選択可能。
/// </summary>
public static class ClaudeModels
{
    // =========================================================================
    // モデル ID 定数（後方互換用）
    // =========================================================================

    public const string HaikuId = "claude-3-5-haiku-20241022";
    public const string SonnetId = "claude-sonnet-4-20250514";
    public const string OpusId = "claude-opus-4-20250514";

    /// <summary>Standard ティアのデフォルトモデル（BYOK — 全モデル利用可能）</summary>
    public const string DefaultStandardModel = SonnetId;

    /// <summary>Premium ティアのデフォルトモデル（BYOK — 全モデル利用可能）</summary>
    public const string DefaultPremiumModel = OpusId;

    /// <summary>後方互換: デフォルトモデル（= Standard ティアデフォルト）</summary>
    public const string DefaultModel = DefaultStandardModel;

    // =========================================================================
    // モデルレジストリ
    // =========================================================================

    /// <summary>
    /// 全利用可能モデルのレジストリ
    ///
    /// 新モデル追加時はここに1行追加するだけ。
    /// TypeScript 側の MODEL_REGISTRY (config/ai-assistant.ts) と同期を保つこと。
    /// </summary>
    public static readonly ModelInfo[] Registry =
    {
        new(0, HaikuId,  "Haiku 3.5", "haiku",  "\u26A1",  0.25m,  1.25m, "standard", true),
        new(1, SonnetId, "Sonnet 4",  "sonnet", "\u2B50",  3.0m,  15.0m,  "standard", true),
        new(2, OpusId,   "Opus 4",    "opus",   "\U0001F48E", 15.0m, 75.0m, "standard", true),
    };

    /// <summary>後方互換: Available は Registry のエイリアス</summary>
    public static ModelInfo[] Available => Registry;

    // =========================================================================
    // レジストリアクセス
    // =========================================================================

    /// <summary>モデルIDからレジストリエントリを取得</summary>
    public static ModelInfo? GetModel(string modelId)
    {
        for (int i = 0; i < Registry.Length; i++)
            if (Registry[i].Id == modelId) return Registry[i];
        return null;
    }

    /// <summary>インデックスからモデルIDを取得</summary>
    public static string? GetModelId(int index) =>
        index >= 0 && index < Registry.Length ? Registry[index].Id : null;

    /// <summary>モデルIDからインデックスを取得</summary>
    public static int GetModelIndex(string modelId)
    {
        for (int i = 0; i < Registry.Length; i++)
            if (Registry[i].Id == modelId) return i;
        return GetModelIndex(DefaultStandardModel); // default to Standard tier default
    }

    /// <summary>表示名を取得 (例: "Sonnet 4 ⭐")</summary>
    public static string GetDisplayName(int index)
    {
        if (index >= 0 && index < Registry.Length)
            return $"{Registry[index].Label} {Registry[index].CostIndicator}";
        return "";
    }

    /// <summary>モデルIDから表示名を取得</summary>
    public static string GetDisplayName(string modelId)
    {
        var model = GetModel(modelId);
        return model != null ? $"{model.Label} {model.CostIndicator}" : modelId;
    }

    /// <summary>ペルソナ表示名を取得 (例: "Claude恵 (Sonnet 4 ⭐)")</summary>
    public static string GetPersonaDisplayName(int index, string lang = "JA")
    {
        var persona = AiPersona.FindByModelIndex(index);
        if (persona == null) return GetDisplayName(index);
        return $"{persona.GetName(lang)} ({GetDisplayName(index)})";
    }

    // =========================================================================
    // ティアベースモデル選択（ユーザー選択対応）
    // =========================================================================

    /// <summary>
    /// ティアに応じたモデルを取得（ユーザー選択優先）
    /// BYOK — 全プランで全モデル利用可能（モデルティア制限なし）
    /// </summary>
    /// <param name="tier">"standard" or "premium"</param>
    /// <param name="userPreferredModelId">ユーザーが選択したモデルID（null=デフォルト）</param>
    /// <returns>使用するモデルID</returns>
    public static string ResolveModel(string tier, string? userPreferredModelId = null)
    {
        if (!string.IsNullOrEmpty(userPreferredModelId))
        {
            var model = GetModel(userPreferredModelId);
            if (model != null && model.IsActive)
            {
                // BYOK — 全ティアで全モデル利用可能
                return model.Id;
            }
        }

        // デフォルト
        return tier == "premium" ? DefaultPremiumModel : DefaultStandardModel;
    }

    /// <summary>
    /// ティアで利用可能なモデル一覧を取得（モデル選択 UI 用）
    /// BYOK — 全ティアで全モデル利用可能
    /// </summary>
    public static ModelInfo[] GetAvailableModelsForTier(string tier)
    {
        return Registry
            .Where(m => m.IsActive)
            .ToArray();
    }

    /// <summary>
    /// 指定モデルがティアのデフォルトかチェック
    /// </summary>
    public static bool IsDefaultForTier(string modelId, string tier) =>
        tier == "premium" ? modelId == DefaultPremiumModel : modelId == DefaultStandardModel;
}

/// <summary>
/// モデル情報
///
/// レジストリ内の各モデルのメタデータ。
/// </summary>
public record ModelInfo(
    int Index,
    string Id,
    string Label,
    string Family,
    string CostIndicator,
    decimal InputCostPer1M,
    decimal OutputCostPer1M,
    string MinimumTier,
    bool IsActive
);
