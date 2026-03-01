using InsightCommon.License;

namespace InsightCommon.Addon;

/// <summary>
/// アドインモジュールカタログ
///
/// config/addon-modules.ts の ADDON_MODULES / PRODUCT_ADDON_SUPPORT に対応。
/// TypeScript 側の定義と同期を保つこと。
/// </summary>
public static class AddonModuleCatalog
{
    /// <summary>全モジュール定義</summary>
    public static readonly Dictionary<string, AddonModuleInfo> Modules = new()
    {
        ["ai_assistant"] = new AddonModuleInfo
        {
            Id = "ai_assistant",
            Name = "AI Assistant",
            NameJa = "AI アシスタント",
            Description = "Claude-powered AI assistant for document editing, proofreading, and suggestions",
            DescriptionJa = "Claude AIによるドキュメント編集・校正・提案アシスタント",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Right,
            RequiredFeatureKey = "ai_assistant",
            AllowedPlans = ["FREE", "TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "Chat",
            ThemeColor = "#B8942F",
        },
        ["python_runtime"] = new AddonModuleInfo
        {
            Id = "python_runtime",
            Name = "Python Runtime",
            NameJa = "Python 実行エンジン",
            Description = "Embedded Python execution environment powered by InsightPy engine",
            DescriptionJa = "InsightPyエンジンによるPython実行環境",
            Distribution = AddonDistributionType.Extension,
            PanelPosition = AddonPanelPosition.Bottom,
            RequiredFeatureKey = "ai_editor",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "Code",
            ThemeColor = "#3776AB",
        },
        ["ai_code_editor"] = new AddonModuleInfo
        {
            Id = "ai_code_editor",
            Name = "AI Code Editor",
            NameJa = "AI コードエディター",
            Description = "AI-powered Python code editor with syntax validation",
            DescriptionJa = "AI搭載のPythonコードエディター",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Bottom,
            RequiredFeatureKey = "ai_editor",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = ["ai_assistant", "python_runtime"],
            Icon = "CodeEdit",
            ThemeColor = "#B8942F",
        },
        ["python_scripts"] = new AddonModuleInfo
        {
            Id = "python_scripts",
            Name = "Python Script Runner",
            NameJa = "Python スクリプト",
            Description = "Browse, manage, and run Python scripts from a categorized list",
            DescriptionJa = "Pythonスクリプトの一覧表示・管理・実行",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Tab,
            RequiredFeatureKey = "ai_editor",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = ["python_runtime"],
            Icon = "PlayList",
            ThemeColor = "#3776AB",
        },
        ["reference_materials"] = new AddonModuleInfo
        {
            Id = "reference_materials",
            Name = "Reference Materials",
            NameJa = "参考資料",
            Description = "Attach reference documents and use them as AI context",
            DescriptionJa = "参考資料を添付しAI提案のコンテキストとして活用",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Right,
            RequiredFeatureKey = "reference_materials",
            AllowedPlans = ["FREE", "TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "Library",
            ThemeColor = "#16A34A",
        },
        ["board"] = new AddonModuleInfo
        {
            Id = "board",
            Name = "Team Board",
            NameJa = "掲示板",
            Description = "Team collaboration board for discussions and announcements",
            DescriptionJa = "ドキュメントに紐づくチーム掲示板",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Right,
            RequiredFeatureKey = "board",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "People",
            ThemeColor = "#7C3AED",
        },
        ["messaging"] = new AddonModuleInfo
        {
            Id = "messaging",
            Name = "Messaging",
            NameJa = "メッセージ",
            Description = "Direct messaging between team members",
            DescriptionJa = "チームメンバー間メッセージ",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Right,
            RequiredFeatureKey = "send_message",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "Mail",
            ThemeColor = "#0891B2",
        },
        ["voice_input"] = new AddonModuleInfo
        {
            Id = "voice_input",
            Name = "Voice Input",
            NameJa = "音声入力",
            Description = "Speech-to-text for document editing",
            DescriptionJa = "マイク音声→テキスト変換→ドキュメントに挿入",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Dialog,
            RequiredFeatureKey = "voice_input",
            AllowedPlans = ["FREE", "TRIAL", "BIZ", "ENT"],
            RequiresModules = [],
            Icon = "Microphone",
            ThemeColor = "#DC2626",
        },
        ["vrm_avatar"] = new AddonModuleInfo
        {
            Id = "vrm_avatar",
            Name = "VRM Avatar",
            NameJa = "VRM アバター",
            Description = "VRM/Live2D 3D avatar for voice conversation (TTS + STT + lip-sync)",
            DescriptionJa = "VRM/Live2D 3Dアバターによる音声会話",
            Distribution = AddonDistributionType.Extension,
            PanelPosition = AddonPanelPosition.Dialog,
            RequiredFeatureKey = "vrm_avatar",
            AllowedPlans = ["TRIAL", "BIZ", "ENT"],
            RequiresModules = ["ai_assistant", "voice_input"],
            Icon = "Person",
            ThemeColor = "#EC4899",
        },
        ["ai_memory"] = new AddonModuleInfo
        {
            Id = "ai_memory",
            Name = "AI Memory",
            NameJa = "AI メモリ",
            Description = "Persistent memory for AI — remembers people, terms, projects across sessions",
            DescriptionJa = "AIの永続メモリ — 人物・用語・プロジェクト・設定をセッション横断で記憶",
            Distribution = AddonDistributionType.Bundled,
            PanelPosition = AddonPanelPosition.Right,
            RequiredFeatureKey = "ai_assistant",
            AllowedPlans = ["FREE", "TRIAL", "BIZ", "ENT"],
            RequiresModules = ["ai_assistant"],
            Icon = "Brain",
            ThemeColor = "#8B5CF6",
        },
    };

    /// <summary>
    /// 製品別のサポートモジュール定義
    /// </summary>
    public static readonly Dictionary<string, ProductAddonSupport> ProductSupport = new()
    {
        ["IOSH"] = new ProductAddonSupport
        {
            SupportedModules = [
                "ai_assistant", "ai_memory", "python_runtime", "ai_code_editor", "python_scripts",
                "reference_materials", "board", "messaging", "voice_input", "vrm_avatar"
            ],
            DefaultEnabled = ["ai_assistant", "ai_memory", "board", "messaging"],
        },
        ["IOSD"] = new ProductAddonSupport
        {
            SupportedModules = [
                "ai_assistant", "ai_memory", "python_runtime", "ai_code_editor", "python_scripts",
                "reference_materials", "voice_input", "vrm_avatar"
            ],
            DefaultEnabled = ["ai_assistant", "ai_memory", "reference_materials"],
        },
        ["INSS"] = new ProductAddonSupport
        {
            SupportedModules = [
                "ai_assistant", "ai_memory", "python_runtime", "ai_code_editor", "python_scripts",
                "reference_materials", "voice_input", "vrm_avatar"
            ],
            DefaultEnabled = ["ai_assistant", "ai_memory"],
        },
    };

    /// <summary>モジュール定義を取得</summary>
    public static AddonModuleInfo? GetModule(string moduleId) =>
        Modules.GetValueOrDefault(moduleId);

    /// <summary>製品がサポートするモジュール一覧</summary>
    public static List<AddonModuleInfo> GetSupportedModules(string productCode)
    {
        if (!ProductSupport.TryGetValue(productCode, out var support))
            return [];

        return support.SupportedModules
            .Where(Modules.ContainsKey)
            .Select(id => Modules[id])
            .ToList();
    }
}

/// <summary>
/// 製品ごとのアドイン対応状況
/// </summary>
public class ProductAddonSupport
{
    public string[] SupportedModules { get; set; } = [];
    public string[] DefaultEnabled { get; set; } = [];
}
