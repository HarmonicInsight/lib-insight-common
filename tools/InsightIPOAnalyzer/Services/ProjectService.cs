using System.IO;
using System.Text.Json;
using InsightIPOAnalyzer.Models;

namespace InsightIPOAnalyzer.Services;

/// <summary>
/// IPOプロジェクトのJSON形式でのインポート・エクスポートを管理。
/// AI連携を想定し、可読性の高いJSON形式を使用。
/// </summary>
public static class ProjectService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// プロジェクトをJSONファイルにエクスポート。
    /// </summary>
    public static async Task ExportAsync(IpoProject project, string filePath)
    {
        project.UpdatedAt = DateTime.UtcNow;
        var json = JsonSerializer.Serialize(project, JsonOptions);
        await File.WriteAllTextAsync(filePath, json);
    }

    /// <summary>
    /// JSONファイルからプロジェクトをインポート。
    /// </summary>
    public static async Task<IpoProject> ImportAsync(string filePath)
    {
        var json = await File.ReadAllTextAsync(filePath);
        var project = JsonSerializer.Deserialize<IpoProject>(json, JsonOptions);
        return project ?? throw new InvalidOperationException("Invalid project file.");
    }

    /// <summary>
    /// プロジェクトをJSON文字列にシリアライズ。
    /// </summary>
    public static string ToJson(IpoProject project)
    {
        project.UpdatedAt = DateTime.UtcNow;
        return JsonSerializer.Serialize(project, JsonOptions);
    }

    /// <summary>
    /// JSON文字列からプロジェクトをデシリアライズ。
    /// </summary>
    public static IpoProject FromJson(string json)
    {
        var project = JsonSerializer.Deserialize<IpoProject>(json, JsonOptions);
        return project ?? throw new InvalidOperationException("Invalid JSON.");
    }

    /// <summary>
    /// サンプルプロジェクトを生成（デモ用）。
    /// RPA的な業務フローの例。
    /// </summary>
    public static IpoProject CreateSampleProject()
    {
        var project = new IpoProject
        {
            Name = "経費精算プロセス分析",
            Description = "経費精算業務のIPO分析。メール受信からSAP転記までのフローを可視化。",
            Author = "IPO Analyzer",
        };

        // ステップ2の子ノードID
        var subNodeId = Guid.NewGuid().ToString();

        // メインノード
        var mainNode = new IpoNode
        {
            Name = "経費精算メインフロー",
            Description = "経費申請メールの受信からSAPへの転記までの全体フロー",
            X = 80,
            Y = 80,
            Inputs = new List<IpoItem>
            {
                new() { Name = "経費申請メール", DataType = DataTypes.Email, Description = "社員からの経費申請メール" },
                new() { Name = "経費マスタ", DataType = DataTypes.Excel, Description = "経費科目マスタ（Excel）" }
            },
            ProcessSteps = new List<IpoProcessStep>
            {
                new() { Name = "メール取得", Order = 1, Description = "Outlookから経費申請メールを取得し、添付ファイルを保存" },
                new() { Name = "Excel転記・チェック", Order = 2, Description = "申請内容をExcelに転記し、金額・科目をチェック", ChildNodeId = subNodeId },
                new() { Name = "SAP入力", Order = 3, Description = "承認済みデータをSAPの経費伝票として登録" },
                new() { Name = "完了通知送信", Order = 4, Description = "申請者に処理完了メールを送信" }
            },
            Outputs = new List<IpoItem>
            {
                new() { Name = "SAP経費伝票", DataType = DataTypes.Sap, Description = "SAP上に登録された経費伝票" },
                new() { Name = "処理完了メール", DataType = DataTypes.Email, Description = "申請者への完了通知" }
            }
        };

        // サブ分析ノード（Excel転記・チェックの詳細）
        var subNode = new IpoNode
        {
            Id = subNodeId,
            ParentStepId = mainNode.ProcessSteps[1].Id,
            Name = "Excel転記・チェック詳細",
            Description = "経費データのExcel転記と妥当性チェックの詳細フロー",
            X = 80,
            Y = 80,
            Inputs = new List<IpoItem>
            {
                new() { Name = "申請メール本文", DataType = DataTypes.Email, Description = "パースされたメール本文" },
                new() { Name = "添付ファイル", DataType = DataTypes.File, Description = "領収書画像・PDF" }
            },
            ProcessSteps = new List<IpoProcessStep>
            {
                new() { Name = "データ抽出", Order = 1, Description = "メール本文から日付・金額・科目を抽出" },
                new() { Name = "マスタ照合", Order = 2, Description = "経費科目マスタと照合し、科目コードを付与" },
                new() { Name = "金額チェック", Order = 3, Description = "上限金額チェック、重複チェック" },
                new() { Name = "Excel書き込み", Order = 4, Description = "チェック済みデータをExcelシートに書き込み" }
            },
            Outputs = new List<IpoItem>
            {
                new() { Name = "チェック済み経費データ", DataType = DataTypes.Excel, Description = "妥当性チェック済みの経費データ" },
                new() { Name = "エラーレポート", DataType = DataTypes.Excel, Description = "チェックエラーの一覧" }
            }
        };

        project.Nodes.Add(mainNode);
        project.Nodes.Add(subNode);

        return project;
    }
}
