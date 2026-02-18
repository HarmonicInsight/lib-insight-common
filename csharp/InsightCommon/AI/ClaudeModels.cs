namespace InsightCommon.AI;

/// <summary>
/// Claude APIモデル定義 — 全InsightOffice系アプリで共通利用
///
/// 【モデルレジストリ方式】
/// 新モデルのリリース時は Registry に1エントリ追加し、
/// DefaultStandardModel / DefaultPremiumModel を更新するだけで全製品に反映。
/// ユーザーは設定画面からティア内の利用可能モデルを選択可能。
/// </summary>
public static class ClaudeModels
{
    // =========================================================================
    // モデル ID 定数（後方互換用）
    // =========================================================================

    public const string HaikuId = "claude-haiku-4-5-20251001";
    public const string SonnetId = "claude-sonnet-4-20250514";
    public const string Sonnet46Id = "claude-sonnet-4-6-20260210";
    public const string OpusId = "claude-opus-4-6-20260131";

    /// <summary>Standard ティアのデフォルトモデル</summary>
    public const string DefaultStandardModel = Sonnet46Id;

    /// <summary>Premium ティアのデフォルトモデル</summary>
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
        new(0, HaikuId,     "Haiku 4.5",  "haiku",  "\u26A1",  1.0m,   5.0m,  "standard", true),
        new(1, SonnetId,    "Sonnet 4",   "sonnet", "\u2B50",  3.0m,  15.0m,  "standard", true),
        new(2, Sonnet46Id,  "Sonnet 4.6", "sonnet", "\u2B50",  3.0m,  15.0m,  "standard", true),
        new(3, OpusId,      "Opus 4.6",   "opus",   "\U0001F48E", 15.0m, 75.0m, "premium", true),
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

    /// <summary>表示名を取得 (例: "Sonnet 4.6 ⭐")</summary>
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

    /// <summary>ペルソナ表示名を取得 (例: "Claude恵 (Sonnet 4.6 ⭐)")</summary>
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
                // Premium ティアは全モデル利用可能
                if (tier == "premium") return model.Id;
                // Standard ティアは standard モデルのみ
                if (model.MinimumTier == "standard") return model.Id;
            }
        }

        // デフォルト
        return tier == "premium" ? DefaultPremiumModel : DefaultStandardModel;
    }

    /// <summary>
    /// ティアで利用可能なモデル一覧を取得（モデル選択 UI 用）
    /// </summary>
    public static ModelInfo[] GetAvailableModelsForTier(string tier)
    {
        return Registry
            .Where(m => m.IsActive && (tier == "premium" || m.MinimumTier == "standard"))
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
