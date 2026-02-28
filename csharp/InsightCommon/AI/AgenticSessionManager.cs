using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using InsightCommon.ProjectFile;

namespace InsightCommon.AI;

/// <summary>
/// Agentic セッション管理 — Tool Use ループ・会話履歴・使用量トラッキングを統合
/// 全 Insight Business Suite アプリ（INSS/IOSH/IOSD/INPY/INBT）で共通利用
/// </summary>
public class AgenticSessionManager
{
    private readonly ClaudeApiClient _client;
    private readonly SessionOptions _options;
    private readonly List<AiMessage> _history = new();

    private string? _systemPrompt;

    /// <summary>会話履歴（UI 表示用・永続化用）</summary>
    public IReadOnlyList<AiMessage> History => _history;

    /// <summary>累積使用量</summary>
    public AiUsageStats Usage { get; } = new();

    public AgenticSessionManager(ClaudeApiClient client, SessionOptions options)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _options = options ?? throw new ArgumentNullException(nameof(options));

        // メモリ統合: system prompt にメモリ抽出指示 + ホットキャッシュを注入
        _systemPrompt = MemoryExtractor.BuildSystemPrompt(
            options.SystemPrompt ?? "",
            options.MemoryHotCache,
            options.Locale);
    }

    /// <summary>
    /// ユーザーメッセージを送信し、Tool Use ループを含む AI 応答を取得する
    /// </summary>
    public async Task<AgenticResponse> SendAsync(string userMessage, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userMessage))
            throw new ArgumentException("メッセージが空です。", nameof(userMessage));

        // ユーザーメッセージを履歴に追加
        AddToHistory(new AiMessage
        {
            Role = AiMessageRole.User,
            Content = userMessage,
        });

        // API 送信用メッセージを構築（最大 MaxHistoryMessages）
        var apiMessages = BuildApiMessages();

        var totalInputTokens = 0;
        var totalOutputTokens = 0;
        var iterations = 0;
        var wasTruncated = false;

        while (true)
        {
            ct.ThrowIfCancellationRequested();

            ClaudeToolResponse response;

            if (_options.Tools is { Count: > 0 })
            {
                response = await _client.SendMessageWithToolsAsync(
                    apiMessages, _options.Tools, _systemPrompt, ct);
            }
            else
            {
                // ツール未定義の場合はツールなしで送信
                response = await _client.SendMessageWithToolsAsync(
                    apiMessages, new List<ToolDefinition>(), _systemPrompt, ct);
            }

            totalInputTokens += response.InputTokens;
            totalOutputTokens += response.OutputTokens;
            iterations++;

            if (response.StopReason == "tool_use" &&
                _options.ToolExecutor != null &&
                iterations < _options.MaxIterations)
            {
                // Tool Use ループ: ツール呼び出しを処理
                var assistantContent = SerializeContentBlocks(response.Content);
                apiMessages.Add(new Dictionary<string, object>
                {
                    ["role"] = "assistant",
                    ["content"] = assistantContent,
                });

                var toolResults = new List<object>();

                foreach (var block in response.Content.Where(b => b.Type == "tool_use"))
                {
                    if (block.Name == null || block.Id == null)
                        continue;

                    _options.Callback?.OnToolExecuting(block.Name);

                    var result = await _options.ToolExecutor.ExecuteAsync(
                        block.Name, block.Input ?? default, ct);

                    _options.Callback?.OnToolExecuted(block.Name, result.IsError);

                    var toolResult = new Dictionary<string, object>
                    {
                        ["type"] = "tool_result",
                        ["tool_use_id"] = block.Id,
                        ["content"] = result.Content,
                    };
                    if (result.IsError)
                        toolResult["is_error"] = true;

                    toolResults.Add(toolResult);
                }

                apiMessages.Add(new Dictionary<string, object>
                {
                    ["role"] = "user",
                    ["content"] = toolResults,
                });

                _options.Callback?.OnIterationCompleted(iterations, _options.MaxIterations);
                continue;
            }

            // ループ上限到達で打ち切り
            if (response.StopReason == "tool_use" && iterations >= _options.MaxIterations)
                wasTruncated = true;

            // テキスト応答を抽出
            var rawText = ExtractText(response.Content);

            // メモリ抽出: <ai_memory> タグをパースしてクリーンテキストとエントリに分離
            var memoryResult = MemoryExtractor.Extract(rawText);
            var responseText = memoryResult.CleanText;
            var extractedMemories = memoryResult.ExtractedEntries;

            // メモリエントリが抽出された場合、コールバックで UI に通知
            if (extractedMemories.Count > 0)
                _options.Callback?.OnMemoryExtracted(extractedMemories);

            // アシスタント応答を履歴に追加（クリーンテキストのみ）
            AddToHistory(new AiMessage
            {
                Role = AiMessageRole.Assistant,
                Content = responseText,
            });

            // 使用量を累積
            Usage.TotalCalls++;
            Usage.TotalInputTokens += totalInputTokens;
            Usage.TotalOutputTokens += totalOutputTokens;
            Usage.EstimatedCostUsd += ClaudeApiClient.CalculateCost(
                totalInputTokens, totalOutputTokens, _client.CurrentModel);

            return new AgenticResponse
            {
                Text = responseText,
                ExtractedMemories = extractedMemories,
                Iterations = iterations,
                WasTruncated = wasTruncated,
                InputTokens = totalInputTokens,
                OutputTokens = totalOutputTokens,
            };
        }
    }

    /// <summary>会話履歴をクリアする</summary>
    public void ClearHistory()
    {
        _history.Clear();
    }

    /// <summary>システムプロンプトを動的に更新する（ファイルコンテキスト変更時など）</summary>
    public void UpdateSystemPrompt(string systemPrompt)
    {
        _systemPrompt = systemPrompt;
    }

    /// <summary>セッションを ProjectFile 形式でエクスポートする</summary>
    public ChatSession ExportSession()
    {
        var session = new ChatSession
        {
            ModelId = _client.CurrentModel,
            Messages = _history
                .Where(m => m.Role != AiMessageRole.System)
                .Select(m => new ChatMessage
                {
                    Id = m.Id,
                    Role = m.Role == AiMessageRole.User ? "user" : "assistant",
                    Content = m.Content,
                    Timestamp = m.CreatedAt.ToUniversalTime().ToString("o"),
                })
                .ToList(),
        };
        return session;
    }

    /// <summary>既存セッションをインポートして復元する</summary>
    public void ImportSession(ChatSession session)
    {
        _history.Clear();

        if (!string.IsNullOrEmpty(session.ModelId))
            _client.CurrentModel = session.ModelId;

        foreach (var msg in session.Messages)
        {
            _history.Add(new AiMessage
            {
                Id = msg.Id,
                Role = msg.Role == "user" ? AiMessageRole.User : AiMessageRole.Assistant,
                Content = msg.Content,
                CreatedAt = DateTime.TryParse(msg.Timestamp, out var dt) ? dt.ToLocalTime() : DateTime.Now,
            });
        }

        EnforceStorageLimit();
    }

    /// <summary>
    /// API 送信用メッセージ配列を構築する（最大 MaxHistoryMessages、system prompt は含めない）
    /// </summary>
    private List<object> BuildApiMessages()
    {
        var relevant = _history
            .Where(m => m.Role != AiMessageRole.System)
            .ToList();

        // API 送信用は最大 MaxHistoryMessages に制限（FIFO eviction）
        if (relevant.Count > _options.MaxHistoryMessages)
            relevant = relevant.Skip(relevant.Count - _options.MaxHistoryMessages).ToList();

        var messages = new List<object>();
        foreach (var msg in relevant)
        {
            messages.Add(new Dictionary<string, object>
            {
                ["role"] = msg.Role == AiMessageRole.User ? "user" : "assistant",
                ["content"] = msg.Content,
            });
        }

        return messages;
    }

    /// <summary>ContentBlock リストを API 送信用の配列にシリアライズする</summary>
    private static List<object> SerializeContentBlocks(List<ContentBlock> blocks)
    {
        var result = new List<object>();
        foreach (var block in blocks)
        {
            if (block.Type == "text")
            {
                result.Add(new Dictionary<string, object>
                {
                    ["type"] = "text",
                    ["text"] = block.Text ?? "",
                });
            }
            else if (block.Type == "tool_use")
            {
                var entry = new Dictionary<string, object>
                {
                    ["type"] = "tool_use",
                    ["id"] = block.Id ?? "",
                    ["name"] = block.Name ?? "",
                    ["input"] = block.Input ?? default(JsonElement),
                };
                result.Add(entry);
            }
        }
        return result;
    }

    /// <summary>ContentBlock リストからテキストを抽出する</summary>
    private static string ExtractText(List<ContentBlock> blocks)
    {
        var sb = new StringBuilder();
        foreach (var block in blocks.Where(b => b.Type == "text" && b.Text != null))
        {
            if (sb.Length > 0) sb.AppendLine();
            sb.Append(block.Text);
        }
        return sb.Length > 0 ? sb.ToString() : "";
    }

    /// <summary>履歴にメッセージを追加し、ストレージ上限を適用する</summary>
    private void AddToHistory(AiMessage message)
    {
        _history.Add(message);
        EnforceStorageLimit();
    }

    /// <summary>ローカル保存用の上限（MaxStorageMessages）を超えた場合、古いメッセージを削除</summary>
    private void EnforceStorageLimit()
    {
        while (_history.Count > _options.MaxStorageMessages)
            _history.RemoveAt(0);
    }
}

