using System.Collections.Generic;
using System.Linq;

namespace InsightCommon.AI;

/// <summary>
/// AIペルソナ — モデルを日本語の人格キャラクターとして表現
/// 全Insight Business Suite系アプリで共通利用
/// </summary>
public class AiPersona
{
    public string Id { get; init; } = string.Empty;
    public string NameJa { get; init; } = string.Empty;
    public string NameEn { get; init; } = string.Empty;
    public string DescriptionJa { get; init; } = string.Empty;
    public string DescriptionEn { get; init; } = string.Empty;
    public string ModelId { get; init; } = string.Empty;
    public string IconFileName { get; init; } = string.Empty;
    public string ThemeColor { get; init; } = string.Empty;

    public string GetName(string lang) => lang == "EN" ? NameEn : NameJa;
    public string GetDescription(string lang) => lang == "EN" ? DescriptionEn : DescriptionJa;

    /// <summary>
    /// 全ペルソナ定義（共通マスター）
    /// </summary>
    public static readonly List<AiPersona> All = new()
    {
        new AiPersona
        {
            Id = "shunsuke",
            NameJa = "Claude俊",
            NameEn = "Claude Shun",
            DescriptionJa = "素早く簡潔に回答。ちょっとした確認や軽い修正に最適。",
            DescriptionEn = "Quick and concise. Best for quick checks and light edits.",
            ModelId = ClaudeModels.HaikuId,
            IconFileName = "shunsuke_48.png",
            ThemeColor = "#4696DC",
        },
        new AiPersona
        {
            Id = "megumi",
            NameJa = "Claude恵",
            NameEn = "Claude Megumi",
            DescriptionJa = "万能で丁寧。文章の修正・要約・翻訳なんでもお任せ。",
            DescriptionEn = "Versatile and thorough. Great for editing, summaries, and translations.",
            ModelId = ClaudeModels.SonnetId,
            IconFileName = "megumi_48.png",
            ThemeColor = "#B8942F",
        },
        new AiPersona
        {
            Id = "manabu",
            NameJa = "Claude学",
            NameEn = "Claude Manabu",
            DescriptionJa = "じっくり深く考える。論文・報告書など正確さが求められる場面に。",
            DescriptionEn = "Deep thinker. Best for reports and documents requiring precision.",
            ModelId = ClaudeModels.OpusId,
            IconFileName = "manabu_48.png",
            ThemeColor = "#8C64C8",
        },
    };

    /// <summary>IDからペルソナを検索</summary>
    public static AiPersona? FindById(string id) =>
        All.Find(p => p.Id == id);

    /// <summary>モデルIDからペルソナを検索</summary>
    public static AiPersona? FindByModelId(string modelId) =>
        All.Find(p => p.ModelId == modelId);

    /// <summary>モデルインデックス(0=Haiku,1=Sonnet,2=Opus)からペルソナを検索</summary>
    public static AiPersona? FindByModelIndex(int index)
    {
        var modelId = ClaudeModels.GetModelId(index);
        return modelId != null ? FindByModelId(modelId) : null;
    }
}
