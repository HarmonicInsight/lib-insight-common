using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace InsightCommon.AI;

/// <summary>
/// AI メモリ抽出・整形ユーティリティ
///
/// 1. インライン抽出: Claude 応答から &lt;ai_memory&gt; タグをパースしてエントリを抽出
/// 2. プロンプト注入: ホットキャッシュを system prompt 用テキストに整形
/// 3. 抽出指示: system prompt に追加するメモリ抽出指示テキストを生成
/// </summary>
public static class MemoryExtractor
{
    private static readonly Regex AiMemoryTagRegex = new(
        @"<ai_memory>\s*([\s\S]*?)\s*</ai_memory>",
        RegexOptions.Compiled);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Claude の応答テキストから &lt;ai_memory&gt; タグをパースし、
    /// 表示用クリーンテキストと抽出エントリを返す
    /// </summary>
    public static MemoryExtractionResult Extract(string responseText)
    {
        if (string.IsNullOrEmpty(responseText))
            return new MemoryExtractionResult();

        var entries = new List<MemoryEntry>();
        var cleanText = responseText;

        var matches = AiMemoryTagRegex.Matches(responseText);
        foreach (Match match in matches)
        {
            var jsonContent = match.Groups[1].Value.Trim();
            if (string.IsNullOrEmpty(jsonContent))
                continue;

            try
            {
                var parsed = ParseMemoryEntries(jsonContent);
                entries.AddRange(parsed);
            }
            catch (JsonException)
            {
                // パース失敗は無視（Claude が不正な JSON を返した場合）
            }

            // タグ部分を表示テキストから除去
            cleanText = cleanText.Replace(match.Value, "");
        }

        // 末尾の余分な空白・改行を除去
        cleanText = cleanText.TrimEnd();

        return new MemoryExtractionResult
        {
            CleanText = cleanText,
            ExtractedEntries = entries,
        };
    }

    /// <summary>
    /// ホットキャッシュの内容を system prompt 注入用テキストに整形する
    /// TypeScript 版 formatMemoryForPrompt() と同等の出力を生成
    /// </summary>
    public static string FormatForPrompt(AiMemoryHotCache hotCache, string locale = "ja")
    {
        if (hotCache.Entries.Count == 0)
            return "";

        var people = hotCache.Entries.OfType<PersonMemoryEntry>().ToList();
        var glossary = hotCache.Entries.OfType<GlossaryMemoryEntry>().ToList();
        var projects = hotCache.Entries.OfType<ProjectMemoryEntry>().Where(p => p.Status == "active").ToList();
        var prefs = hotCache.Entries.OfType<PreferenceMemoryEntry>().ToList();

        var sections = new List<string>();

        if (locale == "ja")
        {
            if (people.Count > 0)
            {
                var sb = new StringBuilder("【関連人物】\n");
                foreach (var p in people)
                {
                    sb.Append($"- {p.Name}");
                    if (p.Aliases.Count > 0)
                        sb.Append($"（{string.Join(", ", p.Aliases)}）");
                    if (!string.IsNullOrEmpty(p.Title))
                        sb.Append($" — {p.Title}");
                    if (!string.IsNullOrEmpty(p.Department))
                        sb.Append($"（{p.Department}）");
                    sb.AppendLine();
                }
                sections.Add(sb.ToString().TrimEnd());
            }

            if (glossary.Count > 0)
            {
                var sb = new StringBuilder("【用語・略語】\n");
                foreach (var g in glossary)
                {
                    sb.Append($"- {g.Term} = {g.Expansion}");
                    if (!string.IsNullOrEmpty(g.Description))
                        sb.Append($"（{g.Description}）");
                    sb.AppendLine();
                }
                sections.Add(sb.ToString().TrimEnd());
            }

            if (projects.Count > 0)
            {
                var sb = new StringBuilder("【アクティブプロジェクト】\n");
                foreach (var p in projects)
                {
                    sb.Append($"- {p.Name}");
                    if (p.Aliases.Count > 0)
                        sb.Append($"（{string.Join(", ", p.Aliases)}）");
                    if (!string.IsNullOrEmpty(p.Description))
                        sb.Append($": {p.Description}");
                    sb.AppendLine();
                }
                sections.Add(sb.ToString().TrimEnd());
            }

            if (prefs.Count > 0)
            {
                var sb = new StringBuilder("【ユーザー設定】\n");
                foreach (var p in prefs)
                    sb.AppendLine($"- {p.Key}: {p.Value}");
                sections.Add(sb.ToString().TrimEnd());
            }
        }
        else
        {
            if (people.Count > 0)
            {
                var sb = new StringBuilder("[People]\n");
                foreach (var p in people)
                {
                    sb.Append($"- {p.Name}");
                    if (p.Aliases.Count > 0)
                        sb.Append($" ({string.Join(", ", p.Aliases)})");
                    if (!string.IsNullOrEmpty(p.Title))
                        sb.Append($" — {p.Title}");
                    sb.AppendLine();
                }
                sections.Add(sb.ToString().TrimEnd());
            }

            if (glossary.Count > 0)
            {
                var sb = new StringBuilder("[Glossary]\n");
                foreach (var g in glossary)
                    sb.AppendLine($"- {g.Term} = {g.Expansion}");
                sections.Add(sb.ToString().TrimEnd());
            }

            if (projects.Count > 0)
            {
                var sb = new StringBuilder("[Active Projects]\n");
                foreach (var p in projects)
                {
                    sb.Append($"- {p.Name}");
                    if (p.Aliases.Count > 0)
                        sb.Append($" ({string.Join(", ", p.Aliases)})");
                    sb.AppendLine();
                }
                sections.Add(sb.ToString().TrimEnd());
            }

            if (prefs.Count > 0)
            {
                var sb = new StringBuilder("[User Preferences]\n");
                foreach (var p in prefs)
                    sb.AppendLine($"- {p.Key}: {p.Value}");
                sections.Add(sb.ToString().TrimEnd());
            }
        }

        return string.Join("\n\n", sections);
    }

