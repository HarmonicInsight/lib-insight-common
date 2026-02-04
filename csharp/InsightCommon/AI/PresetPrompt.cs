using System.Collections.Generic;
using System.Linq;

namespace InsightCommon.AI;

/// <summary>
/// プリセットプロンプトの基底クラス — ワンクリックで実行できる定型プロンプト
/// 各アプリで継承して製品固有のプロンプトを定義する
/// </summary>
public class PresetPrompt
{
    /// <summary>一意のID</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>カテゴリ（日本語）</summary>
    public string CategoryJa { get; init; } = string.Empty;

    /// <summary>カテゴリ（英語）</summary>
    public string CategoryEn { get; init; } = string.Empty;

    /// <summary>表示ラベル（日本語）</summary>
    public string LabelJa { get; init; } = string.Empty;

    /// <summary>表示ラベル（英語）</summary>
    public string LabelEn { get; init; } = string.Empty;

    /// <summary>プロンプトテキスト（日本語）</summary>
    public string PromptJa { get; init; } = string.Empty;

    /// <summary>プロンプトテキスト（英語）</summary>
    public string PromptEn { get; init; } = string.Empty;

    /// <summary>アイコン（絵文字）</summary>
    public string Icon { get; init; } = string.Empty;

    /// <summary>推奨ペルソナID (shunsuke=Haiku, megumi=Sonnet, manabu=Opus)</summary>
    public string RecommendedPersonaId { get; init; } = "megumi";

    /// <summary>推奨モデルインデックス (0=Haiku, 1=Sonnet, 2=Opus)</summary>
    public int RecommendedModelIndex
    {
        get
        {
            var persona = AiPersona.FindById(RecommendedPersonaId);
            if (persona == null) return 1;
            return ClaudeModels.GetModelIndex(persona.ModelId);
        }
    }

    /// <summary>実行モード: "advice" (チャット) or "check" (構造化修正提案)</summary>
    public string Mode { get; init; } = "advice";

    /// <summary>コンテキストデータが必須かどうか</summary>
    public bool RequiresContextData { get; init; } = true;

    public string GetLabel(string lang) => lang == "EN" ? LabelEn : LabelJa;
    public string GetCategory(string lang) => lang == "EN" ? CategoryEn : CategoryJa;
    public string GetPrompt(string lang) => lang == "EN" ? PromptEn : PromptJa;

    /// <summary>カテゴリ一覧を取得</summary>
    public static string[] GetCategories(IEnumerable<PresetPrompt> prompts, string lang = "JA")
    {
        return prompts.Select(p => p.GetCategory(lang)).Distinct().ToArray();
    }

    /// <summary>カテゴリでフィルタ</summary>
    public static PresetPrompt[] GetByCategory(IEnumerable<PresetPrompt> prompts, string category, string lang = "JA")
    {
        return prompts.Where(p => p.GetCategory(lang) == category).ToArray();
    }
}
