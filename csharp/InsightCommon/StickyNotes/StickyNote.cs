using System;

namespace InsightCommon.StickyNotes;

/// <summary>
/// セルに貼り付ける付箋データ — InsightOfficeSheet で利用
/// </summary>
public class StickyNote
{
    /// <summary>付箋ID</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];

    /// <summary>シート名</summary>
    public string SheetName { get; set; } = string.Empty;

    /// <summary>セル行（0-based）</summary>
    public int Row { get; set; }

    /// <summary>セル列（0-based）</summary>
    public int Col { get; set; }

    /// <summary>付箋テキスト</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>付箋カラー</summary>
    public StickyNoteColor Color { get; set; } = StickyNoteColor.Yellow;

    /// <summary>作成者ID</summary>
    public string AuthorId { get; set; } = string.Empty;

    /// <summary>作成者名</summary>
    public string AuthorName { get; set; } = string.Empty;

    /// <summary>作成日時</summary>
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    /// <summary>更新日時</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    /// <summary>解決済みか</summary>
    public bool Resolved { get; set; }

    /// <summary>解決日時</summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>解決者ID</summary>
    public string? ResolvedBy { get; set; }

    /// <summary>セル参照文字列を生成（例: "A1"）</summary>
    public string CellRef => GetCellRef(Row, Col);

    /// <summary>
    /// 行・列からセル参照文字列を生成
    /// </summary>
    public static string GetCellRef(int row, int col)
    {
        var colStr = string.Empty;
        var c = col;
        while (c >= 0)
        {
            colStr = (char)(65 + c % 26) + colStr;
            c = c / 26 - 1;
        }
        return $"{colStr}{row + 1}";
    }
}

/// <summary>
/// 付箋カラー
/// </summary>
public enum StickyNoteColor
{
    Yellow,
    Pink,
    Blue,
    Green,
    Orange,
    Purple,
}

/// <summary>
/// 付箋カラーのHEX値定義
/// </summary>
public static class StickyNoteColors
{
    public static (string Background, string Border, string Text) GetColors(StickyNoteColor color)
    {
        return color switch
        {
            StickyNoteColor.Yellow => ("#FFF9C4", "#F9A825", "#1C1917"),
            StickyNoteColor.Pink   => ("#FCE4EC", "#E91E63", "#1C1917"),
            StickyNoteColor.Blue   => ("#E3F2FD", "#1976D2", "#1C1917"),
            StickyNoteColor.Green  => ("#E8F5E9", "#388E3C", "#1C1917"),
            StickyNoteColor.Orange => ("#FFF3E0", "#EF6C00", "#1C1917"),
            StickyNoteColor.Purple => ("#F3E5F5", "#7B1FA2", "#1C1917"),
            _ => ("#FFF9C4", "#F9A825", "#1C1917"),
        };
    }
}
