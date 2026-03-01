namespace InsightCommon.UI;

/// <summary>
/// ヘルプメニューの項目定義。
/// config/help-content.ts の HelpSectionDefinition に対応。
///
/// <para>
/// InsightWindowChrome.CreateHelpMenu() の新オーバーロードで使用する。
/// 各アプリは HelpWindow のセクションに対応する項目を定義し、
/// メニューから直接指定セクションを開けるようにする。
/// </para>
///
/// <example>
/// <code>
/// var helpTopics = new List&lt;HelpMenuItemDefinition&gt;
/// {
///     new() { Id = "overview",      Label = "操作マニュアル", InputGestureText = "F1", OnClick = () => ShowHelpSection("overview") },
///     new() { Id = "shortcuts",     Label = "ショートカット一覧",                      OnClick = () => ShowHelpSection("shortcuts") },
///     new() { Id = "ai-assistant",  Label = "AIアシスタント",                           OnClick = () => ShowHelpSection("ai-assistant") },
/// };
///
/// var helpMenu = InsightWindowChrome.CreateHelpMenu("Insight Deck Quality Gate", helpTopics, onLicenseManage, onAbout);
/// </code>
/// </example>
/// </summary>
public class HelpMenuItemDefinition
{
    /// <summary>
    /// セクション ID（config/help-content.ts の HelpSectionDefinition.id に対応）
    /// </summary>
    public required string Id { get; init; }

    /// <summary>
    /// メニューに表示するラベル
    /// </summary>
    public required string Label { get; init; }

    /// <summary>
    /// キーボードショートカット表示（例: "F1"）。null の場合は非表示。
    /// </summary>
    public string? InputGestureText { get; init; }

    /// <summary>
    /// メニュー項目クリック時のアクション
    /// </summary>
    public required Action OnClick { get; init; }
}
