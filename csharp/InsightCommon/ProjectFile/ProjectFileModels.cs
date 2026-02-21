using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace InsightCommon.ProjectFile;

// =============================================================================
// バージョン履歴
// =============================================================================

/// <summary>
/// バージョン履歴インデックス（history/index.json）
/// </summary>
public class HistoryIndex
{
    [JsonPropertyName("latestVersion")]
    public int LatestVersion { get; set; }

    [JsonPropertyName("entries")]
    public List<HistoryEntry> Entries { get; set; } = [];
}

/// <summary>
/// バージョン履歴エントリ
/// </summary>
public class HistoryEntry
{
    /// <summary>バージョン番号（1-based、連番）</summary>
    [JsonPropertyName("version")]
    public int Version { get; set; }

    /// <summary>スナップショットファイル名（例: "v001.json"）</summary>
    [JsonPropertyName("snapshotFile")]
    public string SnapshotFile { get; set; } = string.Empty;

    /// <summary>保存種別: auto / manual / import</summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = "auto";

    /// <summary>保存日時（ISO 8601）</summary>
    [JsonPropertyName("savedAt")]
    public string SavedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>保存者名</summary>
    [JsonPropertyName("savedBy")]
    public string SavedBy { get; set; } = string.Empty;

    /// <summary>変更の説明（手動保存時）</summary>
    [JsonPropertyName("comment")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Comment { get; set; }

    /// <summary>この時点のドキュメント SHA-256 ハッシュ</summary>
    [JsonPropertyName("documentHash")]
    public string DocumentHash { get; set; } = string.Empty;

    /// <summary>スナップショットサイズ（バイト）</summary>
    [JsonPropertyName("sizeBytes")]
    public long SizeBytes { get; set; }
}

// =============================================================================
// 参考資料
// =============================================================================

/// <summary>
/// 参考資料インデックス（references/index.json）
/// </summary>
public class ReferencesIndex
{
    [JsonPropertyName("entries")]
    public List<ReferenceEntry> Entries { get; set; } = [];
}

/// <summary>
/// 参考資料エントリ
/// </summary>
public class ReferenceEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>ZIP 内のファイルパス（例: "references/files/ref_001.pdf"）</summary>
    [JsonPropertyName("filePath")]
    public string FilePath { get; set; } = string.Empty;

    [JsonPropertyName("originalFileName")]
    public string OriginalFileName { get; set; } = string.Empty;

    [JsonPropertyName("mimeType")]
    public string MimeType { get; set; } = "application/octet-stream";

    /// <summary>ファイル種別: pdf / image / text / spreadsheet / presentation / document / other</summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = "other";

    [JsonPropertyName("sizeBytes")]
    public long SizeBytes { get; set; }

    [JsonPropertyName("addedAt")]
    public string AddedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("addedBy")]
    public string AddedBy { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; set; }

    /// <summary>AI コンテキストとして使用するか</summary>
    [JsonPropertyName("useAsAiContext")]
    public bool UseAsAiContext { get; set; } = true;
}

// =============================================================================
// スクリプト
// =============================================================================

/// <summary>
/// スクリプトインデックス（scripts/index.json）
/// </summary>
public class ScriptsIndex
{
    [JsonPropertyName("entries")]
    public List<ScriptEntry> Entries { get; set; } = [];
}

/// <summary>
/// スクリプトエントリ
/// </summary>
public class ScriptEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>ZIP 内のファイルパス（例: "scripts/files/script_001.py"）</summary>
    [JsonPropertyName("filePath")]
    public string FilePath { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    /// <summary>AI コードエディターで生成されたか</summary>
    [JsonPropertyName("generatedByAi")]
    public bool GeneratedByAi { get; set; }
}

// =============================================================================
// AI チャット履歴
// =============================================================================

/// <summary>
/// AI チャット履歴（ai_chat_history.json）
/// </summary>
public class AiChatHistory
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";

    [JsonPropertyName("sessions")]
    public List<ChatSession> Sessions { get; set; } = [];
}

/// <summary>
/// チャットセッション
/// </summary>
public class ChatSession
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("startedAt")]
    public string StartedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("modelId")]
    public string ModelId { get; set; } = string.Empty;

    [JsonPropertyName("messages")]
    public List<ChatMessage> Messages { get; set; } = [];
}

/// <summary>
/// チャットメッセージ
/// </summary>
public class ChatMessage
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    /// <summary>ロール: user / assistant</summary>
    [JsonPropertyName("role")]
    public string Role { get; set; } = "user";

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
}
