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

    public static AppConfig CreateDefault()
    {
        return new AppConfig
        {
            Apps = new List<AppDefinition>
            {
                // ── Harmonic シリーズ（app-Insight-excel リポジトリ）──
                new()
                {
                    Name = "HarmonicSheet",
                    ProductCode = "HMSH",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-excel"),
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSheet.App/HarmonicSheet.App.csproj",
                    TestProjectPath = "tests/HarmonicSheet.Core.Tests",
                    ExeRelativePath = "src/HarmonicSheet.App/bin/{config}/net8.0-windows/HarmonicSheet.App.exe",
                    Description = "Excel 操作ツール（セル編集・数式・マクロ対応）"
                },
                new()
                {
                    Name = "HarmonicDoc",
                    ProductCode = "HMDC",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-excel"),
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicDoc.App/HarmonicDoc.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicDoc.App/bin/{config}/net8.0-windows/HarmonicDoc.App.exe",
                    Description = "Word 操作ツール（文書解析・テンプレート処理）"
                },
                new()
                {
                    Name = "HarmonicSlide",
                    ProductCode = "HMSL",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-excel"),
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSlide.App/HarmonicSlide.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicSlide.App/bin/{config}/net8.0-windows/HarmonicSlide.App.exe",
                    Description = "PowerPoint 操作ツール（スライド編集・変換）"
                },

                // ── Insight シリーズ ──
                new()
                {
                    Name = "InsightNoCodeAnalyzer",
                    ProductCode = "INCA",
                    BasePath = Path.Combine(DefaultDevRoot, "app-nocode-analyzer-C"),
                    SolutionPath = "InsightNoCodeAnalyzer.sln",
                    ProjectPath = "src/InsightNoCodeAnalyzer.App/InsightNoCodeAnalyzer.App.csproj",
                    TestProjectPath = "tests/InsightNoCodeAnalyzer.Core.Tests",
                    ExeRelativePath = "src/InsightNoCodeAnalyzer.App/bin/{config}/net8.0-windows/InsightNoCodeAnalyzer.App.exe",
                    Description = "RPA・ローコード解析・移行アセスメントツール"
                },
                new()
                {
                    Name = "InsightForguncy",
                    ProductCode = "FGIN",
                    BasePath = Path.Combine(DefaultDevRoot, "app-win-insight-forguncy"),
                    SolutionPath = "InsightForguncy.sln",
                    ProjectPath = "src/InsightForguncy.App/InsightForguncy.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightForguncy.App/bin/{config}/net8.0-windows/InsightForguncy.App.exe",
                    Description = "Forguncy 連携・AI 開発支援ツール"
                },
                new()
                {
                    Name = "InsightMovie",
                    ProductCode = "INMV",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-movie"),
                    SolutionPath = "InsightMovie.sln",
                    ProjectPath = "src/InsightMovie.App/InsightMovie.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightMovie.App/bin/{config}/net8.0-windows/InsightMovie.App.exe",
                    Description = "画像・テキスト・PPT から AI 動画作成"
                },
                new()
                {
                    Name = "InsightImageGen",
                    ProductCode = "INIG",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-imagegen"),
                    SolutionPath = "InsightImageGen.sln",
                    ProjectPath = "src/InsightImageGen.App/InsightImageGen.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightImageGen.App/bin/{config}/net8.0-windows/InsightImageGen.App.exe",
                    Description = "Stable Diffusion・VOICEVOX AI 画像・音声生成ツール"
                },
            }
        };
    }
}
