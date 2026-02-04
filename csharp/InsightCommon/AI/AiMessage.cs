using System;
using System.Globalization;

namespace InsightCommon.AI;

/// <summary>
/// AIアシスタントのチャットメッセージ — 全InsightOffice系アプリで共通利用
/// </summary>
public class AiMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string Content { get; set; } = string.Empty;
    public AiMessageRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public bool IsStreaming { get; set; }

    public string DisplayTime => CreatedAt.ToString("HH:mm", CultureInfo.InvariantCulture);
}

/// <summary>
/// メッセージの役割
/// </summary>
public enum AiMessageRole
{
    User,
    Assistant,
    System
}
