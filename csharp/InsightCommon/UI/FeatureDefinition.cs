using InsightCommon.License;

namespace InsightCommon.UI;

/// <summary>
/// ダイアログに表示する機能定義
/// </summary>
public class FeatureDefinition
{
    /// <summary>機能名（表示用）</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>機能キー（FeatureMatrixのキー）</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>利用可能時の表示テキスト（省略時: "○利用可能"）</summary>
    public string? AvailableText { get; set; }

    /// <summary>利用不可時の表示テキスト（省略時: "×{最低プラン}以上が必要"）</summary>
    public string? UnavailableText { get; set; }

    /// <summary>数量制限表示用（プラン別の値を返す関数、nullなら○/×表示）</summary>
    public Func<PlanCode, string>? ValueFormatter { get; set; }

    public FeatureDefinition() { }

    public FeatureDefinition(string key, string label)
    {
        Key = key;
        Label = label;
    }

    public FeatureDefinition(string key, string label, Func<PlanCode, string> valueFormatter)
    {
        Key = key;
        Label = label;
        ValueFormatter = valueFormatter;
    }
}
