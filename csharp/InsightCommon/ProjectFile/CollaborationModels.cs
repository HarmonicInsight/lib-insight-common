using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace InsightCommon.ProjectFile;

// =============================================================================
// コラボレーションデータモデル（B 方式: 外部 .collab.json）
//
// ドキュメント本体（ZIP）はロックファイルで排他制御し、
// 掲示板・付箋・メッセージは外部 JSON ファイルに分離する。
// これにより、ドキュメント編集中でも他のユーザーが掲示板等に書き込める。
//
// ファイル構成:
//   report.iosh              ← 本体 ZIP（排他ロック）
//   report.iosh.lock         ← ロックファイル（編集者情報）
//   report.iosh.collab.json  ← コラボレーションデータ（複数人同時アクセス可）
//
// 対応: config/project-file.ts
// =============================================================================

/// <summary>
/// コラボレーションデータのルート（.collab.json）
/// </summary>
public class CollaborationData
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>掲示板投稿一覧</summary>
    [JsonPropertyName("boardPosts")]
    public List<BoardPost> BoardPosts { get; set; } = [];

    /// <summary>付箋一覧</summary>
    [JsonPropertyName("stickyNotes")]
    public List<CollabStickyNote> StickyNotes { get; set; } = [];

    /// <summary>メッセージ一覧</summary>
    [JsonPropertyName("messages")]
    public List<CollabMessage> Messages { get; set; } = [];
}

// =============================================================================
// 掲示板
// =============================================================================

/// <summary>掲示板投稿</summary>
public class BoardPost
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("updatedAt")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? UpdatedAt { get; set; }

    /// <summary>返信先の投稿 ID（null = トップレベル投稿）</summary>
    [JsonPropertyName("replyTo")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ReplyTo { get; set; }

    /// <summary>ピン留め（重要な投稿を上部固定）</summary>
    [JsonPropertyName("pinned")]
    public bool Pinned { get; set; }
}

// =============================================================================
// 付箋（コラボレーション版）
// =============================================================================

/// <summary>
/// コラボレーション付箋
///
/// ZIP 内の sticky_notes.json から外部 .collab.json に移動。
/// セル参照（cellRef）は IOSH/ISOF 固有。INSS/IOSD では使わない。
/// </summary>
public class CollabStickyNote
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    /// <summary>セル参照（例: "A1", "B3"）— スプレッドシート製品のみ</summary>
    [JsonPropertyName("cellRef")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CellRef { get; set; }

    /// <summary>シート名 — スプレッドシート製品のみ</summary>
    [JsonPropertyName("sheetName")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SheetName { get; set; }

    /// <summary>スライド番号（1-based）— プレゼンテーション製品のみ</summary>
    [JsonPropertyName("slideNumber")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? SlideNumber { get; set; }

    /// <summary>段落番号（1-based）— 文書製品のみ</summary>
    [JsonPropertyName("paragraphNumber")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? ParagraphNumber { get; set; }

    /// <summary>付箋の色（#RRGGBB）</summary>
    [JsonPropertyName("color")]
    public string Color { get; set; } = "#FFF59D";

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("updatedAt")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? UpdatedAt { get; set; }

    /// <summary>解決済みフラグ</summary>
    [JsonPropertyName("resolved")]
    public bool Resolved { get; set; }
}

// =============================================================================
// メッセージ
// =============================================================================

/// <summary>ダイレクトメッセージ</summary>
public class CollabMessage
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [JsonPropertyName("from")]
    public string From { get; set; } = string.Empty;

    /// <summary>宛先（null = 全員宛）</summary>
    [JsonPropertyName("to")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? To { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>既読ユーザー一覧</summary>
    [JsonPropertyName("readBy")]
    public List<string> ReadBy { get; set; } = [];
}

// =============================================================================
// ロックファイル情報
// =============================================================================

/// <summary>
/// ロックファイルの内容（.lock ファイル）
///
/// Word の ~$document.docx と同様のアプローチ。
/// ファイルを開いたユーザーの情報を記録し、他のユーザーに通知する。
/// </summary>
public class FileLockInfo
{
    /// <summary>ロックしたユーザー名</summary>
    [JsonPropertyName("lockedBy")]
    public string LockedBy { get; set; } = string.Empty;

    /// <summary>マシン名</summary>
    [JsonPropertyName("machineName")]
    public string MachineName { get; set; } = string.Empty;

    /// <summary>プロセス ID</summary>
    [JsonPropertyName("processId")]
    public int ProcessId { get; set; }

    /// <summary>ロック取得日時（ISO 8601）</summary>
    [JsonPropertyName("lockedAt")]
    public string LockedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>最終ハートビート日時（ISO 8601）</summary>
    [JsonPropertyName("heartbeat")]
    public string Heartbeat { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>アプリケーション名</summary>
    [JsonPropertyName("application")]
    public string Application { get; set; } = string.Empty;
}
