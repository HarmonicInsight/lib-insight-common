namespace InsightCommon.AI;

/// <summary>
/// Claude APIモデル定義 — 全InsightOffice系アプリで共通利用
/// </summary>
public static class ClaudeModels
{
    public const string HaikuId = "claude-haiku-4-5-20251001";
    public const string SonnetId = "claude-sonnet-4-20250514";
    public const string OpusId = "claude-opus-4-6-20260131";

    public const string DefaultModel = SonnetId;

    /// <summary>
    /// 利用可能なモデル一覧 (Index, Id, Label, CostIndicator)
    /// </summary>
    public static readonly ModelInfo[] Available =
    {
        new(0, HaikuId,  "Haiku",  "\u26A1",  1.0m,   5.0m),   // ⚡ fast/cheap
        new(1, SonnetId, "Sonnet", "\u2B50",  3.0m,  15.0m),   // ⭐ balanced
        new(2, OpusId,   "Opus",   "\U0001F48E", 15.0m, 75.0m), // 💎 powerful
    };

    /// <summary>インデックスからモデルIDを取得</summary>
    public static string? GetModelId(int index) =>
        index >= 0 && index < Available.Length ? Available[index].Id : null;

    /// <summary>モデルIDからインデックスを取得</summary>
    public static int GetModelIndex(string modelId)
    {
        for (int i = 0; i < Available.Length; i++)
            if (Available[i].Id == modelId) return i;
        return 1; // default to Sonnet
    }

    /// <summary>表示名を取得 (例: "Sonnet ⭐")</summary>
    public static string GetDisplayName(int index)
    {
        if (index >= 0 && index < Available.Length)
            return $"{Available[index].Label} {Available[index].CostIndicator}";
        return "";
    }

    /// <summary>ペルソナ表示名を取得 (例: "Claude恵 (Sonnet ⭐)")</summary>
    public static string GetPersonaDisplayName(int index, string lang = "JA")
    {
        var persona = AiPersona.FindByModelIndex(index);
        if (persona == null) return GetDisplayName(index);
        return $"{persona.GetName(lang)} ({GetDisplayName(index)})";
    }
}

/// <summary>モデル情報</summary>
public record ModelInfo(
    int Index,
    string Id,
    string Label,
    string CostIndicator,
    decimal InputCostPer1M,
    decimal OutputCostPer1M
);
