using System.Text.Json.Serialization;

namespace InsightIPOAnalyzer.Models;

/// <summary>
/// IPO分析プロジェクトのルートコンテナ。
/// JSON形式でエクスポート・インポートされる単位。
/// </summary>
public class IpoProject
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";

    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("author")]
    public string Author { get; set; } = "";

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("nodes")]
    public List<IpoNode> Nodes { get; set; } = new();

    [JsonPropertyName("connections")]
    public List<IpoConnection> Connections { get; set; } = new();
}

/// <summary>
/// 単一のIPO分析ユニット。
/// Input（入力）・Process（処理ステップ）・Output（出力）を持つ。
/// parentStepId が null の場合はルートレベルのノード。
/// parentStepId が設定されている場合は、そのステップのサブ分析ノード。
/// </summary>
public class IpoNode
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("parentStepId")]
    public string? ParentStepId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("inputs")]
    public List<IpoItem> Inputs { get; set; } = new();

    [JsonPropertyName("processSteps")]
    public List<IpoProcessStep> ProcessSteps { get; set; } = new();

    [JsonPropertyName("outputs")]
    public List<IpoItem> Outputs { get; set; } = new();
}

/// <summary>
/// 入力または出力のアイテム。
/// DataType はデータソースの種類（Email, Excel, SAP, Database など）。
/// </summary>
public class IpoItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("dataType")]
    public string DataType { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
}

/// <summary>
/// プロセス内の処理ステップ。
/// ChildNodeId が設定されている場合、そのステップはサブIPO分析を持つ。
/// ダブルクリックでサブ分析にドリルダウンできる。
/// </summary>
public class IpoProcessStep
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("childNodeId")]
    public string? ChildNodeId { get; set; }
}

/// <summary>
/// ノード間の接続。
/// あるノードの出力から別のノードの入力への接続を表現。
/// </summary>
public class IpoConnection
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("fromNodeId")]
    public string FromNodeId { get; set; } = "";

    [JsonPropertyName("fromOutputId")]
    public string FromOutputId { get; set; } = "";

    [JsonPropertyName("toNodeId")]
    public string ToNodeId { get; set; } = "";

    [JsonPropertyName("toInputId")]
    public string ToInputId { get; set; } = "";
}

/// <summary>
/// よく使われるデータタイプの定数。
/// </summary>
public static class DataTypes
{
    public const string Email = "Email";
    public const string Excel = "Excel";
    public const string Word = "Word";
    public const string PowerPoint = "PowerPoint";
    public const string Pdf = "PDF";
    public const string Sap = "SAP";
    public const string Database = "Database";
    public const string Api = "API";
    public const string File = "File";
    public const string Manual = "Manual";
    public const string WebApp = "WebApp";
    public const string Csv = "CSV";
    public const string Other = "Other";

    public static readonly string[] All = {
        Email, Excel, Word, PowerPoint, Pdf, Sap,
        Database, Api, File, Manual, WebApp, Csv, Other
    };
}