    /// <summary>
    /// system prompt に追加するメモリ抽出指示テキストを生成する
    /// ~200 トークンの追加コストのみ
    /// </summary>
    public static string GetExtractionInstruction(string locale = "ja")
    {
        if (locale == "ja")
        {
            return """

                ---
                【メモリ抽出指示】
                会話の中で重要な人物・用語・プロジェクト・ユーザーの好みを検出した場合、
                応答テキストの末尾に以下の形式で記録してください:

                <ai_memory>
                [
                  {"type":"person","name":"氏名","title":"役職"},
                  {"type":"glossary","term":"略語","expansion":"正式名称","category":"internal"},
                  {"type":"project","name":"プロジェクト名","status":"active"},
                  {"type":"preference","key":"設定名","value":"設定値"}
                ]
                </ai_memory>

                ルール:
                - 新しい情報が出てきた場合のみ記録（既に記憶済みの情報は不要）
                - category は internal（社内略語）/ industry（業界用語）/ technical（技術用語）
                - 記録すべき情報がない場合は <ai_memory> タグを出力しない
                """;
        }

        return """

            ---
            [Memory Extraction]
            When you detect important people, terms, projects, or user preferences in the conversation,
            append the following at the end of your response:

            <ai_memory>
            [
              {"type":"person","name":"Full Name","title":"Title"},
              {"type":"glossary","term":"Abbreviation","expansion":"Full form","category":"internal"},
              {"type":"project","name":"Project Name","status":"active"},
              {"type":"preference","key":"Setting","value":"Value"}
            ]
            </ai_memory>

            Rules:
            - Only record new information (skip already memorized entries)
            - category: internal (company terms) / industry / technical
            - Do not output <ai_memory> tag if there is nothing to record
            """;
    }

    /// <summary>
    /// ホットキャッシュ付きの完全な system prompt を構築する
    /// </summary>
    public static string BuildSystemPrompt(
        string basePrompt,
        AiMemoryHotCache? hotCache,
        string locale = "ja")
    {
        var sb = new StringBuilder(basePrompt);

        // メモリ抽出指示を追加
        sb.Append(GetExtractionInstruction(locale));

        // ホットキャッシュの内容を注入
        if (hotCache is { Entries.Count: > 0 })
        {
            var memoryText = FormatForPrompt(hotCache, locale);
            if (!string.IsNullOrEmpty(memoryText))
            {
                var header = locale == "ja"
                    ? "以下はこのプロジェクトに関する蓄積された記憶です。回答に活用してください:"
                    : "The following is accumulated memory about this project. Use it in your responses:";

                sb.AppendLine();
                sb.AppendLine();
                sb.AppendLine("---");
                sb.AppendLine(header);
                sb.AppendLine();
                sb.Append(memoryText);
            }
        }

        return sb.ToString();
    }

