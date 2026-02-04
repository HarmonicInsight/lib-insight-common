using System;

namespace InsightCommon.StickyNotes;

/// <summary>
/// 付箋変更アクション — バージョン管理の変更ログに記録
/// </summary>
public enum StickyNoteAction
{
    Create,
    Update,
    Delete,
    Resolve,
    Unresolve,
}

/// <summary>
/// 付箋変更ログエントリ — バージョン管理連動用
/// </summary>
public class StickyNoteChangeEntry
{
    /// <summary>変更ログID</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    /// <summary>付箋ID</summary>
    public string NoteId { get; set; } = string.Empty;

    /// <summary>アクション</summary>
    public StickyNoteAction Action { get; set; }

    /// <summary>変更前テキスト</summary>
    public string? PreviousText { get; set; }

    /// <summary>変更後テキスト</summary>
    public string? NewText { get; set; }

    /// <summary>変更前カラー</summary>
    public StickyNoteColor? PreviousColor { get; set; }

    /// <summary>変更後カラー</summary>
    public StickyNoteColor? NewColor { get; set; }

    /// <summary>セル参照（例: "A1"）</summary>
    public string CellRef { get; set; } = string.Empty;

    /// <summary>変更者ID</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>変更者名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>変更日時</summary>
    public DateTime Timestamp { get; set; } = DateTime.Now;
}
