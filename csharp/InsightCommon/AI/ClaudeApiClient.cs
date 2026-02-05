using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace InsightCommon.AI;

/// <summary>
/// Claude API クライアント — 全InsightOffice系アプリで共通利用
/// シンプルなメッセージ送信とTool Use対応の2つのAPIを提供
/// </summary>
public class ClaudeApiClient : IDisposable
{
    private static readonly HttpClient SharedHttpClient = new()
    {
        Timeout = TimeSpan.FromMinutes(3)
    };

    private string? _apiKey;
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";
    private const string ApiVersion = "2023-06-01";

    public string CurrentModel { get; set; } = ClaudeModels.DefaultModel;
    public bool IsConfigured => !string.IsNullOrEmpty(_apiKey);

    static ClaudeApiClient()
    {
        SharedHttpClient.DefaultRequestHeaders.Add("anthropic-version", ApiVersion);
    }

    public ClaudeApiClient()
    {
        _apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
    }

    public void SetApiKey(string apiKey)
    {
        _apiKey = apiKey;
    }

    /// <summary>
    /// ペルソナIDでモデルを切り替え
    /// </summary>
    public void SetPersona(string personaId)
    {
        var persona = AiPersona.FindById(personaId);
        if (persona != null)
            CurrentModel = persona.ModelId;
    }

    /// <summary>
    /// モデルインデックスでモデルを切り替え (0=Haiku, 1=Sonnet, 2=Opus)
    /// </summary>
    public void SetModelByIndex(int index)
    {
        var modelId = ClaudeModels.GetModelId(index);
        if (modelId != null)
            CurrentModel = modelId;
    }

    /// <summary>
    /// シンプルなメッセージ送信（単一ユーザーメッセージ → テキスト応答）
    /// </summary>
    public async Task<string> SendMessageAsync(
        string userMessage,
        string? systemContext = null,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var request = new
        {
            model = CurrentModel,
            max_tokens = 4096,
            system = systemContext ?? "",
            messages = new[]
            {
                new { role = "user", content = userMessage }
            }
        };

        var responseBody = await SendRequestAsync(request, cancellationToken);
        return ExtractTextFromResponse(responseBody);
    }

    /// <summary>
    /// チャット履歴付きメッセージ送信
    /// </summary>
    public async Task<string> SendChatAsync(
        List<AiMessage> chatHistory,
        string userMessage,
        string? systemContext = null,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var messages = new List<object>();
        foreach (var msg in chatHistory)
        {
            if (msg.Role == AiMessageRole.System) continue;
            messages.Add(new
            {
                role = msg.Role == AiMessageRole.User ? "user" : "assistant",
                content = msg.Content
            });
        }
        messages.Add(new { role = "user", content = userMessage });

        var request = new
        {
            model = CurrentModel,
            max_tokens = 4096,
            system = systemContext ?? "",
            messages
        };

        var responseBody = await SendRequestAsync(request, cancellationToken);
        return ExtractTextFromResponse(responseBody);
    }

    /// <summary>
    /// Tool Use 対応メッセージ送信（構造化レスポンス）
    /// </summary>
    public async Task<ClaudeToolResponse> SendMessageWithToolsAsync(
        List<object> messages,
        List<ToolDefinition> tools,
        string? systemContext = null,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var requestObj = new Dictionary<string, object>
        {
            ["model"] = CurrentModel,
            ["max_tokens"] = 4096,
            ["messages"] = messages,
            ["tools"] = tools.Select(t => new Dictionary<string, object>
            {
                ["name"] = t.Name,
                ["description"] = t.Description,
                ["input_schema"] = t.InputSchema
            }).ToList()
        };

        if (!string.IsNullOrEmpty(systemContext))
            requestObj["system"] = systemContext;

        var responseBody = await SendRequestAsync(requestObj, cancellationToken, JsonOptions.IgnoreNull);
        return ParseToolResponse(responseBody);
    }

