using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace InsightCommon.AI;

/// <summary>Tool definition sent in the Anthropic API request.</summary>
public class ToolDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public JsonObject InputSchema { get; set; } = new();
}

/// <summary>A single content block in a Claude response (text or tool_use).</summary>
public class ContentBlock
{
    public string Type { get; set; } = "";
    public string? Text { get; set; }
    public string? Id { get; set; }
    public string? Name { get; set; }
    public JsonElement? Input { get; set; }
}

/// <summary>Parsed API response with tool use support.</summary>
public class ClaudeToolResponse
{
    public List<ContentBlock> Content { get; set; } = new();
    public string StopReason { get; set; } = "";
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
}

/// <summary>A tool_result message block sent back to Claude.</summary>
public class ToolResultBlock
{
    public string ToolUseId { get; set; } = "";
    public string Content { get; set; } = "";
    public bool? IsError { get; set; }
}