    /// <summary>
    /// JSON 文字列からメモリエントリのリストをパースする
    /// </summary>
    private static List<MemoryEntry> ParseMemoryEntries(string json)
    {
        var entries = new List<MemoryEntry>();

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind != JsonValueKind.Array)
            return entries;

        foreach (var element in root.EnumerateArray())
        {
            var entry = ParseSingleEntry(element);
            if (entry != null)
                entries.Add(entry);
        }

        return entries;
    }

    /// <summary>
    /// 単一の JSON オブジェクトからメモリエントリをパースする
    /// </summary>
    private static MemoryEntry? ParseSingleEntry(JsonElement element)
    {
        if (!element.TryGetProperty("type", out var typeProp))
            return null;

        var type = typeProp.GetString();
        var now = DateTime.UtcNow.ToString("o");

        return type switch
        {
            "person" => new PersonMemoryEntry
            {
                Name = element.GetStringOrDefault("name"),
                Title = element.GetStringOrNull("title"),
                Department = element.GetStringOrNull("department"),
                Aliases = element.GetStringListOrEmpty("aliases"),
                RelatedProjects = element.GetStringListOrEmpty("relatedProjects"),
                Notes = element.GetStringOrNull("notes"),
                LastReferencedAt = now,
                ReferenceCount = 1,
            },
            "glossary" => new GlossaryMemoryEntry
            {
                Term = element.GetStringOrDefault("term"),
                Expansion = element.GetStringOrDefault("expansion"),
                Description = element.GetStringOrNull("description"),
                Category = element.GetStringOrDefault("category", "internal"),
                LastReferencedAt = now,
                ReferenceCount = 1,
            },
            "project" => new ProjectMemoryEntry
            {
                Name = element.GetStringOrDefault("name"),
                Status = element.GetStringOrDefault("status", "active"),
                Description = element.GetStringOrNull("description"),
                Aliases = element.GetStringListOrEmpty("aliases"),
                RelatedPeople = element.GetStringListOrEmpty("relatedPeople"),
                Milestones = element.GetStringListOrNull("milestones"),
                LastReferencedAt = now,
                ReferenceCount = 1,
            },
            "preference" => new PreferenceMemoryEntry
            {
                Key = element.GetStringOrDefault("key"),
                Value = element.GetStringOrDefault("value"),
                Description = element.GetStringOrNull("description"),
                LastReferencedAt = now,
                ReferenceCount = 1,
            },
            _ => null,
        };
    }
}

/// <summary>
/// メモリ抽出結果
/// </summary>
public class MemoryExtractionResult
{
    /// <summary>表示用テキスト（&lt;ai_memory&gt; タグ除去済み）</summary>
    public string CleanText { get; init; } = "";

    /// <summary>抽出されたメモリエントリ</summary>
    public List<MemoryEntry> ExtractedEntries { get; init; } = new();
}

/// <summary>
/// JsonElement の拡張メソッド（メモリパース用）
/// </summary>
internal static class JsonElementExtensions
{
    public static string GetStringOrDefault(this JsonElement element, string propertyName, string defaultValue = "")
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString() ?? defaultValue
            : defaultValue;
    }

    public static string? GetStringOrNull(this JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;
    }

    public static List<string> GetStringListOrEmpty(this JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var prop) || prop.ValueKind != JsonValueKind.Array)
            return new List<string>();

        var list = new List<string>();
        foreach (var item in prop.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
                list.Add(item.GetString() ?? "");
        }
        return list;
    }

    public static List<string>? GetStringListOrNull(this JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var prop) || prop.ValueKind != JsonValueKind.Array)
            return null;

        var list = new List<string>();
        foreach (var item in prop.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
                list.Add(item.GetString() ?? "");
        }
        return list;
    }
}
