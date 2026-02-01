using System.IO;
using System.Text.Json;

namespace HarmonicTools.AppManager.Models;

/// <summary>
/// アプリ管理設定の永続化
/// </summary>
public class AppConfig
{
    public List<AppDefinition> Apps { get; set; } = new();
    public string? LastSelectedApp { get; set; }

    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "HarmonicInsight", "AppManager");

    private static readonly string ConfigFile = Path.Combine(ConfigDir, "config.json");

    public static AppConfig Load()
    {
        try
        {
            if (File.Exists(ConfigFile))
            {
                var json = File.ReadAllText(ConfigFile);
                return JsonSerializer.Deserialize<AppConfig>(json) ?? CreateDefault();
            }
        }
        catch { }
        return CreateDefault();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(ConfigFile, json);
        }
        catch { }
    }

    /// <summary>
    /// デフォルトの開発ルートディレクトリ（C:\dev）
    /// 各アプリの BasePath = DevRoot + リポジトリフォルダ名
    /// </summary>
    private const string DefaultDevRoot = @"C:\dev";

    /// <summary>
    /// 統合リリースリポジトリ（全製品共通）
    /// タグ形式: {ProductCode}-v{Version} (例: INBT-v1.0.0)
    /// </summary>
    public const string ReleaseRepo = "HarmonicInsight/releases";

    public static AppConfig CreateDefault()
    {
        return new AppConfig
        {
            Apps = new List<AppDefinition>
            {
                // ── Automation & Delivery ──
                new()
                {
                    Name = "InsightBot",
                    ProductCode = "INBT",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-bot-C"),
                    SolutionPath = "InsightBot.sln",
                    ProjectPath = "InsightBot/InsightBot.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightBot/bin/{config}/net8.0-windows/InsightBot.exe",
                    Description = "AIを活用した業務最適化RPA製品"
                },
                new()
                {
                    Name = "InsightNoCodeAnalyzer",
                    ProductCode = "INCA",
                    BasePath = Path.Combine(DefaultDevRoot, "app-nocode-analyzer-C"),
                    SolutionPath = "InsightNoCodeAnalyzer.sln",
                    ProjectPath = "InsightNoCodeAnalyzer/InsightNoCodeAnalyzer.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightNoCodeAnalyzer/bin/{config}/net8.0-windows/InsightNoCodeAnalyzer.exe",
                    Description = "RPA・ローコードのマイグレーション自動化ツール"
                },
                new()
                {
                    Name = "InsightPy",
                    ProductCode = "INPY",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-py"),
                    SolutionPath = "InsightPy.sln",
                    ProjectPath = "InsightPy/InsightPy.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightPy/bin/{config}/net8.0-windows/InsightPy.exe",
                    Description = "業務調査・データ収集のためのPython実行基盤"
                },

                // ── Consulting & Requirements ──
                new()
                {
                    Name = "InsightOfficeSheet",
                    ProductCode = "IOSH",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-office-sheet"),
                    SolutionPath = "InsightOfficeSheet.sln",
                    ProjectPath = "InsightOfficeSheet/InsightOfficeSheet.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightOfficeSheet/bin/{config}/net8.0-windows/InsightOfficeSheet.exe",
                    Description = "提案金額シミュレーション・経営戦略策定Excel基盤"
                },
                new()
                {
                    Name = "InsightSlide",
                    ProductCode = "INSS",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-slide"),
                    SolutionPath = "InsightSlide.sln",
                    ProjectPath = "InsightSlide/InsightSlide.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightSlide/bin/{config}/net8.0-windows/InsightSlide.exe",
                    Description = "クライアント資料からのAI業務分析"
                },
                new()
                {
                    Name = "InterviewInsight",
                    ProductCode = "INIV",
                    BasePath = Path.Combine(DefaultDevRoot, "app-interview-insight"),
                    SolutionPath = "InterviewInsight.sln",
                    ProjectPath = "InterviewInsight/InterviewInsight.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InterviewInsight/bin/{config}/net8.0-windows/InterviewInsight.exe",
                    Description = "AIステークホルダーヒアリング・業務調査支援"
                },

                // ── Content Creation ──
                new()
                {
                    Name = "InsightMovie",
                    ProductCode = "INMV",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-movie"),
                    SolutionPath = "InsightMovie.sln",
                    ProjectPath = "InsightMovie/InsightMovie.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightMovie/bin/{config}/net8.0-windows/InsightMovie.exe",
                    Description = "要件定義の質向上・ユーザー教育のためのAI動画"
                },
                new()
                {
                    Name = "InsightImageGen",
                    ProductCode = "INIG",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-imagegen"),
                    SolutionPath = "InsightImageGen.sln",
                    ProjectPath = "InsightImageGen/InsightImageGen.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightImageGen/bin/{config}/net8.0-windows/InsightImageGen.exe",
                    Description = "納品物向けAIビジュアル・音声生成"
                },
            }
        };
    }
}
