using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace InsightCommon.AI;

// =============================================================================
// メモリエントリ型 — config/ai-memory.ts の C# 移植
// =============================================================================

/// <summary>
/// メモリエントリ共通基底クラス
/// TypeScript のユニオン型 (PersonEntry | GlossaryEntry | ...) を
/// string Type プロパティ + 共通フィールドで表現する
/// </summary>
[JsonDerivedType(typeof(PersonMemoryEntry), "person")]
[JsonDerivedType(typeof(GlossaryMemoryEntry), "glossary")]
[JsonDerivedType(typeof(ProjectMemoryEntry), "project")]
[JsonDerivedType(typeof(PreferenceMemoryEntry), "preference")]
public abstract class MemoryEntry
{
    /// <summary>エントリ種別: "person" | "glossary" | "project" | "preference"</summary>
    [JsonPropertyName("type")]
    public abstract string Type { get; }

    /// <summary>一意識別子</summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

    /// <summary>最終参照日（ISO 8601）</summary>
    [JsonPropertyName("lastReferencedAt")]
    public string LastReferencedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>参照回数</summary>
    [JsonPropertyName("referenceCount")]
    public int ReferenceCount { get; set; } = 1;
}

/// <summary>人物エントリ</summary>
public class PersonMemoryEntry : MemoryEntry
{
    [JsonPropertyName("type")]
    public override string Type => "person";

    /// <summary>フルネーム</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    /// <summary>ニックネーム・略称</summary>
    [JsonPropertyName("aliases")]
    public List<string> Aliases { get; set; } = new();

    /// <summary>役職</summary>
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    /// <summary>所属部門・チーム</summary>
    [JsonPropertyName("department")]
    public string? Department { get; set; }

    /// <summary>関連プロジェクト</summary>
    [JsonPropertyName("relatedProjects")]
    public List<string> RelatedProjects { get; set; } = new();

    /// <summary>メモ</summary>
    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

/// <summary>用語エントリ</summary>
public class GlossaryMemoryEntry : MemoryEntry
{
    [JsonPropertyName("type")]
    public override string Type => "glossary";

    /// <summary>略語・専門用語</summary>
    [JsonPropertyName("term")]
    public string Term { get; set; } = "";

    /// <summary>展開形・正式名称</summary>
    [JsonPropertyName("expansion")]
    public string Expansion { get; set; } = "";

    /// <summary>説明</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>カテゴリ: "internal" | "industry" | "technical"</summary>
    [JsonPropertyName("category")]
    public string Category { get; set; } = "internal";
}

/// <summary>プロジェクトエントリ</summary>
public class ProjectMemoryEntry : MemoryEntry
{
    [JsonPropertyName("type")]
    public override string Type => "project";

    /// <summary>プロジェクト名</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    /// <summary>コードネーム・略称</summary>
    [JsonPropertyName("aliases")]
    public List<string> Aliases { get; set; } = new();

    /// <summary>ステータス: "active" | "on-hold" | "completed" | "cancelled"</summary>
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    /// <summary>説明</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>関連人物</summary>
    [JsonPropertyName("relatedPeople")]
    public List<string> RelatedPeople { get; set; } = new();

    /// <summary>主要マイルストーン</summary>
    [JsonPropertyName("milestones")]
    public List<string>? Milestones { get; set; }
}

/// <summary>ユーザー設定エントリ</summary>
public class PreferenceMemoryEntry : MemoryEntry
{
    [JsonPropertyName("type")]
    public override string Type => "preference";

    /// <summary>設定キー</summary>
    [JsonPropertyName("key")]
    public string Key { get; set; } = "";

    /// <summary>設定値</summary>
    [JsonPropertyName("value")]
    public string Value { get; set; } = "";

    /// <summary>説明</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

// =============================================================================
// コンテナ型
// =============================================================================

/// <summary>
/// ホットキャッシュ（ai_memory.json）
/// プロジェクトファイル ZIP 内に格納され、system prompt に注入される
/// </summary>
public class AiMemoryHotCache
{
    /// <summary>スキーマバージョン</summary>
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";

