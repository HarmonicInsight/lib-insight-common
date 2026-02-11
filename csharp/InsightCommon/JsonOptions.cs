using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsightCommon;

/// <summary>
/// 共有 JsonSerializerOptions インスタンス（CA1869 対策）
/// シリアル化操作ごとに新規インスタンスを作成せず、キャッシュして再利用する。
/// </summary>
internal static class JsonOptions
{
    /// <summary>書き込み用（WriteIndented = true）</summary>
    public static readonly JsonSerializerOptions WriteIndented = new()
    {
        WriteIndented = true,
    };

    /// <summary>読み取り用（PropertyNameCaseInsensitive = true）</summary>
    public static readonly JsonSerializerOptions CaseInsensitive = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>null プロパティを除外</summary>
    public static readonly JsonSerializerOptions IgnoreNull = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}
