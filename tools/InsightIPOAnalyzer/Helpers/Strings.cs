namespace InsightIPOAnalyzer.Helpers;

/// <summary>
/// UI文字列の多言語対応。
/// デフォルトは日本語、英語切替可能。
/// </summary>
public static class Strings
{
    private static string _currentLanguage = "ja";

    public static string CurrentLanguage
    {
        get => _currentLanguage;
        set => _currentLanguage = value == "en" ? "en" : "ja";
    }

    public static bool IsJapanese => _currentLanguage == "ja";

    public static void ToggleLanguage()
    {
        _currentLanguage = _currentLanguage == "ja" ? "en" : "ja";
    }

    // Window
    public static string AppTitle => IsJapanese ? "Insight IPO Analyzer" : "Insight IPO Analyzer";
    public static string Version => "v1.0.0";

    // Menu / Toolbar
    public static string NewProject => IsJapanese ? "新規" : "New";
    public static string OpenProject => IsJapanese ? "開く" : "Open";
    public static string SaveProject => IsJapanese ? "保存" : "Save";
    public static string ExportJson => IsJapanese ? "JSONエクスポート" : "Export JSON";
    public static string ImportJson => IsJapanese ? "JSONインポート" : "Import JSON";
    public static string LoadSample => IsJapanese ? "サンプル読込" : "Load Sample";
    public static string AddNode => IsJapanese ? "ノード追加" : "Add Node";
    public static string DeleteNode => IsJapanese ? "削除" : "Delete";

    // Tree
    public static string ProjectTree => IsJapanese ? "プロジェクトツリー" : "Project Tree";
    public static string RootLevel => IsJapanese ? "ルート" : "Root";

    // IPO Sections
    public static string Input => IsJapanese ? "INPUT (入力)" : "INPUT";
    public static string Process => IsJapanese ? "PROCESS (処理)" : "PROCESS";
    public static string Output => IsJapanese ? "OUTPUT (出力)" : "OUTPUT";
    public static string AddItem => IsJapanese ? "+ 追加" : "+ Add";

    // Properties
    public static string Properties => IsJapanese ? "プロパティ" : "Properties";
    public static string Name => IsJapanese ? "名前" : "Name";
    public static string Description => IsJapanese ? "説明" : "Description";
    public static string DataType => IsJapanese ? "データ型" : "Data Type";
    public static string NodeProperties => IsJapanese ? "ノードプロパティ" : "Node Properties";
    public static string InputProperties => IsJapanese ? "入力プロパティ" : "Input Properties";
    public static string ProcessProperties => IsJapanese ? "処理ステッププロパティ" : "Process Step Properties";
    public static string OutputProperties => IsJapanese ? "出力プロパティ" : "Output Properties";
    public static string ProjectProperties => IsJapanese ? "プロジェクトプロパティ" : "Project Properties";
    public static string Author => IsJapanese ? "作成者" : "Author";
    public static string NoSelection => IsJapanese ? "ノードまたはアイテムを選択してください" : "Select a node or item";

    // Navigation
    public static string NavigateUp => IsJapanese ? "上の階層へ" : "Navigate Up";
    public static string DrillDown => IsJapanese ? "詳細分析へ" : "Drill Down";
    public static string CreateSubAnalysis => IsJapanese ? "サブ分析を作成" : "Create Sub-Analysis";

    // Status
    public static string Ready => IsJapanese ? "準備完了" : "Ready";
    public static string Nodes => IsJapanese ? "ノード数" : "Nodes";
    public static string Level => IsJapanese ? "階層" : "Level";

    // Dialogs
    public static string ConfirmDelete => IsJapanese ? "削除しますか？" : "Confirm delete?";
    public static string Confirm => IsJapanese ? "確認" : "Confirm";
    public static string UnsavedChanges => IsJapanese ? "未保存の変更があります。保存しますか？" : "You have unsaved changes. Save?";
    public static string JsonFiles => IsJapanese ? "JSONファイル" : "JSON Files";
    public static string AllFiles => IsJapanese ? "すべてのファイル" : "All Files";
    public static string SaveSuccess => IsJapanese ? "保存しました" : "Saved successfully";
    public static string LoadSuccess => IsJapanese ? "読み込みました" : "Loaded successfully";
    public static string Error => IsJapanese ? "エラー" : "Error";

    // Language
    public static string LanguageToggle => IsJapanese ? "English" : "日本語";

    // IPO specific
    public static string NewNodeName => IsJapanese ? "新しいノード" : "New Node";
    public static string NewInputName => IsJapanese ? "新しい入力" : "New Input";
    public static string NewProcessStepName => IsJapanese ? "新しい処理" : "New Step";
    public static string NewOutputName => IsJapanese ? "新しい出力" : "New Output";

    // Tooltips
    public static string SubAnalysisTooltip => IsJapanese
        ? "ダブルクリックでサブ分析にドリルダウン"
        : "Double-click to drill down into sub-analysis";
    public static string DragToMoveTooltip => IsJapanese
        ? "ドラッグしてノードを移動"
        : "Drag to move node";
}
