using System.Collections.Generic;

namespace InsightCommon.ProjectFile;

/// <summary>
/// プロジェクトファイル（ZIP）内のエントリパス定数
///
/// 対応: config/project-file.ts の PROJECT_FILE_PATHS
/// </summary>
public static class ProjectFilePaths
{
    /// <summary>スキーマバージョン</summary>
    public const string SchemaVersion = "1.0";

    // --- ルートレベル ---

    /// <summary>コンテントタイプ定義（OPC 準拠）</summary>
    public const string ContentTypes = "[content_types].xml";

    /// <summary>プロジェクトメタデータ</summary>
    public const string Metadata = "metadata.json";

    /// <summary>付箋データ</summary>
    public const string StickyNotes = "sticky_notes.json";

    /// <summary>AI チャット履歴</summary>
    public const string AiChatHistory = "ai_chat_history.json";

    // --- AI メモリ ---

    /// <summary>AI ホットキャッシュ</summary>
    public const string AiMemory = "ai_memory.json";

    /// <summary>AI ディープストレージ: 用語集</summary>
    public const string AiMemoryDeepGlossary = "ai_memory_deep/glossary.json";

    /// <summary>AI ディープストレージ: 人物</summary>
    public const string AiMemoryDeepPeople = "ai_memory_deep/people.json";

    /// <summary>AI ディープストレージ: プロジェクト</summary>
    public const string AiMemoryDeepProjects = "ai_memory_deep/projects.json";

    /// <summary>AI ディープストレージ: 組織コンテキスト</summary>
    public const string AiMemoryDeepContext = "ai_memory_deep/context.json";

    // --- バージョン履歴 ---

    /// <summary>履歴インデックス</summary>
    public const string HistoryIndex = "history/index.json";

    /// <summary>スナップショットディレクトリ</summary>
    public const string HistorySnapshotsDir = "history/snapshots/";

    // --- 参考資料 ---

    /// <summary>参考資料インデックス</summary>
    public const string ReferencesIndex = "references/index.json";

    /// <summary>参考資料ファイルディレクトリ</summary>
    public const string ReferencesFilesDir = "references/files/";

    // --- Python スクリプト ---

    /// <summary>スクリプトインデックス</summary>
    public const string ScriptsIndex = "scripts/index.json";

    /// <summary>スクリプトファイルディレクトリ</summary>
    public const string ScriptsFilesDir = "scripts/files/";

    // --- 内包ドキュメントファイル名（製品別） ---

    /// <summary>
    /// 製品コードから内包 Office ドキュメントのファイル名を取得
    /// </summary>
    public static string? GetInnerDocumentName(string productCode) => productCode.ToUpperInvariant() switch
    {
        "INSS" => "document.pptx",
        "IOSH" => "document.xlsx",
        "IOSD" => "document.docx",
        _ => null,
    };

    /// <summary>
    /// 独自拡張子から製品コードを解決
    /// </summary>
    public static string? ResolveProductCode(string extension) => extension.ToLowerInvariant().TrimStart('.') switch
    {
        "inss" => "INSS",
        "iosh" => "IOSH",
        "iosd" => "IOSD",
        _ => null,
    };

    /// <summary>
    /// 製品コードから独自拡張子を取得（ドット付き）
    /// </summary>
    public static string? GetExtension(string productCode) => productCode.ToUpperInvariant() switch
    {
        "INSS" => ".inss",
        "IOSH" => ".iosh",
        "IOSD" => ".iosd",
        _ => null,
    };

    /// <summary>
    /// 製品コードからインポート可能な Office 拡張子を取得
    /// </summary>
    public static IReadOnlyList<string> GetImportableExtensions(string productCode) => productCode.ToUpperInvariant() switch
    {
        "INSS" => [".pptx", ".ppt"],
        "IOSH" => [".xlsx", ".xls", ".csv"],
        "IOSD" => [".docx", ".doc"],
        _ => [],
    };
}