/// <summary>
/// セッション構成オプション
/// </summary>
public class SessionOptions
{
    /// <summary>システムプロンプト（ファイルコンテキスト込み）</summary>
    public string? SystemPrompt { get; init; }

    /// <summary>ツール定義（Tool Use 対応製品のみ）</summary>
    public List<ToolDefinition>? Tools { get; init; }

    /// <summary>ツール実行ハンドラ（Tool Use 対応製品のみ）</summary>
    public IToolExecutor? ToolExecutor { get; init; }

    /// <summary>UI 通知コールバック（任意）</summary>
    public ISessionCallback? Callback { get; init; }

    /// <summary>Tool Use ループ最大イテレーション数（AI_ASSISTANT.md §4.3 準拠）</summary>
    public int MaxIterations { get; init; } = 10;

    /// <summary>API 送信用の最大メッセージ数（AI_ASSISTANT.md §4.4 準拠）</summary>
    public int MaxHistoryMessages { get; init; } = 30;

    /// <summary>ローカル保存用の最大メッセージ数</summary>
    public int MaxStorageMessages { get; init; } = 100;

    /// <summary>AI メモリ ホットキャッシュ（プロジェクトファイルから読み込み済み）</summary>
    public AiMemoryHotCache? MemoryHotCache { get; init; }