    /// <summary>最終更新日（ISO 8601）</summary>
    [JsonPropertyName("lastUpdatedAt")]
    public string LastUpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    /// <summary>エントリ一覧</summary>
    [JsonPropertyName("entries")]
    public List<MemoryEntry> Entries { get; set; } = new();
}

/// <summary>
/// ディープストレージ コンテキスト（ai_memory_deep/context.json）
/// </summary>
public class AiMemoryDeepContext
{
    [JsonPropertyName("companyName")]
    public string? CompanyName { get; set; }

    [JsonPropertyName("departments")]
    public List<string>? Departments { get; set; }

    [JsonPropertyName("tools")]
    public List<string>? Tools { get; set; }

    [JsonPropertyName("processes")]
    public List<string>? Processes { get; set; }
}

// =============================================================================
// プラン別制限 — config/ai-memory.ts MEMORY_LIMITS_BY_PLAN と一致
// =============================================================================

/// <summary>プラン別メモリ制限</summary>
public class AiMemoryLimits
{
    /// <summary>ホットキャッシュ最大エントリ数（-1 = 無制限）</summary>
    public int HotCacheMaxEntries { get; init; }

    /// <summary>ディープストレージ最大エントリ数（-1 = 無効/無制限）</summary>
    public int DeepStorageMaxEntries { get; init; }

    /// <summary>メモリ機能の利用可否</summary>
    public bool Enabled { get; init; }
}

/// <summary>
/// プラン別メモリ制限レジストリ — config/ai-memory.ts と値を一致させること
/// </summary>
public static class AiMemoryLimitsRegistry
{
    private static readonly Dictionary<string, AiMemoryLimits> Limits = new()
    {
        ["FREE"] = new AiMemoryLimits { HotCacheMaxEntries = 20, DeepStorageMaxEntries = -1, Enabled = true },
        ["TRIAL"] = new AiMemoryLimits { HotCacheMaxEntries = 50, DeepStorageMaxEntries = 200, Enabled = true },
        ["BIZ"] = new AiMemoryLimits { HotCacheMaxEntries = 100, DeepStorageMaxEntries = 500, Enabled = true },
        ["ENT"] = new AiMemoryLimits { HotCacheMaxEntries = -1, DeepStorageMaxEntries = -1, Enabled = true },
    };

    /// <summary>プランコードからメモリ制限を取得</summary>
    public static AiMemoryLimits GetLimits(string planCode)
    {
        return Limits.TryGetValue(planCode.ToUpperInvariant(), out var limits)
            ? limits
            : new AiMemoryLimits { HotCacheMaxEntries = 0, DeepStorageMaxEntries = 0, Enabled = false };
    }

    /// <summary>ホットキャッシュに空きがあるか確認</summary>
    public static bool CanAddToHotCache(string planCode, int currentCount)
    {
        var limits = GetLimits(planCode);
        if (!limits.Enabled) return false;
        if (limits.HotCacheMaxEntries == -1) return true;
        return currentCount < limits.HotCacheMaxEntries;
    }

    /// <summary>ディープストレージが利用可能か確認</summary>
    public static bool IsDeepStorageEnabled(string planCode)
    {
        var plan = planCode.ToUpperInvariant();
        var limits = GetLimits(plan);
        if (!limits.Enabled) return false;
        return plan is "TRIAL" or "BIZ" or "ENT";
    }
}

// =============================================================================
// マージ結果
// =============================================================================

/// <summary>
/// メモリエントリのマージ結果
/// </summary>
public class MemoryMergeResult
{
    /// <summary>新規追加されたエントリ数</summary>
    public int Added { get; init; }

    /// <summary>既存エントリを更新した数</summary>
    public int Updated { get; init; }

    /// <summary>制限超過等でスキップされた数</summary>
    public int Skipped { get; init; }

    /// <summary>新規追加されたエントリ一覧</summary>
    public List<MemoryEntry> AddedEntries { get; init; } = new();

    /// <summary>更新されたエントリ一覧</summary>
    public List<MemoryEntry> UpdatedEntries { get; init; } = new();
}
