using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace InsightCommon.ProjectFile;

/// <summary>
/// プロジェクトファイルのメタデータ（metadata.json）
///
/// ZIP 内の metadata.json として格納される管理情報。
/// 対応: config/project-file.ts の ProjectFileMetadata 型
/// </summary>
public class ProjectFileMetadata
{
    /// <summary>スキーマバージョン</summary>
    [JsonPropertyName("schemaVersion")]
    public string SchemaVersion { get; set; } = ProjectFilePaths.SchemaVersion;

    /// <summary>作成元の製品コード（INSS / IOSH / IOSD）</summary>
    [JsonPropertyName("productCode")]
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>作成元アプリのバージョン</summary>
    [JsonPropertyName("appVersion")]
    public string AppVersion { get; set; } = string.Empty;

    /// <summary>作成元アプリのビルド番号</summary>
    [JsonPropertyName("appBuildNumber")]
    public int AppBuildNumber { get; set; }

    /// <summary>プロジェクトの表示名</summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>説明（任意）</summary>
    [JsonPropertyName("description")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; set; }

    /// <summary>作成者名</summary>
    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    /// <summary>作成者メールアドレス（任意）</summary>
    [JsonPropertyName("authorEmail")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AuthorEmail { get; set; }

    /// <summary>作成日時（ISO 8601）</summary>
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>最終更新日時（ISO 8601）</summary>
    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>最終更新者名</summary>
    [JsonPropertyName("lastModifiedBy")]
    public string LastModifiedBy { get; set; } = string.Empty;

    /// <summary>内包 Office ファイルの元ファイル名</summary>
    [JsonPropertyName("originalFileName")]
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>内包 Office ファイルの SHA-256 ハッシュ</summary>
    [JsonPropertyName("documentHash")]
    public string DocumentHash { get; set; } = string.Empty;

    /// <summary>バージョン履歴のエントリ数</summary>
    [JsonPropertyName("historyCount")]
    public int HistoryCount { get; set; }

    /// <summary>参考資料の添付数</summary>
    [JsonPropertyName("referenceCount")]
    public int ReferenceCount { get; set; }

    /// <summary>Python スクリプトの数</summary>
    [JsonPropertyName("scriptCount")]
    public int ScriptCount { get; set; }

    /// <summary>タグ（分類用、任意）</summary>
    [JsonPropertyName("tags")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<string>? Tags { get; set; }

    /// <summary>カスタムプロパティ（製品固有の拡張用）</summary>
    [JsonPropertyName("customProperties")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, string>? CustomProperties { get; set; }
}