    /// <summary>ロケール（メモリ抽出指示・整形の言語）</summary>
    public string Locale { get; init; } = "ja";
}

/// <summary>
/// SendAsync の戻り値 — AI 応答テキストとメタデータ
/// </summary>
public class AgenticResponse
{
    /// <summary>AI の最終テキスト応答（&lt;ai_memory&gt; タグ除去済み）</summary>
    public string Text { get; init; } = "";

    /// <summary>応答から抽出されたメモリエントリ（抽出なしの場合は空リスト）</summary>
    public IReadOnlyList<MemoryEntry> ExtractedMemories { get; init; } = Array.Empty<MemoryEntry>();

    /// <summary>API コール回数（Tool Use ループ含む）</summary>
    public int Iterations { get; init; }

    /// <summary>MaxIterations に到達してループが打ち切られた場合 true</summary>
    public bool WasTruncated { get; init; }

    /// <summary>入力トークン数（全イテレーション合計）</summary>
    public int InputTokens { get; init; }

    /// <summary>出力トークン数（全イテレーション合計）</summary>
    public int OutputTokens { get; init; }
}

/// <summary>
/// 累積 API 使用量 — UI の使用量表示に利用
/// </summary>
public class AiUsageStats
{
    /// <summary>API コール回数</summary>
    public int TotalCalls { get; set; }

    /// <summary>入力トークン累計</summary>
    public int TotalInputTokens { get; set; }

    /// <summary>出力トークン累計</summary>
    public int TotalOutputTokens { get; set; }

    /// <summary>推定コスト (USD)</summary>
    public decimal EstimatedCostUsd { get; set; }
}