    /// <summary>
    /// API使用コストを計算 (USD)
    /// </summary>
    public static decimal CalculateCost(int inputTokens, int outputTokens, string modelId)
    {
        var index = ClaudeModels.GetModelIndex(modelId);
        var model = ClaudeModels.Available[index];
        return (inputTokens * model.InputCostPer1M + outputTokens * model.OutputCostPer1M) / 1_000_000m;
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new InvalidOperationException("APIキーが設定されていません。設定画面からClaude APIキーを入力してください。");
    }

    private async Task<string> SendRequestAsync(
        object request,
        CancellationToken cancellationToken,
        JsonSerializerOptions? jsonOptions = null)
    {
        var json = JsonSerializer.Serialize(request, jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ApiUrl);
        httpRequest.Content = content;
        httpRequest.Headers.Add("x-api-key", _apiKey);

        HttpResponseMessage response;
        try
        {
            response = await SharedHttpClient.SendAsync(httpRequest, cancellationToken);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new HttpRequestException("Claude API へのリクエストがタイムアウトしました。ネットワーク接続を確認してください。");
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorMsg = $"Claude API エラー ({response.StatusCode})";
            try
            {
                using var doc = JsonDocument.Parse(responseBody);
                if (doc.RootElement.TryGetProperty("error", out var errorObj) &&
                    errorObj.TryGetProperty("message", out var msgProp))
                {
                    errorMsg = $"Claude API エラー: {msgProp.GetString()}";
                }
            }
            catch { }
            throw new HttpRequestException(errorMsg);
        }

        return responseBody;
    }

    private static string ExtractTextFromResponse(string responseBody)
    {
        try
        {
            using var responseDoc = JsonDocument.Parse(responseBody);
            if (!responseDoc.RootElement.TryGetProperty("content", out var contentArray))
                return "(応答の解析に失敗しました)";

            var sb = new StringBuilder();
            foreach (var block in contentArray.EnumerateArray())
            {
                if (block.TryGetProperty("type", out var typeProp) &&
                    typeProp.GetString() == "text" &&
                    block.TryGetProperty("text", out var textProp))
                {
                    if (sb.Length > 0) sb.AppendLine();
                    sb.Append(textProp.GetString());
                }
            }
            return sb.Length > 0 ? sb.ToString() : "(空の応答)";
        }
        catch (JsonException)
        {
            return "(応答の解析に失敗しました)";
        }
    }

    private static ClaudeToolResponse ParseToolResponse(string responseBody)
    {
        using var responseDoc = JsonDocument.Parse(responseBody);
        var root = responseDoc.RootElement;

        var stopReason = root.TryGetProperty("stop_reason", out var srProp)
            ? srProp.GetString() ?? "" : "";

        var result = new ClaudeToolResponse { StopReason = stopReason };

        if (root.TryGetProperty("usage", out var usageProp))
        {
            if (usageProp.TryGetProperty("input_tokens", out var inTok))
                result.InputTokens = inTok.GetInt32();
            if (usageProp.TryGetProperty("output_tokens", out var outTok))
                result.OutputTokens = outTok.GetInt32();
        }

        if (root.TryGetProperty("content", out var contentArray))
        {
            foreach (var block in contentArray.EnumerateArray())
            {
                if (!block.TryGetProperty("type", out var typeProp))
                    continue;
                var type = typeProp.GetString() ?? "";
                var cb = new ContentBlock { Type = type };

                if (type == "text" && block.TryGetProperty("text", out var textVal))
                {
                    cb.Text = textVal.GetString();
                }
                else if (type == "tool_use")
                {
                    if (!block.TryGetProperty("id", out var idProp) ||
                        !block.TryGetProperty("name", out var nameProp) ||
                        !block.TryGetProperty("input", out var inputProp))
                        continue;

                    cb.Id = idProp.GetString();
                    cb.Name = nameProp.GetString();
                    cb.Input = inputProp.Clone();
                }

                result.Content.Add(cb);
            }
        }

        return result;
    }

    public void Dispose()
    {
        // HttpClient is static singleton — do not dispose
        GC.SuppressFinalize(this);
    }
}
